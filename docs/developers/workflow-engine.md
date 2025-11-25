# Workflow Engine

The workflow engine provides reliable, resumable workflow orchestration with checkpointing and human decision gates.

## Overview

The workflow engine is designed for Claude Code orchestration - workflows are defined declaratively, and Claude Code executes them step-by-step with full checkpoint recovery.

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code (Orchestrator)                │
│  - Starts workflows via wf:start                             │
│  - Executes step commands                                    │
│  - Reports results via wf:result                             │
│  - Presents human gates for decisions                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     WorkflowRunner                           │
│  - Manages workflow state                                    │
│  - Validates pre/postconditions                              │
│  - Tracks retries and escalation                             │
│  - Handles human gate decisions                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CheckpointManager                          │
│  - Persists workflow state to database                       │
│  - Tracks completed steps                                    │
│  - Records iteration counts for loops                        │
│  - Stores step results for resumption                        │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### WorkflowRunner (`src/tooling/workflows/workflow-runner.ts`)

The main orchestration class that:
- Starts new workflow runs
- Resumes paused/failed workflows
- Processes step results
- Handles human gate decisions
- Manages state transitions

```typescript
const runner = new WorkflowRunner({ db, workflows });

// Start a new workflow
const state = await runner.start('w1_editing', bookId);

// Process step completion
const newState = await runner.processStepResult(runId, {
  success: true,
  result: { planId: 'plan_123' },
  postconditionsPassed: true,
});

// Handle human gate decision
const finalState = await runner.handleGateDecision(runId, 'Approve');
```

### CheckpointManager (`src/tooling/workflows/checkpoint-manager.ts`)

Handles persistence of workflow state:
- Creates checkpoints when workflows start
- Updates checkpoints after each step
- Loads checkpoints for resumption
- Stores arbitrary data in checkpoint.data

### SafeDatabaseClient (`@razorweave/database`)

A database wrapper that prevents destructive operations:
- Blocks DROP, TRUNCATE statements
- Requires confirmation token for DELETE
- Creates automatic backups before workflows

### WorkflowDefinition (`src/tooling/workflows/engine-types.ts`)

Declarative workflow definitions:

```typescript
const myWorkflow = defineWorkflow({
  type: 'my_workflow',
  name: 'My Workflow',
  initialStep: 'step1',
  steps: [
    {
      name: 'step1',
      command: 'pnpm my:command',
      preconditions: [
        { name: 'data_exists', check: (ctx) => ctx.db.dataExists(), error: 'No data' }
      ],
      postconditions: [],
      next: 'step2',
    },
    {
      name: 'step2',
      command: 'pnpm another:command',
      preconditions: [],
      postconditions: [],
      next: {
        condition: 'result.approved',
        onTrue: 'finalize',
        onFalse: 'step1',
        maxIterations: 3,
      },
    },
    {
      name: 'finalize',
      command: 'pnpm finalize',
      preconditions: [],
      postconditions: [],
      humanGate: {
        prompt: 'Approve the changes?',
        context: ['metrics'],
        options: [
          { label: 'Approve', nextStep: null },
          { label: 'Reject', nextStep: 'step1' },
        ],
      },
      next: null,
    },
  ],
});
```

## CLI Commands

### wf:prompt (Recommended)

Generate a prompt for Claude Code to execute a workflow:

```bash
# Core personas only (10 reviewers)
pnpm wf:prompt --type w1_editing --book core-rulebook --with-review

# Core + 30 generated personas (40 reviewers, weighted sampling)
pnpm wf:prompt --type w1_editing --book core-rulebook --with-review --plus=30

# With focus category for sampling
pnpm wf:prompt --type w1_editing --book core-rulebook --with-review --plus=30 --focus=combat
```

This outputs a complete prompt you copy to a new Claude Code session.

### wf:start

Start a new workflow run:

```bash
pnpm wf:start --type w1_editing --book core-rulebook
```

