# Stub Packages

This document tracks placeholder packages in the workspace that are reserved for future implementation.

## Overview

The Razorweave monorepo includes several stub packages that define the intended architecture but are not yet implemented. These packages have:
- Complete `package.json` with proper metadata
- Basic TypeScript configuration
- README describing intended purpose
- Stub `index.ts` with TODO comments
- Empty export to satisfy TypeScript

## Stub Packages

### @razorweave/tools

**Location:** `src/tools/`
**Status:** 🚧 Stub
**Purpose:** Helper scripts and templates for content creation and project management

**Intended Structure:**
- `scripts/` - Helper scripts
- `templates/` - Document templates

**Current State:**
- Package configured with basic setup
- Empty index.ts with TODO

**Priority:** Low - Nice to have utilities

---

### @razorweave/workflows

**Location:** `src/workflows/`
**Status:** 🚧 Stub
**Purpose:** Workflow orchestration for content pipelines

**Intended Structure:**
- `pipelines/` - Pipeline implementations (content, improvement, PDF, release)
- `orchestration/` - Pipeline execution and state management
- `stages/` - Individual workflow stages

**Intended Pipelines:**
1. Content creation → review → analysis
2. Iterative improvement (PM → Writer → Expert → Editor loop)
3. HTML generation
4. PDF creation (draft → production)
5. Release

**Current State:**
- Package configured with comprehensive README
- Empty index.ts with TODO

**Priority:** High - Core to content creation workflow

---

### @razorweave/agents

**Location:** `src/agents/`
**Status:** 🚧 Stub (Partially Implemented)
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

---

### @razorweave/cli

**Location:** `src/cli/`
**Status:** 🚧 Stub
**Purpose:** CLI entry point and command structure

**Intended Structure:**
- Command parsing and routing
- Integration point for all workspace packages
- User-facing interface

**Current State:**
- Package configured
- Empty index.ts with TODO

**Priority:** Medium - `src/tooling/cli-commands/` currently provides CLI functionality

**Note:** Current CLI commands in `@razorweave/tooling` may be migrated here or this package may wrap them for external consumption.

---

### @razorweave/maintenance

**Location:** `src/maintenance/`
**Status:** 🚧 Stub
**Purpose:** Maintenance utilities and scripts

**Intended Structure:**
- Database maintenance
- Content validation
- Cleanup utilities

**Current State:**
- Package configured
- Empty index.ts with TODO

**Priority:** Low - Maintenance can be handled with tooling scripts

---

## Implementation Status Summary

| Package | Status | Priority | Dependencies |
|---------|--------|----------|--------------|
| @razorweave/tools | Stub | Low | @razorweave/shared |
| @razorweave/workflows | Stub | High | @razorweave/shared |
| @razorweave/agents | Partial | High | @razorweave/shared |
| @razorweave/cli | Stub | Medium | @razorweave/shared |
| @razorweave/maintenance | Stub | Low | @razorweave/shared |

## Implemented Packages

For reference, these packages are fully or substantially implemented:

- **@razorweave/tooling** ✅ - Linting, validation, development tooling
- **@razorweave/shared** ✅ - Shared types, utilities, and abstractions
- **@razorweave/site** ✅ - Website source (HTML, CSS, JS)

## Development Guidelines

### When Implementing a Stub Package

1. **Review the README** - Understand the intended purpose and structure
2. **Check dependencies** - Ensure required packages are implemented
3. **Follow existing patterns** - Match the architecture of implemented packages
4. **Update this document** - Change status from Stub to Partial or Implemented
5. **Add tests** - Follow patterns in TESTING.md
6. **Add documentation** - JSDoc for public APIs

### Dependency Order

Recommended implementation order based on dependencies:

1. @razorweave/agents (high priority, supports workflows)
2. @razorweave/workflows (high priority, orchestrates agents)
3. @razorweave/cli (medium priority, user interface)
4. @razorweave/tools (low priority, convenience utilities)
5. @razorweave/maintenance (low priority, operational support)

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
