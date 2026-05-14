import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Gift, 
  Plus, 
  LogOut, 
  Trash2, 
  BarChart3, 
  Users, 
  Star,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Reward } from '../types';

interface AdminModalProps {
  onClose: () => void;
}

export function AdminModal({ onClose }: AdminModalProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState({ totalCustomers: 0, totalPoints: 0, totalRewards: 0 });
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);

  const fetchRewards = async () => {
    const { data } = await supabase.from('rewards').select('*');
    if (data) setRewards(data as Reward[]);
  };

  const fetchStats = async () => {
    try {
      const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { data: ptsData } = await supabase.from('customers').select('points');
      
      const totalPoints = ptsData?.reduce((acc, curr) => acc + curr.points, 0) || 0;
      
      setStats({
        totalCustomers: custCount || 0,
        totalPoints: totalPoints,
        totalRewards: rewards.length
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRewards();
    
    const channel = supabase.channel('rewards-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => {
        fetchRewards();
      })
      .subscribe();
    
    return () => { channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    fetchStats();
  }, [rewards]);

  const addReward = async (data: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('rewards').insert({
        name: data.name,
        points_required: parseInt(data.pointsRequired),
        description: data.description,
        image_url: data.imageUrl,
        active: true
      });
      if (error) throw error;
      reset();
      fetchRewards();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
    setLoading(false);
  };

  const deleteReward = async (id: string) => {
    if(confirm("Tem certeza que deseja remover este item?")) {
      await supabase.from('rewards').delete().eq('id', id);
      fetchRewards();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/20"
      >
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <Settings className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Painel de Gestão</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Controle de Fidelidade Primavera</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-rose-500 rounded-xl transition-all relative z-10 group">
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="p-10 overflow-y-auto space-y-12">
          {/* Stats Grid */}
          <section className="grid grid-cols-3 gap-6">
             <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                 <Users size={24} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientes</p>
                 <p className="text-2xl font-black text-slate-800">{stats.totalCustomers}</p>
               </div>
             </div>
             <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                 <Star size={24} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pts Emitidos</p>
                 <p className="text-2xl font-black text-slate-800">{stats.totalPoints}</p>
               </div>
             </div>
             <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <Gift size={24} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brindes</p>
                 <p className="text-2xl font-black text-slate-800">{rewards.length}</p>
               </div>
             </div>
          </section>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Form Section */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <h3 className="font-bold text-slate-800">Novo Brinde</h3>
              </div>
              
              <form onSubmit={handleSubmit(addReward)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome do Brinde</label>
                  <input {...register('name', { required: true })} placeholder="Ex: Kit Higiene Premium" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500/20 outline-none transition-all font-bold text-slate-700" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pontos</label>
                    <input {...register('pointsRequired', { required: true })} type="number" placeholder="500" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500/20 outline-none transition-all font-bold text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">URL Imagem</label>
                    <input {...register('imageUrl')} placeholder="https://..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500/20 outline-none transition-all font-bold text-slate-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descrição</label>
                  <textarea {...register('description', { required: true })} placeholder="Descreva os itens inclusos..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500/20 outline-none transition-all font-bold text-slate-700 h-32 resize-none" />
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {loading ? "Gravando..." : "Salvar no Catálogo"}
                </button>
              </form>
            </section>

            {/* List Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center">
                    <BarChart3 size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800">Itens Ativos</h3>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">{rewards.length} itens</span>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {rewards.map(r => (
                  <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-indigo-400/30 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-100">
                        {r.image_url ? <img src={r.image_url} className="w-full h-full object-cover" /> : <Gift className="w-full h-full p-3 text-slate-300" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{r.name}</p>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{r.points_required} pts</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteReward(r.id)}
                      className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
