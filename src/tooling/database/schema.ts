// src/tooling/database/schema.ts
import type Database from 'better-sqlite3';

export const SCHEMA_VERSION = 1;

export function createTables(db: Database.Database): void {
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create state table
  db.exec(`
    CREATE TABLE IF NOT EXISTS state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_state_key ON state(key);
  `);

  // Create book_versions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_path TEXT NOT NULL,
      version TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      file_hash TEXT,
      source TEXT NOT NULL CHECK(source IN ('git', 'claude')),
      commit_sha TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_book_path ON book_versions(book_path);
    CREATE INDEX IF NOT EXISTS idx_book_version ON book_versions(version);
    CREATE INDEX IF NOT EXISTS idx_book_created ON book_versions(created_at);
  `);

  // Create chapter_versions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapter_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_path TEXT NOT NULL,
      chapter_path TEXT NOT NULL,
      chapter_name TEXT NOT NULL,
      version TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      file_hash TEXT,
      source TEXT NOT NULL CHECK(source IN ('git', 'claude')),
      commit_sha TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_chapter_path ON chapter_versions(chapter_path);
    CREATE INDEX IF NOT EXISTS idx_chapter_book ON chapter_versions(book_path);
    CREATE INDEX IF NOT EXISTS idx_chapter_created ON chapter_versions(created_at);
  `);

  // Create data_artifacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artifact_type TEXT NOT NULL,
      artifact_path TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_artifact_type ON data_artifacts(artifact_type);
    CREATE INDEX IF NOT EXISTS idx_artifact_path ON data_artifacts(artifact_path);
  `);

  // Store schema version
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_info (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO schema_info (version) VALUES (${SCHEMA_VERSION});
  `);
}
