# Pipeline Documentation and Testing Design

**Date:** 2025-11-22
**Status:** Ready for Implementation

---

## Overview

Create operational documentation for the HTML generation pipelines and perform a full Playwright test audit with updated visual snapshots.

---

## Documentation

### Workflow Docs (`docs/workflows/`)

**`html-gen-web.md`** - Web reader pipeline
- Purpose and output locations
- CLI commands: `pnpm html:web:build`, `list`, `diff`, `promote`
- When to rebuild vs when it auto-skips
- Integration with Eleventy site

**`html-gen-print.md`** - Print design pipeline
- Purpose and output locations
- CLI commands: `pnpm html:print:build`, `list`, `diff`, `promote`
- Print CSS considerations

### Developer Docs (`docs/developers/`)

**`html-gen-architecture.md`** - For contributors
- Pipeline stages (read → transform → assemble → render)
- Database schema (html_builds, html_build_sources)
- Transform plugins (example blocks, GM boxes, web IDs)
- How to add new transforms

---

## Playwright Tests

### New Test File

**`tests/e2e/keyboard-shortcuts.spec.ts`**
- Alt+ArrowLeft/Right chapter navigation
- Alt+G/I/S quick jumps (glossary/index/sheets)
- Alt+B bookmark toggle
- ? key opens help panel
- Help panel close (X button, click outside)

### Updates to Existing Tests

**`reader.spec.ts`**
- Add bookmark functionality tests (add/remove, persistence, scroll-margin behavior)

**`visual.spec.ts`**
- Add keyboard shortcuts help panel screenshot

### Snapshot Regeneration

- Delete existing snapshots in `tests/visual/snapshots/`
- Run tests with `--update-snapshots` against local dev build
- Commit new baseline snapshots

---

## Execution Order

1. **Documentation first** (lower risk, sets context)
   - Write `docs/workflows/html-gen-web.md`
   - Write `docs/workflows/html-gen-print.md`
   - Write `docs/developers/html-gen-architecture.md`

2. **Tests second**
   - Create `keyboard-shortcuts.spec.ts`
   - Add bookmark tests to `reader.spec.ts`
   - Add help panel screenshot to `visual.spec.ts`

3. **Snapshot regeneration last**
   - Build site: `pnpm --filter razorweave-site build`
   - Delete old snapshots
   - Run: `pnpm --filter razorweave-site test:e2e --update-snapshots`
   - Verify all tests pass
   - Commit snapshots

4. **Final verification**
   - Run full test suite
   - Commit everything

---

## Success Criteria

- [ ] `docs/workflows/html-gen-web.md` exists and is accurate
- [ ] `docs/workflows/html-gen-print.md` exists and is accurate
- [ ] `docs/developers/html-gen-architecture.md` exists with architecture details
- [ ] `keyboard-shortcuts.spec.ts` tests all keyboard shortcuts
- [ ] `reader.spec.ts` includes bookmark tests
- [ ] `visual.spec.ts` includes help panel screenshot
- [ ] All visual snapshots regenerated from local dev build
- [ ] Full test suite passes
