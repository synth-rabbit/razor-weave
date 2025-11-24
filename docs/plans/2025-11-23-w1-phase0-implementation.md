# W1 Phase 0: Prerequisites Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete three prerequisite gaps (style guides, event resilience, documentation) before W1 Phase 1 can begin.

**Architecture:** Phase 0 is split into three parallel workstreams (0A, 0B, 0C) that can be executed independently. 0B requires code changes with tests; 0A and 0C are documentation-only.

**Tech Stack:** TypeScript, Vitest, SQLite, Markdown

---

## Workstream Overview

| Stream | Name | Tasks | Parallelizable |
|--------|------|-------|----------------|
| 0A | Style Guide Creation | T0A.1-T0A.3 | Yes |
| 0B | Event System Resilience | T0B.1-T0B.6 | Yes (after T0B.1) |
| 0C | Documentation | T0C.1-T0C.4 | Yes |

**Recommended Execution:** Run 0A, 0B, 0C in parallel using 3 worktrees.

---

## WORKSTREAM 0A: STYLE GUIDE CREATION

### Task T0A.1: Create Content Style Guide

**Files:**
- Create: `docs/style_guides/content.md`
- Reference: `books/core/v1/chapters/*.md` (read for patterns)
- Reference: `data/html/print-design/core-rulebook.html` (read for tone)

**Step 1: Read sample chapters to extract voice patterns**

Read these chapters for voice/tone patterns:
- `books/core/v1/chapters/01-introduction.md`
- `books/core/v1/chapters/06-character-creation.md`
- `books/core/v1/chapters/10-combat-basics.md`

**Step 2: Create content style guide**

```markdown
# Content Style Guide

## Voice & Tone

### Overall Voice
- Second person ("you") for player-facing content
- Direct and instructive, not academic
- Encouraging but not condescending
- Fiction-first: start with narrative, then mechanics

### Terminology Consistency

| Preferred | Avoid |
|-----------|-------|
| Game Master (GM) | Dungeon Master, DM, Referee |
| Player Character (PC) | Hero, Protagonist |
| Non-Player Character (NPC) | Monster, Enemy (unless combat context) |
| Check | Roll, Test |
| Difficulty Class (DC) | Target Number, TN |

### Section Structure
1. **Opening Hook** - Brief narrative example or scenario
2. **Core Concept** - What this rule/system does
3. **How It Works** - Step-by-step mechanics
4. **Examples** - Concrete play examples
5. **GM Guidance** - Tips for running (where applicable)

### Tone Guidelines
- Use active voice: "Roll 2d6" not "2d6 should be rolled"
- Be concise: One concept per paragraph
- Use examples liberally: Show, don't just tell
- Acknowledge player agency: "You might choose to..." not "You must..."

## Writing Conventions

### Numbers
- Spell out one through ten
- Use numerals for 11+
- Always use numerals for dice (2d6, not two d6)
- Always use numerals for DCs (DC 12, not DC twelve)

### Lists
- Use bullet points for unordered options
- Use numbered lists for sequential steps
- Keep list items parallel in structure

### Emphasis
- **Bold** for key terms on first use
- *Italic* for example dialogue or narrative
- `Code style` for specific game terms in rules text
```

**Step 3: Commit**

```bash
git add docs/style_guides/content.md
git commit -m "docs: add content style guide for W1 agents"
```

---

### Task T0A.2: Create Formatting Style Guide

**Files:**
- Create: `docs/style_guides/formatting.md`
- Reference: `data/html/print-design/core-rulebook.html`

**Step 1: Create formatting style guide**

```markdown
# Formatting Style Guide

## Markdown Conventions

### Headings
- `#` - Chapter title only (one per file)
- `##` - Major sections
- `###` - Subsections
- `####` - Minor subsections (use sparingly)

### Callouts

Use blockquotes with prefixes for callouts:

```markdown
> **Example:** This is a play example showing the rule in action.

> **Note:** Important clarification or edge case.

> **GM Tip:** Guidance specifically for Game Masters.

> **Warning:** Common mistake or pitfall to avoid.
```

### Tables

Always include header row and alignment:

```markdown
| Column A | Column B | Column C |
|----------|:--------:|---------:|
| Left     | Center   | Right    |
```

### Code Blocks

Use fenced code blocks for:
- Dice notation examples
- Character sheet snippets
- Rules summaries

