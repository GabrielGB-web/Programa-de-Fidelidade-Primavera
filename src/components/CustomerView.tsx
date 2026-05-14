import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  User as UserIcon, 
  Gift, 
  Sparkles, 
  Star,
  CheckCircle2,
  TrendingUp,
  Award,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Customer, Reward, getTier, Transaction } from '../types';

interface CustomerViewProps {
  onBack: () => void;
}

export function CustomerView({ onBack }: CustomerViewProps) {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function fetchRewards() {
      const { data } = await supabase.from('rewards').select('*').eq('active', true);
      if (data) setRewards(data as Reward[]);
    }
    fetchRewards();
  }, []);

  const handleSearch = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (error) {
        alert(`Erro ao buscar cliente: ${error.message}`);
      }

      if (data) {
        setCustomer(data as Customer);
        
        // Fetch AI Recommendations
        try {
          const res = await fetch('/api/recommend-rewards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: data.points, history: [] })
          });
          const recs = await res.json();
          setRecommendations(recs);
        } catch (err) {
          console.error("AI error", err);
        }

        // Fetch Transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('customer_phone', phone)
          .order('created_at', { ascending: false })
          .limit(5);

        if (txData) {
          setTransactions(txData as Transaction[]);
        } else if (txError) {
          alert(`Erro ao buscar histórico: ${txError.message}`);
        }
      } else {
        alert("Cliente não encontrado.");
        setCustomer(null);
      }
    } catch (e: any) {
      alert(`Erro inesperado: ${e.message}`);
    }
    setLoading(false);
  };

  const handleRedeem = async (reward: Reward) => {
    if (!customer) return;
    if (customer.points < reward.points_required) return;
    
    setIsRedeeming(reward.id);
    try {
      const newPoints = customer.points - reward.points_required;
      
      // Update points
      const { error: custError } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('phone', customer.phone);
      
      if (custError) throw custError;

      // Add transaction
      console.log("Tentando registrar resgate para:", customer.phone);
      const { data: txData, error: txError } = await supabase.from('transactions').insert({
        customer_phone: customer.phone,
        value: 0,
        points_earned: -reward.points_required,
        type: 'redeem',
        status: 'pending',
        coupon_number: 'RESGATE',
        reward_name: reward.name
      }).select();

      if (txError) {
        console.error("Erro Supabase Insert:", txError);
        alert(`ERRO CRÍTICO NO BANCO: ${txError.message}\nCódigo: ${txError.code}\nDetalhes: ${txError.details}`);
        return;
      }

      console.log("Resgate registrado com sucesso:", txData);
      
      setCustomer({ ...customer, points: newPoints });
      
      // Refresh transactions list
      const { data: updatedTxs } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_phone', customer.phone)
        .order('created_at', { ascending: false })
        .limit(10);
      if (updatedTxs) setTransactions(updatedTxs as Transaction[]);

      alert(`Parabéns! Você resgatou: ${reward.name}. Apresente seu CPF no balcão para retirar.`);
    } catch (err: any) {
      alert(`Erro no resgate: ${err.message}`);
    }
    setIsRedeeming(null);
  };

  const tier = customer ? getTier(customer.points) : 'Silver';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-10 transition-colors font-bold group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar
      </button>

      {!customer ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto bg-white p-12 rounded-[4rem] shadow-2xl shadow-slate-200 border border-slate-100 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-rose-500 to-indigo-600"></div>
          <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-10 shadow-inner">
            <Search size={40} />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Área do Cliente</h2>
          <p className="text-slate-500 mb-10 text-lg">Insira seu telefone para consultar seu saldo e benefícios.</p>
          
          <div className="space-y-6">
            <div className="relative group">
              <input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none text-center text-3xl font-black tracking-tight text-slate-700 shadow-inner transition-all"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Sincronizando Dados..." : "Consultar Meus Pontos"}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200 border border-slate-100 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 ${
                tier === 'Platinum' ? 'bg-indigo-600' : tier === 'Gold' ? 'bg-amber-400' : 'bg-slate-400'
              }`}></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-100 shadow-sm">
                  <UserIcon size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800">{customer.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{customer.phone}</p>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2rem] text-white text-center shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-[10px] font-black opacity-50 mb-2 uppercase tracking-[0.3em]">Saldo Disponível</p>
                <div className="flex items-baseline justify-center gap-2">
                  <motion.p 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-black tracking-tighter"
                  >
                    {customer.points}
                  </motion.p>
                  <p className="text-sm font-bold opacity-40 uppercase tracking-widest">pts</p>
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-2">
                   <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                     tier === 'Platinum' ? 'bg-indigo-500 text-white' : tier === 'Gold' ? 'bg-amber-400 text-amber-900' : 'bg-slate-700 text-slate-300'
                   }`}>
                     <Award size={14} /> Nível {tier}
                   </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <h4 className="font-bold text-slate-800">Últimas Atividades</h4>
              </div>
              
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-bold text-slate-600">
                          {tx.type === 'earn' ? 'Compra Registrada' : `Resgate: ${tx.reward_name || 'Brinde'}`}
                        </p>
                        {tx.type === 'redeem' && (
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            tx.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {tx.status === 'delivered' ? 'Entregue' : 'Aguardando Retirada'}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm font-black ${tx.points_earned > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.points_earned > 0 ? `+${tx.points_earned}` : tx.points_earned} pts
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhuma atividade recente.</p>
                )}
              </div>
            </motion.div>

            <AnimatePresence>
              {recommendations.length > 0 && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[3rem] border border-indigo-100/50 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Sparkles size={20} className="text-rose-500 animate-pulse" />
                    </div>
                    <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-indigo-900">Sugestões de Brindes (IA)</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-indigo-100/50 shadow-sm hover:border-indigo-400/30 transition-all cursor-default group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{rec.name}</p>
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                            <Star size={10} className="text-amber-500 fill-amber-500" />
                            <span className="text-[9px] font-black text-amber-700">{rec.pointsRequired} pts</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Catálogo de Prêmios</h3>
                <p className="text-slate-500 text-sm mt-1">Troque seus pontos acumulados por benefícios reais.</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                <Gift size={24} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {rewards.map(reward => {
                const canRedeem = customer.points >= reward.points_required;
                const progress = Math.min(100, (customer.points / reward.points_required) * 100);
                
                return (
                  <motion.div 
                    key={reward.id}
                    whileHover={canRedeem ? { y: -8 } : {}}
                    className={`group premium-card overflow-hidden flex flex-col ${!canRedeem && 'opacity-70 grayscale-[0.5]'}`}
                  >
                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                      {reward.image_url ? (
                        <img src={reward.image_url} alt={reward.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Gift size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-indigo-600 shadow-lg border border-white">
                        {reward.points_required} pts
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <h4 className="font-bold text-xl text-slate-800 mb-2">{reward.name}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1 mb-6">{reward.description}</p>
                      
                      {canRedeem ? (
                        <button 
                          onClick={() => handleRedeem(reward)}
                          disabled={isRedeeming !== null}
                          className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                          {isRedeeming === reward.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <><CheckCircle2 size={18} /> Resgatar Agora</>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="bg-indigo-500 h-full rounded-full" 
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Faltam {reward.points_required - customer.points} pts</p>
                            <p className="text-[10px] text-indigo-600 font-black">{Math.round(progress)}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
