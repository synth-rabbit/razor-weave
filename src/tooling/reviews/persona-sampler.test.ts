// src/tooling/reviews/persona-sampler.test.ts
import { describe, it, expect } from 'vitest';
import { FOCUS_CATEGORIES, inferFocus, scorePersona, type FocusCategory } from './persona-sampler.js';

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

  describe('scorePersona', () => {
    const tactician = {
      id: 'gen-1',
      archetype: 'Tactician',
      experience_level: 'Veteran',
      primary_cognitive_style: 'Analytical',
      fiction_first_alignment: 'Low',
      gm_philosophy: 'Traditional',
    };

    const newbieExplorer = {
      id: 'gen-2',
      archetype: 'Explorer',
      experience_level: 'Newbie',
      primary_cognitive_style: 'Visual',
      fiction_first_alignment: 'High',
      gm_philosophy: 'Collaborative',
    };

    it('should return 0 for general focus (even distribution)', () => {
      expect(scorePersona(tactician, 'general')).toBe(0);
      expect(scorePersona(newbieExplorer, 'general')).toBe(0);
    });

    it('should score Tactician higher for combat focus', () => {
      const tacticianScore = scorePersona(tactician, 'combat');
      const explorerScore = scorePersona(newbieExplorer, 'combat');
      expect(tacticianScore).toBeGreaterThan(explorerScore);
      expect(tacticianScore).toBeGreaterThan(0.5); // Primary match
    });

    it('should score Newbie higher for quickstart focus', () => {
      const newbieScore = scorePersona(newbieExplorer, 'quickstart');
      const veteranScore = scorePersona(tactician, 'quickstart');
      expect(newbieScore).toBeGreaterThan(veteranScore);
      expect(newbieScore).toBeGreaterThan(0.5); // Primary match
    });

    it('should score based on gm_philosophy for gm-content', () => {
      // Both should get some score since gm_philosophy is weighted
      const score1 = scorePersona(tactician, 'gm-content');
      const score2 = scorePersona(newbieExplorer, 'gm-content');
      // Scores depend on diversity, both have valid gm_philosophy
      expect(score1).toBeGreaterThanOrEqual(0);
      expect(score2).toBeGreaterThanOrEqual(0);
    });
  });
});
