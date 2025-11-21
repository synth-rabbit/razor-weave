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
