# Web Reader HTML Generator Design

**Date:** 2025-11-21
**Status:** Draft
**Output Type:** `web-reader`

## Overview

Generate a complete, interactive HTML document from markdown chapters that matches the structure and functionality of `src/site/src/pages/read.html`. This is one of two HTML generation workflows (the other being `print-design`).

## Architecture

**Data Flow:**

```
books/core/v1/chapters/*.md
books/core/v1/sheets/*.md
        ↓
   [Parse & Transform]  (unified/remark)
        ↓
   [Assemble with Template]
        ↓
data/html/web-reader/core-rulebook.html
        ↓
   [promote command]
        ↓
src/site/src/pages/read.html
```

**Key Components:**

1. **Markdown Parser** — Unified/remark ecosystem (shared with print workflow)
2. **Content Transformer** — Custom remark/rehype plugins for semantic IDs, example blocks, chapter wrappers
3. **TOC Generator** — Builds nested TOC structure from chapter/section headings
4. **Template Assembler** — Merges converted content into HTML shell with site chrome
5. **Build State Manager** — Tracks source hashes, build status in database
6. **CLI Interface** — Exposes `build`, `list`, `diff`, `promote` commands

**Output Location:** `data/html/web-reader/core-rulebook.html`

## Database Schema

Uses existing `data/project.db`. Tables shared with print workflow.

### `html_builds` — Track build runs

```sql
CREATE TABLE html_builds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_id TEXT UNIQUE NOT NULL,        -- 'build-<timestamp>'
  output_type TEXT NOT NULL,            -- 'web-reader' | 'print-design'
  book_path TEXT NOT NULL,              -- 'books/core/v1'
  output_path TEXT NOT NULL,            -- 'data/html/web-reader/core-rulebook.html'
  source_hash TEXT NOT NULL,            -- Combined hash of all source files
  created_at TEXT NOT NULL,             -- ISO timestamp
  status TEXT NOT NULL                  -- 'success' | 'failed'
);
```

### `html_build_sources` — Track source files per build

```sql
CREATE TABLE html_build_sources (
  build_id TEXT NOT NULL REFERENCES html_builds(build_id),
  file_path TEXT NOT NULL,              -- 'books/core/v1/chapters/01-welcome.md'
  content_hash TEXT NOT NULL,           -- SHA-256 of file content
  file_type TEXT NOT NULL,              -- 'chapter' | 'sheet'
  PRIMARY KEY (build_id, file_path)
);
```

**Key Queries:**

- List builds: `SELECT * FROM html_builds WHERE output_type = 'web-reader'`
- Diff sources: Compare `html_build_sources` between two `build_id` values
- Smart rebuild: Hash current sources, compare to latest build's `source_hash`

## Content Transformation

### Unified/Remark Pipeline

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import { remarkExampleBlocks } from './transforms/example-blocks.js';
import { remarkSemanticIds } from './transforms/semantic-ids.js';
import { rehypeWrapChapters } from './transforms/wrap-chapters.js';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)                    // Tables, strikethrough
  .use(remarkExampleBlocks)          // > **Example** → example block
  .use(remarkSemanticIds)            // Generate heading IDs
  .use(remarkRehype)
  .use(rehypeWrapChapters)           // Wrap in <section id="ch-XX">
  .use(rehypeStringify);
```

### Transformation Rules

| Input Pattern | Output HTML |
|---------------|-------------|
| `## 2. Core Concepts` | `<section id="ch-02-core-concepts"><h2 id="core-concepts-heading">2. Core Concepts</h2>` |
| `### Fiction First` | `<h3 id="core-concepts-fiction-first">Fiction First</h3>` |
| `> **Example**\n> Text...` | `<div class="example"><strong>Example</strong><p>Text...</p></div>` |
| Markdown table | `<table>` with standard markup |
| Part boundaries | `<section id="part-i-foundations" class="part-intro">` inserted |

### ID Generation Rules

- Chapter sections: `ch-{NN}-{slugified-title}` (e.g., `ch-02-core-concepts`)
- Subsections: `{chapter-slug}-{subsection-slug}` (e.g., `core-concepts-fiction-first`)
- Must match existing `read.html` patterns for JavaScript compatibility

