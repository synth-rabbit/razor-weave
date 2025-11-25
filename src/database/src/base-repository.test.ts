// src/tooling/database/base-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { BaseRepository, TimestampedEntity } from './base-repository.js';
import { DatabaseError } from './errors.js';

// Test entity type
interface TestEntity extends TimestampedEntity {
  id: string;
  name: string;
}

// Concrete implementation for testing
class TestRepository extends BaseRepository<TestEntity> {
  protected getIdPrefix(): string {
    return 'test';
  }

  // Expose protected methods for testing
  public testExecute<R>(operation: () => R, context: string): R {
    return this.execute(operation, context);
  }

  public testTransaction<R>(fn: () => R): R {
    return this.transaction(fn);
  }

  public testGenerateId(): string {
    return this.generateId();
  }

  public testHandleConstraintError(
    error: unknown,
    constraints: Record<string, string>
  ): void {
    return this.handleConstraintError(error, constraints);
  }

  // Simple CRUD for integration testing
  create(name: string): TestEntity {
    return this.execute(() => {
      const id = this.generateId();
      this.db.prepare(`
        INSERT INTO test_entities (id, name, created_at)
        VALUES (?, ?, datetime('now'))
      `).run(id, name);

      return this.getById(id)!;
    }, `create test entity "${name}"`);
  }

  getById(id: string): TestEntity | null {
    return this.execute(() => {
      const row = this.db.prepare(`
        SELECT id, name, created_at, updated_at
        FROM test_entities WHERE id = ?
      `).get(id) as TestEntity | undefined;
      return row ?? null;
    }, `get test entity by id "${id}"`);
  }

  list(): TestEntity[] {
    return this.execute(() => {
      return this.db.prepare(`
        SELECT id, name, created_at, updated_at
        FROM test_entities ORDER BY created_at
      `).all() as TestEntity[];
    }, 'list test entities');
  }
}

describe('BaseRepository', () => {
  let db: Database.Database;
  let repo: TestRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE test_entities (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT
      )
    `);
    repo = new TestRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('execute', () => {
    it('should return result on success', () => {
      const result = repo.testExecute(() => 42, 'test operation');
      expect(result).toBe(42);
    });

    it('should wrap errors in DatabaseError with context', () => {
      expect(() => {
        repo.testExecute(() => {
          throw new Error('underlying error');
        }, 'test operation');
      }).toThrow(DatabaseError);

      expect(() => {
        repo.testExecute(() => {
          throw new Error('underlying error');
        }, 'test operation');
      }).toThrow('Failed to test operation: underlying error');
    });

    it('should re-throw DatabaseError without wrapping', () => {
      const originalError = new DatabaseError('original message');
      expect(() => {
        repo.testExecute(() => {
          throw originalError;
        }, 'test operation');
      }).toThrow(originalError);
    });

    it('should handle non-Error throws', () => {
      expect(() => {
        repo.testExecute(() => {
          throw 'string error';
        }, 'test operation');
      }).toThrow('Failed to test operation: string error');
    });
  });

  describe('transaction', () => {
    it('should commit on success', () => {
      repo.testTransaction(() => {
        db.prepare("INSERT INTO test_entities (id, name, created_at) VALUES ('t1', 'test', datetime('now'))").run();
      });

      const result = db.prepare('SELECT COUNT(*) as count FROM test_entities').get() as { count: number };
      expect(result.count).toBe(1);
    });

    it('should rollback on error', () => {
      try {
        repo.testTransaction(() => {
          db.prepare("INSERT INTO test_entities (id, name, created_at) VALUES ('t1', 'test', datetime('now'))").run();
          throw new Error('intentional error');
        });
      } catch {
        // Expected
      }

      const result = db.prepare('SELECT COUNT(*) as count FROM test_entities').get() as { count: number };
      expect(result.count).toBe(0);
    });
  });

  describe('generateId', () => {
    it('should generate IDs with the correct prefix', () => {
      const id = repo.testGenerateId();
      expect(id).toMatch(/^test_[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(repo.testGenerateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('handleConstraintError', () => {
    it('should throw DatabaseError for matching constraint', () => {
      const error = new Error('UNIQUE constraint failed: test_entities.name');
      expect(() => {
        repo.testHandleConstraintError(error, {
          'UNIQUE constraint failed: test_entities.name': 'Name must be unique',
        });
      }).toThrow(DatabaseError);
      expect(() => {
        repo.testHandleConstraintError(error, {
          'UNIQUE constraint failed: test_entities.name': 'Name must be unique',
        });
      }).toThrow('Name must be unique');
    });

    it('should not throw for non-matching constraint', () => {
      const error = new Error('some other error');
      expect(() => {
        repo.testHandleConstraintError(error, {
          'UNIQUE constraint failed: test_entities.name': 'Name must be unique',
        });
      }).not.toThrow();
    });

    it('should handle non-Error input gracefully', () => {
      expect(() => {
        repo.testHandleConstraintError('not an error', {
          'UNIQUE constraint failed': 'Should not match',
        });
      }).not.toThrow();
    });
  });

  describe('integration: CRUD operations', () => {
    it('should create and retrieve entities', () => {
      const entity = repo.create('test-item');

      expect(entity.id).toMatch(/^test_/);
      expect(entity.name).toBe('test-item');
      expect(entity.created_at).toBeDefined();
    });

    it('should list entities', () => {
      repo.create('item-1');
      repo.create('item-2');
      repo.create('item-3');

      const entities = repo.list();
      expect(entities).toHaveLength(3);
      expect(entities.map((e) => e.name)).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('should return null for non-existent entity', () => {
      const entity = repo.getById('nonexistent');
      expect(entity).toBeNull();
    });
  });
});
