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

export type ReviewData = z.infer<typeof ReviewDataSchema>;
export type IssueAnnotation = z.infer<typeof IssueAnnotationSchema>;
export type Ratings = z.infer<typeof RatingsSchema>;
