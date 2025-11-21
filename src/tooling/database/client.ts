// src/tooling/database/client.ts
import Database from 'better-sqlite3';
import { join } from 'path';
import { createTables } from './schema.js';
import { StateClient } from './state-client.js';
import { SnapshotClient } from './snapshot-client.js';
import { ArtifactClient } from './artifact-client.js';
import { PersonaClient } from './persona-client.js';

export class ProjectDatabase {
  private db: Database.Database;

  public readonly state: StateClient;
  public readonly snapshots: SnapshotClient;
  public readonly artifacts: ArtifactClient;
  public readonly personas: PersonaClient;

  constructor(dbPath?: string) {
    const finalPath = dbPath || join(process.cwd(), 'data', 'project.db');

    this.db = new Database(finalPath);
    this.db.pragma('journal_mode = WAL');

    // Initialize schema
    createTables(this.db);

    // Initialize clients
    this.state = new StateClient(this.db);
    this.snapshots = new SnapshotClient(this.db);
    this.artifacts = new ArtifactClient(this.db);
    this.personas = new PersonaClient(this.db);
  }

  close(): void {
    this.db.close();
  }

  getDb(): Database.Database {
    return this.db;
  }
}

// Singleton instance
let dbInstance: ProjectDatabase | null = null;

export function getDatabase(): ProjectDatabase {
  if (!dbInstance) {
    dbInstance = new ProjectDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
