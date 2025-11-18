# PDF Style Guide

Standards for PDF formatting and layout for Razorweave books.

## Purpose

This guide covers PDF-specific formatting for:
- Core rulebook PDFs
- Setting book PDFs
- Supplement PDFs
- Print-ready and digital distribution formats

## PDF Technical Requirements

### File Format

- **Format:** PDF/A-1b or PDF/X-4 for print
- **Version:** PDF 1.7 or higher
- **Compression:** Use lossless compression for text, lossy for images
- **Fonts:** Embed all fonts (subset embedding acceptable)
- **Color Space:** CMYK for print, RGB for digital-only

### Resolution

- **Text:** Vector-based (scalable)
- **Images:** Minimum 300 DPI for print, 150 DPI for digital
- **Cover art:** 400 DPI recommended
- **Diagrams:** Vector format when possible

### Accessibility

- **Tagged PDF:** All PDFs must be tagged for accessibility
- **Reading order:** Logical reading order for screen readers
- **Alt text:** All images must have descriptive alt text
- **Bookmarks:** Chapter and section bookmarks required
- **Text layer:** All text must be selectable/searchable

## Page Layout

### Page Size

- **Standard:** 8.5" x 11" (US Letter)
- **Alternative:** A4 (210mm x 297mm) for international
- **Orientation:** Portrait for books, landscape for reference sheets

### Margins

```
Top:    0.75 inch (54pt)
Bottom: 0.75 inch (54pt)
Inside: 1.00 inch (72pt) - extra for binding
Outside: 0.75 inch (54pt)
```

**Bleed:** 0.125 inch (9pt) on all sides for print editions

### Grid System

- **Columns:** 2-column layout for rules text
- **Gutter:** 0.25 inch (18pt) between columns
- **Baseline grid:** 12pt for consistent line spacing
- **Sidebars:** Full-width or single column

## Typography

### Fonts

**Body Text:**
- Font: Bookinsanity or similar serif
- Size: 10pt
- Leading: 12pt (1.2x)
- Tracking: 0
- Alignment: Justified with hyphenation

**Headings:**
- H1: 24pt bold, all caps
- H2: 18pt bold, title case
- H3: 14pt bold, title case
- H4: 12pt bold italic, sentence case

**Special Text:**
- Flavor text: 10pt italic serif
- Sidebar text: 9pt sans-serif
- Captions: 8pt italic
- Page numbers: 10pt centered or outer corner

### Text Formatting

- **Hyphenation:** Enabled for justified text
- **Widows/Orphans:** Prevent (minimum 2 lines)
- **Leading:** Consistent baseline grid
- **Kerning:** Optical kerning for headings
- **Ligatures:** Enable for body text

## Page Elements

### Headers and Footers

**Header (verso - left page):**
```
Chapter Name | Page Number
```

**Header (recto - right page):**
```
Page Number | Section Name
```

**First page of chapter:** No header, footer only

### Page Numbers

- **Position:** Outside corner (alternating left/right)
- **Format:** Arabic numerals (1, 2, 3...)
- **Front matter:** Roman numerals (i, ii, iii...)
- **Start:** Page 1 begins at Chapter 1

### Chapter Openers

- **First page:** Full-width title, no header
- **Artwork:** Optional full-width image below title
- **Drop cap:** First paragraph uses drop cap (optional)
- **White space:** Minimum 2 inches from top

### Tables

- **Grid lines:** Subtle horizontal lines only
- **Header row:** Bold, light background (#F5F5F5)
- **Zebra striping:** Alternate row backgrounds for readability
- **Cell padding:** 6pt vertical, 8pt horizontal
- **Font size:** 9pt for table content

### Sidebars and Callouts

**Sidebar box:**
- Background: Light gray (#F8F8F8)
- Border: 1pt solid gray (#CCCCCC)
- Padding: 12pt all sides
- Width: Single column or full width

**Example/Tip callouts:**
- Icon: Left-aligned icon (16pt x 16pt)
- Background: Tinted (#FFF9E6 for tips, #E6F3FF for examples)
- Border: None or subtle top/bottom rule

## Images and Graphics

### Placement

- **Figures:** Center-aligned, captioned below
- **Full-bleed:** Extend to bleed edge with 0.125" margin
- **Text wrap:** Minimum 12pt clearance around images
- **Inline icons:** Aligned to baseline, 12pt x 12pt

### Diagrams

- **Line weight:** Minimum 0.5pt for visibility
- **Labels:** 9pt sans-serif
- **Colors:** High contrast, colorblind-safe palette
- **Background:** White or transparent

### Tables and Charts

- **Consistency:** Use same style across all tables
- **Readability:** Clear hierarchy, adequate spacing
- **Color:** Grayscale for print compatibility

## Color Palette

### Print (CMYK)

**Primary:**
- Text: C0 M0 Y0 K100 (pure black)
- Headings: C0 M0 Y0 K100
- Background: C0 M0 Y0 K0 (white)

**Accent:**
- Dark gray: C0 M0 Y0 K70
- Light gray: C0 M0 Y0 K10
- Highlight: C20 M0 Y100 K0 (gold/yellow)

### Digital (RGB)

**Primary:**
- Text: #000000
- Headings: #1A1A1A
- Background: #FFFFFF

**Accent:**
- Dark gray: #4D4D4D
- Light gray: #E5E5E5
- Links: #0066CC (blue, underlined)

## Export Settings

### For Print

```
Format: PDF/X-4
Color: CMYK
Resolution: 300 DPI
Compression: ZIP for text, JPEG (quality 10) for images
Fonts: Embed all
Crop marks: Include
Bleed: 0.125 inch
```

### For Digital Distribution

```
Format: PDF 1.7
Color: RGB
Resolution: 150 DPI
Compression: Optimize for web
Fonts: Embed all (subset)
Hyperlinks: Enable
Bookmarks: Enable
Tags: Include for accessibility
File size: Optimize (target < 50MB)
```

### For Screen Reading

```
Format: Tagged PDF
Reflow: Enable
Text-to-speech: Enable
Logical structure: Required
Alt text: All images
Bookmarks: Full chapter/section tree
```

## File Naming

Pattern: `{book-name}-{version}-{format}.pdf`

Examples:
- `core-rulebook-v1.0-print.pdf`
- `core-rulebook-v1.0-digital.pdf`
- `starward-setting-v2.1-screen.pdf`

## Quality Checklist

Before publishing any PDF:

- [ ] All fonts embedded
- [ ] No font substitution warnings
- [ ] Images at correct resolution
- [ ] No low-resolution warnings
- [ ] Bookmarks created for all chapters
- [ ] Alt text added to all images
- [ ] Tagged for accessibility
- [ ] Links tested (digital version)
- [ ] Page numbers correct
- [ ] Headers/footers correct
- [ ] No widows or orphans
- [ ] Print bleed included (print version)
- [ ] File size optimized (digital version)
- [ ] Color space correct (CMYK/RGB)
- [ ] Proof-read in PDF viewer
- [ ] Tested with screen reader

## Tools

### Recommended Software

- **Adobe InDesign:** Professional layout
- **Affinity Publisher:** Alternative to InDesign
- **LaTeX with PDF output:** Programmatic layout
- **Pandoc with PDF templates:** Markdown to PDF conversion

### Preflight Tools

- **Adobe Acrobat Pro:** PDF/X validation
- **PDFlib TET:** Text extraction testing
- **CommonLook:** Accessibility validation
- **NVDA/JAWS:** Screen reader testing

## Related Guides

- [Writing Style Guide](./writing-style-guide.md) - Content standards
- [Docs Style Guide](../docs/README.md) - Documentation format
