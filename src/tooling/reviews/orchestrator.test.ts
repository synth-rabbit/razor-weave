import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';
import { ReviewOrchestrator } from './orchestrator.js';

describe('ReviewOrchestrator', () => {
  let db: Database.Database;
  let orchestrator: ReviewOrchestrator;
  const testContentPath = 'data/test/test-content.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(testContentPath, '<html><body>Test</body></html>');

    db = new Database(':memory:');
    createTables(db);

    // Create test persona
    const personaClient = new PersonaClient(db);
    personaClient.create({
      id: 'test-persona',
      name: 'Test Persona',
      type: 'core',
      archetype: 'Explorer',
      experience_level: 'Newbie',
      fiction_first_alignment: 'Curious',
      narrative_mechanics_comfort: 'Neutral',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'Neutral',
      primary_cognitive_style: 'Analytical',
    });

    const campaignClient = new CampaignClient(db);
    orchestrator = new ReviewOrchestrator(db, campaignClient);
  });

  afterEach(() => {
    db.close();
    rmSync('data/test', { recursive: true, force: true });
  });

  describe('initializeCampaign', () => {
    it('creates campaign and snapshots content', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testContentPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona'],
      });

      expect(campaignId).toMatch(/^campaign-/);

      const campaign = orchestrator.getCampaign(campaignId);
      expect(campaign?.campaign_name).toBe('Test Campaign');
      expect(campaign?.status).toBe('pending');
    });
  });
});
