# Stub Packages

This document tracks placeholder packages in the workspace that are reserved for future implementation.

## Overview

The Razorweave monorepo includes stub packages that define the intended architecture but are not yet implemented. These packages have:

- Complete `package.json` with proper metadata
- Basic TypeScript configuration
- README describing intended purpose
- Stub `index.ts` with TODO comments
- Empty export to satisfy TypeScript

## Stub Packages

### @razorweave/agents

**Location:** `src/agents/`
**Status:** Stub (Partially Implemented)
**Purpose:** Agent implementations for content, review, playtest, PDF, and release

**Intended Structure:**

- `content/` - Content creation agents
- `review/` - Review agents
- `playtest/` - Playtest agents
- `pdf/` - PDF generation agents
- `release/` - Release agents

**Current State:**

- Package configured with subdirectories created
- Index.ts has export structure defined
- Subdirectories exist but contain placeholder files

**Priority:** High - Core to agentic workflow

**Note:** Review agent functionality is currently implemented in `@razorweave/tooling/reviews/` using Claude Code's Task tool for agent execution.

---

## Implementation Status Summary

| Package | Status | Priority | Dependencies |
|---------|--------|----------|--------------|
| @razorweave/agents | Partial | High | @razorweave/shared |

## Implemented Packages

These packages are fully or substantially implemented:

- **@razorweave/tooling** - Linting, validation, development tooling, CLI commands, database, reviews, personas
- **@razorweave/shared** - Shared types, utilities, and abstractions
- **@razorweave/site** - Website source (HTML, CSS, JS)

## Removed Packages

The following stub packages were removed as their functionality is covered by `@razorweave/tooling`:

- **@razorweave/tools** - Merged into `tooling/scripts/`
- **@razorweave/workflows** - Review orchestration in `tooling/reviews/`
- **@razorweave/cli** - CLI commands in `tooling/cli-commands/`
- **@razorweave/maintenance** - Maintenance scripts in `tooling/scripts/`

## Development Guidelines

### When Implementing a Stub Package

1. **Review the README** - Understand the intended purpose and structure
2. **Check dependencies** - Ensure required packages are implemented
3. **Follow existing patterns** - Match the architecture of implemented packages
4. **Update this document** - Change status from Stub to Partial or Implemented
5. **Add tests** - Follow patterns in TESTING.md
6. **Add documentation** - JSDoc for public APIs

## Rationale for Stubs

These packages exist as stubs rather than being created on-demand because:

1. **Architecture clarity** - Documents the intended system structure
2. **Dependency management** - pnpm workspace configuration requires packages to exist
3. **Import paths** - Allows other packages to reference them with proper module resolution
4. **Incremental development** - Can be implemented independently as needed
5. **Type safety** - TypeScript configuration is ready when implementation begins

## References

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [TESTING.md](./TESTING.md) - Testing patterns and best practices
- Individual package READMEs in `src/*/README.md`
