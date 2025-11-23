// src/tooling/w1/metrics-evaluator.ts
// Metrics evaluation logic moved from invoker-pm-metrics.ts

/**
 * Dimension assessment categories based on delta values
 */
export type DimensionAssessment =
  | 'significantly_improved'
  | 'improved'
  | 'stable'
  | 'degraded'
  | 'significantly_degraded';

/**
 * Confidence level for the evaluation
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Comparison result for a single metric dimension
 */
export interface DimensionComparison {
  baseline: number;
  new: number;
  delta: number;
  assessment: DimensionAssessment;
}

/**
 * Chapter-level comparison summary
 */
export interface ChapterComparison {
  chapter_id: string;
  overall_delta: number;
  assessment: string;
  notable_changes: string[];
}

/**
 * Full metrics comparison structure
 */
export interface MetricsComparison {
  overall: DimensionComparison;
  by_dimension: {
    clarity_readability: DimensionComparison;
    rules_accuracy: DimensionComparison;
    persona_fit: DimensionComparison;
    practical_usability: DimensionComparison;
    [key: string]: DimensionComparison;
  };
  by_chapter: ChapterComparison[];
}

/**
 * Result of the metrics evaluation
 */
export interface MetricsEvaluationResult {
  approved: boolean;
  reasoning: string;
  metrics_comparison: MetricsComparison;
  recommendations: string[];
  confidence: ConfidenceLevel;
}

/**
 * Aggregate metrics structure
 */
export interface AggregateMetrics {
  clarity_readability: number;
  rules_accuracy: number;
  persona_fit: number;
  practical_usability: number;
  overall_score: number;
}

/**
 * Chapter-level metrics structure
 */
export interface ChapterMetrics {
  chapter_id: string;
  chapter_name?: string;
  metrics: {
    clarity_readability: number;
    rules_accuracy: number;
    persona_fit: number;
    practical_usability: number;
    overall_score?: number;
  };
}

/**
 * Input metrics data structure (baseline or new)
 */
export interface MetricsData {
  source?: string;
  reviewed_at?: string;
  aggregate_metrics: AggregateMetrics;
  chapter_metrics?: ChapterMetrics[];
}

/**
 * Options for local metrics evaluation
 */
export interface MetricsEvaluationOptions {
  baselineMetrics: MetricsData;
  newMetrics: MetricsData;
  improvementPlanContext?: string;
}

/**
 * Get assessment label based on delta value
 */
export function getAssessment(delta: number): DimensionAssessment {
  if (delta >= 1.0) return 'significantly_improved';
  if (delta >= 0.3) return 'improved';
  if (delta > -0.3) return 'stable';
  if (delta > -1.0) return 'degraded';
  return 'significantly_degraded';
}

/**
 * Calculate dimension comparison
 */
function calculateDimensionComparison(baseline: number, newValue: number): DimensionComparison {
  const delta = Math.round((newValue - baseline) * 10) / 10;
  return {
    baseline,
    new: newValue,
    delta,
    assessment: getAssessment(delta),
  };
}

/**
 * Evaluate metrics without calling the LLM (for simple cases)
 */
