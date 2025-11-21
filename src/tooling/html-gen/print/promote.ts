/**
 * Promote Print Build
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

export async function promotePrintBuild(options: PromoteOptions): Promise<PromoteResult> {
  try {
    if (!existsSync(options.sourcePath)) {
      return {
        success: false,
        sourcePath: options.sourcePath,
        targetPath: options.targetPath,
        error: `Source file not found: ${options.sourcePath}`,
      };
    }

    await copyFile(options.sourcePath, options.targetPath);

    return {
      success: true,
      sourcePath: options.sourcePath,
      targetPath: options.targetPath,
    };
  } catch (error) {
    return {
      success: false,
      sourcePath: options.sourcePath,
      targetPath: options.targetPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
