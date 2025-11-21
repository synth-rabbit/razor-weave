/* eslint-disable no-console */
import { getDatabase } from '../database/index.js';
import { log } from '../logging/logger.js';
import {
  CampaignClient,
  ReviewOrchestrator,
  type CampaignStatus,
  type ContentType,
  type FocusCategory,
} from '../reviews/index.js';

export interface ReviewBookOptions {
  personas?: string;
  plus?: number;
  generated?: number;
  focus?: string;
}

export interface ListCampaignsFilters {
  status?: CampaignStatus;
  contentType?: ContentType;
}

/**
 * Common logic for executing a review campaign
 */
function executeReviewCampaign(
  contentPath: string,
  contentType: 'book' | 'chapter',
  options?: ReviewBookOptions
): void {
  log.info(`\nReviewing ${contentType}: ${contentPath}\n`);

  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);
  const orchestrator = new ReviewOrchestrator(rawDb, campaignClient);

  // Validate mutual exclusivity
  if (options?.plus !== undefined && options?.generated !== undefined) {
    log.error('Error: --plus and --generated are mutually exclusive');
    process.exit(1);
  }

  // Parse persona selection
  let personaSelectionStrategy: 'all_core' | 'manual' = 'all_core';
  let personaIds: string[] | undefined;

  if (options?.personas && options.personas !== 'all_core') {
    personaSelectionStrategy = 'manual';
    personaIds = options.personas.split(',').map((id) => id.trim());
  }

  // Validate focus if provided
  const validFocuses = ['general', 'gm-content', 'combat', 'narrative', 'character-creation', 'quickstart'];
  if (options?.focus && !validFocuses.includes(options.focus)) {
    log.error(`Error: Invalid focus '${options.focus}'. Valid options: ${validFocuses.join(', ')}`);
    process.exit(1);
  }

  // Initialize campaign with sampling options
  log.info('Creating review campaign...');
  const campaignId = orchestrator.initializeCampaign({
    campaignName: `${contentPath} Review - ${new Date().toISOString()}`,
    contentType,
    contentPath,
    personaSelectionStrategy,
    personaIds,
    plusCount: options?.plus,
    generatedCount: options?.generated,
    focus: options?.focus as FocusCategory | undefined,
  });

  // Generate prompt files and show next steps
  orchestrator.executeReviews(campaignId);
}

/**
 * Command: review book <path>
 * Reviews an HTML book using selected personas
 */
export function reviewBook(
  bookPath: string,
  options?: ReviewBookOptions
): void {
  executeReviewCampaign(bookPath, 'book', options);
}

/**
 * Command: review chapter <path>
 * Reviews a markdown chapter using selected personas
 */
export function reviewChapter(
  chapterPath: string,
  options?: ReviewBookOptions
): void {
  executeReviewCampaign(chapterPath, 'chapter', options);
}

/**
 * Command: review list
 * Lists all review campaigns
 */
export function listCampaigns(filters?: ListCampaignsFilters): void {
  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);

  const campaigns = campaignClient.listCampaigns(filters || {});

  log.info(`\nFound ${campaigns.length} campaigns:\n`);

  for (const campaign of campaigns) {
    log.info(`[${campaign.status}] ${campaign.campaign_name}`);
    log.info(`  ID: ${campaign.id}`);
    log.info(`  Type: ${campaign.content_type}`);
    log.info(`  Created: ${campaign.created_at}`);
    log.info('');
  }
}

/**
 * Command: review view <campaign-id>
 * Views campaign details
 */
export function viewCampaign(
  campaignId: string,
  options?: { format?: 'text' | 'json' }
): void {
  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);

  const campaign = campaignClient.getCampaign(campaignId);

  if (!campaign) {
    log.error(`Campaign not found: ${campaignId}`);
    return;
  }

  if (options?.format === 'json') {
    log.info(JSON.stringify(campaign, null, 2));
    return;
  }

  log.info(`\nCampaign: ${campaign.campaign_name}\n`);
  log.info(`Status: ${campaign.status}`);
  log.info(`Type: ${campaign.content_type}`);
  log.info(`Content ID: ${campaign.content_id}`);
  const personaIds = JSON.parse(campaign.persona_ids) as string[];
  log.info(`Personas: ${personaIds.join(', ')}`);
  log.info(`Created: ${campaign.created_at}`);
  if (campaign.completed_at) {
    log.info(`Completed: ${campaign.completed_at}`);
  }

  // Show reviews
  const reviews = campaignClient.getCampaignReviews(campaignId);
  log.info(`\nReviews: ${reviews.length}\n`);

  for (const review of reviews) {
    log.info(`  [${review.status}] ${review.persona_id}`);
  }

  // Show analysis if exists
  const analysis = campaignClient.getCampaignAnalysis(campaignId);
  if (analysis) {
    log.info(`\nAnalysis: ${analysis.markdown_path}`);
  }
}

/**
 * Command: review status <campaign-id>
 * Shows campaign status with review progress and next steps
 */
export function statusCampaign(campaignId: string): void {
  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    log.error(`Campaign not found: ${campaignId}`);
    process.exit(1);
  }

  const reviews = campaignClient.getCampaignReviews(campaignId);
  const analysis = campaignClient.getCampaignAnalysis(campaignId);

  // Parse persona IDs to determine expected count
  const personaIds = JSON.parse(campaign.persona_ids || '[]') as string[];
  const expectedReviews = personaIds.length;
  const completedReviews = reviews.length;

  log.info(`\nCampaign: ${campaignId}`);
  log.info(`Status: ${campaign.status}`);
  log.info(`Expected reviews: ${expectedReviews}`);
  log.info(`Completed reviews: ${completedReviews}`);

  // Show missing reviews if any
  if (completedReviews < expectedReviews) {
    const completedPersonaIds = reviews.map((r) => r.persona_id);
    const missingPersonaIds = personaIds.filter((id) => !completedPersonaIds.includes(id));
    log.info(`Missing reviews: ${missingPersonaIds.join(', ')}`);
  } else {
    log.info('Missing reviews: (none)');
  }

  // Provide next step instructions
  if (campaign.status === 'in_progress' && completedReviews === expectedReviews) {
    log.info('\n✅ All reviews complete! Ready for analysis.\n');
    log.info('Next: Tell Claude Code to run analysis\n');
    log.info('────────────────────────────────────────────────────────');
    log.info(`Read analyzer prompt from data/reviews/prompts/${campaignId}/analyzer.txt`);
    log.info(`and execute analyzer agent`);
    log.info('────────────────────────────────────────────────────────\n');
  } else if (campaign.status === 'analyzing' && analysis) {
    log.info('\n✅ Analysis complete!\n');
    log.info(`📁 Outputs:`);
    log.info(`  Reviews: data/reviews/raw/${campaignId}/`);
    log.info(`  Analysis: data/reviews/analysis/${campaignId}.md\n`);
  } else if (campaign.status === 'completed') {
    log.info('\n✅ Campaign completed!\n');
    log.info(`📁 Outputs:`);
    log.info(`  Reviews: ${completedReviews} reviews`);
    log.info(`  Analysis: ${analysis ? 'Generated' : 'Not found'}\n`);
  } else {
    log.info('\nWaiting for reviews to complete...\n');
  }
}
