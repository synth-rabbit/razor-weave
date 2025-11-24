# W1 Prompt-Based Architecture Refactor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor W1 CLI commands to generate prompt files (like the review system) instead of calling Anthropic API directly.

**Architecture:** CLI commands generate prompt files to `data/w1-prompts/{runId}/`, output "next step" instructions for Claude Code to execute, and provide `--save` subcommands for storing results back to the workflow.

**Tech Stack:** TypeScript, better-sqlite3, existing workflow infrastructure

---

## Task 1: Create W1 Prompt Generator

**Files:**
- Create: `src/tooling/w1/prompt-generator.ts`
- Reference: `src/tooling/reviews/prompt-generator.ts`

**Step 1: Create directory and file with PM planning prompt generator**

```typescript
// src/tooling/w1/prompt-generator.ts
import type Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface PlanningPromptContext {
  runId: string;
  bookId: string;
  bookName: string;
  analysisPath: string;
  styleGuidesDir: string;
}

export function generatePlanningPrompt(
  db: Database.Database,
  context: PlanningPromptContext
): string {
  // Load analysis content
  const analysisContent = readFileSync(context.analysisPath, 'utf-8');

  // Load style guides if available
  let styleGuidesContent = '';
  if (existsSync(join(context.styleGuidesDir, 'content.md'))) {
    styleGuidesContent += '\n### Content Style Guide\n';
    styleGuidesContent += readFileSync(join(context.styleGuidesDir, 'content.md'), 'utf-8');
  }
  if (existsSync(join(context.styleGuidesDir, 'mechanics.md'))) {
    styleGuidesContent += '\n### Mechanics Style Guide\n';
    styleGuidesContent += readFileSync(join(context.styleGuidesDir, 'mechanics.md'), 'utf-8');
  }

  // Load PM prompt template
  const pmPromptPath = join(process.cwd(), 'src/tooling/agents/prompts/pm-analysis-to-plan.md');
  const pmPromptTemplate = existsSync(pmPromptPath)
    ? readFileSync(pmPromptPath, 'utf-8')
    : '';

  return `# W1 Planning Task

You are the PM agent for W1 workflow run \`${context.runId}\`.

## Context

- **Book:** ${context.bookName} (${context.bookId})
- **Workflow Run:** ${context.runId}

## Review Analysis

${analysisContent}

## Style Guides
${styleGuidesContent || '_No style guides available_'}

## Task

${pmPromptTemplate}

Analyze the review feedback above and create an improvement plan.

## Output Requirements

After creating the plan, save it using this command:

\`\`\`bash
pnpm w1:planning --save --run=${context.runId} --plan=<path-to-your-plan.json>
\`\`\`

The plan JSON must include:
- plan_id: string
- summary: string
- target_issues: array of issues to address
- chapter_modifications: array of chapters with modifications
- constraints: object with max_chapters_modified, preserve_structure, etc.
- estimated_impact: string

Write the plan to: \`data/w1-artifacts/${context.runId}/plan.json\`
`;
}
```

**Step 2: Run typecheck to verify no errors**

Run: `pnpm exec tsc --noEmit src/tooling/w1/prompt-generator.ts`
Expected: No errors (or create directory first)

**Step 3: Commit**

```bash
git add src/tooling/w1/prompt-generator.ts
git commit -m "feat(w1): add prompt generator for PM planning"
```

---

## Task 2: Add Writer, Editor, Domain Expert Prompt Generators

**Files:**
- Modify: `src/tooling/w1/prompt-generator.ts`

**Step 1: Add WriterPromptContext and generateWriterPrompt**

```typescript
export interface WriterPromptContext {
  runId: string;
  planPath: string;
  chapterPaths: string[];
  styleGuidesDir: string;
}

