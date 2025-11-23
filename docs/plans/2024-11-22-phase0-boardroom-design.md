# Phase 0: Boardroom Architecture Design

**Status:** Approved
**Date:** 2024-11-22
**Scope:** Boardroom system, VP agents, workflow coordination, and prework requirements

---

## 1. Executive Summary

This document defines the Razorweave agent orchestration system, consisting of:

- A **Strategic Tier** (Boardroom with VP agents) for planning and approval
- A **Workflow Tier** (W1/W2/W3) for iterative execution
- **Shared infrastructure** enabling both tiers to coordinate via database and CLI

The system is designed to:
1. Ship the core rulebook at publication quality
2. Enable rapid iteration on settings books for monetization
3. Operate entirely within Claude Code via pnpm CLI commands

---

## 2. System Architecture

### 2.1 Two-Tier Coordination Model

| Tier | Model | Frequency | Purpose |
|------|-------|-----------|---------|
| **Strategic** (Boardroom) | DB-mediated, sequential with human gates | Infrequent | Plan sprints, set priorities, approve work |
| **Workflow** (W1/W2/W3) | Event-driven with smart routing | Continuous during sprints | Execute approved plans with iteration loops |

### 2.2 Execution Model

All agents are Claude subagents invoked via the Task tool, orchestrated by CLI commands that Claude Code runs and interprets.

**Session Isolation:**
- Each VP execution runs in a fresh Claude Code session
- Work happens in git worktrees created via `superpowers:using-git-worktrees`
- Merge back to main when approved/complete

### 2.3 Data Flow

- `project.db` is the single source of truth
- VPs write structured data to DB tables
- Human-readable documents generated on demand from DB
- Workflows trigger sequentially, share data via DB artifacts

---

## 3. Build Order

**This planning cycle builds the system:**

```
Phase 0: Build Boardroom + VPs (the planning engine)
    ↓
[Boardroom Session] → Brainstorm Prework → Implement Prework
    ↓
[Boardroom Session] → Plan W1 → Implement W1
    ↓
[Boardroom Session] → Plan W2 → Implement W2
    ↓
[Boardroom Session] → Plan W3 → Implement W3
    ↓
[Comprehensive Boardroom] → Plan operational cycle cadence
```

**After build, operational order:**

```
Boardroom session (plan sprint)
    → VP approvals
    → W1 executes (editing cycle)
    → W2 executes (PDF cycle)
    → W3 executes (publication cycle)
    → Next boardroom session
```

---

## 4. Boardroom Workflow

### 4.1 Entry Point

```bash
pnpm boardroom:vp-product --proposal <path-to-proposal.md>
```

### 4.2 Session Flow

```
┌────────────────────────────────────────────────────────────┐
│ Claude Code Session                                        │
│                                                            │
│ User: "Run boardroom session with this proposal"           │
│   ↓                                                        │
│ Claude: runs `pnpm boardroom:vp-product --proposal <path>` │
│   ↓                                                        │
│ CLI output: VP Product plan + next step instructions       │
│   ↓                                                        │
│ Claude: presents plan to user                              │
│   ↓                                                        │
│ User: provides feedback                                    │
│   ↓                                                        │
│ Claude: runs `pnpm boardroom:vp-engineering --session <id>`│
│   ↓                                                        │
│ CLI output: VP Engineering plan + next step instructions   │
│   ↓                                                        │
│ Claude: presents plan to user                              │
│   ↓                                                        │
│ User: provides feedback                                    │
│   ↓                                                        │
│ Claude: runs `pnpm boardroom:vp-ops --session <id>`        │
│   ↓                                                        │
│ CLI output: VP Ops plan + next step instructions           │
│   ↓                                                        │
│ Claude: presents plan to user                              │
│   ↓                                                        │
│ User: final approval                                       │
│   ↓                                                        │
│ Claude: runs `pnpm boardroom:approve --session <id>`       │
└────────────────────────────────────────────────────────────┘
```

### 4.3 VP Sequence

