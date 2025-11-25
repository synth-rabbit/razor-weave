// src/tooling/events/reader.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventReader } from './reader';
import { EventWriter } from './writer';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEST_DIR = 'data/test-events-reader';

describe('EventReader', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('should read all events from directory', () => {
    const writer = new EventWriter(TEST_DIR, 'session1', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });
    writer.write('phases', 'INSERT', { id: '2' });

    const reader = new EventReader(TEST_DIR);
    const events = reader.readAll();

    expect(events).toHaveLength(2);
  });

  it('should read events in chronological order', () => {
    // Create two files with different dates
    writeFileSync(
      join(TEST_DIR, '2024-01-01-old.jsonl'),
      '{"id":"1","ts":"2024-01-01T00:00:00Z","worktree":"main","table":"t","op":"INSERT","data":{}}\n'
    );
    writeFileSync(
      join(TEST_DIR, '2024-01-02-new.jsonl'),
      '{"id":"2","ts":"2024-01-02T00:00:00Z","worktree":"main","table":"t","op":"INSERT","data":{}}\n'
    );

    const reader = new EventReader(TEST_DIR);
    const events = reader.readAll();

    expect(events[0].id).toBe('1');
    expect(events[1].id).toBe('2');
  });

  it('should filter events by table', () => {
    const writer = new EventWriter(TEST_DIR, 'session1', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });
    writer.write('phases', 'INSERT', { id: '2' });
    writer.write('vp_plans', 'INSERT', { id: '3' });

    const reader = new EventReader(TEST_DIR);
    const events = reader.readByTable('vp_plans');

    expect(events).toHaveLength(2);
    expect(events.every(e => e.table === 'vp_plans')).toBe(true);
  });

  it('should return empty array for empty directory', () => {
    const reader = new EventReader(TEST_DIR);
    const events = reader.readAll();

    expect(events).toEqual([]);
  });

  it('should skip non-jsonl files', () => {
    writeFileSync(join(TEST_DIR, 'readme.txt'), 'ignore me');
    const writer = new EventWriter(TEST_DIR, 'session1', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });

    const reader = new EventReader(TEST_DIR);
    const events = reader.readAll();

    expect(events).toHaveLength(1);
  });
});
