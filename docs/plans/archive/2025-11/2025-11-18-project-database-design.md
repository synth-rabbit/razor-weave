# Project Database Design

**Date:** 2025-11-18  
**Status:** Approved

## Overview

A SQLite-based project database to track state, book versions, chapter versions, and data artifacts across sessions. The database serves as a comprehensive time machine while keeping markdown files as the primary working format.

## Goals

1. **Session persistence** - State survives Claude Code restarts
2. **Safety net** - Capture all changes, even between git commits
3. **Version history** - Full content snapshots for rollback and analysis
4. **Data analysis** - SQL queries over content evolution
5. **Archive capability** - Soft delete old records while keeping history queryable

## Architecture

### Technology Stack
- **Database:** SQLite via `better-sqlite3` npm package
- **Language:** TypeScript with strict types
- **Location:** `data/project.db` (single file)
- **Migrations:** Simple SQL scripts

### File Structure
```
data/
  project.db          # SQLite database
  exports/            # Analysis exports
  cache/              # Generated content cache

src/tooling/
  database/
    client.ts         # Database client wrapper
    schema.ts         # Table definitions and migrations
    queries.ts        # Common queries
    snapshots.ts      # Snapshot creation logic
```

### Data Flow
1. User or Claude edits markdown files (books/chapters)
2. Claude's `after-tool-call` hook detects changes
3. Database client creates snapshot with full content
4. Git hooks mark snapshots as "committed" when files are staged
5. Query database anytime for history, diffs, analysis

## Database Schema

### state table
Tracks project-level state that needs to persist across sessions.

```sql
CREATE TABLE state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,          -- e.g., 'current_session', 'last_generation'
  value TEXT,                         -- JSON-serialized value
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP
);
```

**Use cases:**
- Current working chapter/book
- Session information
- Generation progress/status
- Project-level flags and settings

### book_versions table
Full snapshots of book content at specific points in time.

```sql
CREATE TABLE book_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_path TEXT NOT NULL,            -- e.g., 'books/core/v1'
  version TEXT NOT NULL,              -- e.g., '1.3', 'draft'
  content TEXT NOT NULL,              -- Full book content (JSON)
  metadata TEXT,                      -- JSON: {chapters: [...], word_count, etc}
  file_hash TEXT,                     -- SHA-256 of source files
  source TEXT NOT NULL,               -- 'git' or 'claude'
  commit_sha TEXT,                    -- Git commit if source='git'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  
  INDEX idx_book_path (book_path),
  INDEX idx_version (version),
  INDEX idx_created (created_at)
);
```

### chapter_versions table
Full snapshots of individual chapter content.

```sql
CREATE TABLE chapter_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_path TEXT NOT NULL,
  chapter_path TEXT NOT NULL,         -- e.g., 'books/core/v1/manuscript/chapters/01-intro.md'
  chapter_name TEXT NOT NULL,         -- e.g., 'Introduction'
  version TEXT NOT NULL,
  content TEXT NOT NULL,              -- Full markdown content
  metadata TEXT,                      -- JSON: {word_count, tags, etc}
  file_hash TEXT,
  source TEXT NOT NULL,               -- 'git' or 'claude'
  commit_sha TEXT,                    -- Git commit if source='git'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  
  INDEX idx_chapter_path (chapter_path),
  INDEX idx_book_path (book_path),
  INDEX idx_created (created_at)
);
```

**Key features:**
- Full content snapshots for safety and analysis
- `source` field distinguishes git commits from intermediate Claude edits
- Soft delete with `archived` flag keeps history queryable

### data_artifacts table
Generated content and analysis results from the `data/` directory.

```sql
CREATE TABLE data_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_type TEXT NOT NULL,        -- 'generated_content', 'analysis', 'cache'
  artifact_path TEXT NOT NULL,        -- Path in data/ directory
  content TEXT NOT NULL,              -- JSON or text content
  metadata TEXT,                      -- JSON: generator info, params, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  
  INDEX idx_type (artifact_type),
  INDEX idx_path (artifact_path)
);
```

## Hook Integration

### Claude Code Hooks
Capture every change for safety net.

**after-tool-call:**
```typescript
export default async function(tool: string, args: unknown, result: unknown) {
  await afterToolCall(tool, args, result);
  
  if (tool === 'Write' || tool === 'Edit') {
    const filePath = (args as any).file_path;
    
    if (filePath.startsWith('books/')) {
      await db.snapshots.createChapterSnapshot(filePath, 'claude');
    }
    
    if (filePath.startsWith('data/')) {
      await db.artifacts.create(filePath, await readFile(filePath));
    }
  }
}
```

**session-start:** Record session start in state table  
**session-end:** Record session end, save working state

### Git Hooks
Mark important milestones.

**pre-commit:**
```typescript
const stagedFiles = getStagedFiles();
for (const file of stagedFiles) {
  if (file.startsWith('books/')) {
    await db.snapshots.createChapterSnapshot(file, 'git', { staged: true });
  }
}
```

**post-commit:**
```typescript
const commitSha = getLastCommit();
await db.snapshots.markAsCommitted(commitSha);
await db.state.set('last_commit', commitSha);
```

