import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-status-events';

describe('boardroom:status CLI', () => {
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
            id: 'sess_status_test',
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
            id: 'plan_1',
            session_id: 'sess_status_test',
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

  it('should show session status', () => {
    const output = execSync(
      `npx tsx src/tooling/cli-commands/boardroom-status.ts --session sess_status_test --events ${TEST_EVENTS_DIR}`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('STATUS');
    expect(output).toContain('sess_status_test');
    expect(output).toContain('active');
    expect(output).toContain('PRODUCT');
  });

  it('should list all sessions with --list', () => {
    const output = execSync(
      `npx tsx src/tooling/cli-commands/boardroom-status.ts --list --events ${TEST_EVENTS_DIR}`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('SESSIONS');
    expect(output).toContain('sess_status_test');
  });

  it('should fail without --session or --list', () => {
    expect(() => {
      execSync(
        `npx tsx src/tooling/cli-commands/boardroom-status.ts --events ${TEST_EVENTS_DIR}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    }).toThrow();
  });
});
