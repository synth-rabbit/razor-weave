// src/tooling/database/artifact-client.ts
import type Database from 'better-sqlite3';
import type { DataArtifact } from './types.js';

export class ArtifactClient {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  create(path: string, content: string, type: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO data_artifacts (
        artifact_type, artifact_path, content, created_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(type, path, content);
    return result.lastInsertRowid as number;
  }

  get(id: number): DataArtifact | null {
    const stmt = this.db.prepare(`
      SELECT * FROM data_artifacts
      WHERE id = ? AND archived = FALSE
    `);

    const row = stmt.get(id);
    return row ? (row as DataArtifact) : null;
  }

  getByPath(path: string): DataArtifact[] {
    const stmt = this.db.prepare(`
      SELECT * FROM data_artifacts
      WHERE artifact_path = ? AND archived = FALSE
      ORDER BY created_at DESC
    `);

    return stmt.all(path) as DataArtifact[];
  }

  archive(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE data_artifacts
      SET archived = TRUE, archived_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
  }
}
