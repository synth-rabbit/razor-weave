import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-vp-product-events';
const TEST_PROPOSAL = 'data/test-proposal.md';

describe('boardroom:vp-product CLI', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });

    // Create test proposal
    writeFileSync(
      TEST_PROPOSAL,
      `# Test Proposal

## Goal
Build a test feature.

## Requirements
- Requirement 1
- Requirement 2
`
    );
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_PROPOSAL)) rmSync(TEST_PROPOSAL);
  });

  it('should create session and output VP Product prompt', () => {
    const output = execSync(
      `npx tsx src/tooling/cli-commands/boardroom-vp-product.ts --proposal ${TEST_PROPOSAL} --events ${TEST_EVENTS_DIR}`,
      { encoding: 'utf-8' }
    );

    // Should have header
    expect(output).toContain('VP PRODUCT');

    // Should show session ID
    expect(output).toMatch(/Session ID:\s+sess_/);

    // Should have VP prompt
    expect(output).toContain('VP of Product');

    // Should have next step
    expect(output).toContain('NEXT STEP');
  });

  it('should create event file', () => {
    execSync(
      `npx tsx src/tooling/cli-commands/boardroom-vp-product.ts --proposal ${TEST_PROPOSAL} --events ${TEST_EVENTS_DIR}`,
      { encoding: 'utf-8' }
    );

    const files = require('fs').readdirSync(TEST_EVENTS_DIR);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toMatch(/\.jsonl$/);

    // Check session was created
    const content = readFileSync(join(TEST_EVENTS_DIR, files[0]), 'utf-8');
    expect(content).toContain('boardroom_sessions');
  });

  it('should fail without --proposal', () => {
    expect(() => {
      execSync(
        `npx tsx src/tooling/cli-commands/boardroom-vp-product.ts --events ${TEST_EVENTS_DIR}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    }).toThrow();
  });

  it('should fail if proposal file does not exist', () => {
    expect(() => {
      execSync(
        `npx tsx src/tooling/cli-commands/boardroom-vp-product.ts --proposal nonexistent.md --events ${TEST_EVENTS_DIR}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    }).toThrow();
  });
});
