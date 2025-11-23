/**
 * ArtifactQuery - Cross-workflow artifact query system.
 *
 * Enables workflows to find artifacts from other workflows, supporting
 * dependency lookup, lineage tracing, and complex search criteria.
 */

import type Database from 'better-sqlite3';
import type { ArtifactType } from './artifact-types.js';
import { getArtifactTypesForWorkflow, getWorkflowForArtifact } from './artifact-types.js';
import type { WorkflowType } from './types.js';

// ============================================================================
// Workflow Dependency Map
// ============================================================================

/**
 * Defines which workflows depend on outputs from other workflows.
 * W1 (editing) has no dependencies - it works from source.
 * W2 (PDF) depends on W1 outputs (print_html, chapters).
 * W3 (publication) depends on W2 outputs (pdf_digital, pdf_print).
 * W4 (playtesting) can depend on W1 outputs for early testing.
 */
const WORKFLOW_DEPENDENCIES: Record<WorkflowType, WorkflowType[]> = {
  w1_editing: [], // No dependencies - works from source
  w2_pdf: ['w1_editing'], // Needs edited chapters/HTML from W1
  w3_publication: ['w2_pdf'], // Needs final PDFs from W2
  w4_playtesting: ['w1_editing'], // Can playtest early drafts from W1
} as const;

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Search criteria for querying artifacts across workflows.
 */
export interface ArtifactSearchCriteria {
  /** Filter by book slug */
  bookSlug?: string;
  /** Filter by workflow type */
  workflowType?: WorkflowType;
  /** Filter by artifact type */
  artifactType?: ArtifactType;
  /** Filter by workflow run status */
  status?: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  /** Only include artifacts created after this date */
  afterDate?: Date;
  /** Only include artifacts created before this date */
  beforeDate?: Date;
}

/**
 * Result of an artifact search query with pagination support.
 */
export interface ArtifactQueryResult {
  /** The matching artifacts */
  artifacts: Artifact[];
  /** Total count of matching artifacts (ignoring pagination) */
  totalCount: number;
  /** Whether there are more results beyond the current page */
  hasMore: boolean;
}

/**
 * Artifact with extended information from workflow run.
 */
export interface Artifact {
  id: string;
  workflowRunId: string;
  artifactType: ArtifactType;
  artifactPath: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  /** Book slug from the associated workflow run */
  bookSlug?: string;
  /** Workflow type from the associated workflow run */
  workflowType?: WorkflowType;
  /** Status of the workflow run that produced this artifact */
  workflowStatus?: string;
}

/**
 * Raw database row for artifact query results.
 */
interface ArtifactRow {
  id: string;
  workflow_run_id: string;
  artifact_type: string;
  artifact_path: string;
  metadata: string | null;
  created_at: string;
  book_slug?: string;
  workflow_type?: string;
  workflow_status?: string;
}

// ============================================================================
// ArtifactQuery Class
// ============================================================================

/**
 * ArtifactQuery provides cross-workflow artifact querying capabilities.
 *
 * Usage:
 * ```typescript
 * const query = new ArtifactQuery(db);
 *
 * // Search for artifacts with criteria
 * const results = query.search({ bookSlug: 'core-rulebook', artifactType: 'pdf_draft' });
 *
 * // Find the latest artifact of a type for a book
 * const latest = query.findLatestForBook('core-rulebook', 'pdf_digital');
 *
 * // Find artifacts from a specific workflow type for a book
 * const w1Artifacts = query.findByWorkflowType('core-rulebook', 'w1_editing');
 *
 * // Find dependencies for a workflow (what it needs from other workflows)
 * const deps = query.findDependencies('w2_pdf', 'core-rulebook');
 *
 * // Trace the lineage of an artifact back through the workflow chain
 * const lineage = query.getLineage('art_12345678');
 * ```
 */
export class ArtifactQuery {
  private db: Database.Database;

  /**
   * Create a new ArtifactQuery with the given database connection.
   * @param db - The better-sqlite3 database instance
   */
  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Convert a database row to an Artifact object.
   */
  private rowToArtifact(row: ArtifactRow): Artifact {
    return {
      id: row.id,
      workflowRunId: row.workflow_run_id,
      artifactType: row.artifact_type as ArtifactType,
      artifactPath: row.artifact_path,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      bookSlug: row.book_slug,
      workflowType: row.workflow_type as WorkflowType | undefined,
      workflowStatus: row.workflow_status,
    };
  }

