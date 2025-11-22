# Web HTML Print Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align web HTML output with print design quality - sheets start on new pages when printing, and sheet styling matches print design on screen.

**Architecture:** Extract shared sheet styles into `sheets.css`, create dedicated `print.css` for print-only rules, clean up `reader.css` to remove conflicting styles. Both print and web will use the same visual base for sheets.

**Tech Stack:** CSS3, HTML5, CSS custom properties from theme.css

---

## Task 1: Create sheets.css with Print Template Styles

**Files:**
- Create: `src/site/src/styles/sheets.css`

**Step 1: Create the sheets.css file**

Create `src/site/src/styles/sheets.css` with the following content extracted from the print design template:

```css
/* ==========================================================================
   SHEETS.CSS - Shared Sheet Styling
   Source of truth for .sheet-block appearance on both screen and print
   ========================================================================== */

/* ---------------------------------------------------------------------
   Sheet Block Container
   --------------------------------------------------------------------- */
.sheet-block {
  border-left: 4px solid var(--color-electric-blue);
  border-radius: 4px;
  padding: 1.5rem 1.25rem;
  margin: 2rem 0;
  background: var(--color-white);

  /* Rough torn-paper edges */
  clip-path: polygon(
    0% 1%, 4% 0%, 8% 0.5%, 12% 0%, 16% 1%, 20% 0.5%, 24% 0%, 28% 1%,
    32% 0.5%, 36% 0%, 40% 1%, 44% 0.5%, 48% 0%, 52% 1%, 56% 0.5%, 60% 0%,
    64% 1%, 68% 0.5%, 72% 0%, 76% 1%, 80% 0.5%, 84% 0%, 88% 1%, 92% 0.5%, 96% 0%, 100% 1%,
    100% 99%, 96% 100%, 92% 99.5%, 88% 100%, 84% 99%, 80% 99.5%, 76% 100%, 72% 99%,
    68% 99.5%, 64% 100%, 60% 99%, 56% 99.5%, 52% 100%, 48% 99%, 44% 99.5%, 40% 100%,
    36% 99%, 32% 99.5%, 28% 100%, 24% 99%, 20% 99.5%, 16% 100%, 12% 99%, 8% 99.5%, 4% 100%, 0% 99%
  );
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

/* ---------------------------------------------------------------------
   Compact Typography Within Sheet Blocks
   --------------------------------------------------------------------- */
.sheet-block h1 {
  font-size: 1.1rem;
  margin: 0 0 0.25rem 0;
  padding: 0;
  color: var(--color-electric-blue);
}

.sheet-block h2 {
  font-size: 0.9rem;
  margin: 0.5rem 0 0.15rem 0;
  padding: 0;
  color: var(--color-hot-pink);
}

.sheet-block h3 {
  font-size: 0.85rem;
  margin: 0.4rem 0 0.1rem 0;
  padding: 0;
  color: var(--color-ink-black);
}

.sheet-block h4 {
  font-size: 0.8rem;
  margin: 0.3rem 0 0.1rem 0;
  padding: 0;
  color: var(--color-ink-black);
}

.sheet-block p {
  margin: 0.1rem 0;
  font-size: 0.75rem;
  line-height: 1.3;
}

/* ---------------------------------------------------------------------
   Sheet Layout Patterns
   --------------------------------------------------------------------- */

/* Multi-column layout for form fields */
.sheet-block > p + p {
  display: inline-block;
  width: 48%;
  vertical-align: top;
  margin-right: 2%;
}

.sheet-block > p + p + p {
  width: 48%;
  margin-right: 0;
}

/* Lists within sheets */
.sheet-block ul,
.sheet-block ol {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
  font-size: 0.75rem;
  columns: 1;
}

.sheet-block li {
  margin: 0.1rem 0;
  break-inside: avoid;
}

/* Tables within sheets */
.sheet-block table {
  margin: 0.25rem 0;
  font-size: 0.7rem;
  width: 100%;
  border-collapse: collapse;
}

.sheet-block th,
.sheet-block td {
  padding: 0.15rem 0.35rem;
}

.sheet-block hr {
  margin: 0.35rem 0;
  border: none;
  border-top: 1px dashed var(--color-border-gray);
}

/* ---------------------------------------------------------------------
   Fill-Line Form Fields
   --------------------------------------------------------------------- */
.fill-line {
  display: inline-block;
  border-bottom: 1px solid var(--color-border-gray);
  height: 1em;
  vertical-align: bottom;
}

.fill-sm { width: 4rem; }
.fill-md { width: 8rem; }
.fill-lg { width: 100%; max-width: 20rem; }
.fill-full { width: 100%; }

/* Hide bullets on list items with fill lines */
.sheet-block li:has(.fill-line) {
  list-style: none;
  margin-left: -1rem;
}

/* List item fill lines should be wide (for sentences) */
.sheet-block li .fill-line {
  width: 100%;
  display: block;
}

/* ---------------------------------------------------------------------
   Dark Mode Adjustments
   --------------------------------------------------------------------- */
body.dark-mode .sheet-block {
  background: var(--color-ink-black);
  border-left-color: var(--color-electric-blue);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

body.dark-mode .sheet-block h3,
body.dark-mode .sheet-block h4,
body.dark-mode .sheet-block p {
  color: var(--color-light-gray);
}

body.dark-mode .fill-line {
  border-bottom-color: var(--color-medium-gray);
}
```

