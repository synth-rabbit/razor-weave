/**
 * w1:content-modify CLI Command
 *
 * Orchestrates the writer/editor/domain expert loop for content modification.
 * Uses prompt-based flow: generates prompts for Claude Code to execute,
 * then saves results via --save-* subcommands.
 *
 * Usage:
 *   pnpm w1:content-modify --run=<id>                        # Generate writer prompt
 *   pnpm w1:content-modify --save-writer --run=<id> --chapters=<dir>  # Save writer output
 *   pnpm w1:content-modify --generate-editor --run=<id>      # Generate editor prompt
 *   pnpm w1:content-modify --save-editor --run=<id> --result=<path>   # Save editor result
 *   pnpm w1:content-modify --generate-domain --run=<id>      # Generate domain expert prompt
 *   pnpm w1:content-modify --save-domain --run=<id> --result=<path>   # Save domain expert result
 *   pnpm w1:content-modify --help                            # Show help
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import { BookRepository } from '../books/repository.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';
import {
  generateWriterPrompt,
  generateEditorPrompt,
  generateDomainExpertPrompt,
  generateSharedContext,
  generateOrchestratorPrompt,
  type ChapterAssignment,
} from '../w1/prompt-generator.js';
import { W1PromptWriter } from '../w1/prompt-writer.js';
import { W1ResultSaver, type ReviewResult } from '../w1/result-saver.js';

// Type definitions (moved from invoker-pm.ts since we're removing that dependency)
interface ImprovementPlan {
  plan_id: string;
  created_at: string;
  summary: string;
  target_issues: Array<{
    issue_id: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    affected_chapters: string[];
    improvement: string;
    success_metric: string;
    priority: number;
  }>;
  chapter_modifications: Array<{
    chapter_id: string;
    chapter_name: string;
    issues_addressed: string[];
    modifications: Array<{
      type: 'clarify' | 'expand' | 'restructure' | 'fix_mechanics' | 'improve_examples';
      target: string;
      instruction: string;
    }>;
  }>;
  constraints: {
    max_chapters_modified: number;
    preserve_structure: boolean;
    follow_style_guides: boolean;
  };
  estimated_impact: string;
}

// ============================================================================
// Constants
// ============================================================================

const BOX_WIDTH = 59;
const DOUBLE_LINE = '='.repeat(BOX_WIDTH);
const SINGLE_LINE = '-'.repeat(BOX_WIDTH);

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// ============================================================================
// Argument Parsing
// ============================================================================

interface Args {
  run?: string;
  chapters?: string;
  result?: string;
  saveWriter?: boolean;
  generateEditor?: boolean;
  saveEditor?: boolean;
  generateDomain?: boolean;
  saveDomain?: boolean;
  help?: boolean;
  db?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (const arg of argv) {
    if (arg.startsWith('--run=')) args.run = arg.split('=')[1];
    else if (arg.startsWith('--chapters=')) args.chapters = arg.split('=')[1];
    else if (arg.startsWith('--result=')) args.result = arg.split('=')[1];
    else if (arg === '--save-writer') args.saveWriter = true;
    else if (arg === '--generate-editor') args.generateEditor = true;
    else if (arg === '--save-editor') args.saveEditor = true;
    else if (arg === '--generate-domain') args.generateDomain = true;
    else if (arg === '--save-domain') args.saveDomain = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg.startsWith('--db=')) args.db = arg.split('=')[1];
  }
  return args;
}

function showHelp(): void {
  console.log(CLIFormatter.header('W1 CONTENT MODIFY - HELP'));
  console.log(`
Usage: pnpm w1:content-modify [options]

Modes:
  --run=<id>                         Generate writer prompt for workflow run
  --save-writer --run=<id> --chapters=<dir>
                                     Save writer output from chapters directory
  --generate-editor --run=<id>       Generate editor review prompt
  --save-editor --run=<id> --result=<path>
                                     Save editor review result
  --generate-domain --run=<id>       Generate domain expert review prompt
  --save-domain --run=<id> --result=<path>
                                     Save domain expert review result
  --help, -h                         Show this help message

Options:
  --db=<path>                        Database path (default: data/project.db)

Examples:
  # Step 1: Generate writer prompt
  pnpm w1:content-modify --run=wfrun_abc123

  # Step 2: After writing chapters, save writer output
  pnpm w1:content-modify --save-writer --run=wfrun_abc123 --chapters=data/w1-artifacts/wfrun_abc123/chapters/

  # Step 3: Generate editor prompt
  pnpm w1:content-modify --generate-editor --run=wfrun_abc123

  # Step 4: After editor review, save result
  pnpm w1:content-modify --save-editor --run=wfrun_abc123 --result=data/w1-artifacts/wfrun_abc123/editor-review.json

  # Step 5: Generate domain expert prompt
  pnpm w1:content-modify --generate-domain --run=wfrun_abc123

  # Step 6: After domain expert review, save result
  pnpm w1:content-modify --save-domain --run=wfrun_abc123 --result=data/w1-artifacts/wfrun_abc123/domain-review.json
`);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load improvement plan from artifacts
 */
