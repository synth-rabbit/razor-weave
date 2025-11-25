/**
 * w1:strategic CLI Command
 *
 * Creates or resumes a strategic W1 editing workflow using PM Agent planning.
 *
 * Usage:
 *   pnpm w1:strategic --book <slug> --analysis <path>    # Generate PM planning prompt
 *   pnpm w1:strategic --save-plan <plan.json> --book <slug>  # Save AI-generated plan
 *   pnpm w1:strategic --resume <plan-id>                 # Resume existing plan
 *   pnpm w1:strategic --list                             # List strategic plans
 *   pnpm w1:strategic --book <slug> --fresh              # Full workflow with reviews
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
import { createTables } from '@razorweave/database';
import { runMigrations } from '@razorweave/database';
import type { CreateStrategicPlanInput, StrategyGoal, ImprovementArea } from '../w1/strategy-types.js';

// Valid primary dimension values for StrategyGoal
type PrimaryDimension = 'clarity_readability' | 'rules_accuracy' | 'persona_fit' | 'practical_usability' | 'overall_score';
const VALID_DIMENSIONS: PrimaryDimension[] = ['clarity_readability', 'rules_accuracy', 'persona_fit', 'practical_usability', 'overall_score'];

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
    book: { type: 'string', short: 'b' },
    fresh: { type: 'boolean', short: 'f' },
    analysis: { type: 'string', short: 'a' },
    'save-plan': { type: 'string', short: 's' },
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
      content: 'Create or resume a strategic W1 editing workflow using PM Agent planning.',
      nextStep: [
        'Usage:',
        '  pnpm w1:strategic --book <slug> --analysis <path>       # Generate PM planning prompt',
        '  pnpm w1:strategic --save-plan <plan.json> --book <slug> # Save AI-generated plan',
        '  pnpm w1:strategic --resume <plan-id>                    # Resume existing plan',
        '  pnpm w1:strategic --list [--book <slug>]                # List strategic plans',
        '  pnpm w1:strategic --book <slug> --fresh                 # Full workflow with reviews',
        '',
        'Options:',
        '  --book, -b           Book slug (required for new plans)',
        '  --analysis, -a       Path to analysis file (generates PM prompt)',
        '  --save-plan, -s      Path to AI-generated plan JSON (saves to DB)',
        '  --fresh, -f          Run full review + analyze pipeline',
        '  --resume, -r         Resume existing plan by ID',
        '  --list, -l           List strategic plans',
        '  --metric-threshold   Target metric score (default: 8.0)',
        '  --max-cycles         Max cycles per improvement area (default: 3)',
        '  --max-runs           Max parallel run iterations (default: 3)',
        '  --max-areas          Max improvement areas (default: 6)',
        '  --delta-threshold    Delta required for validation (default: 1.0)',
        '  --use-dynamic-deltas Scale delta by score level (default: true)',
        '',
        'Workflow:',
        '  1. pnpm w1:strategic --book <slug> --analysis <path>',
        '     → Generates PM planning prompt',
        '  2. Execute the prompt with Claude (creates plan.json)',
        '  3. pnpm w1:strategic --save-plan <plan.json> --book <slug>',
        '     → Saves plan, outputs execution prompt',
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

// Handle --save-plan: Convert AI-generated plan to strategic plan and save
if (values['save-plan']) {
  if (!values.book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Missing required argument: --book <slug>',
        status: [{ label: 'Book slug required for saving plan', success: false }],
      })
    );
    db.close();
    process.exit(1);
  }

  const book = bookRepo.getBySlug(values.book);
  if (!book) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Book not found: ${values.book}`,
        status: [{ label: 'Book not found', success: false }],
      })
    );
    db.close();
    process.exit(1);
  }

  const planPath = resolve(projectRoot, values['save-plan']);
  if (!existsSync(planPath)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Plan file not found: ${planPath}`,
        status: [{ label: 'File not found', success: false }],
      })
    );
    db.close();
    process.exit(1);
  }

  // Load the AI-generated plan
  let pmPlan: PMAgentPlan;
  try {
    pmPlan = JSON.parse(readFileSync(planPath, 'utf-8'));
  } catch (error) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Failed to parse plan JSON: ${error instanceof Error ? error.message : String(error)}`,
        status: [{ label: 'Invalid JSON', success: false }],
      })
    );
    db.close();
    process.exit(1);
  }

  // Validate required fields
  if (!pmPlan.chapter_modifications || !Array.isArray(pmPlan.chapter_modifications)) {
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: 'Plan missing required field: chapter_modifications[]',
        status: [{ label: 'Invalid plan structure', success: false }],
      })
    );
    db.close();
    process.exit(1);
  }

  // Parse config from CLI options
  const metricThreshold = parseFloat(values['metric-threshold'] || '8.0');
  const maxCycles = parseInt(values['max-cycles'] || '3', 10);
  const maxRuns = parseInt(values['max-runs'] || '3', 10);
  const deltaThreshold = parseFloat(values['delta-threshold'] || '1.0');
  const useDynamicDeltas = values['use-dynamic-deltas'] !== false;
  const maxAreas = parseInt(values['max-areas'] || '6', 10);

  // Convert PM plan to strategic areas
  const areas = convertPMPlanToAreas(pmPlan, maxCycles, maxAreas);

  // Parse and validate primary dimension
  const rawDimension = pmPlan.estimated_impact?.primary_dimension;
  const primaryDimension: PrimaryDimension =
    rawDimension && VALID_DIMENSIONS.includes(rawDimension as PrimaryDimension)
      ? (rawDimension as PrimaryDimension)
      : 'overall_score';

  // Create goal configuration
  const goal: StrategyGoal = {
    metric_threshold: metricThreshold,
    primary_dimension: primaryDimension,
    max_cycles: maxCycles,
    max_runs: maxRuns,
    delta_threshold_for_validation: deltaThreshold,
    use_dynamic_deltas: useDynamicDeltas,
  };

  // Create the strategic plan
  const planInput: CreateStrategicPlanInput = {
    book_id: book.id,
    book_slug: book.slug,
    source_analysis_path: planPath,
    goal,
    areas,
  };

  const plan = strategyRepo.create(planInput);

  // Create artifacts directory and save files
  const artifactsDir = resolve(projectRoot, `data/w1-strategic/${plan.id}`);
  mkdirSync(artifactsDir, { recursive: true });

  // Save strategy.json (includes the full PM plan for reference)
  writeFileSync(
    join(artifactsDir, 'strategy.json'),
    JSON.stringify(
      {
        id: plan.id,
        book_id: plan.book_id,
        book_slug: plan.book_slug,
        goal: plan.goal,
        areas: plan.areas,
        source_pm_plan: pmPlan,
        created_at: plan.created_at,
      },
      null,
      2
    )
  );

  // Save state.json
  writeFileSync(join(artifactsDir, 'state.json'), JSON.stringify(plan.state, null, 2));

  // Save the original PM plan for reference
  writeFileSync(join(artifactsDir, 'pm-plan.json'), JSON.stringify(pmPlan, null, 2));

  // Generate the execution prompt
  let prompt: string;
  if (areas.length > 1) {
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
      title: 'STRATEGIC PLAN CREATED FROM PM AGENT OUTPUT',
      content: [
        `Plan ID: ${plan.id}`,
        `Source: ${pmPlan.plan_id || 'AI-generated'}`,
        `Book: ${book.title} (${book.slug})`,
        `Summary: ${pmPlan.summary || 'No summary'}`,
        `Goal: ${goal.primary_dimension} >= ${goal.metric_threshold}`,
        `Improvement Areas: ${areas.length}`,
        '',
        'Areas:',
        ...areas.map(a => `  • ${a.name} (${a.target_chapters.length} chapters, ${a.target_issues.length} issues)`),
        '',
        `Artifacts: ${artifactsDir}`,
      ].join('\n'),
      status: [
        { label: 'PM plan loaded', success: true },
        { label: 'Strategic plan created', success: true },
        { label: 'Artifacts saved', success: true },
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
        '  pnpm w1:strategic --book <slug> --analysis <path>',
        '  pnpm w1:strategic --book <slug> --fresh',
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
        '  --analysis <path>    Generate PM planning prompt from analysis',
        '  --fresh              Run full review + analyze pipeline',
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

// Handle --fresh: Generate full workflow prompt
if (values.fresh) {
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
        '  2. Collecting review results',
        '  3. Analyzing reviews',
        '  4. PM Agent planning',
        '  5. Executing W1 editing workflow',
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

// Handle --analysis: Generate PM planning prompt
const analysisPath = resolve(projectRoot, values.analysis!);
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

const analysisContent = readFileSync(analysisPath, 'utf-8');

// Generate PM planning prompt
const pmPrompt = generatePMPlanningPrompt({
  bookId: book.id,
  bookSlug: book.slug,
  bookTitle: book.title,
  analysisContent,
  analysisPath,
  metricThreshold: parseFloat(values['metric-threshold'] || '8.0'),
  maxChapters: parseInt(values['max-areas'] || '6', 10),
});

// Create output directory for the prompt
const promptsDir = resolve(projectRoot, 'data/w1-prompts');
mkdirSync(promptsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const promptPath = join(promptsDir, `pm-planning-${book.slug}-${timestamp}.txt`);
writeFileSync(promptPath, pmPrompt);

console.log(
  CLIFormatter.format({
    title: 'PM PLANNING PROMPT GENERATED',
    content: [
      `Book: ${book.title} (${book.slug})`,
      `Analysis: ${analysisPath}`,
      `Prompt saved: ${promptPath}`,
      '',
      'The PM Agent will create a detailed improvement plan with:',
      '  • Target issues with success metrics',
      '  • Chapter modifications with specific instructions',
      '  • Execution order and dependencies',
      '  • Impact estimates',
    ].join('\n'),
    status: [
      { label: 'Analysis loaded', success: true },
      { label: 'PM prompt generated', success: true },
    ],
    nextStep: [
      'Next steps:',
      '',
      '1. Execute the PM planning prompt:',
      `   Read and execute the prompt in: ${promptPath}`,
      '',
      '2. Save the AI-generated plan to a JSON file:',
      `   Write plan to: data/w1-strategic/pm-plan-${book.slug}.json`,
      '',
      '3. Create strategic plan from the PM output:',
      `   pnpm w1:strategic --save-plan data/w1-strategic/pm-plan-${book.slug}.json --book ${book.slug}`,
    ],
  })
);

console.log('\n' + '─'.repeat(60) + '\n');
console.log('PM PLANNING PROMPT:\n');
console.log(pmPrompt);

db.close();

// =============================================================================
// Helper Types and Functions
// =============================================================================

/**
 * PM Agent plan structure (output from pm-analysis-to-plan.md)
 */
