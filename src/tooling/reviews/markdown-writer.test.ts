import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, rmSync, existsSync } from 'fs';
import { writeReviewMarkdown } from './markdown-writer.js';

describe('Markdown Writer', () => {
  const testOutputPath = 'data/test/reviews/test-review.md';

  afterEach(() => {
    if (existsSync('data/test')) {
      rmSync('data/test', { recursive: true, force: true });
    }
  });

  it('writes review markdown with all sections', () => {
    writeReviewMarkdown(
      {
        campaignId: 'campaign-test-123',
        personaName: 'Sarah',
        personaArchetype: 'Explorer',
        personaExperience: 'Newbie (0-1 years)',
        personaTraits: ['Curious', 'Visual Thinker'],
        contentTitle: 'Core Rulebook v1.2',
        reviewData: {
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Great content overall!',
          issue_annotations: [
            {
              section: 'Combat',
              issue: 'Initiative unclear',
              impact: 'Confusion in first session',
              location: 'Page 42',
            },
          ],
          overall_assessment: 'Solid work with minor issues',
        },
      },
      testOutputPath
    );

    expect(existsSync(testOutputPath)).toBe(true);

    const content = readFileSync(testOutputPath, 'utf-8');
    expect(content).toContain('# Review: Sarah - Core Rulebook v1.2');
    expect(content).toContain('Explorer');
    expect(content).toContain('8/10');
    expect(content).toContain('Great content overall!');
    expect(content).toContain('Initiative unclear');
  });
});
