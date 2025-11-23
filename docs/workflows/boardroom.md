# Boardroom Workflow Guide

This guide explains how to use the boardroom system for planning and executing project proposals.

## What is a Boardroom Session?

A boardroom session is a structured planning process where AI VP agents analyze a project proposal and create detailed implementation plans. Think of it as a virtual executive meeting where:

- **VP Product** defines what needs to be built (phases and milestones)
- **VP Engineering** determines how to build it (tasks and file changes)
- **VP Ops** plans the execution (batches and checkpoints)
- **CEO (you)** reviews and approves the plans

The system records all decisions as events, creating an auditable history of the planning process. Once approved, the plans are generated as markdown documents ready for implementation.

## Step-by-Step Guide

### Step 1: Create a Proposal

Before starting a boardroom session, create a proposal document in `docs/plans/proposals/`:

```bash
# Create a new proposal file
touch docs/plans/proposals/my-feature.md
```

Your proposal should include:

- **Title and Overview**: What is this feature/project?
- **Goals**: What are we trying to achieve?
- **Scope**: What's included and what's not?
- **Requirements**: What must the solution satisfy?
- **Constraints**: Time, budget, technical limitations
- **Success Criteria**: How do we know we're done?

Example proposal structure:

```markdown
# Feature: Dark Mode Support

## Overview
Add dark mode theming to the application.

## Goals
- Reduce eye strain for users
- Modern UI that matches system preferences

## Scope
### In Scope
- Color palette for dark theme
- Theme toggle in settings
- Persist theme preference

### Out of Scope
- Custom theme colors
- Per-component theming

## Requirements
- Must respect system preference
- Must have smooth transition
- Must work offline

## Success Criteria
- All pages render correctly in dark mode
- Theme preference persists across sessions
- Accessibility standards maintained
```

### Step 2: Start Session with VP Product

Start a boardroom session by invoking VP Product:

```bash
pnpm boardroom:vp-product --proposal docs/plans/proposals/my-feature.md
```

This command:
1. Creates a new boardroom session
2. Loads your proposal document
3. Prepares the VP Product invocation prompt
4. Outputs the session ID for subsequent commands

**Output example:**

```
===============================================================
VP PRODUCT INVOCATION READY
===============================================================

Session ID     | sess_a1b2c3d4
Proposal       | docs/plans/proposals/my-feature.md
Worktree       | feature/my-branch

## VP PRODUCT PROMPT

[Agent prompt displayed here...]

---------------------------------------------------------------
STATUS
---------------------------------------------------------------
[x] Session created
[x] Proposal loaded
[x] VP Product prompt prepared
[ ] Awaiting VP Product response

---------------------------------------------------------------
NEXT STEP
---------------------------------------------------------------
Invoke VP Product as a subagent with the prompt above.
After VP Product completes, run:
  pnpm boardroom:vp-engineering --session sess_a1b2c3d4
```

### Step 3: Run VP Product

VP Product will analyze your proposal and create:
- **Phases**: Major stages of the project
- **Milestones**: Checkpoints within each phase
- **Acceptance Criteria**: How to verify each phase is complete
- **Risk Assessment**: Potential issues and mitigations

The agent's output is recorded as events in the session.

### Step 4: Run VP Engineering

After VP Product completes, invoke VP Engineering:

```bash
pnpm boardroom:vp-engineering --session sess_a1b2c3d4
```

VP Engineering will:
- Review the phases and milestones from VP Product
- Create specific engineering tasks
- Identify file paths that need changes
- Map dependencies between tasks

### Step 5: Run VP Ops

After VP Engineering completes, invoke VP Ops:

```bash
pnpm boardroom:vp-ops --session sess_a1b2c3d4
```

VP Ops will:
- Group tasks into execution batches
- Identify which tasks can run in parallel
- Set up human gates for critical checkpoints
- Document operational risks and mitigations

### Step 6: Generate Documents

Generate the plan documents from the session data:

```bash
pnpm boardroom:generate --session sess_a1b2c3d4
```

This creates markdown files in `docs/plans/generated/`:
- `sess_a1b2c3d4-summary.md` - Executive summary
- `sess_a1b2c3d4-vp-product.md` - VP Product plan
- `sess_a1b2c3d4-vp-engineering.md` - VP Engineering plan
- `sess_a1b2c3d4-vp-ops.md` - VP Ops execution plan

### Step 7: Review and Approve

Review the generated documents. If satisfied, approve the session:

```bash
pnpm boardroom:approve --session sess_a1b2c3d4
```

If changes are needed, provide feedback through the approval process. The VP agents can iterate based on your feedback.

### Step 8: Generate Minutes (Optional)

Optionally generate meeting minutes for the session:

```bash
pnpm boardroom:minutes --session sess_a1b2c3d4
```

