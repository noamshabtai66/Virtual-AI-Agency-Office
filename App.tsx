import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Agent, ChatMessage, OfficeState, Task, Memory, LogEntry, CronJob, Artifact, Goal, Position } from './types';
import { INITIAL_AGENTS, INITIAL_CRON_JOBS, INITIAL_GOALS, ROOMS } from './constants';
import Character from './components/Character';
import Desk from './components/Desk';
import OfficeLog from './components/OfficeLog';
import HeaderWidgets from './components/HeaderWidgets';
import OrgTree from './components/OrgTree';
import { getGeminiResponse } from './services/geminiService';

const SUPABASE_URL = 'https://ojejyiftczrvzcyioiff.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZWp5aWZ0Y3pydnpjeWlvaWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDkxODAsImV4cCI6MjA4NjkyNTE4MH0.Vp2fkvEXVNGAk8FvFabEKKAaI87qhIwhLfHS1UbfL5I';

const ROOM_THEMES: Record<string, string> = {
  CEO_OFFICE: 'rgba(234, 179, 8, 0.04)',
  WAR_ROOM: 'rgba(168, 85, 247, 0.04)',
  WORKING_AREA: 'rgba(59, 130, 246, 0.04)',
  LOUNGE: 'rgba(34, 197, 94, 0.04)',
};

// Supabase fetch helper
const fetchFromSupabase = async (table: string) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error(`Error fetching ${table}:`, e);
  }
  return [];
};

