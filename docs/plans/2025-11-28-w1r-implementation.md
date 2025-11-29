# W1R Revision Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the W1R human-driven revision workflow for chapter-by-chapter creative refinement.

**Architecture:** Prompt-driven workflow using existing `workflow_runs` table. CLI commands generate prompts for Claude Code sessions. Workspace in `data/w1r/<run-id>/` with chapters, feedback templates, and outputs.

**Tech Stack:** TypeScript, better-sqlite3, existing workflow infrastructure, unified/remark for markdown processing.

**Design Doc:** `docs/plans/2025-11-28-w1r-revision-workflow-design.md`

---

## Task 1: W1R Types and Checkpoint Schema

**Files:**
- Create: `src/tooling/workflows/w1r-types.ts`
- Test: `src/tooling/workflows/w1r-types.test.ts`

**Step 1: Write the type definitions**

```typescript
// src/tooling/workflows/w1r-types.ts

/**
 * W1R Revision Workflow Types
 */

export interface FeedbackCategory {
  noIssues: boolean;
  notes: string;
}

export interface FeedbackTemplate {
  chapterNumber: number;
  chapterTitle: string;
  toneVoice: FeedbackCategory;
  contentToAdd: FeedbackCategory;
  contentToRemove: FeedbackCategory;
  pacingFlow: FeedbackCategory;
  clarity: FeedbackCategory;
  consistency: FeedbackCategory;
  creativeDirection: FeedbackCategory;
}

export interface ClarifyingMessage {
  role: 'writer' | 'human';
  content: string;
}

export interface WriterOutput {
  chapterPath: string;
  changeSummary: string;
}

export interface ReviewResult {
  assessment: 'approve' | 'approve_with_notes' | 'concerns';
  feedback: string;
}

export type ChapterStatus =
  | 'feedback'        // Awaiting human feedback
  | 'clarifying'      // Writer asking questions
  | 'writing'         // Writer producing changes
  | 'reviewing'       // Editor + Domain reviewing
  | 'human_decision'; // Awaiting approve/reject

export interface CompletedChapter {
  chapter: number;
  feedbackRounds: number;
  completedAt: string;
}

export interface W1RCheckpoint {
  workflowRunId: string;
  workflowType: 'w1r_revision';
  bookSlug: string;
  sourceVersion: string;

  // Position
  currentChapter: number;
  chapterStatus: ChapterStatus;

  // Current chapter state
  currentFeedback: FeedbackTemplate | null;
  clarifyingDialogue: ClarifyingMessage[];
  writerOutput: WriterOutput | null;
  editorReview: ReviewResult | null;
  domainReview: ReviewResult | null;

  // Iteration tracking
  currentChapterIteration: number;

  // History
  completedChapters: CompletedChapter[];

  // Workspace paths
  workspacePath: string;
}

export type ReviewOption = 'skip' | 'sanity' | 'comprehensive';

export const FEEDBACK_CATEGORIES = [
  'toneVoice',
  'contentToAdd',
  'contentToRemove',
  'pacingFlow',
  'clarity',
  'consistency',
  'creativeDirection',
] as const;

export type FeedbackCategoryKey = typeof FEEDBACK_CATEGORIES[number];

/**
 * Create an empty feedback template for a chapter
 */
export function createEmptyFeedback(chapterNumber: number, chapterTitle: string): FeedbackTemplate {
  const emptyCategory = (): FeedbackCategory => ({ noIssues: false, notes: '' });
  return {
    chapterNumber,
    chapterTitle,
    toneVoice: emptyCategory(),
    contentToAdd: emptyCategory(),
    contentToRemove: emptyCategory(),
    pacingFlow: emptyCategory(),
    clarity: emptyCategory(),
    consistency: emptyCategory(),
    creativeDirection: emptyCategory(),
  };
}

/**
 * Create initial W1R checkpoint
 */
export function createW1RCheckpoint(
  workflowRunId: string,
  bookSlug: string,
  sourceVersion: string,
  workspacePath: string
): W1RCheckpoint {
  return {
    workflowRunId,
    workflowType: 'w1r_revision',
    bookSlug,
    sourceVersion,
    currentChapter: 1,
    chapterStatus: 'feedback',
    currentFeedback: null,
    clarifyingDialogue: [],
    writerOutput: null,
    editorReview: null,
    domainReview: null,
    currentChapterIteration: 1,
    completedChapters: [],
    workspacePath,
  };
}
```

**Step 2: Write tests for type utilities**

```typescript
// src/tooling/workflows/w1r-types.test.ts
import { describe, it, expect } from 'vitest';
import {
  createEmptyFeedback,
  createW1RCheckpoint,
  FEEDBACK_CATEGORIES,
  type FeedbackTemplate,
  type W1RCheckpoint,
} from './w1r-types.js';

describe('W1R Types', () => {
  describe('createEmptyFeedback', () => {
    it('should create feedback with all categories empty', () => {
      const feedback = createEmptyFeedback(1, 'Welcome to the Game');

      expect(feedback.chapterNumber).toBe(1);
      expect(feedback.chapterTitle).toBe('Welcome to the Game');

      for (const category of FEEDBACK_CATEGORIES) {
        expect(feedback[category].noIssues).toBe(false);
        expect(feedback[category].notes).toBe('');
      }
    });

    it('should have all 7 feedback categories', () => {
      expect(FEEDBACK_CATEGORIES).toHaveLength(7);
      expect(FEEDBACK_CATEGORIES).toContain('toneVoice');
      expect(FEEDBACK_CATEGORIES).toContain('creativeDirection');
    });
  });

  describe('createW1RCheckpoint', () => {
    it('should create checkpoint starting at chapter 1', () => {
      const checkpoint = createW1RCheckpoint(
        'wfrun_abc123',
        'core-rulebook',
        '1.4.0',
        '/path/to/workspace'
      );

      expect(checkpoint.workflowRunId).toBe('wfrun_abc123');
      expect(checkpoint.workflowType).toBe('w1r_revision');
      expect(checkpoint.bookSlug).toBe('core-rulebook');
      expect(checkpoint.sourceVersion).toBe('1.4.0');
      expect(checkpoint.currentChapter).toBe(1);
      expect(checkpoint.chapterStatus).toBe('feedback');
      expect(checkpoint.currentChapterIteration).toBe(1);
      expect(checkpoint.completedChapters).toEqual([]);
    });

    it('should initialize with null state for current chapter', () => {
      const checkpoint = createW1RCheckpoint(
        'wfrun_abc123',
        'core-rulebook',
        '1.4.0',
        '/path/to/workspace'
      );

      expect(checkpoint.currentFeedback).toBeNull();
      expect(checkpoint.clarifyingDialogue).toEqual([]);
      expect(checkpoint.writerOutput).toBeNull();
      expect(checkpoint.editorReview).toBeNull();
      expect(checkpoint.domainReview).toBeNull();
    });
  });
});
```

**Step 3: Run tests**

```bash
pnpm test src/tooling/workflows/w1r-types.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/tooling/workflows/w1r-types.ts src/tooling/workflows/w1r-types.test.ts
git commit -m "feat(w1r): add type definitions and checkpoint schema"
```

---

## Task 2: Feedback Template Markdown Parser/Writer

**Files:**
- Create: `src/tooling/workflows/w1r-feedback.ts`
- Test: `src/tooling/workflows/w1r-feedback.test.ts`

**Step 1: Write the feedback markdown utilities**

