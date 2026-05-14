/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// Types
import { View } from './types';

// Components
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { CashierView } from './components/CashierView';
import { CustomerView } from './components/CustomerView';
import { AdminModal } from './components/AdminModal';

export default function App() {
  const [view, setView] = useState<View>(View.LANDING);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Configuração Necessária</h2>
          <p className="text-slate-500 mb-10 leading-relaxed">
            Para o sistema funcionar, você precisa configurar as chaves do Supabase no painel de <strong>Secrets</strong>.
          </p>
          <div className="text-left bg-slate-50 p-6 rounded-2xl font-mono text-[11px] space-y-3 text-slate-400 border border-slate-100">
            <p className="flex justify-between"><span>1. NEXT_PUBLIC_SUPABASE_URL</span> <span className="text-emerald-500">✓</span></p>
            <p className="flex justify-between"><span>2. NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span> <span className="text-emerald-500">✓</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdff] pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar user={user} onViewChange={setView} />
      
      <main className="container mx-auto pt-32 px-6">
        <AnimatePresence mode="wait">
          {view === View.LANDING && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <LandingView onSelect={setView} />
            </motion.div>
          )}
          
          {view === View.CASHIER && (
            <motion.div 
              key="cashier"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
            >
              <CashierView onBack={() => setView(View.LANDING)} />
            </motion.div>
          )}
          
          {view === View.CUSTOMER && (
            <motion.div 
              key="customer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <CustomerView onBack={() => setView(View.LANDING)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Admin Floating Button */}
      <div className="fixed bottom-10 right-10 z-30">
        <button 
          onClick={() => setView(View.ADMIN)}
          className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 transition-all duration-300 group"
        >
          <ShieldCheck size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {view === View.ADMIN && (
         <AdminModal onClose={() => setView(View.LANDING)} />
      )}
    </div>
  );
}
