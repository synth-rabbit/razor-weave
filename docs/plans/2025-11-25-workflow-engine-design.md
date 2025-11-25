# Workflow Engine Design

**Date:** 2025-11-25
**Status:** Approved
**Phase:** 3 (Core Infrastructure)

## Overview

Design for a workflow engine that enables reliable, resumable, Claude Code-orchestrated workflows with human decision gates. Addresses observed issues with agents skipping steps, doing steps incorrectly, and database integrity problems.

## Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Granularity | Operation-level | Small enough to validate, large enough to be meaningful |
| Validation | Pre/postcondition contracts | Catches skipped steps and incorrect execution |
| Failure handling | Retry with feedback → escalate | One retry with context, then human takes over |
| State tracking | Rich checkpoints | No event sourcing overhead; checkpoints sufficient for resume |
| Workflow definition | Code-defined (TypeScript) | Type-safe, testable, matches existing patterns |
| Execution | CLI commands + Claude Code | Commands provide prompts, Claude Code does work |
| Parallel work | Task tool subagents | Native Claude Code parallelism |
| Human involvement | Decision gates only | Not pasting prompts |
| Loops | Conditional next with maxIterations | Supports iteration cycles with safety limits |
| Database | Protected with safeguards | Backups, postcondition verification, blocked destructive ops |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKFLOW ENGINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Workflow Definitions (Code)                 │   │
│  │  - Steps, order, contracts                               │   │
│  │  - Conditional branching and loops                       │   │
│  │  - Human gate specifications                             │   │
│  │  - Parallel step markers                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              WorkflowRunner (Orchestration)              │   │
│  │  - Loads workflow definition                             │   │
│  │  - Manages checkpoint state                              │   │
│  │  - Executes steps via CLI commands                       │   │
│  │  - Handles retries and escalation                        │   │
│  │  - Spawns subagents for parallel work                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CheckpointManager (State)                   │   │
│  │  - Save/load checkpoint to workflow_runs                 │   │
│  │  - Track completed steps and results                     │   │
│  │  - Track iteration counts for loops                      │   │
│  │  - Track parallel execution status                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CLI Commands (Execution)                    │   │
│  │  - Each step = one command                               │   │
│  │  - Command outputs prompt for Claude Code                │   │
│  │  - Command validates postconditions                      │   │
│  │  - Returns structured StepOutput                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SafeDatabaseClient (Protected)              │   │
│  │  - Wraps all database access                             │   │
│  │  - Blocks destructive operations                         │   │
│  │  - Auto-backup before workflows                          │   │
│  │  - Transaction support for rollback                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Types

### Workflow Definition

```typescript
interface WorkflowDefinition {
  type: string;                      // 'w1_editing', 'w2_pdf', etc.
  name: string;                      // Human-readable name
  steps: WorkflowStep[];
  initialStep: string;
}

interface WorkflowStep {
  name: string;                      // Unique step identifier
  command: string;                   // CLI command to run
  preconditions: Condition[];        // Must be true before running
  postconditions: Condition[];       // Must be true after running
  parallel?: boolean;                // Can run with other parallel steps
  parallelKey?: string;              // Checkpoint key for parallel items
  humanGate?: HumanGate;             // Pause for human decision
  next?: string | ConditionalNext;   // Which step follows
}

interface Condition {
  name: string;
  check: (ctx: StepContext) => Promise<boolean>;
  error: string;                     // Message if check fails
}

interface ConditionalNext {
  condition: string;                 // Expression to evaluate
  onTrue: string;                    // Step if condition true
  onFalse: string;                   // Step if condition false
  maxIterations?: number;            // Safety limit for loops
}

interface HumanGate {
  prompt: string;                    // What to ask
  context: string[];                 // Checkpoint keys to display
  options: GateOption[];
}

interface GateOption {
  label: string;
  nextStep: string | null;           // null = end workflow
  requiresInput?: boolean;           // Human must provide text
}
```

### Checkpoint

```typescript
interface Checkpoint {
  workflowRunId: string;
  workflowType: string;
  currentStep: string;
  completedSteps: StepResult[];
  iterationCounts: Record<string, number>;
  pendingRetry?: {
    step: string;
    error: string;
    attempt: number;
  };
  parallelResults?: Record<string, ParallelItemResult>;
  gateDecision?: {
    gate: string;
    option: string;
    input?: string;
  };
}

interface StepResult {
  step: string;
  completedAt: string;
  result: any;
}

interface ParallelItemResult {
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  error?: string;
  retryCount: number;
}

interface ResumeContext {
  workflowType: string;
  runId: string;
  currentStep: string;
  completedSteps: string[];
  lastStepOutput: any;
  pendingRetry?: { step: string; error: string; attempt: number };
  parallelStatus?: { total: number; completed: number; failed: string[] };
}
```

