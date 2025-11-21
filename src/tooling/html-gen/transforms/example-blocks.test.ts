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