### Cross-References

Use relative links for internal references:
```markdown
See [Character Creation](./06-character-creation.md) for details.
```

## Document Structure

### Chapter Files
```
# Chapter Title

Brief introduction paragraph.

## First Major Section

Content...

### Subsection

Content...

## Second Major Section

Content...

---

*Chapter summary or transition to next chapter.*
```

### Reference Files
```
# Reference: [Topic]

Quick-reference format with tables and bullet points.
No narrative content.
```

## Whitespace

- One blank line between sections
- No trailing whitespace
- Single newline at end of file
- No more than one consecutive blank line
```

**Step 2: Commit**

```bash
git add docs/style_guides/formatting.md
git commit -m "docs: add formatting style guide for W1 agents"
```

---

### Task T0A.3: Create Mechanics Style Guide

**Files:**
- Create: `docs/style_guides/mechanics.md`
- Reference: `books/core/v1/chapters/08-actions-and-checks.md`
- Reference: `books/core/v1/chapters/09-tags-conditions-clocks.md`

**Step 1: Create mechanics style guide**

```markdown
# Mechanics Style Guide

## Game Term Formatting

### Core Mechanics

| Term | Format | Example |
|------|--------|---------|
| Dice rolls | `NdX` format | 2d6, 1d20+3 |
| Difficulty Class | `DC N` | DC 12, DC 15 |
| Tags | Title Case, no brackets | Wounded, Hidden |
| Conditions | Title Case | Stunned, Prone |
| Clocks | "N-segment Clock" | 4-segment Clock |
| Attributes | Title Case | Strength, Agility |
| Skills | Title Case | Athletics, Persuasion |

### Dice Notation

Always use standard notation:
- `NdX` - Roll N dice with X sides
- `NdX+M` - Add modifier M
- `NdX-M` - Subtract modifier M
- `advantage` / `disadvantage` - Spelled out, lowercase

### Rules Text Patterns

**Check format:**
```markdown
Make a [Attribute] + [Skill] check against DC [N].
```

**Outcome format:**
```markdown
**Success:** [What happens on success]
**Failure:** [What happens on failure]
**Critical:** [Optional: what happens on critical success]
```

**Tag application:**
```markdown
Apply the [Tag Name] tag until [condition/duration].
```

### Clock Mechanics

Always specify:
1. Number of segments (4, 6, or 8)
2. What advances the clock
3. What happens when filled

```markdown
Create a 4-segment **[Clock Name]** clock. Advance one segment when [trigger]. When filled, [consequence].
```

## Example Patterns

### Combat Example
```markdown
> **Example:** Marcus faces two guards. He declares an attack against the nearest one.
>
> Marcus rolls Agility + Combat: 2d6+4 = 11 against DC 10.
>
> **Success!** Marcus deals damage and applies the Wounded tag to the guard.
```

### Skill Check Example
```markdown
> **Example:** Lyra attempts to pick the lock on the merchant's strongbox.
>
> Lyra rolls Agility + Thievery: 2d6+3 = 8 against DC 12.
>
> **Failure.** The lock holds, and Lyra hears footsteps approaching.
```

## Consistency Rules

1. **Always define terms on first use** - Bold and explain
2. **Use consistent DC ranges** - Easy (8), Medium (12), Hard (15), Very Hard (18)
3. **Clock sizes are standardized** - Only 4, 6, or 8 segments
4. **Tag durations are explicit** - "until end of scene" not "for a while"
```

**Step 2: Commit**

```bash
git add docs/style_guides/mechanics.md
git commit -m "docs: add mechanics style guide for W1 agents"
```

---

## WORKSTREAM 0B: EVENT SYSTEM RESILIENCE

### Task T0B.1: Add Missing VP Ops Tables to Materializer

**Files:**
- Modify: `src/tooling/cli-commands/db-materialize.ts:25-32`

**Step 1: Write test for missing tables**

Create test file:
- Create: `src/tooling/cli-commands/db-materialize.test.ts`

```typescript
// src/tooling/cli-commands/db-materialize.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import Database from 'better-sqlite3';

