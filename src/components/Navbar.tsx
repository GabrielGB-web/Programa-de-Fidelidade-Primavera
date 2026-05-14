import React from 'react';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { View } from '../types';

interface NavbarProps {
  user: User | null;
  onViewChange: (v: View) => void;
}

export function Navbar({ user, onViewChange }: NavbarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center">
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        onClick={() => onViewChange(View.LANDING)}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
            <img src="/logo_primavera.png" alt="Primavera" className="w-full h-full object-contain" />
          </div>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
            <img src="https://i.ibb.co/q34P8RbS/LOGO-GTA-2.png" alt="Logo GTA" className="w-full h-full object-contain" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-none">Farmácia Primavera</h1>
          <p className="text-[9px] uppercase tracking-widest text-rose-600 font-black mt-1">Cashback & Fidelidade</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 bg-slate-50 pl-4 pr-2 py-1.5 rounded-full border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 hidden sm:block">{user.email}</span>
            <button 
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-rose-600 hover:shadow-md transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="bg-brand-blue text-white px-5 py-2 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-900/20 transition-all flex items-center gap-2"
          >
            <UserIcon size={16} /> Entrar
          </button>
        )}
      </div>
    </nav>
  );
}
