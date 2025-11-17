import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { ValidationError } from './types.js';

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Validates all markdown links in a document.
 *
 * Checks internal links (relative file paths) to ensure:
 * - Target files exist
 * - Anchor references point to valid headings
 *
 * @param content - The markdown content to validate
 * @param filePath - Absolute path to the file being validated
 * @returns Array of validation errors found, empty if all links are valid
 *
 * @example
 * ```typescript
 * const content = '[Link](./other.md#heading)';
 * const errors = await validateLinks(content, '/path/to/file.md');
 * if (errors.length > 0) {
 *   console.log('Found broken links:', errors);
 * }
 * ```
 */
export async function validateLinks(
  content: string,
  filePath: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const fileDir = dirname(filePath);

  for (const match of content.matchAll(linkRegex)) {
    const [, , url] = match;

    // Skip external URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      continue;
    }

    // Skip mailto and other protocols
    if (url.includes(':')) {
      continue;
    }

    // Parse file and anchor
    const [targetFile, anchor] = url.split('#');

    // Resolve target file path (handle same-file anchor links)
    const actualFilePath = targetFile ? resolve(fileDir, targetFile) : filePath;
    const targetPath = actualFilePath;

    // Check if file exists (skip check for same-file anchors)
    if (targetFile && !existsSync(targetPath)) {
      errors.push({
        type: 'link',
        message: `Broken link: ${url} (target not found at ${targetPath})`,
      });
      continue;
    }

    // Check anchor if present
    if (anchor) {
      // For same-file anchors, check in the current content
      const hasAnchor = targetFile
        ? await checkAnchorExists(targetPath, anchor)
        : checkAnchorInContent(content, anchor);
      if (!hasAnchor) {
        errors.push({
          type: 'link',
          message: `Broken anchor: ${url} (anchor #${anchor} not found)`,
        });
      }
    }
  }

  return errors;
}

/**
 * Generates a slug from a heading text matching GitHub/markdown standards.
 *
 * @param heading - The heading text to convert to a slug
 * @returns The generated slug
 */
function generateSlug(heading: string): string {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // Remove special chars
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '')     // Trim leading/trailing hyphens
    .replace(/-+/g, '-');        // Collapse multiple hyphens
}

/**
 * Checks if an anchor exists in the provided content.
 *
 * @param content - The markdown content to search
 * @param anchor - The anchor slug to find
 * @returns True if the anchor exists, false otherwise
 */
function checkAnchorInContent(content: string, anchor: string): boolean {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  for (const match of content.matchAll(headingRegex)) {
    const headingText = match[1].trim();
    const slug = generateSlug(headingText);
    if (slug === anchor) {
      return true;
    }
  }
  return false;
}

async function checkAnchorExists(filePath: string, anchor: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return checkAnchorInContent(content, anchor);
  } catch {
    return false;
  }
}
