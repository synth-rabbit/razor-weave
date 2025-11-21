import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import {
  validateReviewData,
  validateFileExists,
  validateReviewComplete,
} from './validators.js';

describe('Validators', () => {
  describe('validateReviewData', () => {
    it('validates correct review data', () => {
      const validData = {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'This is good feedback that is long enough',
        issue_annotations: [
          {
            section: 'Combat',
            issue: 'Unclear',
            impact: 'Confusion',
            location: 'Page 1',
          },
        ],
        overall_assessment: 'Good overall with some issues',
      };

      const result = validateReviewData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid data', () => {
      const invalidData = {
        ratings: { clarity_readability: 11 },
      };

      const result = validateReviewData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateFileExists', () => {
    const testFilePath = 'data/test/validation-test.txt';

    beforeEach(() => {
      mkdirSync('data/test', { recursive: true });
    });

    afterEach(() => {
      rmSync('data/test', { recursive: true, force: true });
    });

    it('validates existing file', () => {
      writeFileSync(testFilePath, 'test');

      const result = validateFileExists(testFilePath);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing file', () => {
      const result = validateFileExists('nonexistent.txt');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('does not exist');
    });
  });

  describe('validateReviewComplete', () => {
    const testFilePath = 'data/test/review.md';

    beforeEach(() => {
      mkdirSync('data/test', { recursive: true });
    });

    afterEach(() => {
      rmSync('data/test', { recursive: true, force: true });
    });

    it('validates complete review', () => {
      writeFileSync(testFilePath, '# Review');

      const result = validateReviewComplete(
        'campaign-123',
        'persona-1',
        { id: 1 },
        testFilePath
      );

      expect(result.valid).toBe(true);
    });

    it('catches missing database record', () => {
      writeFileSync(testFilePath, '# Review');

      const result = validateReviewComplete(
        'campaign-123',
        'persona-1',
        null,
        testFilePath
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('No database record');
    });

    it('catches missing markdown file', () => {
      const result = validateReviewComplete(
        'campaign-123',
        'persona-1',
        { id: 1 },
        'nonexistent.md'
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Markdown file missing');
    });
  });
});
