# W2 PDF Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the W2 PDF workflow that produces publication-quality print and digital PDFs with iterative layout/design improvements.

**Architecture:** 5 agents (PM Review, Layout, Design, Creator, Editor) following W1's prompt-based pattern. Workflow engine integration for structure/checkpointing. Content is frozen from W1; only presentation changes.

**Tech Stack:** TypeScript, better-sqlite3, @razorweave/pdf-gen, workflow engine types

**Reference Design:** `docs/plans/2025-11-28-w2-pdf-design.md`

---

## Task 1: Create W2 Module Structure

**Files:**
- Create: `src/tooling/w2/index.ts`
- Create: `src/tooling/w2/types.ts`

**Step 1: Create types file**

```typescript
// src/tooling/w2/types.ts

/**
 * W2 PDF Workflow Types
 *
 * Types for the PDF publication workflow. Content is frozen;
 * these types describe presentation-only changes.
 */

// PM Review output - identifies priority areas for layout attention
export interface PmReviewResult {
  priority_sections: string[];
  focus_areas: string[];
  constraints: {
    page_budget: number | null;
    preserve_toc: boolean;
  };
}

// Layout Agent output - structural presentation plan
export interface LayoutPlan {
  page_breaks: Array<{
    before: string;
    reason: string;
  }>;
  margins: {
    inner: string;
    outer: string;
    top?: string;
    bottom?: string;
  };
  table_strategy: 'keep-together' | 'allow-page-break-within';
  column_layouts: Array<{
    section: string;
    columns: 1 | 2;
  }>;
}

// Design Agent output - visual presentation plan
export interface DesignPlan {
  typography: {
    body: string;
    headings_scale: number;
  };
  colors: {
    accent: string;
    callout_bg: string;
  };
  spacing: {
    paragraph: string;
    section: string;
  };
}

// Image prompt for AI generation
export interface ImagePrompt {
  id: string;
  location: string;
  aspect_ratio: '16:9' | '3:2' | '4:3' | '1:1' | '2:3' | '9:16';
  prompt: string;
}

export interface ImagePromptsResult {
  prompts: ImagePrompt[];
}

// Editor review output
export interface EditorReviewResult {
  approved: boolean;
  issues: Array<{
    type: 'layout' | 'typography' | 'spacing' | 'print-readiness';
    location: string;
    problem: string;
    suggestion: string;
  }>;
}

// W2 strategic plan context
export interface W2StrategyContext {
  planId: string;
  workflowRunId: string;
  bookSlug: string;
  bookTitle: string;
  htmlPath: string;
  releaseNotesPath: string;
  artifactsDir: string;
}

// W2 state tracking
export interface W2State {
  current_step: 'pm-review' | 'layout' | 'design' | 'create-pdf' | 'editor-review' | 'human-gate' | 'derive-digital' | 'finalize' | 'completed';
  completed_steps: string[];
  iteration_count: number;
  editor_cycles: number;
  last_updated: string;
  human_feedback: string | null;
  assets_path: string | null;
}
```

**Step 2: Create index file**

```typescript
// src/tooling/w2/index.ts

export * from './types.js';
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors for the new files

**Step 4: Commit**

```bash
git add src/tooling/w2/
git commit -m "feat(w2): add W2 module structure and types"
```

---

## Task 2: Create W2PromptWriter

**Files:**
- Create: `src/tooling/w2/prompt-writer.ts`
- Modify: `src/tooling/w2/index.ts`

**Step 1: Create prompt writer**

```typescript
// src/tooling/w2/prompt-writer.ts

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface W2PromptWriterOptions {
  runId: string;
  baseDir?: string;
}

/**
 * Writes prompt files for W2 workflow steps.
 * Claude Code reads these prompts to execute each step.
 */
export class W2PromptWriter {
  private promptsDir: string;

  constructor(options: W2PromptWriterOptions) {
    const baseDir = options.baseDir || 'data/w2-prompts';
    this.promptsDir = join(baseDir, options.runId);
    mkdirSync(this.promptsDir, { recursive: true });
  }

