#!/usr/bin/env tsx
/**
 * Sample script to demonstrate persona generation and analyze distribution
 */
import { generatePersona, generatePersonaBatch } from './generator.js';
import { log } from '../logging/logger.js';

log.info('=== Procedural Persona Generation Demo ===\n');

// Generate 3 sample personas with fixed seeds for reproducibility
log.info('--- Sample Generated Personas (Deterministic) ---\n');

const samples = [
  generatePersona(42),
  generatePersona(1337),
  generatePersona(999),
];

samples.forEach((persona, index) => {
  log.info(`\nSample ${index + 1} (seed: ${persona.seed}):`);
  log.info(`  Archetype: ${persona.dimensions.archetypes}`);
  log.info(
    `  Experience: ${persona.dimensions.experience_levels}`
  );
  log.info(
    `  Cognitive Styles: ${persona.dimensions.cognitive_styles.primary}${persona.dimensions.cognitive_styles.secondary ? ` + ${persona.dimensions.cognitive_styles.secondary}` : ''}`
  );
  log.info(
    `  Playstyle: ${persona.dimensions.playstyle_modifiers.join(', ')}`
  );
  log.info(
    `  System Exposure: ${persona.dimensions.system_exposures.join(', ')}`
  );
  log.info(
    `  Fiction-First: ${persona.dimensions.fiction_first_alignment}`
  );
  log.info(`  GM Philosophy: ${persona.dimensions.gm_philosophy}`);
  log.info(
    `  Affinity Score: ${persona.affinityScore.toFixed(2)}`
  );
});

// Generate a batch and analyze distribution
log.info('\n\n--- Batch Generation Analysis (100 personas) ---\n');

const batch = generatePersonaBatch(100, { seed: 12345 });

// Count distributions
const archetypeCounts = new Map<string, number>();
const experienceCounts = new Map<string, number>();
const fictionFirstCounts = new Map<string, number>();
const gmPhilosophyCounts = new Map<string, number>();

let totalAffinityScore = 0;
let personasWithAffinity = 0;

batch.forEach((persona) => {
  // Count archetypes
  archetypeCounts.set(
    persona.dimensions.archetypes,
    (archetypeCounts.get(persona.dimensions.archetypes) || 0) + 1
  );

  // Count experience levels
  experienceCounts.set(
    persona.dimensions.experience_levels,
    (experienceCounts.get(persona.dimensions.experience_levels) || 0) + 1
  );

  // Count fiction-first alignment
  fictionFirstCounts.set(
    persona.dimensions.fiction_first_alignment,
    (fictionFirstCounts.get(persona.dimensions.fiction_first_alignment) ||
      0) + 1
  );

  // Count GM philosophy
  gmPhilosophyCounts.set(
    persona.dimensions.gm_philosophy,
    (gmPhilosophyCounts.get(persona.dimensions.gm_philosophy) || 0) + 1
  );

  // Track affinity
  totalAffinityScore += persona.affinityScore;
  if (persona.affinityScore > 0) {
    personasWithAffinity++;
  }
});

log.info('Archetype Distribution:');
Array.from(archetypeCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([archetype, count]) => {
    const percentage = ((count / batch.length) * 100).toFixed(1);
    log.info(`  ${archetype.padEnd(20)} ${count} (${percentage}%)`);
  });

log.info('\nExperience Level Distribution:');
Array.from(experienceCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([level, count]) => {
    const percentage = ((count / batch.length) * 100).toFixed(1);
    log.info(`  ${level.padEnd(30)} ${count} (${percentage}%)`);
  });

log.info('\nFiction-First Alignment Distribution:');
Array.from(fictionFirstCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([alignment, count]) => {
    const percentage = ((count / batch.length) * 100).toFixed(1);
    log.info(`  ${alignment.padEnd(20)} ${count} (${percentage}%)`);
  });

log.info('\nGM Philosophy Distribution:');
Array.from(gmPhilosophyCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([philosophy, count]) => {
    const percentage = ((count / batch.length) * 100).toFixed(1);
    log.info(`  ${philosophy.padEnd(30)} ${count} (${percentage}%)`);
  });

log.info('\nAffinity Analysis:');
log.info(
  `  Personas with positive affinity: ${personasWithAffinity}/${batch.length} (${((personasWithAffinity / batch.length) * 100).toFixed(1)}%)`
);
log.info(
  `  Average affinity score: ${(totalAffinityScore / batch.length).toFixed(3)}`
);
log.info(
  `  Total affinity score: ${totalAffinityScore.toFixed(2)}`
);

log.info('\n=== Generation Complete ===');
