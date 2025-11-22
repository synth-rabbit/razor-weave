# PDF Generation

Generate print-ready PDFs from the print-design HTML using PDFKit. Produces a professional-quality PDF with navigation, bookmarks, and artwork.

## Quick Start

```bash
# First, build the print-design HTML
pnpm html:print:build

# Generate the PDF
pnpm pdf:build

# Output: data/pdfs/draft/core-rulebook.pdf
```

## Commands

### `pnpm pdf:build`

Generates `data/pdfs/draft/core-rulebook.pdf` from the print-design HTML.

**Behavior:**
- Reads `data/html/print-design/core-rulebook.html`
- Parses chapters, tables, callouts, and reference sheets
- Renders cover page with artwork
- Generates clickable table of contents
- Creates chapter opener pages with perspective grid
- Adds part dividers with half-page landscape artwork
- Renders reference sheets as print-friendly pages
- Adds PDF bookmarks for navigation
- Outputs PDF with embedded fonts

**Output:**
```
Building PDF...
  Input:  /path/to/data/html/print-design/core-rulebook.html
  Output: /path/to/data/pdfs/draft/core-rulebook.pdf

PDF generated successfully in 12.34s
  Size: 12.5 MB
```

### `pnpm pdf:build --quick`

Skips chapter opener pages for faster iteration during development.

## Workflow

### Full Build

1. Edit markdown chapters in `books/core/v1/chapters/`
2. Run `pnpm html:print:build` to generate HTML
3. Run `pnpm pdf:build` to generate PDF
4. Open `data/pdfs/draft/core-rulebook.pdf` to review

### Quick Iteration

When testing content changes (not visual design):

```bash
pnpm html:print:build && pnpm pdf:build --quick
```

### Adding Artwork

1. Place artwork in `data/pdfs/assets/`:
   - `cover-artwork.png` - Cover page background
   - `part-1-background.png` through `part-4-background.png` - Part dividers
2. Run `pnpm pdf:build`

## File Locations

| Description | Path |
|-------------|------|
| Input HTML | `data/html/print-design/core-rulebook.html` |
| Output PDF | `data/pdfs/draft/core-rulebook.pdf` |
| Cover artwork | `data/pdfs/assets/cover-artwork.png` |
| Part backgrounds | `data/pdfs/assets/part-{1-4}-background.png` |
| Corner decorations | `src/site/public/images/decorative/corner-*.png` |
| Logo | `src/site/public/images/logos/main-logo.svg` |
| Fonts | `src/site/public/fonts/` |
| Pipeline code | `src/tooling/pdf-gen/` |

## PDF Features

### Navigation
- **Bookmarks**: Hierarchical outline (Cover → Parts → Chapters)
- **Clickable TOC**: Table of contents links to chapter pages
- **Named destinations**: Internal linking support

### Visual Design
- Dark gradient backgrounds with perspective grid
- Corner decorations on chapter openers and reference sheets
- Half-page landscape artwork on part dividers
- Color-coded callout boxes (examples, tips, rules)

### Reference Sheets
- Each sheet on its own page(s)
- Print-friendly borders and frames
- Continuation headers for multi-page sheets
- Designed for standalone printing

## Architecture

```
src/tooling/pdf-gen/
├── cli.ts              # Command-line interface
├── pipeline.ts         # Main orchestration
├── parser.ts           # HTML → structured data
├── document.ts         # PDFKit setup
├── types.ts            # TypeScript interfaces
├── graphics/           # Grid backgrounds, stripes
├── renderers/          # Cover, TOC, chapters, sheets
└── utils/              # Colors, fonts, layout
```

## Troubleshooting

### "Input file not found"

Run `pnpm html:print:build` first to generate the HTML source.

### Garbled characters (Æ, etc.)

Special characters need explicit handling. Check `cleanTextContent()` in `parser.ts` for character replacements.

### Missing bookmarks in Preview.app

View → Table of Contents (Cmd+Opt+3) to show the sidebar with bookmarks.

### Artwork not appearing

Verify artwork files exist in `data/pdfs/assets/` with exact names:
- `cover-artwork.png`
- `part-1-background.png`, `part-2-background.png`, etc.

### Text overlapping corners

Multi-page content needs adequate top margin after page breaks. Check Y offset values in sheet and content renderers.

## Development

### Adding New Content Types

1. Define interface in `src/tooling/pdf-gen/types.ts`
2. Add parsing logic in `parser.ts`
3. Create renderer in `renderers/`
4. Wire into `pipeline.ts`

### Testing

```bash
# Run unit tests
pnpm test:unit src/tooling/pdf-gen

# Build and verify manually
pnpm pdf:build
open data/pdfs/draft/core-rulebook.pdf
```

### Known Limitations

- **Gradient reuse**: PDFKit gradients can't be reused across pages. Create fresh gradient objects per page.
- **SVG support**: Limited. Complex SVGs may not render correctly.
- **Tables**: Complex nested tables may need manual adjustment.