  writePmReviewPrompt(content: string): string {
    const path = join(this.promptsDir, 'pm-review.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeLayoutPrompt(content: string): string {
    const path = join(this.promptsDir, 'layout.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeDesignPrompt(content: string): string {
    const path = join(this.promptsDir, 'design.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeCreatePdfPrompt(content: string): string {
    const path = join(this.promptsDir, 'create-pdf.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeEditorReviewPrompt(content: string): string {
    const path = join(this.promptsDir, 'editor-review.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeDeriveDigitalPrompt(content: string): string {
    const path = join(this.promptsDir, 'derive-digital.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  getPromptsDir(): string {
    return this.promptsDir;
  }
}
```

**Step 2: Update index exports**

```typescript
// src/tooling/w2/index.ts

export * from './types.js';
export * from './prompt-writer.js';
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/w2/
git commit -m "feat(w2): add W2PromptWriter class"
```

---

## Task 3: Create W2ResultSaver

**Files:**
- Create: `src/tooling/w2/result-saver.ts`
- Modify: `src/tooling/w2/index.ts`

**Step 1: Create result saver**

```typescript
// src/tooling/w2/result-saver.ts

import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type Database from 'better-sqlite3';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import type {
  PmReviewResult,
  LayoutPlan,
  DesignPlan,
  ImagePromptsResult,
  EditorReviewResult,
} from './types.js';

/**
 * Saves W2 workflow results and registers artifacts.
 */
export class W2ResultSaver {
  private runId: string;
  private artifactRegistry: ArtifactRegistry;

  constructor(db: Database.Database, runId: string) {
    this.runId = runId;
    this.artifactRegistry = new ArtifactRegistry(db);
  }

  savePmReviewResult(result: PmReviewResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'qa_report',
      artifactPath: outputPath,
      metadata: {
        w2_type: 'pm_review',
        priority_sections_count: result.priority_sections.length,
      },
    });
  }

  saveLayoutPlan(plan: LayoutPlan, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(plan, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'layout_plan',
      artifactPath: outputPath,
      metadata: {
        page_breaks_count: plan.page_breaks.length,
        table_strategy: plan.table_strategy,
      },
    });
  }

  saveDesignPlan(plan: DesignPlan, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(plan, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'design_plan',
      artifactPath: outputPath,
      metadata: {
        typography_body: plan.typography.body,
        accent_color: plan.colors.accent,
      },
    });
  }

  saveImagePrompts(prompts: ImagePromptsResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(prompts, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'qa_report',
      artifactPath: outputPath,
      metadata: {
        w2_type: 'image_prompts',
        prompts_count: prompts.prompts.length,
      },
    });
  }

  saveEditorReviewResult(result: EditorReviewResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'qa_report',
      artifactPath: outputPath,
      metadata: {
        w2_type: 'editor_review',
        approved: result.approved,
        issues_count: result.issues.length,
      },
    });
  }

  savePrintPdf(pdfPath: string): void {
    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'pdf_print',
      artifactPath: pdfPath,
      metadata: {
        variant: 'print',
      },
    });
  }

  saveDigitalPdf(pdfPath: string): void {
    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'pdf_digital',
      artifactPath: pdfPath,
      metadata: {
        variant: 'digital',
      },
    });
  }

  saveDraftPdf(pdfPath: string): void {
    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'pdf_draft',
      artifactPath: pdfPath,
      metadata: {
        variant: 'draft',
      },
    });
  }
}
```

**Step 2: Update index exports**

```typescript
// src/tooling/w2/index.ts

export * from './types.js';
export * from './prompt-writer.js';
export * from './result-saver.js';
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/w2/
git commit -m "feat(w2): add W2ResultSaver class"
```

---

## Task 4: Create Prompt Generators - Part 1 (PM Review, Layout)

**Files:**
- Create: `src/tooling/w2/prompt-generator.ts`
- Modify: `src/tooling/w2/index.ts`

**Step 1: Create prompt generator with PM Review and Layout**

```typescript
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
```

**Step 2: Update index exports**

```typescript
// src/tooling/w2/index.ts

export * from './types.js';
export * from './prompt-writer.js';
export * from './result-saver.js';
export * from './prompt-generator.js';
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/w2/
git commit -m "feat(w2): add prompt generators for PM Review and Layout"
```

---

## Task 5: Create Prompt Generators - Part 2 (Design, Create PDF)

**Files:**
- Modify: `src/tooling/w2/prompt-generator.ts`

**Step 1: Add Design prompt generator**

Add to `src/tooling/w2/prompt-generator.ts`:

```typescript
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
```

**Step 2: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/w2/
git commit -m "feat(w2): add prompt generators for Design and Create PDF"
```

