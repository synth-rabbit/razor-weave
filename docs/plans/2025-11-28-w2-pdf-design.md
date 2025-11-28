# W2 PDF Workflow Design

**Date:** 2025-11-28
**Status:** Approved
**Phase:** Post-W1

## Overview

W2 produces publication-quality print and digital PDFs from W1's output, with iterative layout/design improvements and human review gates.

**Key Constraint:** Content is frozen. W2 only changes presentation (layout, typography, page breaks, visual styling). All copy editing is complete by the time content reaches W2.

### Key Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Agents | 5 agents (PM, Layout, Design, Creator, Editor) | Clear role separation for presentation concerns |
| Iteration | Hybrid: Editor auto-review + human gate | Catches obvious issues automatically, human decides approval |
| Variants | Print-first, derive digital | Print has stricter requirements; digital is simpler derivative |
| Engine | Hybrid workflow integration | Typed structure + strategic prompt pattern |
| Execution | Claude Code (no API key) | CLI generates prompts, Claude Code reads and executes |

### Inputs from W1

- Print HTML: `data/html/print-design/{book}.html`
- Release Notes: `data/w1-artifacts/{run-id}/release-notes.json`

### Outputs

- Print PDF: `data/pdfs/{book}/{version}/print.pdf`
- Digital PDF: `data/pdfs/{book}/{version}/digital.pdf`
- Image prompts: `data/w2-artifacts/{run-id}/image-prompts.json`

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  START (from W1 artifacts)                                       │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────┐                                                │
│  │  PM Review  │ ── Reviews release notes, identifies priority  │
│  └─────────────┘    areas for layout attention                  │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────┐                                                │
│  │   Layout    │ ── Structural plan: page breaks, margins,      │
│  └─────────────┘    section flow, table placement               │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────┐                                                │
│  │   Design    │ ── Visual plan: typography, colors, spacing,   │
│  └─────────────┘    image prompts (with aspect ratios)          │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────┐                                                │
│  │  Creator    │ ── Applies plans, generates print PDF          │
│  └─────────────┘                                                │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────┐     ┌──────────────────┐                       │
│  │   Editor    │ ──▶ │ Issues found?    │                       │
│  └─────────────┘     └──────────────────┘                       │
│                         │ Yes        │ No                        │
│                         ▼            ▼                           │
│                    Back to       ┌──────────────┐               │
│                    Layout        │  Human Gate  │               │
│                   (max 3x)       └──────────────┘               │
│                                      │ Approve                   │
│                                      ▼                           │
│                              ┌──────────────┐                   │
│                              │ Derive Digi  │                   │
│                              └──────────────┘                   │
│                                      │                           │
│                                      ▼                           │
│                              ┌──────────────┐                   │
│                              │   Finalize   │                   │
│                              └──────────────┘                   │
│                                      │                           │
│                                      ▼                           │
│                                    END                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Details

### PM Review Agent

**Purpose:** Review W1 artifacts, identify priority areas for layout/presentation attention

**Inputs:**
- Release notes JSON (what changed in content)
- Print HTML path

**Outputs:** `pm-review.json`
```json
{
  "priority_sections": ["chapter-06", "chapter-10"],
  "focus_areas": ["tables need better formatting", "examples are hard to scan"],
  "constraints": { "page_budget": null, "preserve_toc": true }
}
```

**CLI:**
```bash
pnpm w2:pm-review --run=<id>                         # Generate prompt
pnpm w2:pm-review --save --run=<id> --result=<path>  # Save result
```

---

### Layout Agent

**Purpose:** Create structural layout plan (presentation only, no content changes)

**Inputs:** PM review result, print HTML

**Outputs:** `layout-plan.json`
```json
{
  "page_breaks": [{ "before": "chapter-06", "reason": "new section" }],
  "margins": { "inner": "1in", "outer": "0.75in" },
  "table_strategy": "allow-page-break-within",
  "column_layouts": [{ "section": "appendix", "columns": 2 }]
}
```

