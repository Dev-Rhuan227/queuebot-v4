import React, { useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { Smartphone, LogOut, Loader2 } from 'lucide-react';

export function WhatsappSession() {
  const { user, whatsappStatus, qrCodeBase64, setWhatsappState } = useAppStore();

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:3333/api/whatsapp/status/${user.phoneId}`);
      if (res.data && res.data.status) {
          setWhatsappState(res.data.status, res.data.qr);
      }
    } catch (e) {
      // Falha silenciosa pra polling caso container 5 caia 
    }
  };

  useEffect(() => {
    fetchStatus();
    // Em Produção, usaríamos server-sent events ou websockets reais. 
    // Como é uma POC / Fase 1, polling a cada 3s serve bem.
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Polling de Fila e Delivery (O Mestre O(1) do Frontend)
  const fetchGlobalState = async () => {
      if (!user) return;
      try {
          const res = await axios.get(`http://localhost:3333/api/user/${user.id}/state`);
          const data = res.data;
          
          if (data.status === 'in_run') {
              useAppStore.getState().setActiveDelivery(data.delivery.id);
              useAppStore.getState().setQueueStatus('captured');
          } else if (data.status === 'in_queue') {
              const pos = data.position;
              useAppStore.getState().setQueueStatus(pos === 1 ? 'position_1' : 'waiting', pos);
          } else {
              useAppStore.getState().setQueueStatus('idle');
          }
      } catch(e) {}
  };

  useEffect(() => {
      fetchGlobalState();
      const stInterval = setInterval(fetchGlobalState, 3000);
      return () => clearInterval(stInterval);
  }, [user]);

  const startSession = async () => {
    if (!user) return;
    setWhatsappState('INITIALIZING', null);
    try {
      await axios.post('http://localhost:3333/api/whatsapp/start', { phoneId: user.phoneId });
    } catch {
      setWhatsappState('DISCONNECTED', null);
    }
  };

  const handleLogout = async () => {
      setWhatsappState('INITIALIZING', null);
      try {
          await axios.post('http://localhost:3333/api/whatsapp/logout', { phoneId: user?.phoneId });
      } catch (e) {
          console.error("Falha ao desvincular", e);
      }
      setWhatsappState('NOT_FOUND', null);
  };

  const UI = {
    NOT_FOUND: (
      <div className="flex flex-col items-center">
        <Smartphone className="w-16 h-16 text-zinc-600 mb-4" />
        <button onClick={startSession} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-lg shadow-emerald-900/50">
          Iniciar Conexão
        </button>
      </div>
    ),
    INITIALIZING: (
      <div className="flex flex-col items-center text-zinc-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-500" />
        <p className="font-medium animate-pulse">Preparando Instância Blindada...</p>
      </div>
    ),
    QR_CODE_READY: (
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-3 rounded-xl mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
           <img src={qrCodeBase64 || ""} alt="QR Code" className="w-56 h-56 object-cover" />
        </div>
        <p className="text-zinc-400 font-medium">Escaneie pelo seu WhatsApp</p>
      </div>
    ),
    READY: (
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
           <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-30 rounded-full" />
           <Smartphone className="w-20 h-20 text-emerald-400 relative z-10" />
           <div className="absolute top-0 -right-2 w-5 h-5 bg-emerald-500 rounded-full animate-ping" />
           <div className="absolute top-0 -right-2 w-5 h-5 bg-emerald-400 border-2 border-zinc-900 rounded-full" />
        </div>
        <span className="text-emerald-400 font-black tracking-widest uppercase text-sm mb-6 drop-shadow-md">Gatilho Armado</span>
        
        <button onClick={handleLogout} className="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 border border-zinc-700 hover:border-zinc-500">
          <LogOut className="w-4 h-4" />
           Desconectar Aparelho
        </button>
      </div>
    )
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[380px] shadow-2xl relative overflow-hidden">
      {/* Decorative gradient top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      
      <h2 className="text-xl font-bold text-white mb-8 inline-flex items-center gap-2 absolute top-6 left-6">
         Modo Operacional
      </h2>
      
      {/* Renderização Condicional Limpa */}
      {(whatsappStatus === 'AUTHENTICATED') ? UI.INITIALIZING : 
       (UI[whatsappStatus as keyof typeof UI] || UI.NOT_FOUND)}
    </div>
  );
}
