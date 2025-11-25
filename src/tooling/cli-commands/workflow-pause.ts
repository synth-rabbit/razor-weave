/**
 * workflow:pause CLI Command
 *
 * Pauses a running workflow.
 *
 * Usage:
 *   pnpm workflow:pause --run <id>
 *   pnpm workflow:pause <id>
 */

import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { InvalidTransitionError } from '../workflows/state-machine.js';
import { createTables } from '@razorweave/database';
import { runMigrations } from '@razorweave/database';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Parse arguments
const { values, positionals } = parseArgs({
  options: {
    run: { type: 'string', short: 'r' },
    db: { type: 'string', default: 'data/project.db' },
  },
  allowPositionals: true,
});

// Get run ID from --run argument or positional argument
const runId = values.run ?? positionals[0];
const dbPath = resolve(getProjectRoot(), values.db!);

// Validate run ID is provided
if (!runId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --run <id> or positional id',
      status: [{ label: 'Run ID is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm workflow:pause --run <id>',
        '  pnpm workflow:pause <id>',
        '',
        'List running workflows:',
        '  pnpm workflow:list --status running',
      ],
    })
  );
  process.exit(1);
}

// Initialize database and run migrations
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

// Create repository
const workflowRepo = new WorkflowRepository(db);

try {
  // Get current workflow to check state
  const workflow = workflowRepo.getById(runId);

  if (!workflow) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Workflow run not found: ${runId}`,
        status: [{ label: 'Workflow does not exist', success: false }],
        nextStep: [
          'List all workflows:',
          '  pnpm workflow:list',
        ],
      })
    );
    process.exit(1);
  }

  // Check if already paused
  if (workflow.status === 'paused') {
    console.log(
      CLIFormatter.format({
        title: 'WORKFLOW ALREADY PAUSED',
        content: `Workflow ${runId} is already paused.`,
        status: [{ label: 'No action needed', pending: true }],
        nextStep: [
          'Resume the workflow:',
          `  pnpm workflow:resume --run ${runId}`,
        ],
      })
    );
    process.exit(0);
  }

  // Update status to paused
  const updated = workflowRepo.updateStatus(runId, 'paused');

  console.log(
    CLIFormatter.format({
      title: 'WORKFLOW PAUSED',
      content: [
        `Run ID: ${updated.id}`,
        `Previous Status: ${workflow.status}`,
        `New Status: ${updated.status}`,
      ].join('\n'),
      status: [
        { label: 'Workflow paused successfully', success: true },
      ],
      nextStep: [
        'Resume the workflow:',
        `  pnpm workflow:resume --run ${runId}`,
        '',
        'Cancel the workflow:',
        `  pnpm workflow:cancel --run ${runId}`,
      ],
    })
  );
} catch (error) {
  if (error instanceof InvalidTransitionError) {
    const workflow = workflowRepo.getById(runId);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Cannot pause workflow: ${error.message}`,
        status: [
          { label: 'Invalid state transition', success: false },
          { label: `Current status: ${workflow?.status ?? 'unknown'}`, pending: true },
        ],
        nextStep: [
          'Note: Only running workflows can be paused.',
          '',
          'Check workflow status:',
          `  pnpm workflow:status --run ${runId}`,
        ],
      })
    );
    process.exit(1);
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Failed to pause workflow: ${errorMessage}`,
      status: [{ label: 'Pause failed', success: false }],
    })
  );
  process.exit(1);
} finally {
  db.close();
}
