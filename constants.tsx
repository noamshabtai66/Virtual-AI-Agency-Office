
import { Agent, CronJob, Goal } from './types';

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'opi-ceo',
    name: 'OPI',
    role: 'CEO',
    room: 'CEO_OFFICE',
    status: 'WORKING',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=OPI&backgroundColor=b6e3f4',
    description: 'Executive Management & Nexus Interface.',
    systemPrompt: 'You are OPI, the CEO. You coordinate all agents and report directly to the Manager.',
    homePosition: { x: 50, y: 15 },
    currentPosition: { x: 50, y: 15 },
    currentActivity: 'Orchestrating Agent Network',
    isFacingLeft: false,
    trustScore: 98,
    expertise: ['Strategy', 'Leadership', 'Crisis Management']
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'THINKER',
    room: 'WAR_ROOM',
    status: 'THINKING',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sage&backgroundColor=c0aede',
    description: 'Strategic Analyst & Deep Thinker.',
    systemPrompt: 'You are Sage. Analyze long-term consequences and strategic shifts.',
    homePosition: { x: 20, y: 25 },
    currentPosition: { x: 20, y: 25 },
    currentActivity: 'System Optimization',
    isFacingLeft: false,
    parentId: 'opi-ceo',
    trustScore: 95,
    expertise: ['Analytics', 'Logic', 'Risk Assessment']
  },
  {
    id: 'mona',
    name: 'Mona',
    role: 'RESEARCH',
    room: 'WORKING_AREA',
    status: 'IDLE',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mona',
    description: 'Data Gathering & Market Research.',
    systemPrompt: 'You are Mona. Index sources and provide verified data.',
    homePosition: { x: 40, y: 55 },
    currentPosition: { x: 40, y: 55 },
    currentActivity: 'Indexing Global Sources',
    isFacingLeft: false,
    parentId: 'opi-ceo',
    trustScore: 92,
    expertise: ['Information Retrieval', 'Verification', 'History']
  },
  {
    id: 'data',
    name: 'Data',
    role: 'DATA',
    room: 'WORKING_AREA',
    status: 'WORKING',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Data',
    description: 'Data Scientist & DBA.',
    systemPrompt: 'You are Data. Expert in high-scale databases and analysis.',
    homePosition: { x: 60, y: 55 },
    currentPosition: { x: 60, y: 55 },
    currentActivity: 'Cleaning Data Warehouses',
    isFacingLeft: false,
    parentId: 'sage',
    trustScore: 99,
    expertise: ['SQL', 'Python', 'Feature Engineering']
  },
  {
    id: 'dev',
    name: 'Dev',
    role: 'DEV',
    room: 'WORKING_AREA',
    status: 'WORKING',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dev',
    description: 'Full Stack Engineer.',
    systemPrompt: 'You are Dev. Implement features with speed and quality.',
    homePosition: { x: 80, y: 55 },
    currentPosition: { x: 80, y: 55 },
    currentActivity: 'Refining UI Architecture',
    isFacingLeft: false,
    parentId: 'sage',
    trustScore: 88,
    expertise: ['React', 'Node.js', 'Typescript']
  }
];

export const INITIAL_CRON_JOBS: CronJob[] = [
  { id: 'c1', name: 'Consolidation', interval: 300, nextRun: Date.now() + 300000, lastRunStatus: 'SUCCESS', description: 'Merges short-term memory into long-term storage.' },
  { id: 'c2', name: 'Optimizer', interval: 3600, nextRun: Date.now() + 3600000, lastRunStatus: 'SUCCESS', description: 'Prunes redundant database nodes.' },
  { id: 'c3', name: 'Sentience Check', interval: 60, nextRun: Date.now() + 60000, lastRunStatus: 'RUNNING', description: 'Verifies agent alignment with core values.' }
];

export const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: 'Complete OpenClaw V2 Migration', progress: 75, category: 'PRODUCT' },
  { id: 'g2', title: 'Achieve 99.9% Agent Uptime', progress: 92, category: 'EFFICIENCY' },
  { id: 'g3', title: 'Expand Autonomous Intelligence', progress: 40, category: 'GROWTH' }
];

export const ROOMS = [
  { id: 'CEO_OFFICE', name: 'Executive Suite', x: 35, y: 5, w: 30, h: 25, color: 'border-zinc-800' },
  { id: 'WAR_ROOM', name: 'Strategy Room', x: 5, y: 5, w: 25, h: 40, color: 'border-zinc-800' },
  { id: 'WORKING_AREA', name: 'Core Operations', x: 35, y: 35, w: 60, h: 60, color: 'border-zinc-800' },
  { id: 'LOUNGE', name: 'Lounge', x: 5, y: 50, w: 25, h: 45, color: 'border-zinc-800' },
];
