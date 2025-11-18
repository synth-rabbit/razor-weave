// src/tooling/database/snapshot-client.ts
import type Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import type { ChapterVersion } from './types.js';

export class SnapshotClient {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async createChapterSnapshot(
    filePath: string,
    source: 'git' | 'claude',
    options?: { commitSha?: string }
  ): Promise<number> {
    const content = readFileSync(filePath, 'utf-8');
    const hash = createHash('sha256').update(content).digest('hex');

    // Extract book path and chapter name from file path
    const bookPath = this.extractBookPath(filePath);
    const chapterName = this.extractChapterName(filePath);
    const version = 'draft'; // TODO: Extract from file or metadata

    const stmt = this.db.prepare(`
      INSERT INTO chapter_versions (
        book_path, chapter_path, chapter_name, version,
        content, file_hash, source, commit_sha, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      bookPath,
      filePath,
      chapterName,
      version,
      content,
      hash,
      source,
      options?.commitSha || null
    );

    return result.lastInsertRowid as number;
  }

  async createBookSnapshot(
    bookPath: string,
    source: 'git' | 'claude'
  ): Promise<number> {
    // Placeholder - would aggregate all chapters
    const stmt = this.db.prepare(`
      INSERT INTO book_versions (
        book_path, version, content, source, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(bookPath, 'draft', '{}', source);
    return result.lastInsertRowid as number;
  }

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

  archive(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE chapter_versions
      SET archived = TRUE, archived_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
  }

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
