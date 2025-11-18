# Project Database User Guide

This guide explains how Razorweave uses a SQLite database to track project state, content history, and generated artifacts.

## Overview

The Razorweave project database provides:

- **Content version history** - Automatic snapshots of book chapters
- **Project state tracking** - Key-value store for project metadata
- **Artifact storage** - Generated content and analysis results
- **Git integration** - Links snapshots to specific commits

**Database location:** `src/tooling/data/project.db`

**Database format:** SQLite 3 with WAL (Write-Ahead Logging) mode

## Schema Overview

The database has four main tables:

### 1. state

Key-value store for project metadata.

**Columns:**

- `id` - Auto-incrementing primary key
- `key` - Unique string identifier
- `value` - JSON-serialized value
- `updated_at` - Last update timestamp
- `archived` - Soft delete flag
- `archived_at` - Archive timestamp

**Common keys:**

- `last_commit` - SHA of most recent commit
- `last_commit_time` - Timestamp of last commit
- `project_version` - Current project version
- `verification_test` - Database verification status

### 2. chapter_versions

Snapshots of book chapter content over time.

**Columns:**

- `id` - Auto-incrementing primary key
- `book_path` - Path to book directory (e.g., `books/core-rulebook`)
- `chapter_path` - Full path to chapter file
- `chapter_name` - Extracted chapter name
- `version` - Version identifier (currently `'draft'`)
- `content` - Full chapter markdown content
- `metadata` - JSON metadata (optional)
- `file_hash` - SHA-256 hash of content
- `source` - Either `'git'` or `'claude'`
- `commit_sha` - Git commit SHA (if committed)
- `created_at` - Snapshot timestamp
- `archived` - Soft delete flag

**Indexes:**

- `chapter_path` - Fast lookup by file
- `book_path` - Fast lookup by book
- `created_at` - Fast chronological queries

### 3. book_versions

Snapshots of entire books (currently placeholder).

**Columns:**

- `id` - Auto-incrementing primary key
- `book_path` - Path to book directory
- `version` - Version identifier
- `content` - Aggregated book content
- `metadata` - JSON metadata
- `file_hash` - Content hash
- `source` - Either `'git'` or `'claude'`
- `commit_sha` - Git commit SHA
- `created_at` - Snapshot timestamp
- `archived` - Soft delete flag

### 4. data_artifacts

Generated content and analysis results.

**Columns:**

- `id` - Auto-incrementing primary key
- `artifact_type` - Type identifier (e.g., `'generated_content'`, `'analysis'`)
- `artifact_path` - File path where artifact is stored
- `content` - Artifact content or metadata
- `metadata` - Additional JSON metadata
- `created_at` - Creation timestamp
- `archived` - Soft delete flag

## Common Use Cases

### Query Chapter History

Get all snapshots for a specific chapter:

```typescript
import { getDatabase } from '@razorweave/tooling/database';

const db = getDatabase();
const history = db.snapshots.getChapterHistory('books/core-rulebook/chapter-1.md');

console.log(`Found ${history.length} snapshots`);
history.forEach(snapshot => {
  console.log(`${snapshot.created_at}: ${snapshot.source} (${snapshot.commit_sha?.substring(0, 7)})`);
});
```

**CLI alternative (direct SQL):**

```bash
sqlite3 src/tooling/data/project.db \
  "SELECT created_at, source, substr(commit_sha, 1, 7) as commit
   FROM chapter_versions
   WHERE chapter_path = 'books/core-rulebook/chapter-1.md'
   ORDER BY created_at DESC;"
```

### Get Chapter at Specific Time

Retrieve chapter content as it was at a specific point in time:

```typescript
const db = getDatabase();
const timestamp = new Date('2025-11-15T10:00:00Z');
const snapshot = db.snapshots.getChapterAtTime(
  'books/core-rulebook/chapter-1.md',
  timestamp
);

if (snapshot) {
  console.log('Content at', timestamp);
  console.log(snapshot.content);
}
```

### View All Project State

Get all key-value pairs from state table:

```typescript
const db = getDatabase();
const state = db.state.getAll();

console.log('Project state:');
for (const [key, value] of Object.entries(state)) {
  console.log(`  ${key}:`, value);
}
```

**CLI alternative:**

```bash
sqlite3 src/tooling/data/project.db \
  "SELECT key, value FROM state WHERE archived = FALSE;"
```

### Recover Previous Version

Restore a chapter to a previous version:

```typescript
import { writeFileSync } from 'fs';

const db = getDatabase();
const history = db.snapshots.getChapterHistory('books/core-rulebook/chapter-1.md', 10);

// Show last 10 versions
console.log('Recent versions:');
history.forEach((v, i) => {
  console.log(`${i + 1}. ${v.created_at} (${v.source})`);
});

// Restore version 3
const targetVersion = history[2];
writeFileSync(targetVersion.chapter_path, targetVersion.content);
console.log('Restored version from', targetVersion.created_at);
```

