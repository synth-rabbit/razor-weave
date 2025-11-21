# HTML Generation Phase 4-Web: Web Reader CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete web reader HTML generation workflow with CLI commands for build, list, diff, and promote.

**Architecture:** Use shared infrastructure (Phase 1-3), add web-specific ID transforms and template, wire up CLI commands for `html web` subcommand group.

**Tech Stack:** TypeScript, unified/remark (from Phase 2), Node.js fs/promises, better-sqlite3

**Prerequisites:**
- Phase 1 complete (database, hashing, build-client)
- Phase 2 complete (transforms: example-blocks, gm-boxes, semantic-ids)
- Phase 3 complete (chapter-reader, toc-generator, assembler)

**Reference Design:** `docs/plans/2025-11-21-web-reader-html-generator-design.md`

**Key Differences from Print Workflow:**
1. **IDs**: Web uses `ch-04-slug` section IDs and chapter-prefixed subsection IDs
2. **Template**: Web template extracted from `src/site/src/pages/read.html`
3. **Output**: `data/html/web-reader/core-rulebook.html`
4. **Promote target**: `src/site/src/pages/read.html`

---

## Task 1: Create Web ID Transform

The web reader needs chapter-prefixed IDs for JavaScript compatibility with `reader.js`.

**Files:**
- Create: `src/tooling/html-gen/transforms/web-ids.ts`
- Create: `src/tooling/html-gen/transforms/web-ids.test.ts`
- Modify: `src/tooling/html-gen/transforms/index.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/transforms/web-ids.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkWebIds } from './web-ids.js';

async function processWithWebIds(markdown: string, chapterNum: number): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkWebIds, { chapterNumber: chapterNum, chapterSlug: 'core-principles' })
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

describe('remarkWebIds', () => {
  describe('chapter headings (h2)', () => {
    it('generates heading ID with -heading suffix', async () => {
      const markdown = '## 4. Core Principles of Play';
      const html = await processWithWebIds(markdown, 4);

      expect(html).toContain('id="core-principles-of-play-heading"');
    });

    it('removes chapter number from heading ID', async () => {
      const markdown = '## 12. Downtime and Recovery';
      const html = await processWithWebIds(markdown, 12);

      expect(html).toContain('id="downtime-and-recovery-heading"');
      expect(html).not.toContain('12-');
    });
  });

  describe('subsection headings (h3)', () => {
    it('prefixes subsection IDs with chapter slug', async () => {
      const markdown = '### The Table Is a Creative Team';
      const html = await processWithWebIds(markdown, 4);

      expect(html).toContain('id="core-principles-table-is-a-creative-team"');
    });
  });

  describe('sub-subsection headings (h4)', () => {
    it('prefixes h4 IDs with chapter slug', async () => {
      const markdown = '#### When to Use Tags';
      const html = await processWithWebIds(markdown, 4);

      expect(html).toContain('id="core-principles-when-to-use-tags"');
    });
  });

  describe('slugify', () => {
    it('handles special characters', async () => {
      const markdown = '### Edge, Burden, Tags & Conditions';
      const html = await processWithWebIds(markdown, 4);

      expect(html).toContain('id="core-principles-edge-burden-tags-conditions"');
    });

    it('collapses multiple spaces/hyphens', async () => {
      const markdown = '### The   Table   Rules';
      const html = await processWithWebIds(markdown, 4);

      expect(html).toContain('id="core-principles-the-table-rules"');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/transforms/web-ids.test.ts
```

**Step 3: Write the implementation**

Create `src/tooling/html-gen/transforms/web-ids.ts`:

