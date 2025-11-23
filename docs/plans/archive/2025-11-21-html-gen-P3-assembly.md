# HTML Generation Phase 3: Assembly Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build content assembly system: TOC generator, Index generator, Part structure handling, and chapter/sheet assembler.

**Architecture:** Read markdown files in order, apply transforms, generate TOC and Index, organize into 4-part structure, combine with template.

**Tech Stack:** TypeScript, unified/remark (from Phase 2), Node.js fs/promises

**Prerequisites:**
- Phase 1 complete (database, hashing)
- Phase 2 complete (transforms)

**Reference Design:** `docs/plans/2025-11-21-html-print-design-pipeline-design.md`

---

## Task 1: Create Chapter Reader

**Files:**
- Create: `src/tooling/html-gen/chapter-reader.ts`
- Create: `src/tooling/html-gen/chapter-reader.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/chapter-reader.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import {
  readChapters,
  readSheets,
  type ChapterFile,
} from './chapter-reader.js';

describe('chapter-reader', () => {
  const testDir = 'data/test-chapters';
  const chaptersDir = join(testDir, 'chapters');
  const sheetsDir = join(testDir, 'sheets');

  beforeEach(() => {
    mkdirSync(chaptersDir, { recursive: true });
    mkdirSync(sheetsDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('readChapters', () => {
    it('reads and orders chapters by number', async () => {
      writeFileSync(join(chaptersDir, '02-second.md'), '## 2. Second');
      writeFileSync(join(chaptersDir, '01-first.md'), '## 1. First');
      writeFileSync(join(chaptersDir, '10-tenth.md'), '## 10. Tenth');

      const chapters = await readChapters(chaptersDir);

      expect(chapters).toHaveLength(3);
      expect(chapters[0].number).toBe(1);
      expect(chapters[1].number).toBe(2);
      expect(chapters[2].number).toBe(10);
    });

    it('extracts chapter metadata from filename', async () => {
      writeFileSync(join(chaptersDir, '08-actions-checks-outcomes.md'), '## 8. Actions');

      const chapters = await readChapters(chaptersDir);

      expect(chapters[0].number).toBe(8);
      expect(chapters[0].slug).toBe('actions-checks-outcomes');
      expect(chapters[0].filePath).toContain('08-actions-checks-outcomes.md');
    });

    it('includes file content', async () => {
      writeFileSync(join(chaptersDir, '01-welcome.md'), '## 1. Welcome\n\nContent here.');

      const chapters = await readChapters(chaptersDir);

      expect(chapters[0].content).toBe('## 1. Welcome\n\nContent here.');
    });

    it('skips README.md', async () => {
      writeFileSync(join(chaptersDir, 'README.md'), '# Readme');
      writeFileSync(join(chaptersDir, '01-welcome.md'), '## 1. Welcome');

      const chapters = await readChapters(chaptersDir);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].slug).toBe('welcome');
    });
  });

  describe('readSheets', () => {
    it('reads sheets in defined order', async () => {
      writeFileSync(join(sheetsDir, 'core_rulebook_character_sheet.md'), '# Character Sheet');
      writeFileSync(join(sheetsDir, 'core_rulebook_session_log.md'), '# Session Log');
      writeFileSync(join(sheetsDir, 'core_rulebook_advancement_tracker.md'), '# Advancement');

      const sheets = await readSheets(sheetsDir);

      // Order should be: character_sheet, advancement_tracker, session_log
      expect(sheets[0].slug).toContain('character');
      expect(sheets[1].slug).toContain('advancement');
      expect(sheets[2].slug).toContain('session');
    });

    it('assigns sheet numbers (27.1, 27.2, etc)', async () => {
      writeFileSync(join(sheetsDir, 'core_rulebook_character_sheet.md'), '# Sheet');
      writeFileSync(join(sheetsDir, 'core_rulebook_advancement_tracker.md'), '# Sheet');

      const sheets = await readSheets(sheetsDir);

      expect(sheets[0].number).toBe(27.1);
      expect(sheets[1].number).toBe(27.2);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/chapter-reader.test.ts
```

**Step 3: Write the implementation**

Create `src/tooling/html-gen/chapter-reader.ts`:

