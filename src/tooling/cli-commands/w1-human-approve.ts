/**
 * w1:human-approve CLI Command
 *
 * Shows human what changed during W1 workflow and accepts approval/rejection.
 * This is the human gate before finalization.
 *
 * Usage:
 *   pnpm w1:human-approve --book <book-id> --workflow <run-id>
 *
 * Display:
 *   1. Improvement plan (from phase 2)
 *   2. Chapter modifications (from phase 3)
 *   3. Review metrics change (from phase 4)
 *   4. Editor/domain expert feedback (from phase 3)
 *
 * Actions:
 *   - If YES: Update workflow status to "approved", output finalization CLI command
 *   - If NO: Prompt for feedback, update status to "rejected"
 */

import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry, type WorkflowArtifact } from '../workflows/artifact-registry.js';
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

// Parse command line arguments
const { values } = parseArgs({
  options: {
    book: { type: 'string', short: 'b' },
    workflow: { type: 'string', short: 'w' },
    db: { type: 'string', default: 'data/project.db' },
    events: { type: 'string', default: 'data/events' },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const workflowRunId = values.workflow;
const dbPath = resolve(projectRoot, values.db!);
const eventsDir = resolve(projectRoot, values.events!);

// Validate required arguments
if (!bookIdOrSlug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --book <book-id>',
      status: [{ label: 'Book ID is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:human-approve --book <book-id> --workflow <run-id>',
        '',
        'List available books:',
        '  pnpm book:list',
      ],
    })
  );
  process.exit(1);
}

if (!workflowRunId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --workflow <run-id>',
      status: [{ label: 'Workflow run ID is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:human-approve --book <book-id> --workflow <run-id>',
        '',
        'List workflow runs:',
        '  pnpm workflow:list --book <book-id>',
      ],
    })
  );
  process.exit(1);
}

/**
 * Artifact data structures
 */
interface ImprovementPlan {
  plan_id: string;
  book_id: string;
  focus_areas: string[];
  chapter_modifications: Array<{
    chapter_id: string;
    modification_type: string;
    description: string;
    priority: string;
  }>;
  success_criteria: string[];
  estimated_effort: string;
}

interface WriterOutput {
  updated_chapters: Array<{
    chapter_id: string;
    changes_summary: string;
    word_count_delta: number;
  }>;
  change_log: Array<{
    chapter_id: string;
    change_type: string;
    description: string;
  }>;
}

interface EditorFeedback {
  approved: boolean;
  summary: string;
  feedback: Array<{
    location: string;
    issue: string;
    severity: 'suggestion' | 'warning' | 'error';
    suggested_fix?: string;
  }>;
}

interface DomainExpertFeedback {
  approved: boolean;
  summary: string;
  issues: Array<{
    type: string;
    description: string;
    impact: 'minor' | 'major' | 'critical';
    location?: string;
  }>;
}

interface ValidationResult {
  book_id: string;
  iteration: number;
  baseline_metrics: {
    aggregate_metrics: {
      clarity_readability: number;
      rules_accuracy: number;
      persona_fit: number;
      practical_usability: number;
      overall_score: number;
    };
  };
  new_metrics: {
    aggregate_metrics: {
      clarity_readability: number;
      rules_accuracy: number;
      persona_fit: number;
      practical_usability: number;
      overall_score: number;
    };
  };
  evaluation: {
    approved: boolean;
    confidence: string;
    reasoning: string;
    recommendations: string[];
    metrics_comparison: {
      overall: { baseline: number; new: number; delta: number };
      by_dimension: {
        clarity_readability: { baseline: number; new: number; delta: number };
        rules_accuracy: { baseline: number; new: number; delta: number };
        persona_fit: { baseline: number; new: number; delta: number };
        practical_usability: { baseline: number; new: number; delta: number };
      };
    };
  };
  status: string;
}

/**
 * Load artifact content from path
 */
