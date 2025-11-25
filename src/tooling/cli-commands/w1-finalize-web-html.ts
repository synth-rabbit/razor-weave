/**
 * w1:finalize-web-html CLI Command
 *
 * Generates and promotes web-viewable HTML content for a book.
 * This command orchestrates the complete web HTML build pipeline:
 * 1. Calls the existing web HTML build pipeline
 * 2. Promotes the built HTML to the active site version
 * 3. Registers the promoted HTML as a workflow artifact
 *
 * Usage:
 *   pnpm w1:finalize-web-html --book <book-id> [--workflow-run <id>] [--force]
 *
 * Examples:
 *   pnpm w1:finalize-web-html --book core-rulebook
 *   pnpm w1:finalize-web-html --book core-rulebook --workflow-run wfrun_abc123 --force
 */

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { getVersionedSourcePath } from '../books/types.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import { buildWebReader, promoteWebBuild } from '../html-gen/web/index.js';

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
    db: { type: 'string', default: 'data/project.db' },
    force: { type: 'boolean', default: false },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const workflowRunIdArg = values['workflow-run'];
const dbPath = resolve(projectRoot, values.db!);
const force = values.force;

// Validate required arguments
if (!bookIdOrSlug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --book <book-id>',
      status: [{ label: 'Book ID is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:finalize-web-html --book <book-id> [--workflow-run <id>] [--force]',
        '',
        'List available books:',
        '  pnpm book:list',
      ],
    })
  );
  process.exit(1);
}

// Print header
console.log(CLIFormatter.header('W1 FINALIZE WEB HTML'));
console.log(`Book: ${bookIdOrSlug}`);
if (workflowRunIdArg) {
  console.log(`Workflow Run: ${workflowRunIdArg}`);
}
if (force) {
  console.log('Force rebuild: enabled');
}
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

    // 2. Get or find workflow run ID
    let workflowRunId = workflowRunIdArg;
    if (!workflowRunId) {
      // Find the most recent running workflow for this book
      const workflows = workflowRepo.list({ bookId: book.id, status: 'running' });
      if (workflows.length > 0) {
        workflowRunId = workflows[workflows.length - 1].id;
        console.log(`  OK Using workflow run: ${workflowRunId}`);
      }
    }

    // Verify workflow run exists if provided
    if (workflowRunId) {
      const workflowRun = workflowRepo.getById(workflowRunId);
      if (!workflowRun) {
        console.error(
          CLIFormatter.format({
            title: 'ERROR',
            content: `Workflow run not found: ${workflowRunId}`,
            status: [{ label: 'Workflow run does not exist', success: false }],
            nextStep: [
              'List available workflow runs:',
              '  pnpm workflow:list',
              '',
              'Or run without --workflow-run to skip artifact registration',
            ],
          })
        );
        process.exit(1);
      }
    }

    // 3. Build web HTML
    console.log('Step 2: Building web HTML...');
    const bookDir = resolve(projectRoot, getVersionedSourcePath(book));
    const chaptersDir = resolve(bookDir, 'chapters');
    const sheetsDir = resolve(bookDir, 'sheets');
    const outputPath = resolve(projectRoot, `data/html/web-reader/${book.slug}.html`);
    const templatePath = resolve(projectRoot, 'src/tooling/html-gen/templates/web-reader.html');

    const buildResult = await buildWebReader({
      bookPath: bookDir,
      chaptersDir,
      sheetsDir,
      outputPath,
      templatePath,
      db,
      force,
    });

    if (buildResult.status === 'failed') {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Web HTML build failed: ${buildResult.reason}`,
          status: [{ label: 'Build failed', success: false }],
          nextStep: [
            'Check the error message above for details.',
            'Ensure all chapter files exist and are valid markdown.',
          ],
        })
      );
      process.exit(1);
    }

    if (buildResult.status === 'skipped') {
      console.log(`  OK Build skipped: ${buildResult.reason}`);
      console.log('  (Use --force to rebuild anyway)');
    } else {
      console.log(`  OK Build successful: ${buildResult.buildId}`);
      console.log(`  OK Chapters: ${buildResult.chapterCount}, Sheets: ${buildResult.sheetCount}`);
    }

    // 4. Promote to active version
    console.log('Step 3: Promoting to active version...');
    const targetPath = resolve(projectRoot, 'src/site/pages/read.html');

    const promoteResult = await promoteWebBuild({
      sourcePath: outputPath,
      targetPath,
    });

    if (!promoteResult.success) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Promotion failed: ${promoteResult.error}`,
          status: [
            { label: 'Build completed', success: true },
            { label: 'Promotion failed', success: false },
          ],
          nextStep: [
            'The build succeeded but promotion failed.',
            'You can manually copy the file:',
            `  cp ${outputPath} ${targetPath}`,
          ],
        })
      );
      process.exit(1);
    }

    console.log(`  OK Promoted: ${targetPath}`);

    // 5. Register artifact if workflow run exists
    if (workflowRunId) {
      console.log('Step 4: Registering artifact...');
      const artifact = artifactRegistry.register({
        workflowRunId,
        artifactType: 'web_html',
        artifactPath: targetPath,
        metadata: {
          buildId: buildResult.buildId,
          bookId: book.id,
          bookSlug: book.slug,
          chapterCount: buildResult.chapterCount,
          sheetCount: buildResult.sheetCount,
          sourcePath: outputPath,
        },
      });
      console.log(`  OK Artifact registered: ${artifact.id}`);
    } else {
      console.log('Step 4: Skipping artifact registration (no workflow run)');
    }

    // 6. Print success output
    console.log('');

    const tableRows = [
      { key: 'Book', value: `${book.title} (${book.slug})` },
      { key: 'Build ID', value: buildResult.buildId || '(cached)' },
      { key: 'Build Path', value: outputPath },
      { key: 'Active Path', value: targetPath },
      { key: 'Chapters', value: String(buildResult.chapterCount || 'N/A') },
      { key: 'Sheets', value: String(buildResult.sheetCount || 'N/A') },
    ];

    if (workflowRunId) {
      tableRows.splice(1, 0, { key: 'Workflow Run', value: workflowRunId });
    }

    console.log(
      CLIFormatter.format({
        title: 'WEB HTML FINALIZED',
        content: CLIFormatter.table(tableRows),
        status: [
          { label: 'Web HTML built successfully', success: true },
          { label: 'Promoted to active version', success: true },
          { label: workflowRunId ? 'Artifact registered' : 'No artifact registration (no workflow run)', success: !!workflowRunId },
        ],
        nextStep: [
          'View the web HTML:',
          `  pnpm site:dev`,
          '  Open http://localhost:8080/read.html',
          '',
          'Or continue to PDF generation:',
          `  pnpm w1:finalize-print-html --book ${book.slug}${workflowRunId ? ` --workflow-run ${workflowRunId}` : ''}`,
        ],
      })
    );

    // Output the path for automation
    console.log(`\nOUTPUT_PATH=${targetPath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Web HTML finalization failed: ${errorMessage}`,
        status: [{ label: 'Finalization failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure the book source files exist and are valid.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
