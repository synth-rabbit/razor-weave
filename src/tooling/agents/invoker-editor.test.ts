import { describe, it, expect } from 'vitest';
import { EditorInvoker, EditorReviewResult, EditorFeedbackItem } from './invoker-editor';

describe('EditorInvoker', () => {
  it('should have correct interface structure', () => {
    const invoker = new EditorInvoker();
    expect(invoker).toBeDefined();
    expect(typeof invoker.invoke).toBe('function');
  });

  it('should define EditorReviewResult type correctly', () => {
    const result: EditorReviewResult = {
      approved: true,
      feedback: [],
      summary: 'Test summary'
    };
    expect(result.approved).toBe(true);
    expect(result.feedback).toEqual([]);
    expect(result.summary).toBe('Test summary');
  });

  it('should define EditorFeedbackItem type correctly', () => {
    const feedback: EditorFeedbackItem = {
      issue: 'Grammar error',
      location: 'Chapter 1, paragraph 3',
      suggestion: 'Change "their" to "there"',
      severity: 'error'
    };
    expect(feedback.issue).toBe('Grammar error');
    expect(feedback.severity).toBe('error');
  });

  it('should handle all severity levels', () => {
    const errorFeedback: EditorFeedbackItem = {
      issue: 'Typo',
      location: 'Section 1',
      suggestion: 'Fix typo',
      severity: 'error'
    };
    const warningFeedback: EditorFeedbackItem = {
      issue: 'Unclear phrasing',
      location: 'Section 2',
      suggestion: 'Rephrase for clarity',
      severity: 'warning'
    };
    const suggestionFeedback: EditorFeedbackItem = {
      issue: 'Could be more concise',
      location: 'Section 3',
      suggestion: 'Consider shortening',
      severity: 'suggestion'
    };

    expect(errorFeedback.severity).toBe('error');
    expect(warningFeedback.severity).toBe('warning');
    expect(suggestionFeedback.severity).toBe('suggestion');
  });

  it('should create result with multiple feedback items', () => {
    const result: EditorReviewResult = {
      approved: false,
      feedback: [
        {
          issue: 'Spelling error',
          location: 'Chapter 1',
          suggestion: 'Fix spelling',
          severity: 'error'
        },
        {
          issue: 'Style inconsistency',
          location: 'Chapter 2',
          suggestion: 'Use consistent terminology',
          severity: 'warning'
        }
      ],
      summary: 'Found 2 issues requiring attention'
    };

    expect(result.approved).toBe(false);
    expect(result.feedback).toHaveLength(2);
    expect(result.feedback[0].severity).toBe('error');
    expect(result.feedback[1].severity).toBe('warning');
  });
});