**CLI:**
```bash
pnpm w2:layout --run=<id>
pnpm w2:layout --save --run=<id> --plan=<path>
```

---

### Design Agent

**Purpose:** Create visual design plan and image prompts (presentation only)

**Inputs:** Layout plan, PM review

**Outputs:** `design-plan.json`, `image-prompts.json`

```json
// design-plan.json
{
  "typography": { "body": "11pt", "headings_scale": 1.25 },
  "colors": { "accent": "#8B4513", "callout_bg": "#FFF8DC" },
  "spacing": { "paragraph": "0.5em", "section": "2em" }
}
```

```json
// image-prompts.json
{
  "prompts": [
    {
      "id": "chapter-header-06",
      "location": "Chapter 6 header",
      "aspect_ratio": "16:9",
      "prompt": "Fantasy tavern interior, warm candlelight, adventurers gathered around table studying maps, detailed medieval style, muted earth tones"
    },
    {
      "id": "sidebar-combat",
      "location": "Combat chapter sidebar",
      "aspect_ratio": "3:2",
      "prompt": "Close-up of dice rolling across parchment map, dramatic lighting, shallow depth of field"
    }
  ]
}
```

**CLI:**
```bash
pnpm w2:design --run=<id>
pnpm w2:design --save --run=<id> --plan=<path>
```

---

### PDF Creator Agent

**Purpose:** Apply layout + design plans to generate print PDF

**Inputs:**
- Print HTML (frozen content)
- Layout plan, Design plan
- Optional: image assets folder path

**Outputs:** Draft print PDF

**What it does:**
- Injects CSS overrides based on design plan
- Applies page break rules from layout plan
- Places provided images at specified locations
- Generates PDF with print settings (CMYK-ready, bleed if configured)

**CLI:**
```bash
pnpm w2:create-pdf --run=<id>
pnpm w2:create-pdf --save --run=<id> --pdf=<path>
```

---

### PDF Editor Agent

**Purpose:** Review PDF presentation quality (NOT content)

**Inputs:** Generated PDF path

**Reviews for:**
- Page break placement (awkward breaks mid-table?)
- Typography consistency (font sizes, line heights)
- Visual hierarchy clarity
- Print-readiness (margins sufficient for binding?)
- Image placement and sizing

**Outputs:** `editor-review.json`
```json
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
```

**CLI:**
```bash
pnpm w2:editor-review --run=<id>
pnpm w2:editor-review --save --run=<id> --result=<path>
```

---

## Human Gate

**Purpose:** Final human approval before producing publication PDFs

**Trigger:** After Editor approves (or after 3 Editor→Layout cycles)

**What you review:**
- Draft print PDF at `data/pdfs/draft/{book}-{run-id}.pdf`
- Image prompts at `data/w2-artifacts/{run-id}/image-prompts.json`

**CLI:**
```bash
pnpm w2:human-gate --run=<id>                        # Shows status, opens PDF
pnpm w2:human-gate --approve --run=<id>              # Proceed to finalization
pnpm w2:human-gate --reject --run=<id> --reason="..." # Back to Layout
pnpm w2:human-gate --approve --run=<id> --assets=<folder>  # Provide generated images
```

**Options at gate:**
1. **Approve** - Proceed to derive digital + finalize
2. **Reject with feedback** - Back to Layout Agent with your notes
3. **Provide assets** - You've generated images from prompts, provide folder path

---

## Digital Derivation

**Purpose:** Create digital PDF from approved print master

**Derivation steps:**
1. Start from print PDF settings
2. Remove bleed/crop marks
3. Add hyperlinks (TOC links, cross-references)
4. Add PDF bookmarks for navigation
5. Compress images for smaller file size
6. Embed web-friendly fonts

**CLI:**
```bash
pnpm w2:derive-digital --run=<id>
```

**Output:** `data/pdfs/{book}/{version}/digital.pdf`

---

## Finalization

**Purpose:** Promote draft PDFs to versioned output, register artifacts

**CLI:**
```bash
pnpm w2:finalize --run=<id>
```

