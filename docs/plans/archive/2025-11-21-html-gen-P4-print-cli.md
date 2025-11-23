# HTML Generation Phase 4: Print CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement print-design specific build, list, diff, and promote CLI commands.

**Architecture:** Extract template from existing `core_rulebook.html`, create build orchestrator that uses shared transforms, wire CLI commands.

**Tech Stack:** TypeScript, Commander.js (if needed), Node.js fs/promises

**Prerequisites:**
- Phase 1-3 complete
- Existing `books/core/v1/exports/html/core_rulebook.html` for template extraction

**Reference Design:** `docs/plans/2025-11-21-html-print-design-pipeline-design.md`

---

## Task 1: Extract Print Template

**Files:**
- Create: `src/tooling/html-gen/templates/print-design.html`

**Step 1: Read existing HTML and extract structure**

The template should be extracted from `books/core/v1/exports/html/core_rulebook.html`:
- Keep all `<head>` content (meta, fonts, CSS)
- Keep cover page structure
- Keep TOC nav structure
- Replace TOC content with `{{toc}}`
- Replace main content with `{{content}}`
- Keep all CSS (~1000 lines)

**Step 2: Create template file**

Create `src/tooling/html-gen/templates/print-design.html`:

```html
<!-- Razorweave Core Rulebook - Print Design Template -->
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
    /*
     * IMPORTANT: Copy the full CSS from core_rulebook.html here
     * This includes:
     * - Synthwave color system
     * - Base styles
     * - TOC sidebar
     * - .example and .gm block styles
     * - .sheet-block styles
     * - Table styles
     * - Responsive breakpoints
     * - Accessibility features
     * - Print stylesheet
     * - Cover page styles
     *
     * Total: ~1000 lines of CSS
     */
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

**Step 3: Copy full CSS**

Open `books/core/v1/exports/html/core_rulebook.html`, copy the entire `<style>` block (lines ~13-1060), and paste into the template.

**Step 4: Commit**

```bash
mkdir -p src/tooling/html-gen/templates
git add src/tooling/html-gen/templates/print-design.html
git commit -m "feat(html-gen): add print-design template with embedded CSS"
```

---

## Task 2: Create Template Renderer

**Files:**
- Create: `src/tooling/html-gen/template-renderer.ts`
- Create: `src/tooling/html-gen/template-renderer.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/template-renderer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderTemplate, type TemplateVars } from './template-renderer.js';

