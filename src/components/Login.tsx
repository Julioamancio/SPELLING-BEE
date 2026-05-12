import React, { useState } from 'react';
import { Bee } from './icons/Bee';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    const url = isRegistering ? '/api/register' : '/api/login';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Autenticação falhou');
      }

      if (isRegistering) {
        setIsRegistering(false);
        setErrorDetails("Usuário criado com sucesso! Faça login agora.");
      } else {
        localStorage.setItem('auth_token', data.token);
        onLogin();
      }
    } catch (error: any) {
      console.error(error);
      setErrorDetails(error.message || String(error));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-xl text-center max-w-sm w-full border border-slate-200">
        <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-50">
          <Bee className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Spelling Bee</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10">Teacher Dashboard</p>
        
        {errorDetails && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-bold whitespace-pre-wrap text-left border ${errorDetails.includes('sucesso') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {errorDetails}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Usuário" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-4 bg-slate-50 text-slate-900 rounded-2xl font-bold border-2 border-slate-200 outline-none focus:border-amber-400 transition-colors"
            required
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-4 bg-slate-50 text-slate-900 rounded-2xl font-bold border-2 border-slate-200 outline-none focus:border-amber-400 transition-colors"
            required
          />
          
          <button 
            type="submit"
            className="w-full py-4 mt-2 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            {isRegistering ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <button 
          onClick={() => { setIsRegistering(!isRegistering); setErrorDetails(null); }}
          className="mt-6 text-slate-500 font-bold text-xs uppercase hover:text-slate-800 transition-colors"
        >
          {isRegistering ? 'Já tenho uma conta' : 'Criar nova conta'}
        </button>
      </div>
    </div>
  );
}
