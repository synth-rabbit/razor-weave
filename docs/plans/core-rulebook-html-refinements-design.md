# Core Rulebook HTML Refinements Design

**Date:** 2025-11-18
**Status:** Approved
**Context:** Refinements to initial HTML polish implementation based on critical user feedback

## Overview

This design addresses three critical issues identified in the initial HTML polish implementation:

1. **TOC Navigation UX** - Current sticky top navigation is ineffective, needs side navigation
2. **Color Balance** - Hot Pink secondary color is under-utilized
3. **Print Quality** - Print styles produce poor results with split borders and bad page breaks

Additionally incorporates new visual direction: rough page edges and subtle paper textures for professional quality feel.

## Design Principles

- **Professional and quality, even if simple** - No gimmicks, focus on polish
- **Print-first optimization** - PDF output is the primary deliverable
- **CSS-only modifications** - No HTML structure changes
- **Synthwave aesthetic** - Bold Electric Blue and Hot Pink palette

## 1. Navigation Architecture

### Fixed Sidebar TOC (Left Side)

Replace current sticky top navigation with a fixed left sidebar:

**Structure:**
- **Width:** 280px fixed
- **Position:** `position: fixed; left: 0; top: 0; height: 100vh;`
- **Content:** Full table of contents with nested h1/h2/h3 hierarchy
- **Scrolling:** Independent scroll if TOC height exceeds viewport
- **Main content:** Shifts right by 280px (`margin-left: 280px`)

**Visual Design:**
- Clean, minimal styling
- Generous padding (1.5rem)
- Subtle border-right separator

