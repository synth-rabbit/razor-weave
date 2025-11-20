import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { StateClient } from '../database/state-client.js';

describe('E2E Git Workflow', () => {
  let db: Database.Database;
  let stateClient: StateClient;
  const testDir = 'data/test-git-workflow';
  const testFile = `${testDir}/test.md`;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
    stateClient = new StateClient(db);

    // Create test directory and init git repo
    mkdirSync(testDir, { recursive: true });
    execSync('git init', { cwd: testDir });
    execSync('git config user.email "test@test.com"', { cwd: testDir });
    execSync('git config user.name "Test User"', { cwd: testDir });
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should track file changes through commit lifecycle', () => {
    // Write initial file
    writeFileSync(testFile, '# Initial Content\n');
    execSync('git add .', { cwd: testDir });
    execSync('git commit -m "Initial commit"', { cwd: testDir });

    const firstCommit = execSync('git rev-parse HEAD', { cwd: testDir })
      .toString()
      .trim();

    // Store snapshot with commit SHA
    const snapshotId = db
      .prepare(
        `
      INSERT INTO chapter_versions (
        content_id, book_path, chapter_path, chapter_name, version,
        content, file_hash, source, commit_sha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        'chapter-test1',
        testDir,
        testFile,
        'test.md',
        'v1',
        '# Initial Content\n',
        'hash123',
        'git',
        firstCommit
      ).lastInsertRowid;

    expect(snapshotId).toBeGreaterThan(0);

    // Modify and commit again
    writeFileSync(testFile, '# Updated Content\n');
    execSync('git add .', { cwd: testDir });
    execSync('git commit -m "Update content"', { cwd: testDir });

    const secondCommit = execSync('git rev-parse HEAD', { cwd: testDir })
      .toString()
      .trim();

    expect(secondCommit).not.toBe(firstCommit);

    // Verify we can retrieve snapshots by commit SHA
    const snapshot = db
      .prepare('SELECT * FROM chapter_versions WHERE commit_sha = ?')
      .get(firstCommit) as {
      content_id: string;
      content: string;
    };

    expect(snapshot).toBeDefined();
    expect(snapshot.content).toBe('# Initial Content\n');
  });

  it('should handle state transitions during git operations', () => {
    // Set initial state
    stateClient.set('workflow', 'editing');

    writeFileSync(testFile, 'Content\n');
    execSync('git add .', { cwd: testDir });

    // Transition state before commit
    stateClient.set('workflow', 'committing');

    execSync('git commit -m "Test commit"', { cwd: testDir });

    // Update state after commit
    const commitSha = execSync('git rev-parse HEAD', { cwd: testDir })
      .toString()
      .trim();

    stateClient.set('last_commit', commitSha);
    stateClient.set('workflow', 'idle');

    // Verify states
    expect(stateClient.get('workflow')).toBe('idle');
    expect(stateClient.get('last_commit')).toBe(commitSha);
  });
});