1. **VP Product** analyzes proposal → produces phases, milestones, risks
2. **CEO reviews**, provides feedback (stored in DB)
3. **VP Engineering** receives Product plan + feedback → produces tasks, dependencies
4. **CEO reviews**, provides feedback
5. **VP Operations** receives all plans + feedback → produces schedule, checkpoints
6. **CEO final approval** → plans committed as approved

### 4.4 CLI Output Format

```
═══════════════════════════════════════════════════════════
VP PRODUCT PLAN COMPLETE
═══════════════════════════════════════════════════════════

[Human-readable plan content here]

───────────────────────────────────────────────────────────
STATUS
───────────────────────────────────────────────────────────
✓ Plan saved to DB (session: abc123)
✓ Written to docs/plans/vp-product/2024-11-22-prework.md

───────────────────────────────────────────────────────────
NEXT STEP
───────────────────────────────────────────────────────────
Present this plan to the CEO for review and feedback.
After CEO feedback, run:
  pnpm boardroom:vp-engineering --session abc123
═══════════════════════════════════════════════════════════
```

---

## 5. VP Agent Definitions

### 5.1 VP of Product

**Role:** Strategic Director of Vision, Phases, Priorities

**Inputs:**
- Proposal document
- Prior session context (if any)

**Outputs (to DB):**
- `phases[]` - sequenced phases with acceptance criteria
- `milestones[]` - milestones within each phase
- `risks[]` - identified risk areas

**Constraints:**
- Does not create technical tasks
- Does not write code or pipelines
- Focuses on product outcomes, user value, and direction

### 5.2 VP of Engineering and Technology

**Role:** Architect of Systems, Dependencies, and Technical Execution

**Inputs:**
- VP Product's plan
- CEO feedback on Product plan

**Outputs (to DB):**
- `engineering_tasks[]` - tasks mapped to milestones
- `dependencies[]` - task dependencies
- `file_paths[]` - relevant code locations

**Constraints:**
- Does not set product priorities
- Does not set business direction
- Focuses on technical correctness, architecture, and sequencing

### 5.3 VP of Operations

**Role:** Orchestrator of Workflows, Dependencies, and Cross-Team Execution

**Inputs:**
- VP Product's plan
- VP Engineering's plan
- CEO feedback on both

**Outputs (to DB):**
- `schedule[]` - operational timeline
- `checkpoints[]` - human gate definitions
- `workflow_sequence[]` - workflow ordering

**Constraints:**
- Does not define product strategy
- Does not create technical tasks
- Focuses on execution, timing, efficiency, and coordination

---

## 6. Database Schema

### 6.1 Strategic Tier Tables

```sql
-- Boardroom sessions
boardroom_sessions (
  id TEXT PRIMARY KEY,
  proposal_path TEXT NOT NULL,
  status TEXT NOT NULL,  -- active | completed | cancelled
  created_at TIMESTAMP,
  completed_at TIMESTAMP
)

-- VP plans (one per VP per session)
vp_plans (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES boardroom_sessions,
  vp_type TEXT NOT NULL,  -- product | engineering | ops
  status TEXT NOT NULL,   -- draft | reviewed | approved
  plan_path TEXT,         -- generated markdown path
  created_at TIMESTAMP
)

-- Phases defined by VP Product
phases (
  id TEXT PRIMARY KEY,
  plan_id TEXT REFERENCES vp_plans,
  name TEXT NOT NULL,
  description TEXT,
  sequence INT,
  acceptance_criteria TEXT  -- JSON array
)

-- Milestones within phases
milestones (
  id TEXT PRIMARY KEY,
  phase_id TEXT REFERENCES phases,
  name TEXT NOT NULL,
  description TEXT,
  sequence INT
)

-- Engineering tasks from VP Engineering
engineering_tasks (
  id TEXT PRIMARY KEY,
  plan_id TEXT REFERENCES vp_plans,
  milestone_id TEXT REFERENCES milestones,
  description TEXT NOT NULL,
  file_paths TEXT,  -- JSON array of relevant files
  dependencies TEXT -- JSON array of task IDs
)

-- CEO feedback per VP review
ceo_feedback (
  id TEXT PRIMARY KEY,
  plan_id TEXT REFERENCES vp_plans,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP
)
```

### 6.2 Workflow Tier Tables

