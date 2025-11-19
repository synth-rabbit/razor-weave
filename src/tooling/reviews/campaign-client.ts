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
