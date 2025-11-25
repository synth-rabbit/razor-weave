// src/tooling/events/materializer.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Materializer } from './materializer';
import { EventWriter } from './writer';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, rmSync, copyFileSync } from 'fs';

const TEST_EVENTS_DIR = 'data/test-materialize-events';
const TEST_DB = 'data/test-materialize.db';
const TEST_BACKUP = 'data/test-materialize.db.backup';

describe('Materializer', () => {
  beforeEach(() => {
    // Clean up
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB)) rmSync(TEST_DB);
    if (existsSync(TEST_BACKUP)) rmSync(TEST_BACKUP);
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_DB)) rmSync(TEST_DB);
    if (existsSync(TEST_BACKUP)) rmSync(TEST_BACKUP);
  });

  it('should create database from events', () => {
    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'test' });

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');
    materializer.materialize();

    expect(existsSync(TEST_DB)).toBe(true);

    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM test_table').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect((rows[0] as any).name).toBe('test');
  });

  it('should handle UPDATE events', () => {
    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'original' });
    writer.write('test_table', 'UPDATE', { name: 'updated' }, '1');

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');
    materializer.materialize();

    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM test_table').all();
    db.close();

    expect(rows).toHaveLength(1);
    expect((rows[0] as any).name).toBe('updated');
  });

  it('should handle DELETE events', () => {
    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'test' });
    writer.write('test_table', 'DELETE', {}, '1');

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');
    materializer.materialize();

    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM test_table').all();
    db.close();

    expect(rows).toHaveLength(0);
  });

  it('should create backup before materialize if DB exists', () => {
    // Create initial DB
    const db = new Database(TEST_DB);
    db.exec('CREATE TABLE test (id TEXT)');
    db.exec("INSERT INTO test VALUES ('old')");
    db.close();

    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'new' });

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');
    materializer.materialize();

    expect(existsSync(TEST_BACKUP)).toBe(true);

    // Verify backup has old data
    const backupDb = new Database(TEST_BACKUP);
    const oldRows = backupDb.prepare('SELECT * FROM test').all();
    backupDb.close();

    expect(oldRows).toHaveLength(1);
    expect((oldRows[0] as any).id).toBe('old');
  });

  it('should be idempotent - same result on multiple runs', () => {
    const writer = new EventWriter(TEST_EVENTS_DIR, 'session1', 'main');
    writer.write('test_table', 'INSERT', { id: '1', name: 'test' });

    const materializer = new Materializer(TEST_EVENTS_DIR, TEST_DB);
    materializer.registerTable('test_table', 'id');

    // Run twice
    materializer.materialize();
    materializer.materialize();

    const db = new Database(TEST_DB);
    const rows = db.prepare('SELECT * FROM test_table').all();
    db.close();

    expect(rows).toHaveLength(1);
  });
});
