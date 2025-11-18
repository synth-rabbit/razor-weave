import { loadSchema, type DimensionSchema } from './schema.js';
import {
  validatePersonaCoherence,
  type PersonaDimensions,
} from './coherence.js';

export interface GenerationOptions {
  seed?: number;
  maxAttempts?: number; // Default: 100
  targetAffinityScore?: number; // Prefer personas above this score
}

export interface GeneratedPersona {
  dimensions: PersonaDimensions;
  seed: number;
  affinityScore: number;
  generatedAt: Date;
}

/**
 * Seeded random number generator using Linear Congruential Generator (LCG)
 * Provides deterministic random numbers for reproducible persona generation
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is a positive integer
    this.state = Math.abs(seed) || 1;
  }

  /**
   * Generate next random number between 0.0 and 1.0
   * Uses LCG algorithm: x = (a * x + c) mod m
   */
  next(): number {
    // LCG parameters from Numerical Recipes
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);

    this.state = (a * this.state + c) % m;
    return this.state / m;
  }

  /**
   * Generate random integer from 0 to max-1
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  /**
   * Pick random element from array
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[this.nextInt(array.length)];
  }

  /**
   * Sample multiple unique elements from array
   * Returns up to 'count' elements, or array length if smaller
   */
  sample<T>(array: T[], count: number): T[] {
    const result: T[] = [];
    const available = [...array];

    const actualCount = Math.min(count, available.length);

    for (let i = 0; i < actualCount; i++) {
      const index = this.nextInt(available.length);
      result.push(available[index]);
      available.splice(index, 1);
    }

    return result;
  }
}

/**
 * Generate a single persona with optional seed for determinism
 */
export function generatePersona(seed?: number): GeneratedPersona {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Use seed + attempt to get different combinations on retry
    const rng = new SeededRandom(actualSeed + attempt);
    const dimensions = generateDimensions(rng);

    // Validate the generated persona
    const validation = validatePersonaCoherence(dimensions);

    if (validation.valid) {
      return {
        dimensions,
        seed: actualSeed,
        affinityScore: validation.affinityScore,
        generatedAt: new Date(),
      };
    }
  }

  throw new Error(
    `Failed to generate valid persona after ${maxAttempts} attempts`
  );
}

/**
 * Generate batch of personas with optional settings
 */
export function generatePersonaBatch(
  count: number,
  options?: GenerationOptions
): GeneratedPersona[] {
  const batch: GeneratedPersona[] = [];
  const baseSeed = options?.seed ?? Math.floor(Math.random() * 1000000);
  const maxAttempts = options?.maxAttempts ?? 100;

  for (let i = 0; i < count; i++) {
    // Use larger increments to ensure diverse personas
    const personaSeed = baseSeed + i * 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rng = new SeededRandom(personaSeed + attempt * 100000);
      const dimensions = generateDimensions(rng);

      const validation = validatePersonaCoherence(dimensions);

      if (validation.valid) {
        // Check if we should prefer higher affinity scores
        if (
          options?.targetAffinityScore !== undefined &&
          validation.affinityScore < options.targetAffinityScore
        ) {
          // Continue searching for better match if we haven't exhausted attempts
          if (attempt < maxAttempts - 1) {
            continue;
          }
        }

        batch.push({
          dimensions,
          seed: personaSeed,
          affinityScore: validation.affinityScore,
          generatedAt: new Date(),
        });
        break;
      }
    }

    // Verify that we successfully generated this persona
    if (batch.length !== i + 1) {
      throw new Error(
        `Failed to generate valid persona ${i + 1} after ${maxAttempts} attempts`
      );
    }
  }

  return batch;
}

/**
 * Internal function to generate dimension values using seeded RNG
 */
function generateDimensions(rng: SeededRandom): PersonaDimensions {
  const schema = loadSchema();

  // Single-value dimensions (pick exactly 1)
  const archetypes = rng.choice(schema.archetypes);
  const experience_levels = rng.choice(schema.experience_levels);
  const fiction_first_alignment = rng.choice(schema.fiction_first_alignment);
  const narrative_mechanics_comfort = rng.choice(
    schema.narrative_mechanics_comfort
  );
  const gm_philosophy = rng.choice(schema.gm_philosophy);
  const genre_flexibility = rng.choice(schema.genre_flexibility);

  // Multi-value dimensions (1-3 values)
  const playstyle_modifiers = generateMultiValue(
    rng,
    schema.playstyle_modifiers,
    1,
    3
  );
  const social_emotional_traits = generateMultiValue(
    rng,
    schema.social_emotional_traits,
    1,
    3
  );
  const system_exposures = generateMultiValue(
    rng,
    schema.system_exposures,
    1,
    3
  );
  const life_contexts = generateMultiValue(rng, schema.life_contexts, 1, 3);

  // Cognitive styles (1 primary + optional secondary)
  const cognitive_styles = generateCognitiveStyles(rng, schema);

  return {
    archetypes,
    playstyle_modifiers,
    cognitive_styles,
    social_emotional_traits,
    experience_levels,
    system_exposures,
    life_contexts,
    fiction_first_alignment,
    narrative_mechanics_comfort,
    gm_philosophy,
    genre_flexibility,
  };
}

/**
 * Generate 1-3 unique values from array
 */
function generateMultiValue(
  rng: SeededRandom,
  values: string[],
  min: number,
  max: number
): string[] {
  // Randomly pick count between min and max
  const count = min + rng.nextInt(max - min + 1);
  return rng.sample(values, count);
}

/**
 * Generate cognitive styles with primary and optional secondary
 */
function generateCognitiveStyles(
  rng: SeededRandom,
  schema: DimensionSchema
): { primary: string; secondary?: string } {
  const primary = rng.choice(schema.cognitive_styles);

  // 50% chance of secondary style
  const hasSecondary = rng.next() < 0.5;

  if (hasSecondary) {
    // Pick a different style for secondary
    const availableSecondary = schema.cognitive_styles.filter(
      (style) => style !== primary
    );
    const secondary = rng.choice(availableSecondary);
    return { primary, secondary };
  }

  return { primary };
}
