// src/tooling/cli-commands/w2-pm-review.ts

/**
 * w2:pm-review CLI Command
 *
 * PM Review step for W2 PDF workflow.
 * Reviews W1 artifacts to identify priority areas for layout attention.
 *
 * Usage:
 *   Generate prompt: pnpm w2:pm-review --run <id>
 *   Save result:     pnpm w2:pm-review --save --run <id> --result <path>
 */

import { parseArgs } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables, runMigrations } from '@razorweave/database';
import { generatePmReviewPrompt } from '../w2/prompt-generator.js';
import { W2PromptWriter } from '../w2/prompt-writer.js';
import { W2ResultSaver } from '../w2/result-saver.js';
import type { PmReviewResult } from '../w2/types.js';

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
    result: { type: 'string' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W2 PM REVIEW - HELP',
      content: `PM Review step for W2 PDF workflow.

Generate prompt: pnpm w2:pm-review --run <id>
Save result:     pnpm w2:pm-review --save --run <id> --result <path>`,
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
      nextStep: ['Usage:', '  pnpm w2:pm-review --run <id>'],
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
  console.log(CLIFormatter.header('W2 PM REVIEW'));
  console.log(`Run ID: ${runId}`);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);
  const bookRepo = new BookRepository(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId!);
  if (!workflowRun) {
    console.error(`ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }

  // Get book info
  const book = bookRepo.getById(workflowRun.book_id);
  if (!book) {
    console.error(`ERROR: Book not found: ${workflowRun.book_id}`);
    process.exit(1);
  }

  // Determine paths
  const htmlPath = resolve(projectRoot, `data/html/print-design/${book.slug}.html`);
  const releaseNotesPath = resolve(projectRoot, `data/w1-artifacts/${runId}/release-notes.json`);

  // Generate prompt
  const prompt = generatePmReviewPrompt({
    runId: runId!,
    bookSlug: book.slug,
    bookTitle: book.title,
    htmlPath,
    releaseNotesPath,
  });

  // Write prompt
  const promptWriter = new W2PromptWriter({ runId: runId! });
  const promptPath = promptWriter.writePmReviewPrompt(prompt);

  console.log(
    CLIFormatter.format({
      title: 'PM REVIEW PROMPT GENERATED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Book', value: `${book.title} (${book.slug})` },
        { key: 'Prompt', value: promptPath },
      ]),
      status: [{ label: 'Prompt generated', success: true }],
      nextStep: [
        'Read the prompt and execute the task:',
        `  cat ${promptPath}`,
        '',
        'Then save the result:',
        `  pnpm w2:pm-review --save --run=${runId} --result=data/w2-artifacts/${runId}/pm-review.json`,
      ],
    })
  );
}

async function runSaveMode(db: Database.Database): Promise<void> {
  const resultPath = values.result;

  if (!resultPath) {
    console.error('ERROR: --result <path> is required in save mode');
    process.exit(1);
  }

  const resolvedPath = resolve(projectRoot, resultPath);
  if (!existsSync(resolvedPath)) {
    console.error(`ERROR: Result file not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(CLIFormatter.header('W2 PM REVIEW - SAVE'));
  console.log(`Run ID: ${runId}`);
  console.log(`Result: ${resolvedPath}`);
  console.log('');

  // Load and validate result
  const resultContent = readFileSync(resolvedPath, 'utf-8');
  const result: PmReviewResult = JSON.parse(resultContent);

  // Save result
  const resultSaver = new W2ResultSaver(db, runId!);
  resultSaver.savePmReviewResult(result, resolvedPath);

  console.log(
    CLIFormatter.format({
      title: 'PM REVIEW RESULT SAVED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Priority Sections', value: String(result.priority_sections.length) },
        { key: 'Focus Areas', value: String(result.focus_areas.length) },
      ]),
      status: [{ label: 'Result saved', success: true }],
      nextStep: [
        'Next step:',
        `  pnpm w2:layout --run=${runId}`,
      ],
    })
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
