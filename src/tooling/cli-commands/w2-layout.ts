// src/tooling/cli-commands/w2-layout.ts

/**
 * w2:layout CLI Command
 *
 * Layout planning step for W2 PDF workflow.
 * Creates structural layout plan (page breaks, margins, tables).
 *
 * Usage:
 *   Generate prompt: pnpm w2:layout --run <id>
 *   Save result:     pnpm w2:layout --save --run <id> --plan <path>
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
import { generateLayoutPrompt } from '../w2/prompt-generator.js';
import { W2PromptWriter } from '../w2/prompt-writer.js';
import { W2ResultSaver } from '../w2/result-saver.js';
import type { LayoutPlan } from '../w2/types.js';

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
    plan: { type: 'string' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W2 LAYOUT - HELP',
      content: `Layout planning step for W2 PDF workflow.

Generate prompt: pnpm w2:layout --run <id>
Save result:     pnpm w2:layout --save --run <id> --plan <path>`,
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
      nextStep: ['Usage:', '  pnpm w2:layout --run <id>'],
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
  console.log(CLIFormatter.header('W2 LAYOUT PLANNING'));
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
  const pmReviewPath = resolve(projectRoot, `data/w2-artifacts/${runId}/pm-review.json`);

  const prompt = generateLayoutPrompt({
    runId: runId!,
    bookSlug: book.slug,
    htmlPath,
    pmReviewPath,
  });

  const promptWriter = new W2PromptWriter({ runId: runId! });
  const promptPath = promptWriter.writeLayoutPrompt(prompt);

  console.log(
    CLIFormatter.format({
      title: 'LAYOUT PROMPT GENERATED',
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
        `  pnpm w2:layout --save --run=${runId} --plan=data/w2-artifacts/${runId}/layout-plan.json`,
      ],
    })
  );
}

async function runSaveMode(db: Database.Database): Promise<void> {
  const planPath = values.plan;

  if (!planPath) {
    console.error('ERROR: --plan <path> is required in save mode');
    process.exit(1);
  }

  const resolvedPath = resolve(projectRoot, planPath);
  if (!existsSync(resolvedPath)) {
    console.error(`ERROR: Plan file not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(CLIFormatter.header('W2 LAYOUT - SAVE'));
  console.log(`Run ID: ${runId}`);
  console.log(`Plan: ${resolvedPath}`);
  console.log('');

  const planContent = readFileSync(resolvedPath, 'utf-8');
  const plan: LayoutPlan = JSON.parse(planContent);

  const resultSaver = new W2ResultSaver(db, runId!);
  resultSaver.saveLayoutPlan(plan, resolvedPath);

  console.log(
    CLIFormatter.format({
      title: 'LAYOUT PLAN SAVED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Page Breaks', value: String(plan.page_breaks.length) },
        { key: 'Table Strategy', value: plan.table_strategy },
      ]),
      status: [{ label: 'Plan saved', success: true }],
      nextStep: [
        'Next step:',
        `  pnpm w2:design --run=${runId}`,
      ],
    })
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
