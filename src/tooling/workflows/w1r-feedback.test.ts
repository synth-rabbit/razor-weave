// src/tooling/workflows/w1r-feedback.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateFeedbackMarkdown,
  parseFeedbackMarkdown,
  hasFeedbackContent,
  formatFeedbackForPrompt,
} from './w1r-feedback.js';

describe('W1R Feedback', () => {
  describe('generateFeedbackMarkdown', () => {
    it('should generate markdown with chapter title', () => {
      const md = generateFeedbackMarkdown(1, 'Welcome to the Game');

      expect(md).toContain('# Chapter 1 Feedback: Welcome to the Game');
    });

    it('should include all 7 category sections', () => {
      const md = generateFeedbackMarkdown(1, 'Test');

      expect(md).toContain('## Tone/Voice');
      expect(md).toContain('## Content to Add');
      expect(md).toContain('## Content to Remove/Trim');
      expect(md).toContain('## Pacing/Flow');
      expect(md).toContain('## Clarity');
      expect(md).toContain('## Consistency');
      expect(md).toContain('## Creative Direction');
    });

    it('should include unchecked "No issues" checkbox for each category', () => {
      const md = generateFeedbackMarkdown(1, 'Test');

      const checkboxCount = (md.match(/- \[ \] No issues/g) || []).length;
      expect(checkboxCount).toBe(7);
    });
  });

  describe('parseFeedbackMarkdown', () => {
    it('should parse chapter number and title', () => {
      const md = `# Chapter 5 Feedback: Combat Basics

## Tone/Voice
- [ ] No issues
- Make examples more visceral
`;
      const feedback = parseFeedbackMarkdown(md);

      expect(feedback.chapterNumber).toBe(5);
      expect(feedback.chapterTitle).toBe('Combat Basics');
    });

    it('should parse checked "No issues" checkbox', () => {
      const md = `# Chapter 1 Feedback: Test

## Tone/Voice
- [x] No issues
-

## Content to Add
- [ ] No issues
- Add example of contested checks
`;
      const feedback = parseFeedbackMarkdown(md);

      expect(feedback.toneVoice.noIssues).toBe(true);
      expect(feedback.contentToAdd.noIssues).toBe(false);
      expect(feedback.contentToAdd.notes).toBe('Add example of contested checks');
    });

    it('should collect multiple note lines', () => {
      const md = `# Chapter 1 Feedback: Test

## Clarity
- [ ] No issues
- First note here
- Second note with \`code reference\`
`;
      const feedback = parseFeedbackMarkdown(md);

      expect(feedback.clarity.notes).toContain('First note here');
      expect(feedback.clarity.notes).toContain('Second note with `code reference`');
    });

    it('should throw on invalid format', () => {
      expect(() => parseFeedbackMarkdown('Invalid content')).toThrow('Invalid feedback format');
    });
  });

  describe('hasFeedbackContent', () => {
    it('should return false when all categories are "no issues"', () => {
      const md = `# Chapter 1 Feedback: Test

## Tone/Voice
- [x] No issues
-

## Content to Add
- [x] No issues
-

## Content to Remove/Trim
- [x] No issues
-

## Pacing/Flow
- [x] No issues
-

## Clarity
- [x] No issues
-

## Consistency
- [x] No issues
-

## Creative Direction
- [x] No issues
-
`;
      const feedback = parseFeedbackMarkdown(md);
      expect(hasFeedbackContent(feedback)).toBe(false);
    });

    it('should return true when any category has notes', () => {
      const md = `# Chapter 1 Feedback: Test

## Tone/Voice
- [x] No issues
-

## Content to Add
- [ ] No issues
- Add an example
`;
      const feedback = parseFeedbackMarkdown(md);
      expect(hasFeedbackContent(feedback)).toBe(true);
    });
  });

  describe('formatFeedbackForPrompt', () => {
    it('should format feedback for agent prompt', () => {
      const md = `# Chapter 1 Feedback: Test

## Tone/Voice
- [ ] No issues
- Make it more playful

## Content to Add
- [x] No issues
-
`;
      const feedback = parseFeedbackMarkdown(md);
      const formatted = formatFeedbackForPrompt(feedback);

      expect(formatted).toContain('**Tone/Voice:**');
      expect(formatted).toContain('Make it more playful');
      expect(formatted).toContain('**Content to Add:** No issues');
    });
  });
});
