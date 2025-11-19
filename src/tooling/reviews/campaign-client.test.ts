import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import type { CreateCampaignData } from './campaign-client.js';

describe('CampaignClient', () => {
  let db: Database.Database;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any;

  beforeEach(() => {
    mkdirSync('data', { recursive: true });
    db = new Database(':memory:');
    createTables(db);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
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
        contentId: 1,
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah', 'core-alex'],
        metadata: { version: '1.0' }
      };

      // createCampaign returns just the ID
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const campaignId = client.createCampaign(data);

      // Verify ID format
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(campaignId).toMatch(/^campaign-\d{8}-\d{6}-[a-z0-9]+$/);

      // Use getCampaign to retrieve the full object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const campaign = client.getCampaign(campaignId);

      // Assert Campaign object properties
      expect(campaign).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.id).toBe(campaignId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.campaign_name).toBe(data.campaignName);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.content_type).toBe(data.contentType);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.content_id).toBe(data.contentId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.persona_selection_strategy).toBe(data.personaSelectionStrategy);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.persona_ids).toBe(JSON.stringify(data.personaIds));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.status).toBe('pending');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.created_at).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.completed_at).toBeNull();

      // Verify database persistence
      const saved = db.prepare('SELECT * FROM review_campaigns WHERE id = ?').get(campaignId);
      expect(saved).toBeTruthy();
    });
  });

  describe('updateStatus', () => {
    it('should update campaign status', () => {
      // Create a campaign
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const campaignId = client.createCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentId: 1,
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah']
      });

      // Update to in_progress
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      client.updateStatus(campaignId, 'in_progress');

      // Verify status updated
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const campaign = client.getCampaign(campaignId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.status).toBe('in_progress');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign?.completed_at).toBeNull();

      // Update to completed with timestamp
      const completedAt = new Date();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      client.updateStatus(campaignId, 'completed', completedAt);

      // Verify final status
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const completedCampaign = client.getCampaign(campaignId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(completedCampaign?.status).toBe('completed');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const campaignId = client.createCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentId: 1,
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah'],
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const reviewId = client.createPersonaReview({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
        agentExecutionTime: 5000,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(reviewId).toBeGreaterThan(0);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const review = client.getPersonaReview(reviewId);
      expect(review).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(review?.campaign_id).toBe(campaignId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(review?.persona_id).toBe('core-sarah');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(review?.status).toBe('completed');
    });
  });
});
