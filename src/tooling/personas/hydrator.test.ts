import { describe, it, expect } from 'vitest';
import { loadPersonaFromFile, hydratePersona } from './hydrator.js';
import { getDatabase } from '@razorweave/database';

describe('Hydrator', () => {
  describe('loadPersonaFromFile', () => {
    it('loads Sarah persona from YAML', () => {
      const persona = loadPersonaFromFile('core-sarah-new-gm');

      expect(persona.name).toBe('Sarah the New GM');
      expect(persona.dimensions.archetype).toBe('Socializer');
      expect(persona.dimensions.playstyle_modifiers).toContain('Session Zero Purist');
      expect(persona.narrative_profile).toContain('actual play podcasts');
    });
  });

  describe('hydratePersona', () => {
    it('loads persona to database', () => {
      const persona = loadPersonaFromFile('core-sarah-new-gm');
      hydratePersona(persona);

      const db = getDatabase();
      const loaded = db.personas.get('core-sarah-new-gm');

      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe('Sarah the New GM');

      const dims = db.personas.getDimensions('core-sarah-new-gm');
      expect(dims.playstyle_modifiers).toContain('Session Zero Purist');
    });
  });
});
