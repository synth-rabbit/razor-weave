// src/tooling/w1/prompt-generator.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import {
  generatePlanningPrompt,
  generateWriterPrompt,
  generateEditorPrompt,
  generateSharedContext,
  generateOrchestratorPrompt,
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
});
