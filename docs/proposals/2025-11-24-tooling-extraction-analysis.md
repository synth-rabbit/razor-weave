# Tooling Module Extraction Analysis

**Date:** 2025-11-24
**Status:** Proposal
**Author:** Claude Code (Architectural Review)

## Executive Summary

This document analyzes the `src/tooling/` package (600+ files, 25+ subdirectories) to identify modules that can be extracted into separate packages. The analysis maps dependencies, identifies coupling issues, and recommends an extraction priority order.

## Current Architecture

### Package Structure

```
src/tooling/
├── agents/          # Agent invocation (5 files)
├── boardroom/       # Boardroom decisions (6 files)
├── books/           # Book metadata (6 files)
├── cli/             # CLI utilities (5 files)
├── cli-commands/    # CLI entry points (47 files)
├── constants/       # Shared constants (1 file)
├── database/        # Database layer (16 files + 8 SQL)
├── errors/          # Error types (2 files)
├── events/          # Event sourcing (10 files)
├── html-gen/        # HTML generation (39 files)
├── linters/         # Lint configs (8 files)
├── logging/         # Logger (2 files)
├── pdf-gen/         # PDF generation (24 files)
├── personas/        # Persona system (10 files)
├── plans/           # Plan generation (6 files)
├── reviews/         # Review campaigns (25 files)
├── scripts/         # Utilities (77 files)
├── updaters/        # Agent/prompt updates (4 files)
├── validators/      # Content validation (4 files)
├── w1/              # W1 workflow (13 files)
├── workflows/       # Workflow state (22 files)
└── e2e/             # Integration tests (3 files)
```

### Dependency Graph

```
                         ┌─────────────────────────────────────────┐
                         │           CLI-COMMANDS (47)             │
                         │      Application Layer - TOP            │
                         └──────────────────┬──────────────────────┘
                                            │ imports
       ┌────────────────┬───────────────────┼───────────────────┬────────────────┐
       ▼                ▼                   ▼                   ▼                ▼
┌─────────────┐  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   ┌─────────────┐
│   W1 (13)   │  │ REVIEWS (25)│    │ HTML-GEN(39)│    │ WORKFLOWS   │   │ BOARDROOM   │
│ Specialist  │  │   Domain    │    │ Generator   │    │  (22)       │   │    (6)      │
└──────┬──────┘  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘   └──────┬──────┘
       │                │                  │                  │                 │
       │                │                  │                  │                 │
       ▼                ▼                  ▼                  ▼                 ▼
┌─────────────┐  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   ┌─────────────┐
│   BOOKS(6)  │  │ PERSONAS(10)│    │   (none)    │    │   EVENTS    │   │   EVENTS    │
│  Resource   │  │  Domain     │    │             │    │    (10)     │   │    (10)     │
└──────┬──────┘  └──────┬──────┘    └─────────────┘    └──────┬──────┘   └─────────────┘
       │                │                                     │
       ▼                ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE (16 + 8 SQL)                                   │
│                          Foundation Layer - BOTTOM                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE: errors/, logging/, constants/                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

ISOLATED:
┌─────────────┐
│  PDF-GEN    │  ← Zero internal dependencies
│    (24)     │
└─────────────┘
```

### Layer Classification

| Layer | Modules | Role |
|-------|---------|------|
| **Application** | cli-commands/ | User entry points, orchestration |
| **Domain Logic** | reviews/, w1/, personas/ | Business logic, specialized workflows |
| **Services** | workflows/, boardroom/, plans/ | Cross-cutting orchestration |
| **Generators** | html-gen/, pdf-gen/ | Content transformation |
| **Resources** | books/, agents/ | Data management |
| **Infrastructure** | events/, errors/, logging/, constants/ | Shared utilities |
| **Foundation** | database/ | Core persistence |

## Dependency Analysis by Module

### Foundation Layer

#### database/ (16 files + 8 SQL migrations)

**Role:** Core data persistence and client factory

**External Dependencies:**
- `better-sqlite3` - Primary database driver
- Node.js built-ins: `path`, `fs`, `crypto`

**Internal Dependencies:**
- `../errors/` - DatabaseError class
- `../reviews/campaign-client.js` - **RE-EXPORTED (architectural smell)**

**Dependents:** 25+ modules (all workflow/book commands, workflows, reviews, html-gen, events, books, w1, personas, boardroom, plans)

**Classification:** FOUNDATION LAYER - Imported by 25+ modules, minimal internal imports

**Issues:**
- Re-exports `CampaignClient` from reviews/ (layer violation)

### Middle Layer

#### workflows/ (22 files)

**Role:** Workflow execution, state management, artifact routing

**Key Components:**
- `repository.ts` - Workflow CRUD and state transitions
- `state-machine.ts` - State transition validation
- `artifact-registry.ts` - Maps artifact types to workflows
- `event-emitter.ts` - Workflow event publishing

**Internal Dependencies:**
- `../database/` (heavy - all state stored in DB)
- `../errors/` - DatabaseError, InvalidTransitionError

**Dependents:** 15+ modules (all workflow commands, w1/, artifacts/)

**Classification:** MIDDLE LAYER - Both imports (database) and is heavily imported

#### books/ (6 files)

**Role:** Book metadata and versioning

**Internal Dependencies:**
- `../database/` (schema)
- `../errors/` (DatabaseError)

**Dependents:** 18 modules (all W1 commands, workflow commands, build commands, HTML generation)

**Classification:** RESOURCE LAYER - Widely used, minimal complexity

### Domain Logic Layer

#### reviews/ (25 files)

**Role:** Content review campaigns, persona selection, prompt generation

**Internal Dependencies:**
- `../database/` (PersonaClient, schema)
- `../personas/` (persona data)
- `../constants/` (testing flags)
- `../logging/` (log output)
- `../errors/` (FileError)

**Dependents:** 5 modules (cli-commands/review, database/index re-export, scripts/, w1-verify-foundation)

**Classification:** DOMAIN LOGIC LAYER - Specialized functionality, moderate dependencies

#### w1/ (13 files)

**Role:** W1 strategic planning, area generation, prompt orchestration

**Internal Dependencies:**
- `../database/` (schema, database access)
- `../workflows/` (repository, artifact registry)
- `../books/` (book repository, types)
- `../errors/` (DatabaseError)
- `../logging/` (logging)

**Dependents:** 7 W1 CLI commands

**Classification:** SPECIALIST LAYER - Focused domain, workflow-specific

#### personas/ (10 files)

**Role:** Persona generation and validation

**Internal Dependencies:**
- `../database/` (PersonaClient - integration only)
- `../constants/` (generation parameters)
- `../logging/` (logging)

**Dependents:** 3+ modules (cli-commands/personas, run.ts, reviews/)

**Classification:** DOMAIN DATA LAYER - Specialized, minimal dependents

### Generator Layer

#### html-gen/ (39 files)

**Role:** Markdown-to-HTML conversion, build pipeline, template rendering

**External Dependencies:**
- `unified`, `remark-*`, `rehype-*` - Markdown processing
- `unist-util-visit` - AST traversal
- `better-sqlite3` - Database (build client)

**Internal Dependencies:**
- `../database/` (build-client, web/build, print/build)
- `../books/` (types)

**Dependents:** 5 CLI commands (build-book, w1-finalize-*)

**Classification:** CONTENT GENERATION LAYER - Standalone subsystem

#### pdf-gen/ (24 files)

**Role:** HTML-to-PDF conversion using PDFKit

**External Dependencies:**
- `pdfkit` - PDF generation library
- `svg-to-pdfkit` - SVG rendering
- `cheerio` - HTML parsing

**Internal Dependencies:** NONE

**Dependents:** 2 CLI commands (w1-finalize, w1-finalize-pdf)

**Classification:** SPECIALIZED OUTPUT LAYER - Completely standalone

### Infrastructure Layer

#### events/ (10 files)

**Role:** Event persistence and materialization

**Internal Dependencies:**
- `../errors/` (via other modules)

**Dependents:** 5+ modules (boardroom, plans, cli/session-manager, agents, db-materialize)

**Classification:** INFRASTRUCTURE LAYER - Focused functionality

#### boardroom/ (6 files)

**Role:** VP decision tracking and milestone management

**Internal Dependencies:**
- `../events/writer` - EventWriter for checkpoints

**Dependents:** 8+ commands (boardroom-*, plans/generator, cli/session-manager, agents/)

**Classification:** DECISION LAYER - Lightweight, focused

## Identified Issues

### 1. Database Re-Export Smell

**Location:** `database/index.ts:11`

```typescript
// CURRENT (problematic):
export { CampaignClient } from '../reviews/campaign-client.js';
```

**Problem:** The database module (foundation layer) imports from reviews (domain layer), violating layered architecture.

**Impact:**
- Layer violation - foundation shouldn't know about domain
- Confusing imports - consumers can import from two places
- Coupling - changes to reviews could affect database exports

**Fix:** Remove the re-export. Consumers import directly from `reviews/`.

### 2. Generated Script Pollution

**Location:** `scripts/execute-review-gen-*.ts` (67 files)

**Problem:** Auto-generated review execution scripts that are single-use artifacts.

**Impact:**
- Clutters the codebase with 67 throwaway files
- Makes finding real utility scripts difficult
- No cleanup/archival strategy

**Fix:** Either archive to `data/reviews/scripts/archive/`, delete after execution, or redesign to use direct CLI saves.

### 3. Missing Barrel Exports

**Location:** Various modules lack proper `index.ts` files

**Problem:** Complex subdirectories (html-gen/transforms/, pdf-gen/renderers/) lack clean barrel exports.

**Impact:**
- Consumers must know exact file paths
- Harder to refactor internal structure
- No clear public API

**Fix:** Add proper index.ts exports to each major subdirectory.

## Extraction Candidates

### Tier 1: Clean Extraction (Low Risk, High Value)

