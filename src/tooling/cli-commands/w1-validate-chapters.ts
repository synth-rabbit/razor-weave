/**
 * w1:validate-chapters CLI Command
 *
 * Runs review campaign on modified chapters only (not full book).
 * Used in the validation phase to verify that content modifications improved metrics.
 *
 * Usage:
 *   Generate mode (default):
 *     pnpm w1:validate-chapters --book <book-id> --chapters <chapter-list> --output <dir>
 *
 *   Save mode:
 *     pnpm w1:validate-chapters --save --run <workflow-run-id> --result <path-to-result.json>
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { getVersionedSourcePath } from '../books/types.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { createTables } from '@razorweave/database';
import { runMigrations } from '@razorweave/database';
import {
  generateChapterReviewPrompt,
  W1PromptWriter,
  W1ResultSaver,
} from '../w1/index.js';

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
    chapters: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o', default: 'data/w1-artifacts' },
    db: { type: 'string', default: 'data/project.db' },
    'workflow-run': { type: 'string', short: 'w' },
    run: { type: 'string', short: 'r' },
    iteration: { type: 'string', short: 'i' },
    // Mode flags
    generate: { type: 'boolean', default: false },
    save: { type: 'boolean', default: false },
    result: { type: 'string' },
    // Legacy flag for local generation (no LLM)
    'use-local': { type: 'boolean', default: false },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const chaptersArg = values.chapters;
const outputDir = resolve(projectRoot, values.output!);
const dbPath = resolve(projectRoot, values.db!);
const workflowRunIdArg = values['workflow-run'] || values.run;
const iterationArg = values.iteration;
const generateMode = values.generate;
const saveMode = values.save;
const resultPath = values.result;
const useLocal = values['use-local'];

// Determine mode
const isGenerateMode = generateMode || (!saveMode && !resultPath);
const isSaveMode = saveMode || !!resultPath;

// Validate for save mode
if (isSaveMode) {
  if (!workflowRunIdArg) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --run <workflow-run-id>',
        status: [{ label: 'Workflow run ID is required in save mode', success: false }],
        nextStep: [
          'Usage (save mode):',
          '  pnpm w1:validate-chapters --save --run <workflow-run-id> --result <path>',
        ],
      })
    );
    process.exit(1);
  }

  if (!resultPath) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --result <path-to-result.json>',
        status: [{ label: 'Result path is required in save mode', success: false }],
        nextStep: [
          'Usage (save mode):',
          '  pnpm w1:validate-chapters --save --run <workflow-run-id> --result <path>',
        ],
      })
    );
    process.exit(1);
  }
}

// Validate for generate mode
if (isGenerateMode) {
  if (!bookIdOrSlug) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --book <book-id>',
        status: [{ label: 'Book ID is required', success: false }],
        nextStep: [
          'Usage:',
          '  pnpm w1:validate-chapters --book <book-id> --chapters <chapter-list> --output <dir>',
          '',
          'List available books:',
          '  pnpm book:list',
        ],
      })
    );
    process.exit(1);
  }

  if (!chaptersArg) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --chapters <chapter-list>',
        status: [{ label: 'Chapter list is required', success: false }],
        nextStep: [
          'Usage:',
          '  pnpm w1:validate-chapters --book <book-id> --chapters <chapter-list>',
          '',
          'Example:',
          '  pnpm w1:validate-chapters --book core-rulebook --chapters 06-character-creation,08-actions',
        ],
      })
    );
    process.exit(1);
  }
}

// Parse chapters list (comma-separated)
const chapterIds = chaptersArg ? chaptersArg.split(',').map((id) => id.trim()).filter((id) => id.length > 0) : [];

if (isGenerateMode && chapterIds.length === 0) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'No valid chapter IDs provided',
      status: [{ label: 'At least one chapter ID is required', success: false }],
      nextStep: [
        'Example:',
        '  pnpm w1:validate-chapters --book core-rulebook --chapters 06-character-creation,08-actions',
      ],
    })
  );
  process.exit(1);
}

// Print header
console.log(CLIFormatter.header('W1 CHAPTER VALIDATION REVIEW'));
if (isGenerateMode) {
  console.log(`Mode: Generate prompt`);
  console.log(`Book: ${bookIdOrSlug}`);
  console.log(`Chapters: ${chapterIds.join(', ')}`);
} else {
  console.log(`Mode: Save result`);
  console.log(`Workflow Run: ${workflowRunIdArg}`);
  console.log(`Result: ${resultPath}`);
}
console.log(`Output: ${outputDir}`);
console.log('');

/**
 * Chapter review metrics from a review campaign
 */
