// src/tooling/w1/prompt-generator.ts
import type Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface PlanningPromptContext {
  runId: string;
  bookId: string;
  bookName: string;
  analysisPath: string;
  styleGuidesDir: string;
}

export function generatePlanningPrompt(
  _db: Database.Database,
  context: PlanningPromptContext
): string {
  // Load analysis content
  const analysisContent = readFileSync(context.analysisPath, 'utf-8');

  // Load style guides if available
  let styleGuidesContent = '';
  if (existsSync(join(context.styleGuidesDir, 'content.md'))) {
    styleGuidesContent += '\n### Content Style Guide\n';
    styleGuidesContent += readFileSync(join(context.styleGuidesDir, 'content.md'), 'utf-8');
  }
  if (existsSync(join(context.styleGuidesDir, 'mechanics.md'))) {
    styleGuidesContent += '\n### Mechanics Style Guide\n';
    styleGuidesContent += readFileSync(join(context.styleGuidesDir, 'mechanics.md'), 'utf-8');
  }

  // Load PM prompt template
  const pmPromptPath = join(process.cwd(), 'src/tooling/agents/prompts/pm-analysis-to-plan.md');
  const pmPromptTemplate = existsSync(pmPromptPath)
    ? readFileSync(pmPromptPath, 'utf-8')
    : '';

  return `# W1 Planning Task

You are the PM agent for W1 workflow run \`${context.runId}\`.

## Context

- **Book:** ${context.bookName} (${context.bookId})
- **Workflow Run:** ${context.runId}

## Review Analysis

${analysisContent}

## Style Guides
${styleGuidesContent || '_No style guides available_'}

## Task

${pmPromptTemplate}

Analyze the review feedback above and create an improvement plan.

## Output Requirements

After creating the plan, save it using this command:

\`\`\`bash
pnpm w1:planning --save --run=${context.runId} --plan=<path-to-your-plan.json>
\`\`\`

The plan JSON must include:
- plan_id: string
- summary: string
- target_issues: array of issues to address
- chapter_modifications: array of chapters with modifications
- constraints: object with max_chapters_modified, preserve_structure, etc.
- estimated_impact: string

Write the plan to: \`data/w1-artifacts/${context.runId}/plan.json\`
`;
}

export interface WriterPromptContext {
  runId: string;
  planPath: string;
  chapterPaths: string[];
  styleGuidesDir: string;
}

export function generateWriterPrompt(context: WriterPromptContext): string {
  const plan = readFileSync(context.planPath, 'utf-8');

  const chaptersContent = context.chapterPaths.map(p => {
    const content = readFileSync(p, 'utf-8');
    return `### ${p}\n\`\`\`markdown\n${content}\n\`\`\``;
  }).join('\n\n');

  let styleGuidesContent = '';
  if (existsSync(join(context.styleGuidesDir, 'content.md'))) {
    styleGuidesContent += readFileSync(join(context.styleGuidesDir, 'content.md'), 'utf-8');
  }

  return `# W1 Writer Task

You are the Writer agent for W1 workflow run \`${context.runId}\`.

> **⚠️ IMPORTANT: Source files are MARKDOWN (.md) in \`books/\` directories.**
> **NEVER edit HTML files. HTML is generated output, not source.**
> **The chapter paths below show the source markdown files to read and modify.**

## Improvement Plan

\`\`\`json
${plan}
\`\`\`

## Chapters to Modify

${chaptersContent}

## Style Guide

${styleGuidesContent || '_No style guide available_'}

## Task

Implement the modifications specified in the plan. For each chapter:
1. Apply the changes described in chapter_modifications
2. Maintain the existing structure and voice
3. Follow the style guide

## Output Requirements

For each modified chapter, write the updated content to:
\`data/w1-artifacts/${context.runId}/chapters/{chapter-id}.md\`

Then save results:
\`\`\`bash
pnpm w1:content-modify --save --run=${context.runId} --chapters=data/w1-artifacts/${context.runId}/chapters/
\`\`\`
`;
}

export interface EditorPromptContext {
  runId: string;
  chapterPaths: string[];
  styleGuidesDir: string;
}

export function generateEditorPrompt(context: EditorPromptContext): string {
  const chaptersContent = context.chapterPaths.map(p => {
    const content = readFileSync(p, 'utf-8');
    return `### ${p}\n\`\`\`markdown\n${content}\n\`\`\``;
  }).join('\n\n');

  let styleGuidesContent = '';
  ['content.md', 'formatting.md', 'mechanics.md'].forEach(guide => {
    const guidePath = join(context.styleGuidesDir, guide);
    if (existsSync(guidePath)) {
      styleGuidesContent += `\n### ${guide}\n${readFileSync(guidePath, 'utf-8')}`;
    }
  });

  return `# W1 Editor Review Task

You are the Editor agent for W1 workflow run \`${context.runId}\`.

## Chapters to Review

${chaptersContent}

## Style Guides
${styleGuidesContent || '_No style guides available_'}

## Task

Review the chapters for:
- Grammar and spelling errors
- Clarity and readability issues
- Style guide compliance
- Consistency in terminology

## Output Requirements

Return a JSON review result:

\`\`\`json
{
  "approved": boolean,
  "feedback": [
    {
      "issue": "description",
      "location": "chapter/section",
      "suggestion": "fix",
      "severity": "error|warning|suggestion"
    }
  ],
  "summary": "overall assessment"
}
\`\`\`

Save results:
\`\`\`bash
pnpm w1:content-modify --save-editor --run=${context.runId} --result=<path-to-result.json>
\`\`\`
`;
}

export interface DomainExpertPromptContext {
  runId: string;
  chapterPaths: string[];
  mechanicsGuidePath: string;
}

