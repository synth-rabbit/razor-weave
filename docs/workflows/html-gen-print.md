# Print Design HTML Generation

Generate print-optimized HTML from markdown chapter sources. The output is designed for browser print/PDF export.

## Quick Start

```bash
# Build print-design HTML
pnpm html:print:build

# Copy to exports folder
pnpm html:print:promote
```

## Commands

### `pnpm html:print:build`

Generates `data/html/print-design/core-rulebook.html` from markdown chapters.

**Behavior:**
- Reads chapters from `books/core/v1/chapters/`
- Reads sheets from `books/core/v1/sheets/`
- Applies transforms (example blocks, GM boxes, semantic IDs)
- Generates TOC with 4-part structure
- Assembles content with print template
- Records build in database with source hashes

**Output:**
```json
{
  "success": true,
  "buildId": "build-...",
  "outputPath": "data/html/print-design/core-rulebook.html",
  "chapterCount": 30,
  "sheetCount": 9
}
```

### `pnpm html:print:list`

Lists recent print builds with timestamps and chapter counts.

### `pnpm html:print:diff <build-id>`

Shows which source files changed since a specific build.

### `pnpm html:print:promote`

Copies the built HTML to the exports folder:
- **Source:** `data/html/print-design/core-rulebook.html`
- **Target:** `books/core/v1/exports/html/core_rulebook.html`

## Workflow

### Making Chapter Changes

1. Edit markdown in `books/core/v1/chapters/`
2. Run `pnpm html:print:build`
3. Open `data/html/print-design/core-rulebook.html` in browser
4. Use Print Preview (Cmd+P) to verify formatting
5. Run `pnpm html:print:promote` when satisfied

### Generating PDF

1. Build and promote the HTML
2. Open `books/core/v1/exports/html/core_rulebook.html` in Chrome/Safari
3. Print to PDF (Cmd+P → Save as PDF)

**Note:** Firefox print optimization is in progress. Use Chrome/Safari for best results.

## File Locations

| Description | Path |
|-------------|------|
| Chapter sources | `books/core/v1/chapters/*.md` |
| Sheet sources | `books/core/v1/sheets/*.md` |
| Template | `src/tooling/html-gen/templates/print-design.html` |
| Build output | `data/html/print-design/core-rulebook.html` |
| Exports target | `books/core/v1/exports/html/core_rulebook.html` |
| Build database | `data/razorweave.db` |

## Print CSS

The print pipeline uses `print.css` media styles for:
- Page breaks at chapter/part boundaries
- Hidden navigation elements
- Print-friendly typography
- Form field fill lines (underscore sequences → styled spans)

### Fill Line Sizes

Underscore sequences in markdown are converted to styled form fields:

| Underscores | Class | Use Case |
|-------------|-------|----------|
| 3-8 | `fill-sm` | Names, short labels |
| 9-16 | `fill-md` | Phrases |
| 17-30 | `fill-lg` | Sentences |
| 31+ | `fill-full` | Full width paragraphs |

## Differences from Web Pipeline

| Aspect | Print | Web |
|--------|-------|-----|
| ID format | Semantic (no chapter prefix) | `ch-XX-slug` prefixed |
| Caching | No automatic skip | Hash-based skip |
| Template | Standalone HTML | Eleventy front matter |
| Target | Exports folder | Site pages folder |

## Troubleshooting

### Page breaks in wrong places

Check `print.css` for `page-break-before` and `page-break-after` rules. Add `page-break-inside: avoid` to elements that shouldn't split.

### Form fields not rendering

Ensure underscore sequences are at least 3 characters (`___`). Shorter sequences are not converted.

### Styles missing in PDF

Browser print dialogs may strip some CSS. Use "Background graphics" option in print settings to preserve colors and backgrounds.
