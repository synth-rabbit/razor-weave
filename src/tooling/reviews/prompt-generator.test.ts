import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { PersonaClient } from '../database/persona-client.js';
import { CampaignClient } from './campaign-client.js';
import { snapshotBook } from './content-snapshot.js';
import { generateReviewerPromptFile } from './prompt-generator.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

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
});
