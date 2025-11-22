# HTML Generation Architecture

Technical reference for contributors modifying the HTML generation pipelines.

## Overview

The `html-gen` system converts markdown chapters into HTML for two outputs:
- **web-reader**: Interactive reader at `/read.html` with TOC, bookmarks, and keyboard navigation
- **print-design**: Standalone HTML optimized for browser print/PDF export

Both pipelines share core infrastructure but have workflow-specific differences.

## Directory Structure

```
src/tooling/html-gen/
├── index.ts                  # Public exports
├── chapter-reader.ts         # Read markdown files from disk
├── hasher.ts                 # SHA-256 file hashing
├── build-client.ts           # Database operations for build tracking
├── toc-generator.ts          # Generate 4-part TOC structure
├── assembler.ts              # Combine chapters into document
├── template-renderer.ts      # Merge content with HTML templates
├── index-generator.ts        # (Future) Generate book index
├── pipeline.ts               # Shared pipeline utilities
├── transforms/
│   ├── index.ts              # Export all transforms
│   ├── example-blocks.ts     # Convert :::example to HTML
│   ├── gm-boxes.ts           # Convert :::gm-only to HTML
│   ├── semantic-ids.ts       # Generate IDs for print
│   └── web-ids.ts            # Generate ch-XX prefixed IDs for web
├── print/
│   ├── index.ts              # Print workflow exports
│   ├── build.ts              # Print build orchestrator
│   ├── list.ts               # List builds command
│   ├── diff.ts               # Diff builds command
│   └── promote.ts            # Copy to exports command
└── web/
    ├── index.ts              # Web workflow exports
    ├── build.ts              # Web build orchestrator
    ├── list.ts               # List builds command
    ├── diff.ts               # Diff builds command
    └── promote.ts            # Copy to site pages command
```

## Pipeline Stages

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Read     │ -> │  Transform  │ -> │  Assemble   │ -> │   Render    │ -> │   Output    │
│  Chapters   │    │  Markdown   │    │   Content   │    │  Template   │    │   Write     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 1. Read Chapters (`chapter-reader.ts`)

Reads markdown files from `books/core/v1/chapters/` and `sheets/`.

```typescript
interface ChapterFile {
  number: number;    // Chapter number (1-30)
  slug: string;      // Filename slug (e.g., "welcome-to-the-game")
  filePath: string;  // Absolute path
  content: string;   // Raw markdown content
}
```

### 2. Transform Markdown

Uses [unified](https://unifiedjs.com/) with remark/rehype plugins:

```typescript
unified()
  .use(remarkParse)              // Parse markdown
  .use(remarkFrontmatter)        // Parse YAML frontmatter
  .use(remarkStripFrontmatter)   // Remove from output
  .use(remarkGfm)                // GitHub-flavored markdown
  .use(remarkExampleBlocks)      // :::example -> HTML
  .use(remarkGmBoxes)            // :::gm-only -> HTML
  .use(remarkWebIds / remarkSemanticIds)  // Generate IDs
  .use(remarkRehype)             // Convert to HTML AST
  .use(rehypeStringify)          // Serialize HTML
```

### 3. Assemble Content (`assembler.ts`)

Combines chapters into 4-part structure defined in `toc-generator.ts`:

```typescript
const PARTS = [
  { id: 'part-i-foundations', title: 'Part I: Foundations', chapters: [1, 13] },
  { id: 'part-ii-skills-proficiencies', title: 'Part II: Skills...', chapters: [14, 20] },
  { id: 'part-iii-reference-and-gm', title: 'Part III: Game Master...', chapters: [21, 26] },
  { id: 'part-iv-glossary-index', title: 'Part IV: Reference...', chapters: [27, 30] },
];
```

Sheets are assembled into Chapter 27.

### 4. Render Template

Replaces placeholders in HTML template:
- `{{TOC}}` - Generated table of contents
- `{{CONTENT}}` - Assembled chapter HTML

## Database Schema

Build history is stored in SQLite (`data/razorweave.db`):

```sql
CREATE TABLE html_builds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_id TEXT UNIQUE NOT NULL,      -- "build-2025-11-22T17-31-15-lfdohv"
  output_type TEXT NOT NULL,           -- "web-reader" or "print-design"
  book_path TEXT NOT NULL,
  output_path TEXT NOT NULL,
  source_hash TEXT NOT NULL,           -- Combined hash of all sources
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE html_build_sources (
  build_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,          -- Individual file SHA-256
  file_type TEXT NOT NULL,             -- "chapter" or "sheet"
  PRIMARY KEY (build_id, file_path),
  FOREIGN KEY (build_id) REFERENCES html_builds(build_id)
);
```

## Transforms

### Example Blocks (`example-blocks.ts`)

Converts fenced blocks to styled HTML:

```markdown
:::example
**Setting the Scene**
The GM describes the situation...
:::
```

Becomes:
```html
<div class="example-block">
  <strong>Setting the Scene</strong>
  <p>The GM describes the situation...</p>
</div>
```

### GM Boxes (`gm-boxes.ts`)

Converts GM-only content:

```markdown
:::gm-only
This section is for Game Masters only...
:::
```

Becomes:
```html
<aside class="gm-box">
  <p>This section is for Game Masters only...</p>
</aside>
```

### ID Transforms

**Web IDs** (`web-ids.ts`): Prefixes with chapter number for global uniqueness.
- `## Introduction` in chapter 5 → `id="ch-05-introduction"`

**Semantic IDs** (`semantic-ids.ts`): Uses content-based slugs without chapter prefix.
- `## Introduction` → `id="introduction"`

## Adding a New Transform

1. Create `src/tooling/html-gen/transforms/my-transform.ts`:

```typescript
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export function remarkMyTransform() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node) => {
      // Transform logic here
    });
  };
}
```

2. Export from `transforms/index.ts`:

```typescript
export { remarkMyTransform } from './my-transform.js';
```

3. Add to pipeline in `web/build.ts` or `print/build.ts`:

```typescript
.use(remarkMyTransform)
```

4. Add tests in `transforms/my-transform.test.ts`

## Build Caching (Web Only)

The web pipeline uses hash-based caching:

1. Calculate SHA-256 hash of all source files combined
2. Compare against `source_hash` of latest build
3. Skip rebuild if hashes match

Use `--force` to bypass caching.

## CLI Integration

Commands are defined in `src/tooling/cli-commands/run.ts` and exposed via `package.json` scripts.

Root `package.json` delegates to tooling workspace:
```json
"html:web:build": "tsx src/tooling/cli-commands/run.ts html web build"
```

## Testing

Run tests with:
```bash
pnpm --filter @razorweave/tooling test
```

Test files follow `*.test.ts` naming convention alongside source files.