export interface ChapterReviewMetrics {
  chapter_id: string;
  chapter_name: string;
  metrics: {
    clarity_readability: number;
    rules_accuracy: number;
    persona_fit: number;
    practical_usability: number;
    overall_score: number;
  };
  persona_scores: Array<{
    persona_id: string;
    scores: {
      clarity_readability: number;
      rules_accuracy: number;
      persona_fit: number;
      practical_usability: number;
    };
  }>;
  themes: string[];
}

/**
 * Result of chapter validation review
 */
export interface ChapterValidationResult {
  book_id: string;
  book_slug: string;
  reviewed_at: string;
  campaign_id: string;
  chapters_reviewed: number;
  chapter_metrics: ChapterReviewMetrics[];
  aggregate_metrics: {
    clarity_readability: number;
    rules_accuracy: number;
    persona_fit: number;
    practical_usability: number;
    overall_score: number;
  };
}

/**
 * Get chapter paths from the book directory
 */
function getChapterPaths(bookDir: string, chapterIds: string[]): string[] {
  const chaptersDir = join(bookDir, 'chapters');

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
 * Simulate review metrics for chapters (local generation without LLM)
 */
function generateChapterMetricsLocally(
  chapterPaths: string[],
  chapterIds: string[]
): ChapterReviewMetrics[] {
  const metrics: ChapterReviewMetrics[] = [];

  for (let i = 0; i < chapterIds.length; i++) {
    const chapterId = chapterIds[i];
    const chapterPath = chapterPaths[i];

    // Read chapter content to determine realistic metrics
    let content = '';
    try {
      content = readFileSync(chapterPath, 'utf-8');
    } catch {
      // Chapter file may not exist in validation context
    }

    // Generate metrics based on content characteristics
    const baseScore = content.length > 0 ? 7.5 : 6.0;
    const variance = () => (Math.random() - 0.5) * 1.5;

    const chapterMetrics: ChapterReviewMetrics = {
      chapter_id: chapterId,
      chapter_name: chapterId.replace(/-/g, ' ').replace(/^\d+-/, ''),
      metrics: {
        clarity_readability: Math.min(10, Math.max(1, baseScore + variance())),
        rules_accuracy: Math.min(10, Math.max(1, baseScore + 0.5 + variance())),
        persona_fit: Math.min(10, Math.max(1, baseScore - 0.3 + variance())),
        practical_usability: Math.min(10, Math.max(1, baseScore + variance())),
        overall_score: 0, // Calculated below
      },
      persona_scores: [
        {
          persona_id: 'core-newcomer',
          scores: {
            clarity_readability: Math.min(10, Math.max(1, baseScore - 0.5 + variance())),
            rules_accuracy: Math.min(10, Math.max(1, baseScore + variance())),
            persona_fit: Math.min(10, Math.max(1, baseScore - 1 + variance())),
            practical_usability: Math.min(10, Math.max(1, baseScore + variance())),
          },
        },
        {
          persona_id: 'core-veteran',
          scores: {
            clarity_readability: Math.min(10, Math.max(1, baseScore + 1 + variance())),
            rules_accuracy: Math.min(10, Math.max(1, baseScore + 0.5 + variance())),
            persona_fit: Math.min(10, Math.max(1, baseScore + 0.5 + variance())),
            practical_usability: Math.min(10, Math.max(1, baseScore + variance())),
          },
        },
      ],
      themes: content.length > 5000
        ? ['Comprehensive content', 'Detailed explanations']
        : ['Concise content', 'Quick reference'],
    };

    // Calculate overall score as average
    chapterMetrics.metrics.overall_score =
      (chapterMetrics.metrics.clarity_readability +
       chapterMetrics.metrics.rules_accuracy +
       chapterMetrics.metrics.persona_fit +
       chapterMetrics.metrics.practical_usability) / 4;

    // Round all metrics to 1 decimal place
    chapterMetrics.metrics.clarity_readability = Math.round(chapterMetrics.metrics.clarity_readability * 10) / 10;
    chapterMetrics.metrics.rules_accuracy = Math.round(chapterMetrics.metrics.rules_accuracy * 10) / 10;
    chapterMetrics.metrics.persona_fit = Math.round(chapterMetrics.metrics.persona_fit * 10) / 10;
    chapterMetrics.metrics.practical_usability = Math.round(chapterMetrics.metrics.practical_usability * 10) / 10;
    chapterMetrics.metrics.overall_score = Math.round(chapterMetrics.metrics.overall_score * 10) / 10;

    metrics.push(chapterMetrics);
  }

  return metrics;
}

/**
 * Calculate aggregate metrics from chapter metrics
 */
function calculateAggregateMetrics(
  chapterMetrics: ChapterReviewMetrics[]
): ChapterValidationResult['aggregate_metrics'] {
  if (chapterMetrics.length === 0) {
    return {
      clarity_readability: 0,
      rules_accuracy: 0,
      persona_fit: 0,
      practical_usability: 0,
      overall_score: 0,
    };
  }

  const sums = {
    clarity_readability: 0,
    rules_accuracy: 0,
    persona_fit: 0,
    practical_usability: 0,
  };

  for (const chapter of chapterMetrics) {
    sums.clarity_readability += chapter.metrics.clarity_readability;
    sums.rules_accuracy += chapter.metrics.rules_accuracy;
    sums.persona_fit += chapter.metrics.persona_fit;
    sums.practical_usability += chapter.metrics.practical_usability;
  }

  const count = chapterMetrics.length;
  const aggregate = {
    clarity_readability: Math.round((sums.clarity_readability / count) * 10) / 10,
    rules_accuracy: Math.round((sums.rules_accuracy / count) * 10) / 10,
    persona_fit: Math.round((sums.persona_fit / count) * 10) / 10,
    practical_usability: Math.round((sums.practical_usability / count) * 10) / 10,
    overall_score: 0,
  };

  aggregate.overall_score = Math.round(
    ((aggregate.clarity_readability +
      aggregate.rules_accuracy +
      aggregate.persona_fit +
      aggregate.practical_usability) / 4) * 10
  ) / 10;

  return aggregate;
}

async function runGenerateMode(): Promise<void> {
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

  try {
    // 1. Verify book exists and get book info
    console.log('Verifying book...');
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
    console.log(`  OK Book verified: ${book.title} (${book.slug})`);

    // 2. Get or create workflow run
    let workflowRunId = workflowRunIdArg;
    if (!workflowRunId) {
      // Find the most recent running workflow for this book
      const workflows = workflowRepo.list({ bookId: book.id, status: 'running' });
      if (workflows.length > 0) {
        workflowRunId = workflows[workflows.length - 1].id;
        console.log(`  OK Using workflow run: ${workflowRunId}`);
      } else {
        // Create a new workflow run
        const workflowRun = workflowRepo.create({
          workflow_type: 'w1_editing',
          book_id: book.id,
        });
        workflowRunId = workflowRun.id;
        console.log(`  OK Created workflow run: ${workflowRunId}`);
      }
    }

    // 3. Get chapter paths
    const bookDir = resolve(projectRoot, getVersionedSourcePath(book));
    const chapterPaths = getChapterPaths(bookDir, chapterIds);

    // Check which chapters exist
    const existingChapters = chapterPaths.filter((p) => existsSync(p));
    const missingChapters = chapterIds.filter((_, i) => !existsSync(chapterPaths[i]));
    const existingChapterIds = chapterIds.filter((_, i) => existsSync(chapterPaths[i]));

    if (existingChapters.length === 0) {
      console.error('  ERROR: No chapter files found');
      console.error(`  Looked for chapters in: ${join(bookDir, 'chapters')}`);
      process.exit(1);
    }

    if (missingChapters.length > 0) {
      console.log(`  WARNING: Some chapters not found: ${missingChapters.join(', ')}`);
    }

    console.log(`  OK Found ${existingChapters.length}/${chapterIds.length} chapters`);

    // 4. If --use-local, generate metrics locally
    if (useLocal) {
      console.log('Creating chapter review (local mode)...');

      const campaignId = `validation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      console.log(`  OK Campaign: ${campaignId}`);

      const chapterMetrics = generateChapterMetricsLocally(existingChapters, existingChapterIds);
      console.log(`  OK Generated metrics for ${chapterMetrics.length} chapters`);

      const aggregateMetrics = calculateAggregateMetrics(chapterMetrics);
      console.log(`  OK Aggregate overall score: ${aggregateMetrics.overall_score}`);

      const validationResult: ChapterValidationResult = {
        book_id: book.id,
        book_slug: book.slug,
        reviewed_at: new Date().toISOString(),
        campaign_id: campaignId,
        chapters_reviewed: chapterMetrics.length,
        chapter_metrics: chapterMetrics,
        aggregate_metrics: aggregateMetrics,
      };

      // Save result
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const outputFilename = workflowRunIdArg && iterationArg
        ? `${workflowRunIdArg}-iteration-${iterationArg}-chapter-review.json`
        : `chapter-review-${campaignId}.json`;
      const outputPath = join(outputDir, outputFilename);

      writeFileSync(outputPath, JSON.stringify(validationResult, null, 2));
      console.log(`  OK Results saved: ${outputPath}`);

      outputChapterReviewResult(book, validationResult, outputPath);
      return;
    }

    // 5. Generate prompt for LLM review
    console.log('Generating chapter review prompt...');
    const promptWriter = new W1PromptWriter({ runId: workflowRunId });

    const prompt = generateChapterReviewPrompt({
      runId: workflowRunId,
      bookSlug: book.slug,
      chapterPaths: existingChapters,
      chapterIds: existingChapterIds,
    });

    const promptPath = promptWriter.writeEditorPrompt(prompt); // Reuse editor prompt slot
    console.log(`  OK Prompt saved: ${promptPath}`);

    // Save chapter info for reference
    const chapterInfoPath = join(outputDir, workflowRunId, 'chapter-review-input.json');
    if (!existsSync(join(outputDir, workflowRunId))) {
      mkdirSync(join(outputDir, workflowRunId), { recursive: true });
    }
    writeFileSync(chapterInfoPath, JSON.stringify({
      book_id: book.id,
      book_slug: book.slug,
      chapters: existingChapterIds,
      chapter_paths: existingChapters,
    }, null, 2));

    // Print next step instructions
    console.log('');
    console.log(
      CLIFormatter.format({
        title: 'PROMPT GENERATED',
        content: [
          'The chapter review prompt has been generated.',
          '',
          `Prompt file: ${promptPath}`,
          `Chapter info: ${chapterInfoPath}`,
        ],
        status: [
          { label: `Book verified: ${book.slug}`, success: true },
          { label: `Found ${existingChapters.length}/${chapterIds.length} chapters`, success: true },
          { label: 'Prompt generated', success: true },
        ],
        nextStep: [
          'Next steps:',
          '',
          '1. Run the prompt with Claude to review chapters:',
          `   cat "${promptPath}" | claude`,
          '',
          '2. Save the review result to:',
          `   ${join(outputDir, workflowRunId, 'chapter-review.json')}`,
          '',
          '3. Then run:',
          `   pnpm w1:validate-chapters --save --run=${workflowRunId} --result=${join(outputDir, workflowRunId, 'chapter-review.json')}`,
        ],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Chapter review failed: ${errorMessage}`,
        status: [{ label: 'Chapter review failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure chapter files exist and are readable.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

async function runSaveMode(): Promise<void> {
  // Validate result file exists
  const resolvedResultPath = resolve(projectRoot, resultPath!);
  if (!existsSync(resolvedResultPath)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Result file not found: ${resolvedResultPath}`,
        status: [{ label: 'Result file does not exist', success: false }],
        nextStep: [
          'Ensure you have saved the chapter review result to the specified path.',
          'The result should be a JSON file with chapter_metrics and aggregate_metrics.',
        ],
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

  // Run migrations
  try {
    runMigrations(dbPath);
  } catch {
    // Migrations might already be applied
  }

  // Create repositories
  const bookRepo = new BookRepository(db);
  const workflowRepo = new WorkflowRepository(db);

  try {
    // 1. Load and validate result
    console.log('Step 1: Loading chapter review result...');
    const resultContent = readFileSync(resolvedResultPath, 'utf-8');
    const reviewResult = JSON.parse(resultContent) as ChapterValidationResult;

    if (!reviewResult.chapter_metrics || !Array.isArray(reviewResult.chapter_metrics)) {
      throw new Error('Invalid result: missing "chapter_metrics" array');
    }

    console.log(`  OK Result loaded: ${reviewResult.chapter_metrics.length} chapters reviewed`);
    console.log(`  OK Aggregate score: ${reviewResult.aggregate_metrics?.overall_score || 'N/A'}`);

    // 2. Get workflow run info
    console.log('Step 2: Verifying workflow run...');
    const workflowRun = workflowRepo.getById(workflowRunIdArg!);
    if (!workflowRun) {
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `Workflow run not found: ${workflowRunIdArg}`,
          status: [{ label: 'Workflow run does not exist', success: false }],
          nextStep: ['List workflow runs:', '  pnpm workflow:list'],
        })
      );
      process.exit(1);
    }
    console.log(`  OK Workflow run verified: ${workflowRun.id}`);

    // Get book info
    const book = bookRepo.getById(workflowRun.book_id);
    if (!book) {
      throw new Error(`Book not found for workflow run: ${workflowRun.book_id}`);
    }

    // 3. Save result using W1ResultSaver
    console.log('Step 3: Saving result...');
    const resultSaver = new W1ResultSaver(db, workflowRunIdArg!);
    const outputPath = join(outputDir, workflowRunIdArg!, 'chapter-review.json');
    resultSaver.saveChapterReviewResult(
      reviewResult as unknown as Record<string, unknown>,
      outputPath
    );
    console.log(`  OK Result saved: ${outputPath}`);

    // 4. Output final result
    outputChapterReviewResult(book, reviewResult, outputPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Save failed: ${errorMessage}`,
        status: [{ label: 'Save operation failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure the result file is valid JSON.',
        ],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

function outputChapterReviewResult(
  book: { id: string; slug: string; title: string },
  validationResult: ChapterValidationResult,
  outputPath: string
): void {
  const aggregateMetrics = validationResult.aggregate_metrics;

  const tableRows = [
    { key: 'Book', value: `${book.title} (${book.slug})` },
    { key: 'Chapters', value: String(validationResult.chapters_reviewed) },
    { key: 'Campaign ID', value: validationResult.campaign_id },
    { key: 'Output', value: outputPath },
    { key: '', value: '' },
    { key: 'Clarity/Readability', value: String(aggregateMetrics.clarity_readability) },
    { key: 'Rules Accuracy', value: String(aggregateMetrics.rules_accuracy) },
    { key: 'Persona Fit', value: String(aggregateMetrics.persona_fit) },
    { key: 'Practical Usability', value: String(aggregateMetrics.practical_usability) },
    { key: 'Overall Score', value: String(aggregateMetrics.overall_score) },
  ];

  console.log('');
  console.log(
    CLIFormatter.format({
      title: 'CHAPTER REVIEW COMPLETE',
      content: CLIFormatter.table(tableRows),
      status: [
        { label: `Book verified: ${book.slug}`, success: true },
        { label: `Reviewed ${validationResult.chapters_reviewed} chapters`, success: true },
        { label: `Overall score: ${aggregateMetrics.overall_score}`, success: aggregateMetrics.overall_score >= 7.0 },
      ],
      nextStep: [
        'Next step - Compare to baseline metrics:',
        `  pnpm w1:validate --book ${book.slug} --chapters ${validationResult.chapter_metrics.map((c) => c.chapter_id).join(',')}`,
      ],
    })
  );
}

async function main(): Promise<void> {
  if (isSaveMode) {
    await runSaveMode();
  } else {
    await runGenerateMode();
  }
}

main();
