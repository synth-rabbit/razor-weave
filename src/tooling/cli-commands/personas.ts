import { getDatabase } from '../database/index.js';
import { hydrateAllCorePersonas } from '../personas/hydrator.js';
import { generatePersonaBatch } from '../personas/generator.js';

export interface GenerateOptions {
  seed?: number;
  batchSize?: number;
}

/**
 * Command: hydrate-core
 * Loads all 10 core personas into the database
 */
export function hydrateCore(): void {
  console.log('Hydrating core personas...');
  const count = hydrateAllCorePersonas();
  console.log(`✓ Loaded ${count} core personas`);
}

/**
 * Command: generate <count>
 * Generate procedural personas and save to database
 */
export async function generate(
  count: number,
  options?: GenerateOptions
): Promise<void> {
  console.log(`Generating ${count} personas...`);

  const batchSize = options?.batchSize || 10;
  const db = getDatabase();
  let generated = 0;

  for (let i = 0; i < count; i += batchSize) {
    const remaining = Math.min(batchSize, count - i);
    const batch = generatePersonaBatch(remaining, options);

    // Save each persona to database
    for (const persona of batch) {
      db.personas.create({
        name: `Generated Persona ${persona.seed}`,
        type: 'generated',
        archetype: persona.dimensions.archetypes,
        experience_level: persona.dimensions.experience_levels,
        playstyle_modifiers: persona.dimensions.playstyle_modifiers,
        primary_cognitive_style: persona.dimensions.cognitive_styles.primary,
        secondary_cognitive_style: persona.dimensions.cognitive_styles.secondary,
        social_emotional_traits: persona.dimensions.social_emotional_traits,
        system_exposures: persona.dimensions.system_exposures,
        life_contexts: persona.dimensions.life_contexts,
        fiction_first_alignment: persona.dimensions.fiction_first_alignment,
        narrative_mechanics_comfort:
          persona.dimensions.narrative_mechanics_comfort,
        gm_philosophy: persona.dimensions.gm_philosophy,
        genre_flexibility: persona.dimensions.genre_flexibility,
        generated_seed: persona.seed,
      });
      generated++;
    }

    console.log(`  Generated ${generated}/${count}...`);
  }

  console.log(`✓ Generated ${generated} personas`);
}

/**
 * Command: stats
 * Display persona statistics
 */
export async function stats(): Promise<void> {
  const db = getDatabase();

  // Get all personas
  const allPersonas = db.personas.getAll();

  console.log('\n=== Persona Statistics ===\n');
  console.log(`Total personas: ${allPersonas.length}`);

  // Count by type
  const byType = countBy(allPersonas, 'type');
  console.log(`  Core: ${byType.core || 0}`);
  console.log(`  Generated: ${byType.generated || 0}`);

  // Count by archetype
  console.log('\nArchetypes:');
  const byArchetype = countBy(allPersonas, 'archetype');
  for (const [archetype, count] of Object.entries(byArchetype)) {
    console.log(`  ${archetype}: ${count}`);
  }

  // Count by experience level
  console.log('\nExperience Levels:');
  const byExperience = countBy(allPersonas, 'experience_level');
  for (const [level, count] of Object.entries(byExperience)) {
    console.log(`  ${level}: ${count}`);
  }
}

/**
 * Helper function to count occurrences by a specific key
 */
function countBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce(
    (acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}
