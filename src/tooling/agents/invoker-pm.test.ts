import { describe, it, expect } from 'vitest';
import { PMInvoker, ImprovementPlan } from './invoker-pm';

describe('PMInvoker', () => {
  it('should have correct interface structure', () => {
    const invoker = new PMInvoker();
    expect(invoker).toBeDefined();
    expect(typeof invoker.invoke).toBe('function');
  });

  it('should define ImprovementPlan type correctly', () => {
    const plan: ImprovementPlan = {
      plan_id: 'test-123',
      created_at: new Date().toISOString(),
      summary: 'Test plan',
      target_issues: [],
      chapter_modifications: [],
      constraints: {
        max_chapters_modified: 5,
        preserve_structure: true,
        follow_style_guides: true
      },
      estimated_impact: 'Test impact'
    };
    expect(plan.plan_id).toBe('test-123');
  });
});
