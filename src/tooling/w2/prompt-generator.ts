// src/tooling/w2/prompt-generator.ts

import { readFileSync, existsSync } from 'fs';

/**
 * W2 Prompt Generators
 *
 * Generate prompts for Claude Code to execute each W2 step.
 * All prompts emphasize: content is frozen, only presentation changes.
 */

export interface PmReviewPromptContext {
  runId: string;
  bookSlug: string;
  bookTitle: string;
  htmlPath: string;
  releaseNotesPath: string;
}

export function generatePmReviewPrompt(context: PmReviewPromptContext): string {
  const { runId, bookSlug, bookTitle, htmlPath, releaseNotesPath } = context;

  // Load release notes if available
  let releaseNotesContent = '_No release notes available_';
  if (existsSync(releaseNotesPath)) {
    releaseNotesContent = readFileSync(releaseNotesPath, 'utf-8');
  }

  return `# W2 PM Review Task

You are the PM Review agent for W2 PDF workflow run \`${runId}\`.

## Context

- **Book:** ${bookTitle} (${bookSlug})
- **Workflow Run:** ${runId}
- **HTML Source:** ${htmlPath}

## CRITICAL CONSTRAINT

**Content is FROZEN.** You are reviewing for PRESENTATION priorities only.
Do NOT suggest any text changes, copy edits, or content modifications.
Focus only on: layout, formatting, visual hierarchy, page flow.

## Release Notes (What Changed in W1)

\`\`\`json
${releaseNotesContent}
\`\`\`

## Task

Review the release notes to identify which sections need the most layout/presentation attention.
Consider:
- Sections with significant content additions (may need page break adjustments)
- Tables that were modified (may need formatting review)
- New examples or callouts (may need visual styling)

## Output Requirements

Create a JSON file with this structure:

\`\`\`json
{
  "priority_sections": ["chapter-06", "chapter-10"],
  "focus_areas": ["tables need better formatting", "examples are hard to scan"],
  "constraints": {
    "page_budget": null,
    "preserve_toc": true
  }
}
\`\`\`

Save the result:
\`\`\`bash
pnpm w2:pm-review --save --run=${runId} --result=data/w2-artifacts/${runId}/pm-review.json
\`\`\`
`;
}

export interface LayoutPromptContext {
  runId: string;
  bookSlug: string;
  htmlPath: string;
  pmReviewPath: string;
}

export function generateLayoutPrompt(context: LayoutPromptContext): string {
  const { runId, bookSlug, htmlPath, pmReviewPath } = context;

  // Load PM review if available
  let pmReviewContent = '_No PM review available_';
  if (existsSync(pmReviewPath)) {
    pmReviewContent = readFileSync(pmReviewPath, 'utf-8');
  }

  return `# W2 Layout Planning Task

You are the Layout Agent for W2 PDF workflow run \`${runId}\`.

## Context

- **Book:** ${bookSlug}
- **Workflow Run:** ${runId}
- **HTML Source:** ${htmlPath}

## CRITICAL CONSTRAINT

**Content is FROZEN.** You are planning STRUCTURAL LAYOUT only.
Do NOT suggest any text changes. Focus only on:
- Page breaks
- Margins
- Table layout strategy
- Column layouts

## PM Review (Priority Areas)

\`\`\`json
${pmReviewContent}
\`\`\`

## Task

Create a structural layout plan addressing the priority sections.
Consider:
- Where to place page breaks (before chapters, before major sections)
- Margin sizes for print binding (inner margin larger for binding)
- How to handle tables that span pages
- Whether any sections should use 2-column layout

## Output Requirements

Create a JSON file with this structure:

\`\`\`json
{
  "page_breaks": [
    { "before": "chapter-06", "reason": "new section" }
  ],
  "margins": {
    "inner": "1in",
    "outer": "0.75in",
    "top": "0.75in",
    "bottom": "0.75in"
  },
  "table_strategy": "allow-page-break-within",
  "column_layouts": [
    { "section": "appendix", "columns": 2 }
  ]
}
\`\`\`

Save the result:
\`\`\`bash
pnpm w2:layout --save --run=${runId} --plan=data/w2-artifacts/${runId}/layout-plan.json
\`\`\`
`;
}

