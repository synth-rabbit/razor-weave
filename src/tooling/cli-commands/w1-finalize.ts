/**
 * w1:finalize CLI Command
 *
 * Orchestrates the complete W1 finalization workflow by running all finalization
 * steps in sequence:
 *   1. Promote print HTML (w1:finalize-print-html)
 *   2. Generate PDF (w1:finalize-pdf)
 *   3. Generate web HTML (w1:finalize-web-html)
 *   4. Generate release notes (prompt-based)
 *   5. Update workflow status to "completed"
 *   6. Register all artifacts
 *   7. Output completion summary
 *
 * Usage:
 *   Full mode (default):
 *     pnpm w1:finalize --book <book-id> --workflow <run-id>
 *
 *   Save release notes mode:
 *     pnpm w1:finalize --save-release-notes --run <workflow-run-id> --result <path-to-result.json>
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import { buildPrintHtml, type BuildResult } from '../html-gen/print/build.js';
import { promotePrintBuild, type PromoteResult } from '../html-gen/print/promote.js';
import { generatePDF } from '../pdf-gen/pipeline.js';
import { buildWebReader, promoteWebBuild } from '../html-gen/web/index.js';
import {
  generateReleaseNotesPrompt,
  W1PromptWriter,
  W1ResultSaver,
} from '../w1/index.js';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

interface StepResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface FinalizationResult {
  printHtml?: StepResult;
  pdf?: StepResult;
  webHtml?: StepResult;
  releaseNotes?: StepResult;
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    book: { type: 'string', short: 'b' },
    workflow: { type: 'string', short: 'w' },
    run: { type: 'string', short: 'r' },
    db: { type: 'string', default: 'data/project.db' },
    'skip-release-notes': { type: 'boolean', default: false },
    'plan-path': { type: 'string' },
    'changelog-path': { type: 'string' },
    'metrics-path': { type: 'string' },
    // Mode flags
    'save-release-notes': { type: 'boolean', default: false },
    result: { type: 'string' },
    // Legacy flag for generating placeholder release notes
    'use-placeholder': { type: 'boolean', default: false },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const workflowRunId = values.workflow || values.run;
const dbPath = resolve(projectRoot, values.db!);
const skipReleaseNotes = values['skip-release-notes'];
const planPath = values['plan-path'];
const changelogPath = values['changelog-path'];
const metricsPath = values['metrics-path'];
const saveReleaseNotesMode = values['save-release-notes'];
const resultPath = values.result;
const usePlaceholder = values['use-placeholder'];

// Determine mode
const isSaveReleaseNotesMode = saveReleaseNotesMode || !!resultPath;

// Validate for save release notes mode
if (isSaveReleaseNotesMode) {
  if (!workflowRunId) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --run <workflow-run-id>',
        status: [{ label: 'Workflow run ID is required in save mode', success: false }],
        nextStep: [
          'Usage (save release notes mode):',
          '  pnpm w1:finalize --save-release-notes --run <workflow-run-id> --result <path>',
        ],
      })
    );
    process.exit(1);
  }

  if (!resultPath) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --result <path-to-result.json>',
        status: [{ label: 'Result path is required in save mode', success: false }],
        nextStep: [
          'Usage (save release notes mode):',
          '  pnpm w1:finalize --save-release-notes --run <workflow-run-id> --result <path>',
        ],
      })
    );
    process.exit(1);
  }
}

// Validate for full finalization mode
if (!isSaveReleaseNotesMode) {
  if (!bookIdOrSlug) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --book <book-id>',
        status: [{ label: 'Book ID is required', success: false }],
        nextStep: [
          'Usage:',
          '  pnpm w1:finalize --book <book-id> --workflow <run-id>',
          '',
          'List available books:',
          '  pnpm book:list',
        ],
      })
    );
    process.exit(1);
  }

  if (!workflowRunId) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --workflow <run-id>',
        status: [{ label: 'Workflow run ID is required', success: false }],
        nextStep: [
          'Usage:',
          '  pnpm w1:finalize --book <book-id> --workflow <run-id>',
          '',
          'List workflow runs:',
          '  pnpm workflow:list',
        ],
      })
    );
    process.exit(1);
  }
}

// Print header
console.log('');
console.log('-----------------------------------------------------------');
if (isSaveReleaseNotesMode) {
  console.log('W1 FINALIZATION - Save Release Notes');
} else {
  console.log('W1 FINALIZATION');
}
console.log('-----------------------------------------------------------');
console.log('');
if (!isSaveReleaseNotesMode) {
  console.log(`Book: ${bookIdOrSlug}`);
}
console.log(`Workflow: ${workflowRunId}`);
if (isSaveReleaseNotesMode) {
  console.log(`Result: ${resultPath}`);
}
console.log('');

/**
 * Step 1: Generate and promote print HTML
 */
