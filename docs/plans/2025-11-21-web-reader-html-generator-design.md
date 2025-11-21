# Web Reader HTML Generator Design

**Date:** 2025-11-21
**Status:** Draft
**Output Type:** `web-reader`

## Overview

Generate a complete, interactive HTML document from markdown chapters that matches the structure and functionality of `src/site/src/pages/read.html`. This is one of two HTML generation workflows (the other being `print-design`).

## Source Files Inventory

### Chapter Files

**Location:** `books/core/v1/chapters/`
**Count:** 29 markdown files (chapters 01-26, 28-30; chapter 27 comes from sheets)

```
01-welcome-to-the-game.md
02-core-concepts.md
03-how-to-use-this-rulebook.md
04-core-principles-of-play.md
05-ways-to-play.md
06-character-creation.md
07-characters-and-attributes.md
08-actions-checks-outcomes.md
09-tags-conditions-clocks.md
10-combat-basics.md
11-exploration-social-play.md
12-downtime-recovery-advancement-overview.md
13-roleplaying-guidance-working-with-gm.md
14-skills-system-overview.md
15-skills-reference-by-attribute.md
16-proficiencies-system-overview.md
17-proficiencies-reference-by-domain.md
18-extended-tags-conditions-reference.md
19-advancement-long-term-growth.md
20-optional-variant-rules.md
21-running-sessions.md
22-running-campaigns.md
23-designing-scenarios-one-shots.md
24-npcs-vpcs-enemies.md
25-factions-fronts-world-pressure.md
26-alternative-play.md
28-glossary.md
29-index.md
30-inspirations-and-acknowledgments.md
```

### Sheet Files (Chapter 27)

**Location:** `books/core/v1/sheets/`
**Count:** 9 markdown files

```
core_rulebook_character_sheet.md
core_rulebook_advancement_tracker.md
core_rulebook_session_log.md
core_rulebook_gm_session_prep.md
core_rulebook_campaign_fronts_sheet.md
core_rulebook_npc_vpc_profile.md
core_rulebook_reference_tags_conditions.md
core_rulebook_reference_clocks_templates.md
core_rulebook_reference_dc_tiers.md
```

## Markdown Format Specification

### Chapter Heading Format

Each chapter starts with an H2 heading in this format:

```markdown
## 8. Actions, Checks, and Outcomes
```

Pattern: `## {number}. {title}`

### Subsection Headings

```markdown
### When to Roll (and When Not To)
```

Pattern: `### {title}` (H3 for major subsections, H4 for minor)

### Example Blocks

Two-line format with title:

```markdown
> **Example**
> **Example – When to Roll**
> *Trigger:* A character wants to leap between rooftops...
> *Assessment:* The outcome is uncertain...
> *Counter-example:* The same character crossing a sturdy bridge...
```

Must convert to:

```html
<div class="example">
  <strong>Example – When to Roll</strong>
  <p><em>Trigger:</em> A character wants to leap between rooftops...</p>
  <p><em>Assessment:</em> The outcome is uncertain...</p>
  <p><em>Counter-example:</em> The same character crossing a sturdy bridge...</p>
</div>
```

### GM Guidance Blocks

Similar format to examples:

```markdown
> **GM Guidance**
> **GM Guidance – Pace, Not Payment**
> Content here...
```

Must convert to:

```html
<div class="gm-guidance">
  <strong>GM Guidance – Pace, Not Payment</strong>
  <p>Content here...</p>
</div>
```

### Tables

Standard markdown tables:

```markdown
| Difficulty  | DC | Description                             |
| ----------- | -- | --------------------------------------- |
| Routine     | 12 | Basic tasks requiring minimal skill     |
| Challenging | 14 | Tasks requiring competence and focus    |
```

Convert to standard HTML `<table>` with proper structure.

### Lists

Both ordered and unordered lists are used. Some lists use bold labels:

```markdown
- **Uncertainty**: The outcome is not predetermined...
- **Consequence**: Failure or partial success would introduce tension...
```

## Target HTML Structure

Reference: `src/site/src/pages/read.html`

### Document Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Meta tags, fonts, stylesheets -->
</head>
<body>
  <div class="reading-progress">
    <div class="reading-progress-bar"></div>
  </div>

  {{HEADER}}

  <button class="toc-toggle">Table of Contents</button>

  <div class="quick-jump-modal" id="quickJumpModal">...</div>

  <div class="reader-container">
    <aside class="reader-toc">
      <h2>Table of Contents</h2>
      {{TOC}}
    </aside>

    <main class="reader-content">
      <nav class="breadcrumb">...</nav>
      {{CONTENT}}
    </main>
  </div>

  {{FOOTER}}

  <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0"></script>
  <script src="/scripts/reader.js"></script>
