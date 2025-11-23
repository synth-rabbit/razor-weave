/**
 * book:register CLI Command
 *
 * Registers a new book in the database registry.
 *
 * Usage:
 *   pnpm book:register --slug <slug> --title <title> --path <source_path> [--type <type>]
 */

import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import type { BookType } from '../books/types.js';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Parse arguments
const { values } = parseArgs({
  options: {
    slug: { type: 'string', short: 's' },
    title: { type: 'string', short: 't' },
    type: { type: 'string', default: 'core' },
    path: { type: 'string', short: 'p' },
    db: { type: 'string', default: 'data/project.db' },
  },
});

const slug = values.slug;
const title = values.title;
const bookType = values.type as BookType;
const sourcePath = values.path;
const dbPath = resolve(getProjectRoot(), values.db!);

// Validate required arguments
if (!slug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --slug <slug>',
      status: [{ label: 'Slug is required', success: false }],
    })
  );
  process.exit(1);
}

if (!title) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --title <title>',
      status: [{ label: 'Title is required', success: false }],
    })
  );
  process.exit(1);
}

if (!sourcePath) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --path <source_path>',
      status: [{ label: 'Path is required', success: false }],
    })
  );
  process.exit(1);
}

// Validate book type
const validTypes: BookType[] = ['core', 'source', 'campaign', 'supplement'];
if (!validTypes.includes(bookType)) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Invalid book type: ${bookType}. Valid types: ${validTypes.join(', ')}`,
      status: [{ label: 'Invalid book type', success: false }],
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

// Generate unique ID
const bookId = `book_${randomUUID().slice(0, 8)}`;

try {
  // Create the book
  const book = bookRepo.create({
    id: bookId,
    slug,
    title,
    book_type: bookType,
    source_path: sourcePath,
  });

  console.log(
    CLIFormatter.format({
      title: 'BOOK REGISTERED',
      content: `Registered book: ${book.title} (${book.slug})`,
      status: [
        { label: 'Book created successfully', success: true },
      ],
      nextStep: [
        'View book details with:',
        `  pnpm book:info --slug ${book.slug}`,
        '',
        'List all books with:',
        '  pnpm book:list',
      ],
    })
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Failed to register book: ${errorMessage}`,
      status: [{ label: 'Registration failed', success: false }],
    })
  );
  process.exit(1);
} finally {
  db.close();
}
