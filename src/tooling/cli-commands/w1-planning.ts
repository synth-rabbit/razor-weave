/**
 * w1:planning CLI Command
 *
 * Orchestrates the planning phase of the W1 editing workflow.
 * Generates a prompt for an AI agent to create an improvement plan from review analysis.
 *
 * Usage:
 *   Mode 1 - Generate prompt:
 *     pnpm w1:planning --book <book-id> --analysis <path-to-analysis>
 *
 *   Mode 2 - Save result:
 *     pnpm w1:planning --save --run <run-id> --plan <path-to-plan.json>
 */

import { parseArgs } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import { generatePlanningPrompt } from '../w1/prompt-generator.js';
import { W1PromptWriter } from '../w1/prompt-writer.js';
import { W1ResultSaver } from '../w1/result-saver.js';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    book: { type: 'string', short: 'b' },
    analysis: { type: 'string', short: 'a' },
    save: { type: 'boolean', default: false },
    run: { type: 'string', short: 'r' },
    plan: { type: 'string', short: 'p' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

// Show help
if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W1 PLANNING - HELP',
      content: `Generate planning prompts or save planning results for W1 workflow.

Mode 1 - Generate prompt:
  pnpm w1:planning --book <book-id> --analysis <path>

  Creates a workflow run and generates a prompt file for AI-assisted planning.

Mode 2 - Save result:
  pnpm w1:planning --save --run <run-id> --plan <path>

  Saves an AI-generated plan to the workflow.`,
      status: [],
      nextStep: [
        'Example:',
        '  pnpm w1:planning --book my-book --analysis data/reviews/analysis.json',
        '  pnpm w1:planning --save --run run_123 --plan data/w1-artifacts/run_123/plan.json',
      ],
    })
  );
  process.exit(0);
}

// Determine mode
const isSaveMode = values.save === true;

async function main(): Promise<void> {
  // Initialize database
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
  const bookIdOrSlug = values.book;
  const analysisPath = values.analysis;

  // Validate required arguments
  if (!bookIdOrSlug) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --book <book-id>',
        status: [{ label: 'Book ID is required', success: false }],
        nextStep: [
          'Usage:',
          '  pnpm w1:planning --book <book-id> --analysis <path>',
          '',
          'List available books:',
          '  pnpm book:list',
        ],
      })
    );
    process.exit(1);
  }

  if (!analysisPath) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --analysis <path-to-analysis>',
        status: [{ label: 'Analysis path is required', success: false }],
        nextStep: [
          'Usage:',
          '  pnpm w1:planning --book <book-id> --analysis <path>',
          '',
          'Run analysis first:',
          '  pnpm review:analyze --book <book-id>',
        ],
      })
    );
    process.exit(1);
  }

  // Resolve analysis path
  const resolvedAnalysisPath = resolve(projectRoot, analysisPath);

  // Verify analysis file exists
  if (!existsSync(resolvedAnalysisPath)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Analysis file not found: ${resolvedAnalysisPath}`,
        status: [{ label: 'Analysis file does not exist', success: false }],
        nextStep: [
          'Run analysis first:',
          '  pnpm review:analyze --book <book-id>',
        ],
      })
    );
    process.exit(1);
  }

  // Print header
  console.log(CLIFormatter.header('W1 PLANNING PHASE'));
  console.log(`Book: ${bookIdOrSlug}`);
  console.log(`Analysis: ${resolvedAnalysisPath}`);
  console.log('');

  // Create repositories
  const bookRepo = new BookRepository(db);
  const workflowRepo = new WorkflowRepository(db);

  // 1. Verify book exists and get book ID
  console.log('Verifying book...');
  let book = bookRepo.getBySlug(bookIdOrSlug);
  if (!book) {
    // Try by ID
    book = bookRepo.getById(bookIdOrSlug);
  }
  if (!book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Book not found: ${bookIdOrSlug}`,
        status: [{ label: 'Book does not exist', success: false }],
        nextStep: [
          'List available books:',
          '  pnpm book:list',
        ],
      })
    );
    process.exit(1);
  }
  console.log(`  OK Book verified: ${book.title} (${book.slug})`);

  // 2. Create workflow run
  console.log('Creating workflow run...');
  const workflowRun = workflowRepo.create({
    workflow_type: 'w1_editing',
    book_id: book.id,
  });
  console.log(`  OK Workflow run created: ${workflowRun.id}`);

  // 3. Generate prompt
  console.log('Generating planning prompt...');
  const prompt = generatePlanningPrompt(db, {
    runId: workflowRun.id,
    bookId: book.id,
    bookName: book.title,
    analysisPath: resolvedAnalysisPath,
    styleGuidesDir: resolve(projectRoot, 'docs/style_guides'),
  });
  console.log(`  OK Prompt generated`);

  // 4. Write prompt to file
  console.log('Writing prompt file...');
  const promptWriter = new W1PromptWriter({ runId: workflowRun.id });
  const promptPath = promptWriter.writePlanningPrompt(prompt);
  console.log(`  OK Prompt written: ${promptPath}`);

  // 5. Update workflow status
  workflowRepo.updateStatus(workflowRun.id, 'running');
  console.log(`  OK Workflow status updated to 'running'`);

  // Print success output with next steps
  const tableRows = [
    { key: 'Workflow Run', value: workflowRun.id },
    { key: 'Book', value: `${book.title} (${book.slug})` },
    { key: 'Prompt File', value: promptPath },
  ];

  console.log('');
  console.log(
    CLIFormatter.format({
      title: 'PLANNING PROMPT GENERATED',
      content: CLIFormatter.table(tableRows),
      status: [
        { label: 'Workflow run created', success: true },
        { label: 'Planning prompt generated', success: true },
        { label: 'Prompt file written', success: true },
      ],
      nextStep: [
        'Next steps:',
        '',
        '1. Copy the prompt and give it to an AI assistant:',
        `   cat ${promptPath} | pbcopy`,
        '',
        '2. After the AI creates the plan, save it:',
        `   pnpm w1:planning --save --run=${workflowRun.id} --plan=data/w1-artifacts/${workflowRun.id}/plan.json`,
      ],
    })
  );
}

