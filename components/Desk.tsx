
import React from 'react';
import { Agent } from '../types';

interface DeskProps {
  agent: Agent;
}

const Desk: React.FC<DeskProps> = ({ agent }) => {
  const isWorking = agent.status === 'WORKING';
  const isThinking = agent.status === 'THINKING';

  return (
    <div className="relative group perspective-2000 transform-style-preserve-3d scale-75">
      {/* Office Chair - 3D Look */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-14 h-14 -z-10 transition-transform duration-700 group-hover:translate-y-1">
         {/* Chair Back */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-12 bg-zinc-900 border border-white/10 rounded-t-lg shadow-xl"></div>
         {/* Chair Seat */}
         <div className="absolute top-7 left-1/2 -translate-x-1/2 w-12 h-8 bg-zinc-950 border border-white/5 rounded-md shadow-2xl transform rotateX(60deg)"></div>
         {/* Chair Base */}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-black"></div>
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black rounded-full"></div>
      </div>

      {/* Desk Surface - Ultra Skeuomorphic */}
      <div className={`w-40 h-20 glass rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.7)] border-b-[8px] border-zinc-900 relative overflow-hidden transition-all duration-700 group-hover:scale-[1.02] transform-style-preserve-3d`}>
        
        {/* Desk Material Texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/40 pointer-events-none"></div>
        
        {/* Screen Glow on Surface (Living Office) */}
        {(isWorking || isThinking) && (
           <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-20 blur-2xl opacity-30 pointer-events-none animate-pulse
             ${isWorking ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
        )}

        {/* Dual Monitors (Systemic Look) */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-2">
           {/* Primary Screen */}
           <div className="w-24 h-16 bg-zinc-950 rounded-lg border border-white/20 shadow-2xl flex flex-col p-1 overflow-hidden relative transform rotateY(-5deg)">
              <div className="flex-1 rounded-md bg-black overflow-hidden relative">
                 {/* Live Code Feed */}
                 <div className="p-2 space-y-1 opacity-40">
                    <div className="h-0.5 bg-blue-500/60 rounded-full w-full animate-pulse"></div>
                    <div className="h-0.5 bg-zinc-800 rounded-full w-3/4"></div>
                    <div className="h-0.5 bg-zinc-800 rounded-full w-5/6"></div>
                 </div>
                 {/* Visualizer Glow */}
                 {(isWorking || isThinking) && (
                   <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none mix-blend-screen
                     ${isWorking ? 'bg-blue-600/5' : 'bg-purple-600/5'}`}></div>
                 )}
              </div>
           </div>
           {/* Side Screen (Status/Docs) */}
           <div className="w-12 h-12 bg-zinc-950 rounded-lg border border-white/20 shadow-xl mt-4 flex items-center justify-center p-1 transform rotateY(15deg)">
              <div className="w-full h-full bg-black/80 rounded-md border border-white/5 flex flex-col items-center justify-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                 <div className="w-6 h-0.5 bg-zinc-800 rounded-full"></div>
                 <div className="w-4 h-0.5 bg-zinc-800 rounded-full"></div>
              </div>
           </div>
        </div>

        {/* Desk Peripherals */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-5 glass border border-white/10 rounded-lg shadow-inner flex items-center justify-center">
           <div className="flex gap-1">
              {[1,2,3,4,5,6].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/5 rounded-sm border border-white/5"></div>)}
           </div>
        </div>
        <div className="absolute bottom-4 right-4 w-4 h-5 bg-zinc-800 border border-white/10 rounded-full shadow-lg"></div>
      </div>

      {/* Desk Legs - High Gloss Metal & Cables */}
      <div className="flex justify-between px-8 -mt-2 relative">
         <div className="w-2.5 h-12 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black rounded-b-xl border-x border-white/5"></div>
         
         {/* Glowing Cable (Living Office) */}
         {(isWorking || isThinking) && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-14 bg-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse"></div>
         )}
         
         <div className="w-2.5 h-12 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black rounded-b-xl border-x border-white/5"></div>
      </div>
    </div>
  );
};

export default Desk;
