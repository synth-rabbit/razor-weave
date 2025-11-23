# Workflow Lifecycle

This document provides an overview of the Razorweave workflow system for managing book production pipelines.

## Overview

The workflow system coordinates the various stages of book production, from initial editing through to final publication and playtesting. Each workflow type handles a specific phase of production, with state management ensuring proper sequencing and error handling.

## Workflow Types

The system supports four primary workflow types:

### W1: Editing Workflow (`w1_editing`)

Manages the editorial process for book content:
- Content review and revision
- Style guide compliance checking
- Mechanics validation
- Clarity improvements

### W2: PDF Generation Workflow (`w2_pdf`)

Handles PDF production from approved content:
- HTML generation (print and web formats)
- Layout planning and execution
- PDF rendering (draft, digital, print variants)
- Quality assurance for print-ready output

### W3: Publication Workflow (`w3_publication`)

Manages the release process:
- Deployment coordination
- Release notes generation
- Marketing copy preparation
- Announcement distribution

### W4: Playtesting Workflow (`w4_playtesting`)

Coordinates playtesting activities:
- Session planning and execution
- Feedback collection
- Analysis and reporting
- Integration of findings into content

## Workflow States

Each workflow run progresses through a defined set of states:

```
                    +-----------+
                    |  pending  |
                    +-----+-----+
                          |
                          v
                    +-----------+
            +------>|  running  |<------+
            |       +-----+-----+       |
            |             |             |
            |       +-----+-----+       |
            |       v     |     v       |
       +---------+  |     |  +---------+
       | paused  |--+     +--| failed  |
       +---------+           +---------+
                              (terminal)
                          |
                          v
                    +-----------+
                    | completed |
                    +-----------+
                      (terminal)
```

### State Descriptions

| State | Description |
|-------|-------------|
| `pending` | Workflow created but not yet started |
| `running` | Workflow actively executing |
| `paused` | Workflow temporarily suspended (can resume) |
| `completed` | Workflow finished successfully (terminal) |
| `failed` | Workflow terminated due to error or cancellation (terminal) |

## State Transitions

The state machine enforces valid transitions:

| From State | Valid Transitions |
|------------|-------------------|
| `pending` | `running` |
| `running` | `paused`, `completed`, `failed` |
| `paused` | `running`, `failed` |
| `completed` | (none - terminal state) |
| `failed` | (none - terminal state) |

### Transition Triggers

- **pending -> running**: Workflow agent begins execution
- **running -> paused**: Manual pause via `workflow:pause` command
- **running -> completed**: Workflow completes successfully
- **running -> failed**: Unrecoverable error or cancellation
- **paused -> running**: Resume via `workflow:resume` command
- **paused -> failed**: Cancellation via `workflow:cancel` command

## Events

The workflow system emits events to track significant occurrences:

### Event Types

| Event Type | Description |
|------------|-------------|
| `started` | Workflow or agent execution began |
| `completed` | Workflow or agent finished successfully |
| `rejected` | Content was rejected during review |
| `escalated` | Issue escalated to human review |
| `paused` | Workflow was paused |
| `resumed` | Workflow execution resumed |

### Event Structure

Events are stored with:
- **workflow_run_id**: Links event to parent workflow
- **event_type**: One of the types above
- **agent_name**: Which agent generated the event (optional)
- **data**: JSON payload with event-specific details
- **created_at**: Timestamp of occurrence

## Artifacts

Workflows produce and consume artifacts that can be shared between workflow runs.

### Artifact Types

| Category | Artifact Types |
|----------|---------------|
| Content | `chapter`, `release_notes` |
| HTML | `print_html`, `web_html` |
| PDF | `pdf_draft`, `pdf_digital`, `pdf_print` |
| Planning | `layout_plan`, `design_plan` |
| Publication | `deployment`, `qa_report`, `marketing_copy`, `announcement` |
| Playtesting | `playtest_session`, `playtest_analysis`, `playtest_feedback` |

### Artifact Flow

```
W1 (Editing)
    |
    +--> chapter (approved content)
    |
    v
W2 (PDF Generation)
    |
    +--> print_html, web_html
    +--> pdf_draft -> pdf_digital, pdf_print
    |
    v
W3 (Publication)
    |
    +--> deployment, release_notes
    +--> marketing_copy, announcement
    |
    v
W4 (Playtesting)
    |
    +--> playtest_session, playtest_analysis
    +--> playtest_feedback -> (feeds back to W1)
```

## Triggers

Workflow triggers enable automation between workflow types.

### Trigger Conditions

| Condition | Description |
|-----------|-------------|
| `on_complete` | Fire when source workflow completes successfully |
| `on_approve` | Fire when content is approved (requires explicit approval step) |
| `manual` | Requires explicit invocation |

### Common Trigger Patterns

```
W1 (Editing) --[on_complete]--> W2 (PDF Generation)
W2 (PDF)     --[on_approve]---> W3 (Publication)
W4 (Playtest) --[manual]------> W1 (Editing) -- for feedback integration
```

### Trigger Configuration

Triggers support additional configuration via JSON:
- Book filtering (only trigger for specific books)
- Conditional logic based on workflow metadata
- Custom parameters passed to target workflow

## Escalation

The escalation system handles issues that exceed automatic retry limits.

### Rejection Types

