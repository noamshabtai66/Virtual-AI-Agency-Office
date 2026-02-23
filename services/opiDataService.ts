// OPI Data Service - Maps Office types to OPI Supabase schema
import { supabase } from './supabaseService';

// Office Types (from types.ts)
export interface OfficeAgent {
  id: string;
  name: string;
  role: string;
  room: string;
  status: string;
  mood: string;
  avatar: string;
  description: string;
  systemPrompt?: string;
  currentActivity?: string;
  homePosition?: { x: number; y: number };
  currentPosition?: { x: number; y: number };
  isFacingLeft?: boolean;
  parentId?: string;
  trustScore?: number;
  expertise?: string[];
}

export interface OfficeTask {
  id: string;
  title: string;
  assigneeId: string;
  status: 'TODO' | 'IN_PROGRESS' | 'STUCK' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  tags?: string[];
  dependencies?: string[];
  description?: string;
}

export interface OfficeGoal {
  id: string;
  title: string;
  progress: number;
  category: 'GROWTH' | 'PRODUCT' | 'EFFICIENCY';
  description?: string;
  status?: string;
  created_at?: string;
}

export interface OfficeMemory {
  id: string;
  agentId: string;
  content: string;
  importance: number;
  timestamp: number;
}

export interface OfficeProposal {
  id: string;
  title: string;
  proposer: string;
  date: string;
  description: string;
  impact: string;
  effort: string;
  agents: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface OfficeLog {
  id: string;
  timestamp: number;
  agentId: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
}

// OPI Schema Types (from our Supabase)
interface OPIAgent {
  id: number;
  name: string;
  role: string;
  room: string;
  status: string;
  avatar: string;
  description: string;
  system_prompt?: string;
  home_position?: { x: number; y: number };
  trust_score?: number;
  expertise?: string[];
  created_at: string;
}

interface OPITask {
  id: number;
  title: string;
  status: string;
  owner?: string;
  assignee?: string;
  priority?: string;
  deadline?: string;
  description?: string;
  tags?: string[];
  created_at: string;
}

interface OPIGoal {
  id: number;
  title: string;
  status?: string;
  description?: string;
  created_at: string;
}

interface OPINote {
  id: number;
  title: string;
  content: string;
  category?: string;
  source_type?: string;
  tags?: string[];
  created_at: string;
}

interface OPIActivityLog {
  id: number;
  level: string;
  source: string;
  message: string;
  details?: any;
  created_at: string;
}

// Mapping Functions
function mapOPIAgentToOffice(opiAgent: OPIAgent): OfficeAgent {
  return {
    id: String(opiAgent.id),
    name: opiAgent.name,
    role: opiAgent.role,
    room: opiAgent.room || 'WORKING_AREA',
    status: opiAgent.status || 'IDLE',
    mood: 'FOCUSED',
    avatar: opiAgent.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${opiAgent.name}`,
    description: opiAgent.description,
    systemPrompt: opiAgent.system_prompt,
    homePosition: opiAgent.home_position || { x: 50, y: 50 },
    currentPosition: opiAgent.home_position || { x: 50, y: 50 },
    trustScore: opiAgent.trust_score || 90,
    expertise: opiAgent.expertise || [],
    isFacingLeft: false,
  };
}

function mapOPITaskToOffice(opiTask: OPITask): OfficeTask {
  const statusMap: Record<string, OfficeTask['status']> = {
    'open': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'done': 'DONE',
    'blocked': 'STUCK',
  };
  
  const priorityMap: Record<string, OfficeTask['priority']> = {
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW',
  };

  return {
    id: String(opiTask.id),
    title: opiTask.title,
    assigneeId: opiTask.assignee || opiTask.owner || '1',
    status: statusMap[opiTask.status] || 'TODO',
    priority: priorityMap[opiTask.priority || ''] || 'MEDIUM',
    dueDate: opiTask.deadline || new Date().toISOString().split('T')[0],
    description: opiTask.description,
    tags: opiTask.tags,
  };
}

function mapOPIGoalToOffice(opiGoal: OPIGoal): OfficeGoal {
  return {
    id: String(opiGoal.id),
    title: opiGoal.title,
    progress: 0,
    category: (opiGoal.status as OfficeGoal['category']) || 'PRODUCT',
    description: opiGoal.description,
    status: opiGoal.status,
    created_at: opiGoal.created_at,
  };
}

function mapOPINoteToMemory(opiNote: OPINote): OfficeMemory {
  return {
    id: String(opiNote.id),
    agentId: '1',
    content: opiNote.content || opiNote.title,
    importance: 3,
    timestamp: new Date(opiNote.created_at).getTime(),
  };
}

function mapOPIActivityToLog(opiLog: OPIActivityLog): OfficeLog {
  return {
    id: String(opiLog.id),
    timestamp: new Date(opiLog.created_at).getTime(),
    agentId: opiLog.source,
    message: opiLog.message,
    type: (opiLog.level as OfficeLog['type']) || 'INFO',
  };
}

// Fetch Functions - Returns EMPTY arrays if fetch fails (no hardcoded data!)
export async function fetchOfficeAgents(): Promise<OfficeAgent[]> {
  try {
    const { data, error } = await supabase.from('agents').select('*');
    if (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
    return (data as OPIAgent[]).map(mapOPIAgentToOffice);
  } catch (e) {
    console.error('Exception fetching agents:', e);
    return [];
  }
}

export async function fetchOfficeTasks(): Promise<OfficeTask[]> {
  try {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return (data as OPITask[]).map(mapOPITaskToOffice);
  } catch (e) {
    console.error('Exception fetching tasks:', e);
    return [];
  }
}

export async function fetchOfficeGoals(): Promise<OfficeGoal[]> {
  try {
    const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
    return (data as OPIGoal[]).map(mapOPIGoalToOffice);
  } catch (e) {
    console.error('Exception fetching goals:', e);
    return [];
  }
}

export async function fetchOfficeMemories(): Promise<OfficeMemory[]> {
  try {
    const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) {
      console.error('Error fetching memories:', error);
      return [];
    }
    return (data as OPINote[]).map(mapOPINoteToMemory);
  } catch (e) {
    console.error('Exception fetching memories:', e);
    return [];
  }
}

export async function fetchOfficeLogs(): Promise<OfficeLog[]> {
  try {
    const { data, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
    return (data as OPIActivityLog[]).map(mapOPIActivityToLog);
  } catch (e) {
    console.error('Exception fetching logs:', e);
    return [];
  }
}

// Write Functions
export async function createOfficeTask(task: OfficeTask): Promise<boolean> {
  const opiTask = {
    title: task.title,
    status: task.status === 'TODO' ? 'open' : task.status === 'IN_PROGRESS' ? 'in_progress' : task.status === 'DONE' ? 'done' : 'open',
    owner: task.assigneeId,
    priority: task.priority.toLowerCase(),
    deadline: task.dueDate,
    description: task.description,
    tags: task.tags,
  };
  
  const { error } = await supabase.from('tasks').insert(opiTask);
  if (error) {
    console.error('Error creating task:', error);
    return false;
  }
  return true;
}

export async function updateOfficeTaskStatus(taskId: string, status: OfficeTask['status']): Promise<boolean> {
  const statusMap: Record<string, string> = {
    'TODO': 'open',
    'IN_PROGRESS': 'in_progress',
    'STUCK': 'blocked',
    'DONE': 'done',
  };
  
  const { error } = await supabase.from('tasks').update({ status: statusMap[status] }).eq('id', taskId);
  if (error) {
    console.error('Error updating task:', error);
    return false;
  }
  return true;
}

// Subscribe to real-time changes
export function subscribeToTasks(callback: (payload: any) => void) {
  return supabase
    .channel('office-tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .subscribe();
}

export function subscribeToAgents(callback: (payload: any) => void) {
  return supabase
    .channel('office-agents')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, callback)
    .subscribe();
}

// Additional fetch functions for full organization management

export async function fetchProposals(): Promise<OfficeProposal[]> {
  try {
    const { data, error } = await supabase.from('decisions').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) {
      console.error('Error fetching proposals:', error);
      return [];
    }
    return (data || []).map(d => ({
      id: String(d.id),
      title: d.title,
      proposer: d.created_by || 'OPI',
      date: d.created_at ? new Date(d.created_at).toLocaleDateString('he-IL') : ' recently',
      description: d.description || '',
      impact: 'Medium',
      effort: 'Medium',
      agents: [],
      status: d.status === 'approved' ? 'approved' : d.status === 'rejected' ? 'rejected' : 'pending',
    }));
  } catch (e) {
    console.error('Exception fetching proposals:', e);
    return [];
  }
}

export async function fetchResearch(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) {
      console.error('Error fetching research:', error);
      return [];
    }
    return (data || []).map(n => ({
      id: String(n.id),
      title: n.title || 'Untitled',
      summary: n.content?.slice(0, 200) || '',
      agentId: '1',
      timestamp: new Date(n.created_at).getTime(),
      sources: [],
      category: 'Internal',
      importance: 3,
      tags: n.tags || [],
    }));
  } catch (e) {
    console.error('Exception fetching research:', e);
    return [];
  }
}

export async function fetchCronJobs(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('cron_executions').select('*').order('started_at', { ascending: false }).limit(10);
    if (error) {
      console.error('Error fetching cron jobs:', error);
      return [];
    }
    return (data || []).map(c => ({
      id: String(c.id),
      name: c.job_name || 'unknown',
      interval: 86400,
      nextRun: new Date(c.started_at).getTime() + 86400000,
      lastRunStatus: c.status === 'success' ? 'SUCCESS' : c.status === 'partial' ? 'FAILED' : 'RUNNING',
      description: c.logs || '',
    }));
  } catch (e) {
    console.error('Exception fetching cron jobs:', e);
    return [];
  }
}
