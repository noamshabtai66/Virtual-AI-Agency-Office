
import React from 'react';
import { Agent, InternalMessage } from '../types';

interface CharacterProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
  internalMessage?: InternalMessage;
}

const Character: React.FC<CharacterProps> = ({ agent, isSelected, onClick, internalMessage }) => {
  const isWorking = agent.status === 'WORKING';
  const isThinking = agent.status === 'THINKING';
  const isAlert = agent.status === 'ALERT';
  
  const distFromHome = Math.sqrt(
    Math.pow(agent.currentPosition.x - agent.homePosition.x, 2) + 
    Math.pow(agent.currentPosition.y - agent.homePosition.y, 2)
  );
  
  const isSitting = (isWorking || isThinking || agent.status === 'IDLE') && distFromHome < 0.5;
  const isMoving = distFromHome > 1;

  const getStatusGlow = () => {
    if (isAlert) return 'shadow-[0_0_25px_rgba(239,68,68,0.5)] border-red-500/60';
    if (isThinking) return 'shadow-[0_0_25px_rgba(168,85,247,0.5)] border-purple-500/60';
    if (isWorking) return 'shadow-[0_0_25px_rgba(34,197,94,0.4)] border-green-500/60';
    return 'shadow-2xl border-white/20';
  };

  const getMovementClass = () => {
    if (!isMoving) return isSelected ? 'z-50 scale-110 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : 'hover:z-30';
    return agent.isFacingLeft ? 'walking-lean-left' : 'walking-lean-right';
  };

  return (
    <div 
      onClick={onClick}
      className={`absolute transition-all duration-[1500ms] ease-in-out cursor-pointer z-20 group ${getMovementClass()}`}
      style={{ 
        left: `${agent.currentPosition.x}%`, 
        top: `${agent.currentPosition.y}%`
      }}
    >
      <div className={`relative flex flex-col items-center ${isMoving ? 'animate-walk-bob' : ''}`}>
        
        {/* Interaction Bubble */}
        {internalMessage && (
          <div className="absolute -top-24 bg-white text-black text-[10px] font-black px-5 py-3 rounded-2xl rounded-bl-none chatter-bubble whitespace-nowrap z-[60] shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white transition-all scale-100 hover:scale-105">
             {internalMessage.text}
             <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white rotate-45"></div>
          </div>
        )}

        {/* Activity Tag */}
        <div className={`absolute -top-14 glass border border-white/30 text-[9px] px-4 py-1.5 rounded-full text-white font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all z-50 shadow-2xl backdrop-blur-3xl
          ${isSelected ? 'opacity-100 translate-y-[-8px]' : ''}`}>
           {agent.currentActivity}
        </div>

        {/* Character Visual Body */}
        <div className={`relative w-18 h-22 transition-transform duration-700 ${isSitting ? 'translate-y-3' : isMoving ? '' : 'animate-bounce-slow'}`}>
          
          {/* Head & Avatar */}
          <div className={`relative w-14 h-14 rounded-3xl border-2 glass overflow-hidden mx-auto z-10 transition-all duration-500 shadow-xl
            ${isSelected ? 'border-blue-400 scale-110' : 'border-white/20'}`}>
            <img src={agent.avatar} className="w-full h-full object-cover scale-110 transition-transform duration-500 group-hover:scale-125" />
            
            {/* Monitor Reflection/Glow on face */}
            {(isWorking || isThinking) && isSitting && (
              <div className={`absolute inset-0 opacity-50 mix-blend-overlay animate-pulse
                ${isWorking ? 'bg-blue-400' : 'bg-purple-500'}`}></div>
            )}
          </div>

          {/* Torso */}
          <div className={`w-14 h-12 bg-[#1a1a1e] border-x border-white/10 rounded-t-[1.5rem] mx-auto -mt-2 relative shadow-inner`}>
            {isWorking && isSitting && (
               <div className="absolute -bottom-1 -left-3 -right-3 flex justify-between px-2">
                  <div className="w-4 h-7 bg-zinc-800 rounded-full animate-type-left border border-white/10 shadow-lg"></div>
                  <div className="w-4 h-7 bg-zinc-800 rounded-full animate-type-right border border-white/10 shadow-lg"></div>
               </div>
            )}
          </div>

          {/* Office Chair */}
          {isSitting && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-18 h-16 glass border-t border-white/10 rounded-[2rem] -z-10 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2.5 h-8 bg-[#0a0a0c] border-x border-white/5"></div>
               <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-14 h-2.5 bg-black rounded-full shadow-2xl"></div>
            </div>
          )}

          {/* Legs */}
          {!isSitting && (
            <div className="flex justify-center gap-5 -mt-2">
               <div className={`w-4 h-7 bg-[#1a1a1e] rounded-full border border-white/5 shadow-md ${isMoving ? 'animate-leg-l' : ''}`}></div>
               <div className={`w-4 h-7 bg-[#1a1a1e] rounded-full border border-white/5 shadow-md ${isMoving ? 'animate-leg-r' : ''}`}></div>
            </div>
          )}
        </div>

        {/* Dynamic Shadow */}
        <div className={`bg-black/90 blur-xl rounded-full mt-6 transition-all duration-1000 
          ${isSitting ? 'w-24 h-5 scale-150 opacity-100' : isMoving ? 'w-12 h-3 opacity-40' : 'w-14 h-4 opacity-60'}`}></div>

        {/* Apple Style Floating Name Tag */}
        <div className={`mt-5 glass border px-5 py-2 rounded-2xl ${getStatusGlow()} transition-all duration-500 backdrop-blur-3xl shadow-2xl`}>
           <span className="text-[11px] font-black text-white tracking-[0.3em] uppercase">{agent.name}</span>
        </div>
      </div>
    </div>
  );
};

export default Character;
