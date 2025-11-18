# Documentation Improvements - Phase 2: Structure Updates

**Created:** 2025-11-18
**Status:** Ready to Implement
**Priority:** HIGH
**Parent Plan:** [documentation-improvements-index.md](documentation-improvements-index.md)
**Prerequisites:** Phase 1 Complete

## Overview

Phase 2 updates structural documentation to match the actual implementation. Currently, DIRECTORY_STRUCTURE.md is labeled as a "proposal" but the structure is implemented with some deviations. INDEX.md references directories that don't exist. AGENTS.md is missing from root despite being proposed.

## Goals

1. Documentation structure matches actual implementation
2. No broken references to non-existent directories
3. Root AGENTS.md provides agent overview
4. Clear distinction between proposed vs. implemented structure

## Tasks

### Task 1: Audit Current Directory Structure

**Goal:** Document what actually exists

**Actions:**
- Generate current directory tree
- Compare with DIRECTORY_STRUCTURE.md proposal
- Identify what was implemented, what differs, what's missing
- Create comparison table

**Deliverable:** Analysis document or notes for Task 2

**Success Criteria:**
- Complete list of actual directories
- Clear mapping of proposal → reality
- Documented deviations with rationale

### Task 2: Update DIRECTORY_STRUCTURE.md

**File:** `docs/plans/DIRECTORY_STRUCTURE.md`

**Changes:**
- Update title: "Razorweave Directory Structure" (remove "Proposal")
- Add "Status" section at top indicating implemented vs. proposed
- Update structure to reflect actual implementation:
  - Add `scripts/` directory (exists, not in proposal)
  - Add `.husky/` and `.claude/` directories
  - Update `src/` structure with actual packages
  - Note missing proposed directories (rules/, tools/ vs. src/tooling/)
- Add "Deviations from Original Proposal" section
- Add "Future Structure" section for unimplemented parts
- Update file locations to match actual paths

**Success Criteria:**
- Structure section matches actual directories
- All referenced paths exist
- Clear status indicators (implemented/proposed/future)
- Explains why deviations occurred

### Task 3: Create Root AGENTS.md

**File:** `AGENTS.md` (project root)

**Required Sections:**
- Overview of agentic systems in the project
- Agent categories:
  - Content agents (future)
  - Review agents (persona system - planned)
  - Build agents (future)
  - Validation agents (implemented via scripts)
- Current implementation status
- Git hooks as simple agents
- Claude Code hooks as agents
- Link to detailed documentation in `docs/agents/`
- How agents interact with database
- Adding new agents
- Agent development guidelines

**Success Criteria:**
- Provides high-level agent overview
- Links to detailed docs
- Clear status of what's implemented vs. planned
- Matches proposal in DIRECTORY_STRUCTURE.md

### Task 4: Update INDEX.md

**File:** `INDEX.md` (project root)

**Changes:**
- Update directory references to match actual structure
- Add missing directories:
  - `.husky/` - Git hooks
  - `.claude/` - Claude Code configuration
  - `scripts/` - Validation and review scripts
- Remove or mark as "planned" non-existent directories:
  - `rules/` (proposed but not implemented)
  - Update workflow references
- Add section for configuration directories
- Update file references to actual locations
- Add new documentation files created in Phase 1

**Success Criteria:**
- All directory references are valid
- No broken links
- Clearly marked planned vs. actual
- Includes all major project areas

### Task 5: Update Plans README

**File:** `docs/plans/README.md`

**Changes:**
- Add documentation-improvements plans to index
- Update status of implemented plans
- Add category for "Documentation" plans
- Update implementation tracking

**Success Criteria:**
- All plan files are indexed
- Status is accurate
- New documentation plans are listed

### Task 6: Verify All Cross-References

**Goal:** Ensure no broken links in documentation

**Actions:**
- Check all links in updated files
- Verify references to directories exist
- Update any links broken by changes
- Create list of all cross-references

**Deliverable:** Verified documentation with no broken links

**Success Criteria:**
- All internal links work
- All directory references are valid
- No 404s or missing files

## Validation

After completing all tasks:

1. Navigate structure:
   - Follow INDEX.md to each major area
   - Verify all directories exist
   - Check that descriptions match contents

2. Check AGENTS.md:
   - Verify links to detailed docs work
   - Test that overview matches actual capabilities
   - Ensure no promises of non-existent features

3. Verify DIRECTORY_STRUCTURE.md:
   - Walk through each section
   - Verify paths are correct
   - Check that status indicators are accurate

4. Link validation:
   - Run link checker on all updated docs
   - Fix any broken references
   - Verify cross-references work

## Dependencies

- Phase 1 should be complete (creates docs that need referencing)
- Current directory structure should be stable

## Estimated Completion

- Task 1: Directory Audit - 30 minutes
- Task 2: Update DIRECTORY_STRUCTURE.md - 1 hour
- Task 3: Create AGENTS.md - 1 hour
- Task 4: Update INDEX.md - 45 minutes
- Task 5: Update Plans README - 15 minutes
- Task 6: Verify Cross-References - 30 minutes

**Total:** 4 hours

## Next Phase

After Phase 2 completion, proceed to Phase 3: Tool Documentation

- Claude Code Hooks Guide
- Validation Scripts Guide
- Monorepo Architecture Guide

## Related Documents

- [DOCUMENTATION_AUDIT.md](../DOCUMENTATION_AUDIT.md)
- [DIRECTORY_STRUCTURE.md](DIRECTORY_STRUCTURE.md)
- [Agents Overview](../agents/README.md)
