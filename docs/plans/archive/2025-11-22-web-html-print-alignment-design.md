# Web HTML Generation Repair and Print Alignment Design

**Date:** 2025-11-22
**Status:** Approved
**Goal:** Align web HTML output with print design quality, focusing on print parity and sheet styling

## Problem Statement

The web reader at razorweave.com and the print HTML at `data/html/print-design/core-rulebook.html` have diverged in appearance. Key issues:

1. **Print parity failure:** When users press Cmd+P on the web reader, sheets do not start on new pages like they do in the print HTML output
2. **Visual divergence:** Sheet styling differs between print and web versions on screen
3. **Past regressions:** Previous attempts to merge styles broke interactive features or caused browser inconsistencies

## Goals

| Priority | Goal | Description |
|----------|------|-------------|
| Must-have | Print parity | Cmd+P from web produces same page breaks as print HTML (sheets on new pages) |
| Must-have | Sheet alignment | Sheets look identical between print and web when viewed on screen |
| Nice-to-have | Typography alignment | Full visual match for headings, body text, tables, lists |

## Constraints

- Cross-browser support required: Chrome, Safari, Firefox, mobile Chrome
- Interactive features must continue working (TOC, quick-jump, dark mode, progress bar)
- Solution must not regress existing functionality

## Approach: Extract Shared Base + Workflow Overrides

Create a shared stylesheet for sheet visual styles, plus a dedicated print stylesheet for print-only behavior. This addresses the root cause (style divergence) and prevents future drift.

### Alternatives Considered

| Approach | Description | Why Not Chosen |
|----------|-------------|----------------|
| Port print styles to web print stylesheet | Create print.css, manually sync sheet styles | Duplication leads to drift over time |
| Conditional CSS generation | Embed print CSS conditionally, use feature queries | Too complex, higher regression risk |

## Design

### File Structure

```
src/site/src/styles/
├── theme.css          # (existing) Color system, typography base
├── components.css     # (existing) Buttons, cards, nav
├── reader.css         # (existing) Reader layout - WILL BE MODIFIED
├── sheets.css         # (NEW) Shared sheet styles for screen display
├── print.css          # (NEW) Print-only rules
├── textures.css       # (existing)
└── animations.css     # (existing)
```

### Web Template Link Order

```html
<link rel="stylesheet" href="/styles/theme.css">
<link rel="stylesheet" href="/styles/components.css">
<link rel="stylesheet" href="/styles/reader.css">
<link rel="stylesheet" href="/styles/sheets.css">
<link rel="stylesheet" href="/styles/print.css" media="print">
```

### `sheets.css` Content (Shared Screen Styles)

Contains visual appearance of sheets identical between print and web on screen.

**Includes:**
- Sheet container structure (`.sheet-block`, `.sheet-header`, `.sheet-title`)
- Sheet grid layouts (`.sheet-grid`, `.sheet-row`, `.sheet-cell`)
- Fill lines (`.fill-line`, `.fill-sm`, `.fill-md`, `.fill-lg`, `.fill-full`)
- Sheet-specific typography (headings, tables, lists within sheets)
- Sheet section dividers and borders

**Excludes:**
- Page break rules (go in `print.css`)
- Screen-only interactive elements (stay in `reader.css`)
- Color definitions (stay in `theme.css`)

**Source of truth:** Extract from print HTML's embedded CSS since that's the target appearance.

### `print.css` Content (Print-Only Rules)

Contains rules that only apply when printing (Cmd+P).

```css
@media print {
  /* Page break control - the critical fix */
  .sheet-block {
    page-break-before: always;
    break-before: page;
  }

  /* First sheet shouldn't force break if first on page */
  .sheet-block:first-child {
    page-break-before: auto;
    break-before: auto;
  }

  /* Prevent breaks inside sheet content */
  .sheet-block {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Hide screen-only elements when printing */
  .reader-toc,
  .reading-progress,
  .quick-jump-modal,
  .dark-mode-toggle,
  nav {
    display: none;
  }

  /* Print-specific layout (full width, no sidebar) */
  .reader-container {
    display: block;
    max-width: 100%;
  }

  .reader-content {
    max-width: 100%;
    margin: 0;
  }
}
```

**Note:** Both `media="print"` attribute AND internal `@media print {}` wrapper provide defense-in-depth.

### `reader.css` Modifications

**Remove:**
- Sheet visual styles moving to `sheets.css` (`.sheet-block` appearance, fill lines, sheet typography)
- Any existing `@media print` rules moving to `print.css`

**Keep:**
- TOC sidebar layout and behavior
- Reader container grid layout (screen only)
- Interactive element styling (quick-jump, progress bar)
- Dark mode overrides for reader components
- Scroll behavior and positioning

**Result:** `reader.css` focuses on interactive reading experience only.

## Migration Strategy

### Step 1: Audit Current State
- Extract all sheet-related CSS from print HTML's embedded styles
- Extract all sheet-related CSS from web's `reader.css`
- Diff to identify divergences

### Step 2: Create `sheets.css`
- Start with print HTML's sheet styles as baseline
- Verify each rule works on screen
- Use CSS custom properties from `theme.css` for colors

### Step 3: Create `print.css`
- Extract page-break rules from print HTML
- Add rules to hide interactive elements
- Add layout adjustments for full-width printing

### Step 4: Clean Up `reader.css`
- Remove styles that moved to `sheets.css`
- Remove any `@media print` blocks that moved to `print.css`
- Verify no sheet styling remains duplicated

### Step 5: Update Web Template
- Add `<link>` for `sheets.css` (before reader.css or after, depending on specificity needs)
- Add `<link media="print">` for `print.css`

### Step 6: Verify
- Screen rendering matches print design
- Cmd+P shows sheets on new pages
- Interactive features still work
- Cross-browser check

## Testing & Verification Checklist

### Screen Rendering Tests
- [ ] Sheets visually match print design in Chrome
- [ ] Sheets visually match print design in Safari
- [ ] Sheets visually match print design in Firefox
- [ ] Sheets visually match print design in mobile Chrome
- [ ] Dark mode doesn't break sheet appearance
- [ ] TOC navigation still works
- [ ] Quick-jump modal still works
- [ ] Reading progress bar still works

### Print Preview Tests
- [ ] Each sheet starts on a new page
- [ ] Content doesn't break mid-element
- [ ] Navigation/interactive elements are hidden
- [ ] Layout uses full page width
- [ ] Cross-browser: Chrome print preview
- [ ] Cross-browser: Safari print preview
- [ ] Cross-browser: Firefox print preview

### Regression Tests
- [ ] Existing visual regression snapshots pass (or intentionally update)
- [ ] No console errors on page load
- [ ] All internal links (#anchors) still work
- [ ] Page weight hasn't increased significantly

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSS specificity conflicts | Sheet styles overridden by reader.css | Load sheets.css after reader.css, or use more specific selectors |
| Print page-break browser inconsistencies | Sheets don't break correctly in some browsers | Use both `page-break-before` and `break-before` for compatibility; test all three browsers |
| Print styles leaking to screen | Print rules affect screen display | Use both `media="print"` attribute AND `@media print {}` wrapper |
| Color variable scope issues | Colors don't resolve in print context | Ensure sheets.css uses theme.css variables; verify in print preview |
| Breaking changes during extraction | Rules accidentally dropped when moving between files | Diff before/after computed styles; visual regression tests |

## Success Criteria

1. Printing from web reader produces sheets on new pages (matching print HTML behavior)
2. Sheet appearance on screen matches print design
3. All interactive features continue working
4. Tests pass across Chrome, Safari, Firefox, mobile Chrome
5. No visual regressions in existing content
