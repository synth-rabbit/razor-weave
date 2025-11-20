import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { generatePersonaBatch } from '../personas/generator.js';
import { CampaignClient } from '../reviews/campaign-client.js';
import { SnapshotClient } from '../database/snapshot-client.js';
import { PersonaClient } from '../database/persona-client.js';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

describe('E2E Review Workflow', () => {
  let db: Database.Database;
  let campaignClient: CampaignClient;
  let snapshotClient: SnapshotClient;
  let personaClient: PersonaClient;
  const testDir = 'data/test-e2e';
  const testBookPath = `${testDir}/test-book.html`;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
    campaignClient = new CampaignClient(db);
    snapshotClient = new SnapshotClient(db);
    personaClient = new PersonaClient(db);

    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      testBookPath,
      '<html><body><h1>Test Book</h1><p>Test content for review</p></body></html>'
    );
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should complete workflow: generate personas → snapshot → campaign → reviews', () => {
    // Step 1: Generate test personas
    const personas = generatePersonaBatch(3, { seed: 12345 });
    expect(personas).toHaveLength(3);

    // Step 2: Save personas to database
    const personaIds: string[] = [];
    for (const persona of personas) {
      const id = personaClient.create({
        name: `E2E Persona ${personas.indexOf(persona) + 1}`,
        type: 'generated',
        archetype: persona.dimensions.archetypes,
        experience_level: persona.dimensions.experience_levels,
        fiction_first_alignment: persona.dimensions.fiction_first_alignment,
        narrative_mechanics_comfort: persona.dimensions.narrative_mechanics_comfort,
        gm_philosophy: persona.dimensions.gm_philosophy,
        genre_flexibility: persona.dimensions.genre_flexibility,
        primary_cognitive_style: persona.dimensions.cognitive_styles.primary,
        secondary_cognitive_style: persona.dimensions.cognitive_styles.secondary,
        playstyle_modifiers: persona.dimensions.playstyle_modifiers,
        social_emotional_traits: persona.dimensions.social_emotional_traits,
        system_exposures: persona.dimensions.system_exposures,
        life_contexts: persona.dimensions.life_contexts,
        generated_seed: persona.seed,
      });
      personaIds.push(id);
    }

    // Step 3: Create content snapshot
    const contentId = snapshotClient.createBookSnapshot({
      bookPath: testBookPath,
      version: '1.0.0',
      chapterCount: 1,
    });

    expect(typeof contentId).toBe('string');
    expect(contentId).toMatch(/^book-/);

    // Step 4: Create review campaign
    const campaignId = campaignClient.createCampaign({
      campaignName: 'E2E Test Campaign',
      contentId,
      contentType: 'book',
      personaIds,
      personaSelectionStrategy: 'manual',
    });

    expect(campaignId).toMatch(/^campaign-/);

    // Step 5: Verify campaign creation
    const campaign = campaignClient.getCampaign(campaignId);
    expect(campaign?.status).toBe('pending');
    expect(JSON.parse(campaign?.persona_ids || '[]')).toHaveLength(3);

    // Step 6: Transition to in_progress
    campaignClient.updateStatus(campaignId, 'in_progress');

    // Step 7: Create reviews for each persona
    for (const personaId of personaIds) {
      const reviewId = campaignClient.createPersonaReview({
        campaignId,
        personaId,
        reviewData: {
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: `Review from ${personaId}`,
          issue_annotations: [],
          overall_assessment: 'Good content overall',
        },
      });
      expect(reviewId).toBeGreaterThan(0);
    }

    // Step 8: Verify all reviews created
    const reviews = campaignClient.getCampaignReviews(campaignId);
    expect(reviews).toHaveLength(3);

    // Step 9: Complete campaign
    campaignClient.updateStatus(campaignId, 'analyzing');
    campaignClient.updateStatus(campaignId, 'completed');

    const final = campaignClient.getCampaign(campaignId);
    expect(final?.status).toBe('completed');
  });

  it('should maintain snapshot integrity with traceable content IDs', () => {
    // Create book snapshot
    const contentId = snapshotClient.createBookSnapshot({
      bookPath: testBookPath,
      version: '1.0.0',
      chapterCount: 1,
    });

    // Verify content ID format
    expect(contentId).toMatch(/^book-[a-f0-9]{12}$/);

    // Retrieve snapshot from database
    const snapshot = db
      .prepare('SELECT * FROM book_versions WHERE content_id = ?')
      .get(contentId) as {
      content_id: string;
      book_path: string;
      version: string;
      content: string;
      file_hash: string;
    };

    // Verify snapshot integrity
    expect(snapshot).toBeDefined();
    expect(snapshot.content_id).toBe(contentId);
    expect(snapshot.book_path).toBe(testBookPath);
    expect(snapshot.version).toBe('1.0.0');
    expect(snapshot.content).toContain('Test Book');

    // Verify file hash matches content
    const expectedHash = createHash('sha256')
      .update(snapshot.content)
      .digest('hex');
    expect(snapshot.file_hash).toBe(expectedHash);

    // Verify content can be used to create campaign
    const campaignId = campaignClient.createCampaign({
      campaignName: 'Snapshot Integrity Test',
      contentId,
      contentType: 'book',
      personaIds: [],
      personaSelectionStrategy: 'manual',
    });

    const campaign = campaignClient.getCampaign(campaignId);
    expect(campaign?.content_id).toBe(contentId);
  });
});
