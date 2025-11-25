/**
 * workflow:cancel CLI Command
 *
 * Cancels a workflow run (transitions to failed state).
 *
 * Usage:
 *   pnpm workflow:cancel --run <id> [--reason <reason>]
 *   pnpm workflow:cancel <id>
 */

import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { InvalidTransitionError, WorkflowStateMachine } from '../workflows/state-machine.js';
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
    reason: { type: 'string' },
    db: { type: 'string', default: 'data/project.db' },
  },
  allowPositionals: true,
});

// Get run ID from --run argument or positional argument
const runId = values.run ?? positionals[0];
const reason = values.reason ?? 'Cancelled by user';
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
        '  pnpm workflow:cancel --run <id> [--reason <reason>]',
        '  pnpm workflow:cancel <id>',
        '',
        'List active workflows:',
        '  pnpm workflow:list',
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

  // Check if already in terminal state
  const stateMachine = new WorkflowStateMachine(workflow.status);
  if (stateMachine.isTerminal()) {
    console.log(
      CLIFormatter.format({
        title: 'WORKFLOW ALREADY TERMINATED',
        content: `Workflow ${runId} is already in terminal state: ${workflow.status}`,
        status: [{ label: 'No action needed', pending: true }],
        nextStep: [
          'Start a new workflow:',
          '  pnpm workflow:start --type <type> --book <slug>',
        ],
      })
    );
    process.exit(0);
  }

  // Update status to failed
  const updated = workflowRepo.updateStatus(runId, 'failed');

  console.log(
    CLIFormatter.format({
      title: 'WORKFLOW CANCELLED',
      content: [
        `Run ID: ${updated.id}`,
        `Previous Status: ${workflow.status}`,
        `New Status: ${updated.status}`,
        `Reason: ${reason}`,
      ].join('\n'),
      status: [
        { label: 'Workflow cancelled', success: true },
        { label: reason, pending: true },
      ],
      nextStep: [
        'Start a new workflow:',
        '  pnpm workflow:start --type <type> --book <slug>',
        '',
        'View workflow history:',
        '  pnpm workflow:list',
      ],
    })
  );
} catch (error) {
  if (error instanceof InvalidTransitionError) {
    const workflow = workflowRepo.getById(runId);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Cannot cancel workflow: ${error.message}`,
        status: [
          { label: 'Invalid state transition', success: false },
          { label: `Current status: ${workflow?.status ?? 'unknown'}`, pending: true },
        ],
        nextStep: [
          'Note: Only running or paused workflows can be cancelled.',
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
      content: `Failed to cancel workflow: ${errorMessage}`,
      status: [{ label: 'Cancel failed', success: false }],
    })
  );
  process.exit(1);
} finally {
  db.close();
}
