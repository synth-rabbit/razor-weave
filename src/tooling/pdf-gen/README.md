# PDF Generation Pipeline

Generates print-ready PDFs of the Razorweave Core Rulebook from HTML chapter files.

## Quick Start

```bash
# Build the PDF
pnpm --filter @razorweave/tooling exec tsx src/tooling/pdf-gen/cli.ts build

# Output: data/pdfs/draft/core-rulebook.pdf
```

## Architecture

```
src/tooling/pdf-gen/
├── cli.ts              # Command-line interface
├── pipeline.ts         # Main orchestration (chapter ordering, bookmarks)
├── parser.ts           # HTML to structured data parsing
├── document.ts         # PDFKit document setup
├── types.ts            # TypeScript interfaces
├── graphics/
│   └── grid-background.ts  # Perspective grid, gradient stripes
├── renderers/
│   ├── cover.ts        # Cover page with artwork
│   ├── toc.ts          # Clickable table of contents
│   ├── chapter-opener.ts   # Chapter titles, part dividers
│   ├── text.ts         # Body text, headings, lists
│   ├── tables.ts       # Data tables
│   ├── callouts.ts     # Example boxes, tips, warnings
│   ├── sheets.ts       # Print-friendly reference sheets
│   └── page-furniture.ts   # Headers, footers, page numbers
└── utils/
    ├── colors.ts       # Brand color palette
    ├── fonts.ts        # Font registration
    └── layout.ts       # Page dimensions, margins
```

## Asset Locations

| Asset Type | Location |
|------------|----------|
| Source HTML | `data/html/web/*.html` |
| Cover artwork | `data/pdfs/assets/cover-artwork.png` |
| Part backgrounds | `data/pdfs/assets/part-{1-4}-background.png` |
| Corner decorations | `src/site/public/images/decorative/corner-*.png` |
| Logo | `src/site/public/images/logos/main-logo.svg` |
| Fonts | `src/site/public/fonts/` |
| Output | `data/pdfs/draft/core-rulebook.pdf` |

## Features

### Navigation
- **PDF Bookmarks**: Hierarchical outline with Cover, Parts, and Chapters
- **Clickable TOC**: Table of contents links to chapter destinations
- **Named Destinations**: `chapter-{n}`, `part-{I-IV}`, `cover`

### Visual Design
- Dark gradient backgrounds with perspective grid
- Corner decorations on chapter openers and reference sheets
- Half-page landscape artwork on part dividers
- Color-coded callout boxes (examples, tips, rules)

### Reference Sheets
- Each sheet renders on its own page(s)
- Print-friendly borders and frames
- Continuation headers for multi-page sheets
- Corner decorations rendered on top layer

## Pipeline Flow

1. **Parse HTML** (`parser.ts`)
   - Load chapter HTML files from `data/html/web/`
   - Extract structured content: headings, paragraphs, tables, callouts
   - Detect sheet-block elements for reference sheet handling
   - Clean text encoding (special characters)

2. **Render Document** (`pipeline.ts`)
   - Create PDFKit document with fonts
   - Render cover page with artwork
   - Generate TOC with clickable links
   - For each chapter:
     - Check for part divider (Parts I-IV)
     - Render chapter opener with named destination
     - Render content sections
     - Handle reference sheets separately
   - Add bookmarks to outline

3. **Output PDF** (`cli.ts`)
   - Write to `data/pdfs/draft/core-rulebook.pdf`
   - Report page count and file size

## Known Limitations

### PDFKit Gotchas
- **Gradient reuse**: Gradients cannot be reused across pages. Create fresh gradient objects for each page.
- **Character encoding**: Special characters (>=, <=, em-dash) need explicit replacement in `cleanTextContent()`.
- **SVG support**: Limited. Complex SVGs may not render correctly.

### Content Parsing
- **Inline formatting**: Word spacing around inline HTML tags requires special handling in `extractTextWithSpacing()`.
- **Tables**: Complex nested tables may need manual adjustment.

## Adding New Content Types

1. Define interface in `types.ts`
2. Add parsing logic in `parser.ts`
3. Create renderer in `renderers/`
4. Wire into `pipeline.ts`

## Testing

```bash
# Run unit tests
pnpm test:unit src/tooling/pdf-gen

# Manual verification
open data/pdfs/draft/core-rulebook.pdf
```

## Troubleshooting

**Characters showing as garbled text (Æ, etc.)**
- Check `cleanTextContent()` in `parser.ts` for character replacements

**Text overlapping corners**
- Increase Y offset after page breaks in multi-page content
- Ensure corners render after all content (z-order)

**Bookmarks not visible in Preview.app**
- View > Table of Contents (or Cmd+Opt+3)
- Verify `addNamedDestination()` is called before content
- Verify `outline.addItem()` includes `{ destination: 'name' }`