</body>
</html>
```

### Part Intro Section Structure

Each part has an intro section before its chapters:

```html
<section id="part-i-foundations" class="part-intro" aria-labelledby="part-i-heading">
  <h1 id="part-i-heading">Part I: Foundations</h1>
  <p>
    Part I introduces the core ideas of the game: what it is about, how to read and use this rulebook, and
    how to build characters who feel grounded in the world...
  </p>
  <p>
    By the end of Part I, you should understand how to create a character...
  </p>
</section>
```

### Chapter Section Structure

```html
<section id="ch-04-core-principles-of-play">
  <h2 id="core-principles-of-play-heading">4. Core Principles of Play</h2>

  <p>
    This chapter explains the principles that shape every session of the game...
  </p>

  <h3 id="core-principles-table-creative-team">The Table Is a Creative Team</h3>
  <p>
    Every player at the table is part of the creative process...
  </p>

  <div class="example">
    <strong>Example</strong>
    The GM describes a run down depot on the outskirts of a coastal town...
  </div>
</section>
```

### ID Generation Algorithm

**Chapter section IDs:**
- Input: `## 4. Core Principles of Play`
- Output: `id="ch-04-core-principles-of-play"`
- Algorithm: `ch-` + zero-padded chapter number + `-` + slugify(title)

**Chapter heading IDs:**
- Input: `## 4. Core Principles of Play`
- Output: `id="core-principles-of-play-heading"`
- Algorithm: slugify(title) + `-heading`

**Subsection IDs:**
- Input: `### The Table Is a Creative Team` (in chapter 4)
- Output: `id="core-principles-table-creative-team"`
- Algorithm: chapter-slug-prefix + `-` + slugify(subsection-title)
- Note: The prefix comes from the chapter title, not "ch-04"

**Slugify rules:**
- Lowercase
- Replace spaces with hyphens
- Remove special characters except hyphens
- Collapse multiple hyphens

## Part Structure (TOC Groupings)

The TOC groups chapters into 4 parts. This differs from the README's 6-part structure — use this 4-part structure to match `read.html`:

| Part | ID | Title | Chapters |
|------|-----|-------|----------|
| I | `part-i-foundations` | Foundations | 1-13 |
| II | `part-ii-skills-proficiencies` | Skills, Proficiencies, and Mechanical Reference | 14-20 |
| III | `part-iii-reference-and-gm` | Game Master Section | 21-26 |
| IV | `part-iv-glossary-index` | Reference Sheets, Glossary, and Index | 27-30 |

### Part Intro Text

Each part needs intro text. Extract from current `read.html` or generate based on chapter content.

**Part I intro:**
> Part I introduces the core ideas of the game: what it is about, how to read and use this rulebook, and how to build characters who feel grounded in the world. These chapters define Attributes, Actions, Checks, Tags, Conditions, Clocks, and the overall flow of play.
>
> By the end of Part I, you should understand how to create a character, how to resolve uncertainty at the table, how combat, exploration, and social scenes work, and how to collaborate with your group and GM to tell stories together.

(Similar intro text needed for Parts II, III, IV — extract from current read.html)

## TOC HTML Structure

