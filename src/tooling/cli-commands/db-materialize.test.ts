// src/tooling/cli-commands/db-materialize.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import Database from 'better-sqlite3';

const TEST_EVENTS_DIR = 'data/test-cli-events';
const TEST_DB = 'data/test-cli.db';

describe('db:materialize CLI', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB)) rmSync(TEST_DB);
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB)) rmSync(TEST_DB);
    if (existsSync(`${TEST_DB}.backup`)) rmSync(`${TEST_DB}.backup`);
  });

  it('should materialize events into database', () => {
    // Create test event
    writeFileSync(
      `${TEST_EVENTS_DIR}/2024-11-22-test.jsonl`,
      '{"id":"1","ts":"2024-11-22T00:00:00Z","worktree":"main","table":"boardroom_sessions","op":"INSERT","data":{"id":"sess_1","proposal_path":"test.md","status":"active"}}\n'
    );

    // Run CLI
    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`, {
      encoding: 'utf-8'
    });

    // Verify DB
    expect(existsSync(TEST_DB)).toBe(true);
    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM boardroom_sessions').all();
    db.close();

    expect(rows).toHaveLength(1);
  });

  it('should materialize execution_batches table', () => {
    writeFileSync(
      `${TEST_EVENTS_DIR}/2024-11-22-test.jsonl`,
      '{"id":"evt_1","ts":"2024-11-22T00:00:00Z","worktree":"main","table":"execution_batches","op":"INSERT","data":{"id":"batch_1","plan_id":"plan_123","batch_number":"1","status":"pending","created_at":"2024-11-22T00:00:00Z"}}\n'
    );

    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`, {
      encoding: 'utf-8'
    });

    expect(existsSync(TEST_DB)).toBe(true);
    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM execution_batches').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect((rows[0] as Record<string, unknown>).id).toBe('batch_1');
    expect((rows[0] as Record<string, unknown>).plan_id).toBe('plan_123');
  });

  it('should materialize operational_risks table', () => {
    writeFileSync(
      `${TEST_EVENTS_DIR}/2024-11-22-test.jsonl`,
      '{"id":"evt_1","ts":"2024-11-22T00:00:00Z","worktree":"main","table":"operational_risks","op":"INSERT","data":{"id":"risk_1","plan_id":"plan_456","description":"Risk of API rate limiting","severity":"medium","mitigation":"Implement backoff strategy"}}\n'
    );

    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`, {
      encoding: 'utf-8'
    });

    expect(existsSync(TEST_DB)).toBe(true);
    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM operational_risks').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect((rows[0] as Record<string, unknown>).id).toBe('risk_1');
    expect((rows[0] as Record<string, unknown>).description).toBe('Risk of API rate limiting');
  });

  it('should materialize boardroom_minutes table', () => {
    writeFileSync(
      `${TEST_EVENTS_DIR}/2024-11-22-test.jsonl`,
      '{"id":"evt_1","ts":"2024-11-22T00:00:00Z","worktree":"main","table":"boardroom_minutes","op":"INSERT","data":{"id":"min_1","session_id":"sess_123","content":"Meeting minutes content","file_path":"/docs/minutes.md","created_at":"2024-11-22T00:00:00Z"}}\n'
    );

    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`, {
      encoding: 'utf-8'
    });

    expect(existsSync(TEST_DB)).toBe(true);
    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM boardroom_minutes').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect((rows[0] as Record<string, unknown>).id).toBe('min_1');
    expect((rows[0] as Record<string, unknown>).content).toBe('Meeting minutes content');
  });

  it('should materialize session_checkpoints table', () => {
    writeFileSync(
      `${TEST_EVENTS_DIR}/2024-11-22-test.jsonl`,
      '{"id":"evt_1","ts":"2024-11-22T00:00:00Z","worktree":"main","table":"session_checkpoints","op":"INSERT","data":{"id":"chk_1","session_id":"sess_123","vp_type":"vp_product","reference_id":"plan_123","description":"Completed initial review","created_at":"2024-11-22T00:00:00Z"}}\n'
    );

    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`, {
      encoding: 'utf-8'
    });

    expect(existsSync(TEST_DB)).toBe(true);
    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM session_checkpoints').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect((rows[0] as Record<string, unknown>).id).toBe('chk_1');
    expect((rows[0] as Record<string, unknown>).vp_type).toBe('vp_product');
    expect((rows[0] as Record<string, unknown>).description).toBe('Completed initial review');
  });
});
