/**
 * workflow:start CLI Command
 *
 * Starts a new workflow run for a book.
 *
 * Usage:
 *   pnpm workflow:start --type <w1|w2|w3|w4> --book <slug>
 */

import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '@razorweave/database';
import { runMigrations } from '@razorweave/database';
import { WORKFLOW_TYPES, type WorkflowType } from '../workflows/types.js';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Map short type names to full type names
const TYPE_MAP: Record<string, WorkflowType> = {
  w1: 'w1_editing',
  w2: 'w2_pdf',
  w3: 'w3_publication',
  w4: 'w4_playtesting',
  w1_editing: 'w1_editing',
  w2_pdf: 'w2_pdf',
  w3_publication: 'w3_publication',
  w4_playtesting: 'w4_playtesting',
};

// Parse arguments
const { values } = parseArgs({
  options: {
    type: { type: 'string', short: 't' },
    book: { type: 'string', short: 'b' },
    db: { type: 'string', default: 'data/project.db' },
  },
});

const typeArg = values.type;
const bookSlug = values.book;
const dbPath = resolve(getProjectRoot(), values.db!);

// Validate required arguments
if (!typeArg) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --type <w1|w2|w3|w4>',
      status: [{ label: 'Type is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm workflow:start --type <w1|w2|w3|w4> --book <slug>',
        '',
        'Workflow types:',
        '  w1 - Editing workflow',
        '  w2 - PDF generation workflow',
        '  w3 - Publication workflow',
        '  w4 - Playtesting workflow',
      ],
    })
  );
  process.exit(1);
}

if (!bookSlug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --book <slug>',
      status: [{ label: 'Book slug is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm workflow:start --type <w1|w2|w3|w4> --book <slug>',
        '',
        'List available books:',
        '  pnpm book:list',
      ],
    })
  );
  process.exit(1);
}

// Validate workflow type
const workflowType = TYPE_MAP[typeArg.toLowerCase()];
if (!workflowType) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Invalid workflow type: ${typeArg}`,
      status: [{ label: 'Invalid type', success: false }],
      nextStep: [
        'Valid workflow types:',
        '  w1 (w1_editing)    - Editing workflow',
        '  w2 (w2_pdf)        - PDF generation workflow',
        '  w3 (w3_publication) - Publication workflow',
        '  w4 (w4_playtesting) - Playtesting workflow',
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

// Run migrations
try {
  runMigrations(dbPath);
} catch {
  // Migrations might already be applied
}

// Create repositories
const bookRepo = new BookRepository(db);
const workflowRepo = new WorkflowRepository(db);

try {
  // Verify book exists
  const book = bookRepo.getBySlug(bookSlug);
  if (!book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Book not found: ${bookSlug}`,
        status: [{ label: 'Book does not exist', success: false }],
        nextStep: [
          'List available books:',
          '  pnpm book:list',
        ],
      })
    );
    process.exit(1);
  }

  // Create workflow run
  const workflow = workflowRepo.create({
    workflow_type: workflowType,
    book_id: book.id,
  });

  // Format output
  const tableRows = [
    { key: 'Run ID', value: workflow.id },
    { key: 'Type', value: workflow.workflow_type },
    { key: 'Book', value: `${book.title} (${book.slug})` },
    { key: 'Status', value: workflow.status },
    { key: 'Created', value: workflow.created_at },
  ];

  console.log(
    CLIFormatter.format({
      title: 'WORKFLOW STARTED',
      content: CLIFormatter.table(tableRows),
      status: [
        { label: 'Workflow created successfully', success: true },
        { label: `Status: ${workflow.status}`, pending: true },
      ],
      nextStep: [
        'Check workflow status:',
        `  pnpm workflow:status --run ${workflow.id}`,
        '',
        'List all workflows:',
        '  pnpm workflow:list',
      ],
    })
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Failed to start workflow: ${errorMessage}`,
      status: [{ label: 'Workflow creation failed', success: false }],
    })
  );
  process.exit(1);
} finally {
  db.close();
}