  /**
   * Search for artifacts matching the given criteria.
   *
   * @param criteria - The search criteria to filter artifacts
   * @param limit - Maximum number of results to return (default: 100)
   * @param offset - Number of results to skip for pagination (default: 0)
   * @returns Query result with artifacts, total count, and pagination info
   */
  search(criteria: ArtifactSearchCriteria, limit = 100, offset = 0): ArtifactQueryResult {
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Build dynamic WHERE clause based on criteria
    if (criteria.bookSlug) {
      conditions.push('b.slug = ?');
      params.push(criteria.bookSlug);
    }

    if (criteria.workflowType) {
      conditions.push('wr.workflow_type = ?');
      params.push(criteria.workflowType);
    }

    if (criteria.artifactType) {
      conditions.push('wa.artifact_type = ?');
      params.push(criteria.artifactType);
    }

    if (criteria.status) {
      conditions.push('wr.status = ?');
      params.push(criteria.status);
    }

    if (criteria.afterDate) {
      conditions.push('wa.created_at > ?');
      params.push(criteria.afterDate.toISOString());
    }

    if (criteria.beforeDate) {
      conditions.push('wa.created_at < ?');
      params.push(criteria.beforeDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count first
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM workflow_artifacts wa
      INNER JOIN workflow_runs wr ON wa.workflow_run_id = wr.id
      INNER JOIN books b ON wr.book_id = b.id
      ${whereClause}
    `);
    const countResult = countStmt.get(...params) as { count: number };
    const totalCount = countResult.count;

    // Get paginated results
    const selectStmt = this.db.prepare(`
      SELECT wa.id, wa.workflow_run_id, wa.artifact_type, wa.artifact_path,
             wa.metadata, wa.created_at,
             b.slug as book_slug, wr.workflow_type, wr.status as workflow_status
      FROM workflow_artifacts wa
      INNER JOIN workflow_runs wr ON wa.workflow_run_id = wr.id
      INNER JOIN books b ON wr.book_id = b.id
      ${whereClause}
      ORDER BY wa.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = selectStmt.all(...params, limit, offset) as ArtifactRow[];
    const artifacts = rows.map((row) => this.rowToArtifact(row));

    return {
      artifacts,
      totalCount,
      hasMore: offset + artifacts.length < totalCount,
    };
  }

  /**
   * Find the latest artifact of a specific type for a book.
   *
   * @param bookSlug - The book slug to search for
   * @param artifactType - The type of artifact to find
   * @returns The most recent matching artifact, or null if none found
   */
  findLatestForBook(bookSlug: string, artifactType: ArtifactType): Artifact | null {
    const stmt = this.db.prepare(`
      SELECT wa.id, wa.workflow_run_id, wa.artifact_type, wa.artifact_path,
             wa.metadata, wa.created_at,
             b.slug as book_slug, wr.workflow_type, wr.status as workflow_status
      FROM workflow_artifacts wa
      INNER JOIN workflow_runs wr ON wa.workflow_run_id = wr.id
      INNER JOIN books b ON wr.book_id = b.id
      WHERE b.slug = ? AND wa.artifact_type = ?
      ORDER BY wa.created_at DESC
      LIMIT 1
    `);

    const row = stmt.get(bookSlug, artifactType) as ArtifactRow | undefined;
    return row ? this.rowToArtifact(row) : null;
  }

  /**
   * Find all artifacts from a specific workflow type for a book.
   *
   * @param bookSlug - The book slug to search for
   * @param workflowType - The workflow type to filter by
   * @returns Array of artifacts from that workflow type
   */
  findByWorkflowType(bookSlug: string, workflowType: WorkflowType): Artifact[] {
    const stmt = this.db.prepare(`
      SELECT wa.id, wa.workflow_run_id, wa.artifact_type, wa.artifact_path,
             wa.metadata, wa.created_at,
             b.slug as book_slug, wr.workflow_type, wr.status as workflow_status
      FROM workflow_artifacts wa
      INNER JOIN workflow_runs wr ON wa.workflow_run_id = wr.id
      INNER JOIN books b ON wr.book_id = b.id
      WHERE b.slug = ? AND wr.workflow_type = ?
      ORDER BY wa.created_at DESC
    `);

    const rows = stmt.all(bookSlug, workflowType) as ArtifactRow[];
    return rows.map((row) => this.rowToArtifact(row));
  }

  /**
   * Find artifacts that a workflow type depends on (dependency lookup).
   *
   * Uses the workflow dependency map to find artifacts from upstream workflows
   * that the specified workflow type would need as inputs.
   *
   * @param workflowType - The workflow type that needs dependencies
   * @param bookSlug - The book slug to search for
   * @returns Array of artifacts from dependency workflows (latest completed ones)
   */
  findDependencies(workflowType: WorkflowType, bookSlug: string): Artifact[] {
    const dependencyWorkflows = WORKFLOW_DEPENDENCIES[workflowType];

    if (dependencyWorkflows.length === 0) {
      return [];
    }

    // Get the artifact types produced by dependency workflows
    const dependencyArtifactTypes = dependencyWorkflows.flatMap((wf) =>
      getArtifactTypesForWorkflow(wf)
    );

    if (dependencyArtifactTypes.length === 0) {
      return [];
    }

    // Create placeholders for the IN clause
    const placeholders = dependencyArtifactTypes.map(() => '?').join(', ');
    const workflowPlaceholders = dependencyWorkflows.map(() => '?').join(', ');

    // Query for the latest artifact of each type from completed workflow runs
    const stmt = this.db.prepare(`
      SELECT wa.id, wa.workflow_run_id, wa.artifact_type, wa.artifact_path,
             wa.metadata, wa.created_at,
             b.slug as book_slug, wr.workflow_type, wr.status as workflow_status
      FROM workflow_artifacts wa
      INNER JOIN workflow_runs wr ON wa.workflow_run_id = wr.id
      INNER JOIN books b ON wr.book_id = b.id
      WHERE b.slug = ?
        AND wr.workflow_type IN (${workflowPlaceholders})
        AND wa.artifact_type IN (${placeholders})
        AND wr.status = 'completed'
      ORDER BY wa.created_at DESC
    `);

    const rows = stmt.all(
      bookSlug,
      ...dependencyWorkflows,
      ...dependencyArtifactTypes
    ) as ArtifactRow[];
    return rows.map((row) => this.rowToArtifact(row));
  }

  /**
   * Get the lineage of an artifact - trace back through the workflow chain.
   *
   * This traces an artifact back to its predecessors by:
   * 1. Finding the workflow run that produced the artifact
   * 2. Looking at the input_version_id to find earlier versions
   * 3. Finding artifacts associated with those earlier workflow runs
   *
   * @param artifactId - The ID of the artifact to trace
   * @returns Array of artifacts in the lineage, from newest to oldest
   */
  getLineage(artifactId: string): Artifact[] {
    const lineage: Artifact[] = [];
    const visited = new Set<string>();

    // Get the starting artifact
    const startArtifact = this.getArtifactById(artifactId);
    if (!startArtifact) {
      return [];
    }

    lineage.push(startArtifact);
    visited.add(startArtifact.id);

    // Get the workflow run that produced this artifact
    let currentRunId = startArtifact.workflowRunId;

    while (currentRunId) {
      const workflowRun = this.getWorkflowRunById(currentRunId);
      if (!workflowRun) {
        break;
      }

      // Look for the input_version_id to find the source workflow
      const inputVersionId = workflowRun.input_version_id;
      if (!inputVersionId) {
        break;
      }

      // Find workflow runs that produced this version as output
      const sourceRunStmt = this.db.prepare(`
        SELECT id FROM workflow_runs
        WHERE output_version_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const sourceRun = sourceRunStmt.get(inputVersionId) as { id: string } | undefined;

      if (!sourceRun) {
        break;
      }

      // Get artifacts from the source workflow run
      const artifactsStmt = this.db.prepare(`
        SELECT wa.id, wa.workflow_run_id, wa.artifact_type, wa.artifact_path,
               wa.metadata, wa.created_at,
               b.slug as book_slug, wr.workflow_type, wr.status as workflow_status
        FROM workflow_artifacts wa
        INNER JOIN workflow_runs wr ON wa.workflow_run_id = wr.id
        INNER JOIN books b ON wr.book_id = b.id
        WHERE wa.workflow_run_id = ?
        ORDER BY wa.created_at DESC
      `);

      const sourceArtifacts = artifactsStmt.all(sourceRun.id) as ArtifactRow[];

      for (const row of sourceArtifacts) {
        if (!visited.has(row.id)) {
          visited.add(row.id);
          lineage.push(this.rowToArtifact(row));
        }
      }

      // Continue tracing back through the chain
      currentRunId = sourceRun.id;
    }

    return lineage;
  }

  /**
   * Get a single artifact by its ID (private helper).
   */
  private getArtifactById(id: string): Artifact | null {
    const stmt = this.db.prepare(`
      SELECT wa.id, wa.workflow_run_id, wa.artifact_type, wa.artifact_path,
             wa.metadata, wa.created_at,
             b.slug as book_slug, wr.workflow_type, wr.status as workflow_status
      FROM workflow_artifacts wa
      INNER JOIN workflow_runs wr ON wa.workflow_run_id = wr.id
      INNER JOIN books b ON wr.book_id = b.id
      WHERE wa.id = ?
    `);

    const row = stmt.get(id) as ArtifactRow | undefined;
    return row ? this.rowToArtifact(row) : null;
  }

  /**
   * Get a workflow run by its ID (private helper).
   */
  private getWorkflowRunById(
    id: string
  ): { id: string; input_version_id: string | null; output_version_id: string | null } | null {
    const stmt = this.db.prepare(`
      SELECT id, input_version_id, output_version_id
      FROM workflow_runs
      WHERE id = ?
    `);

    return stmt.get(id) as {
      id: string;
      input_version_id: string | null;
      output_version_id: string | null;
    } | null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export { WORKFLOW_DEPENDENCIES };