```typescript
// src/tooling/workflows/w1r-feedback.ts

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { FeedbackTemplate, FeedbackCategory, FeedbackCategoryKey } from './w1r-types.js';
import { createEmptyFeedback, FEEDBACK_CATEGORIES } from './w1r-types.js';

const CATEGORY_LABELS: Record<FeedbackCategoryKey, string> = {
  toneVoice: 'Tone/Voice',
  contentToAdd: 'Content to Add',
  contentToRemove: 'Content to Remove/Trim',
  pacingFlow: 'Pacing/Flow',
  clarity: 'Clarity',
  consistency: 'Consistency',
  creativeDirection: 'Creative Direction',
};

/**
 * Generate markdown feedback template for a chapter
 */
export function generateFeedbackMarkdown(chapterNumber: number, chapterTitle: string): string {
  const lines: string[] = [
    `# Chapter ${chapterNumber} Feedback: ${chapterTitle}`,
    '',
  ];

  for (const key of FEEDBACK_CATEGORIES) {
    const label = CATEGORY_LABELS[key];
    lines.push(`## ${label}`);
    lines.push('- [ ] No issues');
    lines.push('- ');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Parse markdown feedback into structured template
 */
export function parseFeedbackMarkdown(markdown: string): FeedbackTemplate {
  const lines = markdown.split('\n');

  // Extract chapter info from title
  const titleMatch = lines[0]?.match(/^# Chapter (\d+) Feedback: (.+)$/);
  if (!titleMatch) {
    throw new Error('Invalid feedback format: missing chapter title');
  }

  const chapterNumber = parseInt(titleMatch[1], 10);
  const chapterTitle = titleMatch[2];

  const feedback = createEmptyFeedback(chapterNumber, chapterTitle);

  let currentCategory: FeedbackCategoryKey | null = null;

  for (const line of lines) {
    // Check for category header
    for (const key of FEEDBACK_CATEGORIES) {
      if (line.startsWith(`## ${CATEGORY_LABELS[key]}`)) {
        currentCategory = key;
        break;
      }
    }

    if (!currentCategory) continue;

    // Check for "No issues" checkbox
    if (line.match(/^- \[x\] No issues/i)) {
      feedback[currentCategory].noIssues = true;
    }

    // Collect notes (lines starting with "- " that aren't the checkbox)
    if (line.startsWith('- ') && !line.includes('No issues')) {
      const note = line.slice(2).trim();
      if (note) {
        if (feedback[currentCategory].notes) {
          feedback[currentCategory].notes += '\n' + note;
        } else {
          feedback[currentCategory].notes = note;
        }
      }
    }
  }

  return feedback;
}

/**
 * Write feedback template to file
 */
export async function writeFeedbackTemplate(
  path: string,
  chapterNumber: number,
  chapterTitle: string
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const content = generateFeedbackMarkdown(chapterNumber, chapterTitle);
  await writeFile(path, content, 'utf-8');
}

/**
 * Read and parse feedback from file
 */
export async function readFeedback(path: string): Promise<FeedbackTemplate> {
  const content = await readFile(path, 'utf-8');
  return parseFeedbackMarkdown(content);
}

/**
 * Check if feedback has any actual content (not all "no issues")
 */
export function hasFeedbackContent(feedback: FeedbackTemplate): boolean {
  for (const key of FEEDBACK_CATEGORIES) {
    const category = feedback[key];
    if (!category.noIssues && category.notes.trim()) {
      return true;
    }
  }
  return false;
}

/**
 * Format feedback for display/prompts
 */
export function formatFeedbackForPrompt(feedback: FeedbackTemplate): string {
  const sections: string[] = [];

  for (const key of FEEDBACK_CATEGORIES) {
    const category = feedback[key];
    const label = CATEGORY_LABELS[key];

    if (category.noIssues) {
      sections.push(`**${label}:** No issues`);
    } else if (category.notes.trim()) {
      sections.push(`**${label}:**\n${category.notes}`);
    }
  }

  return sections.join('\n\n');
}
```

**Step 2: Write tests**

```typescript
// src/tooling/workflows/w1r-feedback.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateFeedbackMarkdown,
  parseFeedbackMarkdown,
  hasFeedbackContent,
  formatFeedbackForPrompt,
} from './w1r-feedback.js';

describe('W1R Feedback', () => {
  describe('generateFeedbackMarkdown', () => {
    it('should generate markdown with chapter title', () => {
      const md = generateFeedbackMarkdown(1, 'Welcome to the Game');

      expect(md).toContain('# Chapter 1 Feedback: Welcome to the Game');
    });

    it('should include all 7 category sections', () => {
      const md = generateFeedbackMarkdown(1, 'Test');

      expect(md).toContain('## Tone/Voice');
      expect(md).toContain('## Content to Add');
      expect(md).toContain('## Content to Remove/Trim');
      expect(md).toContain('## Pacing/Flow');
      expect(md).toContain('## Clarity');
      expect(md).toContain('## Consistency');
      expect(md).toContain('## Creative Direction');
    });

    it('should include unchecked "No issues" checkbox for each category', () => {
      const md = generateFeedbackMarkdown(1, 'Test');

      const checkboxCount = (md.match(/- \[ \] No issues/g) || []).length;
      expect(checkboxCount).toBe(7);
    });
  });

  describe('parseFeedbackMarkdown', () => {
    it('should parse chapter number and title', () => {
      const md = `# Chapter 5 Feedback: Combat Basics

## Tone/Voice
- [ ] No issues
- Make examples more visceral
`;
      const feedback = parseFeedbackMarkdown(md);

      expect(feedback.chapterNumber).toBe(5);
      expect(feedback.chapterTitle).toBe('Combat Basics');
    });

    it('should parse checked "No issues" checkbox', () => {
      const md = `# Chapter 1 Feedback: Test

## Tone/Voice
- [x] No issues
-

## Content to Add
- [ ] No issues
- Add example of contested checks
`;
      const feedback = parseFeedbackMarkdown(md);

      expect(feedback.toneVoice.noIssues).toBe(true);
      expect(feedback.contentToAdd.noIssues).toBe(false);
      expect(feedback.contentToAdd.notes).toBe('Add example of contested checks');
    });

    it('should collect multiple note lines', () => {
      const md = `# Chapter 1 Feedback: Test

## Clarity
- [ ] No issues
- First note here
- Second note with \`code reference\`
`;
      const feedback = parseFeedbackMarkdown(md);

      expect(feedback.clarity.notes).toContain('First note here');
      expect(feedback.clarity.notes).toContain('Second note with `code reference`');
    });

    it('should throw on invalid format', () => {
      expect(() => parseFeedbackMarkdown('Invalid content')).toThrow('Invalid feedback format');
    });
  });

  describe('hasFeedbackContent', () => {
    it('should return false when all categories are "no issues"', () => {
      const md = `# Chapter 1 Feedback: Test

## Tone/Voice
- [x] No issues
-

## Content to Add
- [x] No issues
-

## Content to Remove/Trim
- [x] No issues
-

## Pacing/Flow
- [x] No issues
-

## Clarity
- [x] No issues
-

## Consistency
- [x] No issues
-

## Creative Direction
- [x] No issues
-
`;
      const feedback = parseFeedbackMarkdown(md);
      expect(hasFeedbackContent(feedback)).toBe(false);
    });

    it('should return true when any category has notes', () => {
      const md = `# Chapter 1 Feedback: Test

## Tone/Voice
- [x] No issues
-

## Content to Add
- [ ] No issues
- Add an example
`;
      const feedback = parseFeedbackMarkdown(md);
      expect(hasFeedbackContent(feedback)).toBe(true);
    });
  });

  describe('formatFeedbackForPrompt', () => {
    it('should format feedback for agent prompt', () => {
      const md = `# Chapter 1 Feedback: Test

## Tone/Voice
- [ ] No issues
- Make it more playful

## Content to Add
- [x] No issues
-
`;
      const feedback = parseFeedbackMarkdown(md);
      const formatted = formatFeedbackForPrompt(feedback);

      expect(formatted).toContain('**Tone/Voice:**');
      expect(formatted).toContain('Make it more playful');
      expect(formatted).toContain('**Content to Add:** No issues');
    });
  });
});
```

**Step 3: Run tests**

```bash
pnpm test src/tooling/workflows/w1r-feedback.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/tooling/workflows/w1r-feedback.ts src/tooling/workflows/w1r-feedback.test.ts
git commit -m "feat(w1r): add feedback template parser and generator"
```

---

## Task 3: W1R Workspace Manager

**Files:**
- Create: `src/tooling/workflows/w1r-workspace.ts`
- Test: `src/tooling/workflows/w1r-workspace.test.ts`

**Step 1: Write workspace manager**

```typescript
// src/tooling/workflows/w1r-workspace.ts

import { mkdir, cp, readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';
import { writeFeedbackTemplate } from './w1r-feedback.js';

export interface WorkspaceInfo {
  runId: string;
  rootPath: string;
  chaptersPath: string;
  feedbackPath: string;
  outputsPath: string;
}

export interface ChapterInfo {
  number: number;
  slug: string;
  title: string;
  filename: string;
}

/**
 * Create W1R workspace directory structure
 */
export async function createWorkspace(
  dataDir: string,
  runId: string
): Promise<WorkspaceInfo> {
  const rootPath = join(dataDir, 'w1r', runId);
  const chaptersPath = join(rootPath, 'chapters');
  const feedbackPath = join(rootPath, 'feedback');
  const outputsPath = join(rootPath, 'outputs');

  await mkdir(chaptersPath, { recursive: true });
  await mkdir(feedbackPath, { recursive: true });
  await mkdir(outputsPath, { recursive: true });

  return {
    runId,
    rootPath,
    chaptersPath,
    feedbackPath,
    outputsPath,
  };
}

/**
 * Copy chapters from source version to workspace
 */
export async function copyChaptersToWorkspace(
  sourceChaptersDir: string,
  workspace: WorkspaceInfo
): Promise<ChapterInfo[]> {
  const files = await readdir(sourceChaptersDir);
  const chapters: ChapterInfo[] = [];

  for (const file of files) {
    if (!file.endsWith('.md') || file === 'README.md') continue;

    const match = file.match(/^(\d+)-(.+)\.md$/);
    if (!match) continue;

    const number = parseInt(match[1], 10);
    const slug = match[2];

    // Copy file
    const sourcePath = join(sourceChaptersDir, file);
    const destPath = join(workspace.chaptersPath, file);
    await cp(sourcePath, destPath);

    // Extract title from file
    const content = await readFile(sourcePath, 'utf-8');
    const title = extractChapterTitle(content, slug);

    chapters.push({ number, slug, title, filename: file });
  }

  // Sort by chapter number
  chapters.sort((a, b) => a.number - b.number);

  return chapters;
}

/**
 * Extract chapter title from markdown content
 */
function extractChapterTitle(content: string, fallback: string): string {
  // Try # N. Title format
  let match = content.match(/^#\s*\d+\.\s*(.+)$/m);
  if (match) return match[1].trim();

  // Try ## N. Title format
  match = content.match(/^##\s*\d+\.\s*(.+)$/m);
  if (match) return match[1].trim();

  // Try # Chapter N: Title format
  match = content.match(/^#\s*Chapter\s+\d+:\s*(.+)$/m);
  if (match) return match[1].trim();

  // Fallback to slug converted to title case
  return fallback
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Create feedback template file for a chapter
 */
export async function createChapterFeedbackTemplate(
  workspace: WorkspaceInfo,
  chapter: ChapterInfo
): Promise<string> {
  const filename = `${String(chapter.number).padStart(2, '0')}-feedback.md`;
  const path = join(workspace.feedbackPath, filename);

  await writeFeedbackTemplate(path, chapter.number, chapter.title);

  return path;
}

/**
 * Get path for chapter output file
 */
export function getOutputPath(workspace: WorkspaceInfo, chapterNumber: number): string {
  const filename = `${String(chapterNumber).padStart(2, '0')}-output.md`;
  return join(workspace.outputsPath, filename);
}

/**
 * Get path for chapter file in workspace
 */
export function getChapterPath(workspace: WorkspaceInfo, chapter: ChapterInfo): string {
  return join(workspace.chaptersPath, chapter.filename);
}

/**
 * Check if workspace exists
 */
export function workspaceExists(dataDir: string, runId: string): boolean {
  const rootPath = join(dataDir, 'w1r', runId);
  return existsSync(rootPath);
}

/**
 * Get workspace info for existing workspace
 */
export function getWorkspaceInfo(dataDir: string, runId: string): WorkspaceInfo {
  const rootPath = join(dataDir, 'w1r', runId);
  return {
    runId,
    rootPath,
    chaptersPath: join(rootPath, 'chapters'),
    feedbackPath: join(rootPath, 'feedback'),
    outputsPath: join(rootPath, 'outputs'),
  };
}
```

**Step 2: Write tests**

```typescript
// src/tooling/workflows/w1r-workspace.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  createWorkspace,
  copyChaptersToWorkspace,
  createChapterFeedbackTemplate,
  getOutputPath,
  workspaceExists,
} from './w1r-workspace.js';

describe('W1R Workspace', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'w1r-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('createWorkspace', () => {
    it('should create workspace directory structure', async () => {
      const workspace = await createWorkspace(tempDir, 'wfrun_test123');

      expect(workspace.runId).toBe('wfrun_test123');
      expect(workspace.rootPath).toContain('w1r/wfrun_test123');

      const dirs = await readdir(workspace.rootPath);
      expect(dirs).toContain('chapters');
      expect(dirs).toContain('feedback');
      expect(dirs).toContain('outputs');
    });
  });

  describe('copyChaptersToWorkspace', () => {
    it('should copy markdown chapters and extract info', async () => {
      // Create source chapters
      const sourceDir = join(tempDir, 'source');
      await mkdir(sourceDir, { recursive: true });
      await writeFile(
        join(sourceDir, '01-welcome.md'),
        '# 1. Welcome to the Game\n\nContent here.'
      );
      await writeFile(
        join(sourceDir, '02-core-concepts.md'),
        '## 2. Core Concepts\n\nMore content.'
      );
      await writeFile(join(sourceDir, 'README.md'), '# README');

      const workspace = await createWorkspace(tempDir, 'wfrun_copy');
      const chapters = await copyChaptersToWorkspace(sourceDir, workspace);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].number).toBe(1);
      expect(chapters[0].title).toBe('Welcome to the Game');
      expect(chapters[1].number).toBe(2);
      expect(chapters[1].title).toBe('Core Concepts');

      // Verify files copied
      const copiedFiles = await readdir(workspace.chaptersPath);
      expect(copiedFiles).toContain('01-welcome.md');
      expect(copiedFiles).toContain('02-core-concepts.md');
      expect(copiedFiles).not.toContain('README.md');
    });
  });

  describe('createChapterFeedbackTemplate', () => {
    it('should create feedback markdown file', async () => {
      const workspace = await createWorkspace(tempDir, 'wfrun_feedback');
      const chapter = { number: 5, slug: 'combat', title: 'Combat Basics', filename: '05-combat.md' };

      const path = await createChapterFeedbackTemplate(workspace, chapter);

      expect(path).toContain('05-feedback.md');
      const files = await readdir(workspace.feedbackPath);
      expect(files).toContain('05-feedback.md');
    });
  });

  describe('getOutputPath', () => {
    it('should return correctly formatted output path', () => {
      const workspace = {
        runId: 'test',
        rootPath: '/data/w1r/test',
        chaptersPath: '/data/w1r/test/chapters',
        feedbackPath: '/data/w1r/test/feedback',
        outputsPath: '/data/w1r/test/outputs',
      };

      expect(getOutputPath(workspace, 1)).toBe('/data/w1r/test/outputs/01-output.md');
      expect(getOutputPath(workspace, 12)).toBe('/data/w1r/test/outputs/12-output.md');
    });
  });

  describe('workspaceExists', () => {
    it('should return false for non-existent workspace', () => {
      expect(workspaceExists(tempDir, 'nonexistent')).toBe(false);
    });

    it('should return true for existing workspace', async () => {
      await createWorkspace(tempDir, 'wfrun_exists');
      expect(workspaceExists(tempDir, 'wfrun_exists')).toBe(true);
    });
  });
});
```

**Step 3: Run tests**

```bash
pnpm test src/tooling/workflows/w1r-workspace.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/tooling/workflows/w1r-workspace.ts src/tooling/workflows/w1r-workspace.test.ts
git commit -m "feat(w1r): add workspace manager for chapters, feedback, outputs"
```

---

## Task 4: W1R Repository (Database Operations)

**Files:**
- Create: `src/tooling/workflows/w1r-repository.ts`
- Test: `src/tooling/workflows/w1r-repository.test.ts`

**Step 1: Write repository**

```typescript
// src/tooling/workflows/w1r-repository.ts

