import type Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { CampaignClient } from './campaign-client.js';
import { generateReviewerPromptFile, generateAnalyzerPromptFile } from './prompt-generator.js';

/**
 * Writes reviewer prompt files for personas in a campaign.
 *
 * Creates one .txt file per persona in data/reviews/prompts/{campaignId}/
 * Each file contains a complete standalone prompt for the Claude Code reviewer agent,
 * including persona profile, content reference, and executable TypeScript code.
 *
 * @param db - Database connection
 * @param campaignId - Campaign identifier (must exist in database)
 * @param personaIdsFilter - Optional array of persona IDs to write prompts for.
 *                          If not provided, writes prompts for all personas in campaign.
 * @returns Array of paths to written prompt files (relative to project root)
 * @throws Error if campaign not found
 * @throws Error if no personas configured for campaign
 * @throws Error if persona referenced in campaign doesn't exist in database
 */
export function writePromptFiles(
  db: Database.Database,
  campaignId: string,
  personaIdsFilter?: string[]
): string[] {
  const campaignClient = new CampaignClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Resolve persona IDs - use filter if provided, otherwise all from campaign
  const campaignPersonaIds = JSON.parse(campaign.persona_ids || '[]') as string[];
  const personaIds = personaIdsFilter ?? campaignPersonaIds;

  // Validate personas exist
  if (personaIds.length === 0) {
    throw new Error(`No personas configured for campaign: ${campaignId}`);
  }

  // Create prompts directory with sanitized path
  const safeCampaignId = basename(campaignId);
  const promptsDir = join('data', 'reviews', 'prompts', safeCampaignId);
  mkdirSync(promptsDir, { recursive: true });

  const writtenFiles: string[] = [];

  // Write reviewer prompts (one per persona)
  for (const personaId of personaIds) {
    const promptText = generateReviewerPromptFile(db, campaignId, personaId);
    const safePersonaId = basename(personaId);
    const filePath = join(promptsDir, `${safePersonaId}.txt`);
    writeFileSync(filePath, promptText, 'utf-8');
    writtenFiles.push(filePath);
  }

  return writtenFiles;
}

/**
 * Writes analyzer prompt file for a campaign after all reviews are complete.
 *
 * Creates analyzer.txt in data/reviews/prompts/{campaignId}/ containing a complete
 * standalone prompt for the Claude Code analyzer agent. This prompt aggregates all
 * completed reviews and provides instructions for generating campaign analysis.
 *
 * Requires: All persona reviews must be written to database before calling this function.
 *
 * @param db - Database connection
 * @param campaignId - Campaign identifier (must exist in database with completed reviews)
 * @returns Path to written analyzer prompt file (relative to project root)
 * @throws Error if campaign not found
 */
export function writeAnalyzerPromptFile(
  db: Database.Database,
  campaignId: string
): string {
  const campaignClient = new CampaignClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Create prompts directory with sanitized path
  const safeCampaignId = basename(campaignId);
  const promptsDir = join('data', 'reviews', 'prompts', safeCampaignId);
  mkdirSync(promptsDir, { recursive: true });

  // Write analyzer prompt (requires reviews to exist)
  const analyzerPromptText = generateAnalyzerPromptFile(db, campaignId);
  const analyzerPath = join(promptsDir, 'analyzer.txt');
  writeFileSync(analyzerPath, analyzerPromptText, 'utf-8');

  return analyzerPath;
}
