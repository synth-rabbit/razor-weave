// src/tooling/w1/strategy-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { StrategyRepository } from './strategy-repository.js';
import type { CreateStrategicPlanInput, StrategyGoal } from './strategy-types.js';

describe('StrategyRepository', () => {
  let db: Database.Database;
  let repo: StrategyRepository;

  const defaultGoal: StrategyGoal = {
    metric_threshold: 8.0,
    primary_dimension: 'overall_score',
    max_cycles: 3,
    max_runs: 3,
    delta_threshold_for_validation: 1.0,
    use_dynamic_deltas: true,
  };

  const createTestPlan = (): CreateStrategicPlanInput => ({
    book_id: 'book_123',
    book_slug: 'test-book',
    workflow_run_id: 'wf_123',
    goal: defaultGoal,
    areas: [
      {
        area_id: 'area-1',
        name: 'Combat Clarity',
        type: 'chapter_cluster',
        target_chapters: ['08-actions.md', '10-combat.md'],
        target_issues: ['CLARITY-001', 'CLARITY-002'],
        target_dimension: 'clarity_readability',
        priority: 1,
      },
      {
        area_id: 'area-2',
        name: 'Character Creation',
        type: 'chapter_cluster',
        target_chapters: ['02-creation.md'],
        target_issues: ['USABILITY-001'],
        target_dimension: 'practical_usability',
        priority: 2,
      },
    ],
  });

  beforeEach(() => {
    db = new Database(':memory:');
    // Create the strategic_plans table
    db.exec(`
      CREATE TABLE strategic_plans (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        book_slug TEXT NOT NULL,
        workflow_run_id TEXT,
        source_analysis_path TEXT,
        goal_json TEXT NOT NULL,
        areas_json TEXT NOT NULL,
        state_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    repo = new StrategyRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('creates a plan with initialized areas and state', () => {
      const input = createTestPlan();
      const plan = repo.create(input);

      expect(plan.id).toMatch(/^strat_/);
      expect(plan.book_id).toBe('book_123');
      expect(plan.areas).toHaveLength(2);
      expect(plan.areas[0].status).toBe('pending');
      expect(plan.areas[0].current_cycle).toBe(0);
      expect(plan.state.current_phase).toBe('planning');
      expect(plan.state.current_run).toBe(1);
      expect(plan.state.max_runs).toBe(3);
      expect(plan.state.runs).toEqual([]);
    });
  });

  describe('updateAreaState', () => {
    it('updates a specific area', () => {
      const input = createTestPlan();
      const plan = repo.create(input);

      const updated = repo.updateAreaState(plan.id, 'area-1', {
        status: 'in_progress',
        current_cycle: 1,
      });

      expect(updated.areas[0].status).toBe('in_progress');
      expect(updated.areas[0].current_cycle).toBe(1);
      expect(updated.areas[1].status).toBe('pending'); // unchanged
    });

    it('throws for non-existent area', () => {
      const plan = repo.create(createTestPlan());

      expect(() => {
        repo.updateAreaState(plan.id, 'non-existent', { status: 'in_progress' });
      }).toThrow('Area "non-existent" not found');
    });
  });

  describe('completeArea', () => {
    it('marks area as completed with delta', () => {
      const plan = repo.create(createTestPlan());

      // Set baseline first
      repo.updateAreaState(plan.id, 'area-1', {
        status: 'in_progress',
        current_cycle: 1,
      });
      repo.updateAreaState(plan.id, 'area-1', {
        current_score: 6.5,
      });

      // Manually set baseline
      const planWithBaseline = repo.getById(plan.id)!;
      planWithBaseline.areas[0].baseline_score = 6.5;
      repo.updateAreas(plan.id, planWithBaseline.areas);

      const completed = repo.completeArea(plan.id, 'area-1', 7.8);

      expect(completed.areas[0].status).toBe('completed');
      expect(completed.areas[0].current_score).toBe(7.8);
      expect(completed.areas[0].delta_achieved).toBeCloseTo(1.3);
    });
  });

  describe('startRun', () => {
    it('starts a new run and resets areas', () => {
      const plan = repo.create(createTestPlan());

      // Mark some areas as in_progress
      repo.updateAreaState(plan.id, 'area-1', { status: 'in_progress', current_cycle: 2 });

      const runNumber = repo.startRun(plan.id, 6.8);

      expect(runNumber).toBe(1);

      const updated = repo.getById(plan.id)!;
      expect(updated.state.current_phase).toBe('parallel_execution');
      expect(updated.state.runs).toHaveLength(1);
      expect(updated.state.runs[0].run_number).toBe(1);
      expect(updated.state.runs[0].baseline_overall).toBe(6.8);
      expect(updated.areas[0].status).toBe('pending');
      expect(updated.areas[0].current_cycle).toBe(0);
    });
  });

  describe('completeRun', () => {
    it('completes the current run with final score', () => {
      const plan = repo.create(createTestPlan());
      repo.startRun(plan.id, 6.8);

      // Complete both areas
      repo.updateAreaState(plan.id, 'area-1', { status: 'completed' });
      repo.updateAreaState(plan.id, 'area-2', { status: 'completed' });

      const completed = repo.completeRun(plan.id, 7.9, true);

      expect(completed.state.current_phase).toBe('validating');
      expect(completed.state.current_overall).toBe(7.9);
      expect(completed.state.runs[0].completed_at).toBeDefined();
      expect(completed.state.runs[0].final_overall).toBe(7.9);
      expect(completed.state.runs[0].areas_completed).toBe(2);
      expect(completed.state.runs[0].passed).toBe(true);
    });
  });

  describe('getAreasByStatus', () => {
    it('returns areas matching the status', () => {
      const plan = repo.create(createTestPlan());
      repo.updateAreaState(plan.id, 'area-1', { status: 'in_progress' });

      const pending = repo.getAreasByStatus(plan.id, 'pending');
      const inProgress = repo.getAreasByStatus(plan.id, 'in_progress');

      expect(pending).toHaveLength(1);
      expect(pending[0].area_id).toBe('area-2');
      expect(inProgress).toHaveLength(1);
      expect(inProgress[0].area_id).toBe('area-1');
    });
  });

  describe('allAreasComplete', () => {
    it('returns false when some areas are not complete', () => {
      const plan = repo.create(createTestPlan());
      repo.updateAreaState(plan.id, 'area-1', { status: 'completed' });

      expect(repo.allAreasComplete(plan.id)).toBe(false);
    });

    it('returns true when all areas are completed or failed', () => {
      const plan = repo.create(createTestPlan());
      repo.updateAreaState(plan.id, 'area-1', { status: 'completed' });
      repo.updateAreaState(plan.id, 'area-2', { status: 'failed' });

      expect(repo.allAreasComplete(plan.id)).toBe(true);
    });
  });

  describe('advanceToNextRun', () => {
    it('increments run counter', () => {
      const plan = repo.create(createTestPlan());

      const advanced = repo.advanceToNextRun(plan.id);
      expect(advanced).toBe(true);

      const updated = repo.getById(plan.id)!;
      expect(updated.state.current_run).toBe(2);
    });

    it('returns false at max runs', () => {
      const plan = repo.create(createTestPlan());

      repo.advanceToNextRun(plan.id);
      repo.advanceToNextRun(plan.id);
      const result = repo.advanceToNextRun(plan.id);

      expect(result).toBe(false);
      const updated = repo.getById(plan.id)!;
      expect(updated.state.current_run).toBe(3); // didn't exceed max
    });
  });

  describe('triggerHumanGate', () => {
    it('sets human gate state', () => {
      const plan = repo.create(createTestPlan());

      const updated = repo.triggerHumanGate(plan.id, 'threshold_met');

      expect(updated.state.current_phase).toBe('human_gate');
      expect(updated.state.human_gate_reason).toBe('threshold_met');
    });
  });

  describe('incrementAreaCycle', () => {
    it('increments cycle and sets status to in_progress', () => {
      const plan = repo.create(createTestPlan());

      const updated = repo.incrementAreaCycle(plan.id, 'area-1');

      expect(updated.areas[0].current_cycle).toBe(1);
      expect(updated.areas[0].status).toBe('in_progress');
    });
  });
});
