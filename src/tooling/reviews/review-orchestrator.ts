import type Database from 'better-sqlite3';
import { CampaignClient, type Campaign } from './campaign-client.js';
import { snapshotBook, snapshotChapter } from './content-snapshot.js';
import { PersonaClient } from '../database/persona-client.js';
import { writePromptFiles, writeAnalyzerPromptFile } from './prompt-writer.js';

export interface InitializeCampaignParams {
  campaignName: string;
  contentType: 'book' | 'chapter';
  contentPath: string;
  personaSelectionStrategy: 'all_core' | 'manual';
  personaIds?: string[];
  // Additional fields for chapter snapshots
  bookPath?: string;
  chapterName?: string;
}

export class ReviewOrchestrator {
  constructor(
    private db: Database.Database,
    private campaignClient: CampaignClient
  ) {}

  initializeCampaign(params: InitializeCampaignParams): string {
    const {
      campaignName,
      contentType,
      contentPath,
      personaSelectionStrategy,
      personaIds,
      bookPath,
      chapterName,
    } = params;

    // Validate manual persona selection has personas
    if (personaSelectionStrategy === 'manual' && (!personaIds || personaIds.length === 0)) {
      throw new Error('personaIds required when using manual persona selection strategy');
    }

    // Snapshot content
    let contentId: number;
    if (contentType === 'book') {
      contentId = snapshotBook(this.db, {
        bookPath: contentPath,
        version: `v-${new Date().toISOString()}`,
        source: 'claude',
      });
    } else {
      // For chapter, require bookPath and chapterName
      if (!bookPath || !chapterName) {
        throw new Error(
          'bookPath and chapterName are required for chapter content type'
        );
      }
      contentId = snapshotChapter(this.db, {
        bookPath,
        chapterPath: contentPath,
        chapterName,
        version: `v-${new Date().toISOString()}`,
        source: 'claude',
      });
    }

    // Create campaign
    const campaignId = this.campaignClient.createCampaign({
      campaignName,
      contentType,
      contentId,
      personaSelectionStrategy,
      personaIds: personaIds || [],
    });

    return campaignId;
  }

  private resolvePersonaIds(campaign: Campaign): string[] {
    const personaClient = new PersonaClient(this.db);

    if (campaign.persona_selection_strategy === 'all_core') {
      const allPersonas = personaClient.getAll();
      const corePersonas = allPersonas.filter((p) => p.type === 'core');
      return corePersonas.map((p) => p.id);
    } else {
      // Manual selection
      return JSON.parse(campaign.persona_ids || '[]') as string[];
    }
  }

  executeReviews(campaignId: string): void {
    const campaign = this.campaignClient.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'pending') {
      throw new Error('Campaign must be in pending status to execute reviews');
    }

    // Update status to in_progress
    this.campaignClient.updateStatus(campaignId, 'in_progress');

    // Resolve persona IDs
    const personaIds = this.resolvePersonaIds(campaign);
    if (personaIds.length === 0) {
      throw new Error('No personas selected for review');
    }

    // Generate prompt files
    const writtenFiles = writePromptFiles(this.db, campaignId);

    // Output instructions for user
    console.log(`\n✅ Campaign created: ${campaignId}`);
    console.log(`✅ Generated ${writtenFiles.length} review prompts\n`);
    console.log(`📁 Prompts directory: data/reviews/prompts/${campaignId}/\n`);
    console.log('Next: Tell Claude Code to execute reviews\n');
    console.log('────────────────────────────────────────────────────────');
    console.log(`Read prompts from data/reviews/prompts/${campaignId}/`);
    console.log(`and execute reviewer agents in batches of 5`);
    console.log('────────────────────────────────────────────────────────\n');
    console.log(`After agents complete, check status with:`);
    console.log(`  pnpm review status ${campaignId}\n`);
  }

  executeAnalysis(campaignId: string): void {
    const campaign = this.campaignClient.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'in_progress') {
      throw new Error('Campaign must be in in_progress status to execute analysis');
    }

    // Get all reviews to verify they exist
    const reviews = this.campaignClient.getCampaignReviews(campaignId);
    if (reviews.length === 0) {
      throw new Error(`No reviews found for campaign: ${campaignId}`);
    }

    // Update status to analyzing
    this.campaignClient.updateStatus(campaignId, 'analyzing');

    // Generate analyzer prompt file
    const analyzerPromptPath = writeAnalyzerPromptFile(this.db, campaignId);

    // Output instructions for user
    console.log(`\n✅ All reviews complete! Ready for analysis.`);
    console.log(`✅ Found ${reviews.length} reviews to analyze\n`);
    console.log(`📁 Analyzer prompt: ${analyzerPromptPath}\n`);
    console.log('Next: Tell Claude Code to run analysis\n');
    console.log('────────────────────────────────────────────────────────');
    console.log(`Read analyzer prompt from ${analyzerPromptPath}`);
    console.log(`and execute analyzer agent`);
    console.log('────────────────────────────────────────────────────────\n');
  }

  completeCampaign(campaignId: string): void {
    const campaign = this.campaignClient.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'analyzing') {
      throw new Error('Campaign must be in analyzing status to complete');
    }

    // Update status
    this.campaignClient.updateStatus(campaignId, 'completed');

    console.log(`\n✅ Campaign ${campaignId} completed successfully`);

    const reviews = this.campaignClient.getCampaignReviews(campaignId);
    const analysis = this.campaignClient.getCampaignAnalysis(campaignId);

    console.log(`\nSummary:`);
    console.log(`  Reviews: ${reviews.length}`);
    console.log(`  Analysis: ${analysis ? 'Generated' : 'Not found'}`);
    console.log(`  Status: completed`);
  }
}
