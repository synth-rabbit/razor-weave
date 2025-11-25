// src/tooling/books/seed.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { seedCoreRulebook, CORE_RULEBOOK_SEED } from './seed.js';
import { BookRepository } from './repository.js';

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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      current_version TEXT DEFAULT '1.0.0'
    );

    CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
    CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
  `);

  return db;
}

describe('seedCoreRulebook', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('should seed Core Rulebook when table is empty', () => {
    const result = seedCoreRulebook(db);

    expect(result.success).toBe(true);
    expect(result.action).toBe('created');
    expect(result.message).toContain('Core Rulebook created successfully');

    // Verify the book was created
    const repo = new BookRepository(db);
    const book = repo.getBySlug('core-rulebook');

    expect(book).not.toBeNull();
    expect(book!.id).toBe('book_core');
    expect(book!.slug).toBe('core-rulebook');
    expect(book!.title).toBe('Razorweave Core Rulebook');
    expect(book!.book_type).toBe('core');
    expect(book!.source_path).toBe('books/core');
    expect(book!.status).toBe('editing');
  });

  it('should skip when Core Rulebook already exists', () => {
    // First seed
    const firstResult = seedCoreRulebook(db);
    expect(firstResult.action).toBe('created');

    // Second seed should skip
    const secondResult = seedCoreRulebook(db);

    expect(secondResult.success).toBe(true);
    expect(secondResult.action).toBe('skipped');
    expect(secondResult.message).toContain('already exists');

    // Verify only one book exists
    const repo = new BookRepository(db);
    const books = repo.list();
    expect(books).toHaveLength(1);
  });

  it('should create correct book data matching CORE_RULEBOOK_SEED', () => {
    seedCoreRulebook(db);

    const repo = new BookRepository(db);
    const book = repo.getBySlug(CORE_RULEBOOK_SEED.slug);

    expect(book).not.toBeNull();
    expect(book!.id).toBe(CORE_RULEBOOK_SEED.id);
    expect(book!.slug).toBe(CORE_RULEBOOK_SEED.slug);
    expect(book!.title).toBe(CORE_RULEBOOK_SEED.title);
    expect(book!.book_type).toBe(CORE_RULEBOOK_SEED.book_type);
    expect(book!.source_path).toBe(CORE_RULEBOOK_SEED.source_path);
    expect(book!.status).toBe(CORE_RULEBOOK_SEED.status);
  });

  it('should not affect other books when skipping', () => {
    // Create another book first
    const repo = new BookRepository(db);
    repo.create({
      id: 'book_supplement',
      slug: 'supplement-book',
      title: 'Supplement Book',
      book_type: 'supplement',
      source_path: 'books/supplement',
    });

    // Seed Core Rulebook
    seedCoreRulebook(db);

    // Verify both books exist
    const books = repo.list();
    expect(books).toHaveLength(2);

    const supplement = repo.getBySlug('supplement-book');
    expect(supplement).not.toBeNull();
    expect(supplement!.title).toBe('Supplement Book');
  });

  it('should be idempotent - multiple calls have same result', () => {
    // Run seed multiple times
    seedCoreRulebook(db);
    seedCoreRulebook(db);
    seedCoreRulebook(db);

    // Verify only one Core Rulebook exists
    const repo = new BookRepository(db);
    const books = repo.list();
    expect(books).toHaveLength(1);
    expect(books[0].slug).toBe('core-rulebook');
  });
});

describe('CORE_RULEBOOK_SEED', () => {
  it('should have correct id format', () => {
    expect(CORE_RULEBOOK_SEED.id).toBe('book_core');
  });

  it('should have correct slug', () => {
    expect(CORE_RULEBOOK_SEED.slug).toBe('core-rulebook');
  });

  it('should have correct title', () => {
    expect(CORE_RULEBOOK_SEED.title).toBe('Razorweave Core Rulebook');
  });

  it('should have book_type as core', () => {
    expect(CORE_RULEBOOK_SEED.book_type).toBe('core');
  });

  it('should have correct source_path (base path without version)', () => {
    expect(CORE_RULEBOOK_SEED.source_path).toBe('books/core');
  });

  it('should have correct current_version', () => {
    expect(CORE_RULEBOOK_SEED.current_version).toBe('1.3.0');
  });

  it('should have status as editing', () => {
    expect(CORE_RULEBOOK_SEED.status).toBe('editing');
  });
});
