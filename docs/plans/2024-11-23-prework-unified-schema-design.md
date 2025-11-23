---
status: ACTIVE
created: 2024-11-23
session_id: sess_687bc31b
---

# Prework: Unified Schema Design

**Date:** 2024-11-23
**Author:** CEO + Claude (Brainstorming Session)
**Purpose:** Define unified database schema and Phase 0 foundation before Prework phases

---

## Summary

Before building Prework Phases 1-5, we need to unify the existing database infrastructure. This design adds **Phase 0: Schema Unification & Foundation** to establish:

1. Single `data/project.db` as source of truth
2. Proper `books` registry with slug-based identity
3. Version linking for workflow input/output tracking
4. Plan lifecycle automation to prevent stale plans

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Book identity | Slug + path | Stable identifier (slug) with updatable location (path) |
| Version linking | Separate `workflow_runs` table | Clean separation: content storage vs workflow tracking |
| Book FK | Add `book_id` to `book_versions` | Proper referential integrity |
| Database location | `data/project.db` | Per boardroom design doc |
| Database consolidation | Merge `data/razorweave.db` into `data/project.db` | Single source of truth |
| Plan lifecycle | Automated via hooks + frontmatter | Prevents plan clutter systematically |

---

## Phase 0: Schema Unification & Foundation

### Milestones

| ID | Name | Description |
|----|------|-------------|
| M0.1 | Schema Audit | Document all existing tables and data in project.db, razorweave.db |
| M0.2 | Unified Schema Design | Final schema approved by CEO |
| M0.3 | Migration Scripts | Create and test migration scripts |
| M0.4 | Data Migration | Execute migration, verify data integrity |
| M0.5 | Tool Updates | Update any scripts referencing old paths/schemas |
| M0.6 | Plan Cleanup | Archive completed plans, add status headers |
| M0.7 | Plan Lifecycle Automation | Build hooks for automatic plan state management |

### Human Gate

**CEO Review #0** after M0.2:
- Review and approve unified schema before migration
- Confirm migration approach is safe

### Acceptance Criteria

- [ ] Single `data/project.db` contains all tables
- [ ] `books` table exists with Core Rulebook registered
- [ ] `book_versions` has `book_id` FK to `books`
- [ ] `workflow_runs` table ready for Phase 2
- [ ] All existing data preserved and verified
- [ ] `docs/plans/` has clear status indicators
- [ ] Plan lifecycle hooks functional

---

## Unified Database Schema

### Target: `data/project.db`

```sql
-- ============================================
-- BOOK REGISTRY (NEW)
-- ============================================
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  book_type TEXT NOT NULL CHECK(book_type IN ('core', 'source', 'campaign', 'supplement')),
  source_path TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'editing', 'published')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_books_slug ON books(slug);
CREATE INDEX idx_books_status ON books(status);

-- ============================================
-- BOOK VERSIONS (MODIFIED)
-- ============================================
-- Add columns to existing table:
--   book_id TEXT REFERENCES books
--   workflow_run_id TEXT

-- Columns effectively replaced:
--   book_path -> use books.source_path via FK
--   id INTEGER -> redundant with content_id

-- ============================================
-- WORKFLOW RUNS (NEW)
-- ============================================
CREATE TABLE workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL CHECK(workflow_type IN (
    'w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'
  )),
  book_id TEXT NOT NULL REFERENCES books(id),
  input_version_id TEXT REFERENCES book_versions(content_id),
  output_version_id TEXT REFERENCES book_versions(content_id),
  session_id TEXT,
  plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending', 'running', 'paused', 'completed', 'failed'
  )),
  current_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_runs_book ON workflow_runs(book_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_type ON workflow_runs(workflow_type);

-- ============================================
-- PLANS (NEW - for lifecycle tracking)
-- ============================================
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN (
    'draft', 'active', 'complete', 'archived'
  )),
  session_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP
);

CREATE INDEX idx_plans_status ON plans(status);
```

---

## Migration Plan

### Current State

| Database | Location | Tables |
|----------|----------|--------|
| project.db | `data/project.db` | book_versions, chapter_versions, personas, persona_dimensions, persona_generation_stats, html_builds, html_build_sources, data_artifacts, state, schema_info, review_campaigns, campaign_analyses, persona_reviews |
| razorweave.db | `data/razorweave.db` | persona_reviews, review_campaigns |
| razorweave.db | `./razorweave.db` (root) | Stray copy - DELETE |

