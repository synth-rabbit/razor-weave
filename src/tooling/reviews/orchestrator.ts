import Database from 'better-sqlite3';
import { CampaignClient } from './campaign-client.js';
import type { CampaignStatus } from './campaign-client.js';
import { snapshotBook, snapshotChapter } from './content-snapshot.js';

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

/**
 * ReviewOrchestrator manages the review campaign lifecycle.
 *
 * Responsibilities:
 * 1. Initialize campaigns and snapshot content
 * 2. Launch parallel reviewer agents via Task tool
 * 3. Poll for completion and validate outputs
 * 4. Handle failures and provide diagnostics
 * 5. Trigger analysis after all reviews complete
 *
 * Usage:
 * ```typescript
 * const orchestrator = new ReviewOrchestrator(db, campaignClient);
 *
 * const campaignId = orchestrator.initializeCampaign({
 *   campaignName: 'Core Rulebook v1.2 Review',
 *   contentType: 'book',
 *   contentPath: 'src/site/core_rulebook_web.html',
 *   personaSelectionStrategy: 'all_core'
 * });
 *
 * await orchestrator.executeReviews(campaignId);
 * await orchestrator.runAnalysis(campaignId);
 * ```
 */
export class ReviewOrchestrator {
  constructor(
    private db: Database.Database,
    private campaignClient: CampaignClient
  ) {}

  initializeCampaign(config: OrchestratorConfig): string {
    // Snapshot content
    const contentId =
      config.contentType === 'book'
        ? snapshotBook(this.db, {
            bookPath: config.contentPath,
            version: new Date().toISOString(),
            source: 'claude',
          })
        : snapshotChapter(this.db, {
            bookPath: 'unknown',
            chapterPath: config.contentPath,
            chapterName: 'Chapter',
            version: new Date().toISOString(),
            source: 'claude',
          });

    // Get persona IDs based on strategy
    const personaIds = this.selectPersonas(config);

    // Create campaign
    const campaignId = this.campaignClient.createCampaign({
      campaignName: config.campaignName,
      contentType: config.contentType,
      contentId,
      personaSelectionStrategy: config.personaSelectionStrategy,
      personaIds,
    });

    return campaignId;
  }

  getCampaign(campaignId: string) {
    return this.campaignClient.getCampaign(campaignId);
  }

  private selectPersonas(config: OrchestratorConfig): string[] {
    if (config.personaSelectionStrategy === 'manual') {
      return config.personaIds || [];
    }

    if (config.personaSelectionStrategy === 'all_core') {
      // Get all core personas from database
      const stmt = this.db.prepare(`
        SELECT id FROM personas WHERE type = 'core' AND active = TRUE
      `);
      const rows = stmt.all() as Array<{ id: string }>;
      return rows.map((r) => r.id);
    }

    // smart_sampling not implemented yet
    throw new Error('smart_sampling not yet implemented');
  }
}
