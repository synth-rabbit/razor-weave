/**
 * book:list CLI Command
 *
 * Lists all books in the registry.
 *
 * Usage:
 *   pnpm book:list [--status <status>]
 */

import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import type { BookStatus } from '../books/types.js';

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
    status: { type: 'string', short: 's' },
    db: { type: 'string', default: 'data/project.db' },
  },
});

const statusFilter = values.status as BookStatus | undefined;
const dbPath = resolve(getProjectRoot(), values.db!);

// Validate status filter if provided
if (statusFilter) {
  const validStatuses: BookStatus[] = ['draft', 'editing', 'published'];
  if (!validStatuses.includes(statusFilter)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Invalid status: ${statusFilter}. Valid statuses: ${validStatuses.join(', ')}`,
        status: [{ label: 'Invalid status filter', success: false }],
      })
    );
    process.exit(1);
  }
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
  // Get all books
  let books = bookRepo.list();

  // Apply status filter if provided
  if (statusFilter) {
    books = books.filter((book) => book.status === statusFilter);
  }

  if (books.length === 0) {
    const filterMessage = statusFilter ? ` with status '${statusFilter}'` : '';
    console.log(
      CLIFormatter.format({
        title: 'BOOK LIST',
        content: `No books found${filterMessage}.`,
        status: [{ label: 'Empty registry', pending: true }],
        nextStep: [
          'Register a new book with:',
          '  pnpm book:register --slug <slug> --title <title> --path <path>',
        ],
      })
    );
  } else {
    // Build table header and rows
    const tableHeader = 'SLUG                 TYPE        STATUS      TITLE';
    const separator = '-'.repeat(70);

    const tableRows = books.map((book) => {
      const slug = book.slug.padEnd(20).slice(0, 20);
      const type = book.book_type.padEnd(11).slice(0, 11);
      const status = book.status.padEnd(11).slice(0, 11);
      const title = book.title.slice(0, 30);
      return `${slug} ${type} ${status} ${title}`;
    });

    console.log(
      CLIFormatter.format({
        title: 'BOOK LIST',
        content: [tableHeader, separator, ...tableRows].join('\n'),
        status: [
          { label: `${books.length} book(s) found`, success: true },
          ...(statusFilter ? [{ label: `Filtered by: ${statusFilter}`, pending: true }] : []),
        ],
        nextStep: [
          'View book details with:',
          '  pnpm book:info --slug <slug>',
        ],
      })
    );
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Failed to list books: ${errorMessage}`,
      status: [{ label: 'List failed', success: false }],
    })
  );
  process.exit(1);
} finally {
  db.close();
}
