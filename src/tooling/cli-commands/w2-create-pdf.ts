// src/tooling/cli-commands/w2-create-pdf.ts

/**
 * w2:create-pdf CLI Command
 *
 * PDF creation step for W2 PDF workflow.
 * Applies layout and design plans to generate the PDF.
 *
 * Usage:
 *   Generate prompt: pnpm w2:create-pdf --run <id>
 *   Save result:     pnpm w2:create-pdf --save --run <id> --pdf <path>
 */

import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables, runMigrations } from '@razorweave/database';
import { generateCreatePdfPrompt } from '../w2/prompt-generator.js';
import { W2PromptWriter } from '../w2/prompt-writer.js';
import { W2ResultSaver } from '../w2/result-saver.js';

function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

const { values } = parseArgs({
  options: {
    run: { type: 'string', short: 'r' },
    save: { type: 'boolean', default: false },
    pdf: { type: 'string' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W2 CREATE PDF - HELP',
      content: `PDF creation step for W2 PDF workflow.

Generate prompt: pnpm w2:create-pdf --run <id>
Save result:     pnpm w2:create-pdf --save --run <id> --pdf <path>`,
      status: [],
      nextStep: [],
    })
  );
  process.exit(0);
}

const isSaveMode = values.save === true;
const runId = values.run;

if (!runId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --run <id>',
      status: [{ label: 'Run ID is required', success: false }],
      nextStep: ['Usage:', '  pnpm w2:create-pdf --run <id>'],
    })
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  createTables(db);
  try { runMigrations(dbPath); } catch { /* already applied */ }

  try {
    if (isSaveMode) {
      await runSaveMode(db);
    } else {
      await runGenerateMode(db);
    }
  } finally {
    db.close();
  }
}

async function runGenerateMode(db: Database.Database): Promise<void> {
  console.log(CLIFormatter.header('W2 CREATE PDF'));
  console.log(`Run ID: ${runId}`);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);
  const bookRepo = new BookRepository(db);

  const workflowRun = workflowRepo.getById(runId!);
  if (!workflowRun) {
    console.error(`ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }

  const book = bookRepo.getById(workflowRun.book_id);
  if (!book) {
    console.error(`ERROR: Book not found: ${workflowRun.book_id}`);
    process.exit(1);
  }

  const htmlPath = resolve(projectRoot, `data/html/print-design/${book.slug}.html`);
  const layoutPlanPath = resolve(projectRoot, `data/w2-artifacts/${runId}/layout-plan.json`);
  const designPlanPath = resolve(projectRoot, `data/w2-artifacts/${runId}/design-plan.json`);
  const outputPath = resolve(projectRoot, `data/w2-artifacts/${runId}/draft.pdf`);

  // Check for assets path (optional)
  const assetsPath = resolve(projectRoot, `data/w2-artifacts/${runId}/assets`);
  const hasAssets = existsSync(assetsPath);

  const prompt = generateCreatePdfPrompt({
    runId: runId!,
    bookSlug: book.slug,
    htmlPath,
    layoutPlanPath,
    designPlanPath,
    assetsPath: hasAssets ? assetsPath : null,
    outputPath,
  });

  const promptWriter = new W2PromptWriter({ runId: runId! });
  const promptPath = promptWriter.writeCreatePdfPrompt(prompt);

  console.log(
    CLIFormatter.format({
      title: 'CREATE PDF PROMPT GENERATED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Book', value: `${book.title} (${book.slug})` },
        { key: 'Output', value: outputPath },
        { key: 'Assets', value: hasAssets ? assetsPath : 'None' },
        { key: 'Prompt', value: promptPath },
      ]),
      status: [{ label: 'Prompt generated', success: true }],
      nextStep: [
        'Read the prompt and execute the task:',
        `  cat ${promptPath}`,
        '',
        'Then save the result:',
        `  pnpm w2:create-pdf --save --run=${runId} --pdf=${outputPath}`,
      ],
    })
  );
}

async function runSaveMode(db: Database.Database): Promise<void> {
  const pdfPath = values.pdf;

  if (!pdfPath) {
    console.error('ERROR: --pdf <path> is required in save mode');
    process.exit(1);
  }

  const resolvedPath = resolve(projectRoot, pdfPath);
  if (!existsSync(resolvedPath)) {
    console.error(`ERROR: PDF file not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(CLIFormatter.header('W2 CREATE PDF - SAVE'));
  console.log(`Run ID: ${runId}`);
  console.log(`PDF: ${resolvedPath}`);
  console.log('');

  // Register the draft PDF
  const resultSaver = new W2ResultSaver(db, runId!);
  resultSaver.saveDraftPdf(resolvedPath);

  console.log(
    CLIFormatter.format({
      title: 'DRAFT PDF SAVED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'PDF Path', value: resolvedPath },
      ]),
      status: [{ label: 'PDF saved', success: true }],
      nextStep: [
        'Next step:',
        `  pnpm w2:editor-review --run=${runId}`,
      ],
    })
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
