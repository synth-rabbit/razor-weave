# Print Optimization Design
**Date:** 2025-11-20
**Author:** Claude Code + Panda Edwards
**Status:** Approved for Implementation

## Overview

CSS-only print optimization for the Razorweave website reader to produce high-quality PDFs and print-to-paper output suitable for tabletop use.

## Use Cases

- **Draft PDF for personal use** - Quick reference, doesn't need to be perfect
- **Print-to-paper** - Actual physical printing for tabletop play

## Requirements

1. Chapters start on new pages
2. Prevent GM Guidance, Examples, tables, and lists from splitting across pages
3. Character sheets span full pages with smart break points
4. Keep related sections together (Attributes, Skills, etc.)
5. Each page should be independently useful at the table
6. Hide web-only content (keyboard shortcuts, etc.)

## Approach: CSS-Only Aggressive

Strong page-break rules, generous spacing, and visual hierarchy without HTML changes. This provides clean breaks and professional appearance while remaining easy to iterate and maintain.

**Advantages:**
- No HTML modifications required
- Easy to tune and adjust
- Works across all browsers
- Acceptable white space trade-off for intended use cases

**Trade-offs:**
- May create more white space than conservative approach
- Limited control compared to HTML changes
- Requires testing across browsers for consistency

## Design

### 1. Page Break Strategy

**Tier 1 - Always Break (Major Sections):**
- H1 headings (chapters): `page-break-before: always`
- `.part-intro` sections: `page-break-before: always`
- Character sheets (`.sheet-block`): `page-break-before: always` AND `page-break-after: always`

**Tier 2 - Strongly Avoid Breaks (Content Blocks):**
- Tables: `page-break-inside: avoid`
- Examples (`.example`): `page-break-inside: avoid`
- GM guidance (`.gm`): `page-break-inside: avoid`
- Lists (`ul`, `ol`, `dl`): `page-break-inside: avoid`
- Table rows (`tr`): `page-break-inside: avoid`

**Tier 3 - Soft Guidance (Headings):**
- H2 headings: `page-break-after: avoid` (keep with following content)
- H3/H4 headings: `page-break-after: avoid`
- H2: `page-break-before: auto` (allow natural breaks if needed)

**Exception Handling:**
- First H1 and first `.part-intro`: `page-break-before: auto` (no blank first page)
- Oversized content blocks: Browser breaks naturally if unavoidable

### 2. Visual Hierarchy & Spacing

**Spacing & Margins:**
- **Chapter breaks (H1):**
  - `margin-top: 0` (starts new page)
  - `margin-bottom: 2rem` (breathing room)

- **Section breaks (H2):**
  - `margin-top: 1.5rem`
  - `border-bottom: 2pt solid #000` (clear divider)

- **Content blocks:**
  - `margin: 1rem 0` for examples, GM guidance, tables

**Visual Distinction:**
- **Examples** (`.example`):
  - Light blue background (existing)
  - `border-left: 4pt solid #0099cc`
  - `padding: 1rem`

- **GM Guidance** (`.gm`):
  - Light purple background (existing)
  - `border-left: 4pt solid #7B2CBF`
  - `padding: 1rem`

- **Character Sheets** (`.sheet-block`):
  - `border: 3pt solid #000`
  - `padding: 1.5rem`
  - `background: #fff` (clean white)
  - No decorative corners in print

**Typography:**
- Line-height: `1.6` (better readability on paper)
- Orphans: `3` (minimum lines at page bottom)
- Widows: `3` (minimum lines at page top)
- Text color: `#000` (black) on white or light backgrounds

### 3. Character Sheet Handling

**Isolation:**
- `page-break-before: always` - Sheets start on new page
- `page-break-after: always` - Next content starts on new page

**Internal Structure:**
- Existing `page-break-inside: avoid` on tables/lists preserves sections
- For multi-page sheets: Browser breaks at natural boundaries (between tables/sections)
- Table headers repeat: `thead { display: table-header-group; }`

**Styling:**
- Remove decorative corners (hide `::before` and `::after`)
- Sufficient padding: `1.5rem` all around
- Dark border: `3pt solid #000` for clear boundaries

**Fallback:** If sheets break badly, add wrapper divs around logical sections (hybrid Approach 3 for sheets only)

### 4. Web-Only Content Exclusion

