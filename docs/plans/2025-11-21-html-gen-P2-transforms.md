# HTML Generation Phase 2: Transforms Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create unified/remark parsing pipeline with custom transforms for example blocks, GM boxes, semantic IDs, and glossary linking.

**Architecture:** Build AST-transforming plugins that detect markdown patterns and convert them to semantic HTML. Transforms are shared between print-design and web-reader workflows.

**Tech Stack:** TypeScript, unified, remark-parse, remark-gfm, remark-rehype, rehype-stringify

**Prerequisites:**
- Phase 1 complete (html-gen foundation)
- `pnpm install` with new dependencies

**Reference Design:** `docs/plans/2025-11-21-html-print-design-pipeline-design.md`

---

## Task 1: Install unified/remark Dependencies

**Step 1: Add dependencies**

```bash
cd src/tooling
pnpm add unified remark-parse remark-gfm remark-rehype rehype-stringify unist-util-visit
pnpm add -D @types/mdast @types/hast
```

**Step 2: Verify installation**

```bash
pnpm list unified remark-parse remark-gfm remark-rehype rehype-stringify unist-util-visit
```

Expected: All packages listed with versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add unified/remark packages for markdown parsing"
```

---

## Task 2: Create Base Pipeline

**Files:**
- Create: `src/tooling/html-gen/pipeline.ts`
- Create: `src/tooling/html-gen/pipeline.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/pipeline.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createPipeline, processMarkdown } from './pipeline.js';

