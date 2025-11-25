// src/tooling/books/seed.ts
/**
 * Seed script for registering the Core Rulebook as the first entry in the books table.
 * This script is idempotent - safe to run multiple times.
 */
import type Database from 'better-sqlite3';
import { BookRepository } from './repository.js';
import type { CreateBookInput } from './types.js';

/** Core Rulebook seed data */
export const CORE_RULEBOOK_SEED: CreateBookInput = {
  id: 'book_core',
  slug: 'core-rulebook',
  title: 'Razorweave Core Rulebook',
  book_type: 'core',
  source_path: 'books/core',  // Base path - combine with current_version to get full path
  status: 'editing',
  current_version: '1.3.0',
};

export interface SeedResult {
  success: boolean;
  action: 'created' | 'skipped';
  message: string;
}

/**
 * Seeds the Core Rulebook into the database.
 * @param db - SQLite database instance
 * @returns Result indicating whether the book was created or skipped
 */
export function seedCoreRulebook(db: Database.Database): SeedResult {
  const repo = new BookRepository(db);

  // Check if Core Rulebook already exists
  const existing = repo.getBySlug(CORE_RULEBOOK_SEED.slug);

  if (existing) {
    return {
      success: true,
      action: 'skipped',
      message: `Core Rulebook already exists (id: ${existing.id})`,
    };
  }

  // Create the Core Rulebook entry
  const book = repo.create(CORE_RULEBOOK_SEED);

  return {
    success: true,
    action: 'created',
    message: `Core Rulebook created successfully (id: ${book.id})`,
  };
}

/**
 * Main entry point for CLI execution.
 * Opens the project database and seeds the Core Rulebook.
 */
export async function main(): Promise<void> {
  // Dynamic import to avoid loading database module in tests
  const { getDatabase, closeDatabase } = await import('../database/client.js');

  console.log('Seeding books table...');

  try {
    const projectDb = getDatabase();
    const db = projectDb.getDb();

    const result = seedCoreRulebook(db);

    if (result.action === 'created') {
      console.log(`[CREATED] ${result.message}`);
    } else {
      console.log(`[SKIPPED] ${result.message}`);
    }

    closeDatabase();
  } catch (error) {
    console.error('Seed failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]?.replace(/^file:\/\//, '') ?? '')) {
  main();
}