**Step 2: Verify file was created**

Run: `ls -la src/site/src/styles/sheets.css`
Expected: File exists with ~150 lines

**Step 3: Commit**

```bash
git add src/site/src/styles/sheets.css
git commit -m "feat(styles): create sheets.css with shared sheet styling

Extract sheet block styling from print template as source of truth.
Includes torn-paper edges, compact typography, fill-line fields,
and dark mode support."
```

---

## Task 2: Create print.css with Print-Only Rules

**Files:**
- Create: `src/site/src/styles/print.css`

**Step 1: Create the print.css file**

Create `src/site/src/styles/print.css`:

```css
/* ==========================================================================
   PRINT.CSS - Print-Only Styles
   Loaded with media="print" - only applies when printing (Cmd+P)
   ========================================================================== */

@media print {
  /* ---------------------------------------------------------------------
     Page Break Control for Sheets
     Critical: Each sheet starts on a new page
     --------------------------------------------------------------------- */
  .sheet-block {
    page-break-before: always;
    break-before: page;
    page-break-after: auto;
    break-after: auto;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* First sheet in a section shouldn't force break if already at page start */
  #ch-27-sheets .sheet-block:first-of-type {
    page-break-before: auto;
    break-before: auto;
  }

  /* ---------------------------------------------------------------------
     Hide Interactive/Screen-Only Elements
     --------------------------------------------------------------------- */
  .reader-toc,
  .reading-progress,
  .quick-jump-modal,
  .dark-mode-toggle,
  .texture-overlay,
  header nav,
  footer {
    display: none !important;
  }

  /* ---------------------------------------------------------------------
     Full-Width Print Layout
     --------------------------------------------------------------------- */
  .reader-container {
    display: block;
    max-width: 100%;
    padding: 0;
    margin: 0;
  }

  .reader-content {
    max-width: 100%;
    margin: 0;
    padding: 1rem;
  }

  /* ---------------------------------------------------------------------
     Sheet Print Enhancements
     --------------------------------------------------------------------- */
  .sheet-block {
    /* Remove clip-path for cleaner print rendering */
    clip-path: none;

    /* Solid border for print clarity */
    border: 2px solid #000;
    border-left-width: 4px;

    /* White background ensures clean print */
    background: #fff !important;

    /* Prevent border splitting across pages */
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  /* Fill lines need darker borders for print */
  .fill-line {
    border-bottom-color: #666;
    border-bottom-width: 1px;
  }

  /* ---------------------------------------------------------------------
     Part/Chapter Page Breaks
     --------------------------------------------------------------------- */
  [id^="part-"] {
    page-break-before: always;
    break-before: page;
  }

  /* Avoid orphaned headings */
  h1, h2, h3, h4 {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Keep lists and tables together when possible */
  ul, ol, table {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Minimum orphans/widows */
  p {
    orphans: 3;
    widows: 3;
  }
}
```