**Link Colors (Critical for Readability):**
- **Default links:** Deep Purple (#7B2CBF) or Ink Black (#1A1A1A) for contrast
- **Hover state:** Electric Blue (#00D9FF) for interactivity
- **Active/current section:** Hot Pink (#FF006E) to show position

**Rationale:** Electric Blue (#00D9FF) has poor contrast on white background. Using darker colors for default state with blue/pink as interactive accents maintains synthwave palette while ensuring readability.

**Print Behavior:**
- Sidebar completely hidden: `display: none;`
- Main content expands to full width: `margin-left: 0;`

## 2. Color System Updates

### Increased Hot Pink Usage

**Current Problem:** Hot Pink only appears in GM boxes, hover states, and minimal accents (~15% usage)

**Target:** 40% Hot Pink / 60% Electric Blue balance

### Specific Changes

**H3 Headings → Hot Pink:**
- Currently all headings use Electric Blue
- Shift H3 (and optionally H4) to Hot Pink (#FF006E)
- Creates visual hierarchy: H1/H2 = Electric Blue, H3/H4 = Hot Pink
- Improves section scanning with color-coded levels

**Additional Hot Pink Applications:**
- **Section dividers/horizontal rules** - Use Hot Pink for visual breaks
- **Table header alternates** - Some tables use Hot Pink headers
- **Callout accents** - High-priority callouts get Hot Pink treatment
- **Link hover states** - Keep existing (already working well)
- **GM boxes** - Keep existing borders (already working well)

**Balance Strategy:**
- Electric Blue remains primary brand color
- Hot Pink becomes co-equal rather than accent
- Prevents single-color dominance
- Maintains professional synthwave aesthetic

## 3. Visual Design: Rough Pages & Textures

### Rough Page Edges on Containers

**Key Visual Signature:** Torn/rough paper edges on content containers

**Implementation:**
- **CSS `clip-path` with irregular polygon points** for hand-torn edge effect
- Applied to: `.example`, `.gm`, `.sheet-block`, `table` containers
- **Asymmetric roughness** - each edge slightly different for organic feel
- **Subtle drop shadow** beneath rough edges for depth (e.g., `box-shadow: 0 2px 4px rgba(0,0,0,0.1)`)

**Example clip-path:**
```css
.example {
  clip-path: polygon(
    0% 2%, 3% 0%, 7% 1%, /* rough top edge */
    93% 0%, 97% 1%, 100% 2%, /* rough top-right */
    100% 98%, 97% 100%, 93% 99%, /* rough bottom-right */
    7% 100%, 3% 99%, 0% 98% /* rough bottom-left */
  );
}
```

**Variations:** Each container class gets slightly different polygon points for natural variety.

**Print Behavior:** Remove clip-path in print for clean edges.

### Subtle Paper Texture Background

**Body Background Texture:**
- Very fine paper grain overlay (~3-5% opacity)
- CSS noise filter or data URI pattern
- Barely perceptible - breaks up digital flatness without distraction

**Implementation Options:**
- **Data URI approach:** Inline SVG noise pattern
- **Filter approach:** `filter: url(#paper-texture)` with SVG filter

**Example:**
```css
body {
  background: var(--color-white);
  background-image: url('data:image/svg+xml,...'); /* paper noise */
  opacity: 0.05;
}
```

**Print Behavior:** Remove texture in print (`background-image: none`) to avoid artifacts.

## 4. Print Stylesheet Overhaul

### Critical Problem

Current print stylesheet causes:
- Borders splitting across pages (visual artifacts)
- Character sheets breaking mid-content (unusable)
- Excessive blank pages from aggressive `page-break-before/after: always`
- Poor overall print quality

### Solution: Remove Borders, Smart Page Breaks

**Remove All Borders in Print:**

```css
@media print {
  .example,
  .gm,
  .sheet-block,
  table {
    border: none !important;
    border-left: none !important;
    border-right: none !important;
    clip-path: none !important; /* remove rough edges */
  }
}
```

**Maintain Structure Without Borders:**
- **Generous padding** (1.5rem-2rem) creates visual separation
- **Subtle backgrounds** with `print-color-adjust: exact` maintain organization
- **Typography hierarchy** becomes primary organizational tool
- **Spacing** (margin-top/bottom) creates clear content blocks

### Smart Page-Break Strategy

**Character Sheets (Full-Page):**
```css
.character-sheet,
.reference-sheet,
.sheet-block.full-page {
  page-break-before: always;
  page-break-after: always;
  page-break-inside: avoid;
  break-inside: avoid;
}
```

**Sheet Blocks (Content):**
```css
.sheet-block {
  page-break-inside: avoid; /* keep together if possible */
  /* but allow breaking if content is too large */
}
```

**Tables:**
```css
table {
  page-break-inside: avoid; /* small tables stay together */
}

thead {
  display: table-header-group; /* repeat on each page if table breaks */
}
```

**Example/GM Boxes:**
```css
.example,
.gm {
  page-break-inside: avoid; /* prefer keeping together */
  /* but allow breaking for long examples */
}
```

### Clean Multi-Page Breaks

**Philosophy:** If content MUST span pages, it breaks naturally without visual artifacts.

- No borders = No split borders
- Padding and backgrounds create gentle separation
- Page breaks feel intentional, not accidental
- Content remains readable across page boundaries

### Color Preservation

```css
@media print {
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Keep functional backgrounds */
  .example { background: var(--color-light-blue); }
  .gm { background: var(--color-light-pink); }

  /* Keep text colors for hierarchy */
  h1, h2 { color: var(--color-electric-blue); }
  h3 { color: var(--color-hot-pink); }
}
```

## 5. Implementation Approach

### File Modifications

**Single File:** `/books/core/v1/exports/html/core_rulebook.html`

**Section:** `<style>` block (currently lines 13-850, ~838 lines of CSS)

**Changes:** CSS-only modifications, no HTML structure changes

### Implementation Order

1. **Navigation Restructure (High Impact)**
   - Convert `nav` to fixed left sidebar
   - Adjust main content `margin-left: 280px`
   - Update link colors for readability
   - Hide sidebar in print

2. **Color System Updates (Medium Impact)**
   - Update H3 color to Hot Pink in CSS custom properties
   - Add Hot Pink to section dividers, table headers, callouts
   - Verify color balance across components

3. **Rough Page Edges (Visual Enhancement)**
   - Create clip-path polygons for each container type
   - Add subtle drop shadows for depth
   - Test visual appearance on different screen sizes
   - Remove in print stylesheet

4. **Paper Texture Background (Visual Enhancement)**
   - Add subtle noise/grain to body background
   - Test opacity levels (3-5%)
   - Remove in print stylesheet

5. **Print Stylesheet Overhaul (CRITICAL)**
   - Remove all borders and rough edges
   - Implement smart page-break strategy
   - Add generous padding and spacing
   - Preserve colors with `print-color-adjust: exact`
   - Test extensively in print preview

### Key CSS Techniques

**CSS Custom Properties:**
```css
:root {
  --sidebar-width: 280px;
  --rough-edge-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

**Clip-Path for Rough Edges:**
```css
.example {
  clip-path: polygon(/* irregular points */);
}
```

**Paper Texture:**
```css
body {
  background-image: url('data:image/svg+xml,...');
}
```

**Comprehensive Print Rules:**
```css
@media print {
  /* Hide navigation */
  nav { display: none !important; }

  /* Remove decorative elements */
  .example, .gm, .sheet-block {
    border: none !important;
    clip-path: none !important;
  }

  /* Smart page breaks */
  .character-sheet {
    page-break-before: always;
    page-break-after: always;
  }
}
```

## Testing Strategy

### Critical Testing Points

**Print Preview Testing:**
- Chrome: Cmd+P → Preview
- Safari: Cmd+P → Preview
- Firefox: Cmd+P → Preview

**Character Sheet Verification:**
- Each character sheet prints as **single complete page**
- Usable as standalone printed page
- No borders splitting across pages
- Clean breaks if content must span pages

**PDF Export Testing:**
- Export from print preview to PDF
- Verify colors preserved
- Verify no border artifacts
- Verify page breaks are clean

**Navigation Testing:**
- Sidebar visible and scrollable on screen
- Sidebar completely hidden in print
- Links have readable contrast (Deep Purple/Ink Black default)
- Hover states work (Electric Blue)
- Active states work (Hot Pink)

**Visual Quality Testing:**
- Rough page edges look natural on screen
- Paper texture is subtle (not distracting)
- Color balance feels professional
- Hot Pink usage feels intentional (not overwhelming)

## Success Criteria

1. **TOC Navigation:** Fixed sidebar with readable link colors, hidden in print
2. **Color Balance:** Hot Pink usage increased to ~40% (H3 headings, dividers, accents)
3. **Visual Design:** Rough page edges and subtle paper texture create professional quality feel
4. **Print Quality:** Character sheets print as single pages, no split borders, clean multi-page breaks
5. **Professional Feel:** Simple but polished, suitable for draft PDF publication

## Constraints

- **CSS-only modifications** - No HTML structure changes
- **Single file edits** - All changes in `<style>` block of core_rulebook.html
- **Print-first** - PDF output is primary deliverable
- **Browser compatibility** - Must work in Chrome, Safari, Firefox print engines

## Future Considerations

- **Interactive TOC highlighting** - Could add scroll-spy behavior with JavaScript (out of scope for CSS-only)
- **Print optimization** - May need manual page-break hints for specific content sections
- **Accessibility** - Ensure color contrast meets WCAG 2.1 Level AA (already achieved with darker TOC links)
- **Responsive design** - If HTML is viewed on mobile, sidebar may need to collapse (future enhancement)
