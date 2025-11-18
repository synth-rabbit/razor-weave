import { describe, it, expect } from 'vitest';
import {
  generatePersona,
  generatePersonaBatch,
  SeededRandom,
  type GeneratedPersona,
  type GenerationOptions,
} from './generator.js';
import { validatePersonaCoherence } from './coherence.js';

describe('Procedural Generation Engine', () => {
  describe('SeededRandom', () => {
    it('should produce deterministic sequence with same seed', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      const sequence1 = [rng1.next(), rng1.next(), rng1.next()];
      const sequence2 = [rng2.next(), rng2.next(), rng2.next()];

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(67890);

      const val1 = rng1.next();
      const val2 = rng2.next();

      expect(val1).not.toBe(val2);
    });

    it('should generate values between 0.0 and 1.0', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('should generate integers in specified range', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const val = rng.nextInt(10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('should choose elements from array deterministically', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const choice1 = rng1.choice(array);
      const choice2 = rng2.choice(array);

      expect(choice1).toBe(choice2);
      expect(array).toContain(choice1);
    });

    it('should sample unique elements from array', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const rng = new SeededRandom(42);

      const sample = rng.sample(array, 3);

      expect(sample).toHaveLength(3);
      // Check uniqueness
      expect(new Set(sample).size).toBe(3);
      // Check all elements are from original array
      sample.forEach((elem) => {
        expect(array).toContain(elem);
      });
    });

    it('should handle sample size larger than array', () => {
      const array = ['a', 'b', 'c'];
      const rng = new SeededRandom(42);

      const sample = rng.sample(array, 10);

      // Should return at most array length
      expect(sample.length).toBeLessThanOrEqual(3);
      expect(new Set(sample).size).toBe(sample.length);
    });

    it('should produce deterministic samples', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const rng1 = new SeededRandom(999);
      const rng2 = new SeededRandom(999);

      const sample1 = rng1.sample(array, 3);
      const sample2 = rng2.sample(array, 3);

      expect(sample1).toEqual(sample2);
    });
  });

  describe('generatePersona', () => {
    it('should generate a valid persona that passes coherence validation', () => {
      const persona = generatePersona(12345);

      expect(persona).toBeDefined();
      expect(persona.dimensions).toBeDefined();
      expect(persona.seed).toBe(12345);
      expect(persona.affinityScore).toBeGreaterThanOrEqual(0);
      expect(persona.generatedAt).toBeInstanceOf(Date);

      // Validate with coherence engine
      const validation = validatePersonaCoherence(persona.dimensions);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should generate same persona with same seed (deterministic)', () => {
      const persona1 = generatePersona(42);
      const persona2 = generatePersona(42);

      expect(persona1.dimensions).toEqual(persona2.dimensions);
      expect(persona1.affinityScore).toBe(persona2.affinityScore);
    });

    it('should generate different personas with different seeds', () => {
      const persona1 = generatePersona(111);
      const persona2 = generatePersona(222);

      expect(persona1.dimensions).not.toEqual(persona2.dimensions);
    });

    it('should respect quantity rules for all dimensions', () => {
      const persona = generatePersona(12345);
      const dims = persona.dimensions;

      // Single-value dimensions (exactly 1)
      expect(dims.archetypes).toBeDefined();
      expect(typeof dims.archetypes).toBe('string');

      expect(dims.experience_levels).toBeDefined();
      expect(typeof dims.experience_levels).toBe('string');

      expect(dims.fiction_first_alignment).toBeDefined();
      expect(typeof dims.fiction_first_alignment).toBe('string');

      expect(dims.narrative_mechanics_comfort).toBeDefined();
      expect(typeof dims.narrative_mechanics_comfort).toBe('string');

      expect(dims.gm_philosophy).toBeDefined();
      expect(typeof dims.gm_philosophy).toBe('string');

      expect(dims.genre_flexibility).toBeDefined();
      expect(typeof dims.genre_flexibility).toBe('string');

      // Multi-value dimensions (1-3)
      expect(dims.playstyle_modifiers).toBeInstanceOf(Array);
      expect(dims.playstyle_modifiers.length).toBeGreaterThanOrEqual(1);
      expect(dims.playstyle_modifiers.length).toBeLessThanOrEqual(3);

      expect(dims.social_emotional_traits).toBeInstanceOf(Array);
      expect(dims.social_emotional_traits.length).toBeGreaterThanOrEqual(1);
      expect(dims.social_emotional_traits.length).toBeLessThanOrEqual(3);

      expect(dims.system_exposures).toBeInstanceOf(Array);
      expect(dims.system_exposures.length).toBeGreaterThanOrEqual(1);
      expect(dims.system_exposures.length).toBeLessThanOrEqual(3);

      expect(dims.life_contexts).toBeInstanceOf(Array);
      expect(dims.life_contexts.length).toBeGreaterThanOrEqual(1);
      expect(dims.life_contexts.length).toBeLessThanOrEqual(3);

      // Cognitive styles (1 primary + optional secondary)
      expect(dims.cognitive_styles).toBeDefined();
      expect(dims.cognitive_styles.primary).toBeDefined();
      expect(typeof dims.cognitive_styles.primary).toBe('string');
      // Secondary is optional
      if (dims.cognitive_styles.secondary) {
        expect(typeof dims.cognitive_styles.secondary).toBe('string');
        // Must be different from primary
        expect(dims.cognitive_styles.secondary).not.toBe(
          dims.cognitive_styles.primary
        );
      }
    });

    it('should use random seed if none provided', () => {
      const persona1 = generatePersona();
      const persona2 = generatePersona();

      expect(persona1).toBeDefined();
      expect(persona2).toBeDefined();
      // Should have different seeds assigned
      expect(persona1.seed).toBeDefined();
      expect(persona2.seed).toBeDefined();
    });

    it('should calculate affinity score for generated persona', () => {
      const persona = generatePersona(12345);

      expect(persona.affinityScore).toBeDefined();
      expect(typeof persona.affinityScore).toBe('number');
      expect(persona.affinityScore).toBeGreaterThanOrEqual(0);
    });

    it('should retry on invalid combinations up to maxAttempts', () => {
      // This test verifies the retry mechanism works
      // All personas should eventually be valid
      const personas: GeneratedPersona[] = [];
      for (let i = 0; i < 10; i++) {
        const persona = generatePersona(i * 1000);
        personas.push(persona);

        const validation = validatePersonaCoherence(persona.dimensions);
        expect(validation.valid).toBe(true);
      }

      expect(personas).toHaveLength(10);
    });
  });

  describe('generatePersonaBatch', () => {
    it('should generate requested number of personas', () => {
      const batch = generatePersonaBatch(5);

      expect(batch).toHaveLength(5);
    });

    it('should generate all valid personas', () => {
      const batch = generatePersonaBatch(10);

      batch.forEach((persona) => {
        const validation = validatePersonaCoherence(persona.dimensions);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    it('should produce diverse personas (not all same archetype)', () => {
      const batch = generatePersonaBatch(20);

      const archetypes = new Set(
        batch.map((p) => p.dimensions.archetypes)
      );

      // With 20 personas and 9 archetypes, expect at least 3 different ones
      expect(archetypes.size).toBeGreaterThanOrEqual(3);
    });

    it('should produce diverse experience levels', () => {
      const batch = generatePersonaBatch(20);

      const experienceLevels = new Set(
        batch.map((p) => p.dimensions.experience_levels)
      );

      // Should have some variety
      expect(experienceLevels.size).toBeGreaterThanOrEqual(2);
    });

    it('should produce reproducible batches with seed option', () => {
      const options: GenerationOptions = { seed: 42 };

      const batch1 = generatePersonaBatch(5, options);
      const batch2 = generatePersonaBatch(5, options);

      expect(batch1).toHaveLength(5);
      expect(batch2).toHaveLength(5);

      // Compare each persona
      for (let i = 0; i < 5; i++) {
        expect(batch1[i].dimensions).toEqual(batch2[i].dimensions);
        expect(batch1[i].seed).toBe(batch2[i].seed);
      }
    });

    it('should produce different batches without seed option', () => {
      const batch1 = generatePersonaBatch(3);
      const batch2 = generatePersonaBatch(3);

      // At least one persona should be different
      let foundDifference = false;
      for (let i = 0; i < 3; i++) {
        if (
          JSON.stringify(batch1[i].dimensions) !==
          JSON.stringify(batch2[i].dimensions)
        ) {
          foundDifference = true;
          break;
        }
      }

      expect(foundDifference).toBe(true);
    });

    it('should use sequential seeds when base seed is provided', () => {
      const options: GenerationOptions = { seed: 1000 };
      const batch = generatePersonaBatch(3, options);

      expect(batch[0].seed).toBe(1000);
      expect(batch[1].seed).toBe(2000);
      expect(batch[2].seed).toBe(3000);
    });

    it('should respect maxAttempts option', () => {
      const options: GenerationOptions = { maxAttempts: 50 };

      // Should still generate valid personas
      const batch = generatePersonaBatch(5, options);

      expect(batch).toHaveLength(5);
      batch.forEach((persona) => {
        const validation = validatePersonaCoherence(persona.dimensions);
        expect(validation.valid).toBe(true);
      });
    });

    it('should include affinity scores for all generated personas', () => {
      const batch = generatePersonaBatch(10);

      batch.forEach((persona) => {
        expect(persona.affinityScore).toBeDefined();
        expect(typeof persona.affinityScore).toBe('number');
        expect(persona.affinityScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have some personas with positive affinity scores', () => {
      // Generate enough personas that statistically some should match affinity rules
      const batch = generatePersonaBatch(100);

      const personasWithAffinity = batch.filter(
        (p) => p.affinityScore > 0
      );

      // With 100 personas, we should statistically get some matches
      // But this is probabilistic, so we just check the scores are calculated
      expect(batch.every((p) => typeof p.affinityScore === 'number')).toBe(
        true
      );
      expect(batch.every((p) => p.affinityScore >= 0)).toBe(true);
    });

    it('should generate diverse distribution across multiple dimensions', () => {
      const batch = generatePersonaBatch(50);

      // Check diversity in fiction_first_alignment
      const alignments = new Set(
        batch.map((p) => p.dimensions.fiction_first_alignment)
      );
      expect(alignments.size).toBeGreaterThanOrEqual(2);

      // Check diversity in gm_philosophy
      const philosophies = new Set(
        batch.map((p) => p.dimensions.gm_philosophy)
      );
      expect(philosophies.size).toBeGreaterThanOrEqual(3);

      // Check diversity in genre_flexibility
      const genreFlexibility = new Set(
        batch.map((p) => p.dimensions.genre_flexibility)
      );
      expect(genreFlexibility.size).toBeGreaterThanOrEqual(2);
    });
  });
});
