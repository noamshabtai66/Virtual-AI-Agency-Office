
export type AgentRole = 'CEO' | 'THINKER' | 'RESEARCH' | 'DATA' | 'DEV' | 'MONITOR' | 'UX' | 'WRITER' | 'FINANCE' | 'ADMIN';
export type OfficeRoom = 'CEO_OFFICE' | 'WORKING_AREA' | 'WAR_ROOM' | 'LOUNGE';
export type AgentStatus = 'WORKING' | 'THINKING' | 'ALERT' | 'IDLE';

export interface Position {
  x: number;
  y: number;
}

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'STUCK' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  tags?: string[];
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
  category: 'GROWTH' | 'PRODUCT' | 'EFFICIENCY';
}

export interface Artifact {
  id: string;
  title: string;
  type: 'CODE' | 'DOCUMENT' | 'IMAGE' | 'DATA';
  creatorId: string;
  timestamp: number;
  content: string;
}

export interface InternalMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: number;
}

export interface Memory {
  id: string;
  agentId: string;
  content: string;
  importance: number; // 1-5
  timestamp: number;
}

export interface CronJob {
  id: string;
  name: string;
  interval: number; // in seconds
  nextRun: number; // timestamp
  lastRunStatus: 'SUCCESS' | 'FAILED' | 'RUNNING';
  description: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM';
  source: string;
  message: string;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  room: OfficeRoom;
  status: AgentStatus;
  avatar: string;
  description: string;
  systemPrompt: string;
  currentActivity: string;
  homePosition: Position;
  currentPosition: Position;
  isFacingLeft: boolean;
  parentId?: string;
  trustScore: number;
  expertise: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  role: 'user' | 'model';
}

export interface OfficeState {
  agents: Agent[];
  messages: ChatMessage[];
  tasks: Task[];
  goals: Goal[];
  memories: Memory[];
  logs: LogEntry[];
  cronJobs: CronJob[];
  artifacts: Artifact[];
  internalMessages: InternalMessage[];
  selectedAgentId: string | null;
  activeTab: 'Dashboard' | 'Tasks' | 'OrgTree' | 'Memory' | 'Artifacts' | 'Cron' | 'Physical' | 'Logs';
}