```typescript
/**
 * Chapter Reader
 *
 * Reads markdown chapter and sheet files from disk.
 */

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';

export interface ChapterFile {
  number: number;
  slug: string;
  filePath: string;
  content: string;
}

/**
 * Sheet ordering - defines the canonical order for sheets
 */
const SHEET_ORDER = [
  'character_sheet',
  'advancement_tracker',
  'session_log',
  'gm_session_prep',
  'campaign_fronts_sheet',
  'npc_vpc_profile',
  'reference_tags_conditions',
  'reference_clocks_templates',
  'reference_dc_tiers',
];

/**
 * Parse chapter number and slug from filename
 * Input: "08-actions-checks-outcomes.md"
 * Output: { number: 8, slug: "actions-checks-outcomes" }
 */
function parseChapterFilename(filename: string): { number: number; slug: string } | null {
  const match = filename.match(/^(\d+)-(.+)\.md$/);
  if (!match) return null;

  return {
    number: parseInt(match[1], 10),
    slug: match[2],
  };
}

/**
 * Read all chapter files from a directory, sorted by chapter number
 */
export async function readChapters(chaptersDir: string): Promise<ChapterFile[]> {
  const files = await readdir(chaptersDir);

  const chapters: ChapterFile[] = [];

  for (const file of files) {
    if (file === 'README.md') continue;

    const parsed = parseChapterFilename(file);
    if (!parsed) continue;

    const filePath = join(chaptersDir, file);
    const content = await readFile(filePath, 'utf-8');

    chapters.push({
      number: parsed.number,
      slug: parsed.slug,
      filePath,
      content,
    });
  }

  return chapters.sort((a, b) => a.number - b.number);
}

/**
 * Read all sheet files from a directory, in canonical order
 */
export async function readSheets(sheetsDir: string): Promise<ChapterFile[]> {
  const files = await readdir(sheetsDir);

  const sheets: ChapterFile[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = join(sheetsDir, file);
    const content = await readFile(filePath, 'utf-8');

    // Extract slug from filename (e.g., "core_rulebook_character_sheet.md" -> "character_sheet")
    const slug = basename(file, '.md').replace(/^core_rulebook_/, '');

    // Find order index
    const orderIndex = SHEET_ORDER.findIndex(s => slug.includes(s));
    const sortOrder = orderIndex >= 0 ? orderIndex : 999;

    sheets.push({
      number: 27 + (sortOrder + 1) / 10, // 27.1, 27.2, etc
      slug,
      filePath,
      content,
      // @ts-expect-error - adding for sorting
      _sortOrder: sortOrder,
    });
  }

  // Sort by canonical order
  return sheets
    .sort((a, b) => (a as any)._sortOrder - (b as any)._sortOrder)
    .map(({ _sortOrder, ...sheet }) => sheet as ChapterFile);
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/chapter-reader.test.ts
```

**Step 5: Export and commit**

Add to `src/tooling/html-gen/index.ts`:
```typescript
export * from './chapter-reader.js';
```

```bash
git add src/tooling/html-gen/chapter-reader.ts src/tooling/html-gen/chapter-reader.test.ts src/tooling/html-gen/index.ts
git commit -m "feat(html-gen): add chapter and sheet reader"
```

---

## Task 2: Create TOC Generator

**Files:**
- Create: `src/tooling/html-gen/toc-generator.ts`
- Create: `src/tooling/html-gen/toc-generator.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/toc-generator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateToc, type TocEntry, PARTS } from './toc-generator.js';

describe('toc-generator', () => {
  describe('PARTS', () => {
    it('defines 4 parts with chapter ranges', () => {
      expect(PARTS).toHaveLength(4);
      expect(PARTS[0].chapters).toEqual([1, 13]);
      expect(PARTS[1].chapters).toEqual([14, 20]);
      expect(PARTS[2].chapters).toEqual([21, 26]);
      expect(PARTS[3].chapters).toEqual([27, 30]);
    });
  });

  describe('generateToc', () => {
    const sampleChapters = [
      { number: 1, title: 'Welcome', slug: 'welcome-to-the-game' },
      { number: 2, title: 'Core Concepts', slug: 'core-concepts' },
      { number: 14, title: 'Skills Overview', slug: 'skills-system-overview' },
      { number: 21, title: 'Running Sessions', slug: 'running-sessions' },
      { number: 28, title: 'Glossary', slug: 'glossary' },
    ];

    it('generates nested TOC with parts', () => {
      const toc = generateToc(sampleChapters);

      expect(toc).toHaveLength(4); // 4 parts
      expect(toc[0].type).toBe('part');
      expect(toc[0].title).toBe('Part I: Foundations');
    });

    it('groups chapters under correct parts', () => {
      const toc = generateToc(sampleChapters);

      // Part I should have chapters 1, 2
      const partI = toc[0];
      expect(partI.children).toHaveLength(2);
      expect(partI.children![0].number).toBe(1);

      // Part II should have chapter 14
      const partII = toc[1];
      expect(partII.children).toHaveLength(1);
      expect(partII.children![0].number).toBe(14);
    });

    it('generates chapter IDs in correct format', () => {
      const toc = generateToc(sampleChapters);

      const chapter1 = toc[0].children![0];
      expect(chapter1.id).toBe('ch-01-welcome-to-the-game');
    });

    it('generates part IDs', () => {
      const toc = generateToc(sampleChapters);

      expect(toc[0].id).toBe('part-i-foundations');
      expect(toc[1].id).toBe('part-ii-skills-proficiencies');
    });
  });
});
```

