// src/tooling/database/state-client.ts
import type Database from 'better-sqlite3';
import { DatabaseError } from '../errors/index.js';

export class StateClient {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  set(key: string, value: unknown): void {
    try {
      const serialized = JSON.stringify(value);

      const stmt = this.db.prepare(`
        INSERT INTO state (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(key, serialized);
    } catch (error) {
      throw new DatabaseError(
        `Failed to set state for key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  get(key: string): unknown {
    try {
      const stmt = this.db.prepare(`
        SELECT value FROM state
        WHERE key = ? AND archived = FALSE
      `);

      const row = stmt.get(key) as { value: string } | undefined;

      if (!row) return null;

      try {
        return JSON.parse(row.value);
      } catch {
        return row.value;
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to get state for key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  delete(key: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM state WHERE key = ?
    `);

    stmt.run(key);
  }

  getAll(): Record<string, unknown> {
    const stmt = this.db.prepare(`
      SELECT key, value FROM state WHERE archived = FALSE
    `);

    const rows = stmt.all() as Array<{ key: string; value: string }>;

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }

    return result;
  }
}
