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

  // Persona metadata and single-value dimensions
  db.exec(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('core', 'generated')),
      archetype TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      fiction_first_alignment TEXT NOT NULL,
      narrative_mechanics_comfort TEXT NOT NULL,
      gm_philosophy TEXT NOT NULL,
      genre_flexibility TEXT NOT NULL,
      primary_cognitive_style TEXT NOT NULL,
      secondary_cognitive_style TEXT,
      schema_version INTEGER DEFAULT 1,
      generated_seed INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      active BOOLEAN DEFAULT TRUE
    );
  `);

  // Multi-value dimensions
  db.exec(`
    CREATE TABLE IF NOT EXISTS persona_dimensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      persona_id TEXT NOT NULL,
      dimension_type TEXT NOT NULL CHECK(dimension_type IN (
        'playstyle_modifiers',
        'social_emotional_traits',
        'system_exposures',
        'life_contexts'
      )),
      value TEXT NOT NULL,
      FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_persona_dimensions_persona_id
      ON persona_dimensions(persona_id);
    CREATE INDEX IF NOT EXISTS idx_persona_dimensions_type
      ON persona_dimensions(dimension_type);
  `);

  // Generation statistics
  db.exec(`
    CREATE TABLE IF NOT EXISTS persona_generation_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      total_generated INTEGER NOT NULL,
      valid_count INTEGER NOT NULL,
      invalid_count INTEGER NOT NULL,
      dimension_distribution TEXT,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_generation_stats_batch
      ON persona_generation_stats(batch_id);
  `);

  // Create review_campaigns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS review_campaigns (
      id TEXT PRIMARY KEY,
      campaign_name TEXT NOT NULL,
      content_type TEXT NOT NULL CHECK(content_type IN ('book', 'chapter')),
      content_id INTEGER NOT NULL,
      persona_selection_strategy TEXT NOT NULL CHECK(
        persona_selection_strategy IN ('all_core', 'manual', 'smart_sampling')
      ),
      persona_ids TEXT NOT NULL,
      status TEXT NOT NULL CHECK(
        status IN ('pending', 'in_progress', 'analyzing', 'completed', 'failed')
      ),
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON review_campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_content ON review_campaigns(content_type, content_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_created ON review_campaigns(created_at);
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
