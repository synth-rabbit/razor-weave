/**
 * ConditionDatabase Implementation
 *
 * Implements the ConditionDatabase interface for use in workflow pre/postcondition checks.
 * Provides read-only database queries for condition validation.
 */

import type Database from 'better-sqlite3';
import type { ConditionDatabase } from './engine-types.js';

/**
 * Implementation of ConditionDatabase for workflow condition checks.
 *
 * This class provides read-only database access for validating pre/postconditions
 * during workflow execution. It wraps raw database queries to check for the existence
 * of various workflow-related records.
 */
export class WorkflowConditionDatabase implements ConditionDatabase {
  constructor(private db: Database.Database) {}

  /**
   * Check if a strategic plan exists for a given workflow run
   */
  strategicPlanExists(runId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM strategic_plans
      WHERE workflow_run_id = ?
      LIMIT 1
    `);
    const result = stmt.get(runId);
    return result !== undefined;
  }

  /**
   * Check if a book version exists
   */
  versionExists(versionId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM book_versions
      WHERE content_id = ?
      LIMIT 1
    `);
    const result = stmt.get(versionId);
    return result !== undefined;
  }

  /**
   * Check if artifacts exist for a workflow run
   */
  artifactsExist(runId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM workflow_artifacts
      WHERE workflow_run_id = ?
      LIMIT 1
    `);
    const result = stmt.get(runId);
    return result !== undefined;
  }

  /**
   * Get the status of a workflow run
   */
  workflowStatus(runId: string): string | null {
    const stmt = this.db.prepare(`
      SELECT status FROM workflow_runs
      WHERE id = ?
    `);
    const result = stmt.get(runId) as { status: string } | undefined;
    return result?.status ?? null;
  }

  /**
   * Get a book version by ID
   */
  getVersion(versionId: string): { id: string; book_id: string } | null {
    const stmt = this.db.prepare(`
      SELECT content_id as id, book_id
      FROM book_versions
      WHERE content_id = ?
    `);
    const result = stmt.get(versionId) as { id: string; book_id: string } | undefined;
    return result ?? null;
  }
}

/**
 * Factory function to create a ConditionDatabase instance
 */
export function createConditionDatabase(db: Database.Database): ConditionDatabase {
  return new WorkflowConditionDatabase(db);
}