function loadArtifact<T>(artifact: WorkflowArtifact): T | null {
  try {
    if (!existsSync(artifact.artifactPath)) {
      return null;
    }
    const content = readFileSync(artifact.artifactPath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Format delta with sign
 */
function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}`;
}

/**
 * Prompt user for yes/no confirmation
 */
async function promptYesNo(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * Prompt user for free-form input
 */
async function promptInput(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Log rejection event to workflow events file
 */
function logRejectionEvent(
  workflowRunId: string,
  reason: string,
  eventsDir: string
): void {
  // Ensure events directory exists
  if (!existsSync(eventsDir)) {
    mkdirSync(eventsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const eventFilePath = join(eventsDir, `${date}-workflow-events.jsonl`);

  const event = {
    id: `evt_${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    type: 'human_review_rejected',
    workflow_run_id: workflowRunId,
    data: {
      reason,
      reviewer: 'human',
    },
  };

  appendFileSync(eventFilePath, JSON.stringify(event) + '\n');
}

/**
 * Log approval event to workflow events file
 */
function logApprovalEvent(workflowRunId: string, eventsDir: string): void {
  // Ensure events directory exists
  if (!existsSync(eventsDir)) {
    mkdirSync(eventsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const eventFilePath = join(eventsDir, `${date}-workflow-events.jsonl`);

  const event = {
    id: `evt_${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    type: 'human_review_approved',
    workflow_run_id: workflowRunId,
    data: {
      reviewer: 'human',
    },
  };

  appendFileSync(eventFilePath, JSON.stringify(event) + '\n');
}

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
    // 1. Verify book exists
    let book = bookRepo.getBySlug(bookIdOrSlug!);
    if (!book) {
      book = bookRepo.getById(bookIdOrSlug!);
    }
    if (!book) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Book not found: ${bookIdOrSlug}`,
          status: [{ label: 'Book does not exist', success: false }],
          nextStep: ['List available books:', '  pnpm book:list'],
        })
      );
      process.exit(1);
    }

    // 2. Verify workflow run exists
    const workflowRun = workflowRepo.getById(workflowRunId!);
    if (!workflowRun) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Workflow run not found: ${workflowRunId}`,
          status: [{ label: 'Workflow run does not exist', success: false }],
          nextStep: [
            'List workflow runs:',
            `  pnpm workflow:list --book ${book.slug}`,
          ],
        })
      );
      process.exit(1);
    }

    // Verify workflow is for the specified book
    if (workflowRun.book_id !== book.id) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Workflow run ${workflowRunId} is not for book ${book.slug}`,
          status: [{ label: 'Book mismatch', success: false }],
          nextStep: [
            `This workflow is for book ID: ${workflowRun.book_id}`,
            '',
            'List workflow runs for this book:',
            `  pnpm workflow:list --book ${book.slug}`,
          ],
        })
      );
      process.exit(1);
    }

    // 3. Get all artifacts for this workflow run
    const artifacts = artifactRegistry.getByRunId(workflowRunId!);
    if (artifacts.length === 0) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `No artifacts found for workflow run: ${workflowRunId}`,
          status: [{ label: 'No artifacts to review', success: false }],
          nextStep: [
            'Ensure the workflow has completed phases 2-4 before human review.',
            '',
            'Check workflow status:',
            `  pnpm workflow:status --id ${workflowRunId}`,
          ],
        })
      );
      process.exit(1);
    }

    // Print header
    console.log(CLIFormatter.header('W1 HUMAN APPROVAL GATE'));
    console.log(
      CLIFormatter.table([
        { key: 'Book', value: `${book.title} (${book.slug})` },
        { key: 'Workflow Run', value: workflowRunId! },
        { key: 'Status', value: workflowRun.status },
        { key: 'Artifacts', value: String(artifacts.length) },
      ])
    );
    console.log('');

    // 4. Display Improvement Plan (Phase 2)
    console.log(CLIFormatter.section('PHASE 2: IMPROVEMENT PLAN', ''));

    // Find the improvement plan artifact (look for design_plan type or chapter artifact from PM)
    const planArtifact = artifacts.find(
      (a) =>
        a.artifactType === 'design_plan' ||
        (a.metadata as Record<string, unknown>)?.agent === 'pm'
    );

    if (planArtifact) {
      const plan = loadArtifact<ImprovementPlan>(planArtifact);
      if (plan) {
        console.log(`Plan ID: ${plan.plan_id}`);
        console.log(`Focus Areas: ${plan.focus_areas.join(', ')}`);
        console.log(`Estimated Effort: ${plan.estimated_effort}`);
        console.log('');
        console.log('Chapter Modifications:');
        for (const mod of plan.chapter_modifications) {
          console.log(`  - ${mod.chapter_id}: ${mod.modification_type} (${mod.priority})`);
          console.log(`    ${mod.description}`);
        }
        console.log('');
        console.log('Success Criteria:');
        for (const criterion of plan.success_criteria) {
          console.log(`  - ${criterion}`);
        }
      } else {
        console.log('  (Plan file not found or unreadable)');
      }
    } else {
      // Try to find plan from artifact path pattern
      const anyChapterArtifact = artifacts.find((a) => a.artifactType === 'chapter');
      if (anyChapterArtifact) {
        // Extract plan path from directory structure
        const artifactDir = anyChapterArtifact.artifactPath.split('/').slice(0, -2).join('/');
        const planPath = join(artifactDir, 'improvement-plan.json');
        if (existsSync(planPath)) {
          const planContent = readFileSync(planPath, 'utf-8');
          const plan = JSON.parse(planContent) as ImprovementPlan;
          console.log(`Plan ID: ${plan.plan_id}`);
          console.log(`Focus Areas: ${plan.focus_areas.join(', ')}`);
          console.log(`Chapter Modifications: ${plan.chapter_modifications.length} planned`);
        } else {
          console.log('  (No improvement plan artifact found)');
        }
      } else {
        console.log('  (No improvement plan artifact found)');
      }
    }
    console.log('');

    // 5. Display Chapter Modifications (Phase 3)
    console.log(CLIFormatter.section('PHASE 3: CHAPTER MODIFICATIONS', ''));

    const chapterArtifacts = artifacts.filter((a) => a.artifactType === 'chapter');
    const writerArtifact = chapterArtifacts.find(
      (a) => (a.metadata as Record<string, unknown>)?.agent === 'writer'
    );

    if (writerArtifact) {
      const writerOutput = loadArtifact<WriterOutput>(writerArtifact);
      if (writerOutput) {
        console.log(`Chapters Modified: ${writerOutput.updated_chapters.length}`);
        console.log('');
        for (const chapter of writerOutput.updated_chapters) {
          const delta = chapter.word_count_delta >= 0 ? `+${chapter.word_count_delta}` : String(chapter.word_count_delta);
          console.log(`  ${chapter.chapter_id}:`);
          console.log(`    ${chapter.changes_summary}`);
          console.log(`    Word count change: ${delta}`);
        }
        if (writerOutput.change_log && writerOutput.change_log.length > 0) {
          console.log('');
          console.log('Change Log:');
          for (const change of writerOutput.change_log.slice(0, 10)) {
            console.log(`  - [${change.chapter_id}] ${change.change_type}: ${change.description}`);
          }
          if (writerOutput.change_log.length > 10) {
            console.log(`  ... and ${writerOutput.change_log.length - 10} more changes`);
          }
        }
      } else {
        console.log('  (Writer output not found or unreadable)');
      }
    } else {
      console.log(`  Found ${chapterArtifacts.length} chapter artifact(s)`);
      for (const artifact of chapterArtifacts) {
        const meta = artifact.metadata as Record<string, unknown>;
        console.log(`  - ${artifact.artifactPath}`);
        if (meta?.chapters_modified) {
          console.log(`    Chapters: ${(meta.chapters_modified as string[]).join(', ')}`);
        }
      }
    }
    console.log('');

    // 6. Display Review Feedback (Phase 3)
    console.log(CLIFormatter.section('PHASE 3: EDITOR/DOMAIN EXPERT FEEDBACK', ''));

    const qaArtifacts = artifacts.filter((a) => a.artifactType === 'qa_report');

    // Editor feedback
    const editorArtifact = qaArtifacts.find(
      (a) => (a.metadata as Record<string, unknown>)?.agent === 'editor'
    );

    if (editorArtifact) {
      const editorFeedback = loadArtifact<EditorFeedback>(editorArtifact);
      if (editorFeedback) {
        const status = editorFeedback.approved ? 'APPROVED' : 'REJECTED';
        console.log(`Editor Review: ${status}`);
        console.log(`  Summary: ${editorFeedback.summary}`);
        if (editorFeedback.feedback && editorFeedback.feedback.length > 0) {
          const errors = editorFeedback.feedback.filter((f) => f.severity === 'error').length;
          const warnings = editorFeedback.feedback.filter((f) => f.severity === 'warning').length;
          const suggestions = editorFeedback.feedback.filter((f) => f.severity === 'suggestion').length;
          console.log(`  Issues: ${errors} errors, ${warnings} warnings, ${suggestions} suggestions`);
        }
      }
    } else {
      console.log('Editor Review: (not found)');
    }
    console.log('');

    // Domain expert feedback
    const domainExpertArtifact = qaArtifacts.find(
      (a) => (a.metadata as Record<string, unknown>)?.agent === 'domain_expert'
    );

    if (domainExpertArtifact) {
      const domainFeedback = loadArtifact<DomainExpertFeedback>(domainExpertArtifact);
      if (domainFeedback) {
        const status = domainFeedback.approved ? 'APPROVED' : 'REJECTED';
        console.log(`Domain Expert Review: ${status}`);
        console.log(`  Summary: ${domainFeedback.summary}`);
        if (domainFeedback.issues && domainFeedback.issues.length > 0) {
          const critical = domainFeedback.issues.filter((i) => i.impact === 'critical').length;
          const major = domainFeedback.issues.filter((i) => i.impact === 'major').length;
          const minor = domainFeedback.issues.filter((i) => i.impact === 'minor').length;
          console.log(`  Issues: ${critical} critical, ${major} major, ${minor} minor`);
        }
      }
    } else {
      console.log('Domain Expert Review: (not found)');
    }
    console.log('');

    // 7. Display Validation Metrics (Phase 4)
    console.log(CLIFormatter.section('PHASE 4: REVIEW METRICS CHANGE', ''));

    const validationArtifact = qaArtifacts.find(
      (a) => (a.metadata as Record<string, unknown>)?.agent === 'pm_metrics'
    );

    if (validationArtifact) {
      const validation = loadArtifact<ValidationResult>(validationArtifact);
      if (validation && validation.evaluation) {
        const comp = validation.evaluation.metrics_comparison;
        console.log('Metrics Comparison (Baseline -> New):');
        console.log(
          CLIFormatter.table([
            {
              key: 'Clarity/Readability',
              value: `${comp.by_dimension.clarity_readability.baseline} -> ${comp.by_dimension.clarity_readability.new} (${formatDelta(comp.by_dimension.clarity_readability.delta)})`,
            },
            {
              key: 'Rules Accuracy',
              value: `${comp.by_dimension.rules_accuracy.baseline} -> ${comp.by_dimension.rules_accuracy.new} (${formatDelta(comp.by_dimension.rules_accuracy.delta)})`,
            },
            {
              key: 'Persona Fit',
              value: `${comp.by_dimension.persona_fit.baseline} -> ${comp.by_dimension.persona_fit.new} (${formatDelta(comp.by_dimension.persona_fit.delta)})`,
            },
            {
              key: 'Practical Usability',
              value: `${comp.by_dimension.practical_usability.baseline} -> ${comp.by_dimension.practical_usability.new} (${formatDelta(comp.by_dimension.practical_usability.delta)})`,
            },
            { key: '', value: '' },
            {
              key: 'OVERALL',
              value: `${comp.overall.baseline} -> ${comp.overall.new} (${formatDelta(comp.overall.delta)})`,
            },
          ])
        );
        console.log('');
        console.log(`Validation Result: ${validation.evaluation.approved ? 'PASSED' : 'FAILED'}`);
        console.log(`Confidence: ${validation.evaluation.confidence}`);
        console.log(`Reasoning: ${validation.evaluation.reasoning}`);

        if (validation.evaluation.recommendations && validation.evaluation.recommendations.length > 0) {
          console.log('');
          console.log('Recommendations:');
          for (const rec of validation.evaluation.recommendations) {
            console.log(`  - ${rec}`);
          }
        }
      } else {
        console.log('  (Validation result not found or incomplete)');
      }
    } else {
      console.log('  (No validation artifact found)');
    }
    console.log('');

    // 8. Prompt for approval
    console.log(CLIFormatter.section('HUMAN APPROVAL REQUIRED', ''));
    console.log('Review the changes above carefully before proceeding.');
    console.log('');

    const approved = await promptYesNo('Approve changes and proceed to finalization? (y/n): ');

    if (approved) {
      // Log approval event
      logApprovalEvent(workflowRunId!, eventsDir);

      // Note: We don't actually update workflow status to "approved" since
      // the WorkflowStatus type doesn't include "approved" - it would be
      // 'running' continuing to finalization or 'completed' after finalization
      // For now, we just log the event and provide the next command

      console.log('');
      console.log(
        CLIFormatter.format({
          title: 'APPROVED - READY FOR FINALIZATION',
          content: [
            'Human approval recorded. The workflow is ready for finalization.',
            '',
            CLIFormatter.table([
              { key: 'Workflow Run', value: workflowRunId! },
              { key: 'Book', value: book.slug },
              { key: 'Decision', value: 'APPROVED' },
              { key: 'Timestamp', value: new Date().toISOString() },
            ]),
          ],
          status: [
            { label: 'Human review completed', success: true },
            { label: 'Changes approved', success: true },
            { label: 'Ready for finalization', success: true },
          ],
          nextStep: [
            'Proceed to finalization:',
            `  pnpm w1:finalize --book ${book.slug} --workflow ${workflowRunId}`,
          ],
        })
      );
    } else {
      // Prompt for rejection reason
      console.log('');
      const reason = await promptInput('Please provide a reason for rejection: ');

      // Log rejection event
      logRejectionEvent(workflowRunId!, reason, eventsDir);

      // Update workflow status to paused (rejected state)
      try {
        workflowRepo.updateStatus(workflowRunId!, 'paused');
      } catch {
        // Status might already be paused or transition not allowed
      }

      console.log('');
      console.log(
        CLIFormatter.format({
          title: 'REJECTED - WORKFLOW PAUSED',
          content: [
            'Human review rejected the changes. The workflow has been paused.',
            '',
            CLIFormatter.table([
              { key: 'Workflow Run', value: workflowRunId! },
              { key: 'Book', value: book.slug },
              { key: 'Decision', value: 'REJECTED' },
              { key: 'Reason', value: reason || '(no reason provided)' },
              { key: 'Timestamp', value: new Date().toISOString() },
            ]),
          ],
          status: [
            { label: 'Human review completed', success: true },
            { label: 'Changes rejected', success: false },
            { label: 'Workflow paused', pending: true },
          ],
          nextStep: [
            'The rejection reason has been logged.',
            '',
            'To re-run content modification with adjustments:',
            `  pnpm w1:content-modify --book ${book.slug} --plan <updated-plan> --iteration <next-iteration> --workflow-run ${workflowRunId}`,
            '',
            'To resume the workflow after addressing feedback:',
            `  pnpm workflow:resume --id ${workflowRunId}`,
          ],
        })
      );

      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Human approval process failed: ${errorMessage}`,
        status: [{ label: 'Human approval failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure the database is accessible and the workflow run exists.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
