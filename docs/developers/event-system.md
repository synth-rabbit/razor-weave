# Event System Developer Guide

This document describes the event sourcing architecture used by Razorweave for persistent data management across worktrees.

## Overview

The event system implements an event sourcing pattern where all state changes are captured as immutable events in JSONL files. These events can be replayed (materialized) to reconstruct the current state in SQLite for querying.

Key benefits:

- **Worktree Safety**: Each git worktree writes to isolated event files, preventing SQLite lock conflicts
- **Auditability**: Complete history of all changes is preserved
- **Recovery**: State can be reconstructed from events at any point
- **Merge Safety**: JSONL files merge cleanly in git (append-only)

## Architecture

```
                                   WRITE PATH
                                   ----------
    BoardroomClient ──────────────────────────────────────────────┐
    SessionManager                                                │
    (or any client)                                               v
          │                                               ┌──────────────┐
          │                                               │  EventWriter │
          │ write(table, op, data)                        │              │
          └──────────────────────────────────────────────>│  - Generates │
                                                          │    event ID  │
                                                          │  - Adds      │
                                                          │    timestamp │
                                                          │  - Appends   │
                                                          │    to file   │
                                                          └──────┬───────┘
                                                                 │
                                                                 v
                                                   ┌──────────────────────────┐
                                                   │      JSONL Files         │
                                                   │ data/events/             │
                                                   │   YYYY-MM-DD-{sess}.jsonl│
                                                   └──────────────────────────┘


                                   READ PATH
                                   ---------
                                                   ┌──────────────────────────┐
                                                   │      JSONL Files         │
                                                   │ data/events/             │
                                                   │   YYYY-MM-DD-{sess}.jsonl│
                                                   └──────────────┬───────────┘
                                                                  │
                                                                  v
                                                          ┌──────────────┐
                                                          │  EventReader │
                                                          │              │
                                                          │  - readAll   │
                                                          │  - readByTab │
                                                          │  - readBySes │
                                                          └──────┬───────┘
                                                                 │
                                                                 v
                                                          ┌──────────────┐
                                                          │ Materializer │
                                                          │              │
                                                          │  - Replays   │
                                                          │    events    │
                                                          │  - Creates   │
                                                          │    tables    │
                                                          │  - Applies   │
                                                          │    INS/UPD/  │
                                                          │    DEL       │
                                                          └──────┬───────┘
                                                                 │
                                                                 v
                                                          ┌──────────────┐
                                                          │    SQLite    │
                                                          │   (project   │
                                                          │     .db)     │
                                                          └──────────────┘
```

## Event Format

Each event is a JSON object stored as a single line in the JSONL file:

```json
{
  "id": "evt_a1b2c3d4",
  "ts": "2025-11-23T10:30:00.000Z",
  "worktree": "feature/my-branch",
  "table": "boardroom_sessions",
  "op": "INSERT",
  "data": { ... }
}
```

### Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique event ID (format: `evt_{8-char-uuid}`) |
| `ts` | string | ISO 8601 timestamp of when event was created |
| `worktree` | string | Git branch name or worktree identifier |
| `table` | string | Target database table name |
| `op` | string | Operation type: INSERT, UPDATE, or DELETE |
| `data` | object | Event payload (varies by operation) |
| `key` | string | Primary key value (UPDATE/DELETE only) |

### Event Operations

| Operation | Description | Required Fields |
|-----------|-------------|-----------------|
| `INSERT` | Create a new record | `data` with all fields |
| `UPDATE` | Modify an existing record | `key` (PK value), `data` (fields to update) |
| `DELETE` | Remove a record | `key` (PK value) |

### Example Events

**INSERT Event:**
```json
{
  "id": "evt_a1b2c3d4",
  "ts": "2025-11-23T10:30:00.000Z",
  "worktree": "main",
  "table": "boardroom_sessions",
  "op": "INSERT",
  "data": {
    "id": "sess_12345678",
    "proposal_path": "docs/plans/proposals/w1-editing.md",
    "status": "active",
    "created_at": "2025-11-23T10:30:00.000Z",
    "completed_at": null
  }
}
```

**UPDATE Event:**
```json
{
  "id": "evt_e5f6g7h8",
  "ts": "2025-11-23T11:00:00.000Z",
  "worktree": "main",
  "table": "boardroom_sessions",
  "op": "UPDATE",
  "key": "sess_12345678",
  "data": {
    "status": "completed",
    "completed_at": "2025-11-23T11:00:00.000Z"
  }
}
```

**DELETE Event:**
```json
{
  "id": "evt_i9j0k1l2",
  "ts": "2025-11-23T12:00:00.000Z",
  "worktree": "main",
  "table": "boardroom_sessions",
  "op": "DELETE",
  "key": "sess_12345678"
}
```

## File Location Conventions

Event files are stored in `data/events/` with the naming pattern:

```
data/events/YYYY-MM-DD-{session_id}.jsonl
```

Examples:
- `data/events/2025-11-23-sess_12345678.jsonl`
- `data/events/2025-11-22-sess_abcdef01.jsonl`

The date prefix ensures:
1. Chronological ordering when sorting alphabetically
2. Easy identification of events by date
3. Simple cleanup of old events if needed

## EventWriter Usage

The `EventWriter` class handles writing events to JSONL files.

### Constructor

