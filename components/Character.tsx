
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
  
  if (!agent.currentPosition || !agent.homePosition) return null;

  const distFromHome = Math.sqrt(
    Math.pow(agent.currentPosition.x - agent.homePosition.x, 2) + 
    Math.pow(agent.currentPosition.y - agent.homePosition.y, 2)
  );
  
  const isSitting = (isWorking || isThinking || agent.status === 'IDLE') && distFromHome < 0.5;
  const isMoving = distFromHome > 1;

  const getStatusGlow = () => {
    if (isAlert) return 'shadow-[0_0_20px_rgba(239,68,68,0.5)] border-red-500/40';
    if (isThinking) return 'shadow-[0_0_20px_rgba(168,85,247,0.5)] border-purple-500/40';
    if (isWorking) return 'shadow-[0_0_20px_rgba(34,197,94,0.4)] border-green-500/40';
    return isSelected ? 'shadow-[0_0_30px_rgba(59,130,246,0.4)] border-blue-500/40' : 'shadow-lg border-white/10';
  };

  const getMovementClass = () => {
    if (!isMoving) return isSelected ? 'z-50 scale-110' : 'hover:z-30';
    return agent.isFacingLeft ? 'walking-lean-left' : 'walking-lean-right';
  };

  return (
    <div 
      onClick={onClick}
      className={`absolute transition-all duration-[1500ms] ease-in-out cursor-pointer z-20 group ${getMovementClass()} transform-style-preserve-3d`}
      style={{ 
        left: `${agent.currentPosition.x}%`, 
        top: `${agent.currentPosition.y}%`,
        filter: isSelected ? 'none' : 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))'
      }}
    >
      <div className={`relative flex flex-col items-center ${isMoving ? 'animate-walk-bob' : ''}`}>
        
        {/* Chatter Bubble (Social Presence) */}
        {(internalMessage || (isThinking && Math.random() > 0.85)) && (
          <div className="absolute -top-24 bg-white/95 text-black text-[9px] font-black px-4 py-2.5 rounded-2xl rounded-bl-none chatter-bubble whitespace-nowrap z-[60] shadow-xl border border-white transition-all scale-100 hover:scale-105 animate-in fade-in zoom-in duration-300">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                {internalMessage?.text || "Processing..."}
             </div>
             <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-white"></div>
          </div>
        )}

        {/* Activity Tag */}
        <div className={`absolute -top-12 glass border border-white/30 text-[8px] px-4 py-1.5 rounded-full text-white font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all z-50 shadow-xl backdrop-blur-xl
          ${isSelected ? 'opacity-100 translate-y-[-8px]' : ''}`}>
           {agent.currentActivity}
        </div>

        {/* Character Visual Body */}
        <div className={`relative w-14 h-18 transition-transform duration-700 ${isSitting ? 'translate-y-3' : isMoving ? '' : 'animate-bounce-slow'}`}>
          
          {/* Head & Avatar */}
          <div className={`relative w-12 h-12 rounded-[1.5rem] border glass overflow-hidden mx-auto z-10 transition-all duration-500 shadow-md
            ${isSelected ? 'border-blue-400 scale-105' : 'border-white/10'}`}>
            <img src={agent.avatar} className="w-full h-full object-cover scale-110 transition-transform duration-500 group-hover:scale-125" />
            
            {/* Monitor Reflection/Glow on face */}
            {(isWorking || isThinking) && isSitting && (
              <div className={`absolute inset-0 opacity-40 mix-blend-overlay animate-pulse
                ${isWorking ? 'bg-blue-400' : 'bg-purple-500'}`}></div>
            )}
          </div>
          
          {/* Screen Glow Effect (Living Office) */}
          {(isWorking || isThinking) && isSitting && (
             <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow z-0"></div>
          )}

          {/* Torso */}
          <div className={`w-12 h-10 bg-[#1a1a1e] border-x border-white/5 rounded-t-[1.5rem] mx-auto -mt-3 relative shadow-inner`}>
            {isWorking && isSitting && (
               <div className="absolute -bottom-2 -left-3 -right-3 flex justify-between px-1.5">
                  <div className="w-4 h-6 bg-zinc-800 rounded-full animate-type-left border border-white/5 shadow-lg"></div>
                  <div className="w-4 h-6 bg-zinc-800 rounded-full animate-type-right border border-white/5 shadow-lg"></div>
               </div>
            )}
          </div>

          {/* Legs */}
          {!isSitting && (
            <div className="flex justify-center gap-5 -mt-1.5">
               <div className={`w-4 h-6 bg-[#1a1a1e] rounded-full border border-white/5 shadow-md ${isMoving ? 'animate-leg-l' : ''}`}></div>
               <div className={`w-4 h-6 bg-[#1a1a1e] rounded-full border border-white/5 shadow-md ${isMoving ? 'animate-leg-r' : ''}`}></div>
            </div>
          )}
        </div>

        {/* Dynamic Shadow */}
        <div className={`bg-black/80 blur-xl rounded-full mt-6 transition-all duration-1000 
          ${isSitting ? 'w-24 h-6 scale-150 opacity-100' : isMoving ? 'w-12 h-4 opacity-40' : 'w-16 h-5 opacity-60'}`}></div>

        {/* Apple Style Floating Name Tag */}
        <div className={`mt-5 glass border px-5 py-2 rounded-2xl ${getStatusGlow()} transition-all duration-500 backdrop-blur-xl shadow-lg`}>
           <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">{agent.name}</span>
        </div>
      </div>
    </div>
  );
};

export default Character;
