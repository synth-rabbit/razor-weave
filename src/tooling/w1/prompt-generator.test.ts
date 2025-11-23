// src/tooling/w1/prompt-generator.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import {
  generatePlanningPrompt,
  generateWriterPrompt,
  generateEditorPrompt,
} from './prompt-generator.js';

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
    });

    it('includes book name in prompt', () => {
      const analysisPath = join(testDir, 'analysis.md');
      writeFileSync(analysisPath, '# Test Analysis\nSome content');

      const prompt = generatePlanningPrompt(db, {
        runId: 'test-run-123',
        bookId: 'book_core',
        bookName: 'Core Rulebook',
        analysisPath,
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('Core Rulebook');
    });

    it('includes analysis content in prompt', () => {
      const analysisPath = join(testDir, 'analysis.md');
      writeFileSync(analysisPath, '# Test Analysis\nSome unique content here');

      const prompt = generatePlanningPrompt(db, {
        runId: 'test-run-123',
        bookId: 'book_core',
        bookName: 'Core Rulebook',
        analysisPath,
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('Test Analysis');
      expect(prompt).toContain('Some unique content here');
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
      expect(prompt).toContain('pnpm w1:planning --save');
    });

    it('includes style guide content when available', () => {
      const analysisPath = join(testDir, 'analysis.md');
      writeFileSync(analysisPath, 'content');
      writeFileSync(join(testDir, 'content.md'), '# Content Style\nWrite clearly.');

      const prompt = generatePlanningPrompt(db, {
        runId: 'test-run',
        bookId: 'book_core',
        bookName: 'Test',
        analysisPath,
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('Content Style Guide');
      expect(prompt).toContain('Write clearly.');
    });
  });

  describe('generateWriterPrompt', () => {
    it('includes plan and chapter content', () => {
      const planPath = join(testDir, 'plan.json');
      const chapterPath = join(testDir, 'chapter.md');
      writeFileSync(planPath, '{"plan_id": "test-plan"}');
      writeFileSync(chapterPath, '# Chapter 1\nContent here');

      const prompt = generateWriterPrompt({
        runId: 'test-run',
        planPath,
        chapterPaths: [chapterPath],
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('plan_id');
      expect(prompt).toContain('test-plan');
      expect(prompt).toContain('Chapter 1');
      expect(prompt).toContain('Content here');
    });

    it('includes run ID in prompt and save command', () => {
      const planPath = join(testDir, 'plan.json');
      const chapterPath = join(testDir, 'chapter.md');
      writeFileSync(planPath, '{}');
      writeFileSync(chapterPath, '# Test');

      const prompt = generateWriterPrompt({
        runId: 'writer-run-456',
        planPath,
        chapterPaths: [chapterPath],
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('writer-run-456');
      expect(prompt).toContain('--run=writer-run-456');
    });

    it('handles multiple chapters', () => {
      const planPath = join(testDir, 'plan.json');
      const chapter1Path = join(testDir, 'ch1.md');
      const chapter2Path = join(testDir, 'ch2.md');
      writeFileSync(planPath, '{}');
      writeFileSync(chapter1Path, '# Chapter 1\nFirst chapter');
      writeFileSync(chapter2Path, '# Chapter 2\nSecond chapter');

      const prompt = generateWriterPrompt({
        runId: 'test-run',
        planPath,
        chapterPaths: [chapter1Path, chapter2Path],
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('Chapter 1');
      expect(prompt).toContain('First chapter');
      expect(prompt).toContain('Chapter 2');
      expect(prompt).toContain('Second chapter');
    });
  });

  describe('generateEditorPrompt', () => {
    it('includes chapters and style guides', () => {
      const chapterPath = join(testDir, 'chapter.md');
      writeFileSync(chapterPath, '# Test Chapter\nReview this content');
      writeFileSync(join(testDir, 'content.md'), '# Content Style\nBe concise.');
      writeFileSync(join(testDir, 'formatting.md'), '# Formatting\nUse headers.');

      const prompt = generateEditorPrompt({
        runId: 'editor-run-789',
        chapterPaths: [chapterPath],
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('Test Chapter');
      expect(prompt).toContain('Review this content');
      expect(prompt).toContain('Content Style');
      expect(prompt).toContain('Be concise.');
      expect(prompt).toContain('Formatting');
      expect(prompt).toContain('Use headers.');
    });

    it('includes run ID in prompt and save command', () => {
      const chapterPath = join(testDir, 'chapter.md');
      writeFileSync(chapterPath, '# Test');

      const prompt = generateEditorPrompt({
        runId: 'editor-run-xyz',
        chapterPaths: [chapterPath],
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('editor-run-xyz');
      expect(prompt).toContain('--run=editor-run-xyz');
    });

    it('includes save command with correct format', () => {
      const chapterPath = join(testDir, 'chapter.md');
      writeFileSync(chapterPath, '# Test');

      const prompt = generateEditorPrompt({
        runId: 'run-123',
        chapterPaths: [chapterPath],
        styleGuidesDir: testDir,
      });

      expect(prompt).toContain('pnpm w1:content-modify --save-editor');
      expect(prompt).toContain('--run=run-123');
    });
  });
});