export function generateDomainExpertPrompt(context: DomainExpertPromptContext): string {
  const chaptersContent = context.chapterPaths.map(p => {
    const content = readFileSync(p, 'utf-8');
    return `### ${p}\n\`\`\`markdown\n${content}\n\`\`\``;
  }).join('\n\n');

  const mechanicsGuide = existsSync(context.mechanicsGuidePath)
    ? readFileSync(context.mechanicsGuidePath, 'utf-8')
    : '';

  return `# W1 Domain Expert Review Task

You are the Domain Expert agent for W1 workflow run \`${context.runId}\`.

## Chapters to Review

${chaptersContent}

## Mechanics Reference
${mechanicsGuide || '_No mechanics guide available_'}

## Task

Review for game design consistency:
- Rules contradictions between chapters
- Term inconsistencies
- Balance concerns
- Missing cross-references

## Output Requirements

Return a JSON review result:

\`\`\`json
{
  "approved": boolean,
  "issues": [
    {
      "type": "rules_contradiction|term_inconsistency|balance_concern|missing_reference",
      "description": "what's wrong",
      "location": "where",
      "impact": "critical|major|minor"
    }
  ],
  "summary": "overall assessment"
}
\`\`\`

Save results:
\`\`\`bash
pnpm w1:content-modify --save-domain --run=${context.runId} --result=<path-to-result.json>
\`\`\`
`;
}

export interface MetricsEvalPromptContext {
  runId: string;
  iteration: number;
  bookSlug: string;
  baselineMetrics: {
    aggregate_metrics: Record<string, number>;
    chapter_metrics?: Array<{ chapter_id: string; metrics: Record<string, number> }>;
  };
  newMetrics: {
    aggregate_metrics: Record<string, number>;
    chapter_metrics?: Array<{ chapter_id: string; metrics: Record<string, number> }>;
  };
  improvementPlanContext?: string;
  /** Delta threshold from strategic plan - improvements must meet or exceed this */
  deltaThreshold?: number;
  /** Target metric score from strategic plan */
  metricThreshold?: number;
}

export function generateMetricsEvalPrompt(context: MetricsEvalPromptContext): string {
  // Load PM metrics eval prompt template
  const promptPath = join(process.cwd(), 'src/tooling/agents/prompts/pm-metrics-eval.md');
  const promptTemplate = existsSync(promptPath)
    ? readFileSync(promptPath, 'utf-8')
    : '';

  const baselineJson = JSON.stringify(context.baselineMetrics, null, 2);
  const newMetricsJson = JSON.stringify(context.newMetrics, null, 2);

  // Get thresholds with defaults
  const deltaThreshold = context.deltaThreshold ?? 0.3;  // Default from pm-metrics-eval.md
  const metricThreshold = context.metricThreshold ?? 8.0;

  let prompt = `# W1 Metrics Evaluation Task

You are the PM Metrics Evaluator agent for W1 workflow run \`${context.runId}\`.

## Context

- **Book:** ${context.bookSlug}
- **Workflow Run:** ${context.runId}
- **Iteration:** ${context.iteration}

## ⚠️ STRATEGIC PLAN THRESHOLDS (OVERRIDE DEFAULT CRITERIA)

The strategic plan for this workflow has defined specific thresholds that OVERRIDE the default approval criteria:

- **Required Delta Threshold:** ${deltaThreshold} (improvements must meet or exceed this delta)
- **Target Metric Score:** ${metricThreshold}

**CRITICAL:** You MUST use these thresholds when evaluating approval. If the strategic plan says delta must be >= ${deltaThreshold}, then a delta of ${(deltaThreshold - 0.1).toFixed(1)} is NOT sufficient even if it seems like "good improvement".

## Reference Documentation

${promptTemplate}

## Baseline Metrics (Before Modifications)

\`\`\`json
${baselineJson}
\`\`\`

## New Metrics (After Modifications)

\`\`\`json
${newMetricsJson}
\`\`\`
`;

  if (context.improvementPlanContext) {
    prompt += `
## Improvement Plan Context

${context.improvementPlanContext}
`;
  }

  prompt += `
## Task

Evaluate the metrics comparison and determine whether to approve the modifications.
Return ONLY a JSON object conforming to the MetricsEvaluationResult schema.

## Output Requirements

After evaluating the metrics, save the result:

\`\`\`bash
pnpm w1:validate --save --run=${context.runId} --iteration=${context.iteration} --result=<path-to-result.json>
\`\`\`

Write the result to: \`data/w1-artifacts/${context.runId}/iteration-${context.iteration}/metrics-evaluation.json\`
`;

  return prompt;
}

export interface ChapterReviewPromptContext {
  runId: string;
  bookSlug: string;
  chapterPaths: string[];
  chapterIds: string[];
}

