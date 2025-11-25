// src/tooling/boardroom/client.checkpoint.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BoardroomClient } from './client';
import { existsSync, mkdirSync, rmSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-checkpoint-events';

describe('BoardroomClient - Checkpoint Events', () => {
  let client: BoardroomClient;
  const sessionId = 'test-checkpoint-session';

  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
    client = new BoardroomClient(TEST_EVENTS_DIR, sessionId, 'main');
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
  });

  /**
   * Helper to read all events from the events file
   */
  function readEvents(): object[] {
    const files = readdirSync(TEST_EVENTS_DIR).filter((f) => f.endsWith('.jsonl'));
    if (files.length === 0) return [];

    const filePath = join(TEST_EVENTS_DIR, files[0]);
    const content = readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  }

  describe('emitCheckpoint', () => {
    it('should emit a checkpoint event to session_checkpoints table', () => {
      const checkpoint = client.emitCheckpoint('vp_product', 'plan_123', 'Completed initial review');

      expect(checkpoint.id).toMatch(/^chk_/);
      expect(checkpoint.vp_type).toBe('vp_product');
      expect(checkpoint.reference_id).toBe('plan_123');
      expect(checkpoint.description).toBe('Completed initial review');

      const events = readEvents();
      const checkpointEvent = events.find(
        (e: Record<string, unknown>) => e.table === 'session_checkpoints'
      );
      expect(checkpointEvent).toBeDefined();
      expect((checkpointEvent as Record<string, unknown>).op).toBe('INSERT');
    });

    it('should include session_id in checkpoint data', () => {
      client.emitCheckpoint('vp_engineering', 'task_456', 'Started implementation');

      const events = readEvents();
      const checkpointEvent = events.find(
        (e: Record<string, unknown>) => e.table === 'session_checkpoints'
      ) as Record<string, unknown>;

      expect(checkpointEvent).toBeDefined();
      const data = checkpointEvent.data as Record<string, unknown>;
      expect(data.session_id).toBe(sessionId);
    });

    it('should include timestamp in checkpoint', () => {
      const checkpoint = client.emitCheckpoint('vp_ops', 'risk_789', 'Risk assessment complete');

      expect(checkpoint.created_at).toBeDefined();
      // Verify it's a valid ISO timestamp
      expect(() => new Date(checkpoint.created_at)).not.toThrow();
    });
  });
});
