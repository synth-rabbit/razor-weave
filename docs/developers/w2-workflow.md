# W2 PDF Workflow

The W2 PDF Workflow produces publication-quality print and digital PDFs from finalized W1 content through an iterative layout and design refinement process.

## Overview

The W2 workflow focuses exclusively on **presentation improvements** - content is frozen from W1, and only layout, typography, spacing, and visual design are modified.

**Key Principles:**
- Content is immutable - no text changes allowed
- Print PDF is the master, digital PDF is derived from it
- Iterative refinement between Layout, Design, and Editor agents
- Human gate checkpoint before finalization

**Workflow Type:** `w2_pdf`

---

## Quick Start

The recommended way to start a W2 workflow:

```bash
# Start new W2 workflow
pnpm w2:strategic --book core-rulebook

# Resume interrupted workflow
pnpm w2:strategic --resume <plan-id>
```

This generates a complete prompt for Claude Code to execute the entire workflow autonomously.

---

## Prerequisites

Before starting W2, ensure:

1. **W1 Completed** - Content modifications finalized and committed
2. **Print HTML Exists** - `data/html/print-design/{book-slug}.html` exists
3. **Release Notes Available** - `data/w1-artifacts/{w1-run-id}/release-notes.json` exists (optional but recommended)

### Verify Prerequisites

```bash
# Check that print HTML exists
ls data/html/print-design/core-rulebook.html

# Check for W1 release notes (optional)
ls data/w1-artifacts/*/release-notes.json
```

---

## Starting a W2 Workflow

### Command: `pnpm w2:strategic`

```bash
# Start new workflow
pnpm w2:strategic --book core-rulebook

# With specific W1 artifacts
pnpm w2:strategic --book core-rulebook --w1-run wfrun_abc123

# Resume interrupted session
pnpm w2:strategic --resume strat_xyz789

# List all W2 strategic plans
pnpm w2:strategic --list
```

**What It Creates:**

```
data/w2-strategic/{plan-id}/
├── strategy.json          # Workflow configuration
├── state.json             # Current step and progress
└── prompts/
    ├── pm-review.txt      # PM Agent prompt
    ├── layout.txt         # Layout Agent prompt
    ├── design.txt         # Design Agent prompt
    ├── create-pdf.txt     # PDF Creator prompt
    ├── editor-review.txt  # Editor Agent prompt
    └── derive-digital.txt # Digital derivation prompt

data/w2-artifacts/{run-id}/
└── (artifacts created during execution)
```

**Outputs:**

A complete orchestration prompt for Claude Code that:
1. Reads strategy.json and state.json
2. Executes workflow steps in sequence
3. Tracks progress in state.json
4. Stops at human gate for approval

---

## Workflow Steps

The W2 workflow consists of 8 steps executed in sequence:

### Step 1: PM Review

**Purpose:** Identify priority sections needing layout/design attention based on W1 changes.

**Command:**
```bash
pnpm w2:pm-review --run <run-id>
```

**What It Does:**
- Reads W1 release notes to understand what changed
- Identifies sections with significant content additions
- Flags tables, examples, or callouts needing formatting attention
- Creates priority list for layout planning

**Output:**
```json
{
  "priority_sections": ["chapter-06", "chapter-10"],
  "focus_areas": [
    "tables need better formatting",
    "examples are hard to scan"
  ],
  "constraints": {
    "page_budget": null,
    "preserve_toc": true
  }
}
```

**Save Result:**
```bash
pnpm w2:pm-review --save --run <run-id> --result data/w2-artifacts/<run-id>/pm-review.json
```

---

### Step 2: Layout Planning

**Purpose:** Create structural layout plan (page breaks, margins, table handling).

**Command:**
```bash
pnpm w2:layout --run <run-id>
```

**What It Does:**
- Reads PM review priorities
- Plans page break locations (chapters, major sections)
- Defines margin sizes for print binding
- Determines table layout strategy
- Identifies any 2-column layout sections

**Output:**
```json
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
```

