// src/tooling/w1/strategy-repository.ts
import type Database from 'better-sqlite3';
import { DatabaseError } from '../errors/index.js';
import type {
  StrategicPlan,
  StrategicPlanRow,
  CreateStrategicPlanInput,
  StrategyState,
  StrategyStatus,
  ImprovementArea,
  AreaStatus,
  AreaUpdateInput,
  Run,
} from './strategy-types.js';

/**
 * Generate a unique strategic plan ID
 */
function generatePlanId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `strat_${timestamp}${random}`;
}

/**
 * Repository for managing strategic plans in the database.
 */
export class StrategyRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Get a strategic plan by ID.
   */
  getById(id: string): StrategicPlan | null {
    try {
      const stmt = this.db.prepare(`
        SELECT id, book_id, book_slug, workflow_run_id, source_analysis_path,
               goal_json, areas_json, state_json, status, created_at, updated_at
        FROM strategic_plans
        WHERE id = ?
      `);

      const row = stmt.get(id) as StrategicPlanRow | undefined;
      if (!row) return null;

      return this.rowToPlan(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get strategic plan "${id}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get active strategic plan for a book.
   */
  getActiveForBook(bookId: string): StrategicPlan | null {
    try {
      const stmt = this.db.prepare(`
        SELECT id, book_id, book_slug, workflow_run_id, source_analysis_path,
               goal_json, areas_json, state_json, status, created_at, updated_at
        FROM strategic_plans
        WHERE book_id = ? AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `);

      const row = stmt.get(bookId) as StrategicPlanRow | undefined;
      if (!row) return null;

      return this.rowToPlan(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get active plan for book "${bookId}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List strategic plans with optional filters.
   */
  list(filters?: { bookId?: string; status?: StrategyStatus }): StrategicPlan[] {
    try {
      let sql = `
        SELECT id, book_id, book_slug, workflow_run_id, source_analysis_path,
               goal_json, areas_json, state_json, status, created_at, updated_at
        FROM strategic_plans
        WHERE 1=1
      `;
      const params: unknown[] = [];

      if (filters?.bookId) {
        sql += ' AND book_id = ?';
        params.push(filters.bookId);
      }
      if (filters?.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }

      sql += ' ORDER BY created_at DESC';

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as StrategicPlanRow[];

      return rows.map(row => this.rowToPlan(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to list strategic plans: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a new strategic plan.
   */
  create(input: CreateStrategicPlanInput): StrategicPlan {
    try {
      const id = generatePlanId();
      const now = new Date().toISOString();

      // Initialize areas with default status and cycle tracking
      const areas = input.areas.map(area => ({
        ...area,
        status: 'pending' as const,
        current_cycle: 0,
        max_cycles: area.max_cycles ?? 3,
        chapters_modified: [],
      }));

      // Initialize state with new parallel execution fields
      const state: StrategyState = {
        current_phase: 'planning',
        // New parallel execution fields
        current_run: 1,
        max_runs: input.goal.max_runs ?? 3,
        runs: [],
        // Overall progress tracking
        cumulative_delta: 0,
        // Legacy fields for backward compatibility
        current_area_index: 0,
        areas_completed: [],
        current_cycle: 1,
        validation_cycles: [],
        last_updated: now,
      };

      const stmt = this.db.prepare(`
        INSERT INTO strategic_plans (
          id, book_id, book_slug, workflow_run_id, source_analysis_path,
          goal_json, areas_json, state_json, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `);

      stmt.run(
        id,
        input.book_id,
        input.book_slug,
        input.workflow_run_id ?? null,
        input.source_analysis_path ?? null,
        JSON.stringify(input.goal),
        JSON.stringify(areas),
        JSON.stringify(state),
        now,
        now
      );

      const created = this.getById(id);
      if (!created) {
        throw new DatabaseError('Strategic plan was created but could not be retrieved');
      }

      return created;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Failed to create strategic plan: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update the state of a strategic plan.
   */
  updateState(id: string, state: StrategyState): StrategicPlan {
    try {
      const now = new Date().toISOString();
      state.last_updated = now;

      const stmt = this.db.prepare(`
        UPDATE strategic_plans
        SET state_json = ?, updated_at = ?
        WHERE id = ?
      `);

      const result = stmt.run(JSON.stringify(state), now, id);
      if (result.changes === 0) {
        throw new DatabaseError(`Strategic plan "${id}" not found`);
      }

      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError('Strategic plan was updated but could not be retrieved');
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Failed to update strategic plan state: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update the status of a strategic plan.
   */
  updateStatus(id: string, status: StrategyStatus): StrategicPlan {
    try {
      const now = new Date().toISOString();

      const stmt = this.db.prepare(`
        UPDATE strategic_plans
        SET status = ?, updated_at = ?
        WHERE id = ?
      `);

      const result = stmt.run(status, now, id);
      if (result.changes === 0) {
        throw new DatabaseError(`Strategic plan "${id}" not found`);
      }

      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError('Strategic plan was updated but could not be retrieved');
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Failed to update strategic plan status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update areas of a strategic plan.
   */
  updateAreas(id: string, areas: StrategicPlan['areas']): StrategicPlan {
    try {
      const now = new Date().toISOString();

      const stmt = this.db.prepare(`
        UPDATE strategic_plans
        SET areas_json = ?, updated_at = ?
        WHERE id = ?
      `);

      const result = stmt.run(JSON.stringify(areas), now, id);
      if (result.changes === 0) {
        throw new DatabaseError(`Strategic plan "${id}" not found`);
      }

      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError('Strategic plan was updated but could not be retrieved');
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Failed to update strategic plan areas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ============================================================
  // Parallel Execution Methods
  // ============================================================

  /**
   * Update a specific area's state within a strategic plan.
   */
  updateAreaState(planId: string, areaId: string, updates: AreaUpdateInput): StrategicPlan {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    const areaIndex = plan.areas.findIndex(a => a.area_id === areaId);
    if (areaIndex === -1) {
      throw new DatabaseError(`Area "${areaId}" not found in plan "${planId}"`);
    }

    // Apply updates to the area
    const updatedArea = { ...plan.areas[areaIndex], ...updates };
    const updatedAreas = [...plan.areas];
    updatedAreas[areaIndex] = updatedArea;

    return this.updateAreas(planId, updatedAreas);
  }

  /**
   * Mark an area as complete with its final score.
   */
  completeArea(planId: string, areaId: string, finalScore: number): StrategicPlan {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    const area = plan.areas.find(a => a.area_id === areaId);
    if (!area) {
      throw new DatabaseError(`Area "${areaId}" not found in plan "${planId}"`);
    }

    const deltaAchieved = area.baseline_score !== undefined
      ? finalScore - area.baseline_score
      : 0;

    return this.updateAreaState(planId, areaId, {
      status: 'completed',
      current_score: finalScore,
      delta_achieved: deltaAchieved,
    });
  }

  /**
   * Start a new run for parallel execution.
   * Returns the run number.
   */
  startRun(planId: string, baselineOverall: number): number {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    const runNumber = plan.state.current_run;
    const now = new Date().toISOString();

    const newRun: Run = {
      run_number: runNumber,
      started_at: now,
      baseline_overall: baselineOverall,
      areas_completed: 0,
      areas_total: plan.areas.length,
    };

    // Update state
    const updatedState: StrategyState = {
      ...plan.state,
      current_phase: 'parallel_execution',
      baseline_overall: plan.state.baseline_overall ?? baselineOverall,
      runs: [...plan.state.runs, newRun],
      last_updated: now,
    };

    // Reset all areas to pending for this run
    const resetAreas = plan.areas.map(area => ({
      ...area,
      status: 'pending' as const,
      current_cycle: 0,
    }));

    this.updateAreas(planId, resetAreas);
    this.updateState(planId, updatedState);

    return runNumber;
  }

  /**
   * Complete the current run with the final overall score.
   */
  completeRun(planId: string, finalOverall: number, passed?: boolean): StrategicPlan {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    const now = new Date().toISOString();
    const currentRunIndex = plan.state.runs.findIndex(
      r => r.run_number === plan.state.current_run
    );

    if (currentRunIndex === -1) {
      throw new DatabaseError(`Run ${plan.state.current_run} not found in plan "${planId}"`);
    }

    // Update the current run with completion data
    const updatedRuns = [...plan.state.runs];
    const completedAreas = plan.areas.filter(a => a.status === 'completed').length;
    updatedRuns[currentRunIndex] = {
      ...updatedRuns[currentRunIndex],
      completed_at: now,
      final_overall: finalOverall,
      areas_completed: completedAreas,
      passed,
    };

    // Calculate cumulative delta
    const baselineOverall = plan.state.baseline_overall ?? plan.state.runs[0]?.baseline_overall ?? 0;
    const cumulativeDelta = finalOverall - baselineOverall;

    const updatedState: StrategyState = {
      ...plan.state,
      current_phase: 'validating',
      current_overall: finalOverall,
      cumulative_delta: cumulativeDelta,
      runs: updatedRuns,
      last_updated: now,
    };

    return this.updateState(planId, updatedState);
  }

  /**
   * Get areas filtered by status.
   */
  getAreasByStatus(planId: string, status: AreaStatus): ImprovementArea[] {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    return plan.areas.filter(a => a.status === status);
  }

  /**
   * Check if all areas are complete.
   */
  allAreasComplete(planId: string): boolean {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    return plan.areas.every(a => a.status === 'completed' || a.status === 'failed');
  }

  /**
   * Advance to the next run.
   * Returns false if max runs reached.
   */
  advanceToNextRun(planId: string): boolean {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    if (plan.state.current_run >= plan.state.max_runs) {
      return false;
    }

    const now = new Date().toISOString();
    const updatedState: StrategyState = {
      ...plan.state,
      current_run: plan.state.current_run + 1,
      current_phase: 'planning',
      last_updated: now,
    };

    this.updateState(planId, updatedState);
    return true;
  }

  /**
   * Trigger the human gate with a reason.
   */
  triggerHumanGate(
    planId: string,
    reason: 'threshold_met' | 'max_runs_exhausted' | 'user_requested' | 'full_review_complete'
  ): StrategicPlan {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    const now = new Date().toISOString();
    const updatedState: StrategyState = {
      ...plan.state,
      current_phase: 'human_gate',
      human_gate_reason: reason,
      last_updated: now,
    };

    return this.updateState(planId, updatedState);
  }

  /**
   * Increment an area's cycle counter.
   */
  incrementAreaCycle(planId: string, areaId: string): StrategicPlan {
    const plan = this.getById(planId);
    if (!plan) {
      throw new DatabaseError(`Strategic plan "${planId}" not found`);
    }

    const area = plan.areas.find(a => a.area_id === areaId);
    if (!area) {
      throw new DatabaseError(`Area "${areaId}" not found in plan "${planId}"`);
    }

    return this.updateAreaState(planId, areaId, {
      current_cycle: area.current_cycle + 1,
      status: 'in_progress',
    });
  }

  /**
   * Convert a database row to a StrategicPlan object.
   */
  private rowToPlan(row: StrategicPlanRow): StrategicPlan {
    return {
      id: row.id,
      book_id: row.book_id,
      book_slug: row.book_slug,
      workflow_run_id: row.workflow_run_id ?? undefined,
      source_analysis_path: row.source_analysis_path ?? undefined,
      goal: JSON.parse(row.goal_json),
      areas: JSON.parse(row.areas_json),
      state: JSON.parse(row.state_json),
      status: row.status as StrategyStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
