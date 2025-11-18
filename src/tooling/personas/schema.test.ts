import { describe, it, expect } from 'vitest';
import { loadSchema, validateDimensions } from './schema.js';

describe('Schema', () => {
  describe('loadSchema', () => {
    it('loads dimensions from YAML file', () => {
      const schema = loadSchema();

      expect(schema.archetypes).toBeDefined();
      expect(schema.archetypes).toContain('Achiever');
      expect(schema.fiction_first_alignment).toContain('Native');
    });

    it('loads combination rules', () => {
      const schema = loadSchema();

      expect(schema.rules.quantity_rules.archetypes).toEqual({
        min: 1,
        max: 1
      });
    });
  });

  describe('validateDimensions', () => {
    it('accepts valid dimension value', () => {
      const result = validateDimensions('archetypes', ['Explorer']);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid dimension value', () => {
      const result = validateDimensions('archetypes', ['InvalidArchetype']);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid archetypes: InvalidArchetype');
    });

    it('enforces quantity rules', () => {
      const result = validateDimensions('archetypes', ['Explorer', 'Tactician']);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('archetypes must have exactly 1 value');
    });
  });
});
