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
