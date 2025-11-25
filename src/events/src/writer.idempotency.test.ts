// src/tooling/events/writer.idempotency.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventWriter } from './writer';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-idempotency-events';

describe('EventWriter - Idempotency', () => {
  let writer: EventWriter;
  const sessionId = 'test-idempotent-session';

  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
    writer = new EventWriter(TEST_EVENTS_DIR, sessionId, 'main');
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
  });

  /**
   * Helper to read all events from the events file
   */
  function readEvents(): object[] {
    const date = new Date().toISOString().split('T')[0];
    const filePath = join(TEST_EVENTS_DIR, `${date}-${sessionId}.jsonl`);
    if (!existsSync(filePath)) return [];

    const content = readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  }

  describe('writeIdempotent', () => {
    it('should write event on first call with idempotency key', () => {
      writer.writeIdempotent('idem_key_1', 'test_table', 'INSERT', { id: 'rec_1', name: 'Test' });

      const events = readEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as Record<string, unknown>).table).toBe('test_table');
    });

    it('should skip duplicate writes with same idempotency key', () => {
      writer.writeIdempotent('idem_key_2', 'test_table', 'INSERT', { id: 'rec_2', name: 'First' });
      writer.writeIdempotent('idem_key_2', 'test_table', 'INSERT', { id: 'rec_2', name: 'Duplicate' });

      const events = readEvents();
      expect(events).toHaveLength(1);
      // Should have the first write's data
      expect(((events[0] as Record<string, unknown>).data as Record<string, unknown>).name).toBe('First');
    });

    it('should allow different idempotency keys', () => {
      writer.writeIdempotent('idem_key_3a', 'test_table', 'INSERT', { id: 'rec_3', name: 'First' });
      writer.writeIdempotent('idem_key_3b', 'test_table', 'INSERT', { id: 'rec_4', name: 'Second' });

      const events = readEvents();
      expect(events).toHaveLength(2);
    });

    it('should persist idempotency across writer instances', () => {
      // First writer writes an event
      writer.writeIdempotent('idem_key_persist', 'test_table', 'INSERT', { id: 'rec_p', name: 'Original' });

      // Create a new writer instance (simulates restart)
      const writer2 = new EventWriter(TEST_EVENTS_DIR, sessionId, 'main');
      writer2.writeIdempotent('idem_key_persist', 'test_table', 'INSERT', { id: 'rec_p', name: 'Attempt2' });

      const events = readEvents();
      expect(events).toHaveLength(1);
      expect(((events[0] as Record<string, unknown>).data as Record<string, unknown>).name).toBe('Original');
    });

    it('should store idempotency key in event metadata', () => {
      writer.writeIdempotent('idem_key_meta', 'test_table', 'INSERT', { id: 'rec_m', name: 'Test' });

      const events = readEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as Record<string, unknown>).idempotency_key).toBe('idem_key_meta');
    });
  });
});