**Save Result:**
```bash
pnpm w2:layout --save --run <run-id> --plan data/w2-artifacts/<run-id>/layout-plan.json
```

---

### Step 3: Design Planning

**Purpose:** Create visual design plan (typography, colors, spacing) and image prompts.

**Command:**
```bash
pnpm w2:design --run <run-id>
```

**What It Does:**
- Reads layout plan and PM priorities
- Specifies typography (body size, heading scale)
- Defines color scheme for print
- Sets spacing rules
- Generates AI image prompts with aspect ratios

**Outputs:**

**design-plan.json:**
```json
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
```

**image-prompts.json:**
```json
{
  "prompts": [
    {
      "id": "chapter-header-06",
      "location": "Chapter 6 header",
      "aspect_ratio": "16:9",
      "prompt": "Fantasy tavern interior, warm candlelight..."
    }
  ]
}
```

**Save Results:**
```bash
pnpm w2:design --save --run <run-id> --plan data/w2-artifacts/<run-id>/design-plan.json
```

---

### Step 4: Create PDF

**Purpose:** Generate draft print PDF applying layout and design plans.

**Command:**
```bash
pnpm w2:create-pdf --run <run-id>
```

**What It Does:**
- Reads print HTML source
- Applies layout plan (margins, page breaks, table strategy)
- Applies design plan (typography, colors, spacing)
- Places images if assets provided
- Generates PDF using `@razorweave/pdf-gen`

**Output:**
```
data/w2-artifacts/<run-id>/draft.pdf
```

**Save Result:**
```bash
pnpm w2:create-pdf --save --run <run-id> --pdf data/w2-artifacts/<run-id>/draft.pdf
```

---

### Step 5: Editor Review

**Purpose:** Review generated PDF for presentation quality issues.

**Command:**
```bash
pnpm w2:editor-review --run <run-id>
```

**What It Does:**
- Reviews draft PDF for presentation issues only (NOT content)
- Checks page breaks (widows, orphans, awkward table splits)
- Validates typography consistency
- Verifies visual hierarchy
- Confirms print-readiness (margins, bleed areas)

**Output:**
```json
{
  "approved": false,
  "issues": [
    {
      "type": "layout",
      "location": "page 47",
      "problem": "table split awkwardly across pages",
      "suggestion": "add page break before table"
    }
  ]
}
```

**Save Result:**
```bash
pnpm w2:editor-review --save --run <run-id> --result data/w2-artifacts/<run-id>/editor-review.json
```

**Conditional Branching:**
- If `approved: true` → Proceed to Human Gate
- If `approved: false` → Return to Layout Planning (max 3 cycles)

---

### Step 6: Human Gate

**Purpose:** Human checkpoint for final approval before finalization.

**Command:**
```bash
pnpm w2:human-gate --run <run-id>
```

**What It Shows:**
- Path to draft PDF
- Image prompts (if any)
- Number of editor review cycles
- Current status

**Decision Options:**

#### Option 1: Approve
Proceeds to digital PDF derivation and finalization.

```bash
pnpm w2:human-gate --approve --run <run-id>
```

#### Option 2: Provide Assets
Continue to PDF creation with provided image assets.

```bash
pnpm w2:human-gate --provide-assets --run <run-id> --assets data/w2-assets/<run-id>/images/
```

This returns to **Step 4: Create PDF** with images included.

#### Option 3: Reject with Feedback
Return to layout planning with specific feedback.

```bash
pnpm w2:human-gate --reject --run <run-id> --feedback "Reduce inner margin to 0.875in, add page break before Chapter 8"
```

This returns to **Step 2: Layout Planning** with feedback incorporated.

---

### Step 7: Derive Digital

**Purpose:** Create digital-optimized PDF from approved print master.

**Command:**
```bash
pnpm w2:derive-digital --run <run-id>
```

**What It Does:**
- Copies approved print PDF as master
- Removes print-only elements (crop marks, bleed)
- Adds digital features:
  - Clickable TOC links
  - Cross-reference hyperlinks
  - PDF bookmarks for navigation
