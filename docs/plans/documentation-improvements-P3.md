# Documentation Improvements - Phase 3: Tool Documentation

**Created:** 2025-11-18
**Status:** Ready to Implement
**Priority:** MEDIUM
**Parent Plan:** [documentation-improvements-index.md](documentation-improvements-index.md)
**Prerequisites:** Phase 1 and Phase 2 Complete

## Overview

Phase 3 documents all implemented tooling that currently lacks user-facing documentation. This includes Claude Code hooks, validation scripts, and monorepo architecture. These are working features that users don't know how to leverage.

## Goals

1. All implemented tools are documented for users
2. Developers can use validation scripts effectively
3. Claude Code hooks are understood and maintainable
4. Monorepo package structure is clear

## Tasks

### Task 1: Create Claude Code Hooks Guide

**File:** `docs/workflows/CLAUDE_HOOKS.md`

**Required Sections:**
- Overview of Claude Code hooks system
- Hook installation and configuration
- List of all hooks:
  - session-start: Display context from database
  - after-tool-call: Track tool usage
  - before-tool-call: Pre-execution validation (if exists)
  - Other hooks in `.claude/hooks/`
- What each hook does
- How hooks integrate with database
- Hook configuration in `.claude/`
- Writing custom hooks
- Troubleshooting hook failures
- Disabling hooks (when and why)
- Examples of hook output

**Success Criteria:**
- Complete list of all Claude hooks
- Clear explanation of purpose
- Examples of typical output
- Integration with project database explained

### Task 2: Create Validation Scripts Guide

**File:** `docs/workflows/VALIDATION.md`

**Required Sections:**
- Overview of validation system
- Available validation scripts:
  - `scripts/review/validate-links.sh` - Internal link validation
  - `scripts/review/validate-mechanics.sh` - Game mechanics validation
  - `scripts/review/extract-terms.py` - Glossary term extraction
  - `scripts/verify-database.ts` - Database integrity check
- What each script validates
- How to run each script:
  - Standalone execution
  - Via `pnpm validate` command
  - Via git hooks (automatic)
- Interpreting validation output
- Fixing common validation errors
- Adding new validation scripts
- Integration with pre-commit hooks
- CI/CD validation (future)

**Success Criteria:**
- All scripts documented with examples
- Clear instructions for running
- Common errors explained
- Examples of successful and failed validation

### Task 3: Create Monorepo Architecture Guide

**File:** `docs/developers/MONOREPO_ARCHITECTURE.md`

**Required Sections:**
- Overview of pnpm workspaces
- Package structure:
  - `@razorweave/tooling` - Build tools, hooks, database, validators
  - `@razorweave/shared` - Shared utilities (if exists)
  - Other packages
- Package dependencies and relationships
- How to work with packages:
  - Running scripts in specific packages
  - Building single packages
  - Testing single packages
  - Adding dependencies to a package
- Workspace configuration (`pnpm-workspace.yaml`)
- TypeScript project references
- Build order and dependencies
- Adding new packages
- Package naming conventions
- Publishing (future consideration)

**Success Criteria:**
- Complete package map
- Clear dependency graph
- Examples for common operations
- Instructions for adding packages

### Task 4: Create Developers Directory README

**File:** `docs/developers/README.md`

**Required Sections:**
- Overview of developer documentation
- For new developers (link to GETTING_STARTED.md)
- Architecture documentation:
  - Monorepo Architecture
  - Database Design
  - Future: API docs
- Development workflows:
  - Testing
  - Validation
  - Building
- Troubleshooting (future)
- Contributing guidelines

**Success Criteria:**
- Clear navigation for developer docs
- Links to all developer-focused documentation
- Progressive disclosure (beginner → advanced)

### Task 5: Update Workflows README

**File:** `docs/workflows/README.md`

**Changes:**
- Add new workflow documents to index:
  - GIT_HOOKS.md (from Phase 1)
  - PROJECT_DATABASE.md (from Phase 1)
  - CLAUDE_HOOKS.md (new)
  - VALIDATION.md (new)
- Update descriptions for each workflow
- Add "Quick Reference" section for common tasks
- Add status indicators (documented/planned)

**Success Criteria:**
- All workflow docs indexed
- Clear descriptions
- Easy to find common workflows

### Task 6: Create Troubleshooting Guide

**File:** `docs/developers/TROUBLESHOOTING.md`

**Required Sections:**
- Common setup issues:
  - pnpm installation fails
  - Git hooks not running
  - Build errors
  - Test failures
- Common development issues:
  - Validation failures
  - Link validation errors
  - Database errors
  - Hook failures
- Platform-specific issues (macOS, Linux, Windows)
- How to get help
- Debugging techniques
- Logging and diagnostics

**Success Criteria:**
- Covers most common issues
- Clear solutions with examples
- Searchable (good headings)
- Links to relevant detailed docs

## Validation

After completing all tasks:

1. Test validation scripts:
   - Run each script documented
   - Verify output matches documentation
   - Test error conditions

2. Test Claude hooks:
   - Trigger each hook
   - Verify behavior matches docs
   - Check database integration

3. Test monorepo commands:
   - Run all example commands
   - Verify package operations work
   - Test on clean clone

4. Review troubleshooting:
   - Verify solutions work
   - Test on actual issues
   - Get feedback from new developer

## Dependencies

- Phase 1 complete (GIT_HOOKS.md and PROJECT_DATABASE.md exist)
- Phase 2 complete (structure is documented)
- Access to all tools and scripts

## Estimated Completion

- Task 1: Claude Hooks Guide - 1.5 hours
- Task 2: Validation Scripts Guide - 1.5 hours
- Task 3: Monorepo Architecture Guide - 2 hours
- Task 4: Developers README - 30 minutes
- Task 5: Update Workflows README - 15 minutes
- Task 6: Troubleshooting Guide - 2 hours

**Total:** 7.5 hours

## Next Phase

After Phase 3 completion, optional Phase 4: Advanced Documentation

- API Documentation (auto-generated from TypeScript)
- Tutorial Documentation (step-by-step guides)
- Video/Visual Documentation
- Contributing Guide

## Related Documents

- [DOCUMENTATION_AUDIT.md](../DOCUMENTATION_AUDIT.md)
- [Project Database Design](2025-11-18-project-database-design.md)
- [End-to-End Pipeline](../workflows/END_TO_END_PIPELINE.md)