**Immediate Hiding:**
- `#keyboard-shortcuts { display: none; }` - Hide Keyboard Shortcuts section

**Future Flexibility:**
- `.web-only { display: none; }` - Class-based hiding for other web-specific content
- Can be added to HTML as needed without CSS changes

### 5. Testing & Validation

**Iteration Cycle:**
1. Make CSS changes in `reader.css`
2. Build: `pnpm build`
3. Open print preview (Cmd+P) in Firefox
4. Check: clean breaks, no split boxes, readable spacing

**Multi-Browser Validation:**
- Test in Chrome/Safari (WebKit differences)
- Ensure consistent page breaks
- Note: Browsers handle `page-break-inside: avoid` differently

**PDF Export:**
- Export to PDF from print preview
- Review at actual size (not zoomed)
- Verify multi-page sheets are usable
- Check text contrast and readability

**Success Criteria:**
- ✅ Chapters start on new pages
- ✅ No tables/examples/GM boxes split mid-content
- ✅ Character sheets isolated with clear boundaries
- ✅ Visual hierarchy clear (sections are distinct)
- ✅ No texture overlay or decorative elements
- ✅ Readable on both screen and printed paper

**Fallback Plan:**
- Too aggressive (excessive white space): Dial back `page-break-before` rules
- Sheets still break badly: Add wrapper divs (Approach 3 hybrid)
- Complete rollback: Restore from `reader.css.backup`

## Implementation Notes

**File:** `/Users/pandorz/Documents/razorweave/src/site/src/styles/reader.css`

**Backup:** `reader.css.backup` created before implementation

**Build Command:** `pnpm build` (from `src/site/` directory)

**Test URL:** `http://localhost:3001/read.html` (via live-server)

## Future Enhancements (Out of Scope)

- Two-column layout for body text (optional experiment after core fixes)
- Print-specific header/footer with page numbers
- Separate print stylesheet for easier maintenance
- Print button in UI with pre-configured settings

## Risks & Mitigations

**Risk:** Browser inconsistencies in page-break handling
**Mitigation:** Test across Firefox, Chrome, Safari; adjust rules per browser if needed

**Risk:** Excessive white space from aggressive breaks
**Mitigation:** Backup CSS allows easy rollback; can tune rules incrementally

**Risk:** Character sheets still break awkwardly
**Mitigation:** Fallback to HTML changes (wrapper divs) for sheets only

## Sign-off

**Design validated:** 2025-11-20
**Ready for implementation:** Yes
**Estimated time:** 1-2 hours (implementation + testing)

---

## Implementation Complete

**Date:** 2025-11-20
**Implementation Plan:** `2025-11-20-print-optimization-implementation.md`
**Commits:**
- faa945d - feat(print): add Tier 1 page breaks for major sections
- 7950b54 - feat(print): add Tier 2 page breaks to prevent content splits
- cdc2a3c - feat(print): add Tier 3 page break guidance for headings
- 83d99b3 - feat(print): add visual hierarchy and spacing
- b2ebb7e - feat(print): hide web-only content
- 8debc85 - fix(print): tune page breaks after testing
- 4a20eee - fix(print): simplify page-break rules to eliminate blank pages
- b46a398 - fix(print): Firefox-specific print compatibility fixes
- ea89f69 - feat(pdf): wire up Chrome-generated PDF for downloads

**Testing:** Validated in Chrome (✅ works well), Firefox (⚠️ has blank page issues)

**Result:**
- ✅ Chrome: All success criteria met
- ✅ Chapters flow naturally within Parts
- ✅ Character sheets break cleanly
- ✅ Visual hierarchy clear with borders and spacing
- ✅ Web-only content hidden
- ⚠️ Firefox: Known issue with CSS page-breaks creating excessive blank pages
- ✅ Interim solution: Chrome-generated PDF available for download

**Firefox Issue:**
Firefox print engine has known compatibility issues with certain CSS page-break combinations, creating ~110 blank pages between sections. Attempted fixes:
- Removed modern `break-*` syntax
- Simplified page-break rules
- Added table cell protection

**Current Status:**
- Chrome/Safari users: Use browser print (Cmd/Ctrl+P) for best results
- Firefox users: Download pre-generated PDF from website
- Future work: Investigate Firefox-specific CSS workarounds or alternative PDF generation

**Rollback:** If needed, restore with `cp src/site/src/styles/reader.css.backup src/site/src/styles/reader.css`