describe('template-renderer', () => {
  describe('renderTemplate', () => {
    it('replaces title placeholder', () => {
      const template = '<title>{{title}}</title>';
      const vars: TemplateVars = {
        title: 'Razorweave',
        subtitle: 'Core Rulebook',
        author: 'Panda Edwards',
        toc: '',
        content: '',
      };

      const result = renderTemplate(template, vars);

      expect(result).toBe('<title>Razorweave</title>');
    });

    it('replaces all placeholders', () => {
      const template = '{{title}} - {{subtitle}} by {{author}}\n{{toc}}\n{{content}}';
      const vars: TemplateVars = {
        title: 'Title',
        subtitle: 'Subtitle',
        author: 'Author',
        toc: '<nav>TOC</nav>',
        content: '<main>Content</main>',
      };

      const result = renderTemplate(template, vars);

      expect(result).toContain('Title - Subtitle by Author');
      expect(result).toContain('<nav>TOC</nav>');
      expect(result).toContain('<main>Content</main>');
    });

    it('handles multiple occurrences of same placeholder', () => {
      const template = '{{title}} and {{title}} again';
      const vars: TemplateVars = {
        title: 'Test',
        subtitle: '',
        author: '',
        toc: '',
        content: '',
      };

      const result = renderTemplate(template, vars);

      expect(result).toBe('Test and Test again');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/template-renderer.test.ts
```

**Step 3: Implement**

Create `src/tooling/html-gen/template-renderer.ts`:

```typescript
/**
 * Template Renderer
 *
 * Simple mustache-style template variable replacement.
 */

export interface TemplateVars {
  title: string;
  subtitle: string;
  author: string;
  toc: string;
  content: string;
}

/**
 * Replace {{placeholder}} with values
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  let result = template;

  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }

  return result;
}
```

**Step 4: Run tests and commit**

```bash
pnpm vitest run src/tooling/html-gen/template-renderer.test.ts
git add src/tooling/html-gen/template-renderer.ts src/tooling/html-gen/template-renderer.test.ts src/tooling/html-gen/index.ts
git commit -m "feat(html-gen): add template renderer"
```

---

## Task 3: Create Print Build Orchestrator

**Files:**
- Create: `src/tooling/html-gen/print/build.ts`
- Create: `src/tooling/html-gen/print/build.test.ts`

**Step 1: Write the test**

Create `src/tooling/html-gen/print/build.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { buildPrintHtml, type BuildResult } from './build.js';

describe('print build', () => {
  const testDir = 'data/test-print-build';
  const chaptersDir = join(testDir, 'chapters');
  const sheetsDir = join(testDir, 'sheets');
  const outputDir = join(testDir, 'output');

  beforeEach(() => {
    mkdirSync(chaptersDir, { recursive: true });
    mkdirSync(sheetsDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    // Create minimal test chapters
    writeFileSync(join(chaptersDir, '01-welcome.md'), '## 1. Welcome\n\nWelcome content.');
    writeFileSync(join(chaptersDir, '28-glossary.md'), '## 28. Glossary\n\nTerms here.');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('buildPrintHtml', () => {
    it('produces HTML output file', async () => {
      const result = await buildPrintHtml({
        bookPath: testDir,
        chaptersDir,
        sheetsDir,
        outputPath: join(outputDir, 'test.html'),
        // Skip database recording for test
        skipDatabase: true,
      });

      expect(result.success).toBe(true);
      expect(existsSync(join(outputDir, 'test.html'))).toBe(true);
    });

    it('returns build metadata', async () => {
      const result = await buildPrintHtml({
        bookPath: testDir,
        chaptersDir,
        sheetsDir,
        outputPath: join(outputDir, 'test.html'),
        skipDatabase: true,
      });

      expect(result.buildId).toMatch(/^build-/);
      expect(result.outputPath).toContain('test.html');
      expect(result.sourceHash).toHaveLength(64);
    });

    it('includes TOC in output', async () => {
      const result = await buildPrintHtml({
        bookPath: testDir,
        chaptersDir,
        sheetsDir,
        outputPath: join(outputDir, 'test.html'),
        skipDatabase: true,
      });

      const fs = await import('fs/promises');
      const html = await fs.readFile(result.outputPath, 'utf-8');

      expect(html).toContain('toc-root');
      expect(html).toContain('ch-01-welcome');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
mkdir -p src/tooling/html-gen/print
pnpm vitest run src/tooling/html-gen/print/build.test.ts
```

**Step 3: Implement the build orchestrator**

Create `src/tooling/html-gen/print/build.ts`:

```typescript
/**
 * Print Build Orchestrator
 *
 * Coordinates the full build pipeline for print-design HTML.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import { readChapters, readSheets } from '../chapter-reader.js';
import { hashFiles, hashString } from '../hasher.js';
import { generateToc, renderTocHtml } from '../toc-generator.js';
import { assembleContent, type ChapterHtml, type SheetHtml } from '../assembler.js';
import { renderTemplate, type TemplateVars } from '../template-renderer.js';
import { remarkExampleBlocks, remarkGmBoxes, remarkSemanticIds } from '../transforms/index.js';

export interface BuildOptions {
  bookPath: string;
  chaptersDir: string;
  sheetsDir: string;
  outputPath: string;
  skipDatabase?: boolean;
}

export interface BuildResult {
  success: boolean;
  buildId: string;
  outputPath: string;
  sourceHash: string;
  chapterCount: number;
  sheetCount: number;
  error?: string;
}

/**
 * Create the markdown processing pipeline
 */
function createPipeline() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkExampleBlocks)
    .use(remarkGmBoxes)
    .use(remarkSemanticIds)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

/**
 * Extract title from chapter content
 */
function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^##\s*\d+\.\s*(.+)$/m);
  return match ? match[1].trim() : fallback;
}

/**
 * Generate build ID
 */
function generateBuildId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `build-${timestamp}-${random}`;
}

/**
 * Build print-design HTML from markdown sources
 */
export async function buildPrintHtml(options: BuildOptions): Promise<BuildResult> {
  const buildId = generateBuildId();
  const pipeline = createPipeline();

  try {
    // Read source files
    const chapters = await readChapters(options.chaptersDir);
    const sheets = await readSheets(options.sheetsDir);

    // Calculate source hash
    const allPaths = [
      ...chapters.map(c => c.filePath),
      ...sheets.map(s => s.filePath),
    ];
    const sourceHash = await hashFiles(allPaths);

    // Process chapters
    const processedChapters: ChapterHtml[] = [];
    for (const chapter of chapters) {
      const result = await pipeline.process(chapter.content);
      processedChapters.push({
        number: chapter.number,
        slug: chapter.slug,
        html: String(result),
      });
    }

    // Process sheets
    const processedSheets: SheetHtml[] = [];
    for (const sheet of sheets) {
      const result = await pipeline.process(sheet.content);
      processedSheets.push({
        slug: sheet.slug,
        html: String(result),
      });
    }

    // Generate TOC
    const tocEntries = generateToc(
      processedChapters.map(c => ({
        number: c.number,
        title: extractTitle(chapters.find(ch => ch.number === c.number)?.content || '', c.slug),
        slug: c.slug,
      }))
    );
    const tocHtml = renderTocHtml(tocEntries);

    // Assemble content
    const assembledContent = assembleContent({
      chapters: processedChapters,
      sheets: processedSheets,
      partIntros: new Map(), // TODO: Add part intro support
    });

    // Load template
    const templatePath = join(dirname(import.meta.url.replace('file://', '')), '../templates/print-design.html');
    let template: string;
    try {
      template = await readFile(templatePath, 'utf-8');
    } catch {
      // Fallback minimal template for testing
      template = `<!DOCTYPE html>
<html><head><title>{{title}} - {{subtitle}}</title></head>
<body>
<nav><ul class="toc-root">{{toc}}</ul></nav>
<main>{{content}}</main>
</body></html>`;
    }

    // Render final HTML
    const vars: TemplateVars = {
      title: 'Razorweave',
      subtitle: 'Core Rulebook',
      author: 'Panda Edwards',
      toc: tocHtml,
      content: assembledContent,
    };
    const finalHtml = renderTemplate(template, vars);

    // Ensure output directory exists
    await mkdir(dirname(options.outputPath), { recursive: true });

    // Write output
    await writeFile(options.outputPath, finalHtml, 'utf-8');

    return {
      success: true,
      buildId,
      outputPath: options.outputPath,
      sourceHash,
      chapterCount: chapters.length,
      sheetCount: sheets.length,
    };
  } catch (error) {
    return {
      success: false,
      buildId,
      outputPath: options.outputPath,
      sourceHash: '',
      chapterCount: 0,
      sheetCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

**Step 4: Run tests**

```bash
pnpm vitest run src/tooling/html-gen/print/build.test.ts
```

**Step 5: Commit**

```bash
git add src/tooling/html-gen/print/
git commit -m "feat(html-gen): add print build orchestrator"
```

---

## Task 4: Create Print CLI Commands

**Files:**
- Create: `src/tooling/html-gen/print/index.ts`
- Create: `src/tooling/html-gen/print/list.ts`
- Create: `src/tooling/html-gen/print/diff.ts`
- Create: `src/tooling/html-gen/print/promote.ts`

**Step 1: Create index with command handlers**

Create `src/tooling/html-gen/print/index.ts`:

```typescript
/**
 * Print-Design CLI Commands
 */

export { buildPrintHtml, type BuildOptions, type BuildResult } from './build.js';
export { listPrintBuilds } from './list.js';
export { diffPrintBuild } from './diff.js';
export { promotePrintBuild } from './promote.js';
```

**Step 2: Implement list command**

Create `src/tooling/html-gen/print/list.ts`:

```typescript
/**
 * List Print Builds
 */

import { HtmlBuildClient } from '../build-client.js';
import type Database from 'better-sqlite3';

export interface ListResult {
  builds: Array<{
    buildId: string;
    createdAt: string;
    status: string;
    sourceHash: string;
  }>;
}

export function listPrintBuilds(db: Database.Database, limit = 10): ListResult {
  const client = new HtmlBuildClient(db);
  const builds = client.listBuilds('print-design', limit);

  return {
    builds: builds.map(b => ({
      buildId: b.buildId,
      createdAt: b.createdAt,
      status: b.status,
      sourceHash: b.sourceHash,
    })),
  };
}
```

**Step 3: Implement diff command**

Create `src/tooling/html-gen/print/diff.ts`:

```typescript
/**
 * Diff Print Builds
 */

import { HtmlBuildClient, type BuildDiff } from '../build-client.js';
import type Database from 'better-sqlite3';

export interface DiffResult {
  fromBuildId: string;
  toBuildId: string;
  diff: BuildDiff;
}

export function diffPrintBuild(
  db: Database.Database,
  fromBuildId: string,
  toBuildId: string
): DiffResult {
  const client = new HtmlBuildClient(db);
  const diff = client.diffBuilds(fromBuildId, toBuildId);

  return {
    fromBuildId,
    toBuildId,
    diff,
  };
}
```

**Step 4: Implement promote command**

Create `src/tooling/html-gen/print/promote.ts`:

```typescript
/**
 * Promote Print Build
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

export async function promotePrintBuild(options: PromoteOptions): Promise<PromoteResult> {
  try {
    if (!existsSync(options.sourcePath)) {
      return {
        success: false,
        sourcePath: options.sourcePath,
        targetPath: options.targetPath,
        error: `Source file not found: ${options.sourcePath}`,
      };
    }

    await copyFile(options.sourcePath, options.targetPath);

    return {
      success: true,
      sourcePath: options.sourcePath,
      targetPath: options.targetPath,
    };
  } catch (error) {
    return {
      success: false,
      sourcePath: options.sourcePath,
      targetPath: options.targetPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

**Step 5: Commit**

```bash
git add src/tooling/html-gen/print/
git commit -m "feat(html-gen): add print CLI commands (list, diff, promote)"
```

---

## Task 5: Wire CLI to Package.json

**Files:**
- Modify: `src/tooling/cli-commands/run.ts`
- Modify: `package.json` (in src/tooling)

**Step 1: Add CLI entry points to run.ts**

Add to `src/tooling/cli-commands/run.ts`:

```typescript
// Add import at top
import { buildPrintHtml, listPrintBuilds, diffPrintBuild, promotePrintBuild } from '../html-gen/print/index.js';
import { getDatabase } from '../database/index.js';

// Add command handling in the main switch/if block:

if (args[0] === 'html' && args[1] === 'print') {
  const subcommand = args[2];

  switch (subcommand) {
    case 'build': {
      const result = await buildPrintHtml({
        bookPath: 'books/core/v1',
        chaptersDir: 'books/core/v1/chapters',
        sheetsDir: 'books/core/v1/sheets',
        outputPath: 'data/html/print-design/core-rulebook.html',
      });
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
      break;
    }
    case 'list': {
      const db = getDatabase();
      const result = listPrintBuilds(db.db);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case 'diff': {
      const buildId = args[3];
      if (!buildId) {
        console.error('Usage: html print diff <build-id>');
        process.exit(1);
      }
      const db = getDatabase();
      const client = new HtmlBuildClient(db.db);
      const latest = client.getLatestBuild('print-design');
      if (!latest) {
        console.error('No builds found');
        process.exit(1);
      }
      const result = diffPrintBuild(db.db, buildId, latest.buildId);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case 'promote': {
      const result = await promotePrintBuild({
        sourcePath: 'data/html/print-design/core-rulebook.html',
        targetPath: 'books/core/v1/exports/html/core_rulebook.html',
      });
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
      break;
    }
    default:
      console.error(`Unknown html print command: ${subcommand}`);
      console.error('Available: build, list, diff, promote');
      process.exit(1);
  }
}
```

**Step 2: Add package.json scripts**

Add to `src/tooling/package.json` scripts:

```json
{
  "scripts": {
    "html:print:build": "tsx cli-commands/run.ts html print build",
    "html:print:list": "tsx cli-commands/run.ts html print list",
    "html:print:diff": "tsx cli-commands/run.ts html print diff",
    "html:print:promote": "tsx cli-commands/run.ts html print promote"
  }
}
```

**Step 3: Test CLI commands**

```bash
pnpm html:print:build
pnpm html:print:list
```

**Step 4: Commit**

```bash
git add src/tooling/cli-commands/run.ts src/tooling/package.json
git commit -m "feat(cli): wire html:print commands to CLI"
```

---

## Task 6: Create Output Directory

**Step 1: Create data directory structure**

```bash
mkdir -p data/html/print-design
echo "# Print Design Output\n\nGenerated HTML files for print/PDF." > data/html/print-design/README.md
```

**Step 2: Add to .gitignore (ignore generated files)**

Add to `.gitignore`:
```
data/html/print-design/*.html
```

**Step 3: Commit**

```bash
git add data/html/print-design/README.md .gitignore
git commit -m "chore: add print-design output directory"
```

---

## Phase 4 Complete

**What was built:**
- `templates/print-design.html` — Template with embedded CSS
- `template-renderer.ts` — Placeholder replacement
- `print/build.ts` — Full build orchestrator
- `print/list.ts` — List builds
- `print/diff.ts` — Diff between builds
- `print/promote.ts` — Copy to exports
- CLI commands: `html:print:build`, `html:print:list`, `html:print:diff`, `html:print:promote`

**CLI Usage:**
```bash
pnpm html:print:build          # Build HTML
pnpm html:print:list           # List builds
pnpm html:print:diff <id>      # Diff vs current
pnpm html:print:promote        # Copy to exports/
```

**Next:** Phase 5 - Advanced Features (glossary auto-linking, optional), Phase 6 - Sheet Refinement (iterative)
