# Agent Handoff: W1 Phase 0 Execution

## Context

**Razorweave** is a TTRPG content creation and publishing system. We use a boardroom planning process with VP agents (Product, Engineering, Ops) to plan work.

**Current State:**
- Prework: COMPLETE (997+ tests passing, all infrastructure built)
- W1 Boardroom Session: APPROVED (`sess_c7c49ec7`)
- W1 Phase 0: BLOCKED - Must complete before Phase 1-6 can begin

## What Needs to Be Done

Execute **W1 Phase 0** using the implementation plan at:
```
docs/plans/2025-11-23-w1-phase0-implementation.md
```

Phase 0 has 3 parallel workstreams:

| Stream | Name | Tasks | Description |
|--------|------|-------|-------------|
| **0A** | Style Guides | 3 | Create content.md, formatting.md, mechanics.md in `docs/style_guides/` |
| **0B** | Event Resilience | 6 | Add VP Ops tables to materializer, checkpoints, idempotency |
| **0C** | Documentation | 4 | Create event-system.md, boardroom.md docs |

## Execution Approach

Use **3 parallel git worktrees** for fastest execution:

```bash
# Create worktrees
git worktree add .worktrees/phase0-style-guides -b feature/w1-phase0-style-guides
git worktree add .worktrees/phase0-event-resilience -b feature/w1-phase0-event-resilience
git worktree add .worktrees/phase0-documentation -b feature/w1-phase0-documentation

# Install deps in each
pnpm install --frozen-lockfile --dir .worktrees/phase0-style-guides
pnpm install --frozen-lockfile --dir .worktrees/phase0-event-resilience
pnpm install --frozen-lockfile --dir .worktrees/phase0-documentation
```

Then dispatch 3 parallel agents to execute each workstream.

## Key Files Reference

### Implementation Plans
- `docs/plans/2025-11-23-w1-phase0-implementation.md` - **Phase 0 tasks (START HERE)**
- `docs/plans/w1-engineering-tasks.md` - Phase 1-6 engineering tasks (22 tasks)
- `docs/plans/w1-engineering-tasks-summary.md` - Task summary by phase
- `docs/plans/w1-engineering-dataflow.md` - Data flow between agents
- `docs/plans/w1-engineering-index.md` - Task index with dependencies
- `docs/plans/w1-execution-schedule.md` - Execution batching and schedule

### W1 Session Documents (sess_c7c49ec7)
- `docs/plans/generated/sess_c7c49ec7-summary.md` - Session overview with Phase 0 blockers
- `docs/plans/generated/sess_c7c49ec7-vp-product.md` - VP Product analysis (6 phases)
- `docs/plans/generated/sess_c7c49ec7-vp-engineering.md` - VP Engineering tasks
- `docs/plans/generated/sess_c7c49ec7-vp-ops.md` - VP Ops execution schedule and risks
- `docs/plans/generated/sess_c7c49ec7-minutes.md` - Board meeting minutes
- `docs/plans/proposals/w1-editing.md` - Original W1 proposal with Phase 0 requirements

**Code to Modify (0B):**
- `src/tooling/cli-commands/db-materialize.ts` - Add 3 missing tables
- `src/tooling/events/writer.ts` - Add idempotency
- `src/tooling/boardroom/client.ts` - Add checkpoint method
- `src/tooling/cli-commands/boardroom-approve.ts` - Add auto-materialize

**Docs to Create (0A):**
- `docs/style_guides/content.md`
- `docs/style_guides/formatting.md`
- `docs/style_guides/mechanics.md`

**Docs to Create (0C):**
- `docs/developers/event-system.md`
- `docs/developers/boardroom.md`
- `docs/workflows/boardroom.md`
- Update `docs/workflows/lifecycle.md`

## Content Sources for Style Guides (0A)

Derive style guides from existing book content:
- `books/core/v1/chapters/` - Core rulebook chapters
- `data/html/print-design/core-rulebook.html` - Generated HTML (427KB)

## After Phase 0 Completes

1. Merge all 3 branches to main
2. Run `pnpm test` to verify
3. Run `pnpm db:materialize` to sync events
4. Phase 0 blockers are resolved - Phase 1-6 can begin

## Command to Start

```
Read the implementation plan at docs/plans/2025-11-23-w1-phase0-implementation.md and execute W1 Phase 0 using parallel git worktrees. Create 3 worktrees for workstreams 0A, 0B, and 0C, then dispatch parallel agents to execute each workstream following the TDD approach in the plan.
```