---

## Task 6: Create Prompt Generators - Part 3 (Editor Review, Derive Digital)

**Files:**
- Modify: `src/tooling/w2/prompt-generator.ts`

**Step 1: Add remaining prompt generators**

Add to `src/tooling/w2/prompt-generator.ts`:

```typescript
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
```

**Step 2: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/w2/
git commit -m "feat(w2): add remaining prompt generators"
```

---

## Task 7: Create w2-pm-review CLI Command

**Files:**
- Create: `src/tooling/cli-commands/w2-pm-review.ts`

**Step 1: Create the CLI command**

```typescript
// src/tooling/cli-commands/w2-pm-review.ts

/**
 * w2:pm-review CLI Command
 *
 * PM Review step for W2 PDF workflow.
 * Reviews W1 artifacts to identify priority areas for layout attention.
 *
 * Usage:
 *   Generate prompt: pnpm w2:pm-review --run <id>
 *   Save result:     pnpm w2:pm-review --save --run <id> --result <path>
 */

import { parseArgs } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables, runMigrations } from '@razorweave/database';
import { generatePmReviewPrompt } from '../w2/prompt-generator.js';
import { W2PromptWriter } from '../w2/prompt-writer.js';
import { W2ResultSaver } from '../w2/result-saver.js';
import type { PmReviewResult } from '../w2/types.js';

function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

const { values } = parseArgs({
  options: {
    run: { type: 'string', short: 'r' },
    save: { type: 'boolean', default: false },
    result: { type: 'string' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W2 PM REVIEW - HELP',
      content: `PM Review step for W2 PDF workflow.

Generate prompt: pnpm w2:pm-review --run <id>
Save result:     pnpm w2:pm-review --save --run <id> --result <path>`,
      status: [],
      nextStep: [],
    })
  );
  process.exit(0);
}

const isSaveMode = values.save === true;
const runId = values.run;

if (!runId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --run <id>',
      status: [{ label: 'Run ID is required', success: false }],
      nextStep: ['Usage:', '  pnpm w2:pm-review --run <id>'],
    })
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  createTables(db);
  try { runMigrations(dbPath); } catch { /* already applied */ }

  try {
    if (isSaveMode) {
      await runSaveMode(db);
    } else {
      await runGenerateMode(db);
    }
  } finally {
    db.close();
  }
}

