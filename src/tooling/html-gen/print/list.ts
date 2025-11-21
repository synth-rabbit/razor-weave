/**
 * List Print Builds
 */

import { HtmlBuildClient } from '../build-client.js';
import type Database from 'better-sqlite3';

export interface ListResult {
  builds: Array<{
    buildId: string;
    createdAt: string;
    status: string;
    sourceHash: string;
  }>;
}

export function listPrintBuilds(db: Database.Database, limit = 10): ListResult {
  const client = new HtmlBuildClient(db);
  const builds = client.listBuilds('print-design', limit);

  return {
    builds: builds.map(b => ({
      buildId: b.buildId,
      createdAt: b.createdAt,
      status: b.status,
      sourceHash: b.sourceHash,
    })),
  };
}
