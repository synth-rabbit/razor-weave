# Parallel Writer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable parallel chapter writing in W1 workflow using Task() subagents dispatched in batches of up to 5.

**Architecture:** CLI generates a shared context file (plan + style guides) and an orchestrator prompt that instructs Claude Code to dispatch Task() subagents for each chapter. Chapters are batched (≤5 per batch) and written in parallel to the artifacts directory.

**Tech Stack:** TypeScript, Node.js fs module, existing W1 prompt infrastructure

---

### Task 1: Add generateSharedContext function

**Files:**
- Modify: `src/tooling/w1/prompt-generator.ts`
- Test: `src/tooling/w1/prompt-generator.test.ts`

**Step 1: Write the failing test**

Add to `src/tooling/w1/prompt-generator.test.ts`:

```typescript
describe('generateSharedContext', () => {
  it('includes workflow run info', () => {
    const context = generateSharedContext({
      runId: 'wfrun_test123',
      bookTitle: 'Test Book',
      bookSlug: 'test-book',
      chapterCount: 4,
      plan: {
        plan_id: 'plan-123',
        summary: 'Test improvement plan',
        target_issues: [
          { issue_id: 'issue-001', severity: 'high', description: 'Test issue' }
        ],
        constraints: {
          max_chapters_modified: 5,
          preserve_structure: true,
          word_count_target: 'maintain_or_reduce'
        }
      },
      contentStyleGuide: '# Content Style Guide\nTest content.',
      mechanicsStyleGuide: '# Mechanics Style Guide\nTest mechanics.'
    });

    expect(context).toContain('wfrun_test123');
    expect(context).toContain('Test Book');
    expect(context).toContain('test-book');
    expect(context).toContain('4');
  });

  it('includes plan summary and target issues', () => {
    const context = generateSharedContext({
      runId: 'wfrun_test123',
      bookTitle: 'Test Book',
      bookSlug: 'test-book',
      chapterCount: 4,
      plan: {
        plan_id: 'plan-123',
        summary: 'Test improvement plan',
        target_issues: [
          { issue_id: 'issue-001', severity: 'high', description: 'Test issue' }
        ],
        constraints: {
          max_chapters_modified: 5,
          preserve_structure: true,
          word_count_target: 'maintain_or_reduce'
        }
      },
      contentStyleGuide: '# Content Style Guide',
      mechanicsStyleGuide: '# Mechanics Style Guide'
    });

    expect(context).toContain('Test improvement plan');
    expect(context).toContain('issue-001');
    expect(context).toContain('high');
    expect(context).toContain('Test issue');
  });

  it('includes both style guides', () => {
    const context = generateSharedContext({
      runId: 'wfrun_test123',
      bookTitle: 'Test Book',
      bookSlug: 'test-book',
      chapterCount: 2,
      plan: {
        plan_id: 'plan-123',
        summary: 'Summary',
        target_issues: [],
        constraints: { max_chapters_modified: 5, preserve_structure: true, word_count_target: 'maintain_or_reduce' }
      },
      contentStyleGuide: '# Content Style Guide\nUse second person.',
      mechanicsStyleGuide: '# Mechanics Style Guide\nUse 4d6.'
    });

    expect(context).toContain('# Content Style Guide');
    expect(context).toContain('Use second person.');
    expect(context).toContain('# Mechanics Style Guide');
    expect(context).toContain('Use 4d6.');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/tooling/w1/prompt-generator.test.ts`
Expected: FAIL with "generateSharedContext is not defined" or similar

**Step 3: Write minimal implementation**

Add to `src/tooling/w1/prompt-generator.ts`:

```typescript
export interface SharedContextInput {
  runId: string;
  bookTitle: string;
  bookSlug: string;
  chapterCount: number;
  plan: {
    plan_id: string;
    summary: string;
    target_issues: Array<{ issue_id: string; severity: string; description: string }>;
    constraints: {
      max_chapters_modified: number;
      preserve_structure: boolean;
      word_count_target: string;
    };
  };
  contentStyleGuide: string;
  mechanicsStyleGuide: string;
}

export function generateSharedContext(input: SharedContextInput): string {
  const { runId, bookTitle, bookSlug, chapterCount, plan, contentStyleGuide, mechanicsStyleGuide } = input;

  const issuesTable = plan.target_issues.length > 0
    ? plan.target_issues.map(i => `| ${i.issue_id} | ${i.severity} | ${i.description} |`).join('\n')
    : '| (none) | - | - |';

  return `# W1 Writer Shared Context

