# HTML Generation Phase 1: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up shared infrastructure for HTML generation workflows (database schema, file hashing, build client).

**Architecture:** Both `print-design` and `web-reader` workflows share database tables and utility functions. This phase builds the foundation before any markdown parsing.

**Tech Stack:** TypeScript, better-sqlite3, Node.js crypto

**Prerequisites:**
- Working in the razorweave repository
- `pnpm install` completed
- Familiarity with `src/tooling/database/` structure

**Reference Design:** `docs/plans/2025-11-21-html-print-design-pipeline-design.md`

---

## Task 1: Create html-gen Directory Structure

**Files:**
- Create: `src/tooling/html-gen/index.ts`
- Create: `src/tooling/html-gen/hasher.ts`
- Create: `src/tooling/html-gen/build-client.ts`

**Step 1: Create directory and index file**

```bash
mkdir -p src/tooling/html-gen
```

Create `src/tooling/html-gen/index.ts`:

```typescript
/**
 * HTML Generation Module
 *
 * Shared infrastructure for generating HTML from markdown.
 * Used by both print-design and web-reader workflows.
 */

// Utilities
export * from './hasher.js';
export * from './build-client.js';
```

**Step 2: Verify directory created**

```bash
ls src/tooling/html-gen/
```

Expected: `index.ts`

**Step 3: Commit**

```bash
git add src/tooling/html-gen/
git commit -m "feat(html-gen): create module structure"
```

---

## Task 2: Implement File Hashing Utility

**Files:**
- Create: `src/tooling/html-gen/hasher.ts`
- Create: `src/tooling/html-gen/hasher.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/hasher.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/hasher.test.ts
```

Expected: FAIL with "Cannot find module './hasher.js'"

**Step 3: Write the implementation**

Create `src/tooling/html-gen/hasher.ts`:

```typescript
/**
 * File Hashing Utilities
 *
 * Provides SHA-256 hashing for files and strings.
 * Used for detecting changes in source files.
 */

import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

/**
 * Hash a string using SHA-256
 * @param content - String to hash
 * @returns Hex-encoded SHA-256 hash (64 characters)
 */
export function hashString(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Hash a file's contents using SHA-256
 * @param filePath - Path to file
 * @returns Hex-encoded SHA-256 hash (64 characters)
 * @throws If file does not exist or cannot be read
 */
export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf8');
  return hashString(content);
}

/**
 * Hash multiple files and combine into single hash
 * @param filePaths - Array of file paths (order matters)
 * @returns Combined hex-encoded SHA-256 hash, or empty string if no files
 */
export async function hashFiles(filePaths: string[]): Promise<string> {
  if (filePaths.length === 0) {
    return '';
  }

  const hashes = await Promise.all(filePaths.map(hashFile));
  return hashString(hashes.join(':'));
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/hasher.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/tooling/html-gen/hasher.ts src/tooling/html-gen/hasher.test.ts
git commit -m "feat(html-gen): add file hashing utilities"
```

---

## Task 3: Add Database Schema for HTML Builds

**Files:**
- Modify: `src/tooling/database/schema.ts`

**Step 1: Read existing schema**

```bash
# Review the existing schema structure
head -100 src/tooling/database/schema.ts
```

**Step 2: Add html_builds and html_build_sources tables**

Add to `src/tooling/database/schema.ts` (find the section with other CREATE TABLE statements):