**Actions:**
1. Copy print PDF to `data/pdfs/{book}/{version}/print.pdf`
2. Copy digital PDF to `data/pdfs/{book}/{version}/digital.pdf`
3. Register both as workflow artifacts
4. Update workflow run status to `completed`

---

## Workflow Engine Integration

### WorkflowDefinition

```typescript
// src/tooling/workflows/w2-workflow.ts
export const W2PdfWorkflow: WorkflowDefinition = {
  type: 'w2_pdf',
  name: 'PDF Publication Workflow',
  initialStep: 'pm-review',
  steps: [
    {
      name: 'pm-review',
      command: 'w2:pm-review',
      preconditions: [
        { name: 'html_exists', check: ctx => existsSync(ctx.htmlPath), error: 'Print HTML not found' },
        { name: 'release_notes_exist', check: ctx => existsSync(ctx.releaseNotesPath), error: 'Release notes not found' },
      ],
      postconditions: [
        { name: 'review_saved', check: ctx => existsSync(ctx.artifactsDir + '/pm-review.json'), error: 'PM review not saved' },
      ],
      next: 'layout',
    },
    {
      name: 'layout',
      command: 'w2:layout',
      postconditions: [
        { name: 'plan_saved', check: ctx => existsSync(ctx.artifactsDir + '/layout-plan.json'), error: 'Layout plan not saved' },
      ],
      next: 'design',
    },
    {
      name: 'design',
      command: 'w2:design',
      postconditions: [
        { name: 'design_saved', check: ctx => existsSync(ctx.artifactsDir + '/design-plan.json'), error: 'Design plan not saved' },
        { name: 'prompts_saved', check: ctx => existsSync(ctx.artifactsDir + '/image-prompts.json'), error: 'Image prompts not saved' },
      ],
      next: 'create-pdf',
    },
    {
      name: 'create-pdf',
      command: 'w2:create-pdf',
      postconditions: [
        { name: 'pdf_created', check: ctx => existsSync(ctx.draftPdfPath), error: 'PDF not generated' },
      ],
      next: 'editor-review',
    },
    {
      name: 'editor-review',
      command: 'w2:editor-review',
      postconditions: [
        { name: 'review_saved', check: ctx => existsSync(ctx.artifactsDir + '/editor-review.json'), error: 'Editor review not saved' },
      ],
      next: {
        condition: 'result.approved === true',
        onTrue: 'human-gate',
        onFalse: 'layout',
        maxIterations: 3,
      },
    },
    {
      name: 'human-gate',
      command: 'w2:human-gate',
      humanGate: {
        prompt: 'Review the print PDF draft. Approve, reject, or provide assets.',
        context: ['draftPdfPath', 'imagePromptsPath', 'iterationCount'],
        options: [
          { label: 'Approve and finalize', nextStep: 'derive-digital' },
          { label: 'Provide assets and continue', nextStep: 'create-pdf', requiresInput: true },
          { label: 'Reject with feedback', nextStep: 'layout', requiresInput: true },
        ],
      },
    },
    {
      name: 'derive-digital',
      command: 'w2:derive-digital',
      postconditions: [
        { name: 'digital_created', check: ctx => existsSync(ctx.digitalPdfPath), error: 'Digital PDF not created' },
      ],
      next: 'finalize',
    },
    {
      name: 'finalize',
      command: 'w2:finalize',
      postconditions: [
        { name: 'print_promoted', check: ctx => existsSync(ctx.finalPrintPath), error: 'Print PDF not promoted' },
        { name: 'digital_promoted', check: ctx => existsSync(ctx.finalDigitalPath), error: 'Digital PDF not promoted' },
        { name: 'artifacts_registered', check: ctx => ctx.db.artifactsExist(ctx.runId), error: 'Artifacts not registered' },
      ],
      next: null,
    },
  ],
};
```

### Starting W2

```bash
# Start new W2 workflow from W1 output
pnpm wf:start --type=w2_pdf --book=core-rulebook --from-w1=<w1-run-id>

# Resume existing W2 workflow
pnpm wf:start --resume=<w2-run-id>
```