function loadPlanForRun(projectRoot: string, runId: string): ImprovementPlan | null {
  const planPath = resolve(projectRoot, `data/w1-artifacts/${runId}/plan.json`);
  if (existsSync(planPath)) {
    return JSON.parse(readFileSync(planPath, 'utf-8')) as ImprovementPlan;
  }
  return null;
}

/**
 * Get chapter paths for the workflow run
 */
function getChapterPathsForRun(projectRoot: string, runId: string): string[] {
  const chaptersDir = resolve(projectRoot, `data/w1-artifacts/${runId}/chapters`);
  if (!existsSync(chaptersDir)) {
    return [];
  }
  return readdirSync(chaptersDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(chaptersDir, f));
}

/**
 * Get original chapter paths from book based on plan
 */
function getOriginalChapterPaths(
  projectRoot: string,
  bookSourcePath: string,
  plan: ImprovementPlan
): string[] {
  const chaptersDir = join(resolve(projectRoot, bookSourcePath), 'chapters');
  const chapterIds = plan.chapter_modifications.map((mod) => mod.chapter_id);

  return chapterIds.map((chapterId) => {
    for (const ext of ['.md', '.markdown']) {
      const path = join(chaptersDir, `${chapterId}${ext}`);
      if (existsSync(path)) {
        return path;
      }
    }
    return join(chaptersDir, `${chapterId}.md`);
  }).filter((p) => existsSync(p));
}

// ============================================================================
// Mode Handlers
// ============================================================================