- Optimizes for screen viewing:
  - Compresses images
  - Embeds web-friendly fonts
  - Converts to RGB color space

**Output:**
```
data/w2-artifacts/<run-id>/digital.pdf
```

**Save Result:**
```bash
pnpm w2:derive-digital --save --run <run-id> --pdf data/w2-artifacts/<run-id>/digital.pdf
```

---

### Step 8: Finalize

**Purpose:** Copy PDFs to version directories and register final artifacts.

**Command:**
```bash
pnpm w2:finalize --run <run-id>
```

**What It Does:**
- Determines book version from database
- Copies print PDF to `data/pdfs/{book}/{version}/print.pdf`
- Copies digital PDF to `data/pdfs/{book}/{version}/digital.pdf`
- Registers artifacts in database
- Updates workflow status to `completed`

**Final Output:**
```
data/pdfs/core-rulebook/v1.3.0/
├── print.pdf
└── digital.pdf
```

**Database Records:**
- Artifact registry entries for both PDFs
- Workflow run marked as completed
- Metadata with version, book, and variant info

---

## Resume Capability

W2 workflows are fully resumable from any point.

### State Tracking

The workflow tracks progress in `state.json`:

```json
{
  "current_step": "layout",
  "completed_steps": ["pm-review"],
  "iteration_count": 1,
  "editor_cycles": 0,
  "last_updated": "2025-11-30T10:30:00Z",
  "human_feedback": null,
  "assets_path": null
}
```

### Resume After Crash

If a workflow session crashes:

```bash
# Resume from last checkpoint
pnpm w2:strategic --resume <plan-id>
```

This:
1. Loads strategy.json and state.json
2. Continues from `current_step`
3. Skips `completed_steps`
4. Resumes iteration/cycle counts

### Recovery from Failures

The workflow automatically:
- Validates preconditions before each step
- Saves state after each step completion
- Tracks iteration counts to prevent infinite loops
- Preserves human decisions across sessions

---

## Output Directories

### Draft Artifacts

```
data/w2-artifacts/{run-id}/
├── pm-review.json          # PM priority analysis
├── layout-plan.json        # Layout plan
├── design-plan.json        # Design plan
├── image-prompts.json      # AI image prompts
├── draft.pdf               # Draft print PDF
├── editor-review.json      # Editor feedback
└── digital.pdf             # Digital PDF (after approval)
```

### Final Artifacts

```
data/pdfs/{book-slug}/{version}/
├── print.pdf               # Publication-ready print PDF
└── digital.pdf             # Digital distribution PDF
```

### Prompts

```
data/w2-prompts/{run-id}/
├── pm-review.txt
├── layout.txt
├── design.txt
├── create-pdf.txt
├── editor-review.txt
└── derive-digital.txt
```

### Strategic Planning

```
data/w2-strategic/{plan-id}/
├── strategy.json           # Workflow configuration
└── state.json              # Progress tracking
```

---

## Human Gate Decision Flow

```
                     ┌─────────────────┐
                     │  Editor Review  │
                     └────────┬────────┘
                              │
                  ┌───────────▼────────────┐
                  │  approved: true?       │
                  └───────────┬────────────┘
                              │
                 Yes ─────────┼───────── No
                              │           │
                              │           └─► Return to Layout
                              │               (max 3 cycles)
                              │
                     ┌────────▼─────────┐
                     │   Human Gate     │
                     └────────┬─────────┘
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
    ┌─────▼──────┐   ┌────────▼────────┐  ┌─────▼─────┐
    │  Approve   │   │ Provide Assets  │  │  Reject   │
    └─────┬──────┘   └────────┬────────┘  └─────┬─────┘
          │                   │                  │
          │                   │                  │
    Derive Digital      Create PDF         Return to Layout
                       (with images)       (with feedback)
```

---

## Error Handling

### Precondition Failures

If a step's preconditions fail (e.g., missing HTML file):

```
ERROR: Precondition failed
- html_exists: Print HTML not found
- Expected: data/html/print-design/core-rulebook.html
- Solution: Run W1 finalization first
```