```typescript
// Add these table creation statements to the initializeSchema function

// HTML build tracking
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

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_html_builds_output_type
  ON html_builds(output_type)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_html_build_sources_build_id
  ON html_build_sources(build_id)
`);
```

**Step 3: Verify schema applies without error**

```bash
# Run any existing database tests to ensure schema is valid
pnpm vitest run src/tooling/database/ --reporter=verbose
```

Expected: Existing tests still pass (schema addition is additive)

**Step 4: Commit**

```bash
git add src/tooling/database/schema.ts
git commit -m "feat(database): add html_builds and html_build_sources tables"
```

---

## Task 4: Implement Build Client - Types and Interfaces

**Files:**
- Create: `src/tooling/html-gen/build-client.ts`
- Create: `src/tooling/html-gen/build-client.test.ts`

**Step 1: Write the types and interface tests**

Create `src/tooling/html-gen/build-client.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/build-client.test.ts
```

Expected: FAIL with "Cannot find module './build-client.js'"

**Step 3: Write the implementation**

Create `src/tooling/html-gen/build-client.ts`:

```typescript
/**
 * HTML Build Client
 *
 * Database operations for tracking HTML builds.
 * Shared between print-design and web-reader workflows.
 */

import type Database from 'better-sqlite3';

export interface HtmlBuild {
  id: number;
  buildId: string;
  outputType: string;
  bookPath: string;
  outputPath: string;
  sourceHash: string;
  createdAt: string;
  status: 'success' | 'failed';
}

export interface HtmlBuildSource {
  buildId: string;
  filePath: string;
  contentHash: string;
  fileType: 'chapter' | 'sheet';
}

export interface CreateBuildParams {
  outputType: string;
  bookPath: string;
  outputPath: string;
  sourceHash: string;
  sources: Array<{
    filePath: string;
    contentHash: string;
    fileType: 'chapter' | 'sheet';
  }>;
}

/**
 * Generate a unique build ID with timestamp and random suffix
 */
function generateBuildId(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\.\d{3}Z$/, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `build-${timestamp}-${random}`;
}

export class HtmlBuildClient {
  constructor(private db: Database.Database) {}

  /**
   * Create a new build record with its sources
   * @returns The generated build_id
   */
  createBuild(params: CreateBuildParams): string {
    const buildId = generateBuildId();
    const createdAt = new Date().toISOString();

    // Insert build record
    this.db.prepare(`
      INSERT INTO html_builds (build_id, output_type, book_path, output_path, source_hash, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'success')
    `).run(buildId, params.outputType, params.bookPath, params.outputPath, params.sourceHash, createdAt);

    // Insert source records
    const insertSource = this.db.prepare(`
      INSERT INTO html_build_sources (build_id, file_path, content_hash, file_type)
      VALUES (?, ?, ?, ?)
    `);

    for (const source of params.sources) {
      insertSource.run(buildId, source.filePath, source.contentHash, source.fileType);
    }

    return buildId;
  }

  /**
   * Get a build by its ID
   */
  getBuild(buildId: string): HtmlBuild | null {
    const row = this.db.prepare(`
      SELECT id, build_id, output_type, book_path, output_path, source_hash, created_at, status
      FROM html_builds
      WHERE build_id = ?
    `).get(buildId) as {
      id: number;
      build_id: string;
      output_type: string;
      book_path: string;
      output_path: string;
      source_hash: string;
      created_at: string;
      status: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      buildId: row.build_id,
      outputType: row.output_type,
      bookPath: row.book_path,
      outputPath: row.output_path,
      sourceHash: row.source_hash,
      createdAt: row.created_at,
      status: row.status as 'success' | 'failed',
    };
  }

  /**
   * Get sources for a build
   */
  getBuildSources(buildId: string): HtmlBuildSource[] {
    const rows = this.db.prepare(`
      SELECT build_id, file_path, content_hash, file_type
      FROM html_build_sources
      WHERE build_id = ?
      ORDER BY file_path
    `).all(buildId) as Array<{
      build_id: string;
      file_path: string;
      content_hash: string;
      file_type: string;
    }>;

    return rows.map(row => ({
      buildId: row.build_id,
      filePath: row.file_path,
      contentHash: row.content_hash,
      fileType: row.file_type as 'chapter' | 'sheet',
    }));
  }