```html
<ul class="toc-root">
  <li>
    <a href="#part-i-foundations" accesskey="1">Part I: Foundations</a>
    <ul class="toc-list">
      <li><a href="#ch-01-welcome-to-the-game">1. Welcome to the Game</a></li>
      <li><a href="#ch-02-core-concepts">2. Core Concepts at a Glance</a></li>
      <li><a href="#ch-03-how-to-use-this-rulebook">3. How to Use This Rulebook</a></li>
      <li><a href="#ch-04-core-principles-of-play">4. Core Principles of Play</a></li>
      <li><a href="#ch-05-ways-to-play">5. Ways to Play the Game</a></li>
      <li><a href="#ch-06-character-creation">6. Character Creation</a></li>
      <li><a href="#ch-07-characters-and-attributes">7. Characters and Attributes</a></li>
      <li><a href="#ch-08-actions-checks-outcomes">8. Actions, Checks, and Outcomes</a></li>
      <li><a href="#ch-09-tags-conditions-clocks">9. Tags, Conditions, and Clocks</a></li>
      <li><a href="#ch-10-combat-basics">10. Combat Basics</a></li>
      <li><a href="#ch-11-exploration-social-play">11. Exploration and Social Play</a></li>
      <li><a href="#ch-12-downtime-recovery-advancement-overview">12. Downtime, Recovery, and Advancement Overview</a></li>
      <li><a href="#ch-13-roleplaying-guidance-working-with-gm">13. Roleplaying Guidance and Working with the GM</a></li>
    </ul>
  </li>
  <li>
    <a href="#part-ii-skills-proficiencies" accesskey="2">Part II: Skills, Proficiencies, and Mechanical Reference</a>
    <ul class="toc-list">
      <li><a href="#ch-14-skills-system-overview">14. Skills System Overview</a></li>
      <li><a href="#ch-15-skills-reference-by-attribute">15. Skills Reference</a></li>
      <li><a href="#ch-16-proficiencies-system-overview">16. Proficiencies System Overview</a></li>
      <li><a href="#ch-17-proficiencies-reference-by-domain">17. Proficiencies Reference</a></li>
      <li><a href="#ch-18-extended-tags-conditions-reference">18. Extended Tags and Conditions Reference</a></li>
      <li><a href="#ch-19-advancement-long-term-growth">19. Advancement and Long Term Growth</a></li>
      <li><a href="#ch-20-optional-variant-rules">20. Optional and Variant Rules</a></li>
    </ul>
  </li>
  <li>
    <a href="#part-iii-reference-and-gm" accesskey="3">Part III: Game Master Section</a>
    <ul class="toc-list">
      <li><a href="#ch-21-running-sessions">21. Running Sessions</a></li>
      <li><a href="#ch-22-running-campaigns">22. Running Campaigns</a></li>
      <li><a href="#ch-23-designing-scenarios-one-shots">23. Designing Scenarios and One Shots</a></li>
      <li><a href="#ch-24-npcs-vpcs-enemies">24. NPCs, VPCs, and Enemies</a></li>
      <li><a href="#ch-25-factions-fronts-world-pressure">25. Factions, Fronts, and World Pressure</a></li>
      <li><a href="#ch-26-alternative-play">26. Alternative Play</a></li>
    </ul>
  </li>
  <li>
    <a href="#part-iv-glossary-index" accesskey="4">Part IV: Reference Sheets, Glossary, and Index</a>
    <ul class="toc-list">
      <li><a href="#ch-27-sheets-and-play-aids">27. Sheets and Play Aids</a></li>
      <li><a href="#ch-28-glossary" accesskey="g">28. Glossary</a></li>
      <li><a href="#ch-29-index" accesskey="i">29. Index</a></li>
      <li><a href="#ch-30-inspirations">30. Inspirations and Acknowledgments</a></li>
    </ul>
  </li>
</ul>
```

## Sheets Handling (Chapter 27)

### Sheet Assembly Order

| Order | Filename | Section Title |
|-------|----------|---------------|
| 27.1 | `core_rulebook_character_sheet.md` | Character Sheet |
| 27.2 | `core_rulebook_advancement_tracker.md` | Advancement Tracker |
| 27.3 | `core_rulebook_session_log.md` | Session Log |
| 27.4 | `core_rulebook_gm_session_prep.md` | GM Session Prep |
| 27.5 | `core_rulebook_campaign_fronts_sheet.md` | Campaign Fronts Sheet |
| 27.6 | `core_rulebook_npc_vpc_profile.md` | NPC/VPC Profile |
| 27.7 | `core_rulebook_reference_tags_conditions.md` | Reference: Tags & Conditions |
| 27.8 | `core_rulebook_reference_clocks_templates.md` | Reference: Clocks Templates |
| 27.9 | `core_rulebook_reference_dc_tiers.md` | Reference: DC Tiers |

### Sheet HTML Structure

```html
<section id="ch-27-sheets-and-play-aids">
  <h2 id="sheets-and-play-aids-heading">27. Sheets and Play Aids</h2>

  <div class="sheet-block" id="character-sheet">
    <h3>27.1 Character Sheet</h3>
    <!-- Converted content from core_rulebook_character_sheet.md -->
  </div>

  <div class="sheet-block" id="advancement-tracker">
    <h3>27.2 Advancement Tracker</h3>
    <!-- Converted content from core_rulebook_advancement_tracker.md -->
  </div>

  <!-- ... remaining 7 sheets ... -->
</section>
```

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