### Migration Steps

```bash
# 1. Backup everything
cp data/project.db data/project.db.pre-migration
cp data/razorweave.db data/razorweave.db.pre-migration

# 2. Run migration script (creates books table, adds FKs, migrates data)
pnpm db:migrate-unified

# 3. Verify data integrity
pnpm db:verify

# 4. Delete stray files
rm razorweave.db
rm data/razorweave.db

# 5. Update .gitignore if needed
```

### Migration Script Pseudocode

```sql
-- Create books table
CREATE TABLE IF NOT EXISTS books (...);

-- Seed Core Rulebook
INSERT INTO books (id, slug, title, book_type, source_path, status)
VALUES ('book_core', 'core-rulebook', 'Razorweave Core Rulebook',
        'core', 'data/html/print-design/core-rulebook.html', 'editing');

-- Add columns to book_versions
ALTER TABLE book_versions ADD COLUMN book_id TEXT REFERENCES books;
ALTER TABLE book_versions ADD COLUMN workflow_run_id TEXT;

-- Backfill book_id based on book_path patterns
UPDATE book_versions SET book_id = 'book_core'
WHERE book_path LIKE '%core-rulebook%';

-- Migrate review tables if not already present
ATTACH 'data/razorweave.db' AS old;
INSERT INTO persona_reviews SELECT * FROM old.persona_reviews
WHERE NOT EXISTS (SELECT 1 FROM persona_reviews);
INSERT INTO review_campaigns SELECT * FROM old.review_campaigns
WHERE NOT EXISTS (SELECT 1 FROM review_campaigns);
DETACH old;

-- Create workflow_runs table
CREATE TABLE IF NOT EXISTS workflow_runs (...);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (...);
```

---

## Plan Lifecycle System

### Plan States

```
DRAFT → ACTIVE → COMPLETE → ARCHIVED
```

### Frontmatter Convention

Every plan file starts with:

```yaml
---
status: ACTIVE
created: 2024-11-23
session_id: sess_687bc31b
---
```

### Automation Hooks

1. **On `boardroom:approve`** - Updates linked plan status to `COMPLETE`
2. **`pnpm plans:archive`** - Moves `COMPLETE` plans older than 7 days to `docs/plans/archive/`
3. **`pnpm plans:index`** - Regenerates `docs/plans/README.md` from frontmatter

### Database Tracking

The `plans` table tracks plan lifecycle in DB, synced with file frontmatter.

---

## Updated Phase Structure

| Phase | Name | Human Gate |
|-------|------|------------|
| **0** | Schema Unification & Foundation | CEO Review #0 (after M0.2) |
| 1 | Book Registry Foundation | - |
| 2 | Workflow Lifecycle Engine | - |
| 3 | Event System & Smart Routing | - |
| 4 | Artifact Sharing Layer | CEO Review #1 |
| 5 | Integration & Documentation | CEO Review #2 |

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/tooling/database/migrations/000_unified_schema.sql` | Migration script |
| `src/tooling/database/migrate.ts` | Migration runner |
| `src/tooling/plans/lifecycle.ts` | Plan lifecycle automation |
| `src/tooling/cli-commands/plans-archive.ts` | Archive command |
| `src/tooling/cli-commands/plans-index.ts` | Index generator |
| `docs/plans/README.md` | Plan index |
| `docs/plans/archive/` | Archived plans directory |

### Modified Files

| File | Change |
|------|--------|
| `src/tooling/cli-commands/boardroom-approve.ts` | Add plan status update hook |
| Any scripts using `data/razorweave.db` | Update to `data/project.db` |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Full backups before migration, verify step |
| Breaking existing scripts | Audit all DB references before migration |
| Schema conflicts with existing tables | Migration script uses IF NOT EXISTS |

---

## Out of Scope

- Settings table (deferred until multi-book support needed)
- Chapter-level workflow tracking (book-level sufficient for now)
- Automatic plan archival cron (manual command sufficient for now)

---

*This design was produced through CEO + Claude brainstorming session on 2024-11-23.*