| Module | Files | Dependencies | Dependents | Effort | Value |
|--------|-------|--------------|------------|--------|-------|
| **pdf-gen/** | 24 | 0 internal | 2 commands | Easy | High |
| **events/** | 10 | 1 (errors) | 5 modules | Easy | Medium |
| **boardroom/** | 6 | 1 (events) | 8 commands | Easy | Medium |

#### pdf-gen/ — BEST CANDIDATE

- Zero internal dependencies (completely standalone)
- Heavy external deps: `pdfkit`, `cheerio`, `svg-to-pdfkit`
- Only 2 CLI commands depend on it
- Natural package boundary: `@razorweave/pdf-gen`

#### events/ — INFRASTRUCTURE EXTRACTION

- Only imports `errors/` (can inline or co-extract)
- Used by: boardroom, plans, cli/session-manager, agents
- Natural package: `@razorweave/events`

#### boardroom/ — DOMAIN EXTRACTION

- Only imports `events/writer`
- Self-contained decision tracking domain
- Could combine with events: `@razorweave/boardroom`

### Tier 2: Moderate Extraction (Some Refactoring Required)

| Module | Files | Dependencies | Dependents | Effort | Value |
|--------|-------|--------------|------------|--------|-------|
| **html-gen/** | 39 | 2 (database, books) | 5 commands | Medium | High |
| **personas/** | 10 | 3 (database, constants, logging) | 3 modules | Medium | Medium |
| **books/** | 6 | 2 (database, errors) | 18 modules | Medium | High |

#### html-gen/ — CONTENT GENERATION EXTRACTION

- Dependencies: `database/` (build-client), `books/types`
- Can inject database client as parameter instead of importing
- Natural package: `@razorweave/html-gen`
- Refactoring: Abstract database interface

### Tier 3: Complex Extraction (Significant Refactoring)

| Module | Files | Dependencies | Dependents | Effort | Value |
|--------|-------|--------------|------------|--------|-------|
| **reviews/** | 25 | 5 | 5 modules | Hard | Medium |
| **workflows/** | 22 | 3 | 15 modules | Hard | High |
| **w1/** | 13 | 5 | 7 commands | Hard | Low |
| **database/** | 24 | 1 | 25 modules | Very Hard | Critical |

## Extraction Priority Matrix

| Priority | Module | Effort | Value | Risk | Recommendation |
|----------|--------|--------|-------|------|----------------|
| **P0** | database/ re-export fix | 1 hour | High | None | Remove CampaignClient re-export |
| **P1** | pdf-gen/ | 2-4 hours | High | None | Extract to `@razorweave/pdf-gen` |
| **P1** | events/ | 2-4 hours | Medium | Low | Extract to `@razorweave/events` |
| **P2** | boardroom/ | 4-8 hours | Medium | Low | Extract with events |
| **P2** | html-gen/ | 8-16 hours | High | Medium | Abstract DB interface first |
| **P3** | books/ | 4-8 hours | Medium | Medium | Keep in tooling or extract with database |
| **P3** | personas/ | 4-8 hours | Low | Medium | Keep in tooling |
| **P4** | reviews/ | 16-24 hours | Medium | High | Refactor internals first |
| **P4** | workflows/ | 24-40 hours | High | High | Create workflow engine first |
| **P5** | w1/ | 40+ hours | Low | High | Wait for workflow framework |

## Proposed Package Structure

### Phase 1: Quick Wins

```
src/
├── shared/               # Keep: Foundation types, utils
├── tooling/              # Slimmed down
│   ├── database/         # Core persistence (fix circular dep)
│   ├── workflows/        # Workflow orchestration
│   ├── reviews/          # Review domain
│   ├── w1/               # W1 workflow
│   ├── personas/         # Persona domain
│   ├── books/            # Book management
│   ├── html-gen/         # HTML generation
│   ├── cli-commands/     # CLI entry points
│   ├── cli/              # CLI utilities
│   ├── errors/           # Error types
│   ├── logging/          # Logging
│   └── constants/        # Constants
├── pdf-gen/              # NEW: Extracted package
├── events/               # NEW: Extracted package
├── boardroom/            # NEW: Extracted package
├── agents/               # Keep
└── site/                 # Keep
```

### Phase 2: Domain Boundaries

```
src/
├── shared/
├── database/             # NEW: Core persistence package
│   ├── client.ts
│   ├── schema.ts
│   └── migrations/
├── workflows/            # NEW: Workflow engine package
│   ├── core/             # Generalized workflow engine
│   ├── w1/               # W1 implementation
│   └── w2/               # Future: W2 implementation
├── content-gen/          # NEW: Merged html-gen + pdf-gen
│   ├── html/
│   └── pdf/
├── reviews/              # NEW: Review system package
├── tooling/              # Slimmed: CLI only
│   ├── cli-commands/
│   └── cli/
├── agents/
└── site/
```

## Recommended Extraction Order

### Phase 1: Quick Wins (Week 1)

1. Fix `database/index.ts` re-export smell
2. Extract `pdf-gen/` → `@razorweave/pdf-gen`
3. Extract `events/` → `@razorweave/events`

### Phase 2: Domain Boundaries (Week 2-3)

1. Extract `boardroom/` (depends on events)
2. Clean up `html-gen/` interfaces
3. Standardize CLI command patterns

### Phase 3: Core Infrastructure (Week 4+)

1. Design workflow engine framework
2. Migrate `w1/` to workflow engine
3. Consider `database/` extraction

## Module Coupling Summary

### Low Coupling (Easy to Extract)

- `pdf-gen/` — Zero internal imports
- `events/` — Only imports errors/
- `boardroom/` — Only imports events/

### Medium Coupling (Needs Interface Abstraction)

- `html-gen/` — Imports database/, books/
- `books/` — Imports database/, errors/
- `personas/` — Imports database/, constants/, logging/

### High Coupling (Requires Significant Refactoring)

- `reviews/` — 5 internal dependencies
- `workflows/` — Central orchestration hub
- `w1/` — Domain-specific, many dependencies
- `cli-commands/` — Application layer, imports everything

## Next Steps

1. **Immediate:** Fix database re-export smell (P0)
2. **This Sprint:** Extract pdf-gen and events (P1)
3. **Next Sprint:** Design generalized workflow framework
4. **Future:** Consider full package restructure based on workflow patterns

## Appendix: Full Dependency Matrix

| Module | Type | Imports | Imported By | Status |
|--------|------|---------|-------------|--------|
| **database** | Foundation | 1-2 | 25+ | CRITICAL HUB |
| **workflows** | Middle | 2-3 | 15+ | PRIMARY SYSTEM |
| **reviews** | Domain | 4-5 | 5+ | SPECIALIZED |
| **w1** | Specialist | 4-5 | 7 | W1 PLANNING |
| **html-gen** | Generator | 2-3 | 5 | CONTENT |
| **pdf-gen** | Generator | 0 | 2 | ISOLATED |
| **events** | Infrastructure | 1-2 | 5+ | SHARED |
| **books** | Resource | 2-3 | 18+ | WIDELY USED |
| **personas** | Domain Data | 3-4 | 3+ | SPECIALIZED |
| **boardroom** | Decision | 1-2 | 8+ | TRACKING |
| **cli** | Presentation | 1-2 | 30+ | UBIQUITOUS |
| **cli-commands** | Application | 12+ | 0 | TOP LEVEL |

---

## Dead Code Analysis

This section identifies unused code, orphan files, and cleanup candidates across `src/tooling/`.

### Summary

| Category | Count | Impact | Action |
|----------|-------|--------|--------|
| Unused workflow files | 8 source + 7 test | ~2,000 lines | Delete or archive |
| Generated review scripts | 60+ | ~10,000 lines | Delete |
| Empty stub modules | 2 | Documentation debt | Complete or remove |
| Commented exports | 4 lines | Minor clutter | Delete comments |
| Stale fixtures directory | 1 | Empty dir | Delete |

### 1. Unused Workflow Files (VERIFIED)

**Location:** `src/tooling/workflows/`

These files are **never imported by application code** — only by their own tests:

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `escalation.ts` | ~150 | Escalation rules | UNUSED |
| `rejection-tracker.ts` | ~100 | Rejection state | UNUSED |
| `smart-router.ts` | ~200 | Smart routing | UNUSED |
| `routing-config.ts` | ~50 | Routing config | UNUSED |
| `event-emitter.ts` | ~100 | Event publishing | UNUSED |
| `trigger-engine.ts` | ~150 | Workflow triggers | UNUSED |
| `artifact-types.ts` | ~80 | Artifact type defs | UNUSED |
| `artifact-query.ts` | ~120 | Artifact queries | UNUSED |

**Still USED:**
- `repository.ts` — 15+ imports
- `state-machine.ts` — 2+ imports
- `artifact-registry.ts` — 7+ imports
- `types.ts` — 2+ imports

**Recommendation:** These appear to be **planned infrastructure** that was built but never integrated. Options:
1. Delete if no longer needed
2. Archive to `_archive/workflows/` for future reference
3. Keep if W2/W3/W4 will use them

### 2. Generated Review Scripts (VERIFIED)

**Location:** `src/tooling/scripts/execute-review-gen-*.ts`

**Count:** 60+ files, ~10,000 lines total

**Pattern:** `execute-review-gen-{timestamp}-{hash}.ts`

These are **single-use execution artifacts** that:
- Contain hardcoded review data
- Insert into database when run
- Have no imports from application code

**Recommendation:** Delete all. If history needed, they're in git.

### 3. Empty Stub Modules (VERIFIED)

#### `src/shared/types/index.ts`

```typescript
// Shared TypeScript types
// TODO: Define common types for Book, Persona, Agent, Config, etc.

export {};
```

**Impact:** Empty exports, TODO never addressed.

#### `src/agents/` Submodules

The index exports from 5 subdirectories, but none are imported anywhere in the codebase (only referenced in README):
- `content/`
- `review/`
- `playtest/`
- `pdf/`
- `release/`

**Recommendation:** Either implement or document as "planned."

### 4. Commented-Out Exports (VERIFIED)

**Location:** `src/tooling/updaters/index.ts`

```typescript
export * from './agents-updater.js';
// export * from './index-updater.js';      // ← file doesn't exist
// export * from './plan-updater.js';       // ← file doesn't exist
export * from './prompt-updater.js';
// export * from './readme-updater.js';     // ← file doesn't exist
// export * from './plan-archiver.js';      // ← file doesn't exist
```

**Recommendation:** Delete the 4 commented lines.

### 5. Empty Directories (VERIFIED)

**Location:** `src/tooling/__fixtures__/`

**Status:** Directory exists but contains no files.

**Recommendation:** Delete empty directory.

### 6. Potentially Unused Named Review Scripts

**Location:** `src/tooling/scripts/`

Besides the generated scripts, there are named review scripts:
- `execute-review-alex-indie-convert.ts`
- `execute-review-core-sarah-new-gm.ts`
- `execute-review-morgan-method-actor.ts`
- `execute-review-sarah-new-gm.ts`

**Status:** Same pattern as generated — likely execution artifacts.

**Recommendation:** Review and archive/delete if not needed.

### Dead Code by Module

```
src/tooling/
├── workflows/           # 8 UNUSED source files (~950 lines)
│   ├── escalation.ts         ← UNUSED
│   ├── rejection-tracker.ts  ← UNUSED
│   ├── smart-router.ts       ← UNUSED
│   ├── routing-config.ts     ← UNUSED
│   ├── event-emitter.ts      ← UNUSED
│   ├── trigger-engine.ts     ← UNUSED
│   ├── artifact-types.ts     ← UNUSED
│   ├── artifact-query.ts     ← UNUSED
│   ├── repository.ts         ✓ USED
│   ├── state-machine.ts      ✓ USED
│   ├── artifact-registry.ts  ✓ USED
│   └── types.ts              ✓ USED
├── scripts/             # 60+ UNUSED generated files (~10,000 lines)
│   └── execute-review-gen-*.ts  ← ALL UNUSED
├── updaters/            # 4 commented exports referencing non-existent files
│   └── index.ts              ← HAS DEAD COMMENTS
└── __fixtures__/        # EMPTY directory
```

### Estimated Cleanup Impact

| Action | Files Removed | Lines Removed |
|--------|---------------|---------------|
| Delete unused workflow files | 8 source + 7 test | ~2,000 |
| Delete generated scripts | 60+ | ~10,000 |
| Clean updaters/index.ts | 0 | 4 |
| Delete __fixtures__/ | 1 dir | 0 |
| **Total** | **~75+ files** | **~12,000 lines**

---

## Shared Patterns and Abstraction Opportunities

This section identifies repeated code patterns across `src/tooling/` that can be abstracted into reusable utilities.

### Summary of Duplication

| Pattern | Files Affected | Duplicate Lines | Reduction Potential |
|---------|----------------|-----------------|---------------------|
| **Repository Pattern** | 8 | 2,000+ | 50-70% |
| **CLI Commands** | 49 | 5,000+ | 40-60% |
| **Prompt Generation** | 5+ | 600+ | 60-70% |
| **File I/O** | 10+ | 400+ | 70-80% |
| **Database Schema** | 1 | 250+ | 60-70% |
| **Type Definitions** | 9 | 1,000+ | 30-40% |
| **Error Handling** | 30+ | 1,500+ | 70-80% |
| **TOTAL** | **112** | **~10,750 lines** | **50-65% reduction** |

### 1. Repository Pattern (CRITICAL)

**Problem:** 8 data access classes follow nearly identical patterns.

**Files:**
- `books/repository.ts` — BookRepository
- `workflows/repository.ts` — WorkflowRepository
- `w1/strategy-repository.ts` — StrategyRepository
- `reviews/campaign-client.ts` — CampaignClient
- `database/persona-client.ts` — PersonaClient
- `database/state-client.ts` — StateClient
- `database/artifact-client.ts` — ArtifactClient
- `database/snapshot-client.ts` — SnapshotClient

**Common Pattern:**
```typescript
class XxxRepository {
  constructor(db: Database.Database) {
    this.db = db;
  }

  getById(id: string): Entity | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM table WHERE id = ?');
      return stmt.get(id) as Entity | undefined ?? null;
    } catch (error) {
      throw new DatabaseError(`Failed to get: ${error.message}`);
    }
  }
  // ... same pattern for list, create, update, delete
}
```

**Abstraction:**
```typescript
// src/tooling/database/base-repository.ts
export abstract class BaseRepository<T, CreateInput, UpdateInput = Partial<T>> {
  constructor(protected db: Database.Database) {}

  protected execute<R>(operation: () => R, context: string): R {
    try {
      return operation();
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`${context}: ${error.message}`);
    }
  }

  protected transaction<R>(fn: () => R): R {
    return this.db.transaction(fn)();
  }
}
```

**Impact:** Remove ~2,000 lines of duplicate error handling.

### 2. CLI Command Pattern (HIGH PRIORITY)

**Problem:** 49 CLI commands repeat identical boilerplate.

**The 5-Step Boilerplate (150+ lines per command):**

```typescript
// Step 1: Project root resolution (repeated 30+ times)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Step 2: Database initialization (repeated 30+ times)
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
createTables(db);
runMigrations(dbPath);

// Step 3: Argument validation (similar patterns)
if (!requiredArg) {
  console.error(CLIFormatter.format({
    title: 'ERROR',
    content: 'Missing required argument',
    status: [{ label: 'Arg required', success: false }],
  }));
  process.exit(1);
}

// Step 4: Error handling wrapper (repeated 40+ times)
try {
  // business logic
} catch (error) {
  console.error(CLIFormatter.format({ title: 'ERROR', ... }));
  process.exit(1);
} finally {
  db.close();
}

// Step 5: Output formatting (consistent pattern)
console.log(CLIFormatter.format({ title, content, status, nextStep }));
```

**Abstraction:**
```typescript
// src/tooling/cli/command-builder.ts
interface CommandConfig<T> {
  name: string;
  args: ParseArgsConfig;
  requiresDb?: boolean;
  handler: (args: T, ctx: CommandContext) => Promise<void>;
}

async function createCommand<T>(config: CommandConfig<T>): Promise<void> {
  const projectRoot = getProjectRoot();
  const { values } = parseArgs(config.args);

  let db: Database | undefined;
  if (config.requiresDb) {
    db = initializeDatabase(resolve(projectRoot, 'data/project.db'));
  }

  try {
    await config.handler(values as T, { projectRoot, db, formatter: CLIFormatter });
  } catch (error) {
    console.error(CLIFormatter.format({ title: 'ERROR', content: error.message }));
    process.exit(1);
  } finally {
    db?.close();
  }
}
```

**Usage (reduced from 136 to ~40 lines):**
```typescript
createCommand({
  name: 'book:list',
  requiresDb: true,
  args: { options: { status: { type: 'string' } } },
  handler: async (args, { db, formatter }) => {
    const books = new BookRepository(db!).list();
    console.log(formatter.format({ title: 'BOOKS', content: formatBooks(books) }));
  },
});
```

**Impact:** Reduce 49 commands by 40-60% (~3,000 lines).

### 3. Prompt Generation Pattern

**Problem:** 5+ prompt generators repeat file loading and template composition.

**Files:**
- `w1/prompt-generator.ts` (1,481 lines)
- `reviews/prompt-generator.ts`
- `reviews/reviewer-prompt.ts`
- `reviews/analyzer-prompt.ts`

**Repeated Pattern:**
```typescript
// File loading (repeated 8+ times)
let content = '';
if (existsSync(join(dir, 'content.md'))) {
  content += readFileSync(join(dir, 'content.md'), 'utf-8');
}
if (existsSync(join(dir, 'mechanics.md'))) {
  content += readFileSync(join(dir, 'mechanics.md'), 'utf-8');
}

// Template composition (manual string interpolation)
return `# Title
## Context
- Book: ${context.bookName}
- Run: ${context.runId}

## Data
${loadedData}
`;
```

**Abstraction:**
```typescript
// src/tooling/prompts/builder.ts
class PromptBuilder {
  private sections = new Map<string, string>();

  loadFile(key: string, path: string, fallback = ''): this {
    this.sections.set(key, existsSync(path) ? readFileSync(path, 'utf-8') : fallback);
    return this;
  }

  loadDirectory(key: string, dir: string, files: string[]): this {
    const content = files
      .filter(f => existsSync(join(dir, f)))
      .map(f => `### ${f}\n${readFileSync(join(dir, f), 'utf-8')}`)
      .join('\n');
    this.sections.set(key, content);
    return this;
  }

  build(template: string): string {
    let result = template;
    for (const [key, value] of this.sections) {
      result = result.replace(`{{${key}}}`, value);
    }
    return result;
  }
}
```

**Impact:** Reduce prompt generators by 60-70%.

### 4. File I/O Pattern

**Problem:** Repeated file operations without consistent error handling.

**Repeated Patterns:**
```typescript
// Safe read with hash (appears 5+ times)
const content = readFileSync(path, 'utf-8');
const hash = createHash('sha256').update(content).digest('hex');

// Directory creation (appears 10+ times)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
writeFileSync(filepath, content);

// Frontmatter parsing (appears in lifecycle.ts, usable in 5+ places)
const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
```

**Abstraction:**
```typescript
// src/tooling/io/file-io.ts
class FileIO {
  static readWithHash(path: string): { content: string; hash: string } {
    const content = readFileSync(path, 'utf-8');
    return { content, hash: createHash('sha256').update(content).digest('hex') };
  }

  static writeAtomic(filepath: string, content: string): void {
    mkdirSync(dirname(filepath), { recursive: true });
    writeFileSync(filepath, content);
  }

  static parseFrontmatter<T>(content: string): { frontmatter: T | null; body: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { frontmatter: null, body: content };
    // parse YAML...
    return { frontmatter, body: match[2] };
  }

  static readOptional(path: string, fallback = ''): string {
    return existsSync(path) ? readFileSync(path, 'utf-8') : fallback;
  }
}
```

**Impact:** Remove ~400 lines of duplicate file handling.

### 5. Type Definitions Pattern

**Problem:** Similar types defined in 9+ separate files.

**Scattered Locations:**
- `database/types.ts`
- `books/types.ts`
- `workflows/types.ts`
- `w1/strategy-types.ts`
- `reviews/schemas.ts`
- `boardroom/types.ts`
- `events/types.ts`
- `validators/types.ts`
- `pdf-gen/types.ts`

**Common Patterns:**
```typescript
// All entities have timestamps
interface Entity {
  created_at: string;
  updated_at?: string;
  archived: boolean;
  archived_at: string | null;
}

// All have similar status unions
type Status = 'pending' | 'in_progress' | 'completed' | 'failed';

// All use similar CRUD input patterns
type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'archived'>;
```

**Abstraction:**
```typescript
// src/shared/types/base.ts
export interface TimestampedEntity {
  created_at: string;
  updated_at?: string;
}

export interface ArchivableEntity {
  archived: boolean;
  archived_at: string | null;
}

export interface DatabaseEntity extends TimestampedEntity, ArchivableEntity {
  id: string | number;
}

export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'archived' | 'archived_at'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at'>>;
```

**Impact:** Consolidate ~1,000 lines of type definitions.

### Recommended Implementation Order

| Priority | Abstraction | Effort | Impact | Dependencies |
|----------|-------------|--------|--------|--------------|
| **P1** | CLI Command Builder | 8-16 hrs | 3,000 lines | None |
| **P1** | Base Repository | 4-8 hrs | 2,000 lines | None |
| **P2** | Shared Types | 4-8 hrs | 1,000 lines | None |
| **P2** | PromptBuilder | 4-8 hrs | 600 lines | None |
| **P3** | FileIO Helper | 2-4 hrs | 400 lines | None |
| **P3** | Schema Builder | 2-4 hrs | 250 lines | None |

### Implementation Strategy

**Phase 1: Create Abstractions**
1. Create `cli/command-builder.ts`
2. Create `database/base-repository.ts`
3. Create `shared/types/base.ts`

**Phase 2: Incremental Migration**
1. Migrate 5 CLI commands to CommandBuilder (prove pattern)
2. Migrate 2 repositories to BaseRepository (prove pattern)
3. Update remaining files in batches

**Phase 3: Documentation**
1. Document patterns for new code
2. Add templates for new repos/commands
3. Update CONTRIBUTING.md with patterns

---

## Concrete Refactoring Recommendations

This section synthesizes all analysis rounds into a prioritized implementation plan with specific tasks, breaking changes, and migration paths.

### Implementation Phases

| Phase | Focus | Duration | Breaking Changes |
|-------|-------|----------|------------------|
| **Phase 0** | Dead code removal | 1 day | None |
| **Phase 1** | Quick fixes and abstractions | 2-3 days | Minor |
| **Phase 2** | Package extraction | 1 week | Moderate |
| **Phase 3** | Workflow engine design | 2 weeks | Significant |

---

### Phase 0: Dead Code Removal (No Breaking Changes)

**Goal:** Remove ~12,000 lines of dead code to reduce noise and clarify the codebase.

#### Task 0.1: Delete Generated Review Scripts

```bash
# Delete all generated execution scripts
rm src/tooling/scripts/execute-review-gen-*.ts
```

**Files removed:** 60+
**Lines removed:** ~10,000

#### Task 0.2: Delete Unused Workflow Files

```bash
# Delete unused workflow infrastructure
rm src/tooling/workflows/escalation.ts
rm src/tooling/workflows/rejection-tracker.ts
rm src/tooling/workflows/smart-router.ts
rm src/tooling/workflows/routing-config.ts
rm src/tooling/workflows/event-emitter.ts
rm src/tooling/workflows/trigger-engine.ts
rm src/tooling/workflows/artifact-types.ts
rm src/tooling/workflows/artifact-query.ts

# Delete corresponding tests
rm src/tooling/workflows/escalation.test.ts
rm src/tooling/workflows/rejection-tracker.test.ts
rm src/tooling/workflows/smart-router.test.ts
rm src/tooling/workflows/routing-config.test.ts
rm src/tooling/workflows/event-emitter.test.ts
rm src/tooling/workflows/trigger-engine.test.ts
rm src/tooling/workflows/artifact-query.test.ts
```

**Files removed:** 15
**Lines removed:** ~2,000

**Note:** Archive to `_archive/workflows/` if concepts may be useful for W2/W3/W4.

#### Task 0.3: Clean Up Stubs and Comments

**File:** `src/tooling/updaters/index.ts`
```diff
export * from './agents-updater.js';
-// export * from './index-updater.js';
-// export * from './plan-updater.js';
export * from './prompt-updater.js';
-// export * from './readme-updater.js';
-// export * from './plan-archiver.js';
```

**File:** Delete `src/tooling/__fixtures__/` (empty directory)

**File:** `src/shared/types/index.ts` — Either:
- Delete if unused
- Or add TODO issue to implement shared types

#### Task 0.4: Move Named Review Scripts to Data Directory

```bash
# Move execution artifacts out of source
mkdir -p data/reviews/scripts
mv src/tooling/scripts/execute-review-*.ts data/reviews/scripts/
```

**Rationale:** These are data artifacts, not source code.

---

### Phase 1: Quick Fixes and Abstractions (Minor Breaking Changes)

**Goal:** Establish foundational patterns that reduce duplication in new code.

#### Task 1.1: Fix Database Layer Violation (P0)

**File:** `src/tooling/database/index.ts`

```diff
// Remove re-export that violates layer boundaries
-export { CampaignClient } from '../reviews/campaign-client.js';
```

**Breaking Change:** Consumers importing `CampaignClient` from `database/` must update imports.

**Migration:**
```typescript
// Before
import { CampaignClient } from '../database/index.js';

// After
import { CampaignClient } from '../reviews/campaign-client.js';
```

**Files affected:** Search for `import.*CampaignClient.*database`

#### Task 1.2: Create Base Repository Class

**New file:** `src/tooling/database/base-repository.ts`

```typescript
import Database from 'better-sqlite3';
import { DatabaseError } from '../errors/database-error.js';

export interface TimestampedEntity {
  created_at: string;
  updated_at?: string;
}

export interface ArchivableEntity {
  archived: boolean;
  archived_at: string | null;
}

export abstract class BaseRepository<
  T extends TimestampedEntity,
  CreateInput,
  UpdateInput = Partial<T>
> {
  constructor(protected readonly db: Database.Database) {}

  protected execute<R>(operation: () => R, context: string): R {
    try {
      return operation();
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`${context}: ${message}`);
    }
  }

  protected transaction<R>(fn: () => R): R {
    return this.db.transaction(fn)();
  }

  protected generateId(): string {
    const prefix = this.getIdPrefix();
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${timestamp}${random}`;
  }

  protected abstract getIdPrefix(): string;
}
```

**Migration:** Incremental — new repos extend BaseRepository, existing repos migrated over time.

#### Task 1.3: Create CLI Command Builder

**New file:** `src/tooling/cli/command-builder.ts`

```typescript
import { parseArgs, ParseArgsConfig } from 'node:util';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';
import { runMigrations } from '../database/migrate.js';
import { CLIFormatter } from './formatter.js';

export interface CommandContext {
  projectRoot: string;
  db: Database.Database | null;
  formatter: typeof CLIFormatter;
  args: Record<string, unknown>;
}

export interface CommandConfig<T = Record<string, unknown>> {
  name: string;
  description: string;
  args?: ParseArgsConfig['options'];
  requiresDb?: boolean;
  handler: (ctx: CommandContext & { args: T }) => Promise<void>;
}

export function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

export async function createCommand<T>(config: CommandConfig<T>): Promise<void> {
  const projectRoot = getProjectRoot();
  const { values } = parseArgs({
    options: config.args ?? {},
    allowPositionals: true,
  });

  let db: Database.Database | null = null;

  if (config.requiresDb) {
    const dbPath = resolve(projectRoot, 'data/project.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    runMigrations(dbPath);
  }

  try {
    await config.handler({
      projectRoot,
      db,
      formatter: CLIFormatter,
      args: values as T,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(CLIFormatter.format({
      title: `${config.name.toUpperCase()} ERROR`,
      content: message,
      status: [{ label: 'Failed', success: false }],
    }));
    process.exit(1);
  } finally {
    db?.close();
  }
}
```

**Migration:** New commands use `createCommand()`. Existing commands migrated in batches.

#### Task 1.4: Create PromptBuilder Utility

**New file:** `src/tooling/prompts/builder.ts`

```typescript
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export class PromptBuilder {
  private sections = new Map<string, string>();
  private context = new Map<string, unknown>();

  /**
   * Load content from a file, using fallback if file doesn't exist.
   */
  loadFile(key: string, path: string, fallback = ''): this {
    this.sections.set(key, existsSync(path) ? readFileSync(path, 'utf-8') : fallback);
    return this;
  }

  /**
   * Load multiple files from a directory into a single section.
   */
  loadDirectory(key: string, dir: string, files: string[]): this {
    const content = files
      .filter(f => existsSync(join(dir, f)))
      .map(f => `### ${f}\n${readFileSync(join(dir, f), 'utf-8')}`)
      .join('\n\n');
    this.sections.set(key, content);
    return this;
  }

  /**
   * Add raw content to a section.
   */
  addSection(key: string, content: string): this {
    this.sections.set(key, content);
    return this;
  }

  /**
   * Add context variable for template interpolation.
   */
  addContext(key: string, value: unknown): this {
    this.context.set(key, value);
    return this;
  }

  /**
   * Build the final prompt by interpolating sections and context.
   */
  build(template: string): string {
    let result = template;

    // Replace section placeholders {{section:key}}
    for (const [key, value] of this.sections) {
      result = result.replace(new RegExp(`\\{\\{section:${key}\\}\\}`, 'g'), value);
    }

    // Replace context placeholders {{context:key}}
    for (const [key, value] of this.context) {
      result = result.replace(new RegExp(`\\{\\{context:${key}\\}\\}`, 'g'), String(value));
    }

    return result;
  }
}
```

**Migration:** New prompt generators use PromptBuilder. W1 prompt-generator.ts can be refactored incrementally.

#### Task 1.5: Create FileIO Helper

**New file:** `src/tooling/io/file-io.ts`

```typescript
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

