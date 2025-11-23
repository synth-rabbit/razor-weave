// src/tooling/events/types.test.ts
import { describe, it, expect } from 'vitest';
import type { DatabaseEvent, InsertEvent, UpdateEvent, DeleteEvent } from './types';

describe('Event Types', () => {
  it('should accept valid INSERT event', () => {
    const event: InsertEvent = {
      id: 'evt_001',
      ts: '2024-11-22T10:00:00Z',
      worktree: 'main',
      table: 'vp_plans',
      op: 'INSERT',
      data: { name: 'test' }
    };
    expect(event.op).toBe('INSERT');
  });

  it('should accept valid UPDATE event', () => {
    const event: UpdateEvent = {
      id: 'evt_002',
      ts: '2024-11-22T10:00:00Z',
      worktree: 'main',
      table: 'vp_plans',
      op: 'UPDATE',
      key: 'plan_001',
      data: { name: 'updated' }
    };
    expect(event.op).toBe('UPDATE');
  });

  it('should accept valid DELETE event', () => {
    const event: DeleteEvent = {
      id: 'evt_003',
      ts: '2024-11-22T10:00:00Z',
      worktree: 'main',
      table: 'vp_plans',
      op: 'DELETE',
      key: 'plan_001'
    };
    expect(event.op).toBe('DELETE');
  });

  it('should work with DatabaseEvent union type', () => {
    const events: DatabaseEvent[] = [
      { id: '1', ts: '', worktree: '', table: 't', op: 'INSERT', data: {} },
      { id: '2', ts: '', worktree: '', table: 't', op: 'UPDATE', key: 'k', data: {} },
      { id: '3', ts: '', worktree: '', table: 't', op: 'DELETE', key: 'k' }
    ];
    expect(events).toHaveLength(3);
  });
});