### Command Interface

```typescript
interface StepInput {
  runId: string;
  step: string;
  checkpoint: Checkpoint;
  retryContext?: { error: string; attempt: number };
}

interface StepOutput {
  success: boolean;
  result?: any;
  error?: string;
  postconditionsPassed: boolean;
  nextStepHint?: string;             // For conditional branches
}
```

## Execution Flows

### Normal Execution

```
1. Claude Code loads workflow definition for requested type
2. Creates or loads checkpoint from DB
3. Backs up database (safety)
4. Finds current step (or first step if new)
5. Checks preconditions — if fail, error with clear message
6. Runs CLI command for step
7. Command outputs prompt, Claude Code does the work
8. Command validates postconditions
9. If postconditions fail → retry flow
10. Saves checkpoint with step result
11. If humanGate → pause and present options to human
12. If parallel steps next → spawn subagents via Task tool
13. Evaluate next step (may be conditional)
14. Repeat from step 4
```

### Retry Flow

```
1. Postcondition failed
2. Increment retry count in checkpoint
3. If retry count > 1 → escalate to human, halt
4. Re-run same step with error context:
   - Command receives: "Previous attempt failed: {error}"
   - Claude Code adjusts approach based on feedback
5. Validate postconditions again
6. If pass → continue normal flow
7. If fail → escalate to human
```

### Resume Flow

```
1. Load checkpoint from DB by runId
2. If pendingRetry exists → show human the error, ask how to proceed
3. If parallelResults has failures → report and ask human
4. Otherwise → continue from currentStep
5. All previous step outputs available in checkpoint
```

### Parallel Execution

```
1. Engine detects step with parallel: true
2. Reads parallelKey items from checkpoint
3. Spawns N subagents via Task tool:
   Task.spawn([
     { command: 'w1:write --area area-1 --run abc123' },
     { command: 'w1:write --area area-2 --run abc123' },
   ])
4. Each subagent runs independently, validates own postconditions
5. Parent collects results into checkpoint.parallelResults
6. If any failed → retry those specific items (up to limit)
7. When all pass → advance to next step
```

## W1 Workflow Definition Example

```typescript
import { defineWorkflow } from '../engine';

export const W1EditingWorkflow = defineWorkflow({
  type: 'w1_editing',
  name: 'Iterative Editing Workflow',
  initialStep: 'strategic-planning',
  steps: [
    {
      name: 'strategic-planning',
      command: 'w1:strategic',
      preconditions: [
        { name: 'book_exists', check: ctx => ctx.book !== null, error: 'Book not found' },
        { name: 'analysis_exists', check: ctx => ctx.analysisPath !== null, error: 'No analysis file' },
      ],
      postconditions: [
        { name: 'plan_created', check: ctx => ctx.db.strategicPlanExists(ctx.runId), error: 'Strategic plan not saved to DB' },
      ],
      next: 'create-version',
    },
    {
      name: 'create-version',
      command: 'w1:create-version',
      preconditions: [
        { name: 'plan_exists', check: ctx => ctx.checkpoint.completedSteps.includes('strategic-planning'), error: 'Planning not complete' },
      ],
      postconditions: [
        { name: 'version_created', check: ctx => ctx.result.versionId !== ctx.previousVersionId, error: 'New version not created (modified in place)' },
        { name: 'version_persisted', check: ctx => ctx.db.versionExists(ctx.result.versionId), error: 'Version not saved to DB' },
      ],
      next: 'writer',
    },
    {
      name: 'writer',
      command: 'w1:write',
      parallel: true,
      parallelKey: 'improvementAreas',
      postconditions: [
        { name: 'chapters_modified', check: ctx => ctx.result.modifiedChapters.length > 0, error: 'No chapters were modified' },
      ],
      next: 'editor-review',
    },
    {
      name: 'editor-review',
      command: 'w1:editor-review',
      postconditions: [
        { name: 'review_complete', check: ctx => ctx.result.decision !== null, error: 'Editor did not provide decision' },
      ],
      next: {
        condition: 'result.decision === "approved"',
        onTrue: 'domain-expert-review',
        onFalse: 'writer',
        maxIterations: 3,
      },
    },
    {
      name: 'domain-expert-review',
      command: 'w1:domain-review',
      postconditions: [
        { name: 'review_complete', check: ctx => ctx.result.decision !== null, error: 'Domain expert did not provide decision' },
      ],
      next: {
        condition: 'result.decision === "approved"',
        onTrue: 'chapter-review',
        onFalse: 'writer',
        maxIterations: 3,
      },
    },
    {
      name: 'chapter-review',
      command: 'review:chapters',
      postconditions: [
        { name: 'metrics_calculated', check: ctx => ctx.result.metrics !== null, error: 'Metrics not calculated' },
      ],
      next: {
        condition: 'result.metrics.delta >= checkpoint.threshold',
        onTrue: 'human-gate',
        onFalse: 'strategic-planning',
        maxIterations: 3,
      },
    },
    {
      name: 'human-gate',
      command: 'w1:human-gate',
      humanGate: {
        prompt: 'Review the changes and metrics. How would you like to proceed?',
        context: ['metrics.baseline', 'metrics.current', 'metrics.delta', 'modifiedChapters'],
        options: [
          { label: 'Approve and finalize', nextStep: 'finalize' },
          { label: 'Request more improvements', nextStep: 'strategic-planning', requiresInput: true },
          { label: 'Reject and stop', nextStep: null },
        ],
      },
      next: 'finalize',  // Default if not using gate options
    },
    {
      name: 'finalize',
      command: 'w1:finalize',
      postconditions: [
        { name: 'artifacts_registered', check: ctx => ctx.db.artifactsExist(ctx.runId), error: 'Artifacts not registered' },
        { name: 'workflow_completed', check: ctx => ctx.db.workflowStatus(ctx.runId) === 'completed', error: 'Workflow not marked complete' },
      ],
      next: null,  // End of workflow
    },
  ],
});
```

