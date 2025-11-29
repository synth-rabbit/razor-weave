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
      expect(prompt).toContain('**Chapters completed:** 2');
      expect(prompt).toContain('**Total feedback rounds:** 3');
      expect(prompt).toContain('v1.4.1');
      expect(prompt).toContain('Sanity check');
      expect(prompt).toContain('Comprehensive');
    });
  });
});
