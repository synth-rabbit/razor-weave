// src/tooling/books/repository.ts
import type Database from 'better-sqlite3';
import { DatabaseError } from '../errors/index.js';
import type { Book, CreateBookInput, UpdateBookInput } from './types.js';

/**
 * Repository for managing books in the database.
 * Provides CRUD operations for the books table.
 */
export class BookRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Get a book by its unique slug.
   * @param slug - The URL-friendly slug of the book
   * @returns The book if found, null otherwise
   */
  getBySlug(slug: string): Book | null {
    try {
      const stmt = this.db.prepare(`
        SELECT id, slug, title, book_type, source_path, current_version, status, created_at, updated_at
        FROM books
        WHERE slug = ?
      `);

      const row = stmt.get(slug) as Book | undefined;
      return row ?? null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get book by slug "${slug}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a book by its unique ID.
   * @param id - The unique identifier of the book
   * @returns The book if found, null otherwise
   */
  getById(id: string): Book | null {
    try {
      const stmt = this.db.prepare(`
        SELECT id, slug, title, book_type, source_path, current_version, status, created_at, updated_at
        FROM books
        WHERE id = ?
      `);

      const row = stmt.get(id) as Book | undefined;
      return row ?? null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get book by id "${id}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List all books.
   * @returns Array of all books
   */
  list(): Book[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, slug, title, book_type, source_path, current_version, status, created_at, updated_at
        FROM books
        ORDER BY created_at ASC
      `);

      return stmt.all() as Book[];
    } catch (error) {
      throw new DatabaseError(
        `Failed to list books: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a new book.
   * @param input - The book data to create
   * @returns The created book
   * @throws DatabaseError if slug or id already exists
   */
  create(input: CreateBookInput): Book {
    try {
      const status = input.status ?? 'draft';

      const stmt = this.db.prepare(`
        INSERT INTO books (id, slug, title, book_type, source_path, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        input.id,
        input.slug,
        input.title,
        input.book_type,
        input.source_path,
        status
      );

      // Fetch and return the created book
      const created = this.getById(input.id);
      if (!created) {
        throw new DatabaseError(`Book was created but could not be retrieved`);
      }

      return created;
    } catch (error) {
      // Check for unique constraint violations
      if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed: books.slug')) {
          throw new DatabaseError(`Book with slug "${input.slug}" already exists`);
        }
        if (error.message.includes('UNIQUE constraint failed: books.id')) {
          throw new DatabaseError(`Book with id "${input.id}" already exists`);
        }
      }

      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        `Failed to create book: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update an existing book.
   * @param id - The ID of the book to update
   * @param updates - The fields to update
   * @returns The updated book
   * @throws DatabaseError if book not found or update fails
   */
  update(id: string, updates: UpdateBookInput): Book {
    try {
      // Check if book exists
      const existing = this.getById(id);
      if (!existing) {
        throw new DatabaseError(`Book with id "${id}" not found`);
      }

      // Build dynamic UPDATE query
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.slug !== undefined) {
        fields.push('slug = ?');
        values.push(updates.slug);
      }
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.book_type !== undefined) {
        fields.push('book_type = ?');
        values.push(updates.book_type);
      }
      if (updates.source_path !== undefined) {
        fields.push('source_path = ?');
        values.push(updates.source_path);
      }
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }

      // Always update updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) {
        // Only updated_at was set, nothing else to update
        // Still run the update to bump updated_at
      }

      const stmt = this.db.prepare(`
        UPDATE books
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      values.push(id);
      stmt.run(...values);

      // Fetch and return the updated book
      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError(`Book was updated but could not be retrieved`);
      }

      return updated;
    } catch (error) {
      // Check for unique constraint violations on slug
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: books.slug')) {
        throw new DatabaseError(`Book with slug "${updates.slug}" already exists`);
      }

      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        `Failed to update book "${id}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a book by ID.
   * @param id - The ID of the book to delete
   * @returns true if deleted, false if not found
   */
  delete(id: string): boolean {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM books
        WHERE id = ?
      `);

      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete book "${id}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
