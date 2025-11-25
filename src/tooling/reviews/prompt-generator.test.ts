import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '@razorweave/database';
import { PersonaClient } from '@razorweave/database';
import { CampaignClient } from './campaign-client.js';
import { snapshotBook } from './content-snapshot.js';
import { generateReviewerPromptFile, generateAnalyzerPromptFile } from './prompt-generator.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { TESTING } from '../constants/index.js';

describe('generateReviewerPromptFile', () => {
  let db: Database.Database;
  let personaClient: PersonaClient;
  let campaignClient: CampaignClient;
  const testBookPath = 'data/test/prompt-gen-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(testBookPath, '<html><body><h1>Test Book</h1></body></html>');

    db = new Database(':memory:');
    createTables(db);
    personaClient = new PersonaClient(db);
    campaignClient = new CampaignClient(db);

    personaClient.create({
      id: 'test-sarah',
      name: 'Sarah Chen',
      type: 'core',
      archetype: 'Explorer',
      experience_level: 'Newbie',
      fiction_first_alignment: 'Curious',
      narrative_mechanics_comfort: 'Neutral',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'Neutral',
      primary_cognitive_style: 'Visual',
    });
  });

  afterEach(() => {
    db.close();
    rmSync('data/test', { recursive: true, force: true });
  });

  it('generates complete prompt file with all sections', () => {
    // Create campaign
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0',
      source: 'claude',
    });

    const campaignId = campaignClient.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-sarah'],
    });

    // Generate prompt
    const promptText = generateReviewerPromptFile(db, campaignId, 'test-sarah');

    // Verify sections exist
    expect(promptText).toContain('You are conducting a review for campaign');
    expect(promptText).toContain('PERSONA: test-sarah');
    expect(promptText).toContain('Sarah Chen');
    expect(promptText).toContain('Explorer');
    expect(promptText).toContain('Newbie');
    expect(promptText).toContain('CONTENT:');
    expect(promptText).toContain('TASK: Review this book');
    expect(promptText).toContain('OUTPUT REQUIREMENTS');
    expect(promptText).toContain('campaignClient.createPersonaReview');
    expect(promptText).toContain('writeReviewMarkdown');
  });

  it('throws error when campaign not found', () => {
    expect(() => {
      generateReviewerPromptFile(db, 'nonexistent-campaign', 'test-sarah');
    }).toThrow('Campaign not found: nonexistent-campaign');
  });

  it('throws error when persona not found', () => {
    // Create campaign
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0',
      source: 'claude',
    });

    const campaignId = campaignClient.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-sarah'],
    });

    expect(() => {
      generateReviewerPromptFile(db, campaignId, 'nonexistent-persona');
    }).toThrow('Persona not found: nonexistent-persona');
  });

  it('throws error when content not found', () => {
    // Manually insert campaign with invalid content_id
    const invalidContentId = 99999;
    db.prepare(
      `INSERT INTO review_campaigns (id, campaign_name, content_type, content_id, persona_selection_strategy, persona_ids, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('test-campaign-invalid', 'Invalid Campaign', 'book', invalidContentId, 'manual', '[]', 'pending');

    expect(() => {
      generateReviewerPromptFile(db, 'test-campaign-invalid', 'test-sarah');
    }).toThrow('Content not found: 99999');
  });

  it('generates analyzer prompt with all reviews', () => {
    // Create campaign with reviews
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0',
      source: 'claude',
    });

    const campaignId = campaignClient.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-sarah'],
    });

    // Create mock review
    campaignClient.updateStatus(campaignId, 'in_progress');
    campaignClient.createPersonaReview({
      campaignId,
      personaId: 'test-sarah',
      reviewData: {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'Good content',
        issue_annotations: [],
        overall_assessment: 'Solid',
      },
      agentExecutionTime: TESTING.MOCK_AGENT_EXECUTION_TIME_MS,
    });

    // Generate analyzer prompt
    const promptText = generateAnalyzerPromptFile(db, campaignId);

    // Verify sections
    expect(promptText).toContain('You are analyzing reviews for campaign');
    expect(promptText).toContain('test-sarah');
    expect(promptText).toContain('Sarah Chen');
    expect(promptText).toContain('clarity_readability: 8');
    expect(promptText).toContain('campaignClient.createCampaignAnalysis');
  });
});
