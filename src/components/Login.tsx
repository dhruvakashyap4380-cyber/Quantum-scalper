import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, ShieldCheck, Zap } from "lucide-react";

interface LoginProps {
  onLogin: (passkey: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === "admin123") { // Matches default in server.ts for demo
      onLogin(input);
    } else {
      setError("Incorrect Passkey. Access Denied.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--brand-blue-50)_0%,_transparent_100%)] opacity-20 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-indigo-500 to-brand-green"></div>
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue mb-6 border border-brand-blue/20 shadow-inner">
            <Zap size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">QUANTUM <span className="text-brand-blue">SCALP</span></h1>
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Proprietary Algo Protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-3 ml-1">Universal Passkey</label>
            <div className="relative group">
              <input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-black/40 border border-brand-border text-white px-5 py-4 rounded-xl focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-all placeholder:text-gray-700 mono font-bold"
                placeholder="••••••••"
              />
              <Lock className="absolute right-5 top-4 text-gray-600 group-focus-within:text-brand-blue transition-colors" size={20} />
            </div>
            {error && <p className="text-brand-red text-[10px] font-bold mt-2 uppercase tracking-tight ml-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-blue hover:bg-blue-600 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <ShieldCheck size={20} className="relative z-10" />
            <span className="relative z-10 tracking-widest text-xs uppercase">Initialize Environment</span>
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-brand-border/50 flex justify-between items-center text-[9px] text-gray-600 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
            Encrypted Endpoints
          </span>
          <span className="font-mono">BingX Mainnet v3.2</span>
        </div>
      </motion.div>
    </div>
  );
}