## Sheets Handling (Chapter 27)

**Source:** `books/core/v1/sheets/` (9 files)

**Assembly Position:** Chapter 27 in the document

### Structure

```html
<section id="ch-27-reference-sheets">
  <h2 id="reference-sheets-heading">27. Reference Sheets</h2>

  <div class="sheet-block" id="character-sheet">
    <h3>27.1 Character Sheet</h3>
    <!-- Converted sheet content -->
  </div>

  <div class="sheet-block" id="advancement-tracker">
    <h3>27.2 Advancement Tracker</h3>
    <!-- Converted sheet content -->
  </div>

  <!-- ... remaining 7 sheets ... -->
</section>
```

### Sheet Order

1. Character Sheet
2. Advancement Tracker
3. Session Log
4. GM Session Prep
5. Campaign Fronts Sheet
6. NPC/VPC Profile
7. Reference: Tags & Conditions
8. Reference: Clocks Templates
9. Reference: DC Tiers

### Processing Differences

| Aspect | Chapters | Sheets |
|--------|----------|--------|
| Source | Single .md file | Multiple .md files assembled |
| Wrapper | `<section id="ch-XX">` | `<div class="sheet-block">` |
| Numbering | `## N. Title` | `### 27.N Title` (h3) |
| DB tracking | `file_type = 'chapter'` | `file_type = 'sheet'` |

## TOC Generation

### Part Boundaries

| Part | Chapters | Title |
|------|----------|-------|
| I | 1-13 | Foundations |
| II | 14-20 | Skills, Proficiencies, and Mechanical Reference |
| III | 21-26 | Game Master Section |
| IV | 27-30 | Reference Sheets, Glossary, and Index |

### Generated Structure

```html
<ul class="toc-root">
  <li>
    <a href="#part-i-foundations" accesskey="1">Part I: Foundations</a>
    <ul class="toc-list">
      <li><a href="#ch-01-welcome-to-the-game">1. Welcome to the Game</a></li>
      <li><a href="#ch-02-core-concepts">2. Core Concepts at a Glance</a></li>
      <!-- ... chapters 3-13 ... -->
    </ul>
  </li>
  <!-- Parts II, III, IV -->
</ul>
```

### Accesskeys

- Parts: `accesskey="1"` through `accesskey="4"`
- Glossary (ch 28): `accesskey="g"`
- Index (ch 29): `accesskey="i"`

## Template Assembly

### Template Location

`src/tooling/html-gen/templates/web-reader.html`

### Placeholders

| Placeholder | Filled With |
|-------------|-------------|
| `{{HEADER}}` | Kept as-is (site build fills this) |
| `{{TOC}}` | Generated TOC HTML |
| `{{CONTENT}}` | Assembled chapters + sheets |
| `{{FOOTER}}` | Kept as-is (site build fills this) |

### Assembly Order

1. Load template
2. Generate TOC from chapter headings
3. Inject TOC at `{{TOC}}`
4. Concatenate content: Part I intro + chapters 1-13 + Part II intro + chapters 14-20 + ...
5. Inject content at `{{CONTENT}}`
6. Write to `data/html/web-reader/core-rulebook.html`

## CLI Commands

### Package.json Scripts

```json
{
  "html:web:build": "tsx src/tooling/cli-commands/run.ts html web build",
  "html:web:list": "tsx src/tooling/cli-commands/run.ts html web list",
  "html:web:diff": "tsx src/tooling/cli-commands/run.ts html web diff",
  "html:web:promote": "tsx src/tooling/cli-commands/run.ts html web promote"
}
```

### Command Details

#### `html:web:build`

```bash
pnpm html:web:build [--force]
```

- Hashes all source files (chapters + sheets)
- Compares to latest build's `source_hash`
- If unchanged and no `--force`, skips with message
- If changed, runs full pipeline, writes output, records build in DB
- Returns: `{ build_id, output_path, status, chapter_count }`

#### `html:web:list`

```bash
pnpm html:web:list [--limit=10]
```

- Queries `html_builds WHERE output_type = 'web-reader'`
- Returns: Array of `{ build_id, created_at, status, source_hash }`

#### `html:web:diff <build_id>`

