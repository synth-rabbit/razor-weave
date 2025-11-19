// src/tooling/reviews/content-snapshot.ts
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import Database from 'better-sqlite3';

export interface SnapshotBookData {
  bookPath: string;
  version: string;
  source: 'git' | 'claude';
  commitSha?: string;
  metadata?: Record<string, unknown>;
}

export interface SnapshotChapterData {
  bookPath: string;
  chapterPath: string;
  version: string;
  source: 'git' | 'claude';
  commitSha?: string;
  metadata?: Record<string, unknown>;
}

export interface BookSnapshot {
  id: number;
  book_path: string;
  version: string;
  content: string;
  metadata: string | null;
  file_hash: string;
  source: 'git' | 'claude';
  commit_sha: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface ChapterSnapshot {
  id: number;
  book_path: string;
  chapter_path: string;
  version: string;
  content: string;
  metadata: string | null;
  file_hash: string;
  source: 'git' | 'claude';
  commit_sha: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export function snapshotBook(
  db: Database.Database,
  data: SnapshotBookData
): number {
  if (!existsSync(data.bookPath)) {
    throw new Error(`File not found: ${data.bookPath}`);
  }

  const content = readFileSync(data.bookPath, 'utf-8');
  const fileHash = calculateHash(content);
  const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

  const stmt = db.prepare(`
    INSERT INTO book_versions (
      book_path, version, content, metadata,
      file_hash, source, commit_sha
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.bookPath,
    data.version,
    content,
    metadataJson,
    fileHash,
    data.source,
    data.commitSha || null
  );

  return result.lastInsertRowid as number;
}

export function getBookSnapshot(
  db: Database.Database,
  id: number
): BookSnapshot | null {
  const stmt = db.prepare(`
    SELECT * FROM book_versions WHERE id = ?
  `);

  const row = stmt.get(id);
  return row ? (row as BookSnapshot) : null;
}

function calculateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
