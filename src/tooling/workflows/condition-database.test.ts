// src/tooling/workflows/condition-database.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { WorkflowConditionDatabase, createConditionDatabase } from './condition-database.js';

describe('WorkflowConditionDatabase', () => {
  let db: Database.Database;
  let conditionDb: WorkflowConditionDatabase;

  beforeEach(() => {
    db = new Database(':memory:');

    // Create schema
    db.exec(`
      CREATE TABLE books (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        book_type TEXT NOT NULL,
        source_path TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE book_versions (
        content_id TEXT PRIMARY KEY,
        book_path TEXT NOT NULL,
        book_id TEXT,
        workflow_run_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_type TEXT NOT NULL,
        book_id TEXT NOT NULL,
        input_version_id TEXT,
        output_version_id TEXT,
        session_id TEXT,
        plan_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        current_agent TEXT,
        checkpoint_json TEXT,
        current_step TEXT,
        iteration_counts TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE strategic_plans (
        id TEXT PRIMARY KEY,
        workflow_run_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE workflow_artifacts (
        id TEXT PRIMARY KEY,
        workflow_run_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    conditionDb = new WorkflowConditionDatabase(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('strategicPlanExists', () => {
    it('should return false when no plan exists', () => {
      expect(conditionDb.strategicPlanExists('wfrun_test')).toBe(false);
    });

    it('should return true when plan exists', () => {
      db.prepare('INSERT INTO strategic_plans (id, workflow_run_id) VALUES (?, ?)').run(
        'plan_123',
        'wfrun_test'
      );

      expect(conditionDb.strategicPlanExists('wfrun_test')).toBe(true);
    });

    it('should return false for different run ID', () => {
      db.prepare('INSERT INTO strategic_plans (id, workflow_run_id) VALUES (?, ?)').run(
        'plan_123',
        'wfrun_other'
      );

      expect(conditionDb.strategicPlanExists('wfrun_test')).toBe(false);
    });
  });

  describe('versionExists', () => {
    it('should return false when no version exists', () => {
      expect(conditionDb.versionExists('ver_test')).toBe(false);
    });

    it('should return true when version exists', () => {
      db.prepare('INSERT INTO book_versions (content_id, book_path) VALUES (?, ?)').run(
        'ver_test',
        'books/test'
      );

      expect(conditionDb.versionExists('ver_test')).toBe(true);
    });
  });

  describe('artifactsExist', () => {
    it('should return false when no artifacts exist', () => {
      expect(conditionDb.artifactsExist('wfrun_test')).toBe(false);
    });

    it('should return true when artifacts exist', () => {
      db.prepare('INSERT INTO workflow_artifacts (id, workflow_run_id) VALUES (?, ?)').run(
        'art_123',
        'wfrun_test'
      );

      expect(conditionDb.artifactsExist('wfrun_test')).toBe(true);
    });

    it('should return true when multiple artifacts exist', () => {
      db.prepare('INSERT INTO workflow_artifacts (id, workflow_run_id) VALUES (?, ?)').run(
        'art_1',
        'wfrun_test'
      );
      db.prepare('INSERT INTO workflow_artifacts (id, workflow_run_id) VALUES (?, ?)').run(
        'art_2',
        'wfrun_test'
      );

      expect(conditionDb.artifactsExist('wfrun_test')).toBe(true);
    });
  });

  describe('workflowStatus', () => {
    it('should return null when workflow run does not exist', () => {
      expect(conditionDb.workflowStatus('wfrun_nonexistent')).toBeNull();
    });

    it('should return status when workflow run exists', () => {
      db.prepare(
        'INSERT INTO workflow_runs (id, workflow_type, book_id, status) VALUES (?, ?, ?, ?)'
      ).run('wfrun_test', 'w1_editing', 'book_1', 'running');

      expect(conditionDb.workflowStatus('wfrun_test')).toBe('running');
    });

    it('should return correct status for pending workflow', () => {
      db.prepare(
        'INSERT INTO workflow_runs (id, workflow_type, book_id, status) VALUES (?, ?, ?, ?)'
      ).run('wfrun_pending', 'w1_editing', 'book_1', 'pending');

      expect(conditionDb.workflowStatus('wfrun_pending')).toBe('pending');
    });

    it('should return correct status for completed workflow', () => {
      db.prepare(
        'INSERT INTO workflow_runs (id, workflow_type, book_id, status) VALUES (?, ?, ?, ?)'
      ).run('wfrun_done', 'w1_editing', 'book_1', 'completed');

      expect(conditionDb.workflowStatus('wfrun_done')).toBe('completed');
    });
  });

  describe('getVersion', () => {
    it('should return null when version does not exist', () => {
      expect(conditionDb.getVersion('ver_nonexistent')).toBeNull();
    });

    it('should return version info when exists', () => {
      db.prepare('INSERT INTO book_versions (content_id, book_path, book_id) VALUES (?, ?, ?)').run(
        'ver_test',
        'books/test',
        'book_1'
      );

      const result = conditionDb.getVersion('ver_test');
      expect(result).toEqual({
        id: 'ver_test',
        book_id: 'book_1',
      });
    });

    it('should return null book_id when version has no book_id', () => {
      db.prepare('INSERT INTO book_versions (content_id, book_path) VALUES (?, ?)').run(
        'ver_orphan',
        'books/orphan'
      );

      const result = conditionDb.getVersion('ver_orphan');
      expect(result).toEqual({
        id: 'ver_orphan',
        book_id: null,
      });
    });
  });

  describe('createConditionDatabase factory', () => {
    it('should create a valid ConditionDatabase instance', () => {
      const instance = createConditionDatabase(db);
      expect(instance).toBeDefined();
      expect(typeof instance.strategicPlanExists).toBe('function');
      expect(typeof instance.versionExists).toBe('function');
      expect(typeof instance.artifactsExist).toBe('function');
      expect(typeof instance.workflowStatus).toBe('function');
      expect(typeof instance.getVersion).toBe('function');
    });
  });
});
