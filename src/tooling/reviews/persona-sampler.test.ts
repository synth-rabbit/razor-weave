// src/tooling/reviews/persona-sampler.test.ts
import { describe, it, expect } from 'vitest';
import { FOCUS_CATEGORIES, type FocusCategory } from './persona-sampler.js';

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
});
