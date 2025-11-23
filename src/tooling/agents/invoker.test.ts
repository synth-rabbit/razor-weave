import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VPInvoker, VPInvocationResult } from './invoker';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-invoker-events';

describe('VPInvoker', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
  });

  describe('prepareProductInvocation', () => {
    it('should prepare VP Product invocation context', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const context = invoker.prepareProductInvocation({
        proposalPath: 'docs/proposals/test.md',
        proposalContent: '# Test Proposal\n\nDo something.',
        sessionId: 'sess_123',
      });

      expect(context.vpType).toBe('product');
      expect(context.prompt).toContain('VP of Product');
      expect(context.prompt).toContain('Test Proposal');
      expect(context.prompt).toContain('sess_123');
    });
  });

  describe('prepareEngineeringInvocation', () => {
    it('should prepare VP Engineering invocation context', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const context = invoker.prepareEngineeringInvocation({
        sessionId: 'sess_123',
        productPlan: {
          phases: [{ name: 'Phase 1', description: 'First' }],
        },
        ceoFeedback: 'Approved.',
      });

      expect(context.vpType).toBe('engineering');
      expect(context.prompt).toContain('VP of Engineering');
      expect(context.prompt).toContain('Phase 1');
      expect(context.prompt).toContain('Approved');
    });
  });

  describe('prepareOpsInvocation', () => {
    it('should prepare VP Operations invocation context', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const context = invoker.prepareOpsInvocation({
        sessionId: 'sess_123',
        productPlan: { phases: [] },
        engineeringPlan: { tasks: [] },
        ceoFeedback: 'All good.',
      });

      expect(context.vpType).toBe('ops');
      expect(context.prompt).toContain('VP of Operations');
    });

    it('should prepare VP Ops brainstorm invocation', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const context = invoker.prepareOpsInvocation({
        sessionId: 'sess_123',
        brainstormMode: true,
        question: 'Which option?',
        options: ['A', 'B', 'C'],
      });

      expect(context.prompt).toContain('brainstorm');
      expect(context.prompt).toContain('Which option');
      expect(context.prompt).toContain('A)');
    });
  });

  describe('processProductOutput', () => {
    it('should parse and store VP Product output', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const output = `
## PHASES

### Phase 1: Foundation
Description: Build the base
Sequence: 1
Acceptance Criteria:
- Tests pass
- Coverage 80%

## MILESTONES

### Milestone 1.1: Setup
Description: Initial setup
Phase: Phase 1
Sequence: 1

## RISKS

### Risk 1
Description: May take longer
Mitigation: Start early
Severity: medium
`;

      const result = invoker.processProductOutput('sess_123', 'plan_123', output);

      expect(result.success).toBe(true);
      expect(result.phases).toHaveLength(1);
      expect(result.phases![0].name).toBe('Phase 1: Foundation');
      expect(result.milestones).toHaveLength(1);
      expect(result.risks).toHaveLength(1);
    });

    it('should write events to event log', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const output = `
## PHASES

### Phase 1: Test
Description: A test phase
Sequence: 1
Acceptance Criteria:
- Done
`;

      invoker.processProductOutput('sess_123', 'plan_123', output);

      // Check event file was created
      const files = require('fs').readdirSync(TEST_EVENTS_DIR);
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toMatch(/\.jsonl$/);

      // Check content
      const content = readFileSync(join(TEST_EVENTS_DIR, files[0]), 'utf-8');
      expect(content).toContain('phases');
    });
  });

  describe('processEngineeringOutput', () => {
    it('should parse and store VP Engineering output', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const output = `
## TASKS

### Task 1: Implement feature
Milestone: ms_123
File Paths: src/feature.ts, src/feature.test.ts
Dependencies: none
Test Requirements: Unit tests for all functions

## ARCHITECTURE NOTES

- Use event sourcing
- Keep it simple
`;

      const result = invoker.processEngineeringOutput('sess_123', 'plan_123', output);

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks![0].description).toContain('Implement feature');
      expect(result.tasks![0].file_paths).toContain('src/feature.ts');
    });
  });

  describe('processOpsOutput', () => {
    it('should parse and store VP Ops output', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const output = `
## SCHEDULE

### Checkpoint 1: Review
Criteria: All phases complete

## OPERATIONAL CONCERNS

### Blocker: Database migration
Need to ensure data integrity

### Parallelization
Tasks 1 and 2 can run in parallel
`;

      const result = invoker.processOpsOutput('sess_123', output);

      expect(result.success).toBe(true);
      expect(result.checkpoints).toHaveLength(1);
      expect(result.concerns).toBeDefined();
    });
  });

  describe('processOpsBrainstormOutput', () => {
    it('should parse VP Ops brainstorm response', () => {
      const invoker = new VPInvoker(TEST_EVENTS_DIR, 'main');

      const output = `
## ANALYSIS

Option A: Good for simplicity
Option B: Better for scale
Option C: Most flexible

## BLOCKERS

Option C is operationally infeasible due to complexity.

## RECOMMENDATION

Option B

## REASONING

Best balance of simplicity and scalability.
`;

      const result = invoker.processOpsBrainstormOutput('sess_123', output);

      expect(result.success).toBe(true);
      expect(result.blockers).toContain('Option C');
      expect(result.recommendation).toBe('Option B');
      expect(result.reasoning).toContain('simplicity');
    });
  });
});