**Step 2: Run test, then implement**

Create `src/tooling/html-gen/toc-generator.ts`:

```typescript
/**
 * TOC Generator
 *
 * Generates table of contents structure from chapters.
 */

export interface TocEntry {
  type: 'part' | 'chapter';
  id: string;
  title: string;
  number?: number;
  children?: TocEntry[];
}

export interface PartDefinition {
  id: string;
  title: string;
  chapters: [number, number]; // [start, end] inclusive
}

export const PARTS: PartDefinition[] = [
  { id: 'part-i-foundations', title: 'Part I: Foundations', chapters: [1, 13] },
  { id: 'part-ii-skills-proficiencies', title: 'Part II: Skills, Proficiencies, and Mechanical Reference', chapters: [14, 20] },
  { id: 'part-iii-reference-and-gm', title: 'Part III: Game Master Section', chapters: [21, 26] },
  { id: 'part-iv-glossary-index', title: 'Part IV: Reference Sheets, Glossary, and Index', chapters: [27, 30] },
];

interface ChapterInfo {
  number: number;
  title: string;
  slug: string;
}

/**
 * Generate chapter ID from number and slug
 */
function chapterId(number: number, slug: string): string {
  const paddedNum = number.toString().padStart(2, '0');
  return `ch-${paddedNum}-${slug}`;
}

/**
 * Generate TOC structure with parts and chapters
 */
export function generateToc(chapters: ChapterInfo[]): TocEntry[] {
  return PARTS.map(part => {
    const [start, end] = part.chapters;
    const partChapters = chapters.filter(c => c.number >= start && c.number <= end);

    return {
      type: 'part' as const,
      id: part.id,
      title: part.title,
      children: partChapters.map(c => ({
        type: 'chapter' as const,
        id: chapterId(c.number, c.slug),
        title: `${c.number}. ${c.title}`,
        number: c.number,
      })),
    };
  });
}

/**
 * Render TOC to HTML string
 */
export function renderTocHtml(toc: TocEntry[]): string {
  const renderEntry = (entry: TocEntry): string => {
    if (entry.type === 'part') {
      const childrenHtml = entry.children?.map(renderEntry).join('\n') || '';
      return `
<li>
  <a href="#${entry.id}">${entry.title}</a>
  <ul class="toc-list">
    ${childrenHtml}
  </ul>
</li>`;
    }
    return `<li><a href="#${entry.id}">${entry.title}</a></li>`;
  };

  return `<ul class="toc-root">
${toc.map(renderEntry).join('\n')}
</ul>`;
}
```

**Step 3: Run tests**

```bash
pnpm vitest run src/tooling/html-gen/toc-generator.test.ts
```

**Step 4: Export and commit**

```bash
git add src/tooling/html-gen/toc-generator.ts src/tooling/html-gen/toc-generator.test.ts src/tooling/html-gen/index.ts
git commit -m "feat(html-gen): add TOC generator with 4-part structure"
```

---

## Task 3: Create Index Generator

