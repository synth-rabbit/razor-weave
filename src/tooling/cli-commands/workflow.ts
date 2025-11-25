/**
 * workflow CLI Command
 *
 * Orchestrates workflow execution using the workflow engine.
 *
 * Usage:
 *   pnpm workflow:start --type w1_editing --book <slug>  # Start new workflow
 *   pnpm workflow:resume --run <id>                       # Resume paused workflow
 *   pnpm workflow:status --run <id>                       # Show workflow status
 *   pnpm workflow:list [--book <slug>] [--status <status>]  # List workflows
 *   pnpm workflow:gate --run <id> --decision <decision>   # Handle human gate
 */

import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRunner, type WorkflowState } from '../workflows/workflow-runner.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createConditionDatabase } from '../workflows/condition-database.js';
import { w1EditingWorkflow } from '../workflows/w1-workflow.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import type { WorkflowDefinition } from '../workflows/engine-types.js';

// Get project root
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
    type: { type: 'string', short: 't' },
    book: { type: 'string', short: 'b' },
    run: { type: 'string', short: 'r' },
    status: { type: 'string', short: 's' },
    decision: { type: 'string', short: 'd' },
    input: { type: 'string', short: 'i' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

const command = positionals[0];
const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

// Show help
if (values.help || !command) {
  console.log(
    CLIFormatter.format({
      title: 'WORKFLOW ENGINE',
      content: 'Orchestrate workflow execution with checkpointing and human gates.',
      nextStep: [
        'Commands:',
        '  start   - Start a new workflow',
        '  resume  - Resume a paused workflow',
        '  status  - Show workflow status',
        '  list    - List workflow runs',
        '  gate    - Handle human gate decision',
        '',
        'Usage:',
        '  pnpm workflow:start --type w1_editing --book <slug>',
        '  pnpm workflow:resume --run <id>',
        '  pnpm workflow:status --run <id>',
        '  pnpm workflow:list [--book <slug>] [--status <status>]',
        '  pnpm workflow:gate --run <id> --decision <decision> [--input <text>]',
        '',
        'Options:',
        '  --type, -t      Workflow type (e.g., w1_editing)',
        '  --book, -b      Book slug',
        '  --run, -r       Workflow run ID',
        '  --status, -s    Filter by status (pending, running, paused, completed, failed)',
        '  --decision, -d  Gate decision (Approve, Reject, Request Changes, Full Review)',
        '  --input, -i     Additional input for gate decision',
      ],
    })
  );
  process.exit(0);
}

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
createTables(db);

try {
  runMigrations(db);
} catch (e) {
  // Migrations may already be applied
}

// Build workflow registry
const workflows = new Map<string, WorkflowDefinition>([['w1_editing', w1EditingWorkflow]]);

// Create runner
const runner = new WorkflowRunner({ db, workflows });
const workflowRepo = new WorkflowRepository(db);
const bookRepo = new BookRepository(db);

/**
 * Format workflow state for display
 */
function formatState(state: WorkflowState): void {
  const statusEmoji = {
    pending: '⏳',
    running: '🔄',
    paused: '⏸️',
    completed: '✅',
    failed: '❌',
    awaiting_human: '👤',
  };

  console.log(
    CLIFormatter.format({
      title: 'WORKFLOW STATUS',
      content: `Run ID: ${state.runId}`,
      status: [
        { label: 'Status', success: state.status === 'completed' },
        { label: state.status, success: state.status !== 'failed' },
      ],
      nextStep: [
        `Current Step: ${state.currentStep || 'none'}`,
        `Completed Steps: ${state.resumeContext.completedSteps.join(', ') || 'none'}`,
        ...(state.humanGate
          ? [
              '',
              '--- Human Gate ---',
              `Prompt: ${state.humanGate.prompt}`,
              'Options:',
              ...state.humanGate.options.map((o) => `  - ${o.label}`),
            ]
          : []),
        ...(state.error ? ['', `Error: ${state.error}`] : []),
      ],
    })
  );
}

/**
 * Handle start command
 */
async function handleStart(): Promise<void> {
  if (!values.type) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --type',
        status: [{ label: 'Workflow type is required', success: false }],
      })
    );
    process.exit(1);
  }

  if (!values.book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --book',
        status: [{ label: 'Book slug is required', success: false }],
      })
    );
    process.exit(1);
  }

  const book = bookRepo.getBySlug(values.book);
  if (!book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Book not found: ${values.book}`,
        status: [{ label: 'Invalid book slug', success: false }],
      })
    );
    process.exit(1);
  }

  console.log(
    CLIFormatter.format({
      title: 'STARTING WORKFLOW',
      content: `Type: ${values.type}, Book: ${book.title}`,
    })
  );

  const state = await runner.start(values.type, book.id);
  formatState(state);

  console.log(
    CLIFormatter.format({
      title: 'NEXT STEP',
      content: `Run the step command: ${state.currentStep}`,
      nextStep: [
        'To process step result:',
        `  pnpm workflow:result --run ${state.runId} --success --result <json>`,
        '',
        'To check status:',
        `  pnpm workflow:status --run ${state.runId}`,
      ],
    })
  );
}

/**
 * Handle resume command
 */
async function handleResume(): Promise<void> {
  if (!values.run) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --run',
        status: [{ label: 'Workflow run ID is required', success: false }],
      })
    );
    process.exit(1);
  }

  console.log(
    CLIFormatter.format({
      title: 'RESUMING WORKFLOW',
      content: `Run ID: ${values.run}`,
    })
  );

  const state = await runner.resume(values.run);
  formatState(state);
}

/**
 * Handle status command
 */
function handleStatus(): void {
  if (!values.run) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --run',
        status: [{ label: 'Workflow run ID is required', success: false }],
      })
    );
    process.exit(1);
  }

  const state = runner.getState(values.run);
  if (!state) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Workflow run not found: ${values.run}`,
        status: [{ label: 'Invalid run ID', success: false }],
      })
    );
    process.exit(1);
  }

  formatState(state);
}