**Design decisions:**
- Claude hooks run AFTER existing logic (non-breaking)
- All snapshots are async (won't slow down operations)
- Source field distinguishes hook origin for queries

## Client API

### ProjectDatabase Class
Main entry point for all database operations.

```typescript
export class ProjectDatabase {
  private db: Database.Database;
  
  constructor(dbPath: string = 'data/project.db') {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.runMigrations();
  }
  
  state = new StateClient(this.db);
  snapshots = new SnapshotClient(this.db);
  artifacts = new ArtifactClient(this.db);
}
```

### StateClient
Manage project-level state.

```typescript
class StateClient {
  get(key: string): any;
  set(key: string, value: any): void;
  delete(key: string): void;
  getAll(): Record<string, any>;
}
```

### SnapshotClient
Create and query content snapshots.

```typescript
class SnapshotClient {
  async createChapterSnapshot(
    filePath: string, 
    source: 'git' | 'claude',
    options?: { commitSha?: string }
  ): Promise<number>;
  
  async createBookSnapshot(
    bookPath: string,
    source: 'git' | 'claude'
  ): Promise<number>;
  
  getChapterHistory(chapterPath: string, limit?: number): ChapterVersion[];
  getChapterAtTime(chapterPath: string, timestamp: Date): ChapterVersion | null;
  diffChapterVersions(id1: number, id2: number): ContentDiff;
  markAsCommitted(commitSha: string): void;
  archive(id: number): void;
  unarchive(id: number): void;
}
```

### ArtifactClient
Manage data artifacts.

```typescript
class ArtifactClient {
  create(path: string, content: string, type: string): number;
  get(id: number): DataArtifact | null;
  getByPath(path: string): DataArtifact[];
  archive(id: number): void;
}
```

## Workflow Examples

### Scenario 1: Content Generation with Safety Net

**Flow:**
1. User: "Write chapter 2 of the core rulebook"
2. Claude uses Write tool → creates chapter file
3. `after-tool-call` hook triggers
4. Database snapshots chapter (source='claude', no commit_sha)
5. Later: git commit
6. `post-commit` hook marks snapshot as committed

**Result:**
```typescript
db.snapshots.getChapterHistory('books/core/v1/manuscript/chapters/02.md')
// Returns:
[
  { id: 45, source: 'git', commit_sha: 'abc123' },      // Committed version
  { id: 44, source: 'claude', commit_sha: 'abc123' },   // Pre-commit snapshot
  { id: 43, source: 'claude', commit_sha: null }        // Earlier draft
]
```

### Scenario 2: Recovering Lost Work

**Problem:** Claude edits chapter twice, first edit committed, second lost when session ends.

**Solution:**
```typescript
// Get last version before session ended
const lastVersion = db.snapshots.getChapterAtTime(
  'books/core/v1/manuscript/chapters/03.md',
  new Date('2025-01-18T15:00')
);

// Compare with committed version
const diff = db.snapshots.diffChapterVersions(
  lastVersion.id,
  committedVersion.id
);

// Recover lost content
console.log(diff.added, diff.removed);
```

### Scenario 3: Content Evolution Analysis

```typescript
const allVersions = db.snapshots.getChapterHistory(
  'books/core/v1/manuscript/chapters/01.md'
);

const metrics = {
  totalEdits: allVersions.length,
  wordCountGrowth: calculateGrowth(allVersions),
  editFrequency: calculateFrequency(allVersions),
  majorRevisions: allVersions.filter(v => v.source === 'git').length
};

await exportToCSV('data/exports/chapter-01-evolution.csv', metrics);
```

### Scenario 4: Session State Persistence

```typescript
// Before session ends
db.state.set('current_working_chapter', 'books/core/v1/manuscript/chapters/05.md');
db.state.set('generation_progress', { completed: 4, total: 12 });

// New session starts
const chapter = db.state.get('current_working_chapter');
const progress = db.state.get('generation_progress');
// Continue exactly where left off
```

## Implementation Phases

### Phase 1: Core Database
- SQLite client setup
- Schema creation and migrations
- Basic CRUD operations
- Tests

### Phase 2: Snapshot System
- Chapter/book snapshot logic
- Content hashing
- Diff generation
- Archive functionality

### Phase 3: Hook Integration
- Update Claude hooks
- Update git hooks
- Test snapshot capture
- Verify performance

### Phase 4: Query & Analysis
- Common queries
- Export utilities
- Analysis tools
- Documentation

## Key Decisions

1. **SQLite over PostgreSQL** - Local-first, zero configuration, single file
2. **Full content snapshots** - Safety net + analysis capability
3. **Both git and Claude hooks** - Comprehensive tracking
4. **Soft delete archiving** - Keep history queryable
5. **Markdown as source of truth** - Database is append-only archive

## Success Criteria

- ✅ All book/chapter changes captured automatically
- ✅ State persists across Claude Code sessions
- ✅ Can recover content lost between commits
- ✅ Can query content evolution over time
- ✅ No impact on existing workflows (hooks are transparent)
- ✅ Database size manageable (< 100MB for typical usage)

## References

- [better-sqlite3 documentation](https://github.com/WiseLibs/better-sqlite3)
- [SQLite WAL mode](https://www.sqlite.org/wal.html)
- Git hooks: `src/tooling/hooks/git/`
- Claude hooks: `.claude/hooks/`