  /**
   * List builds for an output type, most recent first
   */
  listBuilds(outputType: string, limit = 10): HtmlBuild[] {
    const rows = this.db.prepare(`
      SELECT id, build_id, output_type, book_path, output_path, source_hash, created_at, status
      FROM html_builds
      WHERE output_type = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(outputType, limit) as Array<{
      id: number;
      build_id: string;
      output_type: string;
      book_path: string;
      output_path: string;
      source_hash: string;
      created_at: string;
      status: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      buildId: row.build_id,
      outputType: row.output_type,
      bookPath: row.book_path,
      outputPath: row.output_path,
      sourceHash: row.source_hash,
      createdAt: row.created_at,
      status: row.status as 'success' | 'failed',
    }));
  }

  /**
   * Get the most recent successful build for an output type
   */
  getLatestBuild(outputType: string): HtmlBuild | null {
    const row = this.db.prepare(`
      SELECT id, build_id, output_type, book_path, output_path, source_hash, created_at, status
      FROM html_builds
      WHERE output_type = ? AND status = 'success'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(outputType) as {
      id: number;
      build_id: string;
      output_type: string;
      book_path: string;
      output_path: string;
      source_hash: string;
      created_at: string;
      status: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      buildId: row.build_id,
      outputType: row.output_type,
      bookPath: row.book_path,
      outputPath: row.output_path,
      sourceHash: row.source_hash,
      createdAt: row.created_at,
      status: row.status as 'success' | 'failed',
    };
  }

  /**
   * Mark a build as failed
   */
  markBuildFailed(buildId: string): void {
    this.db.prepare(`
      UPDATE html_builds
      SET status = 'failed'
      WHERE build_id = ?
    `).run(buildId);
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/build-client.test.ts
```

Expected: All tests PASS

**Step 5: Update index.ts exports**

Update `src/tooling/html-gen/index.ts`:

```typescript
/**
 * HTML Generation Module
 *
 * Shared infrastructure for generating HTML from markdown.
 * Used by both print-design and web-reader workflows.
 */

// Utilities
export * from './hasher.js';
export * from './build-client.js';
```

**Step 6: Commit**

```bash
git add src/tooling/html-gen/build-client.ts src/tooling/html-gen/build-client.test.ts src/tooling/html-gen/index.ts
git commit -m "feat(html-gen): add build client for database operations"
```

---

## Task 5: Add Build Diff Utility

**Files:**
- Modify: `src/tooling/html-gen/build-client.ts`
- Modify: `src/tooling/html-gen/build-client.test.ts`

**Step 1: Write the failing test**

Add to `src/tooling/html-gen/build-client.test.ts`:

```typescript
describe('diffBuilds', () => {
  it('identifies added files', () => {
    const build1Id = client.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'path1',
      sourceHash: 'hash1',
      sources: [
        { filePath: 'chapter1.md', contentHash: 'h1', fileType: 'chapter' },
      ],
    });

    const build2Id = client.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'path2',
      sourceHash: 'hash2',
      sources: [
        { filePath: 'chapter1.md', contentHash: 'h1', fileType: 'chapter' },
        { filePath: 'chapter2.md', contentHash: 'h2', fileType: 'chapter' },
      ],
    });

    const diff = client.diffBuilds(build1Id, build2Id);

    expect(diff.added).toEqual(['chapter2.md']);
    expect(diff.removed).toEqual([]);
    expect(diff.changed).toEqual([]);
  });

  it('identifies removed files', () => {
    const build1Id = client.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'path1',
      sourceHash: 'hash1',
      sources: [
        { filePath: 'chapter1.md', contentHash: 'h1', fileType: 'chapter' },
        { filePath: 'chapter2.md', contentHash: 'h2', fileType: 'chapter' },
      ],
    });

