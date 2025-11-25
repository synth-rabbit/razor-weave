import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import type Database from 'better-sqlite3';
import { CampaignClient, type Campaign } from './campaign-client.js';
import { ReviewDataSchema, type ReviewData } from './schemas.js';
import { log } from '../logging/logger.js';

export interface CollectReviewsResult {
  collected: number;
  skipped: number;
  errors: string[];
  personaIds: string[];
}

/**
 * Collects review JSON files written by agents and persists them to the database.
 *
 * Reads JSON files from data/reviews/raw/{campaignId}/*.json
 * Validates each file against ReviewDataSchema
 * Persists valid reviews via CampaignClient.createPersonaReview()
 *
 * @param db - Database connection
 * @param campaignId - Campaign to collect reviews for
 * @returns Result with counts and any errors
 */
export function collectReviews(
  db: Database.Database,
  campaignId: string
): CollectReviewsResult {
  const campaignClient = new CampaignClient(db);
  const result: CollectReviewsResult = {
    collected: 0,
    skipped: 0,
    errors: [],
    personaIds: [],
  };

  // Verify campaign exists
  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Check reviews directory
  const reviewDir = join('data', 'reviews', 'raw', campaignId);
  if (!existsSync(reviewDir)) {
    log.warn(`Reviews directory not found: ${reviewDir}`);
    return result;
  }

  // Get existing reviews to avoid duplicates
  const existingReviews = campaignClient.getCampaignReviews(campaignId);
  const existingPersonaIds = new Set(existingReviews.map((r) => r.persona_id));

  // Find all JSON files
  const files = readdirSync(reviewDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const personaId = basename(file, '.json');
    const filePath = join(reviewDir, file);

    // Skip if already collected
    if (existingPersonaIds.has(personaId)) {
      log.info(`Skipping ${personaId} (already in database)`);
      result.skipped++;
      continue;
    }

    try {
      // Read and parse JSON
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Validate against schema
      const validatedData = ReviewDataSchema.parse(data);

      // Persist to database
      campaignClient.createPersonaReview({
        campaignId,
        personaId,
        reviewData: validatedData,
      });

      result.collected++;
      result.personaIds.push(personaId);
      log.info(`Collected review from ${personaId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`${personaId}: ${message}`);
      log.error(`Failed to collect ${personaId}: ${message}`);
    }
  }

  return result;
}

/**
 * Gets the status of review collection for a campaign.
 * Compares expected personas (from campaign) with collected reviews (in database).
 */
export function getCollectionStatus(
  db: Database.Database,
  campaignId: string
): {
  expected: string[];
  collected: string[];
  pending: string[];
  hasJsonFiles: string[];
} {
  const campaignClient = new CampaignClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const expectedPersonas = JSON.parse(campaign.persona_ids || '[]') as string[];
  const reviews = campaignClient.getCampaignReviews(campaignId);
  const collectedPersonas = reviews.map((r) => r.persona_id);
  const collectedSet = new Set(collectedPersonas);

  // Check for JSON files on disk
  const reviewDir = join('data', 'reviews', 'raw', campaignId);
  let jsonFilePersonas: string[] = [];
  if (existsSync(reviewDir)) {
    jsonFilePersonas = readdirSync(reviewDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => basename(f, '.json'));
  }

  return {
    expected: expectedPersonas,
    collected: collectedPersonas,
    pending: expectedPersonas.filter((id) => !collectedSet.has(id)),
    hasJsonFiles: jsonFilePersonas,
  };
}
