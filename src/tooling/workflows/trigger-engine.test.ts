// src/tooling/workflows/trigger-engine.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { TriggerEngine, type RegisterTriggerInput, type TriggerCondition } from './trigger-engine.js';
import { WorkflowRepository } from './repository.js';
import type { WorkflowType } from './types.js';

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

  // Create workflow_triggers table from migration 005
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_triggers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_workflow_type TEXT NOT NULL CHECK(source_workflow_type IN (
        'w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'
      )),
      target_workflow_type TEXT NOT NULL CHECK(target_workflow_type IN (
        'w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'
      )),
      trigger_condition TEXT NOT NULL CHECK(trigger_condition IN (
        'on_complete', 'on_approve', 'manual'
      )),
      enabled BOOLEAN DEFAULT TRUE,
      config TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_triggers_source ON workflow_triggers(source_workflow_type);
    CREATE INDEX IF NOT EXISTS idx_triggers_target ON workflow_triggers(target_workflow_type);
    CREATE INDEX IF NOT EXISTS idx_triggers_enabled ON workflow_triggers(enabled) WHERE enabled = TRUE;
  `);

  // Create workflow_events table for approval checking
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_events (
      id TEXT PRIMARY KEY,
      workflow_run_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN (
        'started', 'completed', 'rejected', 'escalated', 'paused', 'resumed'
      )),
      agent_name TEXT,
      data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed test books for foreign key references
  db.exec(`
    INSERT INTO books (id, slug, title, book_type, source_path, status)
    VALUES ('book_test', 'test-book', 'Test Book', 'core', 'books/test', 'draft');

    INSERT INTO books (id, slug, title, book_type, source_path, status)
    VALUES ('book_other', 'other-book', 'Other Book', 'source', 'books/other', 'draft');
  `);

  return db;
}

describe('TriggerEngine', () => {
  let db: Database.Database;
  let repo: WorkflowRepository;
  let engine: TriggerEngine;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new WorkflowRepository(db);
    engine = new TriggerEngine(db, repo);
  });

  afterEach(() => {
    db.close();
  });

  describe('registerTrigger', () => {
    it('should create a database entry for a new trigger', () => {
      const input: RegisterTriggerInput = {
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      };

      const triggerId = engine.registerTrigger(input);

      expect(triggerId).toMatch(/^trig_/);

      // Verify it's in the database
      const trigger = engine.getTrigger(triggerId);
      expect(trigger).not.toBeNull();
      expect(trigger!.name).toBe('W1 to W2');
      expect(trigger!.sourceWorkflowType).toBe('w1_editing');
      expect(trigger!.targetWorkflowType).toBe('w2_pdf');
      expect(trigger!.condition).toBe('on_complete');
      expect(trigger!.enabled).toBe(true);
    });

    it('should store config as JSON', () => {
      const input: RegisterTriggerInput = {
        name: 'Trigger with config',
        sourceWorkflowType: 'w2_pdf',
        targetWorkflowType: 'w3_publication',
        condition: 'on_approve',
        enabled: true,
        config: { notifySlack: true, channel: '#releases' },
      };

      const triggerId = engine.registerTrigger(input);
      const trigger = engine.getTrigger(triggerId);

      expect(trigger!.config).toEqual({ notifySlack: true, channel: '#releases' });
    });

    it('should create disabled trigger when enabled is false', () => {
      const input: RegisterTriggerInput = {
        name: 'Disabled trigger',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'manual',
        enabled: false,
        config: {},
      };

      const triggerId = engine.registerTrigger(input);
      const trigger = engine.getTrigger(triggerId);

      expect(trigger!.enabled).toBe(false);
    });
  });

  describe('checkTriggers', () => {
    it('should fire on_complete trigger when workflow completes', () => {
      // Register a trigger
      const triggerId = engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      // Create and complete a W1 workflow
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.updateStatus(workflow.id, 'running');
      repo.updateStatus(workflow.id, 'completed');

      // Check triggers
      const results = engine.checkTriggers(workflow.id);

      expect(results).toHaveLength(1);
      expect(results[0].triggered).toBe(true);
      expect(results[0].triggerId).toBe(triggerId);
      expect(results[0].newRunId).toBeDefined();
      expect(results[0].newRunId).toMatch(/^wfrun_/);

      // Verify new workflow was created with correct type
      const newRun = repo.getById(results[0].newRunId!);
      expect(newRun).not.toBeNull();
      expect(newRun!.workflow_type).toBe('w2_pdf');
      expect(newRun!.book_id).toBe('book_test');
    });

    it('should fire on_approve trigger only when workflow is approved', () => {
      // Register an on_approve trigger
      const triggerId = engine.registerTrigger({
        name: 'W2 to W3 on approval',
        sourceWorkflowType: 'w2_pdf',
        targetWorkflowType: 'w3_publication',
        condition: 'on_approve',
        enabled: true,
        config: {},
      });

      // Create and complete a W2 workflow WITHOUT approval
      const workflowNoApproval = repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });
      repo.updateStatus(workflowNoApproval.id, 'running');
      repo.updateStatus(workflowNoApproval.id, 'completed');

      // Check triggers - should NOT fire without approval
      const resultsNoApproval = engine.checkTriggers(workflowNoApproval.id);

      expect(resultsNoApproval).toHaveLength(1);
      expect(resultsNoApproval[0].triggered).toBe(false);
      expect(resultsNoApproval[0].reason).toContain('not met');

      // Now create a W2 workflow WITH approval event
      const workflowWithApproval = repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });
      repo.updateStatus(workflowWithApproval.id, 'running');
      repo.updateStatus(workflowWithApproval.id, 'completed');

      // Add approval event
      const stmt = db.prepare(`
        INSERT INTO workflow_events (id, workflow_run_id, event_type, data)
        VALUES (?, ?, 'completed', ?)
      `);
      stmt.run('evt_approval', workflowWithApproval.id, JSON.stringify({ approved: true }));

      // Check triggers - should fire with approval
      const resultsWithApproval = engine.checkTriggers(workflowWithApproval.id);

      expect(resultsWithApproval).toHaveLength(1);
      expect(resultsWithApproval[0].triggered).toBe(true);
      expect(resultsWithApproval[0].triggerId).toBe(triggerId);
    });

    it('should not fire disabled triggers', () => {
      // Register a disabled trigger
      const triggerId = engine.registerTrigger({
        name: 'Disabled W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: false,
        config: {},
      });

      // Create and complete a W1 workflow
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.updateStatus(workflow.id, 'running');
      repo.updateStatus(workflow.id, 'completed');

      // Check triggers
      const results = engine.checkTriggers(workflow.id);

      // Disabled trigger should not be in results (it's filtered out)
      expect(results).toHaveLength(0);
    });

    it('should not fire manual triggers automatically', () => {
      // Register a manual trigger
      engine.registerTrigger({
        name: 'Manual W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'manual',
        enabled: true,
        config: {},
      });

      // Create and complete a W1 workflow
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.updateStatus(workflow.id, 'running');
      repo.updateStatus(workflow.id, 'completed');

      // Check triggers
      const results = engine.checkTriggers(workflow.id);

      expect(results).toHaveLength(1);
      expect(results[0].triggered).toBe(false);
      expect(results[0].reason).toContain('Manual trigger');
    });

    it('should return empty array for non-completed workflows', () => {
      // Register a trigger
      engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      // Create a W1 workflow but don't complete it
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.updateStatus(workflow.id, 'running');

      // Check triggers
      const results = engine.checkTriggers(workflow.id);

      expect(results).toHaveLength(0);
    });

    it('should inherit book context from source workflow', () => {
      // Register a trigger
      engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      // Create and complete a W1 workflow for 'book_other'
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_other' });
      repo.updateStatus(workflow.id, 'running');
      repo.updateStatus(workflow.id, 'completed');

      // Check triggers
      const results = engine.checkTriggers(workflow.id);

      expect(results[0].triggered).toBe(true);

      // Verify new workflow inherits book_id
      const newRun = repo.getById(results[0].newRunId!);
      expect(newRun!.book_id).toBe('book_other');
    });

    it('should throw error for non-existent workflow run', () => {
      expect(() => engine.checkTriggers('nonexistent_run')).toThrow('not found');
    });
  });

  describe('getTriggersForSource', () => {
    it('should return triggers for a specific source workflow type', () => {
      // Register multiple triggers
      engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      engine.registerTrigger({
        name: 'W1 to W3',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w3_publication',
        condition: 'manual',
        enabled: true,
        config: {},
      });

      engine.registerTrigger({
        name: 'W2 to W3',
        sourceWorkflowType: 'w2_pdf',
        targetWorkflowType: 'w3_publication',
        condition: 'on_approve',
        enabled: true,
        config: {},
      });

      // Get triggers for W1
      const w1Triggers = engine.getTriggersForSource('w1_editing');

      expect(w1Triggers).toHaveLength(2);
      expect(w1Triggers.map((t) => t.name)).toContain('W1 to W2');
      expect(w1Triggers.map((t) => t.name)).toContain('W1 to W3');

      // Get triggers for W2
      const w2Triggers = engine.getTriggersForSource('w2_pdf');

      expect(w2Triggers).toHaveLength(1);
      expect(w2Triggers[0].name).toBe('W2 to W3');
    });

    it('should return empty array when no triggers exist for source', () => {
      const triggers = engine.getTriggersForSource('w4_playtesting');

      expect(triggers).toEqual([]);
    });
  });

  describe('setTriggerEnabled', () => {
    it('should disable an enabled trigger', () => {
      const triggerId = engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      engine.setTriggerEnabled(triggerId, false);

      const trigger = engine.getTrigger(triggerId);
      expect(trigger!.enabled).toBe(false);
    });

    it('should enable a disabled trigger', () => {
      const triggerId = engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: false,
        config: {},
      });

      engine.setTriggerEnabled(triggerId, true);

      const trigger = engine.getTrigger(triggerId);
      expect(trigger!.enabled).toBe(true);
    });

    it('should throw error for non-existent trigger', () => {
      expect(() => engine.setTriggerEnabled('nonexistent', true)).toThrow('not found');
    });
  });

  describe('deleteTrigger', () => {
    it('should delete a trigger from the database', () => {
      const triggerId = engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      engine.deleteTrigger(triggerId);

      const trigger = engine.getTrigger(triggerId);
      expect(trigger).toBeNull();
    });

    it('should throw error for non-existent trigger', () => {
      expect(() => engine.deleteTrigger('nonexistent')).toThrow('not found');
    });
  });

  describe('listTriggers', () => {
    it('should return empty array when no triggers exist', () => {
      const triggers = engine.listTriggers();

      expect(triggers).toEqual([]);
    });

    it('should return all registered triggers', () => {
      engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      engine.registerTrigger({
        name: 'W2 to W3',
        sourceWorkflowType: 'w2_pdf',
        targetWorkflowType: 'w3_publication',
        condition: 'on_approve',
        enabled: false,
        config: {},
      });

      const triggers = engine.listTriggers();

      expect(triggers).toHaveLength(2);
      expect(triggers[0].name).toBe('W1 to W2');
      expect(triggers[1].name).toBe('W2 to W3');
    });
  });

  describe('fireTrigger (manual)', () => {
    it('should manually fire a trigger and create a new workflow', () => {
      const triggerId = engine.registerTrigger({
        name: 'Manual W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'manual',
        enabled: true,
        config: {},
      });

      const result = engine.fireTrigger(triggerId, 'book_test');

      expect(result.triggered).toBe(true);
      expect(result.newRunId).toBeDefined();
      expect(result.newRunId).toMatch(/^wfrun_/);

      // Verify the new workflow
      const newRun = repo.getById(result.newRunId!);
      expect(newRun).not.toBeNull();
      expect(newRun!.workflow_type).toBe('w2_pdf');
      expect(newRun!.book_id).toBe('book_test');
      expect(newRun!.status).toBe('pending');
    });

    it('should not fire disabled trigger when called manually', () => {
      const triggerId = engine.registerTrigger({
        name: 'Disabled manual trigger',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'manual',
        enabled: false,
        config: {},
      });

      const result = engine.fireTrigger(triggerId, 'book_test');

      expect(result.triggered).toBe(false);
      expect(result.reason).toContain('disabled');
    });

    it('should throw error for non-existent trigger', () => {
      expect(() => engine.fireTrigger('nonexistent', 'book_test')).toThrow('not found');
    });

    it('should fire any trigger type manually (including on_complete)', () => {
      const triggerId = engine.registerTrigger({
        name: 'Auto W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      // Manually fire an on_complete trigger
      const result = engine.fireTrigger(triggerId, 'book_test');

      expect(result.triggered).toBe(true);
      expect(result.newRunId).toBeDefined();
    });
  });

  describe('trigger creates new workflow run with correct type', () => {
    it('should create w2_pdf workflow from w1_editing trigger', () => {
      engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.updateStatus(workflow.id, 'running');
      repo.updateStatus(workflow.id, 'completed');

      const results = engine.checkTriggers(workflow.id);
      const newRun = repo.getById(results[0].newRunId!);

      expect(newRun!.workflow_type).toBe('w2_pdf');
    });

    it('should create w3_publication workflow from w2_pdf trigger', () => {
      engine.registerTrigger({
        name: 'W2 to W3',
        sourceWorkflowType: 'w2_pdf',
        targetWorkflowType: 'w3_publication',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      const workflow = repo.create({ workflow_type: 'w2_pdf', book_id: 'book_test' });
      repo.updateStatus(workflow.id, 'running');
      repo.updateStatus(workflow.id, 'completed');

      const results = engine.checkTriggers(workflow.id);
      const newRun = repo.getById(results[0].newRunId!);

      expect(newRun!.workflow_type).toBe('w3_publication');
    });

    it('should create w4_playtesting workflow from w3_publication trigger', () => {
      engine.registerTrigger({
        name: 'W3 to W4',
        sourceWorkflowType: 'w3_publication',
        targetWorkflowType: 'w4_playtesting',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      const workflow = repo.create({ workflow_type: 'w3_publication', book_id: 'book_test' });
      repo.updateStatus(workflow.id, 'running');
      repo.updateStatus(workflow.id, 'completed');

      const results = engine.checkTriggers(workflow.id);
      const newRun = repo.getById(results[0].newRunId!);

      expect(newRun!.workflow_type).toBe('w4_playtesting');
    });
  });

  describe('multiple triggers for same source', () => {
    it('should fire multiple triggers for the same source workflow', () => {
      // Register multiple triggers for W1
      engine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      engine.registerTrigger({
        name: 'W1 to W4',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w4_playtesting',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      // Complete a W1 workflow
      const workflow = repo.create({ workflow_type: 'w1_editing', book_id: 'book_test' });
      repo.updateStatus(workflow.id, 'running');
      repo.updateStatus(workflow.id, 'completed');

      const results = engine.checkTriggers(workflow.id);

      expect(results).toHaveLength(2);
      expect(results[0].triggered).toBe(true);
      expect(results[1].triggered).toBe(true);

      // Verify both workflows were created
      const types = results.map((r) => repo.getById(r.newRunId!)!.workflow_type);
      expect(types).toContain('w2_pdf');
      expect(types).toContain('w4_playtesting');
    });
  });
});