```sql
-- Workflow execution tracking
workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL,  -- w1_editing | w2_pdf | w3_publication
  book_id TEXT REFERENCES books,
  session_id TEXT REFERENCES boardroom_sessions,
  status TEXT NOT NULL,  -- pending | running | paused | completed | failed
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Events emitted by agents
workflow_events (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES workflow_runs,
  agent TEXT NOT NULL,      -- pm | writer | editor | domain_expert | etc
  event_type TEXT NOT NULL, -- started | completed | rejected | escalated
  payload TEXT,             -- JSON with details
  created_at TIMESTAMP
)

-- Rejection tracking for smart routing
rejections (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES workflow_runs,
  rejecting_agent TEXT NOT NULL,
  rejection_type TEXT NOT NULL,  -- style | mechanics | clarity | scope
  reason TEXT,
  retry_count INT DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE
)

-- Cross-workflow dependencies
workflow_triggers (
  id TEXT PRIMARY KEY,
  source_workflow TEXT NOT NULL,  -- w1_editing
  target_workflow TEXT NOT NULL,  -- w2_pdf
  trigger_condition TEXT NOT NULL, -- on_complete | on_approve | manual
  enabled BOOLEAN DEFAULT TRUE
)

-- Shared artifacts between workflows
workflow_artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES workflow_runs,
  artifact_type TEXT NOT NULL,  -- release_notes | updated_chapters | pdf_draft
  path TEXT NOT NULL,
  created_at TIMESTAMP
)
```

### 6.3 Book and Settings Tables

```sql
-- Settings as parent entities
settings (
  id TEXT PRIMARY KEY,
  genre TEXT NOT NULL,        -- cozy | noir | western
  slug TEXT NOT NULL,         -- amber_road
  name TEXT NOT NULL,
  source_path TEXT NOT NULL,  -- books/settings/cozy/amber_road/v1/
  status TEXT NOT NULL,       -- draft | selected | in_production | published
  created_at TIMESTAMP
)

-- Books (core, source books, campaign books)
books (
  id TEXT PRIMARY KEY,
  setting_id TEXT REFERENCES settings,  -- NULL for core book
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  book_type TEXT NOT NULL,    -- core | source | campaign | supplement
  source_path TEXT NOT NULL,
  status TEXT NOT NULL,       -- draft | editing | published
  created_at TIMESTAMP
)

-- Book-specific workflow config
book_workflow_config (
  id TEXT PRIMARY KEY,
  book_id TEXT REFERENCES books,
  workflow_type TEXT NOT NULL,
  config TEXT,                -- JSON overrides
  enabled BOOLEAN DEFAULT TRUE
)
```

---

## 7. Workflow Event System

### 7.1 Smart Routing Logic

```
On rejection event:
  1. Parse rejection_type from rejecting agent
  2. Increment retry_count for this run
  3. If retry_count >= 3:
     → Emit "escalated" event
     → Pause workflow for human intervention
  4. Else route based on rejection_type:
     - style → Writer with Editor feedback
     - mechanics → Writer with Domain Expert feedback
     - clarity → Writer with Editor feedback
     - scope → PM for re-planning
```

### 7.2 Workflow CLI Output Pattern

```
═══════════════════════════════════════════════════════════
EDITOR REVIEW COMPLETE
═══════════════════════════════════════════════════════════

Decision: REJECTED
Type: style
Reason: Chapter 3 tone inconsistent with style guide

───────────────────────────────────────────────────────────
STATUS
───────────────────────────────────────────────────────────
✓ Rejection logged (attempt 1 of 3)
✓ Feedback attached for Writer

───────────────────────────────────────────────────────────
NEXT STEP
───────────────────────────────────────────────────────────
Route to Writer with Editor feedback.
Run:
  pnpm w1:writer --run abc123 --feedback-from editor
═══════════════════════════════════════════════════════════
```

---

## 8. Workflow Triggering

### 8.1 Sequential Flow

```
W1 (Editing) completes
    → CEO approval gate
    → W2 (PDF) starts, reads W1 artifacts

W2 (PDF) completes
    → CEO approval gate
    → W3 (Publication) starts, reads W1 + W2 artifacts

W3 (Publication) completes
    → CEO approval gate
    → Deploy to all platforms
```

