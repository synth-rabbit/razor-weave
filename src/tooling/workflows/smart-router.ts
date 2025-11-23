/**
 * SmartRouter - Routes rejected items to appropriate handlers based on rejection type.
 *
 * Uses RejectionTracker to check retry counts and determine when escalation is needed.
 * Configurable routing rules map rejection types to specialized handler agents.
 */

import type Database from 'better-sqlite3';
import { RejectionTracker, type RejectionType, REJECTION_TYPES } from './rejection-tracker.js';
import {
  type RouteConfig,
  DEFAULT_ROUTE_CONFIG,
  DEFAULT_MAX_RETRIES,
  HANDLER_AGENTS,
  ESCALATION_TARGETS,
} from './routing-config.js';
import { DatabaseError } from '../errors/index.js';

/**
 * Result of routing a rejection
 */
export interface RouteResult {
  /** The handler agent that should process this rejection */
  handler: string;
  /** Whether the rejection should be escalated */
  shouldEscalate: boolean;
  /** Current retry count for this rejection type */
  retryCount: number;
  /** Additional routing metadata */
  metadata: Record<string, unknown>;
}

/**
 * Statistics about routing decisions
 */
export interface RoutingStats {
  /** Total rejections routed */
  totalRouted: number;
  /** Count by rejection type */
  byType: Record<RejectionType, number>;
  /** Count of escalations */
  escalations: number;
  /** Count by handler agent */
  byHandler: Record<string, number>;
}

/**
 * Raw database row structure for rejection counts
 */
interface RejectionCountRow {
  rejection_type: string;
  count: number;
}

/**
 * SmartRouter directs rejected items to appropriate handlers based on rejection type.
 *
 * Usage:
 * ```typescript
 * const router = new SmartRouter(db);
 *
 * // Route a specific rejection
 * const result = router.routeRejection('rejection-123');
 *
 * // Get handler for a rejection type
 * const handler = router.getHandlerForType('style');
 *
 * // Check if escalation is needed
 * if (router.shouldEscalate('run-123', 'style')) {
 *   // Handle escalation
 * }
 * ```
 */
export class SmartRouter {
  private db: Database.Database;
  private rejectionTracker: RejectionTracker;
  private routes: Map<RejectionType, RouteConfig>;

  /**
   * Create a new SmartRouter
   * @param db - Database connection
   * @param config - Optional custom routing configuration
   */
  constructor(db: Database.Database, config?: RouteConfig[]) {
    this.db = db;
    this.rejectionTracker = new RejectionTracker(db);
    this.routes = new Map();

    // Initialize routes from config or defaults
    const routeConfig = config ?? DEFAULT_ROUTE_CONFIG;
    for (const route of routeConfig) {
      this.routes.set(route.rejectionType, route);
    }
  }

