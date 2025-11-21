/**
 * Unified Markdown Pipeline
 *
 * Base pipeline for converting markdown to HTML.
 * Custom transforms are added by workflow-specific builders.
 */

import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

/**
 * Plugin to remove YAML frontmatter nodes from the AST
 */
function remarkStripFrontmatter() {
  return (tree: Root) => {
    visit(tree, 'yaml', (_node, index, parent) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
        return index; // Continue from same index since we removed a node
      }
    });
  };
}

/**
 * Create a base unified processor with standard plugins
 */
export function createPipeline(): Processor {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])  // Parse YAML front matter
    .use(remarkStripFrontmatter)        // Remove it from AST
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