async function handleGenerateWriterPrompt(
  db: Database.Database,
  projectRoot: string,
  runId: string
): Promise<void> {
  console.log(DOUBLE_LINE);
  console.log('W1 CONTENT MODIFY - GENERATE WRITER PROMPT');
  console.log(DOUBLE_LINE);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);
  const bookRepo = new BookRepository(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId);
  if (!workflowRun) {
    console.error(`  ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }
  console.log(`  OK Workflow run: ${runId}`);

  // Get book info
  const book = bookRepo.getById(workflowRun.book_id);
  if (!book) {
    console.error(`  ERROR: Book not found: ${workflowRun.book_id}`);
    process.exit(1);
  }
  console.log(`  OK Book: ${book.title} (${book.slug})`);

  // Load plan
  const plan = loadPlanForRun(projectRoot, runId);
  if (!plan) {
    console.error(`  ERROR: Plan not found for run ${runId}`);
    console.error(`  Expected: data/w1-artifacts/${runId}/plan.json`);
    process.exit(1);
  }
  console.log(`  OK Plan loaded: ${plan.plan_id}`);

  // Get chapter paths
  const chapterPaths = getOriginalChapterPaths(projectRoot, book.source_path, plan);
  if (chapterPaths.length === 0) {
    console.error(`  ERROR: No chapters found for modification`);
    process.exit(1);
  }
  console.log(`  OK Chapters to modify: ${chapterPaths.length}`);

  // Load style guides (with fallbacks if not found)
  const contentStyleGuidePath = resolve(projectRoot, 'docs/style_guides/content.md');
  const mechanicsStyleGuidePath = resolve(projectRoot, 'docs/style_guides/mechanics.md');

  const contentStyleGuide = existsSync(contentStyleGuidePath)
    ? readFileSync(contentStyleGuidePath, 'utf-8')
    : '(No content style guide found)';
  const mechanicsStyleGuide = existsSync(mechanicsStyleGuidePath)
    ? readFileSync(mechanicsStyleGuidePath, 'utf-8')
    : '(No mechanics style guide found)';
  console.log(`  OK Style guides loaded`);

  // Generate shared context
  const sharedContext = generateSharedContext({
    runId,
    bookTitle: book.title,
    bookSlug: book.slug,
    chapterCount: plan.chapter_modifications.length,
    plan: {
      plan_id: plan.plan_id,
      summary: plan.summary,
      target_issues: plan.target_issues.map(i => ({
        issue_id: i.issue_id,
        severity: i.severity,
        description: i.description,
      })),
      constraints: {
        max_chapters_modified: plan.constraints.max_chapters_modified,
        preserve_structure: plan.constraints.preserve_structure,
        word_count_target: 'maintain current',
      },
    },
    contentStyleGuide,
    mechanicsStyleGuide,
  });

  // Write shared context
  const promptWriter = new W1PromptWriter({ runId });
  const sharedContextPath = promptWriter.writeSharedContext(sharedContext);
  console.log(`  OK Shared context written: ${sharedContextPath}`);

  // Build chapter assignments from plan
  const outputDir = resolve(projectRoot, `data/w1-artifacts/${runId}/chapters`);
  const chapterAssignments: ChapterAssignment[] = plan.chapter_modifications.map((mod) => {
    // Find source path for this chapter
    const sourcePath = chapterPaths.find(p => p.includes(mod.chapter_id)) || '';
    return {
      chapterId: mod.chapter_id,
      sourcePath,
      outputPath: join(outputDir, `${mod.chapter_id}.md`),
      modifications: mod.modifications.map(m => `${m.type}: ${m.instruction}`),
    };
  });

  // Generate orchestrator prompt
  const orchestratorPrompt = generateOrchestratorPrompt({
    runId,
    sharedContextPath,
    chapters: chapterAssignments,
    batchSize: 5,
  });

  // Write orchestrator prompt (as the main writer prompt)
  const promptPath = promptWriter.writeWriterPrompt(orchestratorPrompt);
  console.log(`  OK Orchestrator prompt written: ${promptPath}`);

  // Also generate legacy single-file prompt for fallback
  const styleGuidesDir = resolve(projectRoot, 'docs/style_guides');
  const planPath = resolve(projectRoot, `data/w1-artifacts/${runId}/plan.json`);
  const legacyPrompt = generateWriterPrompt({
    runId,
    planPath,
    chapterPaths,
    styleGuidesDir,
  });
  const legacyPromptPath = promptWriter.writeWriterPrompt(legacyPrompt, 'legacy');
  console.log(`  OK Legacy prompt written: ${legacyPromptPath}`);

  // Update workflow status
  workflowRepo.updateStatus(runId, 'running');
  workflowRepo.setCurrentAgent(runId, 'writer');

  console.log('');
  console.log(SINGLE_LINE);
  console.log('NEXT STEPS');
  console.log(SINGLE_LINE);
  console.log('');
  console.log(`1. Read the shared context: ${sharedContextPath}`);
  console.log(`2. Read the orchestrator prompt: ${promptPath}`);
  console.log('3. Dispatch subagents using Task() calls as described in the prompt');
  console.log('   - Each subagent will modify one chapter');
  console.log(`   - Chapters will be written to: data/w1-artifacts/${runId}/chapters/`);
  console.log('4. After all subagents complete, save results:');
  console.log(`   pnpm w1:content-modify --save-writer --run=${runId} --chapters=data/w1-artifacts/${runId}/chapters/`);
  console.log('');
  console.log(DOUBLE_LINE);
}

async function handleSaveWriterOutput(
  db: Database.Database,
  projectRoot: string,
  runId: string,
  chaptersDir: string
): Promise<void> {
  console.log(DOUBLE_LINE);
  console.log('W1 CONTENT MODIFY - SAVE WRITER OUTPUT');
  console.log(DOUBLE_LINE);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);
  const artifactRegistry = new ArtifactRegistry(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId);
  if (!workflowRun) {
    console.error(`  ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }
  console.log(`  OK Workflow run: ${runId}`);

  // Verify chapters directory exists
  const resolvedChaptersDir = resolve(projectRoot, chaptersDir);
  if (!existsSync(resolvedChaptersDir)) {
    console.error(`  ERROR: Chapters directory not found: ${resolvedChaptersDir}`);
    process.exit(1);
  }

  // Get chapter files
  const chapterFiles = readdirSync(resolvedChaptersDir).filter((f) => f.endsWith('.md'));
  if (chapterFiles.length === 0) {
    console.error(`  ERROR: No chapter files found in: ${resolvedChaptersDir}`);
    process.exit(1);
  }
  console.log(`  OK Chapters saved: ${chapterFiles.length}`);

  // Register artifacts
  const chapterPaths: string[] = [];
  for (const file of chapterFiles) {
    const chapterPath = join(resolvedChaptersDir, file);
    chapterPaths.push(chapterPath);
    artifactRegistry.register({
      workflowRunId: runId,
      artifactType: 'chapter',
      artifactPath: chapterPath,
      metadata: {
        w1_type: 'modified_chapter',
        chapter_id: basename(file, '.md'),
      },
    });
  }
  console.log(`  OK Artifacts registered`);

  // Update workflow
  workflowRepo.setCurrentAgent(runId, null);

  console.log('');
  console.log(SINGLE_LINE);
  console.log('NEXT STEP');
  console.log(SINGLE_LINE);
  console.log('');
  console.log(`pnpm w1:content-modify --generate-editor --run=${runId}`);
  console.log('');
  console.log(DOUBLE_LINE);
}

