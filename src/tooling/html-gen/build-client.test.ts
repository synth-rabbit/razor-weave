import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { rmSync } from 'fs';
import {
  HtmlBuildClient,
  type HtmlBuild,
  type HtmlBuildSource,
  type CreateBuildParams,
} from './build-client.js';

describe('HtmlBuildClient', () => {
  const testDbPath = 'data/test-html-builds.db';
  let db: Database.Database;
  let client: HtmlBuildClient;

  beforeEach(() => {
    db = new Database(testDbPath);

    // Create tables for testing
    db.exec(`
      CREATE TABLE IF NOT EXISTS html_builds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        build_id TEXT UNIQUE NOT NULL,
        output_type TEXT NOT NULL,
        book_path TEXT NOT NULL,
        output_path TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed'))
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS html_build_sources (
        build_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        file_type TEXT NOT NULL CHECK (file_type IN ('chapter', 'sheet')),
        PRIMARY KEY (build_id, file_path),
        FOREIGN KEY (build_id) REFERENCES html_builds(build_id)
      )
    `);

    client = new HtmlBuildClient(db);
  });

  afterEach(() => {
    db.close();
    rmSync(testDbPath, { force: true });
  });

  describe('createBuild', () => {
    it('creates a build record and returns build_id', () => {
      const params: CreateBuildParams = {
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'data/html/print-design/core-rulebook.html',
        sourceHash: 'abc123',
        sources: [
          { filePath: 'books/core/v1/chapters/01-welcome.md', contentHash: 'hash1', fileType: 'chapter' },
          { filePath: 'books/core/v1/sheets/character.md', contentHash: 'hash2', fileType: 'sheet' },
        ],
      };

      const buildId = client.createBuild(params);

      expect(buildId).toMatch(/^build-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-/);
    });

    it('stores sources with the build', () => {
      const params: CreateBuildParams = {
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'data/html/print-design/core-rulebook.html',
        sourceHash: 'abc123',
        sources: [
          { filePath: 'chapter1.md', contentHash: 'hash1', fileType: 'chapter' },
          { filePath: 'sheet1.md', contentHash: 'hash2', fileType: 'sheet' },
        ],
      };

      const buildId = client.createBuild(params);
      const sources = client.getBuildSources(buildId);

      expect(sources).toHaveLength(2);
      expect(sources[0].filePath).toBe('chapter1.md');
      expect(sources[1].filePath).toBe('sheet1.md');
    });
  });

  describe('getBuild', () => {
    it('returns build by id', () => {
      const params: CreateBuildParams = {
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'data/html/print-design/core-rulebook.html',
        sourceHash: 'abc123',
        sources: [],
      };

      const buildId = client.createBuild(params);
      const build = client.getBuild(buildId);

      expect(build).not.toBeNull();
      expect(build!.buildId).toBe(buildId);
      expect(build!.outputType).toBe('print-design');
      expect(build!.status).toBe('success');
    });

    it('returns null for non-existent build', () => {
      const build = client.getBuild('non-existent');
      expect(build).toBeNull();
    });
  });

  describe('listBuilds', () => {
    it('returns builds filtered by output type', () => {
      client.createBuild({
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'path1',
        sourceHash: 'hash1',
        sources: [],
      });
      client.createBuild({
        outputType: 'web-reader',
        bookPath: 'books/core/v1',
        outputPath: 'path2',
        sourceHash: 'hash2',
        sources: [],
      });

      const printBuilds = client.listBuilds('print-design');
      const webBuilds = client.listBuilds('web-reader');

      expect(printBuilds).toHaveLength(1);
      expect(webBuilds).toHaveLength(1);
      expect(printBuilds[0].outputType).toBe('print-design');
    });

    it('returns builds in descending order by created_at', () => {
      client.createBuild({
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'path1',
        sourceHash: 'hash1',
        sources: [],
      });
      // Small delay to ensure different timestamps
      client.createBuild({
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'path2',
        sourceHash: 'hash2',
        sources: [],
      });

      const builds = client.listBuilds('print-design');

      expect(builds).toHaveLength(2);
      // Most recent first
      expect(builds[0].sourceHash).toBe('hash2');
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        client.createBuild({
          outputType: 'print-design',
          bookPath: 'books/core/v1',
          outputPath: `path${i}`,
          sourceHash: `hash${i}`,
          sources: [],
        });
      }

      const builds = client.listBuilds('print-design', 3);
      expect(builds).toHaveLength(3);
    });
  });

  describe('getLatestBuild', () => {
    it('returns most recent successful build', () => {
      client.createBuild({
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'path1',
        sourceHash: 'hash1',
        sources: [],
      });
      const latestId = client.createBuild({
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'path2',
        sourceHash: 'hash2',
        sources: [],
      });

      const latest = client.getLatestBuild('print-design');
      expect(latest).not.toBeNull();
      expect(latest!.buildId).toBe(latestId);
    });

    it('returns null if no builds exist', () => {
      const latest = client.getLatestBuild('print-design');
      expect(latest).toBeNull();
    });
  });

  describe('markBuildFailed', () => {
    it('updates build status to failed', () => {
      const buildId = client.createBuild({
        outputType: 'print-design',
        bookPath: 'books/core/v1',
        outputPath: 'path1',
        sourceHash: 'hash1',
        sources: [],
      });

      client.markBuildFailed(buildId);
      const build = client.getBuild(buildId);

      expect(build!.status).toBe('failed');
    });
  });
});
