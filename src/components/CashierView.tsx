import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Smartphone, Receipt, CheckCircle2, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';

interface CashierViewProps {
  onBack: () => void;
}

export function CashierView({ onBack }: CashierViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { phone: '', value: '', coupon: '', name: '' }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<Customer | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const phone = watch('phone');

  const searchUser = async () => {
    if (phone.length < 8) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (data) {
        setFoundUser(data as Customer);
      } else {
        setFoundUser(null);
      }
    } catch (e) {
      console.log("No user found", e);
    }
    setSearching(false);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const value = parseFloat(data.value);
    const pointsToAdd = Math.floor(value / 10);

    try {
      // 1. Update/Create Customer
      const newPoints = (foundUser?.points || 0) + pointsToAdd;
      const { error: custError } = await supabase
        .from('customers')
        .upsert({
          phone: data.phone,
          name: foundUser?.name || data.name,
          points: newPoints,
          last_visit: new Date().toISOString()
        }, { onConflict: 'phone' });

      if (custError) throw custError;

      // 2. Add Transaction
      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          customer_phone: data.phone,
          coupon_number: data.coupon,
          value,
          points_earned: pointsToAdd,
          type: 'earn'
        });

      if (transError) throw transError;

      // Success animation/feedback could go here
      alert(`Sucesso! ${pointsToAdd} pontos adicionados a ${foundUser?.name || data.name}.`);
      
      // Update local history
      setRecentTransactions([{
        name: foundUser?.name || data.name,
        points: pointsToAdd,
        time: new Date().toLocaleTimeString()
      }, ...recentTransactions.slice(0, 4)]);

      reset();
      setFoundUser(null);
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
    setIsSubmitting(false);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('PIN Incorreto');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-8 transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={14} /> Sair
        </button>
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
           <Receipt size={32} />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 mb-8 text-sm">Insira o PIN operacional para registrar vendas.</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500/20 outline-none text-center text-3xl font-black tracking-[0.5em]"
            autoFocus
          />
          <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-8 items-start">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-3 bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100"
      >
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-8 transition-colors font-bold text-sm group">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Voltar ao início
        </button>
        
        <h2 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Registrar Venda</h2>
        <p className="text-slate-500 mb-10">Identifique o cliente para creditar pontos automaticamente.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6">
            <div className="relative group">
              <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest z-10">Telefone do Cliente</label>
              <div className="relative">
                <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  {...register('phone', { required: true })}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-lg font-bold text-slate-700"
                  onBlur={searchUser}
                />
              </div>
              {searching && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {!foundUser && phone.length >= 8 && !searching && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="relative"
              >
                <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-black text-rose-500 uppercase tracking-widest z-10">Nome do Novo Cliente</label>
                <input 
                  {...register('name', { required: !foundUser })}
                  placeholder="Nome Completo"
                  className="w-full px-6 py-5 bg-rose-50/30 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-rose-500/20 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all text-lg font-bold text-slate-700"
                />
              </motion.div>
            )}

            {foundUser && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Cliente Identificado</p>
                    <p className="font-bold text-xl">{foundUser.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Saldo Atual</p>
                    <p className="font-black text-3xl">{foundUser.points} <span className="text-xs">pts</span></p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Valor da Compra</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    {...register('value', { required: true })}
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500/20 outline-none transition-all text-lg font-bold text-slate-700"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Nº Cupom Fiscal</label>
                <div className="relative">
                  <Receipt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    {...register('coupon', { required: true })}
                    placeholder="000000"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500/20 outline-none transition-all text-lg font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <><CheckCircle2 size={22} /> Confirmar Pontuação</>
            )}
          </button>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="md:col-span-2 space-y-6"
      >
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Atividade Recente</h3>
          </div>
          
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{tx.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{tx.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-500 font-black">+{tx.points} pts</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400 font-medium">Nenhuma operação realizada nesta sessão.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100">
          <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-400 mb-4">Dica do Sistema</h4>
          <p className="text-sm text-indigo-700 leading-relaxed font-medium">
            Sempre solicite o CPF do cliente para garantir que os pontos sejam vinculados corretamente à conta de fidelidade.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
