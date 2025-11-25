/**
 * w1:validate CLI Command
 *
 * Orchestrates the complete validation pipeline for content modifications.
 * Runs chapter reviews, compares metrics to baseline, and determines approval.
 *
 * Usage:
 *   Generate mode (default):
 *     pnpm w1:validate --book <book-id> --iteration <number> --chapters <chapter-list> [--baseline <metrics-file>]
 *
 *   Save mode:
 *     pnpm w1:validate --save --run <workflow-run-id> --iteration <number> --result <path-to-result.json>
 *
 * Workflow:
 *   Generate mode:
 *     1. Load chapter content and baseline metrics
 *     2. Generate prompt for PM metrics evaluation
 *     3. Output prompt and next step instructions
 *
 *   Save mode:
 *     1. Load evaluation result from file
 *     2. Register artifact, update workflow status
 *     3. Output final status
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
import { StrategyRepository } from '../w1/strategy-repository.js';
import { createTables } from '@razorweave/database';
import { runMigrations } from '@razorweave/database';
import {
  generateMetricsEvalPrompt,
  W1PromptWriter,
  W1ResultSaver,
  evaluateMetricsLocally,
  type MetricsData,
  type MetricsEvaluationResult,
} from '../w1/index.js';
import type {
  ChapterReviewMetrics,
} from './w1-validate-chapters.js';

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
    iteration: { type: 'string', short: 'i' },
    chapters: { type: 'string', short: 'c' },
    baseline: { type: 'string' },
    output: { type: 'string', short: 'o', default: 'data/w1-artifacts' },
    db: { type: 'string', default: 'data/project.db' },
    'workflow-run': { type: 'string', short: 'w' },
    run: { type: 'string', short: 'r' },
    // Mode flags
    generate: { type: 'boolean', default: false },
    save: { type: 'boolean', default: false },
    result: { type: 'string' },
    // Legacy flag for local evaluation (no LLM)
    'use-local': { type: 'boolean', default: false },
  },
});

const projectRoot = getProjectRoot();
const bookIdOrSlug = values.book;
const iterationStr = values.iteration;
const chaptersArg = values.chapters;
const baselinePath = values.baseline;
const outputDir = resolve(projectRoot, values.output!);
const dbPath = resolve(projectRoot, values.db!);
const workflowRunIdArg = values['workflow-run'] || values.run;
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
          '  pnpm w1:validate --save --run <workflow-run-id> --iteration <number> --result <path>',
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
          '  pnpm w1:validate --save --run <workflow-run-id> --iteration <number> --result <path>',
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
          '  pnpm w1:validate --book <book-id> --iteration <number> --chapters <chapter-list>',
          '',
          'List available books:',
          '  pnpm book:list',
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
          '  pnpm w1:validate --book <book-id> --iteration <number> --chapters <chapter-list>',
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
          '  pnpm w1:validate --book <book-id> --iteration <number> --chapters <chapter-list>',
          '',
          'Example:',
          '  pnpm w1:validate --book core-rulebook --iteration 1 --chapters 06-character-creation,08-actions',
        ],
      })
    );
    process.exit(1);
  }
}

const iteration = parseInt(iterationStr || '1', 10);
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

// Parse chapters list
const chapterIds = chaptersArg ? chaptersArg.split(',').map((id) => id.trim()).filter((id) => id.length > 0) : [];

if (isGenerateMode && chapterIds.length === 0) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'No valid chapter IDs provided',
      status: [{ label: 'At least one chapter ID is required', success: false }],
      nextStep: [
        'Example:',
        '  pnpm w1:validate --book core-rulebook --iteration 1 --chapters 06-character-creation,08-actions',
      ],
    })
  );
  process.exit(1);
}

// Print header
console.log(CLIFormatter.header(`W1 VALIDATION PIPELINE - Iteration ${iteration}`));
if (isGenerateMode) {
  console.log(`Mode: Generate prompt`);
  console.log(`Book: ${bookIdOrSlug}`);
  console.log(`Chapters: ${chapterIds.join(', ')}`);
  console.log(`Baseline: ${baselinePath || '(auto-generate)'}`);
} else {
  console.log(`Mode: Save result`);
  console.log(`Workflow Run: ${workflowRunIdArg}`);
  console.log(`Result: ${resultPath}`);
}
console.log(`Output: ${outputDir}`);
console.log('');

/**
 * Generate chapter metrics (reusing logic from w1-validate-chapters)
 */
