import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-approve-events';

describe('boardroom:approve CLI', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });

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
  });

  it('should approve session and mark complete', () => {
    const output = execSync(
      `npx tsx src/tooling/cli-commands/boardroom-approve.ts --session sess_approve_test --events ${TEST_EVENTS_DIR}`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('APPROVED');
    expect(output).toContain('sess_approve_test');
    expect(output).toContain('PRODUCT');
  });

  it('should write approval events', () => {
    execSync(
      `npx tsx src/tooling/cli-commands/boardroom-approve.ts --session sess_approve_test --events ${TEST_EVENTS_DIR}`,
      { encoding: 'utf-8' }
    );

    const files = require('fs').readdirSync(TEST_EVENTS_DIR);
    const allContent = files.map((f: string) => readFileSync(join(TEST_EVENTS_DIR, f), 'utf-8')).join('');
    expect(allContent).toContain('approved');
  });

  it('should fail without --session', () => {
    expect(() => {
      execSync(
        `npx tsx src/tooling/cli-commands/boardroom-approve.ts --events ${TEST_EVENTS_DIR}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    }).toThrow();
  });
});
