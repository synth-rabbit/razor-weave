/**
 * ArtifactRegistry - Registry for workflow artifacts.
 *
 * Provides methods to register and query artifacts produced by workflow runs.
 * Artifacts are stored in the workflow_artifacts table and can be queried
 * by ID, workflow run ID, artifact type, or combinations thereof.
 */

import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';

/**
 * Valid artifact types matching the CHECK constraint in workflow_artifacts table
 */
export type ArtifactType =
  | 'chapter'
  | 'release_notes'
  | 'print_html'
  | 'web_html'
  | 'pdf_draft'
  | 'pdf_digital'
  | 'pdf_print'
  | 'layout_plan'
  | 'design_plan'
  | 'deployment'
  | 'qa_report'
  | 'marketing_copy'
  | 'announcement'
  | 'playtest_session'
  | 'playtest_analysis'
  | 'playtest_feedback';

/**
 * All valid artifact types as an array for runtime validation
 */
export const ARTIFACT_TYPES: readonly ArtifactType[] = [
  'chapter',
  'release_notes',
  'print_html',
  'web_html',
  'pdf_draft',
  'pdf_digital',
  'pdf_print',
  'layout_plan',
  'design_plan',
  'deployment',
  'qa_report',
  'marketing_copy',
  'announcement',
  'playtest_session',
  'playtest_analysis',
  'playtest_feedback',
] as const;

/**
 * Input for registering a new artifact
 */
export interface RegisterArtifactInput {
  workflowRunId: string;
  artifactType: ArtifactType;
  artifactPath: string;
  metadata?: Record<string, unknown>;
}

/**
 * Interface representing a workflow artifact record from the database
 */
export interface WorkflowArtifact {
  id: string;
  workflowRunId: string;
  artifactType: ArtifactType;
  artifactPath: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Raw database row type for workflow_artifacts table
 */
interface WorkflowArtifactRow {
  id: string;
  workflow_run_id: string;
  artifact_type: string;
  artifact_path: string;
  metadata: string | null;
  created_at: string;
}

/**
 * Error thrown when artifact path validation fails
 */
export class InvalidArtifactPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidArtifactPathError';
  }
}

/**
 * ArtifactRegistry provides methods to register and query workflow artifacts.
 *
 * Usage:
 * ```typescript
 * const registry = new ArtifactRegistry(db);
 *
 * // Register an artifact
 * const artifact = registry.register({
 *   workflowRunId: 'run_12345',
 *   artifactType: 'pdf_draft',
 *   artifactPath: '/output/book-draft.pdf',
 *   metadata: { pages: 42 }
 * });
 *
 * // Query artifacts
 * const byId = registry.getById(artifact.id);
 * const byRun = registry.getByRunId('run_12345');
 * const byType = registry.getByType('pdf_draft');
 * const combined = registry.getByRunAndType('run_12345', 'pdf_draft');
 * ```
 */
export class ArtifactRegistry {
  private db: Database.Database;

  /**
   * Create a new ArtifactRegistry with the given database connection
   * @param db - The better-sqlite3 database instance
   */
  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Generate a unique artifact ID
   */
  private generateId(): string {
    return `art_${randomUUID().slice(0, 8)}`;
  }

  /**
   * Convert a database row to a WorkflowArtifact object
   */
  private rowToArtifact(row: WorkflowArtifactRow): WorkflowArtifact {
    return {
      id: row.id,
      workflowRunId: row.workflow_run_id,
      artifactType: row.artifact_type as ArtifactType,
      artifactPath: row.artifact_path,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
    };
  }

  /**
   * Register a new artifact in the registry
   * @param input - The artifact registration details
   * @returns The created workflow artifact
   * @throws {InvalidArtifactPathError} if artifact_path is empty
   */
  register(input: RegisterArtifactInput): WorkflowArtifact {
    if (!input.artifactPath || input.artifactPath.trim() === '') {
      throw new InvalidArtifactPathError('Artifact path cannot be empty');
    }

    const id = this.generateId();
    const metadata = input.metadata ? JSON.stringify(input.metadata) : null;

    const stmt = this.db.prepare(`
      INSERT INTO workflow_artifacts (
        id, workflow_run_id, artifact_type, artifact_path, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(id, input.workflowRunId, input.artifactType, input.artifactPath, metadata);

    // Fetch the inserted row to get the created_at timestamp
    return this.getById(id)!;
  }

  /**
   * Get an artifact by its ID
   * @param id - The artifact ID
   * @returns The artifact if found, null otherwise
   */
  getById(id: string): WorkflowArtifact | null {
    const stmt = this.db.prepare(`
      SELECT id, workflow_run_id, artifact_type, artifact_path, metadata, created_at
      FROM workflow_artifacts
      WHERE id = ?
    `);

    const row = stmt.get(id) as WorkflowArtifactRow | undefined;
    return row ? this.rowToArtifact(row) : null;
  }

  /**
   * Get all artifacts for a workflow run
   * @param runId - The workflow run ID
   * @returns Array of artifacts for the run
   */
  getByRunId(runId: string): WorkflowArtifact[] {
    const stmt = this.db.prepare(`
      SELECT id, workflow_run_id, artifact_type, artifact_path, metadata, created_at
      FROM workflow_artifacts
      WHERE workflow_run_id = ?
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(runId) as WorkflowArtifactRow[];
    return rows.map((row) => this.rowToArtifact(row));
  }

  /**
   * Get all artifacts of a specific type
   * @param artifactType - The artifact type to filter by
   * @returns Array of artifacts of the specified type
   */
  getByType(artifactType: ArtifactType): WorkflowArtifact[] {
    const stmt = this.db.prepare(`
      SELECT id, workflow_run_id, artifact_type, artifact_path, metadata, created_at
      FROM workflow_artifacts
      WHERE artifact_type = ?
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(artifactType) as WorkflowArtifactRow[];
    return rows.map((row) => this.rowToArtifact(row));
  }

  /**
   * Get artifacts for a specific run and type combination
   * @param runId - The workflow run ID
   * @param artifactType - The artifact type to filter by
   * @returns Array of matching artifacts
   */
  getByRunAndType(runId: string, artifactType: ArtifactType): WorkflowArtifact[] {
    const stmt = this.db.prepare(`
      SELECT id, workflow_run_id, artifact_type, artifact_path, metadata, created_at
      FROM workflow_artifacts
      WHERE workflow_run_id = ? AND artifact_type = ?
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(runId, artifactType) as WorkflowArtifactRow[];
    return rows.map((row) => this.rowToArtifact(row));
  }
}
