import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { ValidationError } from './types.js';

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

export async function validateLinks(
  content: string,
  filePath: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const fileDir = dirname(filePath);
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
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

    // Resolve target file path
    const targetPath = resolve(fileDir, targetFile);

    // Check if file exists
    if (!existsSync(targetPath)) {
      errors.push({
        type: 'link',
        message: `Broken link: ${url} (target not found at ${targetPath})`,
      });
      continue;
    }

    // Check anchor if present
    if (anchor) {
      const hasAnchor = await checkAnchorExists(targetPath, anchor);
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

async function checkAnchorExists(filePath: string, anchor: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Convert anchor to heading format
    // #my-heading -> ## My Heading or ### My Heading, etc.
    const headingText = anchor.replace(/-/g, ' ');
    const headingRegex = new RegExp(`^#{1,6}\\s+${headingText}`, 'mi');

    return headingRegex.test(content);
  } catch {
    return false;
  }
}