export function generateChapterReviewPrompt(context: ChapterReviewPromptContext): string {
  const chaptersContent = context.chapterPaths.map((p, i) => {
    const content = existsSync(p) ? readFileSync(p, 'utf-8') : '_File not found_';
    return `### ${context.chapterIds[i]} (${p})
\`\`\`markdown
${content}
\`\`\``;
  }).join('\n\n');

  return `# W1 Chapter Review Task

You are the Chapter Reviewer agent for W1 workflow run \`${context.runId}\`.

## Context

- **Book:** ${context.bookSlug}
- **Workflow Run:** ${context.runId}
- **Chapters:** ${context.chapterIds.join(', ')}

## Chapters to Review

${chaptersContent}

## Task

Review each chapter and generate metrics for:
- clarity_readability (1-10): How clear and readable is the content?
- rules_accuracy (1-10): Are the rules presented accurately?
- persona_fit (1-10): How well does the content fit different reader personas?
- practical_usability (1-10): How usable is the content during actual play?

Also identify:
- Key themes in the content
- Areas that excel
- Areas that need improvement

## Output Requirements

Return a JSON object with the following structure for each chapter:

\`\`\`json
{
  "chapter_metrics": [
    {
      "chapter_id": "chapter-id",
      "chapter_name": "Chapter Name",
      "metrics": {
        "clarity_readability": 7.5,
        "rules_accuracy": 8.0,
        "persona_fit": 7.0,
        "practical_usability": 7.2,
        "overall_score": 7.4
      },
      "themes": ["theme1", "theme2"],
      "strengths": ["strength1"],
      "improvements_needed": ["improvement1"]
    }
  ],
  "aggregate_metrics": {
    "clarity_readability": 7.5,
    "rules_accuracy": 8.0,
    "persona_fit": 7.0,
    "practical_usability": 7.2,
    "overall_score": 7.4
  }
}
\`\`\`

After generating the review, save the result:

\`\`\`bash
pnpm w1:validate-chapters --save --run=${context.runId} --result=<path-to-result.json>
\`\`\`

Write the result to: \`data/w1-artifacts/${context.runId}/chapter-review.json\`
`;
}

export interface ReleaseNotesPromptContext {
  runId: string;
  bookSlug: string;
  bookTitle: string;
  planPath?: string;
  changelogPath?: string;
  metricsPath?: string;
}

export function generateReleaseNotesPrompt(context: ReleaseNotesPromptContext): string {
  // Load release notes prompt template
  const promptPath = join(process.cwd(), 'src/tooling/agents/prompts/release-notes-gen.md');
  const promptTemplate = existsSync(promptPath)
    ? readFileSync(promptPath, 'utf-8')
    : '';

  // Load plan if available
  let planContent = '_No improvement plan available_';
  if (context.planPath && existsSync(context.planPath)) {
    planContent = readFileSync(context.planPath, 'utf-8');
  }

  // Load changelog if available
  let changelogContent = '_No changelog available_';
  if (context.changelogPath && existsSync(context.changelogPath)) {
    changelogContent = readFileSync(context.changelogPath, 'utf-8');
  }

  // Load metrics if available
  let metricsContent = '_No metrics available_';
  if (context.metricsPath && existsSync(context.metricsPath)) {
    metricsContent = readFileSync(context.metricsPath, 'utf-8');
  }

  return `# W1 Release Notes Generation Task

You are the Release Notes Agent for W1 workflow run \`${context.runId}\`.

## Context

- **Book:** ${context.bookTitle} (${context.bookSlug})
- **Workflow Run:** ${context.runId}

## Reference Documentation

${promptTemplate}

## Improvement Plan

\`\`\`json
${planContent}
\`\`\`

## Change Log

\`\`\`json
${changelogContent}
\`\`\`

## Metrics Report

\`\`\`json
${metricsContent}
\`\`\`

## Task

Generate comprehensive release notes following the guidelines in the reference documentation.
Return ONLY a JSON object conforming to the ReleaseNotesOutput schema.

## Output Requirements

After generating the release notes, save the result:

\`\`\`bash
pnpm w1:finalize --save-release-notes --run=${context.runId} --result=<path-to-result.json>
\`\`\`

Write the result to: \`data/w1-artifacts/${context.runId}/release-notes.json\`
`;
}

export interface SharedContextInput {
  runId: string;
  bookTitle: string;
  bookSlug: string;
  chapterCount: number;
  plan: {
    plan_id: string;
    summary: string;
    target_issues: Array<{ issue_id: string; severity: string; description: string }>;
    constraints: {
      max_chapters_modified: number;
      preserve_structure: boolean;
      word_count_target: string;
    };
  };
  contentStyleGuide: string;
  mechanicsStyleGuide: string;
}

export function generateSharedContext(input: SharedContextInput): string {
  const { runId, bookTitle, bookSlug, chapterCount, plan, contentStyleGuide, mechanicsStyleGuide } = input;

  const issuesTable = plan.target_issues.length > 0
    ? plan.target_issues.map(i => `| ${i.issue_id} | ${i.severity} | ${i.description} |`).join('\n')
    : '| (none) | - | - |';

  return `# W1 Writer Shared Context

## Workflow Run
- Run ID: ${runId}
- Book: ${bookTitle} (${bookSlug})
- Chapters to modify: ${chapterCount}

## Improvement Plan Summary
${plan.summary}

### Target Issues
| ID | Severity | Description |
|----|----------|-------------|
${issuesTable}

### Constraints
- Max chapters: ${plan.constraints.max_chapters_modified}
- Preserve structure: ${plan.constraints.preserve_structure ? 'yes' : 'no'}
- Word count target: ${plan.constraints.word_count_target}

## Style Guides

### Content Style Guide
${contentStyleGuide}

### Mechanics Style Guide
${mechanicsStyleGuide}

## Cross-Chapter Consistency Notes
- Use consistent terminology (see style guide tables)
- Example characters referenced across chapters should match
- Quick-reference table formatting should be uniform
`;
}

export interface ChapterAssignment {
  chapterId: string;
  sourcePath: string;
  outputPath: string;
  modifications: string[];
}

export interface OrchestratorInput {
  runId: string;
  sharedContextPath: string;
  chapters: ChapterAssignment[];
  batchSize: number;
}