export function generateWriterPrompt(context: WriterPromptContext): string {
  const plan = readFileSync(context.planPath, 'utf-8');

  const chaptersContent = context.chapterPaths.map(p => {
    const content = readFileSync(p, 'utf-8');
    return `### ${p}\n\`\`\`markdown\n${content}\n\`\`\``;
  }).join('\n\n');

  let styleGuidesContent = '';
  if (existsSync(join(context.styleGuidesDir, 'content.md'))) {
    styleGuidesContent += readFileSync(join(context.styleGuidesDir, 'content.md'), 'utf-8');
  }

  return `# W1 Writer Task

You are the Writer agent for W1 workflow run \`${context.runId}\`.

## Improvement Plan

\`\`\`json
${plan}
\`\`\`

## Chapters to Modify

${chaptersContent}

## Style Guide

${styleGuidesContent || '_No style guide available_'}

## Task

Implement the modifications specified in the plan. For each chapter:
1. Apply the changes described in chapter_modifications
2. Maintain the existing structure and voice
3. Follow the style guide

## Output Requirements

For each modified chapter, write the updated content to:
\`data/w1-artifacts/${context.runId}/chapters/{chapter-id}.md\`

Then save results:
\`\`\`bash
pnpm w1:content-modify --save --run=${context.runId} --chapters=data/w1-artifacts/${context.runId}/chapters/
\`\`\`
`;
}
```

**Step 2: Add EditorPromptContext and generateEditorPrompt**

```typescript
export interface EditorPromptContext {
  runId: string;
  chapterPaths: string[];
  styleGuidesDir: string;
}

export function generateEditorPrompt(context: EditorPromptContext): string {
  const chaptersContent = context.chapterPaths.map(p => {
    const content = readFileSync(p, 'utf-8');
    return `### ${p}\n\`\`\`markdown\n${content}\n\`\`\``;
  }).join('\n\n');

  let styleGuidesContent = '';
  ['content.md', 'formatting.md', 'mechanics.md'].forEach(guide => {
    const guidePath = join(context.styleGuidesDir, guide);
    if (existsSync(guidePath)) {
      styleGuidesContent += `\n### ${guide}\n${readFileSync(guidePath, 'utf-8')}`;
    }
  });

  return `# W1 Editor Review Task

You are the Editor agent for W1 workflow run \`${context.runId}\`.

## Chapters to Review

${chaptersContent}

## Style Guides
${styleGuidesContent || '_No style guides available_'}

## Task

Review the chapters for:
- Grammar and spelling errors
- Clarity and readability issues
- Style guide compliance
- Consistency in terminology

## Output Requirements

Return a JSON review result:

\`\`\`json
{
  "approved": boolean,
  "feedback": [
    {
      "issue": "description",
      "location": "chapter/section",
      "suggestion": "fix",
      "severity": "error|warning|suggestion"
    }
  ],
  "summary": "overall assessment"
}
\`\`\`

Save results:
\`\`\`bash
pnpm w1:content-modify --save-editor --run=${context.runId} --result=<path-to-result.json>
\`\`\`
`;
}
```

**Step 3: Add DomainExpertPromptContext and generateDomainExpertPrompt**

```typescript
export interface DomainExpertPromptContext {
  runId: string;
  chapterPaths: string[];
  mechanicsGuidePath: string;
}

export function generateDomainExpertPrompt(context: DomainExpertPromptContext): string {
  const chaptersContent = context.chapterPaths.map(p => {
    const content = readFileSync(p, 'utf-8');
    return `### ${p}\n\`\`\`markdown\n${content}\n\`\`\``;
  }).join('\n\n');

  const mechanicsGuide = existsSync(context.mechanicsGuidePath)
    ? readFileSync(context.mechanicsGuidePath, 'utf-8')
    : '';

  return `# W1 Domain Expert Review Task

You are the Domain Expert agent for W1 workflow run \`${context.runId}\`.

## Chapters to Review

${chaptersContent}

## Mechanics Reference
${mechanicsGuide || '_No mechanics guide available_'}

## Task

Review for game design consistency:
- Rules contradictions between chapters
- Term inconsistencies
- Balance concerns
- Missing cross-references

## Output Requirements

Return a JSON review result:

\`\`\`json
{
  "approved": boolean,
  "issues": [
    {
      "type": "rules_contradiction|term_inconsistency|balance_concern|missing_reference",
      "description": "what's wrong",
      "location": "where",
      "impact": "critical|major|minor"
    }
  ],
  "summary": "overall assessment"
}
\`\`\`

Save results:
\`\`\`bash
pnpm w1:content-modify --save-domain --run=${context.runId} --result=<path-to-result.json>
\`\`\`
`;
}
```

**Step 4: Commit**

```bash
git add src/tooling/w1/prompt-generator.ts
git commit -m "feat(w1): add writer, editor, domain expert prompt generators"
```

---

## Task 3: Create W1 Prompt Writer

**Files:**
- Create: `src/tooling/w1/prompt-writer.ts`

**Step 1: Create prompt writer module**

```typescript
// src/tooling/w1/prompt-writer.ts
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface PromptWriterOptions {
  runId: string;
  baseDir?: string;
}

