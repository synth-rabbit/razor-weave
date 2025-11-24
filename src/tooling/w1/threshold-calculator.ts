/**
 * Dynamic Threshold Calculator for W1 Workflow
 *
 * Scales delta requirements based on current score level.
 * Higher scores have lower delta requirements since improvements
 * become harder to achieve as quality increases.
 */

/**
 * Get the required delta improvement for a given current score.
 *
 * Scaling logic:
 * - < 7.0: 1.0 delta (low-hanging fruit, big gains possible)
 * - 7.0-7.5: 0.7 delta (moderate improvements expected)
 * - 7.5-8.0: 0.5 delta (getting harder)
 * - 8.0-8.5: 0.3 delta (diminishing returns)
 * - 8.5-9.0: 0.2 delta (polish phase)
 * - > 9.0: 0.1 delta (near-perfection, tiny refinements)
 */
export function getRequiredDelta(currentScore: number): number {
  if (currentScore < 7.0) return 1.0;
  if (currentScore < 7.5) return 0.7;
  if (currentScore < 8.0) return 0.5;
  if (currentScore < 8.5) return 0.3;
  if (currentScore < 9.0) return 0.2;
  return 0.1;
}

/**
 * Check if a delta meets the required threshold for the current score.
 */
export function meetsThreshold(currentScore: number, achievedDelta: number): boolean {
  const required = getRequiredDelta(currentScore);
  return achievedDelta >= required;
}

/**
 * Determine if approval should be granted based on score and delta.
 *
 * Approval criteria vary by score level:
 * - Below 8.0: Must meet delta threshold
 * - At/above 8.0: Can approve with any positive delta and no regressions
 * - At 9.0+: Maintenance mode - approve if stable (delta >= 0)
 */
export function shouldApprove(
  baselineScore: number,
  currentScore: number,
  options?: {
    /** If true, allow approval at 8.0+ with any positive delta */
    allowStabilityApproval?: boolean;
    /** Dimensions that regressed (if any) */
    regressions?: string[];
  }
): { approved: boolean; reason: string } {
  const delta = currentScore - baselineScore;
  const requiredDelta = getRequiredDelta(baselineScore);
  const { allowStabilityApproval = true, regressions = [] } = options ?? {};

  // Check for significant regressions
  if (regressions.length > 0) {
    return {
      approved: false,
      reason: `Regressions detected in: ${regressions.join(', ')}`,
    };
  }

  // Check if delta meets threshold
  if (delta >= requiredDelta) {
    return {
      approved: true,
      reason: `Delta ${delta.toFixed(2)} meets threshold ${requiredDelta.toFixed(2)}`,
    };
  }

  // At 9.0+, approve if stable (no regression)
  if (baselineScore >= 9.0 && delta >= 0) {
    return {
      approved: true,
      reason: `Maintenance mode: score stable at ${currentScore.toFixed(1)}`,
    };
  }

  // At 8.0+, can approve with any positive delta if stability approval enabled
  if (allowStabilityApproval && baselineScore >= 8.0 && delta > 0) {
    return {
      approved: true,
      reason: `Score ${currentScore.toFixed(1)} shows improvement (+${delta.toFixed(2)}) at high baseline`,
    };
  }

  // Threshold not met
  return {
    approved: false,
    reason: `Delta ${delta.toFixed(2)} below threshold ${requiredDelta.toFixed(2)} (need +${(requiredDelta - delta).toFixed(2)} more)`,
  };
}

/**
 * Get human-readable approval criteria for a given score level.
 */
export function getApprovalCriteria(currentScore: number): {
  requiredDelta: number;
  canApproveWithStability: boolean;
  description: string;
} {
  const requiredDelta = getRequiredDelta(currentScore);

  if (currentScore >= 9.0) {
    return {
      requiredDelta,
      canApproveWithStability: true,
      description: 'Near-perfection. Approve if stable or any improvement.',
    };
  }

  if (currentScore >= 8.0) {
    return {
      requiredDelta,
      canApproveWithStability: true,
      description: `High quality. Target +${requiredDelta.toFixed(1)} delta, but can approve with any positive improvement.`,
    };
  }

  if (currentScore >= 7.5) {
    return {
      requiredDelta,
      canApproveWithStability: false,
      description: `Good quality. Require +${requiredDelta.toFixed(1)} delta to approve.`,
    };
  }

  if (currentScore >= 7.0) {
    return {
      requiredDelta,
      canApproveWithStability: false,
      description: `Moderate quality. Require +${requiredDelta.toFixed(1)} delta to approve.`,
    };
  }

  return {
    requiredDelta,
    canApproveWithStability: false,
    description: `Needs improvement. Require +${requiredDelta.toFixed(1)} delta to approve.`,
  };
}

/**
 * Calculate the gap to target score and estimate iterations needed.
 */
export function estimateIterationsToTarget(
  currentScore: number,
  targetScore: number
): {
  gap: number;
  estimatedIterations: number;
  achievable: boolean;
} {
  const gap = targetScore - currentScore;

  if (gap <= 0) {
    return { gap: 0, estimatedIterations: 0, achievable: true };
  }

  // Estimate based on typical delta at each level
  let score = currentScore;
  let iterations = 0;
  const maxIterations = 20; // Safety limit

  while (score < targetScore && iterations < maxIterations) {
    const expectedDelta = getRequiredDelta(score) * 0.8; // Assume 80% of required delta achieved
    score += expectedDelta;
    iterations++;
  }

  return {
    gap: Math.round(gap * 10) / 10,
    estimatedIterations: iterations,
    achievable: iterations < maxIterations,
  };
}
