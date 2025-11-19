import type Database from 'better-sqlite3';
import { CampaignClient, type Campaign } from './campaign-client.js';
import { snapshotBook, snapshotChapter } from './content-snapshot.js';
import { PersonaClient } from '../database/persona-client.js';

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

    this.campaignClient.updateStatus(campaignId, 'in_progress');

    const personaIds = this.resolvePersonaIds(campaign);
    if (personaIds.length === 0) {
      throw new Error('No personas selected for review');
    }

    console.log(`\nExecuting reviews for ${personaIds.length} personas:`);

    for (const personaId of personaIds) {
      console.log(`  - ${personaId}`);
    }

    console.log('\nNote: Agent execution requires Task tool - implement with human approval');
    console.log('Expected flow:');
    console.log('  1. Launch parallel Task agents (one per persona)');
    console.log('  2. Each agent generates review using reviewer-prompt.ts');
    console.log('  3. Each agent writes markdown using markdown-writer.ts');
    console.log('  4. Each agent calls campaignClient.createPersonaReview()');
    console.log('  5. Orchestrator waits for all agents to complete');
  }

  executeAnalysis(campaignId: string): void {
    const campaign = this.campaignClient.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'in_progress') {
      throw new Error('Campaign must be in in_progress status to execute analysis');
    }

    // Update status
    this.campaignClient.updateStatus(campaignId, 'analyzing');

    // Get all reviews
    const reviews = this.campaignClient.getCampaignReviews(campaignId);

    console.log(`\nExecuting analysis for campaign ${campaignId}`);
    console.log(`Found ${reviews.length} reviews to analyze`);
    console.log('\nNote: Analyzer agent execution requires Task tool');
    console.log('Expected flow:');
    console.log('  1. Launch single Task agent (analyzer role)');
    console.log('  2. Agent generates analysis using analyzer-prompt.ts');
    console.log('  3. Agent writes markdown to data/reviews/analysis/{campaignId}.md');
    console.log('  4. Agent calls campaignClient.createCampaignAnalysis()');
    console.log('  5. Orchestrator marks campaign as completed');
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
