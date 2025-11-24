---
status: ENGINEERING_PLAN_DATAFLOW
created: 2025-11-23
title: "W1 Data Flow & Execution Patterns"
author: VP Engineering
---

# W1 Data Flow & Execution Patterns

Visual guide to data movement and execution patterns across W1 phases.

---

## Phase 1: Foundation Verification

```
w1:verify-foundation
    ↓
    Check WorkflowRepository (DB connectivity)
    Check ReviewOrchestrator (Review DB)
    Check ArtifactRegistry (Artifact DB)
    ↓
    Output: "✓ All systems ready" or "✗ Fix [component]"
```

**Data flow:** None (read-only verification)

---

## Phase 2: Planning Pipeline

```
INPUT:
  analysis/ [from review:analyze]
    ├── findings.json
    ├── themes.json
    └── metrics.json

w1:planning --book core --analysis data/reviews/analysis
    ↓
    WorkflowRepository.create(type: w1_editing, status: pending)
        ↓ workflow_id = wfrun_...
    ↓
    InvokerPM.call({
        analysis: <read findings.json>,
        book_context: <from BookRepository>,
        prior_notes: <from prior releases>
    })
        ↓ Call Claude with pm-analysis-to-plan.md
        ↓ Output: improvement_plan.md
    ↓
    ArtifactRegistry.register({
        workflowRunId: wfrun_...,
        artifactType: "improvement_plan",
        artifactPath: "data/workflow/w1/plan_<timestamp>.md"
    })
    ↓
    WorkflowRepository.setCurrentAgent(wfrun_..., null)
    WorkflowRepository.updateStatus(wfrun_..., "ready_for_content_modification")

OUTPUT:
  Improvement plan registered as artifact
  Workflow status: ready_for_content_modification
  Console: "Run: pnpm w1:content-modify --book core --plan <artifact_id>"
```

**Data flow:** review_analysis → [PM Agent] → improvement_plan → ArtifactRegistry

---

## Phase 3: Content Modification Pipeline

```
INPUT:
  improvement_plan (from Phase 2)
  books/core/*.md (existing chapters)
  style_guide.md
  personas/ (loaded from DB)

ITERATION LOOP (until both agents approve):

  w1:content-modify --book core --plan art_... --iteration 1
      ↓
      WorkflowRepository.updateStatus(wfrun_..., "running")
      WorkflowRepository.setCurrentAgent(wfrun_..., "writer")
      ↓
      [WRITER PHASE]
      InvokerWriter.call({
          plan: <read improvement_plan>,
          chapters: <read books/core/*.md>,
          style_guide: <read style_guide.md>
      })
          ↓ Call Claude with writer-implement-plan.md
          ↓ Output: updated_chapters.json + changelog.json
      ↓
      ArtifactRegistry.register({
          workflowRunId: wfrun_...,
          artifactType: "chapter_updates",
          artifactPath: "data/workflow/w1/writer_<iteration>.json",
          metadata: { iteration: 1 }
      })
      ↓
      WorkflowRepository.setCurrentAgent(wfrun_..., "editor")
      ↓
      [EDITOR PHASE]
      InvokerEditor.call({
          chapters: <from writer output>,
          style_guide: <read style_guide.md>
      })
          ↓ Call Claude with editor-review.md
          ↓ Output: { approved: bool, feedback: [...] }
      ↓
      IF editor.approved == false:
          ArtifactRegistry.register({
              workflowRunId: wfrun_...,
              artifactType: "rejection_feedback",
              artifactPath: "data/workflow/w1/editor_rejection_<iteration>.json",
              metadata: { phase: "editor", iteration: 1 }
          })
          Output: "✗ Editor rejected. Feedback: [...]"
          Halt (return to writer in next iteration)
      ↓
      [DOMAIN EXPERT PHASE]
      WorkflowRepository.setCurrentAgent(wfrun_..., "domain_expert")
      ↓
      InvokerDomainExpert.call({
          chapters: <from writer output>,
          rules: <read rules_document.md>,
          personas: <loaded from DB>
      })
          ↓ Call Claude with domain-expert-review.md
          ↓ Output: { approved: bool, issues: [...] }
      ↓
      IF domain_expert.approved == false:
          ArtifactRegistry.register({
              workflowRunId: wfrun_...,
              artifactType: "rejection_feedback",
              artifactPath: "data/workflow/w1/domain_expert_rejection_<iteration>.json",
              metadata: { phase: "domain_expert", iteration: 1 }
          })
          Output: "✗ Domain Expert rejected. Issues: [...]"
          Halt (return to writer in next iteration)
      ↓
      IF both approved:
          ArtifactRegistry.register({
              workflowRunId: wfrun_...,
              artifactType: "approved_chapters",
              artifactPath: "data/workflow/w1/approved_chapters_<iteration>.json"
          })
          WorkflowRepository.setCurrentAgent(wfrun_..., null)
          WorkflowRepository.updateStatus(wfrun_..., "ready_for_validation")

OUTPUT:
  Approved chapters registered as artifact
  Workflow status: ready_for_validation
  Console: "Run: pnpm w1:validate --book core --iteration 1 --chapters [...]"
```

