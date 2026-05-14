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
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-none">Farmácia Primavera</h1>
          <p className="text-[9px] uppercase tracking-widest text-rose-600 font-black mt-1">Cashback & Fidelidade</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Login button removed as requested */}
      </div>
    </nav>
  );
}
