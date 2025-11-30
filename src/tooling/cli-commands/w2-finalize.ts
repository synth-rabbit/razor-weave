// src/tooling/cli-commands/w2-finalize.ts

/**
 * w2:finalize CLI Command
 *
 * Finalization step for W2 PDF workflow.
 * Copies PDFs to final locations and marks workflow as completed.
 *
 * Usage:
 *   pnpm w2:finalize --run <id>
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables, runMigrations } from '@razorweave/database';
import { W2ResultSaver } from '../w2/result-saver.js';
import type { W2State } from '../w2/types.js';

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
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W2 FINALIZE - HELP',
      content: `Finalization step for W2 PDF workflow.

Usage: pnpm w2:finalize --run <id>`,
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
      nextStep: ['Usage:', '  pnpm w2:finalize --run <id>'],
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
    await runFinalize(db);
  } finally {
    db.close();
  }
}

async function runFinalize(db: Database.Database): Promise<void> {
  console.log(CLIFormatter.header('W2 FINALIZE'));
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

  // Verify PDFs exist
  const draftPdfPath = resolve(projectRoot, `data/w2-artifacts/${runId}/draft.pdf`);
  const digitalPdfPath = resolve(projectRoot, `data/w2-artifacts/${runId}/digital.pdf`);

  if (!existsSync(draftPdfPath)) {
    console.error(`ERROR: Print PDF not found: ${draftPdfPath}`);
    process.exit(1);
  }

  if (!existsSync(digitalPdfPath)) {
    console.error(`ERROR: Digital PDF not found: ${digitalPdfPath}`);
    process.exit(1);
  }

  // Create final destination directory
  const finalDir = resolve(projectRoot, `data/pdfs/${book.slug}/${book.current_version}`);
  mkdirSync(finalDir, { recursive: true });

  // Copy PDFs to final locations
  const finalPrintPath = resolve(finalDir, `${book.slug}-${book.current_version}-print.pdf`);
  const finalDigitalPath = resolve(finalDir, `${book.slug}-${book.current_version}-digital.pdf`);

  copyFileSync(draftPdfPath, finalPrintPath);
  copyFileSync(digitalPdfPath, finalDigitalPath);

  // Register final artifacts
  const resultSaver = new W2ResultSaver(db, runId!);
  resultSaver.savePrintPdf(finalPrintPath);
  resultSaver.saveDigitalPdf(finalDigitalPath);

  // Update state.json to mark as completed
  const stateJsonPath = resolve(projectRoot, `data/w2-artifacts/${runId}/state.json`);
  if (existsSync(stateJsonPath)) {
    const stateContent = readFileSync(stateJsonPath, 'utf-8');
    const state: W2State = JSON.parse(stateContent);
    state.current_step = 'completed';
    state.completed_steps.push('finalize');
    state.last_updated = new Date().toISOString();
    writeFileSync(stateJsonPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  console.log(
    CLIFormatter.format({
      title: 'W2 WORKFLOW COMPLETED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Book', value: `${book.title} (${book.slug})` },
        { key: 'Version', value: book.current_version },
        { key: 'Print PDF', value: finalPrintPath },
        { key: 'Digital PDF', value: finalDigitalPath },
      ]),
      status: [
        { label: 'PDFs copied to final location', success: true },
        { label: 'Artifacts registered', success: true },
        { label: 'Workflow marked as completed', success: true },
      ],
      nextStep: [
        'Workflow complete! Final PDFs available at:',
        `  Print:   ${finalPrintPath}`,
        `  Digital: ${finalDigitalPath}`,
      ],
    })
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
