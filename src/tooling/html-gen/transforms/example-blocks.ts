/**
 * Example Blocks Transform
 *
 * Converts blockquotes starting with **Example** to <div class="example">
 *
 * Input:
 * > **Example**
 * > **Example – When to Roll**
 * > Content here...
 *
 * Output:
 * <div class="example">
 *   <strong>Example – When to Roll</strong>
 *   <p>Content here...</p>
 * </div>
 */

import type { Root, Blockquote, Paragraph, Strong, Text } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Check if a blockquote starts with **Example**
 */
function isExampleBlock(node: Blockquote): boolean {
  if (node.children.length === 0) return false;

  const firstChild = node.children[0];
  if (firstChild.type !== 'paragraph') return false;

  const paragraph = firstChild as Paragraph;
  if (paragraph.children.length === 0) return false;

  const firstInline = paragraph.children[0];
  if (firstInline.type !== 'strong') return false;

  const strong = firstInline as Strong;
  if (strong.children.length === 0) return false;

  const text = strong.children[0];
  if (text.type !== 'text') return false;

  return (text as Text).value.startsWith('Example');
}

/**
 * Remark plugin to transform example blockquotes
 */
export function remarkExampleBlocks() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      if (!isExampleBlock(node)) return;
      if (index === undefined || !parent) return;

      // Replace blockquote with HTML div
      // We use 'html' node type to inject raw HTML
      const content = node.children;

      // Create a wrapper that will become <div class="example">
      const htmlNode = {
        type: 'html' as const,
        value: '<div class="example">',
      };

      const closeNode = {
        type: 'html' as const,
        value: '</div>',
      };

      // Replace the blockquote with: open div, content, close div
      parent.children.splice(index, 1, htmlNode, ...content, closeNode);

      // Return the new index to continue visiting
      return index + content.length + 2;
    });
  };
}
