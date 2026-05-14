import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT as string, 10) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route for Gemini bulk processing
  app.post("/api/words/bulk-process", async (req, res) => {
    try {
      const { words } = req.body;
      if (!words || !Array.isArray(words)) {
        res.status(400).json({ error: "Invalid words payload" });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      
      const { GoogleGenAI, Type } = await import("@google/genai");
      const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following list of English words for a Spelling Bee competition. 
        For each word, do a rigorous and careful analysis and provide:
        1. The word itself.
        2. A simple IPA pronunciation.
        3. The meaning in Portuguese.
        4. A practical example sentence using the word in English.
        5. Difficulty level (A1, A2, B1, B2, C1, C2) according to the CEFR framework based on spelling and vocabulary complexity.
        
        Words: ${words.join(", ")}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                pronunciation: { type: Type.STRING },
                meaning: { type: Type.STRING },
                example: { type: Type.STRING },
                difficulty: { 
                  type: Type.STRING,
                  enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
                }
              },
              required: ["text", "pronunciation", "meaning", "example", "difficulty"]
            }
          }
        }
      });
      
      const resultText = response.text || '[]';
      const result = JSON.parse(resultText);
      res.json({ results: result });
    } catch (error: any) {
      console.error("Bulk process error:", error);
      res.status(500).json({ error: "Internal processing error", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  console.log(`Starting server process in ${process.env.NODE_ENV || 'development'} mode...`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on 0.0.0.0:${PORT}`);
  }).on('error', (err: any) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('Fatal error during startServer:', err);
  process.exit(1);
});
