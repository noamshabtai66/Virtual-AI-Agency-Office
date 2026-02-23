
import React, { useState } from 'react';
import { SecurityIssue, Agent } from '../types';
import { ShieldAlert, ShieldCheck, ShieldQuestion, Lock, Unlock, AlertTriangle, Activity, Eye, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SecurityCenterProps {
  issues: SecurityIssue[];
  agents: Agent[];
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({ issues, agents }) => {
  const [filter, setFilter] = useState<string>('All');

  const filteredIssues = issues.filter(issue => {
    if (filter === 'All') return true;
    if (filter === 'Open') return issue.status === 'OPEN' || issue.status === 'INVESTIGATING';
    if (filter === 'Critical') return issue.severity === 'CRITICAL';
    return true;
  });

  const threatLevel = issues.some(i => i.severity === 'CRITICAL' && i.status === 'OPEN') ? 'CRITICAL' : 
                     issues.some(i => i.severity === 'HIGH' && i.status === 'OPEN') ? 'HIGH' : 'STABLE';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Security Status Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 glass rounded-[2.5rem] p-8 border border-white/5 flex items-center gap-8 relative overflow-hidden">
          <div className={`absolute inset-0 opacity-5 pointer-events-none ${threatLevel === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-2xl
            ${threatLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-green-500/10 border-green-500/50 text-green-500'}`}>
            {threatLevel === 'CRITICAL' ? <ShieldAlert size={40} /> : <ShieldCheck size={40} />}
          </div>
          <div>
            <h2 className="text-white text-3xl font-black tracking-tighter uppercase">Security Status: {threatLevel}</h2>
            <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest mt-1">
              {threatLevel === 'CRITICAL' ? 'Immediate action required. Active breach detected.' : 'All systems monitored. No critical threats.'}
            </p>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Threats</span>
          <span className="text-4xl font-black text-white">{issues.filter(i => i.status !== 'PATCHED').length}</span>
        </div>

        <div className="glass rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Uptime Score</span>
          <span className="text-4xl font-black text-emerald-500">99.98%</span>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
        {['All', 'Open', 'Critical'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all
              ${filter === f ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Vulnerability Feed */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredIssues.map((issue, idx) => {
            const agent = agents.find(a => a.id === issue.detectedBy);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                key={issue.id}
                className={`glass rounded-3xl border p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center transition-all
                  ${issue.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-white/5 hover:border-white/10'}`}
              >
                {/* Severity Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                  ${issue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 
                    issue.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {issue.severity === 'CRITICAL' ? <AlertTriangle size={24} /> : <ShieldQuestion size={24} />}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded
                      ${issue.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-white/10 text-zinc-400'}`}>
                      {issue.severity}
                    </span>
                    <h3 className="text-white font-bold truncate">{issue.title}</h3>
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-3xl">{issue.description}</p>
                </div>

                {/* Metadata */}
                <div className="lg:w-64 flex flex-col gap-3 lg:items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 font-mono uppercase">Detected By</span>
                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                      <img src={agent?.avatar} className="w-4 h-4 rounded" alt="" />
                      <span className="text-[10px] text-zinc-300 font-bold">{agent?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 font-mono uppercase">Status</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest
                      ${issue.status === 'PATCHED' ? 'text-emerald-500' : 'text-yellow-500 animate-pulse'}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0">
                  <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                    <Eye size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Security Terminal Mockup */}
      <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="bg-zinc-950/50 p-4 border-b border-white/5 flex items-center gap-2">
          <Terminal size={14} className="text-emerald-500" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live Security Feed</span>
        </div>
        <div className="p-6 font-mono text-[11px] space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          <div className="text-emerald-500/60">[SYSTEM] Initializing Cyber Sentinel v4.0.0...</div>
          <div className="text-zinc-600">[INFO] Monitoring agent communication channels...</div>
          <div className="text-zinc-600">[INFO] Scanning for prompt injection patterns...</div>
          <div className="text-red-500/80">[ALERT] Suspicious activity detected in Agent "Content" sandbox.</div>
          <div className="text-zinc-600">[INFO] Isolating session ID: 882-XJ-99...</div>
          <div className="text-emerald-500/60">[SUCCESS] Threat neutralized. Integrity check passed.</div>
          <div className="text-zinc-700 animate-pulse">_</div>
        </div>
      </div>
    </div>
  );
};
