/**
 * workflow:status CLI Command
 *
 * Shows detailed status of a workflow run.
 *
 * Usage:
 *   pnpm workflow:status --run <id>
 *   pnpm workflow:status <id>
 */

import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { WorkflowStateMachine } from '../workflows/state-machine.js';
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
        '  pnpm workflow:status --run <id>',
        '  pnpm workflow:status <id>',
        '',
        'List all workflows:',
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

// Create repositories
const workflowRepo = new WorkflowRepository(db);
const bookRepo = new BookRepository(db);

try {
  // Get workflow by ID
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

  // Get book info
  const book = bookRepo.getById(workflow.book_id);
  const bookDisplay = book ? `${book.title} (${book.slug})` : workflow.book_id;

  // Get valid transitions
  const stateMachine = new WorkflowStateMachine(workflow.status);
  const validTransitions = stateMachine.getValidTransitions();

  // Format workflow details as table
  const tableRows = [
    { key: 'Run ID', value: workflow.id },
    { key: 'Type', value: workflow.workflow_type },
    { key: 'Book', value: bookDisplay },
    { key: 'Status', value: workflow.status },
    { key: 'Current Agent', value: workflow.current_agent ?? '(none)' },
    { key: 'Input Version', value: workflow.input_version_id ?? '(none)' },
    { key: 'Output Version', value: workflow.output_version_id ?? '(none)' },
    { key: 'Session ID', value: workflow.session_id ?? '(none)' },
    { key: 'Plan ID', value: workflow.plan_id ?? '(none)' },
    { key: 'Created', value: workflow.created_at },
    { key: 'Updated', value: workflow.updated_at },
  ];

  // Determine status indicator
  const getStatusIndicator = () => {
    switch (workflow.status) {
      case 'completed':
        return { label: 'Completed', success: true };
      case 'failed':
        return { label: 'Failed', success: false };
      case 'running':
        return { label: 'Running', pending: true };
      case 'paused':
        return { label: 'Paused', pending: true };
      case 'pending':
      default:
        return { label: 'Pending', pending: true };
    }
  };

  // Build next steps based on current state
  const nextSteps: string[] = [];
  if (validTransitions.length > 0) {
    nextSteps.push('Available actions:');
    if (validTransitions.includes('running') && workflow.status === 'pending') {
      nextSteps.push('  (State will transition to running when agent starts)');
    }
    if (validTransitions.includes('paused')) {
      nextSteps.push(`  pnpm workflow:pause --run ${workflow.id}`);
    }
    if (validTransitions.includes('running') && workflow.status === 'paused') {
      nextSteps.push(`  pnpm workflow:resume --run ${workflow.id}`);
    }
    if (validTransitions.includes('failed')) {
      nextSteps.push(`  pnpm workflow:cancel --run ${workflow.id}`);
    }
  } else {
    nextSteps.push('Workflow is in terminal state.');
    nextSteps.push('Start a new workflow:');
    nextSteps.push('  pnpm workflow:start --type <type> --book <slug>');
  }

  console.log(
    CLIFormatter.format({
      title: `WORKFLOW STATUS: ${workflow.id}`,
      content: CLIFormatter.table(tableRows),
      status: [
        getStatusIndicator(),
        ...(validTransitions.length > 0
          ? [{ label: `Can transition to: ${validTransitions.join(', ')}`, pending: true }]
          : []),
      ],
      nextStep: nextSteps,
    })
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Failed to get workflow status: ${errorMessage}`,
      status: [{ label: 'Status retrieval failed', success: false }],
    })
  );
  process.exit(1);
} finally {
  db.close();
}
