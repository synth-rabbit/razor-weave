/**
 * Web Reader List Command
 *
 * Lists previous web reader builds from the database.
 */

import type Database from 'better-sqlite3';
import { HtmlBuildClient, type HtmlBuild } from '../build-client.js';

/**
 * List web reader builds
 */
export function listWebBuilds(db: Database.Database, limit = 10): HtmlBuild[] {
  const buildClient = new HtmlBuildClient(db);
  return buildClient.listBuilds('web-reader', limit);
}

/**
 * Format builds for CLI output
 */
export function formatBuildList(builds: HtmlBuild[]): string {
  if (builds.length === 0) {
    return 'No web reader builds found.';
  }

  const lines = builds.map(b => {
    const date = new Date(b.createdAt).toLocaleString();
    const status = b.status === 'success' ? '✓' : '✗';
    return `${status} ${b.buildId}  ${date}  ${b.sourceHash.slice(0, 8)}`;
  });

  return ['BUILD ID                           DATE                    HASH', ...lines].join('\n');
}
