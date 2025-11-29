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
