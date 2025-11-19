/* eslint-disable no-console */
import { getDatabase } from '../database/index.js';
import {
  CampaignClient,
  type CampaignStatus,
  type ContentType,
} from '../reviews/campaign-client.js';
import { ReviewOrchestrator } from '../reviews/review-orchestrator.js';

export interface ReviewBookOptions {
  personas?: string;
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
  options?: { personas?: string }
): void {
  console.log(`\nReviewing ${contentType}: ${contentPath}\n`);

  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);
  const orchestrator = new ReviewOrchestrator(rawDb, campaignClient);

  // Parse persona selection
  let personaSelectionStrategy: 'all_core' | 'manual' = 'all_core';
  let personaIds: string[] | undefined;

  if (options?.personas && options.personas !== 'all_core') {
    personaSelectionStrategy = 'manual';
    personaIds = options.personas.split(',').map((id) => id.trim());
  }

  // Initialize campaign
  console.log('Creating review campaign...');
  const campaignId = orchestrator.initializeCampaign({
    campaignName: `${contentPath} Review - ${new Date().toISOString()}`,
    contentType,
    contentPath,
    personaSelectionStrategy,
    personaIds,
  });

  console.log(`Campaign created: ${campaignId}`);
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

  console.log(`\nFound ${campaigns.length} campaigns:\n`);

  for (const campaign of campaigns) {
    console.log(`[${campaign.status}] ${campaign.campaign_name}`);
    console.log(`  ID: ${campaign.id}`);
    console.log(`  Type: ${campaign.content_type}`);
    console.log(`  Created: ${campaign.created_at}`);
    console.log('');
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
    console.error(`Campaign not found: ${campaignId}`);
    return;
  }

  if (options?.format === 'json') {
    console.log(JSON.stringify(campaign, null, 2));
    return;
  }

  console.log(`\nCampaign: ${campaign.campaign_name}\n`);
  console.log(`Status: ${campaign.status}`);
  console.log(`Type: ${campaign.content_type}`);
  console.log(`Content ID: ${campaign.content_id}`);
  const personaIds = JSON.parse(campaign.persona_ids) as string[];
  console.log(`Personas: ${personaIds.join(', ')}`);
  console.log(`Created: ${campaign.created_at}`);
  if (campaign.completed_at) {
    console.log(`Completed: ${campaign.completed_at}`);
  }

  // Show reviews
  const reviews = campaignClient.getCampaignReviews(campaignId);
  console.log(`\nReviews: ${reviews.length}\n`);

  for (const review of reviews) {
    console.log(`  [${review.status}] ${review.persona_id}`);
  }

  // Show analysis if exists
  const analysis = campaignClient.getCampaignAnalysis(campaignId);
  if (analysis) {
    console.log(`\nAnalysis: ${analysis.markdown_path}`);
  }
}
