/**
 * WorkflowEventEmitter - Emits and retrieves workflow events for tracking workflow lifecycle.
 *
 * Events track agent activity within workflow runs:
 * - started: Workflow or agent task began
 * - completed: Workflow or agent task finished successfully
 * - rejected: Content was rejected by an agent
 * - escalated: Issue was escalated to another agent or human
 * - paused: Workflow was paused
 * - resumed: Workflow was resumed
 */

import type Database from 'better-sqlite3';
import { DatabaseError } from '../errors/index.js';

/**
 * Valid event types matching the CHECK constraint in workflow_events table
 */
export type EventType = 'started' | 'completed' | 'rejected' | 'escalated' | 'paused' | 'resumed';

/**
 * All valid event types as an array for runtime validation
 */
export const EVENT_TYPES: readonly EventType[] = [
  'started',
  'completed',
  'rejected',
  'escalated',
  'paused',
  'resumed',
] as const;

/**
 * Input for emitting a new workflow event
 */
export interface EmitEventInput {
  workflowRunId: string;
  eventType: EventType;
  agentName?: string;
  data?: Record<string, unknown>;
}

/**
 * Workflow event record from the database
 */
export interface WorkflowEvent {
  id: string;
  workflowRunId: string;
  eventType: EventType;
  agentName: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Raw database row shape (snake_case columns)
 */
interface WorkflowEventRow {
  id: string;
  workflow_run_id: string;
  event_type: string;
  agent_name: string | null;
  data: string | null;
  created_at: string;
}

/**
 * Generate a unique event ID
 * Format: evt_{timestamp}_{random}
 */
function generateEventId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `evt_${timestamp}_${random}`;
}

/**
 * Convert a database row to a WorkflowEvent interface
 */
function rowToEvent(row: WorkflowEventRow): WorkflowEvent {
  let parsedData: Record<string, unknown> | null = null;

  if (row.data) {
    try {
      parsedData = JSON.parse(row.data) as Record<string, unknown>;
    } catch {
      // If JSON parsing fails, leave as null
      parsedData = null;
    }
  }

  return {
    id: row.id,
    workflowRunId: row.workflow_run_id,
    eventType: row.event_type as EventType,
    agentName: row.agent_name,
    data: parsedData,
    createdAt: row.created_at,
  };
}

/**
 * WorkflowEventEmitter manages workflow event creation and retrieval.
 *
 * Usage:
 * ```typescript
 * const emitter = new WorkflowEventEmitter(db);
 *
 * // Emit a new event
 * const event = emitter.emit({
 *   workflowRunId: 'run_123',
 *   eventType: 'started',
 *   agentName: 'editor',
 *   data: { chapter: 1 },
 * });
 *
 * // Get all events for a run
 * const events = emitter.getEventsForRun('run_123');
 *
 * // Get the latest event
 * const latest = emitter.getLatestEvent('run_123');
 * ```
 */
export class WorkflowEventEmitter {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Emit a new workflow event
   * @param input - Event details to emit
   * @returns The created WorkflowEvent
   * @throws {DatabaseError} if the database operation fails
   */
  emit(input: EmitEventInput): WorkflowEvent {
    const id = generateEventId();
    const serializedData = input.data ? JSON.stringify(input.data) : null;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO workflow_events (id, workflow_run_id, event_type, agent_name, data, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(id, input.workflowRunId, input.eventType, input.agentName ?? null, serializedData);

      // Retrieve the created event to get the actual created_at timestamp
      const getStmt = this.db.prepare(`
        SELECT id, workflow_run_id, event_type, agent_name, data, created_at
        FROM workflow_events
        WHERE id = ?
      `);

      const row = getStmt.get(id) as WorkflowEventRow;
      return rowToEvent(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to emit event for workflow run "${input.workflowRunId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get all events for a workflow run, ordered by creation time
   * @param runId - The workflow run ID
   * @returns Array of WorkflowEvents, ordered oldest to newest
   */
  getEventsForRun(runId: string): WorkflowEvent[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, workflow_run_id, event_type, agent_name, data, created_at
        FROM workflow_events
        WHERE workflow_run_id = ?
        ORDER BY created_at ASC, rowid ASC
      `);

      const rows = stmt.all(runId) as WorkflowEventRow[];
      return rows.map(rowToEvent);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get events for workflow run "${runId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get the latest event for a workflow run
   * @param runId - The workflow run ID
   * @returns The most recent WorkflowEvent, or null if no events exist
   */
  getLatestEvent(runId: string): WorkflowEvent | null {
    try {
      const stmt = this.db.prepare(`
        SELECT id, workflow_run_id, event_type, agent_name, data, created_at
        FROM workflow_events
        WHERE workflow_run_id = ?
        ORDER BY created_at DESC, rowid DESC
        LIMIT 1
      `);

      const row = stmt.get(runId) as WorkflowEventRow | undefined;

      if (!row) {
        return null;
      }

      return rowToEvent(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get latest event for workflow run "${runId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
