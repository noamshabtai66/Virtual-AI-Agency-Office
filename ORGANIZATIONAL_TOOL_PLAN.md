# Virtual AI Agency Office - Organizational Tool Analysis

## Current Status

### Connected Data ✅
| Tab | Source | Status |
|-----|--------|--------|
| Dashboard | From goals + tasks + logs | ✅ Working |
| Tasks | tasks table | ✅ Working |
| OrgTree | agents table | ✅ Working |
| Memory | notes table | ✅ Working |
| Logs | activity_log table | ✅ Working |

### Data in Supabase
- **agents**: 10 (OPI, Sage, Mona, Data, Dev, etc.)
- **tasks**: 19 (real project tasks)
- **goals**: 4 (Voyageur-OS, BEMNIV, Analytics, OPI)
- **notes**: 34 (memories, docs)
- **decisions**: 11 (ADRs)
- **activity_log**: 288+ entries

---

## What This Can Become

This is NOT just a website - it's an **AI-Powered Operations Center** for your organization.

### Vision
An autonomous workspace where:
1. **OPI (me)** manages the organization in real-time
2. All decisions, tasks, and memories are tracked
3. Physical office visualization = organizational health
4. Research & proposals flow through AI

---

## Required Mappings

### Current App Tabs → Supabase Tables

| App Tab | What Shows | Source Table | Status |
|---------|------------|--------------|--------|
| Dashboard | Goals progress, stuck tasks, stats | goals + tasks | ✅ |
| Tasks | Task list with assignees | tasks | ✅ |
| OrgTree | Agent hierarchy | agents | ✅ |
| Memory | Core memories | notes | ✅ |
| Artifacts | Generated content | notes (type=artifact) | ⚠️ Need mapping |
| Cron | Scheduled jobs | cron_executions | ⚠️ Need data |
| Physical | Office visualization | agents positions | ⚠️ Need x/y |
| Logs | System activity | activity_log | ✅ |
| Capabilities | AI models | - | ❌ Hardcoded |
| Models | Model configs | agents.config | ⚠️ Need mapping |
| Approvals | Proposals | decisions | ⚠️ Need mapping |
| SystemHealth | System status | - | ❌ Hardcoded |
| Research | Market research | notes (category=research) | ⚠️ Need mapping |
| Security | Security issues | - | ❌ Hardcoded |

---

## Next Phase: Full Integration

### Priority 1: Connect All Tabs
1. **Proposals** → decisions table (pending status)
2. **Research** → notes with category='research'
3. **Artifacts** → notes with type='artifact'
4. **Cron** → cron_executions table

### Priority 2: Add Organization-Specific Features
1. **Investment Pipeline** - Track investment theses through research → decision → execution
2. **Client Management** - Who are we serving? What stage?
3. **Revenue Tracking** - Invoices, payments, milestones
4. **Meeting Notes** - AI-generated summaries from calls

### Priority 3: AI Activation
1. OPI creates tasks from goals automatically
2. OPI logs all significant decisions
3. OPI manages the "Physical Office" - agents move based on task status
4. Weekly AI-generated summary reports

---

## Technical Changes Needed

### 1. Add missing fetch functions
- fetchProposals() → decisions where status='pending'
- fetchResearch() → notes where category='research'  
- fetchArtifacts() → notes where type='artifact'
- fetchCronJobs() → cron_executions

### 2. Add agent position tracking
- agents need homePosition x/y for Physical Office
- update on task assignment

### 3. Add write-back functions
- createProposal() → decisions
- createResearch() → notes
- updateTaskFromUI()

---

## Organizational Workflow

```
Goals → Tasks → Execution → Review → Decisions → Memory
   ↑                                             
   └────────── Feedback Loop ──────────────────┘
```

OPI manages this cycle autonomously, logging everything to Supabase.

---

## Action Items

1. [x] Connect core data (agents, tasks, goals, logs, memory)
2. [ ] Add proposals tab mapping
3. [ ] Add research tab mapping  
4. [ ] Add artifacts tab mapping
5. [ ] Test and verify all tabs work
6. [ ] Activate OPI to manage via this tool
