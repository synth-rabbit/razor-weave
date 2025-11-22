# Web Reader HTML Generation

Generate the web-reader HTML from markdown chapter sources. The output is used by the Eleventy site at `/read.html`.

## Quick Start

```bash
# Build web-reader HTML
pnpm html:web:build

# Force rebuild (ignore cache)
pnpm html:web:build --force

# Copy to Eleventy site
pnpm html:web:promote
```

## Commands

### `pnpm html:web:build [--force]`

Generates `data/html/web-reader/core-rulebook.html` from markdown chapters.

**Behavior:**
- Reads chapters from `books/core/v1/chapters/`
- Reads sheets from `books/core/v1/sheets/`
- Applies transforms (example blocks, GM boxes, web IDs)
- Generates TOC with 4-part structure
- Assembles content with template
- Records build in database with source hashes

**Caching:**
- Compares source file hashes against last build
- Skips rebuild if sources unchanged
- Use `--force` to bypass cache

**Output:**
```json
{
  "status": "success",
  "buildId": "build-2025-11-22T17-31-15-lfdohv",
  "outputPath": "data/html/web-reader/core-rulebook.html",
  "chapterCount": 30,
  "sheetCount": 9
}
```

### `pnpm html:web:list [--limit=N]`

Lists recent builds with timestamps and chapter counts.

```bash
pnpm html:web:list           # Last 10 builds
pnpm html:web:list --limit=5 # Last 5 builds
```

### `pnpm html:web:diff <build-id>`

Shows which source files changed since a specific build.

```bash
pnpm html:web:diff build-2025-11-22T17-31-15-lfdohv
```

### `pnpm html:web:promote`

Copies the built HTML to the Eleventy site:
- **Source:** `data/html/web-reader/core-rulebook.html`
- **Target:** `src/site/pages/read.html`

After promoting, the Eleventy dev server automatically rebuilds.

## Workflow

### Making Chapter Changes

1. Edit markdown in `books/core/v1/chapters/`
2. Run `pnpm html:web:build`
3. Run `pnpm html:web:promote`
4. Verify in dev server at `http://localhost:8080/read.html`

### Full Rebuild

```bash
pnpm html:web:build --force && pnpm html:web:promote
```

## File Locations

| Description | Path |
|-------------|------|
| Chapter sources | `books/core/v1/chapters/*.md` |
| Sheet sources | `books/core/v1/sheets/*.md` |
| Template | `src/tooling/html-gen/templates/web-reader.html` |
| Build output | `data/html/web-reader/core-rulebook.html` |
| Site target | `src/site/pages/read.html` |
| Build database | `data/razorweave.db` |

## Eleventy Integration

The web-reader template includes Eleventy front matter:

```yaml
---
permalink: /read.html
---
```

This ensures Eleventy outputs to `/read.html` rather than `/read/index.html`.

The template references site assets:
- `/styles/reader.css` - Reader-specific styles
- `/scripts/reader.js` - Reader JavaScript (TOC, bookmarks, keyboard shortcuts)
- `/styles/theme.css`, `/styles/components.css` - Shared site styles

## Troubleshooting

### Build shows "skipped"

Sources haven't changed since last build. Use `--force` to rebuild anyway.

### Missing chapter titles in TOC

The `extractTitle` function expects one of these header formats:
- `## N. Title` (standard h2)
- `# N. Title` (h1 with number-dot)
- `# Chapter N: Title` (h1 with "Chapter N:" prefix)

### Changes not appearing in dev server

1. Verify promote completed: check `src/site/pages/read.html` modification time
2. Eleventy should auto-rebuild on file change
3. Hard refresh browser (Cmd+Shift+R)