async function runGenerateMode(db: Database.Database): Promise<void> {
  console.log(CLIFormatter.header('W2 PM REVIEW'));
  console.log(`Run ID: ${runId}`);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);
  const bookRepo = new BookRepository(db);

  // Verify workflow run exists
  const workflowRun = workflowRepo.getById(runId!);
  if (!workflowRun) {
    console.error(`ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }

  // Get book info
  const book = bookRepo.getById(workflowRun.book_id);
  if (!book) {
    console.error(`ERROR: Book not found: ${workflowRun.book_id}`);
    process.exit(1);
  }

  // Determine paths
  const htmlPath = resolve(projectRoot, `data/html/print-design/${book.slug}.html`);
  const releaseNotesPath = resolve(projectRoot, `data/w1-artifacts/${runId}/release-notes.json`);

  // Generate prompt
  const prompt = generatePmReviewPrompt({
    runId: runId!,
    bookSlug: book.slug,
    bookTitle: book.title,
    htmlPath,
    releaseNotesPath,
  });

  // Write prompt
  const promptWriter = new W2PromptWriter({ runId: runId! });
  const promptPath = promptWriter.writePmReviewPrompt(prompt);

  console.log(
    CLIFormatter.format({
      title: 'PM REVIEW PROMPT GENERATED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Book', value: `${book.title} (${book.slug})` },
        { key: 'Prompt', value: promptPath },
      ]),
      status: [{ label: 'Prompt generated', success: true }],
      nextStep: [
        'Read the prompt and execute the task:',
        `  cat ${promptPath}`,
        '',
        'Then save the result:',
        `  pnpm w2:pm-review --save --run=${runId} --result=data/w2-artifacts/${runId}/pm-review.json`,
      ],
    })
  );
}

async function runSaveMode(db: Database.Database): Promise<void> {
  const resultPath = values.result;

  if (!resultPath) {
    console.error('ERROR: --result <path> is required in save mode');
    process.exit(1);
  }

  const resolvedPath = resolve(projectRoot, resultPath);
  if (!existsSync(resolvedPath)) {
    console.error(`ERROR: Result file not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(CLIFormatter.header('W2 PM REVIEW - SAVE'));
  console.log(`Run ID: ${runId}`);
  console.log(`Result: ${resolvedPath}`);
  console.log('');

  // Load and validate result
  const resultContent = readFileSync(resolvedPath, 'utf-8');
  const result: PmReviewResult = JSON.parse(resultContent);

  // Save result
  const resultSaver = new W2ResultSaver(db, runId!);
  resultSaver.savePmReviewResult(result, resolvedPath);

  console.log(
    CLIFormatter.format({
      title: 'PM REVIEW RESULT SAVED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Priority Sections', value: String(result.priority_sections.length) },
        { key: 'Focus Areas', value: String(result.focus_areas.length) },
      ]),
      status: [{ label: 'Result saved', success: true }],
      nextStep: [
        'Next step:',
        `  pnpm w2:layout --run=${runId}`,
      ],
    })
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
```

**Step 2: Add to package.json**

Add to `package.json` scripts section:
```json
"w2:pm-review": "tsx src/tooling/cli-commands/w2-pm-review.ts"
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/cli-commands/w2-pm-review.ts package.json
git commit -m "feat(w2): add w2:pm-review CLI command"
```

---

## Task 8: Create w2-layout CLI Command

**Files:**
- Create: `src/tooling/cli-commands/w2-layout.ts`

**Step 1: Create the CLI command**

```typescript
// src/tooling/cli-commands/w2-layout.ts

/**
 * w2:layout CLI Command
 *
 * Layout planning step for W2 PDF workflow.
 * Creates structural layout plan (page breaks, margins, tables).
 *
 * Usage:
 *   Generate prompt: pnpm w2:layout --run <id>
 *   Save result:     pnpm w2:layout --save --run <id> --plan <path>
 */

import { parseArgs } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { CLIFormatter } from '../cli/formatter.js';
import { WorkflowRepository } from '../workflows/repository.js';
import { BookRepository } from '../books/repository.js';
import { createTables, runMigrations } from '@razorweave/database';
import { generateLayoutPrompt } from '../w2/prompt-generator.js';
import { W2PromptWriter } from '../w2/prompt-writer.js';
import { W2ResultSaver } from '../w2/result-saver.js';
import type { LayoutPlan } from '../w2/types.js';

function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

const { values } = parseArgs({
  options: {
    run: { type: 'string', short: 'r' },
    save: { type: 'boolean', default: false },
    plan: { type: 'string' },
    db: { type: 'string', default: 'data/project.db' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const projectRoot = getProjectRoot();
const dbPath = resolve(projectRoot, values.db!);

if (values.help) {
  console.log(
    CLIFormatter.format({
      title: 'W2 LAYOUT - HELP',
      content: `Layout planning step for W2 PDF workflow.

Generate prompt: pnpm w2:layout --run <id>
Save result:     pnpm w2:layout --save --run <id> --plan <path>`,
      status: [],
      nextStep: [],
    })
  );
  process.exit(0);
}

const isSaveMode = values.save === true;
const runId = values.run;

if (!runId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --run <id>',
      status: [{ label: 'Run ID is required', success: false }],
      nextStep: ['Usage:', '  pnpm w2:layout --run <id>'],
    })
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  createTables(db);
  try { runMigrations(dbPath); } catch { /* already applied */ }

  try {
    if (isSaveMode) {
      await runSaveMode(db);
    } else {
      await runGenerateMode(db);
    }
  } finally {
    db.close();
  }
}

async function runGenerateMode(db: Database.Database): Promise<void> {
  console.log(CLIFormatter.header('W2 LAYOUT PLANNING'));
  console.log(`Run ID: ${runId}`);
  console.log('');

  const workflowRepo = new WorkflowRepository(db);
  const bookRepo = new BookRepository(db);

  const workflowRun = workflowRepo.getById(runId!);
  if (!workflowRun) {
    console.error(`ERROR: Workflow run not found: ${runId}`);
    process.exit(1);
  }

  const book = bookRepo.getById(workflowRun.book_id);
  if (!book) {
    console.error(`ERROR: Book not found: ${workflowRun.book_id}`);
    process.exit(1);
  }

  const htmlPath = resolve(projectRoot, `data/html/print-design/${book.slug}.html`);
  const pmReviewPath = resolve(projectRoot, `data/w2-artifacts/${runId}/pm-review.json`);

  const prompt = generateLayoutPrompt({
    runId: runId!,
    bookSlug: book.slug,
    htmlPath,
    pmReviewPath,
  });

  const promptWriter = new W2PromptWriter({ runId: runId! });
  const promptPath = promptWriter.writeLayoutPrompt(prompt);

  console.log(
    CLIFormatter.format({
      title: 'LAYOUT PROMPT GENERATED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Book', value: `${book.title} (${book.slug})` },
        { key: 'Prompt', value: promptPath },
      ]),
      status: [{ label: 'Prompt generated', success: true }],
      nextStep: [
        'Read the prompt and execute the task:',
        `  cat ${promptPath}`,
        '',
        'Then save the result:',
        `  pnpm w2:layout --save --run=${runId} --plan=data/w2-artifacts/${runId}/layout-plan.json`,
      ],
    })
  );
}

