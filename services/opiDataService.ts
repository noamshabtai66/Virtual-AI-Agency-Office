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
  last_active?: string;
  current_task_id?: string;
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
  progress?: number;
  created_at: string;
  updated_at: string;
}

interface OPIGoal {
  id: number;
  title: string;
  status?: string;
  description?: string;
  created_at: string;
}

// Mapping Functions: OPI Schema -> Office Types
function mapOPIAgentToOffice(opiAgent: OPIAgent): OfficeAgent {
  return {
    id: String(opiAgent.id),
    name: opiAgent.name,
    role: opiAgent.role,
    room: opiAgent.room || 'WORKING_AREA',
    status: opiAgent.status || 'IDLE',
    mood: 'FOCUSED', // Default mood
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
    progress: 0, // Default - OPI goals don't have progress
    category: (opiGoal.status as OfficeGoal['category']) || 'PRODUCT',
    description: opiGoal.description,
    status: opiGoal.status,
    created_at: opiGoal.created_at,
  };
}

// Fetch Functions
export async function fetchOfficeAgents(): Promise<OfficeAgent[]> {
  const { data, error } = await supabase.from('agents').select('*');
  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
  return (data as OPIAgent[]).map(mapOPIAgentToOffice);
}

export async function fetchOfficeTasks(): Promise<OfficeTask[]> {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return (data as OPITask[]).map(mapOPITaskToOffice);
}

export async function fetchOfficeGoals(): Promise<OfficeGoal[]> {
  const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
  return (data as OPIGoal[]).map(mapOPIGoalToOffice);
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
