// src/tooling/cli-commands/w2-editor-review.ts

/**
 * w2:editor-review CLI Command
 *
 * Editor review step for W2 PDF workflow.
 * Reviews PDF presentation quality (layout, typography, print-readiness).
 *
 * Usage:
 *   Generate prompt: pnpm w2:editor-review --run <id>
 *   Save result:     pnpm w2:editor-review --save --run <id> --result <path>
 */

import { parseArgs } from 'node:util';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables, runMigrations } from '@razorweave/database';
import { generateEditorReviewPrompt } from '../w2/prompt-generator.js';
import { W2PromptWriter } from '../w2/prompt-writer.js';
import { W2ResultSaver } from '../w2/result-saver.js';
import type { EditorReviewResult, W2State } from '../w2/types.js';

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
      title: 'W2 EDITOR REVIEW - HELP',
      content: `Editor review step for W2 PDF workflow.

Generate prompt: pnpm w2:editor-review --run <id>
Save result:     pnpm w2:editor-review --save --run <id> --result <path>`,
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
      nextStep: ['Usage:', '  pnpm w2:editor-review --run <id>'],
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
  console.log(CLIFormatter.header('W2 EDITOR REVIEW'));
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

  // Load state.json to get iteration count
  const stateJsonPath = resolve(projectRoot, `data/w2-artifacts/${runId}/state.json`);
  let iteration = 1;
  if (existsSync(stateJsonPath)) {
    const stateContent = readFileSync(stateJsonPath, 'utf-8');
    const state: W2State = JSON.parse(stateContent);
    iteration = state.iteration_count;
  }

  // Find the draft PDF path
  const draftPdfPath = resolve(projectRoot, `data/w2-artifacts/${runId}/draft.pdf`);
  if (!existsSync(draftPdfPath)) {
    console.error(`ERROR: Draft PDF not found: ${draftPdfPath}`);
    console.error('Run w2:create-pdf first to generate a draft PDF');
    process.exit(1);
  }

  const prompt = generateEditorReviewPrompt({
    runId: runId!,
    bookSlug: book.slug,
    pdfPath: draftPdfPath,
    iteration,
  });

  const promptWriter = new W2PromptWriter({ runId: runId! });
  const promptPath = promptWriter.writeEditorReviewPrompt(prompt);

  console.log(
    CLIFormatter.format({
      title: 'EDITOR REVIEW PROMPT GENERATED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Book', value: `${book.title} (${book.slug})` },
        { key: 'PDF', value: draftPdfPath },
        { key: 'Iteration', value: String(iteration) },
        { key: 'Prompt', value: promptPath },
      ]),
      status: [{ label: 'Prompt generated', success: true }],
      nextStep: [
        'Read the prompt and execute the task:',
        `  cat ${promptPath}`,
        '',
        'Then save the result:',
        `  pnpm w2:editor-review --save --run=${runId} --result=data/w2-artifacts/${runId}/editor-review.json`,
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

  console.log(CLIFormatter.header('W2 EDITOR REVIEW - SAVE'));
  console.log(`Run ID: ${runId}`);
  console.log(`Result: ${resolvedPath}`);
  console.log('');

  // Load and validate result
  const resultContent = readFileSync(resolvedPath, 'utf-8');
  const result: EditorReviewResult = JSON.parse(resultContent);

  // Save result
  const resultSaver = new W2ResultSaver(db, runId!);
  resultSaver.saveEditorReviewResult(result, resolvedPath);

  // Update state.json to increment editor_cycles
  const stateJsonPath = resolve(projectRoot, `data/w2-artifacts/${runId}/state.json`);
  if (existsSync(stateJsonPath)) {
    const stateContent = readFileSync(stateJsonPath, 'utf-8');
    const state: W2State = JSON.parse(stateContent);
    state.editor_cycles += 1;
    state.last_updated = new Date().toISOString();
    writeFileSync(stateJsonPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  const nextStep = result.approved
    ? ['Next step:', `  pnpm w2:human-gate --run=${runId}`]
    : [
        'Issues found. Returning to layout step.',
        'Next step:',
        `  pnpm w2:layout --run=${runId}`,
      ];

  console.log(
    CLIFormatter.format({
      title: 'EDITOR REVIEW RESULT SAVED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Approved', value: result.approved ? 'Yes' : 'No' },
        { key: 'Issues Found', value: String(result.issues.length) },
      ]),
      status: [{ label: 'Result saved', success: true }],
      nextStep,
    })
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