### 8.2 Artifact Sharing

- W2 queries `workflow_artifacts` for W1's outputs (release notes, updated chapters)
- W3 queries both W1 and W2 artifacts for publication
- All artifacts stored with paths and types for easy retrieval

---

## 9. Settings Book Rapid Iteration

### 9.1 Current Structure

```
books/settings/
├── cozy/                          # genre
│   ├── amber_road/v1/manuscript/  # setting
│   │   └── OVERVIEW.md
│   ├── [setting_2]/
│   └── [setting_3]/
├── noir/
├── western/
```

### 9.2 Post-Core Goal

Per genre: 1 setting selected → produces:
- 1 Source Book (setting lore, rules, options)
- 1 Campaign Book (adventure content)

### 9.3 Acceleration Levers

| Lever | Core Book | Settings Book |
|-------|-----------|---------------|
| Review depth | 50 personas, full analysis | 15-20 personas, focused |
| Editor passes | Multiple until perfect | Lighter touch |
| Domain Expert | Full mechanics review | Delta review (what's new) |
| Human gates | Every transition | Batch approvals possible |

### 9.4 CLI for New Books

```bash
# Register new settings book
pnpm book:register --slug setting-noir --title "Noir Setting" --type source --source books/settings/noir/dark_city/v1/

# Start W1 for that book
pnpm w1:start --book setting-noir
```

---

## 10. Core Book Optimization Path

```
┌─────────────────────────────────────────────────────────────┐
│ CURRENT STATE                                               │
│ • Existing pipelines: personas, reviews, HTML gen, PDF gen  │
│ • Draft PDF exists                                          │
│ • Reviews/analysis infrastructure in place                  │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 0: Build Boardroom + VPs                              │
│ • CLI commands: boardroom:*, vp:*                           │
│ • DB schema for strategic tier                              │
│ • Reusable planning engine                                  │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ PREWORK: Shared Infrastructure                              │
│ • Universal workflow lifecycle                              │
│ • Common CLI output format                                  │
│ • Event system tables                                       │
│ • Book registry (core book as first entry)                  │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ W1: Editing Workflow for Core Book                          │
│ • Full 50-persona review cycles                             │
│ • PM → Writer → Editor → Domain Expert loop                 │
│ • Human gates at each approval point                        │
│ • Iterate until quality bar met                             │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ W2: PDF Workflow for Core Book                              │
│ • Publication-quality digital + print PDFs                  │
│ • Layout → Design → Creator → Editor loop                   │
│ • Snapshot validation system                                │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ W3: Publication for Core Book                               │
│ • Deploy to web, itch.io, DriveThruRPG                      │
│ • News/release notes pages                                  │
│ • Marketing announcements                                   │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ OPERATIONAL CYCLE ESTABLISHED                               │
│ • System proven on core book                                │
│ • Ready for rapid settings book iteration                   │
│ • Boardroom plans ongoing work                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Prework Checklist

### 11.1 Build in Prework Phase

1. **DB Schema Implementation**
   - All tables from Section 6
   - Migration scripts
   - TypeScript types

2. **CLI Commands - Boardroom**
   - `boardroom:vp-product`
   - `boardroom:vp-engineering`
   - `boardroom:vp-ops`
   - `boardroom:approve`

3. **CLI Output Utilities**
   - Consistent formatting functions
   - Status/next-step template system

4. **VP Agent Prompts**
   - Finalized prompts for all three VPs
   - Stored in `data/agents/` or `src/tooling/agents/`

5. **Plan Document Generation**
   - DB → Markdown generation
   - Template system for VP outputs

6. **Universal Workflow Lifecycle**
   - Standard states: pending → running → paused → completed → failed
   - Standard events: started, completed, rejected, escalated

7. **Book Registry**
   - Core book as first entry
   - Registration CLI command

### 11.2 Deferred to W2

- PDF pipeline upgrades for publication quality
- Web deployment updates
- PDF snapshot validation system

### 11.3 Deferred to W3

- News/release notes pages for website

---

## 12. Session 0 Prework (Bootstrap)

Session 0 builds the Boardroom system itself. Unlike later sessions that USE the Boardroom, we must bootstrap it.

### Tier 1: Database Foundation
- [ ] Create boardroom schema migration
  - boardroom_sessions, vp_plans, phases, milestones
  - engineering_tasks, ceo_feedback
  - TypeScript types for all tables
- [ ] Create boardroom database client
  - CRUD operations for sessions and plans
  - Query helpers for VP agents to read prior context

### Tier 2: CLI Infrastructure
- [ ] Create CLI output formatter utility
  - Consistent header/status/next-step formatting
  - Reusable across all boardroom and workflow commands
- [ ] Create session management utilities
  - Generate session IDs
  - Track session state
  - Load/save session context

### Tier 3: VP Agent Foundations
- [ ] Create VP agent prompt templates
  - VP Product prompt
  - VP Engineering prompt
  - VP Operations prompt
  - Stored in src/tooling/agents/ or data/agents/
- [ ] Create VP agent invoker
  - Loads prompt + context
  - Invokes Claude subagent via Task tool pattern
  - Parses structured output to DB

### Tier 4: Boardroom CLI Commands
- [ ] `pnpm boardroom:vp-product --proposal <path>`
- [ ] `pnpm boardroom:vp-engineering --session <id>`
- [ ] `pnpm boardroom:vp-ops --session <id>`
- [ ] `pnpm boardroom:approve --session <id>`
- [ ] `pnpm boardroom:status --session <id>`

### Tier 5: Plan Generation
- [ ] DB → Markdown generator for VP plans
  - Reads structured data from DB
  - Produces human-readable markdown
  - Saves to docs/plans/vp-{type}/

---

## 13. Brainstorm Step Mechanics

### 13.1 VP Operations Participates in Brainstorm

The brainstorm step uses a modified `superpowers:brainstorming` flow where VP Ops provides operational perspective on each question.

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│ Boardroom Brainstorm (via /boardroom-brainstorm)            │
│                                                             │
│ Claude: formulates question with options                    │
│    ↓                                                        │
│ VP Ops subagent runs with question context                  │
│    ↓                                                        │
│ Claude presents to CEO:                                     │
│   • Question and options                                    │
│   • VP Ops perspective (blockers highlighted)               │
│    ↓                                                        │
│ CEO answers with full context                               │
│    ↓                                                        │
│ If CEO overrides blocker → record reasoning                 │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 VP Ops Authority Level

**Weighted Advisory:**
- VP Ops gives perspective on all options
- Flags operational blockers (timeline, dependencies, resources)
- Blockers should be respected unless CEO explicitly overrides with reasoning

### 13.3 Brainstorm Opinion Persistence

**Database Table:**
```sql
brainstorm_opinions (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES boardroom_sessions,
  question TEXT NOT NULL,
  options TEXT,           -- JSON array of options presented
  vp_ops_perspective TEXT,
  blockers TEXT,          -- JSON array of flagged blockers
  ceo_decision TEXT,
  override_reasoning TEXT, -- populated if CEO overrode blocker
  created_at TIMESTAMP
)
```

**Design Document:**
- Key Tradeoffs section for important decisions with reasoning
- Overrides section when CEO went against VP Ops blockers

---

## 14. Document Types

### 14.1 Build Mode (Now → Workflows Complete)

| Type | Analogy | Owner | Content |
|------|---------|-------|---------|
| **Design Plan** | Architecture Doc | Brainstorm output | Architecture, decisions, key tradeoffs |
| **Phase Plan** | Epic | VP Product + other VP insight | Scope, milestones, acceptance criteria |
| **Task Plan** | Story | VP Engineering | Technical tasks, 1-2 context windows |

```
Design Plan (brainstorm)
    ↓
Phase Plan (VP Product)
    ↓
Task Plan (VP Engineering)
```

### 14.2 Operational Mode (After Workflows Built)

| Type | Analogy | Owner | Content |
|------|---------|-------|---------|
| **Design Plan** | Architecture Doc | Brainstorm + VP Ops/Product prioritization | Architecture + priority sequencing |
| **Phase Plan** | Epic | VP Engineering | Technical epic breakdown |
| **Task Plan** | Story | Manager Agents (PM, Product Mgr, Release Mgr) | Workflow-specific tasks |

```
Design Plan (brainstorm + prioritization)
    ↓
Phase Plan (VP Engineering)
    ↓
Task Plan (Manager Agents)
```

### 14.3 Sprint Definition

- **Duration:** 1-2 context windows
- **Compaction:** Planned at ~5% threshold
- **State:** Saved before compact

---

## 15. VP Sprint Oversight

### 15.1 Build Mode: On-Demand Consultation

```
Sprint execution in progress
    │
    ├── Normal work: Claude executes tasks
    │
    └── Stuck or need guidance?
            ↓
        pnpm vp:engineering:consult --question "..."
            ↓
        VP subagent runs with context
            ↓
        Returns guidance, Claude continues
```

**CLI Commands:**
```bash
pnpm vp:product:consult --question "Should we prioritize X or Y?"
pnpm vp:engineering:consult --question "How should we architect this?"
pnpm vp:ops:consult --question "Is this blocking anything downstream?"
```

### 15.2 Operational Mode: State + Prompt with Escalation

```
Sprint session starts
    │
    ├── VP context loaded into prompt:
    │   • VP's plan summary
    │   • Current phase goals
    │   • Success criteria
    │   • Known constraints
    │
    ├── Manager agents execute tasks
    │   (Claude operates "as if" VP is overseeing)
    │
    └── Manager agent stuck?
            │
            ├── Needs human? → Escalate to CEO
            │
            └── Doesn't need human?
                    ↓
                pnpm vp:{type}:consult --question "..."
```

### 15.3 Consultation Tracking

**Database Table:**
```sql
vp_consultations (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES boardroom_sessions,
  sprint_id TEXT,
  vp_type TEXT NOT NULL,         -- product | engineering | ops
  question TEXT NOT NULL,
  context TEXT,                  -- JSON: situation when asked
  response TEXT NOT NULL,
  outcome TEXT,                  -- what was done with advice
  created_at TIMESTAMP
)
```

**Sprint Log File:** `data/sprints/{sprint-id}/consultation-log.md`

---

## 16. Success Criteria

**Phase 0 Complete When:**
- [ ] All DB tables created and tested
- [ ] Boardroom CLI commands functional
- [ ] VP agents produce valid plans from proposals
- [ ] CEO feedback loop works end-to-end
- [ ] Plans stored in DB and generated as markdown

**System Validated When:**
- [ ] Core book published to all platforms
- [ ] Full W1 → W2 → W3 cycle completed
- [ ] Ready to onboard first settings book

---

## Appendix A: File Locations

```
docs/plans/
├── proposals/              # CEO input plans
├── vp-product/             # VP Product outputs
├── vp-engineering/         # VP Engineering outputs
├── vp-ops/                 # VP Operations outputs
└── approved/               # Promoted approved plans

src/tooling/
├── boardroom/              # Boardroom CLI commands
├── workflows/              # Workflow execution
├── agents/                 # Agent prompt definitions
└── database/               # DB clients and schema

data/
├── project.db              # Source of truth
└── agents/                 # Alternative agent prompt location
```

---

## Appendix B: CLI Command Reference

```bash
# Boardroom commands
pnpm boardroom:vp-product --proposal <path>
pnpm boardroom:vp-engineering --session <id>
pnpm boardroom:vp-ops --session <id>
pnpm boardroom:approve --session <id>
pnpm boardroom:status --session <id>

# VP consultation (on-demand guidance)
pnpm vp:product:consult --question "..."
pnpm vp:engineering:consult --question "..."
pnpm vp:ops:consult --question "..."

# Book management
pnpm book:register --slug <slug> --title <title> --type <type> --source <path>
pnpm book:list

# Workflow execution (built in W1/W2/W3 phases)
pnpm w1:start --book <slug>
pnpm w1:writer --run <id> --feedback-from <agent>
pnpm w2:start --from-w1 <run-id>
pnpm w3:start --from-w2 <run-id>
```

---

*Document generated from brainstorming session 2024-11-22*