**Data flow:**
```
improvement_plan + chapters + style_guide
    ↓
[Writer] → updated_chapters
    ↓
[Editor] → approve/reject (with feedback)
    ↓
IF reject: halt, log feedback
IF approve:
    ↓
[Domain Expert] → approve/reject (with issues)
    ↓
IF reject: halt, log issues
IF approve:
    ↓
approved_chapters → ArtifactRegistry
```

---

## Phase 4: Validation Pipeline

```
INPUT:
  approved_chapters (from Phase 3)
  baseline_metrics.json (from prior review campaign)
  book_id, chapter_list

w1:validate --book core --iteration 1 --chapters chapter_1,chapter_2,chapter_3
    ↓
    WorkflowRepository.updateStatus(wfrun_..., "running")
    WorkflowRepository.setCurrentAgent(wfrun_..., "review_orchestrator")
    ↓
    [CHAPTER REVIEW PHASE]
    ReviewOrchestrator.initializeCampaign({
        campaignName: "Core v1 - W1 Validation Cycle 1",
        contentType: "chapter",
        contentPath: <for each chapter>,
        personaSelectionStrategy: "all_core"  // Use same personas as baseline
    })
        ↓ For each chapter:
        ↓     Create CampaignClient campaign
        ↓     Run parallel reviewer agents
        ↓     Poll for completion
        ↓     Validate review outputs
    ↓
    ReviewOrchestrator.runAnalysis(campaignId)
        ↓ Aggregate review results
        ↓ Generate analysis JSON
    ↓
    ArtifactRegistry.register({
        workflowRunId: wfrun_...,
        artifactType: "chapter_review_analysis",
        artifactPath: "data/workflow/w1/review_analysis_<iteration>.json"
    })
    ↓
    WorkflowRepository.setCurrentAgent(wfrun_..., "pm")
    ↓
    [METRICS EVALUATION PHASE]
    InvokerPMMetrics.call({
        baseline_metrics: <load from prior review>,
        new_metrics: <from chapter_review_analysis>
    })
        ↓ Call Claude with pm-metrics-eval.md
        ↓ Output: { approved: bool, reasoning: string }
    ↓
    IF metrics.approved == false:
        ArtifactRegistry.register({
            workflowRunId: wfrun_...,
            artifactType: "validation_rejection",
            artifactPath: "data/workflow/w1/validation_rejection_<iteration>.json",
            metadata: { reason: "metrics_not_improved" }
        })
        WorkflowRepository.updateStatus(wfrun_..., "validation_failed")
        Output: "✗ Metrics did not improve. Feedback: [...]"
    ↓
    IF metrics.approved == true:
        ArtifactRegistry.register({
            workflowRunId: wfrun_...,
            artifactType: "validation_approval",
            artifactPath: "data/workflow/w1/validation_approval_<iteration>.json"
        })
        WorkflowRepository.setCurrentAgent(wfrun_..., null)
        WorkflowRepository.updateStatus(wfrun_..., "ready_for_human_review")

OUTPUT:
  Validation result registered as artifact
  Workflow status: ready_for_human_review
  Console: "Run: pnpm w1:human-approve --book core --workflow wfrun_..."
```

**Data flow:**
```
approved_chapters + baseline_metrics
    ↓
[ReviewOrchestrator] → chapter_review_analysis
    ↓
[PM Metrics Evaluator] → approve/reject (with reasoning)
    ↓
approval/rejection → ArtifactRegistry
```

---

## Phase 5: Human Gate

