// src/tooling/workflows/checkpoint-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { CheckpointManager } from './checkpoint-manager.js';
import type { Checkpoint } from './engine-types.js';

describe('CheckpointManager', () => {
  let db: Database.Database;
  let manager: CheckpointManager;

  beforeEach(() => {
    db = new Database(':memory:');

    // Create minimal schema for testing
    db.exec(`
      CREATE TABLE workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_type TEXT NOT NULL,
        book_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        checkpoint_json TEXT,
        current_step TEXT,
        iteration_counts TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert a test workflow run
    db.prepare(`
      INSERT INTO workflow_runs (id, workflow_type, book_id, status)
      VALUES ('run_test123', 'w1_editing', 'book_core', 'running')
    `).run();

    manager = new CheckpointManager(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a new checkpoint for a workflow run', () => {
      const checkpoint = manager.create('run_test123', 'w1_editing', 'strategic-planning');

      expect(checkpoint.workflowRunId).toBe('run_test123');
      expect(checkpoint.workflowType).toBe('w1_editing');
      expect(checkpoint.currentStep).toBe('strategic-planning');
      expect(checkpoint.completedSteps).toEqual([]);
      expect(checkpoint.iterationCounts).toEqual({});
    });

    it('should persist checkpoint to database', () => {
      manager.create('run_test123', 'w1_editing', 'strategic-planning');

      const row = db.prepare('SELECT checkpoint_json, current_step FROM workflow_runs WHERE id = ?')
        .get('run_test123') as { checkpoint_json: string; current_step: string };

      expect(row.current_step).toBe('strategic-planning');
      expect(row.checkpoint_json).toBeTruthy();

      const parsed = JSON.parse(row.checkpoint_json);
      expect(parsed.workflowRunId).toBe('run_test123');
    });
  });

  describe('load', () => {
    it('should load an existing checkpoint', () => {
      manager.create('run_test123', 'w1_editing', 'strategic-planning');
      const loaded = manager.load('run_test123');

      expect(loaded).not.toBeNull();
      expect(loaded?.workflowRunId).toBe('run_test123');
      expect(loaded?.currentStep).toBe('strategic-planning');
    });

    it('should return null for non-existent workflow run', () => {
      const loaded = manager.load('nonexistent');
      expect(loaded).toBeNull();
    });

    it('should return null for workflow run without checkpoint', () => {
      // Insert a run without checkpoint
      db.prepare(`
        INSERT INTO workflow_runs (id, workflow_type, book_id, status)
        VALUES ('run_no_checkpoint', 'w1_editing', 'book_core', 'pending')
      `).run();

      const loaded = manager.load('run_no_checkpoint');
      expect(loaded).toBeNull();
    });
  });

  describe('recordStepCompletion', () => {
    it('should add completed step to checkpoint', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');

      checkpoint = manager.recordStepCompletion(checkpoint, 'step1', { success: true });

      expect(checkpoint.completedSteps).toHaveLength(1);
      expect(checkpoint.completedSteps[0].step).toBe('step1');
      expect(checkpoint.completedSteps[0].result).toEqual({ success: true });
      expect(checkpoint.completedSteps[0].completedAt).toBeTruthy();
    });

    it('should clear pending retry on success', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');
      checkpoint = manager.recordPendingRetry(checkpoint, 'step1', 'test error', 1);

      expect(checkpoint.pendingRetry).toBeDefined();

      checkpoint = manager.recordStepCompletion(checkpoint, 'step1', { success: true });
      expect(checkpoint.pendingRetry).toBeUndefined();
    });
  });

  describe('setCurrentStep', () => {
    it('should update current step', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');

      checkpoint = manager.setCurrentStep(checkpoint, 'step2');

      expect(checkpoint.currentStep).toBe('step2');

      // Verify persisted
      const loaded = manager.load('run_test123');
      expect(loaded?.currentStep).toBe('step2');
    });
  });

  describe('iteration tracking', () => {
    it('should increment iteration count', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'loop-step');

      expect(manager.getIterationCount(checkpoint, 'loop-step')).toBe(0);

      checkpoint = manager.incrementIteration(checkpoint, 'loop-step');
      expect(manager.getIterationCount(checkpoint, 'loop-step')).toBe(1);

      checkpoint = manager.incrementIteration(checkpoint, 'loop-step');
      expect(manager.getIterationCount(checkpoint, 'loop-step')).toBe(2);
    });

    it('should track iterations per step independently', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');

      checkpoint = manager.incrementIteration(checkpoint, 'step1');
      checkpoint = manager.incrementIteration(checkpoint, 'step1');
      checkpoint = manager.incrementIteration(checkpoint, 'step2');

      expect(manager.getIterationCount(checkpoint, 'step1')).toBe(2);
      expect(manager.getIterationCount(checkpoint, 'step2')).toBe(1);
      expect(manager.getIterationCount(checkpoint, 'step3')).toBe(0);
    });
  });

  describe('pending retry', () => {
    it('should record pending retry', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');

      checkpoint = manager.recordPendingRetry(checkpoint, 'step1', 'Test error', 1);

      expect(checkpoint.pendingRetry).toBeDefined();
      expect(checkpoint.pendingRetry?.step).toBe('step1');
      expect(checkpoint.pendingRetry?.error).toBe('Test error');
      expect(checkpoint.pendingRetry?.attempt).toBe(1);
    });

    it('should clear pending retry', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');
      checkpoint = manager.recordPendingRetry(checkpoint, 'step1', 'Test error', 1);

      checkpoint = manager.clearPendingRetry(checkpoint);

      expect(checkpoint.pendingRetry).toBeUndefined();
    });
  });

  describe('parallel results', () => {
    it('should initialize parallel results', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'parallel-step');

      checkpoint = manager.initializeParallelResults(checkpoint, ['area1', 'area2', 'area3']);

      expect(checkpoint.parallelResults).toBeDefined();
      expect(Object.keys(checkpoint.parallelResults!)).toHaveLength(3);
      expect(checkpoint.parallelResults!['area1'].status).toBe('pending');
      expect(checkpoint.parallelResults!['area2'].status).toBe('pending');
      expect(checkpoint.parallelResults!['area3'].status).toBe('pending');
    });

    it('should record parallel item completion', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'parallel-step');
      checkpoint = manager.initializeParallelResults(checkpoint, ['area1', 'area2']);

      checkpoint = manager.recordParallelItemCompletion(checkpoint, 'area1', { modified: true });

      expect(checkpoint.parallelResults!['area1'].status).toBe('completed');
      expect(checkpoint.parallelResults!['area1'].result).toEqual({ modified: true });
      expect(checkpoint.parallelResults!['area2'].status).toBe('pending');
    });

    it('should record parallel item failure', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'parallel-step');
      checkpoint = manager.initializeParallelResults(checkpoint, ['area1']);

      checkpoint = manager.recordParallelItemFailure(checkpoint, 'area1', 'Connection failed');

      expect(checkpoint.parallelResults!['area1'].status).toBe('failed');
      expect(checkpoint.parallelResults!['area1'].error).toBe('Connection failed');
      expect(checkpoint.parallelResults!['area1'].retryCount).toBe(1);
    });

    it('should get parallel status', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'parallel-step');
      checkpoint = manager.initializeParallelResults(checkpoint, ['a', 'b', 'c']);

      checkpoint = manager.recordParallelItemCompletion(checkpoint, 'a', {});
      checkpoint = manager.recordParallelItemFailure(checkpoint, 'b', 'error');

      const status = manager.getParallelStatus(checkpoint);

      expect(status).toBeDefined();
      expect(status?.total).toBe(3);
      expect(status?.completed).toBe(1);
      expect(status?.failed).toEqual(['b']);
      expect(status?.pending).toEqual(['c']);
    });

    it('should clear parallel results', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'parallel-step');
      checkpoint = manager.initializeParallelResults(checkpoint, ['area1']);

      checkpoint = manager.clearParallelResults(checkpoint);

      expect(checkpoint.parallelResults).toBeUndefined();
    });
  });

  describe('gate decisions', () => {
    it('should record gate decision', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'human-gate');

      checkpoint = manager.recordGateDecision(checkpoint, 'human-gate', 'approve', 'Looks good!');

      expect(checkpoint.gateDecision).toBeDefined();
      expect(checkpoint.gateDecision?.gate).toBe('human-gate');
      expect(checkpoint.gateDecision?.option).toBe('approve');
      expect(checkpoint.gateDecision?.input).toBe('Looks good!');
    });

    it('should clear gate decision', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'human-gate');
      checkpoint = manager.recordGateDecision(checkpoint, 'human-gate', 'approve');

      checkpoint = manager.clearGateDecision(checkpoint);

      expect(checkpoint.gateDecision).toBeUndefined();
    });
  });

  describe('data storage', () => {
    it('should set and get data', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');

      checkpoint = manager.setData(checkpoint, 'improvementAreas', ['clarity', 'examples']);

      const areas = manager.getData<string[]>(checkpoint, 'improvementAreas');
      expect(areas).toEqual(['clarity', 'examples']);
    });

    it('should return undefined for non-existent data', () => {
      const checkpoint = manager.create('run_test123', 'w1_editing', 'step1');

      const result = manager.getData(checkpoint, 'nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('step result helpers', () => {
    it('should get step result', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');
      checkpoint = manager.recordStepCompletion(checkpoint, 'step1', { value: 42 });

      const result = manager.getStepResult(checkpoint, 'step1');
      expect(result).toEqual({ value: 42 });
    });

    it('should return undefined for non-completed step', () => {
      const checkpoint = manager.create('run_test123', 'w1_editing', 'step1');

      const result = manager.getStepResult(checkpoint, 'step1');
      expect(result).toBeUndefined();
    });

    it('should check if step is completed', () => {
      let checkpoint = manager.create('run_test123', 'w1_editing', 'step1');

      expect(manager.isStepCompleted(checkpoint, 'step1')).toBe(false);

      checkpoint = manager.recordStepCompletion(checkpoint, 'step1', {});

      expect(manager.isStepCompleted(checkpoint, 'step1')).toBe(true);
      expect(manager.isStepCompleted(checkpoint, 'step2')).toBe(false);
    });
  });
});