interface PMAgentPlan {
  plan_id?: string;
  created_at?: string;
  source_campaign_id?: string;
  summary?: string;
  target_issues?: Array<{
    issue_id: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    source_category: string;
    affected_chapters: string[];
    affected_personas?: string[];
    improvement_goal: string;
    success_metric: string;
    priority: number;
  }>;
  chapter_modifications: Array<{
    chapter_id: string;
    chapter_name: string;
    priority: number;
    issues_addressed: string[];
    estimated_effort: 'low' | 'medium' | 'high';
    modifications: Array<{
      type: string;
      target: string;
      instruction: string;
      success_criteria: string;
    }>;
  }>;
  constraints?: {
    max_chapters_modified?: number;
    preserve_structure?: boolean;
    follow_style_guides?: boolean;
    preserve_mechanics?: boolean;
    word_count_target?: string;
  };
  execution_order?: Array<{
    phase: number;
    chapters: string[];
    rationale: string;
  }>;
  estimated_impact?: {
    primary_dimension?: string;
    expected_improvement?: string;
    secondary_benefits?: string[];
  };
  review_cycle_recommendation?: {
    re_review_personas?: string[];
    focus_dimensions?: string[];
    skip_personas?: string[];
    rationale?: string;
  };
}

/**
 * Convert PM Agent plan to strategic improvement areas
 */
