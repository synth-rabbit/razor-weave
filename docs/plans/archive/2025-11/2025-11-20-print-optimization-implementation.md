# Print Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add CSS-only print optimization for draft PDFs and tabletop printing

**Architecture:** Aggressive page-break rules with visual hierarchy, no HTML changes required

**Tech Stack:** CSS3 @media print, page-break properties, visual testing in browser

**Design Document:** `docs/plans/2025-11-20-print-optimization-design.md`

**Backup:** `src/site/src/styles/reader.css.backup` (created, can restore with `cp reader.css.backup reader.css`)

---

## Task 1: Add Page-Break Rules (Tier 1 - Always Break)

**Files:**
- Modify: `src/site/src/styles/reader.css:889-936` (inside `@media print` block)

**Goal:** Force major sections to start on new pages

**Step 1: Add chapter and section break rules**

Add after line 892 (`body::after { display: none !important; }`):

```css
  /* Page breaks - Tier 1: Always break for major sections */
  .reader-content h1,
  .reader-content .part-intro {
    page-break-before: always;
    page-break-after: avoid;
  }

  /* Exception: Don't force blank first page */
  .reader-content h1:first-child,
  .reader-content .part-intro:first-child {
    page-break-before: auto;
  }

  /* Character sheets: Isolated on own pages */
  .reader-content .sheet-block {
    page-break-before: always;
    page-break-after: always;
  }
```

**Step 2: Build and test in print preview**

```bash
pnpm build
```

Open http://localhost:3001/read.html, press Cmd+P (print preview):
- ✅ Part I, Part II, etc. start on new pages
- ✅ Chapters start on new pages
- ✅ Character sheets are isolated
- ✅ First chapter doesn't create blank first page

**Step 3: Commit**

```bash
git add src/site/src/styles/reader.css
git commit -m "feat(print): add Tier 1 page breaks for major sections

- H1 and .part-intro always start new pages
- Character sheets isolated before/after
- First section doesn't create blank page"
```

---

## Task 2: Add Page-Break Rules (Tier 2 - Avoid Breaks)

**Files:**
- Modify: `src/site/src/styles/reader.css` (inside `@media print` block)

**Goal:** Prevent tables, examples, GM guidance, and lists from splitting across pages

**Step 1: Add content block protection rules**

Add after the Tier 1 rules:

```css
  /* Page breaks - Tier 2: Strongly avoid breaks in content blocks */
  .reader-content table,
  .reader-content .example,
  .reader-content .gm,
  .reader-content .sheet-block,
  .reader-content ul,
  .reader-content ol,
  .reader-content dl {
    page-break-inside: avoid;
    break-inside: avoid; /* Modern syntax */
  }

  /* Extra insurance for table rows */
  .reader-content tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Table headers repeat on multi-page tables */
  .reader-content thead {
    display: table-header-group;
  }
```

**Step 2: Build and test**

```bash
pnpm build
```

Print preview check:
- ✅ Tables stay together (or break cleanly with repeating headers)
- ✅ Examples (blue boxes) don't split mid-content
- ✅ GM Guidance (purple boxes) don't split mid-content
- ✅ Lists stay together

**Step 3: Commit**

```bash
git add src/site/src/styles/reader.css
git commit -m "feat(print): add Tier 2 page breaks to prevent content splits

- Tables, examples, GM guidance avoid breaks
- Lists (ul, ol, dl) avoid breaks
- Table rows avoid breaks
- Table headers repeat on multi-page tables"
```

---

## Task 3: Add Page-Break Rules (Tier 3 - Soft Guidance)

**Files:**
- Modify: `src/site/src/styles/reader.css` (inside `@media print` block)

**Goal:** Keep headings with following content

**Step 1: Add heading break guidance**

Add after Tier 2 rules:

```css
  /* Page breaks - Tier 3: Soft guidance for headings */
  .reader-content h2 {
    page-break-after: avoid; /* Keep with following content */
    page-break-before: auto; /* Allow natural breaks if needed */
  }

  .reader-content h3,
  .reader-content h4 {
    page-break-after: avoid; /* Keep with following content */
  }
```

