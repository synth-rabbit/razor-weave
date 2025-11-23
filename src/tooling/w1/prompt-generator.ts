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
