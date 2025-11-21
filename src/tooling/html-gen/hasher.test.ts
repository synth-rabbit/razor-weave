import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { hashFile, hashFiles, hashString } from './hasher.js';

describe('hasher', () => {
  const testDir = 'data/test-hasher';

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('hashString', () => {
    it('returns consistent SHA-256 hash for same input', () => {
      const hash1 = hashString('hello world');
      const hash2 = hashString('hello world');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('returns different hash for different input', () => {
      const hash1 = hashString('hello');
      const hash2 = hashString('world');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hashFile', () => {
    it('hashes file content', async () => {
      const filePath = join(testDir, 'test.txt');
      writeFileSync(filePath, 'test content');

      const hash = await hashFile(filePath);
      expect(hash).toHaveLength(64);
    });

    it('returns same hash for same content', async () => {
      const file1 = join(testDir, 'file1.txt');
      const file2 = join(testDir, 'file2.txt');
      writeFileSync(file1, 'same content');
      writeFileSync(file2, 'same content');

      const hash1 = await hashFile(file1);
      const hash2 = await hashFile(file2);
      expect(hash1).toBe(hash2);
    });

    it('throws for non-existent file', async () => {
      await expect(hashFile('nonexistent.txt')).rejects.toThrow();
    });
  });

  describe('hashFiles', () => {
    it('combines multiple file hashes into single hash', async () => {
      const file1 = join(testDir, 'a.txt');
      const file2 = join(testDir, 'b.txt');
      writeFileSync(file1, 'content a');
      writeFileSync(file2, 'content b');

      const combined = await hashFiles([file1, file2]);
      expect(combined).toHaveLength(64);
    });

    it('returns consistent hash for same files in same order', async () => {
      const file1 = join(testDir, 'a.txt');
      const file2 = join(testDir, 'b.txt');
      writeFileSync(file1, 'content a');
      writeFileSync(file2, 'content b');

      const hash1 = await hashFiles([file1, file2]);
      const hash2 = await hashFiles([file1, file2]);
      expect(hash1).toBe(hash2);
    });

    it('returns different hash for different order', async () => {
      const file1 = join(testDir, 'a.txt');
      const file2 = join(testDir, 'b.txt');
      writeFileSync(file1, 'content a');
      writeFileSync(file2, 'content b');

      const hash1 = await hashFiles([file1, file2]);
      const hash2 = await hashFiles([file2, file1]);
      expect(hash1).not.toBe(hash2);
    });

    it('returns empty string for empty array', async () => {
      const hash = await hashFiles([]);
      expect(hash).toBe('');
    });
  });
});
