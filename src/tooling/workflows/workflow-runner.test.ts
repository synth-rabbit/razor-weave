// src/tooling/workflows/workflow-runner.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { WorkflowRunner } from './workflow-runner.js';
import { defineWorkflow, type WorkflowDefinition } from './engine-types.js';

describe('WorkflowRunner', () => {
  let db: Database.Database;
  let runner: WorkflowRunner;
  let testWorkflow: WorkflowDefinition;

  beforeEach(() => {
    db = new Database(':memory:');

    // Create schema
    db.exec(`
      CREATE TABLE books (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        book_type TEXT NOT NULL,
        source_path TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE book_versions (
        content_id TEXT PRIMARY KEY,
        book_path TEXT NOT NULL,
        book_id TEXT,
        workflow_run_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_type TEXT NOT NULL,
        book_id TEXT NOT NULL,
        input_version_id TEXT,
        output_version_id TEXT,
        session_id TEXT,
        plan_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        current_agent TEXT,
        checkpoint_json TEXT,
        current_step TEXT,
        iteration_counts TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE strategic_plans (
        id TEXT PRIMARY KEY,
        workflow_run_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE workflow_artifacts (
        id TEXT PRIMARY KEY,
        workflow_run_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert test book
    db.prepare(`
      INSERT INTO books (id, slug, title, book_type, source_path, status)
      VALUES ('book_test', 'test-book', 'Test Book', 'core', 'books/test', 'editing')
    `).run();

    // Define test workflow
    testWorkflow = defineWorkflow({
      type: 'test_workflow',
      name: 'Test Workflow',
      initialStep: 'step1',
      steps: [
        {
          name: 'step1',
          command: 'test:step1',
          preconditions: [],
          postconditions: [],
          next: 'step2',
        },
        {
          name: 'step2',
          command: 'test:step2',
          preconditions: [],
          postconditions: [],
          next: null,
        },
      ],
    });

    runner = new WorkflowRunner({
      db,
      workflows: new Map([['test_workflow', testWorkflow]]),
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('start', () => {
    it('should start a new workflow run', async () => {
      const result = await runner.start('test_workflow', 'book_test');

      expect(result.runId).toMatch(/^wfrun_/);
      expect(result.status).toBe('running');
      expect(result.currentStep).toBe('step1');
      expect(result.resumeContext.workflowType).toBe('test_workflow');
      expect(result.resumeContext.completedSteps).toEqual([]);
    });

    it('should throw for unknown workflow type', async () => {
      await expect(runner.start('unknown_workflow', 'book_test')).rejects.toThrow(
        'Unknown workflow type: unknown_workflow'
      );
    });

    it('should create workflow run record in database', async () => {
      const result = await runner.start('test_workflow', 'book_test');

      const run = db
        .prepare('SELECT * FROM workflow_runs WHERE id = ?')
        .get(result.runId) as Record<string, unknown>;

      expect(run.workflow_type).toBe('test_workflow');
      expect(run.book_id).toBe('book_test');
      expect(run.status).toBe('running');
    });

    it('should create checkpoint in database', async () => {
      const result = await runner.start('test_workflow', 'book_test');

      const run = db
        .prepare('SELECT checkpoint_json, current_step FROM workflow_runs WHERE id = ?')
        .get(result.runId) as { checkpoint_json: string; current_step: string };

      expect(run.current_step).toBe('step1');
      expect(run.checkpoint_json).toBeTruthy();

      const checkpoint = JSON.parse(run.checkpoint_json);
      expect(checkpoint.currentStep).toBe('step1');
    });
  });

  describe('resume', () => {
    it('should resume a paused workflow', async () => {
      const startResult = await runner.start('test_workflow', 'book_test');

      // Simulate step completion and pause
      await runner.processStepResult(startResult.runId, {
        success: true,
        result: { data: 'step1 result' },
        postconditionsPassed: true,
      });

      // Resume should continue at step2
      const state = runner.getState(startResult.runId);
      expect(state?.currentStep).toBe('step2');
    });

    it('should throw for non-existent workflow run', async () => {
      await expect(runner.resume('nonexistent_run')).rejects.toThrow(
        'No checkpoint found for workflow run: nonexistent_run'
      );
    });
  });

  describe('processStepResult', () => {
    it('should record step completion and advance', async () => {
      const startResult = await runner.start('test_workflow', 'book_test');

      const nextResult = await runner.processStepResult(startResult.runId, {
        success: true,
        result: { data: 'step1 result' },
        postconditionsPassed: true,
      });

      expect(nextResult.currentStep).toBe('step2');
      expect(nextResult.resumeContext.completedSteps).toContain('step1');
    });

    it('should complete workflow when reaching terminal step', async () => {
      const startResult = await runner.start('test_workflow', 'book_test');

      // Complete step1
      await runner.processStepResult(startResult.runId, {
        success: true,
        result: {},
        postconditionsPassed: true,
      });

      // Complete step2 (terminal)
      const finalResult = await runner.processStepResult(startResult.runId, {
        success: true,
        result: {},
        postconditionsPassed: true,
      });

      expect(finalResult.status).toBe('completed');
    });

    it('should handle postcondition failure with retry', async () => {
      const startResult = await runner.start('test_workflow', 'book_test');

      // First failure - should retry
      const retryResult = await runner.processStepResult(startResult.runId, {
        success: false,
        error: 'Test error',
        postconditionsPassed: false,
      });

      // Should still be running (retry in progress)
      expect(retryResult.status).toBe('running');
      expect(retryResult.currentStep).toBe('step1');
    });

    it('should escalate after max retries', async () => {
      const startResult = await runner.start('test_workflow', 'book_test');

      // First failure
      await runner.processStepResult(startResult.runId, {
        success: false,
        error: 'Test error',
        postconditionsPassed: false,
      });

      // Second failure - should escalate
      const escalateResult = await runner.processStepResult(startResult.runId, {
        success: false,
        error: 'Test error again',
        postconditionsPassed: false,
      });

      expect(escalateResult.status).toBe('paused');
      expect(escalateResult.error).toContain('Escalated to human');
    });
  });

  describe('human gates', () => {
    let gateWorkflow: WorkflowDefinition;

    beforeEach(() => {
      gateWorkflow = defineWorkflow({
        type: 'gate_workflow',
        name: 'Gate Workflow',
        initialStep: 'work',
        steps: [
          {
            name: 'work',
            command: 'test:work',
            preconditions: [],
            postconditions: [],
            next: 'review',
          },
          {
            name: 'review',
            command: 'test:review',
            preconditions: [],
            postconditions: [],
            humanGate: {
              prompt: 'Approve the changes?',
              context: ['metrics'],
              options: [
                { label: 'Approve', nextStep: 'finalize' },
                { label: 'Reject', nextStep: null },
                { label: 'Request changes', nextStep: 'work', requiresInput: true },
              ],
            },
          },
          {
            name: 'finalize',
            command: 'test:finalize',
            preconditions: [],
            postconditions: [],
            next: null,
          },
        ],
      });

      runner = new WorkflowRunner({
        db,
        workflows: new Map([['gate_workflow', gateWorkflow]]),
      });
    });

    it('should pause at human gate', async () => {
      const startResult = await runner.start('gate_workflow', 'book_test');

      // Complete work step to reach gate
      await runner.processStepResult(startResult.runId, {
        success: true,
        result: {},
        postconditionsPassed: true,
      });

      const gateResult = await runner.resume(startResult.runId);

      expect(gateResult.status).toBe('awaiting_human');
      expect(gateResult.humanGate?.prompt).toBe('Approve the changes?');
      expect(gateResult.humanGate?.options).toHaveLength(3);
    });

    it('should handle gate approval', async () => {
      const startResult = await runner.start('gate_workflow', 'book_test');

      // Complete work step
      await runner.processStepResult(startResult.runId, {
        success: true,
        result: {},
        postconditionsPassed: true,
      });

      // Handle approval
      const approveResult = await runner.handleGateDecision(
        startResult.runId,
        'Approve'
      );

      expect(approveResult.status).toBe('running');
      expect(approveResult.currentStep).toBe('finalize');
    });

    it('should handle gate rejection (end workflow)', async () => {
      const startResult = await runner.start('gate_workflow', 'book_test');

      // Complete work step
      await runner.processStepResult(startResult.runId, {
        success: true,
        result: {},
        postconditionsPassed: true,
      });

      // Handle rejection
      const rejectResult = await runner.handleGateDecision(
        startResult.runId,
        'Reject'
      );

      expect(rejectResult.status).toBe('completed');
    });

    it('should handle gate request for changes (loop back)', async () => {
      const startResult = await runner.start('gate_workflow', 'book_test');

      // Complete work step
      await runner.processStepResult(startResult.runId, {
        success: true,
        result: {},
        postconditionsPassed: true,
      });

      // Request changes
      const changesResult = await runner.handleGateDecision(
        startResult.runId,
        'Request changes',
        'Please fix the typos'
      );

      expect(changesResult.status).toBe('running');
      expect(changesResult.currentStep).toBe('work');
    });
  });

  describe('conditional branching', () => {
    let branchWorkflow: WorkflowDefinition;

    beforeEach(() => {
      branchWorkflow = defineWorkflow({
        type: 'branch_workflow',
        name: 'Branch Workflow',
        initialStep: 'check',
        steps: [
          {
            name: 'check',
            command: 'test:check',
            preconditions: [],
            postconditions: [],
            next: {
              condition: 'result.approved === "yes"',
              onTrue: 'success',
              onFalse: 'failure',
            },
          },
          {
            name: 'success',
            command: 'test:success',
            preconditions: [],
            postconditions: [],
            next: null,
          },
          {
            name: 'failure',
            command: 'test:failure',
            preconditions: [],
            postconditions: [],
            next: null,
          },
        ],
      });

      runner = new WorkflowRunner({
        db,
        workflows: new Map([['branch_workflow', branchWorkflow]]),
      });
    });

    it('should follow onTrue branch when condition is met', async () => {
      const startResult = await runner.start('branch_workflow', 'book_test');

      const nextResult = await runner.processStepResult(startResult.runId, {
        success: true,
        result: { approved: 'yes' },
        postconditionsPassed: true,
      });

      expect(nextResult.currentStep).toBe('success');
    });

    it('should follow onFalse branch when condition is not met', async () => {
      const startResult = await runner.start('branch_workflow', 'book_test');

      const nextResult = await runner.processStepResult(startResult.runId, {
        success: true,
        result: { approved: 'no' },
        postconditionsPassed: true,
      });

      expect(nextResult.currentStep).toBe('failure');
    });

    it('should use nextStepHint when provided', async () => {
      const startResult = await runner.start('branch_workflow', 'book_test');

      const nextResult = await runner.processStepResult(startResult.runId, {
        success: true,
        result: { approved: 'no' }, // Would normally go to failure
        postconditionsPassed: true,
        nextStepHint: 'success', // But hint overrides
      });

      expect(nextResult.currentStep).toBe('success');
    });
  });

  describe('loop iteration limits', () => {
    let loopWorkflow: WorkflowDefinition;

    beforeEach(() => {
      loopWorkflow = defineWorkflow({
        type: 'loop_workflow',
        name: 'Loop Workflow',
        initialStep: 'iterate',
        steps: [
          {
            name: 'iterate',
            command: 'test:iterate',
            preconditions: [],
            postconditions: [],
            next: {
              condition: 'result.continue === true',
              onTrue: 'iterate',
              onFalse: 'done',
              maxIterations: 3,
            },
          },
          {
            name: 'done',
            command: 'test:done',
            preconditions: [],
            postconditions: [],
            next: null,
          },
        ],
      });

      runner = new WorkflowRunner({
        db,
        workflows: new Map([['loop_workflow', loopWorkflow]]),
      });
    });

    it('should respect maxIterations limit', async () => {
      const startResult = await runner.start('loop_workflow', 'book_test');

      // Iteration 1
      let result = await runner.processStepResult(startResult.runId, {
        success: true,
        result: { continue: true },
        postconditionsPassed: true,
      });
      expect(result.currentStep).toBe('iterate');

      // Iteration 2
      result = await runner.processStepResult(startResult.runId, {
        success: true,
        result: { continue: true },
        postconditionsPassed: true,
      });
      expect(result.currentStep).toBe('iterate');

      // Iteration 3
      result = await runner.processStepResult(startResult.runId, {
        success: true,
        result: { continue: true },
        postconditionsPassed: true,
      });
      expect(result.currentStep).toBe('iterate');

      // Iteration 4 - should break to 'done' despite continue=true
      result = await runner.processStepResult(startResult.runId, {
        success: true,
        result: { continue: true },
        postconditionsPassed: true,
      });
      expect(result.currentStep).toBe('done');
    });
  });

  describe('getState', () => {
    it('should return current workflow state', async () => {
      const startResult = await runner.start('test_workflow', 'book_test');

      const state = runner.getState(startResult.runId);

      expect(state).not.toBeNull();
      expect(state?.runId).toBe(startResult.runId);
      expect(state?.currentStep).toBe('step1');
      expect(state?.status).toBe('running');
    });

    it('should return null for non-existent run', () => {
      const state = runner.getState('nonexistent');
      expect(state).toBeNull();
    });
  });
});
