# HTML Print-Design Pipeline Design

**Date**: 2025-11-21
**Status**: Draft
**Author**: Claude (with Panda Edwards)

## Purpose

Build pipeline to convert markdown chapters into styled HTML for:

1. Input to agentic review system
2. Input to PDF generation pipeline
3. Eventually replace `books/core/v1/exports/html/core_rulebook.html`

**Quality Goal**: Accuracy and professional design sufficient for a first-draft PDF.

---

## Architecture Overview

### Directory Structure

```
src/tooling/html-builder/
├── index.ts              # Public exports
├── builder.ts            # Main build orchestrator
├── parser.ts             # unified/remark markdown→AST
├── transforms/           # AST transformations
│   ├── examples.ts       # > **Example** → div.example
│   ├── gm-boxes.ts       # > **GM** → div.gm
│   ├── glossary-links.ts # Auto-link glossary terms
│   └── sheets.ts         # Sheet block handling
├── generators/
│   ├── toc.ts            # Table of contents from headings
│   └── index.ts          # Auto-generated index
├── templates/
│   └── print-design.html # Full template with embedded CSS
└── cli.ts                # CLI command handlers
```

### Data Flow

```
chapters/*.md + sheets/*.md
        ↓
   Parse (remark)
        ↓
   Transform AST (examples, gm, glossary, etc.)
        ↓
   Assemble chapters (1-26, sheets as 27, 28-30)
        ↓
   Generate TOC + Index
        ↓
   Inject into template
        ↓
   Validate structure
        ↓
   Write to data/html/print-design/core-rulebook.html
        ↓
   Record in database
```

---

## Markdown Parsing

### Library: unified/remark ecosystem

```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(customExampleTransform)
  .use(customGmTransform)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(markdown)
```

### Why unified/remark

- AST-first architecture — inspect/transform tree at any stage
- Validation layer available (remark-lint)
- Ecosystem interoperability (rehype for HTML, retext for prose)
- Better for complex transforms like glossary auto-linking

---

## Markdown Transformations

| Markdown Pattern | HTML Output | Notes |
|------------------|-------------|-------|
| `> **Example**` or `> **Example – Title**` | `<div class="example">` | Blue accent, torn-paper edges |
| `> **GM**` or `> **GM Guidance**` | `<div class="gm">` | Pink accent, torn-paper edges |
| Standard tables | `<table>` with alternating header colors | Blue/pink headers alternate |
| Sheet files from `/sheets` | `<div class="sheet-block">` | Page-break before, print-optimized |
| `## N. Title` | `<section id="ch-N-slug"><h2>` | Chapter wrapper with ID |
| `### Heading` | `<h3 id="slug">` | Auto-generated anchor IDs |
| Glossary terms (from Ch 28) | `<a href="#term" class="glossary-link">` | Auto-linked first occurrence per section |

### ID Generation

- `## 8. Actions, Checks, and Outcomes` → `id="ch-08-actions-checks-and-outcomes"`
- `### When to Roll` → `id="when-to-roll"`
- Slugify: lowercase, spaces → hyphens, strip special chars

---

## Content Assembly

### Assembly Order

```
1. Cover Page (from template)
2. Table of Contents (auto-generated)
3. Chapters 01-26 (from chapters/)
4. Chapter 27: Reference Sheets (from sheets/)
   - 27.1 Character Sheet
   - 27.2 Advancement Tracker
   - 27.3 Session Log
   - 27.4 GM Session Prep
   - 27.5 Campaign Fronts Sheet
   - 27.6 NPC/VPC Profile
   - 27.7 Reference: Tags & Conditions
   - 27.8 Reference: Clocks Templates
   - 27.9 Reference: DC Tiers
5. Chapter 28: Glossary (from chapters/)
6. Chapter 29: Index (auto-generated, replaces markdown)
7. Chapter 30: Inspirations and Acknowledgments (from chapters/)
```

### Sheets HTML Structure

```html
<section id="ch-27-reference-sheets">
  <h2>27. Reference Sheets</h2>

  <div class="sheet-block">
    <h3 id="character-sheet">27.1 Character Sheet</h3>
    <!-- Sheet content -->
  </div>

  <div class="sheet-block">
    <h3 id="advancement-tracker">27.2 Advancement Tracker</h3>
    <!-- Sheet content -->
  </div>

  <!-- ... remaining sheets ... -->
</section>
```

### Sheet Print Optimization

- Page-break before each `.sheet-block`
- Multi-page sheets handled via iterative refinement phase
- Each sheet approved individually for print quality

---

## Template Structure

**File**: `src/tooling/html-builder/templates/print-design.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{title}} - {{subtitle}}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    /* ~1000 lines of synthwave CSS from existing core_rulebook.html */
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="corner-decor top-left"></div>
    <div class="corner-decor top-right"></div>
    <div class="corner-decor bottom-left"></div>
    <div class="corner-decor bottom-right"></div>
    <div class="cover-content">
      <h1 class="cover-title">{{title}}</h1>
      <p class="cover-subtitle">{{subtitle}}</p>
      <p class="cover-author">{{author}}</p>
    </div>
  </div>

  <!-- Table of Contents -->
  <nav id="table-of-contents" aria-label="Table of Contents">
    <h2>Contents</h2>
    {{toc}}
  </nav>

  <!-- Main Content -->
  <main id="main-content" role="main" aria-label="{{subtitle}} Content">
    {{content}}
  </main>
</body>
</html>
```

### Placeholders

