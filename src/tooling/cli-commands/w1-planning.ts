/**
 * w1:planning CLI Command
 *
 * Orchestrates the planning phase of the W1 editing workflow.
 * Invokes the PM agent to generate an improvement plan from review analysis.
 *
 * Usage:
 *   pnpm w1:planning --book <book-id> --analysis <path-to-analysis> [--output <dir>]
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { PMInvoker } from '../agents/invoker-pm.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';

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
    output: { type: 'string', short: 'o', default: 'data/w1-artifacts' },
    db: { type: 'string', default: 'data/project.db' },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const analysisPath = values.analysis;
const outputDir = resolve(projectRoot, values.output!);
const dbPath = resolve(projectRoot, values.db!);

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
console.log(`Output: ${outputDir}`);
console.log('');

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

  // Create repositories
  const bookRepo = new BookRepository(db);
  const workflowRepo = new WorkflowRepository(db);
  const artifactRegistry = new ArtifactRegistry(db);

  try {
    // 1. Verify book exists and get book ID
    console.log('Verifying book...');
    let book = bookRepo.getBySlug(bookIdOrSlug!);
    if (!book) {
      // Try by ID
      book = bookRepo.getById(bookIdOrSlug!);
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

    // 3. Invoke PM agent
    console.log('Invoking PM agent...');
    const pmInvoker = new PMInvoker();
    const plan = await pmInvoker.invoke({
      analysisPath: resolvedAnalysisPath,
      bookId: book.id,
      styleGuidesDir: resolve(projectRoot, 'docs/style_guides'),
    });
    console.log(`  OK Improvement plan generated: ${plan.plan_id}`);
    console.log(`  OK Target issues: ${plan.target_issues.length}`);
    console.log(`  OK Chapters to modify: ${plan.chapter_modifications.length}`);

    // 4. Save plan as artifact
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    const planPath = join(outputDir, `${workflowRun.id}-improvement-plan.json`);
    writeFileSync(planPath, JSON.stringify(plan, null, 2));
    console.log(`  OK Plan saved: ${planPath}`);

    // 5. Register artifact (using 'design_plan' as closest available type)
    artifactRegistry.register({
      workflowRunId: workflowRun.id,
      artifactType: 'design_plan',
      artifactPath: planPath,
      metadata: { plan_id: plan.plan_id, type: 'improvement_plan' },
    });
    console.log(`  OK Artifact registered`);

    // 6. Update workflow status to running
    workflowRepo.updateStatus(workflowRun.id, 'running');
    console.log(`  OK Workflow status updated to 'running'`);

    // Print success output
    const tableRows = [
      { key: 'Workflow Run', value: workflowRun.id },
      { key: 'Book', value: `${book.title} (${book.slug})` },
      { key: 'Plan ID', value: plan.plan_id },
      { key: 'Issues', value: String(plan.target_issues.length) },
      { key: 'Chapters', value: String(plan.chapter_modifications.length) },
      { key: 'Plan Path', value: planPath },
    ];

    console.log('');
    console.log(
      CLIFormatter.format({
        title: 'PLANNING PHASE COMPLETE',
        content: CLIFormatter.table(tableRows),
        status: [
          { label: 'Workflow run created', success: true },
          { label: 'PM agent invoked', success: true },
          { label: 'Improvement plan generated', success: true },
          { label: 'Artifact registered', success: true },
        ],
        nextStep: [
          'Next step:',
          `  pnpm w1:content-modify --book ${book.slug} --plan ${planPath} --iteration 1`,
        ],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Planning phase failed: ${errorMessage}`,
        status: [{ label: 'Planning phase failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure the analysis file is valid JSON.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