function convertPMPlanToAreas(
  pmPlan: PMAgentPlan,
  maxCycles: number,
  maxAreas: number
): Omit<ImprovementArea, 'status' | 'current_cycle' | 'baseline_score' | 'current_score' | 'delta_achieved' | 'chapters_modified' | 'baseline_metrics' | 'current_metrics' | 'delta'>[] {
  const areas: Omit<ImprovementArea, 'status' | 'current_cycle' | 'baseline_score' | 'current_score' | 'delta_achieved' | 'chapters_modified' | 'baseline_metrics' | 'current_metrics' | 'delta'>[] = [];

  // If execution_order exists, group by phase
  if (pmPlan.execution_order && pmPlan.execution_order.length > 0) {
    for (const phase of pmPlan.execution_order.slice(0, maxAreas)) {
      const chapterMods = pmPlan.chapter_modifications.filter(cm =>
        phase.chapters.includes(cm.chapter_id)
      );

      if (chapterMods.length === 0) continue;

      // Collect all issues addressed
      const issuesAddressed = new Set<string>();
      for (const cm of chapterMods) {
        for (const issueId of cm.issues_addressed) {
          issuesAddressed.add(issueId);
        }
      }

      // Find issue descriptions
      const issueDescriptions = (pmPlan.target_issues || [])
        .filter(ti => issuesAddressed.has(ti.issue_id))
        .map(ti => ti.description);

      areas.push({
        area_id: `area-phase-${phase.phase}`,
        name: `Phase ${phase.phase}: ${phase.rationale.slice(0, 50)}${phase.rationale.length > 50 ? '...' : ''}`,
        type: 'chapter_cluster',
        description: phase.rationale,
        target_chapters: phase.chapters,
        target_issues: issueDescriptions,
        priority: phase.phase,
        max_cycles: maxCycles,
        target_dimension: pmPlan.estimated_impact?.primary_dimension as 'clarity_readability' | 'rules_accuracy' | 'persona_fit' | 'practical_usability' | 'overall_score' | undefined,
      });
    }
  } else {
    // No execution order - group by chapter priority
    const sortedMods = [...pmPlan.chapter_modifications].sort((a, b) => a.priority - b.priority);

    for (let i = 0; i < Math.min(sortedMods.length, maxAreas); i++) {
      const cm = sortedMods[i];

      // Find issue descriptions
      const issueDescriptions = (pmPlan.target_issues || [])
        .filter(ti => cm.issues_addressed.includes(ti.issue_id))
        .map(ti => ti.description);

      areas.push({
        area_id: `area-${cm.chapter_id}`,
        name: `${cm.chapter_name} Improvements`,
        type: 'chapter_cluster',
        description: `Improvements for ${cm.chapter_name}: ${cm.modifications.length} modifications`,
        target_chapters: [cm.chapter_id],
        target_issues: issueDescriptions,
        priority: cm.priority,
        max_cycles: maxCycles,
      });
    }
  }

  return areas;
}

