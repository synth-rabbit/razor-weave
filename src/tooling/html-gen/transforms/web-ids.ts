/**
 * Web IDs Transform
 *
 * Generates chapter-prefixed IDs for web reader compatibility.
 *
 * ID patterns (per web reader design doc):
 * - H2 (chapter heading): slugify(title) + "-heading"
 * - H3/H4 (subsections): chapter-slug + "-" + slugify(subsection-title)
 *
 * This differs from print which uses simple slugify without prefixing.
 */

import type { Root, Heading, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import { slugify } from './semantic-ids.js';

export interface WebIdsOptions {
  chapterNumber: number;
  chapterSlug: string; // e.g., "core-principles" from filename
}

/**
 * Extract text content from heading, removing chapter numbers
 */
function extractHeadingText(heading: Heading): string {
  let text = '';
  for (const child of heading.children) {
    if (child.type === 'text') {
      text += (child as Text).value;
    }
  }
  // Remove leading chapter number (e.g., "4. " or "12. ")
  return text.replace(/^\d+\.\s*/, '').trim();
}

/**
 * Remark plugin to add web-compatible IDs to headings
 */
export function remarkWebIds(options: WebIdsOptions) {
  const { chapterSlug } = options;

  return (tree: Root) => {
    visit(tree, 'heading', (node: Heading) => {
      const text = extractHeadingText(node);
      const textSlug = slugify(text);

      let id: string;

      if (node.depth === 2) {
        // Chapter heading: slugify(title) + "-heading"
        id = `${textSlug}-heading`;
      } else {
        // Subsections (h3, h4): chapter-slug + "-" + slugify(title)
        id = `${chapterSlug}-${textSlug}`;
      }

      // Add data.hProperties for remark-rehype
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      (node.data.hProperties as Record<string, string>).id = id;
    });
  };
}
