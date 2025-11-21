/**
 * File Hashing Utilities
 *
 * Provides SHA-256 hashing for files and strings.
 * Used for detecting changes in source files.
 */

import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

/**
 * Hash a string using SHA-256
 * @param content - String to hash
 * @returns Hex-encoded SHA-256 hash (64 characters)
 */
export function hashString(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Hash a file's contents using SHA-256
 * @param filePath - Path to file
 * @returns Hex-encoded SHA-256 hash (64 characters)
 * @throws If file does not exist or cannot be read
 */
export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf8');
  return hashString(content);
}

/**
 * Hash multiple files and combine into single hash
 * @param filePaths - Array of file paths (order matters)
 * @returns Combined hex-encoded SHA-256 hash, or empty string if no files
 */
export async function hashFiles(filePaths: string[]): Promise<string> {
  if (filePaths.length === 0) {
    return '';
  }

  const hashes = await Promise.all(filePaths.map(hashFile));
  return hashString(hashes.join(':'));
}