describe('db-materialize', () => {
  const testEventsDir = '/tmp/test-events-materialize';
  const testDbPath = '/tmp/test-materialize.db';

  beforeEach(() => {
    if (existsSync(testEventsDir)) rmSync(testEventsDir, { recursive: true });
    if (existsSync(testDbPath)) rmSync(testDbPath);
    mkdirSync(testEventsDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testEventsDir)) rmSync(testEventsDir, { recursive: true });
    if (existsSync(testDbPath)) rmSync(testDbPath);
    if (existsSync(`${testDbPath}.backup`)) rmSync(`${testDbPath}.backup`);
  });

  it('should materialize execution_batches table', () => {
    // Write test event
    const event = {
      id: 'evt_test1',
      ts: new Date().toISOString(),
      worktree: 'main',
      table: 'execution_batches',
      op: 'INSERT',
      data: {
        id: 'batch_123',
        plan_id: 'plan_456',
        batch_number: 1,
        name: 'Test Batch',
        tasks: '["task1"]',
        parallel_safe: true,
        checkpoint: 'test checkpoint',
        human_gate: false,
        human_gate_criteria: null
      }
    };
    writeFileSync(
      `${testEventsDir}/2025-01-01-sess_test.jsonl`,
      JSON.stringify(event) + '\n'
    );

    // Run materialize
    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${testEventsDir} --db ${testDbPath}`);

    // Verify table exists with data
    const db = new Database(testDbPath);
    const rows = db.prepare('SELECT * FROM execution_batches').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'batch_123', name: 'Test Batch' });
  });

  it('should materialize operational_risks table', () => {
    const event = {
      id: 'evt_test2',
      ts: new Date().toISOString(),
      worktree: 'main',
      table: 'operational_risks',
      op: 'INSERT',
      data: {
        id: 'risk_123',
        plan_id: 'plan_456',
        description: 'Test Risk',
        mitigation: 'Test Mitigation',
        severity: 'high'
      }
    };
    writeFileSync(
      `${testEventsDir}/2025-01-01-sess_test.jsonl`,
      JSON.stringify(event) + '\n'
    );

    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${testEventsDir} --db ${testDbPath}`);

    const db = new Database(testDbPath);
    const rows = db.prepare('SELECT * FROM operational_risks').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'risk_123', severity: 'high' });
  });

  it('should materialize boardroom_minutes table', () => {
    const event = {
      id: 'evt_test3',
      ts: new Date().toISOString(),
      worktree: 'main',
      table: 'boardroom_minutes',
      op: 'INSERT',
      data: {
        id: 'min_123',
        session_id: 'sess_456',
        date: '2025-01-01',
        attendees: '["CEO"]',
        agenda: '["item1"]',
        vp_product_summary: 'summary',
        vp_engineering_summary: 'summary',
        vp_ops_summary: 'summary',
        decisions: '[]',
        action_items: '[]',
        blockers: '[]',
        next_steps: 'next',
        created_at: new Date().toISOString()
      }
    };
    writeFileSync(
      `${testEventsDir}/2025-01-01-sess_test.jsonl`,
      JSON.stringify(event) + '\n'
    );

    execSync(`npx tsx src/tooling/cli-commands/db-materialize.ts --events ${testEventsDir} --db ${testDbPath}`);

    const db = new Database(testDbPath);
    const rows = db.prepare('SELECT * FROM boardroom_minutes').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'min_123', session_id: 'sess_456' });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/cli-commands/db-materialize.test.ts
```

Expected: FAIL - tables not registered

**Step 3: Add missing table registrations**

Modify `src/tooling/cli-commands/db-materialize.ts`:

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

// VP Ops tables (NEW)
materializer.registerTable('execution_batches', 'id');
materializer.registerTable('operational_risks', 'id');
materializer.registerTable('boardroom_minutes', 'id');

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

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/cli-commands/db-materialize.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/cli-commands/db-materialize.ts src/tooling/cli-commands/db-materialize.test.ts
git commit -m "feat: add VP Ops tables to materializer (execution_batches, operational_risks, boardroom_minutes)"
```

---

### Task T0B.2: Add Checkpoint Event Type

**Files:**
- Modify: `src/tooling/events/types.ts`
- Modify: `src/tooling/boardroom/client.ts`
- Create: `src/tooling/boardroom/client.checkpoint.test.ts`

**Step 1: Write test for checkpoint event**

