# Boardroom Developer Guide

This document describes the boardroom system architecture for planning sessions with VP agents.

## Overview

The boardroom system orchestrates planning sessions where three VP agents (Product, Engineering, Ops) analyze proposals and create implementation plans. The CEO (human operator) reviews and approves the final plans.

### VP Agent Roles

| Agent | Responsibility | Output |
|-------|---------------|--------|
| **VP Product** | Analyzes proposal scope, defines phases and milestones, identifies risks | Phases, milestones, acceptance criteria |
| **VP Engineering** | Creates technical tasks, identifies file paths, maps dependencies | Engineering tasks, file paths, dependencies |
| **VP Ops** | Plans execution batches, identifies operational risks, sets human gates | Execution batches, risks, checkpoints |
| **CEO** | Reviews all plans, provides feedback, approves for implementation | Approval or rejection with feedback |

## Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BOARDROOM SESSION LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────────────┘

  ┌───────────┐
  │   START   │  pnpm boardroom:vp-product --proposal <path>
  └─────┬─────┘
        │
        │ Creates session, loads proposal
        v
  ┌───────────┐
  │VP PRODUCT │  Analyzes proposal, creates phases & milestones
  │  (draft)  │  Records: phases, milestones, risks
  └─────┬─────┘
        │
        │ Plan status: draft -> reviewed
        v
  ┌───────────┐
  │VP ENGINEER│  pnpm boardroom:vp-engineering --session <id>
  │   ING     │  Creates tasks, maps files & dependencies
  │  (draft)  │  Records: engineering_tasks
  └─────┬─────┘
        │
        │ Plan status: draft -> reviewed
        v
  ┌───────────┐
  │  VP OPS   │  pnpm boardroom:vp-ops --session <id>
  │  (draft)  │  Creates execution batches, identifies risks
  └─────┬─────┘  Records: execution_batches, operational_risks
        │
        │ Plan status: draft -> reviewed
        v
  ┌───────────┐
  │   CEO     │  pnpm boardroom:approve --session <id>
  │ APPROVAL  │  Reviews all plans, provides feedback
  └─────┬─────┘
        │
        ├────────────────┐
        │                │
        v                v
  ┌───────────┐    ┌───────────┐
  │ APPROVED  │    │ REJECTED  │
  │ (complete)│    │(feedback) │
  └─────┬─────┘    └─────┬─────┘
        │                │
        │                │ Iterate on feedback
        │                └─────────────────────┐
        v                                      │
  ┌───────────┐                                │
  │ GENERATE  │  pnpm boardroom:generate --session <id>
  │   DOCS    │  Creates markdown plan documents
  └─────┬─────┘
        │
        v
  ┌───────────┐
  │ COMPLETE  │  Session status: completed
  └───────────┘
```

## BoardroomClient API

The `BoardroomClient` class provides methods for recording boardroom session data.

### Constructor

```typescript
import { BoardroomClient } from '@/tooling/boardroom';

