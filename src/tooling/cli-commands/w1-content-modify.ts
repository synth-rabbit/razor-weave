/**
 * w1:content-modify CLI Command
 *
 * Orchestrates the writer/editor/domain expert loop for content modification.
 * Invokes agents in sequence and handles approvals/rejections with tracking.
 *
 * Usage:
 *   pnpm w1:content-modify --book <book-id> --plan <path> --iteration <number> [--output <dir>]
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WriterInvoker, type WriterOutput } from '../agents/invoker-writer.js';
import { EditorInvoker, type EditorReviewResult } from '../agents/invoker-editor.js';
import { DomainExpertInvoker, type DomainExpertReviewResult } from '../agents/invoker-domain-expert.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import { RejectionTracker, type RejectionType, DEFAULT_ESCALATION_THRESHOLD } from '../workflows/rejection-tracker.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import type { ImprovementPlan } from '../agents/invoker-pm.js';

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
    plan: { type: 'string', short: 'p' },
    iteration: { type: 'string', short: 'i' },
    output: { type: 'string', short: 'o', default: 'data/w1-artifacts' },
    db: { type: 'string', default: 'data/project.db' },
    'workflow-run': { type: 'string', short: 'w' },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const planPath = values.plan;
const iterationStr = values.iteration;
const outputDir = resolve(projectRoot, values.output!);
const dbPath = resolve(projectRoot, values.db!);
const workflowRunIdArg = values['workflow-run'];

// Validate required arguments
if (!bookIdOrSlug) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --book <book-id>',
      status: [{ label: 'Book ID is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:content-modify --book <book-id> --plan <path> --iteration <number>',
        '',
        'List available books:',
        '  pnpm book:list',
      ],
    })
  );
  process.exit(1);
}

if (!planPath) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --plan <path-to-plan>',
      status: [{ label: 'Plan path is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:content-modify --book <book-id> --plan <path> --iteration <number>',
        '',
        'Run planning first:',
        '  pnpm w1:planning --book <book-id> --analysis <path>',
      ],
    })
  );
  process.exit(1);
}

if (!iterationStr) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --iteration <number>',
      status: [{ label: 'Iteration number is required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:content-modify --book <book-id> --plan <path> --iteration <number>',
        '',
        'Example:',
        '  pnpm w1:content-modify --book core-rulebook --plan data/w1-artifacts/plan.json --iteration 1',
      ],
    })
  );
  process.exit(1);
}

const iteration = parseInt(iterationStr, 10);
if (isNaN(iteration) || iteration < 1) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Invalid iteration number: ${iterationStr}`,
      status: [{ label: 'Iteration must be a positive integer', success: false }],
      nextStep: ['Example: --iteration 1'],
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
        'Run planning first:',
        '  pnpm w1:planning --book <book-id> --analysis <path>',
      ],
    })
  );
  process.exit(1);
}

// Print header
console.log(CLIFormatter.header(`W1 CONTENT MODIFICATION - Iteration ${iteration}`));
console.log(`Book: ${bookIdOrSlug}`);
console.log(`Plan: ${resolvedPlanPath}`);
console.log(`Output: ${outputDir}`);
console.log('');

/**
 * Extract workflow run ID from plan path if not provided
 */
function extractWorkflowRunIdFromPlan(path: string): string | null {
  // Plan paths are typically like: data/w1-artifacts/wfrun_xxx_yyy-improvement-plan.json
  const filename = path.split('/').pop() || '';
  const match = filename.match(/^(wfrun_[a-z0-9_]+)-improvement-plan\.json$/);
  return match ? match[1] : null;
}

/**
 * Get chapter paths from the book directory based on the plan
 */
function getChapterPaths(bookDir: string, plan: ImprovementPlan): string[] {
  const chaptersDir = join(bookDir, 'chapters');
  const chapterIds = plan.chapter_modifications.map((mod) => mod.chapter_id);

  return chapterIds.map((chapterId) => {
    // Try common extensions
    for (const ext of ['.md', '.markdown']) {
      const path = join(chaptersDir, `${chapterId}${ext}`);
      if (existsSync(path)) {
        return path;
      }
    }
    // Fallback to .md
    return join(chaptersDir, `${chapterId}.md`);
  });
}

/**
 * Map editor/domain rejection to RejectionType
 */
