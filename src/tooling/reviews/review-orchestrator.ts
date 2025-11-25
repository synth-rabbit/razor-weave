import type Database from 'better-sqlite3';
import { CampaignClient, type Campaign } from './campaign-client.js';
import { snapshotBook, snapshotChapter } from './content-snapshot.js';
import { PersonaClient } from '@razorweave/database';
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

export interface AddReviewersParams {
  core?: boolean;          // Add all core personas not already in campaign
  plus?: number;           // Add N sampled generated personas
  personaIds?: string[];   // Add specific persona IDs
  focus?: FocusCategory;   // Focus for sampling (if using plus)
}

export interface AddReviewersResult {
  addedCount: number;
  skippedCount: number;
  newPersonaIds: string[];
  promptFiles: string[];
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

      // Provide helpful error if no core personas found
      if (coreIds.length === 0) {
        throw new Error(
          'No core personas found in database. Run "pnpm personas:hydrate" to load core personas first.'
        );
      }
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

  /**
   * Adds reviewers to an existing campaign.
   * Only works for campaigns in 'in_progress' or 'completed' status.
   * Deduplicates personas already in the campaign.
   *
   * @param campaignId - Campaign to add reviewers to
   * @param params - Options for selecting personas
   * @returns Result with counts and list of new persona IDs
   */
  addReviewers(campaignId: string, params: AddReviewersParams): AddReviewersResult {
    const campaign = this.campaignClient.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'in_progress' && campaign.status !== 'completed') {
      throw new Error('Campaign must be in in_progress or completed status to add reviewers');
    }

    // Get existing persona IDs
    const existingPersonaIds = new Set(JSON.parse(campaign.persona_ids || '[]') as string[]);

    // Resolve new persona IDs based on params
    const candidatePersonaIds = this.resolveAddReviewersPersonaIds(params, campaign.content_id);

    // Deduplicate - only add personas not already in campaign
    const newPersonaIds = candidatePersonaIds.filter(id => !existingPersonaIds.has(id));
    const skippedCount = candidatePersonaIds.length - newPersonaIds.length;

    // If no new personas, return early
    if (newPersonaIds.length === 0) {
      return {
        addedCount: 0,
        skippedCount,
        newPersonaIds: [],
        promptFiles: [],
      };
    }

    // Update campaign persona_ids
    const allPersonaIds = [...existingPersonaIds, ...newPersonaIds];
    this.campaignClient.updatePersonaIds(campaignId, allPersonaIds);

    // Set status to in_progress (in case it was completed)
    if (campaign.status === 'completed') {
      this.campaignClient.updateStatus(campaignId, 'in_progress');
    }

    // Generate prompts only for new reviewers
    const promptFiles = writePromptFiles(this.db, campaignId, newPersonaIds);

    // Log results
    log.info(`\n✅ Added ${newPersonaIds.length} reviewers to campaign ${campaignId}`);
    if (skippedCount > 0) {
      log.info(`⏭️  Skipped ${skippedCount} reviewers (already in campaign)`);
    }
    log.info(`\n📁 New prompts: data/reviews/prompts/${campaignId}/`);
    log.info(`\nNew reviewers:`);
    for (const id of newPersonaIds) {
      log.info(`  - ${id}`);
    }
    log.info('\nNext: Execute the new reviewer agents\n');

    return {
      addedCount: newPersonaIds.length,
      skippedCount,
      newPersonaIds,
      promptFiles,
    };
  }

  /**
   * Resolves persona IDs for addReviewers based on params.
   */
  private resolveAddReviewersPersonaIds(params: AddReviewersParams, contentId: string | number): string[] {
    const personaClient = new PersonaClient(this.db);
    const result: string[] = [];

    // Add specific persona IDs if provided
    if (params.personaIds && params.personaIds.length > 0) {
      result.push(...params.personaIds);
    }

    // Add all core personas if requested
    if (params.core) {
      const allPersonas = personaClient.getAll();
      const coreIds = allPersonas.filter(p => p.type === 'core').map(p => p.id);
      result.push(...coreIds);
    }

    // Add sampled generated personas if requested
    if (params.plus && params.plus > 0) {
      // Use focus if provided, otherwise infer from content ID (best effort)
      const focus = params.focus ?? inferFocus(String(contentId));
      const sampledIds = samplePersonas(this.db, params.plus, focus);
      result.push(...sampledIds);
    }

    // Deduplicate within the result (in case core + personaIds overlap)
    return [...new Set(result)];
  }
}
