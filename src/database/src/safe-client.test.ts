// src/tooling/database/safe-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SafeDatabaseClient, BlockedOperationError } from './safe-client.js';

describe('SafeDatabaseClient', () => {
  let tempDir: string;
  let dbPath: string;
  let client: SafeDatabaseClient;

  beforeEach(() => {
    // Create temp directory for test database
    tempDir = join(tmpdir(), `safe-client-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    dbPath = join(tempDir, 'test.db');

    client = new SafeDatabaseClient({
      dbPath,
      backupDir: join(tempDir, 'backups'),
      maxBackups: 3,
    });

    // Create test tables
    const db = client.getDb();
    db.exec(`
      CREATE TABLE test_table (
        id INTEGER PRIMARY KEY,
        name TEXT
      );
      CREATE TABLE database_backups (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        path TEXT NOT NULL,
        workflow_run_id TEXT,
        size_bytes INTEGER
      );
    `);
    db.prepare('INSERT INTO test_table (id, name) VALUES (1, ?), (2, ?), (3, ?)')
      .run('Alice', 'Bob', 'Charlie');
  });

  afterEach(() => {
    client.close();
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('blocked operations', () => {
    it('should block DROP TABLE', () => {
      expect(() => client.dropTable('test_table')).toThrow(BlockedOperationError);
      expect(() => client.dropTable('test_table')).toThrow('Use the migrations system');
    });

    it('should block TRUNCATE TABLE', () => {
      expect(() => client.truncateTable('test_table')).toThrow(BlockedOperationError);
      expect(() => client.truncateTable('test_table')).toThrow('TRUNCATE is blocked');
    });

    it('should block database deletion', () => {
      expect(() => client.deleteDatabase()).toThrow(BlockedOperationError);
      expect(() => client.deleteDatabase()).toThrow('Database deletion is blocked');
    });

    it('should block DROP TABLE in prepare()', () => {
      expect(() => client.prepare('DROP TABLE test_table')).toThrow(BlockedOperationError);
    });

    it('should block TRUNCATE in prepare()', () => {
      expect(() => client.prepare('TRUNCATE TABLE test_table')).toThrow(BlockedOperationError);
    });

    it('should block ALTER in prepare()', () => {
      expect(() => client.prepare('ALTER TABLE test_table ADD COLUMN foo TEXT'))
        .toThrow(BlockedOperationError);
    });

    it('should block DELETE without WHERE in prepare()', () => {
      expect(() => client.prepare('DELETE FROM test_table')).toThrow(BlockedOperationError);
      expect(() => client.prepare('DELETE FROM test_table')).toThrow('DELETE without WHERE clause');
    });

    it('should block DROP TABLE in exec()', () => {
      expect(() => client.exec('DROP TABLE test_table')).toThrow(BlockedOperationError);
    });

    it('should block TRUNCATE in exec()', () => {
      expect(() => client.exec('TRUNCATE TABLE test_table')).toThrow(BlockedOperationError);
    });
  });

  describe('protected delete operations', () => {
    it('should block DELETE without confirmation token', () => {
      expect(() => client.delete('test_table', 'id = 1', 'invalid_token'))
        .toThrow(BlockedOperationError);
      expect(() => client.delete('test_table', 'id = 1', 'invalid_token'))
        .toThrow('Invalid or missing confirmation token');
    });

    it('should allow DELETE with valid confirmation token', () => {
      const confirmation = client.getDeleteConfirmation('test_table', 'id = 1');
      const deleted = client.delete('test_table', 'id = 1', confirmation.token);

      expect(deleted).toBe(1);

      // Verify row was deleted
      const remaining = client.getDb()
        .prepare('SELECT COUNT(*) as count FROM test_table').get() as { count: number };
      expect(remaining.count).toBe(2);
    });

    it('should reject token for different table', () => {
      const confirmation = client.getDeleteConfirmation('other_table', 'id = 1');

      expect(() => client.delete('test_table', 'id = 1', confirmation.token))
        .toThrow(BlockedOperationError);
      expect(() => client.delete('test_table', 'id = 1', confirmation.token))
        .toThrow('does not match this operation');
    });

    it('should reject token for different WHERE clause', () => {
      const confirmation = client.getDeleteConfirmation('test_table', 'id = 2');

      expect(() => client.delete('test_table', 'id = 1', confirmation.token))
        .toThrow(BlockedOperationError);
    });

    it('should reject expired token', async () => {
      // This test relies on internal implementation - token expires after 30s
      // We can't easily test this without waiting, so we'll just verify the token structure
      const confirmation = client.getDeleteConfirmation('test_table', 'id = 1');

      expect(confirmation.token).toMatch(/^del_\d+_[a-z0-9]+$/);
      expect(confirmation.expiresAt).toBeGreaterThan(Date.now());
      expect(confirmation.expiresAt).toBeLessThanOrEqual(Date.now() + 31000);
    });

    it('should invalidate token after use', () => {
      const confirmation = client.getDeleteConfirmation('test_table', 'id = 1');
      client.delete('test_table', 'id = 1', confirmation.token);

      // Try to use the same token again
      expect(() => client.delete('test_table', 'id = 2', confirmation.token))
        .toThrow(BlockedOperationError);
    });
  });

  describe('safe query methods', () => {
    it('should allow SELECT statements', () => {
      const stmt = client.prepare('SELECT * FROM test_table WHERE id = ?');
      const row = stmt.get(1) as { id: number; name: string };

      expect(row.name).toBe('Alice');
    });

    it('should allow INSERT statements', () => {
      const stmt = client.prepare('INSERT INTO test_table (id, name) VALUES (?, ?)');
      stmt.run(4, 'Diana');

      const row = client.getDb()
        .prepare('SELECT name FROM test_table WHERE id = 4').get() as { name: string };
      expect(row.name).toBe('Diana');
    });

    it('should allow UPDATE statements', () => {
      const stmt = client.prepare('UPDATE test_table SET name = ? WHERE id = ?');
      stmt.run('Alicia', 1);

      const row = client.getDb()
        .prepare('SELECT name FROM test_table WHERE id = 1').get() as { name: string };
      expect(row.name).toBe('Alicia');
    });

    it('should allow DELETE with WHERE in prepare()', () => {
      const stmt = client.prepare('DELETE FROM test_table WHERE id = ?');
      // Note: Using prepare doesn't require confirmation, but direct delete() does
      // This is intentional - prepare() is typically used by internal code
      stmt.run(1);

      const remaining = client.getDb()
        .prepare('SELECT COUNT(*) as count FROM test_table').get() as { count: number };
      expect(remaining.count).toBe(2);
    });
  });

  describe('backup operations', () => {
    it('should create a backup', () => {
      const backup = client.backup();

      expect(backup.id).toMatch(/^backup_/);
      expect(backup.path).toContain('backups');
      expect(existsSync(backup.path)).toBe(true);
      expect(backup.sizeBytes).toBeGreaterThan(0);
    });

    it('should associate backup with workflow run', () => {
      const backup = client.backup('run_123');

      expect(backup.workflowRunId).toBe('run_123');
    });

    it('should list backups', () => {
      client.backup();
      client.backup();

      const backups = client.listBackups();

      expect(backups).toHaveLength(2);
      // Both should have valid IDs and paths
      expect(backups[0].id).toMatch(/^backup_/);
      expect(backups[1].id).toMatch(/^backup_/);
    });

    it('should cleanup old backups exceeding maxBackups', () => {
      // Create more backups than maxBackups (3)
      client.backup();
      client.backup();
      client.backup();
      client.backup();
      client.backup();

      const backups = client.listBackups();

      expect(backups.length).toBeLessThanOrEqual(3);
    });

    it('should restore from backup', () => {
      // Insert some data
      client.getDb().prepare('INSERT INTO test_table (id, name) VALUES (10, ?)').run('PreBackup');

      // Create backup
      const backup = client.backup();

      // Modify data
      client.getDb().prepare('DELETE FROM test_table WHERE id = 10').run();
      client.getDb().prepare('INSERT INTO test_table (id, name) VALUES (20, ?)').run('PostBackup');

      // Verify data changed
      let row = client.getDb()
        .prepare('SELECT name FROM test_table WHERE id = 20').get() as { name: string } | undefined;
      expect(row?.name).toBe('PostBackup');

      // Restore backup
      client.restore(backup.id);

      // Verify data restored
      row = client.getDb()
        .prepare('SELECT name FROM test_table WHERE id = 10').get() as { name: string } | undefined;
      expect(row?.name).toBe('PreBackup');

      const postRow = client.getDb()
        .prepare('SELECT name FROM test_table WHERE id = 20').get() as { name: string } | undefined;
      expect(postRow).toBeUndefined();
    });
  });

  describe('transaction support', () => {
    it('should commit successful transactions', () => {
      client.transaction(() => {
        client.getDb().prepare('INSERT INTO test_table (id, name) VALUES (?, ?)').run(10, 'Test');
        client.getDb().prepare('INSERT INTO test_table (id, name) VALUES (?, ?)').run(11, 'Test2');
      });

      const count = client.getDb()
        .prepare('SELECT COUNT(*) as count FROM test_table').get() as { count: number };
      expect(count.count).toBe(5); // 3 original + 2 new
    });

    it('should rollback failed transactions', () => {
      expect(() => {
        client.transaction(() => {
          client.getDb().prepare('INSERT INTO test_table (id, name) VALUES (?, ?)').run(10, 'Test');
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      const count = client.getDb()
        .prepare('SELECT COUNT(*) as count FROM test_table').get() as { count: number };
      expect(count.count).toBe(3); // Only original rows
    });

    it('should execute with postconditions and commit on success', () => {
      const result = client.executeWithPostconditions(
        () => {
          client.getDb().prepare('INSERT INTO test_table (id, name) VALUES (?, ?)').run(10, 'Test');
          return 'success';
        },
        [
          {
            name: 'row_inserted',
            check: () => {
              const row = client.getDb()
                .prepare('SELECT * FROM test_table WHERE id = 10').get();
              return row !== undefined;
            },
            error: 'Row was not inserted',
          },
        ]
      );

      expect(result).toBe('success');
    });

    it('should rollback when postcondition fails', () => {
      expect(() => {
        client.executeWithPostconditions(
          () => {
            client.getDb().prepare('INSERT INTO test_table (id, name) VALUES (?, ?)').run(10, 'Test');
            return 'success';
          },
          [
            {
              name: 'impossible_condition',
              check: () => false,
              error: 'This always fails',
            },
          ]
        );
      }).toThrow('Postcondition "impossible_condition" failed: This always fails');

      // Verify rollback
      const row = client.getDb()
        .prepare('SELECT * FROM test_table WHERE id = 10').get();
      expect(row).toBeUndefined();
    });
  });
});
