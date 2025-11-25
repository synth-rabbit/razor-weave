// src/tooling/workflows/repository.ts
import { BaseRepository } from '../database/base-repository.js';
import { DatabaseError } from '../errors/index.js';
import { WorkflowStateMachine } from './state-machine.js';
import type { WorkflowRun, WorkflowStatus, WorkflowType } from './types.js';

/**
 * Input for creating a new workflow run
 */
export interface CreateWorkflowRunInput {
  workflow_type: WorkflowType;
  book_id: string;
  input_version_id?: string | null;
  session_id?: string | null;
  plan_id?: string | null;
}

/**
 * Filters for listing workflow runs
 */
export interface WorkflowRunFilters {
  bookId?: string;
  status?: WorkflowStatus;
  type?: WorkflowType;
}

const WORKFLOW_COLUMNS = `id, workflow_type, book_id, input_version_id, output_version_id,
  session_id, plan_id, status, current_agent, created_at, updated_at`;

/**
 * Repository for managing workflow runs in the database.
 * Provides CRUD operations for the workflow_runs table with state machine validation.
 */
export class WorkflowRepository extends BaseRepository<WorkflowRun> {
  protected getIdPrefix(): string {
    return 'wfrun';
  }

  /**
   * Create a new workflow run.
   */
  create(input: CreateWorkflowRunInput): WorkflowRun {
    return this.execute(() => {
      const id = this.generateId();

      this.db.prepare(`
        INSERT INTO workflow_runs (id, workflow_type, book_id, input_version_id, session_id, plan_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        id,
        input.workflow_type,
        input.book_id,
        input.input_version_id ?? null,
        input.session_id ?? null,
        input.plan_id ?? null
      );

      const created = this.getById(id);
      if (!created) {
        throw new DatabaseError('Workflow run was created but could not be retrieved');
      }
      return created;
    }, 'create workflow run');
  }

  /**
   * Get a workflow run by its unique ID.
   */
  getById(id: string): WorkflowRun | null {
    return this.execute(() => {
      const stmt = this.db.prepare(`SELECT ${WORKFLOW_COLUMNS} FROM workflow_runs WHERE id = ?`);
      return (stmt.get(id) as WorkflowRun | undefined) ?? null;
    }, `get workflow run by id "${id}"`);
  }

  /**
   * List workflow runs with optional filtering.
   */
  list(filters?: WorkflowRunFilters): WorkflowRun[] {
    return this.execute(() => {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters?.bookId) {
        conditions.push('book_id = ?');
        params.push(filters.bookId);
      }
      if (filters?.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      if (filters?.type) {
        conditions.push('workflow_type = ?');
        params.push(filters.type);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const stmt = this.db.prepare(`SELECT ${WORKFLOW_COLUMNS} FROM workflow_runs ${whereClause} ORDER BY created_at ASC`);
      return stmt.all(...params) as WorkflowRun[];
    }, 'list workflow runs');
  }

  /**
   * Update the status of a workflow run with state machine validation.
   * @throws InvalidTransitionError if the status transition is not valid
   */
  updateStatus(id: string, status: WorkflowStatus): WorkflowRun {
    // Note: We wrap in execute but also need to preserve InvalidTransitionError
    const existing = this.getById(id);
    if (!existing) {
      throw new DatabaseError(`Workflow run with id "${id}" not found`);
    }

    // Validate transition using state machine (may throw InvalidTransitionError)
    const stateMachine = new WorkflowStateMachine(existing.status);
    stateMachine.transition(status);

    return this.execute(() => {
      this.db.prepare(`UPDATE workflow_runs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(status, id);

      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError('Workflow run was updated but could not be retrieved');
      }
      return updated;
    }, `update workflow run status "${id}"`);
  }

  /**
   * Set the current agent for a workflow run.
   */
  setCurrentAgent(id: string, agentName: string | null): WorkflowRun {
    return this.execute(() => {
      const existing = this.getById(id);
      if (!existing) {
        throw new DatabaseError(`Workflow run with id "${id}" not found`);
      }

      this.db.prepare(`UPDATE workflow_runs SET current_agent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(agentName, id);

      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError('Workflow run was updated but could not be retrieved');
      }
      return updated;
    }, `set current agent for workflow run "${id}"`);
  }

  /**
   * Link an output version to a workflow run.
   */
  linkOutputVersion(id: string, versionId: string): WorkflowRun {
    return this.execute(() => {
      const existing = this.getById(id);
      if (!existing) {
        throw new DatabaseError(`Workflow run with id "${id}" not found`);
      }

      this.db.prepare(`UPDATE workflow_runs SET output_version_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(versionId, id);

      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError('Workflow run was updated but could not be retrieved');
      }
      return updated;
    }, `link output version for workflow run "${id}"`);
  }
}