```bash
pnpm html:web:diff build-2025-11-21T14-30-00
```

- Compares current source file hashes to specified build
- Returns: `{ added: [], removed: [], changed: [] }` file paths

#### `html:web:promote`

```bash
pnpm html:web:promote [--build-id=<id>]
```

- Copies `data/html/web-reader/core-rulebook.html` to `src/site/src/pages/read.html`
- Defaults to latest successful build
- Returns: Confirmation with paths

## Directory Structure

```
src/tooling/
├── html-gen/                          # Shared between web & print
│   ├── index.ts                       # Exports
│   ├── transforms/                    # Remark/rehype plugins
│   │   ├── example-blocks.ts          # > **Example** → <div class="example">
│   │   ├── semantic-ids.ts            # Heading ID generation
│   │   ├── wrap-chapters.ts           # <section id="ch-XX"> wrappers
│   │   └── index.ts
│   ├── pipeline.ts                    # Unified processor setup
│   ├── toc-generator.ts               # Build TOC from headings
│   ├── assembler.ts                   # Combine content + template
│   ├── hasher.ts                      # File hashing utilities
│   └── templates/
│       └── web-reader.html            # Template shell
│
├── html-gen/web/                      # Web-reader specific
│   ├── index.ts
│   ├── build.ts                       # Build command logic
│   ├── list.ts                        # List command logic
│   ├── diff.ts                        # Diff command logic
│   ├── promote.ts                     # Promote command logic
│   └── web-reader.test.ts
│
├── cli-commands/
│   └── run.ts                         # Add html web subcommands

data/
├── html/
│   └── web-reader/
│       └── core-rulebook.html         # Generated output
```

## JavaScript Compatibility Requirements

The generated HTML must include these identifiers for `reader.js` to function:

| Element | Required Pattern |
|---------|-----------------|
| Chapter sections | `section[id^="ch-"]` or `header[id^="ch-"]` |
| Part sections | `section[id^="part-"]` |
| Headings | `h2[id]`, `h3[id]`, `h4[id]` with semantic IDs |
| TOC structure | `.toc-root`, `.toc-list` with `<a href="#ch-...">` |
| Content container | `.reader-content` |
| Progress bar | `.reading-progress-bar` |
| Quick jump modal | `#quickJumpModal`, `#quickJumpSearch`, `#quickJumpResults` |
| Breadcrumb | `.breadcrumb`, `#breadcrumb-current` |

## Implementation Phases

### Phase 1: Foundation (Database + Shared Utilities)

- Add `html_builds` and `html_build_sources` tables to schema
- Create `html-gen/hasher.ts` — file hashing utilities
- Create `html-gen/pipeline.ts` — base unified processor setup
- Add remark-gfm dependency

### Phase 2: Transforms (Shared Plugins)

- `transforms/semantic-ids.ts` — heading ID generation
- `transforms/example-blocks.ts` — example block conversion
- `transforms/wrap-chapters.ts` — section wrappers
- Unit tests for each transform

### Phase 3: Assembly (TOC + Template)

- `toc-generator.ts` — build nested TOC from chapter headings
- `assembler.ts` — merge TOC + content into template
- Extract template from current `read.html`
- Integration test: markdown to full HTML

### Phase 4: CLI Commands

- `html-gen/web/build.ts` — full build pipeline
- `html-gen/web/list.ts` — query build history
- `html-gen/web/diff.ts` — compare sources
- `html-gen/web/promote.ts` — copy to site
- Wire up in `run.ts`

### Phase 5: Sheets Refinement

- Generate Chapter 27 from sheets folder
- Review each sheet's HTML output
- Iterate until approved

### Phase 6: Validation & Polish

- End-to-end test: build and verify JavaScript works
- Compare generated output to current `read.html`
- Fix any discrepancies

## Success Criteria

1. `pnpm html:web:build` generates `data/html/web-reader/core-rulebook.html`
2. Generated HTML has identical structure to current `read.html`
3. All JavaScript functionality works (TOC highlighting, quick jump, bookmarks, reader mode)
4. `pnpm html:web:promote` successfully copies to `src/site/src/pages/read.html`
5. Build state tracked in database enables incremental builds and failure recovery
6. Sheets render correctly as Chapter 27
