// src/tooling/workflows/repository.ts
import type Database from 'better-sqlite3';
import { DatabaseError } from '../errors/index.js';
import { WorkflowStateMachine, InvalidTransitionError } from './state-machine.js';
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

/**
 * Generate a unique workflow run ID
 */
function generateWorkflowRunId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wfrun_${timestamp}_${random}`;
}

/**
 * Repository for managing workflow runs in the database.
 * Provides CRUD operations for the workflow_runs table with state machine validation.
 */
export class WorkflowRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Create a new workflow run.
   * @param input - The workflow run data to create
   * @returns The created workflow run
   * @throws DatabaseError if creation fails
   */
  create(input: CreateWorkflowRunInput): WorkflowRun {
    try {
      const id = generateWorkflowRunId();

      const stmt = this.db.prepare(`
        INSERT INTO workflow_runs (id, workflow_type, book_id, input_version_id, session_id, plan_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `);

      stmt.run(
        id,
        input.workflow_type,
        input.book_id,
        input.input_version_id ?? null,
        input.session_id ?? null,
        input.plan_id ?? null
      );

      // Fetch and return the created workflow run
      const created = this.getById(id);
      if (!created) {
        throw new DatabaseError(`Workflow run was created but could not be retrieved`);
      }

      return created;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        `Failed to create workflow run: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a workflow run by its unique ID.
   * @param id - The unique identifier of the workflow run
   * @returns The workflow run if found, null otherwise
   */
  getById(id: string): WorkflowRun | null {
    try {
      const stmt = this.db.prepare(`
        SELECT id, workflow_type, book_id, input_version_id, output_version_id,
               session_id, plan_id, status, current_agent, created_at, updated_at
        FROM workflow_runs
        WHERE id = ?
      `);

      const row = stmt.get(id) as WorkflowRun | undefined;
      return row ?? null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get workflow run by id "${id}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List workflow runs with optional filtering.
   * @param filters - Optional filters for book_id, status, or workflow_type
   * @returns Array of workflow runs matching the filters
   */
  list(filters?: WorkflowRunFilters): WorkflowRun[] {
    try {
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

      const stmt = this.db.prepare(`
        SELECT id, workflow_type, book_id, input_version_id, output_version_id,
               session_id, plan_id, status, current_agent, created_at, updated_at
        FROM workflow_runs
        ${whereClause}
        ORDER BY created_at ASC
      `);

      return stmt.all(...params) as WorkflowRun[];
    } catch (error) {
      throw new DatabaseError(
        `Failed to list workflow runs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update the status of a workflow run with state machine validation.
   * @param id - The ID of the workflow run to update
   * @param status - The new status to transition to
   * @returns The updated workflow run
   * @throws DatabaseError if workflow run not found
   * @throws InvalidTransitionError if the status transition is not valid
   */
  updateStatus(id: string, status: WorkflowStatus): WorkflowRun {
    try {
      // Fetch existing workflow run
      const existing = this.getById(id);
      if (!existing) {
        throw new DatabaseError(`Workflow run with id "${id}" not found`);
      }

      // Validate transition using state machine
      const stateMachine = new WorkflowStateMachine(existing.status);
      stateMachine.transition(status); // Throws InvalidTransitionError if invalid

      // Update in database
      const stmt = this.db.prepare(`
        UPDATE workflow_runs
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(status, id);

      // Fetch and return the updated workflow run
      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError(`Workflow run was updated but could not be retrieved`);
      }

      return updated;
    } catch (error) {
      // Re-throw InvalidTransitionError as-is
      if (error instanceof InvalidTransitionError) {
        throw error;
      }

      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        `Failed to update workflow run status "${id}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Set the current agent for a workflow run.
   * @param id - The ID of the workflow run
   * @param agentName - The name of the current agent, or null to clear
   * @returns The updated workflow run
   * @throws DatabaseError if workflow run not found or update fails
   */
  setCurrentAgent(id: string, agentName: string | null): WorkflowRun {
    try {
      // Check if workflow run exists
      const existing = this.getById(id);
      if (!existing) {
        throw new DatabaseError(`Workflow run with id "${id}" not found`);
      }

      const stmt = this.db.prepare(`
        UPDATE workflow_runs
        SET current_agent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(agentName, id);

      // Fetch and return the updated workflow run
      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError(`Workflow run was updated but could not be retrieved`);
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        `Failed to set current agent for workflow run "${id}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Link an output version to a workflow run.
   * @param id - The ID of the workflow run
   * @param versionId - The version ID to link as output
   * @returns The updated workflow run
   * @throws DatabaseError if workflow run not found or update fails
   */
  linkOutputVersion(id: string, versionId: string): WorkflowRun {
    try {
      // Check if workflow run exists
      const existing = this.getById(id);
      if (!existing) {
        throw new DatabaseError(`Workflow run with id "${id}" not found`);
      }

      const stmt = this.db.prepare(`
        UPDATE workflow_runs
        SET output_version_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(versionId, id);

      // Fetch and return the updated workflow run
      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError(`Workflow run was updated but could not be retrieved`);
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        `Failed to link output version for workflow run "${id}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