### wf:result

Report step completion:

```bash
# Success
pnpm wf:result --run wfrun_xxx --success --result '{"planId": "plan_123"}'

# Failure
pnpm wf:result --run wfrun_xxx --failure --error "Analysis file not found"

# With branch hint
pnpm wf:result --run wfrun_xxx --success --hint "needs_revision"
```

### wf:gate

Handle human gate decisions:

```bash
pnpm wf:gate --run wfrun_xxx --decision "Approve"
pnpm wf:gate --run wfrun_xxx --decision "Request Changes" --input "Fix chapter 3"
```

### wf:status

Check workflow status:

```bash
pnpm wf:status --run wfrun_xxx
```

### wf:list

List workflow runs:

```bash
pnpm wf:list
pnpm wf:list --book core-rulebook
pnpm wf:list --status running
```

### wf:resume

Resume a paused workflow:

```bash
pnpm wf:resume --run wfrun_xxx
```

## Workflow States

| State | Description |
|-------|-------------|
| `pending` | Created but not started |
| `running` | Currently executing |
| `paused` | Paused (e.g., waiting for retry) |
| `awaiting_human` | Waiting for human gate decision |
| `completed` | Successfully finished |
| `failed` | Failed with error |

## Human Gates

Steps can include human decision gates that pause the workflow:

```typescript
humanGate: {
  prompt: 'Review the changes and decide:',
  context: ['metrics', 'changes'],  // Checkpoint keys to display
  options: [
    { label: 'Approve', nextStep: 'finalize' },
    { label: 'Reject', nextStep: null },  // null = end workflow
    { label: 'Request Changes', nextStep: 'edit', requiresInput: true },
  ],
}
```

## Conditional Branching

Steps can branch based on results:

```typescript
next: {
  condition: 'result.score >= 8.0',
  onTrue: 'finalize',
  onFalse: 'improve',
  maxIterations: 3,  // Safety limit for loops
}
```

The `nextStepHint` in step output can override the condition evaluation.

## Error Handling

The engine provides typed errors:

- `WorkflowError` - Base error class
- `UnknownWorkflowError` - Workflow type not found
- `CheckpointNotFoundError` - Run ID not found
- `StepNotFoundError` - Step name not in definition
- `PreconditionFailedError` - Precondition check failed
- `InvalidGateOptionError` - Invalid gate decision

## Database Tables

| Table | Purpose |
|-------|---------|
| `workflow_runs` | Workflow state and checkpoint JSON |
| `database_backups` | Automatic backups before workflows |
| `workflow_artifacts` | Artifacts produced by steps |
| `strategic_plans` | W1 strategic plans |

## Safety Features

1. **SafeDatabaseClient** - Blocks destructive SQL operations
2. **Automatic backups** - Created before workflow execution
3. **Checkpoint recovery** - Resume from any failure point
4. **Max iterations** - Prevents infinite loops in conditional branches
5. **Precondition validation** - Ensures prerequisites before steps

## Creating New Workflows

1. Define the workflow in `src/tooling/workflows/`:

```typescript
// my-workflow.ts
import { defineWorkflow } from './engine-types.js';

export const myWorkflow = defineWorkflow({
  type: 'my_workflow',
  name: 'My Workflow',
  initialStep: 'start',
  steps: [/* ... */],
});
```

2. Register in `workflow.ts`:

```typescript
const workflows = new Map<string, WorkflowDefinition>([
  ['w1_editing', w1EditingWorkflow],
  ['my_workflow', myWorkflow],  // Add here
]);
```

3. Create step commands as needed (e.g., `pnpm my:step1`)

## Related Documentation

- [W1 Editing Workflow](../workflows/w1-editing.md) - The W1 implementation
- [Review System](../workflows/REVIEW_SYSTEM.md) - Review campaigns
- [CLI Reference](../workflows/cli-reference.md) - All CLI commands
