# Project Database Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement SQLite-based project database to track state, book versions, chapter versions, and data artifacts across sessions with full hook integration.

**Architecture:** SQLite database using better-sqlite3, with TypeScript client providing StateClient, SnapshotClient, and ArtifactClient. Integrates with both Claude Code and git hooks to capture all changes automatically.

**Tech Stack:** SQLite (better-sqlite3), TypeScript, Vitest for testing

---

## Task 1: Add Database Dependency and Create Data Directory

**Files:**
- Modify: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/package.json`
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/data/.gitkeep`

**Step 1: Add better-sqlite3 dependency**

```bash
cd /Users/pandorz/Documents/razorweave/.worktrees/project-database
pnpm --filter @razorweave/tooling add better-sqlite3
pnpm --filter @razorweave/tooling add -D @types/better-sqlite3
```

Expected: Dependencies added to package.json

**Step 2: Create data directory**

```bash
mkdir -p /Users/pandorz/Documents/razorweave/.worktrees/project-database/data
touch /Users/pandorz/Documents/razorweave/.worktrees/project-database/data/.gitkeep
```

**Step 3: Update .gitignore to exclude database file**

Add to `.gitignore`:
```
# Project database
data/project.db
data/project.db-shm
data/project.db-wal
```

**Step 4: Commit**

```bash
git add data/.gitkeep .gitignore src/tooling/package.json src/tooling/pnpm-lock.yaml
git commit -m "🔧 chore(tooling): add better-sqlite3 and create data directory"
```

---

## Task 2: Create Database Schema

**Files:**
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/schema.ts`

**Step 1: Create database directory and schema file**

```typescript
// src/tooling/database/schema.ts
import type Database from 'better-sqlite3';

export const SCHEMA_VERSION = 1;

export function createTables(db: Database.Database): void {
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  
  // Create state table
  db.exec(`
    CREATE TABLE IF NOT EXISTS state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_state_key ON state(key);
  `);
  
  // Create book_versions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_path TEXT NOT NULL,
      version TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      file_hash TEXT,
      source TEXT NOT NULL CHECK(source IN ('git', 'claude')),
      commit_sha TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_book_path ON book_versions(book_path);
    CREATE INDEX IF NOT EXISTS idx_book_version ON book_versions(version);
    CREATE INDEX IF NOT EXISTS idx_book_created ON book_versions(created_at);
  `);
  
  // Create chapter_versions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapter_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_path TEXT NOT NULL,
      chapter_path TEXT NOT NULL,
      chapter_name TEXT NOT NULL,
      version TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      file_hash TEXT,
      source TEXT NOT NULL CHECK(source IN ('git', 'claude')),
      commit_sha TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_chapter_path ON chapter_versions(chapter_path);
    CREATE INDEX IF NOT EXISTS idx_chapter_book ON chapter_versions(book_path);
    CREATE INDEX IF NOT EXISTS idx_chapter_created ON chapter_versions(created_at);
  `);
  
  // Create data_artifacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artifact_type TEXT NOT NULL,
      artifact_path TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_artifact_type ON data_artifacts(artifact_type);
    CREATE INDEX IF NOT EXISTS idx_artifact_path ON data_artifacts(artifact_path);
  `);
  
  // Store schema version
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_info (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    INSERT OR IGNORE INTO schema_info (version) VALUES (${SCHEMA_VERSION});
  `);
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm --filter @razorweave/tooling build
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/database/schema.ts
git commit -m "✨ feat(database): add SQLite schema for project tracking"
```

---

## Task 3: Create Database Client

**Files:**
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/client.ts`
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/index.ts`

**Step 1: Create client.ts**

```typescript
// src/tooling/database/client.ts
import Database from 'better-sqlite3';
import { join } from 'path';
import { createTables } from './schema.js';
import { StateClient } from './state-client.js';
import { SnapshotClient } from './snapshot-client.js';
import { ArtifactClient } from './artifact-client.js';

export class ProjectDatabase {
  private db: Database.Database;
  
  public readonly state: StateClient;
  public readonly snapshots: SnapshotClient;
  public readonly artifacts: ArtifactClient;
  
  constructor(dbPath?: string) {
    const finalPath = dbPath || join(process.cwd(), 'data', 'project.db');
    
    this.db = new Database(finalPath);
    this.db.pragma('journal_mode = WAL');
    
    // Initialize schema
    createTables(this.db);
    
    // Initialize clients
    this.state = new StateClient(this.db);
    this.snapshots = new SnapshotClient(this.db);
    this.artifacts = new ArtifactClient(this.db);
  }
  
