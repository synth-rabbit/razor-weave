import { describe, it, expect } from 'vitest';
import {
  generateReviewerPrompt,
  type ReviewerPromptResult,
} from './reviewer-prompt.js';

describe('Reviewer Prompt Generator', () => {
  it('generates prompt with persona context', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = generateReviewerPrompt({
      personaId: 'core-sarah',
      personaProfile: {
        name: 'Sarah',
        archetype: 'Explorer',
        experience_level: 'Newbie (0-1 years)',
        playstyle_traits: ['Curious', 'Visual Thinker'],
      },
      contentType: 'book',
      contentSnapshot: '<html><body><h1>Test Book</h1></body></html>',
      contentTitle: 'Core Rulebook v1.2',
    }) as ReviewerPromptResult;

    expect(result.prompt).toContain('Sarah');
    expect(result.prompt).toContain('Explorer');
    expect(result.prompt).toContain('Newbie');
    expect(result.prompt).toContain('clarity_readability');
    expect(result.prompt).toContain('rules_accuracy');
    expect(result.prompt).toContain('persona_fit');
    expect(result.prompt).toContain('practical_usability');
    expect(result.expectedOutputSchema).toContain('ratings');
  });

  it('includes content snapshot in prompt', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = generateReviewerPrompt({
      personaId: 'core-alex',
      personaProfile: {
        name: 'Alex',
        archetype: 'Tactician',
        experience_level: 'Veteran (5+ years)',
        playstyle_traits: ['Analytical'],
      },
      contentType: 'chapter',
      contentSnapshot: '# Combat Rules\n\nTest content',
      contentTitle: 'Chapter 3: Combat',
    }) as ReviewerPromptResult;

    expect(result.prompt).toContain('Combat Rules');
  });
});
