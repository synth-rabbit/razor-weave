// src/tooling/database/base-repository.ts
import type Database from 'better-sqlite3';
import { DatabaseError } from '../errors/index.js';

/**
 * Base interface for timestamped entities.
 */
export interface TimestampedEntity {
  created_at: string;
  updated_at?: string | null;
}

/**
 * Base class for database repositories.
 * Provides common patterns for error handling, transactions, and ID generation.
 *
 * @example
 * ```typescript
 * class BookRepository extends BaseRepository<Book> {
 *   protected getIdPrefix(): string {
 *     return 'book';
 *   }
 *
 *   getById(id: string): Book | null {
 *     return this.execute(
 *       () => {
 *         const stmt = this.db.prepare('SELECT * FROM books WHERE id = ?');
 *         return (stmt.get(id) as Book | undefined) ?? null;
 *       },
 *       `get book by id "${id}"`
 *     );
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<T extends TimestampedEntity> {
  protected readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Execute a database operation with standardized error handling.
   * Wraps any errors in DatabaseError with context.
   *
   * @param operation - The database operation to execute
   * @param context - Description of the operation for error messages
   * @returns The result of the operation
   * @throws DatabaseError wrapping any underlying errors
   */
  protected execute<R>(operation: () => R, context: string): R {
    try {
      return operation();
    } catch (error) {
      // Re-throw DatabaseError as-is to preserve original message
      if (error instanceof DatabaseError) {
        throw error;
      }

      // Wrap other errors with context
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Failed to ${context}: ${message}`);
    }
  }

  /**
   * Execute a function within a database transaction.
   * Automatically commits on success, rolls back on error.
   *
   * @param fn - The function to execute within the transaction
   * @returns The result of the function
   */
  protected transaction<R>(fn: () => R): R {
    return this.db.transaction(fn)();
  }

  /**
   * Generate a unique ID with the repository's prefix.
   * Format: {prefix}_{timestamp}_{random}
   *
   * @returns A unique identifier string
   */
  protected generateId(): string {
    const prefix = this.getIdPrefix();
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}${random}`;
  }

  /**
   * Get the ID prefix for this repository's entities.
   * Override in subclasses to customize ID format.
   *
   * @example
   * ```typescript
   * protected getIdPrefix(): string {
   *   return 'book'; // IDs will be like: book_lxyz123_abc456
   * }
   * ```
   */
  protected abstract getIdPrefix(): string;

  /**
   * Check for unique constraint violations and throw descriptive errors.
   * Use in create/update methods to provide better error messages.
   *
   * @param error - The caught error
   * @param constraints - Map of constraint patterns to error messages
   * @throws DatabaseError with descriptive message if constraint matched
   *
   * @example
   * ```typescript
   * this.handleConstraintError(error, {
   *   'UNIQUE constraint failed: books.slug': `Book with slug "${input.slug}" already exists`,
   *   'UNIQUE constraint failed: books.id': `Book with id "${input.id}" already exists`,
   * });
   * ```
   */
  protected handleConstraintError(
    error: unknown,
    constraints: Record<string, string>
  ): void {
    if (!(error instanceof Error)) return;

    for (const [pattern, message] of Object.entries(constraints)) {
      if (error.message.includes(pattern)) {
        throw new DatabaseError(message);
      }
    }
  }
}
