import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync } from 'fs';
import Database from 'better-sqlite3';
import { PersonaClient } from './persona-client.js';
import { createTables } from './schema.js';

describe('PersonaClient', () => {
  let db: Database.Database;
  let client: PersonaClient;

  beforeEach(() => {
    mkdirSync('data', { recursive: true });
    db = new Database(':memory:');
    createTables(db);
    client = new PersonaClient(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('creates a core persona', () => {
      const id = client.create({
        id: 'core-test',
        name: 'Test Persona',
        type: 'core',
        archetype: 'Explorer',
        experience_level: 'Newbie (0-1 years)',
        fiction_first_alignment: 'Curious',
        narrative_mechanics_comfort: 'Neutral',
        gm_philosophy: 'Non-GM',
        genre_flexibility: 'Neutral',
        primary_cognitive_style: 'Analytical',
        playstyle_modifiers: ['Solo Gamer'],
        social_emotional_traits: ['Empathic'],
        system_exposures: ['5e-Native'],
        life_contexts: ['College Student']
      });

      expect(id).toBe('core-test');
    });
  });

  describe('get', () => {
    it('retrieves a persona by ID', () => {
      client.create({
        id: 'core-test',
        name: 'Test Persona',
        type: 'core',
        archetype: 'Explorer',
        experience_level: 'Newbie (0-1 years)',
        fiction_first_alignment: 'Curious',
        narrative_mechanics_comfort: 'Neutral',
        gm_philosophy: 'Non-GM',
        genre_flexibility: 'Neutral',
        primary_cognitive_style: 'Analytical'
      });

      const persona = client.get('core-test');

      expect(persona).toBeDefined();
      expect(persona?.name).toBe('Test Persona');
      expect(persona?.archetype).toBe('Explorer');
    });

    it('returns null for non-existent persona', () => {
      const persona = client.get('non-existent');
      expect(persona).toBeNull();
    });
  });

  describe('getDimensions', () => {
    it('retrieves multi-value dimensions', () => {
      const id = client.create({
        id: 'core-test',
        name: 'Test Persona',
        type: 'core',
        archetype: 'Explorer',
        experience_level: 'Newbie (0-1 years)',
        fiction_first_alignment: 'Curious',
        narrative_mechanics_comfort: 'Neutral',
        gm_philosophy: 'Non-GM',
        genre_flexibility: 'Neutral',
        primary_cognitive_style: 'Analytical',
        playstyle_modifiers: ['Solo Gamer', 'Dice Goblin'],
        social_emotional_traits: ['Empathic', 'Enthusiastic'],
        system_exposures: ['5e-Native'],
        life_contexts: ['College Student', 'Budget Limited']
      });

      const dims = client.getDimensions(id);

      expect(dims.playstyle_modifiers).toEqual(['Solo Gamer', 'Dice Goblin']);
      expect(dims.social_emotional_traits).toEqual(['Empathic', 'Enthusiastic']);
    });
  });
});
