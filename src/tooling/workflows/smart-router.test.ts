import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { unlinkSync, mkdirSync } from 'fs';
import { SmartRouter } from './smart-router.js';
import { RejectionTracker, type RejectionType, REJECTION_TYPES } from './rejection-tracker.js';
import {
  HANDLER_AGENTS,
  ESCALATION_TARGETS,
  DEFAULT_MAX_RETRIES,
  type RouteConfig,
} from './routing-config.js';

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

describe('SmartRouter', () => {
  let db: Database.Database;
  let router: SmartRouter;
  let tracker: RejectionTracker;
  const testDbPath = 'data/test-smart-router.db';
  const testRunId = 'run-test-001';

  beforeEach(() => {
    db = createTestDb(testDbPath);
    router = new SmartRouter(db);
    tracker = new RejectionTracker(db);
    insertTestWorkflowRun(db, testRunId);
  });

  afterEach(() => {
    db.close();
    cleanupTestDb(testDbPath);
  });

  describe('constructor', () => {
    it('should use default routing configuration', () => {
      const defaultRouter = new SmartRouter(db);

      expect(defaultRouter.getHandlerForType('style')).toBe(HANDLER_AGENTS.STYLE_EDITOR);
      expect(defaultRouter.getHandlerForType('mechanics')).toBe(HANDLER_AGENTS.MECHANICS_REVIEWER);
      expect(defaultRouter.getHandlerForType('clarity')).toBe(HANDLER_AGENTS.CLARITY_EDITOR);
      expect(defaultRouter.getHandlerForType('scope')).toBe(HANDLER_AGENTS.SCOPE_REVIEWER);
    });

    it('should accept custom routing configuration', () => {
      const customConfig: RouteConfig[] = [
        {
          rejectionType: 'style',
          handlerAgent: 'custom-style-agent',
          maxRetries: 5,
          escalationTarget: 'custom-escalation',
        },
      ];
      const customRouter = new SmartRouter(db, customConfig);

      expect(customRouter.getHandlerForType('style')).toBe('custom-style-agent');
      // Unconfigured types return generic handler
      expect(customRouter.getHandlerForType('mechanics')).toBe(HANDLER_AGENTS.GENERIC_HANDLER);
    });
  });

  describe('getHandlerForType', () => {
    it.each(REJECTION_TYPES)('should return correct handler for type "%s"', (type) => {
      const handler = router.getHandlerForType(type);

      const expectedHandlers: Record<RejectionType, string> = {
        style: HANDLER_AGENTS.STYLE_EDITOR,
        mechanics: HANDLER_AGENTS.MECHANICS_REVIEWER,
        clarity: HANDLER_AGENTS.CLARITY_EDITOR,
        scope: HANDLER_AGENTS.SCOPE_REVIEWER,
      };

      expect(handler).toBe(expectedHandlers[type]);
    });

    it('should return generic handler for unconfigured type', () => {
      const customRouter = new SmartRouter(db, []);
      const handler = customRouter.getHandlerForType('style');
      expect(handler).toBe(HANDLER_AGENTS.GENERIC_HANDLER);
    });
  });

  describe('routeRejection', () => {
    it('should route a rejection to correct handler', () => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Voice inconsistent',
      });

      const result = router.routeRejection(rejection.id);

      expect(result.handler).toBe(HANDLER_AGENTS.STYLE_EDITOR);
      expect(result.shouldEscalate).toBe(false);
      expect(result.retryCount).toBe(1);
      expect(result.metadata.rejectionType).toBe('style');
      expect(result.metadata.workflowRunId).toBe(testRunId);
    });

    it('should indicate escalation when max retries exceeded', () => {
      // Record 3 rejections to hit default max retries
      for (let i = 0; i < 3; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'mechanics',
          reason: `Grammar issue ${i + 1}`,
        });
      }

      // Get the latest rejection
      const rejections = tracker.getRejectionsForRun(testRunId);
      const lastRejection = rejections[rejections.length - 1];

      const result = router.routeRejection(lastRejection.id);

      expect(result.shouldEscalate).toBe(true);
      expect(result.retryCount).toBe(3);
      expect(result.handler).toBe(ESCALATION_TARGETS.HUMAN_REVIEWER);
    });

    it('should route to escalation target when escalating', () => {
      // Create custom config with specific escalation target
      const customRouter = new SmartRouter(db, [
        {
          rejectionType: 'clarity',
          handlerAgent: HANDLER_AGENTS.CLARITY_EDITOR,
          maxRetries: 2,
          escalationTarget: ESCALATION_TARGETS.SENIOR_EDITOR,
        },
      ]);

      // Record 2 rejections to hit custom max retries
      for (let i = 0; i < 2; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'clarity',
          reason: `Unclear section ${i + 1}`,
        });
      }

      const rejections = tracker.getRejectionsForRun(testRunId);
      const lastRejection = rejections[rejections.length - 1];

      const result = customRouter.routeRejection(lastRejection.id);

      expect(result.shouldEscalate).toBe(true);
      expect(result.handler).toBe(ESCALATION_TARGETS.SENIOR_EDITOR);
    });

    it('should throw when rejection ID not found', () => {
      expect(() => router.routeRejection('non-existent-id')).toThrow();
    });

    it('should include metadata in route result', () => {
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'scope',
        reason: 'Out of scope',
      });

      const result = router.routeRejection(rejection.id);

      expect(result.metadata).toMatchObject({
        rejectionType: 'scope',
        workflowRunId: testRunId,
        maxRetries: DEFAULT_MAX_RETRIES,
        escalationTarget: ESCALATION_TARGETS.HUMAN_REVIEWER,
      });
    });
  });

  describe('shouldEscalate', () => {
    it('should return false when retry count is below threshold', () => {
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'First issue',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Second issue',
      });

      expect(router.shouldEscalate(testRunId, 'style')).toBe(false);
    });

    it('should return true when retry count equals threshold', () => {
      for (let i = 0; i < DEFAULT_MAX_RETRIES; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'mechanics',
          reason: `Issue ${i + 1}`,
        });
      }

      expect(router.shouldEscalate(testRunId, 'mechanics')).toBe(true);
    });

    it('should return true when retry count exceeds threshold', () => {
      for (let i = 0; i < 5; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'clarity',
          reason: `Issue ${i + 1}`,
        });
      }

      expect(router.shouldEscalate(testRunId, 'clarity')).toBe(true);
    });

    it('should return false when no rejections exist', () => {
      expect(router.shouldEscalate(testRunId, 'scope')).toBe(false);
    });

    it('should use custom max retries from route configuration', () => {
      const customRouter = new SmartRouter(db, [
        {
          rejectionType: 'style',
          handlerAgent: HANDLER_AGENTS.STYLE_EDITOR,
          maxRetries: 5,
          escalationTarget: ESCALATION_TARGETS.SENIOR_EDITOR,
        },
      ]);

      // Record 4 rejections (below custom threshold of 5)
      for (let i = 0; i < 4; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'style',
          reason: `Issue ${i + 1}`,
        });
      }

      expect(customRouter.shouldEscalate(testRunId, 'style')).toBe(false);

      // Record 5th rejection (at threshold)
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Issue 5',
      });

      expect(customRouter.shouldEscalate(testRunId, 'style')).toBe(true);
    });
  });

  describe('getRoutingStats', () => {
    it('should return zero counts when no rejections exist', () => {
      const stats = router.getRoutingStats();

      expect(stats.totalRouted).toBe(0);
      expect(stats.byType.style).toBe(0);
      expect(stats.byType.mechanics).toBe(0);
      expect(stats.byType.clarity).toBe(0);
      expect(stats.byType.scope).toBe(0);
      expect(stats.escalations).toBe(0);
    });

    it('should track counts by rejection type', () => {
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Style issue 1',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Style issue 2',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'mechanics',
        reason: 'Mechanics issue',
      });

      const stats = router.getRoutingStats();

      expect(stats.totalRouted).toBe(3);
      expect(stats.byType.style).toBe(2);
      expect(stats.byType.mechanics).toBe(1);
      expect(stats.byType.clarity).toBe(0);
      expect(stats.byType.scope).toBe(0);
    });

    it('should track counts by handler', () => {
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

      const stats = router.getRoutingStats();

      expect(stats.byHandler[HANDLER_AGENTS.STYLE_EDITOR]).toBe(1);
      expect(stats.byHandler[HANDLER_AGENTS.MECHANICS_REVIEWER]).toBe(1);
    });

    it('should count escalations correctly', () => {
      // Record 3 style rejections (at threshold)
      for (let i = 0; i < 3; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'style',
          reason: `Style issue ${i + 1}`,
        });
      }

      // Record 2 mechanics rejections (below threshold)
      for (let i = 0; i < 2; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'mechanics',
          reason: `Mechanics issue ${i + 1}`,
        });
      }

      const stats = router.getRoutingStats();

      // Only the 3rd style rejection (retry_count = 3) should be escalated
      expect(stats.escalations).toBe(1);
    });

    it('should filter stats by workflow run ID', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Run 1 style issue',
      });
      tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Run 1 style issue 2',
      });
      tracker.recordRejection({
        workflowRunId: run2Id,
        rejectionType: 'mechanics',
        reason: 'Run 2 mechanics issue',
      });

      const run1Stats = router.getRoutingStats(testRunId);
      const run2Stats = router.getRoutingStats(run2Id);

      expect(run1Stats.totalRouted).toBe(2);
      expect(run1Stats.byType.style).toBe(2);
      expect(run1Stats.byType.mechanics).toBe(0);

      expect(run2Stats.totalRouted).toBe(1);
      expect(run2Stats.byType.style).toBe(0);
      expect(run2Stats.byType.mechanics).toBe(1);
    });
  });

  describe('setRoute', () => {
    it('should allow overriding route configuration', () => {
      expect(router.getHandlerForType('style')).toBe(HANDLER_AGENTS.STYLE_EDITOR);

      router.setRoute('style', 'custom-style-handler');

      expect(router.getHandlerForType('style')).toBe('custom-style-handler');
    });

    it('should set custom max retries', () => {
      router.setRoute('mechanics', 'custom-handler', 10);

      const route = router.getRoute('mechanics');

      expect(route?.maxRetries).toBe(10);
    });

    it('should set custom escalation target', () => {
      router.setRoute('clarity', 'custom-handler', 3, 'custom-escalation');

      const route = router.getRoute('clarity');

      expect(route?.escalationTarget).toBe('custom-escalation');
    });

    it('should use defaults for optional parameters', () => {
      router.setRoute('scope', 'custom-scope-handler');

      const route = router.getRoute('scope');

      expect(route?.handlerAgent).toBe('custom-scope-handler');
      expect(route?.maxRetries).toBe(DEFAULT_MAX_RETRIES);
      expect(route?.escalationTarget).toBe(ESCALATION_TARGETS.DEFAULT);
    });

    it('should affect routing decisions after configuration', () => {
      // Set custom route with low max retries
      router.setRoute('style', 'quick-handler', 1, 'immediate-escalation');

      // Record one rejection
      const rejection = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Style issue',
      });

      // Should escalate immediately with max retries = 1
      expect(router.shouldEscalate(testRunId, 'style')).toBe(true);

      const result = router.routeRejection(rejection.id);
      expect(result.shouldEscalate).toBe(true);
      expect(result.handler).toBe('immediate-escalation');
    });
  });

  describe('getRoute', () => {
    it('should return route configuration for a type', () => {
      const route = router.getRoute('style');

      expect(route).toMatchObject({
        rejectionType: 'style',
        handlerAgent: HANDLER_AGENTS.STYLE_EDITOR,
        maxRetries: DEFAULT_MAX_RETRIES,
        escalationTarget: ESCALATION_TARGETS.SENIOR_EDITOR,
      });
    });

    it('should return undefined for unconfigured type', () => {
      const customRouter = new SmartRouter(db, []);
      const route = customRouter.getRoute('style');

      expect(route).toBeUndefined();
    });
  });

  describe('getAllRoutes', () => {
    it('should return all configured routes', () => {
      const routes = router.getAllRoutes();

      expect(routes).toHaveLength(4);
      expect(routes.map((r) => r.rejectionType).sort()).toEqual(
        ['clarity', 'mechanics', 'scope', 'style'],
      );
    });

    it('should return empty array when no routes configured', () => {
      const emptyRouter = new SmartRouter(db, []);
      const routes = emptyRouter.getAllRoutes();

      expect(routes).toHaveLength(0);
    });
  });

  describe('getEscalationTarget', () => {
    it('should return configured escalation target', () => {
      expect(router.getEscalationTarget('style')).toBe(ESCALATION_TARGETS.SENIOR_EDITOR);
      expect(router.getEscalationTarget('mechanics')).toBe(ESCALATION_TARGETS.HUMAN_REVIEWER);
    });

    it('should return default escalation target for unconfigured type', () => {
      const customRouter = new SmartRouter(db, []);
      expect(customRouter.getEscalationTarget('style')).toBe(ESCALATION_TARGETS.DEFAULT);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow with escalation', () => {
      // Simulate a workflow with multiple rejection cycles
      const rejectionIds: string[] = [];

      // First rejection - should route to style editor
      const r1 = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Voice too formal',
      });
      rejectionIds.push(r1.id);

      let result = router.routeRejection(r1.id);
      expect(result.handler).toBe(HANDLER_AGENTS.STYLE_EDITOR);
      expect(result.shouldEscalate).toBe(false);

      // Second rejection - still below threshold
      const r2 = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Voice still too formal',
      });
      rejectionIds.push(r2.id);

      result = router.routeRejection(r2.id);
      expect(result.handler).toBe(HANDLER_AGENTS.STYLE_EDITOR);
      expect(result.shouldEscalate).toBe(false);

      // Third rejection - at threshold, escalate
      const r3 = tracker.recordRejection({
        workflowRunId: testRunId,
        rejectionType: 'style',
        reason: 'Voice consistently wrong',
      });
      rejectionIds.push(r3.id);

      result = router.routeRejection(r3.id);
      expect(result.handler).toBe(ESCALATION_TARGETS.SENIOR_EDITOR);
      expect(result.shouldEscalate).toBe(true);

      // Verify stats
      const stats = router.getRoutingStats(testRunId);
      expect(stats.totalRouted).toBe(3);
      expect(stats.byType.style).toBe(3);
      expect(stats.escalations).toBe(1);
    });

    it('should handle multiple rejection types independently', () => {
      // Style rejections
      for (let i = 0; i < 3; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'style',
          reason: `Style ${i + 1}`,
        });
      }

      // Mechanics rejections (only 2)
      for (let i = 0; i < 2; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'mechanics',
          reason: `Mechanics ${i + 1}`,
        });
      }

      // Style should escalate, mechanics should not
      expect(router.shouldEscalate(testRunId, 'style')).toBe(true);
      expect(router.shouldEscalate(testRunId, 'mechanics')).toBe(false);

      const stats = router.getRoutingStats(testRunId);
      expect(stats.totalRouted).toBe(5);
      expect(stats.escalations).toBe(1); // Only style
    });

    it('should handle multiple workflow runs independently', () => {
      const run2Id = 'run-test-002';
      insertTestWorkflowRun(db, run2Id);

      // Run 1: 3 style rejections (escalate)
      for (let i = 0; i < 3; i++) {
        tracker.recordRejection({
          workflowRunId: testRunId,
          rejectionType: 'style',
          reason: `Run 1 style ${i + 1}`,
        });
      }

      // Run 2: 2 style rejections (don't escalate)
      for (let i = 0; i < 2; i++) {
        tracker.recordRejection({
          workflowRunId: run2Id,
          rejectionType: 'style',
          reason: `Run 2 style ${i + 1}`,
        });
      }

      expect(router.shouldEscalate(testRunId, 'style')).toBe(true);
      expect(router.shouldEscalate(run2Id, 'style')).toBe(false);
    });
  });

  describe('constants export', () => {
    it('should have correct default max retries', () => {
      expect(DEFAULT_MAX_RETRIES).toBe(3);
    });

    it('should have all handler agents defined', () => {
      expect(HANDLER_AGENTS.STYLE_EDITOR).toBe('style-editor');
      expect(HANDLER_AGENTS.MECHANICS_REVIEWER).toBe('mechanics-reviewer');
      expect(HANDLER_AGENTS.CLARITY_EDITOR).toBe('clarity-editor');
      expect(HANDLER_AGENTS.SCOPE_REVIEWER).toBe('scope-reviewer');
      expect(HANDLER_AGENTS.GENERIC_HANDLER).toBe('generic-handler');
    });

    it('should have all escalation targets defined', () => {
      expect(ESCALATION_TARGETS.HUMAN_REVIEWER).toBe('human-reviewer');
      expect(ESCALATION_TARGETS.SENIOR_EDITOR).toBe('senior-editor');
      expect(ESCALATION_TARGETS.DEFAULT).toBe('human-reviewer');
    });
  });
});