```typescript
// src/tooling/boardroom/client.checkpoint.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BoardroomClient } from './client';
import { EventReader } from '../events/reader';
import { mkdirSync, rmSync, existsSync } from 'fs';

describe('BoardroomClient checkpoint', () => {
  const testEventsDir = '/tmp/test-events-checkpoint';
  const sessionId = 'sess_test_checkpoint';

  beforeEach(() => {
    if (existsSync(testEventsDir)) rmSync(testEventsDir, { recursive: true });
    mkdirSync(testEventsDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testEventsDir)) rmSync(testEventsDir, { recursive: true });
  });

  it('should emit checkpoint event after VP contribution', () => {
    const client = new BoardroomClient(testEventsDir, sessionId, 'main');

    // Create a checkpoint
    client.emitCheckpoint('vp_product', 'plan_123', 'VP Product analysis complete');

    // Read events
    const reader = new EventReader(testEventsDir);
    const events = reader.readAll();

    const checkpointEvents = events.filter(e => e.table === 'session_checkpoints');
    expect(checkpointEvents).toHaveLength(1);

    const checkpoint = checkpointEvents[0];
    expect(checkpoint.op).toBe('INSERT');
    expect((checkpoint as any).data.vp_type).toBe('vp_product');
    expect((checkpoint as any).data.artifact_id).toBe('plan_123');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/boardroom/client.checkpoint.test.ts
```

Expected: FAIL - emitCheckpoint not defined

**Step 3: Add checkpoint method to BoardroomClient**

Add to `src/tooling/boardroom/client.ts` after line 257:

```typescript
  // Session Checkpoints
  emitCheckpoint(
    vpType: 'vp_product' | 'vp_engineering' | 'vp_ops',
    artifactId: string,
    description: string
  ): void {
    const checkpoint = {
      id: this.generateId('chk'),
      session_id: this.writer['sessionId'], // Access session ID
      vp_type: vpType,
      artifact_id: artifactId,
      description,
      created_at: new Date().toISOString()
    };

    this.writer.write('session_checkpoints', 'INSERT', checkpoint as unknown as Record<string, unknown>);
  }
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/boardroom/client.checkpoint.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/boardroom/client.ts src/tooling/boardroom/client.checkpoint.test.ts
git commit -m "feat: add checkpoint event emission to BoardroomClient"
```

---

### Task T0B.3: Register Checkpoint Table in Materializer

**Files:**
- Modify: `src/tooling/cli-commands/db-materialize.ts`

**Step 1: Add checkpoint table registration**

Add after line 35 (after boardroom_minutes):

```typescript
materializer.registerTable('session_checkpoints', 'id');
```

**Step 2: Run existing tests**

```bash
pnpm vitest run src/tooling/cli-commands/db-materialize.test.ts
```

Expected: PASS (existing tests still pass)

**Step 3: Commit**

```bash
git add src/tooling/cli-commands/db-materialize.ts
git commit -m "feat: register session_checkpoints table in materializer"
```

---

### Task T0B.4: Add Auto-Materialize to boardroom-approve

**Files:**
- Modify: `src/tooling/cli-commands/boardroom-approve.ts`

**Step 1: Add materialization call after approval**

Add import at top:
```typescript
import { Materializer } from '../events/materializer';
```

Add before final console.log (around line 145):

```typescript
// Materialize events to database
const materializer = new Materializer(eventsDir, 'data/project.db');
materializer.registerTable('boardroom_sessions', 'id');
materializer.registerTable('vp_plans', 'id');
materializer.registerTable('phases', 'id');
materializer.registerTable('milestones', 'id');
materializer.registerTable('engineering_tasks', 'id');
materializer.registerTable('ceo_feedback', 'id');
materializer.registerTable('brainstorm_opinions', 'id');
materializer.registerTable('vp_consultations', 'id');
materializer.registerTable('execution_batches', 'id');
materializer.registerTable('operational_risks', 'id');
materializer.registerTable('boardroom_minutes', 'id');
materializer.registerTable('session_checkpoints', 'id');

try {
  materializer.materialize();
} catch (error) {
  console.error('Warning: Database materialization failed:', error);
  // Don't exit - approval succeeded, materialization is secondary
}
```

**Step 2: Test manually**

```bash
pnpm boardroom:status --session sess_c7c49ec7
```

Expected: Should show session status (already approved)

**Step 3: Commit**

```bash
git add src/tooling/cli-commands/boardroom-approve.ts
git commit -m "feat: auto-materialize events to database after boardroom approval"
```

---

### Task T0B.5: Add Idempotency Key to EventWriter