/**
 * Handle list command
 */
function handleList(): void {
  const filters: { bookId?: string; status?: string } = {};

  if (values.book) {
    const book = bookRepo.getBySlug(values.book);
    if (!book) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Book not found: ${values.book}`,
          status: [{ label: 'Invalid book slug', success: false }],
        })
      );
      process.exit(1);
    }
    filters.bookId = book.id;
  }

  if (values.status) {
    filters.status = values.status;
  }

  const runs = workflowRepo.list(filters as Parameters<typeof workflowRepo.list>[0]);

  if (runs.length === 0) {
    console.log(
      CLIFormatter.format({
        title: 'WORKFLOW RUNS',
        content: 'No workflow runs found.',
      })
    );
    return;
  }

  console.log(
    CLIFormatter.format({
      title: 'WORKFLOW RUNS',
      content: `Found ${runs.length} workflow run(s)`,
      nextStep: runs.map(
        (r) =>
          `[${r.status.padEnd(10)}] ${r.id} - ${r.workflow_type} (${new Date(r.created_at).toLocaleDateString()})`
      ),
    })
  );
}

/**
 * Handle gate command (human gate decision)
 */
async function handleGate(): Promise<void> {
  if (!values.run) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --run',
        status: [{ label: 'Workflow run ID is required', success: false }],
      })
    );
    process.exit(1);
  }

  if (!values.decision) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --decision',
        status: [{ label: 'Gate decision is required', success: false }],
      })
    );
    process.exit(1);
  }

  console.log(
    CLIFormatter.format({
      title: 'PROCESSING GATE DECISION',
      content: `Run: ${values.run}, Decision: ${values.decision}`,
    })
  );

  const state = await runner.handleGateDecision(values.run, values.decision, values.input);
  formatState(state);
}

// Execute command
async function main(): Promise<void> {
  try {
    switch (command) {
      case 'start':
        await handleStart();
        break;
      case 'resume':
        await handleResume();
        break;
      case 'status':
        handleStatus();
        break;
      case 'list':
        handleList();
        break;
      case 'gate':
        await handleGate();
        break;
      default:
        console.error(
          CLIFormatter.format({
            title: 'ERROR',
            content: `Unknown command: ${command}`,
            status: [{ label: 'Use --help to see available commands', success: false }],
          })
        );
        process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: message,
        status: [{ label: 'Command failed', success: false }],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
