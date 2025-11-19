import { describe, it, expect } from 'vitest';
import { ReviewDataSchema, AnalysisDataSchema } from './schemas.js';

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

  describe('AnalysisDataSchema', () => {
    it('validates correct analysis data', () => {
      const validData = {
        executive_summary:
          'Overall strong content with minor clarity issues affecting beginners',
        priority_rankings: [
          {
            category: 'Combat Initiative',
            severity: 7,
            frequency: 3,
            affected_personas: ['core-sarah', 'core-alex'],
            description: 'Initiative rules unclear for new players',
          },
        ],
        dimension_summaries: {
          clarity_readability: {
            average: 7.5,
            themes: ['Clear structure', 'Jargon heavy'],
          },
          rules_accuracy: {
            average: 9.2,
            themes: ['Consistent', 'Well explained'],
          },
          persona_fit: {
            average: 6.8,
            themes: ['Great for veterans', 'Tough for newbies'],
          },
          practical_usability: {
            average: 8.1,
            themes: ['Table-ready', 'Examples helpful'],
          },
        },
        persona_breakdowns: {
          Beginners: {
            strengths: ['Clear examples'],
            struggles: ['Complex terminology'],
          },
          Veterans: {
            strengths: ['Comprehensive rules'],
            struggles: ['None identified'],
          },
        },
      };

      const result = AnalysisDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects short executive summary', () => {
      const invalidData = {
        executive_summary: 'Short',
        priority_rankings: [],
        dimension_summaries: {
          clarity_readability: { average: 8, themes: [] },
          rules_accuracy: { average: 9, themes: [] },
          persona_fit: { average: 7, themes: [] },
          practical_usability: { average: 8, themes: [] },
        },
        persona_breakdowns: {},
      };

      const result = AnalysisDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
