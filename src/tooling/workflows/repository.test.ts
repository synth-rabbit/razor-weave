// src/tooling/workflows/repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { WorkflowRepository, type CreateWorkflowRunInput } from './repository.js';
import { InvalidTransitionError } from './state-machine.js';
import type { WorkflowStatus, WorkflowType } from './types.js';

/**
 * Creates an in-memory SQLite database with the required schema for testing.
 */
function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');

  // Create books table (needed for foreign key reference)
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      book_type TEXT NOT NULL CHECK(book_type IN ('core', 'source', 'campaign', 'supplement')),
      source_path TEXT NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'editing', 'published')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create book_versions table (needed for foreign key reference)
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_versions (
      content_id TEXT PRIMARY KEY,
      book_path TEXT NOT NULL,
      book_id TEXT,
      workflow_run_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create workflow_runs table matching the migration schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_type TEXT NOT NULL CHECK(workflow_type IN (
        'w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'
      )),
      book_id TEXT NOT NULL REFERENCES books(id),
      input_version_id TEXT REFERENCES book_versions(content_id),
      output_version_id TEXT REFERENCES book_versions(content_id),
      session_id TEXT,
      plan_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
        'pending', 'running', 'paused', 'completed', 'failed'
      )),
      current_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_runs_book ON workflow_runs(book_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_runs_type ON workflow_runs(workflow_type);
  `);

  // Seed a test book for foreign key references
  db.exec(`
    INSERT INTO books (id, slug, title, book_type, source_path, status)
    VALUES ('book_test', 'test-book', 'Test Book', 'core', 'books/test', 'draft');

    INSERT INTO books (id, slug, title, book_type, source_path, status)
    VALUES ('book_other', 'other-book', 'Other Book', 'source', 'books/other', 'draft');
  `);

  // Seed test versions for linking
  db.exec(`
    INSERT INTO book_versions (content_id, book_path, book_id)
    VALUES ('version_input', 'books/test/v1', 'book_test');

    INSERT INTO book_versions (content_id, book_path, book_id)
    VALUES ('version_output', 'books/test/v2', 'book_test');
  `);

  return db;
}

describe('WorkflowRepository', () => {
  let db: Database.Database;
  let repo: WorkflowRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new WorkflowRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a workflow run with required fields only', () => {
      const input: CreateWorkflowRunInput = {
        workflow_type: 'w1_editing',
        book_id: 'book_test'
      };

      const workflow = repo.create(input);

      expect(workflow.id).toMatch(/^wfrun_/);
      expect(workflow.workflow_type).toBe('w1_editing');
      expect(workflow.book_id).toBe('book_test');
      expect(workflow.status).toBe('pending');
      expect(workflow.input_version_id).toBeNull();
      expect(workflow.output_version_id).toBeNull();
      expect(workflow.session_id).toBeNull();
      expect(workflow.plan_id).toBeNull();
      expect(workflow.current_agent).toBeNull();
      expect(workflow.created_at).toBeDefined();
      expect(workflow.updated_at).toBeDefined();
    });

    it('should create a workflow run with all optional fields', () => {
      const input: CreateWorkflowRunInput = {
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
        input_version_id: 'version_input',
        session_id: 'session_123',
        plan_id: 'plan_456'
      };

      const workflow = repo.create(input);

      expect(workflow.workflow_type).toBe('w2_pdf');
      expect(workflow.input_version_id).toBe('version_input');
      expect(workflow.session_id).toBe('session_123');
      expect(workflow.plan_id).toBe('plan_456');
    });

    it('should create workflows with all valid workflow types', () => {
      const types: WorkflowType[] = ['w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'];

      types.forEach(workflowType => {
        const workflow = repo.create({
          workflow_type: workflowType,
          book_id: 'book_test'
        });
        expect(workflow.workflow_type).toBe(workflowType);
      });
    });

    it('should always create workflows with pending status', () => {
      const workflow = repo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test'
      });

      expect(workflow.status).toBe('pending');
    });
  });

  describe('getById', () => {
    it('should return a workflow run by id', () => {
      const created = repo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test'
      });

      const found = repo.getById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.workflow_type).toBe('w1_editing');
    });

    it('should return null for non-existent id', () => {
      const found = repo.getById('nonexistent_id');

      expect(found).toBeNull();
    });
  });

  describe('list', () => {
    it('should return empty array when no workflow runs exist', () => {
      const workflows = repo.list();

      expect(workflows).toEqual([]);
    });

    it('should return all workflow runs without filters', () => {
      repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });
      repo.create({ workflow_type: 'w3_publication', book_id: 'book_other' });

      const workflows = repo.list();

      expect(workflows).toHaveLength(3);
    });

    it('should filter by bookId', () => {
      repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });
      repo.create({ workflow_type: 'w3_publication', book_id: 'book_other' });

      const workflows = repo.list({ bookId: 'book_test' });

      expect(workflows).toHaveLength(2);
      expect(workflows.every(w => w.book_id === 'book_test')).toBe(true);
    });

    it('should filter by status', () => {
      const wf1 = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });

      // Transition first workflow to running
      repo.updateStatus(wf1.id, 'running');

      const pendingWorkflows = repo.list({ status: 'pending' });
      const runningWorkflows = repo.list({ status: 'running' });

      expect(pendingWorkflows).toHaveLength(1);
      expect(runningWorkflows).toHaveLength(1);
      expect(runningWorkflows[0].id).toBe(wf1.id);
    });

    it('should filter by workflow type', () => {
      repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.create({ workflow_type: 'w1_editing', book_id: 'book_other' });
      repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });

      const editingWorkflows = repo.list({ type: 'w1_editing' });
      const pdfWorkflows = repo.list({ type: 'w2_pdf' });

      expect(editingWorkflows).toHaveLength(2);
      expect(pdfWorkflows).toHaveLength(1);
    });

    it('should combine multiple filters', () => {
      const wf1 = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.create({ workflow_type: 'w1_editing', book_id: 'book_other' });
      repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });

      // Transition first workflow to running
      repo.updateStatus(wf1.id, 'running');

      const workflows = repo.list({
        bookId: 'book_test',
        status: 'running',
        type: 'w1_editing'
      });

      expect(workflows).toHaveLength(1);
      expect(workflows[0].id).toBe(wf1.id);
    });

    it('should return workflows ordered by created_at', () => {
      const wf1 = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      const wf2 = repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });
      const wf3 = repo.create({ workflow_type: 'w3_publication', book_id: 'book_test' });

      const workflows = repo.list();

      expect(workflows[0].id).toBe(wf1.id);
      expect(workflows[1].id).toBe(wf2.id);
      expect(workflows[2].id).toBe(wf3.id);
    });
  });

  describe('updateStatus', () => {
    describe('valid transitions', () => {
      it('should transition from pending to running', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });

        const updated = repo.updateStatus(workflow.id, 'running');

        expect(updated.status).toBe('running');
      });

      it('should transition from running to paused', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');

        const updated = repo.updateStatus(workflow.id, 'paused');

        expect(updated.status).toBe('paused');
      });

      it('should transition from running to completed', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');

        const updated = repo.updateStatus(workflow.id, 'completed');

        expect(updated.status).toBe('completed');
      });

      it('should transition from running to failed', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');

        const updated = repo.updateStatus(workflow.id, 'failed');

        expect(updated.status).toBe('failed');
      });

      it('should transition from paused to running', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');
        repo.updateStatus(workflow.id, 'paused');

        const updated = repo.updateStatus(workflow.id, 'running');

        expect(updated.status).toBe('running');
      });

      it('should transition from paused to failed', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');
        repo.updateStatus(workflow.id, 'paused');

        const updated = repo.updateStatus(workflow.id, 'failed');

        expect(updated.status).toBe('failed');
      });
    });

    describe('invalid transitions', () => {
      it('should throw InvalidTransitionError when transitioning from pending to completed', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });

        expect(() => repo.updateStatus(workflow.id, 'completed'))
          .toThrow(InvalidTransitionError);
      });

      it('should throw InvalidTransitionError when transitioning from pending to paused', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });

        expect(() => repo.updateStatus(workflow.id, 'paused'))
          .toThrow(InvalidTransitionError);
      });

      it('should throw InvalidTransitionError when transitioning from pending to failed', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });

        expect(() => repo.updateStatus(workflow.id, 'failed'))
          .toThrow(InvalidTransitionError);
      });

      it('should throw InvalidTransitionError when transitioning from completed (terminal state)', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');
        repo.updateStatus(workflow.id, 'completed');

        expect(() => repo.updateStatus(workflow.id, 'running'))
          .toThrow(InvalidTransitionError);
      });

      it('should throw InvalidTransitionError when transitioning from failed (terminal state)', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');
        repo.updateStatus(workflow.id, 'failed');

        expect(() => repo.updateStatus(workflow.id, 'pending'))
          .toThrow(InvalidTransitionError);
      });

      it('should throw InvalidTransitionError when transitioning from running to pending', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');

        expect(() => repo.updateStatus(workflow.id, 'pending'))
          .toThrow(InvalidTransitionError);
      });

      it('should throw InvalidTransitionError when transitioning from paused to completed', () => {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        repo.updateStatus(workflow.id, 'running');
        repo.updateStatus(workflow.id, 'paused');

        expect(() => repo.updateStatus(workflow.id, 'completed'))
          .toThrow(InvalidTransitionError);
      });
    });

    it('should throw error for non-existent workflow run', () => {
      expect(() => repo.updateStatus('nonexistent', 'running')).toThrow('not found');
    });

    it('should update updated_at timestamp', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      const originalUpdatedAt = workflow.updated_at;

      const updated = repo.updateStatus(workflow.id, 'running');

      expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('setCurrentAgent', () => {
    it('should set the current agent', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });

      const updated = repo.setCurrentAgent(workflow.id, 'editor-agent');

      expect(updated.current_agent).toBe('editor-agent');
    });

    it('should clear the current agent when set to null', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.setCurrentAgent(workflow.id, 'editor-agent');

      const updated = repo.setCurrentAgent(workflow.id, null);

      expect(updated.current_agent).toBeNull();
    });

    it('should update the current agent to a different value', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.setCurrentAgent(workflow.id, 'editor-agent');

      const updated = repo.setCurrentAgent(workflow.id, 'reviewer-agent');

      expect(updated.current_agent).toBe('reviewer-agent');
    });

    it('should throw error for non-existent workflow run', () => {
      expect(() => repo.setCurrentAgent('nonexistent', 'agent')).toThrow('not found');
    });

    it('should update updated_at timestamp', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      const originalUpdatedAt = workflow.updated_at;

      const updated = repo.setCurrentAgent(workflow.id, 'agent');

      expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('linkOutputVersion', () => {
    it('should link an output version', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });

      const updated = repo.linkOutputVersion(workflow.id, 'version_output');

      expect(updated.output_version_id).toBe('version_output');
    });

    it('should update an existing output version link', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.linkOutputVersion(workflow.id, 'version_input');

      const updated = repo.linkOutputVersion(workflow.id, 'version_output');

      expect(updated.output_version_id).toBe('version_output');
    });

    it('should throw error for non-existent workflow run', () => {
      expect(() => repo.linkOutputVersion('nonexistent', 'version_output')).toThrow('not found');
    });

    it('should update updated_at timestamp', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      const originalUpdatedAt = workflow.updated_at;

      const updated = repo.linkOutputVersion(workflow.id, 'version_output');

      expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in session_id', () => {
      const workflow = repo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
        session_id: 'session-with-special_chars.123'
      });

      expect(workflow.session_id).toBe('session-with-special_chars.123');
    });

    it('should handle special characters in plan_id', () => {
      const workflow = repo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
        plan_id: 'plan/with/slashes'
      });

      expect(workflow.plan_id).toBe('plan/with/slashes');
    });

    it('should handle special characters in current_agent', () => {
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });

      const updated = repo.setCurrentAgent(workflow.id, 'agent:editor@v2.0');

      expect(updated.current_agent).toBe('agent:editor@v2.0');
    });

    it('should generate unique IDs for multiple workflows', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
        ids.add(workflow.id);
      }

      expect(ids.size).toBe(10);
    });
  });
});
