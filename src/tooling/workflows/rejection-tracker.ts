/**
 * RejectionTracker - Tracks content rejections during editing workflows.
 *
 * Manages rejection records with retry counting and auto-escalation detection
 * when a rejection type exceeds the configured threshold.
 */

import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { DatabaseError } from '../errors/index.js';

/**
 * Valid rejection types matching the CHECK constraint in rejections table
 */
export type RejectionType = 'style' | 'mechanics' | 'clarity' | 'scope';

/**
 * All valid rejection types as an array for runtime validation
 */
export const REJECTION_TYPES: readonly RejectionType[] = [
  'style',
  'mechanics',
  'clarity',
  'scope',
] as const;

/**
 * Input for recording a new rejection
 */
export interface RecordRejectionInput {
  workflowRunId: string;
  eventId?: string;
  rejectionType: RejectionType;
  reason: string;
}

/**
 * Interface representing a rejection record from the database
 */
export interface Rejection {
  id: string;
  workflowRunId: string;
  eventId: string | null;
  rejectionType: RejectionType;
  reason: string;
  retryCount: number;
  resolved: boolean;
  createdAt: string;
}

/**
 * Raw database row structure for rejections
 */
interface RejectionRow {
  id: string;
  workflow_run_id: string;
  event_id: string | null;
  rejection_type: string;
  reason: string;
  retry_count: number;
  resolved: number; // SQLite stores booleans as 0/1
  created_at: string;
}

/**
 * Default escalation threshold (number of retries before escalation)
 */
export const DEFAULT_ESCALATION_THRESHOLD = 3;

/**
 * RejectionTracker manages rejection records for workflow runs.
 *
 * Usage:
 * ```typescript
 * const tracker = new RejectionTracker(db);
 * const rejection = tracker.recordRejection({
 *   workflowRunId: 'run-123',
 *   rejectionType: 'style',
 *   reason: 'Voice inconsistent with established tone'
 * });
 *
 * if (tracker.shouldEscalate('run-123', 'style')) {
 *   // Escalate to human review
 * }
 * ```
 */
export class RejectionTracker {
  private db: Database.Database;
  private escalationThreshold: number;

  /**
   * Create a new RejectionTracker
   * @param db - Database connection
   * @param escalationThreshold - Number of retries before escalation (default: 3)
   */
  constructor(db: Database.Database, escalationThreshold: number = DEFAULT_ESCALATION_THRESHOLD) {
    this.db = db;
    this.escalationThreshold = escalationThreshold;
  }

  /**
   * Record a new rejection for a workflow run.
   * Automatically increments retry count based on existing unresolved rejections.
   *
   * @param input - Rejection details
   * @returns The created rejection record
   */
  recordRejection(input: RecordRejectionInput): Rejection {
    try {
      // Get current retry count for this type in this run
      const currentRetryCount = this.getRetryCount(input.workflowRunId, input.rejectionType);

      const id = randomUUID();
      const stmt = this.db.prepare(`
        INSERT INTO rejections (id, workflow_run_id, event_id, rejection_type, reason, retry_count, resolved, created_at)
        VALUES (?, ?, ?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        id,
        input.workflowRunId,
        input.eventId ?? null,
        input.rejectionType,
        input.reason,
        currentRetryCount + 1,
      );

      // Retrieve the created record
      const selectStmt = this.db.prepare('SELECT * FROM rejections WHERE id = ?');
      const row = selectStmt.get(id) as RejectionRow;

      return this.mapRowToRejection(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to record rejection: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get all rejections for a workflow run
   *
   * @param runId - The workflow run ID
   * @returns Array of rejections for the run
   */
  getRejectionsForRun(runId: string): Rejection[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM rejections
        WHERE workflow_run_id = ?
        ORDER BY created_at ASC
      `);

      const rows = stmt.all(runId) as RejectionRow[];
      return rows.map((row) => this.mapRowToRejection(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get rejections for run "${runId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get all unresolved rejections for a workflow run
   *
   * @param runId - The workflow run ID
   * @returns Array of unresolved rejections for the run
   */
  getUnresolvedRejections(runId: string): Rejection[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM rejections
        WHERE workflow_run_id = ? AND resolved = FALSE
        ORDER BY created_at ASC
      `);

      const rows = stmt.all(runId) as RejectionRow[];
      return rows.map((row) => this.mapRowToRejection(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get unresolved rejections for run "${runId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Mark a rejection as resolved
   *
   * @param rejectionId - The rejection ID to resolve
   * @returns The updated rejection record
   * @throws DatabaseError if rejection not found
   */
  resolveRejection(rejectionId: string): Rejection {
    try {
      const updateStmt = this.db.prepare(`
        UPDATE rejections
        SET resolved = TRUE
        WHERE id = ?
      `);

      const result = updateStmt.run(rejectionId);

      if (result.changes === 0) {
        throw new Error(`Rejection with ID "${rejectionId}" not found`);
      }

      const selectStmt = this.db.prepare('SELECT * FROM rejections WHERE id = ?');
      const row = selectStmt.get(rejectionId) as RejectionRow;

      return this.mapRowToRejection(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to resolve rejection "${rejectionId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get the current retry count for a specific rejection type in a workflow run.
   * Returns 0 if no rejections of that type exist.
   *
   * @param runId - The workflow run ID
   * @param rejectionType - The type of rejection
   * @returns The current retry count
   */
  getRetryCount(runId: string, rejectionType: RejectionType): number {
    try {
      const stmt = this.db.prepare(`
        SELECT MAX(retry_count) as max_retry
        FROM rejections
        WHERE workflow_run_id = ? AND rejection_type = ?
      `);

      const row = stmt.get(runId, rejectionType) as { max_retry: number | null };
      return row?.max_retry ?? 0;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get retry count for run "${runId}" type "${rejectionType}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Check if a workflow should be escalated based on retry count.
   * Returns true when retry count >= escalation threshold.
   *
   * @param runId - The workflow run ID
   * @param rejectionType - The type of rejection to check
   * @returns true if escalation is needed
   */
  shouldEscalate(runId: string, rejectionType: RejectionType): boolean {
    const retryCount = this.getRetryCount(runId, rejectionType);
    return retryCount >= this.escalationThreshold;
  }

  /**
   * Map a database row to a Rejection object
   */
  private mapRowToRejection(row: RejectionRow): Rejection {
    return {
      id: row.id,
      workflowRunId: row.workflow_run_id,
      eventId: row.event_id,
      rejectionType: row.rejection_type as RejectionType,
      reason: row.reason,
      retryCount: row.retry_count,
      resolved: Boolean(row.resolved),
      createdAt: row.created_at,
    };
  }
}