**Step 2: Verify file was created**

Run: `ls -la src/site/src/styles/print.css`
Expected: File exists with ~100 lines

**Step 3: Commit**

```bash
git add src/site/src/styles/print.css
git commit -m "feat(styles): create print.css for print-only rules

Dedicated stylesheet for @media print rules:
- Page breaks: sheets start on new pages
- Hide interactive elements when printing
- Full-width print layout
- Enhanced sheet borders for print clarity"
```

---

## Task 3: Clean Up reader.css - Remove Conflicting Sheet Styles

**Files:**
- Modify: `src/site/src/styles/reader.css`

**Step 1: Identify lines to remove**

The following sections in reader.css conflict with sheets.css and need removal:

1. Lines 167-234: `.reader-content .sheet-block` and decorative corner pseudo-elements
2. Lines 1007-1010 & 1023-1025: Sheet-specific `@media print` rules (page-break for sheets)

**Step 2: Remove sheet-block screen styles (lines ~167-234)**

Find and delete the entire `.reader-content .sheet-block` block and its `::before`/`::after` pseudo-elements for decorative corners.

The section to remove starts with:
```css
.reader-content .sheet-block {
  /* Subtle purple border with light background and shadow */
```

And ends after the `::after` pseudo-element block.

**Step 3: Remove sheet-specific print rules**

In the `@media print` section, find and remove:

```css
/* Character sheets: Start on new page, but allow natural breaks */
.reader-content .sheet-block {
  page-break-before: always;
  page-break-after: auto; /* Changed from always - removes blank pages */
}
```

And:

```css
/* Allow sheets to break naturally (they're large) */
.reader-content .sheet-block {
  page-break-inside: auto;
}
```

And the sheet border override:
```css
.reader-content .sheet-block {
  border: 3pt solid #000;
  padding: 1.5rem;
  background: #fff !important;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
```

**Step 4: Keep the rest of the @media print section**

The reader.css `@media print` section has good rules for general print layout (typography, tables, example boxes, GM boxes). Keep those - only remove sheet-specific overrides.

**Step 5: Verify changes**

Run: `grep -n "sheet-block" src/site/src/styles/reader.css`
Expected: No matches (all sheet-block rules removed)

**Step 6: Commit**

```bash
git add src/site/src/styles/reader.css
git commit -m "refactor(styles): remove sheet-block styles from reader.css

Sheet styling now handled by dedicated sheets.css.
Print-specific sheet rules now in print.css.
Keeps general @media print rules for typography and layout."
```

---

## Task 4: Update Web Reader Template to Link New Stylesheets

**Files:**
- Modify: `src/tooling/html-gen/templates/web-reader.html`

**Step 1: Read current template**

Find the stylesheet links section (around lines 31-36).

**Step 2: Add sheets.css and print.css links**

Change from:
```html
<!-- Styles -->
<link rel="stylesheet" href="/styles/theme.css">
<link rel="stylesheet" href="/styles/components.css">
<link rel="stylesheet" href="/styles/textures.css">
<link rel="stylesheet" href="/styles/reader.css">
<link rel="stylesheet" href="/styles/animations.css">
```

To:
```html
<!-- Styles -->
<link rel="stylesheet" href="/styles/theme.css">
<link rel="stylesheet" href="/styles/components.css">
<link rel="stylesheet" href="/styles/textures.css">
<link rel="stylesheet" href="/styles/reader.css">
<link rel="stylesheet" href="/styles/sheets.css">
<link rel="stylesheet" href="/styles/animations.css">
<link rel="stylesheet" href="/styles/print.css" media="print">
```