import type Database from 'better-sqlite3';
import type { W1RCheckpoint } from './w1r-types.js';

export class W1RRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create a new W1R workflow run
   */
  createRun(bookId: string, checkpoint: W1RCheckpoint): string {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_runs (
        id, workflow_type, book_id, status, checkpoint_json,
        current_step, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      checkpoint.workflowRunId,
      'w1r_revision',
      bookId,
      'running',
      JSON.stringify(checkpoint),
      `chapter_${checkpoint.currentChapter}_${checkpoint.chapterStatus}`
    );

    return checkpoint.workflowRunId;
  }

  /**
   * Get W1R run by ID
   */
  getRun(runId: string): { run: WorkflowRun; checkpoint: W1RCheckpoint } | null {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_runs WHERE id = ? AND workflow_type = 'w1r_revision'
    `);

    const row = stmt.get(runId) as WorkflowRunRow | undefined;
    if (!row) return null;

    return {
      run: rowToRun(row),
      checkpoint: JSON.parse(row.checkpoint_json) as W1RCheckpoint,
    };
  }

  /**
   * Update checkpoint for a run
   */
  updateCheckpoint(runId: string, checkpoint: W1RCheckpoint): void {
    const stmt = this.db.prepare(`
      UPDATE workflow_runs
      SET checkpoint_json = ?,
          current_step = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      JSON.stringify(checkpoint),
      `chapter_${checkpoint.currentChapter}_${checkpoint.chapterStatus}`,
      runId
    );
  }

  /**
   * Update run status
   */
  updateStatus(runId: string, status: 'running' | 'paused' | 'completed' | 'failed'): void {
    const stmt = this.db.prepare(`
      UPDATE workflow_runs SET status = ?, updated_at = datetime('now') WHERE id = ?
    `);
    stmt.run(status, runId);
  }

  /**
   * Get active W1R run for a book (only one allowed)
   */
  getActiveRunForBook(bookId: string): { run: WorkflowRun; checkpoint: W1RCheckpoint } | null {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_runs
      WHERE book_id = ?
        AND workflow_type = 'w1r_revision'
        AND status IN ('running', 'paused')
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const row = stmt.get(bookId) as WorkflowRunRow | undefined;
    if (!row) return null;

    return {
      run: rowToRun(row),
      checkpoint: JSON.parse(row.checkpoint_json) as W1RCheckpoint,
    };
  }

  /**
   * List W1R runs with optional filters
   */
  listRuns(options?: {
    bookId?: string;
    status?: string;
    limit?: number;
  }): Array<{ run: WorkflowRun; checkpoint: W1RCheckpoint }> {
    let sql = `
      SELECT * FROM workflow_runs
      WHERE workflow_type = 'w1r_revision'
    `;
    const params: unknown[] = [];

    if (options?.bookId) {
      sql += ' AND book_id = ?';
      params.push(options.bookId);
    }

    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY updated_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as WorkflowRunRow[];

    return rows.map(row => ({
      run: rowToRun(row),
      checkpoint: JSON.parse(row.checkpoint_json) as W1RCheckpoint,
    }));
  }

  /**
   * Generate unique run ID
   */
  generateRunId(): string {
    const random = Math.random().toString(36).substring(2, 10);
    return `wfrun_${random}`;
  }
}

