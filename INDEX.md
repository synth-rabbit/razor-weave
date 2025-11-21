# Razorweave Project Index

Quick reference for navigating the Razorweave project.

## Getting Started

- **New Developers**: Start with [Getting Started Guide](docs/GETTING_STARTED.md)
- **For Humans**: Project overview in [README.md](README.md)
- **For Agents**: Instructions in [AGENTS.md](AGENTS.md)
- **Current Plan**: See [PLAN.md](PLAN.md)
- **Project Structure**: See [Directory Structure](docs/plans/DIRECTORY_STRUCTURE.md)

## Project Documentation

### Core Documentation
- [Directory Structure](docs/plans/DIRECTORY_STRUCTURE.md) - Complete project structure
- [End-to-End Pipeline](docs/workflows/END_TO_END_PIPELINE.md) - Full content creation workflow
- [Agentic Processes](docs/agents/AGENTIC_PROCESSES.md) - Automated agent workflows

### Workflows
- [End-to-End Pipeline](docs/workflows/END_TO_END_PIPELINE.md) - Complete workflow
- [Git Hooks Guide](docs/workflows/GIT_HOOKS.md) - Automated quality checks
- [Project Database](docs/workflows/PROJECT_DATABASE.md) - Content history and state
- Content Pipeline (planned)
- Review Pipeline (planned)
- Playtest Pipeline (planned)

### Style Guides
- [Prose Style Guide](docs/style_guides/prose/) - Writing style guidelines
- [Rules Style Guide](docs/style_guides/rules/) - Rules writing guidelines
- [Book Style Guide](docs/style_guides/book/) - Book formatting guidelines
- [PDF Style Guide](docs/style_guides/pdf/) - PDF design guidelines

## Content Locations

### Books
- **Core Rulebook**: `books/core/v1/`
  - Manuscript: `books/core/v1/manuscript/`
  - Exports: `books/core/v1/exports/`
  - Assets: `books/core/v1/assets/`

- **Settings**: `books/settings/{slice}/{setting}/v1/`
  - Slices: cozy, fantasy, horror_mystery, modern, sci_fi

### Rules (Planned)
- **Core Rules**: `rules/core/` (not yet implemented)
- **Expanded Rules**: `rules/expanded/` (not yet implemented)
- **Current location**: Rules are in book manuscripts

### Data
- **Personas**: `data/personas/`
- **Reviews**: `data/reviews/`
- **Play Sessions**: `data/play_sessions/`
- **Metrics**: `data/metrics/`

## Source Code

**Implemented:**
- **Tooling**: `src/tooling/`
  - Database: `src/tooling/database/`
  - Git Hooks: `src/tooling/hooks/git/`
  - Claude Hooks: `src/tooling/hooks/claude/`
  - Validators: `src/tooling/validators/`
  - Linters: `src/tooling/linters/`
- **Shared**: `src/shared/` - Shared utilities
- **Site Generator**: `src/site/`

**Planned:**
- **Agents**: `src/agents/`
  - Content: `src/agents/content/` (planned)
  - Review: `src/agents/review/` (planned)
  - Playtest: `src/agents/playtest/` (planned)
  - PDF: `src/agents/pdf/` (planned)
  - Release: `src/agents/release/` (planned)

## Quick File Lookup

### Finding Content
- **Book chapters**: `books/*/v1/manuscript/chapters/`
- **Setting overviews**: `books/settings/*/*/v1/manuscript/OVERVIEW.md`
- **Character sheets**: `books/*/v1/sheets/`

### Finding Data
- **Persona pools**: `data/personas/pools/`
- **Review analysis**: `books/*/v1/reviews/analysis/`
- **Play session logs**: `data/play_sessions/raw_sessions/`
- **Quality metrics**: `data/metrics/`

### Finding Documentation
- **Getting started**: `docs/GETTING_STARTED.md`
- **Agent instructions**: `docs/agents/`
- **Project plans**: `docs/plans/`
- **Style guides**: `docs/style_guides/`
- **Workflow docs**: `docs/workflows/`
- **Review reports**: `docs/reviews/`

## Configuration

### Git Hooks
- **Location**: `.husky/`
- **Hooks**: pre-commit, commit-msg, post-commit, post-checkout
- **Documentation**: [Git Hooks Guide](docs/workflows/GIT_HOOKS.md)

### Claude Code Hooks
- **Location**: `.claude/hooks/`
- **Hooks**: session_start, before_tool_call, after_tool_call, user_prompt_submit
- **Documentation**: AGENTS.md, docs/workflows/CLAUDE_HOOKS.md (Phase 3)

### Scripts
- **Location**: `scripts/`
- **Review scripts**: `scripts/review/`
- **Database verification**: `src/tooling/scripts/verify-database.ts`

### Database
- **Location**: `data/project.db`
- **Documentation**: [Project Database Guide](docs/workflows/PROJECT_DATABASE.md)
