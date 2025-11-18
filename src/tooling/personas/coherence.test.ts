import { describe, it, expect } from 'vitest';
import {
  validateQuantityRules,
  validateExclusions,
  checkAffinity,
  validatePersonaCoherence,
  type PersonaDimensions,
} from './coherence.js';

describe('Coherence Validation Engine', () => {
  describe('validateQuantityRules', () => {
    it('should fail when dimension has too few values', () => {
      const result = validateQuantityRules('playstyle_modifiers', []);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'playstyle_modifiers must have at least 1 value(s)'
      );
    });

    it('should fail when dimension has too many values', () => {
      const result = validateQuantityRules('playstyle_modifiers', [
        'Rule Minimalist',
        'Theme First',
        'Combat Tactician',
        'Exploration Focused',
      ]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'playstyle_modifiers cannot exceed 3 value(s)'
      );
    });

    it('should pass when dimension has valid number of values', () => {
      const result = validateQuantityRules('playstyle_modifiers', [
        'Rule Minimalist',
        'Theme First',
      ]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should enforce exact value for single-value dimensions', () => {
      const tooMany = validateQuantityRules('archetypes', [
        'Tactician',
        'Method Actor',
      ]);
      expect(tooMany.valid).toBe(false);
      expect(tooMany.errors).toContain(
        'archetypes must have exactly 1 value(s)'
      );

      const justRight = validateQuantityRules('archetypes', ['Tactician']);
      expect(justRight.valid).toBe(true);
    });

    it('should handle cognitive_styles special rules (primary + optional secondary)', () => {
      const onlyPrimary = validateQuantityRules('cognitive_styles', [
        'Analytical',
      ]);
      expect(onlyPrimary.valid).toBe(true);

      const withSecondary = validateQuantityRules('cognitive_styles', [
        'Analytical',
        'Intuitive',
      ]);
      expect(withSecondary.valid).toBe(true);

      const tooMany = validateQuantityRules('cognitive_styles', [
        'Analytical',
        'Intuitive',
        'Visual',
      ]);
      expect(tooMany.valid).toBe(false);
      expect(tooMany.errors).toContain(
        'cognitive_styles cannot exceed 2 value(s) (1 primary + 0-1 secondary)'
      );
    });
  });

  describe('validateExclusions', () => {
    it('should fail when excluded combination is present within same dimension', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Rule Minimalist', 'Rule Maximalist'],
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Veteran (5+ years)',
        system_exposures: ['5e-Native'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validateExclusions(dimensions);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Exclusion violation in playstyle_modifiers: Rule Minimalist and Rule Maximalist are incompatible'
      );
    });

    it('should fail when excluded combination spans dimensions', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Rule Minimalist'],
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Anxious Newbie'],
        experience_levels: 'Newbie (0-1 years)',
        system_exposures: ['5e-Native'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Forever GM', // Invalid: Newbie can't be Forever GM
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validateExclusions(dimensions);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Exclusion violation: Newbie (0-1 years) and Forever GM are incompatible'
      );
    });

    it('should pass when no exclusions are violated', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Rule Minimalist', 'Theme First'],
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Veteran (5+ years)',
        system_exposures: ['OSR-Enthusiast'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validateExclusions(dimensions);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect cognitive_styles exclusions (Simplicity Seeker vs Complexity Tolerant)', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Rule Minimalist'],
        cognitive_styles: {
          primary: 'Simplicity Seeker',
          secondary: 'Complexity Tolerant',
        },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Veteran (5+ years)',
        system_exposures: ['OSR-Enthusiast'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validateExclusions(dimensions);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Exclusion violation in cognitive_styles: Simplicity Seeker and Complexity Tolerant are incompatible'
      );
    });
  });

  describe('checkAffinity', () => {
    it('should return neutral score (0.0) for persona with no affinity matches', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Social Connector',
        playstyle_modifiers: ['Combat Tactician'],
        cognitive_styles: { primary: 'Visual' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Intermediate (2-4 years)',
        system_exposures: ['Indie Curious'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Interested',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const score = checkAffinity(dimensions);
      expect(score).toBe(0.0);
    });

    it('should return positive score for OSR-Enthusiast + Rule Minimalist + Native affinity', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Rule Minimalist'],
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Veteran (5+ years)',
        system_exposures: ['OSR-Enthusiast'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const score = checkAffinity(dimensions);
      expect(score).toBe(0.7); // Matches OSR affinity rule (weight 0.7)
    });

    it('should return cumulative score for multiple affinity matches', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Mechanics First'],
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Veteran (5+ years)',
        system_exposures: ['5e-Native'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const score = checkAffinity(dimensions);
      // Should match Tactician + Analytical + Mechanics First (weight 0.7)
      expect(score).toBe(0.7);
    });

    it('should match affinity rules with array values', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Rule Minimalist'],
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Anxious Newbie', 'Conflict-Averse'],
        experience_levels: 'Newbie (0-1 years)',
        system_exposures: ['5e-Native'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Interested',
        narrative_mechanics_comfort: 'Needs Concrete Numbers',
        gm_philosophy: 'Player-facing',
        genre_flexibility: 'Genre Enthusiast',
      };

      const score = checkAffinity(dimensions);
      // Should match anxious newbie affinity (weight 0.6)
      expect(score).toBe(0.6);
    });
  });

  describe('validatePersonaCoherence', () => {
    it('should fail for persona with quantity rule violations', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: [], // Too few (min: 1)
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Veteran (5+ years)',
        system_exposures: ['OSR-Enthusiast'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validatePersonaCoherence(dimensions);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain(
        'playstyle_modifiers must have at least 1 value(s)'
      );
    });

    it('should fail for persona with exclusion violations', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Rule Minimalist', 'Rule Maximalist'],
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Veteran (5+ years)',
        system_exposures: ['OSR-Enthusiast'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validatePersonaCoherence(dimensions);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain(
        'Exclusion violation in playstyle_modifiers: Rule Minimalist and Rule Maximalist are incompatible'
      );
    });

    it('should pass with high affinity score for coherent persona with affinities', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Tactician',
        playstyle_modifiers: ['Rule Minimalist'],
        cognitive_styles: { primary: 'Analytical' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Veteran (5+ years)',
        system_exposures: ['OSR-Enthusiast'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Native',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validatePersonaCoherence(dimensions);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.affinityScore).toBe(0.7); // OSR affinity match
      expect(result.warnings).toBeDefined();
    });

    it('should pass with neutral score for valid persona without affinities', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Social Connector',
        playstyle_modifiers: ['Combat Tactician'],
        cognitive_styles: { primary: 'Visual' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Intermediate (2-4 years)',
        system_exposures: ['Indie Curious'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Interested',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validatePersonaCoherence(dimensions);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.affinityScore).toBe(0.0);
    });

    it('should provide warnings for low affinity score', () => {
      const dimensions: PersonaDimensions = {
        archetypes: 'Social Connector',
        playstyle_modifiers: ['Combat Tactician'],
        cognitive_styles: { primary: 'Visual' },
        social_emotional_traits: ['Confident'],
        experience_levels: 'Intermediate (2-4 years)',
        system_exposures: ['Indie Curious'],
        life_contexts: ['Full-time Work'],
        fiction_first_alignment: 'Interested',
        narrative_mechanics_comfort: 'Comfortable with Abstraction',
        gm_philosophy: 'Collaborative Storyteller',
        genre_flexibility: 'Genre Enthusiast',
      };

      const result = validatePersonaCoherence(dimensions);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'No affinity bonuses found - persona may lack thematic coherence'
      );
    });
  });
});