**Step 2: Build and test**

```bash
pnpm build
```

Print preview check:
- ✅ Headings don't appear alone at bottom of page
- ✅ H2 can still break before if content requires it

**Step 3: Commit**

```bash
git add src/site/src/styles/reader.css
git commit -m "feat(print): add Tier 3 page break guidance for headings

- H2/H3/H4 avoid breaking after (keep with content)
- H2 allows natural breaks before if needed"
```

---

## Task 4: Add Visual Hierarchy and Spacing

**Files:**
- Modify: `src/site/src/styles/reader.css` (inside `@media print` block)

**Goal:** Make sections visually distinct with clear spacing and borders

**Step 1: Update existing heading rules with spacing**

Replace the existing h1/h2/h3/h4 font-size rules (lines 921-935) with:

```css
  /* Typography with spacing */
  .reader-content h1 {
    font-size: 20pt;
    margin-top: 0; /* Starts new page */
    margin-bottom: 2rem;
  }

  .reader-content h2 {
    font-size: 16pt;
    margin-top: 1.5rem;
    border-bottom: 2pt solid #000; /* Visual divider */
    padding-bottom: 0.5rem;
  }

  .reader-content h3 {
    font-size: 13pt;
    margin-top: 1rem;
  }

  .reader-content h4 {
    font-size: 12pt;
    margin-top: 0.75rem;
  }
```

**Step 2: Add content block styling**

Add after the heading styles:

```css
  /* Visual distinction for special content */
  .reader-content .example {
    border-left: 4pt solid #0099cc;
    padding: 1rem;
    margin: 1rem 0;
    background: rgba(0, 217, 255, 0.1) !important;
  }

  .reader-content .gm {
    border-left: 4pt solid #7B2CBF;
    padding: 1rem;
    margin: 1rem 0;
    background: rgba(123, 44, 191, 0.1) !important;
  }

  .reader-content .sheet-block {
    border: 3pt solid #000;
    padding: 1.5rem;
    background: #fff !important;
  }

  /* Table spacing */
  .reader-content table {
    margin: 1rem 0;
  }

  /* Improved readability */
  body {
    line-height: 1.6;
  }

  /* Orphans and widows */
  .reader-content p,
  .reader-content li {
    orphans: 3;
    widows: 3;
  }
```

**Step 3: Build and test**

```bash
pnpm build
```

Print preview check:
- ✅ H2 has visible bottom border
- ✅ Examples have blue left border
- ✅ GM Guidance has purple left border
- ✅ Character sheets have black border, white background
- ✅ Spacing creates visual breathing room
- ✅ No orphan/widow single lines

**Step 4: Commit**

```bash
git add src/site/src/styles/reader.css
git commit -m "feat(print): add visual hierarchy and spacing

- H1: 2rem bottom margin
- H2: 1.5rem top margin + 2pt bottom border
- Examples: 4pt blue left border + spacing
- GM Guidance: 4pt purple left border + spacing
- Sheets: 3pt black border, white background
- Line-height 1.6 for readability
- Orphans/widows set to 3"
```

---

## Task 5: Hide Web-Only Content

**Files:**
- Modify: `src/site/src/styles/reader.css` (inside `@media print` block)

**Goal:** Hide keyboard shortcuts and support future web-only sections

**Step 1: Add web-only hiding rules**

Add after the navigation hiding rules (around line 900):

```css
  /* Hide web-only content */
  #keyboard-shortcuts,
  .web-only {
    display: none;
  }
```

**Step 2: Build and test**

```bash
pnpm build
```

Print preview check:
- ✅ Keyboard Shortcuts section is hidden
- ✅ (Future: sections with .web-only class will be hidden)

**Step 3: Commit**

```bash
git add src/site/src/styles/reader.css
git commit -m "feat(print): hide web-only content

- Hide #keyboard-shortcuts section
- Support .web-only class for future use"
```

---

## Task 6: Visual Testing and Iteration