**Files:**
- Create: `src/tooling/html-gen/index-generator.ts`
- Create: `src/tooling/html-gen/index-generator.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/index-generator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateIndex, type IndexEntry } from './index-generator.js';

describe('index-generator', () => {
  describe('generateIndex', () => {
    it('extracts terms from headings', () => {
      const headings = [
        { text: 'Actions, Checks, and Outcomes', id: 'actions-checks-outcomes', level: 2 },
        { text: 'When to Roll', id: 'when-to-roll', level: 3 },
      ];

      const index = generateIndex(headings);

      expect(index.find(e => e.term === 'Actions, Checks, and Outcomes')).toBeDefined();
      expect(index.find(e => e.term === 'When to Roll')).toBeDefined();
    });

    it('sorts entries alphabetically', () => {
      const headings = [
        { text: 'Zebra', id: 'zebra', level: 2 },
        { text: 'Apple', id: 'apple', level: 2 },
        { text: 'Middle', id: 'middle', level: 2 },
      ];

      const index = generateIndex(headings);

      expect(index[0].term).toBe('Apple');
      expect(index[1].term).toBe('Middle');
      expect(index[2].term).toBe('Zebra');
    });

    it('includes link to heading id', () => {
      const headings = [
        { text: 'Combat Basics', id: 'combat-basics', level: 2 },
      ];

      const index = generateIndex(headings);

      expect(index[0].anchor).toBe('#combat-basics');
    });
  });
});
```

**Step 2: Implement**

Create `src/tooling/html-gen/index-generator.ts`:

```typescript
/**
 * Index Generator
 *
 * Auto-generates index from document headings.
 */

export interface IndexEntry {
  term: string;
  anchor: string;
}

interface HeadingInfo {
  text: string;
  id: string;
  level: number;
}

/**
 * Generate alphabetically sorted index from headings
 */
export function generateIndex(headings: HeadingInfo[]): IndexEntry[] {
  const entries = headings.map(h => ({
    term: h.text,
    anchor: `#${h.id}`,
  }));

  return entries.sort((a, b) => a.term.localeCompare(b.term));
}

/**
 * Render index to HTML
 */
export function renderIndexHtml(entries: IndexEntry[]): string {
  // Group by first letter
  const grouped = new Map<string, IndexEntry[]>();

  for (const entry of entries) {
    const letter = entry.term[0].toUpperCase();
    if (!grouped.has(letter)) {
      grouped.set(letter, []);
    }
    grouped.get(letter)!.push(entry);
  }

  const sections: string[] = [];

  for (const [letter, items] of grouped) {
    const itemsHtml = items
      .map(e => `<dd><a href="${e.anchor}">${e.term}</a></dd>`)
      .join('\n');

    sections.push(`
<div class="index-section">
  <dt>${letter}</dt>
  ${itemsHtml}
</div>`);
  }

  return `<dl class="index">\n${sections.join('\n')}\n</dl>`;
}
```

**Step 3: Run tests and commit**

```bash
pnpm vitest run src/tooling/html-gen/index-generator.test.ts
git add src/tooling/html-gen/index-generator.ts src/tooling/html-gen/index-generator.test.ts src/tooling/html-gen/index.ts
git commit -m "feat(html-gen): add index generator"
```

---

## Task 4: Create Content Assembler

**Files:**
- Create: `src/tooling/html-gen/assembler.ts`
- Create: `src/tooling/html-gen/assembler.test.ts`

**Step 1: Write key tests**

Create `src/tooling/html-gen/assembler.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { assembleContent, wrapChapter, wrapSheet } from './assembler.js';

describe('assembler', () => {
  describe('wrapChapter', () => {
    it('wraps content in section with chapter ID', () => {
      const html = wrapChapter(8, 'actions-checks-outcomes', '<h2>8. Actions</h2><p>Content</p>');

      expect(html).toContain('<section id="ch-08-actions-checks-outcomes">');
      expect(html).toContain('</section>');
      expect(html).toContain('<h2>8. Actions</h2>');
    });
  });

  describe('wrapSheet', () => {
    it('wraps sheet in div.sheet-block', () => {
      const html = wrapSheet('character-sheet', '<h3>Character Sheet</h3><p>Fields</p>');

      expect(html).toContain('<div class="sheet-block" id="character-sheet">');
      expect(html).toContain('</div>');
    });
  });

  describe('assembleContent', () => {
    it('combines chapters and sheets in order', () => {
      const parts = {
        chapters: [
          { number: 1, slug: 'welcome', html: '<h2>1. Welcome</h2>' },
          { number: 2, slug: 'concepts', html: '<h2>2. Concepts</h2>' },
        ],
        sheets: [
          { slug: 'character-sheet', html: '<h3>Character Sheet</h3>' },
        ],
        partIntros: new Map([
          ['part-i-foundations', '<p>Part I intro</p>'],
        ]),
      };

      const assembled = assembleContent(parts);

      // Check order
      const ch1Index = assembled.indexOf('ch-01-welcome');
      const ch2Index = assembled.indexOf('ch-02-concepts');
      const sheetIndex = assembled.indexOf('character-sheet');

      expect(ch1Index).toBeLessThan(ch2Index);
      expect(ch2Index).toBeLessThan(sheetIndex);
    });
  });
});
```

**Step 2: Implement**

Create `src/tooling/html-gen/assembler.ts`:

```typescript
/**
 * Content Assembler
 *
 * Combines processed chapters and sheets into final document structure.
 */

