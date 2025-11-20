# Core Rulebook HTML Visual Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform `books/core/v1/exports/html/core_rulebook.html` with comprehensive visual improvements including synthwave-inspired design, enhanced typography, and print optimization.

**Architecture:** CSS-only modifications to the existing HTML file. All changes made to the `<style>` block (lines 8-787). HTML structure remains unchanged. Google Fonts loaded via CDN for typography. Visual testing via browser inspection and PDF generation.

**Tech Stack:** HTML5, CSS3, Google Fonts (Space Grotesk, Inter, JetBrains Mono), print media queries

**Design Reference:** `/Users/pandorz/Documents/razorweave/.worktrees/core-rulebook-html-polish/docs/plans/2025-11-18-core-rulebook-html-polish-design.md`

**Testing Strategy:** Each task includes visual inspection in browser. Final testing includes PDF generation and verification of print-specific requirements (character sheets on single pages, no sheet-block breaks).

---

## Task 1: Set Up Google Fonts

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:4-7` (in `<head>` section)

**Step 1: Copy the file from main working directory**

The file exists in `/Users/pandorz/Documents/razorweave/books/core/v1/exports/html/core_rulebook.html` but not yet in the worktree.

```bash
cp /Users/pandorz/Documents/razorweave/books/core/v1/exports/html/core_rulebook.html \
   books/core/v1/exports/html/core_rulebook.html
```

**Step 2: Add Google Fonts imports**

Add after line 7 (after `<meta name="viewport">`):

```html
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Step 3: Verify in browser**

Open the HTML file in a browser and inspect that fonts are loading (check Network tab).

**Step 4: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: add Google Fonts for typography system

Loaded fonts:
- Space Grotesk (headings): 500, 600, 700
- Inter (body): 400, 500, 600
- JetBrains Mono (monospace): 400, 500

Part of synthwave-inspired visual redesign."
```

---

## Task 2: Typography - Base Font Families

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:9-27` (body and heading styles)

**Step 1: Update body font family**

