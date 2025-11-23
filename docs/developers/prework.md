# Prework Developer Guide

This guide covers the technical implementation of the Razorweave workflow system for developers extending or maintaining the codebase.

## Architecture Overview

The prework system is organized into several interconnected layers:

```
+------------------+     +------------------+
|   CLI Commands   |     |   CLI Commands   |
|   (book:*)       |     |   (workflow:*)   |
+--------+---------+     +--------+---------+
         |                        |
         v                        v
+------------------+     +------------------+
|  BookRepository  |     | WorkflowRepository|
+--------+---------+     +--------+---------+
         |                        |
         +------------+-----------+
                      |
                      v
              +---------------+
              |   Database    |
              | (better-sqlite3)|
              +---------------+
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `BookRepository` | `src/tooling/books/repository.ts` | CRUD operations for books |
| `WorkflowRepository` | `src/tooling/workflows/repository.ts` | Workflow run management |
| `WorkflowStateMachine` | `src/tooling/workflows/state-machine.ts` | State transition validation |
| `CLIFormatter` | `src/tooling/cli/formatter.ts` | Consistent CLI output formatting |
| Database Schema | `src/tooling/database/schema.ts` | Base table definitions |
| Migrations | `src/tooling/database/migrations/` | Schema evolution |

## Database Schema

### Entity Relationship Diagram

```
+-------------+       +----------------+       +------------------+
|   books     |<------| workflow_runs  |------>| workflow_events  |
+-------------+       +----------------+       +------------------+
| id (PK)     |       | id (PK)        |       | id (PK)          |
| slug        |       | workflow_type  |       | workflow_run_id  |
| title       |       | book_id (FK)   |       | event_type       |
| book_type   |       | status         |       | agent_name       |
| source_path |       | current_agent  |       | data (JSON)      |
| status      |       | input_version  |       | created_at       |
| created_at  |       | output_version |       +------------------+
| updated_at  |       | session_id     |
+-------------+       | plan_id        |
                      | created_at     |
                      | updated_at     |
                      +-------+--------+
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
+------------------+ +------------------+ +------------------+
|   rejections     | | workflow_artifacts| | workflow_triggers|
+------------------+ +------------------+ +------------------+
| id (PK)          | | id (PK)          | | id (PK)          |
| workflow_run_id  | | workflow_run_id  | | name             |
| event_id (FK)    | | artifact_type    | | source_workflow  |
| rejection_type   | | artifact_path    | | target_workflow  |
| reason           | | metadata (JSON)  | | trigger_condition|
| retry_count      | | created_at       | | enabled          |
| resolved         | +------------------+ | config (JSON)    |
| created_at       |                      +------------------+
+------------------+
          |
          v
