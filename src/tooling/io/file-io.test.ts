// src/tooling/io/file-io.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import {
  readTextFile,
  readTextFileOrThrow,
  readJsonFile,
  readJsonFileOrThrow,
  writeTextFile,
  writeJsonFile,
  ensureDir,
  pathExists,
  isDirectory,
  isFile,
  listFiles,
  copyFile,
  remove,
  hashString,
  hashFile,
  getModTime,
} from './file-io.js';

const testDir = '/tmp/file-io-test';

describe('FileIO', () => {
  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('readTextFile', () => {
    it('should read existing file', () => {
      writeFileSync(join(testDir, 'test.txt'), 'hello world');
      const content = readTextFile(join(testDir, 'test.txt'));
      expect(content).toBe('hello world');
    });

    it('should return null for non-existent file', () => {
      const content = readTextFile(join(testDir, 'nonexistent.txt'));
      expect(content).toBeNull();
    });
  });

  describe('readTextFileOrThrow', () => {
    it('should read existing file', () => {
      writeFileSync(join(testDir, 'test.txt'), 'hello');
      const content = readTextFileOrThrow(join(testDir, 'test.txt'));
      expect(content).toBe('hello');
    });

    it('should throw for non-existent file', () => {
      expect(() => readTextFileOrThrow(join(testDir, 'missing.txt'))).toThrow(
        'File not found'
      );
    });
  });

  describe('readJsonFile', () => {
    it('should parse JSON file', () => {
      writeFileSync(join(testDir, 'data.json'), '{"key": "value"}');
      const data = readJsonFile<{ key: string }>(join(testDir, 'data.json'));
      expect(data).toEqual({ key: 'value' });
    });

    it('should return null for non-existent file', () => {
      const data = readJsonFile(join(testDir, 'missing.json'));
      expect(data).toBeNull();
    });
  });

  describe('readJsonFileOrThrow', () => {
    it('should parse JSON file', () => {
      writeFileSync(join(testDir, 'data.json'), '{"num": 42}');
      const data = readJsonFileOrThrow<{ num: number }>(join(testDir, 'data.json'));
      expect(data).toEqual({ num: 42 });
    });

    it('should throw for non-existent file', () => {
      expect(() => readJsonFileOrThrow(join(testDir, 'missing.json'))).toThrow();
    });
  });

  describe('writeTextFile', () => {
    it('should write file and create parent dirs', () => {
      const filePath = join(testDir, 'nested', 'dir', 'file.txt');
      writeTextFile(filePath, 'content');

      expect(readTextFile(filePath)).toBe('content');
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON with formatting', () => {
      const filePath = join(testDir, 'out.json');
      writeJsonFile(filePath, { a: 1, b: 2 });

      const content = readTextFile(filePath);
      expect(content).toBe('{\n  "a": 1,\n  "b": 2\n}\n');
    });
  });

  describe('ensureDir', () => {
    it('should create nested directories', () => {
      const dirPath = join(testDir, 'a', 'b', 'c');
      ensureDir(dirPath);
      expect(isDirectory(dirPath)).toBe(true);
    });

    it('should not fail if directory exists', () => {
      ensureDir(testDir);
      expect(isDirectory(testDir)).toBe(true);
    });
  });

  describe('pathExists/isDirectory/isFile', () => {
    it('should detect existing file', () => {
      const filePath = join(testDir, 'file.txt');
      writeFileSync(filePath, 'x');

      expect(pathExists(filePath)).toBe(true);
      expect(isFile(filePath)).toBe(true);
      expect(isDirectory(filePath)).toBe(false);
    });

    it('should detect existing directory', () => {
      expect(pathExists(testDir)).toBe(true);
      expect(isDirectory(testDir)).toBe(true);
      expect(isFile(testDir)).toBe(false);
    });

    it('should return false for non-existent path', () => {
      expect(pathExists(join(testDir, 'nope'))).toBe(false);
    });
  });

  describe('listFiles', () => {
    beforeEach(() => {
      writeFileSync(join(testDir, 'a.txt'), '');
      writeFileSync(join(testDir, 'b.md'), '');
      mkdirSync(join(testDir, 'sub'));
      writeFileSync(join(testDir, 'sub', 'c.txt'), '');
    });

    it('should list all files', () => {
      const files = listFiles(testDir);
      expect(files).toHaveLength(2);
      expect(files).toContain(join(testDir, 'a.txt'));
      expect(files).toContain(join(testDir, 'b.md'));
    });

    it('should filter by extension', () => {
      const files = listFiles(testDir, { extension: '.txt' });
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('a.txt');
    });

    it('should list recursively', () => {
      const files = listFiles(testDir, { recursive: true });
      expect(files).toHaveLength(3);
    });

    it('should return empty array for non-existent dir', () => {
      const files = listFiles(join(testDir, 'missing'));
      expect(files).toEqual([]);
    });
  });

  describe('copyFile', () => {
    it('should copy file and create parent dirs', () => {
      const src = join(testDir, 'src.txt');
      const dest = join(testDir, 'nested', 'dest.txt');
      writeFileSync(src, 'copy me');

      copyFile(src, dest);

      expect(readTextFile(dest)).toBe('copy me');
    });
  });

  describe('remove', () => {
    it('should remove file', () => {
      const filePath = join(testDir, 'todelete.txt');
      writeFileSync(filePath, '');
      remove(filePath);
      expect(pathExists(filePath)).toBe(false);
    });

    it('should remove directory recursively', () => {
      const dirPath = join(testDir, 'toremove');
      mkdirSync(dirPath);
      writeFileSync(join(dirPath, 'file.txt'), '');

      remove(dirPath, { recursive: true });
      expect(pathExists(dirPath)).toBe(false);
    });

    it('should not fail for non-existent path', () => {
      expect(() => remove(join(testDir, 'nope'))).not.toThrow();
    });
  });

  describe('hashString/hashFile', () => {
    it('should hash string consistently', () => {
      const hash1 = hashString('hello');
      const hash2 = hashString('hello');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex
    });

    it('should hash file', () => {
      const filePath = join(testDir, 'tohash.txt');
      writeFileSync(filePath, 'hello');

      const fileHash = hashFile(filePath);
      const stringHash = hashString('hello');

      expect(fileHash).toBe(stringHash);
    });
  });

  describe('getModTime', () => {
    it('should return modification time', () => {
      const filePath = join(testDir, 'dated.txt');
      writeFileSync(filePath, '');

      const modTime = getModTime(filePath);
      expect(modTime).toBeInstanceOf(Date);
      expect(modTime!.getTime()).toBeGreaterThan(0);
    });

    it('should return null for non-existent file', () => {
      expect(getModTime(join(testDir, 'missing'))).toBeNull();
    });
  });
});
