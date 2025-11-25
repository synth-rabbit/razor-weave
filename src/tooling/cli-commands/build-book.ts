/**
 * build:book CLI Command
 *
 * Builds the book HTML for review purposes. This is used during the W1 human gate
 * full-review phase to generate HTML that includes pending (uncommitted) changes.
 *
 * Usage:
 *   pnpm build:book --run <workflow-run-id>    # Build to review directory
 *   pnpm build:book --book <slug>              # Build specific book
 *   pnpm build:book --book <slug> --output <path>  # Custom output path
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { getVersionedSourcePath } from '../books/types.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import { buildWebReader } from '../html-gen/web/build.js';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    run: { type: 'string', short: 'r' },
    book: { type: 'string', short: 'b' },
    output: { type: 'string', short: 'o' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h' },
  },
});

// Show help
if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'BUILD BOOK',
      content: 'Build book HTML for review. Includes any pending (uncommitted) changes.',
      nextStep: [
        'Usage:',
        '  pnpm build:book --run <workflow-run-id>         # Build for workflow review',
        '  pnpm build:book --book <slug>                   # Build specific book',
        '  pnpm build:book --book <slug> --output <path>   # Custom output path',
        '',
        'Options:',
        '  --run, -r      Workflow run ID (auto-detects book, outputs to review dir)',
        '  --book, -b     Book slug (required if --run not provided)',
        '  --output, -o   Custom output path (default: data/html/review/<run-id>/)',
        '  --db           Database path (default: data/project.db)',
        '',
        'Examples:',
        '  pnpm build:book --run w1_abc123',
        '  pnpm build:book --book core-rulebook',
        '  pnpm build:book --book core-rulebook --output ./preview.html',
      ],
    })
  );
  process.exit(0);
}

const projectRoot = getProjectRoot();
const workflowRunId = values.run;
const bookSlug = values.book;
const customOutput = values.output;
const dbPath = resolve(projectRoot, values.db!);

// Validate arguments
if (!workflowRunId && !bookSlug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Either --run or --book is required',
      nextStep: [
        'Usage:',
        '  pnpm build:book --run <workflow-run-id>',
        '  pnpm build:book --book <book-slug>',
      ],
    })
  );
  process.exit(1);
}

async function main(): Promise<void> {
  // Initialize database
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

  const bookRepo = new BookRepository(db);
  const workflowRepo = new WorkflowRepository(db);

  let book: { id: string; slug: string; title: string; source_path: string; current_version: string } | null = null;
  let outputPath: string;

  // Resolve book
  if (workflowRunId) {
    // Get book from workflow run
    const workflowRun = workflowRepo.getById(workflowRunId);
    if (!workflowRun) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Workflow run not found: ${workflowRunId}`,
          nextStep: ['List workflow runs:', '  pnpm workflow:list'],
        })
      );
      db.close();
      process.exit(1);
    }

    book = bookRepo.getById(workflowRun.book_id);
    if (!book) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Book not found for workflow: ${workflowRun.book_id}`,
          nextStep: ['List books:', '  pnpm book:list'],
        })
      );
      db.close();
      process.exit(1);
    }

    // Default output for workflow review
    outputPath = customOutput
      ? resolve(projectRoot, customOutput)
      : resolve(projectRoot, `data/html/review/${workflowRunId}/web.html`);
  } else {
    // Get book by slug
    book = bookRepo.getBySlug(bookSlug!);
    if (!book) {
      book = bookRepo.getById(bookSlug!);
    }
    if (!book) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Book not found: ${bookSlug}`,
          nextStep: ['List books:', '  pnpm book:list'],
        })
      );
      db.close();
      process.exit(1);
    }

    // Default output for book build
    outputPath = customOutput
      ? resolve(projectRoot, customOutput)
      : resolve(projectRoot, `data/html/review/${book.slug}/web.html`);
  }

  // Print header
  console.log('');
  console.log('-----------------------------------------------------------');
  console.log('BUILD BOOK');
  console.log('-----------------------------------------------------------');
  console.log('');
  console.log(`Book: ${book.title} (${book.slug})`);
  if (workflowRunId) {
    console.log(`Workflow: ${workflowRunId}`);
  }
  console.log(`Output: ${outputPath}`);
  console.log('');

  // Resolve paths - use versioned source path
  const versionedPath = getVersionedSourcePath(book);
  const bookDir = resolve(projectRoot, versionedPath);
  const chaptersDir = join(bookDir, 'chapters');
  const sheetsDir = join(bookDir, 'sheets');
  const templatePath = resolve(projectRoot, 'src/tooling/html-gen/templates/web-reader.html');

  // Verify source directories exist
  if (!existsSync(chaptersDir)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Chapters directory not found: ${chaptersDir}`,
        nextStep: ['Verify book source path is correct'],
      })
    );
    db.close();
    process.exit(1);
  }

  // Create output directory
  const outputDir = resolve(outputPath, '..');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Build with force=true to include pending changes
  console.log('Building HTML...');
  const result = await buildWebReader({
    bookPath: versionedPath,
    chaptersDir,
    sheetsDir: existsSync(sheetsDir) ? sheetsDir : chaptersDir,
    outputPath,
    templatePath,
    db,
    force: true, // Always rebuild to include pending changes
  });

  db.close();

  if (result.status === 'failed') {
    console.error(
      CLIFormatter.format({
        title: 'BUILD FAILED',
        content: result.reason || 'Unknown error',
      })
    );
    process.exit(1);
  }

  console.log('');
  console.log(
    CLIFormatter.format({
      title: 'BUILD COMPLETE',
      content: `Built ${result.chapterCount || 0} chapters, ${result.sheetCount || 0} sheets`,
      status: [
        { label: 'HTML generated', success: true },
        { label: `Output: ${outputPath}`, success: true },
      ],
      nextStep: [
        'Open in browser:',
        `  open "${outputPath}"`,
        '',
        'Or serve locally:',
        `  npx serve "${outputDir}"`,
      ],
    })
  );
}

main().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
