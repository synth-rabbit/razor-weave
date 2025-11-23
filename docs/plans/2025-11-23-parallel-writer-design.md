# Parallel Writer Agent Design

**Date:** 2025-11-23
**Status:** Approved
**Purpose:** Enable parallel chapter writing in W1 workflow using Task() subagents

---

## Overview

The W1 writer agent currently processes chapters sequentially. This design enables parallel chapter modification using Task() subagents dispatched in batches of up to 5, matching the pattern used in the review system.

## Architecture

The parallel writer pattern adds two components to the existing W1 content-modify flow:

1. **Shared Context File** - CLI generates `data/w1-prompts/{runId}/shared-context.md` containing:
   - Improvement plan summary (target issues, constraints)
   - Full style guides (content + mechanics)
   - Cross-chapter consistency notes

2. **Orchestrator Prompt** - The existing writer prompt (`writer.txt`) becomes an orchestration prompt that:
   - Instructs Claude Code to dispatch Task() subagents
   - Lists explicit chapter assignments in batches of ≤5
   - Specifies the subagent prompt template

### Flow

```
CLI generates:
├── shared-context.md     (plan + style guides)
└── writer.txt            (orchestration instructions)

Claude Code reads writer.txt, then:
├── Batch 1: Task() × up to 5 chapters in parallel
│   Each subagent: reads shared-context.md → writes chapter → returns
├── Wait for batch completion
├── Batch 2: Task() × remaining chapters
└── ... until all chapters written

All output goes to: data/w1-artifacts/{runId}/chapters/
```

The existing `--save-writer` command works unchanged.

---

## Shared Context File Structure

The CLI generates `data/w1-prompts/{runId}/shared-context.md`:

```markdown
# W1 Writer Shared Context

## Workflow Run
- Run ID: wfrun_xxx
- Book: {title} ({slug})
- Chapters to modify: {count}

## Improvement Plan Summary
{plan.summary}

### Target Issues
| ID | Severity | Description |
|----|----------|-------------|
{for each issue: id, severity, brief description}

### Constraints
- Max chapters: {n}
- Preserve structure: {yes/no}
- Word count target: {maintain/allow_growth}

## Style Guides

### Content Style Guide
{full content style guide}

### Mechanics Style Guide
{full mechanics style guide}

## Cross-Chapter Consistency Notes
- Use consistent terminology (see style guide tables)
- Example characters referenced across chapters should match
- Quick-reference table formatting should be uniform
```

This file is ~3-5KB depending on style guide length. Each subagent reads it once at the start of their task.

---

## Orchestrator Prompt Structure

The writer prompt (`data/w1-prompts/{runId}/writer.txt`) becomes:

```markdown
# W1 Writer Orchestrator

You are coordinating parallel chapter modifications for workflow run `{runId}`.

## Instructions

1. Read the shared context: `data/w1-prompts/{runId}/shared-context.md`
2. Dispatch chapter writers in batches (max 5 parallel)
3. Wait for each batch to complete before starting the next
4. After all chapters are written, confirm completion

## Chapter Assignments

### Batch 1
Dispatch these Task() calls in a single message:

| Chapter | Source | Output | Modifications |
|---------|--------|--------|---------------|
| 06-character-creation | books/core/v1/chapters/06-character-creation.md | data/w1-artifacts/{runId}/chapters/06-character-creation.md | Add quick-start box, suggested skills table, 3 example characters |
| 08-actions-checks-outcomes | ... | ... | Add outcome tiers table, Edge/Burden table, DC examples |
{etc for up to 5 chapters}

### Batch 2 (if needed)
{remaining chapters}

## Subagent Prompt Template

For each Task(), use this prompt:
"""
Read `data/w1-prompts/{runId}/shared-context.md` for style guides and plan context.

Modify chapter: {source_path}
Write output to: {output_path}

Modifications to apply:
{list of modifications for this chapter}

Follow all style guide conventions. Preserve existing structure where not explicitly modified.
"""

## Output Requirements

After all chapters are written, save results:
```bash
pnpm w1:content-modify --save-writer --run={runId} --chapters=data/w1-artifacts/{runId}/chapters/
```
```

---

## Implementation Changes

### 1. `src/tooling/w1/prompt-generator.ts`

Add two new functions:

```typescript
export function generateSharedContext(context: SharedContextInput): string {
  // Returns the shared context markdown with:
  // - Workflow run info
  // - Plan summary and target issues table
  // - Constraints
  // - Full style guides
  // - Cross-chapter consistency notes
}

export function generateOrchestratorPrompt(context: OrchestratorInput): string {
  // Returns the orchestrator prompt with:
  // - Instructions for batch dispatch
  // - Chapter assignments organized into batches of ≤5
  // - Subagent prompt template
  // - Save command
}
```

### 2. `src/tooling/w1/prompt-writer.ts`

Add method:

```typescript
writeSharedContext(content: string): string {
  const path = join(this.promptsDir, 'shared-context.md');
  writeFileSync(path, content, 'utf-8');
  return path;
}
```

### 3. `src/tooling/cli-commands/w1-content-modify.ts`

In `handleGenerateWriterPrompt()`:

```typescript
// Generate and write shared context
const sharedContext = generateSharedContext({ plan, styleGuides, book });
const sharedContextPath = promptWriter.writeSharedContext(sharedContext);

// Generate orchestrator prompt with batched chapters
const orchestratorPrompt = generateOrchestratorPrompt({
  runId,
  chapters: chapterPaths,
  plan,
  batchSize: 5,
});
const promptPath = promptWriter.writeWriterPrompt(orchestratorPrompt);

// Update CLI output to explain parallel dispatch
console.log('1. Read the orchestrator prompt');
console.log('2. Dispatch subagents in batches as instructed');
console.log('3. Save results after all chapters complete');
```

### No Changes Needed

- `--save-writer` works as-is (reads from chapters directory)
- Result saver, artifact registry unchanged
- Database schema unchanged

### Estimated Scope

~150-200 lines of new/modified code across 3 files.

---

## Testing

### Unit Tests

Add to `prompt-generator.test.ts`:

```typescript
describe('generateSharedContext', () => {
  it('includes plan summary', () => { ... });
  it('includes full style guides', () => { ... });
  it('includes cross-chapter consistency notes', () => { ... });
});

describe('generateOrchestratorPrompt', () => {
  it('batches chapters into groups of 5 or fewer', () => { ... });
  it('respects execution_order phases for batch ordering', () => { ... });
  it('includes subagent prompt template', () => { ... });
});
```

### Manual Testing

Run the full flow with a multi-chapter plan and verify:
- Shared context file is readable by subagents
- Subagents write to correct output paths
- Batching works (first batch completes before second starts)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| 1 chapter | Single Task() dispatch, no batching |
| Exactly 5 chapters | Single batch, no sequencing needed |
| 6+ chapters | Multiple batches, respect execution_order |
| Subagent failure | Orchestrator notes failure, continues with others, reports at end |

---

## Considerations

**Subagent context window:** Each subagent only needs shared-context + one chapter (~20-30KB typically). Well within limits.

**Error handling:** If a subagent fails, the orchestrator should note which chapter failed and continue with others. Failed chapters can be retried individually.

**Cost:** Parallel subagents use more concurrent tokens but complete faster. Net cost is similar; wall-clock time is significantly better.

**Consistency:** All subagents read the same shared-context.md, ensuring uniform style guide application across chapters.