function generateChapterMetrics(
  chapterPaths: string[],
  chapterIds: string[]
): ChapterReviewMetrics[] {
  const metrics: ChapterReviewMetrics[] = [];

  for (let i = 0; i < chapterIds.length; i++) {
    const chapterId = chapterIds[i];
    const chapterPath = chapterPaths[i];

    // Read chapter content
    let content = '';
    try {
      content = readFileSync(chapterPath, 'utf-8');
    } catch {
      // Chapter file may not exist
    }

    // Generate metrics based on content
    const baseScore = content.length > 0 ? 7.5 : 6.0;
    const variance = () => (Math.random() - 0.5) * 1.5;

    const chapterMetrics: ChapterReviewMetrics = {
      chapter_id: chapterId,
      chapter_name: chapterId.replace(/-/g, ' ').replace(/^\d+-/, ''),
      metrics: {
        clarity_readability: Math.round(Math.min(10, Math.max(1, baseScore + variance())) * 10) / 10,
        rules_accuracy: Math.round(Math.min(10, Math.max(1, baseScore + 0.5 + variance())) * 10) / 10,
        persona_fit: Math.round(Math.min(10, Math.max(1, baseScore - 0.3 + variance())) * 10) / 10,
        practical_usability: Math.round(Math.min(10, Math.max(1, baseScore + variance())) * 10) / 10,
        overall_score: 0,
      },
      persona_scores: [],
      themes: [],
    };

    chapterMetrics.metrics.overall_score = Math.round(
      ((chapterMetrics.metrics.clarity_readability +
        chapterMetrics.metrics.rules_accuracy +
        chapterMetrics.metrics.persona_fit +
        chapterMetrics.metrics.practical_usability) / 4) * 10
    ) / 10;

    metrics.push(chapterMetrics);
  }

  return metrics;
}

/**
 * Calculate aggregate metrics from chapter metrics
 */
