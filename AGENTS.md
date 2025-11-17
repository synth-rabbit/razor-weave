# Agent Instructions

This document provides instructions and context for all automated agents working in the Razorweave project.

## Project Overview

Razorweave is a tabletop role-playing game (TTRPG) system with a core rulebook and multiple genre-specific settings. The project uses automated agents to assist with content creation, review, editing, PDF production, and release.

## Key References

- **Navigation**: See [INDEX.md](INDEX.md) for file locations
- **Project Plan**: See [PLAN.md](PLAN.md) for current state and milestones
- **Directory Structure**: See [docs/plans/DIRECTORY_STRUCTURE.md](docs/plans/DIRECTORY_STRUCTURE.md)
- **Agentic Processes**: See [docs/agents/AGENTIC_PROCESSES.md](docs/agents/AGENTIC_PROCESSES.md)
- **Pipeline**: See [docs/workflows/END_TO_END_PIPELINE.md](docs/workflows/END_TO_END_PIPELINE.md)

## Project Structure

### Content Organization

**Books** (`books/`)
- Core rulebook: `books/core/v1/`
- Settings by genre: `books/settings/{slice}/{setting}/v1/`
  - Slices: cozy, fantasy, horror_mystery, modern, sci_fi

Each book version contains:
- `manuscript/` - Editable source content
- `reviews/` - Persona reviews and analysis
- `exports/` - Generated HTML and PDF outputs
- `assets/` - Art, layout files, fonts
- `sheets/` - Character/reference sheets
- `_notes/` - Local working notes

**Rules** (`rules/`)
- `core/` - Core system rules (canonical source)
- `expanded/` - Expanded rules content

**Data** (`data/`)
- `personas/` - Persona pools and generated instances
- `reviews/` - Review outputs and summaries
- `play_sessions/` - Session logs and analysis
- `metrics/` - Quality gates and historical tracking

### Documentation

All detailed documentation is in `docs/`:
- `docs/agents/` - Agent-specific instructions
- `docs/plans/` - Project plans and architecture
- `docs/style_guides/` - Writing and design guidelines
- `docs/workflows/` - Process documentation

## Agent Roles

### Content Agents (`src/agents/content/`)
Generate or revise manuscript content for books and settings.

**Implementation files:**
- `index.ts`

### Dist Agents (`src/agents/dist/`)
Agent implementation.

**Implementation files:**
- `index.d.ts`

### Node_modules Agents (`src/agents/node_modules/`)
Agent implementation.

### Pdf Agents (`src/agents/pdf/`)
Generate and design PDF outputs.

**Implementation files:**
- `index.ts`

### Playtest Agents (`src/agents/playtest/`)
Simulate or analyze play sessions.

**Implementation files:**
- `index.ts`

### Release Agents (`src/agents/release/`)
Handle publication and website updates.

**Implementation files:**
- `index.ts`

### Review Agents (`src/agents/review/`)
Conduct persona-based reviews of content.

**Implementation files:**
- `index.ts`


## Working Guidelines

### File Paths
Always use absolute paths or paths relative to the project root (`/Users/pandorz/Documents/razorweave/`).

### Quality Gates
Check `data/metrics/quality_gates/` for quality thresholds before marking work as complete.

### Style Guides
Always consult the appropriate style guide before creating or editing content:
- Prose: `docs/style_guides/prose/`
- Rules: `docs/style_guides/rules/`
- Book formatting: `docs/style_guides/book/`
- PDF design: `docs/style_guides/pdf/`

### Versioning
All book content uses semantic versioning (v1, v2, etc.). Always work in the appropriate version directory.

### Notes and Communication
Use `_notes/` directories within each book version for working notes, TODOs, and temporary documentation.

## Workflow Integration

Agents should follow the [End-to-End Pipeline](docs/workflows/END_TO_END_PIPELINE.md) when working on content. Key stages:

1. Content creation/revision
2. Persona-based review
3. Analysis and metrics evaluation
4. Iterative improvement
5. HTML generation
6. PDF production
7. Release

Consult specific workflow documentation in `docs/workflows/` for detailed process information.
