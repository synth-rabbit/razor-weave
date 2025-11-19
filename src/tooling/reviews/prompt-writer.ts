import type Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'fs';
import { CampaignClient } from './campaign-client.js';
import { generateReviewerPromptFile, generateAnalyzerPromptFile } from './prompt-generator.js';

export function writePromptFiles(
  db: Database.Database,
  campaignId: string
): string[] {
  const campaignClient = new CampaignClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Resolve persona IDs
  const personaIds = JSON.parse(campaign.persona_ids || '[]') as string[];

  // Create prompts directory
  const promptsDir = `data/reviews/prompts/${campaignId}`;
  mkdirSync(promptsDir, { recursive: true });

  const writtenFiles: string[] = [];

  // Write reviewer prompts (one per persona)
  for (const personaId of personaIds) {
    const promptText = generateReviewerPromptFile(db, campaignId, personaId);
    const filePath = `${promptsDir}/${personaId}.txt`;
    writeFileSync(filePath, promptText, 'utf-8');
    writtenFiles.push(filePath);
  }

  return writtenFiles;
}

export function writeAnalyzerPromptFile(
  db: Database.Database,
  campaignId: string
): string {
  const campaignClient = new CampaignClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Create prompts directory if it doesn't exist
  const promptsDir = `data/reviews/prompts/${campaignId}`;
  mkdirSync(promptsDir, { recursive: true });

  // Write analyzer prompt (requires reviews to exist)
  const analyzerPromptText = generateAnalyzerPromptFile(db, campaignId);
  const analyzerPath = `${promptsDir}/analyzer.txt`;
  writeFileSync(analyzerPath, analyzerPromptText, 'utf-8');

  return analyzerPath;
}
