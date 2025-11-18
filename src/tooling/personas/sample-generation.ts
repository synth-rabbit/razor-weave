#!/usr/bin/env tsx
/**
 * Sample script to demonstrate persona generation and analyze distribution
 */
import { generatePersona, generatePersonaBatch } from './generator.js';

console.log('=== Procedural Persona Generation Demo ===\n');

// Generate 3 sample personas with fixed seeds for reproducibility
console.log('--- Sample Generated Personas (Deterministic) ---\n');

const samples = [
  generatePersona(42),
  generatePersona(1337),
  generatePersona(999),
];

samples.forEach((persona, index) => {
  console.log(`\nSample ${index + 1} (seed: ${persona.seed}):`);
  console.log(`  Archetype: ${persona.dimensions.archetypes}`);
  console.log(
    `  Experience: ${persona.dimensions.experience_levels}`
  );
  console.log(
    `  Cognitive Styles: ${persona.dimensions.cognitive_styles.primary}${persona.dimensions.cognitive_styles.secondary ? ` + ${persona.dimensions.cognitive_styles.secondary}` : ''}`
  );
  console.log(
    `  Playstyle: ${persona.dimensions.playstyle_modifiers.join(', ')}`
  );
  console.log(
    `  System Exposure: ${persona.dimensions.system_exposures.join(', ')}`
  );
  console.log(
    `  Fiction-First: ${persona.dimensions.fiction_first_alignment}`
  );
  console.log(`  GM Philosophy: ${persona.dimensions.gm_philosophy}`);
  console.log(
    `  Affinity Score: ${persona.affinityScore.toFixed(2)}`
  );
});

// Generate a batch and analyze distribution
console.log('\n\n--- Batch Generation Analysis (100 personas) ---\n');

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

console.log('Archetype Distribution:');
Array.from(archetypeCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([archetype, count]) => {
    const percentage = ((count / batch.length) * 100).toFixed(1);
    console.log(`  ${archetype.padEnd(20)} ${count} (${percentage}%)`);
  });

console.log('\nExperience Level Distribution:');
Array.from(experienceCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([level, count]) => {
    const percentage = ((count / batch.length) * 100).toFixed(1);
    console.log(`  ${level.padEnd(30)} ${count} (${percentage}%)`);
  });

console.log('\nFiction-First Alignment Distribution:');
Array.from(fictionFirstCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([alignment, count]) => {
    const percentage = ((count / batch.length) * 100).toFixed(1);
    console.log(`  ${alignment.padEnd(20)} ${count} (${percentage}%)`);
  });

console.log('\nGM Philosophy Distribution:');
Array.from(gmPhilosophyCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([philosophy, count]) => {
    const percentage = ((count / batch.length) * 100).toFixed(1);
    console.log(`  ${philosophy.padEnd(30)} ${count} (${percentage}%)`);
  });

console.log('\nAffinity Analysis:');
console.log(
  `  Personas with positive affinity: ${personasWithAffinity}/${batch.length} (${((personasWithAffinity / batch.length) * 100).toFixed(1)}%)`
);
console.log(
  `  Average affinity score: ${(totalAffinityScore / batch.length).toFixed(3)}`
);
console.log(
  `  Total affinity score: ${totalAffinityScore.toFixed(2)}`
);

console.log('\n=== Generation Complete ===');