Key points:
- `sheets.css` loads after `reader.css` to ensure sheet styles take precedence
- `print.css` has `media="print"` so it only loads when printing

**Step 3: Verify template updated**

Run: `grep -A 10 "<!-- Styles -->" src/tooling/html-gen/templates/web-reader.html`
Expected: Shows all stylesheet links including sheets.css and print.css

**Step 4: Commit**

```bash
git add src/tooling/html-gen/templates/web-reader.html
git commit -m "feat(html-gen): add sheets.css and print.css to web template

- sheets.css: shared sheet styling (loads after reader.css)
- print.css: print-only rules (media=print attribute)"
```

---

## Task 5: Regenerate Web HTML and Verify

**Files:**
- Output: `data/html/web-reader/core-rulebook.html`

**Step 1: Run the web HTML generator**

Run: `pnpm html:web:build`
Expected: Build completes successfully

**Step 2: Verify stylesheet links in output**

Run: `grep -E "sheets\.css|print\.css" data/html/web-reader/core-rulebook.html`
Expected: Both stylesheets appear in the `<head>` section

**Step 3: Commit generated output**

```bash
git add data/html/web-reader/core-rulebook.html
git commit -m "build: regenerate web-reader HTML with new stylesheet links"
```

---

## Task 6: Manual Verification - Screen Rendering

**No code changes - manual testing**

**Step 1: Serve the site locally**

Run: `cd src/site && pnpm dev`
(Or use live-server/browser-sync on the output directory)

**Step 2: Open the web reader in browser**

Navigate to the sheets section (Chapter 27)

**Step 3: Verify sheet appearance**

Check:
- [ ] Sheets have electric-blue left border
- [ ] Sheets have torn-paper edge effect (clip-path)
- [ ] Typography is compact (small headings, tight spacing)
- [ ] Fill lines display as underlined form fields
- [ ] Dark mode toggle still works
- [ ] Sheets look same as print design

**Step 4: Document any issues**

If issues found, note them for follow-up fixes.

---

## Task 7: Manual Verification - Print Preview

**No code changes - manual testing**

**Step 1: Open print preview (Cmd+P / Ctrl+P)**

In the browser with web reader open, trigger print preview.

**Step 2: Navigate to sheets section in print preview**

Scroll to Chapter 27 sheets.

**Step 3: Verify print behavior**

Check:
- [ ] Each sheet starts on a new page
- [ ] Navigation/TOC elements are hidden
- [ ] Layout is full-width (no sidebar)
- [ ] Sheet borders are visible and clean
- [ ] Fill lines are visible

**Step 4: Test in multiple browsers**

Repeat steps 1-3 in:
- [ ] Chrome
- [ ] Safari
- [ ] Firefox

**Step 5: Document any cross-browser issues**

Note any browser-specific problems for follow-up fixes.

---

## Task 8: Run Existing Tests

**Files:**
- Test: `src/site/tests/`

**Step 1: Run Playwright tests**

Run: `pnpm test:e2e`
Expected: All tests pass

**Step 2: If tests fail**

- Check if failures are expected due to visual changes
- Update visual regression snapshots if the new appearance is correct
- Fix any broken functionality

**Step 3: Commit test updates if needed**

```bash
git add src/site/tests/
git commit -m "test: update visual snapshots for new sheet styling"
```

---

## Task 9: Final Cleanup and PR Preparation

**Step 1: Review all changes**

Run: `git log --oneline feature/web-print-alignment ^main`
Expected: 5-7 commits showing incremental progress

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

**Step 3: Create summary of changes**

The branch includes:
- `sheets.css`: New shared sheet styling
- `print.css`: New print-only rules
- `reader.css`: Cleaned up, sheet styles removed
- `web-reader.html`: Updated stylesheet links
- Generated HTML: Updated with new links

---

## Rollback Plan

If issues are found after deployment:

1. Revert to previous reader.css (has embedded sheet styles)
2. Remove sheets.css and print.css links from template
3. Regenerate web HTML

The changes are additive and isolated, making rollback straightforward.
