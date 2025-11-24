# Razorweave Directory Structure

**Status:** Implemented (with noted deviations from original proposal)
**Last Updated:** 2025-11-18

## Overview

This document describes the directory structure of the Razorweave project. The structure supports the full lifecycle of creating, reviewing, editing, and releasing tabletop role-playing game books.

This structure has been implemented with some modifications from the original proposal (see [Deviations](#deviations-from-original-proposal)).

## Root Files

**Implemented:**
- **README.md** - Human-facing entry point and project overview
- **INDEX.md** - Reference map for project navigation
- **PLAN.md** - High-level project plan and milestone tracking
- **PROMPT.md** - Shared meta prompt used by orchestration agents
- **package.json** - Node.js package configuration and scripts
- **pnpm-workspace.yaml** - Monorepo workspace configuration
- **tsconfig.json** - TypeScript compiler configuration

**Planned:**
- **AGENTS.md** - Instructions for automated agents (to be created)

## books Directory

Contains all book related material. This includes manuscripts, reviews, exported formats, and assets.

### Core Books

```
books/core/v1/
    manuscript/
        chapters/
        front_matter/
        back_matter/
        appendices/
    reviews/
        persona_runs/
        analysis/
        playtest/
    exports/
        html/
        pdf/
            draft/
            digital/
            print/
    assets/
        art/
        layout/
        fonts/
    sheets/
    _notes/
```

Manuscript contains editable content. Reviews stores persona reviews and playtest analysis. Exports stores html and pdf outputs. Assets stores images, layout files, and fonts. Sheets contains reference or character sheets. Notes stores local notes for that book version.

### Settings

Settings follow the same structure as the core book but are organized by slice and setting.

Pattern:

```
books/settings/<slice>/<setting>/v1/
    manuscript/
        campaigns/
        lore/
        reference/
    reviews/
    exports/
    assets/
    _notes/
```

Slices include cozy, fantasy, horror_mystery, modern, and sci_fi.

## data Directory

Stores persona data, review results, play session logs, metric history, and generated artifacts.

```
data/
    personas/
        pools/
        runs/
    reviews/
        raw/
        summarized/
    play_sessions/
        raw_sessions/
        parsed_sessions/
        analysis/
    metrics/
        quality_gates/
        history/
    html/
        print/           # Print-ready HTML builds
        web/             # Web reader HTML builds
        review/          # Review HTML builds (pnpm build:book output)
    w1-artifacts/        # W1 workflow artifacts (plans, changelogs, etc.)
    w1-prompts/          # W1 generated prompts
    w1-strategic/        # Strategic plan state and configuration
```

## docs Directory

Holds documentation for processes, style guides, and agent instructions.

**Implemented:**
```
docs/
    agents/              # Agent documentation
    plans/               # Design documents and implementation plans
    reviews/             # Review reports and findings
    style_guides/        # Writing and coding standards
        prose/
        rules/
        book/
        pdf/
        git/
        docs/
        typescript/
    workflows/           # Process and workflow documentation
    GETTING_STARTED.md   # Developer onboarding guide
    README.md            # Documentation hub
```

**Changes from proposal:**
- Added `reviews/` directory for review reports
- Added `GETTING_STARTED.md` for developer onboarding
- Workflows are documented as individual files, not subdirectories
- Added git, docs, and typescript style guides

## Configuration Directories

**Implemented:**

### .claude Directory

Claude Code configuration and hooks:

```
.claude/
    hooks/               # Claude Code hook implementations
        session_start.ts
        before_tool_call.ts
        after_tool_call.ts
        user_prompt_submit.ts
```

### .husky Directory

Git hooks managed by Husky:

```
.husky/
    pre-commit           # Pre-commit validation
    commit-msg           # Commit message format validation
    post-commit          # Post-commit updates
    post-checkout        # Context display on checkout
```

## rules Directory

**Status:** Proposed but not yet implemented

Canonical system rules to be kept separate from specific book versions.

**Planned structure:**
```
rules/
    core/
        GM_GUIDE.md
        PLAYERS_GUIDE.md
    expanded/
        ENEMIES.md
        NPCS.md
        VPCS.md
        SOLO_PLAY.md
        MECHANICS_REFERENCE.md
```

## src Directory

Source code for all agentic and workflow processes. Organized as a monorepo with multiple packages.

**Implemented:**
```
src/
    agents/              # Agentic systems (future implementations)
    cli/                 # Command-line interface tools
    maintenance/         # Maintenance utilities
    shared/              # Shared utilities across packages
    site/                # Website generator
    tooling/             # Build tools, hooks, validators, database
        database/        # SQLite database client
        hooks/           # Git and Claude Code hooks
        linters/         # ESLint, Prettier, Markdownlint configs
        scripts/         # Setup and maintenance scripts
        validators/      # Validation scripts
        data/            # Database files
    agents/              # Agentic systems (stub)
```

**Changes from proposal:**
- Added `tooling/` package for build tools, validation, CLI, and reviews
- Added `shared/` package for shared utilities
- Site generator is in `src/site/` not root `site/`
- Removed `tools/`, `workflows/`, `cli/`, `maintenance/` - functionality merged into `tooling/`

## scripts Directory

**Implemented:**

Validation and review scripts:

```
scripts/
    review/              # Content review scripts
    verify-database.ts   # Database integrity verification
```

## data Directory (Implementation)

**Implemented:**

Database storage for project state and content history:

```
data/
    project.db           # SQLite database (via src/tooling/data/)
```

**Note:** Personas, reviews, play sessions, and metrics are planned but not yet fully implemented.

## Deviations from Original Proposal

### Implemented Differently

1. **site/ → src/site/**
   - **Reason:** Site generator is a workspace package
   - **Impact:** Can share code with other packages

2. **Added src/tooling/**
   - **Reason:** Need centralized build tools, validation, CLI, and reviews
   - **Contains:** Database, hooks, linters, validators, CLI commands, review system
   - **Impact:** Improved developer experience

3. **Added src/shared/**
   - **Reason:** Share utilities across packages
   - **Impact:** Reduces code duplication

4. **Added configuration directories**
   - **.claude/** - Claude Code hooks
   - **.husky/** - Git hooks
   - **Reason:** Tool integration
   - **Impact:** Automated quality checks

### Not Yet Implemented

1. **rules/** - Canonical rules directory
   - **Status:** Planned for future
   - **Workaround:** Rules currently in book manuscripts

2. **_archive/** - Archive directory
   - **Status:** Planned for future
   - **Workaround:** Use git history for old versions

3. **site/public/** - Generated website output
   - **Status:** Planned for future
   - **Note:** Will be output from src/site/ generator

### Future Additions

As the project evolves, the following may be added:

- **rules/** - When canonical rules are extracted
- **_archive/** - For explicit archival
- **site/public/** - For website deployment
- **docs/developers/** - Advanced developer documentation
- Additional packages in **src/** as needed

## Summary

The current structure successfully supports:
- ✅ Content creation and organization (books/)
- ✅ Documentation (docs/)
- ✅ Source code organization (src/)
- ✅ Build tooling and validation (src/tooling/)
- ✅ Git and Claude Code integration (.husky/, .claude/)
- ✅ Database-backed content history (data/)
- ⏳ Canonical rules (planned: rules/)
- ⏳ Archival (planned: _archive/)
- ⏳ Website deployment (planned: site/public/)
