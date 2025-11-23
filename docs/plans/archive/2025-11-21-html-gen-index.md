# HTML Generation Implementation Plans Index

**Date:** 2025-11-21
**Status:** Ready for Implementation
**Design:** `docs/plans/2025-11-21-html-print-design-pipeline-design.md`

---

## Overview

This index tracks implementation of the HTML generation system for both `print-design` and `web-reader` workflows. Phases 1-3 are shared infrastructure; Phase 4+ is workflow-specific.

---

## Implementation Phases

| Phase | Name | Status | Plan File |
|-------|------|--------|-----------|
| P1 | Foundation | Complete | `2025-11-21-html-gen-P1-foundation.md` |
| P2 | Transforms | Complete | `2025-11-21-html-gen-P2-transforms.md` |
| P3 | Assembly | Pending | `2025-11-21-html-gen-P3-assembly.md` |
| P4-print | Print CLI | Pending | `2025-11-21-html-gen-P4-print-cli.md` |
| P4-web | Web Reader CLI | Pending | `2025-11-21-html-gen-P4-web.md` |
| P5 | Advanced Features | Not Started | (glossary linking, to be created) |
| P6 | Sheet Refinement | Not Started | (iterative, per-sheet) |

---

## Phase Summary

### Phase 1: Foundation (Shared)
- Database schema (`html_builds`, `html_build_sources`)
- File hashing utilities
- Build client for database operations
- **Estimated Tasks:** 6
- **Dependencies:** None

### Phase 2: Transforms (Shared)
- unified/remark pipeline
- Example blocks transform
- GM boxes transform
- Semantic IDs transform
- **Estimated Tasks:** 7
- **Dependencies:** P1

### Phase 3: Assembly (Shared)
- Chapter reader
- TOC generator (4-part structure)
- Index generator
- Content assembler
- **Estimated Tasks:** 5
- **Dependencies:** P2

### Phase 4-print: Print CLI (Print-specific)
- Template extraction for print
- Template renderer
- Build orchestrator
- CLI commands (build, list, diff, promote)
- **Estimated Tasks:** 6
- **Dependencies:** P3

### Phase 4-web: Web Reader CLI (Web-specific)
- Web-specific ID transform (ch-XX prefixed IDs)
- Template extraction from `read.html`
- Build orchestrator with caching
- CLI commands (`html:web:build`, `list`, `diff`, `promote`)
- **Estimated Tasks:** 8
- **Dependencies:** P3

### Phase 5: Advanced Features (Optional)
- Glossary auto-linking
- Part intro content
- Enhanced validation
- **Not yet planned** — can be added incrementally

### Phase 6: Sheet Refinement (Iterative)
- Review each sheet's print output
- Add page-break hints as needed
- User approves each sheet individually
- **Not yet planned** — requires visual review cycle

---

## Execution Order

**For print-design workflow:**
```
P1 → P2 → P3 → P4-print → (P5 optional) → P6
```

**For web-reader workflow:**
```
P1 → P2 → P3 → P4-web → (P5 optional) → P6
```

**Current Status:** P1 and P2 are complete. Both workflows share P1-P3.

**Recommended Execution:**
1. Complete P3 (Assembly) — shared infrastructure
2. Complete P4-web — web reader workflow (waiting on Playwright tests)
3. Complete P4-print — print workflow

---

## Quick Start

1. Open terminal in `razorweave` repository
2. Start with Phase 1:
   ```bash
   # Read the plan
   cat docs/plans/2025-11-21-html-gen-P1-foundation.md

   # Execute using superpowers:executing-plans skill
   ```
3. Complete each phase in order
4. Run tests after each task
5. Commit frequently

---

## Output Locations

| Workflow | Output Path |
|----------|-------------|
| print-design | `data/html/print-design/core-rulebook.html` |
| web-reader | `data/html/web-reader/core-rulebook.html` |

---

## CLI Commands (after P4)

**Print workflow (after P4-print):**
```bash
pnpm html:print:build          # Build print-design HTML
pnpm html:print:list           # List previous builds
pnpm html:print:diff <id>      # Show changes since build
pnpm html:print:promote        # Copy to exports/
```

**Web workflow (after P4-web):**
```bash
pnpm html:web:build [--force]  # Build web reader HTML
pnpm html:web:list [--limit=N] # List previous builds
pnpm html:web:diff <id>        # Show changes since build
pnpm html:web:promote          # Copy to src/site/src/pages/read.html
```

---

## Success Criteria

**Shared (P1-P3):**
- [x] Database schema for html_builds and html_build_sources
- [x] File hashing utilities (SHA-256)
- [x] Build client for database operations
- [x] All transforms work (examples, GM boxes, semantic IDs)
- [ ] TOC has 4-part structure
- [ ] Sheets are assembled as Chapter 27
- [ ] Build history tracked in database
- [ ] Diff shows changed files between builds

**Print workflow (P4-print):**
- [ ] `pnpm html:print:build` produces valid HTML
- [ ] HTML renders correctly in browser
- [ ] Print preview shows proper formatting
- [ ] Promote copies to `books/core/v1/exports/html/`

**Web workflow (P4-web):**
- [ ] `pnpm html:web:build` produces valid HTML
- [ ] Generated HTML matches structure of `read.html`
- [ ] All JavaScript functionality works (TOC, quick jump, bookmarks)
- [ ] Chapter IDs follow `ch-XX-slug` pattern
- [ ] `pnpm html:web:promote` copies to `src/site/src/pages/read.html`
- [ ] Playwright tests pass after promote
