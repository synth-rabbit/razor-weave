/**
 * w1:finalize-pdf CLI Command
 *
 * Generates a PDF from promoted HTML and registers it as a workflow artifact.
 * Uses the existing PDF generation pipeline to convert print-ready HTML to PDF.
 *
 * Usage:
 *   pnpm w1:finalize-pdf --book <book-id> --html <path> [--workflow-run <id>]
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import { generatePDF } from '../pdf-gen/pipeline.js';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

/**
 * Get human-readable file size
 */
function getFileSizeString(filePath: string): string {
  const stats = statSync(filePath);
  const bytes = stats.size;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    book: { type: 'string', short: 'b' },
    html: { type: 'string', short: 'h' },
    db: { type: 'string', default: 'data/project.db' },
    'workflow-run': { type: 'string', short: 'w' },
    output: { type: 'string', short: 'o' },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const htmlPath = values.html;
const dbPath = resolve(projectRoot, values.db!);
const workflowRunIdArg = values['workflow-run'];
const outputPathArg = values.output;

// Validate required arguments
if (!bookIdOrSlug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --book <book-id>',
      status: [{ label: 'Book ID is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:finalize-pdf --book <book-id> --html <path>',
        '',
        'List available books:',
        '  pnpm book:list',
      ],
    })
  );
  process.exit(1);
}

if (!htmlPath) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --html <path>',
      status: [{ label: 'HTML path is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:finalize-pdf --book <book-id> --html <path>',
        '',
        'The HTML file should be the promoted print-ready HTML:',
        '  data/html/print-design/<book-slug>.html',
      ],
    })
  );
  process.exit(1);
}

// Resolve HTML path
const resolvedHtmlPath = resolve(projectRoot, htmlPath);

// Verify HTML file exists
if (!existsSync(resolvedHtmlPath)) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `HTML file not found: ${resolvedHtmlPath}`,
      status: [{ label: 'HTML file does not exist', success: false }],
      nextStep: [
        'Build and promote print HTML first:',
        '  pnpm html:print:build --book <book-id>',
        '  pnpm html:print:promote --book <book-id>',
      ],
    })
  );
  process.exit(1);
}

// Print header
console.log(CLIFormatter.header('W1 FINALIZE PDF'));
console.log(`Book: ${bookIdOrSlug}`);
console.log(`HTML: ${resolvedHtmlPath}`);
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
    // 1. Verify book exists and get book info
    console.log('Verifying book...');
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
    console.log(`  Found: ${book.title} (${book.slug})`);
    console.log('');

    // 2. Determine or create workflow run
    let workflowRunId = workflowRunIdArg;

    if (!workflowRunId) {
      // Create a new workflow run if not provided
      const workflowRun = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: book.id,
      });
      workflowRunId = workflowRun.id;
      console.log(`Created workflow run: ${workflowRunId}`);
    } else {
      // Verify workflow run exists
      const workflowRun = workflowRepo.getById(workflowRunId);
      if (!workflowRun) {
        console.error(`ERROR: Workflow run not found: ${workflowRunId}`);
        process.exit(1);
      }
      console.log(`Using workflow run: ${workflowRunId}`);
    }
    console.log('');

    // 3. Determine output path
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultOutputDir = resolve(projectRoot, 'data/pdfs/draft');
    const defaultOutputPath = join(defaultOutputDir, `${book.slug}-${timestamp}.pdf`);
    const outputPath = outputPathArg ? resolve(projectRoot, outputPathArg) : defaultOutputPath;

    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // 4. Generate PDF
    console.log('Generating PDF...');
    console.log(`  Input:  ${resolvedHtmlPath}`);
    console.log(`  Output: ${outputPath}`);
    console.log('');

    const startTime = Date.now();

    await generatePDF(resolvedHtmlPath, outputPath, {
      title: book.title,
      author: 'Panda Edwards',
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const fileSize = getFileSizeString(outputPath);

    console.log(`  Generated in ${duration}s`);
    console.log(`  Size: ${fileSize}`);
    console.log('');

    // 5. Register PDF as artifact
    console.log('Registering artifact...');
    const artifact = artifactRegistry.register({
      workflowRunId,
      artifactType: 'pdf_draft',
      artifactPath: outputPath,
      metadata: {
        book_id: book.id,
        book_slug: book.slug,
        source_html: resolvedHtmlPath,
        file_size: fileSize,
        generated_at: new Date().toISOString(),
      },
    });
    console.log(`  Artifact ID: ${artifact.id}`);
    console.log('');

    // 6. Print success output
    const tableRows = [
      { key: 'Book', value: `${book.title} (${book.slug})` },
      { key: 'Workflow Run', value: workflowRunId },
      { key: 'Artifact ID', value: artifact.id },
      { key: 'Output Path', value: outputPath },
      { key: 'File Size', value: fileSize },
      { key: 'Generation Time', value: `${duration}s` },
    ];

    console.log(
      CLIFormatter.format({
        title: 'RESULT: PDF GENERATED',
        content: CLIFormatter.table(tableRows),
        status: [
          { label: 'Book verified', success: true },
          { label: 'PDF generated', success: true },
          { label: 'Artifact registered', success: true },
        ],
        nextStep: [
          'Output path:',
          `  ${outputPath}`,
          '',
          'View PDF:',
          `  open "${outputPath}"`,
        ],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `PDF generation failed: ${errorMessage}`,
        status: [{ label: 'PDF generation failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure the HTML file is valid and the PDF pipeline is working.',
          '',
          'Test PDF generation directly:',
          `  pnpm pdf:build`,
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