    const build2Id = client.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'path2',
      sourceHash: 'hash2',
      sources: [
        { filePath: 'chapter1.md', contentHash: 'h1', fileType: 'chapter' },
      ],
    });

    const diff = client.diffBuilds(build1Id, build2Id);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual(['chapter2.md']);
    expect(diff.changed).toEqual([]);
  });

  it('identifies changed files', () => {
    const build1Id = client.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'path1',
      sourceHash: 'hash1',
      sources: [
        { filePath: 'chapter1.md', contentHash: 'old-hash', fileType: 'chapter' },
      ],
    });

    const build2Id = client.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'path2',
      sourceHash: 'hash2',
      sources: [
        { filePath: 'chapter1.md', contentHash: 'new-hash', fileType: 'chapter' },
      ],
    });

    const diff = client.diffBuilds(build1Id, build2Id);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.changed).toEqual(['chapter1.md']);
  });

  it('handles complex diff with all change types', () => {
    const build1Id = client.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'path1',
      sourceHash: 'hash1',
      sources: [
        { filePath: 'kept-same.md', contentHash: 'same', fileType: 'chapter' },
        { filePath: 'will-change.md', contentHash: 'old', fileType: 'chapter' },
        { filePath: 'will-remove.md', contentHash: 'h3', fileType: 'chapter' },
      ],
    });

    const build2Id = client.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'path2',
      sourceHash: 'hash2',
      sources: [
        { filePath: 'kept-same.md', contentHash: 'same', fileType: 'chapter' },
        { filePath: 'will-change.md', contentHash: 'new', fileType: 'chapter' },
        { filePath: 'newly-added.md', contentHash: 'h4', fileType: 'chapter' },
      ],
    });

    const diff = client.diffBuilds(build1Id, build2Id);

    expect(diff.added).toEqual(['newly-added.md']);
    expect(diff.removed).toEqual(['will-remove.md']);
    expect(diff.changed).toEqual(['will-change.md']);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/build-client.test.ts
```

Expected: FAIL with "client.diffBuilds is not a function"

**Step 3: Add the implementation**

Add to `src/tooling/html-gen/build-client.ts`:

```typescript
export interface BuildDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

// Add this method to the HtmlBuildClient class:

  /**
   * Compare two builds and return the differences
   */
  diffBuilds(fromBuildId: string, toBuildId: string): BuildDiff {
    const fromSources = this.getBuildSources(fromBuildId);
    const toSources = this.getBuildSources(toBuildId);

    const fromMap = new Map(fromSources.map(s => [s.filePath, s.contentHash]));
    const toMap = new Map(toSources.map(s => [s.filePath, s.contentHash]));

    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];

    // Find added and changed
    for (const [path, hash] of toMap) {
      if (!fromMap.has(path)) {
        added.push(path);
      } else if (fromMap.get(path) !== hash) {
        changed.push(path);
      }
    }

    // Find removed
    for (const path of fromMap.keys()) {
      if (!toMap.has(path)) {
        removed.push(path);
      }
    }

    return {
      added: added.sort(),
      removed: removed.sort(),
      changed: changed.sort(),
    };
  }
```

Also add `BuildDiff` to the exports at the top of the file.

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/build-client.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/tooling/html-gen/build-client.ts src/tooling/html-gen/build-client.test.ts
git commit -m "feat(html-gen): add build diff utility"
```

---

## Task 6: Run Full Test Suite

**Step 1: Run all html-gen tests**

```bash
pnpm vitest run src/tooling/html-gen/
```

Expected: All tests PASS

**Step 2: Run full tooling test suite**

```bash
pnpm vitest run src/tooling/
```

Expected: All tests PASS (or only pre-existing failures)

**Step 3: Verify exports work**

Create a quick test file (delete after):

```bash
echo "import { hashFile, HtmlBuildClient } from './src/tooling/html-gen/index.js'; console.log('Imports work');" > test-imports.ts
pnpm tsx test-imports.ts
rm test-imports.ts
```

Expected: "Imports work" printed

---

## Phase 1 Complete

**What was built:**
- `src/tooling/html-gen/` module structure
- `hasher.ts` — SHA-256 file hashing utilities
- `build-client.ts` — Database CRUD for build tracking
- Database schema for `html_builds` and `html_build_sources`

**Next Phase:** Phase 2 - Parsing & Transforms (remark/rehype plugins)
