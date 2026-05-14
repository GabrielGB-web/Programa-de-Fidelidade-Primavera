import React from 'react';
import { motion } from 'motion/react';
import { Gift, Receipt } from 'lucide-react';
import { View } from '../types';

interface LandingViewProps {
  onSelect: (v: View) => void;
}

export function LandingView({ onSelect }: LandingViewProps) {
  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, x: -50 }} 
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Programa de Fidelidade
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold text-slate-900 leading-tight mb-6">
          Cuidar de você <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600 italic">vale prêmios.</span>
        </h1>
        
        <p className="text-lg text-slate-500 leading-relaxed max-w-md mb-10">
          Na Farmácia Primavera, cada R$ 10,00 em compras se transformam em pontos. Junte, resgate e aproveite benefícios exclusivos pensados para sua saúde.
        </p>
        
        <div className="flex items-center gap-6">
          <div className="flex -space-x-4">
             {[1,2,3,4].map(i => (
               <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="avatar" />
               </div>
             ))}
             <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
               +500
             </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Clientes Ativos</p>
            <p className="text-xs text-slate-400">Ganhando pontos diariamente</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(View.CUSTOMER)}
          className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-left group transition-all duration-300"
        >
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-inner">
            <Gift size={30} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-3">Sou Cliente</h3>
          <p className="text-slate-500 text-base leading-relaxed">Acesse sua conta para ver seus pontos acumulados e escolher seus próximos brindes.</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(View.CASHIER)}
          className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-slate-900/20 text-left text-white group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all"></div>
          <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand-blue transition-all duration-500 shadow-inner">
            <Receipt size={30} />
          </div>
          <h3 className="text-3xl font-bold mb-3">Colaborador</h3>
          <p className="text-slate-400 text-base leading-relaxed">Área restrita para registro de vendas, consulta de cupons e gestão de pontos.</p>
        </motion.button>
      </div>
    </div>
  );
}