```
INPUT:
  wfrun_... workflow run ID

w1:human-approve --book core --workflow wfrun_...
    ↓
    Load artifacts from ArtifactRegistry:
        - improvement_plan (Phase 2)
        - approved_chapters (Phase 3)
        - validation_approval (Phase 4)
        - editor_feedback (Phase 3)
        - metrics_reasoning (Phase 4)
    ↓
    DISPLAY TO HUMAN:
    ┌────────────────────────────────────────┐
    │ W1 CYCLE APPROVAL REQUEST              │
    ├────────────────────────────────────────┤
    │ IMPROVEMENT PLAN:                      │
    │ • Update chapter X: [description]      │
    │ • Update chapter Y: [description]      │
    │                                        │
    │ CHAPTER CHANGES:                       │
    │ • Modified 3 chapters                  │
    │ • 240 lines added, 180 removed         │
    │                                        │
    │ VALIDATION RESULTS:                    │
    │ • Reviewer feedback scores: +12%       │
    │ • Clarity improved, no regressions     │
    │                                        │
    │ Approve changes and proceed? (y/n)    │
    └────────────────────────────────────────┘
    ↓
    [HUMAN DECISION]
    ↓
    IF human enters "y":
        ArtifactRegistry.register({
            workflowRunId: wfrun_...,
            artifactType: "human_approval",
            artifactPath: "data/workflow/w1/human_approval_<timestamp>.json",
            metadata: { approved: true, timestamp: ... }
        })
        WorkflowRepository.updateStatus(wfrun_..., "ready_for_finalization")
        Output: "✓ Approved. Run: pnpm w1:finalize --book core --workflow wfrun_..."
    ↓
    IF human enters "n" or provides feedback:
        ArtifactRegistry.register({
            workflowRunId: wfrun_...,
            artifactType: "human_rejection",
            artifactPath: "data/workflow/w1/human_rejection_<timestamp>.json",
            metadata: { approved: false, feedback: "..." }
        })
        WorkflowRepository.updateStatus(wfrun_..., "rejected_by_human")
        Output: "✗ Rejected. Feedback: [...]
                 Next steps: Review feedback and restart with w1:planning"

OUTPUT:
  Human approval/rejection registered as artifact
  Workflow status: ready_for_finalization OR rejected_by_human
```

**Data flow:** Display artifacts → Human decision → Record decision → Next phase or loop back

---

## Phase 6: Finalization

```
INPUT:
  approved_chapters + human approval

w1:finalize --book core --workflow wfrun_...
    ↓
    WorkflowRepository.updateStatus(wfrun_..., "running")
    ↓
    [PRINT HTML PHASE]
    WorkflowRepository.setCurrentAgent(wfrun_..., "html_gen_print")
    ↓
    CMD: pnpm html-gen:print-build --book core --output data/workflow/w1/print_<ts>.html

    HtmlGenPrint.build({
        markdownDir: "books/core",
        outputPath: "data/workflow/w1/print_<ts>.html"
    })
        ↓ Parse markdown chapters
        ↓ Apply print transformations
        ↓ Generate single HTML file
    ↓
    CMD: pnpm html-gen:print-promote --book core

    HtmlGenPrint.promote({
        from: "data/workflow/w1/print_<ts>.html",
        to: "src/site/core_rulebook_print.html"
    })
    ↓
    ArtifactRegistry.register({
        workflowRunId: wfrun_...,
        artifactType: "print_html",
        artifactPath: "src/site/core_rulebook_print.html"
    })
    ↓
    [PDF GENERATION PHASE]
    WorkflowRepository.setCurrentAgent(wfrun_..., "pdf_gen")
    ↓
    CMD: pnpm pdf-gen:build --html src/site/core_rulebook_print.html --output data/workflow/w1/pdf_<ts>.pdf

    PDFPipeline.generate({
        htmlPath: "src/site/core_rulebook_print.html",
        outputPath: "data/workflow/w1/pdf_<ts>.pdf"
    })
        ↓ Parse HTML
        ↓ Render pages
        ↓ Apply styling
        ↓ Generate PDF
    ↓
    ArtifactRegistry.register({
        workflowRunId: wfrun_...,
        artifactType: "pdf_draft",
        artifactPath: "data/workflow/w1/pdf_<ts>.pdf"
    })
    ↓
    [WEB HTML PHASE]
    WorkflowRepository.setCurrentAgent(wfrun_..., "html_gen_web")
    ↓
    CMD: pnpm html-gen:web-build --book core --output data/workflow/w1/web_<ts>.html

    HtmlGenWeb.build({
        markdownDir: "books/core",
        outputPath: "data/workflow/w1/web_<ts>.html"
    })
        ↓ Parse markdown chapters
        ↓ Apply web transformations
        ↓ Generate web-friendly HTML
    ↓
    CMD: pnpm html-gen:web-promote --book core

    HtmlGenWeb.promote({
        from: "data/workflow/w1/web_<ts>.html",
        to: "src/site/core_rulebook_web.html"
    })
    ↓
    ArtifactRegistry.register({
        workflowRunId: wfrun_...,
        artifactType: "web_html",
        artifactPath: "src/site/core_rulebook_web.html"
    })
    ↓
    [RELEASE NOTES PHASE]
    WorkflowRepository.setCurrentAgent(wfrun_..., "release_notes_gen")
    ↓
    InvokerReleaseNotes.call({
        plan: <load improvement_plan artifact>,
        chapters_modified: <from approved_chapters>,
        metrics_improvement: <load validation_approval artifact>
    })
        ↓ Call Claude with release-notes-gen.md
        ↓ Output: release_notes.md
    ↓
    ArtifactRegistry.register({
        workflowRunId: wfrun_...,
        artifactType: "release_notes",
        artifactPath: "data/workflow/w1/release_notes_<version>.md"
    })
    ↓
    WorkflowRepository.setCurrentAgent(wfrun_..., null)
    WorkflowRepository.updateStatus(wfrun_..., "completed")
    ↓
    FINAL OUTPUT:
    ┌────────────────────────────────────────┐
    │ W1 CYCLE COMPLETE                      │
    ├────────────────────────────────────────┤
    │ ✓ Print HTML: src/site/core_rulebook_print.html
    │ ✓ PDF:        data/workflow/w1/pdf_<ts>.pdf
    │ ✓ Web HTML:   src/site/core_rulebook_web.html
    │ ✓ Release:    data/workflow/w1/release_notes_<version>.md
    │                                        │
    │ All artifacts registered               │
    │ Workflow status: completed             │
    └────────────────────────────────────────┘

OUTPUT:
  All finalization artifacts registered
  Workflow status: completed
```

