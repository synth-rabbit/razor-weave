# Core Rulebook HTML Polish - Testing Checklist

**File:** `/Users/pandorz/Documents/razorweave/.worktrees/core-rulebook-html-polish/books/core/v1/exports/html/core_rulebook.html`

**Date:** 2025-11-18

**Status:** Ready for User Testing

---

## Overview

This checklist covers comprehensive testing of the synthwave-inspired visual redesign of the Core Rulebook HTML export. All CSS modifications have been implemented (Tasks 1-17). This document guides you through final verification before committing.

---

## 1. VISUAL BROWSER TESTING

### Open the File
```bash
# From the worktree directory
open books/core/v1/exports/html/core_rulebook.html
# OR
open /Users/pandorz/Documents/razorweave/.worktrees/core-rulebook-html-polish/books/core/v1/exports/html/core_rulebook.html
```

### Typography Verification

- [ ] **Google Fonts Load Correctly**
  - Open browser DevTools > Network tab
  - Verify fonts.googleapis.com requests succeed
  - Check that fonts display (not falling back to system fonts)

- [ ] **Heading Fonts: Space Grotesk**
  - Select an H1 heading
  - DevTools > Computed > font-family should show "Space Grotesk"
  - Font should look geometric, modern, slightly wide

- [ ] **Body Fonts: Inter**
  - Select a paragraph
  - DevTools > Computed > font-family should show "Inter"
  - Font should look clean, readable, slightly rounded

- [ ] **Base Font Size**
  - Body text should be 18px (1.125rem)
  - Line height should be 1.7 (comfortable reading)

### Color Verification

