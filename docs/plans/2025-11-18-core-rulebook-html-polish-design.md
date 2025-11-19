# Core Rulebook HTML Visual Polish - Design Document

**Date**: 2025-11-18
**Status**: Approved
**Branch**: `feature/core-rulebook-html-polish`

## Overview

Comprehensive visual redesign of `books/core/v1/exports/html/core_rulebook.html` to create a polished, modern, memorable draft PDF with distinctive synthwave-inspired aesthetics.

## Goals

1. **Professional Polish**: Enhanced typography, spacing, and visual hierarchy
2. **Readability & Scannability**: Better visual separation, improved navigation, clear content structure
3. **Visual Identity**: Bold, memorable synthwave-inspired design (Electric Blue + Hot Pink on light backgrounds)
4. **Print Optimization**: Fix page break issues, ensure character sheets stay on single pages, optimize for PDF generation
5. **Accessibility**: Maintain WCAG AA standards throughout

## Design System

### Typography

**Font Stack (Google Fonts)**:
- **Headings**: Space Grotesk (weights: 500, 600, 700)
- **Body**: Inter (weights: 400, 500, 600)
- **Monospace**: JetBrains Mono (weights: 400, 500)

**Hierarchy & Scale**:
- **H1**: 2.5-3rem, Bold (700), 3rem margin-top, 1.5rem margin-bottom
- **H2**: 2rem, Semibold (600), 2.5rem margin-top, 1rem margin-bottom
- **H3**: 1.4rem, Semibold (600), 2rem margin-top, 0.75rem margin-bottom
- **H4**: 1.1rem, Medium (500), 1.5rem margin-top, 0.5rem margin-bottom
- **Body**: 1.125rem (18px) base, 1.7 line-height
- **Small**: 0.9rem for captions and notes

**Spacing Rhythm**: All spacing based on 0.25rem (4px) increments for visual consistency.

### Color Palette

**Synthwave-Inspired Light Theme**:

**Core Colors**:
- **Electric Blue**: `#00D9FF` - Primary brand, major headings, links
- **Hot Pink**: `#FF006E` - Secondary accent, GM notes, emphasis
- **Deep Purple**: `#7B2CBF` - Optional tertiary for variety

**Neutrals**:
- **Background**: `#FFFFFF` (main) / `#FAFAFA` (subtle alternate)
- **Text**: `#1A1A1A` (near-black body text)
- **Medium Gray**: `#6B6B6B` (secondary text, captions)
- **Border Gray**: `#E0E0E0` (subtle borders)

**Tinted Backgrounds** (for boxes):
- **Light Blue**: `#E5FAFF` - Example boxes
- **Light Pink**: `#FFE5F3` - GM advice boxes
- **Light Purple**: `#F3E5FF` - Special callouts (if needed)

**Rationale**: Bold, memorable colors on light backgrounds ensure print-friendliness (minimal ink usage) while maintaining strong visual identity. High contrast ensures accessibility.

### Component Design

#### Example Boxes (`.example`)
- Background: Light Blue (`#E5FAFF`)
- Left border: 4px solid Electric Blue (`#00D9FF`)
- Padding: 1.25rem
- Font size: 0.95rem
- Optional: Subtle box shadow or glow effect on border

#### GM Advice Boxes (`.gm`)
- Background: Light Pink (`#FFE5F3`)
- Left border: 4px solid Hot Pink (`#FF006E`)
- Padding: 1.25rem
- Font size: 0.95rem
- Optional: Small "GM" label badge

#### Sheet Blocks (`.sheet-block`)
- Border: 2px solid Electric Blue (`#00D9FF`)
- Background: White or very subtle Light Blue
- Padding: 1.5rem
- Rounded corners: 4px (modern feel)
- **Critical**: `page-break-inside: avoid` to prevent splitting across pages

#### Tables
- **Header row**: Electric Blue background (`#00D9FF`) with white text
- **Border**: 1px solid Border Gray (`#E0E0E0`)
- **Alternating rows**: White / Light Blue (`#E5FAFF`)
- **Hover state**: Brighter Light Blue (screen only)
- **Print**: `page-break-inside: avoid`

