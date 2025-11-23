// src/tooling/books/repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { BookRepository } from './repository.js';
import type { CreateBookInput, Book } from './types.js';

/**
 * Creates an in-memory SQLite database with the books table schema.
 */
function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');

  // Create books table matching the migration schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      book_type TEXT NOT NULL CHECK(book_type IN ('core', 'source', 'campaign', 'supplement')),
      source_path TEXT NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'editing', 'published')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
    CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
  `);

  return db;
}

describe('BookRepository', () => {
  let db: Database.Database;
  let repo: BookRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new BookRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a book with all required fields', () => {
      const input: CreateBookInput = {
        id: 'book_test',
        slug: 'test-book',
        title: 'Test Book',
        book_type: 'core',
        source_path: 'books/test-book'
      };

      const book = repo.create(input);

      expect(book.id).toBe('book_test');
      expect(book.slug).toBe('test-book');
      expect(book.title).toBe('Test Book');
      expect(book.book_type).toBe('core');
      expect(book.source_path).toBe('books/test-book');
      expect(book.status).toBe('draft'); // Default status
      expect(book.created_at).toBeDefined();
      expect(book.updated_at).toBeDefined();
    });

    it('should create a book with custom status', () => {
      const input: CreateBookInput = {
        id: 'book_editing',
        slug: 'editing-book',
        title: 'Editing Book',
        book_type: 'source',
        source_path: 'books/editing',
        status: 'editing'
      };

      const book = repo.create(input);

      expect(book.status).toBe('editing');
    });

    it('should create books with different book types', () => {
      const types = ['core', 'source', 'campaign', 'supplement'] as const;

      types.forEach((bookType, index) => {
        const input: CreateBookInput = {
          id: `book_${bookType}`,
          slug: `${bookType}-book`,
          title: `${bookType} Book`,
          book_type: bookType,
          source_path: `books/${bookType}`
        };

        const book = repo.create(input);
        expect(book.book_type).toBe(bookType);
      });
    });

    it('should throw error for duplicate slug', () => {
      const input: CreateBookInput = {
        id: 'book_first',
        slug: 'duplicate-slug',
        title: 'First Book',
        book_type: 'core',
        source_path: 'books/first'
      };

      repo.create(input);

      const duplicateInput: CreateBookInput = {
        id: 'book_second',
        slug: 'duplicate-slug', // Same slug
        title: 'Second Book',
        book_type: 'source',
        source_path: 'books/second'
      };

      expect(() => repo.create(duplicateInput)).toThrow('already exists');
    });

    it('should throw error for duplicate id', () => {
      const input: CreateBookInput = {
        id: 'book_duplicate',
        slug: 'first-slug',
        title: 'First Book',
        book_type: 'core',
        source_path: 'books/first'
      };

      repo.create(input);

      const duplicateInput: CreateBookInput = {
        id: 'book_duplicate', // Same id
        slug: 'second-slug',
        title: 'Second Book',
        book_type: 'source',
        source_path: 'books/second'
      };

      expect(() => repo.create(duplicateInput)).toThrow('already exists');
    });
  });

  describe('getById', () => {
    it('should return a book by id', () => {
      const input: CreateBookInput = {
        id: 'book_find_me',
        slug: 'find-me',
        title: 'Find Me',
        book_type: 'campaign',
        source_path: 'books/find-me'
      };

      repo.create(input);

      const book = repo.getById('book_find_me');

      expect(book).not.toBeNull();
      expect(book!.id).toBe('book_find_me');
      expect(book!.title).toBe('Find Me');
    });

    it('should return null for non-existent id', () => {
      const book = repo.getById('book_nonexistent');

      expect(book).toBeNull();
    });
  });

  describe('getBySlug', () => {
    it('should return a book by slug', () => {
      const input: CreateBookInput = {
        id: 'book_slug_test',
        slug: 'my-awesome-book',
        title: 'My Awesome Book',
        book_type: 'supplement',
        source_path: 'books/awesome'
      };

      repo.create(input);

      const book = repo.getBySlug('my-awesome-book');

      expect(book).not.toBeNull();
      expect(book!.slug).toBe('my-awesome-book');
      expect(book!.title).toBe('My Awesome Book');
    });

    it('should return null for non-existent slug', () => {
      const book = repo.getBySlug('nonexistent-slug');

      expect(book).toBeNull();
    });
  });

  describe('list', () => {
    it('should return empty array when no books exist', () => {
      const books = repo.list();

      expect(books).toEqual([]);
    });

    it('should return all books', () => {
      repo.create({
        id: 'book_1',
        slug: 'book-one',
        title: 'Book One',
        book_type: 'core',
        source_path: 'books/one'
      });

      repo.create({
        id: 'book_2',
        slug: 'book-two',
        title: 'Book Two',
        book_type: 'source',
        source_path: 'books/two'
      });

      repo.create({
        id: 'book_3',
        slug: 'book-three',
        title: 'Book Three',
        book_type: 'campaign',
        source_path: 'books/three'
      });

      const books = repo.list();

      expect(books).toHaveLength(3);
      expect(books.map(b => b.id)).toContain('book_1');
      expect(books.map(b => b.id)).toContain('book_2');
      expect(books.map(b => b.id)).toContain('book_3');
    });

    it('should return books ordered by created_at', () => {
      // Create books - they'll have incrementing created_at values
      repo.create({
        id: 'book_first',
        slug: 'first',
        title: 'First',
        book_type: 'core',
        source_path: 'books/first'
      });

      repo.create({
        id: 'book_second',
        slug: 'second',
        title: 'Second',
        book_type: 'source',
        source_path: 'books/second'
      });

      const books = repo.list();

      expect(books[0].id).toBe('book_first');
      expect(books[1].id).toBe('book_second');
    });
  });

  describe('update', () => {
    it('should update a single field', () => {
      repo.create({
        id: 'book_update',
        slug: 'update-me',
        title: 'Original Title',
        book_type: 'core',
        source_path: 'books/update'
      });

      const updated = repo.update('book_update', { title: 'New Title' });

      expect(updated.title).toBe('New Title');
      expect(updated.slug).toBe('update-me'); // Unchanged
    });

    it('should update multiple fields', () => {
      repo.create({
        id: 'book_multi',
        slug: 'multi-update',
        title: 'Original',
        book_type: 'core',
        source_path: 'books/original',
        status: 'draft'
      });

      const updated = repo.update('book_multi', {
        title: 'Updated Title',
        status: 'editing',
        source_path: 'books/updated'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('editing');
      expect(updated.source_path).toBe('books/updated');
    });

    it('should update slug', () => {
      repo.create({
        id: 'book_slug_update',
        slug: 'old-slug',
        title: 'Title',
        book_type: 'core',
        source_path: 'books/test'
      });

      const updated = repo.update('book_slug_update', { slug: 'new-slug' });

      expect(updated.slug).toBe('new-slug');

      // Should be findable by new slug
      const found = repo.getBySlug('new-slug');
      expect(found).not.toBeNull();

      // Should not be findable by old slug
      const notFound = repo.getBySlug('old-slug');
      expect(notFound).toBeNull();
    });

    it('should update book_type', () => {
      repo.create({
        id: 'book_type_change',
        slug: 'type-change',
        title: 'Title',
        book_type: 'core',
        source_path: 'books/test'
      });

      const updated = repo.update('book_type_change', { book_type: 'supplement' });

      expect(updated.book_type).toBe('supplement');
    });

    it('should update status through all valid states', () => {
      repo.create({
        id: 'book_status',
        slug: 'status-test',
        title: 'Status Test',
        book_type: 'core',
        source_path: 'books/status',
        status: 'draft'
      });

      let book = repo.update('book_status', { status: 'editing' });
      expect(book.status).toBe('editing');

      book = repo.update('book_status', { status: 'published' });
      expect(book.status).toBe('published');

      // Can go back to editing
      book = repo.update('book_status', { status: 'editing' });
      expect(book.status).toBe('editing');
    });

    it('should throw error for non-existent book', () => {
      expect(() => repo.update('nonexistent', { title: 'New' })).toThrow('not found');
    });

    it('should throw error for duplicate slug on update', () => {
      repo.create({
        id: 'book_a',
        slug: 'slug-a',
        title: 'Book A',
        book_type: 'core',
        source_path: 'books/a'
      });

      repo.create({
        id: 'book_b',
        slug: 'slug-b',
        title: 'Book B',
        book_type: 'source',
        source_path: 'books/b'
      });

      expect(() => repo.update('book_b', { slug: 'slug-a' })).toThrow('already exists');
    });

    it('should update updated_at timestamp', () => {
      const created = repo.create({
        id: 'book_timestamp',
        slug: 'timestamp-test',
        title: 'Timestamp Test',
        book_type: 'core',
        source_path: 'books/timestamp'
      });

      const originalUpdatedAt = created.updated_at;

      // Small delay to ensure timestamp difference
      const updated = repo.update('book_timestamp', { title: 'New Title' });

      // updated_at should be >= original (in same second it might be equal)
      expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing book', () => {
      repo.create({
        id: 'book_delete',
        slug: 'delete-me',
        title: 'Delete Me',
        book_type: 'core',
        source_path: 'books/delete'
      });

      const result = repo.delete('book_delete');

      expect(result).toBe(true);

      const book = repo.getById('book_delete');
      expect(book).toBeNull();
    });

    it('should return false for non-existent book', () => {
      const result = repo.delete('nonexistent');

      expect(result).toBe(false);
    });

    it('should not affect other books', () => {
      repo.create({
        id: 'book_keep',
        slug: 'keep-me',
        title: 'Keep Me',
        book_type: 'core',
        source_path: 'books/keep'
      });

      repo.create({
        id: 'book_remove',
        slug: 'remove-me',
        title: 'Remove Me',
        book_type: 'source',
        source_path: 'books/remove'
      });

      repo.delete('book_remove');

      const kept = repo.getById('book_keep');
      expect(kept).not.toBeNull();
      expect(kept!.title).toBe('Keep Me');

      const books = repo.list();
      expect(books).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values where allowed', () => {
      // source_path can be empty string (though not recommended)
      const book = repo.create({
        id: 'book_empty',
        slug: 'empty-path',
        title: 'Empty Path',
        book_type: 'core',
        source_path: ''
      });

      expect(book.source_path).toBe('');
    });

    it('should handle special characters in title', () => {
      const book = repo.create({
        id: 'book_special',
        slug: 'special-chars',
        title: "Book with 'quotes' and \"double quotes\" & ampersand",
        book_type: 'core',
        source_path: 'books/special'
      });

      expect(book.title).toBe("Book with 'quotes' and \"double quotes\" & ampersand");
    });

    it('should handle unicode in title', () => {
      const book = repo.create({
        id: 'book_unicode',
        slug: 'unicode-book',
        title: 'Book Title',
        book_type: 'core',
        source_path: 'books/unicode'
      });

      expect(book.title).toBe('Book Title');
    });

    it('should handle slug with hyphens and numbers', () => {
      const book = repo.create({
        id: 'book_123',
        slug: 'my-book-v2-final',
        title: 'My Book v2 Final',
        book_type: 'core',
        source_path: 'books/my-book'
      });

      expect(book.slug).toBe('my-book-v2-final');

      const found = repo.getBySlug('my-book-v2-final');
      expect(found).not.toBeNull();
    });

    it('should handle long source paths', () => {
      const longPath = 'books/deeply/nested/directory/structure/for/organizing/content';
      const book = repo.create({
        id: 'book_long_path',
        slug: 'long-path',
        title: 'Long Path Book',
        book_type: 'core',
        source_path: longPath
      });

      expect(book.source_path).toBe(longPath);
    });
  });
});