async function handleGenerateEditorPrompt(
  db: Database.Database,
  projectRoot: string,
  runId: string
): Promise<void> {
  console.log(DOUBLE_LINE);
  console.log('W1 CONTENT MODIFY - GENERATE EDITOR PROMPT');
  console.log(DOUBLE_LINE);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId);
  if (!workflowRun) {
    console.error(`  ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }
  console.log(`  OK Workflow run: ${runId}`);

  // Get modified chapter paths
  const chapterPaths = getChapterPathsForRun(projectRoot, runId);
  if (chapterPaths.length === 0) {
    console.error(`  ERROR: No modified chapters found for run ${runId}`);
    console.error(`  Expected: data/w1-artifacts/${runId}/chapters/*.md`);
    process.exit(1);
  }
  console.log(`  OK Chapters to review: ${chapterPaths.length}`);

  // Generate prompt
  const styleGuidesDir = resolve(projectRoot, 'docs/style_guides');
  const prompt = generateEditorPrompt({
    runId,
    chapterPaths,
    styleGuidesDir,
  });

  // Write prompt
  const promptWriter = new W1PromptWriter({ runId });
  const promptPath = promptWriter.writeEditorPrompt(prompt);
  console.log(`  OK Prompt written: ${promptPath}`);

  // Update workflow
  workflowRepo.setCurrentAgent(runId, 'editor');

  console.log('');
  console.log(SINGLE_LINE);
  console.log('NEXT STEPS');
  console.log(SINGLE_LINE);
  console.log('');
  console.log(`1. Read the prompt: ${promptPath}`);
  console.log('2. Perform editor review');
  console.log('3. Save result JSON to:');
  console.log(`   data/w1-artifacts/${runId}/editor-review.json`);
  console.log('4. Run:');
  console.log(`   pnpm w1:content-modify --save-editor --run=${runId} --result=data/w1-artifacts/${runId}/editor-review.json`);
  console.log('');
  console.log(DOUBLE_LINE);
}

async function handleSaveEditorResult(
  db: Database.Database,
  projectRoot: string,
  runId: string,
  resultPath: string
): Promise<void> {
  console.log(DOUBLE_LINE);
  console.log('W1 CONTENT MODIFY - SAVE EDITOR RESULT');
  console.log(DOUBLE_LINE);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId);
  if (!workflowRun) {
    console.error(`  ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }
  console.log(`  OK Workflow run: ${runId}`);

  // Load result
  const resolvedResultPath = resolve(projectRoot, resultPath);
  if (!existsSync(resolvedResultPath)) {
    console.error(`  ERROR: Result file not found: ${resolvedResultPath}`);
    process.exit(1);
  }

  const result = JSON.parse(readFileSync(resolvedResultPath, 'utf-8')) as ReviewResult;
  console.log(`  OK Result loaded: approved=${result.approved}`);

  // Save result
  const saver = new W1ResultSaver(db, runId);
  const outputPath = resolve(projectRoot, `data/w1-artifacts/${runId}/editor-review.json`);
  saver.saveEditorResult(result, outputPath);
  console.log(`  OK Result saved to: ${outputPath}`);

  // Update workflow
  workflowRepo.setCurrentAgent(runId, null);

  console.log('');
  console.log(SINGLE_LINE);

  if (!result.approved) {
    console.log('RESULT: EDITOR REJECTED');
    console.log(SINGLE_LINE);
    console.log('');
    console.log(`Summary: ${result.summary}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review feedback in editor-review.json');
    console.log('2. Update chapters based on feedback');
    console.log(`3. Re-run: pnpm w1:content-modify --generate-editor --run=${runId}`);
  } else {
    console.log('RESULT: EDITOR APPROVED');
    console.log(SINGLE_LINE);
    console.log('');
    console.log('NEXT STEP');
    console.log('');
    console.log(`pnpm w1:content-modify --generate-domain --run=${runId}`);
  }

  console.log('');
  console.log(DOUBLE_LINE);
}

async function handleGenerateDomainPrompt(
  db: Database.Database,
  projectRoot: string,
  runId: string
): Promise<void> {
  console.log(DOUBLE_LINE);
  console.log('W1 CONTENT MODIFY - GENERATE DOMAIN EXPERT PROMPT');
  console.log(DOUBLE_LINE);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId);
  if (!workflowRun) {
    console.error(`  ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }
  console.log(`  OK Workflow run: ${runId}`);

  // Get modified chapter paths
  const chapterPaths = getChapterPathsForRun(projectRoot, runId);
  if (chapterPaths.length === 0) {
    console.error(`  ERROR: No modified chapters found for run ${runId}`);
    console.error(`  Expected: data/w1-artifacts/${runId}/chapters/*.md`);
    process.exit(1);
  }
  console.log(`  OK Chapters to review: ${chapterPaths.length}`);

  // Generate prompt
  const mechanicsGuidePath = resolve(projectRoot, 'docs/style_guides/mechanics.md');
  const prompt = generateDomainExpertPrompt({
    runId,
    chapterPaths,
    mechanicsGuidePath,
  });

  // Write prompt
  const promptWriter = new W1PromptWriter({ runId });
  const promptPath = promptWriter.writeDomainExpertPrompt(prompt);
  console.log(`  OK Prompt written: ${promptPath}`);

  // Update workflow
  workflowRepo.setCurrentAgent(runId, 'domain_expert');

  console.log('');
  console.log(SINGLE_LINE);
  console.log('NEXT STEPS');
  console.log(SINGLE_LINE);
  console.log('');
  console.log(`1. Read the prompt: ${promptPath}`);
  console.log('2. Perform domain expert review');
  console.log('3. Save result JSON to:');
  console.log(`   data/w1-artifacts/${runId}/domain-review.json`);
  console.log('4. Run:');
  console.log(`   pnpm w1:content-modify --save-domain --run=${runId} --result=data/w1-artifacts/${runId}/domain-review.json`);
  console.log('');
  console.log(DOUBLE_LINE);
}

async function handleSaveDomainResult(
  db: Database.Database,
  projectRoot: string,
  runId: string,
  resultPath: string
): Promise<void> {
  console.log(DOUBLE_LINE);
  console.log('W1 CONTENT MODIFY - SAVE DOMAIN EXPERT RESULT');
  console.log(DOUBLE_LINE);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);
  const bookRepo = new BookRepository(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId);
  if (!workflowRun) {
    console.error(`  ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }
  console.log(`  OK Workflow run: ${runId}`);

  // Load result
  const resolvedResultPath = resolve(projectRoot, resultPath);
  if (!existsSync(resolvedResultPath)) {
    console.error(`  ERROR: Result file not found: ${resolvedResultPath}`);
    process.exit(1);
  }

  const result = JSON.parse(readFileSync(resolvedResultPath, 'utf-8')) as ReviewResult;
  console.log(`  OK Result loaded: approved=${result.approved}`);

  // Save result
  const saver = new W1ResultSaver(db, runId);
  const outputPath = resolve(projectRoot, `data/w1-artifacts/${runId}/domain-review.json`);
  saver.saveDomainExpertResult(result, outputPath);
  console.log(`  OK Result saved to: ${outputPath}`);

  // Update workflow
  workflowRepo.setCurrentAgent(runId, null);

  // Get book info for next step
  const book = bookRepo.getById(workflowRun.book_id);

  console.log('');
  console.log(SINGLE_LINE);

  if (!result.approved) {
    console.log('RESULT: DOMAIN EXPERT REJECTED');
    console.log(SINGLE_LINE);
    console.log('');
    console.log(`Summary: ${result.summary}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review feedback in domain-review.json');
    console.log('2. Update chapters based on feedback');
    console.log(`3. Re-run: pnpm w1:content-modify --generate-domain --run=${runId}`);
  } else {
    console.log('RESULT: ALL REVIEWS APPROVED');
    console.log(SINGLE_LINE);
    console.log('');
    console.log('Both editor and domain expert have approved the content!');
    console.log('');
    console.log('NEXT STEP');
    console.log('');
    if (book) {
      console.log(`pnpm w1:validate --book=${book.slug} --run=${runId}`);
    } else {
      console.log(`pnpm w1:validate --run=${runId}`);
    }
  }

  console.log('');
  console.log(DOUBLE_LINE);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const projectRoot = getProjectRoot();
  const args = parseArgs(process.argv.slice(2));

  // Handle help
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Initialize database
  const dbPath = resolve(projectRoot, args.db || 'data/project.db');
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

  try {
    // Determine mode and dispatch
    if (args.saveWriter) {
      if (!args.run || !args.chapters) {
        console.error('Usage: pnpm w1:content-modify --save-writer --run=<id> --chapters=<dir>');
        process.exit(1);
      }
      await handleSaveWriterOutput(db, projectRoot, args.run, args.chapters);
    } else if (args.generateEditor) {
      if (!args.run) {
        console.error('Usage: pnpm w1:content-modify --generate-editor --run=<id>');
        process.exit(1);
      }
      await handleGenerateEditorPrompt(db, projectRoot, args.run);
    } else if (args.saveEditor) {
      if (!args.run || !args.result) {
        console.error('Usage: pnpm w1:content-modify --save-editor --run=<id> --result=<path>');
        process.exit(1);
      }
      await handleSaveEditorResult(db, projectRoot, args.run, args.result);
    } else if (args.generateDomain) {
      if (!args.run) {
        console.error('Usage: pnpm w1:content-modify --generate-domain --run=<id>');
        process.exit(1);
      }
      await handleGenerateDomainPrompt(db, projectRoot, args.run);
    } else if (args.saveDomain) {
      if (!args.run || !args.result) {
        console.error('Usage: pnpm w1:content-modify --save-domain --run=<id> --result=<path>');
        process.exit(1);
      }
      await handleSaveDomainResult(db, projectRoot, args.run, args.result);
    } else if (args.run) {
      // Default: generate writer prompt
      await handleGenerateWriterPrompt(db, projectRoot, args.run);
    } else {
      // No valid mode specified
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      CLIFormatter.format({
        title: 'ERROR',
        content: `Content modification failed: ${errorMessage}`,
        status: [{ label: 'Content modification failed', success: false }],
        nextStep: ['Check the error message above for details.'],
      })
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
