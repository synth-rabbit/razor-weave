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