export function generateOrchestratorPrompt(input: OrchestratorInput): string {
  const { runId, sharedContextPath, chapters, batchSize } = input;

  // Split chapters into batches
  const batches: ChapterAssignment[][] = [];
  for (let i = 0; i < chapters.length; i += batchSize) {
    batches.push(chapters.slice(i, i + batchSize));
  }

  // Generate batch sections
  const batchSections = batches.map((batch, index) => {
    const chapterRows = batch.map(ch =>
      `| ${ch.chapterId} | ${ch.sourcePath} | ${ch.outputPath} | ${ch.modifications.join('; ')} |`
    ).join('\n');

    return `### Batch ${index + 1}
Dispatch these Task() calls in a single message:

| Chapter | Source | Output | Modifications |
|---------|--------|--------|---------------|
${chapterRows}
`;
  }).join('\n');

  return `# W1 Writer Orchestrator

You are coordinating parallel chapter modifications for workflow run \`${runId}\`.

## Instructions

1. Read the shared context: \`${sharedContextPath}\`
2. Dispatch chapter writers in batches (max ${batchSize} parallel)
3. Wait for each batch to complete before starting the next
4. After all chapters are written, confirm completion

## Chapter Assignments

${batchSections}

## Subagent Prompt Template

For each Task(), use subagent_type="general-purpose" and this prompt:

\`\`\`
Read \`${sharedContextPath}\` for style guides and plan context.

Modify chapter: {source_path}
Write output to: {output_path}

Modifications to apply:
{list of modifications}

Follow all style guide conventions. Preserve existing structure where not explicitly modified.
Write the complete modified chapter to the output path.
\`\`\`

## Output Requirements

After all chapters are written, save results:
\`\`\`bash
pnpm w1:content-modify --save-writer --run=${runId} --chapters=data/w1-artifacts/${runId}/chapters/
\`\`\`
`;
}

export interface FreshWorkflowPromptContext {
  bookSlug: string;
  bookTitle: string;
  metricThreshold: number;
  maxCycles: number;
  deltaThreshold: number;
}

export function generateFreshWorkflowPrompt(context: FreshWorkflowPromptContext): string {
  const { bookSlug, bookTitle, metricThreshold, maxCycles, deltaThreshold } = context;

  return `# W1 Fresh Strategic Workflow

You are executing a complete W1 editing workflow for **${bookTitle}** (${bookSlug}).

This workflow includes: reviews → analysis → strategic plan → editing iterations → human gate → finalization.

## Phase 1: Generate Reviews

Run persona-based reviews on the book:

\`\`\`bash
pnpm review:book ${bookSlug}
\`\`\`

This generates 40+ persona prompts. Execute all reviewer agents (they write JSON to \`data/reviews/raw/{campaign-id}/\`).

## Phase 2: Collect Reviews

After all reviewer agents complete, collect their JSON outputs into the database:

\`\`\`bash
pnpm review:collect {campaign-id}
\`\`\`

This reads JSON files and persists them to the database for analysis.

## Phase 3: Analyze Reviews

Once reviews are collected, run analysis:

\`\`\`bash
pnpm review:analyze {campaign-id}
\`\`\`

This creates an analysis file at \`data/reviews/analysis/campaign-XXXXX.md\`.

Note the path to the analysis file from the output.

## Phase 4: Create Strategic Plan

With the analysis complete, create the strategic plan:

\`\`\`bash
pnpm w1:strategic --book=${bookSlug} --analysis=<path-to-analysis.md> --metric-threshold=${metricThreshold} --max-cycles=${maxCycles} --delta-threshold=${deltaThreshold}
\`\`\`

This will:
1. Save the plan to the database
2. Create artifacts in \`data/w1-strategic/{plan_id}/\`
3. Output a new prompt for executing the plan

## Phase 5: Execute Strategic Plan

Copy and execute the prompt output from Phase 4. That prompt contains instructions for:
- Iterating through improvement areas
- Running delta validation
- Triggering large-batch validation
- Stopping at human gate

## Configuration

- **Target metric:** ${metricThreshold}
- **Max cycles:** ${maxCycles}
- **Delta threshold:** ${deltaThreshold}

## Begin

Start with Phase 1: \`pnpm review:book ${bookSlug}\`
`;
}

export interface StrategyPromptContext {
  planId: string;
  bookSlug: string;
  bookTitle: string;
  artifactsDir: string;
  isResume: boolean;
}

export interface StrategyPromptContextFull extends StrategyPromptContext {
  workflowRunId: string;
}