This creates a `sess_a1b2c3d4-minutes.md` file with:
- Attendees (VP agents and CEO)
- Agenda items covered
- Summaries from each VP
- Key decisions made
- Action items
- Blockers identified
- Next steps

## Checking Session Status

View the status of a specific session:

```bash
pnpm boardroom:status --session sess_a1b2c3d4
```

**Output example:**

```
===============================================================
BOARDROOM SESSION STATUS
===============================================================

Session ID     | sess_a1b2c3d4
Status         | active
Proposal       | docs/plans/proposals/my-feature.md
Created        | 2025-11-23T10:30:00.000Z
VP Plans       | 2
Phases         | 3
Tasks          | 12

---------------------------------------------------------------
STATUS
---------------------------------------------------------------
[x] VP PRODUCT: reviewed
[x] VP ENGINEERING: reviewed
[ ] VP OPS: draft

---------------------------------------------------------------
NEXT STEP
---------------------------------------------------------------
VP Engineering plan ready. Continue with VP Operations:
  pnpm boardroom:vp-ops --session sess_a1b2c3d4
```

List all sessions:

```bash
pnpm boardroom:status --list
```

## Resuming After Failure

If a session is interrupted (agent error, timeout, etc.), you can resume:

1. **Check current status:**
   ```bash
   pnpm boardroom:status --session sess_a1b2c3d4
   ```

2. **Resume from the last completed step:**
   - If VP Product completed, run VP Engineering
   - If VP Engineering completed, run VP Ops
   - If VP Ops completed, run generate

3. **The event system preserves all progress:**
   - Events are append-only, so no data is lost
   - Re-running a step will add new events
   - The materializer handles duplicate data gracefully

### Recovering from Common Issues

**Agent timeout:**
```bash
# Check which step was in progress
pnpm boardroom:status --session sess_a1b2c3d4

# Re-run the incomplete step
pnpm boardroom:vp-engineering --session sess_a1b2c3d4
```

**Invalid proposal path:**
```bash
# Start a new session with the correct path
pnpm boardroom:vp-product --proposal docs/plans/proposals/correct-name.md
```

**Database sync issues:**
```bash
# Rebuild database from events
pnpm db:materialize
```

## Best Practices

### Proposal Writing

1. **Be specific about scope** - Clearly define what's in and out of scope
2. **Include success criteria** - Define measurable outcomes
3. **List constraints early** - Technical, time, and resource limitations
4. **Reference existing code** - Point to relevant files and patterns

### Session Management

1. **One proposal per session** - Keep sessions focused
2. **Review before approving** - Read generated documents carefully
3. **Commit event files** - Track session history in git
4. **Use descriptive proposal names** - Makes sessions easy to identify

### Collaboration

1. **Share session IDs** - Others can check status with the ID
2. **Review generated docs together** - Discuss before approval
3. **Document feedback** - CEO feedback is recorded in events
4. **Iterate when needed** - Don't approve plans you're unsure about

### Git Integration

1. **Create feature branches** - Keep boardroom work isolated
2. **Commit proposals first** - Proposal should exist before session
3. **Commit generated plans** - Plans become part of project history
4. **Materialize after merges** - Run `pnpm db:materialize` after git merge

## Troubleshooting

### Session Not Found

```
ERROR: Session not found: sess_invalid
```

**Solution:** Check the session ID with `pnpm boardroom:status --list`

### Proposal File Not Found

```
ERROR: Proposal file not found: docs/plans/proposals/missing.md
```

**Solution:** Ensure the proposal file exists and the path is correct

### No VP Plans Yet

```
No VP plans yet. Start with VP Product.
```

**Solution:** The session was created but VP Product hasn't run. Invoke VP Product with the prompt provided.

### Materialization Errors

```
ERROR: Materialization failed
```

**Solution:**
1. Check `data/events/` for corrupted JSONL files
2. Delete `data/project.db` and re-materialize
3. Check for disk space issues

## Quick Reference

| Task | Command |
|------|---------|
| Start new session | `pnpm boardroom:vp-product --proposal <path>` |
| Continue with VP Engineering | `pnpm boardroom:vp-engineering --session <id>` |
| Continue with VP Ops | `pnpm boardroom:vp-ops --session <id>` |
| Check session status | `pnpm boardroom:status --session <id>` |
| List all sessions | `pnpm boardroom:status --list` |
| Generate plan documents | `pnpm boardroom:generate --session <id>` |
| Approve session | `pnpm boardroom:approve --session <id>` |
| Generate minutes | `pnpm boardroom:minutes --session <id>` |
| Rebuild database | `pnpm db:materialize` |

## See Also

- [Boardroom Developer Guide](../developers/boardroom.md) - API documentation
- [Event System Developer Guide](../developers/event-system.md) - Event architecture
- [Workflow Lifecycle](./lifecycle.md) - Overall workflow system
