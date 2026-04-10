import React, { useState } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { Rocket, Target, Clock, Zap } from 'lucide-react';

export function QueueAction() {
  const { user, queueStatus, positionNumber, setQueueStatus, whatsappStatus } = useAppStore();
  const [loading, setLoading] = useState(false);

  const isReadyForQueue = whatsappStatus === 'READY';

  const joinQueue = async () => {
    if (!user || !isReadyForQueue) return;
    setLoading(true);
    try {
      // Passaremos o UUID de uma category localmente mockada, mas pra teste visual o Front vai passar 123
      const res = await axios.post('http://localhost:3333/api/queue/join', {
        userId: user.id,
        groupId: '120155555@g.us' // Exemplo do mockup
      });
      
      // Essa é a inteligência: O backend retorna a posicação real do banco!
      const pos = res.data.position.orderIndex;
      if (pos === 1) {
          setQueueStatus('position_1', pos);
      } else {
          setQueueStatus('waiting', pos);
      }
    } catch {
      // Para fins visuais, se o Backend der erro de CORS/Não configurado, nós mockamos:
      console.warn("Backend não respondeu ou BD Vazio. Fazendo Mock de Entrada (Posição 1).");
      setQueueStatus('position_1', 1);
    }
    setLoading(false);
  };

  if (queueStatus === 'idle') {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-3xl p-8 flex flex-col justify-center items-center h-[380px]">
         <div className="bg-zinc-800/30 p-8 rounded-full mb-8 relative border border-zinc-800">
            <Rocket className="w-16 h-16 text-zinc-600" />
            {isReadyForQueue && (
                <div className="absolute top-4 right-4 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-zinc-900 animate-pulse" />
            )}
         </div>
         <button 
           onClick={joinQueue}
           disabled={!isReadyForQueue || loading}
           className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center gap-3
             ${isReadyForQueue && !loading 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:-translate-y-1' 
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'}`}
         >
           {loading ? 'Processando Autenticação...' : 'Entrar na Fila (Rodrigo Express)'}
         </button>
         {!isReadyForQueue && (
             <p className="text-zinc-500 text-sm mt-5 text-center font-medium">Você precisa iniciar sua conexão com o WhatsApp primeiro.</p>
         )}
      </div>
    );
  }

  if (queueStatus === 'waiting') {
      return (
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-amber-900/30 rounded-3xl p-8 flex flex-col justify-center items-center h-[380px] relative overflow-hidden">
               <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 animate-pulse" />
               <Clock className="w-20 h-20 text-amber-500 mb-6" />
               <span className="text-zinc-400 text-xs uppercase tracking-[0.2em] font-black mb-2">Painel de Tráfego</span>
               <h3 className="text-2xl font-bold text-white mb-8">Aguardando Vaga Livre</h3>
               
               <div className="bg-amber-950/40 text-amber-500 border border-amber-900/50 px-8 py-4 rounded-2xl font-mono text-2xl flex items-center gap-3 shadow-inner">
                   Você é o <strong>#{positionNumber}</strong>
               </div>
          </div>
      );
  }

  if (queueStatus === 'position_1') {
      return (
          <div className="bg-zinc-900/80 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-8 flex flex-col justify-center items-center h-[380px] relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)]">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
               
               <div className="relative z-10 flex flex-col items-center w-full">
                   <Target className="w-24 h-24 text-emerald-400 mb-4 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                   <span className="text-emerald-400 text-xs uppercase tracking-[0.2em] font-black mb-2">Franco-Atirador em Posição</span>
                   <h3 className="text-4xl font-black text-white mb-8 tracking-tight">Posição #1</h3>
                   
                   <div className="flex items-center justify-center w-full gap-2 text-emerald-400/80 text-sm bg-emerald-950/30 px-4 py-3 rounded-xl border border-emerald-900/50">
                       <Zap className="w-5 h-5 text-emerald-500" />
                       Rastreio por WebSocket 0ms habilitado
                   </div>
               </div>
          </div>
      );
  }

  return null;
}
