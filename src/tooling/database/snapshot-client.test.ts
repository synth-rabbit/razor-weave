// src/tooling/database/snapshot-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDatabase } from './client.js';
import { unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

describe('SnapshotClient', () => {
  let db: ProjectDatabase;
  const testDbPath = 'data/test-snapshots.db';
  const testChapterPath = 'data/test-chapter.md';

  beforeEach(() => {
    // Ensure directories exist
    mkdirSync('data', { recursive: true });
    db = new ProjectDatabase(testDbPath);

    // Create test chapter file
    mkdirSync(dirname(testChapterPath), { recursive: true });
    writeFileSync(testChapterPath, '# Test Chapter\n\nThis is test content.');
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
      unlinkSync(testChapterPath);
    } catch {
      // Ignore
    }
  });

  it('should create chapter snapshot', async () => {
    const id = await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');

    expect(id).toBeGreaterThan(0);
  });

  it('should get chapter history', async () => {
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.snapshots.createChapterSnapshot(testChapterPath, 'git', { commitSha: 'abc123' });

    const history = db.snapshots.getChapterHistory(testChapterPath);

    expect(history).toHaveLength(2);
    expect(history[0].source).toBe('git');
    expect(history[1].source).toBe('claude');
  });

  it('should mark snapshots as committed', async () => {
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');

    db.snapshots.markAsCommitted('abc123');

    const history = db.snapshots.getChapterHistory(testChapterPath);
    expect(history[0].commit_sha).toBe('abc123');
  });

  it('should archive snapshots', async () => {
    const id = await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');

    db.snapshots.archive(id);

    const history = db.snapshots.getChapterHistory(testChapterPath);
    expect(history).toHaveLength(0); // Archived snapshots excluded
  });
});
