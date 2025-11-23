// src/tooling/events/writer.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventWriter } from './writer';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_DIR = 'data/test-events';

describe('EventWriter', () => {
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

  it('should create event file with correct naming', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    writer.write('vp_plans', 'INSERT', { name: 'test' });

    const files = require('fs').readdirSync(TEST_DIR);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^\d{4}-\d{2}-\d{2}-test-session\.jsonl$/);
  });

  it('should write valid JSONL format', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    writer.write('vp_plans', 'INSERT', { name: 'test' });

    const files = require('fs').readdirSync(TEST_DIR);
    const content = readFileSync(join(TEST_DIR, files[0]), 'utf-8');
    const event = JSON.parse(content.trim());

    expect(event.table).toBe('vp_plans');
    expect(event.op).toBe('INSERT');
    expect(event.data.name).toBe('test');
    expect(event.worktree).toBe('main');
  });

  it('should append multiple events to same file', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });
    writer.write('phases', 'INSERT', { id: '2' });

    const files = require('fs').readdirSync(TEST_DIR);
    expect(files).toHaveLength(1);

    const content = readFileSync(join(TEST_DIR, files[0]), 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('should include timestamp in events', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    const before = new Date().toISOString();
    writer.write('vp_plans', 'INSERT', { name: 'test' });
    const after = new Date().toISOString();

    const files = require('fs').readdirSync(TEST_DIR);
    const content = readFileSync(join(TEST_DIR, files[0]), 'utf-8');
    const event = JSON.parse(content.trim());

    expect(event.ts >= before).toBe(true);
    expect(event.ts <= after).toBe(true);
  });

  it('should generate unique event IDs', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });
    writer.write('vp_plans', 'INSERT', { id: '2' });

    const files = require('fs').readdirSync(TEST_DIR);
    const content = readFileSync(join(TEST_DIR, files[0]), 'utf-8');
    const lines = content.trim().split('\n');
    const event1 = JSON.parse(lines[0]);
    const event2 = JSON.parse(lines[1]);

    expect(event1.id).not.toBe(event2.id);
  });
});
