# Razorweave Project Index

Quick reference for navigating the Razorweave project.

## Getting Started

- **For Humans**: Start with [README.md](README.md)
- **For Agents**: Start with [AGENTS.md](AGENTS.md)
- **Current Plan**: See [PLAN.md](PLAN.md)

## Project Documentation

### Core Documentation
- [Directory Structure](docs/plans/DIRECTORY_STRUCTURE.md) - Complete project structure
- [End-to-End Pipeline](docs/workflows/END_TO_END_PIPELINE.md) - Full content creation workflow
- [Agentic Processes](docs/agents/AGENTIC_PROCESSES.md) - Automated agent workflows

### Workflows
- [Content Pipeline](docs/workflows/content_pipeline/) - Content creation process
- [Review Pipeline](docs/workflows/review_pipeline/) - Review and analysis process
- [Playtest Pipeline](docs/workflows/playtest_pipeline/) - Playtesting process
- [PDF Pipeline](docs/workflows/pdf_pipeline/) - PDF generation and design
- [Release Pipeline](docs/workflows/release_pipeline/) - Publication and release

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

### Rules
- **Core Rules**: `rules/core/`
- **Expanded Rules**: `rules/expanded/`

### Data
- **Personas**: `data/personas/`
- **Reviews**: `data/reviews/`
- **Play Sessions**: `data/play_sessions/`
- **Metrics**: `data/metrics/`

## Source Code

- **Agents**: `src/agents/`
  - Content: `src/agents/content/`
  - Review: `src/agents/review/`
  - Playtest: `src/agents/playtest/`
  - PDF: `src/agents/pdf/`
  - Release: `src/agents/release/`

- **Workflows**: `src/workflows/`
- **CLI Tools**: `src/cli/`
- **Site Generator**: `src/site/`

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
- **Agent instructions**: `docs/agents/`
- **Project plans**: `docs/plans/`
- **Style guides**: `docs/style_guides/`
- **Workflow docs**: `docs/workflows/`
