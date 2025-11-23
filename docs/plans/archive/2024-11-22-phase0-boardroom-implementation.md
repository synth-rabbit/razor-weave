# Phase 0: Boardroom Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Boardroom system - event sourcing, database schema, CLI commands, and VP agent infrastructure.

**Architecture:** Event-sourced database with append-only JSONL logs, materialized SQLite views, CLI commands that output structured instructions for Claude Code orchestration, and VP agent prompts invoked via subagents.

**Tech Stack:** TypeScript, SQLite (better-sqlite3), JSONL event logs, Vitest for testing, pnpm scripts for CLI.

---

## Tier 0: Event Sourcing Infrastructure

### Task 1: Event Writer Types

**Files:**
- Create: `src/tooling/events/types.ts`
- Test: `src/tooling/events/types.test.ts`

**Step 1: Write the type definitions**

```typescript
// src/tooling/events/types.ts
export type EventOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface BaseEvent {
  id: string;
  ts: string;           // ISO timestamp
  worktree: string;     // worktree identifier
  table: string;        // target table name
  op: EventOperation;   // operation type
}

export interface InsertEvent extends BaseEvent {
  op: 'INSERT';
  data: Record<string, unknown>;
}

export interface UpdateEvent extends BaseEvent {
  op: 'UPDATE';
  key: string;          // primary key value
  data: Record<string, unknown>;
}

export interface DeleteEvent extends BaseEvent {
  op: 'DELETE';
  key: string;          // primary key value
}

export type DatabaseEvent = InsertEvent | UpdateEvent | DeleteEvent;

export interface EventFile {
  path: string;
  sessionId: string;
  date: string;
  events: DatabaseEvent[];
}
```

**Step 2: Write type tests**

```typescript
// src/tooling/events/types.test.ts
import { describe, it, expect } from 'vitest';
import type { DatabaseEvent, InsertEvent, UpdateEvent, DeleteEvent } from './types';

describe('Event Types', () => {
  it('should accept valid INSERT event', () => {
    const event: InsertEvent = {
      id: 'evt_001',
      ts: '2024-11-22T10:00:00Z',
      worktree: 'main',
      table: 'vp_plans',
      op: 'INSERT',
      data: { name: 'test' }
    };
    expect(event.op).toBe('INSERT');
  });

  it('should accept valid UPDATE event', () => {
    const event: UpdateEvent = {
      id: 'evt_002',
      ts: '2024-11-22T10:00:00Z',
      worktree: 'main',
      table: 'vp_plans',
      op: 'UPDATE',
      key: 'plan_001',
      data: { name: 'updated' }
    };
    expect(event.op).toBe('UPDATE');
  });

  it('should accept valid DELETE event', () => {
    const event: DeleteEvent = {
      id: 'evt_003',
      ts: '2024-11-22T10:00:00Z',
      worktree: 'main',
      table: 'vp_plans',
      op: 'DELETE',
      key: 'plan_001'
    };
    expect(event.op).toBe('DELETE');
  });

  it('should work with DatabaseEvent union type', () => {
    const events: DatabaseEvent[] = [
      { id: '1', ts: '', worktree: '', table: 't', op: 'INSERT', data: {} },
      { id: '2', ts: '', worktree: '', table: 't', op: 'UPDATE', key: 'k', data: {} },
      { id: '3', ts: '', worktree: '', table: 't', op: 'DELETE', key: 'k' }
    ];
    expect(events).toHaveLength(3);
  });
});
```

**Step 3: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/events/types.test.ts`
Expected: PASS (4 tests)

**Step 4: Commit**

```bash
git add src/tooling/events/types.ts src/tooling/events/types.test.ts
git commit -m "feat(events): add event type definitions for event sourcing"
```

---

### Task 2: Event Writer Implementation

**Files:**
- Create: `src/tooling/events/writer.ts`
- Test: `src/tooling/events/writer.test.ts`

**Step 1: Write the failing test**

```typescript
// src/tooling/events/writer.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventWriter } from './writer';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_DIR = 'data/test-events';