export function generateStrategyPrompt(context: StrategyPromptContext & { workflowRunId?: string }): string {
  const { planId, bookSlug, bookTitle, artifactsDir, isResume, workflowRunId } = context;

  const resumeNote = isResume
    ? `\n> **RESUMING:** This is a resumed session. Check state.json for current progress.\n`
    : '';

  // If no workflow run ID yet, prompt to create one first
  const workflowSetup = workflowRunId
    ? `**Workflow Run:** \`${workflowRunId}\` (already created)`
    : `**First, create a workflow run:**
\`\`\`bash
pnpm workflow:start --type=w1 --book=${bookSlug}
\`\`\`
Note the workflow run ID (e.g., \`wfrun_abc123\`) - you'll use it for all commands below.`;

  const runIdPlaceholder = workflowRunId || '{workflow_run_id}';

  return `# W1 Strategic Workflow: ${planId}

${resumeNote}
## Overview

You are executing a strategic W1 editing workflow for **${bookTitle}** (${bookSlug}).

## ⚠️ WORKFLOW COMPLETION CHECKLIST

A workflow is NOT complete until ALL of these are done:

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Planning | ⬜ | Create improvement plan from analysis |
| 2 | Content Modification | ⬜ | Modify chapters, save to artifacts |
| 3 | Validation | ⬜ | Run w1:validate to compare metrics |
| 4 | Human Gate | ⬜ | Wait for user approval |
| 5a | Create New Version | ⬜ | mkdir books/core/vX.Y.Z with chapters/ and sheets/ |
| 5b | Copy Unchanged | ⬜ | cp -r current version chapters to new version |
| 5c | Apply Modified | ⬜ | cp workflow artifacts chapters to new version (overwrites) |
| 5d | Update DB Version | ⬜ | UPDATE books SET current_version |
| 5e | Build HTML/PDF | ⬜ | Run build:book and finalize-pdf |
| 5f | Update Run Status | ⬜ | UPDATE workflow_runs SET status = 'completed' |
| 5g | Update State | ⬜ | Set state.json current_phase = 'completed' |

**Mark each step as you complete it in your tracking.**

> **⚠️ CRITICAL: Source files are MARKDOWN (.md) in \`books/\` directories.**
> **NEVER edit HTML, PDF, or other generated output files.**
> **The w1:content-modify command will tell you which markdown files to modify.**

## Setup

${workflowSetup}

## Files to Read First

1. **Strategic Plan:** \`${artifactsDir}/strategy.json\`
2. **Current State:** \`${artifactsDir}/state.json\`

Read both files now to understand:
- The long-term goal (metric threshold)
- Improvement areas to work through
- Current progress (if resuming)

## Workflow Phases

### Phase 1: Planning

Create the improvement plan from the strategic analysis:

\`\`\`bash
pnpm w1:planning --run=${runIdPlaceholder}
\`\`\`

Read the generated prompt at \`data/w1-prompts/${runIdPlaceholder}/pm-planning.txt\` and create the plan.

### Phase 2: Content Modification

For each improvement area in the plan:

1. **Generate writer prompt:**
   \`\`\`bash
   pnpm w1:content-modify --run=${runIdPlaceholder}
   \`\`\`

2. **Execute modifications:** Read the writer prompt and modify chapters as specified.

3. **Save results:**
   \`\`\`bash
   pnpm w1:content-modify --save-writer --run=${runIdPlaceholder} --chapters=data/w1-artifacts/${runIdPlaceholder}/chapters/
   \`\`\`

4. **Update state:** After modifications, update \`${artifactsDir}/state.json\`:
   - Mark area as completed
   - Increment current_area_index

### Phase 3: Validation (MANDATORY)

> **⚠️ CRITICAL: Do NOT skip this phase. Do NOT proceed to Human Gate without completing validation.**

After content modifications, you MUST validate before proceeding:

**Step 3.1 - Run chapter validation:**
\`\`\`bash
pnpm w1:validate-chapters --run=${runIdPlaceholder}
\`\`\`

**Step 3.2 - Run full validation to get metrics:**
\`\`\`bash
pnpm w1:validate --book=${bookSlug} --run=${runIdPlaceholder}
\`\`\`

**Step 3.3 - Record the results:**
- Note the overall_score from validation output
- Compare against metric_threshold (default 8.0) from \`${artifactsDir}/strategy.json\`

**Step 3.4 - Decision point:**
| Condition | Action |
|-----------|--------|
| overall_score >= metric_threshold | ✅ Proceed to Phase 4 (Human Gate) |
| overall_score < threshold AND current_cycle < max_cycles | 🔄 Increment cycle, return to Phase 2 |
| overall_score < threshold AND current_cycle >= max_cycles | ⚠️ Proceed to Phase 4 (escalate to human) |

**Step 3.5 - Update state:**
Update \`${artifactsDir}/state.json\` with:
- validation_cycles: add new entry with metrics_before, metrics_after, passed
- current_cycle: increment if iterating
- cumulative_delta: calculate (new_score - baseline_score)

### Phase 4: Human Gate

**Prerequisite:** Phase 3 validation MUST be complete. If you haven't run validation, go back and do it now.

When metrics are met OR max cycles exceeded:

1. **Prepare for human review:**
   \`\`\`bash
   pnpm w1:human-gate --run=${runIdPlaceholder}
   \`\`\`

2. **STOP and report to user:**
   - Show current metrics vs target
   - Show cycles used vs max
   - List changes made
   - Ask user to review and run either:
     - \`pnpm w1:human-gate --approve --run=${runIdPlaceholder}\`
     - \`pnpm w1:human-gate --reject --run=${runIdPlaceholder} --reason="..."\`

3. **Do not proceed** until user explicitly approves.

### Phase 5: Finalization

> **⚠️ CRITICAL: This phase has multiple steps. Do NOT skip any steps.**
> **The workflow is NOT complete until all finalization steps are done and state is updated.**

After human approval, you must complete ALL of the following:

#### Step 5.1: Determine Version Bump

Check the current version from database:
\`\`\`bash
sqlite3 data/project.db "SELECT source_path, current_version FROM books WHERE slug = '${bookSlug}';"
\`\`\`

Decide version bump type based on changes:
- **patch** (x.x.1): Minor fixes, typos, clarifications
- **minor** (x.1.0): New content, significant rewrites
- **major** (1.0.0): Breaking changes, major restructuring

#### Step 5.2: Create New Version Directory

Create the new version folder and copy ALL chapters (unchanged + modified):

\`\`\`bash
# Example: if current is v1.3.0 and bumping to v1.4.0
NEW_VERSION="v1.4.0"
CURRENT_VERSION="v1.3.0"

# Create new version directory
mkdir -p books/core/\${NEW_VERSION}/chapters
mkdir -p books/core/\${NEW_VERSION}/sheets

# Copy ALL chapters from current version to new version (preserves unchanged chapters)
cp -r books/core/\${CURRENT_VERSION}/chapters/* books/core/\${NEW_VERSION}/chapters/
cp -r books/core/\${CURRENT_VERSION}/sheets/* books/core/\${NEW_VERSION}/sheets/

# Now overlay the modified chapters from workflow artifacts
cp data/w1-artifacts/${runIdPlaceholder}/chapters/*.md books/core/\${NEW_VERSION}/chapters/
\`\`\`

**IMPORTANT:** The new version directory must contain ALL chapters:
- Unchanged chapters: copied from current version
- Modified chapters: copied from workflow artifacts (overwrites the unchanged copies)

#### Step 5.3: Update Database Version

Update the book's current_version in the database:
\`\`\`bash
sqlite3 data/project.db "UPDATE books SET current_version = '1.4.0' WHERE slug = '${bookSlug}';"
\`\`\`

#### Step 5.4: Build HTML and PDF from New Version

Now build outputs from the NEW version directory:

\`\`\`bash
# Build web reader HTML
pnpm build:book --book=${bookSlug}

# Build print HTML
pnpm w1:finalize-print-html --book=${bookSlug} --run=${runIdPlaceholder}

# Generate PDF
pnpm w1:finalize-pdf --book=${bookSlug}
\`\`\`

#### Step 5.5: Update Workflow State

Update \`${artifactsDir}/state.json\`:
\`\`\`json
{
  "current_phase": "completed",
  "completed_at": "<ISO timestamp>",
  "new_version": "1.4.0",
  "previous_version": "1.3.0",
  "finalization_steps": {
    "version_created": true,
    "chapters_copied": true,
    "modified_chapters_applied": true,
    "html_built": true,
    "pdf_generated": true
  }
}
\`\`\`

#### Step 5.6: Update Workflow Run Status

\`\`\`bash
sqlite3 data/project.db "UPDATE workflow_runs SET status = 'completed', updated_at = datetime('now') WHERE id = '${runIdPlaceholder}';"
\`\`\`

#### Step 5.7: Summary Report

Report to user:
- Previous version: v1.3.0
- New version: v1.4.0
- Chapters modified: [list from artifacts]
- New version path: books/core/v1.4.0/
- HTML built: ✅
- PDF generated: ✅
- Workflow status: completed

## State Management

**CRITICAL:** Update \`${artifactsDir}/state.json\` after EVERY significant action:

\`\`\`json
{
  "current_phase": "planning|iterating|validating|human_gate|finalizing|completed|failed",
  "current_area_index": 0,
  "areas_completed": ["area_001"],
  "cumulative_delta": 0.5,
  "current_cycle": 1,
  "validation_cycles": [],
  "last_updated": "2024-01-15T10:30:00Z",
  "workflow_run_id": "${runIdPlaceholder}"
}
\`\`\`

This ensures progress is saved if the session fails.

## Error Handling

If any command fails:
1. Update state with error_message
2. Set current_phase to 'failed'
3. Report the error and stop

## Begin Execution

1. Create workflow run if needed (see Setup above)
2. Read \`${artifactsDir}/strategy.json\` and \`${artifactsDir}/state.json\`
3. Determine current phase from state
4. Continue from where you left off (or start Phase 1 if new)
5. Follow the workflow until human gate or completion
`;
}

