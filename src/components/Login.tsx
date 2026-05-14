import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Bee } from './icons/Bee';

export default function Login() {
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorDetails(null);
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Configure for iframe environments by prompting each time
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
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

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
        >
          {isLoading ? 'Aguarde...' : 'Entrar com o Google'}
        </button>
      </div>
    </div>
  );
}