const App: React.FC = () => {
  const [state, setState] = useState<OfficeState>({
    agents: INITIAL_AGENTS,
    messages: [],
    tasks: [],
    goals: INITIAL_GOALS,
    memories: [],
    logs: [{ id: 'l1', timestamp: Date.now(), level: 'SYSTEM', source: 'KERNEL', message: 'Nexus OS Kernel V5.0 Booted Successfully.' }],
    cronJobs: INITIAL_CRON_JOBS,
    artifacts: [],
    internalMessages: [],
    selectedAgentId: null,
    activeTab: 'Dashboard',
  });

  const [isRecording, setIsRecording] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      const [agentsData, tasksData, logsData, goalsData, decisionsData, notesData] = await Promise.all([
        fetchFromSupabase('agents'),
        fetchFromSupabase('tasks'),
        fetchFromSupabase('activity_log'),
        fetchFromSupabase('goals'),
        fetchFromSupabase('decisions'),
        fetchFromSupabase('notes')
      ]);

      // Add currentPosition = homePosition for each agent, fallback to INITIAL_AGENTS
      const agentsWithPosition = agentsData.length > 0 
        ? agentsData.map((a: any) => ({
            ...a,
            homePosition: a.home_position || { x: 50, y: 50 },
            currentPosition: a.home_position || { x: 50, y: 50 }
          }))
        : INITIAL_AGENTS;

      setState(prev => ({
        ...prev,
        agents: agentsWithPosition,
        tasks: tasksData || prev.tasks,
        logs: logsData.length > 0 ? logsData.map((l: any) => ({
          id: String(l.id),
          timestamp: new Date(l.created_at).getTime(),
          level: l.level,
          source: l.source,
          message: l.message
        })) : prev.logs,
        goals: goalsData.length > 0 ? goalsData : prev.goals,
        decisions: decisionsData || prev.decisions || [],
        memories: notesData || prev.memories || []
      }));
    };

    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      <aside className="w-20 md:w-80 glass border-l border-white/5 flex flex-col z-50 shadow-[25px_0_60px_rgba(0,0,0,0.8)]">
        <div className="p-4 md:p-12 flex flex-col gap-1">
           <div className="text-white text-2xl md:text-4xl font-black tracking-tighter">NEXUS<span className="text-blue-500">.</span></div>
           <div className="text-[8px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-[0.5em] opacity-40 hidden md:block">Command Center</div>
        </div>

        <nav className="flex-1 px-2 md:px-8 space-y-1 overflow-y-auto custom-scrollbar">
           {[
             { id: 'Dashboard', label: 'לוח בקרה' },
             { id: 'Physical', label: 'משרד ויזואלי' },
             { id: 'Tasks', label: 'ניהול משימות' },
             { id: 'OrgTree', label: 'עץ ארגוני' },
             { id: 'Artifacts', label: 'ארכיון תוצרים' },
             { id: 'Memory', label: 'זיכרון ליבה' },
             { id: 'Cron', label: 'אוטומציות' },
             { id: 'Logs', label: 'לוגים חיים' },
             { id: 'Brain', label: 'מוח שני' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setState(s => ({ ...s, activeTab: tab.id as any }))}
               className={`w-full text-right px-2 md:px-6 py-2 md:py-4 text-[9px] md:text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all duration-300 group
                 ${state.activeTab === tab.id 
                   ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]' 
                   : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}
               `}
             >
                <div className="flex items-center justify-between">
                   <span className="hidden md:inline">{tab.label}</span>
                   <span className="md:hidden">{tab.label.charAt(0)}</span>
                   {state.activeTab === tab.id && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]"></div>}
                </div>
             </button>
           ))}
        </nav>

        <div className="p-4 md:p-10 bg-black/40 border-t border-white/5">
           <div className="flex justify-between items-center mb-2 md:mb-4">
              <div className="text-[8px] md:text-[10px] font-bold text-zinc-700 uppercase tracking-widest hidden md:block">Global Status</div>
              <div className="flex gap-1">
                 <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></div>
                 <div className="w-1 h-3 bg-green-500/40 rounded-full hidden md:block"></div>
              </div>
           </div>
           <div className="text-[8px] md:text-[9px] font-mono text-zinc-500 opacity-50 space-y-1 hidden md:block">
              <div>Uptime: 99.998%</div>
              <div>Active Agents: {state.agents.length}</div>
           </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 md:h-32 px-4 md:px-16 flex items-center justify-between z-40 relative border-b border-white/5">
           <div className="flex flex-col">
              <h1 className="text-white text-2xl md:text-4xl font-light tracking-tight">{state.activeTab}</h1>
              <div className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Strategic Control Layer Activated</div>
           </div>

           {/* HEADER WIDGETS - Clock, Weather, Agent Count */}
           <div className="hidden md:flex">
             <HeaderWidgets agentCount={state.agents.length} />
           </div>

           {/* VOICE COMMAND HUB */}
           <div className="flex items-center gap-2 md:gap-8">
              <div className="hidden md:flex flex-col items-end">
                 <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Global Search</span>
                 <span className="text-white/40 text-xs font-mono">⌘K for anything</span>
              </div>
              <button 
                onClick={handleVoiceCommand}
                className={`h-10 md:h-16 px-4 md:px-8 rounded-2xl border transition-all duration-500 flex items-center gap-2 md:gap-4
                  ${isRecording ? 'bg-red-500/20 border-red-500/50 shadow-2xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className={`w-2 md:w-3 h-2 md:h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`}></div>
                <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-widest hidden md:inline">
                  {isRecording ? 'Recording Session...' : 'OpenClaw Voice'}
                </span>
              </button>
           </div>
        </header>

        {/* DYNAMIC TAB CONTENT */}
        <section className="flex-1 p-4 md:p-16 overflow-y-auto custom-scrollbar relative z-10">
           
           {/* 1. DASHBOARD */}
           {state.activeTab === 'Dashboard' && (
              <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                 {/* Top Row KPI Cards */}
                 <div className="grid grid-cols-4 gap-8">
                    {[
                      { label: 'Agent Uptime', val: '99.9%', color: 'text-green-500' },
                      { label: 'Task Efficiency', val: `${Math.round((state.tasks.filter((t: any) => t.status === 'done').length / Math.max(state.tasks.length, 1)) * 100)}%`, color: 'text-blue-500' },
                      { label: 'System Memory', val: '2.4TB', color: 'text-purple-500' },
                      { label: 'Active Sessions', val: `${state.agents.length}`, color: 'text-white' }
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
                          {state.goals.slice(0, 3).map((goal: any) => (
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
                    
                    {/* System Pulse */}
                    <div className="glass rounded-2xl md:rounded-[3rem] p-6 md:p-12 border border-white/10">
                       <h2 className="text-white text-lg md:text-xl font-bold mb-4 md:mb-6">System Pulse</h2>
                       <div className="space-y-3 md:space-y-4">
                          {[
                             { label: 'API', status: 'online' },
                             { label: 'Database', status: 'online' },
                             { label: 'Agents', status: 'active' },
                             { label: 'Cron Jobs', status: 'running' }
                          ].map(item => (
                            <div key={item.label} className="flex justify-between items-center">
                               <span className="text-zinc-500 text-xs md:text-sm">{item.label}</span>
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                  <span className="text-green-500 text-xs">{item.status}</span>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* 2. TASKS */}
           {state.activeTab === 'Tasks' && (
              <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h2 className="text-white text-2xl md:text-3xl font-bold mb-8">ניהול משימות</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full">
                       <thead>
                          <tr className="text-zinc-600 text-xs uppercase tracking-widest border-b border-white/10">
                             <th className="text-right pb-4 pr-4">משימה</th>
                             <th className="text-right pb-4 pr-4">סטטוס</th>
                             <th className="text-right pb-4 pr-4">אחראי</th>
                             <th className="text-right pb-4">עדיפות</th>
                          </tr>
                       </thead>
                       <tbody>
                          {state.tasks.map((task: any) => (
                            <tr key={task.id} className="border-b border-white/5 hover:bg-white/5">
                               <td className="py-4 pr-4 text-white font-medium">{task.title}</td>
                               <td className="py-4 pr-4">
                                  <span className={`px-3 py-1 rounded-full text-xs ${
                                    task.status === 'done' ? 'bg-green-500/20 text-green-400' :
                                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-zinc-500/20 text-zinc-400'
                                  }`}>
                                    {task.status}
                                  </span>
                               </td>
                               <td className="py-4 pr-4 text-zinc-400">{task.owner || '-'}</td>
                               <td className="py-4">
                                  <span className={`text-xs ${
                                    task.priority === 'high' ? 'text-red-400' :
                                    task.priority === 'medium' ? 'text-yellow-400' :
                                    'text-zinc-500'
                                  }`}>
                                    {task.priority}
                                  </span>
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
              <div className="max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-top-4 duration-1000">
                 <h2 className="text-white text-2xl md:text-3xl font-bold mb-8 md:mb-12">עץ ארגוני - Neural Hierarchy</h2>
                 <OrgTree agents={state.agents as Agent[]} />
              </div>
           )}

           {/* 4. PHYSICAL OFFICE - 3D Virtual */}
           {state.activeTab === 'Physical' && (
             <div className="absolute inset-0 flex items-center justify-center office-grid"
                style={{ transform: `rotateX(${1 + mousePos.y * 0.03}deg) rotateY(${mousePos.x * 0.03}deg)` }}>
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
                        style={{ left: `${(agent.currentPosition || agent.homePosition)?.x || 50}%`, top: `${(agent.currentPosition || agent.homePosition)?.y || 50}%`, transform: 'translate(-50%, -50%)' }}>
                        <Character 
                          agent={agent} 
                          isSelected={state.selectedAgentId === agent.id}
                          onClick={() => setState(s => ({ ...s, selectedAgentId: agent.id }))} />
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* 5. LOGS */}
           {state.activeTab === 'Logs' && (
             <div className="max-w-4xl mx-auto animate-in fade-in">
                <h2 className="text-white text-2xl md:text-3xl font-bold mb-8">לוגים חיים</h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                   {state.logs.length === 0 ? (
                     <div className="text-zinc-500 text-center py-12">אין לוגים עדיין</div>
                   ) : (
                     state.logs.slice(0, 50).map((log: any) => (
                       <div key={log.id} className="glass p-4 rounded-xl border border-white/10 flex gap-4">
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            log.level === 'ERROR' ? 'bg-red-500' : 
                            log.level === 'WARN' ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-zinc-600 text-xs">{new Date(log.timestamp).toLocaleTimeString('he-IL')}</span>
                                <span className="text-blue-400 text-xs font-bold">{log.source}</span>
                             </div>
                             <div className="text-white text-sm truncate">{log.message}</div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}

           {/* 5B. BRAIN - 2nd Brain */}
           {state.activeTab === 'Brain' && (
             <div className="max-w-4xl mx-auto animate-in fade-in">
                <h2 className="text-white text-2xl md:text-3xl font-bold mb-8">מוח שני - 2nd Brain</h2>
                <div className="glass p-6 md:p-8 rounded-2xl border border-white/10 mb-6">
                   <div className="text-zinc-400 text-sm mb-4">📓 יומן יומי</div>
                   <div className="text-white font-medium">ברוך הבא למוח השני שלך!</div>
                   <div className="text-zinc-500 text-xs mt-2">כאן נשמרים כל הרעיונות, ההחלטות והתובנות.</div>
                </div>
                <div className="space-y-4">
                   <div className="glass p-4 md:p-6 rounded-xl border border-white/5">
                      <div className="text-white font-semibold text-sm">💡 רעיונות</div>
                      {state.memories && state.memories.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {state.memories.slice(0, 5).map((m: any, i: number) => (
                            <div key={i} className="text-zinc-400 text-xs border-l-2 border-blue-500 pl-2">{m.content || m.title || JSON.stringify(m)}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-xs mt-1">אין רעיונות עדיין</div>
                      )}
                   </div>
                   <div className="glass p-4 md:p-6 rounded-xl border border-white/5">
                      <div className="text-white font-semibold text-sm">📝 החלטות</div>
                      {state.decisions && state.decisions.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {state.decisions.slice(0, 5).map((d: any, i: number) => (
                            <div key={i} className="text-zinc-400 text-xs border-l-2 border-green-500 pl-2">{d.title || d.content || JSON.stringify(d)}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-xs mt-1">אין החלטות עדיין</div>
                      )}
                   </div>
                   <div className="glass p-4 md:p-6 rounded-xl border border-white/5">
                      <div className="text-white font-semibold text-sm">🧠 ידע</div>
                      {state.memories && state.memories.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {state.memories.slice(0, 5).map((m: any, i: number) => (
                            <div key={i} className="text-zinc-400 text-xs border-l-2 border-purple-500 pl-2">{m.content?.substring(0, 100) || m.category || 'ידע'}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-xs mt-1">אין ידע עדיין</div>
                      )}
                   </div>
                </div>
             </div>
           )}

           {/* 6. MEMORY */}
           {state.activeTab === 'Memory' && (
             <div className="max-w-4xl mx-auto animate-in fade-in">
                <h2 className="text-white text-3xl font-bold mb-12">זיכרון ליבה</h2>
                <div className="space-y-6">
                   {state.memories.length === 0 ? (
                     <div className="text-zinc-500 text-center py-12">אין זיכרונות עדיין</div>
                   ) : (
                     state.memories.map((mem: any) => (
                       <div key={mem.id} className="glass p-8 rounded-[2rem] border border-white/10">
                          <div className="text-white font-semibold mb-2">{mem.content}</div>
                          <div className="text-zinc-600 text-xs">Importance: {mem.importance}</div>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}

           {/* 7. CRON */}
           {state.activeTab === 'Cron' && (
             <div className="max-w-4xl mx-auto animate-in fade-in">
                <h2 className="text-white text-3xl font-bold mb-12">אוטומציות</h2>
                <div className="space-y-4">
                   {state.cronJobs.map((cron: any) => (
                     <div key={cron.id} className="glass p-6 rounded-2xl border border-white/10 flex justify-between items-center">
                        <div>
                           <div className="text-white font-semibold">{cron.name}</div>
                           <div className="text-zinc-500 text-sm">{cron.schedule}</div>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* 8. ARTIFACTS */}
           {state.activeTab === 'Artifacts' && (
             <div className="max-w-4xl mx-auto animate-in fade-in">
                <h2 className="text-white text-3xl font-bold mb-12">ארכיון תוצרים</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {state.artifacts.length === 0 ? (
                     <div className="text-zinc-500 text-center py-12 col-span-2">אין תוצרים עדיין</div>
                   ) : (
                     state.artifacts.map((art: any) => (
                       <div key={art.id} className="glass p-6 rounded-2xl border border-white/10">
                          <div className="text-white font-semibold">{art.title}</div>
                          <div className="text-zinc-500 text-sm mt-2">{art.type}</div>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}
        </section>
      </main>
    </div>
  );
};

export default App;