```typescript
/**
 * Web IDs Transform
 *
 * Generates chapter-prefixed IDs for web reader compatibility.
 *
 * ID patterns (per web reader design doc):
 * - H2 (chapter heading): slugify(title) + "-heading"
 * - H3/H4 (subsections): chapter-slug + "-" + slugify(subsection-title)
 *
 * This differs from print which uses simple slugify without prefixing.
 */

import type { Root, Heading, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import { slugify } from './semantic-ids.js';

export interface WebIdsOptions {
  chapterNumber: number;
  chapterSlug: string; // e.g., "core-principles" from filename
}

/**
 * Extract text content from heading, removing chapter numbers
 */
function extractHeadingText(heading: Heading): string {
  let text = '';
  for (const child of heading.children) {
    if (child.type === 'text') {
      text += (child as Text).value;
    }
  }
  // Remove leading chapter number (e.g., "4. " or "12. ")
  return text.replace(/^\d+\.\s*/, '').trim();
}

/**
 * Remark plugin to add web-compatible IDs to headings
 */
export function remarkWebIds(options: WebIdsOptions) {
  const { chapterSlug } = options;

  return (tree: Root) => {
    visit(tree, 'heading', (node: Heading) => {
      const text = extractHeadingText(node);
      const textSlug = slugify(text);

      let id: string;

      if (node.depth === 2) {
        // Chapter heading: slugify(title) + "-heading"
        id = `${textSlug}-heading`;
      } else {
        // Subsections (h3, h4): chapter-slug + "-" + slugify(title)
        id = `${chapterSlug}-${textSlug}`;
      }

      // Add data.hProperties for remark-rehype
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      (node.data.hProperties as Record<string, string>).id = id;
    });
  };
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/transforms/web-ids.test.ts
```

**Step 5: Export and commit**

Add to `src/tooling/html-gen/transforms/index.ts`:
```typescript
export { remarkWebIds, type WebIdsOptions } from './web-ids.js';
```

```bash
git add src/tooling/html-gen/transforms/web-ids.ts src/tooling/html-gen/transforms/web-ids.test.ts src/tooling/html-gen/transforms/index.ts
git commit -m "feat(html-gen): add web-specific ID transform for reader.js compatibility"
```

---

## Task 2: Extract Web Template

Extract template shell from current `read.html` with placeholders.

**Files:**
- Create: `src/tooling/html-gen/templates/web-reader.html`

**Step 1: Read current read.html**

```bash
# Examine structure
head -100 src/site/src/pages/read.html
```

**Step 2: Create template with placeholders**

Create `src/tooling/html-gen/templates/web-reader.html`:

The template should:
1. Keep all `<head>` content (meta, styles, fonts)
2. Keep reading progress bar structure
3. Replace TOC content with `{{TOC}}`
4. Replace main content with `{{CONTENT}}`
5. Keep `{{HEADER}}` and `{{FOOTER}}` placeholders
6. Keep all `<script>` tags
7. Keep quick-jump modal structure
8. Keep breadcrumb structure

**Template structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Copy all head content from read.html -->
</head>
<body>
  <div class="reading-progress">
    <div class="reading-progress-bar"></div>
  </div>

  {{HEADER}}

  <button class="toc-toggle" aria-label="Toggle table of contents">
    <svg><!-- menu icon --></svg>
  </button>

  <div class="quick-jump-modal" id="quickJumpModal">
    <!-- Copy quick-jump modal structure -->
  </div>

  <div class="reader-container">
    <aside class="reader-toc">
      <h2>Table of Contents</h2>
      {{TOC}}
    </aside>

    <main class="reader-content">
      <nav class="breadcrumb" aria-label="Current location">
        <span id="breadcrumb-current"></span>
      </nav>
      {{CONTENT}}
    </main>
  </div>

  {{FOOTER}}

  <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0"></script>
  <script src="/scripts/reader.js"></script>
</body>
</html>
```

**Step 3: Commit**

```bash
git add src/tooling/html-gen/templates/web-reader.html
git commit -m "feat(html-gen): extract web reader template from read.html"
```

---

## Task 3: Create Web Build Pipeline

Orchestrates the full build process for web reader output.

**Files:**
- Create: `src/tooling/html-gen/web/index.ts`
- Create: `src/tooling/html-gen/web/build.ts`
- Create: `src/tooling/html-gen/web/build.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/web/build.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { createTables } from '../../database/schema.js';
import { buildWebReader, type BuildResult } from './build.js';