// ============================================================
// Parallel Execution Prompts (New Architecture)
// ============================================================

import type { ImprovementArea, StrategicPlan } from './strategy-types.js';
import { getRequiredDelta, getApprovalCriteria } from './threshold-calculator.js';

export interface AreaExecutionPromptContext {
  planId: string;
  area: ImprovementArea;
  workflowRunId: string;
  bookSlug: string;
  artifactsDir: string;
  useDynamicDeltas: boolean;
}

/**
 * Generate a prompt for executing a single improvement area.
 * This prompt is dispatched to a subagent via the Task tool.
 */
export function generateAreaExecutionPrompt(context: AreaExecutionPromptContext): string {
  const { planId, area, workflowRunId, bookSlug, artifactsDir, useDynamicDeltas } = context;

  const currentScore = area.baseline_score ?? 7.0;
  const dynamicDelta = getRequiredDelta(currentScore);
  const criteria = getApprovalCriteria(currentScore);
  const requiredDelta = useDynamicDeltas ? dynamicDelta : (area.delta_target ?? 1.0);

  const chaptersSection = area.target_chapters.length > 0
    ? area.target_chapters.map(c => `- \`${c}\``).join('\n')
    : '- _All chapters in scope_';

  const issuesSection = area.target_issues.length > 0
    ? area.target_issues.map(i => `- ${i}`).join('\n')
    : '- _General improvements_';

  return `# Area Executor: ${area.name}

## Context

- **Plan ID:** ${planId}
- **Area ID:** ${area.area_id}
- **Workflow Run:** ${workflowRunId}
- **Book:** ${bookSlug}

## Area Details

- **Name:** ${area.name}
- **Type:** ${area.type}
- **Priority:** ${area.priority}
- **Target Dimension:** ${area.target_dimension ?? 'overall_score'}
${area.description ? `- **Description:** ${area.description}` : ''}

### Target Chapters
${chaptersSection}

### Target Issues
${issuesSection}

## Cycle Management

- **Current Cycle:** ${area.current_cycle}/${area.max_cycles}
- **Baseline Score:** ${area.baseline_score?.toFixed(1) ?? 'Not yet set'}
- **Current Score:** ${area.current_score?.toFixed(1) ?? 'Not yet set'}

## Success Criteria

${useDynamicDeltas ? `
> **Dynamic Threshold Applied:** At score ${currentScore.toFixed(1)}, the required delta is **${requiredDelta.toFixed(1)}**
> ${criteria.description}
` : `
> **Static Threshold:** Required delta is **${requiredDelta.toFixed(1)}**
`}

${criteria.canApproveWithStability
  ? '✅ Can approve with stability (any positive delta at this score level)'
  : '⚠️ Must meet full delta threshold - no stability approval'}

## Execution Flow

For each cycle (up to ${area.max_cycles}):

### 1. Writer Phase
Modify the target chapters to address the issues:
\`\`\`bash
pnpm w1:content-modify --run=${workflowRunId} --area=${area.area_id}
\`\`\`

Apply modifications focusing on:
${area.target_dimension ? `- Primary focus: **${area.target_dimension}**` : '- Overall quality improvement'}
${area.target_issues.length > 0 ? `- Issues to address: ${area.target_issues.slice(0, 3).join(', ')}${area.target_issues.length > 3 ? '...' : ''}` : ''}

### 2. Editor Phase
Review the modifications:
- Grammar and clarity
- Style guide compliance
- Consistency

### 3. Domain Expert Phase
Validate the modifications:
- Rules accuracy
- Terminology consistency
- No contradictions introduced

### 4. Mini-Validation
After each cycle, check progress:

\`\`\`bash
pnpm w1:validate-chapters --run=${workflowRunId} --chapters=${area.target_chapters.join(',')}
\`\`\`

**Decision Logic:**
| Condition | Action |
|-----------|--------|
| delta >= ${requiredDelta.toFixed(1)} | ✅ Area COMPLETE - Report success |
| delta < ${requiredDelta.toFixed(1)} AND cycle < ${area.max_cycles} | 🔄 Next cycle |
| delta < ${requiredDelta.toFixed(1)} AND cycle >= ${area.max_cycles} | ⚠️ Area COMPLETE - Report partial success |

## Output Requirements

After completing all cycles or achieving the delta, report:

\`\`\`json
{
  "area_id": "${area.area_id}",
  "status": "completed|failed",
  "cycles_used": <number>,
  "final_score": <number>,
  "delta_achieved": <number>,
  "chapters_modified": [<list of chapters>],
  "notes": "<any issues or observations>"
}
\`\`\`

Save to: \`${artifactsDir}/area-${area.area_id}-result.json\`

## Begin Execution

Start with cycle ${area.current_cycle + 1} of ${area.max_cycles}.
`;
}

