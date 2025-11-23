/**
 * EscalationManager - Manages escalations to human review after retry limits are exceeded.
 *
 * Integrates with RejectionTracker to check retry counts and automatically creates
 * escalations when thresholds are met. Emits events via WorkflowEventEmitter.
 */

import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { RejectionTracker, type RejectionType, REJECTION_TYPES } from './rejection-tracker.js';
import { WorkflowEventEmitter } from './event-emitter.js';
import { ESCALATION_TARGETS, DEFAULT_MAX_RETRIES } from './routing-config.js';
import { DatabaseError } from '../errors/index.js';

/**
 * Configuration for the EscalationManager
 */
export interface EscalationConfig {
  /** Maximum retries before escalation (default: 3) */
  maxRetries: number;
  /** Whether to notify human when escalation occurs */
  notifyHuman: boolean;
  /** Custom escalation targets per rejection type */
  escalationTargets: Map<RejectionType, string>;
}

/**
 * Default escalation configuration
 */
export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  maxRetries: DEFAULT_MAX_RETRIES,
  notifyHuman: true,
  escalationTargets: new Map([
    ['style', ESCALATION_TARGETS.SENIOR_EDITOR],
    ['mechanics', ESCALATION_TARGETS.HUMAN_REVIEWER],
    ['clarity', ESCALATION_TARGETS.SENIOR_EDITOR],
    ['scope', ESCALATION_TARGETS.HUMAN_REVIEWER],
  ]),
};

/**
 * Represents an escalation record
 */
export interface Escalation {
  id: string;
  workflowRunId: string;
  rejectionType: RejectionType;
  retryCount: number;
  escalatedTo: string;
  reason: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  resolution: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

/**
 * Result of checking and potentially creating an escalation
 */
export interface EscalationResult {
  /** Whether an escalation was created or already existed */
  escalated: boolean;
  /** The escalation ID if one was created or exists */
  escalationId?: string;
  /** The target the issue was escalated to */
  escalatedTo?: string;
  /** Reason for the escalation decision */
  reason: string;
}

/**
 * Statistics about escalations
 */
export interface EscalationStats {
  /** Total escalations created */
  total: number;
  /** Escalations by status */
  byStatus: {
    pending: number;
    acknowledged: number;
    resolved: number;
  };
  /** Escalations by rejection type */
  byType: Record<RejectionType, number>;
  /** Escalations by target */
  byTarget: Record<string, number>;
  /** Average time to acknowledge (in seconds) */
  avgAcknowledgeTime: number | null;
  /** Average time to resolve (in seconds) */
  avgResolveTime: number | null;
}

/**
 * Raw database row structure for escalations
 */
interface EscalationRow {
  id: string;
  workflow_run_id: string;
  rejection_type: string;
  retry_count: number;
  escalated_to: string;
  reason: string;
  status: string;
  resolution: string | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

/**
 * EscalationManager handles automatic escalation to human review when retry limits are exceeded.
 *
 * Usage:
 * ```typescript
 * const manager = new EscalationManager(db);
 *
 * // Check if escalation is needed and create if so
 * const result = manager.checkAndEscalate('run-123', 'style');
 * if (result.escalated) {
 *   console.log(`Escalated to ${result.escalatedTo}`);
 * }
 *
 * // Get pending escalations for review
 * const pending = manager.getPendingEscalations();
 *
 * // Acknowledge an escalation
 * manager.acknowledgeEscalation(escalationId);
 *
 * // Resolve an escalation
 * manager.resolveEscalation(escalationId, 'Fixed by manual review');
 * ```
 */
export class EscalationManager {
  private db: Database.Database;
  private config: EscalationConfig;
  private rejectionTracker: RejectionTracker;
  private eventEmitter: WorkflowEventEmitter;

  /**
   * Create a new EscalationManager
   * @param db - Database connection
   * @param config - Optional custom escalation configuration
   */
  constructor(db: Database.Database, config?: Partial<EscalationConfig>) {
    this.db = db;
    this.config = {
      maxRetries: config?.maxRetries ?? DEFAULT_ESCALATION_CONFIG.maxRetries,
      notifyHuman: config?.notifyHuman ?? DEFAULT_ESCALATION_CONFIG.notifyHuman,
      escalationTargets: config?.escalationTargets ?? new Map(DEFAULT_ESCALATION_CONFIG.escalationTargets),
    };
    this.rejectionTracker = new RejectionTracker(db, this.config.maxRetries);
    this.eventEmitter = new WorkflowEventEmitter(db);
  }

