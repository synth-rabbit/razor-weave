// src/tooling/workflows/w1r-repository.ts

import type Database from 'better-sqlite3';
import type { W1RCheckpoint } from './w1r-types.js';

export class W1RRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create a new W1R workflow run
   */
  createRun(bookId: string, checkpoint: W1RCheckpoint): string {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_runs (
        id, workflow_type, book_id, status, checkpoint_json,
        current_step, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      checkpoint.workflowRunId,
      'w1r_revision',
      bookId,
      'running',
      JSON.stringify(checkpoint),
      `chapter_${checkpoint.currentChapter}_${checkpoint.chapterStatus}`
    );

    return checkpoint.workflowRunId;
  }

  /**
   * Get W1R run by ID
   */
  getRun(runId: string): { run: WorkflowRun; checkpoint: W1RCheckpoint } | null {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_runs WHERE id = ? AND workflow_type = 'w1r_revision'
    `);

    const row = stmt.get(runId) as WorkflowRunRow | undefined;
    if (!row) return null;

    return {
      run: rowToRun(row),
      checkpoint: JSON.parse(row.checkpoint_json) as W1RCheckpoint,
    };
  }

  /**
   * Update checkpoint for a run
   */
  updateCheckpoint(runId: string, checkpoint: W1RCheckpoint): void {
    const stmt = this.db.prepare(`
      UPDATE workflow_runs
      SET checkpoint_json = ?,
          current_step = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      JSON.stringify(checkpoint),
      `chapter_${checkpoint.currentChapter}_${checkpoint.chapterStatus}`,
      runId
    );
  }

  /**
   * Update run status
   */
  updateStatus(runId: string, status: 'running' | 'paused' | 'completed' | 'failed'): void {
    const stmt = this.db.prepare(`
      UPDATE workflow_runs SET status = ?, updated_at = datetime('now') WHERE id = ?
    `);
    stmt.run(status, runId);
  }

  /**
   * Get active W1R run for a book (only one allowed)
   */
  getActiveRunForBook(bookId: string): { run: WorkflowRun; checkpoint: W1RCheckpoint } | null {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_runs
      WHERE book_id = ?
        AND workflow_type = 'w1r_revision'
        AND status IN ('running', 'paused')
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const row = stmt.get(bookId) as WorkflowRunRow | undefined;
    if (!row) return null;

    return {
      run: rowToRun(row),
      checkpoint: JSON.parse(row.checkpoint_json) as W1RCheckpoint,
    };
  }

  /**
   * List W1R runs with optional filters
   */
  listRuns(options?: {
    bookId?: string;
    status?: string;
    limit?: number;
  }): Array<{ run: WorkflowRun; checkpoint: W1RCheckpoint }> {
    let sql = `
      SELECT * FROM workflow_runs
      WHERE workflow_type = 'w1r_revision'
    `;
    const params: unknown[] = [];

    if (options?.bookId) {
      sql += ' AND book_id = ?';
      params.push(options.bookId);
    }

    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY updated_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as WorkflowRunRow[];

    return rows.map(row => ({
      run: rowToRun(row),
      checkpoint: JSON.parse(row.checkpoint_json) as W1RCheckpoint,
    }));
  }

  /**
   * Generate unique run ID
   */
  generateRunId(): string {
    const random = Math.random().toString(36).substring(2, 10);
    return `wfrun_${random}`;
  }
}

// Types for database rows
interface WorkflowRunRow {
  id: string;
  workflow_type: string;
  book_id: string;
  status: string;
  checkpoint_json: string;
  current_step: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  workflowType: string;
  bookId: string;
  status: string;
  currentStep: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToRun(row: WorkflowRunRow): WorkflowRun {
  return {
    id: row.id,
    workflowType: row.workflow_type,
    bookId: row.book_id,
    status: row.status,
    currentStep: row.current_step,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
