# Prework Proposal

**Date:** 2024-11-22
**Author:** CEO
**Purpose:** Define shared infrastructure needed by all workflows before building W1/W2/W3/W4

---

## Context

Phase 0 (Boardroom system) is complete. Before building the individual workflows (W1 Editing, W2 PDF, W3 Publication, W4 Playtesting), we need shared infrastructure that all workflows will use.

### Existing Infrastructure

Already built and working:
- **Personas pipeline** at `src/tooling/personas`
- **Reviews pipeline** at `src/tooling/reviews`
- **HTML generation** at `src/tooling/html-gen`
- **PDF generation** at `src/tooling/pdf-gen`
- **Boardroom system** at `src/tooling/boardroom`, `src/tooling/cli`, `src/tooling/agents`, `src/tooling/plans`
- **Event sourcing** at `src/tooling/events`

### What's Missing

The workflows need:
1. A way to track their execution state
2. A way to emit and handle events
3. A way to share artifacts between workflows
4. A registry of books to operate on
5. Smart routing for rejections and retries

---

## Prework Goals

### 1. Workflow Lifecycle Management

All workflows need consistent state tracking:

**States:** `pending → running → paused → completed → failed`

**Events:** `started | completed | rejected | escalated`

**Requirements:**
- Start a workflow run for a specific book
- Track which step/agent is currently active
- Pause and resume workflows
- Handle failures gracefully
- Escalate to human after N retries

### 2. Book Registry

Before workflows can run, we need to know what books exist:

**Core Book Entry:**
- slug: `core-rulebook`
- title: `Razorweave Core Rulebook`
- type: `core`
- source_path: `books/core-rulebook/v1/manuscript/`

**CLI:**
```bash
pnpm book:register --slug <slug> --title <title> --type <type> --source <path>
pnpm book:list
pnpm book:info --slug <slug>
```

### 3. Workflow Event System

Agents need to emit events that trigger routing:

**Event Types:**
- Agent started work
- Agent completed successfully
- Agent rejected (with type: style | mechanics | clarity | scope)
- Workflow escalated (exceeded retry limit)

**Smart Routing:**
```
On rejection:
  1. Log rejection with type and reason
  2. Increment retry counter
  3. If retries >= 3: escalate to human
  4. Else: route to appropriate agent based on rejection type
```

### 4. Artifact Sharing

Workflows need to pass outputs between each other:

**W1 produces:** Updated chapters, release notes
**W2 consumes:** W1's release notes, updated content
**W3 consumes:** W1 + W2 artifacts
**W4 produces:** Playtest feedback for W1

**Requirements:**
- Register artifacts with type and path
- Query artifacts by workflow run
- Cross-workflow artifact lookup

### 5. Workflow CLI Base

Standard commands all workflows will use:

```bash
pnpm workflow:start --type <w1|w2|w3|w4> --book <slug>
pnpm workflow:status --run <run-id>
pnpm workflow:pause --run <run-id>
pnpm workflow:resume --run <run-id>
pnpm workflow:cancel --run <run-id>
pnpm workflow:list [--book <slug>] [--status <status>]
```

---

## Database Schema Required

### Workflow Tier Tables

```sql
-- Workflow execution tracking
workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL,  -- w1_editing | w2_pdf | w3_publication | w4_playtesting
  book_id TEXT REFERENCES books,
  session_id TEXT REFERENCES boardroom_sessions,
  status TEXT NOT NULL,  -- pending | running | paused | completed | failed
  current_agent TEXT,    -- which agent is active
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Events emitted by agents
workflow_events (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES workflow_runs,
  agent TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT,  -- JSON
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
  source_workflow TEXT NOT NULL,
  target_workflow TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,  -- on_complete | on_approve | manual
  enabled BOOLEAN DEFAULT TRUE
)

-- Shared artifacts between workflows
workflow_artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES workflow_runs,
  artifact_type TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMP
)
```

### Book/Settings Tables

```sql
-- Settings (genre groupings)
settings (
  id TEXT PRIMARY KEY,
  genre TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  source_path TEXT NOT NULL,
  status TEXT NOT NULL,  -- draft | selected | in_production | published
  created_at TIMESTAMP
)

-- Books
books (
  id TEXT PRIMARY KEY,
  setting_id TEXT REFERENCES settings,  -- NULL for core book
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  book_type TEXT NOT NULL,  -- core | source | campaign | supplement
  source_path TEXT NOT NULL,
  status TEXT NOT NULL,  -- draft | editing | published
  created_at TIMESTAMP
)

-- Per-book workflow config
book_workflow_config (
  id TEXT PRIMARY KEY,
  book_id TEXT REFERENCES books,
  workflow_type TEXT NOT NULL,
  config TEXT,  -- JSON overrides
  enabled BOOLEAN DEFAULT TRUE
)
```

---

## Success Criteria

Prework is complete when:

1. **Book Registry Works**
   - Can register the core book
   - Can list and query books
   - Core book is first entry

2. **Workflow Lifecycle Works**
   - Can start a workflow run
   - Can track status through state changes
   - Can pause/resume/cancel

3. **Event System Works**
   - Agents can emit events
   - Events are logged to DB
   - Smart routing handles rejections

4. **Artifact Sharing Works**
   - Can register artifacts from a run
   - Can query artifacts for a run
   - Cross-workflow lookup works

5. **Tests Pass**
   - 80% coverage on new code
   - All workflow lifecycle states tested
   - Event routing logic tested

6. **Documentation Complete**
   - `docs/workflows/lifecycle.md` - how workflows work
   - `docs/developers/prework.md` - developer guide
   - CLI help text for all commands

---

## Out of Scope (Deferred)

These will be built in their respective workflow phases:

- W1-specific agents (PM, Writer, Editor, Domain Expert)
- W2-specific agents (Layout, Design, Creator, Editor)
- W3-specific agents (Release Manager, QA, Marketing, Deploy)
- W4-specific agents (GM, Players, Playtest Analysis)
- PDF pipeline upgrades
- Web deployment updates
- Playtesting GPT integration

---

## Risks

1. **Schema changes late** - If we discover needed fields during W1, we may need migrations
   - Mitigation: Event sourcing allows schema evolution

2. **Workflow complexity** - Smart routing may be over-engineered for initial needs
   - Mitigation: Start simple, add routing rules as needed

3. **Book structure assumptions** - Core book path may differ from settings books
   - Mitigation: Make source_path flexible, validate on registration

---

## Questions for Brainstorm

1. Should workflow state be purely in DB or also in files?
2. How granular should events be? Per-agent-step or per-action?
3. Should artifacts be copied or referenced by path?
4. Do we need workflow versioning (multiple runs of same type)?

---

*This proposal is input for the Prework Boardroom session.*