  close(): void {
    this.db.close();
  }
  
  getDb(): Database.Database {
    return this.db;
  }
}

// Singleton instance
let dbInstance: ProjectDatabase | null = null;

export function getDatabase(): ProjectDatabase {
  if (!dbInstance) {
    dbInstance = new ProjectDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
```

**Step 2: Create barrel export**

```typescript
// src/tooling/database/index.ts
export * from './client.js';
export * from './schema.js';
export * from './state-client.js';
export * from './snapshot-client.js';
export * from './artifact-client.js';
export * from './types.js';
```

**Step 3: Build to verify imports**

```bash
pnpm --filter @razorweave/tooling build
```

Expected: Fails because clients don't exist yet - that's expected

**Step 4: Commit**

```bash
git add src/tooling/database/client.ts src/tooling/database/index.ts
git commit -m "✨ feat(database): add database client with singleton pattern"
```

---

## Task 4: Create Database Types

**Files:**
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/types.ts`

**Step 1: Create types file**

```typescript
// src/tooling/database/types.ts

export interface ChapterVersion {
  id: number;
  book_path: string;
  chapter_path: string;
  chapter_name: string;
  version: string;
  content: string;
  metadata: string | null;
  file_hash: string | null;
  source: 'git' | 'claude';
  commit_sha: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface BookVersion {
  id: number;
  book_path: string;
  version: string;
  content: string;
  metadata: string | null;
  file_hash: string | null;
  source: 'git' | 'claude';
  commit_sha: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface DataArtifact {
  id: number;
  artifact_type: string;
  artifact_path: string;
  content: string;
  metadata: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface StateEntry {
  id: number;
  key: string;
  value: string | null;
  updated_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface ContentDiff {
  added: string;
  removed: string;
  unchanged: string;
}
```

**Step 2: Commit**

```bash
git add src/tooling/database/types.ts
git commit -m "✨ feat(database): add TypeScript types for database entities"
```

---

## Task 5: Implement StateClient with Tests

**Files:**
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/state-client.test.ts`
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/state-client.ts`

**Step 1: Write failing test**

```typescript
// src/tooling/database/state-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDatabase } from './client.js';
import { unlinkSync } from 'fs';

describe('StateClient', () => {
  let db: ProjectDatabase;
  const testDbPath = 'data/test-state.db';
  
  beforeEach(() => {
    db = new ProjectDatabase(testDbPath);
  });
  
  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
    } catch {
      // Ignore if files don't exist
    }
  });
  
  it('should set and get state values', () => {
    db.state.set('test_key', 'test_value');
    const value = db.state.get('test_key');
    
    expect(value).toBe('test_value');
  });
  
  it('should handle JSON values', () => {
    const obj = { foo: 'bar', count: 42 };
    db.state.set('json_key', obj);
    const retrieved = db.state.get('json_key');
    
    expect(retrieved).toEqual(obj);
  });
  
  it('should return null for non-existent keys', () => {
    const value = db.state.get('non_existent');
    expect(value).toBeNull();
  });
  
  it('should delete state values', () => {
    db.state.set('delete_me', 'value');
    db.state.delete('delete_me');
    
    const value = db.state.get('delete_me');
    expect(value).toBeNull();
  });
  
  it('should get all state entries', () => {
    db.state.set('key1', 'value1');
    db.state.set('key2', { nested: 'object' });
    
    const all = db.state.getAll();
    
    expect(all).toEqual({
      key1: 'value1',
      key2: { nested: 'object' }
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @razorweave/tooling test src/tooling/database/state-client.test.ts
```

Expected: FAIL (state-client.ts doesn't exist)

**Step 3: Implement StateClient**

```typescript
// src/tooling/database/state-client.ts
import type Database from 'better-sqlite3';

export class StateClient {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  set(key: string, value: unknown): void {
    const serialized = JSON.stringify(value);
    
    const stmt = this.db.prepare(`
      INSERT INTO state (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    stmt.run(key, serialized);
  }
  
  get(key: string): unknown {
    const stmt = this.db.prepare(`
      SELECT value FROM state
      WHERE key = ? AND archived = FALSE
    `);
    
    const row = stmt.get(key) as { value: string } | undefined;
    
    if (!row) return null;
    
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }
  
  delete(key: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM state WHERE key = ?
    `);
    
    stmt.run(key);
  }
  
  getAll(): Record<string, unknown> {
    const stmt = this.db.prepare(`
      SELECT key, value FROM state WHERE archived = FALSE
    `);
    
    const rows = stmt.all() as Array<{ key: string; value: string }>;
    
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    
    return result;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @razorweave/tooling test src/tooling/database/state-client.test.ts
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/tooling/database/state-client.ts src/tooling/database/state-client.test.ts
git commit -m "✨ feat(database): implement StateClient with full test coverage"
```

---

## Task 6: Implement SnapshotClient with Tests

**Files:**
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/snapshot-client.test.ts`
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/snapshot-client.ts`

**Step 1: Write failing test**

```typescript
// src/tooling/database/snapshot-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDatabase } from './client.js';
import { unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

describe('SnapshotClient', () => {
  let db: ProjectDatabase;
  const testDbPath = 'data/test-snapshots.db';
  const testChapterPath = 'data/test-chapter.md';
  
  beforeEach(() => {
    db = new ProjectDatabase(testDbPath);
    
    // Create test chapter file
    mkdirSync(dirname(testChapterPath), { recursive: true });
    writeFileSync(testChapterPath, '# Test Chapter\n\nThis is test content.');
  });
  
  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
      unlinkSync(testChapterPath);
    } catch {
      // Ignore
    }
  });
  
  it('should create chapter snapshot', async () => {
    const id = await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    
    expect(id).toBeGreaterThan(0);
  });
  
  it('should get chapter history', async () => {
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    await db.snapshots.createChapterSnapshot(testChapterPath, 'git', { commitSha: 'abc123' });
    
    const history = db.snapshots.getChapterHistory(testChapterPath);
    
    expect(history).toHaveLength(2);
    expect(history[0].source).toBe('git');
    expect(history[1].source).toBe('claude');
  });
  
  it('should mark snapshots as committed', async () => {
    const id = await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    
    db.snapshots.markAsCommitted('abc123');
    
    const history = db.snapshots.getChapterHistory(testChapterPath);
    expect(history[0].commit_sha).toBe('abc123');
  });
  
  it('should archive snapshots', async () => {
    const id = await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    
    db.snapshots.archive(id);
    
    const history = db.snapshots.getChapterHistory(testChapterPath);
    expect(history).toHaveLength(0); // Archived snapshots excluded
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @razorweave/tooling test src/tooling/database/snapshot-client.test.ts
```

Expected: FAIL (snapshot-client.ts doesn't exist)

**Step 3: Implement SnapshotClient**

```typescript
// src/tooling/database/snapshot-client.ts
import type Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import type { ChapterVersion } from './types.js';

export class SnapshotClient {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  async createChapterSnapshot(
    filePath: string,
    source: 'git' | 'claude',
    options?: { commitSha?: string }
  ): Promise<number> {
    const content = readFileSync(filePath, 'utf-8');
    const hash = createHash('sha256').update(content).digest('hex');
    
    // Extract book path and chapter name from file path
    const bookPath = this.extractBookPath(filePath);
    const chapterName = this.extractChapterName(filePath);
    const version = 'draft'; // TODO: Extract from file or metadata
    
    const stmt = this.db.prepare(`
      INSERT INTO chapter_versions (
        book_path, chapter_path, chapter_name, version,
        content, file_hash, source, commit_sha, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      bookPath,
      filePath,
      chapterName,
      version,
      content,
      hash,
      source,
      options?.commitSha || null
    );
    
    return result.lastInsertRowid as number;
  }
  
  async createBookSnapshot(
    bookPath: string,
    source: 'git' | 'claude'
  ): Promise<number> {
    // Placeholder - would aggregate all chapters
    const stmt = this.db.prepare(`
      INSERT INTO book_versions (
        book_path, version, content, source, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(bookPath, 'draft', '{}', source);
    return result.lastInsertRowid as number;
  }
  
  getChapterHistory(chapterPath: string, limit?: number): ChapterVersion[] {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    
    const stmt = this.db.prepare(`
      SELECT * FROM chapter_versions
      WHERE chapter_path = ? AND archived = FALSE
      ORDER BY created_at DESC
      ${limitClause}
    `);
    
    return stmt.all(chapterPath) as ChapterVersion[];
  }
  
  getChapterAtTime(chapterPath: string, timestamp: Date): ChapterVersion | null {
    const stmt = this.db.prepare(`
      SELECT * FROM chapter_versions
      WHERE chapter_path = ?
        AND created_at <= ?
        AND archived = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    const row = stmt.get(chapterPath, timestamp.toISOString());
    return row as ChapterVersion | null;
  }
  
  markAsCommitted(commitSha: string): void {
    const stmt = this.db.prepare(`
      UPDATE chapter_versions
      SET commit_sha = ?
      WHERE commit_sha IS NULL
        AND source = 'claude'
        AND created_at >= datetime('now', '-1 hour')
    `);
    
    stmt.run(commitSha);
  }
  
  archive(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE chapter_versions
      SET archived = TRUE, archived_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(id);
  }
  
  unarchive(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE chapter_versions
      SET archived = FALSE, archived_at = NULL
      WHERE id = ?
    `);
    
    stmt.run(id);
  }
  
  private extractBookPath(filePath: string): string {
    // Extract book path from chapter path
    // e.g., "books/core/v1/manuscript/chapters/01.md" -> "books/core/v1"
    const match = filePath.match(/^(books\/[^/]+\/[^/]+)/);
    return match ? match[1] : 'unknown';
  }
  
  private extractChapterName(filePath: string): string {
    // Extract chapter name from file path
    const match = filePath.match(/([^/]+)\.md$/);
    return match ? match[1] : 'unknown';
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @razorweave/tooling test src/tooling/database/snapshot-client.test.ts
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/tooling/database/snapshot-client.ts src/tooling/database/snapshot-client.test.ts
git commit -m "✨ feat(database): implement SnapshotClient for chapter versioning"
```

---

## Task 7: Implement ArtifactClient with Tests

**Files:**
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/artifact-client.test.ts`
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/artifact-client.ts`

**Step 1: Write failing test**

```typescript
// src/tooling/database/artifact-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDatabase } from './client.js';
import { unlinkSync } from 'fs';

describe('ArtifactClient', () => {
  let db: ProjectDatabase;
  const testDbPath = 'data/test-artifacts.db';
  
  beforeEach(() => {
    db = new ProjectDatabase(testDbPath);
  });
  
  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
    } catch {
      // Ignore
    }
  });
  
  it('should create artifact', () => {
    const id = db.artifacts.create('data/test.json', '{"foo":"bar"}', 'generated_content');
    
    expect(id).toBeGreaterThan(0);
  });
  
  it('should get artifact by id', () => {
    const id = db.artifacts.create('data/test.json', '{"foo":"bar"}', 'generated_content');
    
    const artifact = db.artifacts.get(id);
    
    expect(artifact).toBeDefined();
    expect(artifact?.content).toBe('{"foo":"bar"}');
  });
  
  it('should get artifacts by path', () => {
    db.artifacts.create('data/analysis/report.json', '{"v":1}', 'analysis');
    db.artifacts.create('data/analysis/report.json', '{"v":2}', 'analysis');
    
    const artifacts = db.artifacts.getByPath('data/analysis/report.json');
    
    expect(artifacts).toHaveLength(2);
  });
  
  it('should archive artifacts', () => {
    const id = db.artifacts.create('data/test.json', 'content', 'cache');
    
    db.artifacts.archive(id);
    
    const artifact = db.artifacts.get(id);
    expect(artifact).toBeNull(); // Archived artifacts excluded
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @razorweave/tooling test src/tooling/database/artifact-client.test.ts
```

Expected: FAIL

**Step 3: Implement ArtifactClient**

```typescript
// src/tooling/database/artifact-client.ts
import type Database from 'better-sqlite3';
import type { DataArtifact } from './types.js';

export class ArtifactClient {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  create(path: string, content: string, type: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO data_artifacts (
        artifact_type, artifact_path, content, created_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(type, path, content);
    return result.lastInsertRowid as number;
  }
  
  get(id: number): DataArtifact | null {
    const stmt = this.db.prepare(`
      SELECT * FROM data_artifacts
      WHERE id = ? AND archived = FALSE
    `);
    
    const row = stmt.get(id);
    return row as DataArtifact | null;
  }
  
  getByPath(path: string): DataArtifact[] {
    const stmt = this.db.prepare(`
      SELECT * FROM data_artifacts
      WHERE artifact_path = ? AND archived = FALSE
      ORDER BY created_at DESC
    `);
    
    return stmt.all(path) as DataArtifact[];
  }
  
  archive(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE data_artifacts
      SET archived = TRUE, archived_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(id);
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @razorweave/tooling test src/tooling/database/artifact-client.test.ts
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/tooling/database/artifact-client.ts src/tooling/database/artifact-client.test.ts
git commit -m "✨ feat(database): implement ArtifactClient for data tracking"
```

---

## Task 8: Update Claude after-tool-call Hook

**Files:**
- Modify: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/hooks/claude/after-tool-call.ts`

**Step 1: Update after-tool-call to snapshot changes**

Add after existing logic:

```typescript
import { getDatabase } from '../../database/index.js';

export async function afterToolCall(
  tool: string,
  args: unknown,
  result: unknown
): Promise<AfterToolCallResult> {
  const typedArgs = args as Record<string, unknown>;

  // Existing logging logic...
  if (tool === 'Write' && typeof typedArgs.file_path === 'string') {
    console.log(`✅ Created: ${typedArgs.file_path}`);
  }

  if (tool === 'Edit' && typeof typedArgs.file_path === 'string') {
    console.log(`✏️  Updated: ${typedArgs.file_path}`);
  }

  // NEW: Snapshot book/chapter changes
  if (tool === 'Write' || tool === 'Edit') {
    const filePath = typedArgs.file_path as string;
    
    if (filePath.startsWith('books/') && filePath.endsWith('.md')) {
      try {
        const db = getDatabase();
        await db.snapshots.createChapterSnapshot(filePath, 'claude');
        console.log(`📸 Snapshotted: ${filePath}`);
      } catch (error) {
        console.error(`Failed to snapshot ${filePath}:`, error);
      }
    }
    
    if (filePath.startsWith('data/') && !filePath.includes('project.db')) {
      try {
        const db = getDatabase();
        const { readFileSync } = await import('fs');
        const content = readFileSync(filePath, 'utf-8');
        db.artifacts.create(filePath, content, 'generated_content');
        console.log(`📦 Archived: ${filePath}`);
      } catch (error) {
        console.error(`Failed to archive ${filePath}:`, error);
      }
    }
  }

  return { success: true };
}
```

**Step 2: Build and verify**

```bash
pnpm --filter @razorweave/tooling build
```

Expected: Success

**Step 3: Commit**

```bash
git add src/tooling/hooks/claude/after-tool-call.ts
git commit -m "✨ feat(hooks): integrate database snapshots in after-tool-call"
```

---

## Task 9: Update Git pre-commit Hook

**Files:**
- Modify: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/hooks/git/pre-commit.ts`

**Step 1: Add snapshot logic to pre-commit**

Add after existing validation:

```typescript
import { getDatabase } from '../../database/index.js';

// ... existing code ...

// NEW: Snapshot staged book files before commit
const bookFiles = stagedFiles.filter(f => 
  f.startsWith('books/') && f.endsWith('.md')
);

if (bookFiles.length > 0) {
  console.log('\n📸 Creating pre-commit snapshots...');
  const db = getDatabase();
  
  for (const file of bookFiles) {
    try {
      await db.snapshots.createChapterSnapshot(file, 'git', { staged: true });
      console.log(`  ✓ ${file}`);
    } catch (error) {
      console.error(`  ✗ ${file}:`, error);
    }
  }
}
```

**Step 2: Build**

```bash
pnpm --filter @razorweave/tooling build
```

**Step 3: Commit**

```bash
git add src/tooling/hooks/git/pre-commit.ts
git commit -m "✨ feat(hooks): snapshot staged files in pre-commit hook"
```

---

## Task 10: Update Git post-commit Hook

**Files:**
- Modify: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/hooks/git/post-commit.ts`

**Step 1: Mark snapshots as committed in post-commit**

Add after AGENTS.md update:

```typescript
import { getDatabase } from '../../database/index.js';
import { execSync } from 'child_process';

function getLastCommit(): string {
  return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
}

// ... existing code ...

// NEW: Mark recent snapshots as committed
const commitSha = getLastCommit();
const db = getDatabase();
db.snapshots.markAsCommitted(commitSha);
console.log(`\n✅ Marked snapshots as committed: ${commitSha.substring(0, 7)}`);

// Update state
db.state.set('last_commit', commitSha);
db.state.set('last_commit_time', new Date().toISOString());
```

**Step 2: Build**

```bash
pnpm --filter @razorweave/tooling build
```

**Step 3: Commit**

```bash
git add src/tooling/hooks/git/post-commit.ts
git commit -m "✨ feat(hooks): mark snapshots as committed in post-commit"
```

---

## Task 11: Add End-to-End Test

**Files:**
- Create: `/Users/pandorz/Documents/razorweave/.worktrees/project-database/src/tooling/database/integration.test.ts`

**Step 1: Write integration test**

```typescript
// src/tooling/database/integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDatabase } from './client.js';
import { unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

describe('Database Integration', () => {
  let db: ProjectDatabase;
  const testDbPath = 'data/test-integration.db';
  const testChapterPath = 'books/test/v1/manuscript/chapters/01.md';
  
  beforeEach(() => {
    db = new ProjectDatabase(testDbPath);
    
    mkdirSync(dirname(testChapterPath), { recursive: true });
    writeFileSync(testChapterPath, '# Chapter 1\n\nFirst version.');
  });
  
  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
    } catch {
      // Ignore
    }
  });
  
  it('should track full workflow: Claude edit -> commit -> state update', async () => {
    // Simulate Claude edit
    const snapshot1 = await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    expect(snapshot1).toBeGreaterThan(0);
    
    // Simulate git commit
    db.snapshots.markAsCommitted('abc123');
    db.state.set('last_commit', 'abc123');
    
    // Verify history
    const history = db.snapshots.getChapterHistory(testChapterPath);
    expect(history).toHaveLength(1);
    expect(history[0].commit_sha).toBe('abc123');
    
    // Verify state
    const lastCommit = db.state.get('last_commit');
    expect(lastCommit).toBe('abc123');
  });
  
  it('should handle multiple edits between commits', async () => {
    // Multiple Claude edits
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    
    writeFileSync(testChapterPath, '# Chapter 1\n\nSecond version.');
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    
    writeFileSync(testChapterPath, '# Chapter 1\n\nThird version.');
    await db.snapshots.createChapterSnapshot(testChapterPath, 'claude');
    
    // Commit
    db.snapshots.markAsCommitted('xyz789');
    
    // All should be marked
    const history = db.snapshots.getChapterHistory(testChapterPath);
    expect(history).toHaveLength(3);
    expect(history.every(h => h.commit_sha === 'xyz789')).toBe(true);
  });
});
```

**Step 2: Run test**

```bash
pnpm --filter @razorweave/tooling test src/tooling/database/integration.test.ts
```

Expected: PASS (2 tests)

**Step 3: Commit**

```bash
git add src/tooling/database/integration.test.ts
git commit -m "🧪 test(database): add end-to-end integration tests"
```

---

## Task 12: Run Full Test Suite and Verify

**Step 1: Run all tests**

```bash
pnpm --filter @razorweave/tooling test
```

Expected: All tests pass (30+ tests)

**Step 2: Build production**

```bash
pnpm --filter @razorweave/tooling build
```

Expected: Success

**Step 3: Create verification script**

```typescript
// scripts/verify-database.ts
import { getDatabase } from '@razorweave/tooling/database';

const db = getDatabase();

console.log('Database initialized successfully!');
console.log('State entries:', Object.keys(db.state.getAll()).length);

db.state.set('test_key', 'test_value');
console.log('Test value:', db.state.get('test_key'));

process.exit(0);
```

**Step 4: Run verification**

```bash
npx tsx scripts/verify-database.ts
```

Expected: Output showing successful database operations

**Step 5: Final commit**

```bash
git add .
git commit -m "✅ chore(database): verify full integration"
```

---

## Verification

After completing all tasks:

```bash
# All tests should pass
pnpm test

# Build should succeed
pnpm build

# Database file should be created (but gitignored)
ls -lh data/project.db

# Git hooks should be updated
cat src/tooling/hooks/claude/after-tool-call.ts | grep "getDatabase"
cat src/tooling/hooks/git/pre-commit.ts | grep "snapshots"
```

**Success criteria:**
- ✅ All tests passing (30+ tests)
- ✅ Database file created in data/
- ✅ Hooks integrated with database
- ✅ Can create snapshots, query history, manage state
- ✅ Full workflow: edit -> snapshot -> commit -> mark committed

**Phase 1 Complete!**

Next phase would add:
- Content diffing
- Query utilities
- Export/analysis tools
- Session management UI
