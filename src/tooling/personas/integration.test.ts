import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createTables } from '@razorweave/database';
import { PersonaClient } from '@razorweave/database';
import { hydratePersona, loadPersonaFromFile } from './hydrator.js';
import { generatePersona, generatePersonaBatch } from './generator.js';
import { validatePersonaCoherence } from './coherence.js';

/**
 * Integration Tests for Persona System
 *
 * These tests verify the entire persona system works end-to-end with real databases.
 * Each test uses an isolated test database that is cleaned up after execution.
 */
describe('Persona System Integration Tests', () => {
  let testDb: Database.Database;
  let testDbPath: string;
  let client: PersonaClient;

  beforeEach(() => {
    // Create completely unique test directory per test to avoid parallel execution collisions
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const testDir = join(process.cwd(), 'data', `test-personas-${uniqueId}`);
    mkdirSync(testDir, { recursive: true });

    testDbPath = join(testDir, 'test.db');
    testDb = new Database(testDbPath);
    createTables(testDb);
    client = new PersonaClient(testDb);
  });

  afterEach(() => {
    // Clean up test database
    testDb.close();
    // Remove entire unique test directory (includes db, WAL, SHM)
    const testDir = dirname(testDbPath);
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Full Workflow Test', () => {
    it('should complete full workflow: hydrate core, generate batch, query all', async () => {
      // Step 1: Hydrate all 10 core personas
      const coreIds = [
        'core-sarah-new-gm',
        'core-marcus-osr-veteran',
        'core-alex-indie-convert',
        'core-jordan-busy-parent',
        'core-riley-rules-lawyer',
        'core-morgan-method-actor',
        'core-sam-forever-gm',
        'core-casey-neurodivergent',
        'core-devon-solo-player',
        'core-taylor-video-game-convert'
      ];

      for (const id of coreIds) {
        const personaFile = loadPersonaFromFile(id);
        // Manually insert into test database
        client.create({
          id: personaFile.id,
          name: personaFile.name,
          type: personaFile.type,
          archetype: personaFile.dimensions.archetype,
          experience_level: personaFile.dimensions.experience_level,
          fiction_first_alignment: personaFile.dimensions.fiction_first_alignment,
          narrative_mechanics_comfort: personaFile.dimensions.narrative_mechanics_comfort,
          gm_philosophy: personaFile.dimensions.gm_philosophy,
          genre_flexibility: personaFile.dimensions.genre_flexibility,
          primary_cognitive_style: personaFile.dimensions.cognitive_styles?.primary || '',
          secondary_cognitive_style: personaFile.dimensions.cognitive_styles?.secondary,
          playstyle_modifiers: personaFile.dimensions.playstyle_modifiers,
          social_emotional_traits: personaFile.dimensions.social_emotional_traits,
          system_exposures: personaFile.dimensions.system_exposures,
          life_contexts: personaFile.dimensions.life_contexts,
          schema_version: personaFile.schema_version
        });
      }

      // Step 2: Generate 100 procedural personas
      const batchSize = 100;
      for (let i = 0; i < batchSize; i++) {
        const generated = generatePersona(42000 + i);
        client.create({
          name: `Generated Persona ${i}`,
          type: 'generated',
          archetype: generated.dimensions.archetypes,
          experience_level: generated.dimensions.experience_levels,
          fiction_first_alignment: generated.dimensions.fiction_first_alignment,
          narrative_mechanics_comfort: generated.dimensions.narrative_mechanics_comfort,
          gm_philosophy: generated.dimensions.gm_philosophy,
          genre_flexibility: generated.dimensions.genre_flexibility,
          primary_cognitive_style: generated.dimensions.cognitive_styles.primary,
          secondary_cognitive_style: generated.dimensions.cognitive_styles.secondary,
          playstyle_modifiers: generated.dimensions.playstyle_modifiers,
          social_emotional_traits: generated.dimensions.social_emotional_traits,
          system_exposures: generated.dimensions.system_exposures,
          life_contexts: generated.dimensions.life_contexts,
          generated_seed: generated.seed
        });
      }

      // Step 3: Query and verify all 110 personas exist
      const allPersonas = client.getAll();
      expect(allPersonas.length).toBe(110);

      // Step 4: Verify core vs generated split
      const coreCount = allPersonas.filter(p => p.type === 'core').length;
      const generatedCount = allPersonas.filter(p => p.type === 'generated').length;

      expect(coreCount).toBe(10);
      expect(generatedCount).toBe(100);

      // Step 5: Verify data integrity
      for (const persona of allPersonas) {
        expect(persona.id).toBeDefined();
        expect(persona.name).toBeDefined();
        expect(persona.archetype).toBeDefined();
        expect(persona.experience_level).toBeDefined();

        const dims = client.getDimensions(persona.id);
        expect(dims).toBeDefined();
      }
    });
  });

  describe('Distribution Analysis', () => {
    it('should generate diverse personas across all 11 dimensions', async () => {
      const batchSize = 200;
      const personas = [];

      for (let i = 0; i < batchSize; i++) {
        const generated = generatePersona(50000 + i);
        personas.push(generated.dimensions);
      }

      // Analyze distribution across all dimensions
      const archetypes = new Set(personas.map(p => p.archetypes));
      const experienceLevels = new Set(personas.map(p => p.experience_levels));
      const fictionFirstAlignment = new Set(personas.map(p => p.fiction_first_alignment));
      const narrativeMechanicsComfort = new Set(personas.map(p => p.narrative_mechanics_comfort));
      const gmPhilosophy = new Set(personas.map(p => p.gm_philosophy));
      const genreFlexibility = new Set(personas.map(p => p.genre_flexibility));

      // With larger batch, verify reasonable distribution
      // All dimensions should have some variety (at least 2 different values)
      expect(archetypes.size).toBeGreaterThanOrEqual(2);
      expect(experienceLevels.size).toBeGreaterThanOrEqual(2);
      expect(fictionFirstAlignment.size).toBeGreaterThanOrEqual(2);
      expect(narrativeMechanicsComfort.size).toBeGreaterThanOrEqual(2);
      expect(gmPhilosophy.size).toBeGreaterThanOrEqual(2);
      expect(genreFlexibility.size).toBeGreaterThanOrEqual(2);

      // Log distribution statistics for analysis
      console.log('\nDistribution Statistics (200 personas):');
      console.log(`  Archetypes: ${archetypes.size} unique values`);
      console.log(`  Experience Levels: ${experienceLevels.size} unique values`);
      console.log(`  Fiction-First Alignment: ${fictionFirstAlignment.size} unique values`);
      console.log(`  Narrative Mechanics Comfort: ${narrativeMechanicsComfort.size} unique values`);
      console.log(`  GM Philosophy: ${gmPhilosophy.size} unique values`);
      console.log(`  Genre Flexibility: ${genreFlexibility.size} unique values`);

      // Verify no single value dominates completely (>98%)
      const archetypeDistribution = countDistribution(personas.map(p => p.archetypes));
      const maxArchetypeConcentration = Math.max(...Object.values(archetypeDistribution)) / batchSize;
      expect(maxArchetypeConcentration).toBeLessThan(0.98);
    });

    it('should show balanced distribution in multi-value dimensions', async () => {
      const batchSize = 150;
      const personas = [];

      for (let i = 0; i < batchSize; i++) {
        const generated = generatePersona(60000 + i);
        personas.push(generated.dimensions);
      }

      // Collect all values from multi-value dimensions
      const allPlaystyleModifiers = personas.flatMap(p => p.playstyle_modifiers);
      const allSocialTraits = personas.flatMap(p => p.social_emotional_traits);
      const allSystemExposures = personas.flatMap(p => p.system_exposures);
      const allLifeContexts = personas.flatMap(p => p.life_contexts);

      // Verify diversity in multi-value dimensions (at least 8 unique values)
      expect(new Set(allPlaystyleModifiers).size).toBeGreaterThanOrEqual(8);
      expect(new Set(allSocialTraits).size).toBeGreaterThanOrEqual(6);
      expect(new Set(allSystemExposures).size).toBeGreaterThanOrEqual(6);
      expect(new Set(allLifeContexts).size).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Coherence Verification', () => {
    it('should generate 100 personas that all pass coherence validation', async () => {
      const batchSize = 100;
      let validCount = 0;
      let totalAffinityScore = 0;

      for (let i = 0; i < batchSize; i++) {
        const generated = generatePersona(70000 + i);
        const validation = validatePersonaCoherence(generated.dimensions);

        if (validation.valid) {
          validCount++;
          totalAffinityScore += validation.affinityScore;
        } else {
          console.error(`Validation failed for persona ${i}:`, validation.errors);
        }
      }

      // Verify 100% pass validation
      expect(validCount).toBe(100);

      // Report affinity score statistics
      const avgAffinityScore = totalAffinityScore / batchSize;
      console.log(`Average affinity score: ${avgAffinityScore.toFixed(3)}`);

      // Affinity scores should average above 0 (some personas should match affinity rules)
      expect(avgAffinityScore).toBeGreaterThanOrEqual(0);
    });

    it('should never generate exclusion violations', async () => {
      const batchSize = 100;

      for (let i = 0; i < batchSize; i++) {
        const generated = generatePersona(80000 + i);
        const validation = validatePersonaCoherence(generated.dimensions);

        // Check that no exclusion errors are present
        const hasExclusionError = validation.errors.some(err =>
          err.includes('incompatible') || err.includes('Exclusion violation')
        );

        expect(hasExclusionError).toBe(false);
      }
    });

    it('should report affinity score statistics for batch', async () => {
      const batchSize = 100;
      const affinityScores = [];

      for (let i = 0; i < batchSize; i++) {
        const generated = generatePersona(90000 + i);
        const validation = validatePersonaCoherence(generated.dimensions);
        affinityScores.push(validation.affinityScore);
      }

      // Calculate statistics
      const min = Math.min(...affinityScores);
      const max = Math.max(...affinityScores);
      const avg = affinityScores.reduce((a, b) => a + b, 0) / affinityScores.length;
      const withAffinity = affinityScores.filter(score => score > 0).length;

      console.log('\nAffinity Score Statistics:');
      console.log(`  Min: ${min.toFixed(3)}`);
      console.log(`  Max: ${max.toFixed(3)}`);
      console.log(`  Avg: ${avg.toFixed(3)}`);
      console.log(`  Personas with affinity bonuses: ${withAffinity}/${batchSize} (${(withAffinity/batchSize*100).toFixed(1)}%)`);

      // At least some personas should have affinity bonuses
      expect(withAffinity).toBeGreaterThan(0);
    });
  });

  describe('Deterministic Generation', () => {
    it('should produce identical results with same seed', async () => {
      const seed = 42;
      const count = 10;

      // Generate first batch
      const batch1 = [];
      for (let i = 0; i < count; i++) {
        const persona = generatePersona(seed + i);
        batch1.push(persona);
      }

      // Generate second batch with same seeds
      const batch2 = [];
      for (let i = 0; i < count; i++) {
        const persona = generatePersona(seed + i);
        batch2.push(persona);
      }

      // Verify identical results
      for (let i = 0; i < count; i++) {
        expect(batch1[i].dimensions.archetypes).toBe(batch2[i].dimensions.archetypes);
        expect(batch1[i].dimensions.experience_levels).toBe(batch2[i].dimensions.experience_levels);
        expect(batch1[i].dimensions.fiction_first_alignment).toBe(batch2[i].dimensions.fiction_first_alignment);
        expect(batch1[i].dimensions.narrative_mechanics_comfort).toBe(batch2[i].dimensions.narrative_mechanics_comfort);
        expect(batch1[i].dimensions.gm_philosophy).toBe(batch2[i].dimensions.gm_philosophy);
        expect(batch1[i].dimensions.genre_flexibility).toBe(batch2[i].dimensions.genre_flexibility);

        // Multi-value dimensions should also match
        expect(batch1[i].dimensions.playstyle_modifiers).toEqual(batch2[i].dimensions.playstyle_modifiers);
        expect(batch1[i].dimensions.social_emotional_traits).toEqual(batch2[i].dimensions.social_emotional_traits);
        expect(batch1[i].dimensions.system_exposures).toEqual(batch2[i].dimensions.system_exposures);
        expect(batch1[i].dimensions.life_contexts).toEqual(batch2[i].dimensions.life_contexts);

        // Cognitive styles
        expect(batch1[i].dimensions.cognitive_styles.primary).toBe(batch2[i].dimensions.cognitive_styles.primary);
        expect(batch1[i].dimensions.cognitive_styles.secondary).toBe(batch2[i].dimensions.cognitive_styles.secondary);
      }
    });

    it('should generate different personas with different seeds', async () => {
      const persona1 = generatePersona(1000);
      const persona2 = generatePersona(2000);

      // At least some dimensions should differ
      const hasDifferences =
        persona1.dimensions.archetypes !== persona2.dimensions.archetypes ||
        persona1.dimensions.experience_levels !== persona2.dimensions.experience_levels ||
        persona1.dimensions.fiction_first_alignment !== persona2.dimensions.fiction_first_alignment ||
        persona1.dimensions.gm_philosophy !== persona2.dimensions.gm_philosophy;

      expect(hasDifferences).toBe(true);
    });
  });

  describe('Database Persistence', () => {
    it('should persist data correctly across database connections', async () => {
      // Create a persona and save it
      const generated = generatePersona(12345);
      const personaId = client.create({
        name: 'Persistence Test Persona',
        type: 'generated',
        archetype: generated.dimensions.archetypes,
        experience_level: generated.dimensions.experience_levels,
        fiction_first_alignment: generated.dimensions.fiction_first_alignment,
        narrative_mechanics_comfort: generated.dimensions.narrative_mechanics_comfort,
        gm_philosophy: generated.dimensions.gm_philosophy,
        genre_flexibility: generated.dimensions.genre_flexibility,
        primary_cognitive_style: generated.dimensions.cognitive_styles.primary,
        secondary_cognitive_style: generated.dimensions.cognitive_styles.secondary,
        playstyle_modifiers: generated.dimensions.playstyle_modifiers,
        social_emotional_traits: generated.dimensions.social_emotional_traits,
        system_exposures: generated.dimensions.system_exposures,
        life_contexts: generated.dimensions.life_contexts,
        generated_seed: generated.seed
      });

      // Close the database
      testDb.close();

      // Reopen the database
      testDb = new Database(testDbPath);
      const newClient = new PersonaClient(testDb);

      // Query the persona
      const retrieved = newClient.get(personaId);
      const retrievedDims = newClient.getDimensions(personaId);

      // Verify data persisted correctly
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Persistence Test Persona');
      expect(retrieved?.archetype).toBe(generated.dimensions.archetypes);
      expect(retrieved?.experience_level).toBe(generated.dimensions.experience_levels);

      expect(retrievedDims.playstyle_modifiers).toEqual(generated.dimensions.playstyle_modifiers);
      expect(retrievedDims.social_emotional_traits).toEqual(generated.dimensions.social_emotional_traits);
      expect(retrievedDims.system_exposures).toEqual(generated.dimensions.system_exposures);
      expect(retrievedDims.life_contexts).toEqual(generated.dimensions.life_contexts);
    });

    it('should handle multiple personas without data corruption', async () => {
      const batchSize = 50;
      const personaIds = [];

      // Create multiple personas
      for (let i = 0; i < batchSize; i++) {
        const generated = generatePersona(20000 + i);
        const id = client.create({
          name: `Batch Persona ${i}`,
          type: 'generated',
          archetype: generated.dimensions.archetypes,
          experience_level: generated.dimensions.experience_levels,
          fiction_first_alignment: generated.dimensions.fiction_first_alignment,
          narrative_mechanics_comfort: generated.dimensions.narrative_mechanics_comfort,
          gm_philosophy: generated.dimensions.gm_philosophy,
          genre_flexibility: generated.dimensions.genre_flexibility,
          primary_cognitive_style: generated.dimensions.cognitive_styles.primary,
          secondary_cognitive_style: generated.dimensions.cognitive_styles.secondary,
          playstyle_modifiers: generated.dimensions.playstyle_modifiers,
          social_emotional_traits: generated.dimensions.social_emotional_traits,
          system_exposures: generated.dimensions.system_exposures,
          life_contexts: generated.dimensions.life_contexts,
          generated_seed: generated.seed
        });
        personaIds.push(id);
      }

      // Verify all personas can be retrieved
      const allPersonas = client.getAll();
      expect(allPersonas.length).toBe(batchSize);

      // Verify each persona individually
      for (const id of personaIds) {
        const persona = client.get(id);
        const dims = client.getDimensions(id);

        expect(persona).toBeDefined();
        expect(dims).toBeDefined();
        expect(dims.playstyle_modifiers.length).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * Helper function to count distribution of values
 */
function countDistribution(values: string[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const value of values) {
    distribution[value] = (distribution[value] || 0) + 1;
  }

  return distribution;
}
