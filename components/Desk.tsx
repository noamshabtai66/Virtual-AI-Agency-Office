
import React from 'react';
import { Agent } from '../types';

interface DeskProps {
  agent: Agent;
}

const Desk: React.FC<DeskProps> = ({ agent }) => {
  const isWorking = agent.status === 'WORKING';
  const isThinking = agent.status === 'THINKING';

  return (
    <div className="relative group perspective-2000">
      {/* Desk Surface - Ultra Skeuomorphic */}
      <div className={`w-48 h-24 glass rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-b-[8px] border-black/50 relative overflow-hidden transition-all duration-700 group-hover:scale-[1.02]`}>
        
        {/* Desk Material Texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
        
        {/* Dual Monitors (Systemic Look) */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-2">
           {/* Primary Screen */}
           <div className="w-32 h-20 bg-zinc-950 rounded-xl border border-white/20 shadow-2xl flex flex-col p-1 overflow-hidden relative">
              <div className="flex-1 rounded-lg bg-black overflow-hidden relative">
                 {/* Live Code Feed */}
                 <div className="p-2 space-y-1 opacity-40">
                    <div className="h-1 bg-blue-500/50 rounded-full w-full animate-pulse"></div>
                    <div className="h-1 bg-zinc-800 rounded-full w-3/4"></div>
                    <div className="h-1 bg-zinc-800 rounded-full w-5/6"></div>
                    <div className="h-1 bg-green-500/30 rounded-full w-1/2"></div>
                 </div>
                 {/* Visualizer Glow */}
                 {(isWorking || isThinking) && (
                   <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none mix-blend-screen
                     ${isWorking ? 'bg-blue-600/10' : 'bg-purple-600/10'}`}></div>
                 )}
              </div>
           </div>
           {/* Side Screen (Status/Docs) */}
           <div className="w-16 h-18 bg-zinc-950 rounded-xl border border-white/20 shadow-xl mt-2 flex items-center justify-center p-1">
              <div className="w-full h-full bg-black/60 rounded-md border border-white/5 flex flex-col items-center justify-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                 <div className="w-6 h-0.5 bg-zinc-800 rounded-full"></div>
                 <div className="w-4 h-0.5 bg-zinc-800 rounded-full"></div>
              </div>
           </div>
        </div>

        {/* Desk Peripherals */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-24 h-6 glass border border-white/10 rounded-xl shadow-inner flex items-center justify-center">
           <div className="flex gap-1">
              {[1,2,3,4,5,6].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/5 rounded-sm border border-white/5"></div>)}
           </div>
        </div>
        <div className="absolute bottom-6 right-6 w-5 h-7 bg-zinc-800 border border-white/10 rounded-full shadow-lg"></div>
      </div>

      {/* Desk Legs - High Gloss Metal */}
      <div className="flex justify-between px-10 -mt-2">
         <div className="w-3 h-12 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black rounded-b-2xl border-x border-white/5"></div>
         <div className="w-3 h-12 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black rounded-b-2xl border-x border-white/5"></div>
      </div>
    </div>
  );
};

export default Desk;
