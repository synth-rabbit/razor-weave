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
});