Find line ~10:
```css
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Replace with:
```css
body {
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

**Step 2: Update heading font family**

Find line ~26:
```css
h1, h2, h3, h4 {
  font-family: "Georgia", "Times New Roman", serif;
```

Replace with:
```css
h1, h2, h3, h4 {
  font-family: "Space Grotesk", system-ui, -apple-system, sans-serif;
```

**Step 3: Add monospace font (for future use)**

Add after the heading styles (around line 45):
```css
code, pre, .monospace {
  font-family: "JetBrains Mono", "SF Mono", Monaco, Consolas, monospace;
}
```

**Step 4: Verify in browser**

Open file, verify headings use Space Grotesk and body uses Inter.

**Step 5: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: update typography to use Google Fonts

- Headings: Space Grotesk (modern geometric sans)
- Body: Inter (clean readable sans)
- Monospace: JetBrains Mono

Replaces system serif/sans fonts with distinctive modern typography."
```

---

## Task 3: Typography - Font Sizes & Hierarchy

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:29-45` (heading sizes)
- Modify: `books/core/v1/exports/html/core_rulebook.html:16-20` (main container and line-height)

**Step 1: Update body base size and line-height**

Find body styles (~line 16-20), update line-height:
```css
main {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  line-height: 1.7; /* Changed from 1.6 */
}
```

Also update body font size (add after line ~14):
```css
body {
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 1.125rem; /* 18px base */
  background: #ffffff;
  color: #222222;
  margin: 0;
  padding: 0;
}
```

**Step 2: Update heading sizes**

Find and replace heading styles (~lines 29-45):
```css
h1 {
  font-size: 2.75rem; /* Increased from 2.4rem */
  font-weight: 700;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}
h2 {
  font-size: 2rem; /* Same */
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.2;
}
h3 {
  font-size: 1.4rem; /* Increased from 1.3rem */
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.2;
}
h4 {
  font-size: 1.1rem; /* Same */
  font-weight: 500;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}
```

**Step 3: Verify visual hierarchy in browser**

Check that heading sizes create clear hierarchy and spacing feels balanced.

**Step 4: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: enhance typography hierarchy and spacing

- Increased base font size to 1.125rem (18px)
- Increased line-height to 1.7 for readability
- Enhanced heading scale (H1: 2.75rem, H3: 1.4rem)
- Set proper font weights (700, 600, 500)
- Consistent spacing rhythm with margin values"
```

---

## Task 4: Color Palette - CSS Custom Properties

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:8-15` (add :root section at top of <style>)

**Step 1: Add CSS custom properties**

Add at the very beginning of the `<style>` block (after line 8):
```css
<style>
  /* ===================================
     SYNTHWAVE COLOR SYSTEM
     =================================== */
  :root {
    /* Core Synthwave Colors */
    --color-electric-blue: #00D9FF;
    --color-hot-pink: #FF006E;
    --color-deep-purple: #7B2CBF;

    /* Neutrals */
    --color-ink-black: #1A1A1A;
    --color-medium-gray: #6B6B6B;
    --color-border-gray: #E0E0E0;
    --color-light-gray: #F5F5F5;
    --color-white: #FFFFFF;

    /* Tinted Backgrounds */
    --color-light-blue: #E5FAFF;
    --color-light-pink: #FFE5F3;
    --color-light-purple: #F3E5FF;

    /* Semantic (optional) */
    --color-success: #2D7A4F;
    --color-caution: #B88A2E;
  }

  /* ===================================
     BASE STYLES
     =================================== */
```

**Step 2: Verify variables work**

Open browser DevTools, check that CSS variables are defined in :root.

**Step 3: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: add synthwave color system with CSS custom properties

Defined color palette:
- Electric Blue (#00D9FF) - primary brand
- Hot Pink (#FF006E) - secondary accent
- Deep Purple (#7B2CBF) - tertiary

Plus neutrals and tinted backgrounds for components.
Ready to apply throughout design."
```

---

## Task 5: Apply Color Palette - Base Elements

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (body, headings, links)

**Step 1: Update body text color**

Find body styles, update color:
```css
body {
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 1.125rem;
  background: var(--color-white);
  color: var(--color-ink-black); /* Changed from #222222 */
  margin: 0;
  padding: 0;
}
```

**Step 2: Update heading colors**

Add to h1, h2, h3, h4 block:
```css
h1, h2, h3, h4 {
  font-family: "Space Grotesk", system-ui, -apple-system, sans-serif;
  line-height: 1.2;
  color: var(--color-ink-black);
}

h1 {
  font-size: 2.75rem;
  font-weight: 700;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  color: var(--color-electric-blue); /* H1 gets brand color */
}

h2 {
  font-size: 2rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-electric-blue); /* H2 gets brand color */
}
```

**Step 3: Update link colors**

Find navigation link styles (~line 80-86) and update:
```css
nav a {
  color: var(--color-electric-blue); /* Changed from #004b8d */
  text-decoration: none;
}
nav a:hover {
  text-decoration: underline;
  color: var(--color-hot-pink); /* Changed from #003366 */
}
```

Also update general links (find around line 316-318):
```css
a {
  color: var(--color-electric-blue);
}
a:hover {
  color: var(--color-hot-pink);
}
```

**Step 4: Verify in browser**

Check that headings are Electric Blue, links are Electric Blue (hover Pink).

**Step 5: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: apply synthwave colors to base elements

- Body text: Ink Black
- H1/H2 headings: Electric Blue
- H3/H4: Ink Black
- Links: Electric Blue (Hot Pink on hover)

Creates bold, distinctive visual identity."
```

---

## Task 6: Component Redesign - Example Boxes

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:87-93` (.example styles)

**Step 1: Update .example styles**

Find .example styles (~line 87-93), replace with:
```css
.example, .gm {
  padding: 1.25rem; /* Increased from 0.75rem */
  margin: 2rem 0; /* Increased from 1rem */
  font-size: 0.95rem;
}

.example {
  border-left: 4px solid var(--color-electric-blue); /* Changed width and color */
  background: var(--color-light-blue); /* Changed from #f7fbff */
}
```

**Step 2: Verify in browser**

Find an example box in the HTML, verify it has light blue background with electric blue left border.

**Step 3: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: redesign example boxes with synthwave aesthetics

- Light blue background (#E5FAFF)
- Electric blue 4px left border
- Increased padding and margins for breathing room

Modern, distinctive callout style."
```

---

## Task 7: Component Redesign - GM Boxes

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:94-97` (.gm styles)

**Step 1: Update .gm styles**

Find .gm styles (~line 94-97), replace with:
```css
.gm {
  border-left: 4px solid var(--color-hot-pink); /* Changed width and color */
  background: var(--color-light-pink); /* Changed from #fff8f2 */
}
```

**Step 2: Verify in browser**

Find a GM advice box, verify light pink background with hot pink border.

**Step 3: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: redesign GM boxes with hot pink accent

- Light pink background (#FFE5F3)
- Hot pink 4px left border
- Contrasts with electric blue example boxes

Clear visual distinction for GM-specific content."
```

---

## Task 8: Component Redesign - Sheet Blocks

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:98-103` (.sheet-block styles)

**Step 1: Update .sheet-block styles**

Find .sheet-block styles (~line 98-103), replace with:
```css
.sheet-block {
  border: 2px solid var(--color-electric-blue); /* Changed from 1px #cccccc */
  border-radius: 4px; /* NEW: modern rounded corners */
  padding: 1.5rem 1.25rem; /* Increased from 1rem 1.25rem */
  margin: 2rem 0; /* Increased from 1.5rem */
  background: var(--color-white);
  page-break-inside: avoid; /* CRITICAL: prevent splitting across pages */
}
```

**Step 2: Verify in browser**

Find a sheet block, verify electric blue border with rounded corners.

**Step 3: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: redesign sheet blocks with modern styling

- Electric blue 2px border with 4px rounded corners
- Increased padding for better spacing
- Added page-break-inside: avoid (critical for print)

Modern look while solving print page-break issues."
```

---

## Task 9: Component Redesign - Tables

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:104-125` (table styles)

**Step 1: Update table styles**

Find table styles (~line 104-125), replace with:
```css
table {
  border-collapse: collapse;
  width: 100%;
  margin: 2rem 0; /* Increased from 1.5rem */
  font-size: 0.95rem;
  page-break-inside: avoid; /* Prevent table splits */
}
th, td {
  border: 1px solid var(--color-border-gray); /* Changed from #cccccc */
  padding: 0.5rem 0.8rem; /* Increased from 0.4rem 0.6rem */
  text-align: left;
}
thead th {
  background: var(--color-electric-blue); /* Changed from #f0f0f0 */
  color: var(--color-white); /* NEW: white text on blue */
  font-weight: 600;
}
tbody tr:nth-child(even) {
  background: var(--color-light-blue); /* Changed from #fafafa */
}
tbody tr:nth-child(odd) {
  background: var(--color-white);
}
tbody tr:hover {
  background: var(--color-light-blue); /* Slightly brighter on hover */
  filter: brightness(0.98);
}
caption {
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: left;
  color: var(--color-ink-black);
}
```

**Step 2: Verify in browser**

Find a table, verify electric blue headers with white text, light blue alternating rows.

**Step 3: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: redesign tables with synthwave styling

- Electric blue headers with white text
- Light blue alternating rows
- Increased padding for readability
- Added page-break-inside: avoid
- Subtle hover effect

Bold, modern table design matching overall aesthetic."
```

---

## Task 10: Navigation Redesign

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:46-86` (nav styles)

**Step 1: Update navigation container**

Find nav styles (~line 46-55), update background and border:
```css
nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-white); /* Keep white */
  border-bottom: 2px solid var(--color-electric-blue); /* Changed from 1px #dddddd */
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 217, 255, 0.1); /* Subtle blue shadow */
  transition: box-shadow 0.3s ease;
}
```

**Step 2: Update TOC list styles**

Already updated link colors in Task 5, verify they're using:
```css
nav a {
  color: var(--color-electric-blue);
  text-decoration: none;
  font-weight: 500;
}
nav a:hover {
  text-decoration: underline;
  color: var(--color-hot-pink);
}
```

**Step 3: Verify sticky navigation in browser**

Scroll the page, verify nav sticks to top with blue border and shadow.

**Step 4: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: enhance navigation with synthwave styling

- Electric blue 2px bottom border
- Subtle blue-tinted shadow
- Electric Blue links (Hot Pink on hover)
- Clean, modern sticky navigation

Maintains usability while matching visual identity."
```