When content is rejected during editing:

| Type | Description |
|------|-------------|
| `style` | Style guide violations |
| `mechanics` | Game mechanics issues |
| `clarity` | Unclear or confusing content |
| `scope` | Content outside approved scope |

### Escalation Flow

```
Rejection Detected
       |
       v
   Retry (up to limit)
       |
       +---> Success: Continue workflow
       |
       +---> Max retries exceeded
                   |
                   v
            Create Escalation
                   |
                   v
         Status: 'pending'
                   |
                   v
         Human acknowledges
                   |
                   v
         Status: 'acknowledged'
                   |
                   v
         Human resolves
                   |
                   v
         Status: 'resolved'
```

### Escalation Targets

Escalations can be routed to different reviewers:
- `human-reviewer`: General content review
- `senior-editor`: Complex editorial decisions
- `lead-designer`: Game design issues
- `technical-writer`: Technical accuracy

## Quick Reference: CLI Commands

### Book Management

```bash
# List all registered books
pnpm book:list

# List books by status
pnpm book:list --status draft

# Get book details
pnpm book:info --slug core-rulebook
pnpm book:info core-rulebook

# Register a new book
pnpm book:register --slug my-book --title "My Book" --path books/my-book --type source
```

### Workflow Management

```bash
# Start a workflow
pnpm workflow:start --type w1 --book core-rulebook
pnpm workflow:start --type w2_pdf --book core-rulebook

# Check workflow status
pnpm workflow:status --run wfrun_abc123_xyz789
pnpm workflow:status wfrun_abc123_xyz789

# List workflows
pnpm workflow:list
pnpm workflow:list --status running
pnpm workflow:list --book core-rulebook
pnpm workflow:list --type w1

# Pause a running workflow
pnpm workflow:pause --run wfrun_abc123_xyz789

# Resume a paused workflow
pnpm workflow:resume --run wfrun_abc123_xyz789

# Cancel a workflow
pnpm workflow:cancel --run wfrun_abc123_xyz789 --reason "Scope changed"
```

## Event System Integration

The workflow system integrates with the event sourcing architecture to provide reliable, auditable state management across git worktrees.

### How Events Flow

Workflow actions are captured as events that flow through the event sourcing pipeline:

```
┌─────────────────────┐
│   Workflow Action   │
│  (state change,     │
│   artifact create,  │
│   escalation)       │
└─────────┬───────────┘
          │
          v
┌─────────────────────┐
│    EventWriter      │
│  - Generates ID     │
│  - Adds timestamp   │
│  - Records worktree │
└─────────┬───────────┘
          │
          v
┌─────────────────────┐
│    JSONL Files      │
│  data/events/       │
│  YYYY-MM-DD-sess.   │
│  jsonl              │
└─────────┬───────────┘
          │
          │ pnpm db:materialize
          v
┌─────────────────────┐
│  Materialization    │
│  - Reads all events │
│  - Replays in order │
│  - Applies INS/UPD/ │
│    DEL operations   │
└─────────┬───────────┘
          │
          v
┌─────────────────────┐
│      SQLite         │
│   data/project.db   │
│  (queryable state)  │
└─────────────────────┘
```

### Key Integration Points

Workflow actions map to event tables as follows:

| Workflow Action | Event Table | Operation |
|-----------------|-------------|-----------|
| Start workflow | `workflow_runs` | INSERT |
| Update workflow status | `workflow_runs` | UPDATE |
| Create artifact | `artifacts` | INSERT |
| Update artifact | `artifacts` | UPDATE |
| Record workflow event | `workflow_events` | INSERT |
| Create escalation | `escalations` | INSERT |
| Update escalation status | `escalations` | UPDATE |
| Start boardroom session | `boardroom_sessions` | INSERT |
| Create VP plan | `vp_plans` | INSERT |
| Update VP plan status | `vp_plans` | UPDATE |
| Create phase | `phases` | INSERT |
| Create milestone | `milestones` | INSERT |
| Create engineering task | `engineering_tasks` | INSERT |
| Record CEO feedback | `ceo_feedback` | INSERT |

### Materializing Events

After working in a git worktree or after merging branches, materialize events to update the SQLite database:

```bash
# Rebuild database from all events
pnpm db:materialize

# With custom paths
pnpm db:materialize --events data/events --db data/project.db
```

**When to materialize:**
- After completing work in a worktree
- After merging branches
- When switching between worktrees
- If the database becomes out of sync

### Benefits for Workflows

1. **Worktree Isolation**: Each worktree writes to its own event files, preventing SQLite lock conflicts during parallel development

2. **Auditability**: Complete history of all workflow actions is preserved in event files

3. **Recovery**: If the database becomes corrupted, it can be rebuilt from events

4. **Merge Safety**: JSONL event files merge cleanly in git (append-only, one event per line)

5. **Debugging**: Events provide a detailed timeline for troubleshooting workflow issues

## See Also

- [Developer Guide: Prework System](../developers/prework.md) - Technical implementation details
- [PDF Generation Workflow](./pdf-gen.md) - Detailed W2 documentation
- [Review System](./REVIEW_SYSTEM.md) - Content review architecture
- [Event System Developer Guide](../developers/event-system.md) - Event sourcing architecture details
- [Boardroom Workflow Guide](./boardroom.md) - Boardroom planning workflow
