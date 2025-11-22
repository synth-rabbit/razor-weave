// src/tooling/pdf-gen/utils/paths.ts
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is 4 levels up from src/tooling/pdf-gen/utils/
export const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

/**
 * Resolve a path relative to the project root.
 */
export function projectPath(...segments: string[]): string {
  return path.join(PROJECT_ROOT, ...segments);
}