  /**
   * Check if escalation is needed and create one if so.
   * Returns information about whether escalation occurred.
   *
   * @param workflowRunId - The workflow run ID to check
   * @param rejectionType - The type of rejection to check
   * @returns EscalationResult with escalation status and details
   */
  checkAndEscalate(workflowRunId: string, rejectionType: RejectionType): EscalationResult {
    try {
      // Check if already escalated for this workflow+type
      const existingEscalation = this.getExistingEscalation(workflowRunId, rejectionType);
      if (existingEscalation) {
        return {
          escalated: true,
          escalationId: existingEscalation.id,
          escalatedTo: existingEscalation.escalatedTo,
          reason: 'Already escalated for this workflow and rejection type',
        };
      }

      // Get current retry count from rejection tracker
      const retryCount = this.rejectionTracker.getRetryCount(workflowRunId, rejectionType);

      // Check if escalation threshold is met
      if (retryCount < this.config.maxRetries) {
        return {
          escalated: false,
          reason: `Retry count (${retryCount}) has not reached threshold (${this.config.maxRetries})`,
        };
      }

      // Create escalation
      const escalatedTo = this.config.escalationTargets.get(rejectionType) ?? ESCALATION_TARGETS.DEFAULT;
      const escalation = this.createEscalation(workflowRunId, rejectionType, retryCount, escalatedTo);

      // Emit escalation event
      this.eventEmitter.emit({
        workflowRunId,
        eventType: 'escalated',
        agentName: escalatedTo,
        data: {
          escalationId: escalation.id,
          rejectionType,
          retryCount,
          escalatedTo,
        },
      });

      return {
        escalated: true,
        escalationId: escalation.id,
        escalatedTo: escalation.escalatedTo,
        reason: `Retry limit (${this.config.maxRetries}) exceeded for ${rejectionType} rejections`,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to check/create escalation for workflow "${workflowRunId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get all pending escalations (not yet acknowledged or resolved)
   *
   * @returns Array of pending escalations
   */
  getPendingEscalations(): Escalation[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM escalations
        WHERE status = 'pending'
        ORDER BY created_at ASC
      `);

      const rows = stmt.all() as EscalationRow[];
      return rows.map((row) => this.mapRowToEscalation(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get pending escalations: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get all escalations for a specific workflow run
   *
   * @param workflowRunId - The workflow run ID
   * @returns Array of escalations for the workflow
   */
  getEscalationsForWorkflow(workflowRunId: string): Escalation[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM escalations
        WHERE workflow_run_id = ?
        ORDER BY created_at ASC
      `);

      const rows = stmt.all(workflowRunId) as EscalationRow[];
      return rows.map((row) => this.mapRowToEscalation(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get escalations for workflow "${workflowRunId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get a specific escalation by ID
   *
   * @param escalationId - The escalation ID
   * @returns The escalation or null if not found
   */
  getEscalation(escalationId: string): Escalation | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM escalations WHERE id = ?');
      const row = stmt.get(escalationId) as EscalationRow | undefined;

      if (!row) {
        return null;
      }

      return this.mapRowToEscalation(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get escalation "${escalationId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Acknowledge an escalation (human has seen it)
   *
   * @param escalationId - The escalation ID to acknowledge
   * @returns The updated escalation
   * @throws DatabaseError if escalation not found
   */
  acknowledgeEscalation(escalationId: string): Escalation {
    try {
      const stmt = this.db.prepare(`
        UPDATE escalations
        SET status = 'acknowledged', acknowledged_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(escalationId);

      if (result.changes === 0) {
        throw new Error(`Escalation with ID "${escalationId}" not found`);
      }

      const escalation = this.getEscalation(escalationId);
      if (!escalation) {
        throw new Error(`Failed to retrieve updated escalation "${escalationId}"`);
      }

      return escalation;
    } catch (error) {
      throw new DatabaseError(
        `Failed to acknowledge escalation "${escalationId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Resolve an escalation (human has handled it)
   *
   * @param escalationId - The escalation ID to resolve
   * @param resolution - Description of how the escalation was resolved
   * @returns The updated escalation
   * @throws DatabaseError if escalation not found
   */
  resolveEscalation(escalationId: string, resolution: string): Escalation {
    try {
      const stmt = this.db.prepare(`
        UPDATE escalations
        SET status = 'resolved', resolution = ?, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(resolution, escalationId);

      if (result.changes === 0) {
        throw new Error(`Escalation with ID "${escalationId}" not found`);
      }

      const escalation = this.getEscalation(escalationId);
      if (!escalation) {
        throw new Error(`Failed to retrieve updated escalation "${escalationId}"`);
      }

      return escalation;
    } catch (error) {
      throw new DatabaseError(
        `Failed to resolve escalation "${escalationId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get escalation statistics
   *
   * @returns EscalationStats with counts and averages
   */
  getEscalationStats(): EscalationStats {
    try {
      const stats: EscalationStats = {
        total: 0,
        byStatus: {
          pending: 0,
          acknowledged: 0,
          resolved: 0,
        },
        byType: {
          style: 0,
          mechanics: 0,
          clarity: 0,
          scope: 0,
        },
        byTarget: {},
        avgAcknowledgeTime: null,
        avgResolveTime: null,
      };

      // Get counts by status
      const statusStmt = this.db.prepare(`
        SELECT status, COUNT(*) as count FROM escalations GROUP BY status
      `);
      const statusRows = statusStmt.all() as { status: string; count: number }[];

      for (const row of statusRows) {
        stats.total += row.count;
        if (row.status in stats.byStatus) {
          stats.byStatus[row.status as keyof typeof stats.byStatus] = row.count;
        }
      }

      // Get counts by rejection type
      const typeStmt = this.db.prepare(`
        SELECT rejection_type, COUNT(*) as count FROM escalations GROUP BY rejection_type
      `);
      const typeRows = typeStmt.all() as { rejection_type: string; count: number }[];

      for (const row of typeRows) {
        const rejectionType = row.rejection_type as RejectionType;
        if (REJECTION_TYPES.includes(rejectionType)) {
          stats.byType[rejectionType] = row.count;
        }
      }

      // Get counts by target
      const targetStmt = this.db.prepare(`
        SELECT escalated_to, COUNT(*) as count FROM escalations GROUP BY escalated_to
      `);
      const targetRows = targetStmt.all() as { escalated_to: string; count: number }[];

      for (const row of targetRows) {
        stats.byTarget[row.escalated_to] = row.count;
      }

      // Calculate average acknowledge time (seconds)
      const ackTimeStmt = this.db.prepare(`
        SELECT AVG((julianday(acknowledged_at) - julianday(created_at)) * 86400) as avg_time
        FROM escalations
        WHERE acknowledged_at IS NOT NULL
      `);
      const ackTimeRow = ackTimeStmt.get() as { avg_time: number | null };
      stats.avgAcknowledgeTime = ackTimeRow?.avg_time ?? null;

      // Calculate average resolve time (seconds)
      const resolveTimeStmt = this.db.prepare(`
        SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 86400) as avg_time
        FROM escalations
        WHERE resolved_at IS NOT NULL
      `);
      const resolveTimeRow = resolveTimeStmt.get() as { avg_time: number | null };
      stats.avgResolveTime = resolveTimeRow?.avg_time ?? null;

      return stats;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get escalation stats: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get an existing escalation for a workflow and rejection type
   * @private
   */
  private getExistingEscalation(workflowRunId: string, rejectionType: RejectionType): Escalation | null {
    const stmt = this.db.prepare(`
      SELECT * FROM escalations
      WHERE workflow_run_id = ? AND rejection_type = ?
    `);

    const row = stmt.get(workflowRunId, rejectionType) as EscalationRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapRowToEscalation(row);
  }

  /**
   * Create a new escalation record
   * @private
   */
  private createEscalation(
    workflowRunId: string,
    rejectionType: RejectionType,
    retryCount: number,
    escalatedTo: string,
  ): Escalation {
    const id = randomUUID();
    const reason = `Retry limit (${this.config.maxRetries}) exceeded for ${rejectionType} rejections`;

    const stmt = this.db.prepare(`
      INSERT INTO escalations (
        id, workflow_run_id, rejection_type, retry_count, escalated_to, reason, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `);

    stmt.run(id, workflowRunId, rejectionType, retryCount, escalatedTo, reason);

    // Retrieve the created record
    const escalation = this.getEscalation(id);
    if (!escalation) {
      throw new Error('Failed to retrieve created escalation');
    }

    return escalation;
  }

  /**
   * Map a database row to an Escalation object
   * @private
   */
  private mapRowToEscalation(row: EscalationRow): Escalation {
    return {
      id: row.id,
      workflowRunId: row.workflow_run_id,
      rejectionType: row.rejection_type as RejectionType,
      retryCount: row.retry_count,
      escalatedTo: row.escalated_to,
      reason: row.reason,
      status: row.status as 'pending' | 'acknowledged' | 'resolved',
      resolution: row.resolution,
      createdAt: row.created_at,
      acknowledgedAt: row.acknowledged_at,
      resolvedAt: row.resolved_at,
    };
  }
}
