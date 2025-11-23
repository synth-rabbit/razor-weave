// src/tooling/workflows/integration.test.ts
/**
 * Comprehensive end-to-end integration tests for the workflow lifecycle.
 *
 * Tests actual database interactions with in-memory SQLite and validates:
 * - Full workflow lifecycle (create -> start -> complete)
 * - Rejection and retry flows with smart routing
 * - Multi-workflow chains with triggers
 * - Pause/resume functionality
 * - Concurrent workflow isolation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { WorkflowRepository } from './repository.js';
import { WorkflowStateMachine, InvalidTransitionError } from './state-machine.js';
import { WorkflowEventEmitter, type EventType } from './event-emitter.js';
import { RejectionTracker, type RejectionType } from './rejection-tracker.js';
import { SmartRouter } from './smart-router.js';
import { ArtifactRegistry, type ArtifactType } from './artifact-registry.js';
import { TriggerEngine } from './trigger-engine.js';
import { BookRepository } from '../books/repository.js';
import { HANDLER_AGENTS, ESCALATION_TARGETS, DEFAULT_MAX_RETRIES } from './routing-config.js';
import type { WorkflowType } from './types.js';

/**
 * Creates an in-memory SQLite database with the required schema for testing.
 * Includes all necessary tables for workflow, book, event, rejection, artifact, and trigger operations.
 */
