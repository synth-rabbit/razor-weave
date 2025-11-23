/**
 * workflow:list CLI Command
 *
 * Lists workflow runs with optional filtering.
 *
 * Usage:
 *   pnpm workflow:list [--book <slug>] [--status <status>] [--type <type>]
 */

import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import {
  WORKFLOW_STATUSES,
  WORKFLOW_TYPES,
  type WorkflowStatus,
  type WorkflowType,
} from '../workflows/types.js';

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
    book: { type: 'string', short: 'b' },
    status: { type: 'string', short: 's' },
    type: { type: 'string', short: 't' },
    db: { type: 'string', default: 'data/project.db' },
  },
});

const bookSlug = values.book;
const statusFilter = values.status as WorkflowStatus | undefined;
const typeArg = values.type;
const dbPath = resolve(getProjectRoot(), values.db!);

// Validate status filter if provided
if (statusFilter && !WORKFLOW_STATUSES.includes(statusFilter)) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Invalid status: ${statusFilter}`,
      status: [{ label: 'Invalid status filter', success: false }],
      nextStep: [
        'Valid statuses:',
        `  ${WORKFLOW_STATUSES.join(', ')}`,
      ],
    })
  );
  process.exit(1);
}

// Validate type filter if provided
let typeFilter: WorkflowType | undefined;
if (typeArg) {
  typeFilter = TYPE_MAP[typeArg.toLowerCase()];
  if (!typeFilter) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Invalid workflow type: ${typeArg}`,
        status: [{ label: 'Invalid type filter', success: false }],
        nextStep: [
          'Valid types:',
          '  w1 (w1_editing), w2 (w2_pdf), w3 (w3_publication), w4 (w4_playtesting)',
        ],
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

// Run migrations
try {
  runMigrations(dbPath);
} catch {
  // Migrations might already be applied
}

// Create repositories
const workflowRepo = new WorkflowRepository(db);
const bookRepo = new BookRepository(db);

try {
  // Resolve book slug to book ID
  let bookId: string | undefined;
  if (bookSlug) {
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
    bookId = book.id;
  }

  // Get workflows with filters
  const workflows = workflowRepo.list({
    bookId,
    status: statusFilter,
    type: typeFilter,
  });

  // Build filter description
  const filterParts: string[] = [];
  if (bookSlug) filterParts.push(`book=${bookSlug}`);
  if (statusFilter) filterParts.push(`status=${statusFilter}`);
  if (typeFilter) filterParts.push(`type=${typeFilter}`);
  const filterMessage = filterParts.length > 0 ? ` (filtered by: ${filterParts.join(', ')})` : '';

  if (workflows.length === 0) {
    console.log(
      CLIFormatter.format({
        title: 'WORKFLOW LIST',
        content: `No workflows found${filterMessage}.`,
        status: [{ label: 'Empty list', pending: true }],
        nextStep: [
          'Start a new workflow:',
          '  pnpm workflow:start --type <w1|w2|w3|w4> --book <slug>',
        ],
      })
    );
  } else {
    // Build book ID to slug map for display
    const bookMap = new Map<string, string>();
    const books = bookRepo.list();
    for (const book of books) {
      bookMap.set(book.id, book.slug);
    }

    // Build table header and rows
    const tableHeader = 'RUN ID                     TYPE            STATUS     BOOK                 AGENT';
    const separator = '-'.repeat(90);

    const tableRows = workflows.map((wf) => {
      const runId = wf.id.padEnd(26).slice(0, 26);
      const type = wf.workflow_type.padEnd(15).slice(0, 15);
      const status = wf.status.padEnd(10).slice(0, 10);
      const bookDisplay = (bookMap.get(wf.book_id) ?? wf.book_id).padEnd(20).slice(0, 20);
      const agent = (wf.current_agent ?? '-').slice(0, 15);
      return `${runId} ${type} ${status} ${bookDisplay} ${agent}`;
    });

    // Create status indicators
    const statusItems = [
      { label: `${workflows.length} workflow(s) found`, success: true },
    ];
    if (filterParts.length > 0) {
      statusItems.push({ label: `Filtered by: ${filterParts.join(', ')}`, pending: true });
    }

    console.log(
      CLIFormatter.format({
        title: 'WORKFLOW LIST',
        content: [tableHeader, separator, ...tableRows].join('\n'),
        status: statusItems,
        nextStep: [
          'View workflow details:',
          '  pnpm workflow:status --run <id>',
        ],
      })
    );
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Failed to list workflows: ${errorMessage}`,
      status: [{ label: 'List failed', success: false }],
    })
  );
  process.exit(1);
} finally {
  db.close();
}
