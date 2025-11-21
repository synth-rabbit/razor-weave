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