## Workflow Run
- Run ID: ${runId}
- Book: ${bookTitle} (${bookSlug})
- Chapters to modify: ${chapterCount}

## Improvement Plan Summary
${plan.summary}

### Target Issues
| ID | Severity | Description |
|----|----------|-------------|
${issuesTable}

### Constraints
- Max chapters: ${plan.constraints.max_chapters_modified}
- Preserve structure: ${plan.constraints.preserve_structure ? 'yes' : 'no'}
- Word count target: ${plan.constraints.word_count_target}

## Style Guides

### Content Style Guide
${contentStyleGuide}

### Mechanics Style Guide
${mechanicsStyleGuide}

## Cross-Chapter Consistency Notes
- Use consistent terminology (see style guide tables)
- Example characters referenced across chapters should match
- Quick-reference table formatting should be uniform
`;
}
```

**Step 4: Update exports in index.ts**

Add to `src/tooling/w1/index.ts`:

```typescript
export { generateSharedContext, type SharedContextInput } from './prompt-generator.js';
```

**Step 5: Run test to verify it passes**

Run: `pnpm test -- src/tooling/w1/prompt-generator.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/tooling/w1/prompt-generator.ts src/tooling/w1/prompt-generator.test.ts src/tooling/w1/index.ts
git commit -m "feat(w1): add generateSharedContext for parallel writer"
```

---

### Task 2: Add generateOrchestratorPrompt function

**Files:**
- Modify: `src/tooling/w1/prompt-generator.ts`
- Test: `src/tooling/w1/prompt-generator.test.ts`

**Step 1: Write the failing test**

Add to `src/tooling/w1/prompt-generator.test.ts`:

```typescript
describe('generateOrchestratorPrompt', () => {
  it('includes run ID and shared context path', () => {
    const prompt = generateOrchestratorPrompt({
      runId: 'wfrun_test123',
      sharedContextPath: 'data/w1-prompts/wfrun_test123/shared-context.md',
      chapters: [
        {
          chapterId: '06-character-creation',
          sourcePath: 'books/core/v1/chapters/06-character-creation.md',
          outputPath: 'data/w1-artifacts/wfrun_test123/chapters/06-character-creation.md',
          modifications: ['Add quick-start box', 'Add example characters']
        }
      ],
      batchSize: 5
    });

    expect(prompt).toContain('wfrun_test123');
    expect(prompt).toContain('shared-context.md');
  });

  it('batches chapters correctly when under batch size', () => {
    const prompt = generateOrchestratorPrompt({
      runId: 'wfrun_test123',
      sharedContextPath: 'data/w1-prompts/wfrun_test123/shared-context.md',
      chapters: [
        { chapterId: 'ch1', sourcePath: 's1', outputPath: 'o1', modifications: ['mod1'] },
        { chapterId: 'ch2', sourcePath: 's2', outputPath: 'o2', modifications: ['mod2'] },
        { chapterId: 'ch3', sourcePath: 's3', outputPath: 'o3', modifications: ['mod3'] }
      ],
      batchSize: 5
    });

    expect(prompt).toContain('Batch 1');
    expect(prompt).not.toContain('Batch 2');
    expect(prompt).toContain('ch1');
    expect(prompt).toContain('ch2');
    expect(prompt).toContain('ch3');
  });

  it('creates multiple batches when over batch size', () => {
    const chapters = Array.from({ length: 7 }, (_, i) => ({
      chapterId: `ch${i + 1}`,
      sourcePath: `s${i + 1}`,
      outputPath: `o${i + 1}`,
      modifications: [`mod${i + 1}`]
    }));

    const prompt = generateOrchestratorPrompt({
      runId: 'wfrun_test123',
      sharedContextPath: 'data/w1-prompts/wfrun_test123/shared-context.md',
      chapters,
      batchSize: 5
    });

    expect(prompt).toContain('Batch 1');
    expect(prompt).toContain('Batch 2');
    expect(prompt).toContain('ch1');
    expect(prompt).toContain('ch6');
    expect(prompt).toContain('ch7');
  });

  it('includes subagent prompt template', () => {
    const prompt = generateOrchestratorPrompt({
      runId: 'wfrun_test123',
      sharedContextPath: 'data/w1-prompts/wfrun_test123/shared-context.md',
      chapters: [
        { chapterId: 'ch1', sourcePath: 's1', outputPath: 'o1', modifications: ['mod1'] }
      ],
      batchSize: 5
    });

    expect(prompt).toContain('Subagent Prompt Template');
    expect(prompt).toContain('Task()');
  });

  it('includes save command at end', () => {
    const prompt = generateOrchestratorPrompt({
      runId: 'wfrun_test123',
      sharedContextPath: 'data/w1-prompts/wfrun_test123/shared-context.md',
      chapters: [
        { chapterId: 'ch1', sourcePath: 's1', outputPath: 'o1', modifications: ['mod1'] }
      ],
      batchSize: 5
    });

    expect(prompt).toContain('pnpm w1:content-modify --save-writer');
    expect(prompt).toContain('--run=wfrun_test123');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/tooling/w1/prompt-generator.test.ts`