**Files:**
- Modify: `src/tooling/events/writer.ts`
- Modify: `src/tooling/events/types.ts`
- Create: `src/tooling/events/writer.idempotency.test.ts`

**Step 1: Write test for idempotency**

```typescript
// src/tooling/events/writer.idempotency.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventWriter } from './writer';
import { EventReader } from './reader';
import { mkdirSync, rmSync, existsSync } from 'fs';

describe('EventWriter idempotency', () => {
  const testEventsDir = '/tmp/test-events-idempotency';
  const sessionId = 'sess_test_idem';

  beforeEach(() => {
    if (existsSync(testEventsDir)) rmSync(testEventsDir, { recursive: true });
    mkdirSync(testEventsDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testEventsDir)) rmSync(testEventsDir, { recursive: true });
  });

  it('should skip duplicate events with same idempotency key', () => {
    const writer = new EventWriter(testEventsDir, sessionId, 'main');

    // Write same event twice with idempotency key
    writer.writeIdempotent('test_table', 'INSERT', { id: 'item_1', name: 'Test' }, 'idem_key_123');
    writer.writeIdempotent('test_table', 'INSERT', { id: 'item_1', name: 'Test' }, 'idem_key_123');

    const reader = new EventReader(testEventsDir);
    const events = reader.readAll();

    expect(events).toHaveLength(1);
  });

  it('should write events with different idempotency keys', () => {
    const writer = new EventWriter(testEventsDir, sessionId, 'main');

    writer.writeIdempotent('test_table', 'INSERT', { id: 'item_1', name: 'Test1' }, 'idem_key_1');
    writer.writeIdempotent('test_table', 'INSERT', { id: 'item_2', name: 'Test2' }, 'idem_key_2');

    const reader = new EventReader(testEventsDir);
    const events = reader.readAll();

    expect(events).toHaveLength(2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/events/writer.idempotency.test.ts
```

Expected: FAIL - writeIdempotent not defined

**Step 3: Add writeIdempotent method**

Add to `src/tooling/events/writer.ts`:

```typescript
  private seenIdempotencyKeys: Set<string> = new Set();

  writeIdempotent(
    table: string,
    op: 'INSERT',
    data: Record<string, unknown>,
    idempotencyKey: string
  ): boolean {
    // Check if we've already processed this key in this session
    if (this.seenIdempotencyKeys.has(idempotencyKey)) {
      return false; // Skip duplicate
    }

    // Also check existing events file for this key
    if (existsSync(this.filePath)) {
      const content = readFileSync(this.filePath, 'utf-8');
      if (content.includes(`"idempotency_key":"${idempotencyKey}"`)) {
        this.seenIdempotencyKeys.add(idempotencyKey);
        return false; // Skip duplicate
      }
    }

    this.seenIdempotencyKeys.add(idempotencyKey);

    const event = {
      id: `evt_${randomUUID().slice(0, 8)}`,
      ts: new Date().toISOString(),
      worktree: this.worktree,
      table,
      op: 'INSERT' as const,
      data,
      idempotency_key: idempotencyKey
    };

    appendFileSync(this.filePath, JSON.stringify(event) + '\n');
    return true;
  }
```

Add import for `readFileSync` at top:
```typescript
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/events/writer.idempotency.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/events/writer.ts src/tooling/events/writer.idempotency.test.ts
git commit -m "feat: add idempotency key support to EventWriter"
```

---

### Task T0B.6: Run Full Test Suite and Verify

**Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests pass

**Step 2: Run materialization on existing events**

```bash
pnpm db:materialize
```

Expected: Success message

**Step 3: Verify database has new tables**

```bash
sqlite3 data/project.db ".tables" | grep -E "execution_batches|operational_risks|boardroom_minutes"
```

Expected: Tables listed

**Step 4: Commit any fixes**

If tests fail, fix and commit.

---

## WORKSTREAM 0C: DOCUMENTATION

### Task T0C.1: Create Event System Developer Documentation

**Files:**
- Create: `docs/developers/event-system.md`

**Step 1: Create event system documentation**

