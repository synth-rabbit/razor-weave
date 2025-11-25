# Workflow Engine

Reliable, resumable workflow orchestration with checkpointing and human gates.

## Quick Start

```bash
# Start a W1 editing workflow
pnpm wf:start --type w1_editing --book core-rulebook

# Check status
pnpm wf:status --run wfrun_xxx

# After executing a step command (e.g., w1:strategic), report result
pnpm wf:result --run wfrun_xxx --success --result '{"planId": "plan_123"}'

# For failures
pnpm wf:result --run wfrun_xxx --failure --error "Analysis file not found"

# Handle human gate decisions
pnpm wf:gate --run wfrun_xxx --decision "Approve"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code (Orchestrator)                │
│  - Starts workflows                                          │
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

## Key Components

### WorkflowDefinition

Defines a workflow as a series of steps with conditions and branches:

```typescript
const myWorkflow = defineWorkflow({
  type: 'my_workflow',
  name: 'My Workflow',
  initialStep: 'step1',
  steps: [
    {
      name: 'step1',
      command: 'pnpm my:command',
      preconditions: [/* conditions to check before */],
      postconditions: [/* conditions to verify after */],
      next: 'step2',
    },
    {
      name: 'step2',
      command: 'pnpm another:command',
      preconditions: [],
      postconditions: [],
      next: {
        condition: 'result.approved === "yes"',
        onTrue: 'success',
        onFalse: 'retry',
        maxIterations: 3,
      },
    },
    // ... more steps
  ],
});
```

### Human Gates

Steps can pause for human decisions:

```typescript
{
  name: 'review',
  command: 'pnpm show:review',
  humanGate: {
    prompt: 'Approve the changes?',
    context: ['metrics', 'changes'],
    options: [
      { label: 'Approve', nextStep: 'finalize' },
      { label: 'Reject', nextStep: null },
      { label: 'Request Changes', nextStep: 'edit', requiresInput: true },
    ],
  },
}
```

### Retry and Escalation

- Steps that fail postconditions are retried once
- After max retries (default: 1), workflow pauses for human escalation
- Escalation includes error context and retry history

## CLI Commands

| Command | Description |
|---------|-------------|
| `wf:start` | Start a new workflow |
| `wf:resume` | Resume a paused workflow |
| `wf:result` | Report step completion |
| `wf:status` | Show workflow status |
| `wf:list` | List workflow runs |
| `wf:gate` | Handle human gate decision |

## W1 Editing Workflow

The W1 editing workflow follows this structure:

```
strategic → writer → editor ←→ writer (max 3 iterations)
                         ↓
                      domain ←→ writer (max 3 iterations)
                         ↓
                      validate → human_gate → finalize
                                     ↓
                                  [reject] → completed
```

Steps:
1. **strategic** - Create improvement plan from analysis
2. **writer** - Apply changes to chapters
3. **editor** - Review for clarity and consistency
4. **domain** - Review for RPG accuracy
5. **validate** - Run validation pipeline
6. **human_gate** - Human approval (Approve/Reject/Request Changes/Full Review)
7. **finalize** - Generate HTML, PDF artifacts

## Database Tables

- `workflow_runs` - Workflow run state and checkpoint
- `database_backups` - Automatic backups before workflows
- `workflow_artifacts` - Artifacts produced by steps
- `strategic_plans` - W1 strategic plans

## Safety Features

- **SafeDatabaseClient** blocks destructive operations (DROP, TRUNCATE)
- **DELETE requires confirmation** with explicit token
- **Automatic backups** before workflow execution
- **Postcondition rollback** on failure
