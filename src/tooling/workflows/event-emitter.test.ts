import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { unlinkSync } from 'fs';
import {
  WorkflowEventEmitter,
  EVENT_TYPES,
  type EventType,
  type EmitEventInput,
} from './event-emitter.js';

describe('WorkflowEventEmitter', () => {
  let db: Database.Database;
  let emitter: WorkflowEventEmitter;
  const testDbPath = 'data/test-event-emitter.db';

  // Create a minimal schema for testing
  const setupSchema = (database: Database.Database) => {
    database.exec(`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_type TEXT NOT NULL,
        book_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workflow_events (
        id TEXT PRIMARY KEY,
        workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
        event_type TEXT NOT NULL CHECK(event_type IN ('started', 'completed', 'rejected', 'escalated', 'paused', 'resumed')),
        agent_name TEXT,
        data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_workflow_events_run ON workflow_events(workflow_run_id);
      CREATE INDEX IF NOT EXISTS idx_workflow_events_type ON workflow_events(event_type);
    `);
  };

  // Create a test workflow run
  const createTestRun = (runId: string) => {
    const stmt = db.prepare(`
      INSERT INTO workflow_runs (id, workflow_type, book_id, status)
      VALUES (?, 'w1_editing', 'book_1', 'running')
    `);
    stmt.run(runId);
  };

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');
    setupSchema(db);
    emitter = new WorkflowEventEmitter(db);
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
    } catch {
      // Ignore if files don't exist
    }
  });

  describe('emit', () => {
    it('should emit a started event', () => {
      createTestRun('run_1');

      const event = emitter.emit({
        workflowRunId: 'run_1',
        eventType: 'started',
      });

      expect(event.id).toMatch(/^evt_\d+_[a-z0-9]+$/);
      expect(event.workflowRunId).toBe('run_1');
      expect(event.eventType).toBe('started');
      expect(event.agentName).toBeNull();
      expect(event.data).toBeNull();
      expect(event.createdAt).toBeDefined();
    });

    it('should emit a completed event', () => {
      createTestRun('run_2');

      const event = emitter.emit({
        workflowRunId: 'run_2',
        eventType: 'completed',
        agentName: 'editor',
      });

      expect(event.eventType).toBe('completed');
      expect(event.agentName).toBe('editor');
    });

    it('should emit a rejected event with data', () => {
      createTestRun('run_3');

      const event = emitter.emit({
        workflowRunId: 'run_3',
        eventType: 'rejected',
        agentName: 'style_reviewer',
        data: { reason: 'Inconsistent tone', chapter: 5 },
      });

      expect(event.eventType).toBe('rejected');
      expect(event.agentName).toBe('style_reviewer');
      expect(event.data).toEqual({ reason: 'Inconsistent tone', chapter: 5 });
    });

    it('should emit an escalated event', () => {
      createTestRun('run_4');

      const event = emitter.emit({
        workflowRunId: 'run_4',
        eventType: 'escalated',
        agentName: 'editor',
        data: { escalatedTo: 'human_reviewer' },
      });

      expect(event.eventType).toBe('escalated');
      expect(event.data).toEqual({ escalatedTo: 'human_reviewer' });
    });

    it('should emit a paused event', () => {
      createTestRun('run_5');

      const event = emitter.emit({
        workflowRunId: 'run_5',
        eventType: 'paused',
        data: { reason: 'Awaiting input' },
      });

      expect(event.eventType).toBe('paused');
      expect(event.data).toEqual({ reason: 'Awaiting input' });
    });

    it('should emit a resumed event', () => {
      createTestRun('run_6');

      const event = emitter.emit({
        workflowRunId: 'run_6',
        eventType: 'resumed',
        agentName: 'coordinator',
      });

      expect(event.eventType).toBe('resumed');
      expect(event.agentName).toBe('coordinator');
    });

    it.each(EVENT_TYPES)('should emit event type: %s', (eventType: EventType) => {
      createTestRun(`run_type_${eventType}`);

      const event = emitter.emit({
        workflowRunId: `run_type_${eventType}`,
        eventType,
      });

      expect(event.eventType).toBe(eventType);
    });

    it('should generate unique IDs for each event', () => {
      createTestRun('run_unique');

      const event1 = emitter.emit({
        workflowRunId: 'run_unique',
        eventType: 'started',
      });

      const event2 = emitter.emit({
        workflowRunId: 'run_unique',
        eventType: 'completed',
      });

      expect(event1.id).not.toBe(event2.id);
    });

    it('should handle complex nested data', () => {
      createTestRun('run_complex');

      const complexData = {
        nested: {
          deeply: {
            value: 'test',
          },
        },
        array: [1, 2, 3],
        mixed: [{ a: 1 }, { b: 2 }],
      };

      const event = emitter.emit({
        workflowRunId: 'run_complex',
        eventType: 'started',
        data: complexData,
      });

      expect(event.data).toEqual(complexData);
    });
  });

  describe('getEventsForRun', () => {
    it('should return empty array for run with no events', () => {
      createTestRun('run_empty');

      const events = emitter.getEventsForRun('run_empty');

      expect(events).toEqual([]);
    });

    it('should return all events for a run in chronological order', () => {
      createTestRun('run_multi');

      emitter.emit({ workflowRunId: 'run_multi', eventType: 'started' });
      emitter.emit({ workflowRunId: 'run_multi', eventType: 'paused' });
      emitter.emit({ workflowRunId: 'run_multi', eventType: 'resumed' });
      emitter.emit({ workflowRunId: 'run_multi', eventType: 'completed' });

      const events = emitter.getEventsForRun('run_multi');

      expect(events).toHaveLength(4);
      expect(events[0].eventType).toBe('started');
      expect(events[1].eventType).toBe('paused');
      expect(events[2].eventType).toBe('resumed');
      expect(events[3].eventType).toBe('completed');
    });

    it('should only return events for the specified run', () => {
      createTestRun('run_a');
      createTestRun('run_b');

      emitter.emit({ workflowRunId: 'run_a', eventType: 'started' });
      emitter.emit({ workflowRunId: 'run_a', eventType: 'completed' });
      emitter.emit({ workflowRunId: 'run_b', eventType: 'started' });

      const eventsA = emitter.getEventsForRun('run_a');
      const eventsB = emitter.getEventsForRun('run_b');

      expect(eventsA).toHaveLength(2);
      expect(eventsB).toHaveLength(1);
    });

    it('should return empty array for non-existent run', () => {
      const events = emitter.getEventsForRun('non_existent_run');

      expect(events).toEqual([]);
    });

    it('should deserialize data for all events', () => {
      createTestRun('run_data');

      emitter.emit({
        workflowRunId: 'run_data',
        eventType: 'started',
        data: { step: 1 },
      });
      emitter.emit({
        workflowRunId: 'run_data',
        eventType: 'completed',
        data: { step: 2, result: 'success' },
      });

      const events = emitter.getEventsForRun('run_data');

      expect(events[0].data).toEqual({ step: 1 });
      expect(events[1].data).toEqual({ step: 2, result: 'success' });
    });
  });

  describe('getLatestEvent', () => {
    it('should return null for run with no events', () => {
      createTestRun('run_no_events');

      const latest = emitter.getLatestEvent('run_no_events');

      expect(latest).toBeNull();
    });

    it('should return null for non-existent run', () => {
      const latest = emitter.getLatestEvent('non_existent');

      expect(latest).toBeNull();
    });

    it('should return the most recent event', () => {
      createTestRun('run_latest');

      emitter.emit({ workflowRunId: 'run_latest', eventType: 'started' });
      emitter.emit({ workflowRunId: 'run_latest', eventType: 'paused' });
      emitter.emit({
        workflowRunId: 'run_latest',
        eventType: 'resumed',
        agentName: 'coordinator',
      });

      const latest = emitter.getLatestEvent('run_latest');

      expect(latest).not.toBeNull();
      expect(latest!.eventType).toBe('resumed');
      expect(latest!.agentName).toBe('coordinator');
    });

    it('should return the only event when there is just one', () => {
      createTestRun('run_single');

      emitter.emit({
        workflowRunId: 'run_single',
        eventType: 'started',
        data: { initial: true },
      });

      const latest = emitter.getLatestEvent('run_single');

      expect(latest).not.toBeNull();
      expect(latest!.eventType).toBe('started');
      expect(latest!.data).toEqual({ initial: true });
    });

    it('should return correct latest event for specific run', () => {
      createTestRun('run_x');
      createTestRun('run_y');

      emitter.emit({ workflowRunId: 'run_x', eventType: 'started' });
      emitter.emit({ workflowRunId: 'run_y', eventType: 'started' });
      emitter.emit({ workflowRunId: 'run_y', eventType: 'completed' });
      emitter.emit({ workflowRunId: 'run_x', eventType: 'paused' });

      const latestX = emitter.getLatestEvent('run_x');
      const latestY = emitter.getLatestEvent('run_y');

      expect(latestX!.eventType).toBe('paused');
      expect(latestY!.eventType).toBe('completed');
    });
  });

  describe('data serialization/deserialization', () => {
    it('should handle null data correctly', () => {
      createTestRun('run_null');

      const event = emitter.emit({
        workflowRunId: 'run_null',
        eventType: 'started',
        data: undefined,
      });

      expect(event.data).toBeNull();

      const retrieved = emitter.getLatestEvent('run_null');
      expect(retrieved!.data).toBeNull();
    });

    it('should handle empty object data', () => {
      createTestRun('run_empty_obj');

      const event = emitter.emit({
        workflowRunId: 'run_empty_obj',
        eventType: 'started',
        data: {},
      });

      expect(event.data).toEqual({});

      const retrieved = emitter.getLatestEvent('run_empty_obj');
      expect(retrieved!.data).toEqual({});
    });

    it('should preserve data types through serialization', () => {
      createTestRun('run_types');

      const testData = {
        string: 'hello',
        number: 42,
        float: 3.14,
        boolean: true,
        nullValue: null,
        array: [1, 'two', false],
      };

      emitter.emit({
        workflowRunId: 'run_types',
        eventType: 'started',
        data: testData,
      });

      const retrieved = emitter.getLatestEvent('run_types');
      expect(retrieved!.data).toEqual(testData);
    });

    it('should handle special characters in data', () => {
      createTestRun('run_special');

      const specialData = {
        unicode: 'Hello \u4e16\u754c',
        quotes: 'He said "hello"',
        newlines: 'Line 1\nLine 2',
        backslash: 'path\\to\\file',
      };

      emitter.emit({
        workflowRunId: 'run_special',
        eventType: 'started',
        data: specialData,
      });

      const retrieved = emitter.getLatestEvent('run_special');
      expect(retrieved!.data).toEqual(specialData);
    });
  });

  describe('EVENT_TYPES constant', () => {
    it('should contain all valid event types', () => {
      expect(EVENT_TYPES).toContain('started');
      expect(EVENT_TYPES).toContain('completed');
      expect(EVENT_TYPES).toContain('rejected');
      expect(EVENT_TYPES).toContain('escalated');
      expect(EVENT_TYPES).toContain('paused');
      expect(EVENT_TYPES).toContain('resumed');
    });

    it('should have exactly 6 event types', () => {
      expect(EVENT_TYPES).toHaveLength(6);
    });
  });

  describe('ID generation', () => {
    it('should generate IDs with correct format', () => {
      createTestRun('run_id_format');

      const event = emitter.emit({
        workflowRunId: 'run_id_format',
        eventType: 'started',
      });

      // Format: evt_{timestamp}_{random}
      const parts = event.id.split('_');
      expect(parts[0]).toBe('evt');
      expect(parts[1]).toMatch(/^\d+$/); // timestamp is numeric
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // random is alphanumeric
    });

    it('should generate multiple unique IDs rapidly', () => {
      createTestRun('run_rapid');

      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const event = emitter.emit({
          workflowRunId: 'run_rapid',
          eventType: 'started',
        });
        ids.add(event.id);
      }

      expect(ids.size).toBe(100); // All IDs should be unique
    });
  });
});