```markdown
# Event System Architecture

## Overview

The Razorweave event system uses append-only JSONL files for durable storage of boardroom session data. Events can be materialized into SQLite for querying.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ BoardroomClient │ ──▶ │   EventWriter    │ ──▶ │  JSONL Files    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   SQLite DB     │ ◀── │   Materializer   │ ◀── │   EventReader   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Event Format

Events are stored as JSON Lines (one JSON object per line):

```json
{
  "id": "evt_abc12345",
  "ts": "2025-11-23T10:00:00.000Z",
  "worktree": "main",
  "table": "boardroom_sessions",
  "op": "INSERT",
  "data": {
    "id": "sess_xyz789",
    "proposal_path": "/path/to/proposal.md",
    "status": "active"
  }
}
```

### Event Operations

| Operation | Description | Required Fields |
|-----------|-------------|-----------------|
| `INSERT` | Create new record | `data` (full record) |
| `UPDATE` | Modify existing record | `key`, `data` (changed fields) |
| `DELETE` | Remove record | `key` |

## File Location

Events are stored in `data/events/` with naming convention:
```
YYYY-MM-DD-{session_id}.jsonl
```

Example: `2025-11-23-sess_c7c49ec7.jsonl`

## Key Classes

### EventWriter

```typescript
import { EventWriter } from '../events/writer';

const writer = new EventWriter(eventsDir, sessionId, worktree);

// Standard write
writer.write('table_name', 'INSERT', { id: 'item_1', name: 'Test' });

// Idempotent write (prevents duplicates)
writer.writeIdempotent('table_name', 'INSERT', data, 'unique_key');
```

### EventReader

```typescript
import { EventReader } from '../events/reader';

const reader = new EventReader(eventsDir);

// Read all events
const allEvents = reader.readAll();

// Read by table
const sessionEvents = reader.readByTable('boardroom_sessions');

// Read by session
const events = reader.readBySession('sess_abc123');
```

### Materializer

```typescript
import { Materializer } from '../events/materializer';

const materializer = new Materializer(eventsDir, dbPath);

// Register tables to materialize
materializer.registerTable('boardroom_sessions', 'id');
materializer.registerTable('vp_plans', 'id');

// Materialize (replays all events to SQLite)
materializer.materialize();
```

## Registered Tables

| Table | Primary Key | Description |
|-------|-------------|-------------|
| `boardroom_sessions` | `id` | Session metadata |
| `vp_plans` | `id` | VP plan records |
| `phases` | `id` | Phase definitions |
| `milestones` | `id` | Milestone definitions |
| `engineering_tasks` | `id` | Engineering task details |
| `execution_batches` | `id` | VP Ops execution batches |
| `operational_risks` | `id` | VP Ops risk assessments |
| `boardroom_minutes` | `id` | Board meeting minutes |
| `session_checkpoints` | `id` | VP completion checkpoints |

## CLI Commands

```bash
# Materialize events to database
pnpm db:materialize

# With custom paths
pnpm db:materialize --events data/events --db data/project.db
```

## Failure Recovery

1. Events are append-only - no data loss on crash
2. Checkpoints mark VP completion for resume
3. Idempotency keys prevent duplicate processing
4. Materializer creates backup before rebuild
```

**Step 2: Commit**

```bash
git add docs/developers/event-system.md
git commit -m "docs: add event system developer documentation"
```

---

### Task T0C.2: Create Boardroom Developer Documentation

**Files:**
- Create: `docs/developers/boardroom.md`

**Step 1: Create boardroom developer documentation**

```markdown
# Boardroom System Architecture

## Overview

The boardroom system orchestrates planning sessions with three VP agents (Product, Engineering, Ops) and CEO approval. All data is persisted via the event system.

## Session Lifecycle

```
┌─────────────┐
│   START     │
└──────┬──────┘
       ▼
┌─────────────┐     ┌─────────────────┐
│ VP Product  │ ──▶ │ Phases created  │
└──────┬──────┘     └─────────────────┘
       ▼
┌─────────────┐     ┌─────────────────┐
│VP Engineer  │ ──▶ │ Tasks created   │
└──────┬──────┘     └─────────────────┘
       ▼
┌─────────────┐     ┌─────────────────┐
│   VP Ops    │ ──▶ │ Batches/Risks   │
└──────┬──────┘     └─────────────────┘
       ▼
┌─────────────┐     ┌─────────────────┐
│CEO Approval │ ──▶ │Session Complete │
└─────────────┘     └─────────────────┘
```

## Key Classes

### BoardroomClient

Main API for creating boardroom artifacts:

```typescript
import { BoardroomClient } from '../boardroom/client';

