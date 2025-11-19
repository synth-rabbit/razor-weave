import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import Database from 'better-sqlite3';
import { snapshotBook, getBookSnapshot } from './content-snapshot.js';
import { createTables } from '../database/schema.js';

describe('Content Snapshot', () => {
  let db: Database.Database;
  const testBookPath = 'data/test/test-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(
      testBookPath,
      '<html><body><h1>Test Book</h1></body></html>'
    );
    db = new Database(':memory:');
    createTables(db);
  });

  afterEach(() => {
    db.close();
    rmSync('data/test', { recursive: true, force: true });
  });

  describe('snapshotBook', () => {
    it('creates book snapshot with file hash', () => {
      const id = snapshotBook(db, {
        bookPath: testBookPath,
        version: 'v1.2',
        source: 'git',
        commitSha: 'abc123',
      });

      expect(id).toBeGreaterThan(0);

      const snapshot = getBookSnapshot(db, id);
      expect(snapshot).toBeDefined();
      expect(snapshot?.book_path).toBe(testBookPath);
      expect(snapshot?.version).toBe('v1.2');
      expect(snapshot?.file_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(snapshot?.content).toContain('Test Book');
    });

    it('throws if file does not exist', () => {
      expect(() =>
        snapshotBook(db, {
          bookPath: 'nonexistent.html',
          version: 'v1.0',
          source: 'git',
        })
      ).toThrow('File not found');
    });
  });
});
