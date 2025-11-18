# Plan Format Guide

Guidelines for writing implementation plans in `docs/plans/`.

## Plan Naming Convention

### Formats

Plans follow a specific naming convention to prevent confusion about phases and tangents:

**1. Index File**
- Pattern: `{topic-name}-index.md`
- Example: `linting-and-style-guides-index.md`
- Purpose: Track the plan across all phases and tangents

**2. Phase File**
- Pattern: `{topic-name}-P{phase-number}[-{phase-step}].md`
- Examples:
  - `linting-and-style-guides-P1.md`
  - `linting-and-style-guides-P1-initial-setup.md`
- Purpose: Main phase implementation

**3. Tangent File**
- Pattern: `{topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md`
- Examples:
  - `linting-and-style-guides-P3-git-hooks.md`
  - `linting-and-style-guides-P3-claude-hooks-optimization.md`
- Purpose: Tangent from main phase

### Rules

- All lowercase
- Use hyphens (`-`) not underscores
- Topic name should be descriptive but concise
- Phase numbers start at 1
- Optional step names add clarity

## Index File Structure

```markdown
# {Topic Name} - Plan Index

## Overview

[Brief description of the overall topic and goals]

## Phases

### Phase 1: [Phase Name]
**Status:** [Not Started | In Progress | Completed | Blocked]
**Files:**
- [\`{topic}-P1.md\`](./{topic}-P1.md)

**Summary:** [What this phase accomplishes]

### Phase 2: [Phase Name]
**Status:** [Not Started | In Progress | Completed]
**Files:**
- [\`{topic}-P2.md\`](./{topic}-P2.md)

**Tangents:**
- [\`{topic}-P2-tangent-name.md\`](./{topic}-P2-tangent-name.md) - [Description]

**Summary:** [What this phase accomplishes]

## Progress Tracking

- [ ] Phase 1 complete
- [ ] Phase 2 complete

## Design Document

Full design: [\`YYYY-MM-DD-{topic}-design.md\`](./YYYY-MM-DD-{topic}-design.md)

## Key Decisions

List important architectural or design decisions made.

## Notes

[Any cross-phase notes, decisions, or context]
```

## Implementation Plan Structure

Implementation plans created with `superpowers:writing-plans` must follow this structure:

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---

## Task 1: [Component Name]

**Files:**
- Create: \`exact/path/to/file.ts\`
- Modify: \`exact/path/to/existing.ts:123-145\`
- Test: \`tests/exact/path/to/test.ts\`

**Step 1: [Action]**

[Details with code examples]

**Step 2: [Action]**

[Details]

...

---

## Task 2: [Component Name]

...
```

### Plan Requirements

- **Exact file paths** - Always specify full paths
- **Complete code** - Include actual code, not "add validation here"
- **Test-first** - Write tests before implementation
- **Bite-sized steps** - Each step is 2-5 minutes
- **Frequent commits** - Commit after each task

## Design Document Structure

Design documents created with `superpowers:brainstorming` should include:

```markdown
# [Feature Name] Design

**Date:** YYYY-MM-DD
**Status:** [Draft | Approved | Implemented]

## Overview

Description of what's being designed.

## Goals

What this feature accomplishes.

## Architecture

How it's structured.

## Implementation Phases

What phases will implement this.

## Key Decisions

Important choices made during design.

## References

Related documents.
```

## Status Values

Use consistent status values:

- **Not Started** - Phase not begun
- **In Progress** - Currently working on it
- **Completed** - Finished and verified
- **Blocked** - Cannot proceed (explain why)

## Related Guides

- [Docs README](./README.md)