const client = new BoardroomClient(
  eventsDir,  // Directory for event files (e.g., 'data/events')
  sessionId,  // Unique session identifier
  worktree    // Git branch name
);
```

### Session Management

#### createSession

Creates a new boardroom session:

```typescript
const session = client.createSession('docs/plans/proposals/w1-editing.md');
// Returns: BoardroomSession
// {
//   id: 'sess_12345678',
//   proposal_path: 'docs/plans/proposals/w1-editing.md',
//   status: 'active',
//   created_at: '2025-11-23T10:30:00.000Z',
//   completed_at: null
// }
```

### VP Plan Management

#### createVPPlan

Creates a new VP plan within a session:

```typescript
const plan = client.createVPPlan(sessionId, 'product');
// vpType: 'product' | 'engineering' | 'ops'
// Returns: VPPlan
// {
//   id: 'plan_abcd1234',
//   session_id: 'sess_12345678',
//   vp_type: 'product',
//   status: 'draft',
//   plan_path: null,
//   created_at: '2025-11-23T10:30:00.000Z'
// }
```

#### updateVPPlanStatus

Updates a plan's status and optionally its file path:

```typescript
client.updateVPPlanStatus(planId, 'reviewed');
// or
client.updateVPPlanStatus(planId, 'approved', 'docs/plans/generated/sess_12345678-vp-product.md');
```

### Phase and Milestone Management

#### createPhase

Creates a project phase with acceptance criteria:

```typescript
const phase = client.createPhase(
  planId,
  'Phase 0: Foundation',
  'Establish event system infrastructure',
  0,  // sequence number
  ['EventWriter class implemented', 'EventReader class implemented', 'All tests pass']
);
// Returns: Phase
// {
//   id: 'phase_efgh5678',
//   plan_id: 'plan_abcd1234',
//   name: 'Phase 0: Foundation',
//   description: 'Establish event system infrastructure',
//   sequence: 0,
//   acceptance_criteria: '["EventWriter class implemented",...]'
// }
```

#### createMilestone

Creates a milestone within a phase:

```typescript
const milestone = client.createMilestone(
  phaseId,
  'M0.1: Event Types',
  'Define TypeScript interfaces for events',
  0  // sequence number
);
// Returns: Milestone
// {
//   id: 'ms_ijkl9012',
//   phase_id: 'phase_efgh5678',
//   name: 'M0.1: Event Types',
//   description: 'Define TypeScript interfaces for events',
//   sequence: 0
// }
```

### Engineering Task Management

#### createEngineeringTask

Creates an engineering task with file paths and dependencies:

```typescript
const task = client.createEngineeringTask(
  planId,
  milestoneId,
  'Create EventWriter class with write method',
  ['src/tooling/events/writer.ts', 'src/tooling/events/writer.test.ts'],
  ['task_previous_id']  // optional dependencies
);
// Returns: EngineeringTask
// {
//   id: 'task_mnop3456',
//   plan_id: 'plan_abcd1234',
//   milestone_id: 'ms_ijkl9012',
//   description: 'Create EventWriter class with write method',
//   file_paths: '["src/tooling/events/writer.ts",...]',
//   dependencies: '["task_previous_id"]'
// }
```

### CEO Feedback

#### addCEOFeedback

Records CEO feedback on a plan:

```typescript
const feedback = client.addCEOFeedback(
  planId,
  'Consider breaking Phase 2 into smaller milestones for better tracking.'
);
// Returns: CEOFeedback
// {
//   id: 'fb_qrst7890',
//   plan_id: 'plan_abcd1234',
//   feedback: 'Consider breaking Phase 2...',
//   created_at: '2025-11-23T12:00:00.000Z'
// }
```

### VP Ops Specific Methods

#### createExecutionBatch

Creates an execution batch for task grouping:

```typescript
const batch = client.createExecutionBatch(
  planId,
  1,  // batch number
  'Foundation Tasks',
  ['Create EventWriter', 'Create EventReader', 'Add tests'],
  true,  // parallel safe
  'All foundation classes created with tests',
  false,  // human gate
  null    // human gate criteria (when humanGate is true)
);
// Returns: ExecutionBatch
```

#### createOperationalRisk

Records an operational risk with mitigation:

```typescript
const risk = client.createOperationalRisk(
  planId,
  'Database corruption during concurrent writes',
  'Use event-based writes instead of direct SQLite access',
  'high'  // severity: 'high' | 'medium' | 'low'
);
// Returns: OperationalRisk
```

### Consultation Recording

#### recordBrainstormOpinion

Records a VP Ops brainstorm opinion with CEO decision:

```typescript
const opinion = client.recordBrainstormOpinion(
  sessionId,
  'Should we use SQLite or PostgreSQL?',
  ['SQLite - simpler, file-based', 'PostgreSQL - more robust'],
  'SQLite is sufficient for our use case and avoids deployment complexity',
  ['PostgreSQL would require additional infrastructure'],
  'SQLite',
  null  // override reasoning (when CEO overrides recommendation)
);
// Returns: BrainstormOpinion
```

#### recordVPConsultation

Records a consultation with a VP agent:

```typescript
const consultation = client.recordVPConsultation(
  sessionId,
  null,  // sprint_id (optional)
  'engineering',
  'Can we use existing database schema?',
  { currentSchema: '...', proposedChanges: '...' },
  'Yes, the existing schema supports the new requirements with minor additions',
  'approved'
);
// Returns: VPConsultation
```

### Board Minutes

#### createBoardroomMinutes

Creates meeting minutes for a session:

```typescript
const minutes = client.createBoardroomMinutes(sessionId, {
  attendees: ['VP Product', 'VP Engineering', 'VP Ops', 'CEO'],
  agenda: ['Review proposal', 'Define phases', 'Plan execution'],
  vpProductSummary: 'Defined 3 phases with clear acceptance criteria...',
  vpEngineeringSummary: 'Created 15 engineering tasks across phases...',
  vpOpsSummary: 'Organized into 5 execution batches...',
  decisions: ['Use event sourcing', 'Prioritize Phase 0'],
  actionItems: ['Create implementation branch', 'Set up CI pipeline'],
  blockers: [],
  nextSteps: 'Begin Phase 0 implementation'
});
// Returns: BoardroomMinutes
```

## SessionManager API

The `SessionManager` class provides session lifecycle management.

### Constructor

```typescript
import { SessionManager } from '@/tooling/cli/session-manager';

