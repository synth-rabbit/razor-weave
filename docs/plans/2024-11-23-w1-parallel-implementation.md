# W1 Parallel Workflow Implementation Plan

**Date:** 2024-11-23
**Design Doc:** `docs/plans/2024-11-23-w1-parallel-workflow-design.md`
**Estimated Tasks:** 12 implementation + 3 documentation

## Phase 1: Foundation (Tasks 1-3)

### Task 1: Dynamic Threshold Calculator

**File:** `src/tooling/w1/threshold-calculator.ts`

**Create:**
```typescript
export function getRequiredDelta(currentScore: number): number {
  if (currentScore < 7.0) return 1.0;
  if (currentScore < 7.5) return 0.7;
  if (currentScore < 8.0) return 0.5;
  if (currentScore < 8.5) return 0.3;
  if (currentScore < 9.0) return 0.2;
  return 0.1;
}

export function shouldApproveAtScore(currentScore: number, delta: number): boolean {
  const requiredDelta = getRequiredDelta(currentScore);
  return delta >= requiredDelta;
}

export function getApprovalCriteria(currentScore: number): {
  requiredDelta: number;
  canApproveWithStability: boolean;
  description: string;
} {
  // Returns human-readable criteria for the current score level
}
```

**Test:** `src/tooling/w1/threshold-calculator.test.ts`

**Verification:**
```bash
npx vitest run src/tooling/w1/threshold-calculator.test.ts
```

---

### Task 2: Update Strategy Types

**File:** `src/tooling/w1/strategy-types.ts`

**Add/modify schemas:**

```typescript
// New area status type
export type AreaStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Updated ImprovementAreaSchema
export const ImprovementAreaSchema = z.object({
  area_id: z.string(),
  name: z.string(),
  type: z.enum(['issue_category', 'chapter_cluster', 'persona_pain_point']),
  target_chapters: z.array(z.string()),
  target_issues: z.array(z.string()),
  target_dimension: z.enum(['clarity_readability', 'rules_accuracy', 'persona_fit', 'practical_usability', 'overall_score']).optional(),
  priority: z.number().int().min(1),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).default('pending'),
  current_cycle: z.number().int().min(0).default(0),
  max_cycles: z.number().int().min(1).default(3),
  baseline_score: z.number().optional(),
  current_score: z.number().optional(),
  delta_target: z.number().optional(),
  delta_achieved: z.number().optional(),
  chapters_modified: z.array(z.string()).default([]),
});

// New RunSchema
export const RunSchema = z.object({
  run_number: z.number().int().min(1),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  baseline_overall: z.number(),
  final_overall: z.number().optional(),
  areas_completed: z.number().int().min(0),
  areas_total: z.number().int().min(1),
});

// Updated StrategyStateSchema
export const StrategyStateSchema = z.object({
  current_phase: z.enum([
    'planning',
    'parallel_execution',
    'validating',
    'human_gate',
    'full_review',
    'finalizing',
    'completed',
    'failed'
  ]),
  current_run: z.number().int().min(1).default(1),
  max_runs: z.number().int().min(1).default(3),
  runs: z.array(RunSchema).default([]),
  last_updated: z.string().datetime(),
  error_message: z.string().optional(),
  human_gate_reason: z.enum(['threshold_met', 'max_runs_exhausted', 'user_requested']).optional(),
});
```

**Verification:**
```bash
npx tsc --noEmit src/tooling/w1/strategy-types.ts
```

---

### Task 3: Update Strategy Repository

**File:** `src/tooling/w1/strategy-repository.ts`

**Add methods:**
```typescript
// Update a specific area's state
updateAreaState(planId: string, areaId: string, updates: Partial<ImprovementArea>): void

// Mark area as complete
completeArea(planId: string, areaId: string, finalScore: number): void

// Start new run
startRun(planId: string, baselineOverall: number): number  // returns run_number

// Complete current run
completeRun(planId: string, finalOverall: number): void

// Get areas by status
getAreasByStatus(planId: string, status: AreaStatus): ImprovementArea[]

// Check if all areas complete
allAreasComplete(planId: string): boolean
```

**Verification:**
```bash
npx vitest run src/tooling/w1/strategy-repository.test.ts
```

---

## Phase 2: Area Generation (Tasks 4-5)

### Task 4: Area Generator

**File:** `src/tooling/w1/area-generator.ts`

**Create:**
```typescript
export interface AnalysisInput {
  priority_rankings: Array<{
    category: string;
    severity: number;
    frequency: number;
    affected_chapters: string[];
  }>;
  dimension_summaries: Record<string, { average: number; themes: string[] }>;
  persona_breakdowns: Record<string, { strengths: string[]; struggles: string[] }>;
}

export interface GeneratedArea {
  area_id: string;
  name: string;
  type: 'issue_category' | 'chapter_cluster' | 'persona_pain_point';
  target_chapters: string[];
  target_issues: string[];
  target_dimension?: string;
  priority: number;
}

export function generateAreasFromAnalysis(
  analysis: AnalysisInput,
  options?: { maxAreas?: number; minPriority?: number }
): GeneratedArea[];

// Grouping strategies
function groupByIssueCategory(rankings: AnalysisInput['priority_rankings']): GeneratedArea[];
function groupByChapterCluster(rankings: AnalysisInput['priority_rankings']): GeneratedArea[];
function groupByPersonaPainPoint(breakdowns: AnalysisInput['persona_breakdowns']): GeneratedArea[];
```

**Logic:**
1. Take top priority rankings
2. Group related issues into areas (max 6 areas)
3. Ensure chapters don't overlap between areas where possible
4. Assign target dimension based on issue types

