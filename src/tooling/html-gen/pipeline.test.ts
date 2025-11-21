import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { createPipeline, processMarkdown } from './pipeline.js';
import { remarkExampleBlocks, remarkGmBoxes, remarkSemanticIds } from './transforms/index.js';

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
