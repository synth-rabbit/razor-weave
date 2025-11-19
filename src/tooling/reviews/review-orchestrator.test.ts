import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';
import { ReviewOrchestrator } from './review-orchestrator.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

describe('ReviewOrchestrator', () => {
  let db: Database.Database;
  let campaignClient: CampaignClient;
  let personaClient: PersonaClient;
  let orchestrator: ReviewOrchestrator;
  const testDir = '../../data/test';
  const testBookPath = '../../data/test/orchestrator-book.html';

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      testBookPath,
      '<html><body><h1>Test Book</h1></body></html>'
    );

    db = new Database(':memory:');
    createTables(db);

    campaignClient = new CampaignClient(db);
    personaClient = new PersonaClient(db);
    orchestrator = new ReviewOrchestrator(db, campaignClient);

    // Create test persona
    personaClient.create({
      id: 'test-persona-1',
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
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('initializeCampaign', () => {
    it('creates campaign with all_core persona selection', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'all_core',
      });

      expect(campaignId).toMatch(/^campaign-/);

      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign).toBeDefined();
      expect(campaign?.status).toBe('pending');
      expect(campaign?.content_type).toBe('book');
    });

    it('creates campaign with manual persona selection', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      expect(campaignId).toMatch(/^campaign-/);

      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign?.persona_selection_strategy).toBe('manual');
    });

    it('throws error if manual selection has no personas', () => {
      expect(() => {
        orchestrator.initializeCampaign({
          campaignName: 'Test Campaign',
          contentType: 'book',
          contentPath: testBookPath,
          personaSelectionStrategy: 'manual',
          personaIds: [],
        });
      }).toThrow('personaIds required when using manual persona selection strategy');
    });
  });
});