### Analyze Edit Patterns

Find how many times a chapter has been edited:

```typescript
const db = getDatabase();

const chapters = [
  'books/core-rulebook/chapter-1.md',
  'books/core-rulebook/chapter-2.md',
  'books/core-rulebook/chapter-3.md',
];

chapters.forEach(chapter => {
  const history = db.snapshots.getChapterHistory(chapter);
  const gitEdits = history.filter(v => v.source === 'git').length;
  const claudeEdits = history.filter(v => v.source === 'claude').length;

  console.log(`${chapter}:`);
  console.log(`  Total: ${history.length} versions`);
  console.log(`  Git: ${gitEdits}, Claude: ${claudeEdits}`);
});
```

### Create Manual Snapshot

Create a snapshot outside of git hooks:

```typescript
const db = getDatabase();

const snapshotId = await db.snapshots.createChapterSnapshot(
  'books/core-rulebook/chapter-1.md',
  'claude', // or 'git'
  { commitSha: 'abc123' } // optional
);

console.log('Created snapshot:', snapshotId);
```

### Store Project State

Save project metadata:

```typescript
const db = getDatabase();

// Store simple values
db.state.set('project_version', '1.0.0');
db.state.set('last_build', new Date().toISOString());

// Store complex objects
db.state.set('build_config', {
  target: 'production',
  format: 'pdf',
  chapters: 12
});

// Retrieve values
const version = db.state.get('project_version');
const config = db.state.get('build_config');
```

## CLI Tools for Database Access

### Using sqlite3 Command

**Connect to database:**

```bash
sqlite3 src/tooling/data/project.db
```

**Common queries:**

```sql
-- List all tables
.tables

-- Show schema
.schema chapter_versions

-- Count snapshots by source
SELECT source, COUNT(*) as count
FROM chapter_versions
GROUP BY source;

-- Find chapters with most versions
SELECT chapter_path, COUNT(*) as versions
FROM chapter_versions
GROUP BY chapter_path
ORDER BY versions DESC;

-- Get recent activity
SELECT chapter_path, created_at, source
FROM chapter_versions
ORDER BY created_at DESC
LIMIT 10;

-- Exit
.quit
```

### Using TypeScript API

All database operations are accessible via the TypeScript API:

```typescript
import { getDatabase } from '@razorweave/tooling/database';

const db = getDatabase();

// Available clients:
db.state      // StateClient - key-value storage
db.snapshots  // SnapshotClient - content versioning
db.artifacts  // ArtifactClient - generated artifacts
```

### Verification Script

Run the database verification script to test all functionality:

```bash
pnpm --filter @razorweave/tooling exec tsx scripts/verify-database.ts
```

This script:

- Tests all database clients
- Creates test data
- Displays database summary
- Shows database file info

**Note:** Creates test data in `books/test/` and `data/test-artifacts/`

## Integration with Git Hooks

The database integrates automatically with git hooks:

### pre-commit Hook

- **When:** Before commit is created
- **What:** Creates snapshots of all staged chapter files
- **Source:** Marked as `'git'`
- **Commit SHA:** Not yet known (set in post-commit)

Example:

```
📸 Creating pre-commit snapshots...
  ✓ books/core-rulebook/chapter-1.md
  ✓ books/core-rulebook/chapter-2.md
```

### post-commit Hook

- **When:** After commit succeeds
- **What:** Updates snapshots with commit SHA
- **Updates:** Sets `commit_sha` for recent `'claude'` source snapshots
- **State:** Records `last_commit` and `last_commit_time`

Example:

```
✅ Marked snapshots as committed: a1b2c3d
```

**Why two hooks?**

- pre-commit: Capture content before commit
- post-commit: Link to commit SHA after it's created

## Backup and Recovery

### Manual Backup

```bash
# Copy database file
cp src/tooling/data/project.db src/tooling/data/project.db.backup

# Or use SQLite backup command
sqlite3 src/tooling/data/project.db ".backup 'backup/project-$(date +%Y%m%d).db'"
```

### Automated Backup

Add to your workflow:

```bash
# Before major operations
pnpm --filter @razorweave/tooling exec node -e "
  const fs = require('fs');
  fs.copyFileSync('data/project.db', 'data/project.db.pre-migration');
"
```

### Restore from Backup

```bash
# Stop any processes using the database
# Replace current database
cp src/tooling/data/project.db.backup src/tooling/data/project.db
```

### Git-based Backup

The database file is tracked in git (see `.gitignore` for exclusions). This provides:

- Version control of database schema changes
- Ability to revert to previous database states
- Team synchronization of project state

**Important:** Large databases may impact git performance. Consider `.gitignore` for production.

## Performance Considerations

### WAL Mode

The database uses WAL (Write-Ahead Logging) mode:

- **Advantage:** Better concurrency, faster writes
- **Files:** Creates `project.db-wal` and `project.db-shm` files
- **Cleanup:** Automatic via SQLite checkpointing

### Indexes

All tables have appropriate indexes for common queries:

- `chapter_path` - O(log n) chapter lookups
- `created_at` - O(log n) chronological queries
- `book_path` - O(log n) book-wide queries

### Query Optimization

For large result sets, use LIMIT:

```typescript
// Get last 50 versions instead of all
const history = db.snapshots.getChapterHistory('path/to/chapter.md', 50);
```

### Database Size

Monitor database growth:

```bash
du -h src/tooling/data/project.db
```

Typical size:

- Fresh database: ~40 KB
- 100 snapshots: ~500 KB - 2 MB (depends on chapter length)
- 1000 snapshots: ~5-20 MB

## Troubleshooting

### Database Locked Error

**Cause:** Another process is writing to the database

**Solutions:**

1. Wait for other operation to complete
2. Close database connections in VS Code SQLite extensions
3. Kill hanging processes: `lsof src/tooling/data/project.db`

### Corrupted Database

**Cause:** Improper shutdown or disk issues

**Solutions:**

1. Run integrity check:
   ```bash
   sqlite3 src/tooling/data/project.db "PRAGMA integrity_check;"
   ```

2. If corrupted, restore from backup:
   ```bash
   cp src/tooling/data/project.db.backup src/tooling/data/project.db
   ```

3. If no backup, recover what's possible:
   ```bash
   sqlite3 src/tooling/data/project.db ".recover" | sqlite3 recovered.db
   ```

### Missing Snapshots

**Cause:** Hooks didn't run or failed

**Solutions:**

1. Verify hooks are installed: `ls -la .husky/`
2. Re-run setup: `pnpm setup`
3. Manually create snapshot:
   ```typescript
   const db = getDatabase();
   await db.snapshots.createChapterSnapshot('path/to/file.md', 'git');
   ```

### WAL Files Not Cleaned Up

**Cause:** Database not properly closed

**Solutions:**

1. Checkpoint WAL:
   ```bash
   sqlite3 src/tooling/data/project.db "PRAGMA wal_checkpoint(FULL);"
   ```

2. Temporary - safe to ignore (auto-cleaned on next operation)

## Advanced Usage

### Custom Queries

Access the raw SQLite database for complex queries:

```typescript
import { getDatabase } from '@razorweave/tooling/database';

const db = getDatabase();
const rawDb = db['db']; // Access internal Database instance

const rows = rawDb.prepare(`
  SELECT
    chapter_path,
    COUNT(*) as version_count,
    MAX(created_at) as last_updated
  FROM chapter_versions
  WHERE book_path = ?
  GROUP BY chapter_path
  ORDER BY last_updated DESC
`).all('books/core-rulebook');

console.log(rows);
```

### Archiving Old Data

Soft-delete old snapshots:

```typescript
const db = getDatabase();
const rawDb = db['db'];

// Archive snapshots older than 90 days
rawDb.prepare(`
  UPDATE chapter_versions
  SET archived = TRUE, archived_at = CURRENT_TIMESTAMP
  WHERE created_at < datetime('now', '-90 days')
    AND archived = FALSE
`).run();
```

### Exporting Data

Export snapshots to JSON:

```typescript
import { writeFileSync } from 'fs';

const db = getDatabase();
const history = db.snapshots.getChapterHistory('books/core-rulebook/chapter-1.md');

const export_data = history.map(v => ({
  timestamp: v.created_at,
  source: v.source,
  commit: v.commit_sha,
  content_length: v.content.length,
  hash: v.file_hash
}));

writeFileSync('chapter-1-history.json', JSON.stringify(export_data, null, 2));
```

## Related Documentation

- **[Git Hooks](GIT_HOOKS.md)** - How hooks create snapshots automatically
- **[Project Database Design](../plans/2025-11-18-project-database-design.md)** - Design decisions and architecture
- **[Getting Started](../GETTING_STARTED.md)** - Initial setup including database

## Summary

The Razorweave project database:

- ✅ Automatically tracks all chapter changes via git hooks
- ✅ Provides point-in-time recovery for any chapter
- ✅ Links content snapshots to git commits
- ✅ Stores project metadata in key-value store
- ✅ Accessible via TypeScript API or direct SQL
- ✅ Self-contained SQLite file for easy backup

Use it to maintain comprehensive content history, recover from mistakes, and analyze editing patterns over time.
