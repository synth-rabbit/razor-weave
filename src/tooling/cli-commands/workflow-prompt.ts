/**
 * workflow-prompt CLI Command
 *
 * Generates a prompt for Claude Code to execute a workflow session.
 *
 * Usage:
 *   pnpm wf:prompt --type w1_editing --book <slug>              # Generate prompt for workflow
 *   pnpm wf:prompt --type w1_editing --book <slug> --with-review  # Include review step
 */

import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { createTables, runMigrations } from '@razorweave/database';

// Get project root
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Parse arguments
const { values } = parseArgs({
  options: {
    type: { type: 'string', short: 't' },
    book: { type: 'string', short: 'b' },
    'with-review': { type: 'boolean' },
    plus: { type: 'string', short: 'p' }, // Number of generated personas to add
    focus: { type: 'string', short: 'f' }, // Focus category for sampling
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
      title: 'WORKFLOW PROMPT GENERATOR',
      content: 'Generate a prompt for Claude Code to execute a workflow session.',
      nextStep: [
        'Usage:',
        '  pnpm wf:prompt --type w1_editing --book <slug>',
        '  pnpm wf:prompt --type w1_editing --book <slug> --with-review',
        '  pnpm wf:prompt --type w1_editing --book <slug> --with-review --plus=30',
        '',
        'Options:',
        '  --type, -t      Workflow type (e.g., w1_editing)',
        '  --book, -b      Book slug',
        '  --with-review   Include fresh review + analysis step',
        '  --plus, -p      Add N generated personas (default: 0, core only)',
        '  --focus, -f     Focus category for sampling (general, gm-content, combat, narrative, character-creation, quickstart)',
        '',
        'Examples:',
        '  # Core personas only (10 reviewers)',
        '  pnpm wf:prompt --type w1_editing --book core-rulebook --with-review',
        '',
        '  # Core + 30 generated (40 reviewers, weighted sampling)',
        '  pnpm wf:prompt --type w1_editing --book core-rulebook --with-review --plus=30',
        '',
        'Output:',
        '  Prints a prompt you can copy to a new Claude Code session.',
      ],
    })
  );
  process.exit(0);
}

// Validate required args
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

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
createTables(db);

try {
  runMigrations(db);
} catch {
  // Migrations may already be applied
}

const bookRepo = new BookRepository(db);
const book = bookRepo.getBySlug(values.book);
db.close();

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

// Generate prompt based on options
let prompt: string;

if (values['with-review']) {
  // Run review:book to create campaign and get campaign ID
  console.error('Creating review campaign...\n');

  // Build review command with optional flags
  let reviewCmd = `pnpm review:book ${values.book} --fresh`;
  if (values.plus) {
    reviewCmd += ` --plus=${values.plus}`;
  }
  if (values.focus) {
    reviewCmd += ` --focus=${values.focus}`;
  }

  let campaignId: string;
  try {
    const output = execSync(reviewCmd, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Extract campaign ID from output
    const match = output.match(/Campaign created: (campaign-[a-z0-9-]+)/);
    if (!match) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: 'Could not extract campaign ID from review:book output',
          status: [{ label: 'Failed to create campaign', success: false }],
        })
      );
      process.exit(1);
    }
    campaignId = match[1];
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string };
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Failed to create review campaign: ${err.stderr || err.stdout || String(error)}`,
        status: [{ label: 'Review setup failed', success: false }],
      })
    );
    process.exit(1);
  }

  // Get prompt file count
  const promptsDir = resolve(projectRoot, 'data/reviews/prompts', campaignId);
  let promptCount = 0;
  if (existsSync(promptsDir)) {
    promptCount = readdirSync(promptsDir).filter(f => f.endsWith('.txt')).length;
  }

  prompt = `Execute the W1 editing workflow for "${book.title}" with fresh reviews.

## Step 1: Execute Review Prompts

Read and execute the ${promptCount} review prompts in:
  data/reviews/prompts/${campaignId}/

For each prompt file:
1. Read the prompt
2. Execute as a reviewer agent (use Task tool with subagent)
3. Save the review output to: data/reviews/raw/${campaignId}/<persona-id>.json

Run reviewers in parallel batches of 5 for efficiency.

## Step 2: Analyze Reviews

After all reviews complete, run:
  pnpm review:analyze ${campaignId}

This generates the analysis needed for strategic planning.

## Step 3: Start Workflow

Run:
  pnpm wf:start --type ${values.type} --book ${values.book}

Note the workflow run ID from the output.

## Step 4: Execute Workflow Steps

For each step the workflow indicates:
1. Run the step command shown
2. Report the result:
   pnpm wf:result --run <run-id> --success --result '<json>'

   Or if it fails:
   pnpm wf:result --run <run-id> --failure --error "message"

3. Check the next step and continue

## Step 5: Human Gates

When you reach a human gate, present the options to me and wait for my decision.
Use: pnpm wf:gate --run <run-id> --decision "<choice>"

---
Campaign ID: ${campaignId}
Book: ${book.title} (${values.book})
Workflow: ${values.type}`;

} else {
  // No review - just workflow
  prompt = `Execute the W1 editing workflow for "${book.title}".

## Prerequisites

Ensure an analysis exists. If not, run reviews first:
  pnpm wf:prompt --type ${values.type} --book ${values.book} --with-review

## Step 1: Start Workflow

Run:
  pnpm wf:start --type ${values.type} --book ${values.book}

Note the workflow run ID from the output.

## Step 2: Execute Workflow Steps

For each step the workflow indicates:
1. Run the step command shown
2. Report the result:
   pnpm wf:result --run <run-id> --success --result '<json>'

   Or if it fails:
   pnpm wf:result --run <run-id> --failure --error "message"

3. Check the next step and continue

## Step 3: Human Gates

When you reach a human gate, present the options to me and wait for my decision.
Use: pnpm wf:gate --run <run-id> --decision "<choice>"

---
Book: ${book.title} (${values.book})
Workflow: ${values.type}`;
}

// Output the prompt
console.log(
  CLIFormatter.format({
    title: 'CLAUDE CODE SESSION PROMPT',
    content: 'Copy the text below to a new Claude Code session:',
  })
);

console.log('\n---BEGIN PROMPT---\n');
console.log(prompt);
console.log('\n---END PROMPT---\n');

console.log(
  CLIFormatter.format({
    title: 'NEXT STEP',
    content: 'Copy the prompt above to a new Claude Code session.',
  })
);
