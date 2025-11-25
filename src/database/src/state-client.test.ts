// src/tooling/database/state-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDatabase } from './client.js';
import { unlinkSync, mkdirSync } from 'fs';

describe('StateClient', () => {
  let db: ProjectDatabase;
  const testDbPath = 'data/test-state.db';

  beforeEach(() => {
    // Ensure data directory exists
    mkdirSync('data', { recursive: true });
    db = new ProjectDatabase(testDbPath);
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
    } catch {
      // Ignore if files don't exist
    }
  });

  it('should set and get state values', () => {
    db.state.set('test_key', 'test_value');
    const value = db.state.get('test_key');

    expect(value).toBe('test_value');
  });

  it('should handle JSON values', () => {
    const obj = { foo: 'bar', count: 42 };
    db.state.set('json_key', obj);
    const retrieved = db.state.get('json_key');

    expect(retrieved).toEqual(obj);
  });

  it('should return null for non-existent keys', () => {
    const value = db.state.get('non_existent');
    expect(value).toBeNull();
  });

  it('should delete state values', () => {
    db.state.set('delete_me', 'value');
    db.state.delete('delete_me');

    const value = db.state.get('delete_me');
    expect(value).toBeNull();
  });

  it('should get all state entries', () => {
    db.state.set('key1', 'value1');
    db.state.set('key2', { nested: 'object' });

    const all = db.state.getAll();

    expect(all).toEqual({
      key1: 'value1',
      key2: { nested: 'object' }
    });
  });
});
