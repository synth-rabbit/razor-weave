import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';
import { ReviewOrchestrator } from './review-orchestrator.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve } from 'path';
import * as logger from '../logging/logger.js';
import { TESTING } from '../constants/index.js';
import type { FocusCategory } from './persona-sampler.js';

describe('ReviewOrchestrator', () => {
  let db: Database.Database;
  let campaignClient: CampaignClient;
  let personaClient: PersonaClient;
  let orchestrator: ReviewOrchestrator;
  const testDir = resolve(process.cwd(), 'data/test');
  const testBookPath = resolve(testDir, 'orchestrator-book.html');

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
      const logSpy = vi.spyOn(logger.log, 'info');

      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);

      const allCalls = logSpy.mock.calls.map(call => String(call[0])).join('\n');
      expect(allCalls).toContain('Campaign created:');
      expect(allCalls).toContain('Generated 1 review prompts');
      expect(allCalls).toContain('Prompts directory:');
      expect(allCalls).toContain('execute reviewer agents in batches of 5');

      logSpy.mockRestore();
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
        agentExecutionTime: TESTING.MOCK_AGENT_EXECUTION_TIME_MS,
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
        agentExecutionTime: TESTING.MOCK_AGENT_EXECUTION_TIME_MS,
      });
      orchestrator.executeAnalysis(campaignId);

      orchestrator.completeCampaign(campaignId);

      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign?.status).toBe('completed');
      expect(campaign?.completed_at).toBeDefined();
    });
  });

  describe('persona sampling modes', () => {
    beforeEach(() => {
      // Add 10 core personas
      for (let i = 0; i < 10; i++) {
        personaClient.create({
          id: `core-${i}`,
          name: `Core Persona ${i}`,
          type: 'core',
          archetype: i % 2 === 0 ? 'Tactician' : 'Explorer',
          experience_level: 'Veteran',
          fiction_first_alignment: 'Medium',
          narrative_mechanics_comfort: 'Neutral',
          gm_philosophy: 'Traditional',
          genre_flexibility: 'Neutral',
          primary_cognitive_style: 'Analytical',
        });
      }

      // Add 20 generated personas for sampling tests
      for (let i = 0; i < 20; i++) {
        personaClient.create({
          id: `gen-${i}`,
          name: `Generated ${i}`,
          type: 'generated',
          archetype: i % 2 === 0 ? 'Tactician' : 'Explorer',
          experience_level: i < 5 ? 'Newbie' : 'Intermediate',
          fiction_first_alignment: 'Medium',
          narrative_mechanics_comfort: 'Neutral',
          gm_philosophy: 'Hybrid',
          genre_flexibility: 'Neutral',
          primary_cognitive_style: i % 2 === 0 ? 'Analytical' : 'Visual',
        });
      }
    });

    it('should use core only by default', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'all_core',
      });

      const campaign = campaignClient.getCampaign(campaignId);
      const personaIds = JSON.parse(campaign!.persona_ids);
      // Should have core personas only (10 core + 1 from original setup = 11)
      expect(personaIds.every((id: string) => id.startsWith('core-') || id === 'test-persona-1')).toBe(true);
    });

    it('should add sampled personas with plusCount', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'all_core',
        plusCount: 5,
      });

      const campaign = campaignClient.getCampaign(campaignId);
      const personaIds = JSON.parse(campaign!.persona_ids);
      const coreCount = personaIds.filter((id: string) => id.startsWith('core-') || id === 'test-persona-1').length;
      const genCount = personaIds.filter((id: string) => id.startsWith('gen-')).length;

      expect(coreCount).toBe(11); // 10 from this beforeEach + 1 original
      expect(genCount).toBe(5);   // Plus 5 generated
    });

    it('should use only generated with generatedCount', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'all_core', // Ignored when generatedCount set
        generatedCount: 8,
      });

      const campaign = campaignClient.getCampaign(campaignId);
      const personaIds = JSON.parse(campaign!.persona_ids);

      expect(personaIds).toHaveLength(8);
      expect(personaIds.every((id: string) => id.startsWith('gen-'))).toBe(true);
    });

    it('should infer focus from path when not specified', () => {
      // Create a combat-themed book path
      const combatBookPath = resolve(testDir, 'combat-rules.html');
      writeFileSync(combatBookPath, '<html><body><h1>Combat Rules</h1></body></html>');

      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test',
        contentType: 'book',
        contentPath: combatBookPath,
        personaSelectionStrategy: 'all_core',
        plusCount: 5,
        // focus not specified - should infer 'combat'
      });

      // Focus affects sampling, verify via campaign existence
      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign).toBeDefined();
      const personaIds = JSON.parse(campaign!.persona_ids);
      // Should have sampled personas
      const genCount = personaIds.filter((id: string) => id.startsWith('gen-')).length;
      expect(genCount).toBe(5);
    });

    it('should use explicit focus when provided', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'all_core',
        plusCount: 5,
        focus: 'quickstart' as FocusCategory,
      });

      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign).toBeDefined();
      const personaIds = JSON.parse(campaign!.persona_ids);
      const genCount = personaIds.filter((id: string) => id.startsWith('gen-')).length;
      expect(genCount).toBe(5);
    });

    it('should return unique persona IDs', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'all_core',
        plusCount: 10,
      });

      const campaign = campaignClient.getCampaign(campaignId);
      const personaIds = JSON.parse(campaign!.persona_ids);
      const uniqueIds = new Set(personaIds);
      expect(uniqueIds.size).toBe(personaIds.length);
    });
  });

  describe('addReviewers', () => {
    beforeEach(() => {
      // Add additional core personas for testing
      for (let i = 2; i <= 5; i++) {
        personaClient.create({
          id: `core-persona-${i}`,
          name: `Core Persona ${i}`,
          type: 'core',
          archetype: 'Explorer',
          experience_level: 'Veteran',
          fiction_first_alignment: 'Medium',
          narrative_mechanics_comfort: 'Neutral',
          gm_philosophy: 'Traditional',
          genre_flexibility: 'Neutral',
          primary_cognitive_style: 'Analytical',
        });
      }
      // Add generated personas for plus tests
      for (let i = 0; i < 10; i++) {
        personaClient.create({
          id: `gen-persona-${i}`,
          name: `Generated ${i}`,
          type: 'generated',
          archetype: i % 2 === 0 ? 'Tactician' : 'Explorer',
          experience_level: i < 5 ? 'Newbie' : 'Intermediate',
          fiction_first_alignment: 'Medium',
          narrative_mechanics_comfort: 'Neutral',
          gm_philosophy: 'Hybrid',
          genre_flexibility: 'Neutral',
          primary_cognitive_style: 'Analytical',
        });
      }
    });

    it('throws error if campaign is in pending status', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      expect(() => {
        orchestrator.addReviewers(campaignId, { core: true });
      }).toThrow('Campaign must be in in_progress or completed status');
    });

    it('allows adding reviewers to in_progress campaign', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);

      const result = orchestrator.addReviewers(campaignId, {
        personaIds: ['core-persona-2'],
      });

      expect(result.addedCount).toBe(1);
      expect(result.newPersonaIds).toContain('core-persona-2');
    });

    it('allows adding reviewers to completed campaign', () => {
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
          ratings: { clarity_readability: 8, rules_accuracy: 9, persona_fit: 7, practical_usability: 8 },
          narrative_feedback: 'Test',
          issue_annotations: [],
          overall_assessment: 'Good',
        },
      });
      orchestrator.executeAnalysis(campaignId);
      orchestrator.completeCampaign(campaignId);

      const result = orchestrator.addReviewers(campaignId, {
        personaIds: ['core-persona-2'],
      });

      expect(result.addedCount).toBe(1);
      const campaign = campaignClient.getCampaign(campaignId);
      expect(campaign?.status).toBe('in_progress');
    });

    it('adds all core personas with core option', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);

      const result = orchestrator.addReviewers(campaignId, { core: true });

      // Should add core-persona-2 through core-persona-5 (4 new ones)
      // test-persona-1 is already in campaign
      expect(result.addedCount).toBe(4);
      expect(result.newPersonaIds).toContain('core-persona-2');
    });

    it('deduplicates existing personas', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1', 'core-persona-2'],
      });

      orchestrator.executeReviews(campaignId);

      const result = orchestrator.addReviewers(campaignId, {
        personaIds: ['test-persona-1', 'core-persona-2', 'core-persona-3'],
      });

      // Only core-persona-3 should be added
      expect(result.addedCount).toBe(1);
      expect(result.newPersonaIds).toEqual(['core-persona-3']);
      expect(result.skippedCount).toBe(2);
    });

    it('adds sampled personas with plus option', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);

      const result = orchestrator.addReviewers(campaignId, { plus: 5 });

      expect(result.addedCount).toBe(5);
      expect(result.newPersonaIds.every((id: string) => id.startsWith('gen-persona-'))).toBe(true);
    });

    it('updates persona_ids in database', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);
      orchestrator.addReviewers(campaignId, { personaIds: ['core-persona-2', 'core-persona-3'] });

      const campaign = campaignClient.getCampaign(campaignId);
      const personaIds = JSON.parse(campaign!.persona_ids);
      expect(personaIds).toContain('test-persona-1');
      expect(personaIds).toContain('core-persona-2');
      expect(personaIds).toContain('core-persona-3');
    });

    it('generates prompts only for new reviewers', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);
      const result = orchestrator.addReviewers(campaignId, { personaIds: ['core-persona-2'] });

      expect(result.promptFiles).toHaveLength(1);
      expect(result.promptFiles[0]).toContain('core-persona-2');
    });

    it('sets status to in_progress when adding to completed campaign', () => {
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
          ratings: { clarity_readability: 8, rules_accuracy: 9, persona_fit: 7, practical_usability: 8 },
          narrative_feedback: 'Test',
          issue_annotations: [],
          overall_assessment: 'Good',
        },
      });
      orchestrator.executeAnalysis(campaignId);
      orchestrator.completeCampaign(campaignId);

      expect(campaignClient.getCampaign(campaignId)?.status).toBe('completed');

      orchestrator.addReviewers(campaignId, { personaIds: ['core-persona-2'] });

      expect(campaignClient.getCampaign(campaignId)?.status).toBe('in_progress');
    });

    it('returns empty result when no new personas to add', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testBookPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona-1'],
      });

      orchestrator.executeReviews(campaignId);

      const result = orchestrator.addReviewers(campaignId, {
        personaIds: ['test-persona-1'], // Already in campaign
      });

      expect(result.addedCount).toBe(0);
      expect(result.newPersonaIds).toEqual([]);
      expect(result.skippedCount).toBe(1);
    });
  });
});
