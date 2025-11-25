/**
 * w1:finalize-print-html CLI Command
 *
 * Promotes updated content to print HTML format for the W1 editing workflow.
 * Calls the existing print HTML build pipeline, promotes to active version,
 * and registers as a workflow artifact.
 *
 * Usage:
 *   pnpm w1:finalize-print-html --book <book-id> [--workflow-run <id>]
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import { createTables } from '@razorweave/database';
import { runMigrations } from '@razorweave/database';
import { buildPrintHtml, type BuildResult } from '../html-gen/print/build.js';
import { promotePrintBuild, type PromoteResult } from '../html-gen/print/promote.js';

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
    book: { type: 'string', short: 'b' },
    'workflow-run': { type: 'string', short: 'w' },
    output: { type: 'string', short: 'o', default: 'data/html/print' },
    db: { type: 'string', default: 'data/project.db' },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const workflowRunIdArg = values['workflow-run'];
const outputBaseDir = resolve(projectRoot, values.output!);
const dbPath = resolve(projectRoot, values.db!);

// Validate required arguments
if (!bookIdOrSlug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --book <book-id>',
      status: [{ label: 'Book ID is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:finalize-print-html --book <book-id> [--workflow-run <id>]',
        '',
        'List available books:',
        '  pnpm book:list',
      ],
    })
  );
  process.exit(1);
}

// Print header
console.log(CLIFormatter.header('W1 FINALIZE PRINT HTML'));
console.log(`Book: ${bookIdOrSlug}`);
if (workflowRunIdArg) {
  console.log(`Workflow Run: ${workflowRunIdArg}`);
}
console.log(`Output: ${outputBaseDir}`);
console.log('');

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

  // Create repositories
  const bookRepo = new BookRepository(db);
  const workflowRepo = new WorkflowRepository(db);
  const artifactRegistry = new ArtifactRegistry(db);

  try {
    // 1. Verify book exists
    console.log('Step 1: Verifying book...');
    let book = bookRepo.getBySlug(bookIdOrSlug!);
    if (!book) {
      book = bookRepo.getById(bookIdOrSlug!);
    }
    if (!book) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Book not found: ${bookIdOrSlug}`,
          status: [{ label: 'Book does not exist', success: false }],
          nextStep: ['List available books:', '  pnpm book:list'],
        })
      );
      process.exit(1);
    }
    console.log(`  OK Book verified: ${book.title} (${book.slug})`);

    // 2. Get or find workflow run
    let workflowRunId = workflowRunIdArg;
    if (!workflowRunId) {
      // Find the most recent running workflow for this book
      const workflows = workflowRepo.list({ bookId: book.id, status: 'running' });
      if (workflows.length > 0) {
        workflowRunId = workflows[workflows.length - 1].id;
        console.log(`  OK Using workflow run: ${workflowRunId}`);
      }
    }

    // 3. Set up paths
    const bookDir = resolve(projectRoot, book.source_path);
    const chaptersDir = join(bookDir, 'chapters');
    const sheetsDir = join(bookDir, 'sheets');

    // Verify source directories exist
    if (!existsSync(chaptersDir)) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Chapters directory not found: ${chaptersDir}`,
          status: [{ label: 'Source directory missing', success: false }],
          nextStep: [
            'Ensure the book has a chapters directory:',
            `  ${chaptersDir}`,
          ],
        })
      );
      process.exit(1);
    }

    // Create output directory
    const bookOutputDir = join(outputBaseDir, book.slug);
    if (!existsSync(bookOutputDir)) {
      mkdirSync(bookOutputDir, { recursive: true });
    }

    // Build output path with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
    const buildOutputPath = join(bookOutputDir, `print-${timestamp}.html`);

    // 4. Build print HTML
    console.log('Step 2: Building print HTML...');
    let buildResult: BuildResult;

    try {
      buildResult = await buildPrintHtml({
        bookPath: book.source_path,
        chaptersDir,
        sheetsDir: existsSync(sheetsDir) ? sheetsDir : chaptersDir, // Fallback if no sheets
        outputPath: buildOutputPath,
        db,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Print HTML build failed: ${errorMessage}`,
          status: [{ label: 'Build failed', success: false }],
          nextStep: [
            'Check that all chapter files exist and are valid markdown.',
            'Ensure the print template is available.',
          ],
        })
      );
      process.exit(1);
    }

    if (!buildResult.success) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Print HTML build failed: ${buildResult.error || 'Unknown error'}`,
          status: [{ label: 'Build failed', success: false }],
          nextStep: [
            'Check the error message above for details.',
            'Ensure all source files are valid.',
          ],
        })
      );
      process.exit(1);
    }

    console.log(`  OK Built: ${buildResult.chapterCount} chapters, ${buildResult.sheetCount} sheets`);
    console.log(`  OK Build ID: ${buildResult.buildId}`);
    console.log(`  OK Output: ${buildResult.outputPath}`);

    // 5. Promote to active version
    console.log('Step 3: Promoting to active version...');
    const activeOutputPath = join(bookOutputDir, 'print-active.html');

    let promoteResult: PromoteResult;
    try {
      promoteResult = await promotePrintBuild({
        sourcePath: buildResult.outputPath,
        targetPath: activeOutputPath,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Promotion failed: ${errorMessage}`,
          status: [
            { label: 'Build succeeded', success: true },
            { label: 'Promotion failed', success: false },
          ],
          nextStep: [
            'Build output is available at:',
            `  ${buildResult.outputPath}`,
            '',
            'Manual promotion:',
            `  cp "${buildResult.outputPath}" "${activeOutputPath}"`,
          ],
        })
      );
      process.exit(1);
    }

    if (!promoteResult.success) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Promotion failed: ${promoteResult.error || 'Unknown error'}`,
          status: [
            { label: 'Build succeeded', success: true },
            { label: 'Promotion failed', success: false },
          ],
          nextStep: [
            'Build output is available at:',
            `  ${buildResult.outputPath}`,
            '',
            'Manual promotion:',
            `  cp "${buildResult.outputPath}" "${activeOutputPath}"`,
          ],
        })
      );
      process.exit(1);
    }

    console.log(`  OK Promoted to: ${activeOutputPath}`);

    // 6. Register artifact if we have a workflow run
    if (workflowRunId) {
      console.log('Step 4: Registering artifact...');
      const artifact = artifactRegistry.register({
        workflowRunId,
        artifactType: 'print_html',
        artifactPath: activeOutputPath,
        metadata: {
          buildId: buildResult.buildId,
          sourceHash: buildResult.sourceHash,
          chapterCount: buildResult.chapterCount,
          sheetCount: buildResult.sheetCount,
          buildPath: buildResult.outputPath,
        },
      });
      console.log(`  OK Artifact registered: ${artifact.id}`);
    }

    // 7. Print success output
    console.log('');

    const tableRows = [
      { key: 'Book', value: `${book.title} (${book.slug})` },
      { key: 'Build ID', value: buildResult.buildId },
      { key: 'Source Hash', value: buildResult.sourceHash.slice(0, 16) + '...' },
      { key: 'Chapters', value: String(buildResult.chapterCount) },
      { key: 'Sheets', value: String(buildResult.sheetCount) },
      { key: 'Build Output', value: buildResult.outputPath },
      { key: 'Active Version', value: activeOutputPath },
    ];

    if (workflowRunId) {
      tableRows.splice(1, 0, { key: 'Workflow Run', value: workflowRunId });
    }

    console.log(
      CLIFormatter.format({
        title: 'RESULT: PRINT HTML FINALIZED',
        content: CLIFormatter.table(tableRows),
        status: [
          { label: 'Print HTML built successfully', success: true },
          { label: 'Promoted to active version', success: true },
          ...(workflowRunId ? [{ label: 'Artifact registered', success: true }] : []),
        ],
        nextStep: [
          'Output path:',
          `  ${activeOutputPath}`,
          '',
          'View in browser:',
          `  open "${activeOutputPath}"`,
        ],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Print HTML finalization failed: ${errorMessage}`,
        status: [{ label: 'Finalization failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure the database is accessible and book exists.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
