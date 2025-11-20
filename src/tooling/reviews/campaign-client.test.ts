import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import type { CreateCampaignData } from './campaign-client.js';
import { TESTING } from '../constants/index.js';

describe('CampaignClient', () => {
  let db: Database.Database;
  let client: CampaignClient;

  beforeEach(() => {
    mkdirSync('data', { recursive: true });
    db = new Database(':memory:');
    createTables(db);
    client = new CampaignClient(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createCampaign', () => {
    it('should create a new campaign and return its ID', () => {
      const data: CreateCampaignData = {
        campaignName: 'Core Rulebook v1.0 Review',
        contentType: 'book',
        contentId: 'book-test001',
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah', 'core-alex'],
        metadata: { version: '1.0' }
      };

      // createCampaign returns just the ID
      const campaignId = client.createCampaign(data);

      // Verify ID format
      expect(campaignId).toMatch(/^campaign-\d{8}-\d{6}-[a-z0-9]+$/);

      // Use getCampaign to retrieve the full object
      const campaign = client.getCampaign(campaignId);

      // Assert Campaign object properties
      expect(campaign).toBeDefined();
      expect(campaign?.id).toBe(campaignId);
      expect(campaign?.campaign_name).toBe(data.campaignName);
      expect(campaign?.content_type).toBe(data.contentType);
      expect(campaign?.content_id).toBe(data.contentId);
      expect(campaign?.persona_selection_strategy).toBe(data.personaSelectionStrategy);
      expect(campaign?.persona_ids).toBe(JSON.stringify(data.personaIds));
      expect(campaign?.status).toBe('pending');
      expect(campaign?.created_at).toBeTruthy();
      expect(campaign?.completed_at).toBeNull();

      // Verify database persistence
      const saved = db.prepare('SELECT * FROM review_campaigns WHERE id = ?').get(campaignId);
      expect(saved).toBeTruthy();
    });
  });

  describe('updateStatus', () => {
    it('should update campaign status', () => {
      // Create a campaign
      const campaignId = client.createCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentId: 'book-test001',
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah']
      });

      // Update to in_progress
      client.updateStatus(campaignId, 'in_progress');

      // Verify status updated
      const campaign = client.getCampaign(campaignId);
      expect(campaign?.status).toBe('in_progress');
      expect(campaign?.completed_at).toBeNull();

      // Update to completed with timestamp
      const completedAt = new Date();
      client.updateStatus(campaignId, 'completed', completedAt);

      // Verify final status
      const completedCampaign = client.getCampaign(campaignId);
      expect(completedCampaign?.status).toBe('completed');
      expect(completedCampaign?.completed_at).toBeTruthy();
    });
  });

  describe('createPersonaReview', () => {
    it('creates a persona review record', () => {
      // Create test persona first (required for foreign key constraint)
      db.prepare(`
        INSERT INTO personas (id, name, type, archetype, experience_level,
          fiction_first_alignment, narrative_mechanics_comfort, gm_philosophy,
          genre_flexibility, primary_cognitive_style)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'core-sarah',
        'Sarah',
        'core',
        'storyteller',
        'experienced',
        'high',
        'high',
        'collaborative',
        'high',
        'narrative'
      );

      const campaignId = client.createCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentId: 'book-test001',
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah'],
      });

      const reviewId = client.createPersonaReview({
        campaignId,
        personaId: 'core-sarah',
        reviewData: {
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Great content!',
          issue_annotations: [],
          overall_assessment: 'Solid work',
        },
        agentExecutionTime: TESTING.MOCK_AGENT_EXECUTION_TIME_MS,
      });

      expect(reviewId).toBeGreaterThan(0);

      const review = client.getPersonaReview(reviewId);
      expect(review).toBeDefined();
      expect(review?.campaign_id).toBe(campaignId);
      expect(review?.persona_id).toBe('core-sarah');
      expect(review?.status).toBe('completed');
    });
  });

  describe('getCampaignReviews', () => {
    it('returns all reviews for a campaign', () => {
      // Create test personas first (required for foreign key constraint)
      db.prepare(`
        INSERT INTO personas (id, name, type, archetype, experience_level,
          fiction_first_alignment, narrative_mechanics_comfort, gm_philosophy,
          genre_flexibility, primary_cognitive_style)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'core-sarah',
        'Sarah',
        'core',
        'storyteller',
        'experienced',
        'high',
        'high',
        'collaborative',
        'high',
        'narrative'
      );

      db.prepare(`
        INSERT INTO personas (id, name, type, archetype, experience_level,
          fiction_first_alignment, narrative_mechanics_comfort, gm_philosophy,
          genre_flexibility, primary_cognitive_style)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'core-alex',
        'Alex',
        'core',
        'tactician',
        'experienced',
        'medium',
        'high',
        'structured',
        'medium',
        'analytical'
      );

      const campaignId = client.createCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentId: 'book-test001',
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah', 'core-alex'],
      });

      client.createPersonaReview({
        campaignId,
        personaId: 'core-sarah',
        reviewData: {
          ratings: { clarity_readability: 8, rules_accuracy: 9, persona_fit: 7, practical_usability: 8 },
          narrative_feedback: 'Great!',
          issue_annotations: [],
          overall_assessment: 'Good',
        },
      });

      client.createPersonaReview({
        campaignId,
        personaId: 'core-alex',
        reviewData: {
          ratings: { clarity_readability: 7, rules_accuracy: 8, persona_fit: 6, practical_usability: 7 },
          narrative_feedback: 'Nice!',
          issue_annotations: [],
          overall_assessment: 'Decent',
        },
      });

      const reviews = client.getCampaignReviews(campaignId);
      expect(reviews).toHaveLength(2);
      expect(reviews.map((r: unknown) => (r as { persona_id: string }).persona_id)).toEqual(['core-sarah', 'core-alex']);
    });
  });

  describe('createCampaignAnalysis', () => {
    it('creates campaign analysis record', () => {
      const campaignId = client.createCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentId: 'book-test001',
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah'],
      });

      const analysisId = client.createCampaignAnalysis({
        campaignId,
        analysisData: {
          executive_summary: 'Overall good',
          priority_rankings: [],
          dimension_summaries: {
            clarity_readability: { average: 8, themes: [] },
            rules_accuracy: { average: 9, themes: [] },
            persona_fit: { average: 7, themes: [] },
            practical_usability: { average: 8, themes: [] },
          },
          persona_breakdowns: {},
        },
        markdownPath: 'data/reviews/analysis/test.md',
      });

      expect(analysisId).toBeGreaterThan(0);

      const analysis = client.getCampaignAnalysis(campaignId);
      expect(analysis).toBeDefined();
      expect(analysis?.campaign_id).toBe(campaignId);
      expect(analysis?.markdown_path).toBe('data/reviews/analysis/test.md');
    });
  });

  describe('listCampaigns', () => {
    beforeEach(() => {
      client.createCampaign({
        campaignName: 'Campaign 1',
        contentType: 'book',
        contentId: 'book-test001',
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah'],
      });

      const id2 = client.createCampaign({
        campaignName: 'Campaign 2',
        contentType: 'chapter',
        contentId: 'book-test002',
        personaSelectionStrategy: 'manual',
        personaIds: ['core-alex'],
      });

      client.updateStatus(id2, 'completed');
    });

    it('lists all campaigns', () => {
      const campaigns = client.listCampaigns({});
      expect(campaigns).toHaveLength(2);
    });

    it('filters by status', () => {
      const campaigns = client.listCampaigns({ status: 'completed' });
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].campaign_name).toBe('Campaign 2');
    });

    it('filters by content type', () => {
      const campaigns = client.listCampaigns({ contentType: 'book' });
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].campaign_name).toBe('Campaign 1');
    });
  });
});
