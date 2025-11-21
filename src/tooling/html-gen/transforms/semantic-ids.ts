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
