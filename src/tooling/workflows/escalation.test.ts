import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { unlinkSync, mkdirSync } from 'fs';
import {
  EscalationManager,
  DEFAULT_ESCALATION_CONFIG,
  type EscalationResult,
} from './escalation.js';
import { RejectionTracker, type RejectionType } from './rejection-tracker.js';
import { ESCALATION_TARGETS } from './routing-config.js';

/**
 * Create a test database with the required schema
 */
function createTestDb(dbPath: string): Database.Database {
  mkdirSync('data', { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create workflow_runs table (referenced by escalations and rejections)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_type TEXT NOT NULL,
      book_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create workflow_events table (referenced by rejections, used by event emitter)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_events (
      id TEXT PRIMARY KEY,
      workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
      event_type TEXT NOT NULL CHECK(event_type IN ('started', 'completed', 'rejected', 'escalated', 'paused', 'resumed')),
      agent_name TEXT,
      data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create rejections table (used by rejection tracker)
  db.exec(`
    CREATE TABLE IF NOT EXISTS rejections (
      id TEXT PRIMARY KEY,
      workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
      event_id TEXT REFERENCES workflow_events(id),
      rejection_type TEXT NOT NULL CHECK(rejection_type IN ('style', 'mechanics', 'clarity', 'scope')),
      reason TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_rejections_run ON rejections(workflow_run_id);
    CREATE INDEX IF NOT EXISTS idx_rejections_type ON rejections(rejection_type);
  `);

  // Create escalations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS escalations (
      id TEXT PRIMARY KEY,
      workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
      rejection_type TEXT NOT NULL CHECK(rejection_type IN ('style', 'mechanics', 'clarity', 'scope')),
      retry_count INTEGER NOT NULL,
      escalated_to TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'acknowledged', 'resolved')),
      resolution TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      acknowledged_at TIMESTAMP,
      resolved_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_escalations_run ON escalations(workflow_run_id);
    CREATE INDEX IF NOT EXISTS idx_escalations_pending ON escalations(status) WHERE status = 'pending';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_escalations_unique ON escalations(workflow_run_id, rejection_type);
  `);

  return db;
}

/**
 * Clean up test database files
 */
function cleanupTestDb(dbPath: string): void {
  try {
    unlinkSync(dbPath);
    unlinkSync(dbPath + '-shm');
    unlinkSync(dbPath + '-wal');
  } catch {
    // Ignore if files don't exist
  }
}

/**
 * Insert a test workflow run
 */
function insertTestWorkflowRun(db: Database.Database, runId: string): void {
  db.prepare(`
    INSERT INTO workflow_runs (id, workflow_type, book_id, status)
    VALUES (?, 'w1_editing', 'book-001', 'running')
  `).run(runId);
}

/**
 * Helper to add rejections to reach escalation threshold
 */
function addRejectionsToThreshold(
  tracker: RejectionTracker,
  workflowRunId: string,
  rejectionType: RejectionType,
  count: number
): void {
  for (let i = 0; i < count; i++) {
    tracker.recordRejection({
      workflowRunId,
      rejectionType,
      reason: `Rejection ${i + 1} for ${rejectionType}`,
    });
  }
}

describe('EscalationManager', () => {
  let db: Database.Database;
  let manager: EscalationManager;
  let tracker: RejectionTracker;
  const testDbPath = 'data/test-escalation-manager.db';
  const testRunId = 'run-test-001';

  beforeEach(() => {
    db = createTestDb(testDbPath);
    manager = new EscalationManager(db);
    tracker = new RejectionTracker(db);
    insertTestWorkflowRun(db, testRunId);
  });

  afterEach(() => {
    db.close();
    cleanupTestDb(testDbPath);
  });

  describe('constructor', () => {
    it('should use default configuration when no config provided', () => {
      const defaultManager = new EscalationManager(db);
      // Default maxRetries is 3, so we need 3 rejections to escalate
      addRejectionsToThreshold(tracker, testRunId, 'style', 2);

      let result = defaultManager.checkAndEscalate(testRunId, 'style');
      expect(result.escalated).toBe(false);

      addRejectionsToThreshold(tracker, testRunId, 'style', 1); // Now at 3
      result = defaultManager.checkAndEscalate(testRunId, 'style');
      expect(result.escalated).toBe(true);
    });

    it('should accept custom maxRetries configuration', () => {
      const customManager = new EscalationManager(db, { maxRetries: 2 });
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      addRejectionsToThreshold(tracker, run2Id, 'mechanics', 1);

      let result = customManager.checkAndEscalate(run2Id, 'mechanics');
      expect(result.escalated).toBe(false);

      addRejectionsToThreshold(tracker, run2Id, 'mechanics', 1); // Now at 2
      result = customManager.checkAndEscalate(run2Id, 'mechanics');
      expect(result.escalated).toBe(true);
    });

    it('should accept custom escalation targets', () => {
      const customTargets = new Map<RejectionType, string>([
        ['style', 'custom-style-reviewer'],
        ['mechanics', 'custom-mechanics-reviewer'],
        ['clarity', 'custom-clarity-reviewer'],
        ['scope', 'custom-scope-reviewer'],
      ]);

      const customManager = new EscalationManager(db, {
        escalationTargets: customTargets,
      });

      addRejectionsToThreshold(tracker, testRunId, 'style', 3);

      const result = customManager.checkAndEscalate(testRunId, 'style');
      expect(result.escalated).toBe(true);
      expect(result.escalatedTo).toBe('custom-style-reviewer');
    });
  });

  describe('checkAndEscalate', () => {
    it('should not escalate when retry count is below threshold', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 2);

      const result = manager.checkAndEscalate(testRunId, 'style');

      expect(result.escalated).toBe(false);
      expect(result.escalationId).toBeUndefined();
      expect(result.escalatedTo).toBeUndefined();
      expect(result.reason).toContain('has not reached threshold');
    });

    it('should escalate when retry count equals threshold (default 3)', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);

      const result = manager.checkAndEscalate(testRunId, 'style');

      expect(result.escalated).toBe(true);
      expect(result.escalationId).toBeDefined();
      expect(result.escalatedTo).toBe(ESCALATION_TARGETS.SENIOR_EDITOR);
      expect(result.reason).toContain('Retry limit');
    });

    it('should escalate when retry count exceeds threshold', () => {
      addRejectionsToThreshold(tracker, testRunId, 'mechanics', 5);

      const result = manager.checkAndEscalate(testRunId, 'mechanics');

      expect(result.escalated).toBe(true);
      expect(result.escalationId).toBeDefined();
      expect(result.escalatedTo).toBe(ESCALATION_TARGETS.HUMAN_REVIEWER);
    });

    it('should not create duplicate escalations for same workflow+type', () => {
      addRejectionsToThreshold(tracker, testRunId, 'clarity', 3);

      const firstResult = manager.checkAndEscalate(testRunId, 'clarity');
      const secondResult = manager.checkAndEscalate(testRunId, 'clarity');

      expect(firstResult.escalated).toBe(true);
      expect(secondResult.escalated).toBe(true);
      expect(secondResult.escalationId).toBe(firstResult.escalationId);
      expect(secondResult.reason).toContain('Already escalated');
    });

    it('should use different escalation targets per rejection type', () => {
      const runIds = ['run-style', 'run-mech', 'run-clarity', 'run-scope'];
      runIds.forEach(id => insertTestWorkflowRun(db, id));

      addRejectionsToThreshold(tracker, 'run-style', 'style', 3);
      addRejectionsToThreshold(tracker, 'run-mech', 'mechanics', 3);
      addRejectionsToThreshold(tracker, 'run-clarity', 'clarity', 3);
      addRejectionsToThreshold(tracker, 'run-scope', 'scope', 3);

      const styleResult = manager.checkAndEscalate('run-style', 'style');
      const mechResult = manager.checkAndEscalate('run-mech', 'mechanics');
      const clarityResult = manager.checkAndEscalate('run-clarity', 'clarity');
      const scopeResult = manager.checkAndEscalate('run-scope', 'scope');

      expect(styleResult.escalatedTo).toBe(ESCALATION_TARGETS.SENIOR_EDITOR);
      expect(mechResult.escalatedTo).toBe(ESCALATION_TARGETS.HUMAN_REVIEWER);
      expect(clarityResult.escalatedTo).toBe(ESCALATION_TARGETS.SENIOR_EDITOR);
      expect(scopeResult.escalatedTo).toBe(ESCALATION_TARGETS.HUMAN_REVIEWER);
    });

    it('should emit escalated event via WorkflowEventEmitter', () => {
      addRejectionsToThreshold(tracker, testRunId, 'scope', 3);

      manager.checkAndEscalate(testRunId, 'scope');

      // Check that an escalated event was created
      const eventsStmt = db.prepare(`
        SELECT * FROM workflow_events
        WHERE workflow_run_id = ? AND event_type = 'escalated'
      `);
      const events = eventsStmt.all(testRunId);

      expect(events).toHaveLength(1);
    });

    it('should not create escalation when no rejections exist', () => {
      const result = manager.checkAndEscalate(testRunId, 'style');

      expect(result.escalated).toBe(false);
      expect(result.reason).toContain('has not reached threshold');
    });

    it('should allow escalation for different types on same workflow', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);
      addRejectionsToThreshold(tracker, testRunId, 'mechanics', 3);

      const styleResult = manager.checkAndEscalate(testRunId, 'style');
      const mechResult = manager.checkAndEscalate(testRunId, 'mechanics');

      expect(styleResult.escalated).toBe(true);
      expect(mechResult.escalated).toBe(true);
      expect(styleResult.escalationId).not.toBe(mechResult.escalationId);
    });
  });

  describe('getPendingEscalations', () => {
    it('should return empty array when no escalations exist', () => {
      const pending = manager.getPendingEscalations();
      expect(pending).toEqual([]);
    });

    it('should return all pending escalations', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      addRejectionsToThreshold(tracker, testRunId, 'style', 3);
      addRejectionsToThreshold(tracker, run2Id, 'mechanics', 3);

      manager.checkAndEscalate(testRunId, 'style');
      manager.checkAndEscalate(run2Id, 'mechanics');

      const pending = manager.getPendingEscalations();

      expect(pending).toHaveLength(2);
      expect(pending.every(e => e.status === 'pending')).toBe(true);
    });

    it('should not include acknowledged escalations', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);

      const result = manager.checkAndEscalate(testRunId, 'style');
      manager.acknowledgeEscalation(result.escalationId!);

      const pending = manager.getPendingEscalations();
      expect(pending).toHaveLength(0);
    });

    it('should not include resolved escalations', () => {
      addRejectionsToThreshold(tracker, testRunId, 'clarity', 3);

      const result = manager.checkAndEscalate(testRunId, 'clarity');
      manager.resolveEscalation(result.escalationId!, 'Fixed manually');

      const pending = manager.getPendingEscalations();
      expect(pending).toHaveLength(0);
    });

    it('should order escalations by creation time', () => {
      const run2Id = 'run-test-002';
      const run3Id = 'run-test-003';
      insertTestWorkflowRun(db, run2Id);
      insertTestWorkflowRun(db, run3Id);

      addRejectionsToThreshold(tracker, testRunId, 'style', 3);
      addRejectionsToThreshold(tracker, run2Id, 'mechanics', 3);
      addRejectionsToThreshold(tracker, run3Id, 'clarity', 3);

      manager.checkAndEscalate(testRunId, 'style');
      manager.checkAndEscalate(run2Id, 'mechanics');
      manager.checkAndEscalate(run3Id, 'clarity');

      const pending = manager.getPendingEscalations();

      expect(pending).toHaveLength(3);
      expect(pending[0].workflowRunId).toBe(testRunId);
      expect(pending[1].workflowRunId).toBe(run2Id);
      expect(pending[2].workflowRunId).toBe(run3Id);
    });
  });

  describe('getEscalationsForWorkflow', () => {
    it('should return empty array when no escalations exist for workflow', () => {
      const escalations = manager.getEscalationsForWorkflow(testRunId);
      expect(escalations).toEqual([]);
    });

    it('should return only escalations for the specified workflow', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      addRejectionsToThreshold(tracker, testRunId, 'style', 3);
      addRejectionsToThreshold(tracker, testRunId, 'mechanics', 3);
      addRejectionsToThreshold(tracker, run2Id, 'clarity', 3);

      manager.checkAndEscalate(testRunId, 'style');
      manager.checkAndEscalate(testRunId, 'mechanics');
      manager.checkAndEscalate(run2Id, 'clarity');

      const run1Escalations = manager.getEscalationsForWorkflow(testRunId);
      const run2Escalations = manager.getEscalationsForWorkflow(run2Id);

      expect(run1Escalations).toHaveLength(2);
      expect(run2Escalations).toHaveLength(1);
      expect(run1Escalations.every(e => e.workflowRunId === testRunId)).toBe(true);
      expect(run2Escalations[0].workflowRunId).toBe(run2Id);
    });
  });

  describe('getEscalation', () => {
    it('should return null when escalation does not exist', () => {
      const escalation = manager.getEscalation('non-existent-id');
      expect(escalation).toBeNull();
    });

    it('should return escalation by ID', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);

      const result = manager.checkAndEscalate(testRunId, 'style');
      const escalation = manager.getEscalation(result.escalationId!);

      expect(escalation).not.toBeNull();
      expect(escalation!.id).toBe(result.escalationId);
      expect(escalation!.workflowRunId).toBe(testRunId);
      expect(escalation!.rejectionType).toBe('style');
    });
  });

  describe('acknowledgeEscalation', () => {
    it('should update escalation status to acknowledged', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);

      const result = manager.checkAndEscalate(testRunId, 'style');
      const acknowledged = manager.acknowledgeEscalation(result.escalationId!);

      expect(acknowledged.status).toBe('acknowledged');
      expect(acknowledged.acknowledgedAt).not.toBeNull();
    });

    it('should throw when escalation does not exist', () => {
      expect(() => manager.acknowledgeEscalation('non-existent-id')).toThrow();
    });

    it('should be idempotent - re-acknowledging succeeds', () => {
      addRejectionsToThreshold(tracker, testRunId, 'mechanics', 3);

      const result = manager.checkAndEscalate(testRunId, 'mechanics');
      const firstAck = manager.acknowledgeEscalation(result.escalationId!);
      const secondAck = manager.acknowledgeEscalation(result.escalationId!);

      expect(firstAck.status).toBe('acknowledged');
      expect(secondAck.status).toBe('acknowledged');
    });
  });

  describe('resolveEscalation', () => {
    it('should update escalation status to resolved', () => {
      addRejectionsToThreshold(tracker, testRunId, 'clarity', 3);

      const result = manager.checkAndEscalate(testRunId, 'clarity');
      const resolved = manager.resolveEscalation(result.escalationId!, 'Fixed by manual edit');

      expect(resolved.status).toBe('resolved');
      expect(resolved.resolution).toBe('Fixed by manual edit');
      expect(resolved.resolvedAt).not.toBeNull();
    });

    it('should throw when escalation does not exist', () => {
      expect(() => manager.resolveEscalation('non-existent-id', 'Some resolution')).toThrow();
    });

    it('should allow resolving without prior acknowledgement', () => {
      addRejectionsToThreshold(tracker, testRunId, 'scope', 3);

      const result = manager.checkAndEscalate(testRunId, 'scope');
      const resolved = manager.resolveEscalation(result.escalationId!, 'Direct resolution');

      expect(resolved.status).toBe('resolved');
      expect(resolved.acknowledgedAt).toBeNull();
    });

    it('should complete the acknowledge/resolve workflow', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);

      const result = manager.checkAndEscalate(testRunId, 'style');

      // Initial state
      let escalation = manager.getEscalation(result.escalationId!)!;
      expect(escalation.status).toBe('pending');

      // After acknowledge
      manager.acknowledgeEscalation(result.escalationId!);
      escalation = manager.getEscalation(result.escalationId!)!;
      expect(escalation.status).toBe('acknowledged');
      expect(escalation.acknowledgedAt).not.toBeNull();

      // After resolve
      manager.resolveEscalation(result.escalationId!, 'Completed review');
      escalation = manager.getEscalation(result.escalationId!)!;
      expect(escalation.status).toBe('resolved');
      expect(escalation.resolution).toBe('Completed review');
      expect(escalation.resolvedAt).not.toBeNull();
    });
  });

  describe('getEscalationStats', () => {
    it('should return zero stats when no escalations exist', () => {
      const stats = manager.getEscalationStats();

      expect(stats.total).toBe(0);
      expect(stats.byStatus.pending).toBe(0);
      expect(stats.byStatus.acknowledged).toBe(0);
      expect(stats.byStatus.resolved).toBe(0);
      expect(stats.byType.style).toBe(0);
      expect(stats.byType.mechanics).toBe(0);
      expect(stats.byType.clarity).toBe(0);
      expect(stats.byType.scope).toBe(0);
      expect(Object.keys(stats.byTarget)).toHaveLength(0);
      expect(stats.avgAcknowledgeTime).toBeNull();
      expect(stats.avgResolveTime).toBeNull();
    });

    it('should track counts by status', () => {
      const run2Id = 'run-test-002';
      const run3Id = 'run-test-003';
      insertTestWorkflowRun(db, run2Id);
      insertTestWorkflowRun(db, run3Id);

      addRejectionsToThreshold(tracker, testRunId, 'style', 3);
      addRejectionsToThreshold(tracker, run2Id, 'mechanics', 3);
      addRejectionsToThreshold(tracker, run3Id, 'clarity', 3);

      const result1 = manager.checkAndEscalate(testRunId, 'style');
      const result2 = manager.checkAndEscalate(run2Id, 'mechanics');
      manager.checkAndEscalate(run3Id, 'clarity');

      manager.acknowledgeEscalation(result1.escalationId!);
      manager.resolveEscalation(result2.escalationId!, 'Fixed');

      const stats = manager.getEscalationStats();

      expect(stats.total).toBe(3);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.acknowledged).toBe(1);
      expect(stats.byStatus.resolved).toBe(1);
    });

    it('should track counts by rejection type', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      addRejectionsToThreshold(tracker, testRunId, 'style', 3);
      addRejectionsToThreshold(tracker, testRunId, 'mechanics', 3);
      addRejectionsToThreshold(tracker, run2Id, 'style', 3);

      manager.checkAndEscalate(testRunId, 'style');
      manager.checkAndEscalate(testRunId, 'mechanics');
      manager.checkAndEscalate(run2Id, 'style');

      const stats = manager.getEscalationStats();

      expect(stats.byType.style).toBe(2);
      expect(stats.byType.mechanics).toBe(1);
      expect(stats.byType.clarity).toBe(0);
      expect(stats.byType.scope).toBe(0);
    });

    it('should track counts by target', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      addRejectionsToThreshold(tracker, testRunId, 'style', 3); // -> senior-editor
      addRejectionsToThreshold(tracker, run2Id, 'mechanics', 3); // -> human-reviewer

      manager.checkAndEscalate(testRunId, 'style');
      manager.checkAndEscalate(run2Id, 'mechanics');

      const stats = manager.getEscalationStats();

      expect(stats.byTarget[ESCALATION_TARGETS.SENIOR_EDITOR]).toBe(1);
      expect(stats.byTarget[ESCALATION_TARGETS.HUMAN_REVIEWER]).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive escalation checks', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);

      // Rapid fire checks should all return the same escalation
      const results: EscalationResult[] = [];
      for (let i = 0; i < 5; i++) {
        results.push(manager.checkAndEscalate(testRunId, 'style'));
      }

      expect(results.every(r => r.escalated)).toBe(true);
      expect(results.every(r => r.escalationId === results[0].escalationId)).toBe(true);
    });

    it('should handle multiple workflows with different states', () => {
      const runIds = ['run-1', 'run-2', 'run-3', 'run-4'];
      runIds.forEach(id => insertTestWorkflowRun(db, id));

      // Run-1: Below threshold
      addRejectionsToThreshold(tracker, 'run-1', 'style', 2);

      // Run-2: At threshold, pending
      addRejectionsToThreshold(tracker, 'run-2', 'style', 3);
      manager.checkAndEscalate('run-2', 'style');

      // Run-3: At threshold, acknowledged
      addRejectionsToThreshold(tracker, 'run-3', 'style', 3);
      const result3 = manager.checkAndEscalate('run-3', 'style');
      manager.acknowledgeEscalation(result3.escalationId!);

      // Run-4: At threshold, resolved
      addRejectionsToThreshold(tracker, 'run-4', 'style', 3);
      const result4 = manager.checkAndEscalate('run-4', 'style');
      manager.resolveEscalation(result4.escalationId!, 'Done');

      // Verify states
      const run1Result = manager.checkAndEscalate('run-1', 'style');
      expect(run1Result.escalated).toBe(false);

      expect(manager.getEscalationsForWorkflow('run-2')[0].status).toBe('pending');
      expect(manager.getEscalationsForWorkflow('run-3')[0].status).toBe('acknowledged');
      expect(manager.getEscalationsForWorkflow('run-4')[0].status).toBe('resolved');

      expect(manager.getPendingEscalations()).toHaveLength(1);
    });

    it('should preserve escalation data across retrieval', () => {
      addRejectionsToThreshold(tracker, testRunId, 'scope', 3);

      const result = manager.checkAndEscalate(testRunId, 'scope');
      const escalation = manager.getEscalation(result.escalationId!);

      expect(escalation).not.toBeNull();
      expect(escalation!.id).toBe(result.escalationId);
      expect(escalation!.workflowRunId).toBe(testRunId);
      expect(escalation!.rejectionType).toBe('scope');
      expect(escalation!.retryCount).toBe(3);
      expect(escalation!.escalatedTo).toBe(ESCALATION_TARGETS.HUMAN_REVIEWER);
      expect(escalation!.status).toBe('pending');
      expect(escalation!.createdAt).toBeDefined();
      expect(typeof escalation!.createdAt).toBe('string');
    });
  });

  describe('type safety', () => {
    it('should correctly type escalation fields', () => {
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);

      const result = manager.checkAndEscalate(testRunId, 'style');
      const escalation = manager.getEscalation(result.escalationId!)!;

      // Verify all fields have correct types
      expect(typeof escalation.id).toBe('string');
      expect(typeof escalation.workflowRunId).toBe('string');
      expect(typeof escalation.rejectionType).toBe('string');
      expect(['style', 'mechanics', 'clarity', 'scope']).toContain(escalation.rejectionType);
      expect(typeof escalation.retryCount).toBe('number');
      expect(typeof escalation.escalatedTo).toBe('string');
      expect(typeof escalation.reason).toBe('string');
      expect(typeof escalation.status).toBe('string');
      expect(['pending', 'acknowledged', 'resolved']).toContain(escalation.status);
      expect(escalation.resolution === null || typeof escalation.resolution === 'string').toBe(true);
      expect(typeof escalation.createdAt).toBe('string');
      expect(escalation.acknowledgedAt === null || typeof escalation.acknowledgedAt === 'string').toBe(true);
      expect(escalation.resolvedAt === null || typeof escalation.resolvedAt === 'string').toBe(true);
    });

    it('should correctly type EscalationResult', () => {
      // Not escalated case
      const notEscalated = manager.checkAndEscalate(testRunId, 'style');
      expect(typeof notEscalated.escalated).toBe('boolean');
      expect(notEscalated.escalated).toBe(false);
      expect(notEscalated.escalationId).toBeUndefined();
      expect(notEscalated.escalatedTo).toBeUndefined();
      expect(typeof notEscalated.reason).toBe('string');

      // Escalated case
      addRejectionsToThreshold(tracker, testRunId, 'style', 3);
      const escalated = manager.checkAndEscalate(testRunId, 'style');
      expect(escalated.escalated).toBe(true);
      expect(typeof escalated.escalationId).toBe('string');
      expect(typeof escalated.escalatedTo).toBe('string');
      expect(typeof escalated.reason).toBe('string');
    });
  });

  describe('constants', () => {
    it('should export DEFAULT_ESCALATION_CONFIG', () => {
      expect(DEFAULT_ESCALATION_CONFIG).toBeDefined();
      expect(DEFAULT_ESCALATION_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_ESCALATION_CONFIG.notifyHuman).toBe(true);
      expect(DEFAULT_ESCALATION_CONFIG.escalationTargets).toBeInstanceOf(Map);
      expect(DEFAULT_ESCALATION_CONFIG.escalationTargets.size).toBe(4);
    });
  });
});
