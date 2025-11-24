# W1 Parallel Workflow Design

**Date:** 2024-11-23
**Status:** APPROVED
**Author:** CEO + Claude

## Overview

Redesign the W1 editing workflow to execute improvement areas in parallel, with dynamic thresholds and enhanced human gate options.

## Problem Statement

The current W1 workflow has several limitations:

1. **Premature human gates** - Triggers human review after each iteration instead of auto-iterating to max cycles
2. **Single broad area** - Creates one "General Improvements" area instead of targeted parallel tracks
3. **Linear processing** - Works chapters sequentially instead of parallelizing across improvement areas
4. **Fixed thresholds** - Uses static delta thresholds (1.0) that become unrealistic at higher scores
5. **Limited human gate options** - Only approve/reject, no option for fresh full review

## Solution Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRATEGIC PLAN                                │
│  Areas: [Combat Clarity, Char Creation, Quick Ref, ...]        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RUN 1 (of max 3)                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Area 1     │ │   Area 2     │ │   Area 3     │  PARALLEL  │
│  │ (3 cycles)   │ │ (3 cycles)   │ │ (3 cycles)   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│         │                │                │                     │
│         └────────────────┴────────────────┘                     │
│                          │                                      │
│                    ALL COMPLETE                                 │
│                          ▼                                      │
│              ┌───────────────────┐                              │
│              │ FULL VALIDATION   │                              │
│              │ (all chapters)    │                              │
│              └───────────────────┘                              │
│                          │                                      │
│              Threshold met? ──No──► RUN 2                       │
└─────────────────────────────────────────────────────────────────┘
                          │Yes (or max runs hit)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HUMAN GATE                                  │
│  Options:                                                        │
│  1. Approve → Finalize                                          │
│  2. Reject with Reasons → New run with feedback                 │
│  3. Full Review → Build HTML, 10 core personas, reassess        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Terms

- **Area**: A targeted improvement track (e.g., "Combat Clarity" affecting chapters 8, 10)
- **Cycle**: One iteration within an area (each area gets up to 3 cycles)
- **Run**: One full parallel execution of all areas + validation (max 3 runs)

## Component Design

### 1. Area Generator

Transforms review analysis into 3-6 targeted improvement areas.

**Input:** Review analysis with priority rankings, dimension summaries, persona breakdowns

**Output:**
```json
{
  "areas": [
    {
      "area_id": "combat-clarity",
      "name": "Combat Clarity",
      "type": "chapter_cluster",
      "target_chapters": ["08-actions.md", "10-combat.md"],
      "target_issues": ["CLARITY-002", "CLARITY-005"],
      "target_dimension": "clarity_readability",
      "priority": 1
    }
  ]
}
```

**Grouping Strategies:**
1. By issue category - Group related issues (all clarity issues together)
2. By chapter cluster - Group chapters that work together (combat chapters)
3. By persona pain points - Target specific persona struggles

### 2. Dynamic Threshold Calculator

Scales delta requirements based on current score.

```typescript
function getRequiredDelta(currentScore: number): number {
  if (currentScore < 7.0) return 1.0;   // Low-hanging fruit
  if (currentScore < 7.5) return 0.7;   // Moderate improvements
  if (currentScore < 8.0) return 0.5;   // Getting harder
  if (currentScore < 8.5) return 0.3;   // Diminishing returns
  if (currentScore < 9.0) return 0.2;   // Polish phase
  return 0.1;                            // Near-perfection
}
```

**Rationale:** A 1.0 delta is achievable going from 6.5→7.5, but unrealistic for 8.0→9.0.

### 3. Parallel Area Executor

Uses Claude Code's Task tool to dispatch subagents for each area.

**Per-Area Cycle Flow:**
```
Area "Combat Clarity" (cycles: 0/3)
│
├─► Cycle 1:
│   ├── Writer Agent modifies target chapters
│   ├── Editor Agent reviews
│   ├── Domain Expert validates
│   ├── Mini-validation (area metrics only)
│   └── Delta achieved? ──Yes──► Area COMPLETE
│                        │
│                        No, cycles < max
│                        ▼
├─► Cycle 2: (builds on cycle 1 changes)
├─► Cycle 3: (final attempt)
│
└── After 3 cycles OR success: Area marked DONE
```

**Parallel Dispatch:**
```
Run Orchestrator
│
├── Task(Area 1) ──────────────────► [runs independently]
├── Task(Area 2) ──────────────────► [runs independently]
├── Task(Area 3) ──────────────────► [runs independently]
└── Task(Area 4) ──────────────────► [runs independently]
        │
        └── Wait for ALL to complete
                    │
                    ▼
            Full Validation
```