**Files:**
- Test: `src/site/dist/read.html` (print preview)
- Reference: `docs/plans/2025-11-20-print-optimization-design.md`

**Goal:** Validate all success criteria are met

**Step 1: Firefox print preview test**

Open http://localhost:3001/read.html, press Cmd+P:

**Success Criteria Checklist:**
- [ ] Chapters start on new pages
- [ ] No tables/examples/GM boxes split mid-content
- [ ] Character sheets isolated with clear boundaries
- [ ] Visual hierarchy clear (sections are distinct)
- [ ] No texture overlay or decorative elements
- [ ] Readable on screen preview
- [ ] Keyboard Shortcuts section hidden

**Step 2: Export to PDF and review**

From print preview:
- Save as PDF
- Open PDF at 100% zoom
- Review multi-page sheets are usable
- Check text contrast

**Step 3: Chrome/Safari validation (if available)**

Same tests in other browsers for consistency.

**Step 4: Document any issues found**

If issues found, iterate on CSS rules:
- Too much white space → Adjust margin values
- Content still splitting → Add more specific selectors
- Sheets breaking badly → Consider wrapper divs (fallback plan)

**Step 5: Final commit if iterations made**

```bash
git add src/site/src/styles/reader.css
git commit -m "fix(print): tune spacing and breaks after testing

[Describe specific adjustments made]"
```

---

## Task 7: Clean Up and Documentation

**Files:**
- Review: `src/site/src/styles/reader.css.backup`
- Update: `docs/plans/2025-11-20-print-optimization-implementation.md` (this file)

**Goal:** Ensure backup is available and document final state

**Step 1: Verify backup exists**

```bash
ls -la src/site/src/styles/reader.css.backup
```

Expected: Backup file exists with timestamp before implementation

**Step 2: Add implementation notes to design doc**

Add to `docs/plans/2025-11-20-print-optimization-design.md` at end:

```markdown
---

## Implementation Complete

**Date:** 2025-11-20
**Implementation Plan:** `2025-11-20-print-optimization-implementation.md`
**Commits:** [List commit hashes]
**Testing:** Validated in Firefox, Chrome, Safari print preview
**Result:** All success criteria met ✅

**Rollback:** If needed, restore with `cp src/site/src/styles/reader.css.backup src/site/src/styles/reader.css`
```

**Step 3: Final commit**

```bash
git add docs/plans/2025-11-20-print-optimization-design.md
git commit -m "docs(print): mark implementation complete

All success criteria validated in print preview"
```

---

## Success Criteria (Final Validation)

Before marking complete, verify ALL of these:

- ✅ **Chapters start on new pages** - H1 and .part-intro have `page-break-before: always`
- ✅ **No content splits** - Tables, examples, GM guidance, lists have `page-break-inside: avoid`
- ✅ **Sheets isolated** - .sheet-block has `page-break-before` and `page-break-after: always`
- ✅ **Visual hierarchy** - H2 borders, content block borders, clear spacing
- ✅ **No overlays** - body::after hidden, no decorative corners
- ✅ **Web content hidden** - #keyboard-shortcuts and .web-only not visible
- ✅ **Readable** - Line-height 1.6, orphans/widows set, good contrast
- ✅ **PDF export works** - Can save as PDF with good quality

---

## Rollback Plan

If print CSS causes issues:

**Option 1: Fine-tune problematic rules**
```bash
# Edit src/site/src/styles/reader.css
# Adjust margins, remove specific page-break rules
pnpm build
# Test again
```

**Option 2: Complete rollback**
```bash
cp src/site/src/styles/reader.css.backup src/site/src/styles/reader.css
pnpm build
git add src/site/src/styles/reader.css
git commit -m "revert: rollback print optimization to baseline"
```

---

## Estimated Time

- Task 1: 5 minutes
- Task 2: 5 minutes
- Task 3: 5 minutes
- Task 4: 10 minutes
- Task 5: 3 minutes
- Task 6: 20-30 minutes (testing and iteration)
- Task 7: 5 minutes

**Total: 53-63 minutes** (approximately 1 hour)