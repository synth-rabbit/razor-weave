# Implementation Plans and Design Documents

This directory contains all design documents, implementation plans, and architectural proposals for the Razorweave project.

## Overview

Plans and design documents serve as blueprints for implementing features. They describe the "what" and "why" before code is written.

## Document Types

### Design Documents

High-level architectural and system design:

- **[Project Database Design](2025-11-18-project-database-design.md)** - SQLite database for state persistence
- **[TypeScript Setup Design](2025-01-16-typescript-setup-design.md)** - TypeScript monorepo configuration
- **[Linting and Style Guides Design](2025-01-16-linting-and-style-guides-design.md)** - Code quality tooling

### Implementation Plans

Detailed step-by-step implementation guides:

- **[Core Rulebook Single HTML Book](2025-11-18-core-rulebook-single-html-book.md)** - Comprehensive rulebook assembly plan
- **[Project Database Implementation](2025-11-18-project-database.md)** - Database implementation details
- **[Linting P1](linting-and-style-guides-P1.md)** - Phase 1: Basic linting setup
- **[Linting P2](linting-and-style-guides-P2.md)** - Phase 2: Advanced linting
- **[Linting P3 - Git Hooks](linting-and-style-guides-P3-git-hooks.md)** - Git hook implementation
- **[Linting P3 - Claude Hooks](linting-and-style-guides-P3-claude-hooks.md)** - Claude Code hook implementation

### Index Documents

Cross-referencing documents that tie related plans together:

- **[Linting and Style Guides Index](linting-and-style-guides-index.md)** - Overview of linting implementation phases
- **[Persona System Index](persona-system-index.md)** - Persona-based review system design

### Architectural Proposals

Proposed project structure and organization:

- **[Directory Structure](DIRECTORY_STRUCTURE.md)** - Proposed directory organization

## Documents by Category

### Database and Persistence

- [Project Database Design](2025-11-18-project-database-design.md) - Architecture and schema
- [Project Database Implementation](2025-11-18-project-database.md) - Implementation details

### Content Creation

- [Core Rulebook Single HTML Book](2025-11-18-core-rulebook-single-html-book.md) - Rulebook consolidation
- [Persona System Index](persona-system-index.md) - Review system design

### Development Infrastructure

- [TypeScript Setup Design](2025-01-16-typescript-setup-design.md) - Build configuration
- [Linting and Style Guides Design](2025-01-16-linting-and-style-guides-design.md) - Quality tooling
- Linting Implementation Phases (P1, P2, P3)

### Project Organization

- [Directory Structure](DIRECTORY_STRUCTURE.md) - File organization proposal

## Document Status

Documents may have different status levels:

- **Proposal** - Under consideration, not yet approved
- **Approved** - Approved for implementation
- **In Progress** - Currently being implemented
- **Implemented** - Implementation complete
- **Deprecated** - No longer relevant or superseded

Check the document header for current status.

## Using Design Documents

### Before Implementation

1. Read the complete design document
2. Understand the goals and architecture
3. Review related documents
4. Ask questions if anything is unclear
5. Check for recent changes or updates

### During Implementation

1. Follow the design as written
2. Note any deviations and document why
3. Update the document if design changes
4. Reference the design in commit messages
5. Create implementation notes if helpful

### After Implementation

1. Update status to "Implemented"
2. Add links to actual implementation
3. Document any differences from the design
4. Create user-facing documentation if needed
5. Archive or mark as reference material

## Creating New Plans

### Design Document Structure

Use this template for new design documents:

```markdown
# [Feature Name] Design

**Date:** YYYY-MM-DD
**Status:** Proposal/Approved/In Progress/Implemented

## Overview
Brief description of what this designs

## Goals
What we want to achieve

## Architecture
How it will be built

## Implementation Phases
Step-by-step breakdown

## Success Criteria
How we know it's done

## References
Related documents and resources
```

See [Plan Format Guide](../style_guides/docs/plan-format.md) for detailed formatting standards.

### Naming Convention

Use this pattern: `YYYY-MM-DD-feature-name.md`

Examples:
- `2025-11-18-project-database-design.md`
- `2025-01-16-typescript-setup-design.md`

### Where to Put New Plans

- **Design documents** → `docs/plans/`
- **Index documents** → `docs/plans/` (with descriptive name)
- **Phase documents** → `docs/plans/` (with phase suffix like `-P1.md`)

## Plan Relationships

### Linting and Style Guides Series

A complete implementation spanning multiple phases:

1. [Index](linting-and-style-guides-index.md) - Overview
2. [Design](2025-01-16-linting-and-style-guides-design.md) - Architecture
3. [P1](linting-and-style-guides-P1.md) - Basic setup
4. [P2](linting-and-style-guides-P2.md) - Advanced linting
5. [P3 Git Hooks](linting-and-style-guides-P3-git-hooks.md) - Git integration
6. [P3 Claude Hooks](linting-and-style-guides-P3-claude-hooks.md) - Claude integration

### Database Series

Complete database implementation:

1. [Database Design](2025-11-18-project-database-design.md) - Architecture
2. [Database Implementation](2025-11-18-project-database.md) - Details

## Implemented Features

These plans have been implemented:

- ✅ TypeScript monorepo setup
- ✅ Git hooks (commit-msg, pre-commit, post-commit, post-checkout)
- ✅ Claude Code hooks (session-start, after-tool-call, etc.)
- ✅ Project database (schema, clients, integration)
- ✅ Linting and code formatting
- 🚧 Core rulebook consolidation (in progress)
- 🚧 Persona system (design complete, implementation pending)

## Planned Features

These plans are approved but not yet implemented:

- ⏳ Content generation agents
- ⏳ Review agent system
- ⏳ Playtest automation
- ⏳ PDF generation pipeline
- ⏳ Release automation

## Related Documentation

- [Style Guides](../style_guides/README.md) - Coding and writing standards
- [Workflows](../workflows/README.md) - Process documentation
- [Agents](../agents/README.md) - Automated agents
- [Plan Format Guide](../style_guides/docs/plan-format.md) - How to write plans
- [Main Project README](../../README.md) - Project overview

## Contributing

### Proposing New Features

1. Create a design document using the template
2. Set status to "Proposal"
3. Include goals, architecture, and success criteria
4. Link related documents
5. Request review from team

### Updating Existing Plans

1. Read the full plan before editing
2. Check for dependent documents
3. Update cross-references if needed
4. Note changes in commit message
5. Update status if applicable

### After Implementation

1. Change status to "Implemented"
2. Add links to implementation code
3. Create user-facing documentation
4. Update related plans
5. Consider archiving if appropriate
