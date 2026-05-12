import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

const db = new Database("database.sqlite");

// Initialize tables with userId
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT);

  CREATE TABLE IF NOT EXISTS schools (id TEXT PRIMARY KEY, userId TEXT, name TEXT);
  CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, userId TEXT, schoolId TEXT, name TEXT);
  CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, userId TEXT, classId TEXT, name TEXT);
  CREATE TABLE IF NOT EXISTS words (id TEXT PRIMARY KEY, userId TEXT, text TEXT, difficulty INTEGER);
  CREATE TABLE IF NOT EXISTS competitions (id TEXT PRIMARY KEY, userId TEXT, data TEXT);
`);

// Simple password hashing
function hashPassword(password: string) {
  return crypto.scryptSync(password, 'salt', 64).toString('hex');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Routes ---
  app.post("/api/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    
    try {
      const id = crypto.randomUUID();
      const stmt = db.prepare("INSERT INTO users (id, username, password) VALUES (?, ?, ?)");
      stmt.run(id, username, hashPassword(password));
      res.json({ success: true });
    } catch (error: any) {
      if (error.message.includes("UNIQUE")) {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, hashPassword(password)) as any;
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const token = crypto.randomUUID();
      db.prepare("INSERT INTO sessions (token, userId) VALUES (?, ?)").run(token, user.id);
      res.json({ token, username });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Auth Middleware
  app.use("/api", (req, res, next) => {
    if (req.path === '/login' || req.path === '/register') return next();
    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const session = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token) as any;
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    (req as any).userId = session.userId;
    next();
  });

  // --- API Routes ---
  const tables = ["schools", "classes", "students", "words"];
  
  tables.forEach(table => {
    app.get(`/api/${table}`, (req, res) => {
      try {
        const rows = db.prepare(`SELECT * FROM ${table} WHERE userId = ?`).all((req as any).userId) as any[];
        // Remove userId from response
        res.json(rows.map(({userId, ...rest}) => rest));
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    app.post(`/api/${table}`, (req, res) => {
      try {
        const userId = (req as any).userId;
        const data = { ...req.body, userId };
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');
        const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
        stmt.run(...values);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    app.delete(`/api/${table}/:id`, (req, res) => {
      try {
        const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ? AND userId = ?`);
        stmt.run(req.params.id, (req as any).userId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });
  });

  // Competitions
  app.get('/api/competitions', (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM competitions WHERE userId = ?').all((req as any).userId) as {id: string, data: string}[];
      res.json(rows.map(r => JSON.parse(r.data)));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/competitions', (req, res) => {
    try {
      const { id } = req.body;
      const stmt = db.prepare('INSERT OR REPLACE INTO competitions (id, userId, data) VALUES (?, ?, ?)');
      stmt.run(id, (req as any).userId, JSON.stringify(req.body));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/api/competitions/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM competitions WHERE id = ? AND userId = ?');
      stmt.run(req.params.id, (req as any).userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
