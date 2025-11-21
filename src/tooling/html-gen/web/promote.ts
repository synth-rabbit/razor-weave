/**
 * Web Reader Promote Command
 *
 * Copies generated HTML to site location.
 */

import { copyFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface PromoteOptions {
  sourcePath: string;
  targetPath: string;
}

export interface PromoteResult {
  success: boolean;
  sourcePath: string;
  targetPath: string;
  error?: string;
}

/**
 * Promote web reader output to site location
 */
export async function promoteWebBuild(options: PromoteOptions): Promise<PromoteResult> {
  const { sourcePath, targetPath } = options;

  if (!existsSync(sourcePath)) {
    return {
      success: false,
      sourcePath,
      targetPath,
      error: `Source file does not exist: ${sourcePath}`,
    };
  }

  try {
    await copyFile(sourcePath, targetPath);

    return {
      success: true,
      sourcePath,
      targetPath,
    };
  } catch (error) {
    return {
      success: false,
      sourcePath,
      targetPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
