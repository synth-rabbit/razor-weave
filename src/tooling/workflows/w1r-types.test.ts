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
