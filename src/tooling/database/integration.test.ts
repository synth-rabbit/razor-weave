// src/tooling/database/integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDatabase } from './client.js';
import { unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

describe('Database Integration', () => {
  let db: ProjectDatabase;
  const testDbPath = 'data/test-integration.db';
  const testChapterPath = 'books/test/v1/manuscript/chapters/01.md';

  beforeEach(() => {
    mkdirSync('data', { recursive: true });
    db = new ProjectDatabase(testDbPath);

    mkdirSync(dirname(testChapterPath), { recursive: true });
    writeFileSync(testChapterPath, '# Chapter 1\n\nFirst version.');
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
    } catch {
      // Ignore
    }
  });

  it('should track full workflow: Claude edit -> commit -> state update', async () => {
    // Simulate Claude edit
    const snapshot1 = await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    expect(snapshot1).toBeTruthy(); // Returns string ID

    // Simulate git commit
    db.snapshots.markAsCommitted('abc123');
    db.state.set('last_commit', 'abc123');

    // Verify history
    const history = db.snapshots.getChapterHistory(testChapterPath);
    expect(history).toHaveLength(1);
    expect(history[0].commit_sha).toBe('abc123');

    // Verify state
    const lastCommit = db.state.get('last_commit');
    expect(lastCommit).toBe('abc123');
  });

  it('should handle multiple edits between commits', async () => {
    // Multiple Claude edits
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');

    writeFileSync(testChapterPath, '# Chapter 1\n\nSecond version.');
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');

    writeFileSync(testChapterPath, '# Chapter 1\n\nThird version.');
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');

    // Commit
    db.snapshots.markAsCommitted('xyz789');

    // All should be marked
    const history = db.snapshots.getChapterHistory(testChapterPath);
    expect(history).toHaveLength(3);
    expect(history.every(h => h.commit_sha === 'xyz789')).toBe(true);
  });
});