function mapToRejectionType(feedback: EditorReviewResult | DomainExpertReviewResult): RejectionType {
  // Analyze feedback to determine rejection type
  if ('feedback' in feedback) {
    // Editor feedback
    const hasStyleIssue = feedback.feedback.some(
      (f) => f.issue.toLowerCase().includes('style') || f.issue.toLowerCase().includes('voice')
    );
    const hasClarityIssue = feedback.feedback.some(
      (f) => f.issue.toLowerCase().includes('clarity') || f.issue.toLowerCase().includes('unclear')
    );
    if (hasStyleIssue) return 'style';
    if (hasClarityIssue) return 'clarity';
    return 'style'; // Default for editor
  } else {
    // Domain expert feedback
    const hasMechanicsIssue = feedback.issues.some(
      (i) => i.type === 'rules_contradiction' || i.type === 'balance_concern'
    );
    if (hasMechanicsIssue) return 'mechanics';
    return 'scope'; // Default for domain expert
  }
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
  const rejectionTracker = new RejectionTracker(db);

  try {
    // 1. Verify book exists and get book info
    console.log('Writer Agent:');
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

    // 2. Load improvement plan
    const planContent = readFileSync(resolvedPlanPath, 'utf-8');
    const plan = JSON.parse(planContent) as ImprovementPlan;

    // 3. Get or find workflow run ID
    let workflowRunId = workflowRunIdArg || extractWorkflowRunIdFromPlan(resolvedPlanPath);

    if (!workflowRunId) {
      // Create a new workflow run if not provided
      const workflowRun = workflowRepo.create({
        workflow_type: 'w1_editing',
        book_id: book.id,
        plan_id: plan.plan_id,
      });
      workflowRunId = workflowRun.id;
      console.log(`  Created workflow run: ${workflowRunId}`);
    }

    // Verify workflow run exists
    const workflowRun = workflowRepo.getById(workflowRunId);
    if (!workflowRun) {
      console.error(`  ERROR: Workflow run not found: ${workflowRunId}`);
      process.exit(1);
    }

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Create iteration-specific output directory
    const iterationDir = join(outputDir, workflowRunId, `iteration-${iteration}`);
    if (!existsSync(iterationDir)) {
      mkdirSync(iterationDir, { recursive: true });
    }

    // Get chapter paths
    const bookDir = resolve(projectRoot, book.source_path);
    const chapterPaths = getChapterPaths(bookDir, plan);

    // Check which chapters actually exist
    const existingChapters = chapterPaths.filter((p) => existsSync(p));
    if (existingChapters.length === 0) {
      console.error('  ERROR: No chapter files found');
      console.error(`  Expected paths: ${chapterPaths.join(', ')}`);
      process.exit(1);
    }

    // 4. Update workflow status to running and set current agent
    workflowRepo.updateStatus(workflowRunId, 'running');
    workflowRepo.setCurrentAgent(workflowRunId, 'writer');

    // 5. Invoke Writer agent
    console.log('  Invoking writer agent...');
    const writerInvoker = new WriterInvoker();
    let writerOutput: WriterOutput;

    try {
      writerOutput = await writerInvoker.invoke({
        planPath: resolvedPlanPath,
        chapterPaths: existingChapters,
        styleGuidesDir: resolve(projectRoot, 'docs/style_guides'),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR: Writer agent failed: ${errorMessage}`);
      workflowRepo.setCurrentAgent(workflowRunId, null);
      process.exit(1);
    }

    console.log(`  ✓ Modified ${writerOutput.updated_chapters.length} chapters`);

    // 6. Save writer output as artifact
    const writerOutputPath = join(iterationDir, 'writer-output.json');
    writeFileSync(writerOutputPath, JSON.stringify(writerOutput, null, 2));
    console.log(`  ✓ Changelog saved`);

    // Save individual chapter files
    for (const chapter of writerOutput.updated_chapters) {
      const chapterOutputPath = join(iterationDir, `${chapter.chapter_id}.md`);
      writeFileSync(chapterOutputPath, chapter.content);
    }

    // Register writer artifact
    artifactRegistry.register({
      workflowRunId,
      artifactType: 'chapter',
      artifactPath: writerOutputPath,
      metadata: {
        iteration,
        agent: 'writer',
        chapters_modified: writerOutput.updated_chapters.map((c) => c.chapter_id),
      },
    });

    console.log('');

    // 7. Invoke Editor agent
    console.log('Editor Review:');
    workflowRepo.setCurrentAgent(workflowRunId, 'editor');

    const editorInvoker = new EditorInvoker();
    let editorResult: EditorReviewResult;

    // Get paths to writer-generated chapters for review
    const writerChapterPaths = writerOutput.updated_chapters.map((c) =>
      join(iterationDir, `${c.chapter_id}.md`)
    );

    try {
      editorResult = await editorInvoker.invoke({
        chapterPaths: writerChapterPaths,
        styleGuidesDir: resolve(projectRoot, 'docs/style_guides'),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR: Editor agent failed: ${errorMessage}`);
      workflowRepo.setCurrentAgent(workflowRunId, null);
      process.exit(1);
    }

    // Save editor feedback
    const editorFeedbackPath = join(iterationDir, 'editor-feedback.json');
    writeFileSync(editorFeedbackPath, JSON.stringify(editorResult, null, 2));

    // Register editor artifact
    artifactRegistry.register({
      workflowRunId,
      artifactType: 'qa_report',
      artifactPath: editorFeedbackPath,
      metadata: {
        iteration,
        agent: 'editor',
        approved: editorResult.approved,
      },
    });

    // 8. Handle editor rejection
    if (!editorResult.approved) {
      const rejectionType = mapToRejectionType(editorResult);
      const rejection = rejectionTracker.recordRejection({
        workflowRunId,
        rejectionType,
        reason: editorResult.summary,
      });

      const suggestionCount = editorResult.feedback.filter((f) => f.severity === 'suggestion').length;
      const warningCount = editorResult.feedback.filter((f) => f.severity === 'warning').length;
      const errorCount = editorResult.feedback.filter((f) => f.severity === 'error').length;

      console.log(`  ✗ Rejected (${errorCount} errors, ${warningCount} warnings, ${suggestionCount} suggestions)`);
      console.log(`  Feedback saved: ${editorFeedbackPath}`);
      console.log('');

      // Check if escalation is needed
      if (rejectionTracker.shouldEscalate(workflowRunId, rejectionType)) {
        workflowRepo.updateStatus(workflowRunId, 'paused');
        workflowRepo.setCurrentAgent(workflowRunId, null);

        console.log(
          CLIFormatter.format({
            title: 'RESULT: ESCALATION REQUIRED',
            content: [
              `Rejection count for "${rejectionType}" has reached ${DEFAULT_ESCALATION_THRESHOLD}.`,
              'Human review is required to proceed.',
            ],
            status: [
              { label: `Writer agent modified ${writerOutput.updated_chapters.length} chapters`, success: true },
              { label: 'Editor rejected content', success: false },
              { label: `Escalation threshold reached (${rejection.retryCount}/${DEFAULT_ESCALATION_THRESHOLD})`, success: false },
            ],
            nextStep: [
              'Review editor feedback:',
              `  cat ${editorFeedbackPath}`,
              '',
              'After human review, resume workflow:',
              `  pnpm workflow:resume --id ${workflowRunId}`,
            ],
          })
        );
        process.exit(2); // Exit code 2 indicates escalation
      }

      workflowRepo.setCurrentAgent(workflowRunId, null);

      console.log(
        CLIFormatter.format({
          title: 'RESULT: EDITOR REJECTED',
          content: editorResult.summary,
          status: [
            { label: `Writer agent modified ${writerOutput.updated_chapters.length} chapters`, success: true },
            { label: 'Editor rejected content', success: false },
            { label: `Retry count: ${rejection.retryCount}/${DEFAULT_ESCALATION_THRESHOLD}`, pending: true },
          ],
          nextStep: [
            'Review editor feedback and re-run:',
            `  cat ${editorFeedbackPath}`,
            '',
            `  pnpm w1:content-modify --book ${book.slug} --plan ${resolvedPlanPath} --iteration ${iteration + 1} --workflow-run ${workflowRunId}`,
          ],
        })
      );
      process.exit(1);
    }

    // Editor approved
    const minorSuggestions = editorResult.feedback.filter((f) => f.severity === 'suggestion').length;
    if (minorSuggestions > 0) {
      console.log(`  ✓ Approved (${minorSuggestions} minor suggestions)`);
    } else {
      console.log('  ✓ Approved');
    }
    console.log('');

    // 9. Invoke Domain Expert agent
    console.log('Domain Expert Review:');
    workflowRepo.setCurrentAgent(workflowRunId, 'domain_expert');

    const domainExpertInvoker = new DomainExpertInvoker();
    let domainExpertResult: DomainExpertReviewResult;

    // Load mechanics guide
    let mechanicsGuide = '';
    const mechanicsGuidePath = resolve(projectRoot, 'docs/style_guides/mechanics.md');
    if (existsSync(mechanicsGuidePath)) {
      mechanicsGuide = readFileSync(mechanicsGuidePath, 'utf-8');
    }

    try {
      domainExpertResult = await domainExpertInvoker.invoke({
        chapterPaths: writerChapterPaths,
        mechanicsGuide,
        rulesDocPath: undefined, // Could be enhanced to accept rules doc path
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR: Domain expert agent failed: ${errorMessage}`);
      workflowRepo.setCurrentAgent(workflowRunId, null);
      process.exit(1);
    }

    // Save domain expert feedback
    const domainExpertFeedbackPath = join(iterationDir, 'domain-expert-feedback.json');
    writeFileSync(domainExpertFeedbackPath, JSON.stringify(domainExpertResult, null, 2));

    // Register domain expert artifact
    artifactRegistry.register({
      workflowRunId,
      artifactType: 'qa_report',
      artifactPath: domainExpertFeedbackPath,
      metadata: {
        iteration,
        agent: 'domain_expert',
        approved: domainExpertResult.approved,
      },
    });

    // 10. Handle domain expert rejection
    if (!domainExpertResult.approved) {
      const rejectionType = mapToRejectionType(domainExpertResult);
      const rejection = rejectionTracker.recordRejection({
        workflowRunId,
        rejectionType,
        reason: domainExpertResult.summary,
      });

      const criticalCount = domainExpertResult.issues.filter((i) => i.impact === 'critical').length;
      const majorCount = domainExpertResult.issues.filter((i) => i.impact === 'major').length;
      const minorCount = domainExpertResult.issues.filter((i) => i.impact === 'minor').length;

      console.log(`  ✗ Rejected (${criticalCount} critical, ${majorCount} major, ${minorCount} minor issues)`);
      console.log(`  Feedback saved: ${domainExpertFeedbackPath}`);
      console.log('');

      // Check if escalation is needed
      if (rejectionTracker.shouldEscalate(workflowRunId, rejectionType)) {
        workflowRepo.updateStatus(workflowRunId, 'paused');
        workflowRepo.setCurrentAgent(workflowRunId, null);

        console.log(
          CLIFormatter.format({
            title: 'RESULT: ESCALATION REQUIRED',
            content: [
              `Rejection count for "${rejectionType}" has reached ${DEFAULT_ESCALATION_THRESHOLD}.`,
              'Human review is required to proceed.',
            ],
            status: [
              { label: `Writer agent modified ${writerOutput.updated_chapters.length} chapters`, success: true },
              { label: 'Editor approved content', success: true },
              { label: 'Domain expert rejected content', success: false },
              { label: `Escalation threshold reached (${rejection.retryCount}/${DEFAULT_ESCALATION_THRESHOLD})`, success: false },
            ],
            nextStep: [
              'Review domain expert feedback:',
              `  cat ${domainExpertFeedbackPath}`,
              '',
              'After human review, resume workflow:',
              `  pnpm workflow:resume --id ${workflowRunId}`,
            ],
          })
        );
        process.exit(2); // Exit code 2 indicates escalation
      }

      workflowRepo.setCurrentAgent(workflowRunId, null);

      console.log(
        CLIFormatter.format({
          title: 'RESULT: DOMAIN EXPERT REJECTED',
          content: domainExpertResult.summary,
          status: [
            { label: `Writer agent modified ${writerOutput.updated_chapters.length} chapters`, success: true },
            { label: 'Editor approved content', success: true },
            { label: 'Domain expert rejected content', success: false },
            { label: `Retry count: ${rejection.retryCount}/${DEFAULT_ESCALATION_THRESHOLD}`, pending: true },
          ],
          nextStep: [
            'Review domain expert feedback and re-run:',
            `  cat ${domainExpertFeedbackPath}`,
            '',
            `  pnpm w1:content-modify --book ${book.slug} --plan ${resolvedPlanPath} --iteration ${iteration + 1} --workflow-run ${workflowRunId}`,
          ],
        })
      );
      process.exit(1);
    }

    // Domain expert approved
    const minorIssues = domainExpertResult.issues.filter((i) => i.impact === 'minor').length;
    if (minorIssues > 0) {
      console.log(`  ✓ Approved (${minorIssues} minor issues noted)`);
    } else {
      console.log('  ✓ Approved (no mechanical issues)');
    }
    console.log('');

    // 11. Both approved - update workflow status
    workflowRepo.setCurrentAgent(workflowRunId, null);

    // Get list of modified chapter IDs for next step command
    const modifiedChapterIds = writerOutput.updated_chapters.map((c) => c.chapter_id).join(',');

    // Print success output
    const tableRows = [
      { key: 'Workflow Run', value: workflowRunId },
      { key: 'Book', value: `${book.title} (${book.slug})` },
      { key: 'Iteration', value: String(iteration) },
      { key: 'Chapters Modified', value: String(writerOutput.updated_chapters.length) },
      { key: 'Output Directory', value: iterationDir },
    ];

    console.log(
      CLIFormatter.format({
        title: 'RESULT: APPROVED',
        content: CLIFormatter.table(tableRows),
        status: [
          { label: `Writer agent modified ${writerOutput.updated_chapters.length} chapters`, success: true },
          { label: `Editor approved${minorSuggestions > 0 ? ` (${minorSuggestions} minor suggestions)` : ''}`, success: true },
          { label: `Domain expert approved${minorIssues > 0 ? ` (${minorIssues} minor issues noted)` : ' (no mechanical issues)'}`, success: true },
        ],
        nextStep: [
          'Next step:',
          `  pnpm w1:validate --book ${book.slug} --iteration ${iteration} --chapters ${modifiedChapterIds}`,
        ],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Content modification failed: ${errorMessage}`,
        status: [{ label: 'Content modification failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure the plan file is valid JSON.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
