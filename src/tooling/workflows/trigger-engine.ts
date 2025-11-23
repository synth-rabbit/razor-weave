/**
 * TriggerEngine - Cross-workflow automation through trigger-based execution.
 *
 * Watches workflow completions and fires triggers to start dependent workflows.
 * Supports conditions: on_complete, on_approve, and manual triggers.
 *
 * Example trigger chain:
 * - W1 (editing) completes -> trigger W2 (PDF generation)
 * - W2 (PDF) approved -> trigger W3 (publication)
 */

import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { DatabaseError } from '../errors/index.js';
import { WorkflowRepository } from './repository.js';
import type { WorkflowType, WorkflowRun } from './types.js';

/**
 * Conditions that can trigger a workflow
 */
export type TriggerCondition = 'on_complete' | 'on_approve' | 'manual';

/**
 * All valid trigger conditions as an array for runtime validation
 */
export const TRIGGER_CONDITIONS: readonly TriggerCondition[] = [
  'on_complete',
  'on_approve',
  'manual',
] as const;

/**
 * Interface representing a workflow trigger
 */
export interface Trigger {
  id: string;
  name: string;
  sourceWorkflowType: WorkflowType;
  targetWorkflowType: WorkflowType;
  condition: TriggerCondition;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for registering a new trigger (id is auto-generated)
 */
export type RegisterTriggerInput = Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Result of checking or firing a trigger
 */
export interface TriggerResult {
  triggered: boolean;
  triggerId: string;
  newRunId?: string;
  reason: string;
}

/**
 * Raw database row shape (snake_case columns)
 */
interface TriggerRow {
  id: string;
  name: string;
  source_workflow_type: string;
  target_workflow_type: string;
  trigger_condition: string;
  enabled: number; // SQLite stores booleans as 0/1
  config: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert a database row to a Trigger interface
 */
function rowToTrigger(row: TriggerRow): Trigger {
  let parsedConfig: Record<string, unknown> = {};

  if (row.config) {
    try {
      parsedConfig = JSON.parse(row.config) as Record<string, unknown>;
    } catch {
      // If JSON parsing fails, use empty object
      parsedConfig = {};
    }
  }

  return {
    id: row.id,
    name: row.name,
    sourceWorkflowType: row.source_workflow_type as WorkflowType,
    targetWorkflowType: row.target_workflow_type as WorkflowType,
    condition: row.trigger_condition as TriggerCondition,
    enabled: Boolean(row.enabled),
    config: parsedConfig,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Generate a unique trigger ID
 */
function generateTriggerId(): string {
  return `trig_${randomUUID().split('-')[0]}`;
}

/**
 * TriggerEngine manages workflow triggers for cross-workflow automation.
 *
 * Usage:
 * ```typescript
 * const engine = new TriggerEngine(db, workflowRepository);
 *
 * // Register a trigger: when W1 completes, start W2
 * const triggerId = engine.registerTrigger({
 *   name: 'W1 to W2',
 *   sourceWorkflowType: 'w1_editing',
 *   targetWorkflowType: 'w2_pdf',
 *   condition: 'on_complete',
 *   enabled: true,
 *   config: {},
 * });
 *
 * // Check triggers when a workflow completes
 * const results = engine.checkTriggers(completedRunId);
 *
 * // Manually fire a trigger for a specific book
 * const result = engine.fireTrigger(triggerId, 'book_123');
 * ```
 */
export class TriggerEngine {
  private db: Database.Database;
  private workflowRepository: WorkflowRepository;

  constructor(db: Database.Database, workflowRepository: WorkflowRepository) {
    this.db = db;
    this.workflowRepository = workflowRepository;
  }

  /**
   * Register a new trigger in the database.
   *
   * @param input - Trigger configuration (without id, createdAt, updatedAt)
   * @returns The generated trigger ID
   * @throws {DatabaseError} if the database operation fails
   */
  registerTrigger(input: RegisterTriggerInput): string {
    const id = generateTriggerId();
    const configJson = JSON.stringify(input.config);

    try {
      const stmt = this.db.prepare(`
        INSERT INTO workflow_triggers (id, name, source_workflow_type, target_workflow_type, trigger_condition, enabled, config)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        input.name,
        input.sourceWorkflowType,
        input.targetWorkflowType,
        input.condition,
        input.enabled ? 1 : 0,
        configJson
      );

      return id;
    } catch (error) {
      throw new DatabaseError(
        `Failed to register trigger: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a trigger by its ID.
   *
   * @param triggerId - The trigger ID
   * @returns The trigger if found, null otherwise
   */
  getTrigger(triggerId: string): Trigger | null {
    try {
      const stmt = this.db.prepare(`
        SELECT id, name, source_workflow_type, target_workflow_type, trigger_condition, enabled, config, created_at, updated_at
        FROM workflow_triggers
        WHERE id = ?
      `);

      const row = stmt.get(triggerId) as TriggerRow | undefined;

      if (!row) {
        return null;
      }

      return rowToTrigger(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get trigger "${triggerId}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check and fire applicable triggers for a completed workflow run.
   * Evaluates all enabled triggers where the source matches the completed workflow type.
   *
   * @param completedRunId - The ID of the completed workflow run
   * @returns Array of TriggerResults for each evaluated trigger
   * @throws {DatabaseError} if the workflow run is not found or database operation fails
   */
  checkTriggers(completedRunId: string): TriggerResult[] {
    const completedRun = this.workflowRepository.getById(completedRunId);

    if (!completedRun) {
      throw new DatabaseError(`Workflow run "${completedRunId}" not found`);
    }

    // Only check triggers for completed or approved workflows
    if (completedRun.status !== 'completed') {
      return [];
    }

    // Get all enabled triggers for this source workflow type
    const triggers = this.getTriggersForSource(completedRun.workflow_type).filter((t) => t.enabled);

    const results: TriggerResult[] = [];

    for (const trigger of triggers) {
      // Skip manual triggers - they must be fired explicitly
      if (trigger.condition === 'manual') {
        results.push({
          triggered: false,
          triggerId: trigger.id,
          reason: 'Manual trigger requires explicit invocation',
        });
        continue;
      }

      // Check if condition is met
      const conditionMet = this.evaluateCondition(trigger, completedRun);

      if (conditionMet) {
        // Fire the trigger
        const result = this.fireTriggerInternal(trigger, completedRun.book_id);
        results.push(result);
      } else {
        results.push({
          triggered: false,
          triggerId: trigger.id,
          reason: `Condition "${trigger.condition}" not met`,
        });
      }
    }

    return results;
  }

  /**
   * Get all triggers that watch a specific workflow type as their source.
   *
   * @param workflowType - The source workflow type
   * @returns Array of triggers for the source type
   */
  getTriggersForSource(workflowType: WorkflowType): Trigger[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, name, source_workflow_type, target_workflow_type, trigger_condition, enabled, config, created_at, updated_at
        FROM workflow_triggers
        WHERE source_workflow_type = ?
        ORDER BY created_at ASC
      `);

      const rows = stmt.all(workflowType) as TriggerRow[];
      return rows.map(rowToTrigger);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get triggers for source "${workflowType}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Enable or disable a trigger.
   *
   * @param triggerId - The trigger ID
   * @param enabled - Whether the trigger should be enabled
   * @throws {DatabaseError} if trigger not found or database operation fails
   */
  setTriggerEnabled(triggerId: string, enabled: boolean): void {
    try {
      const stmt = this.db.prepare(`
        UPDATE workflow_triggers
        SET enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(enabled ? 1 : 0, triggerId);

      if (result.changes === 0) {
        throw new Error(`Trigger "${triggerId}" not found`);
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to set trigger enabled state for "${triggerId}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a trigger from the database.
   *
   * @param triggerId - The trigger ID to delete
   * @throws {DatabaseError} if trigger not found or database operation fails
   */
  deleteTrigger(triggerId: string): void {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM workflow_triggers
        WHERE id = ?
      `);

      const result = stmt.run(triggerId);

      if (result.changes === 0) {
        throw new Error(`Trigger "${triggerId}" not found`);
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete trigger "${triggerId}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List all registered triggers.
   *
   * @returns Array of all triggers
   */
  listTriggers(): Trigger[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, name, source_workflow_type, target_workflow_type, trigger_condition, enabled, config, created_at, updated_at
        FROM workflow_triggers
        ORDER BY created_at ASC
      `);

      const rows = stmt.all() as TriggerRow[];
      return rows.map(rowToTrigger);
    } catch (error) {
      throw new DatabaseError(
        `Failed to list triggers: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Manually fire a trigger for a specific book.
   * Can fire any trigger type (including manual triggers).
   *
   * @param triggerId - The trigger ID to fire
   * @param bookId - The book ID to create the workflow for
   * @returns TriggerResult indicating success or failure
   * @throws {DatabaseError} if trigger not found or database operation fails
   */
  fireTrigger(triggerId: string, bookId: string): TriggerResult {
    const trigger = this.getTrigger(triggerId);

    if (!trigger) {
      throw new DatabaseError(`Trigger "${triggerId}" not found`);
    }

    if (!trigger.enabled) {
      return {
        triggered: false,
        triggerId,
        reason: 'Trigger is disabled',
      };
    }

    return this.fireTriggerInternal(trigger, bookId);
  }

  /**
   * Evaluate whether a trigger's condition is met based on the completed workflow.
   *
   * @param trigger - The trigger to evaluate
   * @param completedRun - The completed workflow run
   * @returns true if the condition is met
   */
  private evaluateCondition(trigger: Trigger, completedRun: WorkflowRun): boolean {
    switch (trigger.condition) {
      case 'on_complete':
        // on_complete fires when workflow reaches 'completed' status
        return completedRun.status === 'completed';

      case 'on_approve':
        // on_approve fires when workflow is completed AND has approval metadata
        // Check for approval flag in event data or config
        return completedRun.status === 'completed' && this.hasApproval(completedRun.id);

      case 'manual':
        // Manual triggers never fire automatically
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if a workflow run has been approved.
   * Looks for an 'approved' event or approval metadata.
   *
   * @param runId - The workflow run ID
   * @returns true if the workflow has approval
   */
  private hasApproval(runId: string): boolean {
    try {
      // Check workflow_events for an approval-related event
      // The 'completed' event with approval data indicates approval
      const stmt = this.db.prepare(`
        SELECT data FROM workflow_events
        WHERE workflow_run_id = ?
        AND event_type = 'completed'
        ORDER BY created_at DESC
        LIMIT 1
      `);

      const row = stmt.get(runId) as { data: string | null } | undefined;

      if (!row || !row.data) {
        return false;
      }

      try {
        const data = JSON.parse(row.data) as Record<string, unknown>;
        return data.approved === true;
      } catch {
        return false;
      }
    } catch {
      // If workflow_events table doesn't exist or query fails, no approval
      return false;
    }
  }

  /**
   * Internal method to fire a trigger and create a new workflow run.
   *
   * @param trigger - The trigger to fire
   * @param bookId - The book ID for the new workflow
   * @returns TriggerResult with new run ID if successful
   */
  private fireTriggerInternal(trigger: Trigger, bookId: string): TriggerResult {
    try {
      const newRun = this.workflowRepository.create({
        workflow_type: trigger.targetWorkflowType,
        book_id: bookId,
      });

      return {
        triggered: true,
        triggerId: trigger.id,
        newRunId: newRun.id,
        reason: `Trigger "${trigger.name}" fired successfully`,
      };
    } catch (error) {
      return {
        triggered: false,
        triggerId: trigger.id,
        reason: `Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