#### Headings Styling
- **H1**: Electric Blue color
- **H2**: Electric Blue (or optional gradient Blue→Pink for extra boldness)
- **H3/H4**: Near-black with optional Hot Pink accent underline or left border

### Layout & Spacing

**Page Structure**:
- **Max width**: 960px (desktop)
- **Padding**: 3rem 2rem (desktop), scales down responsively
- **Content**: Centered with generous side margins

**Vertical Rhythm**:
- Base unit: 0.25rem (4px)
- Section spacing: 3rem between major sections
- Paragraph spacing: 1.25rem
- Component spacing: 2rem top/bottom for boxes and tables

**Responsive Breakpoints**:
- Small mobile: < 480px
- Mobile: 480px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+
- Large desktop: 1440px+

**Navigation** (sticky TOC):
- Sticky header at top
- Background: White with subtle border
- Padding: 1rem 1.5rem
- Links: Electric Blue default, Hot Pink on hover
- Mobile: Collapses to vertical list or hamburger menu

### Print Stylesheet Optimization

**Critical Fixes**:

**Page Setup**:
```css
@page {
  size: letter;
  margin: 0.75in 0.5in;
}
```

**Prevent Page Breaks**:
- `.sheet-block`, `.character-sheet`, `.reference-sheet`:
  - `page-break-before: always` (start new page)
  - `page-break-after: always` (end before next page)
  - `page-break-inside: avoid` (never split)

- All headings: `page-break-after: avoid`
- Tables: `page-break-inside: avoid`
- `.example`, `.gm`: `page-break-inside: avoid`

**Typography for Print**:
- Body: 11pt
- Line height: 1.5
- H1: 20pt, H2: 16pt, H3: 13pt, H4: 11pt
- Fonts: Google Fonts embed properly in PDF

**Print-Specific**:
- Hide navigation: `nav { display: none; }`
- Remove shadows: `* { box-shadow: none !important; }`
- Optional: Show external link URLs

**Full-Page Sheets**:
```css
.full-page-sheet {
  height: 9.5in; /* Letter minus margins */
  page-break-before: always;
  page-break-after: always;
  overflow: hidden;
}
```

### Accessibility

**Color Contrast**:
- Electric Blue on white: AAA
- Hot Pink on white: AAA
- Near-black on white: AAA
- White on Electric Blue (headers): AA minimum

**Interactive Elements**:
- Visible focus rings: 3px Electric Blue or Hot Pink outline, 2px offset
- Never remove focus indicators
- Keyboard navigation support

**Semantic HTML**:
- Maintain `<nav>`, `<main>`, `<section>`, `<header>`
- ARIA labels where helpful
- Skip links for keyboard users

**Responsive to Preferences**:
- `@media (prefers-reduced-motion: reduce)`: Disable all animations/transitions
- All sizes in `rem` (respects user font size preferences)
- Zoomable to 200% without layout breaking

**Print Accessibility**:
- High contrast maintained
- No color-only information (use text labels/icons)
- Minimum 11pt font size

## Success Criteria

1. ✓ Character sheets render as single-page layouts without splitting
2. ✓ Sheet blocks (`.sheet-block`) never break across pages
3. ✓ Strong visual identity that's memorable and distinctive
4. ✓ Professional, polished appearance suitable for draft PDFs
5. ✓ Excellent readability and scannability
6. ✓ WCAG AA accessibility compliance
7. ✓ Print-friendly (reasonable ink usage, clean rendering)
8. ✓ Responsive design maintains quality across all screen sizes

## Implementation Notes

- HTML structure remains unchanged (semantic, well-formed)
- All changes are CSS-only (in `<style>` block)
- Google Fonts loaded via CDN in `<head>`
- Existing class names preserved (`.example`, `.gm`, `.sheet-block`, etc.)
- Print styles in `@media print` block
- Responsive styles in appropriate `@media` queries

## Files Modified

- `books/core/v1/exports/html/core_rulebook.html` (CSS section only)

## References

- Contemporary tabletop aesthetics (Blades in the Dark, Mothership)
- Synthwave color theory (bold accents on light backgrounds)
- WCAG 2.1 Level AA standards
- CSS Paged Media best practices
