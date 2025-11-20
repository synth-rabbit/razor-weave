// src/tooling/database/snapshot-client.ts
import type Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import type { ChapterVersion } from './types.js';

let snapshotCounter = 0;

/**
 * Client for managing content snapshots in the database.
 * Provides versioning and history tracking for chapters and books.
 */
export class SnapshotClient {
  private db: Database.Database;

  /**
   * Creates a new SnapshotClient instance.
   * @param db - The better-sqlite3 database instance
   */
  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Creates a snapshot of a chapter file.
   * Generates a unique content ID and stores chapter content with hash verification.
   *
   * @param filePath - Absolute path to the chapter markdown file
   * @param source - Source of the snapshot ('git' or 'claude')
   * @param options - Optional configuration
   * @param options.commitSha - Git commit SHA if from git source
   * @returns Content ID in format 'chapter-{12hexchars}'
   *
   * @example
   * ```ts
   * const contentId = snapshotClient.createChapterSnapshot(
   *   'books/core/v1/chapters/01-intro.md',
   *   'claude'
   * );
   * console.log(contentId); // 'chapter-a1b2c3d4e5f6'
   * ```
   */
  createChapterSnapshot(
    filePath: string,
    source: 'git' | 'claude',
    options?: { commitSha?: string }
  ): string {
    const contentId =
      'chapter-' +
      createHash('sha256')
        .update(filePath + Date.now() + (snapshotCounter++))
        .digest('hex')
        .substring(0, 12);

    const content = readFileSync(filePath, 'utf-8');
    const hash = createHash('sha256').update(content).digest('hex');

    // Extract book path and chapter name from file path
    const bookPath = this.extractBookPath(filePath);
    const chapterName = this.extractChapterName(filePath);
    const version = 'draft'; // TODO: Extract from file or metadata

    const stmt = this.db.prepare(`
      INSERT INTO chapter_versions (
        content_id, book_path, chapter_path, chapter_name, version,
        content, file_hash, source, commit_sha, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      contentId,
      bookPath,
      filePath,
      chapterName,
      version,
      content,
      hash,
      source,
      options?.commitSha || null
    );

    return contentId;
  }

  /**
   * Creates a snapshot of an entire book file.
   * Stores book HTML content with version and chapter count metadata.
   *
   * @param options - Book snapshot configuration
   * @param options.bookPath - Path to the book HTML file
   * @param options.version - Book version identifier (e.g., 'v1.0', 'draft')
   * @param options.chapterCount - Number of chapters in the book
   * @param options.source - Source of snapshot, defaults to 'claude'
   * @returns Content ID in format 'book-{12hexchars}'
   *
   * @example
   * ```ts
   * const contentId = snapshotClient.createBookSnapshot({
   *   bookPath: 'site/core_rulebook.html',
   *   version: 'v1.0',
   *   chapterCount: 30
   * });
   * console.log(contentId); // 'book-9f8e7d6c5b4a'
   * ```
   */
  createBookSnapshot(options: {
    bookPath: string;
    version: string;
    chapterCount: number;
    source?: 'git' | 'claude';
  }): string {
    const { bookPath, version, chapterCount, source = 'claude' } = options;
    const contentId =
      'book-' +
      createHash('sha256')
        .update(bookPath + Date.now() + (snapshotCounter++))
        .digest('hex')
        .substring(0, 12);

    const content = readFileSync(bookPath, 'utf-8');
    const fileHash = createHash('sha256').update(content).digest('hex');

    const stmt = this.db.prepare(`
      INSERT INTO book_versions (
        content_id, book_path, version, chapter_count,
        content, file_hash, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(contentId, bookPath, version, chapterCount, content, fileHash, source);
    return contentId;
  }

  /**
   * Retrieves version history for a chapter.
   * Returns snapshots in reverse chronological order (newest first).
   *
   * @param chapterPath - Path to the chapter file
   * @param limit - Optional maximum number of versions to return
   * @returns Array of chapter versions, excluding archived versions
   */
  getChapterHistory(chapterPath: string, limit?: number): ChapterVersion[] {
    const limitClause = limit ? `LIMIT ${limit}` : '';

    const stmt = this.db.prepare(`
      SELECT * FROM chapter_versions
      WHERE chapter_path = ? AND archived = FALSE
      ORDER BY created_at DESC, id DESC
      ${limitClause}
    `);

    return stmt.all(chapterPath) as ChapterVersion[];
  }

  /**
   * Retrieves the chapter version that existed at a specific time.
   * Returns the most recent non-archived snapshot at or before the timestamp.
   *
   * @param chapterPath - Path to the chapter file
   * @param timestamp - Point in time to query
   * @returns Chapter version at that time, or null if none exists
   */
  getChapterAtTime(chapterPath: string, timestamp: Date): ChapterVersion | null {
    const stmt = this.db.prepare(`
      SELECT * FROM chapter_versions
      WHERE chapter_path = ?
        AND created_at <= ?
        AND archived = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const row = stmt.get(chapterPath, timestamp.toISOString());
    return row as ChapterVersion | null;
  }

  /**
   * Marks recent Claude-generated snapshots as committed to git.
   * Updates all Claude snapshots from the last hour that don't have a commit SHA.
   *
   * @param commitSha - The git commit SHA to associate with snapshots
   */
  markAsCommitted(commitSha: string): void {
    const stmt = this.db.prepare(`
      UPDATE chapter_versions
      SET commit_sha = ?
      WHERE commit_sha IS NULL
        AND source = 'claude'
        AND created_at >= datetime('now', '-1 hour')
    `);

    stmt.run(commitSha);
  }

  /**
   * Archives a snapshot version.
   * Archived versions are excluded from history queries.
   *
   * @param id - The snapshot ID to archive
   */
  archive(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE chapter_versions
      SET archived = TRUE, archived_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * Unarchives a previously archived snapshot.
   * Makes the version visible in history queries again.
   *
   * @param id - The snapshot ID to unarchive
   */
  unarchive(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE chapter_versions
      SET archived = FALSE, archived_at = NULL
      WHERE id = ?
    `);

    stmt.run(id);
  }

  private extractBookPath(filePath: string): string {
    // Extract book path from chapter path
    // e.g., "books/core/v1/manuscript/chapters/01.md" -> "books/core/v1"
    const match = filePath.match(/^(books\/[^/]+\/[^/]+)/);
    return match ? match[1] : 'unknown';
  }

  private extractChapterName(filePath: string): string {
    // Extract chapter name from file path
    const match = filePath.match(/([^/]+)\.md$/);
    return match ? match[1] : 'unknown';
  }
}
