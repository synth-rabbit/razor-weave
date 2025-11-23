import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-vp-ops-events';

describe('boardroom:vp-ops CLI', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });

    writeFileSync(
      join(TEST_EVENTS_DIR, '2024-11-22-test.jsonl'),
      JSON.stringify({
        id: 'evt_1',
        ts: '2024-11-22T00:00:00Z',
        worktree: 'main',
        table: 'boardroom_sessions',
        op: 'INSERT',
        data: {
          id: 'sess_ops_test',
          proposal_path: 'test.md',
          status: 'active',
          created_at: '2024-11-22T00:00:00Z',
          completed_at: null,
        },
      }) + '\n'
    );
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
  });

  it('should output VP Ops prompt for existing session', () => {
    const output = execSync(
      `npx tsx src/tooling/cli-commands/boardroom-vp-ops.ts --session sess_ops_test --events ${TEST_EVENTS_DIR}`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('VP OPERATIONS');
    expect(output).toContain('sess_ops_test');
    expect(output).toContain('VP of Operations');
  });

  it('should support brainstorm mode', () => {
    const output = execSync(
      `npx tsx src/tooling/cli-commands/boardroom-vp-ops.ts --session sess_ops_test --events ${TEST_EVENTS_DIR} --brainstorm --question "Which option?" --options "A,B,C"`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('BRAINSTORM');
    expect(output).toContain('Which option');
    expect(output).toContain('A)');
  });

  it('should fail without --session', () => {
    expect(() => {
      execSync(
        `npx tsx src/tooling/cli-commands/boardroom-vp-ops.ts --events ${TEST_EVENTS_DIR}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    }).toThrow();
  });
});
