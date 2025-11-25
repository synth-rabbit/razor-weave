// src/tooling/io/file-io.ts
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  copyFileSync,
  rmSync,
} from 'fs';
import { dirname, join, resolve, relative } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

/**
 * Read a text file, returning null if it doesn't exist.
 */
export function readTextFile(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, 'utf-8');
}

/**
 * Read a text file, throwing if it doesn't exist.
 */
export function readTextFileOrThrow(filePath: string): string {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return readFileSync(filePath, 'utf-8');
}

/**
 * Read and parse a JSON file, returning null if it doesn't exist.
 */
export function readJsonFile<T = unknown>(filePath: string): T | null {
  const content = readTextFile(filePath);
  if (content === null) {
    return null;
  }
  return JSON.parse(content) as T;
}

/**
 * Read and parse a JSON file, throwing if it doesn't exist.
 */
export function readJsonFileOrThrow<T = unknown>(filePath: string): T {
  const content = readTextFileOrThrow(filePath);
  return JSON.parse(content) as T;
}

/**
 * Write a text file, creating parent directories if needed.
 */
export function writeTextFile(filePath: string, content: string): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Write a JSON file with pretty printing, creating parent directories if needed.
 */
export function writeJsonFile(filePath: string, data: unknown, indent: number = 2): void {
  const content = JSON.stringify(data, null, indent);
  writeTextFile(filePath, content + '\n');
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Check if a path exists.
 */
export function pathExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Check if a path is a directory.
 */
export function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

/**
 * Check if a path is a file.
 */
export function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

/**
 * List files in a directory with optional filtering.
 */
export function listFiles(
  dirPath: string,
  options: { extension?: string; recursive?: boolean } = {}
): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const results: string[] = [];
  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory() && options.recursive) {
      results.push(...listFiles(fullPath, options));
    } else if (entry.isFile()) {
      if (!options.extension || entry.name.endsWith(options.extension)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * Copy a file, creating parent directories if needed.
 */
export function copyFile(src: string, dest: string): void {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
}

/**
 * Remove a file or directory.
 */
export function remove(path: string, options: { recursive?: boolean } = {}): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: options.recursive ?? false, force: true });
  }
}

/**
 * Get the project root (git root or cwd).
 */
export function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

/**
 * Resolve a path relative to the project root.
 */
export function resolveFromRoot(...paths: string[]): string {
  return resolve(getProjectRoot(), ...paths);
}

/**
 * Get a path relative to the project root.
 */
export function relativeToRoot(absolutePath: string): string {
  return relative(getProjectRoot(), absolutePath);
}

/**
 * Calculate SHA256 hash of file contents.
 */
export function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Calculate SHA256 hash of a string.
 */
export function hashString(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Read a file if it's been modified since a given date.
 * Returns null if file hasn't been modified or doesn't exist.
 */
export function readIfModifiedSince(filePath: string, since: Date): string | null {
  if (!existsSync(filePath)) {
    return null;
  }

  const stat = statSync(filePath);
  if (stat.mtime <= since) {
    return null;
  }

  return readFileSync(filePath, 'utf-8');
}

/**
 * Get file modification time.
 */
export function getModTime(filePath: string): Date | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return statSync(filePath).mtime;
}
