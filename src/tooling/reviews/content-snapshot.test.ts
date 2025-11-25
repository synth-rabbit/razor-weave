import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import Database from 'better-sqlite3';
import {
  snapshotBook,
  getBookSnapshot,
  snapshotChapter,
  getChapterSnapshot,
} from './content-snapshot.js';
import { createTables } from '@razorweave/database';

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
      const contentId = snapshotBook(db, {
        bookPath: testBookPath,
        version: 'v1.2',
        source: 'git',
        commitSha: 'abc123',
      });

      expect(typeof contentId).toBe('string');
      expect(contentId).toMatch(/^book-[a-f0-9]+$/);

      const snapshot = getBookSnapshot(db, contentId);
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

  describe('snapshotChapter', () => {
    const testChapterPath = 'data/test/chapter-01.md';

    beforeEach(() => {
      writeFileSync(testChapterPath, '# Chapter 1\n\nTest content');
    });

    it('creates chapter snapshot with file hash', () => {
      const contentId = snapshotChapter(db, {
        bookPath: 'core/v1',
        chapterPath: testChapterPath,
        chapterName: 'Chapter 1',
        version: 'v1.2',
        source: 'git',
        commitSha: 'abc123',
      });

      expect(typeof contentId).toBe('string');
      expect(contentId).toMatch(/^chapter-[a-f0-9]+$/);

      const snapshot = getChapterSnapshot(db, contentId);
      expect(snapshot).toBeDefined();
      expect(snapshot?.chapter_path).toBe(testChapterPath);
      expect(snapshot?.chapter_name).toBe('Chapter 1');
      expect(snapshot?.file_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(snapshot?.content).toContain('Chapter 1');
    });

    it('throws if file does not exist', () => {
      expect(() =>
        snapshotChapter(db, {
          bookPath: 'core/v1',
          chapterPath: 'nonexistent.md',
          chapterName: 'Nonexistent',
          version: 'v1.0',
          source: 'git',
        })
      ).toThrow('File not found');
    });
  });

  describe('hash consistency', () => {
    it('generates same hash for identical content', () => {
      const id1 = snapshotBook(db, {
        bookPath: testBookPath,
        version: 'v1.0',
        source: 'git',
      });

      const id2 = snapshotBook(db, {
        bookPath: testBookPath,
        version: 'v1.1',
        source: 'git',
      });

      const snapshot1 = getBookSnapshot(db, id1);
      const snapshot2 = getBookSnapshot(db, id2);

      expect(snapshot1?.file_hash).toBe(snapshot2?.file_hash);
    });

    it('generates different hash for different content', () => {
      const id1 = snapshotBook(db, {
        bookPath: testBookPath,
        version: 'v1.0',
        source: 'git',
      });

      writeFileSync(testBookPath, '<html><body><h1>Modified</h1></body></html>');

      const id2 = snapshotBook(db, {
        bookPath: testBookPath,
        version: 'v1.1',
        source: 'git',
      });

      const snapshot1 = getBookSnapshot(db, id1);
      const snapshot2 = getBookSnapshot(db, id2);

      expect(snapshot1?.file_hash).not.toBe(snapshot2?.file_hash);
    });
  });
});