import { PARTS } from './toc-generator.js';

export interface ChapterHtml {
  number: number;
  slug: string;
  html: string;
}

export interface SheetHtml {
  slug: string;
  html: string;
}

export interface AssemblyParts {
  chapters: ChapterHtml[];
  sheets: SheetHtml[];
  partIntros: Map<string, string>;
}

/**
 * Wrap chapter content in section element
 */
export function wrapChapter(number: number, slug: string, html: string): string {
  const paddedNum = number.toString().padStart(2, '0');
  const id = `ch-${paddedNum}-${slug}`;
  return `<section id="${id}">\n${html}\n</section>`;
}

/**
 * Wrap sheet content in div.sheet-block
 */
export function wrapSheet(slug: string, html: string): string {
  return `<div class="sheet-block" id="${slug}">\n${html}\n</div>`;
}

/**
 * Wrap part intro in section
 */
function wrapPartIntro(partId: string, title: string, introHtml: string): string {
  return `<section id="${partId}" class="part-intro">
  <h1>${title}</h1>
  ${introHtml}
</section>`;
}

/**
 * Assemble all content into final document order
 */
export function assembleContent(parts: AssemblyParts): string {
  const sections: string[] = [];

  for (const part of PARTS) {
    const [startChapter, endChapter] = part.chapters;

    // Add part intro if available
    const intro = parts.partIntros.get(part.id);
    if (intro) {
      sections.push(wrapPartIntro(part.id, part.title, intro));
    }

    // Add chapters in this part
    for (const chapter of parts.chapters) {
      if (chapter.number >= startChapter && chapter.number <= endChapter) {
        sections.push(wrapChapter(chapter.number, chapter.slug, chapter.html));
      }
    }

    // Chapter 27 is sheets
    if (startChapter <= 27 && endChapter >= 27) {
      const sheetsSection = assembleSheets(parts.sheets);
      sections.push(sheetsSection);
    }
  }

  return sections.join('\n\n');
}

/**
 * Assemble sheets into Chapter 27 section
 */
function assembleSheets(sheets: SheetHtml[]): string {
  const wrappedSheets = sheets.map((s, i) => {
    const sectionNum = `27.${i + 1}`;
    const withHeading = `<h3>${sectionNum} ${formatSheetTitle(s.slug)}</h3>\n${s.html}`;
    return wrapSheet(s.slug, withHeading);
  }).join('\n\n');

  return `<section id="ch-27-reference-sheets">
  <h2>27. Reference Sheets</h2>
  ${wrappedSheets}
</section>`;
}

/**
 * Format sheet slug to title
 */
function formatSheetTitle(slug: string): string {
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
```

**Step 3: Run tests and commit**

```bash
pnpm vitest run src/tooling/html-gen/assembler.test.ts
git add src/tooling/html-gen/assembler.ts src/tooling/html-gen/assembler.test.ts src/tooling/html-gen/index.ts
git commit -m "feat(html-gen): add content assembler"
```

---

## Task 5: Run Full Phase 3 Tests

```bash
pnpm vitest run src/tooling/html-gen/
```

Expected: All tests PASS

---

## Phase 3 Complete

**What was built:**
- `chapter-reader.ts` — Read and order chapter/sheet files
- `toc-generator.ts` — Generate 4-part TOC structure
- `index-generator.ts` — Auto-generate alphabetical index
- `assembler.ts` — Combine content into document order

**Next Phase:** Phase 4 - Print CLI (template, build command, list/diff/promote)
