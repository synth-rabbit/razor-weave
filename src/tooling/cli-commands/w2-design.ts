// src/tooling/cli-commands/w2-design.ts

/**
 * w2:design CLI Command
 *
 * Design planning step for W2 PDF workflow.
 * Creates visual design plan and image generation prompts.
 *
 * Usage:
 *   Generate prompt: pnpm w2:design --run <id>
 *   Save result:     pnpm w2:design --save --run <id> --plan <path>
 */

import { parseArgs } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables, runMigrations } from '@razorweave/database';
import { generateDesignPrompt } from '../w2/prompt-generator.js';
import { W2PromptWriter } from '../w2/prompt-writer.js';
import { W2ResultSaver } from '../w2/result-saver.js';
import type { DesignPlan, ImagePromptsResult } from '../w2/types.js';

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
      title: 'W2 DESIGN - HELP',
      content: `Design planning step for W2 PDF workflow.

Generate prompt: pnpm w2:design --run <id>
Save result:     pnpm w2:design --save --run <id> --plan <path>`,
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
      nextStep: ['Usage:', '  pnpm w2:design --run <id>'],
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
  console.log(CLIFormatter.header('W2 DESIGN PLANNING'));
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

  const layoutPlanPath = resolve(projectRoot, `data/w2-artifacts/${runId}/layout-plan.json`);
  const pmReviewPath = resolve(projectRoot, `data/w2-artifacts/${runId}/pm-review.json`);

  const prompt = generateDesignPrompt({
    runId: runId!,
    bookSlug: book.slug,
    layoutPlanPath,
    pmReviewPath,
  });

  const promptWriter = new W2PromptWriter({ runId: runId! });
  const promptPath = promptWriter.writeDesignPrompt(prompt);

  console.log(
    CLIFormatter.format({
      title: 'DESIGN PROMPT GENERATED',
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
        `  pnpm w2:design --save --run=${runId} --plan=data/w2-artifacts/${runId}/design-plan.json`,
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

  console.log(CLIFormatter.header('W2 DESIGN - SAVE'));
  console.log(`Run ID: ${runId}`);
  console.log(`Plan: ${resolvedPath}`);
  console.log('');

  // Load and validate design plan
  const planContent = readFileSync(resolvedPath, 'utf-8');
  const plan: DesignPlan = JSON.parse(planContent);

  // Save design plan
  const resultSaver = new W2ResultSaver(db, runId!);
  resultSaver.saveDesignPlan(plan, resolvedPath);

  // Also load and save image prompts if they exist
  const imagePromptsPath = join(dirname(resolvedPath), 'image-prompts.json');
  let imagePromptsCount = 0;

  if (existsSync(imagePromptsPath)) {
    const imagePromptsContent = readFileSync(imagePromptsPath, 'utf-8');
    const imagePrompts: ImagePromptsResult = JSON.parse(imagePromptsContent);
    resultSaver.saveImagePrompts(imagePrompts, imagePromptsPath);
    imagePromptsCount = imagePrompts.prompts.length;
  }

  console.log(
    CLIFormatter.format({
      title: 'DESIGN PLAN SAVED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Body Typography', value: plan.typography.body },
        { key: 'Accent Color', value: plan.colors.accent },
        { key: 'Image Prompts', value: String(imagePromptsCount) },
      ]),
      status: [{ label: 'Plan saved', success: true }],
      nextStep: [
        'Next step:',
        `  pnpm w2:create-pdf --run=${runId}`,
      ],
    })
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