```sql
-- List builds for this output type
SELECT * FROM html_builds WHERE output_type = 'web-reader' ORDER BY created_at DESC;

-- Get sources for a specific build (for diff)
SELECT * FROM html_build_sources WHERE build_id = ?;

-- Check if rebuild needed (compare source_hash)
SELECT source_hash FROM html_builds
WHERE output_type = 'web-reader' AND status = 'success'
ORDER BY created_at DESC LIMIT 1;
```

## Content Transformation

### Unified/Remark Pipeline

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import { remarkExampleBlocks } from './transforms/example-blocks.js';
import { remarkGmGuidance } from './transforms/gm-guidance.js';
import { remarkSemanticIds } from './transforms/semantic-ids.js';
import { rehypeWrapChapters } from './transforms/wrap-chapters.js';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)                    // Tables, strikethrough
  .use(remarkExampleBlocks)          // > **Example** → <div class="example">
  .use(remarkGmGuidance)             // > **GM Guidance** → <div class="gm-guidance">
  .use(remarkSemanticIds)            // Generate heading IDs
  .use(remarkRehype)
  .use(rehypeWrapChapters)           // Wrap in <section id="ch-XX">
  .use(rehypeStringify);
```

### Transform Plugin Specifications

#### `example-blocks.ts`

**Input AST:** Blockquote starting with `**Example**`
**Output AST:** Custom node that becomes `<div class="example">`

Detection pattern:
```javascript
// Check if blockquote's first child is a paragraph
// containing a strong element with text "Example" or starting with "Example"
```

#### `gm-guidance.ts`

**Input AST:** Blockquote starting with `**GM Guidance**`
**Output AST:** Custom node that becomes `<div class="gm-guidance">`

#### `semantic-ids.ts`

**Input:** Heading nodes
**Output:** Same heading nodes with `id` property set

Must track current chapter context to generate subsection IDs correctly.

#### `wrap-chapters.ts`

**Input:** Converted HTML content
**Output:** Content wrapped in `<section id="ch-XX-...">` elements

Operates at rehype level after markdown conversion.

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
- Returns JSON: `{ build_id, output_path, status, chapter_count }`

#### `html:web:list`

```bash
pnpm html:web:list [--limit=10]
```

- Queries `html_builds WHERE output_type = 'web-reader'`
- Returns JSON array: `[{ build_id, created_at, status, source_hash }, ...]`

#### `html:web:diff <build_id>`

```bash
pnpm html:web:diff build-2025-11-21T14-30-00
```

- Compares current source file hashes to specified build
- Returns JSON: `{ added: [], removed: [], changed: [] }` (file paths)

#### `html:web:promote`

```bash
pnpm html:web:promote [--build-id=<id>]
```

- Copies `data/html/web-reader/core-rulebook.html` to `src/site/src/pages/read.html`
- Defaults to latest successful build
- Returns confirmation message with paths

## Directory Structure

```
src/tooling/
├── html-gen/                          # Shared between web & print
│   ├── index.ts                       # Exports
│   ├── transforms/                    # Remark/rehype plugins
│   │   ├── example-blocks.ts          # > **Example** → <div class="example">
│   │   ├── gm-guidance.ts             # > **GM Guidance** → <div class="gm-guidance">
│   │   ├── semantic-ids.ts            # Heading ID generation
│   │   ├── wrap-chapters.ts           # <section id="ch-XX"> wrappers
│   │   └── index.ts
│   ├── pipeline.ts                    # Unified processor setup
│   ├── toc-generator.ts               # Build TOC from headings
│   ├── assembler.ts                   # Combine content + template
│   ├── hasher.ts                      # File hashing utilities
│   ├── build-client.ts                # Database operations for html_builds
│   └── templates/
│       └── web-reader.html            # Template shell (extracted from read.html)
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

The generated HTML must include these identifiers for `src/site/src/scripts/reader.js` to function:

| Element | Required Pattern | Used By |
|---------|-----------------|---------|
| Chapter sections | `section[id^="ch-"]` or `header[id^="ch-"]` | Active section highlighting |
| Part sections | `section[id^="part-"]` | TOC navigation |
| H2 headings | `h2[id]` | Chapter navigation, bookmarking |
| H3 headings | `h3[id]` | Bookmarking, quick jump |
| H4 headings | `h4[id]` | Quick jump search |
| TOC root | `.toc-root` | TOC highlighting |
| TOC lists | `.toc-list` | TOC highlighting |
| TOC links | `a[href^="#ch-"]` or `a[href^="#part-"]` | Active link highlighting |
| Content container | `.reader-content` | Section detection, bookmarking |
| Progress bar | `.reading-progress-bar` | Reading progress |
| Quick jump modal | `#quickJumpModal` | Ctrl+K search |
| Quick jump search | `#quickJumpSearch` | Search input |
| Quick jump results | `#quickJumpResults` | Search results |
| Breadcrumb | `.breadcrumb` | Breadcrumb updates |
| Breadcrumb current | `#breadcrumb-current` | Current section display |

## Template Extraction Instructions

To create `templates/web-reader.html` from current `src/site/src/pages/read.html`:

1. Copy entire file
2. Replace TOC content (`<ul class="toc-root">...</ul>`) with `{{TOC}}`
3. Replace main content (everything inside `<main class="reader-content">` after breadcrumb) with `{{CONTENT}}`
4. Keep `{{HEADER}}` and `{{FOOTER}}` placeholders as-is
5. Keep all `<head>` content (meta, styles, fonts)
6. Keep all `<script>` tags
7. Keep quick-jump modal structure
8. Keep breadcrumb structure

## Implementation Phases

### Phase 1: Foundation (Database + Shared Utilities)

- Add `html_builds` and `html_build_sources` tables to `src/tooling/database/schema.ts`
- Create `html-gen/hasher.ts` — file hashing utilities (SHA-256)
- Create `html-gen/build-client.ts` — database operations
- Create `html-gen/pipeline.ts` — base unified processor setup
- Add npm dependencies: `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-stringify`

### Phase 2: Transforms (Shared Plugins)

- `transforms/semantic-ids.ts` — heading ID generation with chapter context tracking
- `transforms/example-blocks.ts` — detect and convert example blockquotes
- `transforms/gm-guidance.ts` — detect and convert GM guidance blockquotes
- `transforms/wrap-chapters.ts` — wrap converted content in section elements
- Unit tests for each transform with real markdown samples

### Phase 3: Assembly (TOC + Template)

- `toc-generator.ts` — build nested TOC from chapter headings, handle part groupings
- `assembler.ts` — merge TOC + content into template, handle part intros
- Extract template from current `read.html` → `templates/web-reader.html`
- Integration test: single chapter markdown → full HTML section

### Phase 4: CLI Commands

- `html-gen/web/build.ts` — full build pipeline with hash checking
- `html-gen/web/list.ts` — query and format build history
- `html-gen/web/diff.ts` — compare source hashes between builds
- `html-gen/web/promote.ts` — copy output to site location
- Wire up in `cli-commands/run.ts` under `html web` subcommand group
- Add package.json scripts

### Phase 5: Sheets Refinement

- Add sheet processing to build pipeline
- Generate Chapter 27 from sheets folder in correct order
- Review each sheet's HTML output in browser
- Iterate on problematic sheets until approved

### Phase 6: Validation & Polish

- End-to-end test: build and open in browser, verify all JavaScript works
- Compare generated output structure to current `read.html`
- Fix any ID mismatches or structural differences
- Test incremental build (change one chapter, verify only that rebuilds)

## Success Criteria

1. `pnpm html:web:build` generates `data/html/web-reader/core-rulebook.html`
2. Generated HTML has identical structure to current `read.html` (same IDs, classes, nesting)
3. All JavaScript functionality works:
   - TOC highlighting on scroll
   - Quick jump modal (Ctrl+K)
   - Bookmarking
   - Reader mode
   - Reading progress bar
   - Chapter navigation
4. `pnpm html:web:promote` successfully copies to `src/site/src/pages/read.html`
5. Build state tracked in database enables:
   - Skipping unchanged builds
   - Diffing between builds
   - Build history queries
6. Sheets render correctly as Chapter 27 with proper structure
7. Example and GM Guidance blocks render with correct classes

## Dependencies

**New npm packages needed:**

```json
{
  "unified": "^11.0.0",
  "remark-parse": "^11.0.0",
  "remark-gfm": "^4.0.0",
  "remark-rehype": "^11.0.0",
  "rehype-stringify": "^10.0.0"
}
```

**Existing packages used:**

- `better-sqlite3` (database)
- `crypto` (hashing)
- `fs/promises` (file operations)
