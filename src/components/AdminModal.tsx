import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { 
  Gift, 
  Plus, 
  LogOut, 
  Trash2, 
  BarChart3, 
  Users, 
  Star,
  Settings,
  PackageCheck,
  CheckCircle,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Reward, Transaction } from '../types';

interface AdminModalProps {
  onClose: () => void;
}

export function AdminModal({ onClose }: AdminModalProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [deliveredHistory, setDeliveredHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCustomers: 0, totalPoints: 0, totalRewards: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [loading, setLoading] = useState(false);

  const fetchRewards = async () => {
    const { data } = await supabase.from('rewards').select('*');
    if (data) setRewards(data as Reward[]);
  };

  const fetchRedemptions = async () => {
    // We assume 'type' and 'status' columns exist
    const { data } = await supabase
      .from('transactions')
      .select('*, customers(name)')
      .eq('type', 'redeem')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPendingRedemptions(data);

    const { data: historyData } = await supabase
      .from('transactions')
      .select('*, customers(name)')
      .eq('type', 'redeem')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(20);
    if (historyData) setDeliveredHistory(historyData);
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
    fetchRedemptions();
    
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => {
        fetchRewards();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchRedemptions();
      })
      .subscribe();
    
    return () => { channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    fetchStats();
  }, [rewards]);

  const saveReward = async (data: any) => {
    setLoading(true);
    try {
      const rewardData = {
        name: data.name,
        points_required: parseInt(data.pointsRequired),
        description: data.description,
        image_url: data.imageUrl,
        active: true
      };

      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', editingReward.id);
        if (error) throw error;
        alert("Brinde atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('rewards').insert(rewardData);
        if (error) throw error;
        alert("Brinde cadastrado com sucesso!");
      }
      
      reset();
      setEditingReward(null);
      fetchRewards();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
    setLoading(false);
  };

  const startEdit = (reward: Reward) => {
    setEditingReward(reward);
    setValue('name', reward.name);
    setValue('pointsRequired', reward.points_required);
    setValue('imageUrl', reward.image_url);
    setValue('description', reward.description);
    // Scroll form into view if needed
  };

  const cancelEdit = () => {
    setEditingReward(null);
    reset();
  };

  const deliverReward = async (txId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'delivered' })
        .eq('id', txId);
      if (error) throw error;
      fetchRedemptions();
    } catch (e: any) {
      alert(`Erro ao entregar: ${e.message}`);
    }
  };

  const deleteReward = async (id: string) => {
    if(confirm("Tem certeza que deseja remover este item?")) {
      await supabase.from('rewards').delete().eq('id', id);
      fetchRewards();
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('PIN Incorreto');
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
        
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-400">
                 <Settings size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-800">Acesso Restrito</h2>
              <p className="text-slate-500 mb-8 text-sm">Insira o PIN de administrador para continuar.</p>
              <form onSubmit={handleAuth} className="space-y-4">
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN de 4 dígitos"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500/20 outline-none text-center text-2xl font-black tracking-[1em]"
                  autoFocus
                />
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">
                  Entrar no Painel
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
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

          {/* Redemptions Section */}
          <section className="bg-white p-8 rounded-[3rem] border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-8 border-b border-emerald-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <PackageCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Resgates Pendentes</h3>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Aguardando entrega ao cliente</p>
                </div>
              </div>
              <div className="bg-emerald-50 px-6 py-2 rounded-full border border-emerald-100">
                <span className="text-sm font-black text-emerald-600 uppercase">
                  {pendingRedemptions.length} Pendentes
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {pendingRedemptions.length > 0 ? (
                pendingRedemptions.map(tx => (
                  <div key={tx.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-emerald-400/50 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                        <Gift size={28} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg">{tx.customers?.name || 'Cliente'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-slate-500 font-bold">{tx.customer_phone}</p>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-rose-600 font-black mt-2 bg-rose-50 inline-block px-3 py-1 rounded-lg">-{Math.abs(tx.points_earned)} pontos</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deliverReward(tx.id)}
                      className="w-full md:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-95"
                    >
                      <CheckCircle size={20} /> Confirmar Entrega
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <PackageCheck size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum resgate aguardando</p>
                </div>
              )}
            </div>
          </section>

          {/* History Section */}
          <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Histórico de Entregas</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Últimos resgates concluídos</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {deliveredHistory.length > 0 ? (
                deliveredHistory.map(tx => (
                  <div key={tx.id} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{tx.customers?.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Entregue</span>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-xs text-slate-400 text-center py-10 bg-slate-50/30 rounded-2xl border border-dashed border-slate-100 italic">O histórico aparecerá aqui após as primeiras entregas.</p>
              )}
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Form Section */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <h3 className="font-bold text-slate-800">{editingReward ? "Editar Brinde" : "Novo Brinde"}</h3>
              </div>
              
              <form onSubmit={handleSubmit(saveReward)} className="space-y-4">
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
                  className={`w-full text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 ${editingReward ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-slate-900 hover:bg-indigo-600 shadow-slate-200'}`}
                >
                  {loading ? "Gravando..." : editingReward ? "Salvar Alterações" : "Salvar no Catálogo"}
                </button>
                {editingReward && (
                  <button 
                    type="button"
                    onClick={cancelEdit}
                    className="w-full text-slate-400 py-2 font-bold text-xs uppercase tracking-widest hover:text-rose-500 transition-colors"
                  >
                    Cancelar Edição
                  </button>
                )}
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
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-100">
                        <Gift className="text-slate-300" size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{r.name}</p>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{r.points_required} pts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEdit(r)}
                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => deleteReward(r.id)}
                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        )}
      </motion.div>
    </div>
  );
}
