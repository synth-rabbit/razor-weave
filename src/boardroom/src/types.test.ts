// src/tooling/boardroom/types.test.ts
import { describe, it, expect } from 'vitest';
import type { BoardroomSession, VPPlan, Phase, VPType } from './types';

describe('Boardroom Types', () => {
  it('should accept valid BoardroomSession', () => {
    const session: BoardroomSession = {
      id: 'sess_001',
      proposal_path: 'docs/plans/proposals/test.md',
      status: 'active',
      created_at: '2024-11-22T10:00:00Z',
      completed_at: null
    };
    expect(session.status).toBe('active');
  });

  it('should accept valid VPPlan', () => {
    const plan: VPPlan = {
      id: 'plan_001',
      session_id: 'sess_001',
      vp_type: 'product',
      status: 'draft',
      plan_path: null,
      created_at: '2024-11-22T10:00:00Z'
    };
    expect(plan.vp_type).toBe('product');
  });

  it('should enforce VPType union', () => {
    const types: VPType[] = ['product', 'engineering', 'ops'];
    expect(types).toHaveLength(3);
  });

  it('should accept valid Phase with JSON acceptance_criteria', () => {
    const phase: Phase = {
      id: 'phase_001',
      plan_id: 'plan_001',
      name: 'Phase 1',
      description: 'First phase',
      sequence: 1,
      acceptance_criteria: JSON.stringify(['criterion 1', 'criterion 2'])
    };
    expect(JSON.parse(phase.acceptance_criteria)).toHaveLength(2);
  });
});
