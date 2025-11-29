// src/tooling/workflows/w1r-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { W1RRepository } from './w1r-repository.js';
import { createW1RCheckpoint } from './w1r-types.js';

describe('W1RRepository', () => {
  let db: Database.Database;
  let repo: W1RRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    // Create minimal schema
    db.exec(`
      CREATE TABLE workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_type TEXT NOT NULL,
        book_id TEXT NOT NULL,
        status TEXT NOT NULL,
        checkpoint_json TEXT,
        current_step TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE books (
        id TEXT PRIMARY KEY,
        slug TEXT,
        title TEXT
      );
      INSERT INTO books (id, slug, title) VALUES ('book1', 'core-rulebook', 'Core Rulebook');
    `);
    repo = new W1RRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createRun', () => {
    it('should create a new workflow run', () => {
      const checkpoint = createW1RCheckpoint('wfrun_test1', 'core-rulebook', '1.4.0', '/path');
      const id = repo.createRun('book1', checkpoint);

      expect(id).toBe('wfrun_test1');

      const result = repo.getRun('wfrun_test1');
      expect(result).not.toBeNull();
      expect(result!.run.status).toBe('running');
      expect(result!.checkpoint.currentChapter).toBe(1);
    });
  });

  describe('updateCheckpoint', () => {
    it('should update checkpoint and current_step', () => {
      const checkpoint = createW1RCheckpoint('wfrun_update', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', checkpoint);

      checkpoint.currentChapter = 5;
      checkpoint.chapterStatus = 'reviewing';
      repo.updateCheckpoint('wfrun_update', checkpoint);

      const result = repo.getRun('wfrun_update');
      expect(result!.checkpoint.currentChapter).toBe(5);
      expect(result!.run.currentStep).toBe('chapter_5_reviewing');
    });
  });

  describe('getActiveRunForBook', () => {
    it('should return null when no active run', () => {
      const result = repo.getActiveRunForBook('book1');
      expect(result).toBeNull();
    });

    it('should return active run', () => {
      const checkpoint = createW1RCheckpoint('wfrun_active', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', checkpoint);

      const result = repo.getActiveRunForBook('book1');
      expect(result).not.toBeNull();
      expect(result!.run.id).toBe('wfrun_active');
    });

    it('should not return completed runs', () => {
      const checkpoint = createW1RCheckpoint('wfrun_done', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', checkpoint);
      repo.updateStatus('wfrun_done', 'completed');

      const result = repo.getActiveRunForBook('book1');
      expect(result).toBeNull();
    });
  });

  describe('listRuns', () => {
    it('should list all W1R runs', () => {
      const cp1 = createW1RCheckpoint('wfrun_1', 'core-rulebook', '1.4.0', '/path');
      const cp2 = createW1RCheckpoint('wfrun_2', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', cp1);
      repo.createRun('book1', cp2);

      const runs = repo.listRuns();
      expect(runs).toHaveLength(2);
    });

    it('should filter by status', () => {
      const cp1 = createW1RCheckpoint('wfrun_a', 'core-rulebook', '1.4.0', '/path');
      const cp2 = createW1RCheckpoint('wfrun_b', 'core-rulebook', '1.4.0', '/path');
      repo.createRun('book1', cp1);
      repo.createRun('book1', cp2);
      repo.updateStatus('wfrun_b', 'completed');

      const runs = repo.listRuns({ status: 'running' });
      expect(runs).toHaveLength(1);
      expect(runs[0].run.id).toBe('wfrun_a');
    });
  });

  describe('generateRunId', () => {
    it('should generate unique IDs with wfrun_ prefix', () => {
      const id1 = repo.generateRunId();
      const id2 = repo.generateRunId();

      expect(id1).toMatch(/^wfrun_[a-z0-9]+$/);
      expect(id2).toMatch(/^wfrun_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
