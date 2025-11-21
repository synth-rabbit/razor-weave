import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import {
  readChapters,
  readSheets,
  type ChapterFile,
} from './chapter-reader.js';

describe('chapter-reader', () => {
  const testDir = 'data/test-chapters';
  const chaptersDir = join(testDir, 'chapters');
  const sheetsDir = join(testDir, 'sheets');

  beforeEach(() => {
    mkdirSync(chaptersDir, { recursive: true });
    mkdirSync(sheetsDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('readChapters', () => {
    it('reads and orders chapters by number', async () => {
      writeFileSync(join(chaptersDir, '02-second.md'), '## 2. Second');
      writeFileSync(join(chaptersDir, '01-first.md'), '## 1. First');
      writeFileSync(join(chaptersDir, '10-tenth.md'), '## 10. Tenth');

      const chapters = await readChapters(chaptersDir);

      expect(chapters).toHaveLength(3);
      expect(chapters[0].number).toBe(1);
      expect(chapters[1].number).toBe(2);
      expect(chapters[2].number).toBe(10);
    });

    it('extracts chapter metadata from filename', async () => {
      writeFileSync(join(chaptersDir, '08-actions-checks-outcomes.md'), '## 8. Actions');

      const chapters = await readChapters(chaptersDir);

      expect(chapters[0].number).toBe(8);
      expect(chapters[0].slug).toBe('actions-checks-outcomes');
      expect(chapters[0].filePath).toContain('08-actions-checks-outcomes.md');
    });

    it('includes file content', async () => {
      writeFileSync(join(chaptersDir, '01-welcome.md'), '## 1. Welcome\n\nContent here.');

      const chapters = await readChapters(chaptersDir);

      expect(chapters[0].content).toBe('## 1. Welcome\n\nContent here.');
    });

    it('skips README.md', async () => {
      writeFileSync(join(chaptersDir, 'README.md'), '# Readme');
      writeFileSync(join(chaptersDir, '01-welcome.md'), '## 1. Welcome');

      const chapters = await readChapters(chaptersDir);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].slug).toBe('welcome');
    });
  });

  describe('readSheets', () => {
    it('reads sheets in defined order', async () => {
      writeFileSync(join(sheetsDir, 'core_rulebook_character_sheet.md'), '# Character Sheet');
      writeFileSync(join(sheetsDir, 'core_rulebook_session_log.md'), '# Session Log');
      writeFileSync(join(sheetsDir, 'core_rulebook_advancement_tracker.md'), '# Advancement');

      const sheets = await readSheets(sheetsDir);

      // Order should be: character_sheet, advancement_tracker, session_log
      expect(sheets[0].slug).toContain('character');
      expect(sheets[1].slug).toContain('advancement');
      expect(sheets[2].slug).toContain('session');
    });

    it('assigns sheet numbers (27.1, 27.2, etc)', async () => {
      writeFileSync(join(sheetsDir, 'core_rulebook_character_sheet.md'), '# Sheet');
      writeFileSync(join(sheetsDir, 'core_rulebook_advancement_tracker.md'), '# Sheet');

      const sheets = await readSheets(sheetsDir);

      expect(sheets[0].number).toBe(27.1);
      expect(sheets[1].number).toBe(27.2);
    });
  });
});