describe('pipeline', () => {
  describe('createPipeline', () => {
    it('creates a unified processor', () => {
      const pipeline = createPipeline();
      expect(pipeline).toBeDefined();
      expect(typeof pipeline.process).toBe('function');
    });
  });

  describe('processMarkdown', () => {
    it('converts basic markdown to HTML', async () => {
      const markdown = '# Hello World\n\nThis is a paragraph.';
      const html = await processMarkdown(markdown);

      expect(html).toContain('<h1>Hello World</h1>');
      expect(html).toContain('<p>This is a paragraph.</p>');
    });

    it('handles GFM tables', async () => {
      const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      const html = await processMarkdown(markdown);

      expect(html).toContain('<table>');
      expect(html).toContain('<th>Header 1</th>');
      expect(html).toContain('<td>Cell 1</td>');
    });

    it('handles bold and italic', async () => {
      const markdown = '**bold** and *italic*';
      const html = await processMarkdown(markdown);

      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
    });

    it('handles lists', async () => {
      const markdown = `
- Item 1
- Item 2
`;
      const html = await processMarkdown(markdown);

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
    });

    it('handles blockquotes', async () => {
      const markdown = '> This is a quote';
      const html = await processMarkdown(markdown);

      expect(html).toContain('<blockquote>');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/pipeline.test.ts
```

Expected: FAIL with "Cannot find module './pipeline.js'"

**Step 3: Write the implementation**

Create `src/tooling/html-gen/pipeline.ts`:

```typescript
/**
 * Unified Markdown Pipeline
 *
 * Base pipeline for converting markdown to HTML.
 * Custom transforms are added by workflow-specific builders.
 */

import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/**
 * Create a base unified processor with standard plugins
 */
export function createPipeline(): Processor {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

/**
 * Process markdown string to HTML string
 */
export async function processMarkdown(markdown: string): Promise<string> {
  const pipeline = createPipeline();
  const result = await pipeline.process(markdown);
  return String(result);
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/pipeline.test.ts
```

Expected: All tests PASS

**Step 5: Update index exports**

Add to `src/tooling/html-gen/index.ts`:

```typescript
export * from './pipeline.js';
```

**Step 6: Commit**

```bash
git add src/tooling/html-gen/pipeline.ts src/tooling/html-gen/pipeline.test.ts src/tooling/html-gen/index.ts
git commit -m "feat(html-gen): add base unified/remark pipeline"
```

---

## Task 3: Create Transforms Directory

**Files:**
- Create: `src/tooling/html-gen/transforms/index.ts`

**Step 1: Create directory and index**

```bash
mkdir -p src/tooling/html-gen/transforms
```

Create `src/tooling/html-gen/transforms/index.ts`:

```typescript
/**
 * Remark/Rehype Transform Plugins
 *
 * Custom AST transforms for converting markdown patterns
 * to semantic HTML structures.
 */

// Will export transforms as they are created
```

**Step 2: Commit**

```bash
git add src/tooling/html-gen/transforms/
git commit -m "feat(html-gen): add transforms directory structure"
```

---

## Task 4: Implement Example Blocks Transform

**Files:**
- Create: `src/tooling/html-gen/transforms/example-blocks.ts`
- Create: `src/tooling/html-gen/transforms/example-blocks.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/transforms/example-blocks.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkExampleBlocks } from './example-blocks.js';

async function processWithExamples(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkExampleBlocks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(result);
}

describe('remarkExampleBlocks', () => {
  it('converts blockquote starting with **Example** to div.example', async () => {
    const markdown = `> **Example**
> This is example content.`;

    const html = await processWithExamples(markdown);

    expect(html).toContain('<div class="example">');
    expect(html).toContain('This is example content.');
    expect(html).not.toContain('<blockquote>');
  });

  it('converts blockquote with titled example', async () => {
    const markdown = `> **Example**
> **Example – When to Roll**
> *Trigger:* A character wants to leap.`;

    const html = await processWithExamples(markdown);

    expect(html).toContain('<div class="example">');
    expect(html).toContain('Example – When to Roll');
  });

  it('preserves regular blockquotes', async () => {
    const markdown = `> This is a regular quote without Example marker.`;

    const html = await processWithExamples(markdown);

    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('class="example"');
  });

  it('handles multiple examples in same document', async () => {
    const markdown = `
> **Example**
> First example.

Some text between.

> **Example**
> Second example.
`;

    const html = await processWithExamples(markdown);

    const exampleCount = (html.match(/class="example"/g) || []).length;
    expect(exampleCount).toBe(2);
  });

  it('handles example with formatted content', async () => {
    const markdown = `> **Example**
> **Example – Intent and Approach**
> *Intent:* "I want to get the foreman to delay shipment."
> *Approach:* "I speak with her in private."`;

    const html = await processWithExamples(markdown);

    expect(html).toContain('<div class="example">');
    expect(html).toContain('<em>Intent:</em>');
    expect(html).toContain('<em>Approach:</em>');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/transforms/example-blocks.test.ts
```

Expected: FAIL with "Cannot find module './example-blocks.js'"

**Step 3: Write the implementation**

Create `src/tooling/html-gen/transforms/example-blocks.ts`:

```typescript
/**
 * Example Blocks Transform
 *
 * Converts blockquotes starting with **Example** to <div class="example">
 *
 * Input:
 * > **Example**
 * > **Example – When to Roll**
 * > Content here...
 *
 * Output:
 * <div class="example">
 *   <strong>Example – When to Roll</strong>
 *   <p>Content here...</p>
 * </div>
 */

import type { Root, Blockquote, Paragraph, Strong, Text } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Check if a blockquote starts with **Example**
 */
function isExampleBlock(node: Blockquote): boolean {
  if (node.children.length === 0) return false;

  const firstChild = node.children[0];
  if (firstChild.type !== 'paragraph') return false;

  const paragraph = firstChild as Paragraph;
  if (paragraph.children.length === 0) return false;

  const firstInline = paragraph.children[0];
  if (firstInline.type !== 'strong') return false;

  const strong = firstInline as Strong;
  if (strong.children.length === 0) return false;

  const text = strong.children[0];
  if (text.type !== 'text') return false;

  return (text as Text).value.startsWith('Example');
}

/**
 * Remark plugin to transform example blockquotes
 */
export function remarkExampleBlocks() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      if (!isExampleBlock(node)) return;
      if (index === undefined || !parent) return;

      // Replace blockquote with HTML div
      // We use 'html' node type to inject raw HTML
      const content = node.children;

      // Create a wrapper that will become <div class="example">
      const htmlNode = {
        type: 'html' as const,
        value: '<div class="example">',
      };

      const closeNode = {
        type: 'html' as const,
        value: '</div>',
      };

      // Replace the blockquote with: open div, content, close div
      parent.children.splice(index, 1, htmlNode, ...content, closeNode);

      // Return the new index to continue visiting
      return index + content.length + 2;
    });
  };
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/transforms/example-blocks.test.ts
```

Expected: All tests PASS

**Step 5: Export from transforms index**

Update `src/tooling/html-gen/transforms/index.ts`:

```typescript
/**
 * Remark/Rehype Transform Plugins
 */

export { remarkExampleBlocks } from './example-blocks.js';
```

**Step 6: Commit**

```bash
git add src/tooling/html-gen/transforms/example-blocks.ts src/tooling/html-gen/transforms/example-blocks.test.ts src/tooling/html-gen/transforms/index.ts
git commit -m "feat(html-gen): add example blocks transform"
```

---

## Task 5: Implement GM Boxes Transform

**Files:**
- Create: `src/tooling/html-gen/transforms/gm-boxes.ts`
- Create: `src/tooling/html-gen/transforms/gm-boxes.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/transforms/gm-boxes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkGmBoxes } from './gm-boxes.js';

async function processWithGm(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGmBoxes)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(result);
}

describe('remarkGmBoxes', () => {
  it('converts blockquote starting with **GM** to div.gm', async () => {
    const markdown = `> **GM**
> This is GM guidance.`;

    const html = await processWithGm(markdown);

    expect(html).toContain('<div class="gm">');
    expect(html).toContain('This is GM guidance.');
    expect(html).not.toContain('<blockquote>');
  });

  it('converts **GM Guidance** variant', async () => {
    const markdown = `> **GM Guidance**
> Tips for running this scene.`;

    const html = await processWithGm(markdown);

    expect(html).toContain('<div class="gm">');
  });

  it('converts titled GM box', async () => {
    const markdown = `> **GM**
> **GM Guidance – Pace, Not Payment**
> Content here.`;

    const html = await processWithGm(markdown);

    expect(html).toContain('<div class="gm">');
    expect(html).toContain('Pace, Not Payment');
  });

  it('preserves regular blockquotes', async () => {
    const markdown = `> This is a regular quote.`;

    const html = await processWithGm(markdown);

    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('class="gm"');
  });

  it('handles multiple GM boxes', async () => {
    const markdown = `
> **GM**
> First guidance.

> **GM Guidance**
> Second guidance.
`;

    const html = await processWithGm(markdown);

    const gmCount = (html.match(/class="gm"/g) || []).length;
    expect(gmCount).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/transforms/gm-boxes.test.ts
```

Expected: FAIL with "Cannot find module './gm-boxes.js'"

**Step 3: Write the implementation**

Create `src/tooling/html-gen/transforms/gm-boxes.ts`:

```typescript
/**
 * GM Boxes Transform
 *
 * Converts blockquotes starting with **GM** or **GM Guidance** to <div class="gm">
 *
 * Input:
 * > **GM**
 * > **GM Guidance – Pace, Not Payment**
 * > Content here...
 *
 * Output:
 * <div class="gm">
 *   <strong>GM Guidance – Pace, Not Payment</strong>
 *   <p>Content here...</p>
 * </div>
 */

import type { Root, Blockquote, Paragraph, Strong, Text } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Check if a blockquote starts with **GM** or **GM Guidance**
 */
function isGmBlock(node: Blockquote): boolean {
  if (node.children.length === 0) return false;

  const firstChild = node.children[0];
  if (firstChild.type !== 'paragraph') return false;

  const paragraph = firstChild as Paragraph;
  if (paragraph.children.length === 0) return false;

  const firstInline = paragraph.children[0];
  if (firstInline.type !== 'strong') return false;

  const strong = firstInline as Strong;
  if (strong.children.length === 0) return false;

  const text = strong.children[0];
  if (text.type !== 'text') return false;

  const textValue = (text as Text).value;
  return textValue === 'GM' || textValue.startsWith('GM Guidance');
}

/**
 * Remark plugin to transform GM guidance blockquotes
 */
export function remarkGmBoxes() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      if (!isGmBlock(node)) return;
      if (index === undefined || !parent) return;

      const content = node.children;

      const htmlNode = {
        type: 'html' as const,
        value: '<div class="gm">',
      };

      const closeNode = {
        type: 'html' as const,
        value: '</div>',
      };

      parent.children.splice(index, 1, htmlNode, ...content, closeNode);

      return index + content.length + 2;
    });
  };
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/transforms/gm-boxes.test.ts
```

Expected: All tests PASS

**Step 5: Export from transforms index**

Update `src/tooling/html-gen/transforms/index.ts`:

```typescript
/**
 * Remark/Rehype Transform Plugins
 */

export { remarkExampleBlocks } from './example-blocks.js';
export { remarkGmBoxes } from './gm-boxes.js';
```

**Step 6: Commit**

```bash
git add src/tooling/html-gen/transforms/gm-boxes.ts src/tooling/html-gen/transforms/gm-boxes.test.ts src/tooling/html-gen/transforms/index.ts
git commit -m "feat(html-gen): add GM boxes transform"
```

---

## Task 6: Implement Semantic IDs Transform

**Files:**
- Create: `src/tooling/html-gen/transforms/semantic-ids.ts`
- Create: `src/tooling/html-gen/transforms/semantic-ids.test.ts`

**Step 1: Write the failing test**

Create `src/tooling/html-gen/transforms/semantic-ids.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkSemanticIds } from './semantic-ids.js';

async function processWithIds(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkSemanticIds)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

describe('remarkSemanticIds', () => {
  describe('slugify', () => {
    it('generates slug for chapter heading', async () => {
      const markdown = '## 8. Actions, Checks, and Outcomes';
      const html = await processWithIds(markdown);

      expect(html).toContain('id="actions-checks-and-outcomes"');
    });

    it('generates slug for subsection heading', async () => {
      const markdown = '### When to Roll (and When Not To)';
      const html = await processWithIds(markdown);

      expect(html).toContain('id="when-to-roll-and-when-not-to"');
    });

    it('handles special characters', async () => {
      const markdown = '### Edge, Burden, Tags & Conditions';
      const html = await processWithIds(markdown);

      expect(html).toContain('id="edge-burden-tags-conditions"');
    });

    it('collapses multiple hyphens', async () => {
      const markdown = '### The   Table   Is   a   Team';
      const html = await processWithIds(markdown);

      expect(html).toContain('id="the-table-is-a-team"');
    });
  });

  describe('chapter headings', () => {
    it('removes chapter number from slug', async () => {
      const markdown = '## 4. Core Principles of Play';
      const html = await processWithIds(markdown);

      expect(html).toContain('id="core-principles-of-play"');
      expect(html).not.toContain('id="4-');
    });

    it('handles two-digit chapter numbers', async () => {
      const markdown = '## 12. Downtime, Recovery, and Advancement';
      const html = await processWithIds(markdown);

      expect(html).toContain('id="downtime-recovery-and-advancement"');
    });
  });

  describe('multiple headings', () => {
    it('assigns unique IDs to all headings', async () => {
      const markdown = `
## 1. Welcome

### Getting Started

### Basic Rules

## 2. Character Creation

### Attributes
`;
      const html = await processWithIds(markdown);

      expect(html).toContain('id="welcome"');
      expect(html).toContain('id="getting-started"');
      expect(html).toContain('id="basic-rules"');
      expect(html).toContain('id="character-creation"');
      expect(html).toContain('id="attributes"');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/html-gen/transforms/semantic-ids.test.ts
```

Expected: FAIL with "Cannot find module './semantic-ids.js'"

**Step 3: Write the implementation**

Create `src/tooling/html-gen/transforms/semantic-ids.ts`:

```typescript
/**
 * Semantic IDs Transform
 *
 * Adds id attributes to headings for anchor linking.
 *
 * Rules:
 * - Chapter headings (## N. Title): id = slugify(title without number)
 * - Section headings (### Title): id = slugify(title)
 * - Slugify: lowercase, spaces to hyphens, remove special chars, collapse hyphens
 */

import type { Root, Heading, Text } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Convert text to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Trim leading/trailing hyphens
}

/**
 * Extract title text from heading, removing chapter numbers
 *
 * Input: "8. Actions, Checks, and Outcomes"
 * Output: "Actions, Checks, and Outcomes"
 */
function extractTitle(heading: Heading): string {
  let text = '';

  for (const child of heading.children) {
    if (child.type === 'text') {
      text += (child as Text).value;
    }
  }

  // Remove leading chapter number (e.g., "8. " or "12. ")
  const withoutNumber = text.replace(/^\d+\.\s*/, '');

  return withoutNumber.trim();
}

/**
 * Remark plugin to add semantic IDs to headings
 */
export function remarkSemanticIds() {
  return (tree: Root) => {
    visit(tree, 'heading', (node: Heading) => {
      const title = extractTitle(node);
      const id = slugify(title);

      // Add data.hProperties which remark-rehype will use
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      (node.data.hProperties as Record<string, string>).id = id;
    });
  };
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tooling/html-gen/transforms/semantic-ids.test.ts
```

Expected: All tests PASS

**Step 5: Export from transforms index**

Update `src/tooling/html-gen/transforms/index.ts`:

```typescript
/**
 * Remark/Rehype Transform Plugins
 */

export { remarkExampleBlocks } from './example-blocks.js';
export { remarkGmBoxes } from './gm-boxes.js';
export { remarkSemanticIds, slugify } from './semantic-ids.js';
```

**Step 6: Commit**

```bash
git add src/tooling/html-gen/transforms/semantic-ids.ts src/tooling/html-gen/transforms/semantic-ids.test.ts src/tooling/html-gen/transforms/index.ts
git commit -m "feat(html-gen): add semantic IDs transform for headings"
```

---

## Task 7: Run Full Transform Tests

**Step 1: Run all transform tests**

```bash
pnpm vitest run src/tooling/html-gen/transforms/
```

Expected: All tests PASS

**Step 2: Test transforms together**

Create a quick integration test (add to pipeline.test.ts):

```typescript
// Add this test to pipeline.test.ts

import { remarkExampleBlocks, remarkGmBoxes, remarkSemanticIds } from './transforms/index.js';

describe('pipeline with transforms', () => {
  it('processes document with all transforms', async () => {
    const pipeline = unified()
      .use(remarkParse)
      .use(remarkExampleBlocks)
      .use(remarkGmBoxes)
      .use(remarkSemanticIds)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true });

    const markdown = `
## 4. Core Principles

### The Golden Rule

> **Example**
> An example of play.

> **GM Guidance**
> Tips for the GM.

Regular paragraph here.
`;

    const result = await pipeline.process(markdown);
    const html = String(result);

    expect(html).toContain('id="core-principles"');
    expect(html).toContain('id="the-golden-rule"');
    expect(html).toContain('class="example"');
    expect(html).toContain('class="gm"');
  });
});
```

**Step 3: Run the integration test**

```bash
pnpm vitest run src/tooling/html-gen/pipeline.test.ts
```

Expected: All tests PASS

**Step 4: Commit integration test**

```bash
git add src/tooling/html-gen/pipeline.test.ts
git commit -m "test(html-gen): add integration test for combined transforms"
```

---

## Phase 2 Complete

**What was built:**
- Base unified/remark pipeline (`pipeline.ts`)
- Example blocks transform (`transforms/example-blocks.ts`)
- GM boxes transform (`transforms/gm-boxes.ts`)
- Semantic IDs transform (`transforms/semantic-ids.ts`)

**Transforms Summary:**
| Transform | Input Pattern | Output |
|-----------|--------------|--------|
| `remarkExampleBlocks` | `> **Example**...` | `<div class="example">` |
| `remarkGmBoxes` | `> **GM**...` | `<div class="gm">` |
| `remarkSemanticIds` | Any heading | `<h2 id="slug">` |

**Next Phase:** Phase 3 - Assembly (TOC generator, Index generator, Part structure)