Expected: FAIL with "generateOrchestratorPrompt is not defined"

**Step 3: Write minimal implementation**

Add to `src/tooling/w1/prompt-generator.ts`:

```typescript
export interface ChapterAssignment {
  chapterId: string;
  sourcePath: string;
  outputPath: string;
  modifications: string[];
}

export interface OrchestratorInput {
  runId: string;
  sharedContextPath: string;
  chapters: ChapterAssignment[];
  batchSize: number;
}

export function generateOrchestratorPrompt(input: OrchestratorInput): string {
  const { runId, sharedContextPath, chapters, batchSize } = input;

  // Split chapters into batches
  const batches: ChapterAssignment[][] = [];
  for (let i = 0; i < chapters.length; i += batchSize) {
    batches.push(chapters.slice(i, i + batchSize));
  }

  // Generate batch sections
  const batchSections = batches.map((batch, index) => {
    const chapterRows = batch.map(ch =>
      `| ${ch.chapterId} | ${ch.sourcePath} | ${ch.outputPath} | ${ch.modifications.join('; ')} |`
    ).join('\n');

    return `### Batch ${index + 1}
Dispatch these Task() calls in a single message:

| Chapter | Source | Output | Modifications |
|---------|--------|--------|---------------|
${chapterRows}
`;
  }).join('\n');

  return `# W1 Writer Orchestrator

You are coordinating parallel chapter modifications for workflow run \`${runId}\`.

## Instructions

1. Read the shared context: \`${sharedContextPath}\`
2. Dispatch chapter writers in batches (max ${batchSize} parallel)
3. Wait for each batch to complete before starting the next
4. After all chapters are written, confirm completion

## Chapter Assignments

${batchSections}

## Subagent Prompt Template

For each Task(), use subagent_type="general-purpose" and this prompt:

\`\`\`
Read \`${sharedContextPath}\` for style guides and plan context.

Modify chapter: {source_path}
Write output to: {output_path}

Modifications to apply:
{list of modifications}

Follow all style guide conventions. Preserve existing structure where not explicitly modified.
Write the complete modified chapter to the output path.
\`\`\`

## Output Requirements

After all chapters are written, save results:
\`\`\`bash
pnpm w1:content-modify --save-writer --run=${runId} --chapters=data/w1-artifacts/${runId}/chapters/
\`\`\`
`;
}
```

**Step 4: Update exports in index.ts**

Add to `src/tooling/w1/index.ts`:

```typescript
export {
  generateOrchestratorPrompt,
  type OrchestratorInput,
  type ChapterAssignment
} from './prompt-generator.js';
```

**Step 5: Run test to verify it passes**

Run: `pnpm test -- src/tooling/w1/prompt-generator.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/tooling/w1/prompt-generator.ts src/tooling/w1/prompt-generator.test.ts src/tooling/w1/index.ts
git commit -m "feat(w1): add generateOrchestratorPrompt for parallel writer"
```

---

### Task 3: Add writeSharedContext to PromptWriter

**Files:**
- Modify: `src/tooling/w1/prompt-writer.ts`
- Test: `src/tooling/w1/prompt-writer.test.ts` (create if needed)

**Step 1: Write the failing test**

Create `src/tooling/w1/prompt-writer.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { W1PromptWriter } from './prompt-writer.js';

