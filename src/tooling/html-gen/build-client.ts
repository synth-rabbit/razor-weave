/**
 * HTML Build Client
 *
 * Database operations for tracking HTML builds.
 * Shared between print-design and web-reader workflows.
 */

import type Database from 'better-sqlite3';

export interface HtmlBuild {
  id: number;
  buildId: string;
  outputType: string;
  bookPath: string;
  outputPath: string;
  sourceHash: string;
  createdAt: string;
  status: 'success' | 'failed';
}

export interface HtmlBuildSource {
  buildId: string;
  filePath: string;
  contentHash: string;
  fileType: 'chapter' | 'sheet';
}

export interface CreateBuildParams {
  outputType: string;
  bookPath: string;
  outputPath: string;
  sourceHash: string;
  sources: Array<{
    filePath: string;
    contentHash: string;
    fileType: 'chapter' | 'sheet';
  }>;
}

export interface BuildDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

/**
 * Generate a unique build ID with timestamp and random suffix
 */
function generateBuildId(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\.\d{3}Z$/, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `build-${timestamp}-${random}`;
}

export class HtmlBuildClient {
  constructor(private db: Database.Database) {}

  /**
   * Create a new build record with its sources
   * @returns The generated build_id
   */
  createBuild(params: CreateBuildParams): string {
    const buildId = generateBuildId();
    const createdAt = new Date().toISOString();

    // Insert build record
    this.db.prepare(`
      INSERT INTO html_builds (build_id, output_type, book_path, output_path, source_hash, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'success')
    `).run(buildId, params.outputType, params.bookPath, params.outputPath, params.sourceHash, createdAt);

    // Insert source records
    const insertSource = this.db.prepare(`
      INSERT INTO html_build_sources (build_id, file_path, content_hash, file_type)
      VALUES (?, ?, ?, ?)
    `);

    for (const source of params.sources) {
      insertSource.run(buildId, source.filePath, source.contentHash, source.fileType);
    }

    return buildId;
  }

  /**
   * Get a build by its ID
   */
  getBuild(buildId: string): HtmlBuild | null {
    const row = this.db.prepare(`
      SELECT id, build_id, output_type, book_path, output_path, source_hash, created_at, status
      FROM html_builds
      WHERE build_id = ?
    `).get(buildId) as {
      id: number;
      build_id: string;
      output_type: string;
      book_path: string;
      output_path: string;
      source_hash: string;
      created_at: string;
      status: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      buildId: row.build_id,
      outputType: row.output_type,
      bookPath: row.book_path,
      outputPath: row.output_path,
      sourceHash: row.source_hash,
      createdAt: row.created_at,
      status: row.status as 'success' | 'failed',
    };
  }

  /**
   * Get sources for a build
   */
  getBuildSources(buildId: string): HtmlBuildSource[] {
    const rows = this.db.prepare(`
      SELECT build_id, file_path, content_hash, file_type
      FROM html_build_sources
      WHERE build_id = ?
      ORDER BY file_path
    `).all(buildId) as Array<{
      build_id: string;
      file_path: string;
      content_hash: string;
      file_type: string;
    }>;

    return rows.map(row => ({
      buildId: row.build_id,
      filePath: row.file_path,
      contentHash: row.content_hash,
      fileType: row.file_type as 'chapter' | 'sheet',
    }));
  }

  /**
   * List builds for an output type, most recent first
   */
  listBuilds(outputType: string, limit = 10): HtmlBuild[] {
    const rows = this.db.prepare(`
      SELECT id, build_id, output_type, book_path, output_path, source_hash, created_at, status
      FROM html_builds
      WHERE output_type = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `).all(outputType, limit) as Array<{
      id: number;
      build_id: string;
      output_type: string;
      book_path: string;
      output_path: string;
      source_hash: string;
      created_at: string;
      status: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      buildId: row.build_id,
      outputType: row.output_type,
      bookPath: row.book_path,
      outputPath: row.output_path,
      sourceHash: row.source_hash,
      createdAt: row.created_at,
      status: row.status as 'success' | 'failed',
    }));
  }

  /**
   * Get the most recent successful build for an output type
   */
  getLatestBuild(outputType: string): HtmlBuild | null {
    const row = this.db.prepare(`
      SELECT id, build_id, output_type, book_path, output_path, source_hash, created_at, status
      FROM html_builds
      WHERE output_type = ? AND status = 'success'
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `).get(outputType) as {
      id: number;
      build_id: string;
      output_type: string;
      book_path: string;
      output_path: string;
      source_hash: string;
      created_at: string;
      status: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      buildId: row.build_id,
      outputType: row.output_type,
      bookPath: row.book_path,
      outputPath: row.output_path,
      sourceHash: row.source_hash,
      createdAt: row.created_at,
      status: row.status as 'success' | 'failed',
    };
  }

  /**
   * Mark a build as failed
   */
  markBuildFailed(buildId: string): void {
    this.db.prepare(`
      UPDATE html_builds
      SET status = 'failed'
      WHERE build_id = ?
    `).run(buildId);
  }

  /**
   * Compare two builds and return the differences
   */
  diffBuilds(fromBuildId: string, toBuildId: string): BuildDiff {
    const fromSources = this.getBuildSources(fromBuildId);
    const toSources = this.getBuildSources(toBuildId);

    const fromMap = new Map(fromSources.map(s => [s.filePath, s.contentHash]));
    const toMap = new Map(toSources.map(s => [s.filePath, s.contentHash]));

    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];

    // Find added and changed
    for (const [path, hash] of toMap) {
      if (!fromMap.has(path)) {
        added.push(path);
      } else if (fromMap.get(path) !== hash) {
        changed.push(path);
      }
    }

    // Find removed
    for (const path of fromMap.keys()) {
      if (!toMap.has(path)) {
        removed.push(path);
      }
    }

    return {
      added: added.sort(),
      removed: removed.sort(),
      changed: changed.sort(),
    };
  }
}