export class W1PromptWriter {
  private promptsDir: string;

  constructor(options: PromptWriterOptions) {
    const baseDir = options.baseDir || 'data/w1-prompts';
    this.promptsDir = join(baseDir, options.runId);
    mkdirSync(this.promptsDir, { recursive: true });
  }

  writePlanningPrompt(content: string): string {
    const path = join(this.promptsDir, 'pm-planning.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeWriterPrompt(content: string, chapterId?: string): string {
    const filename = chapterId ? `writer-${chapterId}.txt` : 'writer.txt';
    const path = join(this.promptsDir, filename);
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeEditorPrompt(content: string): string {
    const path = join(this.promptsDir, 'editor-review.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeDomainExpertPrompt(content: string): string {
    const path = join(this.promptsDir, 'domain-expert.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeMetricsPrompt(content: string): string {
    const path = join(this.promptsDir, 'pm-metrics.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeReleaseNotesPrompt(content: string): string {
    const path = join(this.promptsDir, 'release-notes.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  getPromptsDir(): string {
    return this.promptsDir;
  }
}
```

**Step 2: Create index.ts for exports**

```typescript
// src/tooling/w1/index.ts
export * from './prompt-generator.js';
export * from './prompt-writer.js';
```

**Step 3: Commit**

```bash
git add src/tooling/w1/
git commit -m "feat(w1): add prompt writer module"
```

---

## Task 4: Create W1 Result Saver

**Files:**
- Create: `src/tooling/w1/result-saver.ts`
- Modify: `src/tooling/w1/index.ts`

**Step 1: Create result saver for workflow state updates**

```typescript
// src/tooling/w1/result-saver.ts
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type Database from 'better-sqlite3';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';

export interface PlanningResult {
  plan: Record<string, unknown>;
  outputPath: string;
}

export interface ContentModifyResult {
  chapterPaths: string[];
  changelog: Array<{
    chapterId: string;
    changes: Array<{ type: string; target: string; summary: string }>;
  }>;
}

export interface ReviewResult {
  approved: boolean;
  feedback: Array<{ issue: string; location: string; suggestion: string; severity: string }>;
  summary: string;
}

export class W1ResultSaver {
  private runId: string;
  private db: Database.Database;
  private workflowRepo: WorkflowRepository;
  private artifactRegistry: ArtifactRegistry;

  constructor(db: Database.Database, runId: string) {
    this.runId = runId;
    this.db = db;
    this.workflowRepo = new WorkflowRepository(db);
    this.artifactRegistry = new ArtifactRegistry(db);
  }

  savePlanningResult(result: PlanningResult): void {
    // Ensure directory exists
    mkdirSync(dirname(result.outputPath), { recursive: true });

    // Write plan JSON
    writeFileSync(result.outputPath, JSON.stringify(result.plan, null, 2), 'utf-8');

    // Register artifact
    this.artifactRegistry.register({
      workflow_run_id: this.runId,
      artifact_type: 'improvement_plan',
      file_path: result.outputPath,
      metadata: JSON.stringify({ plan_id: result.plan.plan_id }),
    });

    // Update workflow metadata
    const run = this.workflowRepo.get(this.runId);
    if (run) {
      const metadata = JSON.parse(run.metadata || '{}');
      metadata.planPath = result.outputPath;
      metadata.planId = result.plan.plan_id;
      this.workflowRepo.updateMetadata(this.runId, metadata);
    }
  }

  saveEditorResult(result: ReviewResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflow_run_id: this.runId,
      artifact_type: 'editor_review',
      file_path: outputPath,
      metadata: JSON.stringify({ approved: result.approved }),
    });
  }

  saveDomainExpertResult(result: ReviewResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflow_run_id: this.runId,
      artifact_type: 'domain_expert_review',
      file_path: outputPath,
      metadata: JSON.stringify({ approved: result.approved }),
    });
  }

  saveModifiedChapters(result: ContentModifyResult): void {
    // Register each chapter as artifact
    for (const chapterPath of result.chapterPaths) {
      this.artifactRegistry.register({
        workflow_run_id: this.runId,
        artifact_type: 'modified_chapter',
        file_path: chapterPath,
        metadata: JSON.stringify({}),
      });
    }

    // Save changelog
    const changelogPath = `data/w1-artifacts/${this.runId}/changelog.json`;
    mkdirSync(dirname(changelogPath), { recursive: true });
    writeFileSync(changelogPath, JSON.stringify(result.changelog, null, 2), 'utf-8');
  }
}
```

**Step 2: Update index.ts**

```typescript
// src/tooling/w1/index.ts
export * from './prompt-generator.js';
export * from './prompt-writer.js';
export * from './result-saver.js';
```

**Step 3: Commit**

```bash
git add src/tooling/w1/
git commit -m "feat(w1): add result saver for workflow state updates"
```

---

## Task 5: Refactor w1-planning.ts CLI

**Files:**
- Modify: `src/tooling/cli-commands/w1-planning.ts`

**Step 1: Read current file to understand structure**

Run: `head -100 src/tooling/cli-commands/w1-planning.ts`

**Step 2: Rewrite to use prompt-based flow**

Replace the file with prompt-generation logic:

```typescript
// src/tooling/cli-commands/w1-planning.ts
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import Database from 'better-sqlite3';
import { execSync } from 'child_process';

import { WorkflowRepository } from '../workflows/repository.js';
import { generatePlanningPrompt } from '../w1/prompt-generator.js';
import { W1PromptWriter } from '../w1/prompt-writer.js';
import { W1ResultSaver } from '../w1/result-saver.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Constants
// ============================================================================

const BOX_WIDTH = 59;
const DOUBLE_LINE = '='.repeat(BOX_WIDTH);
const SINGLE_LINE = '-'.repeat(BOX_WIDTH);

function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// ============================================================================
// Argument Parsing
// ============================================================================

interface Args {
  book?: string;
  analysis?: string;
  save?: boolean;
  run?: string;
  plan?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (const arg of argv) {
    if (arg.startsWith('--book=')) args.book = arg.split('=')[1];
    else if (arg.startsWith('--analysis=')) args.analysis = arg.split('=')[1];
    else if (arg === '--save') args.save = true;
    else if (arg.startsWith('--run=')) args.run = arg.split('=')[1];
    else if (arg.startsWith('--plan=')) args.plan = arg.split('=')[1];
  }
  return args;
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const projectRoot = getProjectRoot();
  const dbPath = resolve(projectRoot, 'data/project.db');
  const args = parseArgs(process.argv.slice(2));

  // Initialize database
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  createTables(db);
  runMigrations(dbPath);

  const workflowRepo = new WorkflowRepository(db);

  // Mode: Save result
  if (args.save) {
    if (!args.run || !args.plan) {
      console.error('Usage: pnpm w1:planning --save --run=<runId> --plan=<path>');
      process.exit(1);
    }

    console.log(DOUBLE_LINE);
    console.log('W1 PLANNING - SAVE RESULT');
    console.log(DOUBLE_LINE);
    console.log('');

    const saver = new W1ResultSaver(db, args.run);
    const planPath = resolve(projectRoot, args.plan);

    if (!existsSync(planPath)) {
      console.error(`Plan file not found: ${planPath}`);
      process.exit(1);
    }

    const plan = JSON.parse(require('fs').readFileSync(planPath, 'utf-8'));
    const outputPath = `data/w1-artifacts/${args.run}/plan.json`;

    saver.savePlanningResult({ plan, outputPath: resolve(projectRoot, outputPath) });

    console.log(`  OK Plan saved to: ${outputPath}`);
    console.log('');
    console.log(SINGLE_LINE);
    console.log('NEXT STEP');
    console.log(SINGLE_LINE);
    console.log(`pnpm w1:content-modify --run=${args.run}`);

    db.close();
    return;
  }

  // Mode: Generate prompt
  if (!args.book || !args.analysis) {
    console.error('Usage: pnpm w1:planning --book=<bookId> --analysis=<path>');
    console.error('   or: pnpm w1:planning --save --run=<runId> --plan=<path>');
    process.exit(1);
  }

  console.log(DOUBLE_LINE);
  console.log('W1 PLANNING PHASE');
  console.log(DOUBLE_LINE);
  console.log('');

  // Verify book exists
  const bookQuery = db.prepare('SELECT * FROM books WHERE id = ?');
  const book = bookQuery.get(args.book) as { id: string; name: string } | undefined;
  if (!book) {
    console.error(`Book not found: ${args.book}`);
    process.exit(1);
  }
  console.log(`  OK Book: ${book.name} (${book.id})`);

  // Verify analysis exists
  const analysisPath = resolve(projectRoot, args.analysis);
  if (!existsSync(analysisPath)) {
    console.error(`Analysis file not found: ${analysisPath}`);
    process.exit(1);
  }
  console.log(`  OK Analysis: ${args.analysis}`);

  // Create workflow run
  const runId = workflowRepo.create({
    workflow_type: 'w1_editing',
    status: 'running',
    metadata: JSON.stringify({
      bookId: args.book,
      analysisPath: args.analysis,
      phase: 'planning',
    }),
  });
  console.log(`  OK Workflow run: ${runId}`);

  // Generate prompt
  const styleGuidesDir = resolve(projectRoot, 'docs/style_guides');
  const prompt = generatePlanningPrompt(db, {
    runId,
    bookId: args.book,
    bookName: book.name,
    analysisPath,
    styleGuidesDir,
  });

  // Write prompt
  const promptWriter = new W1PromptWriter({ runId });
  const promptPath = promptWriter.writePlanningPrompt(prompt);
  console.log(`  OK Prompt written: ${promptPath}`);

  console.log('');
  console.log(SINGLE_LINE);
  console.log('NEXT STEP');
  console.log(SINGLE_LINE);
  console.log(`1. Read the prompt: ${promptPath}`);
  console.log('2. Execute the planning task');
  console.log(`3. Save result: pnpm w1:planning --save --run=${runId} --plan=<path>`);
  console.log(DOUBLE_LINE);

  db.close();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**Step 3: Test the new CLI**

Run: `pnpm w1:planning --book=book_core --analysis=./data/reviews/analysis/campaign-20251122-191126-1p7dhyj4.md`
Expected: Generates prompt file, outputs next step instructions

**Step 4: Commit**

```bash
git add src/tooling/cli-commands/w1-planning.ts
git commit -m "refactor(w1): convert planning CLI to prompt-based flow"
```

---

## Task 6: Refactor w1-content-modify.ts CLI

**Files:**
- Modify: `src/tooling/cli-commands/w1-content-modify.ts`

**Step 1: Rewrite to use prompt-based flow**

The content-modify CLI needs to:
1. Generate writer prompt (from plan)
2. After writer executes, generate editor prompt
3. After editor executes, generate domain expert prompt
4. Handle --save variants for each step

```typescript
// Key additions to w1-content-modify.ts

// Add these modes:
// --generate-writer --run=<id>     → generates writer prompt
// --save-writer --run=<id> --chapters=<dir>  → saves writer output
// --generate-editor --run=<id>    → generates editor prompt
// --save-editor --run=<id> --result=<path>   → saves editor result
// --generate-domain --run=<id>    → generates domain expert prompt
// --save-domain --run=<id> --result=<path>   → saves domain expert result
```

Full implementation follows same pattern as Task 5.

**Step 2: Commit**

```bash
git add src/tooling/cli-commands/w1-content-modify.ts
git commit -m "refactor(w1): convert content-modify CLI to prompt-based flow"
```

---

## Task 7: Delete Old Invoker Files

**Files:**
- Delete: `src/tooling/agents/invoker-pm.ts`
- Delete: `src/tooling/agents/invoker-writer.ts`
- Delete: `src/tooling/agents/invoker-editor.ts`
- Delete: `src/tooling/agents/invoker-domain-expert.ts`
- Delete: `src/tooling/agents/invoker-pm-metrics.ts`
- Delete: `src/tooling/agents/invoker-release-notes.ts`

**Step 1: Remove the files**

```bash
rm src/tooling/agents/invoker-pm.ts
rm src/tooling/agents/invoker-writer.ts
rm src/tooling/agents/invoker-editor.ts
rm src/tooling/agents/invoker-domain-expert.ts
rm src/tooling/agents/invoker-pm-metrics.ts
rm src/tooling/agents/invoker-release-notes.ts
```

**Step 2: Remove imports from any files that reference them**

Search and remove any imports of these files.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(w1): remove old Anthropic SDK invoker files"
```

---

## Task 8: Update Remaining W1 CLI Commands

**Files:**
- Modify: `src/tooling/cli-commands/w1-validate.ts`
- Modify: `src/tooling/cli-commands/w1-validate-chapters.ts`
- Modify: `src/tooling/cli-commands/w1-finalize.ts`

Apply the same prompt-based pattern to these files:
- Generate prompts instead of calling invokers
- Add --save subcommands
- Output "next step" instructions

**Step 1: Update each file following the same pattern**

**Step 2: Commit each file**

```bash
git add src/tooling/cli-commands/w1-validate.ts
git commit -m "refactor(w1): convert validate CLI to prompt-based flow"

git add src/tooling/cli-commands/w1-validate-chapters.ts
git commit -m "refactor(w1): convert validate-chapters CLI to prompt-based flow"

git add src/tooling/cli-commands/w1-finalize.ts
git commit -m "refactor(w1): convert finalize CLI to prompt-based flow"
```

---

## Task 9: Add Tests for Prompt Generator

**Files:**
- Create: `src/tooling/w1/prompt-generator.test.ts`

**Step 1: Write tests for prompt generation**

```typescript
// src/tooling/w1/prompt-generator.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { generatePlanningPrompt, generateWriterPrompt, generateEditorPrompt } from './prompt-generator.js';

describe('W1 Prompt Generator', () => {
  const testDir = 'data/test-w1-prompts';
  let db: Database.Database;

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('generatePlanningPrompt', () => {
    it('includes run ID in prompt', () => {
      const analysisPath = join(testDir, 'analysis.md');
      writeFileSync(analysisPath, '# Test Analysis\nSome content');

      const prompt = generatePlanningPrompt(db, {
        runId: 'test-run-123',
        bookId: 'book_core',
        bookName: 'Core Rulebook',
        analysisPath,
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('test-run-123');
      expect(prompt).toContain('Core Rulebook');
      expect(prompt).toContain('Test Analysis');
    });

    it('includes save command with correct run ID', () => {
      const analysisPath = join(testDir, 'analysis.md');
      writeFileSync(analysisPath, 'content');

      const prompt = generatePlanningPrompt(db, {
        runId: 'run-abc',
        bookId: 'book_core',
        bookName: 'Test',
        analysisPath,
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('--run=run-abc');
    });
  });

  describe('generateWriterPrompt', () => {
    it('includes plan and chapter content', () => {
      const planPath = join(testDir, 'plan.json');
      const chapterPath = join(testDir, 'chapter.md');
      writeFileSync(planPath, '{"plan_id": "test"}');
      writeFileSync(chapterPath, '# Chapter 1\nContent here');

      const prompt = generateWriterPrompt({
        runId: 'test-run',
        planPath,
        chapterPaths: [chapterPath],
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('plan_id');
      expect(prompt).toContain('Chapter 1');
    });
  });
});
```

**Step 2: Run tests**

Run: `pnpm vitest run src/tooling/w1/prompt-generator.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/tooling/w1/prompt-generator.test.ts
git commit -m "test(w1): add prompt generator tests"
```

---

## Task 10: End-to-End Verification

**Step 1: Run the full test suite**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Test the planning flow manually**

```bash
pnpm w1:planning --book=book_core --analysis=./data/reviews/analysis/campaign-20251122-191126-1p7dhyj4.md
# Should output prompt path and next steps
```

**Step 3: Verify prompt file is generated correctly**

```bash
cat data/w1-prompts/<runId>/pm-planning.txt
# Should contain full context and save instructions
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(w1): complete prompt-based architecture refactor"
```

---

## Summary

This refactor converts W1 from direct Anthropic API calls to the prompt-based pattern used by the review system:

1. **Prompt Generator** - Creates prompt text with full context
2. **Prompt Writer** - Saves prompts to files
3. **Result Saver** - Handles saving results back to workflow
4. **CLI Commands** - Generate prompts and provide save subcommands

The flow becomes:
```
CLI (generate) → Prompt file → Claude Code executes → CLI (save) → Next step
```
