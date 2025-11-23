import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-vp-engineering-events';

describe('boardroom:vp-engineering CLI', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });

    // Create test session event
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
            id: 'sess_test123',
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
            id: 'plan_test123',
            session_id: 'sess_test123',
            vp_type: 'product',
            status: 'draft',
            plan_path: null,
            created_at: '2024-11-22T00:01:00Z',
          },
        }),
        JSON.stringify({
          id: 'evt_3',
          ts: '2024-11-22T00:02:00Z',
          worktree: 'main',
          table: 'phases',
          op: 'INSERT',
          data: {
            id: 'phase_1',
            plan_id: 'plan_test123',
            name: 'Phase 1: Foundation',
            description: 'Build the foundation',
            sequence: 1,
            acceptance_criteria: JSON.stringify(['Tests pass', 'Coverage 80%']),
          },
        }),
      ].join('\n') + '\n'
    );
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
  });

  it('should output VP Engineering prompt for existing session', () => {
    const output = execSync(
      `npx tsx src/tooling/cli-commands/boardroom-vp-engineering.ts --session sess_test123 --events ${TEST_EVENTS_DIR}`,
      { encoding: 'utf-8' }
    );

    // Should have header
    expect(output).toContain('VP ENGINEERING');

    // Should show session ID
    expect(output).toContain('sess_test123');

    // Should have VP prompt
    expect(output).toContain('VP of Engineering');

    // Should include product plan info
    expect(output).toContain('Phase 1');

    // Should have next step
    expect(output).toContain('NEXT STEP');
    expect(output).toContain('vp-ops');
  });

  it('should fail without --session', () => {
    expect(() => {
      execSync(
        `npx tsx src/tooling/cli-commands/boardroom-vp-engineering.ts --events ${TEST_EVENTS_DIR}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    }).toThrow();
  });

  it('should fail for non-existent session', () => {
    expect(() => {
      execSync(
        `npx tsx src/tooling/cli-commands/boardroom-vp-engineering.ts --session sess_nonexistent --events ${TEST_EVENTS_DIR}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    }).toThrow();
  });
});
