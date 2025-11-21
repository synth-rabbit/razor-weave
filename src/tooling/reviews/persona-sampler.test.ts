// src/tooling/reviews/persona-sampler.test.ts
import { describe, it, expect } from 'vitest';
import { FOCUS_CATEGORIES, inferFocus, type FocusCategory } from './persona-sampler.js';

describe('persona-sampler', () => {
  describe('FOCUS_CATEGORIES', () => {
    it('should have all 6 focus categories', () => {
      const categories: FocusCategory[] = [
        'general',
        'gm-content',
        'combat',
        'narrative',
        'character-creation',
        'quickstart',
      ];
      expect(Object.keys(FOCUS_CATEGORIES)).toEqual(categories);
    });

    it('should have weight config for each category', () => {
      for (const category of Object.keys(FOCUS_CATEGORIES)) {
        const config = FOCUS_CATEGORIES[category as FocusCategory];
        expect(config).toHaveProperty('primaryWeight');
        expect(config).toHaveProperty('secondaryWeight');
        expect(config.primaryWeight + config.secondaryWeight).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('inferFocus', () => {
    it('should infer gm-content from gm paths', () => {
      expect(inferFocus('chapters/gm-guide.md')).toBe('gm-content');
      expect(inferFocus('docs/game-master-tips.md')).toBe('gm-content');
      expect(inferFocus('running-the-game.md')).toBe('gm-content');
    });

    it('should infer combat from combat paths', () => {
      expect(inferFocus('chapters/combat.md')).toBe('combat');
      expect(inferFocus('rules/fighting-rules.md')).toBe('combat');
      expect(inferFocus('weapons-and-armor.md')).toBe('combat');
      expect(inferFocus('battle-system.md')).toBe('combat');
    });

    it('should infer narrative from narrative paths', () => {
      expect(inferFocus('chapters/narrative.md')).toBe('narrative');
      expect(inferFocus('roleplay-tips.md')).toBe('narrative');
      expect(inferFocus('story-creation.md')).toBe('narrative');
    });

    it('should infer character-creation from character paths', () => {
      expect(inferFocus('chapters/character-creation.md')).toBe('character-creation');
      expect(inferFocus('build-guide.md')).toBe('character-creation');
    });

    it('should infer quickstart from intro paths', () => {
      expect(inferFocus('quickstart.md')).toBe('quickstart');
      expect(inferFocus('intro-guide.md')).toBe('quickstart');
      expect(inferFocus('getting-started.md')).toBe('quickstart');
      expect(inferFocus('beginner-guide.md')).toBe('quickstart');
    });

    it('should return general for unmatched paths', () => {
      expect(inferFocus('src/site/core_rulebook_web.html')).toBe('general');
      expect(inferFocus('random-file.md')).toBe('general');
    });

    it('should be case-insensitive', () => {
      expect(inferFocus('COMBAT-RULES.MD')).toBe('combat');
      expect(inferFocus('GM-Guide.md')).toBe('gm-content');
    });
  });
});
