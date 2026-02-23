# OPI-Office Integration Plan

## Current State
- **Supabase (OPI)**: Has agents, tasks, notes, decisions, goals, activity_log, knowledge_graph, human_feedback
- **Virtual AI Agency Office**: React app with agents, tasks, goals, memory, artifacts, research, security

## Mapping: Office Types → OPI Supabase

| Office Type | OPI Table | Action |
|-------------|-----------|--------|
| Agent | agents | ✅ Already exists |
| Task | tasks | ✅ Already exists |
| Goal | goals | ✅ Already exists |
| Memory | notes | ✅ Already exists (category='memory') |
| LogEntry | activity_log | ✅ Already exists |
| CronJob | cron_executions | ✅ Already exists |
| Artifact | notes | New: notes with type='artifact' |
| Proposal | decisions | ✅ Already exists |
| ResearchEntry | notes | New: category='research' |
| SecurityIssue | notes | New: category='security' |
| InternalMessage | agent_threads | ✅ Already exists |

## Architecture

```
┌─────────────────────────────────────────────┐
│           Virtual AI Agency Office          │
│              (React UI)                     │
└──────────────────┬──────────────────────────┘
                   │ reads/writes
                   ▼
┌─────────────────────────────────────────────┐
│           Supabase (OPI Main)              │
│  agents | tasks | goals | notes | ...      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           OPI (Me - The Brain)              │
│  - Creates tasks                           │
│  - Makes decisions                         │
│  - Manages agents                          │
│  - Logs activity                          │
│  - Runs nightly sync                       │
└─────────────────────────────────────────────┘
```

## What OPI Does as CEO
1. **Task Creation**: I create tasks in Supabase based on goals
2. **Decision Making**: I log decisions to `decisions` table
3. **Agent Management**: I update `agents` table with status/activities
4. **Memory**: I write important events to `notes`
5. **Research**: I can add research entries to `notes` with category='research'

## Next Steps

### Step 1: Update Office Code (Using Existing Tables)
- Use `notes` table for: Memory, Artifact, ResearchEntry, SecurityIssue
- Use `decisions` table for Proposals
- Use existing `agents`, `tasks`, `goals` tables

### Step 2: Connect Office to OPI Supabase
- Update `services/supabaseService.ts` with OPI credentials
- Map Office types to OPI schema

### Step 3: Deploy
- Push changes to GitHub
- Deploy to Vercel

### Step 4: Activate OPI
- I start managing the office via Supabase

## Files to Modify
- `services/supabaseService.ts` - Connect to OPI Supabase
- `services/geminiService.ts` - Route through OPI or keep Gemini
- `types.ts` - Align with OPI schema
- `App.tsx` - Use OPI data
