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

      expect(html).toContain('id="core-principles-the-table-is-a-creative-team"');
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
