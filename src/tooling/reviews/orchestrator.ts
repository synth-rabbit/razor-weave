import type { CampaignStatus } from './campaign-client.js';

export interface OrchestratorConfig {
  campaignName: string;
  contentType: 'book' | 'chapter';
  contentPath: string;
  personaSelectionStrategy: 'all_core' | 'manual' | 'smart_sampling';
  personaIds?: string[];
}

export interface ReviewerAgentTask {
  personaId: string;
  campaignId: string;
  contentSnapshotId: number;
  outputPath: string;
}

export interface OrchestratorResult {
  campaignId: string;
  status: CampaignStatus;
  successfulReviews: number;
  failedReviews: number;
  errors: string[];
}
