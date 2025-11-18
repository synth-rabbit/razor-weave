// src/tooling/database/artifact-client.ts (temporary stub)
import type Database from 'better-sqlite3';

export class ArtifactClient {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }
}
