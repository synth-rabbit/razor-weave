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

  describe('executeReviews', () => {
    it('throws error if campaign not in pending status', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      // Move to in_progress
      campaignClient.updateStatus(campaignId, 'in_progress');

      expect(() => {
        orchestrator.executeReviews(campaignId);
      }).toThrow('Campaign must be in pending status');
    });

    it('updates status to in_progress', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);

      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign?.status).toBe('in_progress');
    });

    it('logs agent execution plan', () => {
      const consoleSpy: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        consoleSpy.push(args.join(' '));
      };

      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);

      const output = consoleSpy.join('\n');
      expect(output).toContain('Executing reviews for 1 personas');
      expect(output).toContain('test-persona-1');

      console.log = originalLog;
    });
  });

  describe('executeAnalysis', () => {
    it('throws error if campaign not in in_progress status', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      // Campaign still in pending
      expect(() => {
        orchestrator.executeAnalysis(campaignId);
      }).toThrow('Campaign must be in in_progress status');
    });

    it('updates status to analyzing', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);

      // Simulate review completion
      campaignClient.createPersonaReview({
        campaignId,
        personaId: 'test-persona-1',
        reviewData: {
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Test feedback',
          issue_annotations: [],
          overall_assessment: 'Good',
        },
        agentExecutionTime: 5000,
      });

      orchestrator.executeAnalysis(campaignId);

      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign?.status).toBe('analyzing');
    });
  });

  describe('completeCampaign', () => {
    it('throws error if campaign not in analyzing status', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      expect(() => {
        orchestrator.completeCampaign(campaignId);
      }).toThrow('Campaign must be in analyzing status');
    });

    it('updates status to completed and sets timestamp', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);
      campaignClient.createPersonaReview({
        campaignId,
        personaId: 'test-persona-1',
        reviewData: {
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Test',
          issue_annotations: [],
          overall_assessment: 'Good',
        },
        agentExecutionTime: 5000,
      });
      orchestrator.executeAnalysis(campaignId);

      orchestrator.completeCampaign(campaignId);

      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign?.status).toBe('completed');
      expect(campaign?.completed_at).toBeDefined();
    });
  });
});