export interface DesignPromptContext {
  runId: string;
  bookSlug: string;
  layoutPlanPath: string;
  pmReviewPath: string;
}

export function generateDesignPrompt(context: DesignPromptContext): string {
  const { runId, bookSlug, layoutPlanPath, pmReviewPath } = context;

  // Load layout plan
  let layoutPlanContent = '_No layout plan available_';
  if (existsSync(layoutPlanPath)) {
    layoutPlanContent = readFileSync(layoutPlanPath, 'utf-8');
  }

  // Load PM review
  let pmReviewContent = '_No PM review available_';
  if (existsSync(pmReviewPath)) {
    pmReviewContent = readFileSync(pmReviewPath, 'utf-8');
  }

  return `# W2 Design Planning Task

You are the Design Agent for W2 PDF workflow run \`${runId}\`.

## Context

- **Book:** ${bookSlug}
- **Workflow Run:** ${runId}

## CRITICAL CONSTRAINT

**Content is FROZEN.** You are planning VISUAL DESIGN only.
Do NOT suggest any text changes. Focus only on:
- Typography (font sizes, line heights)
- Colors (accent colors, backgrounds)
- Spacing (paragraph spacing, section spacing)
- Image prompts for AI generation

## Layout Plan

\`\`\`json
${layoutPlanContent}
\`\`\`

## PM Review (Focus Areas)

\`\`\`json
${pmReviewContent}
\`\`\`

## Task

Create a visual design plan and image prompts.

### Design Plan
Consider:
- Body text size (10pt-12pt typical for print)
- Heading scale (1.2-1.5 typical)
- Accent colors that work in print
- Spacing that aids readability

### Image Prompts
For each image needed:
- Specify exact aspect ratio (16:9, 3:2, 4:3, 1:1, 2:3, 9:16)
- Write detailed prompt including style, mood, colors
- Specify where in the book it will appear

## Output Requirements

Create TWO JSON files:

**design-plan.json:**
\`\`\`json
{
  "typography": {
    "body": "11pt",
    "headings_scale": 1.25
  },
  "colors": {
    "accent": "#8B4513",
    "callout_bg": "#FFF8DC"
  },
  "spacing": {
    "paragraph": "0.5em",
    "section": "2em"
  }
}
\`\`\`

**image-prompts.json:**
\`\`\`json
{
  "prompts": [
    {
      "id": "chapter-header-06",
      "location": "Chapter 6 header",
      "aspect_ratio": "16:9",
      "prompt": "Fantasy tavern interior, warm candlelight, adventurers gathered around table studying maps, detailed medieval style, muted earth tones"
    }
  ]
}
\`\`\`

Save the results:
\`\`\`bash
pnpm w2:design --save --run=${runId} --plan=data/w2-artifacts/${runId}/design-plan.json
\`\`\`

(Image prompts are saved automatically alongside the design plan)
`;
}

export interface CreatePdfPromptContext {
  runId: string;
  bookSlug: string;
  htmlPath: string;
  layoutPlanPath: string;
  designPlanPath: string;
  assetsPath: string | null;
  outputPath: string;
}