## Database Integrity Protection

### 1. Postconditions Verify Persistence

Every step that writes to DB has a postcondition querying DB to confirm the write succeeded.

### 2. Automatic Backup Before Workflow Runs

```typescript
class WorkflowRunner {
  async start(workflowType: string, bookId: string) {
    await this.databaseClient.backup();  // → data/backups/project-{timestamp}.db
    // ... continue
  }
}
```

### 3. SafeDatabaseClient Blocks Destructive Operations

```typescript
class SafeDatabaseClient {
  dropTable(table: string): never {
    throw new Error('DROP TABLE blocked. Use migrations system.');
  }

  deleteDatabase(): never {
    throw new Error('Database deletion blocked.');
  }

  truncateTable(table: string): never {
    throw new Error('TRUNCATE blocked. Use explicit DELETE with confirmation.');
  }

  delete(table: string, where: WhereClause, confirmToken?: string) {
    if (!confirmToken) {
      throw new Error('DELETE requires confirmation token from db.getDeleteConfirmation()');
    }
    // Validate token matches operation
    // Execute delete
  }
}
```

### 4. Schema Changes Only Via Migrations

No ad-hoc `ALTER TABLE` or `CREATE TABLE`. All schema changes go through numbered, tracked migrations.

### 5. Transaction Wrapper for Steps

Each step runs in a transaction. If postcondition fails, transaction rolls back to prevent partial writes.

## Database Schema Extensions

```sql
-- Extend workflow_runs table for checkpoints
ALTER TABLE workflow_runs ADD COLUMN checkpoint_json TEXT;
ALTER TABLE workflow_runs ADD COLUMN current_step TEXT;
ALTER TABLE workflow_runs ADD COLUMN iteration_counts TEXT;  -- JSON

-- Add backup tracking
CREATE TABLE IF NOT EXISTS database_backups (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  path TEXT NOT NULL,
  workflow_run_id TEXT,
  size_bytes INTEGER
);
```

## Implementation Plan

### Phase 1: Core Engine
1. `WorkflowDefinition` types and validation
2. `CheckpointManager` - save/load/update checkpoints
3. `SafeDatabaseClient` wrapper with protections
4. Database migrations for new columns

### Phase 2: Workflow Runner
1. `WorkflowRunner` - main orchestration loop
2. Precondition/postcondition evaluation
3. Retry logic with feedback
4. Human gate handling

### Phase 3: Migrate W1
1. Define W1 as `WorkflowDefinition`
2. Refactor CLI commands to standard interface
3. Add postconditions to each command
4. Test full workflow execution

### Phase 4: Polish
1. Resume flow testing
2. Parallel execution testing
3. Error message improvements
4. Documentation

## What Happens to Deleted Workflow Files

The 8 files deleted in commit d578b9a (rejection-tracker, smart-router, escalation, event-emitter, trigger-engine, artifact-types, artifact-query, routing-config) should NOT be resurrected. They were designed for a different architectural vision (fully automated agent loops).

The new design:
- Uses postconditions instead of rejection tracking
- Uses checkpoint-based retry instead of smart routing
- Uses human gates instead of auto-escalation
- Uses rich checkpoints instead of event sourcing
- Uses code-defined workflows instead of trigger engine

This is simpler and fits Claude Code's execution model.
