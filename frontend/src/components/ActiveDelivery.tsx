import React, { useState } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { Package, MapPin, CheckCircle2, DollarSign } from 'lucide-react';

export function ActiveDelivery() {
  const { user, activeDeliveryId, setActiveDelivery, setQueueStatus } = useAppStore();
  const [step, setStep] = useState<'pickup' | 'delivery' | 'finish'>('pickup');
  const [value, setValue] = useState('');
  const [method, setMethod] = useState<'Pix' | 'Dinheiro'>('Pix');
  const [loading, setLoading] = useState(false);

  const handlePickup = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:3333/api/deliveries/${activeDeliveryId}/pickup`);
      setStep('delivery');
    } catch {}
    setLoading(false);
  };

  const handleDeliver = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:3333/api/deliveries/${activeDeliveryId}/deliver`);
      setStep('finish');
    } catch {}
    setLoading(false);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:3333/api/deliveries/${activeDeliveryId}/finish`, {
        deliveryValue: Number(value) || 0,
        paymentMethod: method,
      });
      // Ciclo concluido. Volta pra base de fila limpa
      setActiveDelivery(null);
      setQueueStatus('idle');
    } catch {}
    setLoading(false);
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-md border border-cyan-500/40 rounded-3xl p-8 flex flex-col justify-center items-center h-[380px] relative overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.15)]">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
       
       <div className="relative z-10 flex flex-col items-center w-full">
         <h3 className="text-3xl font-black text-white mb-1 tracking-tight">Corrida em Andamento</h3>
         <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-8">Delivery ID: #{activeDeliveryId?.substring(0,8) || 'TEST-123'}</p>
         
         {step === 'pickup' && (
             <button onClick={handlePickup} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-500 text-white font-black py-7 rounded-2xl text-xl shadow-[0_0_30px_rgba(217,119,6,0.3)] transition-all active:scale-95 border border-amber-500 uppercase tracking-widest">
                 <Package className="w-8 h-8" /> 1. Cheguei e Coletei
             </button>
         )}

         {step === 'delivery' && (
             <button onClick={handleDeliver} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black py-7 rounded-2xl text-xl shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all active:scale-95 animate-in fade-in slide-in-from-right-4 border border-blue-500 uppercase tracking-widest">
                 <MapPin className="w-8 h-8" /> 2. Entregue ao Cliente
             </button>
         )}

         {step === 'finish' && (
             <div className="w-full bg-zinc-950/80 p-5 rounded-2xl border border-zinc-700 animate-in fade-in zoom-in shadow-xl backdrop-blur-md">
                 <div className="flex gap-4 mb-5">
                     <div className="flex-1">
                         <label className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-2">Valor Cobrado</label>
                         <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-10 pr-3 text-white font-bold text-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors" />
                         </div>
                     </div>
                     <div className="flex flex-col flex-1 pl-4 border-l border-zinc-800">
                        <label className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-2">Pagamento</label>
                        <div className="flex bg-zinc-900 rounded-xl p-1.5 h-[50px]">
                            <button onClick={()=>setMethod('Pix')} className={`flex-1 text-sm font-black uppercase tracking-wider rounded-lg transition-all ${method === 'Pix' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}>Pix</button>
                            <button onClick={()=>setMethod('Dinheiro')} className={`flex-1 text-sm font-black uppercase tracking-wider rounded-lg transition-all ${method === 'Dinheiro' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}>$$</button>
                        </div>
                     </div>
                 </div>
                 <button onClick={handleFinish} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                     <CheckCircle2 className="w-6 h-6" /> Finalizar Corrida
                 </button>
             </div>
         )}
       </div>
    </div>
  );
}