export function evaluateMetricsLocally(options: MetricsEvaluationOptions): MetricsEvaluationResult {
  const { baselineMetrics, newMetrics } = options;
  const baseline = baselineMetrics.aggregate_metrics;
  const newAgg = newMetrics.aggregate_metrics;

  // Calculate dimension comparisons
  const byDimension = {
    clarity_readability: calculateDimensionComparison(
      baseline.clarity_readability,
      newAgg.clarity_readability
    ),
    rules_accuracy: calculateDimensionComparison(
      baseline.rules_accuracy,
      newAgg.rules_accuracy
    ),
    persona_fit: calculateDimensionComparison(
      baseline.persona_fit,
      newAgg.persona_fit
    ),
    practical_usability: calculateDimensionComparison(
      baseline.practical_usability,
      newAgg.practical_usability
    ),
  };

  // Calculate overall comparison
  const overallComparison = calculateDimensionComparison(
    baseline.overall_score,
    newAgg.overall_score
  );

  // Calculate chapter comparisons if available
  const byChapter: ChapterComparison[] = [];
  if (newMetrics.chapter_metrics && baselineMetrics.chapter_metrics) {
    for (const newChapter of newMetrics.chapter_metrics) {
      const baselineChapter = baselineMetrics.chapter_metrics.find(
        (c) => c.chapter_id === newChapter.chapter_id
      );
      if (baselineChapter) {
        const chapterDeltas = [
          { dim: 'clarity_readability', delta: newChapter.metrics.clarity_readability - baselineChapter.metrics.clarity_readability },
          { dim: 'rules_accuracy', delta: newChapter.metrics.rules_accuracy - baselineChapter.metrics.rules_accuracy },
          { dim: 'persona_fit', delta: newChapter.metrics.persona_fit - baselineChapter.metrics.persona_fit },
          { dim: 'practical_usability', delta: newChapter.metrics.practical_usability - baselineChapter.metrics.practical_usability },
        ];

        const avgDelta = chapterDeltas.reduce((sum, d) => sum + d.delta, 0) / 4;
        const notableChanges = chapterDeltas
          .filter((d) => Math.abs(d.delta) >= 0.5)
          .map((d) => `${d.dim} ${d.delta >= 0 ? '+' : ''}${d.delta.toFixed(1)}`);

        byChapter.push({
          chapter_id: newChapter.chapter_id,
          overall_delta: Math.round(avgDelta * 10) / 10,
          assessment: getAssessment(avgDelta),
          notable_changes: notableChanges,
        });
      }
    }
  }

  // Build metrics comparison
  const metricsComparison: MetricsComparison = {
    overall: overallComparison,
    by_dimension: byDimension,
    by_chapter: byChapter,
  };

  // Determine approval based on criteria
  const dimensions = Object.values(byDimension);
  const degradedDimensions = dimensions.filter((d) => d.delta <= -0.5);
  const significantlyDegradedDimensions = dimensions.filter((d) => d.delta <= -1.0);
  const improvedDimensions = dimensions.filter((d) => d.delta >= 0.3);

  let approved = false;
  let reasoning = '';
  let confidence: ConfidenceLevel = 'medium';

  // Check rejection criteria first
  if (significantlyDegradedDimensions.length > 0) {
    approved = false;
    reasoning = `Rejected: One or more dimensions showed significant degradation (>= 1.0 point drop). `;
    reasoning += significantlyDegradedDimensions
      .map((d) => `${findDimensionName(d, byDimension)} dropped by ${Math.abs(d.delta).toFixed(1)} points`)
      .join(', ');
    confidence = 'high';
  } else if (overallComparison.delta <= -0.3) {
    approved = false;
    reasoning = `Rejected: Overall score degraded by ${Math.abs(overallComparison.delta).toFixed(1)} points (from ${baseline.overall_score} to ${newAgg.overall_score}).`;
    confidence = 'high';
  } else if (degradedDimensions.length >= 2) {
    approved = false;
    reasoning = `Rejected: Multiple dimensions (${degradedDimensions.length}) degraded by more than 0.5 points.`;
    confidence = 'medium';
  }
  // Check approval criteria
  else if (overallComparison.delta >= 0.3) {
    approved = true;
    reasoning = `Approved: Overall score improved by ${overallComparison.delta.toFixed(1)} points (from ${baseline.overall_score} to ${newAgg.overall_score}).`;
    if (improvedDimensions.length > 0) {
      reasoning += ` Improved dimensions: ${improvedDimensions.length}/4.`;
    }
    confidence = 'high';
  } else if (improvedDimensions.length > 0 && degradedDimensions.length === 0) {
    approved = true;
    reasoning = `Approved: ${improvedDimensions.length} dimension(s) improved with no degradation. Overall score is stable.`;
    confidence = 'medium';
  } else if (improvedDimensions.length > 0) {
    // Mixed results - approve with notes
    approved = true;
    reasoning = `Approved with notes: Mixed results with ${improvedDimensions.length} improved and ${degradedDimensions.length} slightly degraded dimensions. Net improvement is positive.`;
    confidence = 'low';
  } else {
    // Flat results
    approved = true;
    reasoning = `Approved: Metrics are stable with no significant changes. No degradation detected.`;
    confidence = 'medium';
  }

  // Build recommendations
  const recommendations: string[] = [];
  if (approved) {
    recommendations.push('Proceed to human gate review for final approval');
  } else {
    recommendations.push('Review the feedback from content modification phase');
    recommendations.push('Consider adjusting the improvement plan to address regressions');
  }

  if (degradedDimensions.length > 0 && approved) {
    const degradedNames = degradedDimensions.map((d) => findDimensionName(d, byDimension));
    recommendations.push(`Monitor ${degradedNames.join(', ')} in future iterations`);
  }

  return {
    approved,
    reasoning,
    metrics_comparison: metricsComparison,
    recommendations,
    confidence,
  };
}

/**
 * Find the dimension name from the comparison object
 */
function findDimensionName(
  comparison: DimensionComparison,
  byDimension: Record<string, DimensionComparison>
): string {
  for (const [name, dim] of Object.entries(byDimension)) {
    if (dim === comparison) return name;
  }
  return 'unknown';
}
