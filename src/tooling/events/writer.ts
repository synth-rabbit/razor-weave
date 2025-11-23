// src/tooling/events/writer.ts
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { DatabaseEvent, EventOperation } from './types';

export class EventWriter {
  private readonly eventsDir: string;
  private readonly sessionId: string;
  private readonly worktree: string;
  private readonly filePath: string;

  constructor(eventsDir: string, sessionId: string, worktree: string) {
    this.eventsDir = eventsDir;
    this.sessionId = sessionId;
    this.worktree = worktree;

    // Ensure directory exists
    if (!existsSync(eventsDir)) {
      mkdirSync(eventsDir, { recursive: true });
    }

    // Generate file path with date prefix
    const date = new Date().toISOString().split('T')[0];
    this.filePath = join(eventsDir, `${date}-${sessionId}.jsonl`);
  }

  write(
    table: string,
    op: 'INSERT',
    data: Record<string, unknown>
  ): void;
  write(
    table: string,
    op: 'UPDATE' | 'DELETE',
    data: Record<string, unknown>,
    key: string
  ): void;
  write(
    table: string,
    op: EventOperation,
    data: Record<string, unknown>,
    key?: string
  ): void {
    const baseEvent = {
      id: `evt_${randomUUID().slice(0, 8)}`,
      ts: new Date().toISOString(),
      worktree: this.worktree,
      table,
      op,
    };

    let event: DatabaseEvent;
    if (op === 'INSERT') {
      event = { ...baseEvent, op: 'INSERT', data };
    } else if (op === 'UPDATE') {
      event = { ...baseEvent, op: 'UPDATE', key: key!, data };
    } else {
      event = { ...baseEvent, op: 'DELETE', key: key! };
    }

    appendFileSync(this.filePath, JSON.stringify(event) + '\n');
  }

  getFilePath(): string {
    return this.filePath;
  }
}
