import React from 'react';
import { Wrench, Gauge, Disc3 } from 'lucide-react';

export function VehicleCard() {
  // Simulando dados vindo do backend/usuário
  const currentKm = 850;
  const maxKm = 1000;
  const percentage = Math.min((currentKm / maxKm) * 100, 100);

  // Lógica de Cores da Barra
  const isCritical = percentage >= 90;
  const isWarning = percentage >= 75 && percentage < 90;
  
  const barColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between w-full h-[180px] shadow-lg">
        
        {/* Lado Esquerdo - Info Textual */}
        <div className="flex flex-col h-full justify-between pt-2 pb-2">
            <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-zinc-400" />
                    Manutenção Custom
                </h3>
                <p className="text-zinc-500 text-sm mt-1">Honda CG 160 Titan</p>
            </div>
            
            <div className="flex flex-col">
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Próxima Troca de Óleo</span>
                <div className="flex items-end gap-2 border-b border-zinc-700/50 pb-1">
                    <span className={`text-2xl font-black ${textColor}`}>{currentKm}</span>
                    <span className="text-zinc-500 font-medium mb-1 line-through decoration-zinc-600">/ {maxKm} km</span>
                </div>
            </div>
        </div>

        {/* Lado Direito - Radial Simples com Tailwind base */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0 ml-4 hidden sm:flex">
             {/* Círculo Fundo bg */}
             <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="64" cy="64" r="56" 
                  stroke="currentColor" strokeWidth="12" fill="transparent" 
                  className="text-zinc-800" 
                />
                
                {/* Arco preenchido (simulado manipulando dasharray/offset) */}
                <circle 
                  cx="64" cy="64" r="56" 
                  stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`} 
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                  className={`transition-all duration-1000 ease-out ${textColor}`}
                  strokeLinecap="round"
                />
             </svg>
             <div className="absolute flex flex-col items-center">
                 <Gauge className={`w-8 h-8 mb-1 ${textColor}`} />
                 <span className="text-white font-bold text-sm">{Math.round(percentage)}%</span>
             </div>
        </div>

        {/* Círculo Minimalista p/ Mobile (esconde o radial complexo) */}
        <div className="sm:hidden flex items-center justify-center bg-zinc-800 p-4 rounded-full border border-zinc-700">
             <Disc3 className={`w-10 h-10 ${textColor} ${isCritical ? 'animate-pulse' : ''}`} />
        </div>
    </div>
  );
}