### Max Iterations Reached

If editor review rejects 3 times:

```
WARNING: Max editor cycles reached (3)
- Forcing progression to human gate
- Review issues manually before approval
```

### Invalid Results

If an agent produces invalid JSON:

```
ERROR: Result validation failed
- File: data/w2-artifacts/xyz/layout-plan.json
- Issue: Missing required field "margins"
- Solution: Re-run step and ensure complete output
```

---

## Integration with Other Workflows

### Input from W1

W2 requires these W1 outputs:
- Print HTML: `data/html/print-design/{book-slug}.html`
- Release Notes: `data/w1-artifacts/{w1-run-id}/release-notes.json` (optional)

### Output to W3 (Future)

W2 produces PDFs for W3 Publication workflow:
- Print PDF for print-on-demand services
- Digital PDF for distribution platforms

---

## CLI Reference

### Strategic Command

| Command | Description |
|---------|-------------|
| `pnpm w2:strategic --book <slug>` | Start new W2 workflow |
| `pnpm w2:strategic --resume <plan-id>` | Resume interrupted workflow |
| `pnpm w2:strategic --list` | List all W2 plans |

### Individual Step Commands

| Command | Description |
|---------|-------------|
| `pnpm w2:pm-review --run <id>` | Generate PM review prompt |
| `pnpm w2:pm-review --save --run <id> --result <path>` | Save PM review result |
| `pnpm w2:layout --run <id>` | Generate layout planning prompt |
| `pnpm w2:layout --save --run <id> --plan <path>` | Save layout plan |
| `pnpm w2:design --run <id>` | Generate design planning prompt |
| `pnpm w2:design --save --run <id> --plan <path>` | Save design plan |
| `pnpm w2:create-pdf --run <id>` | Generate PDF creation prompt |
| `pnpm w2:create-pdf --save --run <id> --pdf <path>` | Save generated PDF |
| `pnpm w2:editor-review --run <id>` | Generate editor review prompt |
| `pnpm w2:editor-review --save --run <id> --result <path>` | Save editor review |
| `pnpm w2:human-gate --run <id>` | Show human gate status |
| `pnpm w2:human-gate --approve --run <id>` | Approve and proceed |
| `pnpm w2:human-gate --provide-assets --run <id> --assets <dir>` | Add assets and continue |
| `pnpm w2:human-gate --reject --run <id> --feedback <text>` | Reject with feedback |
| `pnpm w2:derive-digital --run <id>` | Generate digital PDF prompt |
| `pnpm w2:derive-digital --save --run <id> --pdf <path>` | Save digital PDF |
| `pnpm w2:finalize --run <id>` | Finalize and copy to version dirs |

---

## Complete Workflow Example

```bash
# 1. Start workflow
pnpm w2:strategic --book core-rulebook
# → Generates orchestration prompt for Claude Code

# 2. [Claude Code executes steps 1-6 autonomously]
#    - PM Review
#    - Layout Planning
#    - Design Planning
#    - Create PDF
#    - Editor Review (may loop 1-3 times)
#    - Human Gate (stops here)

# 3. Review draft PDF
open data/w2-artifacts/<run-id>/draft.pdf

# 4. Human decision
pnpm w2:human-gate --approve --run <run-id>
# OR provide assets:
pnpm w2:human-gate --provide-assets --run <run-id> --assets data/w2-assets/<run-id>/
# OR reject:
pnpm w2:human-gate --reject --run <run-id> --feedback "Need tighter spacing in Chapter 3"

# 5. [Claude Code executes remaining steps]
#    - Derive Digital
#    - Finalize

# 6. Final PDFs available
ls data/pdfs/core-rulebook/v1.3.0/
```

---

## Related Documentation

- [Workflow Engine](workflow-engine.md) - Workflow orchestration system
- [W1 Editing Workflow](../workflows/w1-editing.md) - Content editing workflow (prerequisite)
- [CLI Reference](../workflows/cli-reference.md) - All CLI commands
- [Agent Architecture](agent-architecture.md) - Prompt-based agent pattern
