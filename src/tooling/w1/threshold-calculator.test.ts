import { describe, it, expect } from 'vitest';
import {
  getRequiredDelta,
  meetsThreshold,
  shouldApprove,
  getApprovalCriteria,
  estimateIterationsToTarget,
} from './threshold-calculator.js';

describe('getRequiredDelta', () => {
  it('returns 1.0 for scores below 7.0', () => {
    expect(getRequiredDelta(6.0)).toBe(1.0);
    expect(getRequiredDelta(6.5)).toBe(1.0);
    expect(getRequiredDelta(6.9)).toBe(1.0);
  });

  it('returns 0.7 for scores 7.0-7.5', () => {
    expect(getRequiredDelta(7.0)).toBe(0.7);
    expect(getRequiredDelta(7.2)).toBe(0.7);
    expect(getRequiredDelta(7.4)).toBe(0.7);
  });

  it('returns 0.5 for scores 7.5-8.0', () => {
    expect(getRequiredDelta(7.5)).toBe(0.5);
    expect(getRequiredDelta(7.7)).toBe(0.5);
    expect(getRequiredDelta(7.9)).toBe(0.5);
  });

  it('returns 0.3 for scores 8.0-8.5', () => {
    expect(getRequiredDelta(8.0)).toBe(0.3);
    expect(getRequiredDelta(8.2)).toBe(0.3);
    expect(getRequiredDelta(8.4)).toBe(0.3);
  });

  it('returns 0.2 for scores 8.5-9.0', () => {
    expect(getRequiredDelta(8.5)).toBe(0.2);
    expect(getRequiredDelta(8.7)).toBe(0.2);
    expect(getRequiredDelta(8.9)).toBe(0.2);
  });

  it('returns 0.1 for scores 9.0+', () => {
    expect(getRequiredDelta(9.0)).toBe(0.1);
    expect(getRequiredDelta(9.5)).toBe(0.1);
    expect(getRequiredDelta(10.0)).toBe(0.1);
  });
});

describe('meetsThreshold', () => {
  it('returns true when delta meets requirement', () => {
    expect(meetsThreshold(6.5, 1.0)).toBe(true);
    expect(meetsThreshold(6.5, 1.5)).toBe(true);
    expect(meetsThreshold(8.0, 0.3)).toBe(true);
  });

  it('returns false when delta below requirement', () => {
    expect(meetsThreshold(6.5, 0.9)).toBe(false);
    expect(meetsThreshold(7.0, 0.5)).toBe(false);
    expect(meetsThreshold(8.0, 0.2)).toBe(false);
  });
});

describe('shouldApprove', () => {
  describe('below 8.0 baseline', () => {
    it('approves when delta meets threshold', () => {
      const result = shouldApprove(6.5, 7.5); // delta 1.0, threshold 1.0
      expect(result.approved).toBe(true);
    });

    it('rejects when delta below threshold', () => {
      const result = shouldApprove(6.5, 7.3); // delta 0.8, threshold 1.0
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('below threshold');
    });

    it('rejects with regressions', () => {
      const result = shouldApprove(6.5, 7.5, { regressions: ['clarity'] });
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('Regressions');
    });
  });

  describe('at 8.0+ baseline with stability approval', () => {
    it('approves with any positive delta', () => {
      const result = shouldApprove(8.0, 8.1); // delta 0.1, threshold 0.3
      expect(result.approved).toBe(true);
      expect(result.reason).toContain('improvement');
    });

    it('rejects with zero or negative delta', () => {
      const result = shouldApprove(8.0, 8.0);
      expect(result.approved).toBe(false);
    });

    it('can disable stability approval', () => {
      const result = shouldApprove(8.0, 8.1, { allowStabilityApproval: false });
      expect(result.approved).toBe(false);
    });
  });

  describe('at 9.0+ baseline (maintenance mode)', () => {
    it('approves when stable', () => {
      const result = shouldApprove(9.0, 9.0);
      expect(result.approved).toBe(true);
      expect(result.reason).toContain('Maintenance mode');
    });

    it('approves with tiny improvement', () => {
      const result = shouldApprove(9.0, 9.05);
      expect(result.approved).toBe(true);
    });

    it('rejects with regression', () => {
      const result = shouldApprove(9.0, 8.9, { regressions: ['clarity'] });
      expect(result.approved).toBe(false);
    });
  });
});

describe('getApprovalCriteria', () => {
  it('returns correct criteria for low scores', () => {
    const criteria = getApprovalCriteria(6.5);
    expect(criteria.requiredDelta).toBe(1.0);
    expect(criteria.canApproveWithStability).toBe(false);
    expect(criteria.description).toContain('Needs improvement');
  });

  it('returns correct criteria for high scores', () => {
    const criteria = getApprovalCriteria(8.5);
    expect(criteria.requiredDelta).toBe(0.2);
    expect(criteria.canApproveWithStability).toBe(true);
    expect(criteria.description).toContain('High quality');
  });

  it('returns maintenance criteria for 9.0+', () => {
    const criteria = getApprovalCriteria(9.0);
    expect(criteria.requiredDelta).toBe(0.1);
    expect(criteria.canApproveWithStability).toBe(true);
    expect(criteria.description).toContain('Near-perfection');
  });
});

describe('estimateIterationsToTarget', () => {
  it('returns 0 iterations when already at target', () => {
    const result = estimateIterationsToTarget(8.0, 8.0);
    expect(result.gap).toBe(0);
    expect(result.estimatedIterations).toBe(0);
    expect(result.achievable).toBe(true);
  });

  it('estimates iterations for achievable targets', () => {
    const result = estimateIterationsToTarget(6.5, 8.0);
    expect(result.gap).toBe(1.5);
    expect(result.estimatedIterations).toBeGreaterThan(0);
    expect(result.achievable).toBe(true);
  });

  it('handles edge cases', () => {
    const result = estimateIterationsToTarget(9.5, 10.0);
    expect(result.gap).toBe(0.5);
    expect(result.achievable).toBe(true);
  });
});