- [ ] **H1 Headings: Electric Blue (#00D9FF)**
  - All major section headings (e.g., "Core Principles", "Character Creation")
  - Should be bright cyan/electric blue
  - Should stand out clearly

- [ ] **H2 Headings: Electric Blue (#00D9FF)**
  - Subsection headings
  - Same electric blue as H1
  - Smaller size (2rem vs 2.75rem)

- [ ] **H3/H4 Headings: Ink Black (#1A1A1A)**
  - Should be dark gray/black
  - Clear hierarchy from H1/H2

- [ ] **Navigation Links**
  - Default state: Electric Blue
  - Hover state: Hot Pink (#FF006E)
  - Test by hovering over TOC links at top

### Component Verification

#### Example Boxes
- [ ] **Background: Light Blue (#E5FAFF)**
  - Soft, pale cyan tint
  - Easy to read black text on top

- [ ] **Border: 4px solid Electric Blue (left side)**
  - Thick blue bar on left edge
  - No border on other sides

- [ ] **Padding: 1.25rem**
  - Generous spacing inside the box
  - Text not cramped

- [ ] **Find an example box** (search for "Example" in page)
  - Located in "Core Principles" section
  - Verify colors match above

#### GM Boxes
- [ ] **Background: Light Pink (#FFE5F3)**
  - Soft, pale pink tint
  - Clearly different from example boxes

- [ ] **Border: 4px solid Hot Pink (left side)**
  - Thick pink bar on left edge

- [ ] **Find a GM box** (search for "GM Insight" or "GM Guidance")
  - Located throughout the document
  - Verify colors match above

#### Sheet Blocks
- [ ] **Border: 2px solid Electric Blue (all sides)**
  - Complete border around the block
  - Rounded corners (4px radius)

- [ ] **Background: White**
  - Clean white background

- [ ] **Find sheet blocks** (scroll to "Session Tools" section)
  - Character sheet layouts
  - Advancement tracker layouts
  - Verify styling matches above

#### Tables
- [ ] **Headers: Electric Blue background, White text**
  - First row of table
  - Bold white text on bright cyan

- [ ] **Alternating Rows: Light Blue / White**
  - Even rows: Light blue (#E5FAFF)
  - Odd rows: White

- [ ] **Hover Effect**
  - Hover over a table row
  - Should subtly brighten

- [ ] **Find tables** (search for "Attribute Spreads" or "Risk Assessment")
  - Verify styling matches above

### Navigation Verification

- [ ] **Sticky Navigation**
  - Scroll down the page
  - Navigation bar should stick to top of viewport
  - Should not disappear

- [ ] **Electric Blue Bottom Border (2px)**
  - Clear blue line under navigation

- [ ] **Subtle Blue Shadow**
  - Soft shadow with blue tint
  - Not harsh or distracting

- [ ] **Link Hover States**
  - Hover over any TOC link
  - Should turn Hot Pink
  - Should underline

### Spacing Verification

- [ ] **Main Container Padding**
  - Content should have generous white space on sides
  - Should be 3rem top, 2rem sides, 4rem bottom

- [ ] **Section Spacing**
  - Sections should be well-separated
  - 3rem margin between major sections

- [ ] **Component Spacing**
  - Example boxes, GM boxes, tables: 2rem top/bottom margin
  - Should not feel cramped

### Responsive Testing

#### Desktop (> 960px)
- [ ] **Full Layout**
  - Content centered with max-width 960px
  - Navigation displays horizontally

#### Tablet (640px - 960px)
- [ ] Resize browser to ~768px width
- [ ] Typography should remain readable
- [ ] Layout should adapt gracefully

#### Mobile (< 640px)
- [ ] Resize browser to ~375px width (iPhone size)
- [ ] **Font sizes reduced:**
  - Body: 16px
  - H1: 1.75rem
  - H2: 1.6rem
- [ ] **Main padding reduced:** 1rem sides
- [ ] **Tables scroll horizontally**
  - Try a wide table
  - Should scroll, not break layout

---

## 2. ACCESSIBILITY TESTING

### Focus States (CRITICAL)

- [ ] **Enable Keyboard Navigation**
  - Click in browser address bar
  - Press Tab key repeatedly
  - Should move through all navigation links

- [ ] **Visible Focus Indicators**
  - Each focused link should have:
    - 3px solid Electric Blue outline
    - 2px offset from element
    - Light blue background on nav links
  - Focus should be HIGHLY visible

- [ ] **Focus-Visible (Advanced)**
  - Click a link with mouse (should NOT show outline)
  - Tab to a link with keyboard (SHOULD show outline)
  - This prevents ugly outlines on mouse clicks

- [ ] **GM Section Focus Variant**
  - Tab to a link inside a GM box
  - Focus outline should be Hot Pink (not blue)

### Reduced Motion

- [ ] **Enable Reduced Motion**
  - macOS: System Preferences > Accessibility > Display > Reduce motion
  - Chrome DevTools: Cmd+Shift+P > "Emulate CSS prefers-reduced-motion"

- [ ] **Verify No Animations**
  - Scroll page
  - Hover over links
  - No transitions should occur (instant changes)

### Zoom Testing

- [ ] **Zoom to 200%**
  - Cmd/Ctrl + "+" to zoom
  - Layout should not break
  - Text should remain readable
  - No horizontal scroll (on desktop)

- [ ] **Zoom to 400%**
  - Extreme test
  - Should be usable (may have horizontal scroll)

### Color Contrast

- [ ] **Run Lighthouse Audit**
  - Open DevTools
  - Lighthouse tab
  - Generate report
  - Check Accessibility score
  - Should pass WCAG AA for contrast

- [ ] **Manual Spot Checks**
  - Electric Blue on white (H1/H2): Should pass
  - White on Electric Blue (table headers): Should pass
  - Black on Light Blue (example boxes): Should pass
  - Black on Light Pink (GM boxes): Should pass

---

## 3. PDF GENERATION TESTING (CRITICAL)

### Generate PDF

```bash
# Method 1: Browser Print Dialog
# Open the HTML file in Chrome or Firefox
# Press Cmd+P (Mac) or Ctrl+P (Windows)
# Destination: "Save as PDF"
# Settings:
#   - Paper size: Letter
#   - Margins: Default
#   - Background graphics: ENABLED (important for colors)
#   - Headers and footers: Disabled
# Save as: core_rulebook_test.pdf
```

### Critical Verification Items

#### Sheet Blocks on Single Pages (PRIMARY FIX)

- [ ] **Character Sheet Layouts**
  - Find "Core Character Sheet (Printable)" in PDF
  - Should start on a NEW page
  - Should NOT split across pages
  - Should end before next content starts on new page

- [ ] **Advancement Tracker**
  - Find "Advancement & Threads Tracker (Printable)"
  - Should be on a single page
  - No page break in middle

- [ ] **Session Log**
  - Find "Session Log (Printable)"
  - Should be on a single page

- [ ] **Count Total Sheet Blocks**
  - Search HTML for `class="sheet-block"`
  - Should find 3 instances
  - Each should be on its own page in PDF

#### Tables Stay Together

- [ ] **Attribute Spreads Table**
  - Find "Example Attribute Spreads and Archetypes" table
  - Should NOT split across pages
  - All rows visible on one page

- [ ] **Other Tables**
  - Check other tables throughout document
  - None should split mid-table
  - Headers may repeat on new page (OK)

#### Example & GM Boxes Don't Split

- [ ] **Example Boxes**
  - Find several example boxes
  - None should split across pages
  - Should stay together as a unit

- [ ] **GM Boxes**
  - Find several GM boxes
  - None should split across pages
  - Should stay together as a unit

#### Colors Render Correctly

- [ ] **H1/H2 Headings: Electric Blue**
  - Should print in blue (not black)
  - Minimal ink usage (not solid fill)

- [ ] **Table Headers: Electric Blue with White Text**
  - Should print in blue
  - White text should be readable

- [ ] **Example Boxes: Light Blue Background, Electric Blue Border**
  - Should have subtle blue tint
  - Left border should be blue

- [ ] **GM Boxes: Light Pink Background, Hot Pink Border**
  - Should have subtle pink tint
  - Left border should be pink

- [ ] **Alternating Table Rows: Light Blue**
  - Even rows should have light blue background

#### Navigation Hidden in Print

- [ ] **Table of Contents Bar**
  - Should NOT appear in PDF
  - First page should start with title/content
  - No sticky navigation visible

#### Typography in Print

- [ ] **Fonts**
  - Space Grotesk for headings (may fall back to sans-serif)
  - Inter for body (may fall back to sans-serif)
  - Should look clean and professional

- [ ] **Font Sizes**
  - H1: 20pt
  - H2: 16pt
  - H3: 13pt
  - Body: 11pt
  - Should be readable when printed

- [ ] **Line Spacing**
  - Line-height: 1.5 in print
  - Should not feel cramped

#### Page Margins

- [ ] **Margins: 0.75in (top/bottom) x 0.5in (left/right)**
  - Content should have good margins
  - Not too close to page edges
  - Not too much wasted space

#### Overall PDF Quality

- [ ] **Page Count**
  - Should be reasonable (not excessive)
  - Estimate: 60-80 pages (depends on content)

- [ ] **Professional Appearance**
  - Should look like a published RPG book
  - Clean, modern, distinctive
  - Synthwave aesthetic evident but not overwhelming

- [ ] **Print-Friendly**
  - Colors should work in color printing
  - Should be readable if printed B&W (test if possible)
  - No critical information lost in grayscale

---

## 4. CODE QUALITY CHECKS

### CSS Validation

- [ ] **Open CSS Validator**
  - Go to https://jigsaw.w3.org/css-validator/#validate_by_input
  - Copy CSS from `<style>` block (lines 13-850)
  - Paste and validate
  - Should have minimal errors (vendor prefixes OK)

### HTML Validation

- [ ] **Open HTML Validator**
  - Go to https://validator.w3.org/#validate_by_input
  - Copy entire HTML file content
  - Paste and validate
  - Should have no critical errors

### Browser Console

- [ ] **Open DevTools Console**
  - Should have no errors
  - Warnings about fonts are OK
  - No JavaScript errors (file doesn't use JS)

---

## 5. CROSS-BROWSER TESTING (Optional but Recommended)

### Chrome/Chromium
- [ ] Visual layout correct
- [ ] PDF generation works
- [ ] Focus states visible

### Firefox
- [ ] Visual layout correct
- [ ] PDF generation works
- [ ] Focus states visible
- [ ] Colors match Chrome

### Safari (macOS)
- [ ] Visual layout correct
- [ ] PDF generation works
- [ ] Focus states visible
- [ ] Colors match Chrome

---

## 6. ISSUES LOG

Use this section to document any issues found during testing:

### Visual Issues
```
Example:
- [ ] H1 font not loading in Firefox (fallback to system font)
- [ ] Table hover effect too subtle on Safari
```

_Document any issues here:_


### PDF Issues
```
Example:
- [ ] Character sheet splitting across pages (CRITICAL)
- [ ] Table colors not printing in Safari PDF
```

_Document any issues here:_


### Accessibility Issues
```
Example:
- [ ] Focus outline not visible on blue backgrounds
- [ ] Color contrast failure on [specific element]
```

_Document any issues here:_


---

## 7. FINAL SIGN-OFF

Once all checks are complete:

- [ ] **All visual elements render correctly**
- [ ] **All colors match design specification**
- [ ] **PDF generation works correctly**
- [ ] **Sheet blocks stay on single pages (CRITICAL FIX VERIFIED)**
- [ ] **Accessibility features work (focus, reduced motion, zoom)**
- [ ] **Responsive design works across breakpoints**
- [ ] **No critical issues found**

**Tested by:** _________________

**Date:** _________________

**Notes:**


---

## 8. NEXT STEPS AFTER TESTING

### If Testing Passes
1. Mark any minor issues for future enhancement
2. Commit the final tested version
3. Create completion documentation
4. Decide on merge/PR strategy

### If Critical Issues Found
1. Document issues clearly in section 6
2. Prioritize by severity
3. Create fix plan
4. Re-test after fixes

---

## Testing Commands Quick Reference

```bash
# Open HTML in default browser
open books/core/v1/exports/html/core_rulebook.html

# Generate PDF via command line (requires wkhtmltopdf)
wkhtmltopdf \
  --enable-local-file-access \
  --page-size Letter \
  --margin-top 0.75in \
  --margin-bottom 0.75in \
  --margin-left 0.5in \
  --margin-right 0.5in \
  books/core/v1/exports/html/core_rulebook.html \
  core_rulebook_test.pdf

# View git diff to see what changed
git diff main books/core/v1/exports/html/core_rulebook.html

# View commit history
git log --oneline
```

---

## Design Specification Reference

**Color Palette:**
- Electric Blue: `#00D9FF`
- Hot Pink: `#FF006E`
- Deep Purple: `#7B2CBF`
- Ink Black: `#1A1A1A`
- Light Blue: `#E5FAFF`
- Light Pink: `#FFE5F3`

**Typography:**
- Headings: Space Grotesk (500, 600, 700)
- Body: Inter (400, 500, 600)
- Monospace: JetBrains Mono (400, 500)

**Key Measurements:**
- Base font size: 1.125rem (18px)
- Line height: 1.7
- Main container: max-width 960px
- Component padding: 1.25rem - 1.5rem
- Component margins: 2rem vertical

---

**END OF CHECKLIST**
