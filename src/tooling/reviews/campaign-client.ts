// src/tooling/reviews/campaign-client.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Database from 'better-sqlite3';

export type CampaignStatus =
  | 'pending'
  | 'in_progress'
  | 'analyzing'
  | 'completed'
  | 'failed';

export type ContentType = 'book' | 'chapter';

export type PersonaSelectionStrategy =
  | 'all_core'
  | 'manual'
  | 'smart_sampling';

export interface CreateCampaignData {
  campaignName: string;
  contentType: ContentType;
  contentId: number;
  personaSelectionStrategy: PersonaSelectionStrategy;
  personaIds: string[];
  metadata?: Record<string, unknown>;
}

export interface Campaign {
  id: string;
  campaign_name: string;
  content_type: ContentType;
  content_id: number;
  persona_selection_strategy: PersonaSelectionStrategy;
  persona_ids: string;
  status: CampaignStatus;
  metadata: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PersonaReviewData {
  campaignId: string;
  personaId: string;
  reviewData: {
    ratings: {
      clarity_readability: number;
      rules_accuracy: number;
      persona_fit: number;
      practical_usability: number;
    };
    narrative_feedback: string;
    issue_annotations: Array<{
      section: string;
      issue: string;
      impact: string;
      location: string;
    }>;
    overall_assessment: string;
  };
  agentExecutionTime?: number;
}

export interface PersonaReview {
  id: number;
  campaign_id: string;
  persona_id: string;
  review_data: string;
  agent_execution_time: number | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface CampaignAnalysisData {
  campaignId: string;
  analysisData: {
    executive_summary: string;
    priority_rankings: Array<{
      category: string;
      severity: number;
      frequency: number;
      affected_personas: string[];
      description: string;
    }>;
    dimension_summaries: {
      clarity_readability: { average: number; themes: string[] };
      rules_accuracy: { average: number; themes: string[] };
      persona_fit: { average: number; themes: string[] };
      practical_usability: { average: number; themes: string[] };
    };
    persona_breakdowns: Record<
      string,
      { strengths: string[]; struggles: string[] }
    >;
    trend_analysis?: string;
  };
  markdownPath: string;
}

export interface CampaignAnalysis {
  id: number;
  campaign_id: string;
  analysis_data: string;
  markdown_path: string;
  created_at: string;
}

export class CampaignClient {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  createCampaign(data: CreateCampaignData): string {
    // Generate campaign ID in format: campaign-YYYYMMDD-HHMMSS-randomString
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
    const randomPart = Math.random().toString(36).substring(2, 10);
    const id = `campaign-${datePart}-${timePart}-${randomPart}`;

    // Insert into database
    const stmt = this.db.prepare(`
      INSERT INTO review_campaigns (
        id, campaign_name, content_type, content_id,
        persona_selection_strategy, persona_ids, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.campaignName,
      data.contentType,
      data.contentId,
      data.personaSelectionStrategy,
      JSON.stringify(data.personaIds),
      'pending',
      data.metadata ? JSON.stringify(data.metadata) : null
    );

    return id;
  }

  getCampaign(id: string): Campaign | null {
    const stmt = this.db.prepare('SELECT * FROM review_campaigns WHERE id = ?');
    const row = stmt.get(id);
    return row ? (row as Campaign) : null;
  }

  updateStatus(
    campaignId: string,
    status: CampaignStatus,
    completedAt?: Date
  ): void {
    // Determine completed_at value:
    // 1. If completedAt explicitly provided, use it
    // 2. Else if status is 'completed', auto-generate
    // 3. Else null
    const completedAtStr = completedAt
      ? completedAt.toISOString()
      : status === 'completed'
        ? new Date().toISOString()
        : null;

    const stmt = this.db.prepare(`
      UPDATE review_campaigns
      SET status = ?, completed_at = ?
      WHERE id = ?
    `);

    stmt.run(status, completedAtStr, campaignId);
  }
}
