// src/tooling/events/reader.ts
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { DatabaseEvent } from './types';

export class EventReader {
  private readonly eventsDir: string;

  constructor(eventsDir: string) {
    this.eventsDir = eventsDir;
  }

  readAll(): DatabaseEvent[] {
    if (!existsSync(this.eventsDir)) {
      return [];
    }

    const files = readdirSync(this.eventsDir)
      .filter(f => f.endsWith('.jsonl'))
      .sort(); // Alphabetical = chronological with YYYY-MM-DD prefix

    const events: DatabaseEvent[] = [];

    for (const file of files) {
      const content = readFileSync(join(this.eventsDir, file), 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        events.push(JSON.parse(line) as DatabaseEvent);
      }
    }

    return events;
  }

  readByTable(table: string): DatabaseEvent[] {
    return this.readAll().filter(e => e.table === table);
  }

  readBySession(sessionId: string): DatabaseEvent[] {
    if (!existsSync(this.eventsDir)) {
      return [];
    }

    const files = readdirSync(this.eventsDir)
      .filter(f => f.endsWith('.jsonl') && f.includes(sessionId))
      .sort();

    const events: DatabaseEvent[] = [];

    for (const file of files) {
      const content = readFileSync(join(this.eventsDir, file), 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        events.push(JSON.parse(line) as DatabaseEvent);
      }
    }

    return events;
  }
}