**Data flow:**
```
approved_chapters
    ↓
[HtmlGenPrint] → print_html → [HtmlGenWeb] → web_html
    ↓
print_html → [PDFPipeline] → pdf
    ↓
approval + chapters + metrics → [ReleaseNotesGen] → release_notes
    ↓
All artifacts → ArtifactRegistry (completed)
```

---

## Database Schema Usage

### workflow_runs table
```sql
INSERT INTO workflow_runs
  (id, workflow_type, book_id, input_version_id, session_id, plan_id, status, current_agent)
VALUES
  ('wfrun_...', 'w1_editing', 'core', NULL, 'sess_...', NULL, 'pending', NULL);

-- Phase 2: planning
UPDATE workflow_runs SET status='ready_for_content_modification', updated_at=NOW() WHERE id='wfrun_...';

-- Phase 3: content modification loop
UPDATE workflow_runs SET current_agent='writer', updated_at=NOW() WHERE id='wfrun_...';
UPDATE workflow_runs SET current_agent='editor', updated_at=NOW() WHERE id='wfrun_...';
UPDATE workflow_runs SET current_agent='domain_expert', updated_at=NOW() WHERE id='wfrun_...';
UPDATE workflow_runs SET status='ready_for_validation', current_agent=NULL, updated_at=NOW() WHERE id='wfrun_...';

-- Phase 4: validation
UPDATE workflow_runs SET status='running', updated_at=NOW() WHERE id='wfrun_...';
UPDATE workflow_runs SET status='ready_for_human_review', current_agent=NULL, updated_at=NOW() WHERE id='wfrun_...';

-- Phase 5: human gate
UPDATE workflow_runs SET status='ready_for_finalization', updated_at=NOW() WHERE id='wfrun_...';
-- OR
UPDATE workflow_runs SET status='rejected_by_human', updated_at=NOW() WHERE id='wfrun_...';

-- Phase 6: finalization
UPDATE workflow_runs SET status='running', updated_at=NOW() WHERE id='wfrun_...';
UPDATE workflow_runs SET status='completed', current_agent=NULL, updated_at=NOW() WHERE id='wfrun_...';
```

