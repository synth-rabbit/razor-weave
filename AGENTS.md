# Agent Instructions

Welcome, AI assistant! This document provides context and guidelines for working on the Razorweave project.

## Quick Start

1. **Read First:**
   - `README.md` - Project overview
   - `INDEX.md` - File navigation
   - `PLAN.md` - Current status

2. **Key Directories:**
   - `docs/` - All documentation
   - `src/tooling/` - TypeScript automation tools
   - `books/` - TTRPG content (markdown)
   - `data/` - Audits, personas, reviews

3. **Before Making Changes:**
   - Run `pnpm test` to ensure tests pass
   - Run `pnpm lint` to check code style
   - Run `pnpm exec tsc --noEmit` to check types

## Project Context

**What:** Razorweave is a TTRPG system with automated quality tooling

**Tooling Architecture:**
- Persona generation (test reader personas)
- Review system (agentic book reviews)
- Database (SQLite in `data/project.db`)

**Tech Stack:**
- TypeScript
- Vitest (testing)
- SQLite (database)
- pnpm (package manager)

## Workflows

- **Agentic Processes:** `docs/agents/AGENTIC_PROCESSES.md`
- **End-to-End Pipeline:** `docs/workflows/END_TO_END_PIPELINE.md`
- **Review System:** `docs/workflows/REVIEW_SYSTEM.md`

## Standards

- **Style Guides:** `docs/style_guides/`
- **File Naming:** kebab-case for files, PascalCase for types
- **Commits:** Conventional commits (feat/fix/docs/chore/refactor/test)

## Testing

- Tests in `src/tooling/**/*.test.ts`
- Run specific test: `pnpm test path/to/test.ts`
- Coverage target: 80%+

## Common Tasks

### Running the CLI

```bash
pnpm tsx src/tooling/cli-commands/run.ts [command] [args]
```

### Database Operations

```bash
# Verify database
pnpm tsx src/tooling/scripts/verify-database.ts

# Direct SQL
sqlite3 data/project.db
```

### Linting & Validation

```bash
# Run all linters
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

## Current Focus

See `PLAN.md` for current project status and priorities.