**Test:** `src/tooling/w1/area-generator.test.ts`

**Verification:**
```bash
npx vitest run src/tooling/w1/area-generator.test.ts
```

---

### Task 5: Integrate Area Generator into Strategic CLI

**File:** `src/tooling/cli-commands/w1-strategic.ts`

**Modify:**
- When creating strategic plan from analysis, call `generateAreasFromAnalysis()`
- Store generated areas in the plan
- Output summary of generated areas

**Verification:**
```bash
pnpm w1:strategic --book=core-rulebook --analysis=data/reviews/analysis/test.md --dry-run
```

---

## Phase 3: Parallel Execution (Tasks 6-8)

### Task 6: Area Executor Prompt Generator

**File:** `src/tooling/w1/prompt-generator.ts`

**Add function:**
```typescript
export function generateAreaExecutionPrompt(context: {
  planId: string;
  area: ImprovementArea;
  workflowRunId: string;
  bookSlug: string;
  artifactsDir: string;
}): string;
```

**Prompt includes:**
- Area-specific targets (chapters, issues)
- Cycle tracking (current/max)
- Dynamic delta threshold for current score
- Instructions for writer → editor → domain expert flow
- Mini-validation after each cycle
- How to report completion

---

### Task 7: Parallel Executor

**File:** `src/tooling/w1/parallel-executor.ts`

**Create:**
```typescript
export interface ParallelExecutionResult {
  areaId: string;
  status: 'completed' | 'failed';
  cyclesUsed: number;
  finalScore: number;
  deltaAchieved: number;
  chaptersModified: string[];
  error?: string;
}

export async function executeAreasInParallel(
  plan: StrategicPlan,
  workflowRunId: string
): Promise<ParallelExecutionResult[]>;
```

**Implementation:**
- Generate prompt for each area
- Use Task tool to dispatch subagents
- Collect results
- Update state as areas complete

**Note:** This will be called from the orchestration prompt, not directly from CLI.

---

### Task 8: Run Orchestrator Prompt

**File:** `src/tooling/w1/prompt-generator.ts`

**Add function:**
```typescript
export function generateRunOrchestratorPrompt(context: {
  planId: string;
  workflowRunId: string;
  bookSlug: string;
  artifactsDir: string;
  currentRun: number;
  maxRuns: number;
  areas: ImprovementArea[];
}): string;
```

**Prompt instructs Claude to:**
1. Dispatch Task tool for each area in parallel
2. Wait for all to complete
3. Run full validation
4. Check threshold with dynamic calculator
5. Either: trigger human gate OR start next run

---

## Phase 4: Human Gate Enhancement (Tasks 9-10)

### Task 9: Full Review Flow

**File:** `src/tooling/cli-commands/w1-human-gate.ts`

**Add `--full-review` option:**
```typescript
// When --full-review is passed:
// 1. Build complete HTML with pending changes
// 2. Output instructions to run core persona reviews
// 3. Set state to 'full_review' phase
```

**New prompt file:** `src/tooling/w1/prompt-generator.ts`
```typescript
export function generateFullReviewPrompt(context: {
  workflowRunId: string;
  bookSlug: string;
  builtHtmlPath: string;
}): string;
```

---

### Task 10: Build Book with Pending Changes

**File:** `src/tooling/cli-commands/build-book.ts` (new or modify existing)

**Add option:**
```bash
pnpm build:book --include-pending --run=<workflow-run-id>
```

**Logic:**
1. Copy book source to temp directory
2. Apply all chapter modifications from workflow artifacts
3. Build HTML
4. Return path to built HTML

---

## Phase 5: Integration & Testing (Tasks 11-12)

### Task 11: Update w1:strategic Command

**File:** `src/tooling/cli-commands/w1-strategic.ts`

**Changes:**
- Generate areas from analysis (Task 5)
- Output run orchestrator prompt instead of old sequential prompt
- Handle `--resume` with new state schema

---

### Task 12: End-to-End Test

**Create:** `src/tooling/w1/parallel-workflow.e2e.test.ts`

**Test scenarios:**
1. Fresh workflow generates multiple areas
2. Areas execute in parallel (mocked Task tool)
3. Validation triggers after all areas complete
4. Auto-retry when threshold not met
5. Human gate triggers at max runs
6. Full review option works

---

## Phase 6: Documentation (Tasks 13-15)

### Task 13: Update Workflow Documentation

**File:** `docs/workflows/w1-editing.md`

**Updates:**
- New architecture diagram
- Explain areas, cycles, runs terminology
- Update CLI command reference
- Add troubleshooting for parallel execution

---

### Task 14: Update Proposal Document

**File:** `docs/plans/proposals/w1-editing.md`

**Updates:**
- Mark parallel execution as implemented
- Update diagrams
- Add new CLI commands

---

### Task 15: Update Agent Architecture Doc

**File:** `docs/developers/agent-architecture.md`

**Add section:**
- "Parallel Area Execution Pattern"
- How to use Task tool for parallel work
- State coordination across subagents

---

## Execution Order

```
Phase 1 (Foundation):     Tasks 1-3  [can be parallel]
Phase 2 (Area Gen):       Tasks 4-5  [sequential]
Phase 3 (Parallel Exec):  Tasks 6-8  [sequential]
Phase 4 (Human Gate):     Tasks 9-10 [can be parallel]
Phase 5 (Integration):    Tasks 11-12 [sequential]
Phase 6 (Documentation):  Tasks 13-15 [can be parallel]
```

## Verification Checklist

- [ ] All new files have corresponding test files
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CLI help text updated
- [ ] Existing workflows still work (backward compatibility)
