# Razorweave TTRPG Project

Welcome to the Razorweave project! This repository contains the complete infrastructure for creating, editing, reviewing, and publishing tabletop role-playing game books.

## Quick Start

### For First-Time Users

1. **Find Your Way Around**: Check [INDEX.md](INDEX.md) for a complete navigation guide
2. **Current Status**: See [PLAN.md](PLAN.md) for the current project state
3. **Directory Structure**: See [docs/plans/DIRECTORY_STRUCTURE.md](docs/plans/DIRECTORY_STRUCTURE.md) for the complete folder organization

### For Developers

**New to the project?** Start here:

👉 **[Getting Started Guide](docs/GETTING_STARTED.md)** - Complete setup instructions, available commands, and workflows

Additional resources:

- **Source Code**: All code is in `src/`
- **Agent Development**: See [docs/agents/AGENTIC_PROCESSES.md](docs/agents/AGENTIC_PROCESSES.md)
- **Workflows**: See [docs/workflows/](docs/workflows/)
- **Git Hooks**: See [docs/workflows/GIT_HOOKS.md](docs/workflows/GIT_HOOKS.md)
- **Project Database**: See [docs/workflows/PROJECT_DATABASE.md](docs/workflows/PROJECT_DATABASE.md)

## Project Overview

### What is Razorweave?

Razorweave is a tabletop role-playing game system consisting of:

- A **core rulebook** with the base game mechanics
- Multiple **setting books** across different genres (cozy, fantasy, horror/mystery, modern, sci-fi)

### How This Project Works

This project uses a combination of human creativity and automated agents to:

1. **Create Content** - Write and develop game content
2. **Review** - Use multi-dimensional personas to review content from different perspectives
3. **Analyze** - Evaluate reviews and play sessions for quality metrics
4. **Iterate** - Improve content based on analysis
5. **Produce** - Generate HTML and PDF outputs
6. **Publish** - Release books and update the website

See [docs/workflows/END_TO_END_PIPELINE.md](docs/workflows/END_TO_END_PIPELINE.md) for the complete workflow.

## Content Organization

### Books

**Core Rulebook**: `books/core/v1/`

- Contains the base game rules and mechanics

**Settings**: `books/settings/{genre}/{setting}/v1/`

Available genres and settings:

- **Cozy**: amber_road, cornerstone, thornvale
- **Fantasy**: broken_circle, hollow_throne, threads_of_power
- **Horror/Mystery**: duskfall, gaslight_and_ruin, null_zenith
- **Modern**: cover, still_world, zero_day
- **Sci-Fi**: shattered_stars, starward, vagrant_stars

### Rules

Canonical system rules are stored separately in `rules/`:

- `rules/core/` - Core game mechanics
- `rules/expanded/` - Additional rules and content

### Data

Project data is organized in `data/`:

- **Personas** - Multi-dimensional reviewers
- **Reviews** - Content review results
- **Play Sessions** - Playtesting logs and analysis
- **Metrics** - Quality tracking and history

## Working with Content

### Creating or Editing Content

1. Navigate to the appropriate manuscript directory:
   - Core: `books/core/v1/manuscript/`
   - Settings: `books/settings/{genre}/{setting}/v1/manuscript/`

2. Edit the markdown files
3. Follow the style guides in `docs/style_guides/`

### Running Reviews

1. Define or use personas from `data/personas/pools/`
2. Run review agents (see `src/agents/review/`)
3. Check analysis in `books/*/v1/reviews/analysis/`

### Generating PDFs

1. Generate HTML: outputs to `books/*/v1/exports/html/`
2. Run PDF agents: outputs to `books/*/v1/exports/pdf/`
   - Draft versions for review
   - Digital versions for distribution
   - Print versions for physical production

## Documentation

All project documentation is organized in `docs/`:

### For Content Creators

- [Prose Style Guide](docs/style_guides/prose/)
- [Rules Style Guide](docs/style_guides/rules/)
- [Book Formatting Guide](docs/style_guides/book/)

### Developer Documentation

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Setup and development environment
- [Git Hooks Guide](docs/workflows/GIT_HOOKS.md) - Automated quality checks
- [Project Database Guide](docs/workflows/PROJECT_DATABASE.md) - Content history and recovery
- [Agentic Processes](docs/agents/AGENTIC_PROCESSES.md) - Agent workflows
- [Workflow Documentation](docs/workflows/) - All workflow guides

### For Project Management

- [Directory Structure](docs/plans/DIRECTORY_STRUCTURE.md)
- [Current Plan](PLAN.md)

## Tools and Scripts

Utility tools are available in `tools/`:

- `tools/scripts/` - Helper scripts
- `tools/templates/` - Document templates

## Contributing

### Style Guidelines

Always consult the appropriate style guide before creating content:

- **Writing**: `docs/style_guides/prose/`
- **Rules Writing**: `docs/style_guides/rules/`
- **Book Formatting**: `docs/style_guides/book/`
- **PDF Design**: `docs/style_guides/pdf/`

### Quality Standards

Quality gates and metrics are defined in `data/metrics/quality_gates/`. Check these before submitting work.

## Archive

Old drafts and experiments are stored in `_archive/`:

- `_archive/drafts/` - Previous versions
- `_archive/experiments/` - Experimental work

## Getting Help

- **Navigation**: See [INDEX.md](INDEX.md)
- **Agent Instructions**: See [AGENTS.md](AGENTS.md)
- **Workflows**: See [docs/workflows/](docs/workflows/)
- **Project Status**: See [PLAN.md](PLAN.md)
