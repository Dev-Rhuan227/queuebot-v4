import React from 'react';
import { WhatsappSession } from './components/WhatsappSession';
import { QueueAction } from './components/QueueAction';
import { ActiveDelivery } from './components/ActiveDelivery';
import { VehicleCard } from './components/VehicleCard';
import { useAppStore } from './store/useAppStore';

function App() {
  const { user, queueStatus } = useAppStore();

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans selection:bg-emerald-500/30 text-zinc-100">
      
      {/* Círculos decorativos de background */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      {/* Header Premium */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-10 relative z-10">
         <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-emerald-900/50">
                 {user?.name.charAt(0)}
             </div>
             <div>
                 <h1 className="text-2xl font-black text-white tracking-tight">{user?.name}</h1>
                 <p className="text-emerald-400/80 text-sm font-semibold tracking-wider uppercase mt-0.5">Operações Ativas</p>
             </div>
         </div>
         <div className="hidden sm:block text-right">
             <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-full text-xs font-mono">
                 QUEUEBOT V4
             </span>
         </div>
      </header>

      {/* Main Grid Moderno */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        <div className="lg:col-span-5 flex flex-col gap-8 h-full">
            <div className="flex-1 min-h-[380px]">
               <WhatsappSession />
            </div>
            <VehicleCard />
        </div>

        <div className="lg:col-span-7 flex flex-col h-full">
            {queueStatus === 'captured' ? <ActiveDelivery /> : <QueueAction />}
        </div>

      </main>

    </div>
  )
}

export default App;