export class FileIO {
  /**
   * Read file and compute SHA-256 hash.
   */
  static readWithHash(path: string): { content: string; hash: string } {
    const content = readFileSync(path, 'utf-8');
    return {
      content,
      hash: createHash('sha256').update(content).digest('hex'),
    };
  }

  /**
   * Write file, creating parent directories if needed.
   */
  static writeAtomic(filepath: string, content: string): void {
    mkdirSync(dirname(filepath), { recursive: true });
    writeFileSync(filepath, content);
  }

  /**
   * Read file if exists, otherwise return fallback.
   */
  static readOptional(path: string, fallback = ''): string {
    return existsSync(path) ? readFileSync(path, 'utf-8') : fallback;
  }

  /**
   * Parse YAML frontmatter from markdown content.
   */
  static parseFrontmatter<T>(content: string): { frontmatter: T | null; body: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { frontmatter: null, body: content };

    // Simple YAML parsing (or use yaml library)
    const yamlContent = match[1];
    const lines = yamlContent.split('\n');
    const frontmatter: Record<string, string> = {};

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        frontmatter[key] = value;
      }
    }

    return { frontmatter: frontmatter as T, body: match[2] };
  }
}
```

---

### Phase 2: Package Extraction (Moderate Breaking Changes)

**Goal:** Extract standalone modules into separate workspace packages.

#### Task 2.1: Extract pdf-gen Package

**New package:** `src/pdf-gen/`

```
src/pdf-gen/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── renderer.ts
│   ├── fonts/
│   ├── styles/
│   └── renderers/
└── README.md
```

**package.json:**
```json
{
  "name": "@razorweave/pdf-gen",
  "version": "0.1.0",
  "type": "module",
  "exports": "./dist/index.js",
  "dependencies": {
    "pdfkit": "^0.15.0",
    "svg-to-pdfkit": "^0.1.8",
    "cheerio": "^1.0.0"
  }
}
```

**Breaking Change:** Import paths change.

**Migration:**
```typescript
// Before
import { PDFRenderer } from '../pdf-gen/renderer.js';

