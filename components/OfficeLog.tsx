
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface OfficeLogProps {
  messages: ChatMessage[];
}

const OfficeLog: React.FC<OfficeLogProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
      {messages.length === 0 && (
        <div className="text-slate-500 text-center italic mt-10">
          המשרד שקט כרגע... בחר סוכן והתחל שיחה.
        </div>
      )}
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}
        >
          <div className="flex items-center gap-2 mb-1 px-1">
             <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
             <span className={`text-xs font-bold ${msg.role === 'user' ? 'text-blue-400' : 'text-emerald-400'}`}>
                {msg.senderName}
             </span>
          </div>
          <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md transition-all
            ${msg.role === 'user' 
              ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none' 
              : 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 rounded-tl-none'}`}
          >
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OfficeLog;