### workflow_artifacts table
```sql
-- Phase 2
INSERT INTO workflow_artifacts
  (id, workflow_run_id, artifact_type, artifact_path, metadata, created_at)
VALUES
  ('art_...', 'wfrun_...', 'improvement_plan', 'data/workflow/w1/plan_<ts>.md', NULL, NOW());

-- Phase 3
INSERT INTO workflow_artifacts
VALUES
  ('art_...', 'wfrun_...', 'chapter_updates', 'data/workflow/w1/writer_1.json', '{"iteration":1}', NOW()),
  ('art_...', 'wfrun_...', 'approved_chapters', 'data/workflow/w1/approved_chapters_1.json', NULL, NOW());

-- Phase 4
INSERT INTO workflow_artifacts
VALUES
  ('art_...', 'wfrun_...', 'chapter_review_analysis', 'data/workflow/w1/review_analysis_1.json', NULL, NOW()),
  ('art_...', 'wfrun_...', 'validation_approval', 'data/workflow/w1/validation_approval_1.json', NULL, NOW());

-- Phase 5
INSERT INTO workflow_artifacts
VALUES
  ('art_...', 'wfrun_...', 'human_approval', 'data/workflow/w1/human_approval_<ts>.json', '{"approved":true}', NOW());

-- Phase 6
INSERT INTO workflow_artifacts
VALUES
  ('art_...', 'wfrun_...', 'print_html', 'src/site/core_rulebook_print.html', NULL, NOW()),
  ('art_...', 'wfrun_...', 'pdf_draft', 'data/workflow/w1/pdf_<ts>.pdf', NULL, NOW()),
  ('art_...', 'wfrun_...', 'web_html', 'src/site/core_rulebook_web.html', NULL, NOW()),
  ('art_...', 'wfrun_...', 'release_notes', 'data/workflow/w1/release_notes_<version>.md', NULL, NOW());
```

---

## State Transition Diagram

```
pending
  ↓
ready_for_content_modification
  ↓
running (Phase 3: content modification loop)
  ├→ (editor rejects) → back to running
  ├→ (domain rejects) → back to running
  ↓ (both approve)
ready_for_validation
  ↓
running (Phase 4: chapter review + metrics)
  ├→ (metrics not improved) → validation_failed
  ↓ (metrics improved)
ready_for_human_review
  ↓
running (Phase 5: human decision)
  ├→ (human rejects) → rejected_by_human
  ↓ (human approves)
ready_for_finalization
  ↓
running (Phase 6: finalization)
  ├→ (any step fails) → failed
  ↓ (all succeed)
completed
```

---

## Artifact Type Mapping

| Phase | Artifact Type | Content | Status |
|-------|---------------|---------|--------|
| 2 | improvement_plan | PM's analysis-based plan | Input to P3 |
| 3 | chapter_updates | Writer's output | Intermediate |
| 3 | rejection_feedback | Editor/Domain feedback | Loop signal |
| 3 | approved_chapters | Final approved chapters | Input to P4 |
| 4 | chapter_review_analysis | Review campaign results | Intermediate |
| 4 | validation_approval | Metrics eval result | Input to P5 |
| 4 | validation_rejection | Metrics eval rejection | Loop signal |
| 5 | human_approval | Human approval record | Input to P6 |
| 5 | human_rejection | Human rejection + feedback | Loop signal |
| 6 | print_html | Promoted print HTML | Output |
| 6 | pdf_draft | Generated PDF | Output |
| 6 | web_html | Promoted web HTML | Output |
| 6 | release_notes | Generated release notes | Output |

---

## Execution Timeline

```
T0:   pnpm w1:planning           → artifact: improvement_plan
T1:   pnpm w1:content-modify     → loop until approved → artifact: approved_chapters
T2:   pnpm w1:validate           → loop if metrics bad → artifact: validation_approval
T3:   pnpm w1:human-approve      → artifact: human_approval
T4:   pnpm w1:finalize           → artifacts: print_html, pdf, web_html, release_notes
      ✓ Workflow completed
```

---

## Error Handling Patterns

### Editor Rejection
```
editor.approved = false
  → ArtifactRegistry.register(type: rejection_feedback, ...)
  → Console: "✗ Editor feedback: [...]"
  → Next: retry w1:content-modify with --iteration 2
```

### Domain Expert Rejection
```
domain.approved = false
  → ArtifactRegistry.register(type: rejection_feedback, ...)
  → Console: "✗ Domain Expert issues: [...]"
  → Next: retry w1:content-modify with --iteration 2
```

### Metrics Not Improved
```
metrics.approved = false
  → ArtifactRegistry.register(type: validation_rejection, ...)
  → WorkflowRepository.updateStatus(..., validation_failed)
  → Console: "✗ Metrics did not improve. Restarting from planning."
  → Next: pnpm w1:planning (new cycle)
```

### Human Rejects
```
human choice = "n"
  → ArtifactRegistry.register(type: human_rejection, ...)
  → WorkflowRepository.updateStatus(..., rejected_by_human)
  → Console: "✗ Changes rejected. Address feedback and restart."
  → Next: pnpm w1:planning (new cycle)
```

### Finalization Failure
```
If any phase fails (HTML gen, PDF gen, etc):
  → WorkflowRepository.updateStatus(..., failed)
  → Console: "✗ Finalization failed at [phase]. Error: [...]"
  → Next: Debug error, re-run w1:finalize
```