// After
import { PDFRenderer } from '@razorweave/pdf-gen';
```

#### Task 2.2: Extract events Package

**New package:** `src/events/`

Move from `src/tooling/events/` to standalone package.

**Breaking Change:** Import paths change.

#### Task 2.3: Extract boardroom Package

**New package:** `src/boardroom/`

Move from `src/tooling/boardroom/` to standalone package.

**Breaking Change:** Import paths change.

---

### Phase 3: Workflow Engine Design (Significant Changes)

**Goal:** Create a generalized workflow framework for W2, W3, W4.

#### Analysis: Common Patterns Across W1-W4

All four workflow proposals (`docs/plans/proposals/w{1-4}-*.md`) share identical architectural patterns:

| Pattern | W1 | W2 | W3 | W4 |
|---------|----|----|----|----|
| **Strategic Command** | `w1:strategic` | `w2:strategic` | `w3:strategic` | `w4:strategic` |
| **State Tracking** | `current_phase` JSON | `current_phase` JSON | `current_phase` JSON | `current_phase` JSON |
| **Prompt Location** | `data/w1-prompts/` | `data/w2-prompts/` | `data/w3-prompts/` | `data/w4-prompts/` |
| **Module Structure** | `w1/prompt-generator.ts` | `w2/prompt-generator.ts` | `w3/prompt-generator.ts` | `w4/prompt-generator.ts` |
| **CLI Pattern** | `--run` / `--save` | `--run` / `--save` | `--run` / `--save` | `--run` / `--save` |
| **Human Gate** | Yes | Yes | Yes | No (automated) |
| **Recovery/Resume** | `--resume=<id>` | `--resume=<id>` | `--resume=<id>` | `--resume=<id>` |

**Key Insight:** Building W2/W3/W4 without a shared engine means duplicating:
- ~500 lines of state machine logic per workflow
- ~300 lines of prompt writing boilerplate per workflow
- ~200 lines of artifact management per workflow
- ~400 lines of CLI orchestration per workflow

**Total duplication avoided:** ~4,200 lines across W2/W3/W4

#### Task 3.1: Design Workflow Engine Interface

Based on the W1-W4 proposal analysis, the workflow engine should support:

```typescript
// src/workflows/core/engine.ts

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  promptGenerator: (ctx: WorkflowContext) => string;
  validator?: (result: string) => ValidationResult;
  nextStep?: string | ((result: string) => string);
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  steps: WorkflowStep[];
  initialStep: string;
  artifacts: ArtifactDefinition[];
}