const client = new BoardroomClient(eventsDir, sessionId, worktree);

// Create session
const session = client.createSession(proposalPath);

// Create VP plan
const plan = client.createVPPlan(sessionId, 'product');

// Create phase
const phase = client.createPhase(planId, 'Phase 1', 'Description', 1, ['criteria']);

// Create milestone
const milestone = client.createMilestone(phaseId, 'M1', 'Description', 1);

// Create engineering task
const task = client.createEngineeringTask(planId, milestoneId, 'Task description');

// VP Ops methods
client.createExecutionBatch(planId, 1, 'Batch 1', ['task1'], true, 'checkpoint', false, null);
client.createOperationalRisk(planId, 'Risk description', 'Mitigation', 'high');

// Board minutes
client.createBoardroomMinutes(sessionId, { attendees, agenda, ... });

// Checkpoint (for failure recovery)
client.emitCheckpoint('vp_product', planId, 'VP Product complete');
```

### SessionManager

Higher-level session lifecycle management:

```typescript
import { SessionManager } from '../cli/session-manager';

const manager = new SessionManager(eventsDir, worktree);

// Start new session
const session = manager.startSession(proposalPath);

// Get session
const session = manager.getSession(sessionId);

// List sessions
const sessions = manager.listSessions('active');

// Complete session
manager.completeSession(sessionId);
```

## Data Model

### BoardroomSession
```typescript
interface BoardroomSession {
  id: string;           // sess_xxxxxxxx
  proposal_path: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}
```

### VPPlan
```typescript
interface VPPlan {
  id: string;           // plan_xxxxxxxx
  session_id: string;
  vp_type: 'product' | 'engineering' | 'ops';
  status: 'draft' | 'reviewed' | 'approved';
  plan_path: string | null;
  created_at: string;
}
```

### Phase
```typescript
interface Phase {
  id: string;           // phase_xxxxxxxx
  plan_id: string;
  name: string;
  description: string | null;
  sequence: number;
  acceptance_criteria: string; // JSON array
}
```

## CLI Commands

```bash
# Start session with VP Product
pnpm boardroom:vp-product --proposal docs/plans/proposals/w1-editing.md

# Continue with VP Engineering
pnpm boardroom:vp-engineering --session sess_abc123

# Continue with VP Ops
pnpm boardroom:vp-ops --session sess_abc123

# Check status
pnpm boardroom:status --session sess_abc123

# Generate documents
pnpm boardroom:generate --session sess_abc123

# Approve session
pnpm boardroom:approve --session sess_abc123

# Generate board minutes
pnpm boardroom:minutes --session sess_abc123
```

## Output Files

Session documents are generated to `docs/plans/generated/`:

| File | Description |
|------|-------------|
| `{session}-summary.md` | Session overview with phases |
| `{session}-vp-product.md` | VP Product analysis |
| `{session}-vp-engineering.md` | Engineering tasks |
| `{session}-vp-ops.md` | Execution schedule and risks |
| `{session}-minutes.md` | Formal board minutes |
```

**Step 2: Commit**

```bash
git add docs/developers/boardroom.md
git commit -m "docs: add boardroom system developer documentation"
```

---

### Task T0C.3: Create Boardroom Workflow Guide

**Files:**
- Create: `docs/workflows/boardroom.md`

**Step 1: Create boardroom workflow guide**

```markdown
# Boardroom Workflow Guide

## What is a Boardroom Session?

A boardroom session is a structured planning process where three VP agents analyze a proposal and create an implementation plan:

1. **VP Product** - Breaks proposal into phases with acceptance criteria
2. **VP Engineering** - Creates detailed engineering tasks
3. **VP Operations** - Plans execution schedule and identifies risks

The CEO (you) reviews and approves the final plan.

## Running a Boardroom Session

### Step 1: Create Your Proposal

Write a proposal document in `docs/plans/proposals/`:

```markdown
# My Feature Proposal

## Goal
What you want to build.

## Context
Background information.

