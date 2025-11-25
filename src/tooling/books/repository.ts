// src/tooling/books/repository.ts
import { BaseRepository } from '../database/base-repository.js';
import { DatabaseError } from '../errors/index.js';
import type { Book, CreateBookInput, UpdateBookInput } from './types.js';

const BOOK_COLUMNS = 'id, slug, title, book_type, source_path, current_version, status, created_at, updated_at';

/**
 * Repository for managing books in the database.
 * Provides CRUD operations for the books table.
 */
export class BookRepository extends BaseRepository<Book> {
  protected getIdPrefix(): string {
    return 'book';
  }

  /**
   * Get a book by its unique slug.
   */
  getBySlug(slug: string): Book | null {
    return this.execute(() => {
      const stmt = this.db.prepare(`SELECT ${BOOK_COLUMNS} FROM books WHERE slug = ?`);
      return (stmt.get(slug) as Book | undefined) ?? null;
    }, `get book by slug "${slug}"`);
  }

  /**
   * Get a book by its unique ID.
   */
  getById(id: string): Book | null {
    return this.execute(() => {
      const stmt = this.db.prepare(`SELECT ${BOOK_COLUMNS} FROM books WHERE id = ?`);
      return (stmt.get(id) as Book | undefined) ?? null;
    }, `get book by id "${id}"`);
  }

  /**
   * List all books.
   */
  list(): Book[] {
    return this.execute(() => {
      const stmt = this.db.prepare(`SELECT ${BOOK_COLUMNS} FROM books ORDER BY created_at ASC`);
      return stmt.all() as Book[];
    }, 'list books');
  }

  /**
   * Create a new book.
   */
  create(input: CreateBookInput): Book {
    return this.execute(() => {
      const status = input.status ?? 'draft';
      const currentVersion = input.current_version ?? '1.0.0';

      try {
        this.db.prepare(`
          INSERT INTO books (id, slug, title, book_type, source_path, current_version, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(input.id, input.slug, input.title, input.book_type, input.source_path, currentVersion, status);
      } catch (error) {
        this.handleConstraintError(error, {
          'UNIQUE constraint failed: books.slug': `Book with slug "${input.slug}" already exists`,
          'UNIQUE constraint failed: books.id': `Book with id "${input.id}" already exists`,
        });
        throw error;
      }

      const created = this.getById(input.id);
      if (!created) {
        throw new DatabaseError('Book was created but could not be retrieved');
      }
      return created;
    }, 'create book');
  }

  /**
   * Update an existing book.
   */
  update(id: string, updates: UpdateBookInput): Book {
    return this.execute(() => {
      const existing = this.getById(id);
      if (!existing) {
        throw new DatabaseError(`Book with id "${id}" not found`);
      }

      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.slug !== undefined) { fields.push('slug = ?'); values.push(updates.slug); }
      if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
      if (updates.book_type !== undefined) { fields.push('book_type = ?'); values.push(updates.book_type); }
      if (updates.source_path !== undefined) { fields.push('source_path = ?'); values.push(updates.source_path); }
      if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
      if (updates.current_version !== undefined) { fields.push('current_version = ?'); values.push(updates.current_version); }
      fields.push('updated_at = CURRENT_TIMESTAMP');

      try {
        this.db.prepare(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
      } catch (error) {
        this.handleConstraintError(error, {
          'UNIQUE constraint failed: books.slug': `Book with slug "${updates.slug}" already exists`,
        });
        throw error;
      }

      const updated = this.getById(id);
      if (!updated) {
        throw new DatabaseError('Book was updated but could not be retrieved');
      }
      return updated;
    }, `update book "${id}"`);
  }

  /**
   * Delete a book by ID.
   */
  delete(id: string): boolean {
    return this.execute(() => {
      const result = this.db.prepare('DELETE FROM books WHERE id = ?').run(id);
      return result.changes > 0;
    }, `delete book "${id}"`);
  }
}
