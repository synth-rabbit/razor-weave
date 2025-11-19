import { describe, it, expect } from 'vitest';
import { ReviewDataSchema } from './schemas.js';

describe('Review Schemas', () => {
  describe('ReviewDataSchema', () => {
    it('validates correct review data', () => {
      const validData = {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback:
          'This content was clear and well-structured for my playstyle.',
        issue_annotations: [
          {
            section: 'Combat Rules',
            issue: 'Initiative rules unclear',
            impact: 'Confusion during first combat encounter',
            location: 'Page 42, paragraph 3',
          },
        ],
        overall_assessment: 'Strong content with minor clarity issues',
      };

      const result = ReviewDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects ratings out of range', () => {
      const invalidData = {
        ratings: {
          clarity_readability: 11,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'Test feedback',
        issue_annotations: [
          {
            section: 'Test',
            issue: 'Test',
            impact: 'Test',
            location: 'Test',
          },
        ],
        overall_assessment: 'Test assessment',
      };

      const result = ReviewDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing issue annotations', () => {
      const invalidData = {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'Test feedback',
        issue_annotations: [],
        overall_assessment: 'Test assessment',
      };

      const result = ReviewDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects short feedback', () => {
      const invalidData = {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'Short',
        issue_annotations: [
          {
            section: 'Test',
            issue: 'Test',
            impact: 'Test',
            location: 'Test',
          },
        ],
        overall_assessment: 'Test assessment',
      };

      const result = ReviewDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
