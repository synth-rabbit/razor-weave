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
  contentId: string;
  personaSelectionStrategy: PersonaSelectionStrategy;
  personaIds: string[];
  metadata?: Record<string, unknown>;
}

export interface Campaign {
  id: string;
  campaign_name: string;
  content_type: ContentType;
  content_id: string;
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

export interface CampaignListFilters {
  status?: CampaignStatus;
  contentType?: ContentType;
  contentId?: number;
}

/**
 * Client for managing review campaigns and their lifecycle.
 * Handles campaign creation, persona reviews, analysis, and status tracking.
 */
export class CampaignClient {
  private db: Database.Database;

  /**
   * Creates a new CampaignClient instance.
   * @param db - The better-sqlite3 database instance
   */
  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Creates a new review campaign.
   * Generates a unique campaign ID and initializes with 'pending' status.
   *
   * @param data - Campaign configuration
   * @param data.campaignName - Human-readable campaign name
   * @param data.contentType - Type of content being reviewed ('book' or 'chapter')
   * @param data.contentId - Content ID from snapshot (e.g., 'book-abc123')
   * @param data.personaSelectionStrategy - How personas were selected
   * @param data.personaIds - Array of persona IDs to review content
   * @param data.metadata - Optional additional metadata
   * @returns Campaign ID in format 'campaign-YYYYMMDD-HHMMSS-{random}'
   *
   * @example
   * ```ts
   * const campaignId = campaignClient.createCampaign({
   *   campaignName: 'Core Rulebook v1.0 Review',
   *   contentType: 'book',
   *   contentId: 'book-abc123',
   *   personaSelectionStrategy: 'all_core',
   *   personaIds: ['sarah-explorer', 'alex-tactician']
   * });
   * ```
   */
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

  /**
   * Retrieves a campaign by its ID.
   *
   * @param id - The campaign ID
   * @returns Campaign object or null if not found
   */
  getCampaign(id: string): Campaign | null {
    const stmt = this.db.prepare('SELECT * FROM review_campaigns WHERE id = ?');
    const row = stmt.get(id);
    return row ? (row as Campaign) : null;
  }

  /**
   * Updates a campaign's status.
   * Automatically sets completed_at timestamp when status changes to 'completed'.
   *
   * @param campaignId - The campaign ID to update
   * @param status - New status ('pending' | 'in_progress' | 'analyzing' | 'completed' | 'failed')
   * @param completedAt - Optional explicit completion time, defaults to now if status is 'completed'
   */
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

