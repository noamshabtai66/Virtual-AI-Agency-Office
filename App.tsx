
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Agent, ChatMessage, OfficeState, Task, Memory, LogEntry, CronJob, Artifact, Goal, Position } from './types';
import { INITIAL_AGENTS, INITIAL_CRON_JOBS, INITIAL_GOALS, ROOMS } from './constants';
import Character from './components/Character';
import Desk from './components/Desk';
import OfficeLog from './components/OfficeLog';
import { getGeminiResponse } from './services/geminiService';

const ROOM_THEMES: Record<string, string> = {
  CEO_OFFICE: 'rgba(234, 179, 8, 0.04)',
  WAR_ROOM: 'rgba(168, 85, 247, 0.04)',
  WORKING_AREA: 'rgba(59, 130, 246, 0.04)',
  LOUNGE: 'rgba(34, 197, 94, 0.04)',
};

const App: React.FC = () => {
  const [state, setState] = useState<OfficeState>({
    agents: INITIAL_AGENTS,
    messages: [],
    tasks: [
      { id: 't1', title: 'Global Memory Consolidation', assigneeId: 'sage', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2024-12-30', tags: ['Backend', 'Core'] },
      { id: 't2', title: 'Refactor UI State Machine', assigneeId: 'dev', status: 'WORKING on it', priority: 'MEDIUM', dueDate: '2024-12-28', tags: ['Frontend'] } as any,
      { id: 't3', title: 'Legal Audit of Prompt Injections', assigneeId: 'opi-ceo', status: 'STUCK', priority: 'HIGH', dueDate: '2024-12-25', tags: ['Security'] }
    ],
    goals: INITIAL_GOALS,
    memories: [
      { id: 'm1', agentId: 'sage', content: 'Manager prefers high-density data visualizations.', importance: 5, timestamp: Date.now() - 5000000 },
      { id: 'm2', agentId: 'dev', content: 'Tailwind config updated for 2.5K resolution support.', importance: 3, timestamp: Date.now() - 2000000 }
    ],
    logs: [{ id: 'l1', timestamp: Date.now(), level: 'SYSTEM', source: 'KERNEL', message: 'Nexus OS Kernel V5.0 Booted Successfully.' }],
    cronJobs: INITIAL_CRON_JOBS,
    artifacts: [
      { id: 'a1', title: 'Strategic_Roadmap_Q1.pdf', type: 'DOCUMENT', creatorId: 'opi-ceo', timestamp: Date.now() - 86400000, content: 'Focus on scaling agent autonomy and multi-agent coordination.' }
    ],
    internalMessages: [],
    selectedAgentId: null,
    activeTab: 'Dashboard',
  });

  const [isRecording, setIsRecording] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({
      x: (e.clientX / window.innerWidth - 0.5) * 20,
      y: (e.clientY / window.innerHeight - 0.5) * 20
    });
  };

  const handleVoiceCommand = () => {
    if (isRecording) return;
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const fakeTranscription = "OPI, set a high priority task for Dev to optimize the Org Tree rendering and update the roadmap.";
      const newLog: LogEntry = { id: Date.now().toString(), timestamp: Date.now(), level: 'INFO', source: 'VOICE', message: `Autonomous Processing: ${fakeTranscription}` };
      const newTask: Task = { 
        id: `t-${Date.now()}`, 
        title: 'Optimize Org Tree Rendering', 
        assigneeId: 'dev', 
        status: 'PENDING', 
        priority: 'HIGH', 
        dueDate: '2024-12-31' 
      };
      setState(prev => ({ 
        ...prev, 
        logs: [newLog, ...prev.logs], 
        tasks: [newTask, ...prev.tasks],
        activeTab: 'Tasks'
      }));
    }, 3000);
  };

  const handleSendMessage = async (text: string, agentId: string) => {
    if (!text.trim() || isTyping) return;
    const agent = state.agents.find(a => a.id === agentId)!;
    setIsTyping(true);
    const response = await getGeminiResponse(text, agent.systemPrompt);
    const agentMsg: ChatMessage = { id: Date.now().toString(), senderId: agent.id, senderName: agent.name, text: response, timestamp: Date.now(), role: 'model' };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, agentMsg],
      agents: prev.agents.map(a => a.id === agent.id ? { ...a, status: 'THINKING' } : a)
    }));
    setIsTyping(false);
    setTimeout(() => {
      setState(prev => ({ ...prev, agents: prev.agents.map(a => a.id === agent.id ? { ...a, status: 'IDLE' } : a) }));
    }, 1500);
  };

  return (
    <div className="h-screen w-screen flex bg-[#030305] text-zinc-400 overflow-hidden font-sans rtl selection:bg-blue-500/20" onMouseMove={handleMouseMove}>
      
      {/* GLOBAL NAVIGATION SIDEBAR */}
      <aside className="w-80 glass border-l border-white/5 flex flex-col z-50 shadow-[25px_0_60px_rgba(0,0,0,0.8)]">
        <div className="p-12 flex flex-col gap-1">
           <div className="text-white text-4xl font-black tracking-tighter">NEXUS<span className="text-blue-500">.</span></div>
           <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.5em] opacity-40">Command Center</div>
        </div>

        <nav className="flex-1 px-8 space-y-1 overflow-y-auto custom-scrollbar">
           {[
             { id: 'Dashboard', label: 'לוח בקרה' },
             { id: 'Physical', label: 'משרד ויזואלי' },
             { id: 'Tasks', label: 'ניהול משימות' },
             { id: 'OrgTree', label: 'עץ ארגוני' },
             { id: 'Artifacts', label: 'ארכיון תוצרים' },
             { id: 'Memory', label: 'זיכרון ליבה' },
             { id: 'Cron', label: 'אוטומציות (Cron)' },
             { id: 'Logs', label: 'לוגים חיים' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setState(s => ({ ...s, activeTab: tab.id as any }))}
               className={`w-full text-right px-6 py-4 text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all duration-300 group
                 ${state.activeTab === tab.id 
                   ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]' 
                   : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}`}
             >
                <div className="flex items-center justify-between">
                   <span>{tab.label}</span>
                   {state.activeTab === tab.id && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]"></div>}
                </div>
             </button>
           ))}
        </nav>

        <div className="p-10 bg-black/40 border-t border-white/5">
           <div className="flex justify-between items-center mb-4">
              <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Global Status</div>
              <div className="flex gap-1">
                 <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></div>
                 <div className="w-1 h-3 bg-green-500/40 rounded-full"></div>
              </div>
           </div>
           <div className="text-[9px] font-mono text-zinc-500 opacity-50 space-y-1">
              <div>Uptime: 99.998%</div>
              <div>Active Agents: {state.agents.length}</div>
           </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <header className="h-32 px-16 flex items-center justify-between z-40 relative border-b border-white/5">
           <div className="flex flex-col">
              <h1 className="text-white text-4xl font-light tracking-tight">{state.activeTab}</h1>
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Strategic Control Layer Activated</div>
           </div>

           {/* VOICE COMMAND HUB */}
           <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Global Search</span>
                 <span className="text-white/40 text-xs font-mono">⌘K for anything</span>
              </div>
              <button 
                onClick={handleVoiceCommand}
                className={`h-16 px-8 rounded-2xl border transition-all duration-500 flex items-center gap-4
                  ${isRecording ? 'bg-red-500/20 border-red-500/50 shadow-2xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`}></div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  {isRecording ? 'Recording Session...' : 'OpenClaw Voice'}
                </span>
              </button>
           </div>
        </header>

        {/* DYNAMIC TAB CONTENT */}
        <section className="flex-1 p-16 overflow-y-auto custom-scrollbar relative z-10">
           
           {/* 1. DASHBOARD */}
           {state.activeTab === 'Dashboard' && (
              <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                 {/* Top Row KPI Cards */}
                 <div className="grid grid-cols-4 gap-8">
                    {[
                      { label: 'Agent Uptime', val: '99.9%', color: 'text-green-500' },
                      { label: 'Task Efficiency', val: '84%', color: 'text-blue-500' },
                      { label: 'System Memory', val: '2.4TB', color: 'text-purple-500' },
                      { label: 'Active Sessions', val: '142', color: 'text-white' }
                    ].map(card => (
                      <div key={card.label} className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all">
                         <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">{card.label}</div>
                         <div className={`text-4xl font-black ${card.color}`}>{card.val}</div>
                      </div>
                    ))}
                 </div>

                 {/* Middle Row: Goals & Pulse */}
                 <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 glass rounded-[3rem] p-12 border border-white/10 space-y-10">
                       <h2 className="text-white text-2xl font-bold">Company Goals (North Star)</h2>
                       <div className="space-y-8">
                          {state.goals.map(goal => (
                            <div key={goal.id} className="space-y-3">
                               <div className="flex justify-between items-end">
                                  <span className="text-white font-bold">{goal.title}</span>
                                  <span className="text-[10px] font-mono text-zinc-500">{goal.progress}%</span>
                               </div>
                               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-1000" style={{width: `${goal.progress}%`}}></div>
                                </div>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="glass rounded-[3rem] p-12 border border-white/10 flex flex-col gap-6">
                       <h2 className="text-white text-xl font-bold">The Pulse</h2>
                       <div className="space-y-4">
                          {state.logs.slice(0, 5).map(log => (
                            <div key={log.id} className="flex gap-4 border-r border-white/5 pr-4">
                               <div className={`w-1 h-auto rounded-full ${log.level === 'SYSTEM' ? 'bg-blue-500' : 'bg-zinc-800'}`}></div>
                               <div className="flex-1">
                                  <div className="text-[10px] font-bold text-zinc-600">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                  <div className="text-xs text-white/70 line-clamp-2">{log.message}</div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* 2. TASK BOARD (Monday Style) */}
           {state.activeTab === 'Tasks' && (
              <div className="max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                 <div className="flex justify-between items-center mb-10">
                    <h2 className="text-white text-3xl font-bold">Master Task Board</h2>
                    <button className="px-8 py-3 bg-blue-600 rounded-xl text-[11px] font-bold text-white uppercase tracking-widest hover:bg-blue-500 transition-all">+ New Item</button>
                 </div>
                 <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                    <table className="w-full text-right border-collapse">
                       <thead className="bg-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          <tr>
                             <th className="p-6">Item Name</th>
                             <th className="p-6">Assignee</th>
                             <th className="p-6">Status</th>
                             <th className="p-6">Priority</th>
                             <th className="p-6">Due Date</th>
                             <th className="p-6">Tags</th>
                          </tr>
                       </thead>
                       <tbody className="text-sm divide-y divide-white/5">
                          {state.tasks.map(task => (
                            <tr key={task.id} className="hover:bg-white/[0.02] transition-colors group">
                               <td className="p-6 text-white font-medium">{task.title}</td>
                               <td className="p-6">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                        <img src={state.agents.find(a => a.id === task.assigneeId)?.avatar} className="w-full h-full" />
                                     </div>
                                     <span className="text-zinc-400">{state.agents.find(a => a.id === task.assigneeId)?.name}</span>
                                  </div>
                               </td>
                               <td className="p-6">
                                  <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest
                                    ${task.status === 'DONE' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                     {task.status}
                                  </span>
                               </td>
                               <td className="p-6">
                                  <span className={`text-[9px] font-bold uppercase ${task.priority === 'HIGH' ? 'text-red-500' : 'text-zinc-600'}`}>
                                     {task.priority}
                                  </span>
                               </td>
                               <td className="p-6 text-zinc-500 font-mono text-[11px]">{task.dueDate}</td>
                               <td className="p-6">
                                  <div className="flex gap-2">
                                     {task.tags?.map(t => <span key={t} className="text-[8px] bg-white/5 px-2 py-1 rounded text-zinc-400 uppercase">{t}</span>)}
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* 3. ORG TREE */}
           {state.activeTab === 'OrgTree' && (
              <div className="max-w-6xl mx-auto h-full flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
                 <h2 className="text-white text-3xl font-bold mb-20">Neural Organization Hierarchy</h2>
                 
                 {/* OPI - CEO */}
                 <div className="flex flex-col items-center gap-20">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-24 h-24 rounded-3xl glass border-2 border-blue-500/40 p-1 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                          <img src={state.agents.find(a => a.id === 'opi-ceo')?.avatar} className="w-full h-full rounded-2xl" />
                       </div>
                       <div className="text-center">
                          <div className="text-white font-black uppercase tracking-widest">OPI</div>
                          <div className="text-[9px] text-blue-500 font-bold uppercase">Executive Intelligence</div>
                       </div>
                    </div>

                    <div className="flex gap-32 relative">
                       {/* Connection Lines (Simplified) */}
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-px h-10 bg-white/10"></div>
                       <div className="absolute -top-10 left-[20%] right-[20%] h-px bg-white/10"></div>

                       {state.agents.filter(a => a.parentId === 'opi-ceo').map(agent => (
                         <div key={agent.id} className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl glass border border-white/20 p-1">
                               <img src={agent.avatar} className="w-full h-full rounded-xl" />
                            </div>
                            <div className="text-center">
                               <div className="text-zinc-300 font-bold text-xs uppercase tracking-widest">{agent.name}</div>
                               <div className="text-[8px] text-zinc-600 font-bold uppercase">{agent.role}</div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {/* 4. PHYSICAL OFFICE */}
           {state.activeTab === 'Physical' && (
             <div className="absolute inset-0 flex items-center justify-center office-grid"
                style={{ transform: `rotateX(${1 + mousePos.y * 0.05}deg) rotateY(${mousePos.x * 0.05}deg)` }}>
                <div className="relative w-full h-full max-w-[1400px] perspective-2000">
                   {ROOMS.map(room => (
                     <div key={room.id} 
                        className="absolute room-floor rounded-[4rem] p-12 border border-white/5 transition-all"
                        style={{ 
                          left: `${room.x}%`, top: `${room.y}%`, 
                          width: `${room.w}%`, height: `${room.h}%`,
                          backgroundColor: ROOM_THEMES[room.id]
                        }}>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">{room.name}</div>
                     </div>
                   ))}
                   {state.agents.map(agent => (
                     <div key={agent.id} className="absolute z-20 transition-all duration-1000" 
                        style={{ left: `${agent.currentPosition.x}%`, top: `${agent.currentPosition.y}%`, transform: 'translate(-50%, -50%)' }}>
                        {agent.currentPosition.x === agent.homePosition.x && <Desk agent={agent} />}
                        <Character 
                          agent={agent} 
                          isSelected={state.selectedAgentId === agent.id}
                          onClick={() => setState(s => ({ ...s, selectedAgentId: agent.id }))} />
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* 5. CRON MANAGER */}
           {state.activeTab === 'Cron' && (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                 <h2 className="text-white text-3xl font-bold mb-10">Automation Pulse (Cron)</h2>
                 <div className="grid grid-cols-1 gap-6">
                    {state.cronJobs.map(job => (
                      <div key={job.id} className="glass p-10 rounded-[2.5rem] border border-white/5 flex items-center justify-between group hover:border-blue-500/20 transition-all">
                         <div className="flex gap-8 items-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border
                              ${job.lastRunStatus === 'RUNNING' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
                               <div className={`w-4 h-4 rounded-full ${job.lastRunStatus === 'RUNNING' ? 'bg-blue-500 animate-ping' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`}></div>
                            </div>
                            <div>
                               <h3 className="text-white text-xl font-bold">{job.name}</h3>
                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{job.description}</p>
                            </div>
                         </div>
                         <div className="flex gap-12 text-right">
                            <div>
                               <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Interval</div>
                               <div className="text-sm text-zinc-300 font-mono">{job.interval}s</div>
                            </div>
                            <div>
                               <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Next Run</div>
                               <div className="text-sm text-zinc-300 font-mono">{new Date(job.nextRun).toLocaleTimeString()}</div>
                            </div>
                            <button className="px-6 py-2 bg-white/5 rounded-xl text-[10px] font-bold text-white uppercase hover:bg-white/10 border border-white/5 transition-all">Manual Run</button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           )}

           {/* FALLBACK TABS */}
           {['Artifacts', 'Memory', 'Logs'].includes(state.activeTab) && (
             <div className="flex items-center justify-center h-full opacity-30 italic text-zinc-500">
                Functional components for {state.activeTab} are live in the background monitor.
             </div>
           )}

        </section>

        {/* AGENT INTERACTION OVERLAY (CRM PEAK) */}
        <div className={`absolute bottom-0 inset-x-0 z-[100] transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
          ${state.selectedAgentId ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="glass h-[550px] m-10 rounded-[4rem] border border-white/20 shadow-[0_50px_100px_rgba(0,0,0,0.9)] flex overflow-hidden">
             
             {/* LEFT: AGENT CRM INFO */}
             <div className="w-[400px] border-l border-white/10 p-16 bg-black/40 flex flex-col items-center text-center">
                {state.selectedAgentId && (() => {
                  const a = state.agents.find(x => x.id === state.selectedAgentId)!;
                  return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
                       <div className="relative">
                          <div className="w-32 h-32 rounded-[2.5rem] border-2 border-white/20 p-2 shadow-2xl mx-auto">
                             <img src={a.avatar} className="w-full h-full rounded-2xl" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center text-[10px] font-black text-black">
                             99
                          </div>
                       </div>
                       <div>
                          <h3 className="text-white text-3xl font-bold tracking-tight uppercase">{a.name}</h3>
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2">{a.role}</div>
                       </div>
                       <p className="text-sm text-zinc-500 leading-relaxed italic">"{a.description}"</p>
                       <div className="flex flex-wrap justify-center gap-2">
                          {a.expertise.map(exp => <span key={exp} className="text-[8px] border border-white/10 px-3 py-1.5 rounded-full text-zinc-400 uppercase tracking-widest">{exp}</span>)}
                       </div>
                       <button onClick={() => setState(s => ({ ...s, selectedAgentId: null }))}
                         className="w-full py-5 rounded-2xl bg-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] hover:bg-white/10 transition-all border border-white/5 active:scale-95">
                         Close Interface
                       </button>
                    </div>
                  );
                })()}
             </div>

             {/* RIGHT: CHAT LOG & INPUT */}
             <div className="flex-1 p-16 flex flex-col bg-gradient-to-br from-[#0a0a0c] to-black">
                <div className="flex-1 overflow-hidden relative">
                   <OfficeLog messages={state.messages.filter(m => m.senderId === 'user' || m.senderId === state.selectedAgentId)} />
                   <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0a0c] to-transparent pointer-events-none"></div>
                </div>
                <div className="pt-10 flex gap-6">
                   <input 
                     type="text" value={inputText} 
                     onChange={e => setInputText(e.target.value)} 
                     onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputText, state.selectedAgentId!)}
                     placeholder={`Command ${state.agents.find(a => a.id === state.selectedAgentId)?.name}...`}
                     className="flex-1 bg-black/60 border border-white/10 rounded-[1.5rem] px-10 py-5 text-sm text-white focus:border-blue-500/50 outline-none transition-all" />
                   <button onClick={() => handleSendMessage(inputText, state.selectedAgentId!)} disabled={isTyping}
                     className="bg-blue-600 hover:bg-blue-500 px-12 rounded-[1.5rem] text-[11px] font-bold text-white uppercase tracking-widest shadow-2xl transition-all active:scale-95">
                     {isTyping ? 'Syncing...' : 'Transmit'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