export function generateCreatePdfPrompt(context: CreatePdfPromptContext): string {
  const { runId, bookSlug, htmlPath, layoutPlanPath, designPlanPath, assetsPath, outputPath } = context;

  // Load plans
  let layoutPlanContent = '_No layout plan available_';
  if (existsSync(layoutPlanPath)) {
    layoutPlanContent = readFileSync(layoutPlanPath, 'utf-8');
  }

  let designPlanContent = '_No design plan available_';
  if (existsSync(designPlanPath)) {
    designPlanContent = readFileSync(designPlanPath, 'utf-8');
  }

  const assetsSection = assetsPath
    ? `\n## Image Assets\n\nAssets folder: \`${assetsPath}\`\n\nPlace images according to the design plan's image prompts.`
    : '\n## Image Assets\n\n_No assets provided yet. The PDF will be generated without custom images._';

  return `# W2 PDF Creation Task

You are the PDF Creator Agent for W2 PDF workflow run \`${runId}\`.

## Context

- **Book:** ${bookSlug}
- **Workflow Run:** ${runId}
- **HTML Source:** ${htmlPath}
- **Output:** ${outputPath}

## CRITICAL CONSTRAINT

**Content is FROZEN.** You are applying PRESENTATION settings only.
The HTML content must not be modified. Apply:
- CSS overrides from the design plan
- Page break rules from the layout plan
- Image placement if assets provided

## Layout Plan

\`\`\`json
${layoutPlanContent}
\`\`\`

## Design Plan

\`\`\`json
${designPlanContent}
\`\`\`
${assetsSection}

## Task

Generate a print-ready PDF:

1. **Apply Layout Plan**
   - Set page margins as specified
   - Add page breaks before specified sections
   - Apply table strategy

2. **Apply Design Plan**
   - Set typography (body size, heading scale)
   - Apply colors (accent, callout backgrounds)
   - Set spacing (paragraph, section)

3. **Generate PDF**
   - Use @razorweave/pdf-gen
   - Output to: ${outputPath}

## Command

\`\`\`bash
pnpm w2:create-pdf --save --run=${runId} --pdf=${outputPath}
\`\`\`
`;
}

export interface EditorReviewPromptContext {
  runId: string;
  bookSlug: string;
  pdfPath: string;
  iteration: number;
}

export function generateEditorReviewPrompt(context: EditorReviewPromptContext): string {
  const { runId, bookSlug, pdfPath, iteration } = context;

  return `# W2 Editor Review Task

You are the PDF Editor Agent for W2 PDF workflow run \`${runId}\`.

## Context

- **Book:** ${bookSlug}
- **Workflow Run:** ${runId}
- **PDF to Review:** ${pdfPath}
- **Iteration:** ${iteration}

## CRITICAL CONSTRAINT

**Content is FROZEN.** You are reviewing PRESENTATION QUALITY only.
Do NOT flag content issues. Focus only on:
- Page break placement
- Typography consistency
- Visual hierarchy
- Print-readiness

## Task

Review the generated PDF for presentation quality issues.

### Check For:

1. **Page Breaks**
   - Tables split awkwardly across pages?
   - Headings orphaned at bottom of pages?
   - Widows/orphans in paragraphs?

2. **Typography**
   - Consistent font sizes throughout?
   - Proper heading hierarchy?
   - Readable line lengths?

3. **Visual Hierarchy**
   - Clear section boundaries?
   - Callouts stand out appropriately?
   - Examples visually distinct?

4. **Print-Readiness**
   - Inner margins sufficient for binding?
   - Page numbers positioned correctly?
   - No content in margin bleed areas?

## Output Requirements

Create a JSON file:

\`\`\`json
{
  "approved": false,
  "issues": [
    {
      "type": "layout",
      "location": "page 47",
      "problem": "table split awkwardly across pages",
      "suggestion": "add page break before table or reduce spacing"
    }
  ]
}
\`\`\`

If no issues, set \`approved: true\` and leave issues empty.

Save the result:
\`\`\`bash
pnpm w2:editor-review --save --run=${runId} --result=data/w2-artifacts/${runId}/editor-review.json
\`\`\`
`;
}

export interface DeriveDigitalPromptContext {
  runId: string;
  bookSlug: string;
  printPdfPath: string;
  digitalPdfPath: string;
}

