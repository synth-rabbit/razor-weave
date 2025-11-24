// src/tooling/w1/strategy-types.ts
import { z } from 'zod';

/**
 * Strategic plan status
 */
export type StrategyStatus = 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Area status for parallel execution
 */
export type AreaStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Improvement area type - how areas are grouped
 */
export type AreaType = 'issue_category' | 'chapter_cluster' | 'persona_pain_point';

/**
 * An improvement area within a strategic plan.
 * Each area executes independently in parallel with its own cycle counter.
 */
export const ImprovementAreaSchema = z.object({
  area_id: z.string(),
  name: z.string(),
  type: z.enum(['issue_category', 'chapter_cluster', 'persona_pain_point']),
  description: z.string().optional(),
  target_chapters: z.array(z.string()),
  target_issues: z.array(z.string()),
  target_dimension: z.enum([
    'clarity_readability',
    'rules_accuracy',
    'persona_fit',
    'practical_usability',
    'overall_score',
  ]).optional(),
  priority: z.number().int().min(1),

  // Execution state (managed per-area)
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).default('pending'),
  current_cycle: z.number().int().min(0).default(0),
  max_cycles: z.number().int().min(1).default(3),

  // Metrics tracking
  baseline_score: z.number().optional(),
  current_score: z.number().optional(),
  delta_target: z.number().optional(),
  delta_achieved: z.number().optional(),

  // Artifacts
  chapters_modified: z.array(z.string()).default([]),

  // Legacy fields (backward compatibility)
  baseline_metrics: z.record(z.number()).optional(),
  current_metrics: z.record(z.number()).optional(),
  delta: z.number().optional(),
});

export type ImprovementArea = z.infer<typeof ImprovementAreaSchema>;

/**
 * Strategic plan goal
 */
export const StrategyGoalSchema = z.object({
  metric_threshold: z.number().min(0).max(10).default(8.0),
  primary_dimension: z.enum([
    'clarity_readability',
    'rules_accuracy',
    'persona_fit',
    'practical_usability',
    'overall_score',
  ]),
  max_cycles: z.number().int().min(1).default(3),
  max_runs: z.number().int().min(1).default(3),

  // Threshold configuration
  delta_threshold_for_validation: z.number().default(1.0),
  use_dynamic_deltas: z.boolean().default(true),
  min_acceptable_score: z.number().min(0).max(10).optional(),
});

export type StrategyGoal = z.infer<typeof StrategyGoalSchema>;

/**
 * A single run record - one complete parallel execution of all areas
 */
export const RunSchema = z.object({
  run_number: z.number().int().min(1),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  baseline_overall: z.number(),
  final_overall: z.number().optional(),
  areas_completed: z.number().int().min(0).default(0),
  areas_total: z.number().int().min(1),
  passed: z.boolean().optional(),
});

export type Run = z.infer<typeof RunSchema>;

/**
 * Validation cycle record (legacy - kept for backward compatibility)
 */
export const ValidationCycleSchema = z.object({
  cycle_number: z.number().int().min(1),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  metrics_before: z.record(z.number()),
  metrics_after: z.record(z.number()).optional(),
  passed: z.boolean().optional(),
  gaps_identified: z.array(z.string()).optional(),
});

export type ValidationCycle = z.infer<typeof ValidationCycleSchema>;

/**
 * Human gate trigger reason
 */
export type HumanGateReason = 'threshold_met' | 'max_runs_exhausted' | 'user_requested' | 'full_review_complete';

/**
 * Strategic plan state - tracks progress through parallel workflow
 */
export const StrategyStateSchema = z.object({
  // Phase tracking
  current_phase: z.enum([
    'planning',
    'parallel_execution',
    'validating',
    'human_gate',
    'full_review',
    'finalizing',
    'completed',
    'failed',
    // Legacy phases (backward compatibility)
    'iterating',
  ]),

  // Run tracking (new parallel model)
  current_run: z.number().int().min(1).default(1),
  max_runs: z.number().int().min(1).default(3),
  runs: z.array(RunSchema).default([]),

  // Human gate info
  human_gate_reason: z.enum([
    'threshold_met',
    'max_runs_exhausted',
    'user_requested',
    'full_review_complete',
  ]).optional(),
  human_feedback: z.string().optional(),

  // Overall progress
  baseline_overall: z.number().optional(),
  current_overall: z.number().optional(),
  cumulative_delta: z.number().default(0),

  // Legacy fields (backward compatibility)
  current_area_index: z.number().int().min(0).default(0),
  areas_completed: z.array(z.string()).default([]),
  current_cycle: z.number().int().min(1).default(1),
  validation_cycles: z.array(ValidationCycleSchema).default([]),

  // Metadata
  last_updated: z.string().datetime(),
  error_message: z.string().optional(),
});

export type StrategyState = z.infer<typeof StrategyStateSchema>;

/**
 * Full strategic plan
 */
export const StrategicPlanSchema = z.object({
  id: z.string(),
  book_id: z.string(),
  book_slug: z.string(),
  workflow_run_id: z.string().optional(),
  source_analysis_path: z.string().optional(),
  goal: StrategyGoalSchema,
  areas: z.array(ImprovementAreaSchema),
  state: StrategyStateSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  status: z.enum(['active', 'paused', 'completed', 'failed', 'cancelled']).default('active'),
});

export type StrategicPlan = z.infer<typeof StrategicPlanSchema>;

/**
 * Input for creating a new strategic plan
 */
export interface CreateStrategicPlanInput {
  book_id: string;
  book_slug: string;
  workflow_run_id?: string;
  source_analysis_path?: string;
  goal: StrategyGoal;
  areas: Omit<ImprovementArea, 'status' | 'current_cycle' | 'baseline_score' | 'current_score' | 'delta_achieved' | 'chapters_modified' | 'baseline_metrics' | 'current_metrics' | 'delta'>[];
}

/**
 * Database row for strategic_plans table
 */
export interface StrategicPlanRow {
  id: string;
  book_id: string;
  book_slug: string;
  workflow_run_id: string | null;
  source_analysis_path: string | null;
  goal_json: string;
  areas_json: string;
  state_json: string;
  status: StrategyStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Area update input for partial updates
 */
export interface AreaUpdateInput {
  status?: AreaStatus;
  current_cycle?: number;
  current_score?: number;
  delta_achieved?: number;
  chapters_modified?: string[];
}

/**
 * Analysis input for area generation
 */
export interface AnalysisForAreaGeneration {
  priority_rankings: Array<{
    category: string;
    severity: number;
    frequency: number;
    affected_chapters?: string[];
    affected_personas?: string[];
    description?: string;
  }>;
  dimension_summaries: Record<string, {
    average: number;
    themes: string[];
  }>;
  persona_breakdowns?: Record<string, {
    strengths: string[];
    struggles: string[];
  }>;
}