---

## Strategic Prompt Pattern

### Entry Point

```bash
pnpm w2:strategic --book=core-rulebook --from-w1=<w1-run-id>
```

**What it does:**
1. Creates workflow run in database (`wfrun_w2_xxxxx`)
2. Copies W1 artifacts (HTML path, release notes) to W2 context
3. Creates `data/w2-strategic/{plan-id}/` with `strategy.json` and `state.json`
4. Outputs orchestration prompt for Claude Code

### State Files

```
data/w2-strategic/{plan-id}/
├── strategy.json      # Static plan info
├── state.json         # Current progress (updated after each step)
└── README.md          # Human-readable summary

data/w2-artifacts/{run-id}/
├── pm-review.json
├── layout-plan.json
├── design-plan.json
├── image-prompts.json
├── editor-review.json
└── changelog.json
```

**state.json:**
```json
{
  "current_step": "design",
  "completed_steps": ["pm-review", "layout"],
  "iteration_count": 1,
  "editor_cycles": 0,
  "last_updated": "2025-11-28T10:30:00Z",
  "human_feedback": null
}
```

### Resume Capability

If session crashes, `--resume` regenerates prompt from saved state.

---

## CLI Commands Summary

### Package.json Scripts

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

### Command Pattern

Each command has two modes:

```bash
# Generate mode - outputs prompt file for Claude Code
pnpm w2:<step> --run=<id>

# Save mode - persists result, registers artifact
pnpm w2:<step> --save --run=<id> --result=<path>
```

---

## File Structure

```
src/tooling/
├── w2/
│   ├── index.ts
│   ├── prompt-generator.ts    # generatePmReviewPrompt, generateLayoutPrompt, etc.
│   ├── prompt-writer.ts       # W2PromptWriter class
│   └── result-saver.ts        # W2ResultSaver class
├── cli-commands/
│   ├── w2-strategic.ts
│   ├── w2-pm-review.ts
│   ├── w2-layout.ts
│   ├── w2-design.ts
│   ├── w2-create-pdf.ts
│   ├── w2-editor-review.ts
│   ├── w2-human-gate.ts
│   ├── w2-derive-digital.ts
│   └── w2-finalize.ts
└── workflows/
    └── w2-workflow.ts         # WorkflowDefinition

data/w2-prompts/{run-id}/
├── pm-review.txt
├── layout.txt
├── design.txt
├── create-pdf.txt
├── editor-review.txt
└── derive-digital.txt

data/pdfs/{book}/{version}/
├── print.pdf
└── digital.pdf
```

---

## Implementation Notes

### Dependencies on Existing Infrastructure

| Dependency | Status | Notes |
|------------|--------|-------|
| `@razorweave/pdf-gen` | Exists | Used by `w1:finalize-pdf` already |
| Workflow engine | Exists | `WorkflowDefinition`, `CheckpointManager` |
| Artifact registry | Exists | `ArtifactRegistry` in `workflows/` |
| W1 prompt pattern | Exists | `W1PromptWriter`, generators as templates |

### New Artifact Types

Add to workflow artifact types:
- `pdf_print` - Final print PDF
- `pdf_digital` - Final digital PDF
- `layout_plan` - Layout agent output
- `design_plan` - Design agent output
- `image_prompts` - Image generation prompts

### PDF Generation Enhancements Needed

The existing `@razorweave/pdf-gen` may need:
1. **CSS injection** - Apply design plan overrides
2. **Page break control** - Honor layout plan breaks
3. **Digital variant mode** - Hyperlinks, bookmarks, compression

---

## Success Criteria

1. Can start W2 from W1 artifacts
2. All 5 agents execute via prompt pattern
3. Editor → Layout iteration works (max 3 cycles)
4. Human gate stops for approval
5. Image prompts generated with aspect ratios
6. Print PDF produced with layout/design applied
7. Digital PDF derived from print master
8. Both PDFs registered as artifacts
9. Resume works after crash

---

*This design supersedes the draft proposal at `docs/plans/proposals/w2-pdf.md`.*