describe('EventWriter', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('should create event file with correct naming', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    writer.write('vp_plans', 'INSERT', { name: 'test' });

    const files = require('fs').readdirSync(TEST_DIR);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^\d{4}-\d{2}-\d{2}-test-session\.jsonl$/);
  });

  it('should write valid JSONL format', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    writer.write('vp_plans', 'INSERT', { name: 'test' });

    const files = require('fs').readdirSync(TEST_DIR);
    const content = readFileSync(join(TEST_DIR, files[0]), 'utf-8');
    const event = JSON.parse(content.trim());

    expect(event.table).toBe('vp_plans');
    expect(event.op).toBe('INSERT');
    expect(event.data.name).toBe('test');
    expect(event.worktree).toBe('main');
  });

  it('should append multiple events to same file', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });
    writer.write('phases', 'INSERT', { id: '2' });

    const files = require('fs').readdirSync(TEST_DIR);
    expect(files).toHaveLength(1);

    const content = readFileSync(join(TEST_DIR, files[0]), 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('should include timestamp in events', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    const before = new Date().toISOString();
    writer.write('vp_plans', 'INSERT', { name: 'test' });
    const after = new Date().toISOString();

    const files = require('fs').readdirSync(TEST_DIR);
    const content = readFileSync(join(TEST_DIR, files[0]), 'utf-8');
    const event = JSON.parse(content.trim());

    expect(event.ts >= before).toBe(true);
    expect(event.ts <= after).toBe(true);
  });

  it('should generate unique event IDs', () => {
    const writer = new EventWriter(TEST_DIR, 'test-session', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });
    writer.write('vp_plans', 'INSERT', { id: '2' });

    const files = require('fs').readdirSync(TEST_DIR);
    const content = readFileSync(join(TEST_DIR, files[0]), 'utf-8');
    const lines = content.trim().split('\n');
    const event1 = JSON.parse(lines[0]);
    const event2 = JSON.parse(lines[1]);

    expect(event1.id).not.toBe(event2.id);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/events/writer.test.ts`
Expected: FAIL with "Cannot find module './writer'"

**Step 3: Write minimal implementation**

```typescript
// src/tooling/events/writer.ts
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { DatabaseEvent, EventOperation } from './types';

export class EventWriter {
  private readonly eventsDir: string;
  private readonly sessionId: string;
  private readonly worktree: string;
  private readonly filePath: string;

  constructor(eventsDir: string, sessionId: string, worktree: string) {
    this.eventsDir = eventsDir;
    this.sessionId = sessionId;
    this.worktree = worktree;

    // Ensure directory exists
    if (!existsSync(eventsDir)) {
      mkdirSync(eventsDir, { recursive: true });
    }

    // Generate file path with date prefix
    const date = new Date().toISOString().split('T')[0];
    this.filePath = join(eventsDir, `${date}-${sessionId}.jsonl`);
  }

  write(
    table: string,
    op: 'INSERT',
    data: Record<string, unknown>
  ): void;
  write(
    table: string,
    op: 'UPDATE' | 'DELETE',
    data: Record<string, unknown>,
    key: string
  ): void;
  write(
    table: string,
    op: EventOperation,
    data: Record<string, unknown>,
    key?: string
  ): void {
    const baseEvent = {
      id: `evt_${randomUUID().slice(0, 8)}`,
      ts: new Date().toISOString(),
      worktree: this.worktree,
      table,
      op,
    };

    let event: DatabaseEvent;
    if (op === 'INSERT') {
      event = { ...baseEvent, op: 'INSERT', data };
    } else if (op === 'UPDATE') {
      event = { ...baseEvent, op: 'UPDATE', key: key!, data };
    } else {
      event = { ...baseEvent, op: 'DELETE', key: key! };
    }

    appendFileSync(this.filePath, JSON.stringify(event) + '\n');
  }

  getFilePath(): string {
    return this.filePath;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/events/writer.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/tooling/events/writer.ts src/tooling/events/writer.test.ts
git commit -m "feat(events): add EventWriter for append-only event logs"
```

---

### Task 3: Event Reader Implementation

**Files:**
- Create: `src/tooling/events/reader.ts`
- Test: `src/tooling/events/reader.test.ts`

**Step 1: Write the failing test**

```typescript
// src/tooling/events/reader.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventReader } from './reader';
import { EventWriter } from './writer';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEST_DIR = 'data/test-events-reader';

describe('EventReader', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('should read all events from directory', () => {
    const writer = new EventWriter(TEST_DIR, 'session1', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });
    writer.write('phases', 'INSERT', { id: '2' });

    const reader = new EventReader(TEST_DIR);
    const events = reader.readAll();

    expect(events).toHaveLength(2);
  });

  it('should read events in chronological order', () => {
    // Create two files with different dates
    writeFileSync(
      join(TEST_DIR, '2024-01-01-old.jsonl'),
      '{"id":"1","ts":"2024-01-01T00:00:00Z","worktree":"main","table":"t","op":"INSERT","data":{}}\n'
    );
    writeFileSync(
      join(TEST_DIR, '2024-01-02-new.jsonl'),
      '{"id":"2","ts":"2024-01-02T00:00:00Z","worktree":"main","table":"t","op":"INSERT","data":{}}\n'
    );

    const reader = new EventReader(TEST_DIR);
    const events = reader.readAll();

    expect(events[0].id).toBe('1');
    expect(events[1].id).toBe('2');
  });

  it('should filter events by table', () => {
    const writer = new EventWriter(TEST_DIR, 'session1', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });
    writer.write('phases', 'INSERT', { id: '2' });
    writer.write('vp_plans', 'INSERT', { id: '3' });

    const reader = new EventReader(TEST_DIR);
    const events = reader.readByTable('vp_plans');

    expect(events).toHaveLength(2);
    expect(events.every(e => e.table === 'vp_plans')).toBe(true);
  });

  it('should return empty array for empty directory', () => {
    const reader = new EventReader(TEST_DIR);
    const events = reader.readAll();

    expect(events).toEqual([]);
  });

  it('should skip non-jsonl files', () => {
    writeFileSync(join(TEST_DIR, 'readme.txt'), 'ignore me');
    const writer = new EventWriter(TEST_DIR, 'session1', 'main');
    writer.write('vp_plans', 'INSERT', { id: '1' });

    const reader = new EventReader(TEST_DIR);
    const events = reader.readAll();

    expect(events).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/events/reader.test.ts`
Expected: FAIL with "Cannot find module './reader'"

**Step 3: Write minimal implementation**

```typescript
// src/tooling/events/reader.ts
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { DatabaseEvent } from './types';

export class EventReader {
  private readonly eventsDir: string;

  constructor(eventsDir: string) {
    this.eventsDir = eventsDir;
  }

  readAll(): DatabaseEvent[] {
    if (!existsSync(this.eventsDir)) {
      return [];
    }

    const files = readdirSync(this.eventsDir)
      .filter(f => f.endsWith('.jsonl'))
      .sort(); // Alphabetical = chronological with YYYY-MM-DD prefix

    const events: DatabaseEvent[] = [];

    for (const file of files) {
      const content = readFileSync(join(this.eventsDir, file), 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        events.push(JSON.parse(line) as DatabaseEvent);
      }
    }

    return events;
  }

  readByTable(table: string): DatabaseEvent[] {
    return this.readAll().filter(e => e.table === table);
  }

  readBySession(sessionId: string): DatabaseEvent[] {
    if (!existsSync(this.eventsDir)) {
      return [];
    }

    const files = readdirSync(this.eventsDir)
      .filter(f => f.endsWith('.jsonl') && f.includes(sessionId))
      .sort();

    const events: DatabaseEvent[] = [];

    for (const file of files) {
      const content = readFileSync(join(this.eventsDir, file), 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        events.push(JSON.parse(line) as DatabaseEvent);
      }
    }

    return events;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/events/reader.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/tooling/events/reader.ts src/tooling/events/reader.test.ts
git commit -m "feat(events): add EventReader for reading event logs"
```

---

### Task 4: DB Materializer Implementation

**Files:**
- Create: `src/tooling/events/materializer.ts`
- Test: `src/tooling/events/materializer.test.ts`

**Step 1: Write the failing test**

```typescript
// src/tooling/events/materializer.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Materializer } from './materializer';
import { EventWriter } from './writer';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, rmSync, copyFileSync } from 'fs';

const TEST_EVENTS_DIR = 'data/test-materialize-events';
const TEST_DB = 'data/test-materialize.db';
const TEST_BACKUP = 'data/test-materialize.db.backup';

describe('Materializer', () => {
  beforeEach(() => {
    // Clean up
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB)) rmSync(TEST_DB);
    if (existsSync(TEST_BACKUP)) rmSync(TEST_BACKUP);
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB)) rmSync(TEST_DB);
    if (existsSync(TEST_BACKUP)) rmSync(TEST_BACKUP);
  });

  it('should create database from events', () => {
    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'test' });

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');
    materializer.materialize();

    expect(existsSync(TEST_DB)).toBe(true);

    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM test_table').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect((rows[0] as any).name).toBe('test');
  });

  it('should handle UPDATE events', () => {
    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'original' });
    writer.write('test_table', 'UPDATE', { name: 'updated' }, '1');

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');
    materializer.materialize();

    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM test_table').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect((rows[0] as any).name).toBe('updated');
  });

  it('should handle DELETE events', () => {
    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'test' });
    writer.write('test_table', 'DELETE', {}, '1');

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');
    materializer.materialize();

    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM test_table').all();
    db.close();

    expect(rows).toHaveLength(0);
  });

  it('should create backup before materialize if DB exists', () => {
    // Create initial DB
    const db = new Database(TEST_DB);
    db.exec('CREATE TABLE test (id TEXT)');
    db.exec("INSERT INTO test VALUES ('old')");
    db.close();

    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'new' });

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');
    materializer.materialize();

    expect(existsSync(TEST_BACKUP)).toBe(true);

    // Verify backup has old data
    const backupDb = new Database(TEST_BACKUP);
    const oldRows = backupDb.prepare('SELECT * FROM test').all();
    backupDb.close();

    expect(oldRows).toHaveLength(1);
    expect((oldRows[0] as any).id).toBe('old');
  });

  it('should be idempotent - same result on multiple runs', () => {
    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'test' });

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');

    // Run twice
    materializer.materialize();
    materializer.materialize();

    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM test_table').all();
    db.close();

    expect(rows).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/events/materializer.test.ts`
Expected: FAIL with "Cannot find module './materializer'"

**Step 3: Write minimal implementation**

```typescript
// src/tooling/events/materializer.ts
import { existsSync, copyFileSync, rmSync } from 'fs';
import Database from 'better-sqlite3';
import { EventReader } from './reader';
import type { DatabaseEvent, InsertEvent, UpdateEvent, DeleteEvent } from './types';

