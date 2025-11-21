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