  /**
   * Creates a persona's review for a campaign.
   * Stores structured review data including ratings, feedback, and issue annotations.
   *
   * @param data - Review data
   * @param data.campaignId - The campaign this review belongs to
   * @param data.personaId - The persona providing the review
   * @param data.reviewData - Structured review with ratings (1-10) and narrative feedback
   * @param data.agentExecutionTime - Optional agent execution time in milliseconds
   * @returns Database row ID of the created review
   */
  createPersonaReview(data: PersonaReviewData): number {
    const reviewDataJson = JSON.stringify(data.reviewData);

    const stmt = this.db.prepare(`
      INSERT INTO persona_reviews (
        campaign_id, persona_id, review_data,
        agent_execution_time, status
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.campaignId,
      data.personaId,
      reviewDataJson,
      data.agentExecutionTime ?? null,
      'completed'
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Creates multiple persona reviews in a single transaction.
   * More efficient than calling createPersonaReview() in a loop.
   *
   * @param reviews - Array of review data to create
   * @returns Array of database row IDs for the created reviews
   */
  createPersonaReviews(reviews: PersonaReviewData[]): number[] {
    const createAll = this.db.transaction(() => {
      const ids: number[] = [];
      const stmt = this.db.prepare(`
        INSERT INTO persona_reviews (
          campaign_id, persona_id, review_data,
          agent_execution_time, status
        ) VALUES (?, ?, ?, ?, ?)
      `);

      for (const data of reviews) {
        const result = stmt.run(
          data.campaignId,
          data.personaId,
          JSON.stringify(data.reviewData),
          data.agentExecutionTime ?? null,
          'completed'
        );
        ids.push(result.lastInsertRowid as number);
      }

      return ids;
    });

    return createAll();
  }

  /**
   * Retrieves a persona review by its database ID.
   *
   * @param id - The review row ID
   * @returns PersonaReview object or null if not found
   */
  getPersonaReview(id: number): PersonaReview | null {
    const stmt = this.db.prepare('SELECT * FROM persona_reviews WHERE id = ?');
    const row = stmt.get(id);
    return row ? (row as PersonaReview) : null;
  }

  /**
   * Retrieves all persona reviews for a campaign.
   *
   * @param campaignId - The campaign ID
   * @returns Array of persona reviews
   */
  getCampaignReviews(campaignId: string): PersonaReview[] {
    const stmt = this.db.prepare('SELECT * FROM persona_reviews WHERE campaign_id = ?');
    const rows = stmt.all(campaignId);
    return rows as PersonaReview[];
  }

  /**
   * Creates an aggregated analysis for a campaign.
   * Analyzes all persona reviews and generates priority rankings, dimension summaries,
   * and persona breakdowns.
   *
   * @param data - Analysis data
   * @param data.campaignId - The campaign being analyzed
   * @param data.analysisData - Structured analysis with executive summary, rankings, and breakdowns
   * @param data.markdownPath - Path where markdown report will be written
   * @returns Database row ID of the created analysis
   */
  createCampaignAnalysis(data: CampaignAnalysisData): number {
    const analysisDataJson = JSON.stringify(data.analysisData);

    const stmt = this.db.prepare(`
      INSERT INTO campaign_analyses (
        campaign_id, analysis_data, markdown_path
      ) VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      data.campaignId,
      analysisDataJson,
      data.markdownPath
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Retrieves the campaign analysis.
   *
   * @param campaignId - The campaign ID
   * @returns CampaignAnalysis object or null if not found
   */
  getCampaignAnalysis(campaignId: string): CampaignAnalysis | null {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_analyses WHERE campaign_id = ?
    `);

    const row = stmt.get(campaignId);
    return row ? (row as CampaignAnalysis) : null;
  }

  /**
   * Lists campaigns with optional filtering.
   * Results are ordered by creation date (newest first).
   *
   * @param filters - Optional filters for status, content type, or content ID
   * @returns Array of campaigns matching the filters
   */
  listCampaigns(filters: CampaignListFilters): Campaign[] {
    let sql = 'SELECT * FROM review_campaigns WHERE 1=1';
    const params: unknown[] = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.contentType) {
      sql += ' AND content_type = ?';
      params.push(filters.contentType);
    }

    if (filters.contentId !== undefined) {
      sql += ' AND content_id = ?';
      params.push(filters.contentId);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows as Campaign[];
  }

  /**
   * Updates the persona IDs for a campaign.
   * Used when adding new reviewers to an existing campaign.
   *
   * @param campaignId - The campaign ID to update
   * @param personaIds - New array of persona IDs (replaces existing)
   * @returns Number of rows affected (1 if campaign exists, 0 if not)
   */
  updatePersonaIds(campaignId: string, personaIds: string[]): number {
    const stmt = this.db.prepare(`
      UPDATE review_campaigns
      SET persona_ids = ?
      WHERE id = ?
    `);

    const result = stmt.run(JSON.stringify(personaIds), campaignId);
    return result.changes;
  }

  /**
   * Deletes the analysis for a campaign.
   * Used when rerunning analysis to overwrite existing results.
   *
   * @param campaignId - The campaign ID whose analysis to delete
   * @returns true if analysis was deleted, false if no analysis existed
   */
  deleteAnalysis(campaignId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM campaign_analyses
      WHERE campaign_id = ?
    `);

    const result = stmt.run(campaignId);
    return result.changes > 0;
  }
}