### 4. Run Orchestrator

Manages run-level cycles and validation.

**Logic:**
```
while current_run <= max_runs:
    dispatch all areas in parallel (Task tool)
    wait for all areas to complete
    run full validation

    if threshold_met:
        trigger human_gate(reason="threshold_met")
        break

    current_run++

if current_run > max_runs:
    trigger human_gate(reason="max_runs_exhausted")
```

### 5. Enhanced Human Gate

Three options when human gate triggers:

**Option 1: Approve**
```bash
pnpm w1:human-gate --approve --run=<id>
```
Proceeds to finalization.

**Option 2: Reject with Reasons**
```bash
pnpm w1:human-gate --reject --run=<id> --reason="Combat examples still confusing"
```
Creates new run with feedback injected into area prompts.

**Option 3: Full Review (NEW)**
```bash
pnpm w1:human-gate --full-review --run=<id>
```

Triggers:
1. Build complete HTML with all pending changes
2. Run 10 core persona reviews against complete book
3. Generate fresh analysis
4. Compare vs. original baseline
5. Present new decision point

## State Schema

```json
{
  "plan_id": "strat_abc123",
  "current_run": 1,
  "max_runs": 3,
  "current_phase": "parallel_execution",

  "areas": [
    {
      "area_id": "combat-clarity",
      "status": "completed|in_progress|pending|failed",
      "current_cycle": 2,
      "max_cycles": 3,
      "baseline_score": 6.5,
      "current_score": 7.6,
      "delta_target": 1.0,
      "delta_achieved": 1.1,
      "chapters_modified": ["08-actions.md", "10-combat.md"]
    }
  ],

  "runs": [
    {
      "run_number": 1,
      "started_at": "2024-01-15T10:00:00Z",
      "completed_at": null,
      "baseline_overall": 6.9,
      "final_overall": null,
      "areas_completed": 1,
      "areas_total": 4
    }
  ],

  "validation_history": [],
  "last_updated": "2024-01-15T12:30:00Z"
}
```

## Phase Transitions

```
planning → parallel_execution → validating → [threshold check]
                                                    │
                    ┌───────────────────────────────┴───────────────────────────────┐
                    │                               │                               │
              threshold met              threshold not met              max runs reached
                    │                     & runs < max                              │
                    ▼                               │                               ▼
              human_gate ◄──────────────────────────┴─────────────────────────► human_gate
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    approved     rejected    full_review
        │           │           │
        ▼           ▼           ▼
   finalizing   new_run    reviewing
        │           │           │
        ▼           │           ▼
   completed ◄──────┴───── [back to planning with new analysis]
```

## Files to Create/Modify

### New Files
- `src/tooling/w1/area-generator.ts` - Area generation from analysis
- `src/tooling/w1/threshold-calculator.ts` - Dynamic threshold logic
- `src/tooling/w1/parallel-executor.ts` - Task tool dispatch
- `src/tooling/w1/run-orchestrator.ts` - Run-level management

### Modified Files
- `src/tooling/w1/strategy-types.ts` - New state schema
- `src/tooling/w1/strategy-repository.ts` - Area-level state updates
- `src/tooling/w1/prompt-generator.ts` - Parallel execution prompts
- `src/tooling/cli-commands/w1-human-gate.ts` - Add `--full-review`
- `src/tooling/agents/prompts/pm-metrics-eval.md` - Dynamic thresholds

### Documentation Updates
- `docs/workflows/w1-editing.md` - Update workflow documentation
- `docs/plans/proposals/w1-editing.md` - Update proposal
- `docs/developers/agent-architecture.md` - Add parallel execution patterns

## Success Criteria

1. Strategic plan generates 3-6 targeted areas from analysis
2. All areas execute in parallel using Task tool
3. Each area gets up to 3 cycles before marking complete
4. Full validation runs after all areas complete
5. Auto-retry up to 3 runs if threshold not met
6. Human gate only triggers when threshold met OR max runs exhausted
7. Full review option builds HTML and runs core persona reviews
8. Dynamic thresholds scale with current score

## Risks

1. **Task tool coordination** - Subagents may produce conflicting changes
   - Mitigation: Areas target non-overlapping chapters where possible

2. **State complexity** - More state to track and recover
   - Mitigation: Clear state schema, frequent saves

3. **Long execution time** - Parallel areas may take significant time
   - Mitigation: Progress indicators, resumable state
