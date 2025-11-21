import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildPrintHtml, type BuildResult } from './build.js';

describe('print build', () => {
  const testDir = 'data/test-print-build';
  const chaptersDir = join(testDir, 'chapters');
  const sheetsDir = join(testDir, 'sheets');
  const outputDir = join(testDir, 'output');

  beforeEach(() => {
    mkdirSync(chaptersDir, { recursive: true });
    mkdirSync(sheetsDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    // Create minimal test chapters
    writeFileSync(join(chaptersDir, '01-welcome.md'), '## 1. Welcome\n\nWelcome content.');
    writeFileSync(join(chaptersDir, '28-glossary.md'), '## 28. Glossary\n\nTerms here.');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('buildPrintHtml', () => {
    it('produces HTML output file', async () => {
      const result = await buildPrintHtml({
        bookPath: testDir,
        chaptersDir,
        sheetsDir,
        outputPath: join(outputDir, 'test.html'),
        skipDatabase: true,
      });

      expect(result.success).toBe(true);
      expect(existsSync(join(outputDir, 'test.html'))).toBe(true);
    });

    it('returns build metadata', async () => {
      const result = await buildPrintHtml({
        bookPath: testDir,
        chaptersDir,
        sheetsDir,
        outputPath: join(outputDir, 'test.html'),
        skipDatabase: true,
      });

      expect(result.buildId).toMatch(/^build-/);
      expect(result.outputPath).toContain('test.html');
      expect(result.sourceHash).toHaveLength(64);
    });

    it('includes TOC in output', async () => {
      const result = await buildPrintHtml({
        bookPath: testDir,
        chaptersDir,
        sheetsDir,
        outputPath: join(outputDir, 'test.html'),
        skipDatabase: true,
      });

      const html = readFileSync(result.outputPath, 'utf-8');

      expect(html).toContain('toc-root');
      expect(html).toContain('ch-01-welcome');
    });
  });
});