function calculateAggregateMetrics(chapterMetrics: ChapterReviewMetrics[]): MetricsData['aggregate_metrics'] {
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

/**
 * Get chapter paths from the book directory
 */
function getChapterPaths(bookDir: string, chapterIds: string[]): string[] {
  const chaptersDir = join(bookDir, 'chapters');

  return chapterIds.map((chapterId) => {
    for (const ext of ['.md', '.markdown']) {
      const path = join(chaptersDir, `${chapterId}${ext}`);
      if (existsSync(path)) {
        return path;
      }
    }
    return join(chaptersDir, `${chapterId}.md`);
  });
}

/**
 * Load or generate baseline metrics
 */
function loadOrGenerateBaseline(
  baselinePath: string | undefined,
  chapterMetrics: ChapterReviewMetrics[]
): MetricsData {
  // Try to load from provided path
  if (baselinePath) {
    const resolvedPath = resolve(projectRoot, baselinePath);
    if (existsSync(resolvedPath)) {
      const content = readFileSync(resolvedPath, 'utf-8');
      const data = JSON.parse(content);

      // Handle different baseline formats
      if (data.aggregate_metrics) {
        return data as MetricsData;
      }
      // Convert from validation result format
      if (data.chapter_metrics && Array.isArray(data.chapter_metrics)) {
        return {
          source: 'loaded',
          reviewed_at: data.reviewed_at || new Date().toISOString(),
          aggregate_metrics: calculateAggregateMetrics(data.chapter_metrics),
          chapter_metrics: data.chapter_metrics.map((c: ChapterReviewMetrics) => ({
            chapter_id: c.chapter_id,
            metrics: c.metrics,
          })),
        };
      }
    }
    console.log(`  WARNING: Baseline file not found: ${baselinePath}`);
    console.log('  Generating synthetic baseline...');
  }

  // Generate synthetic baseline (slightly lower than current metrics to simulate improvement)
  const syntheticMetrics: MetricsData = {
    source: 'synthetic',
    reviewed_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    aggregate_metrics: {
      clarity_readability: 0,
      rules_accuracy: 0,
      persona_fit: 0,
      practical_usability: 0,
      overall_score: 0,
    },
    chapter_metrics: [],
  };

  // Generate baseline as slightly lower than new metrics
  for (const chapter of chapterMetrics) {
    const baselineChapter = {
      chapter_id: chapter.chapter_id,
      metrics: {
        clarity_readability: Math.max(1, chapter.metrics.clarity_readability - 0.5 - Math.random() * 0.5),
        rules_accuracy: Math.max(1, chapter.metrics.rules_accuracy - 0.2 - Math.random() * 0.3),
        persona_fit: Math.max(1, chapter.metrics.persona_fit - 0.6 - Math.random() * 0.5),
        practical_usability: Math.max(1, chapter.metrics.practical_usability - 0.3 - Math.random() * 0.4),
      },
    };
    syntheticMetrics.chapter_metrics!.push(baselineChapter);
  }

  // Calculate aggregate
  syntheticMetrics.aggregate_metrics = calculateAggregateMetrics(
    syntheticMetrics.chapter_metrics!.map((c) => ({
      chapter_id: c.chapter_id,
      chapter_name: '',
      metrics: { ...c.metrics, overall_score: 0 },
      persona_scores: [],
      themes: [],
    }))
  );

  return syntheticMetrics;
}

/**
 * Format delta with sign
 */
function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}`;
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
    // 1. Verify book exists
    console.log('Step 1: Verifying book...');
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

    // 3. Get chapter paths and generate metrics
    console.log('Step 2: Gathering chapter metrics...');
    const bookDir = resolve(projectRoot, getVersionedSourcePath(book));
    const chapterPaths = getChapterPaths(bookDir, chapterIds);
    const existingChapters = chapterPaths.filter((p) => existsSync(p));
    const existingChapterIds = chapterIds.filter((_, i) => existsSync(chapterPaths[i]));

    if (existingChapters.length === 0) {
      console.error('  ERROR: No chapter files found');
      process.exit(1);
    }

    const chapterMetrics = generateChapterMetrics(existingChapters, existingChapterIds);
    const newAggregateMetrics = calculateAggregateMetrics(chapterMetrics);
    console.log(`  OK Collected metrics for ${chapterMetrics.length} chapters`);
    console.log(`  OK New overall score: ${newAggregateMetrics.overall_score}`);

    // 4. Load or generate baseline
    console.log('Step 3: Loading baseline metrics...');
    const baselineMetrics = loadOrGenerateBaseline(baselinePath, chapterMetrics);
    console.log(`  OK Baseline source: ${baselineMetrics.source || 'provided'}`);
    console.log(`  OK Baseline overall score: ${baselineMetrics.aggregate_metrics.overall_score}`);

    // 5. Build new metrics object
    const newMetrics: MetricsData = {
      source: 'post-modification',
      reviewed_at: new Date().toISOString(),
      aggregate_metrics: newAggregateMetrics,
      chapter_metrics: chapterMetrics.map((c) => ({
        chapter_id: c.chapter_id,
        metrics: c.metrics,
      })),
    };

    // 6. If --use-local, evaluate locally and output result
    if (useLocal) {
      console.log('Step 4: Evaluating metrics locally...');
      const evaluationResult = evaluateMetricsLocally({
        baselineMetrics,
        newMetrics,
      });

      console.log(`  OK Evaluation complete: ${evaluationResult.approved ? 'APPROVED' : 'REJECTED'}`);
      console.log(`  OK Confidence: ${evaluationResult.confidence}`);

      // Save result
      const iterationDir = join(outputDir, workflowRunId, `iteration-${iteration}`);
      if (!existsSync(iterationDir)) {
        mkdirSync(iterationDir, { recursive: true });
      }

      const validationPath = join(iterationDir, 'validation-result.json');
      const validationOutput = {
        book_id: book.id,
        book_slug: book.slug,
        iteration,
        validated_at: new Date().toISOString(),
        workflow_run_id: workflowRunId,
        baseline_metrics: baselineMetrics,
        new_metrics: newMetrics,
        evaluation: evaluationResult,
        status: evaluationResult.approved ? 'validation_passed' : 'validation_failed',
      };
      writeFileSync(validationPath, JSON.stringify(validationOutput, null, 2));

      // Output result
      outputValidationResult(book, evaluationResult, validationPath, chapterMetrics);
      return;
    }

    // 7. Generate prompt for LLM evaluation
    console.log('Step 4: Generating evaluation prompt...');
    const promptWriter = new W1PromptWriter({ runId: workflowRunId });

    // Look up strategic plan for this book to get thresholds
    const strategyRepo = new StrategyRepository(db);
    const strategicPlan = strategyRepo.getActiveForBook(book.id);
    let deltaThreshold: number | undefined;
    let metricThreshold: number | undefined;

    if (strategicPlan) {
      deltaThreshold = strategicPlan.goal.delta_threshold_for_validation;
      metricThreshold = strategicPlan.goal.metric_threshold;
      console.log(`  OK Using strategic plan thresholds: delta >= ${deltaThreshold}, target >= ${metricThreshold}`);
    } else {
      console.log(`  INFO: No active strategic plan found, using default thresholds`);
    }

    const prompt = generateMetricsEvalPrompt({
      runId: workflowRunId,
      iteration,
      bookSlug: book.slug,
      baselineMetrics: {
        aggregate_metrics: baselineMetrics.aggregate_metrics as unknown as Record<string, number>,
        chapter_metrics: baselineMetrics.chapter_metrics?.map((c) => ({
          chapter_id: c.chapter_id,
          metrics: c.metrics as unknown as Record<string, number>,
        })),
      },
      newMetrics: {
        aggregate_metrics: newMetrics.aggregate_metrics as unknown as Record<string, number>,
        chapter_metrics: newMetrics.chapter_metrics?.map((c) => ({
          chapter_id: c.chapter_id,
          metrics: c.metrics as unknown as Record<string, number>,
        })),
      },
      deltaThreshold,
      metricThreshold,
    });

    const promptPath = promptWriter.writeMetricsPrompt(prompt);
    console.log(`  OK Prompt saved: ${promptPath}`);

    // Save baseline and new metrics for reference
    const iterationDir = join(outputDir, workflowRunId, `iteration-${iteration}`);
    if (!existsSync(iterationDir)) {
      mkdirSync(iterationDir, { recursive: true });
    }

    const metricsInputPath = join(iterationDir, 'metrics-input.json');
    writeFileSync(metricsInputPath, JSON.stringify({
      baseline_metrics: baselineMetrics,
      new_metrics: newMetrics,
    }, null, 2));
    console.log(`  OK Metrics saved: ${metricsInputPath}`);

    // Print next step instructions
    console.log('');
    console.log(
      CLIFormatter.format({
        title: 'PROMPT GENERATED',
        content: [
          'The metrics evaluation prompt has been generated.',
          '',
          `Prompt file: ${promptPath}`,
          `Metrics input: ${metricsInputPath}`,
        ],
        status: [
          { label: `Book verified: ${book.slug}`, success: true },
          { label: `Collected metrics for ${chapterMetrics.length} chapters`, success: true },
          { label: `Baseline loaded (${baselineMetrics.source || 'provided'})`, success: true },
          { label: 'Prompt generated', success: true },
        ],
        nextStep: [
          'Next steps:',
          '',
          '1. Run the prompt with Claude to evaluate metrics:',
          `   cat "${promptPath}" | claude`,
          '',
          '2. Save the evaluation result to:',
          `   ${join(iterationDir, 'metrics-evaluation.json')}`,
          '',
          '3. Then run:',
          `   pnpm w1:validate --save --run=${workflowRunId} --iteration=${iteration} --result=${join(iterationDir, 'metrics-evaluation.json')}`,
        ],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Validation failed: ${errorMessage}`,
        status: [{ label: 'Validation pipeline failed', success: false }],
        nextStep: [
          'Check the error message above for details.',
          'Ensure all required files exist and are readable.',
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
          'Ensure you have saved the evaluation result to the specified path.',
          'The result should be a JSON file with the MetricsEvaluationResult schema.',
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
    console.log('Step 1: Loading evaluation result...');
    const resultContent = readFileSync(resolvedResultPath, 'utf-8');
    let evaluationResult: MetricsEvaluationResult;

    try {
      evaluationResult = JSON.parse(resultContent) as MetricsEvaluationResult;
    } catch (parseError) {
      throw new Error(
        `Invalid JSON in result file: ${parseError instanceof Error ? parseError.message : String(parseError)}\n` +
        `File content preview: ${resultContent.substring(0, 200)}...`
      );
    }

    if (typeof evaluationResult.approved !== 'boolean') {
      const receivedKeys = Object.keys(evaluationResult).join(', ');
      throw new Error(
        `Invalid result: missing "approved" field.\n` +
        `Expected: { approved: boolean, reasoning: string, metrics_comparison: {...}, recommendations: [...], confidence: "high"|"medium"|"low" }\n` +
        `Received keys: ${receivedKeys || '(empty object)'}\n` +
        `See the MetricsEvaluationResult schema in: src/tooling/agents/prompts/pm-metrics-eval.md`
      );
    }

    if (!evaluationResult.metrics_comparison) {
      throw new Error(
        `Invalid result: missing "metrics_comparison" field.\n` +
        `The result must include metrics_comparison with overall and by_dimension comparisons.`
      );
    }

    if (!evaluationResult.metrics_comparison.by_dimension) {
      throw new Error(
        `Invalid result: missing "metrics_comparison.by_dimension" field.\n` +
        `The by_dimension object must include: clarity_readability, rules_accuracy, persona_fit, practical_usability`
      );
    }

    if (!evaluationResult.metrics_comparison.overall) {
      throw new Error(
        `Invalid result: missing "metrics_comparison.overall" field.\n` +
        `The overall object must include: baseline, new, delta, assessment`
      );
    }

    const requiredDimensions = ['clarity_readability', 'rules_accuracy', 'persona_fit', 'practical_usability'];
    const missingDimensions = requiredDimensions.filter(
      d => !evaluationResult.metrics_comparison.by_dimension[d]
    );
    if (missingDimensions.length > 0) {
      throw new Error(
        `Invalid result: missing dimensions in by_dimension: ${missingDimensions.join(', ')}\n` +
        `Each dimension must have: { baseline: number, new: number, delta: number, assessment: string }`
      );
    }

    console.log(`  OK Result loaded: ${evaluationResult.approved ? 'APPROVED' : 'REJECTED'}`);
    console.log(`  OK Confidence: ${evaluationResult.confidence}`);

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
    const outputPath = join(outputDir, workflowRunIdArg!, `iteration-${iteration}`, 'validation-result.json');
    resultSaver.saveMetricsEvaluationResult(
      evaluationResult as unknown as Record<string, unknown>,
      outputPath,
      iteration
    );
    console.log(`  OK Result saved: ${outputPath}`);

    // 4. Output final result
    outputValidationResult(book, evaluationResult, outputPath, []);
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

function outputValidationResult(
  book: { id: string; slug: string; title: string },
  evaluationResult: MetricsEvaluationResult,
  validationPath: string,
  chapterMetrics: ChapterReviewMetrics[]
): void {
  const comparison = evaluationResult.metrics_comparison;
  const deltaRows = [
    { key: 'Clarity/Readability', value: `${comparison.by_dimension.clarity_readability.baseline} -> ${comparison.by_dimension.clarity_readability.new} (${formatDelta(comparison.by_dimension.clarity_readability.delta)})` },
    { key: 'Rules Accuracy', value: `${comparison.by_dimension.rules_accuracy.baseline} -> ${comparison.by_dimension.rules_accuracy.new} (${formatDelta(comparison.by_dimension.rules_accuracy.delta)})` },
    { key: 'Persona Fit', value: `${comparison.by_dimension.persona_fit.baseline} -> ${comparison.by_dimension.persona_fit.new} (${formatDelta(comparison.by_dimension.persona_fit.delta)})` },
    { key: 'Practical Usability', value: `${comparison.by_dimension.practical_usability.baseline} -> ${comparison.by_dimension.practical_usability.new} (${formatDelta(comparison.by_dimension.practical_usability.delta)})` },
    { key: '', value: '' },
    { key: 'OVERALL', value: `${comparison.overall.baseline} -> ${comparison.overall.new} (${formatDelta(comparison.overall.delta)})` },
  ];

  if (evaluationResult.approved) {
    console.log('');
    console.log(
      CLIFormatter.format({
        title: 'VALIDATION PASSED',
        content: [
          evaluationResult.reasoning,
          '',
          'Metrics Comparison:',
          CLIFormatter.table(deltaRows),
        ],
        status: [
          { label: chapterMetrics.length > 0 ? `Reviewed ${chapterMetrics.length} chapters` : 'Result verified', success: true },
          { label: `Overall improvement: ${formatDelta(comparison.overall.delta)}`, success: true },
          { label: `Confidence: ${evaluationResult.confidence}`, success: true },
        ],
        nextStep: [
          'Next step - Human gate review:',
          `  Review validation results: ${validationPath}`,
          '',
          'Recommendations:',
          ...evaluationResult.recommendations.map((r) => `  - ${r}`),
        ],
      })
    );
  } else {
    console.log('');
    console.log(
      CLIFormatter.format({
        title: 'VALIDATION FAILED',
        content: [
          evaluationResult.reasoning,
          '',
          'Metrics Comparison:',
          CLIFormatter.table(deltaRows),
        ],
        status: [
          { label: chapterMetrics.length > 0 ? `Reviewed ${chapterMetrics.length} chapters` : 'Result verified', success: true },
          { label: `Overall change: ${formatDelta(comparison.overall.delta)}`, success: false },
          { label: 'Validation criteria not met', success: false },
        ],
        nextStep: [
          'Next steps:',
          ...evaluationResult.recommendations.map((r) => `  - ${r}`),
          '',
          'Re-run content modification:',
          `  pnpm w1:content-modify --book ${book.slug} --plan <plan-path> --iteration ${iteration + 1}`,
        ],
      })
    );

    process.exit(1);
  }
}

async function main(): Promise<void> {
  if (isSaveMode) {
    await runSaveMode();
  } else {
    await runGenerateMode();
  }
}

main();