export interface RunOrchestratorPromptContext {
  planId: string;
  workflowRunId: string;
  bookSlug: string;
  bookTitle: string;
  artifactsDir: string;
  currentRun: number;
  maxRuns: number;
  areas: ImprovementArea[];
  metricThreshold: number;
  useDynamicDeltas: boolean;
}

/**
 * Generate a prompt for orchestrating a parallel run of all areas.
 * This prompt instructs Claude to dispatch Task tools for each area.
 */
export function generateRunOrchestratorPrompt(context: RunOrchestratorPromptContext): string {
  const {
    planId,
    workflowRunId,
    bookSlug,
    bookTitle,
    artifactsDir,
    currentRun,
    maxRuns,
    areas,
    metricThreshold,
    useDynamicDeltas,
  } = context;

  const areasTable = areas.map(a => {
    const status = a.status === 'completed' ? '✅' : a.status === 'in_progress' ? '🔄' : '⏳';
    const score = a.current_score?.toFixed(1) ?? '-';
    const chapters = a.target_chapters.length;
    return `| ${status} ${a.name} | ${a.priority} | ${chapters} ch | ${score} | ${a.target_dimension ?? 'overall'} |`;
  }).join('\n');

  const pendingAreas = areas.filter(a => a.status === 'pending' || a.status === 'in_progress');

  return `# Run Orchestrator: ${bookTitle}

## Context

- **Plan ID:** ${planId}
- **Workflow Run:** ${workflowRunId}
- **Book:** ${bookSlug}
- **Current Run:** ${currentRun}/${maxRuns}
- **Target Metric:** ${metricThreshold}

## Areas Overview

| Area | Priority | Chapters | Score | Dimension |
|------|----------|----------|-------|-----------|
${areasTable}

## Parallel Execution Instructions

**IMPORTANT:** Execute all pending areas in PARALLEL using the Task tool.

### Step 1: Dispatch All Areas

In a SINGLE message, dispatch a Task for each pending area:

${pendingAreas.map(area => `
**Task for: ${area.name}**
\`\`\`
Task(subagent_type="general-purpose", prompt="<area execution prompt for ${area.area_id}>")
\`\`\`
`).join('')}