function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');

  // Create books table
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

  // Create book_versions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_versions (
      content_id TEXT PRIMARY KEY,
      book_path TEXT NOT NULL,
      book_id TEXT,
      workflow_run_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create workflow_runs table
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

  // Create workflow_events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_events (
      id TEXT PRIMARY KEY,
      workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
      event_type TEXT NOT NULL CHECK(event_type IN (
        'started', 'completed', 'rejected', 'escalated', 'paused', 'resumed'
      )),
      agent_name TEXT,
      data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_events_run ON workflow_events(workflow_run_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_events_type ON workflow_events(event_type);
  `);

  // Create rejections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rejections (
      id TEXT PRIMARY KEY,
      workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
      event_id TEXT REFERENCES workflow_events(id),
      rejection_type TEXT NOT NULL CHECK(rejection_type IN (
        'style', 'mechanics', 'clarity', 'scope'
      )),
      reason TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      resolved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_rejections_run ON rejections(workflow_run_id);
    CREATE INDEX IF NOT EXISTS idx_rejections_type ON rejections(rejection_type);
  `);

  // Create workflow_artifacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_artifacts (
      id TEXT PRIMARY KEY,
      workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
      artifact_type TEXT NOT NULL CHECK(artifact_type IN (
        'chapter', 'release_notes', 'print_html', 'web_html', 'pdf_draft',
        'pdf_digital', 'pdf_print', 'layout_plan', 'design_plan', 'deployment',
        'qa_report', 'marketing_copy', 'announcement', 'playtest_session',
        'playtest_analysis', 'playtest_feedback'
      )),
      artifact_path TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_artifacts_run ON workflow_artifacts(workflow_run_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_type ON workflow_artifacts(artifact_type);
  `);

  // Create workflow_triggers table
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

  return db;
}

/**
 * Seeds the test database with initial book data.
 */
function seedTestBooks(db: Database.Database): void {
  db.exec(`
    INSERT INTO books (id, slug, title, book_type, source_path, status)
    VALUES ('book_test', 'test-book', 'Test Book', 'core', 'books/test', 'draft');

    INSERT INTO books (id, slug, title, book_type, source_path, status)
    VALUES ('book_other', 'other-book', 'Other Book', 'source', 'books/other', 'draft');

    INSERT INTO books (id, slug, title, book_type, source_path, status)
    VALUES ('book_third', 'third-book', 'Third Book', 'campaign', 'books/third', 'draft');
  `);

  // Seed test versions for linking
  db.exec(`
    INSERT INTO book_versions (content_id, book_path, book_id)
    VALUES ('version_input', 'books/test/v1', 'book_test');

    INSERT INTO book_versions (content_id, book_path, book_id)
    VALUES ('version_output', 'books/test/v2', 'book_test');
  `);
}

describe('Workflow Integration Tests', () => {
  let db: Database.Database;
  let workflowRepo: WorkflowRepository;
  let bookRepo: BookRepository;
  let eventEmitter: WorkflowEventEmitter;
  let rejectionTracker: RejectionTracker;
  let smartRouter: SmartRouter;
  let artifactRegistry: ArtifactRegistry;
  let triggerEngine: TriggerEngine;

  beforeEach(() => {
    db = createTestDatabase();
    seedTestBooks(db);

    workflowRepo = new WorkflowRepository(db);
    bookRepo = new BookRepository(db);
    eventEmitter = new WorkflowEventEmitter(db);
    rejectionTracker = new RejectionTracker(db);
    smartRouter = new SmartRouter(db);
    artifactRegistry = new ArtifactRegistry(db);
    triggerEngine = new TriggerEngine(db, workflowRepo);
  });

  afterEach(() => {
    db.close();
  });

  // ==========================================================================
  // SECTION 1: Full Workflow Lifecycle Tests
  // ==========================================================================
  describe('Full Workflow Lifecycle', () => {
    it('should complete full lifecycle: create -> start -> running -> complete', () => {
      // 1. Create a book (already seeded, but verify)
      const book = bookRepo.getById('book_test');
      expect(book).not.toBeNull();

      // 2. Create a workflow for the book
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      expect(workflow.status).toBe('pending');

      // 3. Emit started event and transition to running
      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'started',
        agentName: 'editor-agent',
        data: { message: 'Starting editing workflow' },
      });
      const runningWorkflow = workflowRepo.updateStatus(workflow.id, 'running');
      expect(runningWorkflow.status).toBe('running');

      // 4. Register an artifact during the workflow
      const artifact = artifactRegistry.register({
        workflowRunId: workflow.id,
        artifactType: 'chapter',
        artifactPath: '/output/chapter-1.md',
        metadata: { chapter: 1, wordCount: 5000 },
      });
      expect(artifact.artifactPath).toBe('/output/chapter-1.md');

      // 5. Complete the workflow
      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'completed',
        agentName: 'editor-agent',
        data: { message: 'Editing complete' },
      });
      const completedWorkflow = workflowRepo.updateStatus(workflow.id, 'completed');
      expect(completedWorkflow.status).toBe('completed');

      // 6. Verify events were logged
      const events = eventEmitter.getEventsForRun(workflow.id);
      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('started');
      expect(events[1].eventType).toBe('completed');

      // 7. Verify artifact is queryable
      const artifacts = artifactRegistry.getByRunId(workflow.id);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].artifactType).toBe('chapter');
    });

    it('should track state transitions via events', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });

      // Emit event for each transition
      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'started',
        data: { fromState: 'pending', toState: 'running' },
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'paused',
        data: { fromState: 'running', toState: 'paused' },
      });
      workflowRepo.updateStatus(workflow.id, 'paused');

      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'resumed',
        data: { fromState: 'paused', toState: 'running' },
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'completed',
        data: { fromState: 'running', toState: 'completed' },
      });
      workflowRepo.updateStatus(workflow.id, 'completed');

      // Verify all events were recorded
      const events = eventEmitter.getEventsForRun(workflow.id);
      expect(events).toHaveLength(4);
      expect(events.map((e) => e.eventType)).toEqual(['started', 'paused', 'resumed', 'completed']);
    });

    it('should allow registering multiple artifacts during a workflow', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      // Register multiple artifacts
      artifactRegistry.register({
        workflowRunId: workflow.id,
        artifactType: 'pdf_draft',
        artifactPath: '/output/draft.pdf',
      });

      artifactRegistry.register({
        workflowRunId: workflow.id,
        artifactType: 'pdf_digital',
        artifactPath: '/output/digital.pdf',
      });

      artifactRegistry.register({
        workflowRunId: workflow.id,
        artifactType: 'pdf_print',
        artifactPath: '/output/print.pdf',
      });

      const artifacts = artifactRegistry.getByRunId(workflow.id);
      expect(artifacts).toHaveLength(3);
    });

    it('should link output version when workflow completes', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
        input_version_id: 'version_input',
      });

      workflowRepo.updateStatus(workflow.id, 'running');
      workflowRepo.updateStatus(workflow.id, 'completed');

      // Link output version
      const updated = workflowRepo.linkOutputVersion(workflow.id, 'version_output');
      expect(updated.input_version_id).toBe('version_input');
      expect(updated.output_version_id).toBe('version_output');
    });
  });

  // ==========================================================================
  // SECTION 2: Rejection & Retry Flow Tests
  // ==========================================================================
  describe('Rejection & Retry Flow', () => {
    it('should track rejection and route to style editor', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      // Record a style rejection
      const rejection = rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Voice inconsistent with established tone',
      });

      expect(rejection.rejectionType).toBe('style');
      expect(rejection.retryCount).toBe(1);

      // Smart router should route to style editor
      const handler = smartRouter.getHandlerForType('style');
      expect(handler).toBe(HANDLER_AGENTS.STYLE_EDITOR);

      // Router should route the specific rejection
      const result = smartRouter.routeRejection(rejection.id);
      expect(result.handler).toBe(HANDLER_AGENTS.STYLE_EDITOR);
      expect(result.shouldEscalate).toBe(false);
    });

    it('should increment retry count on repeated rejections', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      // Record first rejection
      const rejection1 = rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'First style issue',
      });
      expect(rejection1.retryCount).toBe(1);

      // Record second rejection
      const rejection2 = rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Second style issue',
      });
      expect(rejection2.retryCount).toBe(2);

      // Record third rejection
      const rejection3 = rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Third style issue',
      });
      expect(rejection3.retryCount).toBe(3);
    });

    it('should trigger escalation after max retries (3)', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      // Record 3 rejections to reach escalation threshold
      rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'First style issue',
      });

      rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Second style issue',
      });

      const thirdRejection = rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Third style issue - should escalate',
      });

      // Check if escalation is needed
      expect(rejectionTracker.shouldEscalate(workflow.id, 'style')).toBe(true);
      expect(smartRouter.shouldEscalate(workflow.id, 'style')).toBe(true);

      // Route should now go to escalation target
      const result = smartRouter.routeRejection(thirdRejection.id);
      expect(result.shouldEscalate).toBe(true);
      expect(result.handler).toBe(ESCALATION_TARGETS.SENIOR_EDITOR);
    });

    it('should emit escalation event after max retries', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      // Record 3 rejections
      for (let i = 0; i < 3; i++) {
        rejectionTracker.recordRejection({
          workflowRunId: workflow.id,
          rejectionType: 'mechanics',
          reason: `Mechanics issue ${i + 1}`,
        });
      }

      // Check escalation and emit event
      if (smartRouter.shouldEscalate(workflow.id, 'mechanics')) {
        eventEmitter.emit({
          workflowRunId: workflow.id,
          eventType: 'escalated',
          agentName: 'mechanics-reviewer',
          data: {
            reason: 'Max retries exceeded for mechanics rejections',
            escalationTarget: ESCALATION_TARGETS.HUMAN_REVIEWER,
          },
        });
      }

      const events = eventEmitter.getEventsForRun(workflow.id);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('escalated');
    });

    it('should route different rejection types to different handlers', () => {
      expect(smartRouter.getHandlerForType('style')).toBe(HANDLER_AGENTS.STYLE_EDITOR);
      expect(smartRouter.getHandlerForType('mechanics')).toBe(HANDLER_AGENTS.MECHANICS_REVIEWER);
      expect(smartRouter.getHandlerForType('clarity')).toBe(HANDLER_AGENTS.CLARITY_EDITOR);
      expect(smartRouter.getHandlerForType('scope')).toBe(HANDLER_AGENTS.SCOPE_REVIEWER);
    });

    it('should track rejections independently by type', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      // Record different types of rejections
      rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Style issue 1',
      });

      rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'mechanics',
        reason: 'Grammar issue 1',
      });

      rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Style issue 2',
      });

      // Check retry counts are tracked independently
      expect(rejectionTracker.getRetryCount(workflow.id, 'style')).toBe(2);
      expect(rejectionTracker.getRetryCount(workflow.id, 'mechanics')).toBe(1);
      expect(rejectionTracker.getRetryCount(workflow.id, 'clarity')).toBe(0);
    });

    it('should resolve rejections and track resolution', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      const rejection = rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'clarity',
        reason: 'Unclear instructions',
      });

      expect(rejection.resolved).toBe(false);

      const resolved = rejectionTracker.resolveRejection(rejection.id);
      expect(resolved.resolved).toBe(true);

      // Get unresolved rejections should return empty
      const unresolved = rejectionTracker.getUnresolvedRejections(workflow.id);
      expect(unresolved).toHaveLength(0);
    });
  });

  // ==========================================================================
  // SECTION 3: Multi-Workflow Chain Tests
  // ==========================================================================
  describe('Multi-Workflow Chain', () => {
    it('should trigger W2 when W1 completes', () => {
      // Register trigger: W1 -> W2
      triggerEngine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      // Complete W1 workflow
      const w1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(w1.id, 'running');
      workflowRepo.updateStatus(w1.id, 'completed');

      // Check triggers
      const results = triggerEngine.checkTriggers(w1.id);

      expect(results).toHaveLength(1);
      expect(results[0].triggered).toBe(true);

      // Verify W2 was created
      const w2 = workflowRepo.getById(results[0].newRunId!);
      expect(w2).not.toBeNull();
      expect(w2!.workflow_type).toBe('w2_pdf');
      expect(w2!.book_id).toBe('book_test');
    });

    it('should chain W1 -> W2 -> W3 through triggers', () => {
      // Register triggers
      triggerEngine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      triggerEngine.registerTrigger({
        name: 'W2 to W3',
        sourceWorkflowType: 'w2_pdf',
        targetWorkflowType: 'w3_publication',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      // Complete W1
      const w1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(w1.id, 'running');
      workflowRepo.updateStatus(w1.id, 'completed');

      const w1Results = triggerEngine.checkTriggers(w1.id);
      expect(w1Results[0].triggered).toBe(true);
      const w2Id = w1Results[0].newRunId!;

      // Complete W2
      workflowRepo.updateStatus(w2Id, 'running');
      workflowRepo.updateStatus(w2Id, 'completed');

      const w2Results = triggerEngine.checkTriggers(w2Id);
      expect(w2Results[0].triggered).toBe(true);
      const w3Id = w2Results[0].newRunId!;

      // Verify chain completed correctly
      const w3 = workflowRepo.getById(w3Id);
      expect(w3!.workflow_type).toBe('w3_publication');
      expect(w3!.book_id).toBe('book_test');
    });

    it('should allow W2 to query artifacts from W1', () => {
      // Complete W1 with artifacts
      const w1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(w1.id, 'running');

      artifactRegistry.register({
        workflowRunId: w1.id,
        artifactType: 'chapter',
        artifactPath: '/output/chapter-edited.md',
        metadata: { version: 1 },
      });

      workflowRepo.updateStatus(w1.id, 'completed');

      // Create W2 (simulating trigger)
      const w2 = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(w2.id, 'running');

      // W2 can query artifacts from W1
      const w1Artifacts = artifactRegistry.getByRunId(w1.id);
      expect(w1Artifacts).toHaveLength(1);
      expect(w1Artifacts[0].artifactType).toBe('chapter');

      // Query by type across all runs
      const chapterArtifacts = artifactRegistry.getByType('chapter');
      expect(chapterArtifacts.length).toBeGreaterThanOrEqual(1);
    });

    it('should maintain book context across workflow chain', () => {
      triggerEngine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      // Create W1 for a specific book
      const w1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_other', // Use different book
      });
      workflowRepo.updateStatus(w1.id, 'running');
      workflowRepo.updateStatus(w1.id, 'completed');

      const results = triggerEngine.checkTriggers(w1.id);
      const w2 = workflowRepo.getById(results[0].newRunId!);

      // W2 should have same book_id as W1
      expect(w2!.book_id).toBe('book_other');
    });

    it('should support on_approve trigger condition', () => {
      triggerEngine.registerTrigger({
        name: 'W2 to W3 on approval',
        sourceWorkflowType: 'w2_pdf',
        targetWorkflowType: 'w3_publication',
        condition: 'on_approve',
        enabled: true,
        config: {},
      });

      // Complete W2 without approval
      const w2 = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(w2.id, 'running');
      workflowRepo.updateStatus(w2.id, 'completed');

      // Should not trigger without approval
      const noApprovalResults = triggerEngine.checkTriggers(w2.id);
      expect(noApprovalResults[0].triggered).toBe(false);

      // Create new W2 with approval event
      const w2Approved = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(w2Approved.id, 'running');
      workflowRepo.updateStatus(w2Approved.id, 'completed');

      // Add approval event
      eventEmitter.emit({
        workflowRunId: w2Approved.id,
        eventType: 'completed',
        data: { approved: true },
      });

      const approvedResults = triggerEngine.checkTriggers(w2Approved.id);
      expect(approvedResults[0].triggered).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 4: Pause/Resume Flow Tests
  // ==========================================================================
  describe('Pause/Resume Flow', () => {
    it('should pause a running workflow', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'paused',
        data: { reason: 'Waiting for human review' },
      });

      const paused = workflowRepo.updateStatus(workflow.id, 'paused');
      expect(paused.status).toBe('paused');
    });

    it('should resume a paused workflow', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');
      workflowRepo.updateStatus(workflow.id, 'paused');

      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'resumed',
        data: { reason: 'Human review complete' },
      });

      const resumed = workflowRepo.updateStatus(workflow.id, 'running');
      expect(resumed.status).toBe('running');
    });

    it('should complete full pause/resume/complete cycle', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });

      // Start
      workflowRepo.updateStatus(workflow.id, 'running');
      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'started',
      });

      // Pause
      workflowRepo.updateStatus(workflow.id, 'paused');
      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'paused',
      });

      // Resume
      workflowRepo.updateStatus(workflow.id, 'running');
      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'resumed',
      });

      // Complete
      workflowRepo.updateStatus(workflow.id, 'completed');
      eventEmitter.emit({
        workflowRunId: workflow.id,
        eventType: 'completed',
      });

      // Verify final state and event history
      const finalWorkflow = workflowRepo.getById(workflow.id);
      expect(finalWorkflow!.status).toBe('completed');

      const events = eventEmitter.getEventsForRun(workflow.id);
      expect(events).toHaveLength(4);
      expect(events.map((e) => e.eventType)).toEqual(['started', 'paused', 'resumed', 'completed']);
    });

    it('should not allow invalid transition from paused to completed', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');
      workflowRepo.updateStatus(workflow.id, 'paused');

      // Cannot go directly from paused to completed
      expect(() => workflowRepo.updateStatus(workflow.id, 'completed')).toThrow(
        InvalidTransitionError
      );
    });

    it('should allow transition from paused to failed', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');
      workflowRepo.updateStatus(workflow.id, 'paused');

      const failed = workflowRepo.updateStatus(workflow.id, 'failed');
      expect(failed.status).toBe('failed');
    });
  });

  // ==========================================================================
  // SECTION 5: Concurrent Workflows Tests
  // ==========================================================================
  describe('Concurrent Workflows', () => {
    it('should allow multiple concurrent workflows for the same book', () => {
      const w1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      const w2 = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });

      expect(w1.id).not.toBe(w2.id);

      // Both should be queryable
      const workflows = workflowRepo.list({ bookId: 'book_test' });
      expect(workflows).toHaveLength(2);
    });

    it('should isolate state between concurrent workflows', () => {
      const w1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      const w2 = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });

      // Progress W1
      workflowRepo.updateStatus(w1.id, 'running');
      workflowRepo.updateStatus(w1.id, 'completed');

      // W2 should still be pending
      const w2State = workflowRepo.getById(w2.id);
      expect(w2State!.status).toBe('pending');

      // Progress W2
      workflowRepo.updateStatus(w2.id, 'running');
      workflowRepo.updateStatus(w2.id, 'failed');

      // W1 should still be completed
      const w1State = workflowRepo.getById(w1.id);
      expect(w1State!.status).toBe('completed');
    });

    it('should isolate events between concurrent workflows', () => {
      const w1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      const w2 = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });

      // Emit events for W1
      eventEmitter.emit({ workflowRunId: w1.id, eventType: 'started' });
      eventEmitter.emit({ workflowRunId: w1.id, eventType: 'completed' });

      // Emit events for W2
      eventEmitter.emit({ workflowRunId: w2.id, eventType: 'started' });

      // Events should be isolated
      const w1Events = eventEmitter.getEventsForRun(w1.id);
      const w2Events = eventEmitter.getEventsForRun(w2.id);

      expect(w1Events).toHaveLength(2);
      expect(w2Events).toHaveLength(1);
    });

    it('should isolate rejections between concurrent workflows', () => {
      const w1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      const w2 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      workflowRepo.updateStatus(w1.id, 'running');
      workflowRepo.updateStatus(w2.id, 'running');

      // Add rejections to W1
      rejectionTracker.recordRejection({
        workflowRunId: w1.id,
        rejectionType: 'style',
        reason: 'W1 style issue',
      });

      rejectionTracker.recordRejection({
        workflowRunId: w1.id,
        rejectionType: 'style',
        reason: 'W1 another style issue',
      });

      // Add rejection to W2
      rejectionTracker.recordRejection({
        workflowRunId: w2.id,
        rejectionType: 'style',
        reason: 'W2 style issue',
      });

      // Check isolation
      expect(rejectionTracker.getRetryCount(w1.id, 'style')).toBe(2);
      expect(rejectionTracker.getRetryCount(w2.id, 'style')).toBe(1);
    });

    it('should isolate artifacts between concurrent workflows', () => {
      const w1 = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });

      const w2 = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });

      workflowRepo.updateStatus(w1.id, 'running');
      workflowRepo.updateStatus(w2.id, 'running');

      // Register artifacts for each
      artifactRegistry.register({
        workflowRunId: w1.id,
        artifactType: 'pdf_draft',
        artifactPath: '/output/w1-draft.pdf',
      });

      artifactRegistry.register({
        workflowRunId: w2.id,
        artifactType: 'pdf_draft',
        artifactPath: '/output/w2-draft.pdf',
      });

      artifactRegistry.register({
        workflowRunId: w2.id,
        artifactType: 'pdf_digital',
        artifactPath: '/output/w2-digital.pdf',
      });

      // Check isolation
      const w1Artifacts = artifactRegistry.getByRunId(w1.id);
      const w2Artifacts = artifactRegistry.getByRunId(w2.id);

      expect(w1Artifacts).toHaveLength(1);
      expect(w2Artifacts).toHaveLength(2);
    });

    it('should handle workflows for different books concurrently', () => {
      const wfBook1 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      const wfBook2 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_other',
      });

      const wfBook3 = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_third',
      });

      // All should be queryable
      expect(workflowRepo.list({ bookId: 'book_test' })).toHaveLength(1);
      expect(workflowRepo.list({ bookId: 'book_other' })).toHaveLength(1);
      expect(workflowRepo.list({ bookId: 'book_third' })).toHaveLength(1);
      expect(workflowRepo.list()).toHaveLength(3);
    });
  });

  // ==========================================================================
  // SECTION 6: Edge Cases and Error Handling
  // ==========================================================================
  describe('Edge Cases and Error Handling', () => {
    it('should reject invalid state transitions', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      // Cannot go from pending to completed
      expect(() => workflowRepo.updateStatus(workflow.id, 'completed')).toThrow(
        InvalidTransitionError
      );

      // Cannot go from pending to paused
      expect(() => workflowRepo.updateStatus(workflow.id, 'paused')).toThrow(InvalidTransitionError);
    });

    it('should not allow transitions from terminal states', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      workflowRepo.updateStatus(workflow.id, 'running');
      workflowRepo.updateStatus(workflow.id, 'completed');

      // Cannot transition from completed
      expect(() => workflowRepo.updateStatus(workflow.id, 'running')).toThrow(
        InvalidTransitionError
      );
    });

    it('should handle trigger check for non-completed workflow', () => {
      triggerEngine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      // Trigger should not fire for running workflow
      const results = triggerEngine.checkTriggers(workflow.id);
      expect(results).toHaveLength(0);
    });

    it('should track current agent during workflow', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      workflowRepo.updateStatus(workflow.id, 'running');
      workflowRepo.setCurrentAgent(workflow.id, 'editor-agent');

      const updated = workflowRepo.getById(workflow.id);
      expect(updated!.current_agent).toBe('editor-agent');

      // Clear agent
      workflowRepo.setCurrentAgent(workflow.id, null);
      const cleared = workflowRepo.getById(workflow.id);
      expect(cleared!.current_agent).toBeNull();
    });

    it('should handle multiple triggers from same source', () => {
      // Register multiple triggers for W1 completion
      triggerEngine.registerTrigger({
        name: 'W1 to W2',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w2_pdf',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      triggerEngine.registerTrigger({
        name: 'W1 to W4',
        sourceWorkflowType: 'w1_editing',
        targetWorkflowType: 'w4_playtesting',
        condition: 'on_complete',
        enabled: true,
        config: {},
      });

      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');
      workflowRepo.updateStatus(workflow.id, 'completed');

      const results = triggerEngine.checkTriggers(workflow.id);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.triggered)).toBe(true);

      // Both target workflows should be created
      const allWorkflows = workflowRepo.list({ bookId: 'book_test' });
      expect(allWorkflows).toHaveLength(3); // Original W1 + W2 + W4
    });

    it('should get routing stats correctly', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      // Add various rejections
      rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Style 1',
      });

      rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'style',
        reason: 'Style 2',
      });

      rejectionTracker.recordRejection({
        workflowRunId: workflow.id,
        rejectionType: 'mechanics',
        reason: 'Grammar 1',
      });

      const stats = smartRouter.getRoutingStats(workflow.id);

      expect(stats.totalRouted).toBe(3);
      expect(stats.byType.style).toBe(2);
      expect(stats.byType.mechanics).toBe(1);
      expect(stats.byType.clarity).toBe(0);
    });

    it('should query artifacts by run and type combination', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w2_pdf',
        book_id: 'book_test',
      });
      workflowRepo.updateStatus(workflow.id, 'running');

      artifactRegistry.register({
        workflowRunId: workflow.id,
        artifactType: 'pdf_draft',
        artifactPath: '/output/draft.pdf',
      });

      artifactRegistry.register({
        workflowRunId: workflow.id,
        artifactType: 'pdf_digital',
        artifactPath: '/output/digital.pdf',
      });

      const drafts = artifactRegistry.getByRunAndType(workflow.id, 'pdf_draft');
      expect(drafts).toHaveLength(1);
      expect(drafts[0].artifactPath).toBe('/output/draft.pdf');
    });

    it('should get latest event for a workflow run', () => {
      const workflow = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: 'book_test',
      });

      eventEmitter.emit({ workflowRunId: workflow.id, eventType: 'started' });
      eventEmitter.emit({ workflowRunId: workflow.id, eventType: 'paused' });
      eventEmitter.emit({ workflowRunId: workflow.id, eventType: 'resumed' });

      const latest = eventEmitter.getLatestEvent(workflow.id);
      expect(latest).not.toBeNull();
      expect(latest!.eventType).toBe('resumed');
    });
  });
});
