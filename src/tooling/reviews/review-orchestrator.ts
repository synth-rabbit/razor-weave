import type Database from 'better-sqlite3';
import { CampaignClient, type Campaign } from './campaign-client.js';
import { snapshotBook, snapshotChapter } from './content-snapshot.js';
import { PersonaClient } from '../database/persona-client.js';
import { writePromptFiles, writeAnalyzerPromptFile } from './prompt-writer.js';
import { log } from '../logging/logger.js';
import { inferFocus, samplePersonas, type FocusCategory } from './persona-sampler.js';

export interface InitializeCampaignParams {
  campaignName: string;
  contentType: 'book' | 'chapter';
  contentPath: string;
  personaSelectionStrategy: 'all_core' | 'manual';
  personaIds?: string[];
  // Additional fields for chapter snapshots
  bookPath?: string;
  chapterName?: string;
  // Sampling options
  plusCount?: number;      // Core + N generated
  generatedCount?: number; // N generated only
  focus?: FocusCategory;   // Override inferred focus
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

    // Resolve persona IDs with sampling options
    const resolvedPersonaIds = this.resolvePersonaIds(params);

    // Create campaign
    const campaignId = this.campaignClient.createCampaign({
      campaignName,
      contentType,
      contentId,
      personaSelectionStrategy,
      personaIds: resolvedPersonaIds,
    });

    return campaignId;
  }

  private resolvePersonaIds(params: InitializeCampaignParams): string[] {
    const personaClient = new PersonaClient(this.db);

    // Mode 1: Generated only (generatedCount)
    if (params.generatedCount !== undefined && params.generatedCount > 0) {
      const focus = params.focus ?? inferFocus(params.contentPath);
      return samplePersonas(this.db, params.generatedCount, focus);
    }

    // Get core personas
    let coreIds: string[] = [];
    if (params.personaSelectionStrategy === 'all_core') {
      const allPersonas = personaClient.getAll();
      coreIds = allPersonas.filter((p) => p.type === 'core').map((p) => p.id);
    } else if (params.personaSelectionStrategy === 'manual' && params.personaIds) {
      coreIds = params.personaIds;
    }

    // Mode 2: Core + generated (plusCount)
    if (params.plusCount !== undefined && params.plusCount > 0) {
      const focus = params.focus ?? inferFocus(params.contentPath);
      const sampledIds = samplePersonas(this.db, params.plusCount, focus);
      return [...coreIds, ...sampledIds];
    }

    // Mode 3: Core only (default)
    return coreIds;
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

    // Get persona IDs (already resolved during initializeCampaign)
    const personaIds = JSON.parse(campaign.persona_ids || '[]') as string[];
    if (personaIds.length === 0) {
      throw new Error('No personas selected for review');
    }

    // Generate prompt files
    const writtenFiles = writePromptFiles(this.db, campaignId);

    // Count persona types for breakdown display
    const coreCount = personaIds.filter(id => id.startsWith('core-')).length;
    const generatedCount = personaIds.length - coreCount;

    // Output instructions for user
    log.info(`\n✅ Campaign created: ${campaignId}`);
    let promptCountMsg = `✅ Generated ${writtenFiles.length} review prompts`;
    if (coreCount > 0 && generatedCount > 0) {
      promptCountMsg += ` (${coreCount} core + ${generatedCount} sampled)`;
    } else if (generatedCount > 0) {
      promptCountMsg += ` (${generatedCount} sampled generated)`;
    }
    log.info(`${promptCountMsg}\n`);
    log.info(`📁 Prompts directory: data/reviews/prompts/${campaignId}/\n`);
    log.info('Next: Tell Claude Code to execute reviews\n');
    log.info('────────────────────────────────────────────────────────');
    log.info(`Read prompts from data/reviews/prompts/${campaignId}/`);
    log.info(`and execute reviewer agents in batches of 5`);
    log.info('────────────────────────────────────────────────────────\n');
    log.info(`After agents complete, check status with:`);
    log.info(`  pnpm review:status ${campaignId}\n`);
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
    log.info(`\n✅ All reviews complete! Ready for analysis.`);
    log.info(`✅ Found ${reviews.length} reviews to analyze\n`);
    log.info(`📁 Analyzer prompt: ${analyzerPromptPath}\n`);
    log.info('Next: Tell Claude Code to run analysis\n');
    log.info('────────────────────────────────────────────────────────');
    log.info(`Read analyzer prompt from ${analyzerPromptPath}`);
    log.info(`and execute analyzer agent`);
    log.info('────────────────────────────────────────────────────────\n');
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

    log.info(`\n✅ Campaign ${campaignId} completed successfully`);

    const reviews = this.campaignClient.getCampaignReviews(campaignId);
    const analysis = this.campaignClient.getCampaignAnalysis(campaignId);

    log.info(`\nSummary:`);
    log.info(`  Reviews: ${reviews.length}`);
    log.info(`  Analysis: ${analysis ? 'Generated' : 'Not found'}`);
    log.info(`  Status: completed`);
  }
}
