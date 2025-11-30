import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';

const TEST_EVENTS_DIR = 'data/test-approve-events';
// ⚠️ CRITICAL: NEVER use 'data/project.db' - that's the production database!
// Tests MUST use an isolated path to prevent data loss.
const TEST_DB_DIR = 'data/test-boardroom-approve';
const TEST_DB = join(TEST_DB_DIR, 'test.db');

describe('boardroom:approve CLI', () => {
  beforeEach(() => {
    // Clean up test directories
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_DB_DIR, { recursive: true });

    writeFileSync(
      join(TEST_EVENTS_DIR, '2024-11-22-test.jsonl'),
      [
        JSON.stringify({
          id: 'evt_1',
          ts: '2024-11-22T00:00:00Z',
          worktree: 'main',
          table: 'boardroom_sessions',
          op: 'INSERT',
          data: {
            id: 'sess_approve_test',
            proposal_path: 'test.md',
            status: 'active',
            created_at: '2024-11-22T00:00:00Z',
            completed_at: null,
          },
        }),
        JSON.stringify({
          id: 'evt_2',
          ts: '2024-11-22T00:01:00Z',
          worktree: 'main',
          table: 'vp_plans',
          op: 'INSERT',
          data: {
            id: 'plan_product',
            session_id: 'sess_approve_test',
            vp_type: 'product',
            status: 'draft',
            plan_path: null,
            created_at: '2024-11-22T00:01:00Z',
          },
        }),
      ].join('\n') + '\n'
    );
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true });
  });

  it('should approve session and mark complete', () => {
    const output = execSync(
      `npx tsx src/tooling/cli-commands/boardroom-approve.ts --session sess_approve_test --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('APPROVED');
    expect(output).toContain('sess_approve_test');
    expect(output).toContain('PRODUCT');
  });

  it('should write approval events', () => {
    execSync(
      `npx tsx src/tooling/cli-commands/boardroom-approve.ts --session sess_approve_test --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`,
      { encoding: 'utf-8' }
    );

    const files = require('fs').readdirSync(TEST_EVENTS_DIR);
    const allContent = files.map((f: string) => readFileSync(join(TEST_EVENTS_DIR, f), 'utf-8')).join('');
    expect(allContent).toContain('approved');
  });

  it('should fail without --session', () => {
    expect(() => {
      execSync(
        `npx tsx src/tooling/cli-commands/boardroom-approve.ts --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    }).toThrow();
  });

  it('should auto-materialize database after approval', () => {
    execSync(
      `npx tsx src/tooling/cli-commands/boardroom-approve.ts --session sess_approve_test --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`,
      { encoding: 'utf-8' }
    );

    expect(existsSync(TEST_DB)).toBe(true);

    const db = new Database(TEST_DB);
    const sessions = db.prepare('SELECT * FROM boardroom_sessions').all();
    const plans = db.prepare('SELECT * FROM vp_plans').all();
    db.close();

    expect(sessions).toHaveLength(1);
    expect(plans).toHaveLength(1);
    // Verify approval status was materialized
    expect((plans[0] as Record<string, unknown>).status).toBe('approved');
  });
});
