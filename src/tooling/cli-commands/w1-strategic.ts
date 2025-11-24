/**
 * w1:strategic CLI Command
 *
 * Creates or resumes a strategic W1 editing workflow.
 *
 * Usage:
 *   pnpm w1:strategic --book <slug> --fresh              # Fresh review + strategic plan
 *   pnpm w1:strategic --book <slug> --analysis <path>    # Use existing analysis
 *   pnpm w1:strategic --resume <plan-id>                 # Resume existing plan
 *   pnpm w1:strategic --list                             # List strategic plans
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';
import { StrategyRepository } from '../w1/strategy-repository.js';
import {
  generateStrategyPrompt,
  generateFreshWorkflowPrompt,
  generateRunOrchestratorPrompt,
} from '../w1/prompt-generator.js';
import { generateAreasFromAnalysis } from '../w1/area-generator.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import type { CreateStrategicPlanInput, StrategyGoal, AnalysisForAreaGeneration } from '../w1/strategy-types.js';

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
    book: { type: 'string', short: 'b' },
    fresh: { type: 'boolean', short: 'f' },
    analysis: { type: 'string', short: 'a' },
    resume: { type: 'string', short: 'r' },
    list: { type: 'boolean', short: 'l' },
    'metric-threshold': { type: 'string', default: '8.0' },
    'max-cycles': { type: 'string', default: '3' },
    'max-runs': { type: 'string', default: '3' },
    'delta-threshold': { type: 'string', default: '1.0' },
    'use-dynamic-deltas': { type: 'boolean', default: true },
    'max-areas': { type: 'string', default: '6' },
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
      title: 'W1 STRATEGIC WORKFLOW',
      content: 'Create or resume a strategic W1 editing workflow with persistent state.',
      nextStep: [
        'Usage:',
        '  pnpm w1:strategic --book <slug> --fresh              # Fresh review + strategic plan',
        '  pnpm w1:strategic --book <slug> --analysis <path>    # Use existing analysis',
        '  pnpm w1:strategic --resume <plan-id>                 # Resume existing plan',
        '  pnpm w1:strategic --list [--book <slug>]             # List strategic plans',
        '',
        'Options:',
        '  --book, -b           Book slug (required for new plans)',
        '  --fresh, -f          Run full review + analyze pipeline (takes time)',
        '  --analysis, -a       Path to existing analysis file (JSON or markdown)',
        '  --resume, -r         Resume existing plan by ID',
        '  --list, -l           List strategic plans',
        '  --metric-threshold   Target metric score (default: 8.0)',
        '  --max-cycles         Max cycles per improvement area (default: 3)',
        '  --max-runs           Max parallel run iterations (default: 3)',
        '  --max-areas          Max improvement areas to generate (default: 6)',
        '  --delta-threshold    Delta required for validation (default: 1.0)',
        '  --use-dynamic-deltas Scale delta by score level (default: true)',
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
const strategyRepo = new StrategyRepository(db);

// Handle --list
if (values.list) {
  const filters = values.book ? { bookId: bookRepo.getBySlug(values.book)?.id } : undefined;
  const plans = strategyRepo.list(filters);

  if (plans.length === 0) {
    console.log(
      CLIFormatter.format({
        title: 'STRATEGIC PLANS',
        content: 'No strategic plans found.',
        nextStep: [
          'Create a new plan:',
          '  pnpm w1:strategic --book <slug> --fresh',
          '  pnpm w1:strategic --book <slug> --analysis <path>',
        ],
      })
    );
  } else {
    const rows = plans.map(p => ({
      key: p.id,
      value: `${p.book_slug} | ${p.status} | ${p.state.current_phase} | run ${p.state.current_run}/${p.state.max_runs} | areas: ${p.areas.length}`,
    }));

    console.log(
      CLIFormatter.format({
        title: 'STRATEGIC PLANS',
        content: CLIFormatter.table(rows),
        nextStep: [
          'Resume a plan:',
          '  pnpm w1:strategic --resume <plan-id>',
        ],
      })
    );
  }

  db.close();
  process.exit(0);
}

// Handle --resume
if (values.resume) {
  const plan = strategyRepo.getById(values.resume);

  if (!plan) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Strategic plan not found: ${values.resume}`,
        status: [{ label: 'Plan not found', success: false }],
        nextStep: ['List available plans:', '  pnpm w1:strategic --list'],
      })
    );
    db.close();
    process.exit(1);
  }

  const book = bookRepo.getById(plan.book_id);
  if (!book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Book not found for plan: ${plan.book_id}`,
        status: [{ label: 'Book not found', success: false }],
      })
    );
    db.close();
    process.exit(1);
  }

  const artifactsDir = resolve(projectRoot, `data/w1-strategic/${plan.id}`);

  // Generate the prompt
  const prompt = generateStrategyPrompt({
    planId: plan.id,
    bookSlug: book.slug,
    bookTitle: book.title,
    artifactsDir,
    isResume: true,
  });

  // Count area statuses
  const pendingAreas = plan.areas.filter(a => a.status === 'pending').length;
  const inProgressAreas = plan.areas.filter(a => a.status === 'in_progress').length;
  const completedAreas = plan.areas.filter(a => a.status === 'completed').length;

  console.log(
    CLIFormatter.format({
      title: 'STRATEGIC PLAN RESUMED',
      content: [
        `Plan ID: ${plan.id}`,
        `Book: ${book.title} (${book.slug})`,
        `Status: ${plan.status}`,
        `Phase: ${plan.state.current_phase}`,
        `Run: ${plan.state.current_run}/${plan.state.max_runs}`,
        `Areas: ${completedAreas} done, ${inProgressAreas} in progress, ${pendingAreas} pending`,
        `Cumulative Delta: ${plan.state.cumulative_delta.toFixed(2)}`,
      ].join('\n'),
      status: [
        { label: 'Plan loaded', success: true },
        { label: `Phase: ${plan.state.current_phase}`, pending: true },
      ],
    })
  );

  console.log('\n' + '─'.repeat(60) + '\n');
  console.log('PROMPT TO EXECUTE:\n');
  console.log(prompt);

  db.close();
  process.exit(0);
}

// Create new plan - requires --book and either --fresh or --analysis
if (!values.book) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --book <slug>',
      status: [{ label: 'Book slug required', success: false }],
      nextStep: [
        'Usage:',
        '  pnpm w1:strategic --book <slug> --fresh',
        '  pnpm w1:strategic --book <slug> --analysis <path>',
      ],
    })
  );
  db.close();
  process.exit(1);
}

if (!values.fresh && !values.analysis) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Must specify either --fresh or --analysis <path>',
      status: [{ label: 'Missing mode', success: false }],
      nextStep: [
        'Options:',
        '  --fresh              Run fresh review analysis',
        '  --analysis <path>    Use existing analysis file',
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

// Load or create analysis
let analysisPath: string | undefined;
let analysisContent: string;

if (values.analysis) {
  analysisPath = resolve(projectRoot, values.analysis);
  if (!existsSync(analysisPath)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Analysis file not found: ${analysisPath}`,
        status: [{ label: 'File not found', success: false }],
      })
    );
    db.close();
    process.exit(1);
  }
  analysisContent = readFileSync(analysisPath, 'utf-8');
} else {
  // --fresh: Generate prompt that includes review + analyze steps
  const freshPrompt = generateFreshWorkflowPrompt({
    bookSlug: book.slug,
    bookTitle: book.title,
    metricThreshold: parseFloat(values['metric-threshold'] || '8.0'),
    maxCycles: parseInt(values['max-cycles'] || '3', 10),
    deltaThreshold: parseFloat(values['delta-threshold'] || '1.0'),
  });

  console.log(
    CLIFormatter.format({
      title: 'FRESH W1 STRATEGIC WORKFLOW',
      content: [
        `Book: ${book.title} (${book.slug})`,
        '',
        'This prompt will guide Claude Code through:',
        '  1. Running persona reviews',
        '  2. Analyzing reviews',
        '  3. Creating strategic plan',
        '  4. Executing W1 editing workflow',
      ].join('\n'),
      status: [{ label: 'Prompt generated', success: true }],
    })
  );

  console.log('\n' + '─'.repeat(60) + '\n');
  console.log('PROMPT TO EXECUTE:\n');
  console.log(freshPrompt);

  db.close();
  process.exit(0);
}

// Parse config from CLI options
const metricThreshold = parseFloat(values['metric-threshold'] || '8.0');
const maxCycles = parseInt(values['max-cycles'] || '3', 10);
const maxRuns = parseInt(values['max-runs'] || '3', 10);
const deltaThreshold = parseFloat(values['delta-threshold'] || '1.0');
const useDynamicDeltas = values['use-dynamic-deltas'] !== false;
const maxAreas = parseInt(values['max-areas'] || '6', 10);

// Create goal configuration
const goal: StrategyGoal = {
  metric_threshold: metricThreshold,
  primary_dimension: 'overall_score',
  max_cycles: maxCycles,
  max_runs: maxRuns,
  delta_threshold_for_validation: deltaThreshold,
  use_dynamic_deltas: useDynamicDeltas,
};

// Parse analysis and generate improvement areas
let analysisData: AnalysisForAreaGeneration | null = null;

// Try to parse analysis as JSON first
try {
  if (analysisPath?.endsWith('.json')) {
    const analysisJson = JSON.parse(analysisContent);
    if (analysisJson.priority_rankings) {
      analysisData = {
        priority_rankings: analysisJson.priority_rankings.map((r: Record<string, unknown>) => ({
          category: String(r.category || 'unknown'),
          severity: Number(r.severity ?? r.score ?? 5),
          frequency: Number(r.frequency ?? r.count ?? 1),
          affected_chapters: Array.isArray(r.affected_chapters) ? r.affected_chapters : [],
          affected_personas: Array.isArray(r.affected_personas) ? r.affected_personas : undefined,
          description: r.description ? String(r.description) : undefined,
        })),
        dimension_summaries: analysisJson.dimension_summaries ?? {},
        persona_breakdowns: analysisJson.persona_breakdowns,
      };
    }
  }
} catch {
  // Not JSON, will try markdown below
}

// Try markdown parsing if JSON failed
if (!analysisData) {
  // Extract priority rankings from markdown structure
  const rankingMatch = analysisContent.match(/## Priority Rankings?\n([\s\S]*?)(?=\n## |$)/i);
  if (rankingMatch) {
    const rankings: AnalysisForAreaGeneration['priority_rankings'] = [];
    const lines = rankingMatch[1].split('\n');
    let currentCategory = '';
    let currentSeverity = 5;

    for (const line of lines) {
      const categoryMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1];
        // Try to extract severity from the line
        const sevMatch = line.match(/severity[:\s]+(\d+)/i);
        currentSeverity = sevMatch ? parseInt(sevMatch[1], 10) : 5;

        rankings.push({
          category: currentCategory,
          severity: currentSeverity,
          frequency: 1,
          affected_chapters: [],
        });
      }
    }

    if (rankings.length > 0) {
      analysisData = {
        priority_rankings: rankings,
        dimension_summaries: {},
      };
    }
  }
}

// Generate areas from analysis data, or fall back to default
let areas;
if (analysisData && analysisData.priority_rankings.length > 0) {
  areas = generateAreasFromAnalysis(analysisData, {
    maxAreas,
    maxCyclesPerArea: maxCycles,
  });
  console.log(CLIFormatter.format({
    title: 'AREAS GENERATED',
    content: `Generated ${areas.length} improvement areas from analysis`,
    status: areas.map(a => ({ label: `${a.name} (${a.target_chapters.length} chapters)`, success: true })),
  }));
} else {
  // Fall back to default area if parsing fails
  areas = [{
    area_id: 'area-general',
    name: 'General Improvements',
    type: 'issue_category' as const,
    description: 'Address issues identified in the analysis',
    target_chapters: [],
    target_issues: [],
    priority: 1,
    max_cycles: maxCycles,
  }];
  console.log(CLIFormatter.format({
    title: 'AREAS GENERATED',
    content: 'Could not parse specific areas from analysis, using general improvement area',
    status: [{ label: 'General Improvements', pending: true }],
  }));
}

// Create the strategic plan
const planInput: CreateStrategicPlanInput = {
  book_id: book.id,
  book_slug: book.slug,
  source_analysis_path: analysisPath,
  goal,
  areas,
};

const plan = strategyRepo.create(planInput);

// Create artifacts directory and save files
const artifactsDir = resolve(projectRoot, `data/w1-strategic/${plan.id}`);
mkdirSync(artifactsDir, { recursive: true });

// Save strategy.json
writeFileSync(
  join(artifactsDir, 'strategy.json'),
  JSON.stringify(
    {
      id: plan.id,
      book_id: plan.book_id,
      book_slug: plan.book_slug,
      goal: plan.goal,
      areas: plan.areas,
      source_analysis_path: plan.source_analysis_path,
      created_at: plan.created_at,
    },
    null,
    2
  )
);

// Save state.json
writeFileSync(join(artifactsDir, 'state.json'), JSON.stringify(plan.state, null, 2));

// Copy analysis file for reference
if (analysisPath) {
  writeFileSync(join(artifactsDir, 'source-analysis.md'), analysisContent);
}

// Generate the prompt - use parallel orchestrator for multiple areas, legacy for single
let prompt: string;
if (areas.length > 1) {
  // Multiple areas: use parallel run orchestrator
  prompt = generateRunOrchestratorPrompt({
    planId: plan.id,
    workflowRunId: plan.workflow_run_id || '{workflow_run_id}',
    bookSlug: book.slug,
    bookTitle: book.title,
    artifactsDir,
    currentRun: plan.state.current_run,
    maxRuns: goal.max_runs,
    areas: plan.areas,
    metricThreshold: goal.metric_threshold,
    useDynamicDeltas: goal.use_dynamic_deltas,
  });
} else {
  // Single area: use legacy sequential prompt
  prompt = generateStrategyPrompt({
    planId: plan.id,
    bookSlug: book.slug,
    bookTitle: book.title,
    artifactsDir,
    isResume: false,
  });
}

console.log(
  CLIFormatter.format({
    title: 'STRATEGIC PLAN CREATED',
    content: [
      `Plan ID: ${plan.id}`,
      `Book: ${book.title} (${book.slug})`,
      `Goal: ${goal.primary_dimension} >= ${goal.metric_threshold}`,
      `Max Runs: ${goal.max_runs} (parallel execution batches)`,
      `Max Cycles per Area: ${goal.max_cycles}`,
      `Delta Threshold: ${goal.delta_threshold_for_validation}${goal.use_dynamic_deltas ? ' (dynamic scaling enabled)' : ''}`,
      `Improvement Areas: ${areas.length}`,
      '',
      'Areas:',
      ...areas.map(a => `  • ${a.name} (${a.target_chapters.length} chapters, priority ${a.priority})`),
      '',
      `Artifacts: ${artifactsDir}`,
    ].join('\n'),
    status: [
      { label: 'Plan created', success: true },
      { label: 'Artifacts saved', success: true },
      { label: `${areas.length} areas ready for parallel execution`, pending: true },
    ],
  })
);

console.log('\n' + '─'.repeat(60) + '\n');
console.log('PROMPT TO EXECUTE:\n');
console.log(prompt);

db.close();