async function runSaveMode(db: Database.Database): Promise<void> {
  const runId = values.run;
  const planPath = values.plan;

  // Validate required arguments
  if (!runId) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --run <run-id>',
        status: [{ label: 'Run ID is required for save mode', success: false }],
        nextStep: [
          'Usage:',
          '  pnpm w1:planning --save --run <run-id> --plan <path>',
        ],
      })
    );
    process.exit(1);
  }

  if (!planPath) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --plan <path-to-plan.json>',
        status: [{ label: 'Plan path is required for save mode', success: false }],
        nextStep: [
          'Usage:',
          '  pnpm w1:planning --save --run <run-id> --plan <path>',
        ],
      })
    );
    process.exit(1);
  }

  // Resolve plan path
  const resolvedPlanPath = resolve(projectRoot, planPath);

  // Verify plan file exists
  if (!existsSync(resolvedPlanPath)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Plan file not found: ${resolvedPlanPath}`,
        status: [{ label: 'Plan file does not exist', success: false }],
        nextStep: [
          'Create the plan JSON file first, then run:',
          `  pnpm w1:planning --save --run=${runId} --plan=<path>`,
        ],
      })
    );
    process.exit(1);
  }

  // Print header
  console.log(CLIFormatter.header('W1 PLANNING - SAVE RESULT'));
  console.log(`Run ID: ${runId}`);
  console.log(`Plan: ${resolvedPlanPath}`);
  console.log('');

  // Verify workflow run exists
  const workflowRepo = new WorkflowRepository(db);
  const workflowRun = workflowRepo.getById(runId);
  if (!workflowRun) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Workflow run not found: ${runId}`,
        status: [{ label: 'Workflow run does not exist', success: false }],
        nextStep: [
          'Check your run ID or create a new workflow:',
          '  pnpm w1:planning --book <book-id> --analysis <path>',
        ],
      })
    );
    process.exit(1);
  }

  // Load and validate plan
  console.log('Loading plan...');
  let plan: Record<string, unknown>;
  try {
    const planContent = readFileSync(resolvedPlanPath, 'utf-8');
    plan = JSON.parse(planContent);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Failed to parse plan JSON: ${errorMessage}`,
        status: [{ label: 'Plan JSON is invalid', success: false }],
        nextStep: [
          'Ensure the plan file is valid JSON with required fields:',
          '  - plan_id: string',
          '  - summary: string',
          '  - target_issues: array',
          '  - chapter_modifications: array',
        ],
      })
    );
    process.exit(1);
  }
  console.log(`  OK Plan loaded: ${plan.plan_id || 'unknown'}`);

  // Save result
  console.log('Saving planning result...');
  const resultSaver = new W1ResultSaver(db, runId);
  resultSaver.savePlanningResult({
    plan,
    outputPath: resolvedPlanPath,
  });
  console.log(`  OK Plan saved and artifact registered`);

  // Get book info for next step instructions
  const bookRepo = new BookRepository(db);
  const book = bookRepo.getById(workflowRun.book_id);
  const bookSlug = book?.slug || workflowRun.book_id;

  // Print success output
  const tableRows = [
    { key: 'Workflow Run', value: runId },
    { key: 'Plan ID', value: String(plan.plan_id || 'unknown') },
    { key: 'Plan Path', value: resolvedPlanPath },
    { key: 'Target Issues', value: String(Array.isArray(plan.target_issues) ? plan.target_issues.length : 0) },
    { key: 'Chapter Modifications', value: String(Array.isArray(plan.chapter_modifications) ? plan.chapter_modifications.length : 0) },
  ];

  console.log('');
  console.log(
    CLIFormatter.format({
      title: 'PLANNING RESULT SAVED',
      content: CLIFormatter.table(tableRows),
      status: [
        { label: 'Plan loaded', success: true },
        { label: 'Artifact registered', success: true },
      ],
      nextStep: [
        'Next step:',
        `  pnpm w1:content-modify --book ${bookSlug} --plan ${resolvedPlanPath} --iteration 1`,
      ],
    })
  );
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Planning phase failed: ${errorMessage}`,
      status: [{ label: 'Planning phase failed', success: false }],
      nextStep: [
        'Check the error message above for details.',
        'Ensure all required files exist and are valid.',
      ],
    })
  );
  process.exit(1);
});
