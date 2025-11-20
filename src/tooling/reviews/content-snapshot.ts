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
  chapterName: string;
  version: string;
  source: 'git' | 'claude';
  commitSha?: string;
  metadata?: Record<string, unknown>;
}

export interface BookSnapshot {
  content_id: string;
  id: number | null;
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
  content_id: string;
  id: number | null;
  book_path: string;
  chapter_path: string;
  chapter_name: string;
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

let snapshotCounter = 0;

export function snapshotBook(
  db: Database.Database,
  data: SnapshotBookData
): string {
  if (!existsSync(data.bookPath)) {
    throw new Error(`File not found: ${data.bookPath}`);
  }

  const content = readFileSync(data.bookPath, 'utf-8');
  const fileHash = calculateHash(content);
  const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

  // Generate content ID with counter for uniqueness
  const contentId =
    'book-' +
    createHash('sha256')
      .update(data.bookPath + Date.now() + (snapshotCounter++))
      .digest('hex')
      .substring(0, 12);

  const stmt = db.prepare(`
    INSERT INTO book_versions (
      content_id, book_path, version, content, metadata,
      file_hash, source, commit_sha
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    contentId,
    data.bookPath,
    data.version,
    content,
    metadataJson,
    fileHash,
    data.source,
    data.commitSha || null
  );

  return contentId;
}

export function getBookSnapshot(
  db: Database.Database,
  contentId: string
): BookSnapshot | null {
  const stmt = db.prepare(`
    SELECT * FROM book_versions WHERE content_id = ?
  `);

  const row = stmt.get(contentId);
  return row ? (row as BookSnapshot) : null;
}

export function snapshotChapter(
  db: Database.Database,
  data: SnapshotChapterData
): string {
  if (!existsSync(data.chapterPath)) {
    throw new Error(`File not found: ${data.chapterPath}`);
  }

  const content = readFileSync(data.chapterPath, 'utf-8');
  const fileHash = calculateHash(content);
  const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

  // Generate content ID with counter for uniqueness
  const contentId =
    'chapter-' +
    createHash('sha256')
      .update(data.chapterPath + Date.now() + (snapshotCounter++))
      .digest('hex')
      .substring(0, 12);

  const stmt = db.prepare(`
    INSERT INTO chapter_versions (
      content_id, book_path, chapter_path, chapter_name, version,
      content, metadata, file_hash, source, commit_sha
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    contentId,
    data.bookPath,
    data.chapterPath,
    data.chapterName,
    data.version,
    content,
    metadataJson,
    fileHash,
    data.source,
    data.commitSha || null
  );

  return contentId;
}

export function getChapterSnapshot(
  db: Database.Database,
  contentId: string
): ChapterSnapshot | null {
  const stmt = db.prepare(`
    SELECT * FROM chapter_versions WHERE content_id = ?
  `);

  const row = stmt.get(contentId);
  return row ? (row as ChapterSnapshot) : null;
}

function calculateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
