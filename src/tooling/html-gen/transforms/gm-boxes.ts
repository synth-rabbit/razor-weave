/**
 * GM Boxes Transform
 *
 * Converts blockquotes starting with **GM** or **GM Guidance** to <div class="gm">
 *
 * Input:
 * > **GM**
 * > **GM Guidance – Pace, Not Payment**
 * > Content here...
 *
 * Output:
 * <div class="gm">
 *   <strong>GM Guidance – Pace, Not Payment</strong>
 *   <p>Content here...</p>
 * </div>
 */

import type { Root, Blockquote, Paragraph, Strong, Text } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Check if a blockquote starts with **GM** or **GM Guidance**
 */
function isGmBlock(node: Blockquote): boolean {
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

  const textValue = (text as Text).value;
  return textValue === 'GM' || textValue.startsWith('GM Guidance');
}

/**
 * Remark plugin to transform GM guidance blockquotes
 */
export function remarkGmBoxes() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      if (!isGmBlock(node)) return;
      if (index === undefined || !parent) return;

      const content = node.children;

      const htmlNode = {
        type: 'html' as const,
        value: '<div class="gm">',
      };

      const closeNode = {
        type: 'html' as const,
        value: '</div>',
      };

      parent.children.splice(index, 1, htmlNode, ...content, closeNode);

      return index + content.length + 2;
    });
  };
}