+------------------+
|   escalations    |
+------------------+
| id (PK)          |
| workflow_run_id  |
| rejection_type   |
| retry_count      |
| escalated_to     |
| reason           |
| status           |
| resolution       |
| created_at       |
| acknowledged_at  |
| resolved_at      |
+------------------+
```

### Table Details

#### books

Stores the book registry.

```sql
CREATE TABLE books (
  id TEXT PRIMARY KEY,                    -- e.g., 'book_abc12345'
  slug TEXT UNIQUE NOT NULL,              -- URL-friendly identifier
  title TEXT NOT NULL,                    -- Display title
  book_type TEXT NOT NULL,                -- 'core'|'source'|'campaign'|'supplement'
  source_path TEXT NOT NULL,              -- Path to source files
  status TEXT DEFAULT 'draft',            -- 'draft'|'editing'|'published'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### workflow_runs

Tracks individual workflow executions.

```sql
CREATE TABLE workflow_runs (
  id TEXT PRIMARY KEY,                    -- e.g., 'wfrun_m1abc_xyz789'
  workflow_type TEXT NOT NULL,            -- 'w1_editing'|'w2_pdf'|'w3_publication'|'w4_playtesting'
  book_id TEXT NOT NULL REFERENCES books(id),
  input_version_id TEXT,                  -- Source content version
  output_version_id TEXT,                 -- Produced content version
  session_id TEXT,                        -- Claude session ID
  plan_id TEXT,                           -- Associated plan ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'running'|'paused'|'completed'|'failed'
  current_agent TEXT,                     -- Currently executing agent
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### workflow_events

Records events during workflow execution.

```sql
CREATE TABLE workflow_events (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
  event_type TEXT NOT NULL,               -- 'started'|'completed'|'rejected'|'escalated'|'paused'|'resumed'
  agent_name TEXT,
  data TEXT,                              -- JSON payload
  created_at TIMESTAMP
);
```

#### rejections

Tracks content rejections with retry management.

```sql
CREATE TABLE rejections (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
  event_id TEXT REFERENCES workflow_events(id),
  rejection_type TEXT NOT NULL,           -- 'style'|'mechanics'|'clarity'|'scope'
  reason TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

#### workflow_artifacts

Stores artifacts produced by workflows.

```sql
CREATE TABLE workflow_artifacts (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,            -- See artifact types in lifecycle.md
  artifact_path TEXT NOT NULL,
  metadata TEXT,                          -- JSON
  created_at TIMESTAMP
);
```

#### workflow_triggers

Configures cross-workflow automation.

```sql
CREATE TABLE workflow_triggers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_workflow_type TEXT NOT NULL,
  target_workflow_type TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,        -- 'on_complete'|'on_approve'|'manual'
  enabled BOOLEAN DEFAULT TRUE,
  config TEXT,                            -- JSON
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### escalations

Tracks issues escalated to human review.

```sql
CREATE TABLE escalations (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
  rejection_type TEXT NOT NULL,
  retry_count INTEGER NOT NULL,
  escalated_to TEXT NOT NULL,             -- Target reviewer role
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'acknowledged'|'resolved'
  resolution TEXT,
  created_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP
);
```

## Adding New Workflow Types

To add a new workflow type (e.g., `w5_localization`):

### Step 1: Update Type Definitions

Edit `src/tooling/workflows/types.ts`:

```typescript
// Add to WorkflowType union
export type WorkflowType =
  | 'w1_editing'
  | 'w2_pdf'
  | 'w3_publication'
  | 'w4_playtesting'
  | 'w5_localization';  // <-- Add new type

// Add to WORKFLOW_TYPES array
export const WORKFLOW_TYPES: readonly WorkflowType[] = [
  'w1_editing',
  'w2_pdf',
  'w3_publication',
  'w4_playtesting',
  'w5_localization',  // <-- Add here
] as const;
```

### Step 2: Create Database Migration

Create a new migration file `src/tooling/database/migrations/007_w5_localization.sql`:

```sql
-- Migration: 007_w5_localization
-- Description: Add w5_localization workflow type support

-- Update workflow_runs check constraint
-- Note: SQLite doesn't support ALTER CHECK, so we create a new table and migrate
-- For now, the TypeScript types enforce valid values

-- Add localization-specific artifact types
-- (handled in next migration if needed)
```

### Step 3: Update CLI Commands

Edit `src/tooling/cli-commands/workflow-start.ts` to add the type mapping:

```typescript
const TYPE_MAP: Record<string, WorkflowType> = {
  // ... existing mappings
  w5: 'w5_localization',
  w5_localization: 'w5_localization',
};
```

### Step 4: Add Tests

Create tests in the workflow test file:

```typescript
// In src/tooling/cli-commands/workflow.test.ts
describe('w5_localization workflow', () => {
  it('creates localization workflow', async () => {
    const result = workflowRepo.create({
      workflow_type: 'w5_localization',
      book_id: 'book_core',
    });
    expect(result.workflow_type).toBe('w5_localization');
  });
});
```

## Adding New Rejection Types

To add a new rejection type (e.g., `accessibility`):

### Step 1: Create Database Migration

Create `src/tooling/database/migrations/008_accessibility_rejection.sql`:

```sql
-- Migration: 008_accessibility_rejection
-- Description: Add 'accessibility' rejection type

-- Note: SQLite CHECK constraints can't be altered
-- Option 1: Enforce at application layer
-- Option 2: Recreate table (data migration required)

-- For application-layer enforcement, just update TypeScript types
```

### Step 2: Update Type Definitions

If you have rejection types defined in TypeScript:

```typescript
// In appropriate types file
export type RejectionType =
  | 'style'
  | 'mechanics'
  | 'clarity'
  | 'scope'
  | 'accessibility';  // <-- Add new type
```

### Step 3: Update Escalation Logic

Ensure escalation routing handles the new type:

```typescript
// Example escalation routing
const ESCALATION_TARGETS: Record<RejectionType, string> = {
  style: 'senior-editor',
  mechanics: 'lead-designer',
  clarity: 'technical-writer',
  scope: 'senior-editor',
  accessibility: 'accessibility-specialist',  // <-- Add routing
};
```

## CLI Commands Reference

### Book Commands

#### `book:list`

Lists all registered books.

```bash
# All books
pnpm book:list

# Filter by status
pnpm book:list --status draft
pnpm book:list -s editing
```

**Options:**
- `--status, -s <status>`: Filter by status (`draft`, `editing`, `published`)
- `--db <path>`: Custom database path (default: `data/project.db`)

#### `book:info`

Shows detailed information about a book.

```bash
pnpm book:info --slug core-rulebook
pnpm book:info core-rulebook  # Positional argument
```

**Options:**
- `--slug, -s <slug>`: Book slug (required unless positional)
- `--db <path>`: Custom database path

#### `book:register`

Registers a new book in the system.

```bash
pnpm book:register \
  --slug my-sourcebook \
  --title "My Sourcebook" \
  --path books/my-sourcebook \
  --type source
```

**Options:**
- `--slug, -s <slug>`: URL-friendly identifier (required)
- `--title, -t <title>`: Display title (required)
- `--path, -p <path>`: Source file path (required)
- `--type <type>`: Book type (default: `core`)
- `--db <path>`: Custom database path

### Workflow Commands

#### `workflow:start`

Starts a new workflow run.

```bash
pnpm workflow:start --type w1 --book core-rulebook
pnpm workflow:start -t w2_pdf -b core-rulebook
```

**Options:**
- `--type, -t <type>`: Workflow type (`w1`/`w1_editing`, `w2`/`w2_pdf`, `w3`/`w3_publication`, `w4`/`w4_playtesting`)
- `--book, -b <slug>`: Book slug (required)
- `--db <path>`: Custom database path

#### `workflow:status`

Shows detailed status of a workflow run.

```bash
pnpm workflow:status --run wfrun_abc123_xyz789
pnpm workflow:status wfrun_abc123_xyz789
```

**Options:**
- `--run, -r <id>`: Workflow run ID (required unless positional)
- `--db <path>`: Custom database path

#### `workflow:list`

Lists workflow runs with optional filtering.

```bash
# All workflows
pnpm workflow:list

# Filter by book
pnpm workflow:list --book core-rulebook

# Filter by status
pnpm workflow:list --status running

# Filter by type
pnpm workflow:list --type w1

# Combined filters
pnpm workflow:list --book core-rulebook --status completed --type w1
```

**Options:**
- `--book, -b <slug>`: Filter by book slug
- `--status, -s <status>`: Filter by status (`pending`, `running`, `paused`, `completed`, `failed`)
- `--type, -t <type>`: Filter by workflow type
- `--db <path>`: Custom database path

#### `workflow:pause`

Pauses a running workflow.

```bash
pnpm workflow:pause --run wfrun_abc123_xyz789
pnpm workflow:pause wfrun_abc123_xyz789
```

**Options:**
- `--run, -r <id>`: Workflow run ID (required unless positional)
- `--db <path>`: Custom database path

**Valid from states:** `running`

#### `workflow:resume`

Resumes a paused workflow.

```bash
pnpm workflow:resume --run wfrun_abc123_xyz789
pnpm workflow:resume wfrun_abc123_xyz789
```

**Options:**
- `--run, -r <id>`: Workflow run ID (required unless positional)
- `--db <path>`: Custom database path

**Valid from states:** `paused`

#### `workflow:cancel`

Cancels a workflow run (transitions to failed state).

```bash
pnpm workflow:cancel --run wfrun_abc123_xyz789
pnpm workflow:cancel --run wfrun_abc123_xyz789 --reason "Requirements changed"
```

**Options:**
- `--run, -r <id>`: Workflow run ID (required unless positional)
- `--reason <text>`: Cancellation reason (default: "Cancelled by user")
- `--db <path>`: Custom database path

**Valid from states:** `pending`, `running`, `paused`

## Testing

### Running Tests

```bash
# Run all tooling tests
pnpm test src/tooling/

# Run specific test files
pnpm test src/tooling/books/repository.test.ts
pnpm test src/tooling/workflows/

# Run with coverage
pnpm test --coverage src/tooling/
```

### Test Patterns

#### Repository Tests

```typescript
// src/tooling/books/repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { BookRepository } from './repository.js';
import { createTables } from '../database/schema.js';

describe('BookRepository', () => {
  let db: Database.Database;
  let repo: BookRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
    // Run migrations if needed
    repo = new BookRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates a book', () => {
    const book = repo.create({
      id: 'book_test',
      slug: 'test-book',
      title: 'Test Book',
      book_type: 'core',
      source_path: 'books/test',
    });

    expect(book.slug).toBe('test-book');
    expect(book.status).toBe('draft');
  });
});
```

#### CLI Command Tests

```typescript
// src/tooling/cli-commands/workflow.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('workflow:start CLI', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'workflow-test-'));
    dbPath = join(tempDir, 'test.db');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('starts a workflow', () => {
    // First register a book
    execSync(`pnpm book:register --slug test --title Test --path books/test --db ${dbPath}`);

    // Start workflow
    const output = execSync(
      `pnpm workflow:start --type w1 --book test --db ${dbPath}`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('WORKFLOW STARTED');
  });
});
```

#### State Machine Tests

```typescript
// src/tooling/workflows/state-machine.test.ts
import { describe, it, expect } from 'vitest';
import { WorkflowStateMachine, InvalidTransitionError } from './state-machine.js';

describe('WorkflowStateMachine', () => {
  it('allows valid transitions', () => {
    const machine = new WorkflowStateMachine('pending');
    expect(machine.canTransitionTo('running')).toBe(true);

    machine.transition('running');
    expect(machine.currentState).toBe('running');
  });

  it('rejects invalid transitions', () => {
    const machine = new WorkflowStateMachine('pending');
    expect(machine.canTransitionTo('completed')).toBe(false);

    expect(() => machine.transition('completed')).toThrow(InvalidTransitionError);
  });

  it('identifies terminal states', () => {
    const completed = new WorkflowStateMachine('completed');
    expect(completed.isTerminal()).toBe(true);

    const failed = new WorkflowStateMachine('failed');
    expect(failed.isTerminal()).toBe(true);

    const running = new WorkflowStateMachine('running');
    expect(running.isTerminal()).toBe(false);
  });
});
```

### E2E Tests

For end-to-end testing of workflow pipelines, see `src/tooling/e2e/`.

## See Also

- [Workflow Lifecycle](../workflows/lifecycle.md) - User-facing workflow documentation
- [Monorepo Architecture](./MONOREPO_ARCHITECTURE.md) - Overall project structure
- [HTML Generation Architecture](./html-gen-architecture.md) - W2 technical details