export interface WorkflowContext {
  runId: string;
  step: WorkflowStep;
  previousResults: Map<string, string>;
  artifacts: Map<string, unknown>;
  projectRoot: string;
  db: Database.Database;
}

export class WorkflowEngine {
  constructor(private definition: WorkflowDefinition) {}

  async start(context: Partial<WorkflowContext>): Promise<WorkflowRun> { /* ... */ }
  async resume(runId: string): Promise<WorkflowRun> { /* ... */ }
  async executeStep(run: WorkflowRun, input: string): Promise<StepResult> { /* ... */ }
  generatePrompt(run: WorkflowRun): string { /* ... */ }
}
```

#### Task 3.2: Create Workflow Definitions

Each workflow becomes a configuration file defining steps, transitions, and artifacts:

```typescript
// src/workflows/definitions/w1.ts
export const W1_DEFINITION: WorkflowDefinition = {
  id: 'w1',
  name: 'W1 Content Editing',
  version: '1.0.0',
  phases: ['verify-foundation', 'planning', 'content-modify', 'validate', 'human-gate', 'finalize'],
  initialPhase: 'verify-foundation',
  hasHumanGate: true,
  artifactDir: 'data/w1-artifacts',
  promptDir: 'data/w1-prompts',
  steps: [/* W1-specific steps */],
  artifacts: [
    { type: 'improvement-plan', schema: ImprovementPlanSchema },
    { type: 'chapter-changes', schema: ChapterChangesSchema },
  ],
};

// src/workflows/definitions/w2.ts
export const W2_DEFINITION: WorkflowDefinition = {
  id: 'w2',
  name: 'W2 PDF Generation',
  version: '1.0.0',
  phases: ['pm-review', 'layout', 'design', 'creation', 'editor-review', 'human-gate', 'finalize'],
  initialPhase: 'pm-review',
  hasHumanGate: true,
  artifactDir: 'data/w2-artifacts',
  promptDir: 'data/w2-prompts',
  inputArtifacts: ['w1:release-notes', 'w1:print-html'],  // From W1
  steps: [/* W2-specific steps */],
  artifacts: [
    { type: 'pdf-draft', schema: PdfDraftSchema },
    { type: 'layout-plan', schema: LayoutPlanSchema },
    { type: 'design-plan', schema: DesignPlanSchema },
    { type: 'pdf-digital', schema: PdfFinalSchema },
    { type: 'pdf-print', schema: PdfFinalSchema },
  ],
};

// src/workflows/definitions/w3.ts
export const W3_DEFINITION: WorkflowDefinition = {
  id: 'w3',
  name: 'W3 Publication',
  version: '1.0.0',
  phases: ['release-check', 'qa', 'marketing', 'human-gate', 'deploy', 'announce'],
  initialPhase: 'release-check',
  hasHumanGate: true,
  artifactDir: 'data/w3-artifacts',
  promptDir: 'data/w3-prompts',
  inputArtifacts: ['w1:web-html', 'w2:pdf-digital', 'w2:pdf-print'],  // From W1+W2
  steps: [/* W3-specific steps */],
  artifacts: [
    { type: 'qa-report', schema: QaReportSchema },
    { type: 'marketing-copy', schema: MarketingSchema },
    { type: 'deployment-manifest', schema: DeploymentSchema },
  ],
};

// src/workflows/definitions/w4.ts
export const W4_DEFINITION: WorkflowDefinition = {
  id: 'w4',
  name: 'W4 Playtesting',
  version: '1.0.0',
  phases: ['setup', 'session', 'analysis', 'feedback'],
  initialPhase: 'setup',
  hasHumanGate: false,  // W4 is automated feedback loop
  artifactDir: 'data/w4-artifacts',
  promptDir: 'data/w4-prompts',
  inputArtifacts: ['w3:published-book'],  // From W3
  outputTo: 'w1',  // Feedback flows back to W1
  steps: [/* W4-specific steps */],
  artifacts: [
    { type: 'playtest-session', schema: SessionSchema },
    { type: 'playtest-analysis', schema: AnalysisSchema },
    { type: 'playtest-feedback', schema: FeedbackSchema },
  ],
};
```

#### Task 3.3: Shared Workflow Infrastructure

The workflow engine provides these shared components:

| Component | Description | Lines Saved |
|-----------|-------------|-------------|
| `WorkflowEngine` | State machine, transitions, recovery | ~500/workflow |
| `PromptWriter` | Writes prompts to `data/w{N}-prompts/` | ~150/workflow |
| `ResultSaver` | Saves Claude Code output, validates schema | ~150/workflow |
| `ArtifactRegistry` | Registers workflow artifacts | ~100/workflow |
| `StrategicCommand` | Unified `--run`, `--resume`, `--list` CLI | ~300/workflow |
| `HumanGate` | Approval checkpoint with prompts | ~100/workflow |

**Proposed Module Structure:**

```
src/workflows/
├── core/
│   ├── engine.ts              # WorkflowEngine class
│   ├── state-machine.ts       # Phase transitions
│   ├── prompt-writer.ts       # Generic prompt file writer
│   ├── result-saver.ts        # Generic result saver
│   ├── human-gate.ts          # Human approval checkpoint
│   └── types.ts               # Shared workflow types
├── definitions/
│   ├── w1.ts                  # W1 definition
│   ├── w2.ts                  # W2 definition
│   ├── w3.ts                  # W3 definition
│   └── w4.ts                  # W4 definition
├── prompts/
│   ├── w1/                    # W1-specific prompt generators
│   ├── w2/                    # W2-specific prompt generators
│   ├── w3/                    # W3-specific prompt generators
│   └── w4/                    # W4-specific prompt generators
└── cli/
    └── strategic.ts           # Unified strategic command handler
```

#### Task 3.4: Unified Strategic CLI

All workflows use the same CLI pattern:

```typescript
// src/workflows/cli/strategic.ts
import { WorkflowEngine } from '../core/engine.js';
import { W1_DEFINITION, W2_DEFINITION, W3_DEFINITION, W4_DEFINITION } from '../definitions/index.js';

const WORKFLOWS = { w1: W1_DEFINITION, w2: W2_DEFINITION, w3: W3_DEFINITION, w4: W4_DEFINITION };