  /**
   * Get the handler for a specific rejection by ID.
   * Looks up the rejection in the database and determines routing based on type.
   *
   * @param rejectionId - The rejection ID to route
   * @returns RouteResult with handler and escalation information
   * @throws DatabaseError if rejection not found
   */
  routeRejection(rejectionId: string): RouteResult {
    try {
      const stmt = this.db.prepare(`
        SELECT r.*,
               (SELECT COUNT(*) FROM rejections r2
                WHERE r2.workflow_run_id = r.workflow_run_id
                AND r2.rejection_type = r.rejection_type) as type_count
        FROM rejections r
        WHERE r.id = ?
      `);

      const row = stmt.get(rejectionId) as {
        workflow_run_id: string;
        rejection_type: string;
        retry_count: number;
        type_count: number;
      } | undefined;

      if (!row) {
        throw new Error(`Rejection with ID "${rejectionId}" not found`);
      }

      const rejectionType = row.rejection_type as RejectionType;
      const config = this.routes.get(rejectionType);

      // Check if escalation is needed
      const shouldEscalate = row.retry_count >= (config?.maxRetries ?? DEFAULT_MAX_RETRIES);

      // Determine handler
      let handler: string;
      if (shouldEscalate) {
        handler = config?.escalationTarget ?? ESCALATION_TARGETS.DEFAULT;
      } else {
        handler = config?.handlerAgent ?? HANDLER_AGENTS.GENERIC_HANDLER;
      }

      return {
        handler,
        shouldEscalate,
        retryCount: row.retry_count,
        metadata: {
          rejectionType,
          workflowRunId: row.workflow_run_id,
          maxRetries: config?.maxRetries ?? DEFAULT_MAX_RETRIES,
          escalationTarget: config?.escalationTarget ?? ESCALATION_TARGETS.DEFAULT,
        },
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to route rejection "${rejectionId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get the handler agent for a specific rejection type.
   * Returns the generic handler if no specific handler is configured.
   *
   * @param type - The rejection type
   * @returns The handler agent identifier
   */
  getHandlerForType(type: RejectionType): string {
    const config = this.routes.get(type);
    return config?.handlerAgent ?? HANDLER_AGENTS.GENERIC_HANDLER;
  }

  /**
   * Check if a workflow should be escalated for a specific rejection type.
   * Uses RejectionTracker to get retry count and compares against max retries.
   *
   * @param workflowRunId - The workflow run ID
   * @param type - The rejection type to check
   * @returns true if escalation is needed
   */
  shouldEscalate(workflowRunId: string, type: RejectionType): boolean {
    const retryCount = this.rejectionTracker.getRetryCount(workflowRunId, type);
    const config = this.routes.get(type);
    const maxRetries = config?.maxRetries ?? DEFAULT_MAX_RETRIES;
    return retryCount >= maxRetries;
  }

  /**
   * Get routing statistics for a specific workflow run or all runs.
   *
   * @param workflowRunId - Optional workflow run ID to filter by
   * @returns Routing statistics
   */
  getRoutingStats(workflowRunId?: string): RoutingStats {
    try {
      // Initialize stats
      const stats: RoutingStats = {
        totalRouted: 0,
        byType: {
          style: 0,
          mechanics: 0,
          clarity: 0,
          scope: 0,
        },
        escalations: 0,
        byHandler: {},
      };

      // Query for counts by type
      let countQuery: string;
      let params: string[] = [];

      if (workflowRunId) {
        countQuery = `
          SELECT rejection_type, COUNT(*) as count
          FROM rejections
          WHERE workflow_run_id = ?
          GROUP BY rejection_type
        `;
        params = [workflowRunId];
      } else {
        countQuery = `
          SELECT rejection_type, COUNT(*) as count
          FROM rejections
          GROUP BY rejection_type
        `;
      }

      const countStmt = this.db.prepare(countQuery);
      const rows = (workflowRunId ? countStmt.all(workflowRunId) : countStmt.all()) as RejectionCountRow[];

      for (const row of rows) {
        const rejectionType = row.rejection_type as RejectionType;
        if (REJECTION_TYPES.includes(rejectionType)) {
          stats.byType[rejectionType] = row.count;
          stats.totalRouted += row.count;

          // Track by handler
          const handler = this.getHandlerForType(rejectionType);
          stats.byHandler[handler] = (stats.byHandler[handler] ?? 0) + row.count;
        }
      }

      // Query for escalations (rejections where retry_count >= maxRetries)
      let escalationQuery: string;

      if (workflowRunId) {
        escalationQuery = `
          SELECT r.rejection_type, r.retry_count
          FROM rejections r
          WHERE r.workflow_run_id = ?
        `;
      } else {
        escalationQuery = `
          SELECT r.rejection_type, r.retry_count
          FROM rejections r
        `;
      }

      const escalationStmt = this.db.prepare(escalationQuery);
      const escalationRows = (
        workflowRunId ? escalationStmt.all(workflowRunId) : escalationStmt.all()
      ) as { rejection_type: string; retry_count: number }[];

      for (const row of escalationRows) {
        const rejectionType = row.rejection_type as RejectionType;
        const config = this.routes.get(rejectionType);
        const maxRetries = config?.maxRetries ?? DEFAULT_MAX_RETRIES;

        if (row.retry_count >= maxRetries) {
          stats.escalations++;
        }
      }

      return stats;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get routing stats: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Configure a custom route for a rejection type.
   * Allows overriding default routing configuration at runtime.
   *
   * @param type - The rejection type to configure
   * @param handler - The handler agent identifier
   * @param maxRetries - Optional max retries before escalation (default: 3)
   * @param escalationTarget - Optional escalation target
   */
  setRoute(
    type: RejectionType,
    handler: string,
    maxRetries: number = DEFAULT_MAX_RETRIES,
    escalationTarget: string = ESCALATION_TARGETS.DEFAULT,
  ): void {
    this.routes.set(type, {
      rejectionType: type,
      handlerAgent: handler,
      maxRetries,
      escalationTarget,
    });
  }

  /**
   * Get the current route configuration for a rejection type.
   *
   * @param type - The rejection type
   * @returns The route configuration or undefined if not configured
   */
  getRoute(type: RejectionType): RouteConfig | undefined {
    return this.routes.get(type);
  }

  /**
   * Get all configured routes.
   *
   * @returns Array of all route configurations
   */
  getAllRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get the escalation target for a specific rejection type.
   *
   * @param type - The rejection type
   * @returns The escalation target identifier
   */
  getEscalationTarget(type: RejectionType): string {
    const config = this.routes.get(type);
    return config?.escalationTarget ?? ESCALATION_TARGETS.DEFAULT;
  }
}
