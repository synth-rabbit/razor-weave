/**
 * Diff Print Builds
 */

import { HtmlBuildClient, type BuildDiff } from '../build-client.js';
import type Database from 'better-sqlite3';

export interface DiffResult {
  fromBuildId: string;
  toBuildId: string;
  diff: BuildDiff;
}

export function diffPrintBuild(
  db: Database.Database,
  fromBuildId: string,
  toBuildId: string
): DiffResult {
  const client = new HtmlBuildClient(db);
  const diff = client.diffBuilds(fromBuildId, toBuildId);

  return {
    fromBuildId,
    toBuildId,
    diff,
  };
}