describe('buildWebReader', () => {
  const testDir = 'data/test-web-build';
  const chaptersDir = join(testDir, 'chapters');
  const sheetsDir = join(testDir, 'sheets');
  const outputDir = join(testDir, 'output');
  const dbPath = join(testDir, 'test.db');

  let db: Database.Database;

  beforeEach(() => {
    mkdirSync(chaptersDir, { recursive: true });
    mkdirSync(sheetsDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    // Create test chapters
    writeFileSync(join(chaptersDir, '01-welcome.md'), '## 1. Welcome\n\nWelcome content.');
    writeFileSync(join(chaptersDir, '02-concepts.md'), '## 2. Core Concepts\n\nConcepts here.');

    // Create database
    db = new Database(dbPath);
    createTables(db);
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('generates HTML output file', async () => {
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    expect(result.status).toBe('success');
    expect(existsSync(result.outputPath)).toBe(true);
  });

  it('includes processed chapters in output', async () => {
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    const html = readFileSync(result.outputPath, 'utf-8');
    expect(html).toContain('id="ch-01-welcome"');
    expect(html).toContain('id="ch-02-concepts"');
  });

  it('records build in database', async () => {
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    expect(result.buildId).toMatch(/^build-/);

    const build = db.prepare('SELECT * FROM html_builds WHERE build_id = ?').get(result.buildId);
    expect(build).toBeDefined();
    expect((build as any).output_type).toBe('web-reader');
  });

  it('skips build when sources unchanged', async () => {
    // First build
    await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    // Second build - should skip
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    expect(result.status).toBe('skipped');
    expect(result.reason).toContain('unchanged');
  });

  it('rebuilds when forced', async () => {
    // First build
    await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
    });

    // Second build with force
    const result = await buildWebReader({
      bookPath: testDir,
      chaptersDir,
      sheetsDir,
      outputPath: join(outputDir, 'core-rulebook.html'),
      templatePath: 'src/tooling/html-gen/templates/web-reader.html',
      db,
      force: true,
    });

    expect(result.status).toBe('success');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/web/build.test.ts
```

**Step 3: Write the implementation**

Create `src/tooling/html-gen/web/build.ts`:

```typescript
/**
 * Web Reader Build Pipeline
 *
 * Orchestrates the full build process:
 * 1. Read chapters and sheets
 * 2. Hash sources, check if rebuild needed
 * 3. Apply transforms (example blocks, GM boxes, web IDs)
 * 4. Generate TOC
 * 5. Assemble with template
 * 6. Write output and record build
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type Database from 'better-sqlite3';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import { readChapters, readSheets, type ChapterFile } from '../chapter-reader.js';
import { hashFiles, hashString } from '../hasher.js';
import { HtmlBuildClient } from '../build-client.js';
import { remarkExampleBlocks, remarkGmBoxes, remarkWebIds } from '../transforms/index.js';
import { generateToc, renderTocHtml } from '../toc-generator.js';
import { wrapChapter, assembleContent, type ChapterHtml, type SheetHtml } from '../assembler.js';

export interface BuildOptions {
  bookPath: string;
  chaptersDir: string;
  sheetsDir: string;
  outputPath: string;
  templatePath: string;
  db: Database.Database;
  force?: boolean;
}

export interface BuildResult {
  status: 'success' | 'skipped' | 'failed';
  buildId?: string;
  outputPath: string;
  chapterCount?: number;
  reason?: string;
}

/**
 * Extract chapter slug from filename
 * "04-core-principles-of-play" -> "core-principles-of-play"
 */
function extractChapterSlug(slug: string): string {
  return slug;
}

/**
 * Extract title from chapter content
 */
function extractTitle(content: string): string {
  const match = content.match(/^##\s*\d+\.\s*(.+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * Process single chapter through transform pipeline
 */
async function processChapter(chapter: ChapterFile): Promise<ChapterHtml> {
  const pipeline = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkExampleBlocks)
    .use(remarkGmBoxes)
    .use(remarkWebIds, {
      chapterNumber: chapter.number,
      chapterSlug: extractChapterSlug(chapter.slug),
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await pipeline.process(chapter.content);

  return {
    number: chapter.number,
    slug: chapter.slug,
    html: String(result),
  };
}

/**
 * Process single sheet through transform pipeline
 */
async function processSheet(sheet: ChapterFile): Promise<SheetHtml> {
  const pipeline = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await pipeline.process(sheet.content);

  return {
    slug: sheet.slug,
    html: String(result),
  };
}

/**
 * Build web reader HTML
 */
export async function buildWebReader(options: BuildOptions): Promise<BuildResult> {
  const { bookPath, chaptersDir, sheetsDir, outputPath, templatePath, db, force } = options;
  const buildClient = new HtmlBuildClient(db);

  try {
    // 1. Read source files
    const chapters = await readChapters(chaptersDir);
    const sheets = await readSheets(sheetsDir);

    // 2. Calculate source hash
    const allPaths = [
      ...chapters.map(c => c.filePath),
      ...sheets.map(s => s.filePath),
    ];
    const sourceHash = await hashFiles(allPaths);

    // 3. Check if rebuild needed
    if (!force) {
      const latestBuild = buildClient.getLatestBuild('web-reader');
      if (latestBuild && latestBuild.sourceHash === sourceHash) {
        return {
          status: 'skipped',
          outputPath,
          reason: 'Sources unchanged since last build',
        };
      }
    }

    // 4. Process chapters
    const processedChapters: ChapterHtml[] = [];
    for (const chapter of chapters) {
      const processed = await processChapter(chapter);
      processedChapters.push(processed);
    }

    // 5. Process sheets
    const processedSheets: SheetHtml[] = [];
    for (const sheet of sheets) {
      const processed = await processSheet(sheet);
      processedSheets.push(processed);
    }

    // 6. Generate TOC
    const tocData = chapters.map(c => ({
      number: c.number,
      title: extractTitle(c.content),
      slug: c.slug,
    }));
    const toc = generateToc(tocData);
    const tocHtml = renderTocHtml(toc);

    // 7. Assemble content
    const contentHtml = assembleContent({
      chapters: processedChapters,
      sheets: processedSheets,
      partIntros: new Map(), // TODO: Add part intros
    });

    // 8. Merge with template
    const template = await readFile(templatePath, 'utf-8');
    const finalHtml = template
      .replace('{{TOC}}', tocHtml)
      .replace('{{CONTENT}}', contentHtml);

    // 9. Write output
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, finalHtml, 'utf-8');

    // 10. Record build
    const sources = [
      ...chapters.map(c => ({
        filePath: c.filePath,
        contentHash: hashString(c.content),
        fileType: 'chapter' as const,
      })),
      ...sheets.map(s => ({
        filePath: s.filePath,
        contentHash: hashString(s.content),
        fileType: 'sheet' as const,
      })),
    ];

    const buildId = buildClient.createBuild({
      outputType: 'web-reader',
      bookPath,
      outputPath,
      sourceHash,
      sources,
    });

    return {
      status: 'success',
      buildId,
      outputPath,
      chapterCount: chapters.length,
    };
  } catch (error) {
    return {
      status: 'failed',
      outputPath,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
```

Create `src/tooling/html-gen/web/index.ts`:

```typescript
export { buildWebReader, type BuildOptions, type BuildResult } from './build.js';
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/web/build.test.ts
```

**Step 5: Commit**

```bash
git add src/tooling/html-gen/web/
git commit -m "feat(html-gen): add web reader build pipeline"
```

---

## Task 4: Create Web List Command

**Files:**
- Create: `src/tooling/html-gen/web/list.ts`
- Create: `src/tooling/html-gen/web/list.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/web/list.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../../database/schema.js';
import { HtmlBuildClient } from '../build-client.js';
import { listWebBuilds } from './list.js';

describe('listWebBuilds', () => {
  const dbPath = 'data/test-list.db';
  let db: Database.Database;
  let buildClient: HtmlBuildClient;

  beforeEach(() => {
    db = new Database(dbPath);
    createTables(db);
    buildClient = new HtmlBuildClient(db);
  });

  afterEach(() => {
    db.close();
    rmSync(dbPath, { force: true });
  });

  it('returns empty array when no builds', () => {
    const builds = listWebBuilds(db);
    expect(builds).toEqual([]);
  });

  it('returns web-reader builds only', () => {
    // Create web build
    buildClient.createBuild({
      outputType: 'web-reader',
      bookPath: 'books/core/v1',
      outputPath: 'data/html/web-reader/core.html',
      sourceHash: 'hash1',
      sources: [],
    });

    // Create print build (should be excluded)
    buildClient.createBuild({
      outputType: 'print-design',
      bookPath: 'books/core/v1',
      outputPath: 'data/html/print-design/core.html',
      sourceHash: 'hash2',
      sources: [],
    });

    const builds = listWebBuilds(db);

    expect(builds).toHaveLength(1);
    expect(builds[0].outputType).toBe('web-reader');
  });

  it('returns builds in reverse chronological order', () => {
    buildClient.createBuild({
      outputType: 'web-reader',
      bookPath: 'books/core/v1',
      outputPath: 'data/html/web-reader/core.html',
      sourceHash: 'first',
      sources: [],
    });

    buildClient.createBuild({
      outputType: 'web-reader',
      bookPath: 'books/core/v1',
      outputPath: 'data/html/web-reader/core.html',
      sourceHash: 'second',
      sources: [],
    });

    const builds = listWebBuilds(db);

    expect(builds[0].sourceHash).toBe('second');
    expect(builds[1].sourceHash).toBe('first');
  });

  it('respects limit parameter', () => {
    for (let i = 0; i < 5; i++) {
      buildClient.createBuild({
        outputType: 'web-reader',
        bookPath: 'books/core/v1',
        outputPath: 'data/html/web-reader/core.html',
        sourceHash: `hash${i}`,
        sources: [],
      });
    }

    const builds = listWebBuilds(db, 3);
    expect(builds).toHaveLength(3);
  });
});
```

**Step 2: Implement**

Create `src/tooling/html-gen/web/list.ts`:

```typescript
/**
 * Web Reader List Command
 *
 * Lists previous web reader builds from the database.
 */

import type Database from 'better-sqlite3';
import { HtmlBuildClient, type HtmlBuild } from '../build-client.js';

/**
 * List web reader builds
 */
export function listWebBuilds(db: Database.Database, limit = 10): HtmlBuild[] {
  const buildClient = new HtmlBuildClient(db);
  return buildClient.listBuilds('web-reader', limit);
}

/**
 * Format builds for CLI output
 */
export function formatBuildList(builds: HtmlBuild[]): string {
  if (builds.length === 0) {
    return 'No web reader builds found.';
  }

  const lines = builds.map(b => {
    const date = new Date(b.createdAt).toLocaleString();
    const status = b.status === 'success' ? '✓' : '✗';
    return `${status} ${b.buildId}  ${date}  ${b.sourceHash.slice(0, 8)}`;
  });

  return ['BUILD ID                      DATE                 HASH', ...lines].join('\n');
}
```

**Step 3: Run test and commit**

```bash
pnpm vitest run src/tooling/html-gen/web/list.test.ts
git add src/tooling/html-gen/web/list.ts src/tooling/html-gen/web/list.test.ts
git commit -m "feat(html-gen): add web reader list command"
```

---

## Task 5: Create Web Diff Command

**Files:**
- Create: `src/tooling/html-gen/web/diff.ts`
- Create: `src/tooling/html-gen/web/diff.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/web/diff.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { createTables } from '../../database/schema.js';
import { HtmlBuildClient } from '../build-client.js';
import { diffWebBuild, type DiffResult } from './diff.js';

describe('diffWebBuild', () => {
  const testDir = 'data/test-diff';
  const chaptersDir = join(testDir, 'chapters');
  const dbPath = join(testDir, 'test.db');
  let db: Database.Database;
  let buildClient: HtmlBuildClient;

  beforeEach(() => {
    mkdirSync(chaptersDir, { recursive: true });
    db = new Database(dbPath);
    createTables(db);
    buildClient = new HtmlBuildClient(db);
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('detects changed files since build', () => {
    // Create build with original file
    writeFileSync(join(chaptersDir, '01-welcome.md'), 'original');
    const buildId = buildClient.createBuild({
      outputType: 'web-reader',
      bookPath: testDir,
      outputPath: 'output.html',
      sourceHash: 'hash1',
      sources: [{ filePath: join(chaptersDir, '01-welcome.md'), contentHash: 'original-hash', fileType: 'chapter' }],
    });

    // Modify file
    writeFileSync(join(chaptersDir, '01-welcome.md'), 'modified');

    const diff = diffWebBuild(db, buildId, chaptersDir);

    expect(diff.changed).toContain(join(chaptersDir, '01-welcome.md'));
  });

  it('detects added files since build', () => {
    writeFileSync(join(chaptersDir, '01-welcome.md'), 'content');
    const buildId = buildClient.createBuild({
      outputType: 'web-reader',
      bookPath: testDir,
      outputPath: 'output.html',
      sourceHash: 'hash1',
      sources: [{ filePath: join(chaptersDir, '01-welcome.md'), contentHash: 'hash', fileType: 'chapter' }],
    });

    // Add new file
    writeFileSync(join(chaptersDir, '02-new.md'), 'new content');

    const diff = diffWebBuild(db, buildId, chaptersDir);

    expect(diff.added).toContain(join(chaptersDir, '02-new.md'));
  });

  it('detects removed files since build', () => {
    writeFileSync(join(chaptersDir, '01-welcome.md'), 'content');
    writeFileSync(join(chaptersDir, '02-removed.md'), 'will be removed');

    const buildId = buildClient.createBuild({
      outputType: 'web-reader',
      bookPath: testDir,
      outputPath: 'output.html',
      sourceHash: 'hash1',
      sources: [
        { filePath: join(chaptersDir, '01-welcome.md'), contentHash: 'hash1', fileType: 'chapter' },
        { filePath: join(chaptersDir, '02-removed.md'), contentHash: 'hash2', fileType: 'chapter' },
      ],
    });

    // Remove file
    rmSync(join(chaptersDir, '02-removed.md'));

    const diff = diffWebBuild(db, buildId, chaptersDir);

    expect(diff.removed).toContain(join(chaptersDir, '02-removed.md'));
  });
});
```

**Step 2: Implement**

Create `src/tooling/html-gen/web/diff.ts`:

```typescript
/**
 * Web Reader Diff Command
 *
 * Shows changes since a specific build.
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type Database from 'better-sqlite3';
import { HtmlBuildClient } from '../build-client.js';
import { hashString } from '../hasher.js';

export interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
}

/**
 * Compare current files to a previous build
 */
export function diffWebBuild(
  db: Database.Database,
  buildId: string,
  chaptersDir: string
): DiffResult {
  const buildClient = new HtmlBuildClient(db);
  const sources = buildClient.getBuildSources(buildId);

  const result: DiffResult = {
    added: [],
    removed: [],
    changed: [],
  };

  // Map of file path -> content hash from build
  const buildFiles = new Map(sources.map(s => [s.filePath, s.contentHash]));

  // Get current files
  const currentFiles = readdirSync(chaptersDir)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .map(f => join(chaptersDir, f));

  // Check for added and changed files
  for (const filePath of currentFiles) {
    const buildHash = buildFiles.get(filePath);

    if (!buildHash) {
      result.added.push(filePath);
    } else {
      const currentContent = readFileSync(filePath, 'utf-8');
      const currentHash = hashString(currentContent);

      if (currentHash !== buildHash) {
        result.changed.push(filePath);
      }
    }
  }

  // Check for removed files
  for (const [filePath] of buildFiles) {
    if (!existsSync(filePath)) {
      result.removed.push(filePath);
    }
  }

  return result;
}

/**
 * Format diff for CLI output
 */
export function formatDiff(diff: DiffResult): string {
  const lines: string[] = [];

  if (diff.added.length > 0) {
    lines.push('Added:');
    diff.added.forEach(f => lines.push(`  + ${f}`));
  }

  if (diff.removed.length > 0) {
    lines.push('Removed:');
    diff.removed.forEach(f => lines.push(`  - ${f}`));
  }

  if (diff.changed.length > 0) {
    lines.push('Changed:');
    diff.changed.forEach(f => lines.push(`  ~ ${f}`));
  }

  if (lines.length === 0) {
    return 'No changes since build.';
  }

  return lines.join('\n');
}
```

**Step 3: Run test and commit**

```bash
pnpm vitest run src/tooling/html-gen/web/diff.test.ts
git add src/tooling/html-gen/web/diff.ts src/tooling/html-gen/web/diff.test.ts
git commit -m "feat(html-gen): add web reader diff command"
```

---

## Task 6: Create Web Promote Command

**Files:**
- Create: `src/tooling/html-gen/web/promote.ts`
- Create: `src/tooling/html-gen/web/promote.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/web/promote.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { promoteWebBuild } from './promote.js';

describe('promoteWebBuild', () => {
  const testDir = 'data/test-promote';
  const outputDir = join(testDir, 'html/web-reader');
  const targetDir = join(testDir, 'site/pages');

  beforeEach(() => {
    mkdirSync(outputDir, { recursive: true });
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(outputDir, 'core-rulebook.html'), '<html>Generated content</html>');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('copies output to target location', async () => {
    const result = await promoteWebBuild({
      sourcePath: join(outputDir, 'core-rulebook.html'),
      targetPath: join(targetDir, 'read.html'),
    });

    expect(result.success).toBe(true);
    expect(existsSync(join(targetDir, 'read.html'))).toBe(true);
  });

  it('preserves content during copy', async () => {
    await promoteWebBuild({
      sourcePath: join(outputDir, 'core-rulebook.html'),
      targetPath: join(targetDir, 'read.html'),
    });

    const content = readFileSync(join(targetDir, 'read.html'), 'utf-8');
    expect(content).toBe('<html>Generated content</html>');
  });

  it('fails if source does not exist', async () => {
    const result = await promoteWebBuild({
      sourcePath: join(outputDir, 'nonexistent.html'),
      targetPath: join(targetDir, 'read.html'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not exist');
  });
});
```

**Step 2: Implement**

Create `src/tooling/html-gen/web/promote.ts`:

```typescript
/**
 * Web Reader Promote Command
 *
 * Copies generated HTML to site location.
 */

import { copyFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface PromoteOptions {
  sourcePath: string;
  targetPath: string;
}

export interface PromoteResult {
  success: boolean;
  sourcePath: string;
  targetPath: string;
  error?: string;
}

/**
 * Promote web reader output to site location
 */
export async function promoteWebBuild(options: PromoteOptions): Promise<PromoteResult> {
  const { sourcePath, targetPath } = options;

  if (!existsSync(sourcePath)) {
    return {
      success: false,
      sourcePath,
      targetPath,
      error: `Source file does not exist: ${sourcePath}`,
    };
  }

  try {
    await copyFile(sourcePath, targetPath);

    return {
      success: true,
      sourcePath,
      targetPath,
    };
  } catch (error) {
    return {
      success: false,
      sourcePath,
      targetPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

**Step 3: Run test and commit**

```bash
pnpm vitest run src/tooling/html-gen/web/promote.test.ts
git add src/tooling/html-gen/web/promote.ts src/tooling/html-gen/web/promote.test.ts
git commit -m "feat(html-gen): add web reader promote command"
```

---

## Task 7: Wire Up CLI Commands

**Files:**
- Modify: `src/tooling/cli-commands/run.ts`
- Modify: `package.json`

**Step 1: Add CLI command handlers**

Add to `src/tooling/cli-commands/run.ts`:

```typescript
// Add imports at top
import { buildWebReader } from '../html-gen/web/build.js';
import { listWebBuilds, formatBuildList } from '../html-gen/web/list.js';
import { diffWebBuild, formatDiff } from '../html-gen/web/diff.js';
import { promoteWebBuild } from '../html-gen/web/promote.js';

// Add command handling in main function
if (command === 'html' && args[1] === 'web') {
  const subcommand = args[2];
  const db = openDatabase('data/project.db');

  try {
    switch (subcommand) {
      case 'build': {
        const force = args.includes('--force');
        const result = await buildWebReader({
          bookPath: 'books/core/v1',
          chaptersDir: 'books/core/v1/chapters',
          sheetsDir: 'books/core/v1/sheets',
          outputPath: 'data/html/web-reader/core-rulebook.html',
          templatePath: 'src/tooling/html-gen/templates/web-reader.html',
          db,
          force,
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'list': {
        const limitArg = args.find(a => a.startsWith('--limit='));
        const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 10;
        const builds = listWebBuilds(db, limit);
        console.log(formatBuildList(builds));
        break;
      }

      case 'diff': {
        const buildId = args[3];
        if (!buildId) {
          console.error('Usage: html web diff <build-id>');
          process.exit(1);
        }
        const diff = diffWebBuild(db, buildId, 'books/core/v1/chapters');
        console.log(formatDiff(diff));
        break;
      }

      case 'promote': {
        const result = await promoteWebBuild({
          sourcePath: 'data/html/web-reader/core-rulebook.html',
          targetPath: 'src/site/src/pages/read.html',
        });
        console.log(result.success ? 'Promoted successfully!' : `Failed: ${result.error}`);
        break;
      }

      default:
        console.error(`Unknown html web subcommand: ${subcommand}`);
        console.error('Available: build, list, diff, promote');
        process.exit(1);
    }
  } finally {
    db.close();
  }
  return;
}
```

**Step 2: Add package.json scripts**

Add to `package.json`:

```json
{
  "scripts": {
    "html:web:build": "tsx src/tooling/cli-commands/run.ts html web build",
    "html:web:list": "tsx src/tooling/cli-commands/run.ts html web list",
    "html:web:diff": "tsx src/tooling/cli-commands/run.ts html web diff",
    "html:web:promote": "tsx src/tooling/cli-commands/run.ts html web promote"
  }
}
```

**Step 3: Test CLI commands**

```bash
# Build web reader
pnpm html:web:build

# List builds
pnpm html:web:list

# Should show build ID from above
pnpm html:web:diff <build-id>

# Promote to site
pnpm html:web:promote
```

**Step 4: Commit**

```bash
git add src/tooling/cli-commands/run.ts package.json
git commit -m "feat(html-gen): wire up web reader CLI commands"
```

---

## Task 8: Run Full Test Suite

**Step 1: Run all html-gen tests**

```bash
pnpm vitest run src/tooling/html-gen/
```

Expected: All tests PASS

**Step 2: Verify CLI commands work**

```bash
pnpm html:web:build
pnpm html:web:list
```

---

## Phase 4-Web Complete

**What was built:**
- `transforms/web-ids.ts` — Chapter-prefixed IDs for web reader
- `templates/web-reader.html` — Template shell with placeholders
- `web/build.ts` — Full build pipeline with caching
- `web/list.ts` — List previous builds
- `web/diff.ts` — Show changes since build
- `web/promote.ts` — Copy output to site location
- CLI commands: `html:web:build`, `html:web:list`, `html:web:diff`, `html:web:promote`

**CLI Usage:**
```bash
pnpm html:web:build [--force]      # Build web reader HTML
pnpm html:web:list [--limit=N]     # List previous builds
pnpm html:web:diff <build-id>      # Show changes since build
pnpm html:web:promote              # Copy to src/site/src/pages/read.html
```

**Output Location:** `data/html/web-reader/core-rulebook.html`

**Promotion Target:** `src/site/src/pages/read.html`

---

## Next Steps

After Phase 4-Web:
1. **Playwright Testing** — Run web reader tests to verify JavaScript compatibility
2. **Part Intros** — Add part introduction content
3. **Validation** — Compare generated output structure to current read.html
4. **Sheets Refinement** — Review and fix sheet rendering issues