// Unified entry point for all workflows
createCommand({
  name: 'workflow:strategic',
  args: {
    workflow: { type: 'string', short: 'w' },      // w1, w2, w3, w4
    book: { type: 'string', short: 'b' },
    resume: { type: 'string' },
    list: { type: 'boolean' },
    from: { type: 'string' },                       // --from-w1=<id>, --from-w2=<id>
  },
  requiresDb: true,
  async handler({ args, db, projectRoot }) {
    const definition = WORKFLOWS[args.workflow];
    const engine = new WorkflowEngine(definition, db);

    if (args.list) {
      return engine.listRuns();
    }
    if (args.resume) {
      return engine.resume(args.resume);
    }
    return engine.start({ bookSlug: args.book, inputRunId: args.from });
  },
});
```

**Usage (replaces 4 separate strategic commands):**
```bash
pnpm workflow:strategic -w w1 --book core-rulebook
pnpm workflow:strategic -w w2 --book core-rulebook --from-w1 strat_abc123
pnpm workflow:strategic -w w3 --book core-rulebook --from-w2 strat_def456
pnpm workflow:strategic -w w4 --book core-rulebook --from-w3 strat_ghi789
pnpm workflow:strategic -w w1 --resume strat_abc123
```

---

### Package.json Script Organization

#### Current Problem

73 scripts in package.json with no clear organization:

```json
{
  "scripts": {
    "build": "...",
    "test": "...",
    "review:book": "...",
    "review:chapter": "...",
    "html:print:build": "...",
    "w1:verify-foundation": "...",
    // ... 67 more
  }
}
```

#### Recommended Structure

**Option A: Script Prefixes (Current Pattern, Improved)**

```json
{
  "scripts": {
    "// === BUILD & TEST ===": "",
    "build": "pnpm -r build",
    "test": "vitest run",
    "typecheck": "pnpm -r typecheck",

    "// === DATABASE ===": "",
    "db:migrate": "tsx src/tooling/cli-commands/db-migrate.ts",
    "db:seed": "tsx src/tooling/cli-commands/db-seed.ts",
    "db:verify": "tsx src/tooling/cli-commands/db-verify.ts",

    "// === BOOKS ===": "",
    "book:list": "tsx src/tooling/cli-commands/book-list.ts",
    "book:register": "tsx src/tooling/cli-commands/book-register.ts",
    "build:book": "tsx src/tooling/cli-commands/build-book.ts",

    "// === REVIEWS ===": "",
    "review:book": "tsx src/tooling/cli-commands/run.ts review book",
    "review:status": "tsx src/tooling/cli-commands/run.ts review status",

    "// === W1 WORKFLOW ===": "",
    "w1:verify-foundation": "tsx src/tooling/cli-commands/w1-verify-foundation.ts",
    "w1:planning": "tsx src/tooling/cli-commands/w1-planning.ts"
  }
}
```

**Option B: Single CLI Entry Point**

Create unified CLI that replaces individual scripts:

```json
{
  "scripts": {
    "cli": "tsx src/tooling/cli-commands/run.ts"
  }
}
```

Usage:
```bash
pnpm cli db migrate
pnpm cli book list
pnpm cli review book --book-id core
pnpm cli w1 verify-foundation --run-id xyz
```

**Recommendation:** Option B is cleaner long-term but requires CLI refactoring.

---

### Breaking Changes Summary

| Phase | Change | Impact | Migration |
|-------|--------|--------|-----------|
| 1 | CampaignClient import path | Low | Find/replace imports |
| 2 | pdf-gen package path | Low | Find/replace imports |
| 2 | events package path | Low | Find/replace imports |
| 2 | boardroom package path | Low | Find/replace imports |
| 3 | W1 command structure | Medium | Document new CLI usage |
| 3 | Workflow state schema | Medium | Migration script |

---

### Success Metrics

| Metric | Before | After Target | Measurement |
|--------|--------|--------------|-------------|
| Files in tooling/ | 600+ | <400 | `find src/tooling -type f | wc -l` |
| Dead code lines | ~12,000 | 0 | Analysis |
| Duplicate code | ~10,750 | <3,000 | Analysis |
| CLI command boilerplate | 150 lines/cmd | 40 lines/cmd | Average |
| Repository boilerplate | 300 lines/repo | 100 lines/repo | Average |
| Package count | 4 | 7-8 | `ls src/*/package.json` |

---

### Implementation Checklist

#### Phase 0: Dead Code Removal
- [ ] Delete `src/tooling/scripts/execute-review-gen-*.ts`
- [ ] Delete unused workflow files (8 source + 7 test)
- [ ] Clean `src/tooling/updaters/index.ts` comments
- [ ] Delete `src/tooling/__fixtures__/`
- [ ] Move named review scripts to `data/reviews/scripts/`
- [ ] Verify tests still pass
- [ ] Commit with message: "chore: remove dead code (~12,000 lines)"

#### Phase 1: Quick Fixes
- [ ] Fix database re-export layer violation
- [ ] Create `src/tooling/database/base-repository.ts`
- [ ] Create `src/tooling/cli/command-builder.ts`
- [ ] Create `src/tooling/prompts/builder.ts`
- [ ] Create `src/tooling/io/file-io.ts`
- [ ] Migrate 3 CLI commands to CommandBuilder (proof of concept)
- [ ] Migrate 2 repositories to BaseRepository (proof of concept)
- [ ] Document patterns in `docs/style_guides/typescript/`
- [ ] Commit incrementally

#### Phase 2: Package Extraction
- [ ] Extract `pdf-gen/` to `@razorweave/pdf-gen`
- [ ] Extract `events/` to `@razorweave/events`
- [ ] Extract `boardroom/` to `@razorweave/boardroom`
- [ ] Update all import paths
- [ ] Update pnpm-workspace.yaml
- [ ] Verify builds and tests pass

#### Phase 3: Workflow Engine
- [ ] Design workflow engine interfaces
- [ ] Implement core WorkflowEngine class
- [ ] Migrate W1 to use workflow engine
- [ ] Document workflow pattern for W2/W3/W4
- [ ] Create workflow definition template

---

---

## Data Synchronization Analysis

This section analyzes the data flow between `books/`, `data/`, `src/site/`, and the database to identify synchronization issues.

### Current Data Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOURCE OF TRUTH                                    │
│        books/core/v1.3.0/chapters/*.md  (30+ markdown files)                │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼ (html-gen/ build)
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GENERATED OUTPUTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  data/html/web-reader/core-rulebook.html     (644KB)  ← Generated HTML      │
│  data/html/print/core-rulebook/*.html        (print versions)               │
│  data/html/review/core-rulebook/*.html       (review builds)                │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼ (w1-finalize-web-html.ts copies)
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEBSITE (src/site/)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  src/site/pages/read.html                    (644KB)  ← COPY of web-reader  │
│  src/site/core_rulebook.html                 (610KB)  ← STALE older copy?   │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Eleventy builds to dist/)
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYED SITE                                        │
│                    src/site/dist/read.html                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE (data/project.db)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  books (1 row)              - Metadata only                                  │
│  book_versions (9 rows)     - FULL HTML CONTENT stored! (~600KB each)       │
│  chapter_versions (0 rows)  - NOT USED despite infrastructure existing      │
│  html_builds (8 rows)       - Build metadata (paths, hashes)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Identified Synchronization Issues

#### Issue 1: Same Content in Multiple Locations

| Location | Size | Purpose | Sync Status |
|----------|------|---------|-------------|
| `data/html/web-reader/core-rulebook.html` | 644KB | Generated output | **SOURCE** |
| `src/site/pages/read.html` | 644KB | Website source | Copy of above |
| `src/site/core_rulebook.html` | 610KB | Unknown | **STALE** (different size) |
| `book_versions.content` | ~600KB×9 | Database storage | Redundant copies |

**Problem:** The same HTML content exists in 3+ places, with unclear synchronization.

**Evidence:**
```bash
$ wc -c src/site/core_rulebook.html data/html/web-reader/core-rulebook.html
  610266 src/site/core_rulebook.html      # ← DIFFERENT SIZE (stale?)
  644501 data/html/web-reader/core-rulebook.html
```

#### Issue 2: Database Stores Full HTML Content

The `book_versions` table stores **entire HTML files** in the `content` column:

```sql
-- book_versions schema
content_id TEXT PRIMARY KEY,
book_path TEXT NOT NULL,
version TEXT NOT NULL,
content TEXT NOT NULL,        -- ← STORES FULL 600KB HTML!
file_hash TEXT,
...
```

**Impact:**
- Database is 6MB (should be <1MB for metadata)
- 9 versions × ~600KB = ~5.4MB of HTML in database
- Redundant with files on disk
- Makes database queries slow

#### Issue 3: Chapter Versioning Infrastructure Unused

The `chapter_versions` table and `SnapshotClient.createChapterSnapshot()` exist but are never called:

```sql
SELECT COUNT(*) FROM chapter_versions;  -- Returns: 0
```

**Impact:**
- Can't track individual chapter changes
- Can't rollback specific chapters
- Can't compare chapter versions over time
- Claude Code can't reliably read chapter history

#### Issue 4: Path Inconsistency in Database

```sql
-- book_versions shows mixed absolute/relative paths:
book-da55c10d5fab | /Users/pandorz/Documents/razorweave/src/site/core_rulebook.html  -- ABSOLUTE
book-2025-11-24T02-21-50 | books/core/v1.3.0                                         -- RELATIVE
```

**Impact:** Code must handle both path formats, leading to bugs.

#### Issue 5: No Clear Consumer Documentation

| Consumer | Should Read From | Currently Reads From |
|----------|------------------|---------------------|
| **Humans (editing)** | `books/core/v1.3.0/chapters/*.md` | ✓ Correct |
| **Claude Code (analysis)** | ? | Multiple places |
| **Website** | `src/site/pages/read.html` | ✓ Correct |
| **PDF pipeline** | ? | `data/html/print/` |
| **Review system** | ? | Multiple places |

### Recommended Data Architecture

#### Principle: Single Source of Truth Per Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: SOURCE (Human + Claude editable)                                   │
│  Location: books/core/v{version}/chapters/*.md                               │
│  Consumer: Humans, Claude Code, html-gen                                     │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼ (build command)
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: BUILD OUTPUTS (Generated, never edited)                            │
│  Location: data/html/{type}/{book-slug}/                                     │
│  Types: web-reader/, print/, review/                                         │
│  Consumer: Website, PDF pipeline, review system                              │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼ (deploy/copy)
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: DEPLOYMENT (Website source)                                        │
│  Location: src/site/pages/read.html (symlink or copy)                        │
│  Consumer: Eleventy site generator                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  DATABASE: METADATA ONLY                                                     │
│  - books: Book registry                                                      │
│  - book_versions: Version metadata + file_hash (NOT content)                 │
│  - chapter_versions: Chapter metadata + file_hash (NOT content)              │
│  - html_builds: Build metadata + output_path                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Concrete Fixes

#### Fix 1: Remove HTML Content from Database

**Current schema (wasteful):**
```sql
CREATE TABLE book_versions (
  content TEXT NOT NULL,  -- Stores 600KB HTML
  ...
);
```

**Proposed schema (efficient):**
```sql
CREATE TABLE book_versions (
  -- content TEXT NOT NULL,  -- REMOVE
  source_path TEXT NOT NULL,   -- Path to markdown source
  output_path TEXT NOT NULL,   -- Path to generated HTML
  file_hash TEXT NOT NULL,     -- SHA256 for integrity check
  ...
);
```

**Migration:**
1. Export existing data if needed for history
2. Drop `content` column
3. Update `SnapshotClient` to not store content

**Impact:** Database shrinks from ~6MB to <500KB.

#### Fix 2: Activate Chapter Versioning

**Add to W1 workflow:**
```typescript
// In w1-content-modify.ts, after Claude modifies a chapter:
const snapshotClient = new SnapshotClient(db);
snapshotClient.createChapterSnapshot(chapterPath, 'claude');
```

**Add git hook:**
```typescript
// In post-commit hook:
const changedChapters = getChangedMarkdownFiles();
for (const chapter of changedChapters) {
  snapshotClient.createChapterSnapshot(chapter, 'git', { commitSha });
}
```

#### Fix 3: Remove Stale Files

```bash
# Delete stale/duplicate HTML files
rm src/site/core_rulebook.html           # Stale (610KB vs 644KB)
rm src/site/read.html.backup             # Backup file
rm books/core/v1.3.0/chapters/*.backup   # Chapter backups

# Clean up database test artifacts
rm data/test-cli-commands/
rm data/test-workflow-cli/
```

#### Fix 4: Standardize Paths in Database

**Add migration to normalize paths:**
```sql
-- Convert absolute paths to relative
UPDATE book_versions
SET book_path = REPLACE(book_path, '/Users/pandorz/Documents/razorweave/', '')
WHERE book_path LIKE '/Users/%';
```

**Enforce in code:**
```typescript
// In SnapshotClient.createBookSnapshot():
const relativePath = bookPath.replace(projectRoot + '/', '');
```

#### Fix 5: Document Data Flow

Create `docs/architecture/data-flow.md`:

```markdown
# Data Flow Architecture

## Source of Truth
- **Markdown source:** `books/{book}/v{version}/chapters/*.md`
- **Book metadata:** `data/project.db` → `books` table

## Generated Outputs (never edit directly)
- **Web HTML:** `data/html/web-reader/{slug}.html`
- **Print HTML:** `data/html/print/{slug}/`
- **PDFs:** `data/pdfs/{slug}/`

## Deployment
- **Website:** `src/site/pages/read.html` ← copy of web HTML
- **Site build:** `src/site/dist/`

## Database Contents
- `books` - Book registry (metadata only)
- `book_versions` - Version history (hashes, not content)
- `chapter_versions` - Chapter history (hashes, not content)
- `html_builds` - Build records
- `workflow_runs` - Workflow state
```

### Data Synchronization Implementation Checklist

#### Phase 0: Cleanup
- [ ] Delete `src/site/core_rulebook.html` (stale)
- [ ] Delete `*.backup` files in chapters/
- [ ] Delete test data directories
- [ ] Verify `src/site/pages/read.html` matches `data/html/web-reader/`

#### Phase 1: Database Schema Fix
- [ ] Create migration to drop `content` column from `book_versions`
- [ ] Create migration to drop `content` column from `chapter_versions`
- [ ] Add `source_path` and `output_path` columns
- [ ] Normalize all paths to relative
- [ ] Update `SnapshotClient` to not store content

#### Phase 2: Activate Chapter Versioning
- [ ] Call `createChapterSnapshot()` in W1 content-modify
- [ ] Add git post-commit hook for chapter snapshots
- [ ] Test chapter history retrieval

#### Phase 3: Documentation
- [ ] Create `docs/architecture/data-flow.md`
- [ ] Document which files are human-editable vs generated
- [ ] Add comments to key files indicating their role

---

## Appendix: File Counts by Module

```
src/tooling/
├── cli-commands/     47 files   (APPLICATION LAYER)
├── html-gen/         39 files   (CONTENT GENERATION)
├── scripts/          77 files   (60+ dead, 17 live)
├── reviews/          25 files   (DOMAIN)
├── pdf-gen/          24 files   (ISOLATED - extract)
├── workflows/        22 files   (8 dead, 14 live)
├── database/         24 files   (FOUNDATION)
├── w1/               13 files   (SPECIALIST)
├── events/           10 files   (INFRASTRUCTURE)
├── personas/         10 files   (DOMAIN DATA)
├── linters/           8 files   (CONFIG)
├── boardroom/         6 files   (DECISION)
├── books/             6 files   (RESOURCE)
├── plans/             6 files   (SERVICE)
├── agents/            5 files   (STUB)
├── cli/               5 files   (PRESENTATION)
├── validators/        4 files   (VALIDATION)
├── updaters/          4 files   (MAINTENANCE)
├── e2e/               3 files   (TESTS)
├── logging/           2 files   (INFRASTRUCTURE)
├── errors/            2 files   (INFRASTRUCTURE)
└── constants/         1 file    (CONFIG)
```

---

## Unified Implementation Roadmap

This section integrates all proposals (tooling extraction, data synchronization, workflow engine, data pipeline) into a single prioritized roadmap broken into manageable work cycles.

### Proposal Integration Summary

| Proposal | Source | Key Deliverables | Dependencies |
|----------|--------|------------------|--------------|
| **Tooling Extraction** | This document | Package extraction, shared abstractions | None |
| **Data Synchronization** | This document | Database cleanup, path normalization | None |
| **Workflow Engine** | This document + W2/W3/W4 proposals | Generalized workflow framework | Phase 1 abstractions |
| **Data Pipeline** | `docs/plans/proposals/data-pipeline.md` | Reader analytics, feedback system | Phase 2+ (revised) |

### Cloudflare D1 Consideration

The data pipeline proposal calls for Cloudflare Workers + D1 for reader analytics. However, since razorweave is deployed via GitHub Pages:

**Challenge:** D1 can't sync directly to `data/project.db` (local SQLite file).

**Revised Approach:**
1. **Option A: D1 as Separate Analytics Store** - Keep D1 for reader analytics only, pull data via API for local analysis
2. **Option B: GitHub Actions + JSON** - Use GitHub Actions to collect analytics to JSON files in repo
3. **Option C: External Analytics** - Use Plausible/Fathom for reader analytics, keep project.db for tooling only

**Recommendation:** Option A - D1 for analytics, local SQLite for tooling. They serve different purposes:
- `data/project.db` = Local development tooling (workflows, reviews, builds)
- `D1` = Production reader analytics (page views, feature usage, feedback)

Data can be pulled from D1 periodically via the Cloudflare API for analysis.

---

### Work Cycle 0: Foundation Cleanup (1-2 days)

**Goal:** Remove noise, establish clean baseline for all subsequent work.

**Deliverables:**
- [ ] ~12,000 lines of dead code removed
- [ ] Stale/duplicate files cleaned up
- [ ] Database paths normalized
- [ ] Clear baseline for measuring future improvements

**Tasks:**

| Task | Description | Impact |
|------|-------------|--------|
| 0.1 | Delete generated review scripts (`execute-review-gen-*.ts`) | -10,000 lines |
| 0.2 | Delete unused workflow files (8 source + 7 test) | -2,000 lines |
| 0.3 | Clean updaters/index.ts comments | -4 lines |
| 0.4 | Delete empty `__fixtures__/` directory | -1 dir |
| 0.5 | Move named review scripts to `data/reviews/scripts/` | Organization |
| 0.6 | Delete stale `src/site/core_rulebook.html` | -610KB duplicate |
| 0.7 | Delete `*.backup` files | Cleanup |
| 0.8 | Run migrations to normalize database paths | Consistency |

**Verification:**
```bash
# Before
find src/tooling -type f -name "*.ts" | wc -l  # ~350+ files

# After
find src/tooling -type f -name "*.ts" | wc -l  # ~280 files
```

**Breaking Changes:** None

---

### Work Cycle 1: Core Abstractions (3-5 days)

**Goal:** Establish shared patterns that reduce duplication in all future code.

**Deliverables:**
- [ ] `BaseRepository` class for database access
- [ ] `CommandBuilder` for CLI commands
- [ ] `PromptBuilder` for prompt generation
- [ ] `FileIO` utilities
- [ ] Database layer violation fixed
- [ ] 3 CLI commands migrated (proof of concept)
- [ ] 2 repositories migrated (proof of concept)

**Tasks:**

| Task | Description | Lines Saved |
|------|-------------|-------------|
| 1.1 | Fix database re-export (remove CampaignClient from database/) | Layer fix |
| 1.2 | Create `src/tooling/database/base-repository.ts` | Enable 2,000 line reduction |
| 1.3 | Create `src/tooling/cli/command-builder.ts` | Enable 3,000 line reduction |
| 1.4 | Create `src/tooling/prompts/builder.ts` | Enable 600 line reduction |
| 1.5 | Create `src/tooling/io/file-io.ts` | Enable 400 line reduction |
| 1.6 | Migrate `book-list.ts` to CommandBuilder | Proof of concept |
| 1.7 | Migrate `book-register.ts` to CommandBuilder | Proof of concept |
| 1.8 | Migrate `db-verify.ts` to CommandBuilder | Proof of concept |
| 1.9 | Migrate `BookRepository` to BaseRepository | Proof of concept |
| 1.10 | Migrate `WorkflowRepository` to BaseRepository | Proof of concept |
| 1.11 | Document patterns in `docs/style_guides/` | Knowledge capture |

**Breaking Changes:**
- CampaignClient import path changes (find/replace migration)

**Dependencies:** Work Cycle 0 complete

---

### Work Cycle 2: Data Architecture (2-3 days)

**Goal:** Fix data synchronization issues, establish clear data flow.

**Deliverables:**
- [ ] Database schema optimized (remove HTML content storage)
- [ ] Chapter versioning activated
- [ ] Data flow documented
- [ ] Database size reduced from ~6MB to <500KB

**Tasks:**

| Task | Description | Impact |
|------|-------------|--------|
| 2.1 | Create migration to remove `content` column from book_versions | -5.4MB |
| 2.2 | Add `source_path`, `output_path` columns | Clarity |
| 2.3 | Update `SnapshotClient` to not store content | Code fix |
| 2.4 | Activate chapter versioning in W1 workflow | Enable chapter history |
| 2.5 | Add git post-commit hook for chapter snapshots | Auto-tracking |
| 2.6 | Create `docs/architecture/data-flow.md` | Documentation |
| 2.7 | Add file header comments to key generated files | Clarity |

**Breaking Changes:**
- Database schema change (migration handles)
- Any code reading `book_versions.content` must read from file instead

**Dependencies:** Work Cycle 0 complete (can run parallel to Cycle 1)

---

### Work Cycle 3: Package Extraction (1 week)

**Goal:** Extract standalone modules into separate workspace packages.

**Deliverables:**
- [ ] `@razorweave/pdf-gen` package (24 files)
- [ ] `@razorweave/events` package (10 files)
- [ ] `@razorweave/boardroom` package (6 files)
- [ ] Updated workspace configuration
- [ ] All tests passing

**Tasks:**

| Task | Description | Files Moved |
|------|-------------|-------------|
| 3.1 | Create `src/pdf-gen/` package structure | 24 |
| 3.2 | Move pdf-gen files, update imports | — |
| 3.3 | Create `src/events/` package structure | 10 |
| 3.4 | Move events files, update imports | — |
| 3.5 | Create `src/boardroom/` package structure | 6 |
| 3.6 | Move boardroom files, update imports | — |
| 3.7 | Update `pnpm-workspace.yaml` | — |
| 3.8 | Update all consumer imports | — |
| 3.9 | Verify builds and tests pass | — |

**Breaking Changes:**
- Import paths change for all three packages
- Migration script provided to update imports

**Dependencies:** Work Cycle 1 complete

---

### Work Cycle 4: Workflow Engine (2 weeks)

**Goal:** Create generalized workflow framework that W2/W3/W4 can use.

**Deliverables:**
- [ ] `WorkflowEngine` core class
- [ ] `WorkflowDefinition` type system
- [ ] W1 migrated to workflow engine
- [ ] W2/W3/W4 definition stubs created
- [ ] Unified `workflow:strategic` CLI command
- [ ] Documentation for creating new workflows

**Tasks:**

| Task | Description | Lines Saved |
|------|-------------|-------------|
| 4.1 | Design `WorkflowEngine` interfaces | Design |
| 4.2 | Implement `WorkflowEngine` core | ~500/workflow |
| 4.3 | Implement `PromptWriter` (generic) | ~150/workflow |
| 4.4 | Implement `ResultSaver` (generic) | ~150/workflow |
| 4.5 | Implement `HumanGate` (generic) | ~100/workflow |
| 4.6 | Create `W1_DEFINITION` from current W1 code | — |
| 4.7 | Migrate W1 commands to use workflow engine | — |
| 4.8 | Create `W2_DEFINITION` stub | W2 ready |
| 4.9 | Create `W3_DEFINITION` stub | W3 ready |
| 4.10 | Create `W4_DEFINITION` stub | W4 ready |
| 4.11 | Create unified `workflow:strategic` CLI | ~300/workflow |
| 4.12 | Document workflow creation process | Knowledge |

**Breaking Changes:**
- W1 CLI commands consolidated into workflow engine
- Package.json scripts updated

**Dependencies:** Work Cycle 3 complete

---

### Work Cycle 5: CLI Consolidation (1 week)

**Goal:** Reduce 73 package.json scripts, migrate remaining CLI commands to abstractions.

**Deliverables:**
- [ ] All CLI commands using CommandBuilder
- [ ] Package.json scripts reduced from 73 to ~30
- [ ] Unified CLI entry point option available
- [ ] CLI documentation updated

**Tasks:**

| Task | Description | Impact |
|------|-------------|--------|
| 5.1 | Migrate remaining CLI commands to CommandBuilder | Consistency |
| 5.2 | Consolidate related scripts (review:*, workflow:*) | -20 scripts |
| 5.3 | Remove deprecated/unused scripts | -10 scripts |
| 5.4 | Add script categories with comments | Organization |
| 5.5 | Update CLI documentation | Knowledge |
| 5.6 | (Optional) Create unified CLI entry point | Future-ready |

**Breaking Changes:**
- Some script names may change (documented)

**Dependencies:** Work Cycle 4 complete

---

### Work Cycle 6: Data Pipeline Foundation (1-2 weeks)

**Goal:** Establish analytics infrastructure without full D1 integration.

**Deliverables:**
- [ ] `agent_invocations` table for cost tracking
- [ ] Local analytics aggregation tables
- [ ] CLI commands for analytics queries
- [ ] Documentation of future D1 integration path

**Tasks:**

| Task | Description | Source |
|------|-------------|--------|
| 6.1 | Add `agent_invocations` table | data-pipeline.md |
| 6.2 | Add agent cost tracking to workflow runs | data-pipeline.md |
| 6.3 | Create analytics aggregation tables | data-dashboard-analysis.md |
| 6.4 | Create `analytics:summary` CLI command | New |
| 6.5 | Create `analytics:costs` CLI command | New |
| 6.6 | Document D1 integration approach | data-pipeline-architecture.md |

**Breaking Changes:** None (additive)

**Dependencies:** Work Cycle 2 complete

---

### Roadmap Visualization

```
Week 1       Week 2       Week 3       Week 4       Week 5       Week 6+
────────────────────────────────────────────────────────────────────────────

┌─────────┐
│ Cycle 0 │  Foundation Cleanup (1-2 days)
└────┬────┘
     │
     ├───────────────────────────────────────┐
     │                                       │
     ▼                                       ▼
┌─────────┐                           ┌─────────┐
│ Cycle 1 │  Core Abstractions        │ Cycle 2 │  Data Architecture
│         │  (3-5 days)               │         │  (2-3 days)
└────┬────┘                           └────┬────┘
     │                                     │
     └──────────────────┬──────────────────┘
                        │
                        ▼
                  ┌─────────┐
                  │ Cycle 3 │  Package Extraction (1 week)
                  └────┬────┘
                       │
                       ▼
                 ┌─────────┐
                 │ Cycle 4 │  Workflow Engine (2 weeks)
                 └────┬────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
   ┌─────────┐               ┌─────────┐
   │ Cycle 5 │               │ Cycle 6 │
   │ CLI     │               │ Data    │
   │ Consol. │               │ Pipeline│
   └─────────┘               └─────────┘

Total Duration: 6-8 weeks
```

---

### Success Metrics

| Metric | Current | After Cycle 0 | After Cycle 5 | Target |
|--------|---------|---------------|---------------|--------|
| **Files in tooling/** | 600+ | ~530 | <400 | <350 |
| **Dead code lines** | ~12,000 | 0 | 0 | 0 |
| **Duplicate code** | ~10,750 | ~10,750 | <3,000 | <2,000 |
| **Database size** | ~6MB | ~6MB | <500KB | <500KB |
| **Package.json scripts** | 73 | 73 | ~30 | ~25 |
| **CLI boilerplate** | 150 lines/cmd | 150 | 40 | 40 |
| **Workspace packages** | 4 | 4 | 7 | 7-8 |

---

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing workflows | Medium | High | Run full test suite after each cycle |
| Database migration issues | Low | High | Backup before migrations, test on copy |
| Import path update misses | Medium | Medium | Use automated refactoring tools |
| Workflow engine over-engineering | Medium | Medium | Start with W1 migration, iterate |
| Cycle dependencies block progress | Low | Medium | Cycles 1 & 2 can run in parallel |

---

### Getting Started

**To begin Work Cycle 0:**

```bash
# 1. Create a new branch
git checkout -b refactor/cycle-0-cleanup

# 2. Run the dead code removal script (or manually)
rm src/tooling/scripts/execute-review-gen-*.ts

# 3. Delete unused workflow files
rm src/tooling/workflows/{escalation,rejection-tracker,smart-router,routing-config,event-emitter,trigger-engine,artifact-types,artifact-query}.ts
rm src/tooling/workflows/{escalation,rejection-tracker,smart-router,routing-config,event-emitter,trigger-engine,artifact-query}.test.ts

# 4. Clean up stubs and empties
rm -rf src/tooling/__fixtures__
rm src/site/core_rulebook.html

# 5. Run tests to verify nothing broke
pnpm test

# 6. Commit
git add -A && git commit -m "chore: remove dead code (~12,000 lines)"
```

---

### Appendix: Script Organization Reference

**Recommended package.json script structure after Cycle 5:**

```json
{
  "scripts": {
    "// === DEVELOPMENT ===": "",
    "build": "pnpm -r build",
    "test": "vitest run",
    "typecheck": "pnpm -r typecheck",
    "lint": "eslint src/",

    "// === DATABASE ===": "",
    "db:migrate": "tsx src/tooling/cli-commands/db-migrate.ts",
    "db:seed": "tsx src/tooling/cli-commands/db-seed.ts",
    "db:verify": "tsx src/tooling/cli-commands/db-verify.ts",

    "// === BOOKS ===": "",
    "book:list": "tsx src/tooling/cli-commands/book-list.ts",
    "book:info": "tsx src/tooling/cli-commands/book-info.ts",
    "book:register": "tsx src/tooling/cli-commands/book-register.ts",
    "build:book": "tsx src/tooling/cli-commands/build-book.ts",

    "// === WORKFLOWS ===": "",
    "workflow:strategic": "tsx src/workflows/cli/strategic.ts",
    "workflow:list": "tsx src/workflows/cli/list.ts",
    "workflow:resume": "tsx src/workflows/cli/resume.ts",

    "// === REVIEWS ===": "",
    "review:book": "tsx src/tooling/cli-commands/run.ts review book",
    "review:status": "tsx src/tooling/cli-commands/run.ts review status",
    "review:analyze": "tsx src/tooling/cli-commands/run.ts review analyze",

    "// === HTML/PDF ===": "",
    "html:web:build": "tsx src/tooling/cli-commands/build-book.ts --format web",
    "html:print:build": "tsx src/tooling/cli-commands/build-book.ts --format print",
    "pdf:build": "tsx src/pdf-gen/cli/build.ts",

    "// === ANALYTICS ===": "",
    "analytics:summary": "tsx src/tooling/cli-commands/analytics-summary.ts",
    "analytics:costs": "tsx src/tooling/cli-commands/analytics-costs.ts"
  }
}
```