```typescript
import { EventWriter } from '@/tooling/events';

const writer = new EventWriter(
  eventsDir,  // Directory for event files (e.g., 'data/events')
  sessionId,  // Unique session identifier
  worktree    // Git branch name or worktree identifier
);
```

### Standard Write

```typescript
// INSERT - create a new record
writer.write('boardroom_sessions', 'INSERT', {
  id: 'sess_12345678',
  proposal_path: 'docs/plans/proposals/w1-editing.md',
  status: 'active',
  created_at: new Date().toISOString(),
  completed_at: null
});

// UPDATE - modify an existing record
writer.write('boardroom_sessions', 'UPDATE', {
  status: 'completed',
  completed_at: new Date().toISOString()
}, 'sess_12345678');  // key parameter required for UPDATE

// DELETE - remove a record
writer.write('boardroom_sessions', 'DELETE', {}, 'sess_12345678');
```

### Getting the File Path

```typescript
const filePath = writer.getFilePath();
// Returns: 'data/events/2025-11-23-sess_12345678.jsonl'
```

## EventReader Usage

The `EventReader` class handles reading events from JSONL files.

### Constructor

```typescript
import { EventReader } from '@/tooling/events';

const reader = new EventReader(eventsDir);  // e.g., 'data/events'
```

### Read All Events

Returns all events from all JSONL files, sorted chronologically:

```typescript
const events = reader.readAll();
// Returns: DatabaseEvent[]

for (const event of events) {
  console.log(`${event.table} ${event.op}: ${event.id}`);
}
```

### Read Events by Table

Filter events for a specific table:

```typescript
const sessionEvents = reader.readByTable('boardroom_sessions');
// Returns: DatabaseEvent[] filtered to table === 'boardroom_sessions'
```

### Read Events by Session

Read events from a specific session file:

```typescript
const events = reader.readBySession('sess_12345678');
// Returns: DatabaseEvent[] from files containing 'sess_12345678' in filename
```

## Materializer Usage

The `Materializer` class replays events to create/update a SQLite database.

### Constructor

```typescript
import { Materializer } from '@/tooling/events';

const materializer = new Materializer(
  eventsDir,  // Directory containing JSONL files
  dbPath      // Path for SQLite database output
);
```

### Register Tables

Before materializing, register tables with their primary keys:

```typescript
materializer.registerTable('boardroom_sessions', 'id');
materializer.registerTable('vp_plans', 'id');
materializer.registerTable('phases', 'id');
materializer.registerTable('milestones', 'id');
materializer.registerTable('engineering_tasks', 'id');
```

### Materialize Events

Replay all events to create/update the database:

```typescript
materializer.materialize();
```

The materialize process:
1. Backs up existing database (if any) to `{dbPath}.backup`
2. Reads all events chronologically
3. Creates tables based on INSERT event schemas
4. Applies all events in order (INSERT, UPDATE, DELETE)
5. Results in a queryable SQLite database

## Registered Tables Reference

The following tables are registered in the materialization process:

| Table Name | Primary Key | Description |
|------------|-------------|-------------|
| `boardroom_sessions` | `id` | Boardroom planning sessions |
| `vp_plans` | `id` | VP plans (product, engineering, ops) |
| `phases` | `id` | Project phases with acceptance criteria |
| `milestones` | `id` | Milestones within phases |
| `engineering_tasks` | `id` | Engineering tasks with dependencies |
| `ceo_feedback` | `id` | CEO feedback on plans |
| `brainstorm_opinions` | `id` | VP Ops brainstorm opinions |
| `vp_consultations` | `id` | VP consultation records |
| `execution_batches` | `id` | VP Ops execution batches |
| `operational_risks` | `id` | Identified operational risks |
| `boardroom_minutes` | `id` | Meeting minutes documents |

## CLI Commands

### Materialize Database

Replay all events to rebuild the SQLite database:

```bash
pnpm db:materialize
```

With custom paths:

```bash
pnpm db:materialize --events data/events --db data/project.db
```

## Failure Recovery

### Corrupted Database

If the SQLite database becomes corrupted:

1. Delete the database file
2. Run `pnpm db:materialize` to rebuild from events
3. The backup at `{dbPath}.backup` contains the previous state

### Missing Events

If events are lost (file deleted, disk failure):

1. Events cannot be recovered from SQLite (it's derived state)
2. Restore from git history if available
3. Or restore from backup systems

### Merge Conflicts

JSONL files are append-only and merge cleanly in git. If conflicts occur:

1. Both versions' events are valid
2. Keep all events from both branches
3. Re-materialize to apply all events

### Duplicate Events

The materialization process uses `INSERT OR REPLACE`:
- Duplicate INSERT events for the same primary key will update
- This provides idempotency for event replay

## Best Practices

1. **Always use EventWriter** - Never write to JSONL files directly
2. **Include timestamps** - Let EventWriter add `ts` automatically
3. **Use meaningful IDs** - IDs should be unique and identifiable
4. **Materialize after merges** - Run `pnpm db:materialize` after git merges
5. **Commit event files** - Event files should be tracked in git
6. **Don't modify events** - Events are immutable; use UPDATE/DELETE operations instead

## See Also

- [Boardroom Developer Guide](./boardroom.md) - BoardroomClient API documentation
- [Boardroom Workflow Guide](../workflows/boardroom.md) - Step-by-step boardroom workflow
- [Workflow Lifecycle](../workflows/lifecycle.md) - How events integrate with workflows
