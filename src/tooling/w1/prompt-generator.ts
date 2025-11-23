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
}

export function generateMetricsEvalPrompt(context: MetricsEvalPromptContext): string {
  // Load PM metrics eval prompt template
  const promptPath = join(process.cwd(), 'src/tooling/agents/prompts/pm-metrics-eval.md');
  const promptTemplate = existsSync(promptPath)
    ? readFileSync(promptPath, 'utf-8')
    : '';

  const baselineJson = JSON.stringify(context.baselineMetrics, null, 2);
  const newMetricsJson = JSON.stringify(context.newMetrics, null, 2);

  let prompt = `# W1 Metrics Evaluation Task

You are the PM Metrics Evaluator agent for W1 workflow run \`${context.runId}\`.

## Context

- **Book:** ${context.bookSlug}
- **Workflow Run:** ${context.runId}
- **Iteration:** ${context.iteration}

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