## Requirements
- Requirement 1
- Requirement 2
```

### Step 2: Start the Session

```bash
pnpm boardroom:vp-product --proposal docs/plans/proposals/my-proposal.md
```

This creates a new session and provides a prompt for VP Product.

### Step 3: Run VP Product

The command outputs a prompt. Copy this prompt and run it as a Claude subagent. VP Product will:
- Analyze the proposal
- Break it into phases
- Define acceptance criteria
- Create milestones

### Step 4: Run VP Engineering

```bash
pnpm boardroom:vp-engineering --session sess_xxxxxxxx
```

Run the output prompt as a subagent. VP Engineering will:
- Create engineering tasks for each milestone
- Identify file paths
- Map dependencies

### Step 5: Run VP Ops

```bash
pnpm boardroom:vp-ops --session sess_xxxxxxxx
```

Run the output prompt as a subagent. VP Ops will:
- Create execution batches
- Identify parallelization opportunities
- Assess operational risks
- Define human gates

### Step 6: Generate Documents

```bash
pnpm boardroom:generate --session sess_xxxxxxxx
```

This creates summary documents in `docs/plans/generated/`.

### Step 7: Review and Approve

Review the generated documents:
- `sess_xxxxxxxx-summary.md` - Overview
- `sess_xxxxxxxx-vp-product.md` - Phase breakdown
- `sess_xxxxxxxx-vp-engineering.md` - Task details
- `sess_xxxxxxxx-vp-ops.md` - Execution plan

When satisfied:

```bash
pnpm boardroom:approve --session sess_xxxxxxxx
```

### Step 8: Generate Minutes (Optional)

```bash
pnpm boardroom:minutes --session sess_xxxxxxxx
```

Creates formal board meeting minutes for company records.

## Checking Session Status

```bash
pnpm boardroom:status --session sess_xxxxxxxx
```

Shows:
- Session status (active/completed)
- VP plan statuses
- Phase and task counts

## Resuming After Failure

If a VP agent fails mid-session:

1. Check which VP completed: `pnpm boardroom:status --session sess_xxxxxxxx`
2. Re-run the failed VP command
3. The session continues from where it left off

## Best Practices

1. **Write clear proposals** - The better the input, the better the output
2. **Review VP Product carefully** - Phases define the entire plan structure
3. **Check VP Ops risks** - High-severity risks may need mitigation before execution
4. **Don't skip human gates** - They exist to catch issues early
```

**Step 2: Commit**

```bash
git add docs/workflows/boardroom.md
git commit -m "docs: add boardroom workflow guide for humans"
```

---

### Task T0C.4: Update Workflow Lifecycle Documentation

**Files:**
- Modify: `docs/workflows/lifecycle.md`

**Step 1: Read existing file**

```bash
cat docs/workflows/lifecycle.md
```

**Step 2: Add event system section**

Append to the file:

```markdown

---

## Event System Integration

Workflow events are persisted using the event sourcing system for durability and auditability.

### How Events Flow

1. **Workflow actions** emit events via `EventWriter`
2. **Events stored** in `data/events/` as JSONL files
3. **Materialization** replays events to SQLite for querying
4. **Checkpoints** mark completion points for recovery

### Key Integration Points

| Workflow Action | Event Table |
|-----------------|-------------|
| Start workflow | `workflow_runs` |
| Agent completes | `workflow_events` |
| Rejection | `rejections` |
| Artifact created | `workflow_artifacts` |
| Trigger fired | `workflow_triggers` |

### Materializing Events

After significant workflow activity:

```bash
pnpm db:materialize
```

This syncs event data to SQLite for queries and reports.

### See Also

- [Event System Architecture](../developers/event-system.md)
- [Boardroom Workflow](./boardroom.md)
```

**Step 3: Commit**

```bash
git add docs/workflows/lifecycle.md
git commit -m "docs: add event system integration to workflow lifecycle docs"
```

---

## Execution Summary

### Parallel Execution Plan

```
Worktree 1 (0A):     Worktree 2 (0B):           Worktree 3 (0C):
T0A.1 ──┐            T0B.1 ──┐                  T0C.1 ──┐
T0A.2 ──┼── merge    T0B.2 ──┼── T0B.3 ──┐     T0C.2 ──┼── merge
T0A.3 ──┘            T0B.4 ──┼── T0B.5 ──┼──   T0C.3 ──┤
                     T0B.6 ──┘            merge T0C.4 ──┘
```

### Task Count by Stream

| Stream | Tasks | Estimated Commits |
|--------|-------|-------------------|
| 0A | 3 | 3 |
| 0B | 6 | 6 |
| 0C | 4 | 4 |
| **Total** | **13** | **13** |

---

*Plan generated: 2025-11-23*