async function stepPrintHtml(
  db: Database.Database,
  book: { id: string; slug: string; title: string; source_path: string },
  artifactRegistry: ArtifactRegistry
): Promise<StepResult> {
  console.log('Step 1: Print HTML');

  const bookDir = resolve(projectRoot, book.source_path);
  const chaptersDir = join(bookDir, 'chapters');
  const sheetsDir = join(bookDir, 'sheets');
  const outputBaseDir = resolve(projectRoot, 'data/html/print');
  const bookOutputDir = join(outputBaseDir, book.slug);

  // Verify source directories exist
  if (!existsSync(chaptersDir)) {
    return { success: false, error: `Chapters directory not found: ${chaptersDir}` };
  }

  // Create output directory
  if (!existsSync(bookOutputDir)) {
    mkdirSync(bookOutputDir, { recursive: true });
  }

  // Build output path with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
  const buildOutputPath = join(bookOutputDir, `print-${timestamp}.html`);

  try {
    // Build print HTML
    const buildResult: BuildResult = await buildPrintHtml({
      bookPath: book.source_path,
      chaptersDir,
      sheetsDir: existsSync(sheetsDir) ? sheetsDir : chaptersDir,
      outputPath: buildOutputPath,
      db,
    });

    if (!buildResult.success) {
      return { success: false, error: buildResult.error || 'Build failed' };
    }

    // Promote to active version
    const activeOutputPath = join(bookOutputDir, 'print-active.html');
    const promoteResult: PromoteResult = await promotePrintBuild({
      sourcePath: buildResult.outputPath,
      targetPath: activeOutputPath,
    });

    if (!promoteResult.success) {
      return { success: false, error: promoteResult.error || 'Promotion failed' };
    }

    // Register artifact
    artifactRegistry.register({
      workflowRunId: workflowRunId!,
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

    console.log(`  OK Generated: ${activeOutputPath}`);

    return {
      success: true,
      outputPath: activeOutputPath,
      metadata: {
        buildId: buildResult.buildId,
        chapterCount: buildResult.chapterCount,
        sheetCount: buildResult.sheetCount,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Step 2: Generate PDF from print HTML
 */
async function stepPdf(
  book: { id: string; slug: string; title: string },
  printHtmlPath: string,
  artifactRegistry: ArtifactRegistry
): Promise<StepResult> {
  console.log('');
  console.log('Step 2: PDF');

  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = resolve(projectRoot, 'data/pdfs/draft');
  const outputPath = join(outputDir, `${book.slug}-${timestamp}.pdf`);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    const startTime = Date.now();

    await generatePDF(printHtmlPath, outputPath, {
      title: book.title,
      author: 'Panda Edwards',
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Get file size
    const { statSync } = await import('node:fs');
    const stats = statSync(outputPath);
    const fileSizeBytes = stats.size;
    const fileSize =
      fileSizeBytes < 1024 * 1024
        ? `${(fileSizeBytes / 1024).toFixed(1)} KB`
        : `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

    // Register artifact
    artifactRegistry.register({
      workflowRunId: workflowRunId!,
      artifactType: 'pdf_draft',
      artifactPath: outputPath,
      metadata: {
        book_id: book.id,
        book_slug: book.slug,
        source_html: printHtmlPath,
        file_size: fileSize,
        generated_at: new Date().toISOString(),
        generation_time_seconds: duration,
      },
    });

    console.log(`  OK Generated: ${outputPath}`);

    return {
      success: true,
      outputPath,
      metadata: {
        fileSize,
        generationTime: `${duration}s`,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Step 3: Generate and promote web HTML
 */
async function stepWebHtml(
  db: Database.Database,
  book: { id: string; slug: string; title: string; source_path: string },
  artifactRegistry: ArtifactRegistry
): Promise<StepResult> {
  console.log('');
  console.log('Step 3: Web HTML');

  const bookDir = resolve(projectRoot, book.source_path);
  const chaptersDir = resolve(bookDir, 'chapters');
  const sheetsDir = resolve(bookDir, 'sheets');
  const outputPath = resolve(projectRoot, `data/html/web-reader/${book.slug}.html`);
  const templatePath = resolve(projectRoot, 'src/tooling/html-gen/templates/web-reader.html');
  const targetPath = resolve(projectRoot, 'src/site/pages/read.html');

  try {
    // Build web HTML
    const buildResult = await buildWebReader({
      bookPath: bookDir,
      chaptersDir,
      sheetsDir,
      outputPath,
      templatePath,
      db,
      force: true, // Always rebuild in finalization
    });

    if (buildResult.status === 'failed') {
      return { success: false, error: buildResult.reason || 'Build failed' };
    }

    // Promote to active version
    const promoteResult = await promoteWebBuild({
      sourcePath: outputPath,
      targetPath,
    });

    if (!promoteResult.success) {
      return { success: false, error: promoteResult.error || 'Promotion failed' };
    }

    // Register artifact
    artifactRegistry.register({
      workflowRunId: workflowRunId!,
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

    console.log(`  OK Generated: ${targetPath}`);

    return {
      success: true,
      outputPath: targetPath,
      metadata: {
        buildId: buildResult.buildId,
        chapterCount: buildResult.chapterCount,
        sheetCount: buildResult.sheetCount,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Step 4: Generate release notes (prompt-based)
 */
async function stepReleaseNotes(
  book: { id: string; slug: string; title: string },
  artifactRegistry: ArtifactRegistry,
  planPathArg?: string,
  changelogPathArg?: string,
  metricsPathArg?: string
): Promise<StepResult> {
  console.log('');
  console.log('Step 4: Release Notes');

  const outputDir = resolve(projectRoot, 'data/w1-artifacts');

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Determine paths for plan, changelog, and metrics
  const resolvedPlanPath = planPathArg
    ? resolve(projectRoot, planPathArg)
    : resolve(projectRoot, `data/w1-artifacts/${workflowRunId}/plan.json`);

  const resolvedChangelogPath = changelogPathArg
    ? resolve(projectRoot, changelogPathArg)
    : resolve(projectRoot, `data/w1-artifacts/${workflowRunId}/changelog.json`);

  const resolvedMetricsPath = metricsPathArg
    ? resolve(projectRoot, metricsPathArg)
    : resolve(projectRoot, `data/w1-artifacts/${workflowRunId}/metrics.json`);

  // Check if required files exist
  const planExists = existsSync(resolvedPlanPath);
  const changelogExists = existsSync(resolvedChangelogPath);
  const metricsExists = existsSync(resolvedMetricsPath);

  const timestamp = new Date().toISOString().split('T')[0];
  const version = `v1.0.0-${timestamp.replace(/-/g, '')}`;
  const outputPath = join(outputDir, `release-notes-${version}.md`);

  // If using placeholder mode or missing files, generate placeholder
  if (usePlaceholder || (!planExists || !changelogExists || !metricsExists)) {
    if (!planExists || !changelogExists || !metricsExists) {
      console.log('  (!) Missing source files for release notes generation');
    }
    console.log('  Generating placeholder release notes...');

    const placeholderContent = `# Release Notes - ${book.title}

**Version:** ${version}
**Date:** ${timestamp}

## Summary

This release includes updates to ${book.title} from the W1 editing workflow.

## Highlights

- Updated content based on W1 improvement plan
- Enhanced clarity and readability
- Improved rule accuracy

## Changes

Changes were made as part of workflow run \`${workflowRunId}\`.

## Known Issues

None at this time.

---
*Generated by W1 Finalization Workflow*
`;

    writeFileSync(outputPath, placeholderContent);

    // Register artifact
    artifactRegistry.register({
      workflowRunId: workflowRunId!,
      artifactType: 'release_notes',
      artifactPath: outputPath,
      metadata: {
        book_id: book.id,
        book_slug: book.slug,
        version,
        placeholder: true,
        generated_at: new Date().toISOString(),
      },
    });

    console.log(`  OK Generated: ${outputPath} (placeholder)`);

    return {
      success: true,
      outputPath,
      metadata: { version, placeholder: true },
    };
  }

  // Generate prompt for LLM-based release notes
  console.log('  Generating release notes prompt...');
  const promptWriter = new W1PromptWriter({ runId: workflowRunId! });

  const prompt = generateReleaseNotesPrompt({
    runId: workflowRunId!,
    bookSlug: book.slug,
    bookTitle: book.title,
    planPath: resolvedPlanPath,
    changelogPath: resolvedChangelogPath,
    metricsPath: resolvedMetricsPath,
  });

  const promptPath = promptWriter.writeReleaseNotesPrompt(prompt);
  console.log(`  OK Prompt saved: ${promptPath}`);

  // Return with instructions for next step
  return {
    success: true,
    outputPath: promptPath,
    metadata: {
      promptBased: true,
      version,
      nextStep: `pnpm w1:finalize --save-release-notes --run=${workflowRunId} --result=<path-to-result.json>`,
    },
  };
}

/**
 * Mark workflow as failed and exit
 */
function handleFailure(
  db: Database.Database,
  workflowRepo: WorkflowRepository,
  stepName: string,
  error: string,
  results: FinalizationResult
): never {
  console.log('');
  console.log(`  ERROR ${stepName} failed: ${error}`);

  // Update workflow status to failed
  try {
    workflowRepo.updateStatus(workflowRunId!, 'failed');
    console.log('');
    console.log(`Workflow ${workflowRunId} marked as failed.`);
  } catch {
    console.log('');
    console.log(`Warning: Could not update workflow status to failed.`);
  }

  console.log('');
  console.log(
    CLIFormatter.format({
      title: 'W1 FINALIZATION FAILED',
      content: `Failed at: ${stepName}\nError: ${error}`,
      status: [
        { label: 'Print HTML', success: results.printHtml?.success ?? false, pending: !results.printHtml },
        { label: 'PDF', success: results.pdf?.success ?? false, pending: !results.pdf },
        { label: 'Web HTML', success: results.webHtml?.success ?? false, pending: !results.webHtml },
        { label: 'Release Notes', success: results.releaseNotes?.success ?? false, pending: !results.releaseNotes },
      ],
      nextStep: [
        'Debug the error above and retry:',
        `  pnpm w1:finalize --book ${bookIdOrSlug} --workflow ${workflowRunId}`,
      ],
    })
  );

  db.close();
  process.exit(1);
}

async function runFullFinalization(): Promise<void> {
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

  const results: FinalizationResult = {};

  try {
    // Verify book exists
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

    // Verify workflow run exists
    const workflowRun = workflowRepo.getById(workflowRunId!);
    if (!workflowRun) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Workflow run not found: ${workflowRunId}`,
          status: [{ label: 'Workflow run does not exist', success: false }],
          nextStep: ['List workflow runs:', '  pnpm workflow:list'],
        })
      );
      process.exit(1);
    }

    // Step 1: Print HTML
    results.printHtml = await stepPrintHtml(db, book, artifactRegistry);
    if (!results.printHtml.success) {
      handleFailure(db, workflowRepo, 'Print HTML', results.printHtml.error!, results);
    }

    // Step 2: PDF
    results.pdf = await stepPdf(book, results.printHtml.outputPath!, artifactRegistry);
    if (!results.pdf.success) {
      handleFailure(db, workflowRepo, 'PDF', results.pdf.error!, results);
    }

    // Step 3: Web HTML
    results.webHtml = await stepWebHtml(db, book, artifactRegistry);
    if (!results.webHtml.success) {
      handleFailure(db, workflowRepo, 'Web HTML', results.webHtml.error!, results);
    }

    // Step 4: Release Notes (optional)
    if (!skipReleaseNotes) {
      results.releaseNotes = await stepReleaseNotes(
        book,
        artifactRegistry,
        planPath,
        changelogPath,
        metricsPath
      );
      if (!results.releaseNotes.success) {
        handleFailure(db, workflowRepo, 'Release Notes', results.releaseNotes.error!, results);
      }

      // Check if prompt-based (needs manual LLM step)
      if (results.releaseNotes.metadata?.promptBased) {
        console.log('');
        console.log(
          CLIFormatter.format({
            title: 'RELEASE NOTES PROMPT GENERATED',
            content: [
              'A prompt has been generated for release notes.',
              'Run the prompt with Claude and save the result.',
              '',
              `Prompt file: ${results.releaseNotes.outputPath}`,
            ],
            status: [
              { label: 'Print HTML generated', success: true },
              { label: 'PDF generated', success: true },
              { label: 'Web HTML generated', success: true },
              { label: 'Release Notes prompt ready', success: true },
            ],
            nextStep: [
              'Next steps:',
              '',
              '1. Run the prompt with Claude:',
              `   cat "${results.releaseNotes.outputPath}" | claude`,
              '',
              '2. Save the result to:',
              `   data/w1-artifacts/${workflowRunId}/release-notes.json`,
              '',
              '3. Complete finalization:',
              `   pnpm w1:finalize --save-release-notes --run=${workflowRunId} --result=data/w1-artifacts/${workflowRunId}/release-notes.json`,
            ],
          })
        );
        db.close();
        return;
      }
    } else {
      console.log('');
      console.log('Step 4: Release Notes');
      console.log('  (skipped via --skip-release-notes)');
    }

    // Step 5: Update workflow status to completed
    console.log('');
    console.log('Step 5: Updating workflow status...');
    try {
      workflowRepo.updateStatus(workflowRunId!, 'completed');
      console.log(`  OK Workflow ${workflowRunId} marked as completed`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  (!) Could not update workflow status: ${errorMessage}`);
    }

    // Print completion summary
    console.log('');
    console.log('-----------------------------------------------------------');
    console.log('W1 WORKFLOW COMPLETE');
    console.log('-----------------------------------------------------------');
    console.log('');
    console.log('Artifacts:');
    console.log(`  - Print HTML: ${results.printHtml.outputPath}`);
    console.log(`  - PDF: ${results.pdf.outputPath}`);
    console.log(`  - Web HTML: ${results.webHtml.outputPath}`);
    if (results.releaseNotes && !results.releaseNotes.metadata?.promptBased) {
      console.log(`  - Release Notes: ${results.releaseNotes.outputPath}`);
    }
    console.log('');
    console.log(`Workflow run ${workflowRunId} marked as completed.`);
    console.log('');
    console.log('-----------------------------------------------------------');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Finalization failed: ${errorMessage}`,
        status: [{ label: 'Finalization failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure all required dependencies are available.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

async function runSaveReleaseNotesMode(): Promise<void> {
  // Validate result file exists
  const resolvedResultPath = resolve(projectRoot, resultPath!);
  if (!existsSync(resolvedResultPath)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Result file not found: ${resolvedResultPath}`,
        status: [{ label: 'Result file does not exist', success: false }],
        nextStep: [
          'Ensure you have saved the release notes result to the specified path.',
          'The result should be a JSON file with the ReleaseNotesOutput schema.',
        ],
      })
    );
    process.exit(1);
  }

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

  try {
    // 1. Load and validate result
    console.log('Step 1: Loading release notes result...');
    const resultContent = readFileSync(resolvedResultPath, 'utf-8');
    const releaseNotes = JSON.parse(resultContent);

    if (!releaseNotes.markdown) {
      throw new Error('Invalid result: missing "markdown" field');
    }

    console.log(`  OK Result loaded: ${releaseNotes.title || 'Release Notes'}`);
    console.log(`  OK Version: ${releaseNotes.version || 'N/A'}`);

    // 2. Get workflow run info
    console.log('Step 2: Verifying workflow run...');
    const workflowRun = workflowRepo.getById(workflowRunId!);
    if (!workflowRun) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Workflow run not found: ${workflowRunId}`,
          status: [{ label: 'Workflow run does not exist', success: false }],
          nextStep: ['List workflow runs:', '  pnpm workflow:list'],
        })
      );
      process.exit(1);
    }
    console.log(`  OK Workflow run verified: ${workflowRun.id}`);

    // Get book info
    const book = bookRepo.getById(workflowRun.book_id);
    if (!book) {
      throw new Error(`Book not found for workflow run: ${workflowRun.book_id}`);
    }

    // 3. Save result using W1ResultSaver
    console.log('Step 3: Saving release notes...');
    const resultSaver = new W1ResultSaver(db, workflowRunId!);
    const outputPath = join(resolve(projectRoot, 'data/w1-artifacts'), workflowRunId!, 'release-notes.json');
    resultSaver.saveReleaseNotesResult(
      releaseNotes as unknown as Record<string, unknown>,
      outputPath
    );
    console.log(`  OK Result saved: ${outputPath}`);

    // 4. Update workflow status to completed
    console.log('Step 4: Updating workflow status...');
    try {
      workflowRepo.updateStatus(workflowRunId!, 'completed');
      console.log(`  OK Workflow ${workflowRunId} marked as completed`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  (!) Could not update workflow status: ${errorMessage}`);
    }

    // 5. Output final result
    console.log('');
    console.log(
      CLIFormatter.format({
        title: 'RELEASE NOTES SAVED',
        content: [
          `Title: ${releaseNotes.title || 'Release Notes'}`,
          `Version: ${releaseNotes.version || 'N/A'}`,
          `Output: ${outputPath}`,
        ],
        status: [
          { label: `Book: ${book.slug}`, success: true },
          { label: 'Release notes saved', success: true },
          { label: 'Workflow completed', success: true },
        ],
        nextStep: [
          'W1 workflow is now complete.',
          '',
          'Artifacts:',
          `  - Release Notes: ${outputPath}`,
          `  - Markdown: ${outputPath.replace(/\.json$/, '.md')}`,
        ],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Save failed: ${errorMessage}`,
        status: [{ label: 'Save operation failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure the result file is valid JSON.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

async function main(): Promise<void> {
  if (isSaveReleaseNotesMode) {
    await runSaveReleaseNotesMode();
  } else {
    await runFullFinalization();
  }
}

main();