export function generateDeriveDigitalPrompt(context: DeriveDigitalPromptContext): string {
  const { runId, bookSlug, printPdfPath, digitalPdfPath } = context;

  return `# W2 Digital PDF Derivation Task

You are deriving a digital PDF from the approved print master for W2 workflow run \`${runId}\`.

## Context

- **Book:** ${bookSlug}
- **Workflow Run:** ${runId}
- **Print PDF:** ${printPdfPath}
- **Digital Output:** ${digitalPdfPath}

## Task

Create a digital-optimized PDF from the print master.

### Derivation Steps:

1. **Remove Print Elements**
   - Remove bleed/crop marks (if present)
   - Remove registration marks

2. **Add Digital Features**
   - Add clickable TOC links
   - Add cross-reference hyperlinks
   - Add PDF bookmarks for navigation

3. **Optimize for Screen**
   - Compress images for smaller file size
   - Embed web-friendly fonts
   - Optimize for screen viewing (RGB color)

4. **Generate Output**
   - Output to: ${digitalPdfPath}

## Command

\`\`\`bash
pnpm w2:derive-digital --run=${runId}
\`\`\`
`;
}

export interface StrategicPromptContext {
  planId: string;
  workflowRunId: string;
  bookSlug: string;
  bookTitle: string;
  artifactsDir: string;
  htmlPath: string;
  releaseNotesPath: string;
  isResume: boolean;
}

export function generateStrategicPrompt(context: StrategicPromptContext): string {
  const {
    planId,
    workflowRunId,
    bookSlug,
    bookTitle,
    artifactsDir,
    htmlPath,
    releaseNotesPath,
    isResume,
  } = context;

  const resumeNote = isResume
    ? `\n> **RESUMING:** Check state.json for current progress.\n`
    : '';

  return `# W2 Strategic Workflow: ${planId}

${resumeNote}
## Overview

You are executing a W2 PDF workflow for **${bookTitle}** (${bookSlug}).

**CRITICAL:** Content is FROZEN. Only presentation changes are allowed.

## Files to Read First

1. **Strategy:** \`${artifactsDir}/strategy.json\`
2. **State:** \`${artifactsDir}/state.json\`

## Inputs

- **Print HTML:** ${htmlPath}
- **Release Notes:** ${releaseNotesPath}

## Workflow Steps

### Step 1: PM Review
\`\`\`bash
pnpm w2:pm-review --run=${workflowRunId}
\`\`\`
Read prompt, identify priority sections, save result.

### Step 2: Layout Planning
\`\`\`bash
pnpm w2:layout --run=${workflowRunId}
\`\`\`
Read prompt, create layout plan, save result.

### Step 3: Design Planning
\`\`\`bash
pnpm w2:design --run=${workflowRunId}
\`\`\`
Read prompt, create design plan + image prompts, save result.

### Step 4: Create PDF
\`\`\`bash
pnpm w2:create-pdf --run=${workflowRunId}
\`\`\`
Read prompt, generate PDF, save result.

### Step 5: Editor Review
\`\`\`bash
pnpm w2:editor-review --run=${workflowRunId}
\`\`\`
Read prompt, review PDF presentation, save result.

**If issues found:** Return to Step 2 (Layout). Max 3 cycles.

### Step 6: Human Gate
\`\`\`bash
pnpm w2:human-gate --run=${workflowRunId}
\`\`\`

**STOP** and report to user:
- Show draft PDF path
- Show image prompts (if any)
- Ask for approval/rejection/assets

### Step 7: Derive Digital (after approval)
\`\`\`bash
pnpm w2:derive-digital --run=${workflowRunId}
\`\`\`

### Step 8: Finalize
\`\`\`bash
pnpm w2:finalize --run=${workflowRunId}
\`\`\`

## State Management

Update \`${artifactsDir}/state.json\` after EVERY step:

\`\`\`json
{
  "current_step": "<step-name>",
  "completed_steps": ["pm-review", "layout"],
  "iteration_count": 1,
  "editor_cycles": 0,
  "last_updated": "<ISO timestamp>",
  "human_feedback": null,
  "assets_path": null
}
\`\`\`

## Begin Execution

1. Read strategy.json and state.json
2. Continue from current_step (or start at pm-review if new)
3. Follow steps until human gate or completion
`;
}
