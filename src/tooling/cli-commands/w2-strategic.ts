/**
 * w2:strategic CLI Command
 *
 * Creates or resumes a W2 PDF workflow for publication-quality PDFs.
 *
 * Usage:
 *   pnpm w2:strategic --book <slug>         # Create new W2 workflow
 *   pnpm w2:strategic --resume <plan-id>    # Resume existing workflow
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { generateStrategicPrompt } from '../w2/prompt-generator.js';
import { createTables, runMigrations } from '@razorweave/database';
import type { W2State } from '../w2/types.js';

// Get project root
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Generate unique plan ID
function generatePlanId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `w2plan_${suffix}`;
}

// Parse arguments
const { values } = parseArgs({
  options: {
    book: { type: 'string', short: 'b' },
    resume: { type: 'string', short: 'r' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

// Show help
if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W2 STRATEGIC WORKFLOW',
      content: 'Create or resume a W2 PDF workflow for publication-quality PDFs.',
      nextStep: [
        'Usage:',
        '  pnpm w2:strategic --book <slug>         # Create new W2 workflow',
        '  pnpm w2:strategic --resume <plan-id>    # Resume existing workflow',
        '',
        'Options:',
        '  --book, -b    Book slug (required for new workflows)',
        '  --resume, -r  Resume existing workflow by plan ID',
        '  --db          Database path (default: data/project.db)',
        '  --help, -h    Show this help',
        '',
        'Workflow Steps:',
        '  1. PM Review       - Identify priority areas for layout attention',
        '  2. Layout          - Create structural layout plan',
        '  3. Design          - Create visual design plan + image prompts',
        '  4. Create PDF      - Generate print PDF',
        '  5. Editor Review   - Review PDF presentation quality',
        '  6. Human Gate      - Manual review and approval',
        '  7. Derive Digital  - Create digital-optimized PDF',
        '  8. Finalize        - Register final artifacts',
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
  runMigrations(dbPath);
} catch {
  // Migrations might already be applied
}

const bookRepo = new BookRepository(db);
const workflowRepo = new WorkflowRepository(db);

// Handle --resume
if (values.resume) {
  const planId = values.resume;
  const artifactsDir = resolve(projectRoot, `data/w2-strategic/${planId}`);
  const strategyPath = join(artifactsDir, 'strategy.json');
  const statePath = join(artifactsDir, 'state.json');

  if (!existsSync(strategyPath) || !existsSync(statePath)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `W2 workflow not found: ${planId}`,
        status: [{ label: 'Workflow not found', success: false }],
        nextStep: [
          'Create a new workflow:',
          '  pnpm w2:strategic --book <slug>',
        ],
      })
    );
    db.close();
    process.exit(1);
  }

  // Load strategy to get workflow run ID and book info
  const strategy = JSON.parse(require('fs').readFileSync(strategyPath, 'utf-8'));
  const state: W2State = JSON.parse(require('fs').readFileSync(statePath, 'utf-8'));

  const book = bookRepo.getBySlug(strategy.bookSlug);
  if (!book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Book not found: ${strategy.bookSlug}`,
        status: [{ label: 'Book not found', success: false }],
      })
    );
    db.close();
    process.exit(1);
  }

  const htmlPath = resolve(projectRoot, `data/html/print-design/${book.slug}.html`);
  const releaseNotesPath = resolve(projectRoot, `data/w1-artifacts/${strategy.workflowRunId}/release-notes.json`);

  // Generate resume prompt
  const prompt = generateStrategicPrompt({
    planId,
    workflowRunId: strategy.workflowRunId,
    bookSlug: book.slug,
    bookTitle: book.title,
    artifactsDir,
    htmlPath,
    releaseNotesPath,
    isResume: true,
  });

  console.log(
    CLIFormatter.format({
      title: 'W2 WORKFLOW RESUMED',
      content: [
        `Plan ID: ${planId}`,
        `Book: ${book.title} (${book.slug})`,
        `Current Step: ${state.current_step}`,
        `Completed Steps: ${state.completed_steps.length}`,
        `Iteration: ${state.iteration_count}`,
        `Editor Cycles: ${state.editor_cycles}`,
      ].join('\n'),
      status: [
        { label: 'Workflow loaded', success: true },
        { label: `Step: ${state.current_step}`, pending: true },
      ],
    })
  );

  console.log('\n' + '─'.repeat(60) + '\n');
  console.log('PROMPT TO EXECUTE:\n');
  console.log(prompt);

  db.close();
  process.exit(0);
}

// Create new workflow - requires --book
if (!values.book) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --book <slug>',
      status: [{ label: 'Book slug required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w2:strategic --book <slug>',
      ],
    })
  );
  db.close();
  process.exit(1);
}

// Verify book exists
const book = bookRepo.getBySlug(values.book);
if (!book) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Book not found: ${values.book}`,
      status: [{ label: 'Book not found', success: false }],
      nextStep: ['List available books:', '  pnpm book:list'],
    })
  );
  db.close();
  process.exit(1);
}

// Generate plan ID
const planId = generatePlanId();

// Create workflow run in database
const workflowRun = workflowRepo.create({
  workflow_type: 'w2_pdf',
  book_id: book.id,
});

// Determine paths
const htmlPath = resolve(projectRoot, `data/html/print-design/${book.slug}.html`);
const releaseNotesPath = resolve(projectRoot, `data/w1-artifacts/${workflowRun.id}/release-notes.json`);
const artifactsDir = resolve(projectRoot, `data/w2-strategic/${planId}`);

// Verify HTML exists
if (!existsSync(htmlPath)) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Print HTML not found: ${htmlPath}`,
      status: [{ label: 'HTML not found', success: false }],
      nextStep: [
        'Generate HTML first:',
        '  pnpm book:generate-html --book <slug>',
      ],
    })
  );
  db.close();
  process.exit(1);
}

// Create artifacts directory
mkdirSync(artifactsDir, { recursive: true });

// Create initial state
const initialState: W2State = {
  current_step: 'pm-review',
  completed_steps: [],
  iteration_count: 1,
  editor_cycles: 0,
  last_updated: new Date().toISOString(),
  human_feedback: null,
  assets_path: null,
};

// Create strategy context
const strategy = {
  planId,
  workflowRunId: workflowRun.id,
  bookSlug: book.slug,
  bookTitle: book.title,
  htmlPath,
  releaseNotesPath,
  artifactsDir,
};

// Save strategy.json
writeFileSync(join(artifactsDir, 'strategy.json'), JSON.stringify(strategy, null, 2));

// Save state.json
writeFileSync(join(artifactsDir, 'state.json'), JSON.stringify(initialState, null, 2));

// Generate strategic prompt
const prompt = generateStrategicPrompt({
  planId,
  workflowRunId: workflowRun.id,
  bookSlug: book.slug,
  bookTitle: book.title,
  artifactsDir,
  htmlPath,
  releaseNotesPath,
  isResume: false,
});

console.log(
  CLIFormatter.format({
    title: 'W2 WORKFLOW CREATED',
    content: [
      `Plan ID: ${planId}`,
      `Workflow Run ID: ${workflowRun.id}`,
      `Book: ${book.title} (${book.slug})`,
      `Artifacts: ${artifactsDir}`,
      '',
      'Workflow Steps:',
      '  1. PM Review - Identify priority areas',
      '  2. Layout - Create layout plan',
      '  3. Design - Create design plan + image prompts',
      '  4. Create PDF - Generate print PDF',
      '  5. Editor Review - Review presentation quality',
      '  6. Human Gate - Manual review/approval',
      '  7. Derive Digital - Create digital PDF',
      '  8. Finalize - Register artifacts',
    ].join('\n'),
    status: [
      { label: 'Workflow created', success: true },
      { label: 'Artifacts directory created', success: true },
      { label: 'Ready to execute', pending: true },
    ],
    nextStep: [
      'To resume this workflow later:',
      `  pnpm w2:strategic --resume ${planId}`,
    ],
  })
);

console.log('\n' + '─'.repeat(60) + '\n');
console.log('PROMPT TO EXECUTE:\n');
console.log(prompt);

db.close();
