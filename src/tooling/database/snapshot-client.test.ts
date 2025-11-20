import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from './schema.js';
import { SnapshotClient } from './snapshot-client.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';

describe('SnapshotClient', () => {
  let db: Database.Database;
  let client: SnapshotClient;
  const testDir = 'data/test-snapshots';
  const testBookPath = `${testDir}/test-book.html`;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
    client = new SnapshotClient(db);

    mkdirSync(testDir, { recursive: true });
    writeFileSync(testBookPath, '<html><body>Test</body></html>');
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('createBookSnapshot', () => {
    it('should return content ID string matching pattern book-*', () => {
      const contentId = client.createBookSnapshot({
        bookPath: testBookPath,
        version: '1.0.0',
        chapterCount: 1,
      });

      expect(typeof contentId).toBe('string');
      expect(contentId).toMatch(/^book-[a-f0-9]+$/);
    });

    it('should store content ID in database', () => {
      const contentId = client.createBookSnapshot({
        bookPath: testBookPath,
        version: '1.0.0',
        chapterCount: 1,
      });

      const row = db.prepare('SELECT * FROM book_versions WHERE content_id = ?').get(contentId);
      expect(row).toBeDefined();
      expect(row).toHaveProperty('content_id', contentId);
    });
  });

  describe('createChapterSnapshot', () => {
    it('should return content ID string matching pattern chapter-*', () => {
      const chapterPath = `${testDir}/chapter-01.md`;
      writeFileSync(chapterPath, '# Chapter 1\n\nContent here');

      const contentId = client.createChapterSnapshot(
        chapterPath,
        'claude'
      );

      expect(typeof contentId).toBe('string');
      expect(contentId).toMatch(/^chapter-[a-f0-9]+$/);
    });
  });
});
