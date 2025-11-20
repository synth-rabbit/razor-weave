# Linting and Style Guides - Plan Index

## Overview

Implement comprehensive linting, formatting, validation, and style guides for the Razorweave project. This includes TypeScript code quality, markdown consistency, automated documentation updates, and git/Claude hooks for enforcing standards.

## Phases

### Phase 1: Tooling Package Setup
**Status:** Not Started
**Files:**
- [`linting-and-style-guides-P1.md`](./linting-and-style-guides-P1.md)

**Summary:** Create @razorweave/tooling package with linters, validators, hooks, and updaters.

### Phase 2: Style Guides Migration
**Status:** Not Started
**Files:**
- [`linting-and-style-guides-P2.md`](./linting-and-style-guides-P2.md)

**Summary:** Migrate source/STYLE.md to docs/style_guides/book/writing-style-guide.md and create new style guides for TypeScript, docs, and git conventions.

### Phase 3: Hooks Implementation
**Status:** Not Started
**Files:**
- [`linting-and-style-guides-P3-git-hooks.md`](./linting-and-style-guides-P3-git-hooks.md)
- [`linting-and-style-guides-P3-claude-hooks.md`](./linting-and-style-guides-P3-claude-hooks.md)

**Summary:** Implement git hooks (post-checkout, pre-commit, commit-msg, post-commit) and Claude hooks (SessionStart, BeforeToolCall, AfterToolCall, UserPromptSubmit).

## Progress Tracking

- [ ] Phase 1: Tooling package complete
- [ ] Phase 2: Style guides complete
- [ ] Phase 3: Hooks complete
- [ ] Setup script working
- [ ] All validation passing

## Design Document

Full design: [`2025-01-16-linting-and-style-guides-design.md`](./2025-01-16-linting-and-style-guides-design.md)

## Key Decisions

1. **Integrated Tooling Package**: All tooling in @razorweave/tooling workspace package
2. **Full Prompt Optimization**: UserPromptSubmit uses LLM to enhance vague prompts before invoking skills
3. **Plan Naming System**: {topic}-index.md, {topic}-P{N}[-step].md, {topic}-P{N}-{tangent}[-step].md
4. **Automatic Updates**: post-commit hook auto-updates AGENTS.md, INDEX.md, PLAN.md, README.md
5. **Conventional Commits**: Emoji prefix format (e.g., ✨ feat(agents): add content generator)

## Notes

- source/STYLE.md will be migrated to docs/style_guides/book/writing-style-guide.md
- source/ directory will eventually be deleted once book content is integrated
- All linters run in pre-commit hook to enforce quality
- Claude hooks provide real-time guidance and auto-optimization
