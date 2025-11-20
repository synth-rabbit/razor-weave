import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hydrateCore, generate, stats } from './personas.js';
import { getDatabase } from '../database/index.js';
import { hydrateAllCorePersonas } from '../personas/hydrator.js';
import { generatePersonaBatch } from '../personas/generator.js';
import * as logger from '../logging/logger.js';

// Mock the dependencies
vi.mock('../database/index.js');
vi.mock('../personas/hydrator.js');
vi.mock('../personas/generator.js');

interface MockDatabase {
  personas: {
    create: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    countByDimension: ReturnType<typeof vi.fn>;
  };
}

describe('personas CLI commands', () => {
  let mockDb: MockDatabase;
  let logSpy: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Spy on logger.log.info to capture output
    logSpy = vi.spyOn(logger.log, 'info').mockImplementation(() => {});

    // Setup mock database
    mockDb = {
      personas: {
        create: vi.fn().mockReturnValue('test-id'),
        getAll: vi.fn().mockReturnValue([]),
        countByDimension: vi.fn().mockReturnValue({}),
      },
    };

    vi.mocked(getDatabase).mockReturnValue(mockDb as any);
  });

  describe('hydrate-core command', () => {
    it('should load all core personas', () => {
      vi.mocked(hydrateAllCorePersonas).mockReturnValue(10);

      hydrateCore();

      expect(hydrateAllCorePersonas).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith('Hydrating core personas...');
      expect(logSpy).toHaveBeenCalledWith('✓ Loaded 10 core personas');
    });

    it('should be idempotent (safe to run multiple times)', () => {
      vi.mocked(hydrateAllCorePersonas).mockReturnValue(10);

      // Run twice
      hydrateCore();
      hydrateCore();

      expect(hydrateAllCorePersonas).toHaveBeenCalledTimes(2);
      // Should not throw errors
    });

    it('should report success count', () => {
      vi.mocked(hydrateAllCorePersonas).mockReturnValue(5);

      hydrateCore();

      expect(logSpy).toHaveBeenCalledWith('✓ Loaded 5 core personas');
    });
  });

  describe('generate command', () => {
    it('should generate requested count of personas', async () => {
      const mockPersonas = [
        {
          dimensions: {
            archetypes: 'Mentor',
            experience_levels: 'Advanced',
            playstyle_modifiers: ['Strategic'],
            cognitive_styles: { primary: 'Analytical' },
            social_emotional_traits: ['Empathetic'],
            system_exposures: ['D&D 5e'],
            life_contexts: ['Busy Professional'],
            fiction_first_alignment: 'Balanced',
            narrative_mechanics_comfort: 'High',
            gm_philosophy: 'Collaborative',
            genre_flexibility: 'High',
          },
          seed: 42,
          affinityScore: 8,
          generatedAt: new Date(),
        },
        {
          dimensions: {
            archetypes: 'Explorer',
            experience_levels: 'Beginner',
            playstyle_modifiers: ['Curious'],
            cognitive_styles: { primary: 'Creative' },
            social_emotional_traits: ['Enthusiastic'],
            system_exposures: ['None'],
            life_contexts: ['Student'],
            fiction_first_alignment: 'Fiction-First',
            narrative_mechanics_comfort: 'Low',
            gm_philosophy: 'Guided',
            genre_flexibility: 'Medium',
          },
          seed: 1042,
          affinityScore: 7,
          generatedAt: new Date(),
        },
      ];

      vi.mocked(generatePersonaBatch).mockReturnValue(mockPersonas);

      await generate(2);

      expect(generatePersonaBatch).toHaveBeenCalledWith(2, undefined);
      expect(mockDb.personas.create).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenCalledWith('Generating 2 personas...');
      expect(logSpy).toHaveBeenCalledWith('✓ Generated 2 personas');
    });

    it('should save generated personas to database', async () => {
      const mockPersona = {
        dimensions: {
          archetypes: 'Mentor',
          experience_levels: 'Advanced',
          playstyle_modifiers: ['Strategic'],
          cognitive_styles: { primary: 'Analytical', secondary: 'Empathetic' },
          social_emotional_traits: ['Patient'],
          system_exposures: ['PbtA'],
          life_contexts: ['Teacher'],
          fiction_first_alignment: 'Fiction-First',
          narrative_mechanics_comfort: 'High',
          gm_philosophy: 'Facilitative',
          genre_flexibility: 'High',
        },
        seed: 100,
        affinityScore: 9,
        generatedAt: new Date(),
      };

      vi.mocked(generatePersonaBatch).mockReturnValue([mockPersona]);

      await generate(1);

      expect(mockDb.personas.create).toHaveBeenCalledWith({
        name: expect.stringContaining('Generated'),
        type: 'generated',
        archetype: 'Mentor',
        experience_level: 'Advanced',
        playstyle_modifiers: ['Strategic'],
        primary_cognitive_style: 'Analytical',
        secondary_cognitive_style: 'Empathetic',
        social_emotional_traits: ['Patient'],
        system_exposures: ['PbtA'],
        life_contexts: ['Teacher'],
        fiction_first_alignment: 'Fiction-First',
        narrative_mechanics_comfort: 'High',
        gm_philosophy: 'Facilitative',
        genre_flexibility: 'High',
        generated_seed: 100,
      });
    });

    it('should support seed option for reproducibility', async () => {
      const mockPersona = {
        dimensions: {
          archetypes: 'Performer',
          experience_levels: 'Intermediate',
          playstyle_modifiers: ['Dramatic'],
          cognitive_styles: { primary: 'Creative' },
          social_emotional_traits: ['Expressive'],
          system_exposures: ['Fate'],
          life_contexts: ['Artist'],
          fiction_first_alignment: 'Fiction-First',
          narrative_mechanics_comfort: 'Medium',
          gm_philosophy: 'Narrative',
          genre_flexibility: 'High',
        },
        seed: 42,
        affinityScore: 8,
        generatedAt: new Date(),
      };

      vi.mocked(generatePersonaBatch).mockReturnValue([mockPersona]);

      await generate(1, { seed: 42 });

      expect(generatePersonaBatch).toHaveBeenCalledWith(1, { seed: 42 });
    });

    it('should support batch-size option', async () => {
      const mockPersonas = Array(50)
        .fill(null)
        .map((_, i) => ({
          dimensions: {
            archetypes: 'Explorer',
            experience_levels: 'Beginner',
            playstyle_modifiers: ['Curious'],
            cognitive_styles: { primary: 'Analytical' },
            social_emotional_traits: ['Eager'],
            system_exposures: ['None'],
            life_contexts: ['Student'],
            fiction_first_alignment: 'Balanced',
            narrative_mechanics_comfort: 'Low',
            gm_philosophy: 'Guided',
            genre_flexibility: 'Medium',
          },
          seed: i,
          affinityScore: 7,
          generatedAt: new Date(),
        }));

      // Mock to return different batches
      vi.mocked(generatePersonaBatch)
        .mockReturnValueOnce(mockPersonas.slice(0, 20))
        .mockReturnValueOnce(mockPersonas.slice(20, 40))
        .mockReturnValueOnce(mockPersonas.slice(40, 50));

      await generate(50, { batchSize: 20 });

      expect(generatePersonaBatch).toHaveBeenCalledTimes(3);
      expect(mockDb.personas.create).toHaveBeenCalledTimes(50);
    });

    it('should show progress during generation', async () => {
      const mockPersonas = Array(25)
        .fill(null)
        .map((_, i) => ({
          dimensions: {
            archetypes: 'Mentor',
            experience_levels: 'Advanced',
            playstyle_modifiers: ['Strategic'],
            cognitive_styles: { primary: 'Analytical' },
            social_emotional_traits: ['Patient'],
            system_exposures: ['D&D 5e'],
            life_contexts: ['Professional'],
            fiction_first_alignment: 'Balanced',
            narrative_mechanics_comfort: 'High',
            gm_philosophy: 'Collaborative',
            genre_flexibility: 'Medium',
          },
          seed: i,
          affinityScore: 8,
          generatedAt: new Date(),
        }));

      vi.mocked(generatePersonaBatch)
        .mockReturnValueOnce(mockPersonas.slice(0, 10))
        .mockReturnValueOnce(mockPersonas.slice(10, 20))
        .mockReturnValueOnce(mockPersonas.slice(20, 25));

      await generate(25, { batchSize: 10 });

      expect(logSpy).toHaveBeenCalledWith('  Generated 10/25...');
      expect(logSpy).toHaveBeenCalledWith('  Generated 20/25...');
      expect(logSpy).toHaveBeenCalledWith('  Generated 25/25...');
    });
  });

  describe('stats command', () => {
    it('should show total count', async () => {
      mockDb.personas.getAll.mockReturnValue([
        { id: '1', type: 'core', archetype: 'Mentor', experience_level: 'Advanced' },
        { id: '2', type: 'generated', archetype: 'Explorer', experience_level: 'Beginner' },
      ]);

      await stats();

      expect(logSpy).toHaveBeenCalledWith('\n=== Persona Statistics ===\n');
      expect(logSpy).toHaveBeenCalledWith('Total personas: 2');
    });

    it('should show distribution by type (core vs generated)', async () => {
      mockDb.personas.getAll.mockReturnValue([
        { id: '1', type: 'core', archetype: 'Mentor', experience_level: 'Advanced' },
        { id: '2', type: 'core', archetype: 'Explorer', experience_level: 'Beginner' },
        { id: '3', type: 'generated', archetype: 'Performer', experience_level: 'Intermediate' },
      ]);

      await stats();

      expect(logSpy).toHaveBeenCalledWith('  Core: 2');
      expect(logSpy).toHaveBeenCalledWith('  Generated: 1');
    });

    it('should show distribution by archetype', async () => {
      mockDb.personas.getAll.mockReturnValue([
        { id: '1', type: 'core', archetype: 'Mentor', experience_level: 'Advanced' },
        { id: '2', type: 'core', archetype: 'Mentor', experience_level: 'Beginner' },
        { id: '3', type: 'generated', archetype: 'Explorer', experience_level: 'Intermediate' },
      ]);

      await stats();

      expect(logSpy).toHaveBeenCalledWith('\nArchetypes:');
      expect(logSpy).toHaveBeenCalledWith('  Mentor: 2');
      expect(logSpy).toHaveBeenCalledWith('  Explorer: 1');
    });

    it('should show distribution by experience level', async () => {
      mockDb.personas.getAll.mockReturnValue([
        { id: '1', type: 'core', archetype: 'Mentor', experience_level: 'Advanced' },
        { id: '2', type: 'core', archetype: 'Explorer', experience_level: 'Advanced' },
        { id: '3', type: 'generated', archetype: 'Performer', experience_level: 'Beginner' },
      ]);

      await stats();

      expect(logSpy).toHaveBeenCalledWith('\nExperience Levels:');
      expect(logSpy).toHaveBeenCalledWith('  Advanced: 2');
      expect(logSpy).toHaveBeenCalledWith('  Beginner: 1');
    });

    it('should handle empty database', async () => {
      mockDb.personas.getAll.mockReturnValue([]);

      await stats();

      expect(logSpy).toHaveBeenCalledWith('Total personas: 0');
      expect(logSpy).toHaveBeenCalledWith('  Core: 0');
      expect(logSpy).toHaveBeenCalledWith('  Generated: 0');
    });
  });
});