// Types for database rows
interface WorkflowRunRow {
  id: string;
  workflow_type: string;
  book_id: string;
  status: string;
  checkpoint_json: string;
  current_step: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  workflowType: string;
  bookId: string;
  status: string;
  currentStep: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToRun(row: WorkflowRunRow): WorkflowRun {
  return {
    id: row.id,
    workflowType: row.workflow_type,
    bookId: row.book_id,
    status: row.status,
    currentStep: row.current_step,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

**Step 2: Write tests**

```typescript
// src/tooling/workflows/w1r-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { W1RRepository } from './w1r-repository.js';
import { createW1RCheckpoint } from './w1r-types.js';

describe('W1RRepository', () => {
  let db: Database.Database;
  let repo: W1RRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    // Create minimal schema
    db.exec(`
      CREATE TABLE workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_type TEXT NOT NULL,
        book_id TEXT NOT NULL,
        status TEXT NOT NULL,
        checkpoint_json TEXT,
        current_step TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE books (
        id TEXT PRIMARY KEY,
        slug TEXT,
        title TEXT
      );
      INSERT INTO books (id, slug, title) VALUES ('book1', 'core-rulebook', 'Core Rulebook');
    `);
    repo = new W1RRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createRun', () => {
    it('should create a new workflow run', () => {
      const checkpoint = createW1RCheckpoint('wfrun_test1', 'core-rulebook', '1.4.0', '/path');
      const id = repo.createRun('book1', checkpoint);

      expect(id).toBe('wfrun_test1');

      const result = repo.getRun('wfrun_test1');
      expect(result).not.toBeNull();
      expect(result!.run.status).toBe('running');
      expect(result!.checkpoint.currentChapter).toBe(1);
    });
  });

  describe('updateCheckpoint', () => {
    it('should update checkpoint and current_step', () => {
      const checkpoint = createW1RCheckpoint('wfrun_update', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', checkpoint);

      checkpoint.currentChapter = 5;
      checkpoint.chapterStatus = 'reviewing';
      repo.updateCheckpoint('wfrun_update', checkpoint);

      const result = repo.getRun('wfrun_update');
      expect(result!.checkpoint.currentChapter).toBe(5);
      expect(result!.run.currentStep).toBe('chapter_5_reviewing');
    });
  });

  describe('getActiveRunForBook', () => {
    it('should return null when no active run', () => {
      const result = repo.getActiveRunForBook('book1');
      expect(result).toBeNull();
    });

    it('should return active run', () => {
      const checkpoint = createW1RCheckpoint('wfrun_active', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', checkpoint);

      const result = repo.getActiveRunForBook('book1');
      expect(result).not.toBeNull();
      expect(result!.run.id).toBe('wfrun_active');
    });

    it('should not return completed runs', () => {
      const checkpoint = createW1RCheckpoint('wfrun_done', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', checkpoint);
      repo.updateStatus('wfrun_done', 'completed');

      const result = repo.getActiveRunForBook('book1');
      expect(result).toBeNull();
    });
  });

  describe('listRuns', () => {
    it('should list all W1R runs', () => {
      const cp1 = createW1RCheckpoint('wfrun_1', 'core-rulebook', '1.4.0', '/path');
      const cp2 = createW1RCheckpoint('wfrun_2', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', cp1);
      repo.createRun('book1', cp2);

      const runs = repo.listRuns();
      expect(runs).toHaveLength(2);
    });

    it('should filter by status', () => {
      const cp1 = createW1RCheckpoint('wfrun_a', 'core-rulebook', '1.4.0', '/path');
      const cp2 = createW1RCheckpoint('wfrun_b', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', cp1);
      repo.createRun('book1', cp2);
      repo.updateStatus('wfrun_b', 'completed');

      const runs = repo.listRuns({ status: 'running' });
      expect(runs).toHaveLength(1);
      expect(runs[0].run.id).toBe('wfrun_a');
    });
  });

  describe('generateRunId', () => {
    it('should generate unique IDs with wfrun_ prefix', () => {
      const id1 = repo.generateRunId();
      const id2 = repo.generateRunId();

      expect(id1).toMatch(/^wfrun_[a-z0-9]+$/);
      expect(id2).toMatch(/^wfrun_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
```

**Step 3: Run tests**

```bash
pnpm test src/tooling/workflows/w1r-repository.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/tooling/workflows/w1r-repository.ts src/tooling/workflows/w1r-repository.test.ts
git commit -m "feat(w1r): add repository for workflow run persistence"
```

---

## Task 5: W1R Prompt Generator

**Files:**
- Create: `src/tooling/workflows/w1r-prompts.ts`
- Test: `src/tooling/workflows/w1r-prompts.test.ts`

**Step 1: Write prompt generator**

```typescript
// src/tooling/workflows/w1r-prompts.ts

import type { W1RCheckpoint, ChapterInfo } from './w1r-types.js';
import type { WorkspaceInfo } from './w1r-workspace.js';

/**
 * Generate the initial/resume prompt for a W1R session
 */
export function generateSessionPrompt(
  checkpoint: W1RCheckpoint,
  workspace: WorkspaceInfo,
  chapter: ChapterInfo,
  feedbackPath: string
): string {
  const lines = [
    `We are working on w1r run ${checkpoint.workflowRunId} for ${checkpoint.bookSlug}.`,
    `Chapter ${chapter.number}: ${chapter.title}`,
    '',
    `Feedback template: ${feedbackPath}`,
    '',
    'Await my confirmation, then await my feedback on this chapter.',
    '',
    'When I confirm feedback is ready, run:',
    `  pnpm w1r:process --run ${checkpoint.workflowRunId} --chapter ${chapter.number}`,
    '',
    'That command will return instructions for:',
    '1. Analyzing the feedback',
    '2. Clarification dialogue (if needed)',
    '3. Writing the updated chapter',
    '4. Editor and Domain expert review',
    '',
    `Output will be written to: ${workspace.outputsPath}/${String(chapter.number).padStart(2, '0')}-output.md`,
  ];

  return lines.join('\n');
}

/**
 * Generate the processing instructions prompt (returned by w1r:process)
 */
export function generateProcessingPrompt(
  checkpoint: W1RCheckpoint,
  chapter: ChapterInfo,
  chapterContent: string,
  feedbackFormatted: string
): string {
  return `## W1R Processing: Chapter ${chapter.number} - ${chapter.title}

### Your Role
You are processing feedback for a creative revision workflow. The author has provided structured feedback on this chapter.

### Chapter Content
The chapter is located at: ${checkpoint.workspacePath}/chapters/${chapter.filename}

### Author's Feedback
${feedbackFormatted}

### Instructions

**Phase 1: Assessment**
Review the feedback and the chapter. Determine if you need clarification on any points.

If the feedback is clear and actionable, say: "The feedback is clear. I'm ready to make the changes."

If you need clarification, ask ONE question at a time. Wait for my response before asking another.

**Phase 2: Writing**
Once you understand the feedback (after clarification or if none needed):
1. Read the current chapter content
2. Make the requested changes
3. Write the updated chapter back to the same file
4. Create a change summary

**Phase 3: Review**
After writing, run:
  pnpm w1r:review --run ${checkpoint.workflowRunId} --chapter ${chapter.number}

This will return prompts for Editor and Domain expert review.

### Begin
Start by assessing the feedback. Do you need any clarification, or is the feedback clear?`;
}

/**
 * Generate Editor review prompt
 */
export function generateEditorPrompt(
  chapter: ChapterInfo,
  originalContent: string,
  updatedContent: string,
  feedbackSummary: string
): string {
  return `## Editor Review: Chapter ${chapter.number} - ${chapter.title}

### Your Role
You are a professional editor reviewing changes made to this chapter.

### Context
The author provided this feedback:
${feedbackSummary}

### Your Focus
- Prose quality, grammar, readability
- Consistency with the book's style
- Pacing and flow
- Whether the changes appropriately address the author's feedback

### Original Chapter
\`\`\`markdown
${originalContent.slice(0, 2000)}...
\`\`\`
(truncated for review)

### Updated Chapter
\`\`\`markdown
${updatedContent.slice(0, 2000)}...
\`\`\`
(truncated for review)

### Provide Your Review
Format:
**Assessment:** [Approve / Approve with notes / Concerns]

**Feedback:**
- [Your observations and suggestions]`;
}

/**
 * Generate Domain Expert review prompt
 */
export function generateDomainPrompt(
  chapter: ChapterInfo,
  originalContent: string,
  updatedContent: string,
  feedbackSummary: string
): string {
  return `## Domain Expert Review: Chapter ${chapter.number} - ${chapter.title}

### Your Role
You are a TTRPG rules expert reviewing changes made to this chapter.

### Context
The author provided this feedback:
${feedbackSummary}

### Your Focus
- Rules accuracy and clarity
- Mechanical consistency with other chapters
- Whether examples correctly demonstrate concepts
- Player/GM usability

### Original Chapter
\`\`\`markdown
${originalContent.slice(0, 2000)}...
\`\`\`
(truncated for review)

### Updated Chapter
\`\`\`markdown
${updatedContent.slice(0, 2000)}...
\`\`\`
(truncated for review)

### Provide Your Review
Format:
**Assessment:** [Approve / Approve with notes / Concerns]

**Feedback:**
- [Your observations and suggestions]`;
}

/**
 * Generate completion prompt (after all chapters done)
 */
export function generateCompletionPrompt(
  checkpoint: W1RCheckpoint,
  nextVersion: string
): string {
  const totalRounds = checkpoint.completedChapters.reduce(
    (sum, ch) => sum + ch.feedbackRounds, 0
  );
  const avgRounds = (totalRounds / checkpoint.completedChapters.length).toFixed(1);

  return `## W1R Revision Complete!

**Book:** ${checkpoint.bookSlug}
**Chapters completed:** ${checkpoint.completedChapters.length}
**Total feedback rounds:** ${totalRounds} (avg ${avgRounds} per chapter)

### Before promoting to v${nextVersion}, would you like to run chapter reviews?

**Options:**
1. **Skip reviews** - Promote now
2. **Sanity check** - 20 reviewers per chapter (10 core + 10 targeted)
3. **Comprehensive** - 50 reviewers per chapter (10 core + 40 distributed)

Reply with your choice (1, 2, or 3).`;
}

/**
 * Generate next chapter prompt (after approval)
 */
export function generateNextChapterPrompt(
  checkpoint: W1RCheckpoint,
  workspace: WorkspaceInfo,
  chapter: ChapterInfo,
  feedbackPath: string
): string {
  const completedCount = checkpoint.completedChapters.length;

  return `## Chapter ${checkpoint.currentChapter - 1} Approved!

Progress: ${completedCount}/30 chapters complete

---

${generateSessionPrompt(checkpoint, workspace, chapter, feedbackPath)}`;
}
```

**Step 2: Write tests**

```typescript
// src/tooling/workflows/w1r-prompts.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateSessionPrompt,
  generateProcessingPrompt,
  generateEditorPrompt,
  generateCompletionPrompt,
} from './w1r-prompts.js';
import { createW1RCheckpoint } from './w1r-types.js';

describe('W1R Prompts', () => {
  const workspace = {
    runId: 'wfrun_test',
    rootPath: '/data/w1r/wfrun_test',
    chaptersPath: '/data/w1r/wfrun_test/chapters',
    feedbackPath: '/data/w1r/wfrun_test/feedback',
    outputsPath: '/data/w1r/wfrun_test/outputs',
  };

  const chapter = {
    number: 1,
    slug: 'welcome',
    title: 'Welcome to the Game',
    filename: '01-welcome.md',
  };

  describe('generateSessionPrompt', () => {
    it('should include run ID and chapter info', () => {
      const checkpoint = createW1RCheckpoint('wfrun_test', 'core-rulebook', '1.4.0', '/path');
      const prompt = generateSessionPrompt(
        checkpoint,
        workspace,
        chapter,
        '/data/w1r/wfrun_test/feedback/01-feedback.md'
      );

      expect(prompt).toContain('wfrun_test');
      expect(prompt).toContain('core-rulebook');
      expect(prompt).toContain('Chapter 1: Welcome to the Game');
    });

    it('should include the process command', () => {
      const checkpoint = createW1RCheckpoint('wfrun_abc', 'core-rulebook', '1.4.0', '/path');
      const prompt = generateSessionPrompt(
        checkpoint,
        workspace,
        chapter,
        '/path/feedback.md'
      );

      expect(prompt).toContain('pnpm w1r:process --run wfrun_abc --chapter 1');
    });
  });

  describe('generateProcessingPrompt', () => {
    it('should include feedback and instructions', () => {
      const checkpoint = createW1RCheckpoint('wfrun_test', 'core-rulebook', '1.4.0', '/path');
      checkpoint.workspacePath = '/data/w1r/wfrun_test';

      const prompt = generateProcessingPrompt(
        checkpoint,
        chapter,
        '# Chapter content',
        '**Tone/Voice:** Make it more playful'
      );

      expect(prompt).toContain('Chapter 1 - Welcome to the Game');
      expect(prompt).toContain('Make it more playful');
      expect(prompt).toContain('Phase 1: Assessment');
      expect(prompt).toContain('Phase 2: Writing');
    });
  });

  describe('generateEditorPrompt', () => {
    it('should include original and updated content', () => {
      const prompt = generateEditorPrompt(
        chapter,
        '# Original content',
        '# Updated content',
        'Made tone more playful'
      );

      expect(prompt).toContain('Editor Review');
      expect(prompt).toContain('Original content');
      expect(prompt).toContain('Updated content');
      expect(prompt).toContain('Assessment');
    });
  });

  describe('generateCompletionPrompt', () => {
    it('should show completion stats and options', () => {
      const checkpoint = createW1RCheckpoint('wfrun_done', 'core-rulebook', '1.4.0', '/path');
      checkpoint.completedChapters = [
        { chapter: 1, feedbackRounds: 2, completedAt: '2025-01-01' },
        { chapter: 2, feedbackRounds: 1, completedAt: '2025-01-02' },
      ];

      const prompt = generateCompletionPrompt(checkpoint, '1.4.1');

      expect(prompt).toContain('W1R Revision Complete');
      expect(prompt).toContain('Chapters completed: 2');
      expect(prompt).toContain('Total feedback rounds: 3');
      expect(prompt).toContain('v1.4.1');
      expect(prompt).toContain('Sanity check');
      expect(prompt).toContain('Comprehensive');
    });
  });
});
```

**Step 3: Run tests**

```bash
pnpm test src/tooling/workflows/w1r-prompts.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/tooling/workflows/w1r-prompts.ts src/tooling/workflows/w1r-prompts.test.ts
git commit -m "feat(w1r): add prompt generators for session, processing, and reviews"
```

---

## Task 6: W1R CLI Commands

**Files:**
- Create: `src/tooling/cli-commands/w1r.ts`
- Modify: `src/tooling/cli-commands/run.ts` (add w1r command routing)
- Modify: `package.json` (add w1r:* scripts)

**Step 1: Write CLI command handlers**

```typescript
// src/tooling/cli-commands/w1r.ts

import { resolve } from 'path';
import { readFile } from 'fs/promises';
import type Database from 'better-sqlite3';
import { BookRepository } from '../books/repository.js';
import { W1RRepository } from '../workflows/w1r-repository.js';
import {
  createWorkspace,
  copyChaptersToWorkspace,
  createChapterFeedbackTemplate,
  getWorkspaceInfo,
  workspaceExists,
  type ChapterInfo,
} from '../workflows/w1r-workspace.js';
import { createW1RCheckpoint, type W1RCheckpoint } from '../workflows/w1r-types.js';
import { readFeedback, formatFeedbackForPrompt } from '../workflows/w1r-feedback.js';
import {
  generateSessionPrompt,
  generateProcessingPrompt,
  generateCompletionPrompt,
} from '../workflows/w1r-prompts.js';

const REPO_ROOT = resolve(process.cwd());
const DATA_DIR = resolve(REPO_ROOT, 'data');

export interface StartResult {
  success: boolean;
  runId?: string;
  prompt?: string;
  error?: string;
}

export interface ResumeResult {
  success: boolean;
  runId?: string;
  prompt?: string;
  error?: string;
}

export interface StatusResult {
  success: boolean;
  status?: string;
  error?: string;
}

/**
 * Start a new W1R revision workflow
 */
export async function startW1R(
  db: Database.Database,
  bookSlug: string
): Promise<StartResult> {
  const bookRepo = new BookRepository(db);
  const w1rRepo = new W1RRepository(db);

  // Get book info
  const book = bookRepo.getBySlug(bookSlug);
  if (!book) {
    return { success: false, error: `Book not found: ${bookSlug}` };
  }

  // Check for existing active run
  const existing = w1rRepo.getActiveRunForBook(book.id);
  if (existing) {
    return {
      success: false,
      error: `Active W1R run exists: ${existing.run.id}. Use w1r:resume to continue.`,
    };
  }

  // Generate run ID and create workspace
  const runId = w1rRepo.generateRunId();
  const workspace = await createWorkspace(DATA_DIR, runId);

  // Get source version path
  const sourceVersion = book.current_version || '1.4.0';
  const sourceChaptersDir = resolve(REPO_ROOT, `books/core/v${sourceVersion}/chapters`);

  // Copy chapters and get info
  const chapters = await copyChaptersToWorkspace(sourceChaptersDir, workspace);
  if (chapters.length === 0) {
    return { success: false, error: 'No chapters found in source directory' };
  }

  // Create checkpoint
  const checkpoint = createW1RCheckpoint(runId, bookSlug, sourceVersion, workspace.rootPath);

  // Save to database
  w1rRepo.createRun(book.id, checkpoint);

  // Create first feedback template
  const firstChapter = chapters[0];
  const feedbackPath = await createChapterFeedbackTemplate(workspace, firstChapter);

  // Generate prompt
  const prompt = generateSessionPrompt(checkpoint, workspace, firstChapter, feedbackPath);

  return { success: true, runId, prompt };
}

/**
 * Resume an existing W1R revision workflow
 */
export async function resumeW1R(
  db: Database.Database,
  runId: string
): Promise<ResumeResult> {
  const w1rRepo = new W1RRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { run, checkpoint } = result;

  if (run.status === 'completed') {
    return { success: false, error: 'This run is already completed' };
  }

  if (run.status === 'failed') {
    return { success: false, error: 'This run has failed' };
  }

  // Get workspace and chapter info
  const workspace = getWorkspaceInfo(DATA_DIR, runId);
  if (!workspaceExists(DATA_DIR, runId)) {
    return { success: false, error: 'Workspace not found' };
  }

  // Get current chapter info
  const chapters = await getChaptersFromWorkspace(workspace.chaptersPath);
  const currentChapter = chapters.find(c => c.number === checkpoint.currentChapter);
  if (!currentChapter) {
    return { success: false, error: `Chapter ${checkpoint.currentChapter} not found` };
  }

  // Ensure feedback template exists
  const feedbackFilename = `${String(checkpoint.currentChapter).padStart(2, '0')}-feedback.md`;
  const feedbackPath = resolve(workspace.feedbackPath, feedbackFilename);

  // Generate prompt based on current status
  const prompt = generateSessionPrompt(checkpoint, workspace, currentChapter, feedbackPath);

  // Update status to running if paused
  if (run.status === 'paused') {
    w1rRepo.updateStatus(runId, 'running');
  }

  return { success: true, runId, prompt };
}

/**
 * Get status of a W1R run
 */
export function getW1RStatus(
  db: Database.Database,
  runId: string
): StatusResult {
  const w1rRepo = new W1RRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { run, checkpoint } = result;
  const completedCount = checkpoint.completedChapters.length;
  const totalChapters = 30; // TODO: get from chapters count

  const lines = [
    `W1R Revision: ${checkpoint.bookSlug} (${runId})`,
    `Status: Chapter ${checkpoint.currentChapter}/${totalChapters}, ${formatStatus(checkpoint.chapterStatus)}`,
    '',
  ];

  if (checkpoint.currentFeedback) {
    lines.push(`Current feedback iteration: ${checkpoint.currentChapterIteration}`);
  }

  if (completedCount > 0) {
    const totalRounds = checkpoint.completedChapters.reduce((s, c) => s + c.feedbackRounds, 0);
    const avgRounds = (totalRounds / completedCount).toFixed(1);
    lines.push(`Completed: ${completedCount} chapters (avg ${avgRounds} feedback rounds)`);
  }

  return { success: true, status: lines.join('\n') };
}

/**
 * List W1R runs
 */
export function listW1R(
  db: Database.Database,
  options?: { bookSlug?: string; status?: string }
): Array<{ runId: string; bookSlug: string; status: string; chapter: number; updatedAt: string }> {
  const w1rRepo = new W1RRepository(db);
  const bookRepo = new BookRepository(db);

  let bookId: string | undefined;
  if (options?.bookSlug) {
    const book = bookRepo.getBySlug(options.bookSlug);
    bookId = book?.id;
  }

  const runs = w1rRepo.listRuns({ bookId, status: options?.status });

  return runs.map(({ run, checkpoint }) => ({
    runId: run.id,
    bookSlug: checkpoint.bookSlug,
    status: run.status,
    chapter: checkpoint.currentChapter,
    updatedAt: run.updatedAt,
  }));
}

// Helper functions

async function getChaptersFromWorkspace(chaptersPath: string): Promise<ChapterInfo[]> {
  const { readdir } = await import('fs/promises');
  const files = await readdir(chaptersPath);
  const chapters: ChapterInfo[] = [];

  for (const file of files) {
    const match = file.match(/^(\d+)-(.+)\.md$/);
    if (match) {
      const number = parseInt(match[1], 10);
      const slug = match[2];
      // Read title from file
      const content = await readFile(resolve(chaptersPath, file), 'utf-8');
      const titleMatch = content.match(/^#\s*\d+\.\s*(.+)$/m) ||
                        content.match(/^##\s*\d+\.\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : slug;
      chapters.push({ number, slug, title, filename: file });
    }
  }

  return chapters.sort((a, b) => a.number - b.number);
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    feedback: 'awaiting your feedback',
    clarifying: 'writer asking questions',
    writing: 'writer updating chapter',
    reviewing: 'editor/domain reviewing',
    human_decision: 'awaiting your approval',
  };
  return labels[status] || status;
}
```

**Step 2: Add to run.ts routing (add after existing commands)**

Add this section to `src/tooling/cli-commands/run.ts` in the command routing:

```typescript
// Add import at top
import { startW1R, resumeW1R, getW1RStatus, listW1R } from './w1r.js';

// Add command routing (in the else-if chain)
} else if (command === 'w1r') {
  const subcommand = args[1];

  switch (subcommand) {
    case 'start': {
      const bookArg = args.find(a => a.startsWith('--book='));
      const bookSlug = bookArg?.split('=')[1] || 'core-rulebook';

      const db = getDatabase();
      const result = await startW1R(db.db, bookSlug);

      if (result.success) {
        console.log(`\n✓ Created W1R run: ${result.runId}\n`);
        console.log('--- PROMPT TO PASTE ---\n');
        console.log(result.prompt);
        console.log('\n--- END PROMPT ---\n');
      } else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
      break;
    }

    case 'resume': {
      const runArg = args.find(a => a.startsWith('--run='));
      if (!runArg) {
        console.error('Usage: w1r resume --run=<id>');
        process.exit(1);
      }
      const runId = runArg.split('=')[1];

      const db = getDatabase();
      const result = await resumeW1R(db.db, runId);

      if (result.success) {
        console.log(`\n✓ Resuming W1R run: ${result.runId}\n`);
        console.log('--- PROMPT TO PASTE ---\n');
        console.log(result.prompt);
        console.log('\n--- END PROMPT ---\n');
      } else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
      break;
    }

    case 'status': {
      const runArg = args.find(a => a.startsWith('--run='));
      if (!runArg) {
        console.error('Usage: w1r status --run=<id>');
        process.exit(1);
      }
      const runId = runArg.split('=')[1];

      const db = getDatabase();
      const result = getW1RStatus(db.db, runId);

      if (result.success) {
        console.log(result.status);
      } else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
      break;
    }

    case 'list': {
      const bookArg = args.find(a => a.startsWith('--book='));
      const statusArg = args.find(a => a.startsWith('--status='));

      const db = getDatabase();
      const runs = listW1R(db.db, {
        bookSlug: bookArg?.split('=')[1],
        status: statusArg?.split('=')[1],
      });

      if (runs.length === 0) {
        console.log('No W1R runs found.');
      } else {
        console.log('W1R Runs:\n');
        for (const run of runs) {
          console.log(`  ${run.runId}`);
          console.log(`    Book: ${run.bookSlug}`);
          console.log(`    Status: ${run.status}, Chapter ${run.chapter}`);
          console.log(`    Updated: ${run.updatedAt}\n`);
        }
      }
      break;
    }

    default:
      console.error(`Unknown w1r command: ${subcommand}`);
      console.error('Available: start, resume, status, list');
      process.exit(1);
  }
}
```

**Step 3: Add scripts to package.json**

Add to root `package.json` scripts section:

```json
"w1r:start": "tsx src/tooling/cli-commands/run.ts w1r start",
"w1r:resume": "tsx src/tooling/cli-commands/run.ts w1r resume",
"w1r:status": "tsx src/tooling/cli-commands/run.ts w1r status",
"w1r:list": "tsx src/tooling/cli-commands/run.ts w1r list",
"w1r:process": "tsx src/tooling/cli-commands/run.ts w1r process",
"w1r:approve": "tsx src/tooling/cli-commands/run.ts w1r approve",
"w1r:complete": "tsx src/tooling/cli-commands/run.ts w1r complete"
```

**Step 4: Run existing tests to verify no regressions**

```bash
pnpm test src/tooling/workflows/
```

Expected: All W1R tests pass

**Step 5: Commit**

```bash
git add src/tooling/cli-commands/w1r.ts src/tooling/cli-commands/run.ts package.json
git commit -m "feat(w1r): add CLI commands for start, resume, status, list"
```

---

## Task 7: W1R Process Command (Agent Instructions)

**Files:**
- Modify: `src/tooling/cli-commands/w1r.ts` (add processW1R function)
- Modify: `src/tooling/cli-commands/run.ts` (add process routing)

**Step 1: Add process function to w1r.ts**

```typescript
// Add to src/tooling/cli-commands/w1r.ts

export interface ProcessResult {
  success: boolean;
  prompt?: string;
  error?: string;
}

/**
 * Process feedback and generate agent instructions
 */
export async function processW1R(
  db: Database.Database,
  runId: string,
  chapterNumber: number
): Promise<ProcessResult> {
  const w1rRepo = new W1RRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { checkpoint } = result;

  if (checkpoint.currentChapter !== chapterNumber) {
    return {
      success: false,
      error: `Expected chapter ${checkpoint.currentChapter}, got ${chapterNumber}`,
    };
  }

  const workspace = getWorkspaceInfo(DATA_DIR, runId);

  // Read feedback
  const feedbackFilename = `${String(chapterNumber).padStart(2, '0')}-feedback.md`;
  const feedbackPath = resolve(workspace.feedbackPath, feedbackFilename);

  let feedback;
  try {
    feedback = await readFeedback(feedbackPath);
  } catch (e) {
    return { success: false, error: `Could not read feedback: ${feedbackPath}` };
  }

  // Update checkpoint with feedback
  checkpoint.currentFeedback = feedback;
  checkpoint.chapterStatus = 'clarifying';
  w1rRepo.updateCheckpoint(runId, checkpoint);

  // Get chapter info
  const chapters = await getChaptersFromWorkspace(workspace.chaptersPath);
  const chapter = chapters.find(c => c.number === chapterNumber);
  if (!chapter) {
    return { success: false, error: `Chapter ${chapterNumber} not found` };
  }

  // Read chapter content
  const chapterPath = resolve(workspace.chaptersPath, chapter.filename);
  const chapterContent = await readFile(chapterPath, 'utf-8');

  // Format feedback
  const feedbackFormatted = formatFeedbackForPrompt(feedback);

  // Generate processing prompt
  const prompt = generateProcessingPrompt(
    checkpoint,
    chapter,
    chapterContent,
    feedbackFormatted
  );

  return { success: true, prompt };
}
```

**Step 2: Add process routing to run.ts**

Add to the w1r switch statement:

```typescript
case 'process': {
  const runArg = args.find(a => a.startsWith('--run='));
  const chapterArg = args.find(a => a.startsWith('--chapter='));

  if (!runArg || !chapterArg) {
    console.error('Usage: w1r process --run=<id> --chapter=<n>');
    process.exit(1);
  }

  const runId = runArg.split('=')[1];
  const chapterNum = parseInt(chapterArg.split('=')[1], 10);

  const db = getDatabase();
  const result = await processW1R(db.db, runId, chapterNum);

  if (result.success) {
    console.log(result.prompt);
  } else {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
  break;
}
```

**Step 3: Add import**

Add `processW1R` to the import statement in run.ts.

**Step 4: Commit**

```bash
git add src/tooling/cli-commands/w1r.ts src/tooling/cli-commands/run.ts
git commit -m "feat(w1r): add process command for agent instructions"
```

---

## Task 8: W1R Approve and Complete Commands

**Files:**
- Modify: `src/tooling/cli-commands/w1r.ts` (add approveW1R, completeW1R)
- Modify: `src/tooling/cli-commands/run.ts` (add routing)

**Step 1: Add approve function**

```typescript
// Add to src/tooling/cli-commands/w1r.ts

export interface ApproveResult {
  success: boolean;
  isComplete?: boolean;
  prompt?: string;
  error?: string;
}

/**
 * Approve current chapter and advance to next
 */
export async function approveW1R(
  db: Database.Database,
  runId: string,
  chapterNumber: number
): Promise<ApproveResult> {
  const w1rRepo = new W1RRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { checkpoint } = result;

  if (checkpoint.currentChapter !== chapterNumber) {
    return {
      success: false,
      error: `Expected chapter ${checkpoint.currentChapter}, got ${chapterNumber}`,
    };
  }

  // Record completion
  checkpoint.completedChapters.push({
    chapter: chapterNumber,
    feedbackRounds: checkpoint.currentChapterIteration,
    completedAt: new Date().toISOString(),
  });

  const workspace = getWorkspaceInfo(DATA_DIR, runId);
  const chapters = await getChaptersFromWorkspace(workspace.chaptersPath);
  const totalChapters = chapters.length;

  // Check if all chapters complete
  if (chapterNumber >= totalChapters) {
    checkpoint.chapterStatus = 'feedback'; // Terminal state
    w1rRepo.updateCheckpoint(runId, checkpoint);
    w1rRepo.updateStatus(runId, 'completed');

    // Generate completion prompt
    const nextVersion = incrementPatchVersion(checkpoint.sourceVersion);
    const prompt = generateCompletionPrompt(checkpoint, nextVersion);

    return { success: true, isComplete: true, prompt };
  }

  // Advance to next chapter
  const nextChapterNum = chapterNumber + 1;
  const nextChapter = chapters.find(c => c.number === nextChapterNum);

  if (!nextChapter) {
    return { success: false, error: `Next chapter ${nextChapterNum} not found` };
  }

  // Reset state for next chapter
  checkpoint.currentChapter = nextChapterNum;
  checkpoint.chapterStatus = 'feedback';
  checkpoint.currentFeedback = null;
  checkpoint.clarifyingDialogue = [];
  checkpoint.writerOutput = null;
  checkpoint.editorReview = null;
  checkpoint.domainReview = null;
  checkpoint.currentChapterIteration = 1;

  w1rRepo.updateCheckpoint(runId, checkpoint);

  // Create feedback template for next chapter
  const feedbackPath = await createChapterFeedbackTemplate(workspace, nextChapter);

  // Generate next chapter prompt
  const prompt = generateNextChapterPrompt(checkpoint, workspace, nextChapter, feedbackPath);

  return { success: true, isComplete: false, prompt };
}

function incrementPatchVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}
```

**Step 2: Add complete function (for promotion)**

```typescript
// Add to src/tooling/cli-commands/w1r.ts

export interface CompleteResult {
  success: boolean;
  newVersion?: string;
  message?: string;
  error?: string;
}

/**
 * Complete W1R workflow with optional reviews and promotion
 */
export async function completeW1R(
  db: Database.Database,
  runId: string,
  reviewOption: 'skip' | 'sanity' | 'comprehensive'
): Promise<CompleteResult> {
  const w1rRepo = new W1RRepository(db);
  const bookRepo = new BookRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { checkpoint } = result;
  const book = bookRepo.getBySlug(checkpoint.bookSlug);

  if (!book) {
    return { success: false, error: `Book not found: ${checkpoint.bookSlug}` };
  }

  const newVersion = incrementPatchVersion(checkpoint.sourceVersion);

  // TODO: Implement review execution if not 'skip'
  if (reviewOption !== 'skip') {
    return {
      success: false,
      error: `Review option '${reviewOption}' not yet implemented. Use 'skip' for now.`,
    };
  }

  // TODO: Implement version promotion
  // 1. Create new version directory
  // 2. Copy chapters from workspace
  // 3. Update database
  // 4. Generate HTML/PDF

  return {
    success: true,
    newVersion,
    message: `Promoted to v${newVersion}. Run html:web:build and pdf:build to generate artifacts.`,
  };
}
```

**Step 3: Add routing to run.ts**

Add to the w1r switch statement:

```typescript
case 'approve': {
  const runArg = args.find(a => a.startsWith('--run='));
  const chapterArg = args.find(a => a.startsWith('--chapter='));

  if (!runArg || !chapterArg) {
    console.error('Usage: w1r approve --run=<id> --chapter=<n>');
    process.exit(1);
  }

  const runId = runArg.split('=')[1];
  const chapterNum = parseInt(chapterArg.split('=')[1], 10);

  const db = getDatabase();
  const result = await approveW1R(db.db, runId, chapterNum);

  if (result.success) {
    if (result.isComplete) {
      console.log('\n✓ All chapters complete!\n');
    } else {
      console.log(`\n✓ Chapter ${chapterNum} approved!\n`);
    }
    console.log('--- PROMPT ---\n');
    console.log(result.prompt);
    console.log('\n--- END ---\n');
  } else {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
  break;
}

case 'complete': {
  const runArg = args.find(a => a.startsWith('--run='));
  const reviewArg = args.find(a => a.startsWith('--review='));

  if (!runArg) {
    console.error('Usage: w1r complete --run=<id> [--review=skip|sanity|comprehensive]');
    process.exit(1);
  }

  const runId = runArg.split('=')[1];
  const reviewOption = (reviewArg?.split('=')[1] || 'skip') as 'skip' | 'sanity' | 'comprehensive';

  const db = getDatabase();
  const result = await completeW1R(db.db, runId, reviewOption);

  if (result.success) {
    console.log(`\n✓ ${result.message}\n`);
  } else {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
  break;
}
```

**Step 4: Add imports**

Add `approveW1R`, `completeW1R` to the import statement.

**Step 5: Commit**

```bash
git add src/tooling/cli-commands/w1r.ts src/tooling/cli-commands/run.ts
git commit -m "feat(w1r): add approve and complete commands"
```

---

## Task 9: Integration Test

**Files:**
- Create: `src/tooling/workflows/w1r-integration.test.ts`

**Step 1: Write integration test**

```typescript
// src/tooling/workflows/w1r-integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

import { W1RRepository } from './w1r-repository.js';
import { createW1RCheckpoint } from './w1r-types.js';
import {
  createWorkspace,
  copyChaptersToWorkspace,
  createChapterFeedbackTemplate,
} from './w1r-workspace.js';
import { generateSessionPrompt } from './w1r-prompts.js';

describe('W1R Integration', () => {
  let db: Database.Database;
  let tempDir: string;

  beforeEach(async () => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_type TEXT NOT NULL,
        book_id TEXT NOT NULL,
        status TEXT NOT NULL,
        checkpoint_json TEXT,
        current_step TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE books (
        id TEXT PRIMARY KEY,
        slug TEXT,
        title TEXT,
        current_version TEXT
      );
      INSERT INTO books VALUES ('book1', 'core-rulebook', 'Core Rulebook', '1.4.0');
    `);

    tempDir = await mkdtemp(join(tmpdir(), 'w1r-integ-'));

    // Create mock chapters
    const chaptersDir = join(tempDir, 'source-chapters');
    await mkdir(chaptersDir, { recursive: true });
    await writeFile(
      join(chaptersDir, '01-welcome.md'),
      '# 1. Welcome to the Game\n\nWelcome content here.'
    );
    await writeFile(
      join(chaptersDir, '02-core-concepts.md'),
      '# 2. Core Concepts\n\nCore concepts content.'
    );
  });

  afterEach(async () => {
    db.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should complete full workflow setup', async () => {
    const repo = new W1RRepository(db);
    const runId = repo.generateRunId();

    // Create workspace
    const workspace = await createWorkspace(tempDir, runId);
    expect(workspace.runId).toBe(runId);

    // Copy chapters
    const sourceDir = join(tempDir, 'source-chapters');
    const chapters = await copyChaptersToWorkspace(sourceDir, workspace);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].title).toBe('Welcome to the Game');

    // Create checkpoint
    const checkpoint = createW1RCheckpoint(runId, 'core-rulebook', '1.4.0', workspace.rootPath);
    repo.createRun('book1', checkpoint);

    // Create feedback template
    const feedbackPath = await createChapterFeedbackTemplate(workspace, chapters[0]);
    expect(feedbackPath).toContain('01-feedback.md');

    // Generate prompt
    const prompt = generateSessionPrompt(checkpoint, workspace, chapters[0], feedbackPath);
    expect(prompt).toContain(runId);
    expect(prompt).toContain('Chapter 1: Welcome to the Game');
    expect(prompt).toContain('w1r:process');

    // Verify database state
    const saved = repo.getRun(runId);
    expect(saved).not.toBeNull();
    expect(saved!.run.status).toBe('running');
    expect(saved!.checkpoint.currentChapter).toBe(1);
  });

  it('should prevent multiple active runs for same book', () => {
    const repo = new W1RRepository(db);

    const cp1 = createW1RCheckpoint('wfrun_first', 'core-rulebook', '1.4.0', '/path');
    repo.createRun('book1', cp1);

    // Should find existing active run
    const existing = repo.getActiveRunForBook('book1');
    expect(existing).not.toBeNull();
    expect(existing!.run.id).toBe('wfrun_first');
  });

  it('should track chapter completion', () => {
    const repo = new W1RRepository(db);
    const runId = 'wfrun_progress';

    const checkpoint = createW1RCheckpoint(runId, 'core-rulebook', '1.4.0', '/path');
    repo.createRun('book1', checkpoint);

    // Complete chapter 1
    checkpoint.completedChapters.push({
      chapter: 1,
      feedbackRounds: 2,
      completedAt: new Date().toISOString(),
    });
    checkpoint.currentChapter = 2;
    checkpoint.currentChapterIteration = 1;
    repo.updateCheckpoint(runId, checkpoint);

    // Verify
    const saved = repo.getRun(runId);
    expect(saved!.checkpoint.completedChapters).toHaveLength(1);
    expect(saved!.checkpoint.currentChapter).toBe(2);
    expect(saved!.run.currentStep).toBe('chapter_2_feedback');
  });
});
```

**Step 2: Run integration test**

```bash
pnpm test src/tooling/workflows/w1r-integration.test.ts
```

Expected: PASS

**Step 3: Run all W1R tests**

```bash
pnpm test src/tooling/workflows/w1r
```

Expected: All pass

**Step 4: Commit**

```bash
git add src/tooling/workflows/w1r-integration.test.ts
git commit -m "test(w1r): add integration tests for full workflow"
```

---

## Task 10: Final Verification

**Step 1: Run all tests**

```bash
pnpm test
```

**Step 2: Test CLI commands manually**

```bash
# Test start
pnpm w1r:start --book=core-rulebook

# Test list
pnpm w1r:list

# Test status (use run ID from start)
pnpm w1r:status --run=<id>
```

**Step 3: Commit any fixes and create final commit**

```bash
git add -A
git commit -m "feat(w1r): complete W1R revision workflow implementation

Implements human-driven creative revision workflow:
- Chapter-by-chapter progression with structured feedback
- Writer agent with clarifying dialogue
- Editor + Domain expert review
- Database tracking across sessions
- CLI commands: start, resume, status, list, process, approve, complete

Closes design doc: docs/plans/2025-11-28-w1r-revision-workflow-design.md"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Types and checkpoint schema | w1r-types.ts |
| 2 | Feedback template parser/writer | w1r-feedback.ts |
| 3 | Workspace manager | w1r-workspace.ts |
| 4 | Repository (database ops) | w1r-repository.ts |
| 5 | Prompt generator | w1r-prompts.ts |
| 6 | CLI commands (start, resume, status, list) | w1r.ts, run.ts, package.json |
| 7 | Process command | w1r.ts, run.ts |
| 8 | Approve and complete commands | w1r.ts, run.ts |
| 9 | Integration tests | w1r-integration.test.ts |
| 10 | Final verification | - |

**Estimated commits:** 10
**Test coverage:** Unit tests for each module + integration test
