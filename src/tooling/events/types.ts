// src/tooling/events/types.ts
export type EventOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface BaseEvent {
  id: string;
  ts: string;           // ISO timestamp
  worktree: string;     // worktree identifier
  table: string;        // target table name
  op: EventOperation;   // operation type
}

export interface InsertEvent extends BaseEvent {
  op: 'INSERT';
  data: Record<string, unknown>;
}

export interface UpdateEvent extends BaseEvent {
  op: 'UPDATE';
  key: string;          // primary key value
  data: Record<string, unknown>;
}

export interface DeleteEvent extends BaseEvent {
  op: 'DELETE';
  key: string;          // primary key value
}

export type DatabaseEvent = InsertEvent | UpdateEvent | DeleteEvent;

export interface EventFile {
  path: string;
  sessionId: string;
  date: string;
  events: DatabaseEvent[];
}
