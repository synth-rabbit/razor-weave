import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { createTables } from '../../database/schema.js';
import { buildWebReader } from './build.js';

describe('buildWebReader', () => {
  let testDir: string;
  let chaptersDir: string;
  let sheetsDir: string;
  let outputDir: string;
  let db: Database.Database;

  beforeEach(() => {
    // Create unique test directory
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    testDir = join(process.cwd(), 'data', `test-web-build-${uniqueId}`);
    chaptersDir = join(testDir, 'chapters');
    sheetsDir = join(testDir, 'sheets');
    outputDir = join(testDir, 'output');

    mkdirSync(chaptersDir, { recursive: true });
    mkdirSync(sheetsDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    // Create test chapters
    writeFileSync(join(chaptersDir, '01-welcome.md'), '## 1. Welcome\n\nWelcome content.');
    writeFileSync(join(chaptersDir, '02-concepts.md'), '## 2. Core Concepts\n\nConcepts here.');

    // Create database
    db = new Database(':memory:');
    createTables(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('generates HTML output file', async () => {
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    expect(result.status).toBe('success');
    expect(existsSync(result.outputPath)).toBe(true);
  });

  it('includes processed chapters in output', async () => {
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    const html = readFileSync(result.outputPath, 'utf-8');
    expect(html).toContain('id="ch-01-welcome"');
    expect(html).toContain('id="ch-02-concepts"');
  });

  it('records build in database', async () => {
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    expect(result.buildId).toMatch(/^build-/);

    const build = db.prepare('SELECT * FROM html_builds WHERE build_id = ?').get(result.buildId);
    expect(build).toBeDefined();
    expect((build as { output_type: string }).output_type).toBe('web-reader');
  });

  it('skips build when sources unchanged', async () => {
    // First build
    await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    // Second build - should skip
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    expect(result.status).toBe('skipped');
    expect(result.reason).toContain('unchanged');
  });

  it('rebuilds when forced', async () => {
    // First build
    await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    // Second build with force
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
      force: true,
    });

    expect(result.status).toBe('success');
  });
});
