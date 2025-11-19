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

    console.log(`Executing reviews for ${personaIds.length} personas...`);
    console.log('Note: Agent execution not yet implemented');
  }
}
