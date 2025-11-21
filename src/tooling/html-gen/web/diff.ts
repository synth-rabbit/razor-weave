/**
 * Web Reader Diff Command
 *
 * Shows changes since a specific build.
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type Database from 'better-sqlite3';
import { HtmlBuildClient } from '../build-client.js';
import { hashString } from '../hasher.js';

export interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
}

/**
 * Compare current files to a previous build
 */
export function diffWebBuild(
  db: Database.Database,
  buildId: string,
  chaptersDir: string
): DiffResult {
  const buildClient = new HtmlBuildClient(db);
  const sources = buildClient.getBuildSources(buildId);

  const result: DiffResult = {
    added: [],
    removed: [],
    changed: [],
  };

  // Map of file path -> content hash from build
  const buildFiles = new Map(sources.map(s => [s.filePath, s.contentHash]));

  // Get current files
  const currentFiles = readdirSync(chaptersDir)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .map(f => join(chaptersDir, f));

  // Check for added and changed files
  for (const filePath of currentFiles) {
    const buildHash = buildFiles.get(filePath);

    if (!buildHash) {
      result.added.push(filePath);
    } else {
      const currentContent = readFileSync(filePath, 'utf-8');
      const currentHash = hashString(currentContent);

      if (currentHash !== buildHash) {
        result.changed.push(filePath);
      }
    }
  }

  // Check for removed files
  for (const [filePath] of buildFiles) {
    if (!existsSync(filePath)) {
      result.removed.push(filePath);
    }
  }

  return result;
}

/**
 * Format diff for CLI output
 */
export function formatDiff(diff: DiffResult): string {
  const lines: string[] = [];

  if (diff.added.length > 0) {
    lines.push('Added:');
    diff.added.forEach(f => lines.push(`  + ${f}`));
  }

  if (diff.removed.length > 0) {
    lines.push('Removed:');
    diff.removed.forEach(f => lines.push(`  - ${f}`));
  }

  if (diff.changed.length > 0) {
    lines.push('Changed:');
    diff.changed.forEach(f => lines.push(`  ~ ${f}`));
  }

  if (lines.length === 0) {
    return 'No changes since build.';
  }

  return lines.join('\n');
}
