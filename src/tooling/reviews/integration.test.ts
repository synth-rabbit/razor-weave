import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';
import { snapshotBook } from './content-snapshot.js';
import { writeReviewMarkdown } from './markdown-writer.js';
import { TESTING } from '../constants/index.js';

describe('Review System Integration', () => {
  let db: Database.Database;
  let campaignClient: CampaignClient;
  let personaClient: PersonaClient;
  const testBookPath = 'data/test/integration-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(
      testBookPath,
      '<html><body><h1>Integration Test Book</h1><p>Test content</p></body></html>'
    );

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
      primary_cognitive_style: 'Analytical',
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
  });

  it('completes full campaign workflow', () => {
    // Step 1: Snapshot content
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0-test',
      source: 'claude',
    });

    expect(typeof contentId).toBe('string');
    expect(contentId).toMatch(/^book-[a-f0-9]+$/);

    // Step 2: Create campaign
    const campaignId = campaignClient.createCampaign({
      campaignName: 'Integration Test Campaign',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-sarah', 'test-alex'],
    });

    expect(campaignId).toMatch(/^campaign-/);

    // Step 3: Simulate reviews
    campaignClient.updateStatus(campaignId, 'in_progress');

    const reviewId1 = campaignClient.createPersonaReview({
      campaignId,
      personaId: 'test-sarah',
      reviewData: {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback:
          'As a new player, I found the content mostly clear and helpful.',
        issue_annotations: [
          {
            section: 'Introduction',
            issue: 'Some jargon not explained',
            impact: 'Had to look up terms',
            location: 'First paragraph',
          },
        ],
        overall_assessment:
          'Great starting point with minor clarity issues',
      },
      agentExecutionTime: TESTING.MOCK_AGENT_EXECUTION_TIME_MS,
    });

    const reviewId2 = campaignClient.createPersonaReview({
      campaignId,
      personaId: 'test-alex',
      reviewData: {
        ratings: {
          clarity_readability: 9,
          rules_accuracy: 10,
          persona_fit: 8,
          practical_usability: 9,
        },
        narrative_feedback:
          'Comprehensive and well-structured. Perfect for veterans.',
        issue_annotations: [
          {
            section: 'Introduction',
            issue: 'Could use more advanced examples',
            impact: 'Minor - not critical',
            location: 'Examples section',
          },
        ],
        overall_assessment: 'Excellent resource',
      },
      agentExecutionTime: 4500,
    });

    expect(reviewId1).toBeGreaterThan(0);
    expect(reviewId2).toBeGreaterThan(0);

    // Step 4: Write review markdown
    const review1 = campaignClient.getPersonaReview(reviewId1);
    expect(review1).toBeDefined();

    const markdownPath1 = `data/test/reviews/${campaignId}/test-sarah.md`;
    writeReviewMarkdown(
      {
        campaignId,
        personaName: 'Test Sarah',
        personaArchetype: 'Explorer',
        personaExperience: 'Newbie',
        personaTraits: ['Curious', 'Visual Thinker'],
        contentTitle: 'Integration Test Book',
        reviewData: JSON.parse(review1!.review_data),
      },
      markdownPath1
    );

    expect(existsSync(markdownPath1)).toBe(true);

    // Step 5: Simulate analysis
    campaignClient.updateStatus(campaignId, 'analyzing');

    const analysisId = campaignClient.createCampaignAnalysis({
      campaignId,
      analysisData: {
        executive_summary:
          'Overall strong content with excellent scores across all dimensions. Minor clarity issues for beginners.',
        priority_rankings: [
          {
            category: 'Jargon Clarification',
            severity: 5,
            frequency: 1,
            affected_personas: ['test-sarah'],
            description:
              'Some terminology not explained for new players',
          },
        ],
        dimension_summaries: {
          clarity_readability: {
            average: 8.5,
            themes: ['Clear structure', 'Minor jargon issues'],
          },
          rules_accuracy: {
            average: 9.5,
            themes: ['Comprehensive', 'Well explained'],
          },
          persona_fit: {
            average: 7.5,
            themes: [
              'Great for veterans',
              'Good for beginners with guidance',
            ],
          },
          practical_usability: {
            average: 8.5,
            themes: ['Table-ready', 'Examples helpful'],
          },
        },
        persona_breakdowns: {
          Beginners: {
            strengths: ['Clear structure', 'Helpful examples'],
            struggles: ['Jargon not explained'],
          },
          Veterans: {
            strengths: ['Comprehensive', 'Advanced depth'],
            struggles: ['Could use more advanced examples'],
          },
        },
      },
      markdownPath: `data/test/reviews/analysis/${campaignId}.md`,
    });

    expect(analysisId).toBeGreaterThan(0);

    // Step 6: Complete campaign
    campaignClient.updateStatus(campaignId, 'completed');

    const finalCampaign = campaignClient.getCampaign(campaignId);
    expect(finalCampaign?.status).toBe('completed');
    expect(finalCampaign?.completed_at).toBeDefined();

    // Verify all data retrievable
    const allReviews = campaignClient.getCampaignReviews(campaignId);
    expect(allReviews).toHaveLength(2);

    const analysis = campaignClient.getCampaignAnalysis(campaignId);
    expect(analysis).toBeDefined();
  });
});