Each Task should include:
1. Area-specific context from \`${artifactsDir}/strategy.json\`
2. Target chapters and issues
3. Success criteria with dynamic thresholds
4. Instructions to save results

### Step 2: Wait for All Tasks

Monitor all dispatched tasks until completion:
- Check each area's result file
- Aggregate completion status

### Step 3: Full Validation

After ALL areas complete, run full book validation:

\`\`\`bash
pnpm w1:validate --book=${bookSlug} --run=${workflowRunId}
\`\`\`

### Step 4: Threshold Check

Compare validation results against the strategic plan:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| overall_score | >= ${metricThreshold} | ? | ? |

**Decision Matrix:**

| Condition | Action |
|-----------|--------|
| overall_score >= ${metricThreshold} | ✅ Trigger Human Gate (threshold_met) |
| overall_score < ${metricThreshold} AND run < ${maxRuns} | 🔄 Start Run ${currentRun + 1} |
| overall_score < ${metricThreshold} AND run >= ${maxRuns} | ⚠️ Trigger Human Gate (max_runs_exhausted) |

### Step 5: State Update

After the run completes, update \`${artifactsDir}/state.json\`:

\`\`\`json
{
  "current_phase": "<next phase>",
  "current_run": ${currentRun},
  "runs": [
    {
      "run_number": ${currentRun},
      "started_at": "<timestamp>",
      "completed_at": "<timestamp>",
      "baseline_overall": <score>,
      "final_overall": <score>,
      "areas_completed": <count>,
      "areas_total": ${areas.length},
      "passed": <boolean>
    }
  ],
  "last_updated": "<timestamp>"
}
\`\`\`

## Triggering Human Gate

When ready for human review:

\`\`\`bash
pnpm w1:human-gate --run=${workflowRunId} --reason=<threshold_met|max_runs_exhausted>
\`\`\`

**STOP** and report to the user:
- Current metrics vs target
- Runs used: ${currentRun}/${maxRuns}
- Summary of changes per area
- Ask for approval/rejection/full-review

**After User Approves:**

Once the user runs \`pnpm w1:human-gate --approve\`, proceed with finalization:

### Finalization Steps (MANDATORY after approval)

1. **Determine version bump** (patch/minor/major based on scope of changes)

2. **Create NEW version directory:**
   \`\`\`bash
   # Check current version
   sqlite3 data/project.db "SELECT current_version FROM books WHERE slug = '${bookSlug}';"

   # Create new version (e.g., v1.3.0 -> v1.4.0)
   mkdir -p books/core/v1.4.0/chapters books/core/v1.4.0/sheets

   # Copy ALL chapters from current version
   cp -r books/core/v1.3.0/chapters/* books/core/v1.4.0/chapters/
   cp -r books/core/v1.3.0/sheets/* books/core/v1.4.0/sheets/

   # Overlay modified chapters from workflow artifacts
   cp data/w1-artifacts/${workflowRunId}/chapters/*.md books/core/v1.4.0/chapters/
   \`\`\`

3. **Update database version:**
   \`\`\`bash
   sqlite3 data/project.db "UPDATE books SET current_version = '1.4.0' WHERE slug = '${bookSlug}';"
   \`\`\`

4. **Build HTML and PDF from new version:**
   \`\`\`bash
   pnpm build:book --book=${bookSlug}
   pnpm w1:finalize-pdf --book=${bookSlug}
   \`\`\`

5. **Update workflow status:**
   \`\`\`bash
   sqlite3 data/project.db "UPDATE workflow_runs SET status = 'completed', updated_at = datetime('now') WHERE id = '${workflowRunId}';"
   \`\`\`

6. **Report completion** with:
   - Previous version → New version
   - Modified chapters list
   - Generated files (HTML, PDF paths)

## Dynamic Thresholds${useDynamicDeltas ? ` (ENABLED)` : ` (DISABLED)`}

${useDynamicDeltas ? `
Delta requirements scale with current score:
- Below 7.0: 1.0 delta required
- 7.0-7.5: 0.7 delta required
- 7.5-8.0: 0.5 delta required
- 8.0-8.5: 0.3 delta required
- 8.5-9.0: 0.2 delta required
- Above 9.0: 0.1 delta required (maintenance mode)

At high scores (8.0+), areas can be approved with any positive delta.
` : `
Static delta threshold from strategic plan applies to all areas.
`}

## Begin Run ${currentRun}

1. Read \`${artifactsDir}/strategy.json\` for full plan details
2. Dispatch ALL ${pendingAreas.length} pending areas in parallel
3. Monitor completion
4. Run full validation
5. Make threshold decision
`;
}

/**
 * Generate shared context for parallel writer agents.
 * This provides common information all area executors need.
 */
export interface ParallelWriterSharedContext {
  workflowRunId: string;
  planId: string;
  bookSlug: string;
  bookTitle: string;
  artifactsDir: string;
  plan: StrategicPlan;
  contentStyleGuide?: string;
  mechanicsStyleGuide?: string;
}

export function generateParallelSharedContext(context: ParallelWriterSharedContext): string {
  const {
    workflowRunId,
    planId,
    bookSlug,
    bookTitle,
    artifactsDir,
    plan,
    contentStyleGuide,
    mechanicsStyleGuide,
  } = context;

  const areasOverview = plan.areas.map(a =>
    `- **${a.name}** (${a.area_id}): ${a.target_chapters.length} chapters, priority ${a.priority}`
  ).join('\n');

  return `# Parallel Writer Shared Context

## Workflow Info
- **Run ID:** ${workflowRunId}
- **Plan ID:** ${planId}
- **Book:** ${bookTitle} (${bookSlug})
- **Artifacts:** ${artifactsDir}

## Improvement Plan Summary

**Goal:** Achieve overall score >= ${plan.goal.metric_threshold}
**Max Runs:** ${plan.goal.max_runs}
**Max Cycles per Area:** ${plan.goal.max_cycles}

### Areas
${areasOverview}

### Target Issues

The plan targets these issue categories:
${Array.from(new Set(plan.areas.flatMap(a => a.target_issues))).slice(0, 10).map(i => `- ${i}`).join('\n')}

### Constraints

- Dynamic deltas: ${plan.goal.use_dynamic_deltas ? 'Enabled' : 'Disabled'}
- Delta threshold: ${plan.goal.delta_threshold_for_validation}

## Style Guides

### Content Style
${contentStyleGuide ?? '_Load from data/style-guides/content.md_'}

### Mechanics Style
${mechanicsStyleGuide ?? '_Load from data/style-guides/mechanics.md_'}

## Cross-Area Coordination

**IMPORTANT:** Areas execute in parallel. To avoid conflicts:
1. Each area works on its assigned chapters only
2. Use consistent terminology from the style guide
3. Don't introduce changes that affect other areas' chapters
4. Report any cross-chapter dependencies discovered

## Output Locations

- Area results: \`${artifactsDir}/area-{area_id}-result.json\`
- Modified chapters: \`${artifactsDir}/chapters/{chapter}.md\`
- Validation: \`${artifactsDir}/validation-run-{n}.json\`
`;
}