const sessionManager = new SessionManager(eventsDir, worktree);
```

### Methods

#### startSession

Creates a new session from a proposal:

```typescript
const session = sessionManager.startSession('docs/plans/proposals/w1-editing.md');
// Returns: BoardroomSession
```

#### getSession

Retrieves a session by ID:

```typescript
const session = sessionManager.getSession('sess_12345678');
// Returns: BoardroomSession | null
```

#### listSessions

Lists all sessions:

```typescript
const sessions = sessionManager.listSessions();
// Returns: BoardroomSession[]
```

## Data Model Interfaces

### BoardroomSession

```typescript
interface BoardroomSession {
  id: string;                    // Unique session ID (sess_...)
  proposal_path: string;         // Path to proposal document
  status: SessionStatus;         // 'active' | 'completed' | 'cancelled'
  created_at: string;            // ISO timestamp
  completed_at: string | null;   // ISO timestamp when completed
}
```

### VPPlan

```typescript
interface VPPlan {
  id: string;                    // Unique plan ID (plan_...)
  session_id: string;            // Parent session ID
  vp_type: VPType;               // 'product' | 'engineering' | 'ops'
  status: PlanStatus;            // 'draft' | 'reviewed' | 'approved'
  plan_path: string | null;      // Path to generated plan document
  created_at: string;            // ISO timestamp
}
```

### Phase

```typescript
interface Phase {
  id: string;                    // Unique phase ID (phase_...)
  plan_id: string;               // Parent plan ID
  name: string;                  // Phase name
  description: string | null;    // Phase description
  sequence: number;              // Order within plan (0-indexed)
  acceptance_criteria: string;   // JSON array of criteria
}
```

### Milestone

```typescript
interface Milestone {
  id: string;                    // Unique milestone ID (ms_...)
  phase_id: string;              // Parent phase ID
  name: string;                  // Milestone name
  description: string | null;    // Milestone description
  sequence: number;              // Order within phase (0-indexed)
}
```

### EngineeringTask

```typescript
interface EngineeringTask {
  id: string;                    // Unique task ID (task_...)
  plan_id: string;               // Parent plan ID
  milestone_id: string;          // Parent milestone ID
  description: string;           // Task description
  file_paths: string | null;     // JSON array of file paths
  dependencies: string | null;   // JSON array of task IDs
}
```

### ExecutionBatch

```typescript
interface ExecutionBatch {
  id: string;                    // Unique batch ID (batch_...)
  plan_id: string;               // Parent plan ID
  batch_number: number;          // Sequence number
  name: string;                  // Batch name
  tasks: string;                 // JSON array of task descriptions
  parallel_safe: boolean;        // Can tasks run in parallel?
  checkpoint: string;            // Checkpoint description
  human_gate: boolean;           // Requires human approval?
  human_gate_criteria: string | null;  // Approval criteria
}
```

### OperationalRisk

```typescript
interface OperationalRisk {
  id: string;                    // Unique risk ID (risk_...)
  plan_id: string;               // Parent plan ID
  description: string;           // Risk description
  mitigation: string;            // Mitigation strategy
  severity: 'high' | 'medium' | 'low';
}
```

### BoardroomMinutes

```typescript
interface BoardroomMinutes {
  id: string;                    // Unique minutes ID (min_...)
  session_id: string;            // Parent session ID
  date: string;                  // Date (YYYY-MM-DD)
  attendees: string;             // JSON array
  agenda: string;                // JSON array
  vp_product_summary: string;    // VP Product section
  vp_engineering_summary: string; // VP Engineering section
  vp_ops_summary: string;        // VP Ops section
  decisions: string;             // JSON array
  action_items: string;          // JSON array
  blockers: string;              // JSON array
  next_steps: string;            // Next steps summary
  created_at: string;            // ISO timestamp
}
```

## CLI Commands Reference

| Command | Description | Arguments |
|---------|-------------|-----------|
| `pnpm boardroom:vp-product` | Start session, invoke VP Product | `--proposal <path>` |
| `pnpm boardroom:vp-engineering` | Invoke VP Engineering | `--session <id>` |
| `pnpm boardroom:vp-ops` | Invoke VP Ops | `--session <id>` |
| `pnpm boardroom:approve` | CEO approval process | `--session <id>` |
| `pnpm boardroom:status` | Check session status | `--session <id>` or `--list` |
| `pnpm boardroom:generate` | Generate plan documents | `--session <id>` |
| `pnpm boardroom:minutes` | Generate meeting minutes | `--session <id>` |

### Common Options

All boardroom commands support:

| Option | Default | Description |
|--------|---------|-------------|
| `--events <dir>` | `data/events` | Event files directory |

### Output Directory Options

Commands that generate files support:

| Option | Default | Description |
|--------|---------|-------------|
| `--output <dir>` | `docs/plans/generated` | Output directory for generated files |

## Output Files Reference

When `pnpm boardroom:generate` runs, it creates the following files:

| File Pattern | Description |
|--------------|-------------|
| `{session_id}-summary.md` | Executive summary with all phases and milestones |
| `{session_id}-vp-product.md` | VP Product plan details |
| `{session_id}-vp-engineering.md` | VP Engineering plan with tasks |
| `{session_id}-vp-ops.md` | VP Ops execution plan |
| `{session_id}-minutes.md` | Board meeting minutes (if generated) |

Example files for session `sess_12345678`:
- `docs/plans/generated/sess_12345678-summary.md`
- `docs/plans/generated/sess_12345678-vp-product.md`
- `docs/plans/generated/sess_12345678-vp-engineering.md`
- `docs/plans/generated/sess_12345678-vp-ops.md`
- `docs/plans/generated/sess_12345678-minutes.md`

## See Also

- [Event System Developer Guide](./event-system.md) - Event sourcing architecture
- [Boardroom Workflow Guide](../workflows/boardroom.md) - Step-by-step usage guide
- [Workflow Lifecycle](../workflows/lifecycle.md) - Overall workflow documentation
