import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Bee } from './icons/Bee';

export default function Login() {
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error(error);
      setErrorDetails(error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-xl text-center max-w-sm w-full border border-slate-200">
        <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-50">
          <Bee className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Spelling Bee</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Teacher Dashboard</p>
        
        {errorDetails && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold whitespace-pre-wrap text-left border border-red-100">
            {errorDetails}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="E-mail" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-400"
          />
          <input 
            type="password" 
            placeholder="Senha" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Aguarde...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsRegistering(!isRegistering);
            setErrorDetails(null);
          }}
          className="mt-6 text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
        >
          {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );
}
