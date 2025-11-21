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
