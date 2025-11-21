import { z } from 'zod';

export const IssueAnnotationSchema = z.object({
  section: z.string().min(1),
  issue: z.string().min(1),
  impact: z.string().min(1),
  location: z.string().min(1),
});

export const RatingsSchema = z.object({
  clarity_readability: z.number().int().min(1).max(10),
  rules_accuracy: z.number().int().min(1).max(10),
  persona_fit: z.number().int().min(1).max(10),
  practical_usability: z.number().int().min(1).max(10),
});

export const ReviewDataSchema = z.object({
  ratings: RatingsSchema,
  narrative_feedback: z.string().min(10),
  issue_annotations: z.array(IssueAnnotationSchema).min(1),
  overall_assessment: z.string().min(10),
});

export const PriorityRankingSchema = z.object({
  category: z.string(),
  severity: z.number().int().min(1).max(10),
  frequency: z.number().int().min(1),
  affected_personas: z.array(z.string()),
  description: z.string(),
});

export const DimensionSummarySchema = z.object({
  average: z.number().min(1).max(10),
  themes: z.array(z.string()),
});

export const PersonaBreakdownSchema = z.object({
  strengths: z.array(z.string()),
  struggles: z.array(z.string()),
});

export const AnalysisDataSchema = z.object({
  executive_summary: z.string().min(50),
  priority_rankings: z.array(PriorityRankingSchema),
  dimension_summaries: z.object({
    clarity_readability: DimensionSummarySchema,
    rules_accuracy: DimensionSummarySchema,
    persona_fit: DimensionSummarySchema,
    practical_usability: DimensionSummarySchema,
  }),
  persona_breakdowns: z.record(PersonaBreakdownSchema),
  trend_analysis: z.string().optional(),
});

export type AnalysisData = z.infer<typeof AnalysisDataSchema>;
export type PriorityRanking = z.infer<typeof PriorityRankingSchema>;
export type ReviewData = z.infer<typeof ReviewDataSchema>;
export type IssueAnnotation = z.infer<typeof IssueAnnotationSchema>;
export type Ratings = z.infer<typeof RatingsSchema>;
