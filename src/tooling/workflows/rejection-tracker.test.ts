import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { unlinkSync, mkdirSync } from 'fs';
import {
  RejectionTracker,
  RejectionType,
  REJECTION_TYPES,
  DEFAULT_ESCALATION_THRESHOLD,
} from './rejection-tracker.js';

/**
 * Create a test database with the required schema
 */
function createTestDb(dbPath: string): Database.Database {
  mkdirSync('data', { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create workflow_runs table (referenced by rejections)
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

  // Create workflow_events table (referenced by rejections)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_events (
      id TEXT PRIMARY KEY,
      workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
      event_type TEXT NOT NULL,
      agent_name TEXT,
      data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create rejections table
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
    CREATE INDEX IF NOT EXISTS idx_rejections_unresolved ON rejections(resolved) WHERE resolved = FALSE;
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
 * Insert a test workflow event
 */
function insertTestEvent(db: Database.Database, eventId: string, runId: string): void {
  db.prepare(`
    INSERT INTO workflow_events (id, workflow_run_id, event_type)
    VALUES (?, ?, 'rejected')
  `).run(eventId, runId);
}

describe('RejectionTracker', () => {
  let db: Database.Database;
  let tracker: RejectionTracker;
  const testDbPath = 'data/test-rejection-tracker.db';
  const testRunId = 'run-test-001';
  const testEventId = 'event-test-001';

  beforeEach(() => {
    db = createTestDb(testDbPath);
    tracker = new RejectionTracker(db);
    insertTestWorkflowRun(db, testRunId);
    insertTestEvent(db, testEventId, testRunId);
  });

  afterEach(() => {
    db.close();
    cleanupTestDb(testDbPath);
  });

  describe('constructor', () => {
    it('should use default escalation threshold', () => {
      const defaultTracker = new RejectionTracker(db);
      // Record 3 rejections, should not escalate yet
      defaultTracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Reason 1',
      });
      defaultTracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Reason 2',
      });
      // At retry count 2, should not escalate
      expect(defaultTracker.shouldEscalate(testRunId, 'style')).toBe(false);

      defaultTracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Reason 3',
      });
      // At retry count 3, should escalate
      expect(defaultTracker.shouldEscalate(testRunId, 'style')).toBe(true);
    });

    it('should accept custom escalation threshold', () => {
      const customTracker = new RejectionTracker(db, 2);
      customTracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Reason 1',
      });
      // At retry count 1, should not escalate with threshold 2
      expect(customTracker.shouldEscalate(testRunId, 'mechanics')).toBe(false);

      customTracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Reason 2',
      });
      // At retry count 2, should escalate with threshold 2
      expect(customTracker.shouldEscalate(testRunId, 'mechanics')).toBe(true);
    });
  });

  describe('recordRejection', () => {
    it.each(REJECTION_TYPES)('should record rejection of type "%s"', (rejectionType) => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType,
        reason: `Test reason for ${rejectionType}`,
      });

      expect(rejection.id).toBeDefined();
      expect(rejection.workflowRunId).toBe(testRunId);
      expect(rejection.rejectionType).toBe(rejectionType);
      expect(rejection.reason).toBe(`Test reason for ${rejectionType}`);
      expect(rejection.retryCount).toBe(1);
      expect(rejection.resolved).toBe(false);
      expect(rejection.createdAt).toBeDefined();
    });

    it('should record rejection with eventId', () => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        eventId: testEventId,
        rejectionType: 'clarity',
        reason: 'Unclear instructions',
      });

      expect(rejection.eventId).toBe(testEventId);
    });

    it('should record rejection without eventId', () => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'scope',
        reason: 'Out of scope',
      });

      expect(rejection.eventId).toBeNull();
    });

    it('should increment retry count for same type in same run', () => {
      const first = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'First style issue',
      });
      expect(first.retryCount).toBe(1);

      const second = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Second style issue',
      });
      expect(second.retryCount).toBe(2);

      const third = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Third style issue',
      });
      expect(third.retryCount).toBe(3);
    });

    it('should track retry counts independently per rejection type', () => {
      const style1 = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Style issue',
      });
      expect(style1.retryCount).toBe(1);

      const mechanics1 = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Mechanics issue',
      });
      expect(mechanics1.retryCount).toBe(1);

      const style2 = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Another style issue',
      });
      expect(style2.retryCount).toBe(2);

      const mechanics2 = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Another mechanics issue',
      });
      expect(mechanics2.retryCount).toBe(2);
    });

    it('should track retry counts independently per workflow run', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      const run1Rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'clarity',
        reason: 'Run 1 clarity issue',
      });
      expect(run1Rejection.retryCount).toBe(1);

      const run2Rejection = tracker.recordRejection({
        workflowRunId: run2Id,
        rejectionType: 'clarity',
        reason: 'Run 2 clarity issue',
      });
      expect(run2Rejection.retryCount).toBe(1);

      const run1SecondRejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'clarity',
        reason: 'Run 1 second clarity issue',
      });
      expect(run1SecondRejection.retryCount).toBe(2);
    });
  });

  describe('getRejectionsForRun', () => {
    it('should return empty array when no rejections exist', () => {
      const rejections = tracker.getRejectionsForRun(testRunId);
      expect(rejections).toEqual([]);
    });

    it('should return all rejections for a run', () => {
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Style issue',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Mechanics issue',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'clarity',
        reason: 'Clarity issue',
      });

      const rejections = tracker.getRejectionsForRun(testRunId);

      expect(rejections).toHaveLength(3);
      expect(rejections.map((r) => r.rejectionType)).toEqual(['style', 'mechanics', 'clarity']);
    });

    it('should only return rejections for the specified run', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Run 1 issue',
      });
      tracker.recordRejection({
        workflowRunId: run2Id,
        rejectionType: 'mechanics',
        reason: 'Run 2 issue',
      });

      const run1Rejections = tracker.getRejectionsForRun(testRunId);
      const run2Rejections = tracker.getRejectionsForRun(run2Id);

      expect(run1Rejections).toHaveLength(1);
      expect(run1Rejections[0].reason).toBe('Run 1 issue');
      expect(run2Rejections).toHaveLength(1);
      expect(run2Rejections[0].reason).toBe('Run 2 issue');
    });

    it('should return rejections in creation order', () => {
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'First',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Second',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'clarity',
        reason: 'Third',
      });

      const rejections = tracker.getRejectionsForRun(testRunId);

      expect(rejections.map((r) => r.reason)).toEqual(['First', 'Second', 'Third']);
    });
  });

  describe('getUnresolvedRejections', () => {
    it('should return empty array when no rejections exist', () => {
      const rejections = tracker.getUnresolvedRejections(testRunId);
      expect(rejections).toEqual([]);
    });

    it('should return only unresolved rejections', () => {
      const first = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Resolved issue',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Unresolved issue',
      });

      tracker.resolveRejection(first.id);

      const unresolved = tracker.getUnresolvedRejections(testRunId);

      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].reason).toBe('Unresolved issue');
      expect(unresolved[0].resolved).toBe(false);
    });

    it('should return empty array when all rejections are resolved', () => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Will be resolved',
      });

      tracker.resolveRejection(rejection.id);

      const unresolved = tracker.getUnresolvedRejections(testRunId);
      expect(unresolved).toEqual([]);
    });
  });

  describe('resolveRejection', () => {
    it('should mark a rejection as resolved', () => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'scope',
        reason: 'Scope issue',
      });

      expect(rejection.resolved).toBe(false);

      const resolved = tracker.resolveRejection(rejection.id);

      expect(resolved.id).toBe(rejection.id);
      expect(resolved.resolved).toBe(true);
    });

    it('should throw when rejection ID does not exist', () => {
      expect(() => tracker.resolveRejection('non-existent-id')).toThrow();
    });

    it('should be idempotent - resolving already resolved rejection succeeds', () => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Already resolved',
      });

      const firstResolve = tracker.resolveRejection(rejection.id);
      const secondResolve = tracker.resolveRejection(rejection.id);

      expect(firstResolve.resolved).toBe(true);
      expect(secondResolve.resolved).toBe(true);
    });
  });

  describe('getRetryCount', () => {
    it('should return 0 when no rejections exist', () => {
      const count = tracker.getRetryCount(testRunId, 'style');
      expect(count).toBe(0);
    });

    it('should return current retry count for rejection type', () => {
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'First',
      });
      expect(tracker.getRetryCount(testRunId, 'mechanics')).toBe(1);

      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Second',
      });
      expect(tracker.getRetryCount(testRunId, 'mechanics')).toBe(2);

      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Third',
      });
      expect(tracker.getRetryCount(testRunId, 'mechanics')).toBe(3);
    });

    it('should return 0 for different rejection type', () => {
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Style issue',
      });

      expect(tracker.getRetryCount(testRunId, 'style')).toBe(1);
      expect(tracker.getRetryCount(testRunId, 'mechanics')).toBe(0);
      expect(tracker.getRetryCount(testRunId, 'clarity')).toBe(0);
      expect(tracker.getRetryCount(testRunId, 'scope')).toBe(0);
    });

    it('should return 0 for different workflow run', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Run 1 issue',
      });

      expect(tracker.getRetryCount(testRunId, 'style')).toBe(1);
      expect(tracker.getRetryCount(run2Id, 'style')).toBe(0);
    });
  });

  describe('shouldEscalate', () => {
    it('should return false when retry count is below threshold', () => {
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'clarity',
        reason: 'First',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'clarity',
        reason: 'Second',
      });

      // Default threshold is 3, retry count is 2
      expect(tracker.shouldEscalate(testRunId, 'clarity')).toBe(false);
    });

    it('should return true when retry count equals threshold', () => {
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'scope',
        reason: 'First',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'scope',
        reason: 'Second',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'scope',
        reason: 'Third',
      });

      // Default threshold is 3, retry count is 3
      expect(tracker.shouldEscalate(testRunId, 'scope')).toBe(true);
    });

    it('should return true when retry count exceeds threshold', () => {
      for (let i = 0; i < 5; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'style',
          reason: `Rejection ${i + 1}`,
        });
      }

      // Default threshold is 3, retry count is 5
      expect(tracker.shouldEscalate(testRunId, 'style')).toBe(true);
    });

    it('should return false when no rejections exist', () => {
      expect(tracker.shouldEscalate(testRunId, 'style')).toBe(false);
    });

    it('should work with custom threshold', () => {
      const customTracker = new RejectionTracker(db, 5);

      for (let i = 0; i < 4; i++) {
        customTracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'mechanics',
          reason: `Rejection ${i + 1}`,
        });
      }
      expect(customTracker.shouldEscalate(testRunId, 'mechanics')).toBe(false);

      customTracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Fifth rejection',
      });
      expect(customTracker.shouldEscalate(testRunId, 'mechanics')).toBe(true);
    });

    it('should check each rejection type independently', () => {
      // Add 3 style rejections (at threshold)
      for (let i = 0; i < 3; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'style',
          reason: `Style ${i + 1}`,
        });
      }

      // Add 2 mechanics rejections (below threshold)
      for (let i = 0; i < 2; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'mechanics',
          reason: `Mechanics ${i + 1}`,
        });
      }

      expect(tracker.shouldEscalate(testRunId, 'style')).toBe(true);
      expect(tracker.shouldEscalate(testRunId, 'mechanics')).toBe(false);
      expect(tracker.shouldEscalate(testRunId, 'clarity')).toBe(false);
      expect(tracker.shouldEscalate(testRunId, 'scope')).toBe(false);
    });
  });

  describe('constants', () => {
    it('should export REJECTION_TYPES array', () => {
      expect(REJECTION_TYPES).toEqual(['style', 'mechanics', 'clarity', 'scope']);
    });

    it('should export DEFAULT_ESCALATION_THRESHOLD', () => {
      expect(DEFAULT_ESCALATION_THRESHOLD).toBe(3);
    });
  });

  describe('type safety', () => {
    it('should map all database fields correctly', () => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        eventId: testEventId,
        rejectionType: 'style',
        reason: 'Test reason',
      });

      // Verify all fields are present and correctly typed
      expect(typeof rejection.id).toBe('string');
      expect(typeof rejection.workflowRunId).toBe('string');
      expect(rejection.eventId === null || typeof rejection.eventId === 'string').toBe(true);
      expect(typeof rejection.rejectionType).toBe('string');
      expect(typeof rejection.reason).toBe('string');
      expect(typeof rejection.retryCount).toBe('number');
      expect(typeof rejection.resolved).toBe('boolean');
      expect(typeof rejection.createdAt).toBe('string');
    });
  });
});
