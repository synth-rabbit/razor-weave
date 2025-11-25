// @razorweave/events - EventWriter
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { DatabaseEvent, EventOperation } from './types';

export class EventWriter {
  private readonly eventsDir: string;
  private readonly sessionId: string;
  private readonly worktree: string;
  private readonly filePath: string;
  private seenIdempotencyKeys: Set<string>;

  constructor(eventsDir: string, sessionId: string, worktree: string) {
    this.eventsDir = eventsDir;
    this.sessionId = sessionId;
    this.worktree = worktree;
    this.seenIdempotencyKeys = new Set();

    // Ensure directory exists
    if (!existsSync(eventsDir)) {
      mkdirSync(eventsDir, { recursive: true });
    }

    // Generate file path with date prefix
    const date = new Date().toISOString().split('T')[0];
    this.filePath = join(eventsDir, `${date}-${sessionId}.jsonl`);

    // Load existing idempotency keys from file
    this.loadExistingIdempotencyKeys();
  }

  /**
   * Load existing idempotency keys from the event file
   */
  private loadExistingIdempotencyKeys(): void {
    if (!existsSync(this.filePath)) return;

    try {
      const content = readFileSync(this.filePath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        const event = JSON.parse(line);
        if (event.idempotency_key) {
          this.seenIdempotencyKeys.add(event.idempotency_key);
        }
      }
    } catch {
      // Ignore errors reading file
    }
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

  /**
   * Write an event with idempotency protection.
   * If the same idempotency key has been used before, the write is skipped.
   */
  writeIdempotent(
    idempotencyKey: string,
    table: string,
    op: 'INSERT',
    data: Record<string, unknown>
  ): boolean;
  writeIdempotent(
    idempotencyKey: string,
    table: string,
    op: 'UPDATE' | 'DELETE',
    data: Record<string, unknown>,
    key: string
  ): boolean;
  writeIdempotent(
    idempotencyKey: string,
    table: string,
    op: EventOperation,
    data: Record<string, unknown>,
    key?: string
  ): boolean {
    // Check if we've already processed this idempotency key
    if (this.seenIdempotencyKeys.has(idempotencyKey)) {
      return false; // Skip duplicate
    }

    const baseEvent = {
      id: `evt_${randomUUID().slice(0, 8)}`,
      ts: new Date().toISOString(),
      worktree: this.worktree,
      table,
      op,
      idempotency_key: idempotencyKey,
    };

    let event: Record<string, unknown>;
    if (op === 'INSERT') {
      event = { ...baseEvent, op: 'INSERT', data };
    } else if (op === 'UPDATE') {
      event = { ...baseEvent, op: 'UPDATE', key: key!, data };
    } else {
      event = { ...baseEvent, op: 'DELETE', key: key! };
    }

    appendFileSync(this.filePath, JSON.stringify(event) + '\n');
    this.seenIdempotencyKeys.add(idempotencyKey);
    return true;
  }
}
