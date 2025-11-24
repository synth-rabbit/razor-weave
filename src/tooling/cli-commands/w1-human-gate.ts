/**
 * w1:human-gate CLI Command
 *
 * Presents the human gate review for a W1 workflow run and records approval/rejection.
 *
 * Usage:
 *   Review mode (show summary for approval):
 *     pnpm w1:human-gate --run <workflow-run-id>
 *
 *   Approve mode:
 *     pnpm w1:human-gate --approve --run <workflow-run-id>
 *
 *   Reject mode:
 *     pnpm w1:human-gate --reject --run <workflow-run-id> --reason "reason for rejection"
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { StrategyRepository } from '../w1/strategy-repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';

// Get project root
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
    run: { type: 'string', short: 'r' },
    db: { type: 'string', default: 'data/project.db' },
    approve: { type: 'boolean', default: false },
    reject: { type: 'boolean', default: false },
    'full-review': { type: 'boolean', default: false },
    'plan-id': { type: 'string' },
    reason: { type: 'string' },
    reviewer: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});

const projectRoot = getProjectRoot();
const workflowRunId = values.run;
const dbPath = resolve(projectRoot, values.db!);
const approveMode = values.approve;
const rejectMode = values.reject;
const fullReviewMode = values['full-review'];
const planId = values['plan-id'];
const reason = values.reason;
const reviewer = values.reviewer || process.env.USER || 'unknown';

// Show help
if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W1 HUMAN GATE',
      content: 'Present human gate review for W1 workflow and record decisions.',
      nextStep: [
        'Usage:',
        '  pnpm w1:human-gate --run <workflow-run-id>              # Review summary',
        '  pnpm w1:human-gate --approve --run <id>                 # Approve changes',
        '  pnpm w1:human-gate --reject --run <id> --reason "..."   # Reject with reason',
        '  pnpm w1:human-gate --full-review --run <id>             # Request full persona review',
        '',
        'Options:',
        '  --run, -r       Workflow run ID (required)',
        '  --approve       Approve and proceed to finalization',
        '  --reject        Reject and require revisions',
        '  --full-review   Build HTML and run fresh persona reviews',
        '  --plan-id       Strategic plan ID (for full-review)',
        '  --reason        Reason for rejection (required with --reject)',
        '  --reviewer      Reviewer name (default: $USER)',
      ],
    })
  );
  process.exit(0);
}

// Validate arguments
if (!workflowRunId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --run <workflow-run-id>',
      status: [{ label: 'Workflow run ID is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:human-gate --run <workflow-run-id>',
        '  pnpm w1:human-gate --approve --run <workflow-run-id>',
        '  pnpm w1:human-gate --reject --run <workflow-run-id> --reason "..."',
      ],
    })
  );
  process.exit(1);
}

if (approveMode && rejectMode) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Cannot use both --approve and --reject',
      status: [{ label: 'Invalid arguments', success: false }],
      nextStep: ['Use either --approve OR --reject, not both.'],
    })
  );
  process.exit(1);
}

if (rejectMode && !reason) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Rejection requires a reason',
      status: [{ label: 'Reason is required for rejection', success: false }],
      nextStep: ['Usage:', '  pnpm w1:human-gate --reject --run <id> --reason "reason for rejection"'],
    })
  );
  process.exit(1);
}

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');

createTables(db);

try {
  runMigrations(dbPath);
} catch {
  // Migrations might already be applied
}

const bookRepo = new BookRepository(db);
const workflowRepo = new WorkflowRepository(db);
const strategyRepo = new StrategyRepository(db);

// Verify workflow run exists
const workflowRun = workflowRepo.getById(workflowRunId);
if (!workflowRun) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Workflow run not found: ${workflowRunId}`,
      status: [{ label: 'Workflow run does not exist', success: false }],
      nextStep: ['List workflow runs:', '  pnpm workflow:list'],
    })
  );
  db.close();
  process.exit(1);
}

// Get book info
const book = bookRepo.getById(workflowRun.book_id);
if (!book) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Book not found: ${workflowRun.book_id}`,
      status: [{ label: 'Book does not exist', success: false }],
      nextStep: ['List available books:', '  pnpm book:list'],
    })
  );
  db.close();
  process.exit(1);
}

const artifactsDir = resolve(projectRoot, `data/w1-artifacts/${workflowRunId}`);
const humanGatePath = join(artifactsDir, 'human-gate.json');

// Handle approve/reject modes
if (approveMode || rejectMode) {
  // Ensure artifacts directory exists
  if (!existsSync(artifactsDir)) {
    mkdirSync(artifactsDir, { recursive: true });
  }

  const humanGateData = {
    workflow_run_id: workflowRunId,
    book_id: book.id,
    book_slug: book.slug,
    approved: approveMode,
    rejected: rejectMode,
    reason: reason || null,
    reviewer,
    approved_at: approveMode ? new Date().toISOString() : null,
    rejected_at: rejectMode ? new Date().toISOString() : null,
    recorded_at: new Date().toISOString(),
  };

  writeFileSync(humanGatePath, JSON.stringify(humanGateData, null, 2));

  if (approveMode) {
    console.log(
      CLIFormatter.format({
        title: 'HUMAN GATE APPROVED',
        content: `Workflow run ${workflowRunId} has been approved for finalization.`,
        status: [
          { label: `Book: ${book.title}`, success: true },
          { label: `Reviewer: ${reviewer}`, success: true },
          { label: 'Human gate approved', success: true },
        ],
        nextStep: [
          'You can now finalize the workflow:',
          `  pnpm w1:finalize --book=${book.slug} --run=${workflowRunId}`,
        ],
      })
    );
  } else {
    console.log(
      CLIFormatter.format({
        title: 'HUMAN GATE REJECTED',
        content: `Workflow run ${workflowRunId} has been rejected.`,
        status: [
          { label: `Book: ${book.title}`, success: true },
          { label: `Reviewer: ${reviewer}`, success: true },
          { label: 'Human gate rejected', success: false },
        ],
        nextStep: [
          `Reason: ${reason}`,
          '',
          'To make changes and re-submit:',
          `  pnpm w1:content-modify --run=${workflowRunId}`,
          '',
          'To approve after changes:',
          `  pnpm w1:human-gate --approve --run=${workflowRunId}`,
        ],
      })
    );
  }

  db.close();
  process.exit(0);
}

// Handle full-review mode
if (fullReviewMode) {
  // Ensure artifacts directory exists
  if (!existsSync(artifactsDir)) {
    mkdirSync(artifactsDir, { recursive: true });
  }

  // Try to find strategic plan for this book
  let strategicPlan = planId ? strategyRepo.getById(planId) : null;
  if (!strategicPlan) {
    strategicPlan = strategyRepo.getActiveForBook(book.id);
  }

  // Update strategic plan state if found
  if (strategicPlan) {
    const now = new Date().toISOString();
    const updatedState = {
      ...strategicPlan.state,
      current_phase: 'full_review' as const,
      human_gate_reason: 'full_review_complete' as const,
      last_updated: now,
    };
    strategyRepo.updateState(strategicPlan.id, updatedState);
  }

  // Record the full-review request
  const fullReviewData = {
    workflow_run_id: workflowRunId,
    book_id: book.id,
    book_slug: book.slug,
    mode: 'full_review',
    reviewer,
    strategic_plan_id: strategicPlan?.id || null,
    requested_at: new Date().toISOString(),
  };
  writeFileSync(join(artifactsDir, 'full-review-request.json'), JSON.stringify(fullReviewData, null, 2));

  // Calculate the HTML output path
  const htmlOutputPath = resolve(projectRoot, `data/html/${book.slug}/index.html`);

  console.log(
    CLIFormatter.format({
      title: 'FULL REVIEW REQUESTED',
      content: [
        `Workflow run ${workflowRunId} is entering full review mode.`,
        '',
        'This will:',
        '  1. Build complete HTML with pending chapter modifications',
        '  2. Run 10 core persona reviews against the complete book',
        '  3. Generate fresh analysis',
        '  4. Compare against original baseline',
      ].join('\n'),
      status: [
        { label: `Book: ${book.title}`, success: true },
        { label: `Reviewer: ${reviewer}`, success: true },
        { label: 'Full review mode activated', pending: true },
        strategicPlan ? { label: `Plan: ${strategicPlan.id}`, success: true } : { label: 'No strategic plan found', pending: true },
      ],
    })
  );

  console.log('\n' + '─'.repeat(60) + '\n');
  console.log('STEP 1: Build HTML with pending changes\n');
  console.log(`  pnpm build:book --run=${workflowRunId}`);
  console.log(`\n  Output: ${htmlOutputPath}\n`);

  console.log('─'.repeat(60) + '\n');
  console.log('STEP 2: Run core persona reviews\n');
  console.log(`  pnpm review:book ${book.slug} --personas=core --fresh\n`);
  console.log('  This runs 10 core persona reviews against the updated book.\n');

  console.log('─'.repeat(60) + '\n');
  console.log('STEP 3: Analyze reviews\n');
  console.log(`  pnpm review:analyze --book=${book.slug}\n`);
  console.log('  Compare the new analysis against the original baseline.\n');

  console.log('─'.repeat(60) + '\n');
  console.log('STEP 4: Make final decision\n');
  console.log('  After reviewing the fresh analysis:');
  console.log(`    pnpm w1:human-gate --approve --run=${workflowRunId}     # Approve`);
  console.log(`    pnpm w1:human-gate --reject --run=${workflowRunId} --reason "..."   # Reject\n`);

  console.log('═'.repeat(60) + '\n');

  db.close();
  process.exit(0);
}

// Review mode - show summary for human review
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('W1 HUMAN GATE REVIEW');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`Book: ${book.title} (${book.slug})`);
console.log(`Workflow Run: ${workflowRunId}`);
console.log('');

// Load validation result if exists
const validationPath = join(artifactsDir, 'iteration-1', 'validation-result.json');
if (existsSync(validationPath)) {
  const validation = JSON.parse(readFileSync(validationPath, 'utf-8'));

  console.log('───────────────────────────────────────────────────────────');
  console.log('VALIDATION RESULT');
  console.log('───────────────────────────────────────────────────────────');
  console.log('');
  console.log(`Status: ${validation.approved ? 'APPROVED' : 'NOT APPROVED'}`);
  console.log(`Confidence: ${validation.confidence || 'N/A'}`);
  console.log('');

  if (validation.metrics_comparison) {
    console.log('Metrics Comparison:');
    const mc = validation.metrics_comparison;
    if (mc.overall) {
      console.log(`  Overall: ${mc.overall.baseline} → ${mc.overall.new} (${mc.overall.delta >= 0 ? '+' : ''}${mc.overall.delta})`);
    }
    if (mc.by_dimension) {
      for (const [dim, data] of Object.entries(mc.by_dimension)) {
        const d = data as { baseline: number; new: number; delta: number };
        console.log(`  ${dim}: ${d.baseline} → ${d.new} (${d.delta >= 0 ? '+' : ''}${d.delta})`);
      }
    }
    console.log('');
  }

  if (validation.reasoning) {
    console.log('Reasoning:');
    console.log(`  ${validation.reasoning.slice(0, 200)}${validation.reasoning.length > 200 ? '...' : ''}`);
    console.log('');
  }
}

// Load editor review if exists
const editorPath = join(artifactsDir, 'editor-review.json');
if (existsSync(editorPath)) {
  const editor = JSON.parse(readFileSync(editorPath, 'utf-8'));
  console.log('───────────────────────────────────────────────────────────');
  console.log('EDITOR REVIEW');
  console.log('───────────────────────────────────────────────────────────');
  console.log('');
  console.log(`Status: ${editor.approved ? 'APPROVED' : 'NOT APPROVED'}`);
  if (editor.feedback && editor.feedback.length > 0) {
    console.log(`Issues: ${editor.feedback.length}`);
    for (const item of editor.feedback.slice(0, 3)) {
      console.log(`  - [${item.severity}] ${item.issue}`);
    }
    if (editor.feedback.length > 3) {
      console.log(`  ... and ${editor.feedback.length - 3} more`);
    }
  }
  console.log('');
}

// Load domain review if exists
const domainPath = join(artifactsDir, 'domain-review.json');
if (existsSync(domainPath)) {
  const domain = JSON.parse(readFileSync(domainPath, 'utf-8'));
  console.log('───────────────────────────────────────────────────────────');
  console.log('DOMAIN EXPERT REVIEW');
  console.log('───────────────────────────────────────────────────────────');
  console.log('');
  console.log(`Status: ${domain.approved ? 'APPROVED' : 'NOT APPROVED'}`);
  if (domain.issues && domain.issues.length > 0) {
    console.log(`Issues: ${domain.issues.length}`);
    for (const item of domain.issues.slice(0, 3)) {
      console.log(`  - [${item.impact}] ${item.type}: ${item.description.slice(0, 60)}...`);
    }
    if (domain.issues.length > 3) {
      console.log(`  ... and ${domain.issues.length - 3} more`);
    }
  }
  console.log('');
}

// Show chapters modified
const planPath = join(artifactsDir, 'plan.json');
if (existsSync(planPath)) {
  const plan = JSON.parse(readFileSync(planPath, 'utf-8'));
  if (plan.chapter_modifications && plan.chapter_modifications.length > 0) {
    console.log('───────────────────────────────────────────────────────────');
    console.log('CHAPTERS MODIFIED');
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    for (const ch of plan.chapter_modifications) {
      console.log(`  - ${ch.chapter_id}`);
      if (ch.modifications) {
        for (const mod of ch.modifications.slice(0, 2)) {
          console.log(`      ${mod.type}: ${mod.instruction.slice(0, 50)}...`);
        }
        if (ch.modifications.length > 2) {
          console.log(`      ... and ${ch.modifications.length - 2} more modifications`);
        }
      }
    }
    console.log('');
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('DECISION OPTIONS:');
console.log('');
console.log('1. Approve and proceed to finalization:');
console.log(`   pnpm w1:human-gate --approve --run=${workflowRunId}`);
console.log('');
console.log('2. Reject with a reason:');
console.log(`   pnpm w1:human-gate --reject --run=${workflowRunId} --reason "your reason"`);
console.log('');
console.log('3. Request full review (build HTML, run core persona reviews):');
console.log(`   pnpm w1:human-gate --full-review --run=${workflowRunId}`);
console.log('');
console.log('═══════════════════════════════════════════════════════════');

db.close();
