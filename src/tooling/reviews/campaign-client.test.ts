import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import type { CreateCampaignData } from './campaign-client.js';

describe('CampaignClient', () => {
  let db: Database.Database;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    client = new CampaignClient(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createCampaign', () => {
    it('should create a new campaign and return it', () => {
      const data: CreateCampaignData = {
        campaignName: 'Core Rulebook v1.0 Review',
        contentType: 'book',
        contentId: 1,
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah', 'core-alex'],
        metadata: { version: '1.0' }
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const campaign = client.createCampaign(data);

      // Assert returned object has correct shape
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.id).toMatch(/^[a-z0-9-]+$/); // UUID or similar
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.campaign_name).toBe(data.campaignName);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.content_type).toBe(data.contentType);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.content_id).toBe(data.contentId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.persona_selection_strategy).toBe(data.personaSelectionStrategy);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.persona_ids).toBe(JSON.stringify(data.personaIds));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.status).toBe('pending');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.created_at).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(campaign.completed_at).toBeNull();

      // Assert campaign was saved to database
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const saved = db.prepare('SELECT * FROM review_campaigns WHERE id = ?').get(campaign.id);
      expect(saved).toBeTruthy();
      expect(saved).toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        id: campaign.id,
        campaign_name: data.campaignName,
        content_type: data.contentType,
        content_id: data.contentId
      });
    });
  });
});
