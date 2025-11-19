import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';
import { snapshotBook } from './content-snapshot.js';
import { writePromptFiles, writeAnalyzerPromptFile } from './prompt-writer.js';

describe('Prompt Writer', () => {
  let db: Database.Database;
  let campaignClient: CampaignClient;
  let personaClient: PersonaClient;
  const testBookPath = 'data/test/prompt-writer-test-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(testBookPath, '<html><body><h1>Test Book</h1></body></html>');

    db = new Database(':memory:');
    createTables(db);

    campaignClient = new CampaignClient(db);
    personaClient = new PersonaClient(db);

    // Create test personas
    personaClient.create({
      id: 'test-sarah',
      name: 'Test Sarah',
      type: 'core',
      archetype: 'Explorer',
      experience_level: 'Newbie',
      fiction_first_alignment: 'Curious',
      narrative_mechanics_comfort: 'Neutral',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'Neutral',
      primary_cognitive_style: 'Visual',
    });

    personaClient.create({
      id: 'test-alex',
      name: 'Test Alex',
      type: 'core',
      archetype: 'Tactician',
      experience_level: 'Veteran',
      fiction_first_alignment: 'Confident',
      narrative_mechanics_comfort: 'High',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'High',
      primary_cognitive_style: 'Strategic',
    });
  });

  afterEach(() => {
    db.close();
    rmSync('data/test', { recursive: true, force: true });
    rmSync('data/reviews/prompts', { recursive: true, force: true });
  });

  it('writes reviewer prompt files for all campaign personas', () => {
    // Create campaign with 2 personas
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0-test',
      source: 'claude',
    });

    const campaignId = campaignClient.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-sarah', 'test-alex'],
    });

    // Write reviewer prompt files (not analyzer yet)
    const writtenFiles = writePromptFiles(db, campaignId);

    // Should return 2 paths: one per persona
    expect(writtenFiles).toHaveLength(2);
    expect(writtenFiles).toContain(`data/reviews/prompts/${campaignId}/test-sarah.txt`);
    expect(writtenFiles).toContain(`data/reviews/prompts/${campaignId}/test-alex.txt`);

    // Verify directory exists
    expect(existsSync(`data/reviews/prompts/${campaignId}`)).toBe(true);

    // Verify reviewer files exist
    expect(existsSync(`data/reviews/prompts/${campaignId}/test-sarah.txt`)).toBe(true);
    expect(existsSync(`data/reviews/prompts/${campaignId}/test-alex.txt`)).toBe(true);

    // Verify file contents contain expected sections
    const sarahPrompt = readFileSync(`data/reviews/prompts/${campaignId}/test-sarah.txt`, 'utf-8');
    expect(sarahPrompt).toContain('You are conducting a review for campaign');
    expect(sarahPrompt).toContain('PERSONA: test-sarah');
  });

  it('writes analyzer prompt file after reviews exist', () => {
    // Create campaign with personas
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0-test',
      source: 'claude',
    });

    const campaignId = campaignClient.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-sarah', 'test-alex'],
    });

    // Create mock reviews (simulating agents completing their work)
    campaignClient.createPersonaReview({
      campaignId,
      personaId: 'test-sarah',
      reviewData: {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 7,
          persona_fit: 9,
          practical_usability: 8,
        },
        narrative_feedback: 'Test feedback from Sarah',
        issue_annotations: [],
        overall_assessment: 'Good overall',
      },
      agentExecutionTime: 1000,
    });

    campaignClient.createPersonaReview({
      campaignId,
      personaId: 'test-alex',
      reviewData: {
        ratings: {
          clarity_readability: 9,
          rules_accuracy: 8,
          persona_fit: 7,
          practical_usability: 9,
        },
        narrative_feedback: 'Test feedback from Alex',
        issue_annotations: [],
        overall_assessment: 'Excellent overall',
      },
      agentExecutionTime: 1200,
    });

    // Write analyzer prompt (requires reviews to exist)
    const analyzerPath = writeAnalyzerPromptFile(db, campaignId);

    expect(analyzerPath).toBe(`data/reviews/prompts/${campaignId}/analyzer.txt`);
    expect(existsSync(analyzerPath)).toBe(true);

    // Verify analyzer file contents
    const analyzerPrompt = readFileSync(analyzerPath, 'utf-8');
    expect(analyzerPrompt).toContain('You are analyzing reviews for campaign');
  });

  it('throws error if campaign not found', () => {
    expect(() => {
      writePromptFiles(db, 'campaign-nonexistent');
    }).toThrow('Campaign not found');
  });

  it('throws error when writing analyzer prompt if campaign not found', () => {
    expect(() => {
      writeAnalyzerPromptFile(db, 'campaign-nonexistent');
    }).toThrow('Campaign not found');
  });
});
