// src/tooling/events/materializer.ts
import { existsSync, copyFileSync, rmSync } from 'fs';
import Database from 'better-sqlite3';
import { EventReader } from './reader';
import type { DatabaseEvent, InsertEvent, UpdateEvent, DeleteEvent } from './types';

interface TableConfig {
  name: string;
  primaryKey: string;
}

export class Materializer {
  private readonly eventsDir: string;
  private readonly dbPath: string;
  private readonly tables: Map<string, TableConfig> = new Map();

  constructor(eventsDir: string, dbPath: string) {
    this.eventsDir = eventsDir;
    this.dbPath = dbPath;
  }

  registerTable(name: string, primaryKey: string): void {
    this.tables.set(name, { name, primaryKey });
  }

  materialize(): void {
    // Backup existing DB
    if (existsSync(this.dbPath)) {
      copyFileSync(this.dbPath, `${this.dbPath}.backup`);
      rmSync(this.dbPath);
    }

    // Read all events
    const reader = new EventReader(this.eventsDir);
    const events = reader.readAll();

    // Create new DB and apply events
    const db = new Database(this.dbPath);

    try {
      // Process events by table
      const tableEvents = new Map<string, DatabaseEvent[]>();
      for (const event of events) {
        if (!tableEvents.has(event.table)) {
          tableEvents.set(event.table, []);
        }
        tableEvents.get(event.table)!.push(event);
      }

      // Create tables and apply events
      for (const [tableName, tableEventList] of tableEvents) {
        const config = this.tables.get(tableName);
        if (!config) continue;

        // Infer schema from INSERT events
        const insertEvent = tableEventList.find(e => e.op === 'INSERT') as InsertEvent | undefined;
        if (!insertEvent) continue;

        const columns = Object.keys(insertEvent.data);
        const createSql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.map(c => `${c} TEXT`).join(', ')})`;
        db.exec(createSql);

        // Apply events in order
        for (const event of tableEventList) {
          this.applyEvent(db, event, config);
        }
      }
    } finally {
      db.close();
    }
  }

  private applyEvent(db: Database.Database, event: DatabaseEvent, config: TableConfig): void {
    if (event.op === 'INSERT') {
      const insertEvent = event as InsertEvent;
      const columns = Object.keys(insertEvent.data);
      const values = columns.map(c => insertEvent.data[c]);
      const placeholders = columns.map(() => '?').join(', ');

      db.prepare(`INSERT OR REPLACE INTO ${event.table} (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
    } else if (event.op === 'UPDATE') {
      const updateEvent = event as UpdateEvent;
      const columns = Object.keys(updateEvent.data);
      const setClauses = columns.map(c => `${c} = ?`).join(', ');
      const values = [...columns.map(c => updateEvent.data[c]), updateEvent.key];

      db.prepare(`UPDATE ${event.table} SET ${setClauses} WHERE ${config.primaryKey} = ?`).run(...values);
    } else if (event.op === 'DELETE') {
      const deleteEvent = event as DeleteEvent;
      db.prepare(`DELETE FROM ${event.table} WHERE ${config.primaryKey} = ?`).run(deleteEvent.key);
    }
  }
}
