// src/tooling/cli-commands/w2-human-gate.ts

/**
 * w2:human-gate CLI Command
 *
 * Human decision gate for W2 PDF workflow.
 * Shows current status and accepts approval, rejection, or asset provision.
 *
 * Usage:
 *   Show status:       pnpm w2:human-gate --run <id>
 *   Approve:           pnpm w2:human-gate --run <id> --approve
 *   Reject:            pnpm w2:human-gate --run <id> --reject --feedback "reason"
 *   Provide assets:    pnpm w2:human-gate --run <id> --assets <path>
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
import type { W2State, ImagePromptsResult } from '../w2/types.js';

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
    approve: { type: 'boolean', default: false },
    reject: { type: 'boolean', default: false },
    feedback: { type: 'string' },
    assets: { type: 'string' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W2 HUMAN GATE - HELP',
      content: `Human decision gate for W2 PDF workflow.

Show status:       pnpm w2:human-gate --run <id>
Approve:           pnpm w2:human-gate --run <id> --approve
Reject:            pnpm w2:human-gate --run <id> --reject --feedback "reason"
Provide assets:    pnpm w2:human-gate --run <id> --assets <path>`,
      status: [],
      nextStep: [],
    })
  );
  process.exit(0);
}

const runId = values.run;

if (!runId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --run <id>',
      status: [{ label: 'Run ID is required', success: false }],
      nextStep: ['Usage:', '  pnpm w2:human-gate --run <id>'],
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
    if (values.approve) {
      await runApproveMode(db);
    } else if (values.reject) {
      await runRejectMode(db);
    } else if (values.assets) {
      await runAssetsMode(db);
    } else {
      await runShowStatusMode(db);
    }
  } finally {
    db.close();
  }
}

async function runShowStatusMode(db: Database.Database): Promise<void> {
  console.log(CLIFormatter.header('W2 HUMAN GATE - STATUS'));
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

  // Load state.json
  const stateJsonPath = resolve(projectRoot, `data/w2-artifacts/${runId}/state.json`);
  let state: W2State | null = null;
  if (existsSync(stateJsonPath)) {
    const stateContent = readFileSync(stateJsonPath, 'utf-8');
    state = JSON.parse(stateContent);
  }

  // Find draft PDF
  const draftPdfPath = resolve(projectRoot, `data/w2-artifacts/${runId}/draft.pdf`);
  const hasDraftPdf = existsSync(draftPdfPath);

  // Load image prompts if available
  const imagePromptsPath = resolve(projectRoot, `data/w2-artifacts/${runId}/image-prompts.json`);
  let imagePrompts: ImagePromptsResult | null = null;
  if (existsSync(imagePromptsPath)) {
    const imagePromptsContent = readFileSync(imagePromptsPath, 'utf-8');
    imagePrompts = JSON.parse(imagePromptsContent);
  }

  const statusItems = [
    { key: 'Book', value: `${book.title} (${book.slug})` },
    { key: 'Run ID', value: runId! },
    { key: 'Draft PDF', value: hasDraftPdf ? draftPdfPath : 'Not found' },
    { key: 'Editor Cycles', value: state ? String(state.editor_cycles) : 'Unknown' },
    { key: 'Iteration Count', value: state ? String(state.iteration_count) : 'Unknown' },
    { key: 'Image Prompts', value: imagePrompts ? String(imagePrompts.prompts.length) : 'None' },
  ];

  console.log(
    CLIFormatter.format({
      title: 'CURRENT STATUS',
      content: CLIFormatter.table(statusItems),
      status: [{ label: 'Awaiting human decision', success: true }],
      nextStep: [
        'Options:',
        `  Approve and finalize:    pnpm w2:human-gate --run=${runId} --approve`,
        `  Reject with feedback:    pnpm w2:human-gate --run=${runId} --reject --feedback "reason"`,
        `  Provide image assets:    pnpm w2:human-gate --run=${runId} --assets <path>`,
      ],
    })
  );

  if (imagePrompts && imagePrompts.prompts.length > 0) {
    console.log('\nImage Prompts:');
    imagePrompts.prompts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.id} (${p.aspect_ratio}) - ${p.location}`);
      console.log(`     ${p.prompt}`);
    });
  }
}

async function runApproveMode(_db: Database.Database): Promise<void> {
  console.log(CLIFormatter.header('W2 HUMAN GATE - APPROVE'));
  console.log(`Run ID: ${runId}`);
  console.log('');

  // Update state.json
  const stateJsonPath = resolve(projectRoot, `data/w2-artifacts/${runId}/state.json`);
  if (existsSync(stateJsonPath)) {
    const stateContent = readFileSync(stateJsonPath, 'utf-8');
    const state: W2State = JSON.parse(stateContent);
    state.current_step = 'derive-digital';
    state.human_feedback = 'approved';
    state.last_updated = new Date().toISOString();
    writeFileSync(stateJsonPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  console.log(
    CLIFormatter.format({
      title: 'APPROVED',
      content: 'Draft PDF approved. Proceeding to digital PDF derivation.',
      status: [{ label: 'Approval recorded', success: true }],
      nextStep: [
        'Next step:',
        `  pnpm w2:derive-digital --run=${runId}`,
      ],
    })
  );
}

async function runRejectMode(_db: Database.Database): Promise<void> {
  const feedback = values.feedback;

  if (!feedback) {
    console.error('ERROR: --feedback <reason> is required when rejecting');
    process.exit(1);
  }

  console.log(CLIFormatter.header('W2 HUMAN GATE - REJECT'));
  console.log(`Run ID: ${runId}`);
  console.log(`Feedback: ${feedback}`);
  console.log('');

  // Update state.json
  const stateJsonPath = resolve(projectRoot, `data/w2-artifacts/${runId}/state.json`);
  if (existsSync(stateJsonPath)) {
    const stateContent = readFileSync(stateJsonPath, 'utf-8');
    const state: W2State = JSON.parse(stateContent);
    state.current_step = 'layout';
    state.human_feedback = feedback;
    state.iteration_count += 1;
    state.last_updated = new Date().toISOString();
    writeFileSync(stateJsonPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  console.log(
    CLIFormatter.format({
      title: 'REJECTED',
      content: `Draft PDF rejected. Returning to layout step.\n\nFeedback: ${feedback}`,
      status: [{ label: 'Rejection recorded', success: true }],
      nextStep: [
        'Next step:',
        `  pnpm w2:layout --run=${runId}`,
      ],
    })
  );
}

async function runAssetsMode(_db: Database.Database): Promise<void> {
  const assetsPath = values.assets!;
  const resolvedAssetsPath = resolve(projectRoot, assetsPath);

  if (!existsSync(resolvedAssetsPath)) {
    console.error(`ERROR: Assets path not found: ${resolvedAssetsPath}`);
    process.exit(1);
  }

  console.log(CLIFormatter.header('W2 HUMAN GATE - ASSETS PROVIDED'));
  console.log(`Run ID: ${runId}`);
  console.log(`Assets: ${resolvedAssetsPath}`);
  console.log('');

  // Update state.json
  const stateJsonPath = resolve(projectRoot, `data/w2-artifacts/${runId}/state.json`);
  if (existsSync(stateJsonPath)) {
    const stateContent = readFileSync(stateJsonPath, 'utf-8');
    const state: W2State = JSON.parse(stateContent);
    state.current_step = 'create-pdf';
    state.assets_path = resolvedAssetsPath;
    state.human_feedback = 'assets_provided';
    state.last_updated = new Date().toISOString();
    writeFileSync(stateJsonPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  console.log(
    CLIFormatter.format({
      title: 'ASSETS RECORDED',
      content: `Image assets path recorded. Regenerating PDF with assets.`,
      status: [{ label: 'Assets path saved', success: true }],
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
