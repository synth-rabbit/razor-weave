# Core Rulebook HTML Refinements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine core rulebook HTML with fixed sidebar navigation, increased Hot Pink usage, rough page edges, and overhauled print styles for professional draft PDF quality.

**Architecture:** CSS-only modifications to existing HTML file's `<style>` block. No HTML structure changes. Five-phase approach: Navigation → Colors → Visual Effects → Print Overhaul → Testing.

**Tech Stack:** Pure CSS (clip-path, custom properties, media queries, data URIs)

**Working Directory:** `/Users/pandorz/Documents/razorweave/.worktrees/core-rulebook-html-polish`

**Target File:** `books/core/v1/exports/html/core_rulebook.html`

---

## Task 1: Navigation Restructure (Fixed Sidebar)

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (lines 13-850, `<style>` block)

**Goal:** Replace sticky top navigation with fixed left sidebar (280px width)

### Step 1: Add sidebar width CSS variable

In the `:root` custom properties section (around line 20), add:

```css
:root {
  /* Existing variables... */

  /* Layout */
  --sidebar-width: 280px;
}
```

### Step 2: Style the navigation as fixed sidebar

Find the `nav` styles (around line 98-139) and replace with:

```css
nav {
  position: fixed;
  left: 0;
  top: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--color-white);
  border-right: 2px solid var(--color-border-gray);
  padding: 1.5rem;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

nav h1 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--color-electric-blue);
}

nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

nav li {
  margin: 0.5rem 0;
}

nav a {
  color: var(--color-deep-purple);
  text-decoration: none;
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

nav a:hover {
  color: var(--color-electric-blue);
  background: var(--color-light-blue);
}

nav a:active,
nav a.active {
  color: var(--color-hot-pink);
  background: var(--color-light-pink);
}

/* Nested navigation */
nav ul ul {
  margin-left: 1rem;
  font-size: 0.95rem;
}
```

### Step 3: Adjust main content to accommodate sidebar

Find the `body` or main content container styles and add margin:

```css
body {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  font-size: 1.125rem;
  background: var(--color-white);
  color: var(--color-ink-black);
  margin-left: var(--sidebar-width);
  padding: 2rem 3rem;
}
```

### Step 4: Add print media query to hide sidebar

In the `@media print` section (around line 558), add:

```css
@media print {
  nav {
    display: none !important;
  }

  body {
    margin-left: 0 !important;
    padding: 0 !important;
  }
}
```

### Step 5: Visual test in browser

**Action:** Open `books/core/v1/exports/html/core_rulebook.html` in Chrome

**Expected Result:**
- Fixed sidebar on left (280px width)
- Sidebar contains TOC with Deep Purple links
- Hover shows Electric Blue with light blue background
- Main content shifted right by 280px
- Sidebar scrolls independently if TOC is long

### Step 6: Commit

```bash
cd /Users/pandorz/Documents/razorweave/.worktrees/core-rulebook-html-polish
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "refactor(site): replace top nav with fixed sidebar TOC

- Fixed left sidebar (280px width) with independent scrolling
- TOC links use Deep Purple for readability (vs Electric Blue on white)
- Electric Blue on hover, Hot Pink for active states
- Main content shifted right to accommodate sidebar
- Sidebar hidden in print, content expands to full width

Addresses critical navigation UX issue from user feedback."
```

---

## Task 2: Color System Updates (Increase Hot Pink Usage)

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (lines 13-850, `<style>` block)

**Goal:** Shift H3 headings to Hot Pink and increase Hot Pink usage throughout design

### Step 1: Update H3 heading color

Find the `h3` styles (around line 70-75) and update:

```css
h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-hot-pink); /* Changed from Electric Blue */
  margin-top: 2rem;
  margin-bottom: 1rem;
}
```

### Step 2: Add Hot Pink to section dividers

Find or add horizontal rule styles:

```css
hr {
  border: none;
  border-top: 2px solid var(--color-hot-pink);
  margin: 3rem 0;
  opacity: 0.6;
}

.section-divider {
  border-top: 3px solid var(--color-hot-pink);
  margin: 4rem 0;
}
```

### Step 3: Add Hot Pink table header variant

After existing table styles (around line 180), add:

```css
/* Hot Pink table variant */
table.variant-pink thead th {
  background: var(--color-hot-pink);
  color: var(--color-white);
}

table.variant-pink tbody tr:nth-child(even) {
  background: var(--color-light-pink);
}

/* Alternate table headers with Hot Pink */
table:nth-of-type(2n) thead th {
  background: var(--color-hot-pink);
}

table:nth-of-type(2n) tbody tr:nth-child(even) {
  background: var(--color-light-pink);
}
```

### Step 4: Update H4 heading color (optional enhancement)

```css
h4 {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-hot-pink);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}
```

### Step 5: Visual test in browser

**Action:** Refresh `core_rulebook.html` in Chrome

**Expected Result:**
- H3 headings are Hot Pink (#FF006E)
- Horizontal rules use Hot Pink
- Alternating tables use Hot Pink headers
- Color balance feels ~60% Electric Blue / 40% Hot Pink
- Design still feels professional, not overwhelming

### Step 6: Commit

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "style(site): increase Hot Pink usage for better color balance

- H3 and H4 headings now use Hot Pink (#FF006E)
- Section dividers (hr) use Hot Pink for visual breaks
- Alternating table headers use Hot Pink variant
- Achieves ~60/40 Electric Blue/Hot Pink balance

Addresses secondary color under-utilization feedback."
```

---

## Task 3: Rough Page Edges on Containers

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (lines 13-850, `<style>` block)

**Goal:** Add torn/rough paper edge effect to content containers using CSS clip-path

### Step 1: Add rough edge clip-path to example boxes

Find `.example` styles (around line 140-150) and add:

```css
.example {
  border-left: 4px solid var(--color-electric-blue);
  background: var(--color-light-blue);
  padding: 1.25rem;
  margin: 2rem 0;
  border-radius: 2px;

  /* Rough torn-paper edges */
  clip-path: polygon(
    0% 1%, 2% 0%, 5% 0.5%, 8% 0%, 12% 1%, 15% 0.5%, 20% 0%, 25% 1%,
    30% 0.5%, 35% 0%, 40% 1%, 45% 0.5%, 50% 0%, 55% 1%, 60% 0.5%,
    65% 0%, 70% 1%, 75% 0.5%, 80% 0%, 85% 1%, 90% 0.5%, 95% 0%, 98% 1%, 100% 0.5%,
    100% 99%, 98% 100%, 95% 99.5%, 90% 100%, 85% 99%, 80% 99.5%, 75% 100%, 70% 99%,
    65% 99.5%, 60% 100%, 55% 99%, 50% 99.5%, 45% 100%, 40% 99%, 35% 99.5%, 30% 100%,
    25% 99%, 20% 99.5%, 15% 100%, 12% 99%, 8% 99.5%, 5% 100%, 2% 99%, 0% 99.5%
  );
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Step 2: Add rough edge clip-path to GM boxes

Find `.gm` styles and add similar clip-path with different polygon points:

```css
.gm {
  border-left: 4px solid var(--color-hot-pink);
  background: var(--color-light-pink);
  padding: 1.25rem;
  margin: 2rem 0;
  border-radius: 2px;

  /* Rough torn-paper edges (asymmetric variation) */
  clip-path: polygon(
    0% 0.5%, 3% 0%, 7% 1%, 10% 0.5%, 15% 0%, 20% 1%, 25% 0.5%, 30% 0%,
    35% 1%, 40% 0.5%, 45% 0%, 50% 1%, 55% 0.5%, 60% 0%, 65% 1%, 70% 0.5%,
    75% 0%, 80% 1%, 85% 0.5%, 90% 0%, 93% 1%, 97% 0.5%, 100% 0%,
    100% 99.5%, 97% 100%, 93% 99%, 90% 99.5%, 85% 100%, 80% 99%, 75% 99.5%,
    70% 100%, 65% 99%, 60% 99.5%, 55% 100%, 50% 99%, 45% 99.5%, 40% 100%,
    35% 99%, 30% 99.5%, 25% 100%, 20% 99%, 15% 99.5%, 10% 100%, 7% 99%, 3% 99.5%, 0% 100%
  );
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Step 3: Add rough edge clip-path to sheet blocks

Find `.sheet-block` styles and add:

```css
.sheet-block {
  border: 2px solid var(--color-electric-blue);
  border-radius: 4px;
  padding: 1.5rem 1.25rem;
  margin: 2rem 0;
  page-break-inside: avoid;

  /* Rough torn-paper edges (third variation) */
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
```

### Step 4: Visual test in browser

**Action:** Refresh `core_rulebook.html` in Chrome, scroll to see example boxes, GM boxes, sheet blocks

**Expected Result:**
- Containers have rough, torn-paper edges (subtle but visible)
- Each container type has slightly different edge pattern (organic feel)
- Subtle drop shadow beneath rough edges adds depth
- Effect is professional, not gimmicky

### Step 5: Commit

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "style(site): add rough torn-paper edges to containers

- CSS clip-path creates hand-torn edge effect on containers
- Each container class (.example, .gm, .sheet-block) has asymmetric variation
- Subtle drop shadows add depth and dimension
- Professional page-like quality without looking gimmicky

Part of visual design enhancement for polished draft PDF feel."
```

---

## Task 4: Subtle Paper Texture Background

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (lines 13-850, `<style>` block)

**Goal:** Add very subtle paper grain texture to body background

### Step 1: Add paper texture using CSS filter with data URI

Find or add `body` styles and insert background:

```css
body {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  font-size: 1.125rem;
  background: var(--color-white);
  color: var(--color-ink-black);
  margin-left: var(--sidebar-width);
  padding: 2rem 3rem;

  /* Subtle paper texture */
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter><rect width="200" height="200" filter="url(%23noise)" opacity="0.05"/></svg>');
  background-repeat: repeat;
}
```

**Note:** The data URI creates a subtle noise pattern at ~5% opacity. This breaks up digital flatness without being distracting.

### Step 2: Add print media query to remove texture

In the `@media print` section, ensure background is removed:

```css
@media print {
  body {
    background-image: none !important;
    background: white !important;
  }
}
```

### Step 3: Visual test in browser

**Action:** Refresh `core_rulebook.html` in Chrome, zoom in to see subtle texture

**Expected Result:**
- Very faint paper grain visible when you look closely
- Barely perceptible at normal viewing distance
- Breaks up stark white digital background
- Feels more tactile and premium
- Not distracting from content

### Step 4: Adjust opacity if needed

If texture is too visible or not visible enough, adjust the `opacity` value in the data URI:
- Too visible: reduce to `opacity="0.03"`
- Not visible enough: increase to `opacity="0.08"`

Optimal range: 0.03-0.08

### Step 5: Commit

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "style(site): add subtle paper texture to body background

- SVG data URI creates fine grain texture at 5% opacity
- Barely perceptible, breaks up digital flatness
- Creates tactile, premium feel without distraction
- Removed in print to avoid texture artifacts

Completes visual design enhancements for professional quality feel."
```

---

## Task 5: Print Stylesheet Overhaul (CRITICAL)

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (lines 558-857, `@media print` section)

**Goal:** Remove all borders in print, implement smart page-break strategy for clean PDF output

### Step 1: Remove all borders and decorative elements in print

Replace or update the `@media print` section with comprehensive border removal:

```css
@media print {
  /* Page setup */
  @page {
    margin: 0.75in 0.5in;
    size: letter;
  }

  /* Hide navigation and restore content width */
  nav {
    display: none !important;
  }

  body {
    margin-left: 0 !important;
    padding: 0 !important;
    background-image: none !important;
    background: white !important;
  }

  /* CRITICAL: Remove ALL borders to prevent split-border artifacts */
  .example,
  .gm,
  .sheet-block,
  table,
  .character-sheet,
  .reference-sheet {
    border: none !important;
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
    border-bottom: none !important;
    clip-path: none !important; /* Remove rough edges */
    box-shadow: none !important; /* Remove shadows */
  }

  /* Maintain structure with generous padding and spacing */
  .example,
  .gm,
  .sheet-block {
    padding: 1.5rem 2rem;
    margin: 1.5rem 0;
  }

  /* Preserve backgrounds for visual organization */
  .example {
    background: var(--color-light-blue);
  }

  .gm {
    background: var(--color-light-pink);
  }

  /* Color preservation */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

### Step 2: Implement smart page-break strategy

Add page-break rules after border removal in `@media print`:

```css
@media print {
  /* ... border removal rules above ... */

  /* CRITICAL PAGE-BREAK STRATEGY */

  /* Character sheets: Force single-page */
  .character-sheet,
  .reference-sheet,
  .sheet-block.full-page {
    page-break-before: always;
    page-break-after: always;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Content blocks: Keep together if possible, but allow breaking if needed */
  .sheet-block {
    page-break-inside: avoid;
    /* No forced before/after breaks */
  }

  /* Example and GM boxes: Prefer keeping together */
  .example,
  .gm {
    page-break-inside: avoid;
    orphans: 3;
    widows: 3;
  }

  /* Tables: Keep small tables together, allow large tables to break */
  table {
    page-break-inside: auto; /* Allow breaking for large tables */
  }

  thead {
    display: table-header-group; /* Repeat header on each page if table breaks */
  }

  tbody tr {
    page-break-inside: avoid; /* Keep rows together */
  }

  /* Headings: Prevent orphan headings */
  h1, h2, h3, h4 {
    page-break-after: avoid;
    orphans: 3;
    widows: 3;
  }
}
```

### Step 3: Preserve colors and typography in print

Add color and font preservation rules in `@media print`:

```css
@media print {
  /* ... previous rules ... */

  /* Preserve heading colors */
  h1, h2 {
    color: var(--color-electric-blue) !important;
  }

  h3, h4 {
    color: var(--color-hot-pink) !important;
  }

  /* Preserve link colors */
  a {
    color: var(--color-electric-blue);
    text-decoration: underline;
  }

  /* Table styling without borders */
  thead th {
    background: var(--color-electric-blue);
    color: var(--color-white);
    font-weight: 600;
    padding: 0.75rem 1rem;
  }

  table:nth-of-type(2n) thead th {
    background: var(--color-hot-pink);
  }

  tbody td {
    padding: 0.5rem 1rem;
  }

  tbody tr:nth-child(even) {
    background: var(--color-light-blue);
  }

  table:nth-of-type(2n) tbody tr:nth-child(even) {
    background: var(--color-light-pink);
  }
}
```

### Step 4: Test print preview in Chrome

**Action:** Open `core_rulebook.html` in Chrome → Cmd+P (Print Preview)

**Expected Results:**
- ✅ Sidebar completely hidden
- ✅ Content expanded to full page width
- ✅ NO borders on any containers (critical!)
- ✅ Character sheets print as single complete pages
- ✅ If content spans pages, it breaks cleanly without visual artifacts
- ✅ No split borders across page boundaries
- ✅ Colors preserved (backgrounds, headings, table headers)
- ✅ Generous padding maintains visual structure
- ✅ No paper texture visible in print

### Step 5: Test print preview in Safari

**Action:** Open `core_rulebook.html` in Safari → Cmd+P (Print Preview)

**Expected Results:** Same as Chrome test above

### Step 6: Test PDF export

**Action:** From Chrome print preview, click "Save as PDF"

**Expected Results:**
- PDF opens cleanly
- No border artifacts
- Character sheets are single usable pages
- Colors preserved throughout
- Professional quality suitable for draft distribution

### Step 7: Commit

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "fix(site): overhaul print stylesheet for clean PDF output

CRITICAL FIXES:
- Remove ALL borders in print (prevents split-border artifacts)
- Smart page-break strategy: character sheets as single pages
- Content blocks break cleanly if needed (no forced breaks)
- Tables allow breaking with thead repeating

STRUCTURAL CHANGES:
- Generous padding (1.5rem-2rem) maintains visual organization
- Subtle backgrounds preserved for structure
- Color preservation with print-color-adjust: exact
- Typography hierarchy as primary organizational tool

TESTING:
- Character sheets print as single usable pages ✅
- No borders splitting across pages ✅
- Clean multi-page breaks without visual artifacts ✅
- Colors preserved throughout ✅

Resolves critical print quality issues from user feedback."
```

---

## Task 6: Comprehensive Visual and Print Testing

**Goal:** Verify all refinements work correctly across browsers and in PDF export

### Step 1: Screen rendering test checklist

**Action:** Open `core_rulebook.html` in Chrome, Safari, and Firefox

**Test Checklist:**

✅ **Navigation:**
- Fixed sidebar visible on left (280px width)
- Sidebar scrolls independently
- TOC links readable (Deep Purple/Ink Black)
- Hover states work (Electric Blue with light background)
- Active states work (Hot Pink with pink background)

✅ **Colors:**
- H3 and H4 headings are Hot Pink
- H1 and H2 headings are Electric Blue
- Horizontal rules are Hot Pink
- Alternating table headers use Hot Pink
- Color balance feels ~60% Blue / 40% Pink

✅ **Visual Effects:**
- Example boxes have rough torn edges
- GM boxes have rough torn edges (different pattern)
- Sheet blocks have rough torn edges (different pattern)
- Subtle drop shadows on containers
- Subtle paper texture on body background (barely visible)

✅ **General:**
- Design feels professional and polished
- Not gimmicky or overwhelming
- Readable and scannable

### Step 2: Print preview test checklist

**Action:** Cmd+P in Chrome → Print Preview

**Test Checklist:**

✅ **Navigation:**
- Sidebar completely hidden
- Content expands to full width

✅ **Borders and Edges:**
- NO borders visible on any containers
- NO rough edges visible (clip-path removed)
- NO drop shadows visible

✅ **Structure:**
- Generous padding maintains visual separation
- Backgrounds preserved (light blue, light pink)
- Typography hierarchy clear

✅ **Page Breaks:**
- Character sheets print as single complete pages
- Character sheets are usable (not cut off)
- Content blocks break cleanly if needed
- NO split borders across page boundaries
- Tables break cleanly with repeating headers

✅ **Colors:**
- H3/H4 headings are Hot Pink
- H1/H2 headings are Electric Blue
- Table headers use Electric Blue and Hot Pink
- Backgrounds visible and preserved

### Step 3: Cross-browser print preview test

**Action:** Repeat Step 2 in Safari and Firefox

**Expected:** Same results as Chrome print preview

### Step 4: PDF export test

**Action:**
1. Chrome → Cmd+P → Save as PDF → `core_rulebook_refined.pdf`
2. Open PDF in Preview app
3. Scroll through entire document

**Test Checklist:**

✅ **Overall Quality:**
- PDF looks professional and polished
- Suitable for draft distribution
- No visual artifacts or broken elements

✅ **Critical Issues Resolved:**
- Character sheets are single usable pages
- No borders splitting across pages
- Clean page breaks throughout

✅ **Visual Quality:**
- Colors preserved
- Typography clear and readable
- Spacing and padding consistent

### Step 5: Document test results

**Action:** Create brief test report if any issues found

If all tests pass, note in commit message. If issues found, document:
- What browser/context
- What element/section
- Screenshot if helpful
- Proposed fix

### Step 6: Final commit (if fixes needed)

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "fix(site): address [specific issue] from testing

[Description of issue and fix]

Testing: [Browser/context where verified]"
```

---

## Success Criteria

All of the following must be true:

✅ **Navigation (Screen):**
- Fixed sidebar TOC on left with readable link colors
- Sidebar hidden in print, content expands

✅ **Color Balance:**
- H3 headings use Hot Pink
- ~40% Hot Pink usage throughout (vs 60% Electric Blue)
- Professional color balance, not overwhelming

✅ **Visual Design:**
- Rough torn-paper edges on containers (screen only)
- Subtle paper texture on background (screen only)
- Professional and polished feel

✅ **Print Quality (CRITICAL):**
- Character sheets print as single usable pages
- NO borders splitting across pages
- Clean multi-page breaks without visual artifacts
- Colors preserved throughout

✅ **Overall Quality:**
- Simple but professional
- Suitable for draft PDF distribution
- All three critical user feedback issues resolved

---

## Implementation Notes

**Estimated Time:** 2-3 hours (including testing)

**Testing is Critical:** Print preview and PDF export must be tested thoroughly. The print quality issues were the most critical user feedback.

**Browser Compatibility:** Test in Chrome, Safari, and Firefox. Print engines differ slightly.

**Rollback Plan:** All changes are in the `<style>` block. If issues arise, previous commits can be cherry-picked or reverted.

**Next Steps After Completion:**
- Export final PDF for user review
- Merge feature branch to main
- Consider creating tagged release for this version