---

## Task 11: Layout & Spacing Refinements

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:16-24` (main and section spacing)

**Step 1: Update main container spacing**

Find main styles (~line 16-20), ensure proper spacing:
```css
main {
  max-width: 960px;
  margin: 0 auto;
  padding: 3rem 2rem 4rem; /* Increased from 2rem 1.5rem 4rem */
  line-height: 1.7;
}
```

**Step 2: Update section spacing**

Find section spacing (~line 22-24):
```css
header, section, article {
  margin-bottom: 3rem; /* Keep at 3rem for good rhythm */
}
```

**Step 3: Verify spacing in browser**

Check that content has generous breathing room, sections are well-separated.

**Step 4: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: refine layout spacing for better readability

- Increased main container horizontal padding
- Maintained 3rem section spacing
- Generous whitespace for modern aesthetic

Creates comfortable reading experience."
```

---

## Task 12: Print Stylesheet - Page Setup

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:486-500` (@media print section)

**Step 1: Update @page rules**

Find @page section (~line 486-491):
```css
@media print {
  /* Page Setup */
  @page {
    margin: 0.75in 0.5in; /* Tighter margins for more content */
    size: letter;
  }
```

**Step 2: Update body typography for print**

Find print body styles (~line 494-500):
```css
  /* Base Typography - Optimized for Print */
  body {
    font-family: "Inter", system-ui, -apple-system, sans-serif; /* Use same fonts */
    font-size: 11pt;
    line-height: 1.5;
    background: white;
    color: black;
  }

  main {
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
```

**Step 3: Update heading sizes for print**

Find print heading styles (~line 508-540):
```css
  /* Headings - Clear Hierarchy */
  h1, h2, h3, h4, h5, h6 {
    font-family: "Space Grotesk", system-ui, -apple-system, sans-serif; /* Match screen */
    color: black;
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  h1 {
    font-size: 20pt;
    margin-top: 0;
    margin-bottom: 12pt;
    color: #00D9FF; /* Keep Electric Blue for print - looks good */
  }

  h2 {
    font-size: 16pt;
    margin-top: 18pt;
    margin-bottom: 10pt;
    page-break-before: auto; /* Let sections flow naturally */
    color: #00D9FF; /* Keep Electric Blue */
  }

  h3 {
    font-size: 13pt;
    margin-top: 14pt;
    margin-bottom: 8pt;
  }

  h4 {
    font-size: 11pt;
    margin-top: 12pt;
    margin-bottom: 6pt;
    font-weight: bold;
  }
```

**Step 4: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: optimize print stylesheet page setup and typography

- Tighter margins (0.75in x 0.5in) for more content
- Maintain Google Fonts in print (Inter, Space Grotesk)
- Keep Electric Blue for H1/H2 in print (looks good, minimal ink)
- Proper font sizes for print readability (11pt base)

Ensures professional print/PDF output."
```

---

## Task 13: Print Stylesheet - Page Break Controls (CRITICAL)

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (print media query section)

**Step 1: Add page break controls for sheet blocks**

Add after the heading print styles (~line 541):
```css
  /* ===================================
     PAGE BREAK CONTROLS (CRITICAL)
     =================================== */

  /* Sheet blocks MUST stay on single pages */
  .sheet-block,
  .character-sheet,
  .reference-sheet {
    page-break-before: always; /* Always start new page */
    page-break-after: always;  /* Always end before next page */
    page-break-inside: avoid;  /* Never split across pages */
    break-inside: avoid; /* Modern browsers */
  }

  /* Tables must not split */
  table {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Example and GM boxes must not split */
  .example, .gm {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Keep headings with following content */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Allow natural breaks for sections */
  section {
    page-break-after: auto;
  }
```

**Step 2: Add full-page sheet class (optional enhancement)**

Add after the above:
```css
  /* Full-page sheets (forces exactly one page) */
  .full-page-sheet {
    height: 9.5in; /* Letter height (11in) minus margins (2 * 0.75in) */
    page-break-before: always;
    page-break-after: always;
    overflow: hidden; /* Clip if content too long */
    box-sizing: border-box;
  }
```

**Step 3: Test by generating PDF**

Use browser's Print to PDF function, verify:
- Sheet blocks start on new pages
- No sheet blocks split across pages
- Tables stay together
- Example/GM boxes don't split

**Step 4: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: add critical print page-break controls

FIXES:
- Character sheets stay on single pages (page-break-before/after: always)
- Sheet blocks never split (page-break-inside: avoid)
- Tables never split across pages
- Example/GM boxes stay together

Solves the primary print issues. Includes .full-page-sheet helper class
for exactly-one-page layouts."
```

---

## Task 14: Print Stylesheet - Color Handling & Element Hiding

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (print media query section)

**Step 1: Update component colors for print**

Add/update styles in print section (after table styles ~line 580):
```css
  /* Component Colors - Keep Synthwave Accents */
  .example {
    border-left: 4px solid #00D9FF; /* Keep Electric Blue */
    background: #E5FAFF; /* Keep light blue tint */
  }

  .gm {
    border-left: 4px solid #FF006E; /* Keep Hot Pink */
    background: #FFE5F3; /* Keep light pink tint */
  }

  .sheet-block {
    border: 2px solid #00D9FF; /* Keep Electric Blue border */
    background: white;
  }

  /* Table headers */
  thead th {
    background: #00D9FF; /* Keep Electric Blue header */
    color: white;
    -webkit-print-color-adjust: exact; /* Force color printing */
    print-color-adjust: exact;
  }

  tbody tr:nth-child(even) {
    background: #E5FAFF; /* Keep light blue rows */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
```

**Step 2: Hide interactive elements**

Find/update navigation hiding (~line 543-545):
```css
  /* Remove Interactive Elements */
  nav {
    display: none !important;
  }

  .skip-link {
    display: none !important;
  }
```

**Step 3: Remove visual effects**

Find/update (~line 547-549):
```css
  /* Remove Visual Effects */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
```

**Step 4: Test PDF generation**

Generate PDF, verify colors print correctly and navigation is hidden.

**Step 5: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: optimize print colors and hide interactive elements

- Keep synthwave colors in print (Electric Blue, Hot Pink)
- Force color printing for headers and accents
- Hide navigation and skip links in print
- Remove shadows for clean print output

Print-friendly while maintaining visual identity."
```

---

## Task 15: Accessibility - Focus States

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:457-464` (focus styles)

**Step 1: Update focus state for navigation links**

Find nav focus styles (~line 457-463):
```css
/* Focus within navigation */
nav a:focus {
  outline: 3px solid var(--color-electric-blue); /* Updated */
  outline-offset: 2px;
  background: var(--color-light-blue); /* Light blue background */
  border-radius: 3px;
  padding: 4px 8px;
  margin: -4px -8px;
}
```

**Step 2: Add general focus styles**

Add after nav focus styles:
```css
/* General focus states for all interactive elements */
a:focus,
button:focus,
input:focus,
select:focus,
textarea:focus {
  outline: 3px solid var(--color-electric-blue);
  outline-offset: 2px;
}

/* Alternative: Hot Pink focus for variety */
.gm a:focus {
  outline-color: var(--color-hot-pink);
}
```

**Step 3: Test keyboard navigation**

Use Tab key to navigate through links, verify visible electric blue focus rings.

**Step 4: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: enhance accessibility focus states

- Electric Blue 3px focus outlines on all interactive elements
- 2px offset for visibility
- Light blue background on nav link focus
- Alternative Hot Pink focus in GM sections

Strong, visible focus indicators for keyboard navigation."
```

---

## Task 16: Accessibility - Reduced Motion

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:465-481` (prefers-reduced-motion)

**Step 1: Update reduced motion media query**

Find reduced motion section (~line 466-481), ensure it's comprehensive:
```css
/* Accessibility: Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  nav {
    transition: none !important;
  }

  .skip-link {
    transition: none !important;
  }
}
```

**Step 2: Verify with browser DevTools**

Enable "Reduce motion" in browser settings (or DevTools), verify no animations.

**Step 3: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: ensure reduced motion support

- Disable all animations for users with motion sensitivity
- Remove transitions when prefers-reduced-motion is set
- Auto scroll behavior

Respects user accessibility preferences."
```

---

## Task 17: Responsive Refinements

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html:134-391` (responsive media queries)

**Step 1: Review mobile breakpoint**

Find mobile media query (~line 134-216), verify font sizes are reasonable.
Already set to:
- body: 16px
- H1: 1.75rem
- H2: 1.6rem

These are good. No changes needed.

**Step 2: Update mobile table handling**

In mobile section, ensure tables scroll:
```css
@media (max-width: 640px) {
  /* ... existing styles ... */

  /* Responsive tables - horizontal scroll */
  table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    font-size: 0.85rem;
  }

  /* Keep Electric Blue headers on mobile */
  thead th {
    background: var(--color-electric-blue);
    color: var(--color-white);
  }
}
```

**Step 3: Test responsive design**

Resize browser to mobile, tablet, desktop widths. Verify:
- Typography scales appropriately
- Colors remain consistent
- Tables scroll on mobile
- Navigation remains usable

**Step 4: Commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: verify responsive design with synthwave colors

- Ensured Electric Blue/Hot Pink colors persist across breakpoints
- Table scrolling works on mobile
- Typography scales appropriately
- Navigation remains functional

Responsive design maintains visual identity at all sizes."
```

---

## Task 18: Final Testing & Polish

**Files:**
- Modify: `books/core/v1/exports/html/core_rulebook.html` (any final tweaks)

**Step 1: Visual browser testing checklist**

Open `books/core/v1/exports/html/core_rulebook.html` in browser and verify:

- [ ] Fonts load correctly (Space Grotesk headers, Inter body)
- [ ] H1/H2 are Electric Blue, readable
- [ ] Example boxes: Light blue bg, Electric blue border
- [ ] GM boxes: Light pink bg, Hot pink border
- [ ] Tables: Electric blue headers, alternating light blue rows
- [ ] Navigation: Electric blue links, Hot pink hover
- [ ] All spacing looks generous and comfortable
- [ ] Mobile view: Typography scales, tables scroll
- [ ] Focus states: Visible electric blue outlines on Tab

**Step 2: PDF generation testing (CRITICAL)**

Use browser Print to PDF:

```
File → Print → Save as PDF
- Verify character sheets appear on single pages
- Verify .sheet-block elements don't split across pages
- Verify tables stay together
- Verify example/GM boxes don't split
- Verify colors render correctly (blue headers, pink/blue borders)
- Verify navigation is hidden in print
```

**Step 3: Accessibility testing**

- [ ] Zoom to 200%: Layout doesn't break
- [ ] Enable reduced motion: No animations
- [ ] Keyboard navigation: All links reachable, focus visible
- [ ] Color contrast: Run DevTools Lighthouse audit (should pass AA)

**Step 4: Make any final tweaks**

Based on testing, adjust:
- Spacing if anything feels cramped
- Colors if contrast is insufficient
- Print page breaks if sheets still splitting

**Step 5: Final commit**

```bash
git add books/core/v1/exports/html/core_rulebook.html
git commit -m "feat: final polish and verification

Completed comprehensive testing:
✅ Visual design in browser (all breakpoints)
✅ PDF generation (character sheets on single pages, no breaks)
✅ Accessibility (focus states, reduced motion, zoom, contrast)
✅ Typography hierarchy clear and readable
✅ Synthwave color identity distinctive and memorable

Core rulebook HTML visual polish complete.
Print-ready draft PDF with modern synthwave aesthetic."
```

---

## Task 19: Documentation & Wrap-up

**Files:**
- Create: `docs/plans/2025-11-18-core-rulebook-html-polish-completion-notes.md`

**Step 1: Document completion**

Create completion notes documenting:
- What was implemented
- Testing results (browser, PDF, accessibility)
- Any issues encountered
- Recommendations for future enhancements

**Step 2: Take screenshots**

Capture screenshots of:
- Desktop view (showing H1, example box, table)
- Mobile view
- PDF output (first page)

Save to `docs/screenshots/core-rulebook-html-polish/`

**Step 3: Commit documentation**

```bash
git add docs/plans/2025-11-18-core-rulebook-html-polish-completion-notes.md
git add docs/screenshots/core-rulebook-html-polish/
git commit -m "docs: add completion notes and screenshots for HTML polish

Documented implementation results, testing outcomes, and visual examples.
Project complete and ready for review."
```

**Step 4: Review completion**

Use @superpowers:finishing-a-development-branch to decide next steps (merge, PR, etc.)

---

## Success Criteria

- [ ] Character sheets render on single pages without splitting
- [ ] Sheet blocks (`.sheet-block`) never break across pages
- [ ] Tables never split across pages
- [ ] Example/GM boxes never split across pages
- [ ] Typography uses Space Grotesk (headings), Inter (body), JetBrains Mono (monospace)
- [ ] Color palette: Electric Blue (#00D9FF), Hot Pink (#FF006E) applied throughout
- [ ] H1/H2 headings use Electric Blue
- [ ] Example boxes: Light blue background, electric blue border
- [ ] GM boxes: Light pink background, hot pink border
- [ ] Tables: Electric blue headers with white text
- [ ] Navigation: Electric blue links, hot pink hover
- [ ] Print stylesheet maintains colors and hides navigation
- [ ] Accessibility: WCAG AA contrast, visible focus states, reduced motion support
- [ ] Responsive design works across all breakpoints
- [ ] PDF generation produces clean, professional output

---

## Estimated Time

- Tasks 1-6 (Setup, Typography, Colors, Basic Components): 60-90 minutes
- Tasks 7-11 (Component Details, Navigation, Layout): 45-60 minutes
- Tasks 12-14 (Print Optimization - CRITICAL): 45-60 minutes
- Tasks 15-17 (Accessibility, Responsive): 30-45 minutes
- Task 18 (Testing & Polish): 60-90 minutes
- Task 19 (Documentation): 15-30 minutes

**Total: 4-6 hours** (depending on testing iterations and refinements)

---

## Notes for Implementation

**Testing Strategy:**
- Browser: Open file after each task, visually inspect changes
- PDF: Generate PDF after print tasks (12-14) and final testing (18)
- Responsive: Use browser DevTools responsive mode
- Accessibility: Use keyboard navigation and DevTools Lighthouse

**Key Files:**
- Source: `books/core/v1/exports/html/core_rulebook.html`
- Design: `docs/plans/2025-11-18-core-rulebook-html-polish-design.md`
- Only modify CSS (lines 8-787 `<style>` block)
- HTML structure unchanged

**Print Testing Commands:**
- Chrome: `Cmd+P` → "Save as PDF"
- Firefox: `Cmd+P` → "Save to PDF"
- CLI (if using headless browser): `npm run generate-pdf` (if script exists)

**Commit Strategy:**
- Commit after each task (18-19 commits total)
- Use conventional commit format: `feat:`, `docs:`
- Include what changed and why in commit messages