| Placeholder | Source |
|-------------|--------|
| `{{title}}` | "Razorweave" (hardcoded) |
| `{{subtitle}}` | "Core Rulebook" (hardcoded) |
| `{{author}}` | "Panda Edwards" (hardcoded) |
| `{{toc}}` | Auto-generated from chapter headings |
| `{{content}}` | Assembled chapter HTML |

---

## Output

### Location

```
data/html/print-design/core-rulebook.html
```

Single file per output type. Version history tracked in database, not filesystem.

### Promotion

`html:print:promote` copies approved build to:
```
books/core/v1/exports/html/core_rulebook.html
```

---

## Database Schema

**Database**: `data/project.db`

```sql
-- Track each build run
CREATE TABLE html_builds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_id TEXT UNIQUE NOT NULL,        -- 'build-<timestamp>'
  output_type TEXT NOT NULL,            -- 'print-design'
  book_path TEXT NOT NULL,              -- 'books/core/v1'
  output_path TEXT NOT NULL,            -- 'data/html/print-design/core-rulebook.html'
  source_hash TEXT NOT NULL,            -- Combined hash of all source files
  created_at TEXT NOT NULL,             -- ISO timestamp
  status TEXT NOT NULL                  -- 'success' | 'failed'
);

-- Track individual source files per build
CREATE TABLE html_build_sources (
  build_id TEXT NOT NULL REFERENCES html_builds(build_id),
  file_path TEXT NOT NULL,              -- 'books/core/v1/chapters/01-welcome.md'
  content_hash TEXT NOT NULL,           -- SHA-256 of file content
  file_type TEXT NOT NULL,              -- 'chapter' | 'sheet'
  PRIMARY KEY (build_id, file_path)
);

-- Indexes
CREATE INDEX idx_builds_output_type ON html_builds(output_type);
CREATE INDEX idx_sources_build_id ON html_build_sources(build_id);
```

### Use Cases

- `html:print:list` — query builds for history
- `html:print:diff <id>` — compare sources between builds
- Smart rebuilds — skip if `source_hash` unchanged
- Audit trail — know exactly what sources produced which output

---

## CLI Commands

```bash
pnpm html:print:build        # Build print-design HTML from markdown
pnpm html:print:list         # List previous print-design builds
pnpm html:print:diff <id>    # Show what changed since a build
pnpm html:print:promote      # Copy approved build to exports/
```

### Command Output

| Command | Output |
|---------|--------|
| `html:print:build` | JSON with build_id, output_path, status |
| `html:print:list` | JSON array of builds with timestamps, hashes |
| `html:print:diff <id>` | List of changed/added/removed files |
| `html:print:promote` | Confirmation message |

All commands output JSON by default for agent consumption.

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation error (fixable by editing sources) |
| 2 | System error (IO, database, etc.) |

---

## Validation & Error Handling

**Strategy**: Strict — fail the build with clear error messages.

### Validation Checks

| Check | Error Message |
|-------|---------------|
| Missing chapters | `Missing chapter file: books/core/v1/chapters/05-ways-to-play.md` |
| Chapter numbering gap | `Chapter gap detected: found 04, 06 but missing 05` |
| Malformed heading | `Invalid chapter heading in 08-actions.md:1 — expected "## N. Title"` |
| Broken table | `Malformed table in 15-skills.md:42 — row has 3 columns, header has 4` |
| Unrecognized blockquote | `Unknown blockquote pattern in 04-principles.md:25` |
| Missing sheet | `Missing sheet file: books/core/v1/sheets/core_rulebook_character_sheet.md` |
| Glossary term not found | `Glossary link target not found: "DC"` |

### Error Output Format

```json
{
  "success": false,
  "error": {
    "type": "validation",
    "code": "MISSING_CHAPTER",
    "message": "Missing chapter file: books/core/v1/chapters/05-ways-to-play.md",
    "file": "books/core/v1/chapters/05-ways-to-play.md",
    "suggestion": "Create the file or update chapter numbering"
  }
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure

- Set up `src/tooling/html-builder/` structure
- Database schema (migrations for `html_builds`, `html_build_sources`)
- Basic CLI wiring (`html:print:build`, `html:print:list`)

### Phase 2: Parsing & Transforms

- unified/remark pipeline setup
- Transform: `> **Example**` → `div.example`
- Transform: `> **GM**` → `div.gm`
- Heading ID generation

### Phase 3: Assembly

- Chapter ordering (01-26, sheets as 27, 28-30)
- Sheet integration with `div.sheet-block`
- TOC generation

### Phase 4: Template & Output

- Extract CSS from existing `core_rulebook.html` into template
- Placeholder injection (`{{toc}}`, `{{content}}`)
- Write to `data/html/print-design/core-rulebook.html`
- Database recording

### Phase 5: Advanced Features

- Glossary auto-linking (parse Ch 28, scan content)
- Index auto-generation (replace Ch 29)
- `html:print:diff` command
- `html:print:promote` command

### Phase 6: Sheet Refinement

- Iterate on each sheet for print quality
- Add break hints as needed
- Approve each sheet individually

---

## Open Questions

1. **Sheet ordering**: Current order based on filename — is this the desired final order?
2. **Glossary term matching**: Exact match only, or handle plurals/variants?
3. **Index depth**: Include h4 headings or just h2/h3?

---

## Next Steps

1. Compare with other HTML workflow plan
2. Identify shared infrastructure vs. workflow-specific work
3. Create detailed implementation plans with task breakdowns
