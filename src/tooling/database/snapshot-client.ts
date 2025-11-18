// src/tooling/database/snapshot-client.ts (temporary stub)
import type Database from 'better-sqlite3';

export class SnapshotClient {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }
}
