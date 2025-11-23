/**
 * book:info CLI Command
 *
 * Shows detailed information about a specific book.
 *
 * Usage:
 *   pnpm book:info --slug <slug>
 *   pnpm book:info <slug>
 */

import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Parse arguments
const { values, positionals } = parseArgs({
  options: {
    slug: { type: 'string', short: 's' },
    db: { type: 'string', default: 'data/project.db' },
  },
  allowPositionals: true,
});

// Get slug from --slug argument or positional argument
const slug = values.slug ?? positionals[0];
const dbPath = resolve(getProjectRoot(), values.db!);

// Validate slug is provided
if (!slug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --slug <slug> or positional slug',
      status: [{ label: 'Slug is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm book:info --slug <slug>',
        '  pnpm book:info <slug>',
      ],
    })
  );
  process.exit(1);
}

// Initialize database and run migrations
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');

createTables(db);

// Run migrations to ensure books table exists
try {
  runMigrations(dbPath);
} catch {
  // Migrations might already be applied
}

// Create repository
const bookRepo = new BookRepository(db);

try {
  // Get book by slug
  const book = bookRepo.getBySlug(slug);

  if (!book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Book not found: ${slug}`,
        status: [{ label: 'Book does not exist', success: false }],
        nextStep: [
          'List all books with:',
          '  pnpm book:list',
        ],
      })
    );
    process.exit(1);
  }

  // Format book details as table
  const tableRows = [
    { key: 'ID', value: book.id },
    { key: 'Slug', value: book.slug },
    { key: 'Title', value: book.title },
    { key: 'Type', value: book.book_type },
    { key: 'Status', value: book.status },
    { key: 'Source Path', value: book.source_path },
    { key: 'Created', value: book.created_at },
    { key: 'Updated', value: book.updated_at },
  ];

  // Determine status indicator
  const statusIndicator = book.status === 'published'
    ? { label: 'Published', success: true }
    : book.status === 'editing'
    ? { label: 'In editing', pending: true }
    : { label: 'Draft', pending: true };

  console.log(
    CLIFormatter.format({
      title: `BOOK: ${book.title}`,
      content: CLIFormatter.table(tableRows),
      status: [statusIndicator],
      nextStep: [
        'List all books:',
        '  pnpm book:list',
      ],
    })
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Failed to get book info: ${errorMessage}`,
      status: [{ label: 'Info retrieval failed', success: false }],
    })
  );
  process.exit(1);
} finally {
  db.close();
}