/**
 * Generate PM planning prompt from analysis
 */
interface PMPromptContext {
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  analysisContent: string;
  analysisPath: string;
  metricThreshold: number;
  maxChapters: number;
}

function generatePMPlanningPrompt(context: PMPromptContext): string {
  const { bookSlug, bookTitle, analysisContent, analysisPath, metricThreshold, maxChapters } = context;

  // Load the PM agent prompt template
  const pmPromptPath = resolve(projectRoot, 'src/tooling/agents/prompts/pm-analysis-to-plan.md');
  const pmPromptTemplate = existsSync(pmPromptPath)
    ? readFileSync(pmPromptPath, 'utf-8')
    : '';

  // Load style guides if available
  let styleGuidesContent = '';
  const styleGuidesDir = resolve(projectRoot, 'docs/style_guides');
  if (existsSync(join(styleGuidesDir, 'content.md'))) {
    styleGuidesContent += '\n### Content Style Guide\n';
    styleGuidesContent += readFileSync(join(styleGuidesDir, 'content.md'), 'utf-8');
  }
  if (existsSync(join(styleGuidesDir, 'mechanics.md'))) {
    styleGuidesContent += '\n### Mechanics Style Guide\n';
    styleGuidesContent += readFileSync(join(styleGuidesDir, 'mechanics.md'), 'utf-8');
  }

  // Get chapter list from book
  const chaptersDir = resolve(projectRoot, `books/core/v1.3.0/chapters`);
  let chapterList = '';
  if (existsSync(chaptersDir)) {
    const chapters = require('fs').readdirSync(chaptersDir)
      .filter((f: string) => f.endsWith('.md'))
      .sort();
    chapterList = chapters.map((f: string) => `  - ${f.replace('.md', '')}`).join('\n');
  }

  return `# PM Planning Task

You are the Project Manager (PM) agent for the W1 editing workflow.

## Context

- **Book:** ${bookTitle} (${bookSlug})
- **Analysis Source:** ${analysisPath}
- **Target Metric:** overall_score >= ${metricThreshold}
- **Max Chapters to Modify:** ${maxChapters}

## Review Analysis

${analysisContent}

## Book Chapters

${chapterList || '_Chapter list not available - check books/core/ directory_'}

## Style Guides
${styleGuidesContent || '_No style guides found in docs/style_guides/_'}

## PM Agent Instructions

${pmPromptTemplate}

## Output Requirements

After analyzing the review feedback, create your improvement plan and save it as JSON:

**Output path:** \`data/w1-strategic/pm-plan-${bookSlug}.json\`

The JSON must follow the ImprovementPlan schema exactly (see PM Agent Instructions above).

## Next Steps After Creating Plan

After you save the plan JSON, run:

\`\`\`bash
pnpm w1:strategic --save-plan data/w1-strategic/pm-plan-${bookSlug}.json --book ${bookSlug}
\`\`\`

This will create the strategic plan and generate the execution prompt.

## Begin

Read the analysis above and create a prioritized improvement plan.
`;
}