async function runSaveMode(db: Database.Database): Promise<void> {
  const planPath = values.plan;

  if (!planPath) {
    console.error('ERROR: --plan <path> is required in save mode');
    process.exit(1);
  }

  const resolvedPath = resolve(projectRoot, planPath);
  if (!existsSync(resolvedPath)) {
    console.error(`ERROR: Plan file not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(CLIFormatter.header('W2 LAYOUT - SAVE'));
  console.log(`Run ID: ${runId}`);
  console.log(`Plan: ${resolvedPath}`);
  console.log('');

  const planContent = readFileSync(resolvedPath, 'utf-8');
  const plan: LayoutPlan = JSON.parse(planContent);

  const resultSaver = new W2ResultSaver(db, runId!);
  resultSaver.saveLayoutPlan(plan, resolvedPath);

  console.log(
    CLIFormatter.format({
      title: 'LAYOUT PLAN SAVED',
      content: CLIFormatter.table([
        { key: 'Run ID', value: runId! },
        { key: 'Page Breaks', value: String(plan.page_breaks.length) },
        { key: 'Table Strategy', value: plan.table_strategy },
      ]),
      status: [{ label: 'Plan saved', success: true }],
      nextStep: [
        'Next step:',
        `  pnpm w2:design --run=${runId}`,
      ],
    })
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
```

**Step 2: Add to package.json**

Add to `package.json` scripts section:
```json
"w2:layout": "tsx src/tooling/cli-commands/w2-layout.ts"
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/cli-commands/w2-layout.ts package.json
git commit -m "feat(w2): add w2:layout CLI command"
```

---

## Task 9-14: Remaining CLI Commands

Follow the same pattern for:

- **Task 9:** `w2-design.ts` - Uses `generateDesignPrompt`, saves `DesignPlan` + `ImagePromptsResult`
- **Task 10:** `w2-create-pdf.ts` - Uses `generateCreatePdfPrompt`, calls `@razorweave/pdf-gen`
- **Task 11:** `w2-editor-review.ts` - Uses `generateEditorReviewPrompt`, saves `EditorReviewResult`
- **Task 12:** `w2-human-gate.ts` - Shows status, supports `--approve`, `--reject`, `--assets`
- **Task 13:** `w2-derive-digital.ts` - Uses `generateDeriveDigitalPrompt`, creates digital PDF
- **Task 14:** `w2-finalize.ts` - Copies to version directories, registers final artifacts

Each follows the same CLI pattern: generate mode + save mode, parseArgs, CLIFormatter output.

---

## Task 15: Create W2 Workflow Definition

**Files:**
- Create: `src/tooling/workflows/w2-workflow.ts`

**Step 1: Create workflow definition**

```typescript
// src/tooling/workflows/w2-workflow.ts

/**
 * W2 PDF Workflow Definition
 *
 * Workflow for producing publication-quality print and digital PDFs.
 * Content is frozen from W1; only presentation changes.
 */

import { existsSync } from 'fs';
import { defineWorkflow, type Condition, type WorkflowDefinition } from './engine-types.js';

// Postconditions

const pmReviewSaved: Condition = {
  name: 'pm_review_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/pm-review.json`),
  error: 'PM review not saved',
};

const layoutPlanSaved: Condition = {
  name: 'layout_plan_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/layout-plan.json`),
  error: 'Layout plan not saved',
};

const designPlanSaved: Condition = {
  name: 'design_plan_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/design-plan.json`),
  error: 'Design plan not saved',
};

const imagePromptsSaved: Condition = {
  name: 'image_prompts_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/image-prompts.json`),
  error: 'Image prompts not saved',
};

const draftPdfCreated: Condition = {
  name: 'draft_pdf_created',
  check: (ctx) => {
    const draftPath = ctx.checkpoint.data['draftPdfPath'] as string | undefined;
    return draftPath ? existsSync(draftPath) : false;
  },
  error: 'Draft PDF not created',
};

const editorReviewSaved: Condition = {
  name: 'editor_review_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/editor-review.json`),
  error: 'Editor review not saved',
};

const humanDecisionRecorded: Condition = {
  name: 'human_decision_recorded',
  check: (ctx) => ctx.checkpoint.gateDecision !== undefined,
  error: 'Human gate decision not recorded',
};

const digitalPdfCreated: Condition = {
  name: 'digital_pdf_created',
  check: (ctx) => {
    const digitalPath = ctx.checkpoint.data['digitalPdfPath'] as string | undefined;
    return digitalPath ? existsSync(digitalPath) : false;
  },
  error: 'Digital PDF not created',
};

const finalArtifactsRegistered: Condition = {
  name: 'final_artifacts_registered',
  check: (ctx) => ctx.db.artifactsExist(ctx.runId),
  error: 'Final artifacts not registered',
};

// Preconditions

const htmlExists: Condition = {
  name: 'html_exists',
  check: (ctx) => {
    const htmlPath = ctx.checkpoint.data['htmlPath'] as string | undefined;
    return htmlPath ? existsSync(htmlPath) : false;
  },
  error: 'Print HTML not found',
};

export const w2PdfWorkflow: WorkflowDefinition = defineWorkflow({
  type: 'w2_pdf',
  name: 'W2 PDF Publication Workflow',
  initialStep: 'pm-review',

  steps: [
    {
      name: 'pm-review',
      command: 'pnpm w2:pm-review',
      preconditions: [htmlExists],
      postconditions: [pmReviewSaved],
      next: 'layout',
    },
    {
      name: 'layout',
      command: 'pnpm w2:layout',
      preconditions: [pmReviewSaved],
      postconditions: [layoutPlanSaved],
      next: 'design',
    },
    {
      name: 'design',
      command: 'pnpm w2:design',
      preconditions: [layoutPlanSaved],
      postconditions: [designPlanSaved, imagePromptsSaved],
      next: 'create-pdf',
    },
    {
      name: 'create-pdf',
      command: 'pnpm w2:create-pdf',
      preconditions: [designPlanSaved],
      postconditions: [draftPdfCreated],
      next: 'editor-review',
    },
    {
      name: 'editor-review',
      command: 'pnpm w2:editor-review',
      preconditions: [draftPdfCreated],
      postconditions: [editorReviewSaved],
      next: {
        condition: 'result.approved === true',
        onTrue: 'human-gate',
        onFalse: 'layout',
        maxIterations: 3,
      },
    },
    {
      name: 'human-gate',
      command: 'pnpm w2:human-gate',
      preconditions: [editorReviewSaved],
      postconditions: [humanDecisionRecorded],
      humanGate: {
        prompt: 'Review the print PDF draft. Approve, reject, or provide assets.',
        context: ['draftPdfPath', 'imagePromptsPath', 'editorCycles'],
        options: [
          { label: 'Approve and finalize', nextStep: 'derive-digital' },
          { label: 'Provide assets and continue', nextStep: 'create-pdf', requiresInput: true },
          { label: 'Reject with feedback', nextStep: 'layout', requiresInput: true },
        ],
      },
    },
    {
      name: 'derive-digital',
      command: 'pnpm w2:derive-digital',
      preconditions: [humanDecisionRecorded],
      postconditions: [digitalPdfCreated],
      next: 'finalize',
    },
    {
      name: 'finalize',
      command: 'pnpm w2:finalize',
      preconditions: [digitalPdfCreated],
      postconditions: [finalArtifactsRegistered],
      next: null,
    },
  ],
});

export default w2PdfWorkflow;
```

**Step 2: Run TypeScript check**

Run: `pnpm tsc --noEmit -p src/tooling/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/workflows/w2-workflow.ts
git commit -m "feat(w2): add W2 workflow definition"
```

---

## Task 16: Create w2-strategic CLI Command

**Files:**
- Create: `src/tooling/cli-commands/w2-strategic.ts`

This is the main entry point that:
1. Creates workflow run in database
2. Sets up `data/w2-strategic/{plan-id}/` with strategy.json and state.json
3. Outputs the orchestration prompt for Claude Code
4. Supports `--resume` for crashed sessions

Follow the pattern from `w1-strategic.ts`.

---

## Task 17: Add Package.json Scripts

**Files:**
- Modify: `package.json`

Add all W2 scripts:
```json
{
  "w2:strategic": "tsx src/tooling/cli-commands/w2-strategic.ts",
  "w2:pm-review": "tsx src/tooling/cli-commands/w2-pm-review.ts",
  "w2:layout": "tsx src/tooling/cli-commands/w2-layout.ts",
  "w2:design": "tsx src/tooling/cli-commands/w2-design.ts",
  "w2:create-pdf": "tsx src/tooling/cli-commands/w2-create-pdf.ts",
  "w2:editor-review": "tsx src/tooling/cli-commands/w2-editor-review.ts",
  "w2:human-gate": "tsx src/tooling/cli-commands/w2-human-gate.ts",
  "w2:derive-digital": "tsx src/tooling/cli-commands/w2-derive-digital.ts",
  "w2:finalize": "tsx src/tooling/cli-commands/w2-finalize.ts"
}
```

---

## Task 18: Integration Test

**Files:**
- Create: `src/tooling/w2/w2.test.ts`

Write tests for:
1. Prompt generators produce valid output
2. Result savers register artifacts correctly
3. Workflow definition validates

---

## Task 19: Documentation

**Files:**
- Create: `docs/developers/w2-workflow.md`

Document:
1. How to start a W2 workflow
2. Each step and its purpose
3. Human gate options
4. Resume capability

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Module structure + types | `src/tooling/w2/types.ts`, `index.ts` |
| 2 | W2PromptWriter | `src/tooling/w2/prompt-writer.ts` |
| 3 | W2ResultSaver | `src/tooling/w2/result-saver.ts` |
| 4 | Prompt generators (PM, Layout) | `src/tooling/w2/prompt-generator.ts` |
| 5 | Prompt generators (Design, Create) | `src/tooling/w2/prompt-generator.ts` |
| 6 | Prompt generators (Editor, Digital, Strategic) | `src/tooling/w2/prompt-generator.ts` |
| 7 | w2:pm-review CLI | `src/tooling/cli-commands/w2-pm-review.ts` |
| 8 | w2:layout CLI | `src/tooling/cli-commands/w2-layout.ts` |
| 9 | w2:design CLI | `src/tooling/cli-commands/w2-design.ts` |
| 10 | w2:create-pdf CLI | `src/tooling/cli-commands/w2-create-pdf.ts` |
| 11 | w2:editor-review CLI | `src/tooling/cli-commands/w2-editor-review.ts` |
| 12 | w2:human-gate CLI | `src/tooling/cli-commands/w2-human-gate.ts` |
| 13 | w2:derive-digital CLI | `src/tooling/cli-commands/w2-derive-digital.ts` |
| 14 | w2:finalize CLI | `src/tooling/cli-commands/w2-finalize.ts` |
| 15 | W2 Workflow Definition | `src/tooling/workflows/w2-workflow.ts` |
| 16 | w2:strategic CLI | `src/tooling/cli-commands/w2-strategic.ts` |
| 17 | Package.json scripts | `package.json` |
| 18 | Integration tests | `src/tooling/w2/w2.test.ts` |
| 19 | Documentation | `docs/developers/w2-workflow.md` |
