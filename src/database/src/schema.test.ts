import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables, SCHEMA_VERSION } from './schema.js';

describe('Database Schema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
  });

  it('should create state table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='state'").get();
    expect(table).toBeDefined();
  });

  it('should create book_versions table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='book_versions'").get();
    expect(table).toBeDefined();
  });

  it('should create chapter_versions table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chapter_versions'").get();
    expect(table).toBeDefined();
  });

  it('should create data_artifacts table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='data_artifacts'").get();
    expect(table).toBeDefined();
  });

  it('should create personas table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='personas'").get();
    expect(table).toBeDefined();
  });

  it('should create persona_dimensions table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='persona_dimensions'").get();
    expect(table).toBeDefined();
  });

  it('should create persona_generation_stats table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='persona_generation_stats'").get();
    expect(table).toBeDefined();
  });

  it('should create review_campaigns table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='review_campaigns'").get();
    expect(table).toBeDefined();
  });

  it('should create persona_reviews table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='persona_reviews'").get();
    expect(table).toBeDefined();
  });

  it('should create campaign_analyses table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='campaign_analyses'").get();
    expect(table).toBeDefined();
  });

  it('should create schema_info table', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_info'").get();
    expect(table).toBeDefined();
  });

  it('should store correct schema version', () => {
    const result = db.prepare('SELECT version FROM schema_info').get() as { version: number };
    expect(result.version).toBe(SCHEMA_VERSION);
  });

  it('should have correct indexes', () => {
    interface IndexRow {
      name: string;
    }
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as IndexRow[];
    expect(indexes.length).toBeGreaterThan(0);

    // Check for specific important indexes
    const indexNames = indexes.map((idx) => idx.name);
    expect(indexNames).toContain('idx_state_key');
    expect(indexNames).toContain('idx_campaigns_status');
    expect(indexNames).toContain('idx_persona_reviews_campaign');
  });

  it('should attempt to enable WAL journal mode', () => {
    // Note: In-memory databases don't support WAL mode and will remain in 'memory' mode
    // This test just verifies createTables doesn't error when setting pragma
    const result = db.pragma('journal_mode', { simple: true }) as string;
    expect(result).toBeDefined();
    expect(['wal', 'memory']).toContain(result);
  });
});
