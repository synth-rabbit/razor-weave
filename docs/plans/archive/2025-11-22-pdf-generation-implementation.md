# PDF Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pdfkit-based pipeline that transforms the print-design HTML into a bold, retro-futurist PDF suitable for website preview download.

**Architecture:** Parse HTML with cheerio to extract structured content, then render page-by-page with pdfkit using custom renderers for each content type (cover, chapters, callouts, sheets). Typography uses Space Grotesk, Inter, and JetBrains Mono with chrome gradient effects for chapter numbers.

**Tech Stack:** pdfkit, svg-to-pdfkit, cheerio, TypeScript

---

## Phase 1: Foundation

### Task 1.1: Create PDF Generation Directory Structure

**Files:**
- Create: `src/tooling/pdf-gen/index.ts`
- Create: `src/tooling/pdf-gen/types.ts`

**Step 1: Create the directory and index file**

```typescript
// src/tooling/pdf-gen/index.ts
export * from './types';
```

**Step 2: Create types file with core interfaces**

```typescript
// src/tooling/pdf-gen/types.ts
export type PageType = 'cover' | 'toc' | 'part' | 'chapter-opener' | 'content' | 'sheet';

export interface PageState {
  currentPage: number;
  currentChapter: string;
  yPosition: number;
  pageType: PageType;
  columnWidth: number;
}

export interface PDFConfig {
  pageWidth: number;      // 612 points (8.5")
  pageHeight: number;     // 792 points (11")
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  liveArea: {
    width: number;
    height: number;
  };
}

export interface ChapterContent {
  number: number;
  title: string;
  slug: string;
  sections: SectionContent[];
}

export interface SectionContent {
  level: 2 | 3 | 4;
  title: string;
  id: string;
  content: ContentBlock[];
}

export interface ContentBlock {
  type: 'paragraph' | 'example' | 'gm' | 'table' | 'list' | 'hr';
  content: string | TableData | ListData;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ListData {
  ordered: boolean;
  items: string[];
}

export interface TOCEntry {
  level: number;
  title: string;
  pageNumber: number;
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/pdf-gen/
git commit -m "feat(pdf-gen): add directory structure and core types"
```

---

### Task 1.2: Add pdfkit Dependencies

**Files:**
- Modify: `src/tooling/package.json`

**Step 1: Add pdfkit and related packages**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling add pdfkit svg-to-pdfkit cheerio`

**Step 2: Add type definitions**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling add -D @types/pdfkit`

**Step 3: Verify installation**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/package.json pnpm-lock.yaml
git commit -m "deps(pdf-gen): add pdfkit, svg-to-pdfkit, cheerio"
```

---

### Task 1.3: Create Color System Constants

**Files:**
- Create: `src/tooling/pdf-gen/utils/colors.ts`

**Step 1: Create colors utility with synthwave palette**

```typescript
// src/tooling/pdf-gen/utils/colors.ts

/**
 * Synthwave color system for PDF generation.
 * All colors in hex format for pdfkit compatibility.
 */