describe('W1PromptWriter', () => {
  const testRunId = 'wfrun_test_writer';
  const testPromptsDir = `data/w1-prompts/${testRunId}`;
  let writer: W1PromptWriter;

  beforeEach(() => {
    writer = new W1PromptWriter({ runId: testRunId });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testPromptsDir)) {
      rmSync(testPromptsDir, { recursive: true });
    }
  });

  describe('writeSharedContext', () => {
    it('writes shared context to correct path', () => {
      const content = '# Test Shared Context\nThis is test content.';
      const path = writer.writeSharedContext(content);

      expect(path).toContain('shared-context.md');
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, 'utf-8')).toBe(content);
    });

    it('creates directory if it does not exist', () => {
      const content = '# Test';
      const path = writer.writeSharedContext(content);

      expect(existsSync(testPromptsDir)).toBe(true);
      expect(existsSync(path)).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/tooling/w1/prompt-writer.test.ts`
Expected: FAIL with "writeSharedContext is not a function" or similar

**Step 3: Write minimal implementation**

Add to `src/tooling/w1/prompt-writer.ts`:

```typescript
writeSharedContext(content: string): string {
  const path = join(this.promptsDir, 'shared-context.md');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf-8');
  return path;
}
```

(Add `dirname` to the imports from `node:path` if not already imported)

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/tooling/w1/prompt-writer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/w1/prompt-writer.ts src/tooling/w1/prompt-writer.test.ts
git commit -m "feat(w1): add writeSharedContext to PromptWriter"
```

---

### Task 4: Update CLI to generate parallel writer prompts

**Files:**
- Modify: `src/tooling/cli-commands/w1-content-modify.ts`

**Step 1: Read the existing handleGenerateWriterPrompt function**

Review the current implementation to understand the structure.

**Step 2: Modify to generate shared context and orchestrator prompt**

Update `handleGenerateWriterPrompt` in `src/tooling/cli-commands/w1-content-modify.ts`:

```typescript
async function handleGenerateWriterPrompt(
  db: Database.Database,
  projectRoot: string,
  runId: string
): Promise<void> {
  console.log(DOUBLE_LINE);
  console.log('W1 CONTENT MODIFY - GENERATE WRITER PROMPT');
  console.log(DOUBLE_LINE);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);
  const bookRepo = new BookRepository(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId);
  if (!workflowRun) {
    console.error(`  ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }
  console.log(`  OK Workflow run: ${runId}`);

  // Get book info
  const book = bookRepo.getById(workflowRun.book_id);
  if (!book) {
    console.error(`  ERROR: Book not found: ${workflowRun.book_id}`);
    process.exit(1);
  }
  console.log(`  OK Book: ${book.title} (${book.slug})`);

  // Load plan
  const plan = loadPlanForRun(projectRoot, runId);
  if (!plan) {
    console.error(`  ERROR: Plan not found for run ${runId}`);
    console.error(`  Expected: data/w1-artifacts/${runId}/plan.json`);
    process.exit(1);
  }
  console.log(`  OK Plan loaded: ${plan.plan_id}`);

  // Get chapter paths
  const chapterPaths = getOriginalChapterPaths(projectRoot, book.source_path, plan);
  if (chapterPaths.length === 0) {
    console.error(`  ERROR: No chapters found for modification`);
    process.exit(1);
  }
  console.log(`  OK Chapters to modify: ${chapterPaths.length}`);

  // Load style guides
  const styleGuidesDir = resolve(projectRoot, 'docs/style_guides');
  const contentStyleGuide = existsSync(join(styleGuidesDir, 'content.md'))
    ? readFileSync(join(styleGuidesDir, 'content.md'), 'utf-8')
    : '(No content style guide found)';
  const mechanicsStyleGuide = existsSync(join(styleGuidesDir, 'mechanics.md'))
    ? readFileSync(join(styleGuidesDir, 'mechanics.md'), 'utf-8')
    : '(No mechanics style guide found)';

  // Initialize prompt writer
  const promptWriter = new W1PromptWriter({ runId });

  // Generate and write shared context
  const sharedContext = generateSharedContext({
    runId,
    bookTitle: book.title,
    bookSlug: book.slug,
    chapterCount: chapterPaths.length,
    plan: {
      plan_id: plan.plan_id,
      summary: plan.summary,
      target_issues: plan.target_issues.map(i => ({
        issue_id: i.issue_id,
        severity: i.severity,
        description: i.description
      })),
      constraints: plan.constraints
    },
    contentStyleGuide,
    mechanicsStyleGuide
  });
  const sharedContextPath = promptWriter.writeSharedContext(sharedContext);
  console.log(`  OK Shared context written: ${sharedContextPath}`);

  // Build chapter assignments
  const chapters: ChapterAssignment[] = plan.chapter_modifications.map(mod => ({
    chapterId: mod.chapter_id,
    sourcePath: chapterPaths.find(p => p.includes(mod.chapter_id)) || `books/${book.slug}/chapters/${mod.chapter_id}.md`,
    outputPath: `data/w1-artifacts/${runId}/chapters/${mod.chapter_id}.md`,
    modifications: mod.modifications.map(m => m.instruction.slice(0, 60) + (m.instruction.length > 60 ? '...' : ''))
  }));

  // Generate orchestrator prompt
  const orchestratorPrompt = generateOrchestratorPrompt({
    runId,
    sharedContextPath: `data/w1-prompts/${runId}/shared-context.md`,
    chapters,
    batchSize: 5
  });
  const promptPath = promptWriter.writeWriterPrompt(orchestratorPrompt);
  console.log(`  OK Orchestrator prompt written: ${promptPath}`);

  // Update workflow status
  workflowRepo.updateStatus(runId, 'running');
  workflowRepo.setCurrentAgent(runId, 'writer');

  console.log('');
  console.log(SINGLE_LINE);
  console.log('NEXT STEPS');
  console.log(SINGLE_LINE);
  console.log('');
  console.log(`1. Read the orchestrator prompt: ${promptPath}`);
  console.log('2. Dispatch subagents in batches as instructed');
  console.log('3. After all chapters are written, save results:');
  console.log(`   pnpm w1:content-modify --save-writer --run=${runId} --chapters=data/w1-artifacts/${runId}/chapters/`);
  console.log('');
  console.log(DOUBLE_LINE);
}
```

**Step 3: Add missing imports**

At the top of the file, add:

```typescript
import {
  generateWriterPrompt,
  generateEditorPrompt,
  generateDomainExpertPrompt,
  generateSharedContext,
  generateOrchestratorPrompt,
  type ChapterAssignment,
} from '../w1/prompt-generator.js';
```

**Step 4: Test manually**

Run: `pnpm w1:content-modify --run=wfrun_miby9oo6_a7xlw7`

Expected output should show:
- Shared context written
- Orchestrator prompt written
- Instructions for dispatching subagents

**Step 5: Commit**

```bash
git add src/tooling/cli-commands/w1-content-modify.ts
git commit -m "feat(w1): update CLI to generate parallel writer prompts"
```

---

### Task 5: Integration test - verify full flow

**Files:**
- Test manually with existing workflow run

**Step 1: Reset test workflow (if needed)**

Create a fresh workflow run or use an existing one.

**Step 2: Generate prompts**

Run: `pnpm w1:content-modify --run=<runId>`

**Step 3: Verify outputs**

Check:
- `data/w1-prompts/<runId>/shared-context.md` exists and contains style guides
- `data/w1-prompts/<runId>/writer.txt` is an orchestrator prompt with batches

**Step 4: Verify orchestrator prompt structure**

The writer.txt should contain:
- Instructions for batch dispatch
- Chapter assignments table
- Subagent prompt template
- Save command

**Step 5: Commit final changes if any**

```bash
git add -A
git commit -m "test(w1): verify parallel writer integration"
```

---

### Task 6: Update documentation

**Files:**
- Modify: `docs/workflows/w1-editing.md`

**Step 1: Add parallel writing section**

Add to `docs/workflows/w1-editing.md` after the Writer section:

```markdown
### Parallel Chapter Writing

When modifying multiple chapters, the writer phase uses parallel subagents:

1. CLI generates `shared-context.md` with plan summary and style guides
2. CLI generates an orchestrator prompt listing chapter batches
3. Claude Code dispatches Task() subagents (up to 5 per batch)
4. Each subagent reads shared context, modifies one chapter
5. After batch completes, next batch starts
6. Save all results with `--save-writer`

This pattern matches the review system's parallel execution approach.
```

**Step 2: Commit**

```bash
git add docs/workflows/w1-editing.md
git commit -m "docs(w1): add parallel writer documentation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add generateSharedContext | prompt-generator.ts, test |
| 2 | Add generateOrchestratorPrompt | prompt-generator.ts, test |
| 3 | Add writeSharedContext | prompt-writer.ts, test |
| 4 | Update CLI | w1-content-modify.ts |
| 5 | Integration test | manual |
| 6 | Update docs | w1-editing.md |

**Estimated time:** 30-45 minutes
**Test commands:** `pnpm test -- src/tooling/w1`