interface TableConfig {
  name: string;
  primaryKey: string;
}

export class Materializer {
  private readonly eventsDir: string;
  private readonly dbPath: string;
  private readonly tables: Map<string, TableConfig> = new Map();

  constructor(eventsDir: string, dbPath: string) {
    this.eventsDir = eventsDir;
    this.dbPath = dbPath;
  }

  registerTable(name: string, primaryKey: string): void {
    this.tables.set(name, { name, primaryKey });
  }

  materialize(): void {
    // Backup existing DB
    if (existsSync(this.dbPath)) {
      copyFileSync(this.dbPath, `${this.dbPath}.backup`);
      rmSync(this.dbPath);
    }

    // Read all events
    const reader = new EventReader(this.eventsDir);
    const events = reader.readAll();

    // Create new DB and apply events
    const db = new Database(this.dbPath);

    try {
      // Process events by table
      const tableEvents = new Map<string, DatabaseEvent[]>();
      for (const event of events) {
        if (!tableEvents.has(event.table)) {
          tableEvents.set(event.table, []);
        }
        tableEvents.get(event.table)!.push(event);
      }

      // Create tables and apply events
      for (const [tableName, tableEventList] of tableEvents) {
        const config = this.tables.get(tableName);
        if (!config) continue;

        // Infer schema from INSERT events
        const insertEvent = tableEventList.find(e => e.op === 'INSERT') as InsertEvent | undefined;
        if (!insertEvent) continue;

        const columns = Object.keys(insertEvent.data);
        const createSql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.map(c => `${c} TEXT`).join(', ')})`;
        db.exec(createSql);

        // Apply events in order
        for (const event of tableEventList) {
          this.applyEvent(db, event, config);
        }
      }
    } finally {
      db.close();
    }
  }

  private applyEvent(db: Database.Database, event: DatabaseEvent, config: TableConfig): void {
    if (event.op === 'INSERT') {
      const insertEvent = event as InsertEvent;
      const columns = Object.keys(insertEvent.data);
      const values = columns.map(c => insertEvent.data[c]);
      const placeholders = columns.map(() => '?').join(', ');

      db.prepare(`INSERT OR REPLACE INTO ${event.table} (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
    } else if (event.op === 'UPDATE') {
      const updateEvent = event as UpdateEvent;
      const columns = Object.keys(updateEvent.data);
      const setClauses = columns.map(c => `${c} = ?`).join(', ');
      const values = [...columns.map(c => updateEvent.data[c]), updateEvent.key];

      db.prepare(`UPDATE ${event.table} SET ${setClauses} WHERE ${config.primaryKey} = ?`).run(...values);
    } else if (event.op === 'DELETE') {
      const deleteEvent = event as DeleteEvent;
      db.prepare(`DELETE FROM ${event.table} WHERE ${config.primaryKey} = ?`).run(deleteEvent.key);
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/events/materializer.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/tooling/events/materializer.ts src/tooling/events/materializer.test.ts
git commit -m "feat(events): add Materializer for rebuilding DB from events"
```

---

### Task 5: Event Index Module

**Files:**
- Create: `src/tooling/events/index.ts`

**Step 1: Create the barrel export**

```typescript
// src/tooling/events/index.ts
export * from './types';
export * from './writer';
export * from './reader';
export * from './materializer';
```

**Step 2: Commit**

```bash
git add src/tooling/events/index.ts
git commit -m "feat(events): add barrel export for events module"
```

---

### Task 6: DB Materialize CLI Command

**Files:**
- Create: `src/tooling/cli-commands/db-materialize.ts`
- Test: `src/tooling/cli-commands/db-materialize.test.ts`
- Modify: `package.json` - add script

**Step 1: Write the failing test**

```typescript
// src/tooling/cli-commands/db-materialize.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import Database from 'better-sqlite3';

const TEST_EVENTS_DIR = 'data/test-cli-events';
const TEST_DB = 'data/test-cli.db';

describe('db:materialize CLI', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB)) rmSync(TEST_DB);
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB)) rmSync(TEST_DB);
    if (existsSync(`${TEST_DB}.backup`)) rmSync(`${TEST_DB}.backup`);
  });

  it('should materialize events into database', () => {
    // Create test event
    writeFileSync(
      `${TEST_EVENTS_DIR}/2024-11-22-test.jsonl`,
      '{"id":"1","ts":"2024-11-22T00:00:00Z","worktree":"main","table":"boardroom_sessions","op":"INSERT","data":{"id":"sess_1","proposal_path":"test.md","status":"active"}}\n'
    );

    // Run CLI
    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${TEST_EVENTS_DIR} --db ${TEST_DB}`, {
      encoding: 'utf-8'
    });

    // Verify DB
    expect(existsSync(TEST_DB)).toBe(true);
    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM boardroom_sessions').all();
    db.close();

    expect(rows).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/cli-commands/db-materialize.test.ts`
Expected: FAIL

**Step 3: Write CLI implementation**

```typescript
// src/tooling/cli-commands/db-materialize.ts
import { Materializer } from '../events/materializer';
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    events: { type: 'string', default: 'data/events' },
    db: { type: 'string', default: 'data/project.db' },
  },
});

const eventsDir = values.events!;
const dbPath = values.db!;

console.log('═══════════════════════════════════════════════════════════');
console.log('DB MATERIALIZE');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Events directory: ${eventsDir}`);
console.log(`Database path: ${dbPath}`);
console.log('');

const materializer = new Materializer(eventsDir, dbPath);

// Register all boardroom tables
materializer.registerTable('boardroom_sessions', 'id');
materializer.registerTable('vp_plans', 'id');
materializer.registerTable('phases', 'id');
materializer.registerTable('milestones', 'id');
materializer.registerTable('engineering_tasks', 'id');
materializer.registerTable('ceo_feedback', 'id');
materializer.registerTable('brainstorm_opinions', 'id');
materializer.registerTable('vp_consultations', 'id');

try {
  materializer.materialize();
  console.log('───────────────────────────────────────────────────────────');
  console.log('STATUS');
  console.log('───────────────────────────────────────────────────────────');
  console.log('✓ Database materialized successfully');
  console.log(`✓ Output: ${dbPath}`);
} catch (error) {
  console.error('✗ Materialization failed:', error);
  process.exit(1);
}
```

**Step 4: Add script to package.json**

Add to scripts section:
```json
"db:materialize": "tsx src/tooling/cli-commands/db-materialize.ts"
```

**Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/cli-commands/db-materialize.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/tooling/cli-commands/db-materialize.ts src/tooling/cli-commands/db-materialize.test.ts package.json
git commit -m "feat(cli): add db:materialize command for event sourcing"
```

---

## Tier 1: Boardroom Database Schema

### Task 7: Boardroom Schema Types

**Files:**
- Create: `src/tooling/boardroom/types.ts`
- Test: `src/tooling/boardroom/types.test.ts`

**Step 1: Write type definitions**

```typescript
// src/tooling/boardroom/types.ts
export type SessionStatus = 'active' | 'completed' | 'cancelled';
export type VPType = 'product' | 'engineering' | 'ops';
export type PlanStatus = 'draft' | 'reviewed' | 'approved';

export interface BoardroomSession {
  id: string;
  proposal_path: string;
  status: SessionStatus;
  created_at: string;
  completed_at: string | null;
}

export interface VPPlan {
  id: string;
  session_id: string;
  vp_type: VPType;
  status: PlanStatus;
  plan_path: string | null;
  created_at: string;
}

export interface Phase {
  id: string;
  plan_id: string;
  name: string;
  description: string | null;
  sequence: number;
  acceptance_criteria: string; // JSON array
}

export interface Milestone {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  sequence: number;
}

export interface EngineeringTask {
  id: string;
  plan_id: string;
  milestone_id: string;
  description: string;
  file_paths: string | null; // JSON array
  dependencies: string | null; // JSON array
}

export interface CEOFeedback {
  id: string;
  plan_id: string;
  feedback: string;
  created_at: string;
}

export interface BrainstormOpinion {
  id: string;
  session_id: string;
  question: string;
  options: string; // JSON array
  vp_ops_perspective: string;
  blockers: string | null; // JSON array
  ceo_decision: string;
  override_reasoning: string | null;
  created_at: string;
}

export interface VPConsultation {
  id: string;
  session_id: string;
  sprint_id: string | null;
  vp_type: VPType;
  question: string;
  context: string | null; // JSON
  response: string;
  outcome: string | null;
  created_at: string;
}
```

**Step 2: Write type tests**

```typescript
// src/tooling/boardroom/types.test.ts
import { describe, it, expect } from 'vitest';
import type { BoardroomSession, VPPlan, Phase, VPType } from './types';

describe('Boardroom Types', () => {
  it('should accept valid BoardroomSession', () => {
    const session: BoardroomSession = {
      id: 'sess_001',
      proposal_path: 'docs/plans/proposals/test.md',
      status: 'active',
      created_at: '2024-11-22T10:00:00Z',
      completed_at: null
    };
    expect(session.status).toBe('active');
  });

  it('should accept valid VPPlan', () => {
    const plan: VPPlan = {
      id: 'plan_001',
      session_id: 'sess_001',
      vp_type: 'product',
      status: 'draft',
      plan_path: null,
      created_at: '2024-11-22T10:00:00Z'
    };
    expect(plan.vp_type).toBe('product');
  });

  it('should enforce VPType union', () => {
    const types: VPType[] = ['product', 'engineering', 'ops'];
    expect(types).toHaveLength(3);
  });

  it('should accept valid Phase with JSON acceptance_criteria', () => {
    const phase: Phase = {
      id: 'phase_001',
      plan_id: 'plan_001',
      name: 'Phase 1',
      description: 'First phase',
      sequence: 1,
      acceptance_criteria: JSON.stringify(['criterion 1', 'criterion 2'])
    };
    expect(JSON.parse(phase.acceptance_criteria)).toHaveLength(2);
  });
});
```

**Step 3: Run test**

Run: `pnpm vitest run src/tooling/boardroom/types.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/tooling/boardroom/types.ts src/tooling/boardroom/types.test.ts
git commit -m "feat(boardroom): add TypeScript type definitions"
```

---

### Task 8: Boardroom Client Implementation

**Files:**
- Create: `src/tooling/boardroom/client.ts`
- Test: `src/tooling/boardroom/client.test.ts`

**Step 1: Write the failing test**

```typescript
// src/tooling/boardroom/client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BoardroomClient } from './client';
import { existsSync, mkdirSync, rmSync } from 'fs';

const TEST_EVENTS_DIR = 'data/test-boardroom-events';

describe('BoardroomClient', () => {
  let client: BoardroomClient;

  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
    client = new BoardroomClient(TEST_EVENTS_DIR, 'test-session', 'main');
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
  });

  describe('createSession', () => {
    it('should create a boardroom session', () => {
      const session = client.createSession('docs/plans/proposals/test.md');

      expect(session.id).toMatch(/^sess_/);
      expect(session.proposal_path).toBe('docs/plans/proposals/test.md');
      expect(session.status).toBe('active');
    });
  });

  describe('createVPPlan', () => {
    it('should create a VP plan', () => {
      const session = client.createSession('test.md');
      const plan = client.createVPPlan(session.id, 'product');

      expect(plan.id).toMatch(/^plan_/);
      expect(plan.session_id).toBe(session.id);
      expect(plan.vp_type).toBe('product');
      expect(plan.status).toBe('draft');
    });
  });

  describe('createPhase', () => {
    it('should create a phase', () => {
      const session = client.createSession('test.md');
      const plan = client.createVPPlan(session.id, 'product');
      const phase = client.createPhase(plan.id, 'Phase 1', 'Description', 1, ['criterion']);

      expect(phase.id).toMatch(/^phase_/);
      expect(phase.plan_id).toBe(plan.id);
      expect(phase.name).toBe('Phase 1');
    });
  });

  describe('addCEOFeedback', () => {
    it('should add CEO feedback to a plan', () => {
      const session = client.createSession('test.md');
      const plan = client.createVPPlan(session.id, 'product');
      const feedback = client.addCEOFeedback(plan.id, 'Looks good, proceed');

      expect(feedback.id).toMatch(/^fb_/);
      expect(feedback.plan_id).toBe(plan.id);
      expect(feedback.feedback).toBe('Looks good, proceed');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/boardroom/client.test.ts`
Expected: FAIL with "Cannot find module './client'"

**Step 3: Write implementation**

```typescript
// src/tooling/boardroom/client.ts
import { randomUUID } from 'crypto';
import { EventWriter } from '../events/writer';
import type {
  BoardroomSession,
  VPPlan,
  Phase,
  Milestone,
  EngineeringTask,
  CEOFeedback,
  BrainstormOpinion,
  VPConsultation,
  VPType
} from './types';

export class BoardroomClient {
  private writer: EventWriter;

  constructor(eventsDir: string, sessionId: string, worktree: string) {
    this.writer = new EventWriter(eventsDir, sessionId, worktree);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID().slice(0, 8)}`;
  }

  createSession(proposalPath: string): BoardroomSession {
    const session: BoardroomSession = {
      id: this.generateId('sess'),
      proposal_path: proposalPath,
      status: 'active',
      created_at: new Date().toISOString(),
      completed_at: null
    };

    this.writer.write('boardroom_sessions', 'INSERT', session as unknown as Record<string, unknown>);
    return session;
  }

  createVPPlan(sessionId: string, vpType: VPType): VPPlan {
    const plan: VPPlan = {
      id: this.generateId('plan'),
      session_id: sessionId,
      vp_type: vpType,
      status: 'draft',
      plan_path: null,
      created_at: new Date().toISOString()
    };

    this.writer.write('vp_plans', 'INSERT', plan as unknown as Record<string, unknown>);
    return plan;
  }

  updateVPPlanStatus(planId: string, status: 'reviewed' | 'approved', planPath?: string): void {
    const data: Record<string, unknown> = { status };
    if (planPath) data.plan_path = planPath;

    this.writer.write('vp_plans', 'UPDATE', data, planId);
  }

  createPhase(
    planId: string,
    name: string,
    description: string | null,
    sequence: number,
    acceptanceCriteria: string[]
  ): Phase {
    const phase: Phase = {
      id: this.generateId('phase'),
      plan_id: planId,
      name,
      description,
      sequence,
      acceptance_criteria: JSON.stringify(acceptanceCriteria)
    };

    this.writer.write('phases', 'INSERT', phase as unknown as Record<string, unknown>);
    return phase;
  }

  createMilestone(phaseId: string, name: string, description: string | null, sequence: number): Milestone {
    const milestone: Milestone = {
      id: this.generateId('ms'),
      phase_id: phaseId,
      name,
      description,
      sequence
    };

    this.writer.write('milestones', 'INSERT', milestone as unknown as Record<string, unknown>);
    return milestone;
  }

  createEngineeringTask(
    planId: string,
    milestoneId: string,
    description: string,
    filePaths?: string[],
    dependencies?: string[]
  ): EngineeringTask {
    const task: EngineeringTask = {
      id: this.generateId('task'),
      plan_id: planId,
      milestone_id: milestoneId,
      description,
      file_paths: filePaths ? JSON.stringify(filePaths) : null,
      dependencies: dependencies ? JSON.stringify(dependencies) : null
    };

    this.writer.write('engineering_tasks', 'INSERT', task as unknown as Record<string, unknown>);
    return task;
  }

  addCEOFeedback(planId: string, feedback: string): CEOFeedback {
    const fb: CEOFeedback = {
      id: this.generateId('fb'),
      plan_id: planId,
      feedback,
      created_at: new Date().toISOString()
    };

    this.writer.write('ceo_feedback', 'INSERT', fb as unknown as Record<string, unknown>);
    return fb;
  }

  recordBrainstormOpinion(
    sessionId: string,
    question: string,
    options: string[],
    vpOpsPerspective: string,
    blockers: string[] | null,
    ceoDecision: string,
    overrideReasoning: string | null
  ): BrainstormOpinion {
    const opinion: BrainstormOpinion = {
      id: this.generateId('op'),
      session_id: sessionId,
      question,
      options: JSON.stringify(options),
      vp_ops_perspective: vpOpsPerspective,
      blockers: blockers ? JSON.stringify(blockers) : null,
      ceo_decision: ceoDecision,
      override_reasoning: overrideReasoning,
      created_at: new Date().toISOString()
    };

    this.writer.write('brainstorm_opinions', 'INSERT', opinion as unknown as Record<string, unknown>);
    return opinion;
  }

  recordVPConsultation(
    sessionId: string,
    sprintId: string | null,
    vpType: VPType,
    question: string,
    context: Record<string, unknown> | null,
    response: string,
    outcome: string | null
  ): VPConsultation {
    const consultation: VPConsultation = {
      id: this.generateId('cons'),
      session_id: sessionId,
      sprint_id: sprintId,
      vp_type: vpType,
      question,
      context: context ? JSON.stringify(context) : null,
      response,
      outcome,
      created_at: new Date().toISOString()
    };

    this.writer.write('vp_consultations', 'INSERT', consultation as unknown as Record<string, unknown>);
    return consultation;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/boardroom/client.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/tooling/boardroom/client.ts src/tooling/boardroom/client.test.ts
git commit -m "feat(boardroom): add BoardroomClient for event-based writes"
```

---

### Task 9: Boardroom Index Module

**Files:**
- Create: `src/tooling/boardroom/index.ts`

**Step 1: Create barrel export**

```typescript
// src/tooling/boardroom/index.ts
export * from './types';
export * from './client';
```

**Step 2: Commit**

```bash
git add src/tooling/boardroom/index.ts
git commit -m "feat(boardroom): add barrel export"
```

---

## Remaining Tasks (Summary)

The following tasks follow the same TDD pattern:

### Tier 2: CLI Infrastructure
- **Task 10:** CLI Output Formatter utility
- **Task 11:** Session Manager utility

### Tier 3: VP Agent Foundations
- **Task 12:** VP Product prompt template
- **Task 13:** VP Engineering prompt template
- **Task 14:** VP Operations prompt template
- **Task 15:** VP Agent Invoker

### Tier 4: Boardroom CLI Commands
- **Task 16:** `boardroom:vp-product` command
- **Task 17:** `boardroom:vp-engineering` command
- **Task 18:** `boardroom:vp-ops` command
- **Task 19:** `boardroom:approve` command
- **Task 20:** `boardroom:status` command

### Tier 5: Plan Generation
- **Task 21:** Markdown generator from DB
- **Task 22:** Plan template system

---

**Plan complete and saved to `docs/plans/2024-11-22-phase0-boardroom-implementation.md`**

---

## Execution Handoff

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session in worktree with executing-plans, batch execution with checkpoints

**Which approach?**