export const colors = {
  // Core Synthwave Colors
  electricBlue: '#00D9FF',
  hotPink: '#FF006E',
  deepPurple: '#7B2CBF',

  // Neutrals
  inkBlack: '#1A1A1A',
  mediumGray: '#6B6B6B',
  borderGray: '#E0E0E0',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',
  offWhite: '#FAFAFA',

  // Tinted Backgrounds
  lightBlue: '#E5FAFF',
  lightPink: '#FFE5F3',
  lightPurple: '#F3E5FF',

  // Dark Backgrounds
  darkPurple: '#1A0A2E',
  black: '#000000',

  // Semantic
  success: '#2D7A4F',
  caution: '#B88A2E',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Get a color value by name.
 */
export function getColor(name: ColorName): string {
  return colors[name];
}

/**
 * Create a gradient stop array for chrome text effect.
 * Returns stops for cyan → white → magenta.
 */
export function chromeGradientStops(): Array<{ offset: number; color: string }> {
  return [
    { offset: 0, color: colors.electricBlue },
    { offset: 0.5, color: colors.white },
    { offset: 1, color: colors.hotPink },
  ];
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/pdf-gen/utils/
git commit -m "feat(pdf-gen): add synthwave color system"
```

---

### Task 1.4: Create Layout Constants and Utilities

**Files:**
- Create: `src/tooling/pdf-gen/utils/layout.ts`
- Create: `src/tooling/pdf-gen/utils/index.ts`

**Step 1: Create layout utilities**

```typescript
// src/tooling/pdf-gen/utils/layout.ts
import type { PDFConfig, PageState } from '../types';

/**
 * Default PDF configuration for US Letter size.
 */
export const defaultConfig: PDFConfig = {
  pageWidth: 612,   // 8.5" at 72 DPI
  pageHeight: 792,  // 11" at 72 DPI
  margins: {
    top: 54,        // 0.75"
    right: 54,
    bottom: 54,
    left: 54,
  },
  liveArea: {
    width: 504,     // 612 - 54 - 54
    height: 684,    // 792 - 54 - 54
  },
};

/**
 * Grid system: 12 columns within live area.
 */
export const grid = {
  columns: 12,
  columnWidth: 42,  // 504 / 12
  gutter: 18,
  bodyColumns: 8,   // Body text spans 8 columns
  bodyWidth: 336,   // 8 * 42
} as const;

/**
 * Typography sizes in points.
 */
export const typography = {
  display: { min: 144, max: 200 },  // Chapter numbers
  chapterTitle: 36,
  h2: 24,
  h3: 18,
  h4: 14,
  body: 11,
  caption: 9,
  code: 10,
  leading: {
    body: 16,       // 11pt * 1.45
    heading: 1.1,   // multiplier
  },
  paragraphSpacing: 11,
} as const;

/**
 * Create initial page state.
 */
export function createPageState(): PageState {
  return {
    currentPage: 0,
    currentChapter: '',
    yPosition: defaultConfig.margins.top,
    pageType: 'content',
    columnWidth: grid.bodyWidth,
  };
}

/**
 * Check if content fits on current page.
 */
export function fitsOnPage(
  state: PageState,
  contentHeight: number,
  config: PDFConfig = defaultConfig
): boolean {
  const bottomLimit = config.pageHeight - config.margins.bottom;
  return state.yPosition + contentHeight <= bottomLimit;
}

/**
 * Get Y position for starting content on a new page.
 */
export function getContentStartY(config: PDFConfig = defaultConfig): number {
  return config.margins.top;
}

/**
 * Get X position for body content (centered).
 */
export function getBodyContentX(config: PDFConfig = defaultConfig): number {
  // Center the body content (336pt) within live area (504pt)
  const offset = (config.liveArea.width - grid.bodyWidth) / 2;
  return config.margins.left + offset;
}
```

**Step 2: Create utils index**

```typescript
// src/tooling/pdf-gen/utils/index.ts
export * from './colors';
export * from './layout';
```

**Step 3: Update main index**

```typescript
// src/tooling/pdf-gen/index.ts
export * from './types';
export * from './utils';
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/tooling/pdf-gen/
git commit -m "feat(pdf-gen): add layout utilities and grid system"
```

---

### Task 1.5: Download and Set Up Fonts

**Files:**
- Create: `src/tooling/pdf-gen/fonts/.gitkeep`
- Create: `src/tooling/pdf-gen/utils/fonts.ts`

**Step 1: Create fonts directory**

```bash
mkdir -p /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen/src/tooling/pdf-gen/fonts
touch /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen/src/tooling/pdf-gen/fonts/.gitkeep
```

**Step 2: Download fonts from Google Fonts**

```bash
cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen/src/tooling/pdf-gen/fonts

# Space Grotesk
curl -L "https://github.com/nickshanks/Sark/raw/master/fonts/TTF/SpaceGrotesk-Medium.ttf" -o SpaceGrotesk-Medium.ttf 2>/dev/null || echo "Download Space Grotesk manually from Google Fonts"
curl -L "https://github.com/nickshanks/Sark/raw/master/fonts/TTF/SpaceGrotesk-SemiBold.ttf" -o SpaceGrotesk-SemiBold.ttf 2>/dev/null || echo "Download manually"
curl -L "https://github.com/nickshanks/Sark/raw/master/fonts/TTF/SpaceGrotesk-Bold.ttf" -o SpaceGrotesk-Bold.ttf 2>/dev/null || echo "Download manually"

# Note: If curl fails, download from:
# - Space Grotesk: https://fonts.google.com/specimen/Space+Grotesk
# - Inter: https://fonts.google.com/specimen/Inter
# - JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono
```

**Step 3: Create fonts utility**

```typescript
// src/tooling/pdf-gen/utils/fonts.ts
import path from 'path';
import fs from 'fs';

const FONTS_DIR = path.join(__dirname, '../fonts');

export interface FontDefinition {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  path: string;
}

/**
 * Font file paths - assumes fonts are downloaded to fonts/ directory.
 * If fonts are missing, the pipeline will fall back to system fonts.
 */
export const fontPaths = {
  spaceGrotesk: {
    medium: path.join(FONTS_DIR, 'SpaceGrotesk-Medium.ttf'),
    semiBold: path.join(FONTS_DIR, 'SpaceGrotesk-SemiBold.ttf'),
    bold: path.join(FONTS_DIR, 'SpaceGrotesk-Bold.ttf'),
  },
  inter: {
    regular: path.join(FONTS_DIR, 'Inter-Regular.ttf'),
    medium: path.join(FONTS_DIR, 'Inter-Medium.ttf'),
    semiBold: path.join(FONTS_DIR, 'Inter-SemiBold.ttf'),
  },
  jetBrainsMono: {
    regular: path.join(FONTS_DIR, 'JetBrainsMono-Regular.ttf'),
    medium: path.join(FONTS_DIR, 'JetBrainsMono-Medium.ttf'),
  },
} as const;

/**
 * Check if a font file exists.
 */
export function fontExists(fontPath: string): boolean {
  return fs.existsSync(fontPath);
}

/**
 * Get available fonts, falling back to system fonts if custom fonts missing.
 */
export function getAvailableFonts(): {
  heading: string;
  body: string;
  mono: string;
} {
  const hasSpaceGrotesk = fontExists(fontPaths.spaceGrotesk.bold);
  const hasInter = fontExists(fontPaths.inter.regular);
  const hasJetBrains = fontExists(fontPaths.jetBrainsMono.regular);

  return {
    heading: hasSpaceGrotesk ? fontPaths.spaceGrotesk.bold : 'Helvetica-Bold',
    body: hasInter ? fontPaths.inter.regular : 'Helvetica',
    mono: hasJetBrains ? fontPaths.jetBrainsMono.regular : 'Courier',
  };
}

/**
 * Register custom fonts with a PDFKit document.
 */
export function registerFonts(doc: PDFKit.PDFDocument): void {
  // Space Grotesk
  if (fontExists(fontPaths.spaceGrotesk.medium)) {
    doc.registerFont('SpaceGrotesk-Medium', fontPaths.spaceGrotesk.medium);
  }
  if (fontExists(fontPaths.spaceGrotesk.semiBold)) {
    doc.registerFont('SpaceGrotesk-SemiBold', fontPaths.spaceGrotesk.semiBold);
  }
  if (fontExists(fontPaths.spaceGrotesk.bold)) {
    doc.registerFont('SpaceGrotesk-Bold', fontPaths.spaceGrotesk.bold);
  }

  // Inter
  if (fontExists(fontPaths.inter.regular)) {
    doc.registerFont('Inter-Regular', fontPaths.inter.regular);
  }
  if (fontExists(fontPaths.inter.medium)) {
    doc.registerFont('Inter-Medium', fontPaths.inter.medium);
  }
  if (fontExists(fontPaths.inter.semiBold)) {
    doc.registerFont('Inter-SemiBold', fontPaths.inter.semiBold);
  }

  // JetBrains Mono
  if (fontExists(fontPaths.jetBrainsMono.regular)) {
    doc.registerFont('JetBrainsMono-Regular', fontPaths.jetBrainsMono.regular);
  }
  if (fontExists(fontPaths.jetBrainsMono.medium)) {
    doc.registerFont('JetBrainsMono-Medium', fontPaths.jetBrainsMono.medium);
  }
}
```

**Step 4: Update utils index**

```typescript
// src/tooling/pdf-gen/utils/index.ts
export * from './colors';
export * from './layout';
export * from './fonts';
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors (may have warnings about missing fonts, that's OK)

**Step 6: Commit**

```bash
git add src/tooling/pdf-gen/
git commit -m "feat(pdf-gen): add font utilities and directory structure"
```

---

### Task 1.6: Create Basic PDF Document Factory

**Files:**
- Create: `src/tooling/pdf-gen/document.ts`
- Create: `src/tooling/pdf-gen/document.test.ts`

**Step 1: Write the failing test**

```typescript
// src/tooling/pdf-gen/document.test.ts
import { describe, it, expect } from 'vitest';
import { createPDFDocument } from './document';
import { defaultConfig } from './utils/layout';

describe('createPDFDocument', () => {
  it('creates a PDF document with US Letter dimensions', () => {
    const doc = createPDFDocument();

    // PDFKit stores page size in options
    expect(doc.options.size).toEqual([defaultConfig.pageWidth, defaultConfig.pageHeight]);
  });

  it('creates a document with metadata', () => {
    const doc = createPDFDocument({
      title: 'Test PDF',
      author: 'Test Author',
    });

    // Metadata is set via info property
    expect(doc.info.Title).toBe('Test PDF');
    expect(doc.info.Author).toBe('Test Author');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm vitest run src/tooling/pdf-gen/document.test.ts`
Expected: FAIL with "Cannot find module './document'"

**Step 3: Write minimal implementation**

```typescript
// src/tooling/pdf-gen/document.ts
import PDFDocument from 'pdfkit';
import { defaultConfig } from './utils/layout';
import { registerFonts } from './utils/fonts';

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

/**
 * Create a new PDF document with standard configuration.
 */
export function createPDFDocument(metadata?: PDFMetadata): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: [defaultConfig.pageWidth, defaultConfig.pageHeight],
    margins: defaultConfig.margins,
    bufferPages: true, // Enable page buffering for TOC backfill
    info: {
      Title: metadata?.title ?? 'Razorweave Core Rulebook',
      Author: metadata?.author ?? 'Panda Edwards',
      Subject: metadata?.subject ?? 'Tabletop Roleplaying Game',
      Keywords: metadata?.keywords?.join(', ') ?? 'TTRPG, RPG, Razorweave',
      Creator: 'Razorweave PDF Generator',
      Producer: 'pdfkit',
    },
  });

  // Register custom fonts
  registerFonts(doc);

  return doc;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm vitest run src/tooling/pdf-gen/document.test.ts`
Expected: PASS

**Step 5: Update index exports**

```typescript
// src/tooling/pdf-gen/index.ts
export * from './types';
export * from './utils';
export * from './document';
```

**Step 6: Commit**

```bash
git add src/tooling/pdf-gen/
git commit -m "feat(pdf-gen): add PDF document factory with metadata support"
```

---

## Phase 2: HTML Parser

### Task 2.1: Create HTML Parser Module

**Files:**
- Create: `src/tooling/pdf-gen/parser.ts`
- Create: `src/tooling/pdf-gen/parser.test.ts`

**Step 1: Write the failing test**

```typescript
// src/tooling/pdf-gen/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseHTML, extractChapters } from './parser';

const sampleHTML = `
<!DOCTYPE html>
<html>
<body>
  <main>
    <section id="ch-01-welcome">
      <h2>1. Welcome to Razorweave</h2>
      <p>This is the introduction.</p>
      <div class="example">
        <strong>Example</strong>
        <p>An example block.</p>
      </div>
    </section>
    <section id="ch-02-core-concepts">
      <h2>2. Core Concepts</h2>
      <p>Core concepts content.</p>
      <div class="gm">
        <strong>GM Guidance</strong>
        <p>A GM box.</p>
      </div>
    </section>
  </main>
</body>
</html>
`;

describe('parseHTML', () => {
  it('loads and parses HTML content', () => {
    const $ = parseHTML(sampleHTML);
    expect($('section').length).toBe(2);
  });
});

describe('extractChapters', () => {
  it('extracts chapter data from HTML', () => {
    const $ = parseHTML(sampleHTML);
    const chapters = extractChapters($);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].number).toBe(1);
    expect(chapters[0].title).toBe('Welcome to Razorweave');
    expect(chapters[0].slug).toBe('ch-01-welcome');
  });

  it('extracts content blocks from chapters', () => {
    const $ = parseHTML(sampleHTML);
    const chapters = extractChapters($);

    // First chapter has a paragraph and an example
    const ch1Content = chapters[0].sections[0].content;
    expect(ch1Content.some(b => b.type === 'paragraph')).toBe(true);
    expect(ch1Content.some(b => b.type === 'example')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm vitest run src/tooling/pdf-gen/parser.test.ts`
Expected: FAIL with "Cannot find module './parser'"

**Step 3: Write minimal implementation**

```typescript
// src/tooling/pdf-gen/parser.ts
import * as cheerio from 'cheerio';
import type { ChapterContent, SectionContent, ContentBlock, TableData, ListData } from './types';

export type CheerioAPI = ReturnType<typeof cheerio.load>;

/**
 * Parse HTML string into a cheerio instance.
 */
export function parseHTML(html: string): CheerioAPI {
  return cheerio.load(html);
}

/**
 * Load and parse HTML from a file path.
 */
export async function parseHTMLFile(filePath: string): Promise<CheerioAPI> {
  const fs = await import('fs/promises');
  const html = await fs.readFile(filePath, 'utf-8');
  return parseHTML(html);
}

/**
 * Extract chapter data from parsed HTML.
 */
export function extractChapters($: CheerioAPI): ChapterContent[] {
  const chapters: ChapterContent[] = [];

  $('section[id^="ch-"]').each((_, element) => {
    const $section = $(element);
    const id = $section.attr('id') ?? '';
    const h2 = $section.find('> h2').first();
    const titleText = h2.text().trim();

    // Parse "N. Title" format
    const match = titleText.match(/^(\d+)\.\s*(.+)$/);
    if (!match) return;

    const [, numStr, title] = match;
    const number = parseInt(numStr, 10);

    const sections = extractSections($, $section);

    chapters.push({
      number,
      title,
      slug: id,
      sections,
    });
  });

  return chapters.sort((a, b) => a.number - b.number);
}

/**
 * Extract sections (h3/h4 based) from a chapter.
 */
function extractSections($: CheerioAPI, $chapter: cheerio.Cheerio<cheerio.Element>): SectionContent[] {
  // For simplicity, treat the entire chapter as one section initially
  // A more sophisticated version would split by h3/h4
  const content = extractContentBlocks($, $chapter);

  const h2 = $chapter.find('> h2').first();
  const title = h2.text().replace(/^\d+\.\s*/, '').trim();

  return [{
    level: 2,
    title,
    id: $chapter.attr('id') ?? '',
    content,
  }];
}

/**
 * Extract content blocks from an element.
 */
function extractContentBlocks($: CheerioAPI, $parent: cheerio.Cheerio<cheerio.Element>): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  $parent.children().each((_, child) => {
    const $child = $(child);
    const tagName = child.tagName?.toLowerCase();

    if (tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      // Skip headings, they're handled separately
      return;
    }

    if (tagName === 'p') {
      blocks.push({
        type: 'paragraph',
        content: $child.text().trim(),
      });
    } else if ($child.hasClass('example')) {
      blocks.push({
        type: 'example',
        content: extractBoxContent($, $child),
      });
    } else if ($child.hasClass('gm')) {
      blocks.push({
        type: 'gm',
        content: extractBoxContent($, $child),
      });
    } else if (tagName === 'table') {
      blocks.push({
        type: 'table',
        content: extractTableData($, $child),
      });
    } else if (tagName === 'ul' || tagName === 'ol') {
      blocks.push({
        type: 'list',
        content: extractListData($, $child, tagName === 'ol'),
      });
    } else if (tagName === 'hr') {
      blocks.push({
        type: 'hr',
        content: '',
      });
    } else if (tagName === 'div' || tagName === 'section') {
      // Recursively extract from nested containers
      blocks.push(...extractContentBlocks($, $child));
    }
  });

  return blocks;
}

/**
 * Extract text content from an example or GM box.
 */
function extractBoxContent($: CheerioAPI, $box: cheerio.Cheerio<cheerio.Element>): string {
  // Remove the title (strong/b element) and get remaining text
  const $clone = $box.clone();
  $clone.find('strong, b').first().remove();
  return $clone.text().trim();
}

/**
 * Extract table data from a table element.
 */
function extractTableData($: CheerioAPI, $table: cheerio.Cheerio<cheerio.Element>): TableData {
  const headers: string[] = [];
  const rows: string[][] = [];

  $table.find('thead th, thead td').each((_, th) => {
    headers.push($(th).text().trim());
  });

  // If no thead, use first row as headers
  if (headers.length === 0) {
    $table.find('tr').first().find('th, td').each((_, cell) => {
      headers.push($(cell).text().trim());
    });
  }

  $table.find('tbody tr, tr').each((i, tr) => {
    // Skip header row if no thead
    if (headers.length > 0 && i === 0 && $table.find('thead').length === 0) return;

    const row: string[] = [];
    $(tr).find('td, th').each((_, td) => {
      row.push($(td).text().trim());
    });
    if (row.length > 0) {
      rows.push(row);
    }
  });

  return { headers, rows };
}

/**
 * Extract list data from ul/ol element.
 */
function extractListData($: CheerioAPI, $list: cheerio.Cheerio<cheerio.Element>, ordered: boolean): ListData {
  const items: string[] = [];
  $list.find('> li').each((_, li) => {
    items.push($(li).text().trim());
  });
  return { ordered, items };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm vitest run src/tooling/pdf-gen/parser.test.ts`
Expected: PASS

**Step 5: Update index exports**

```typescript
// src/tooling/pdf-gen/index.ts
export * from './types';
export * from './utils';
export * from './document';
export * from './parser';
```

**Step 6: Commit**

```bash
git add src/tooling/pdf-gen/
git commit -m "feat(pdf-gen): add HTML parser with chapter extraction"
```

---

## Phase 3: Basic Renderers

### Task 3.1: Create Text Renderer

**Files:**
- Create: `src/tooling/pdf-gen/renderers/text.ts`
- Create: `src/tooling/pdf-gen/renderers/index.ts`

**Step 1: Create text renderer**

```typescript
// src/tooling/pdf-gen/renderers/text.ts
import type PDFDocument from 'pdfkit';
import { colors } from '../utils/colors';
import { typography, getBodyContentX, defaultConfig } from '../utils/layout';

export interface TextOptions {
  font?: string;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineGap?: number;
  width?: number;
}

/**
 * Render body paragraph text.
 */
export function renderParagraph(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  options: TextOptions = {}
): number {
  const {
    font = 'Inter-Regular',
    fontSize = typography.body,
    color = colors.inkBlack,
    align = 'left',
    lineGap = typography.leading.body - typography.body,
    width = 336, // body width
  } = options;

  const x = getBodyContentX();

  doc
    .font(font)
    .fontSize(fontSize)
    .fillColor(color)
    .text(text, x, y, {
      width,
      align,
      lineGap,
    });

  // Return new Y position after text
  return doc.y + typography.paragraphSpacing;
}

/**
 * Render a heading (h2, h3, h4).
 */
export function renderHeading(
  doc: PDFKit.PDFDocument,
  text: string,
  level: 2 | 3 | 4,
  y: number
): number {
  const configs: Record<2 | 3 | 4, { font: string; size: number; color: string; marginTop: number }> = {
    2: {
      font: 'SpaceGrotesk-SemiBold',
      size: typography.h2,
      color: colors.electricBlue,
      marginTop: 36,
    },
    3: {
      font: 'SpaceGrotesk-SemiBold',
      size: typography.h3,
      color: colors.hotPink,
      marginTop: 24,
    },
    4: {
      font: 'SpaceGrotesk-Medium',
      size: typography.h4,
      color: colors.hotPink,
      marginTop: 18,
    },
  };

  const config = configs[level];
  const x = getBodyContentX();

  // Add top margin
  const adjustedY = y + config.marginTop;

  doc
    .font(config.font)
    .fontSize(config.size)
    .fillColor(config.color)
    .text(text, x, adjustedY, {
      width: 336,
    });

  // Return Y position with bottom margin
  return doc.y + (level === 2 ? 12 : 8);
}

/**
 * Render large display text (for chapter numbers).
 */
export function renderDisplayText(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  options: {
    fontSize?: number;
    color?: string;
    align?: 'left' | 'center' | 'right';
  } = {}
): number {
  const {
    fontSize = typography.display.min,
    color = colors.electricBlue,
    align = 'center',
  } = options;

  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(fontSize)
    .fillColor(color)
    .text(text, defaultConfig.margins.left, y, {
      width: defaultConfig.liveArea.width,
      align,
    });

  return doc.y;
}
```

**Step 2: Create renderers index**

```typescript
// src/tooling/pdf-gen/renderers/index.ts
export * from './text';
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/pdf-gen/renderers/
git commit -m "feat(pdf-gen): add text rendering utilities"
```

---

### Task 3.2: Create Callout Box Renderer

**Files:**
- Create: `src/tooling/pdf-gen/renderers/callouts.ts`

**Step 1: Create callout renderer**

```typescript
// src/tooling/pdf-gen/renderers/callouts.ts
import type PDFDocument from 'pdfkit';
import { colors } from '../utils/colors';
import { typography, getBodyContentX, defaultConfig } from '../utils/layout';

export interface CalloutOptions {
  title?: string;
  width?: number;
}

/**
 * Render an Example box (blue accent, light background).
 */
export function renderExampleBox(
  doc: PDFKit.PDFDocument,
  content: string,
  y: number,
  options: CalloutOptions = {}
): number {
  const { title = 'Example', width = 400 } = options;
  const x = getBodyContentX();
  const padding = 18;
  const borderWidth = 4;

  // Measure content height
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, { width: width - padding * 2 - borderWidth });
  const titleHeight = 18;
  const totalHeight = padding * 2 + titleHeight + contentHeight;

  // Background
  doc
    .rect(x, y, width, totalHeight)
    .fill(colors.lightBlue);

  // Left border
  doc
    .rect(x, y, borderWidth, totalHeight)
    .fill(colors.electricBlue);

  // Title
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(12)
    .fillColor(colors.electricBlue)
    .text(title, x + padding + borderWidth, y + padding, {
      width: width - padding * 2 - borderWidth,
    });

  // Content
  doc
    .font('Inter-Regular')
    .fontSize(10)
    .fillColor(colors.inkBlack)
    .text(content, x + padding + borderWidth, y + padding + titleHeight, {
      width: width - padding * 2 - borderWidth,
      lineGap: 4,
    });

  return y + totalHeight + 24; // Add bottom margin
}

/**
 * Render a GM Guidance box (pink accent, dark background).
 */
export function renderGMBox(
  doc: PDFKit.PDFDocument,
  content: string,
  y: number,
  options: CalloutOptions = {}
): number {
  const { title = 'GM Guidance', width = 400 } = options;
  const x = getBodyContentX();
  const padding = 18;
  const borderWidth = 4;

  // Measure content height
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, { width: width - padding * 2 - borderWidth });
  const titleHeight = 18;
  const totalHeight = padding * 2 + titleHeight + contentHeight;

  // Dark background
  doc
    .rect(x, y, width, totalHeight)
    .fill(colors.darkPurple);

  // Left border (hot pink)
  doc
    .rect(x, y, borderWidth, totalHeight)
    .fill(colors.hotPink);

  // Title
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(12)
    .fillColor(colors.hotPink)
    .text(title, x + padding + borderWidth, y + padding, {
      width: width - padding * 2 - borderWidth,
    });

  // Content (white text on dark background)
  doc
    .font('Inter-Regular')
    .fontSize(10)
    .fillColor(colors.white)
    .text(content, x + padding + borderWidth, y + padding + titleHeight, {
      width: width - padding * 2 - borderWidth,
      lineGap: 4,
    });

  return y + totalHeight + 24; // Add bottom margin
}
```

**Step 2: Update renderers index**

```typescript
// src/tooling/pdf-gen/renderers/index.ts
export * from './text';
export * from './callouts';
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/pdf-gen/renderers/
git commit -m "feat(pdf-gen): add Example and GM box renderers"
```

---

### Task 3.3: Create Table Renderer

**Files:**
- Create: `src/tooling/pdf-gen/renderers/tables.ts`

**Step 1: Create table renderer**

```typescript
// src/tooling/pdf-gen/renderers/tables.ts
import type PDFDocument from 'pdfkit';
import { colors } from '../utils/colors';
import { getBodyContentX } from '../utils/layout';
import type { TableData } from '../types';

export interface TableOptions {
  width?: number;
  cellPadding?: { x: number; y: number };
}

/**
 * Render a table with alternating header colors.
 */
export function renderTable(
  doc: PDFKit.PDFDocument,
  data: TableData,
  y: number,
  options: TableOptions = {}
): number {
  const { width = 400, cellPadding = { x: 12, y: 8 } } = options;
  const x = getBodyContentX();

  const columnCount = data.headers.length || (data.rows[0]?.length ?? 0);
  if (columnCount === 0) return y;

  const columnWidth = width / columnCount;
  const headerColors = [colors.electricBlue, colors.hotPink];
  let currentY = y;

  // Render header row
  if (data.headers.length > 0) {
    const headerHeight = 28;

    data.headers.forEach((header, i) => {
      const cellX = x + i * columnWidth;
      const bgColor = headerColors[i % headerColors.length];

      // Header cell background
      doc
        .rect(cellX, currentY, columnWidth, headerHeight)
        .fill(bgColor);

      // Header text
      doc
        .font('SpaceGrotesk-SemiBold')
        .fontSize(10)
        .fillColor(colors.white)
        .text(header, cellX + cellPadding.x, currentY + cellPadding.y, {
          width: columnWidth - cellPadding.x * 2,
          height: headerHeight - cellPadding.y * 2,
        });
    });

    currentY += headerHeight;
  }

  // Render data rows
  data.rows.forEach((row, rowIndex) => {
    // Calculate row height based on content
    doc.font('Inter-Regular').fontSize(10);
    let maxHeight = 24;

    row.forEach((cell, i) => {
      const cellHeight = doc.heightOfString(cell, {
        width: columnWidth - cellPadding.x * 2,
      }) + cellPadding.y * 2;
      maxHeight = Math.max(maxHeight, cellHeight);
    });

    // Alternating row background
    const rowBg = rowIndex % 2 === 0 ? colors.white : colors.lightGray;
    doc
      .rect(x, currentY, width, maxHeight)
      .fill(rowBg);

    // Cell borders
    doc
      .rect(x, currentY, width, maxHeight)
      .stroke(colors.borderGray);

    // Cell content
    row.forEach((cell, i) => {
      const cellX = x + i * columnWidth;

      doc
        .font('Inter-Regular')
        .fontSize(10)
        .fillColor(colors.inkBlack)
        .text(cell, cellX + cellPadding.x, currentY + cellPadding.y, {
          width: columnWidth - cellPadding.x * 2,
        });
    });

    currentY += maxHeight;
  });

  return currentY + 18; // Add bottom margin
}
```

**Step 2: Update renderers index**

```typescript
// src/tooling/pdf-gen/renderers/index.ts
export * from './text';
export * from './callouts';
export * from './tables';
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/pdf-gen/renderers/
git commit -m "feat(pdf-gen): add table renderer with alternating header colors"
```

---

## Phase 4: Chapter Opener Renderer

### Task 4.1: Create Chapter Opener with Typographic Impact

**Files:**
- Create: `src/tooling/pdf-gen/renderers/chapter-opener.ts`
- Create: `src/tooling/pdf-gen/graphics/grid-background.ts`

**Step 1: Create grid background generator**

```typescript
// src/tooling/pdf-gen/graphics/grid-background.ts
import type PDFDocument from 'pdfkit';
import { colors } from '../utils/colors';
import { defaultConfig } from '../utils/layout';

/**
 * Draw a perspective grid background for chapter openers.
 */
export function drawPerspectiveGrid(
  doc: PDFKit.PDFDocument,
  options: {
    horizonY?: number;
    lineColor?: string;
    lineOpacity?: number;
  } = {}
): void {
  const {
    horizonY = defaultConfig.pageHeight * 0.4,
    lineColor = colors.electricBlue,
    lineOpacity = 0.3,
  } = options;

  const centerX = defaultConfig.pageWidth / 2;
  const bottomY = defaultConfig.pageHeight;

  doc.save();
  doc.opacity(lineOpacity);
  doc.strokeColor(lineColor);
  doc.lineWidth(0.5);

  // Vertical lines converging to horizon
  const lineCount = 20;
  const spread = defaultConfig.pageWidth * 1.5;

  for (let i = 0; i <= lineCount; i++) {
    const t = i / lineCount;
    const bottomX = centerX - spread / 2 + spread * t;

    doc
      .moveTo(centerX, horizonY)
      .lineTo(bottomX, bottomY)
      .stroke();
  }

  // Horizontal lines (perspective scaled)
  const horizontalLineCount = 15;
  for (let i = 1; i <= horizontalLineCount; i++) {
    const t = i / horizontalLineCount;
    const y = horizonY + (bottomY - horizonY) * t * t; // Exponential spacing
    const width = spread * t;
    const startX = centerX - width / 2;
    const endX = centerX + width / 2;

    doc
      .moveTo(startX, y)
      .lineTo(endX, y)
      .stroke();
  }

  doc.restore();
}

/**
 * Draw horizontal gradient stripe accent.
 */
export function drawGradientStripe(
  doc: PDFKit.PDFDocument,
  y: number,
  height: number = 4
): void {
  const gradient = doc.linearGradient(
    0, y,
    defaultConfig.pageWidth, y
  );

  gradient.stop(0, colors.electricBlue);
  gradient.stop(0.5, colors.hotPink);
  gradient.stop(1, colors.deepPurple);

  doc
    .rect(0, y, defaultConfig.pageWidth, height)
    .fill(gradient);
}
```

**Step 2: Create chapter opener renderer**

```typescript
// src/tooling/pdf-gen/renderers/chapter-opener.ts
import type PDFDocument from 'pdfkit';
import { colors } from '../utils/colors';
import { defaultConfig, typography } from '../utils/layout';
import { drawPerspectiveGrid, drawGradientStripe } from '../graphics/grid-background';

/**
 * Render a chapter opener page with typographic impact.
 */
export function renderChapterOpener(
  doc: PDFKit.PDFDocument,
  chapterNumber: number,
  title: string
): void {
  // Start new page
  doc.addPage();

  // Dark gradient background
  const gradient = doc.linearGradient(
    0, 0,
    0, defaultConfig.pageHeight
  );
  gradient.stop(0, colors.darkPurple);
  gradient.stop(1, colors.black);

  doc
    .rect(0, 0, defaultConfig.pageWidth, defaultConfig.pageHeight)
    .fill(gradient);

  // Perspective grid
  drawPerspectiveGrid(doc, {
    horizonY: defaultConfig.pageHeight * 0.35,
    lineOpacity: 0.2,
  });

  // Gradient stripe at 60% height
  const stripeY = defaultConfig.pageHeight * 0.6;
  drawGradientStripe(doc, stripeY, 4);

  // Chapter number - massive chrome text
  const numberStr = chapterNumber.toString();
  const fontSize = numberStr.length === 1 ? 200 : numberStr.length === 2 ? 160 : 120;
  const numberY = defaultConfig.pageHeight * 0.25;

  // Chrome gradient effect (simulate with layered text)
  // Layer 1: cyan shadow
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(fontSize)
    .fillColor(colors.electricBlue)
    .text(numberStr, 0, numberY + 2, {
      width: defaultConfig.pageWidth,
      align: 'center',
    });

  // Layer 2: white highlight
  doc
    .fillColor(colors.white)
    .text(numberStr, 0, numberY, {
      width: defaultConfig.pageWidth,
      align: 'center',
    });

  // Chapter title
  const titleY = stripeY + 40;
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(36)
    .fillColor(colors.white)
    .text(title.toUpperCase(), 0, titleY, {
      width: defaultConfig.pageWidth,
      align: 'center',
      characterSpacing: 2,
    });
}

/**
 * Render a part divider page (Parts I-IV).
 */
export function renderPartDivider(
  doc: PDFKit.PDFDocument,
  partNumber: string, // "I", "II", "III", "IV"
  partTitle: string
): void {
  // Start new page
  doc.addPage();

  // Dark gradient background
  const gradient = doc.linearGradient(
    0, 0,
    0, defaultConfig.pageHeight
  );
  gradient.stop(0, colors.darkPurple);
  gradient.stop(1, colors.black);

  doc
    .rect(0, 0, defaultConfig.pageWidth, defaultConfig.pageHeight)
    .fill(gradient);

  // Perspective grid (more prominent for part dividers)
  drawPerspectiveGrid(doc, {
    horizonY: defaultConfig.pageHeight * 0.3,
    lineOpacity: 0.35,
  });

  // "PART" label
  const labelY = defaultConfig.pageHeight * 0.3;
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(24)
    .fillColor(colors.electricBlue)
    .text('PART', 0, labelY, {
      width: defaultConfig.pageWidth,
      align: 'center',
      characterSpacing: 8,
    });

  // Part number (Roman numeral)
  const numberY = labelY + 50;
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(120)
    .fillColor(colors.white)
    .text(partNumber, 0, numberY, {
      width: defaultConfig.pageWidth,
      align: 'center',
    });

  // Part title
  const titleY = numberY + 140;
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(28)
    .fillColor(colors.hotPink)
    .text(partTitle, 0, titleY, {
      width: defaultConfig.pageWidth,
      align: 'center',
    });
}
```

**Step 3: Create graphics index and update renderers index**

```typescript
// src/tooling/pdf-gen/graphics/index.ts
export * from './grid-background';
```

```typescript
// src/tooling/pdf-gen/renderers/index.ts
export * from './text';
export * from './callouts';
export * from './tables';
export * from './chapter-opener';
```

**Step 4: Update main index**

```typescript
// src/tooling/pdf-gen/index.ts
export * from './types';
export * from './utils';
export * from './document';
export * from './parser';
export * from './renderers';
export * from './graphics';
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling exec tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/tooling/pdf-gen/
git commit -m "feat(pdf-gen): add chapter opener with perspective grid and chrome text"
```

---

## Phase 5: Main Pipeline

### Task 5.1: Create Pipeline Orchestrator

**Files:**
- Create: `src/tooling/pdf-gen/pipeline.ts`
- Create: `src/tooling/pdf-gen/pipeline.test.ts`

**Step 1: Write the failing test**

```typescript
// src/tooling/pdf-gen/pipeline.test.ts
import { describe, it, expect } from 'vitest';
import { generatePDF } from './pipeline';
import fs from 'fs';
import path from 'path';

describe('generatePDF', () => {
  it('generates a PDF file from HTML input', async () => {
    const htmlPath = path.join(__dirname, '../../__fixtures__/test-chapter.html');
    const outputPath = '/tmp/test-output.pdf';

    // Create test fixture if it doesn't exist
    if (!fs.existsSync(path.dirname(htmlPath))) {
      fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    }

    fs.writeFileSync(htmlPath, `
      <!DOCTYPE html>
      <html>
      <body>
        <main>
          <section id="ch-01-test">
            <h2>1. Test Chapter</h2>
            <p>This is test content.</p>
          </section>
        </main>
      </body>
      </html>
    `);

    await generatePDF(htmlPath, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);

    // Clean up
    fs.unlinkSync(outputPath);
    fs.unlinkSync(htmlPath);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm vitest run src/tooling/pdf-gen/pipeline.test.ts`
Expected: FAIL with "Cannot find module './pipeline'"

**Step 3: Write minimal implementation**

```typescript
// src/tooling/pdf-gen/pipeline.ts
import fs from 'fs';
import path from 'path';
import { createPDFDocument } from './document';
import { parseHTMLFile, extractChapters } from './parser';
import { renderChapterOpener } from './renderers/chapter-opener';
import { renderParagraph, renderHeading } from './renderers/text';
import { renderExampleBox, renderGMBox } from './renderers/callouts';
import { renderTable } from './renderers/tables';
import { defaultConfig, createPageState, fitsOnPage, getContentStartY } from './utils/layout';
import type { ChapterContent, ContentBlock, PageState, TableData, ListData } from './types';

export interface GeneratePDFOptions {
  title?: string;
  author?: string;
  skipChapterOpeners?: boolean;
}

/**
 * Generate a PDF from HTML source.
 */
export async function generatePDF(
  htmlPath: string,
  outputPath: string,
  options: GeneratePDFOptions = {}
): Promise<void> {
  const { title = 'Razorweave Core Rulebook', author = 'Panda Edwards' } = options;

  // Parse HTML
  const $ = await parseHTMLFile(htmlPath);
  const chapters = extractChapters($);

  // Create PDF document
  const doc = createPDFDocument({ title, author });

  // Create output stream
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Initialize page state
  let state = createPageState();

  // Render chapters
  for (const chapter of chapters) {
    state = await renderChapter(doc, chapter, state, options);
  }

  // Finalize document
  doc.end();

  // Wait for stream to finish
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Render a single chapter.
 */
async function renderChapter(
  doc: PDFKit.PDFDocument,
  chapter: ChapterContent,
  state: PageState,
  options: GeneratePDFOptions
): Promise<PageState> {
  // Chapter opener page
  if (!options.skipChapterOpeners) {
    renderChapterOpener(doc, chapter.number, chapter.title);
    state.currentPage++;
  }

  // Start content page
  doc.addPage();
  state.currentPage++;
  state.yPosition = getContentStartY();
  state.currentChapter = chapter.title;
  state.pageType = 'content';

  // Render sections
  for (const section of chapter.sections) {
    state = renderSection(doc, section, state);
  }

  return state;
}

/**
 * Render a section within a chapter.
 */
function renderSection(
  doc: PDFKit.PDFDocument,
  section: { level: number; title: string; content: ContentBlock[] },
  state: PageState
): PageState {
  // Render content blocks
  for (const block of section.content) {
    state = renderContentBlock(doc, block, state);
  }

  return state;
}

/**
 * Render a single content block.
 */
function renderContentBlock(
  doc: PDFKit.PDFDocument,
  block: ContentBlock,
  state: PageState
): PageState {
  // Check if we need a new page
  const estimatedHeight = estimateBlockHeight(doc, block);
  if (!fitsOnPage(state, estimatedHeight)) {
    doc.addPage();
    state.currentPage++;
    state.yPosition = getContentStartY();
  }

  switch (block.type) {
    case 'paragraph':
      state.yPosition = renderParagraph(doc, block.content as string, state.yPosition);
      break;

    case 'example':
      state.yPosition = renderExampleBox(doc, block.content as string, state.yPosition);
      break;

    case 'gm':
      state.yPosition = renderGMBox(doc, block.content as string, state.yPosition);
      break;

    case 'table':
      state.yPosition = renderTable(doc, block.content as TableData, state.yPosition);
      break;

    case 'list':
      state.yPosition = renderList(doc, block.content as ListData, state.yPosition);
      break;

    case 'hr':
      state.yPosition = renderHorizontalRule(doc, state.yPosition);
      break;
  }

  return state;
}

/**
 * Estimate the height of a content block.
 */
function estimateBlockHeight(doc: PDFKit.PDFDocument, block: ContentBlock): number {
  // Rough estimates - can be refined
  switch (block.type) {
    case 'paragraph':
      return 60;
    case 'example':
    case 'gm':
      return 120;
    case 'table':
      return 150;
    case 'list':
      return 80;
    case 'hr':
      return 40;
    default:
      return 50;
  }
}

/**
 * Render a list.
 */
function renderList(
  doc: PDFKit.PDFDocument,
  data: ListData,
  y: number
): number {
  const { colors } = require('./utils/colors');
  const { getBodyContentX } = require('./utils/layout');

  const x = getBodyContentX();
  let currentY = y;

  doc.font('Inter-Regular').fontSize(11).fillColor(colors.inkBlack);

  data.items.forEach((item, index) => {
    const bullet = data.ordered ? `${index + 1}.` : '\u25C6'; // Diamond for unordered
    const bulletWidth = 24;

    // Bullet
    doc
      .fillColor(colors.electricBlue)
      .text(bullet, x, currentY, { width: bulletWidth });

    // Item text
    doc
      .fillColor(colors.inkBlack)
      .text(item, x + bulletWidth, currentY, { width: 336 - bulletWidth });

    currentY = doc.y + 4;
  });

  return currentY + 11;
}

/**
 * Render a horizontal rule.
 */
function renderHorizontalRule(
  doc: PDFKit.PDFDocument,
  y: number
): number {
  const { colors } = require('./utils/colors');
  const { getBodyContentX } = require('./utils/layout');

  const x = getBodyContentX();
  const ruleY = y + 18;

  doc
    .strokeColor(colors.hotPink)
    .opacity(0.6)
    .lineWidth(2)
    .moveTo(x, ruleY)
    .lineTo(x + 336, ruleY)
    .stroke()
    .opacity(1);

  return ruleY + 18;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm vitest run src/tooling/pdf-gen/pipeline.test.ts`
Expected: PASS

**Step 5: Update index exports**

```typescript
// src/tooling/pdf-gen/index.ts
export * from './types';
export * from './utils';
export * from './document';
export * from './parser';
export * from './renderers';
export * from './graphics';
export * from './pipeline';
```

**Step 6: Commit**

```bash
git add src/tooling/pdf-gen/
git commit -m "feat(pdf-gen): add main pipeline orchestrator"
```

---

## Phase 6: CLI Integration

### Task 6.1: Create CLI Command

**Files:**
- Create: `src/tooling/pdf-gen/cli.ts`
- Modify: `src/tooling/cli/index.ts` (add pdf commands)

**Step 1: Create CLI module**

```typescript
// src/tooling/pdf-gen/cli.ts
import path from 'path';
import { generatePDF } from './pipeline';

export interface PDFBuildOptions {
  input?: string;
  output?: string;
  quick?: boolean;
}

const DEFAULT_INPUT = 'data/html/print-design/core-rulebook.html';
const DEFAULT_OUTPUT = 'data/pdfs/draft/core-rulebook.pdf';

/**
 * Build PDF from print-design HTML.
 */
export async function buildPDF(options: PDFBuildOptions = {}): Promise<void> {
  const {
    input = DEFAULT_INPUT,
    output = DEFAULT_OUTPUT,
    quick = false,
  } = options;

  const inputPath = path.resolve(process.cwd(), input);
  const outputPath = path.resolve(process.cwd(), output);

  console.log('Building PDF...');
  console.log(`  Input:  ${inputPath}`);
  console.log(`  Output: ${outputPath}`);

  const startTime = Date.now();

  await generatePDF(inputPath, outputPath, {
    skipChapterOpeners: quick,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nPDF generated successfully in ${duration}s`);
  console.log(`  Size: ${getFileSizeString(outputPath)}`);
}

/**
 * Get human-readable file size.
 */
function getFileSizeString(filePath: string): string {
  const fs = require('fs');
  const stats = fs.statSync(filePath);
  const bytes = stats.size;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * CLI entry point.
 */
export async function runCLI(args: string[]): Promise<void> {
  const command = args[0];

  switch (command) {
    case 'build':
      await buildPDF({
        quick: args.includes('--quick'),
      });
      break;

    default:
      console.log('Usage: pdf:build [--quick]');
      console.log('');
      console.log('Commands:');
      console.log('  build         Build PDF from print-design HTML');
      console.log('');
      console.log('Options:');
      console.log('  --quick       Skip chapter opener pages (faster)');
      break;
  }
}
```

**Step 2: Add npm script to package.json**

Add to `src/tooling/package.json` in the "scripts" section:

```json
{
  "scripts": {
    "pdf:build": "tsx pdf-gen/cli.ts build"
  }
}
```

**Step 3: Verify it runs**

Run: `cd /Users/pandorz/Documents/razorweave/.worktrees/pdf-gen && pnpm --filter @razorweave/tooling pdf:build --help`
Expected: Usage information printed

**Step 4: Commit**

```bash
git add src/tooling/pdf-gen/ src/tooling/package.json
git commit -m "feat(pdf-gen): add CLI interface for PDF generation"
```

---

## Summary

This implementation plan covers:

1. **Foundation** (Tasks 1.1-1.6): Directory structure, dependencies, colors, layout, fonts, document factory
2. **HTML Parser** (Task 2.1): cheerio-based parser with chapter extraction
3. **Basic Renderers** (Tasks 3.1-3.3): Text, callouts, tables
4. **Chapter Opener** (Task 4.1): Typographic impact with perspective grid
5. **Main Pipeline** (Task 5.1): Orchestrator that ties everything together
6. **CLI Integration** (Task 6.1): `pnpm pdf:build` command

**Not covered in this plan (future phases):**
- Cover page renderer (requires generated artwork)
- Table of Contents with page numbers
- Part divider pages
- Reference sheet custom renderers
- PDF bookmarks/outlines

Each task follows TDD (test first where applicable), includes exact file paths, complete code, and commit points.
