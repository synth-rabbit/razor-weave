---
status: ENGINEERING_PLAN
created: 2025-11-23
title: "W1 Engineering Tasks - Translation of VP Product 6-Phase Plan"
author: VP Engineering
---

# W1 Engineering Tasks

Translation of VP Product's 6-phase plan into minimal engineering implementation.
Leverages existing Prework infrastructure to avoid duplication.

---

## Overview

VP Product's 6 phases map to these engineering workstreams:

1. **Foundation Verification** → Verify Prework infrastructure (Type: Verification)
2. **Planning Pipeline** → PM Agent orchestration (Type: Agent/CLI)
3. **Content Modification** → Writer/Editor/Domain Expert agents (Type: Agent/Orchestration)
4. **Validation Pipeline** → Chapter review pipeline integration (Type: Integration)
5. **Human Gate** → Human approval CLI (Type: CLI/Workflow)
6. **Finalization** → HTML/PDF/release notes promotion (Type: Integration)

---

## Task Breakdown

### PHASE 1: FOUNDATION VERIFICATION

#### T1.1 - Verify Workflow Infrastructure
**Description:**
Create a verification script that confirms WorkflowRepository, WorkflowStateMachine, and related classes are functional and database schema is initialized.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-verify-foundation.ts` (CREATE)
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/workflows/repository.ts`
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/workflows/state-machine.ts`
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/database/schema.ts`

**Implementation notes:**
- Use WorkflowRepository.list() to verify database table exists
- Check for example workflow run creation/retrieval round-trip
- Output formatted status (success/failure) to console
- No modifications to infrastructure classes needed

**Dependencies:**
- None (foundational task)

---

#### T1.2 - Verify Review System Infrastructure
**Description:**
Confirm ReviewOrchestrator, CampaignClient, and review database schema are operational.

**Files to create/modify:**
- Same verification script extends to include review checks
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/reviews/orchestrator.ts`
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/reviews/campaign-client.ts`

**Implementation notes:**
- Use CampaignClient.getCampaigns() to verify review table exists
- Verify persona database is accessible
- Output formatted status to console
- No infrastructure modifications needed

**Dependencies:**
- T1.1

---

#### T1.3 - Verify Artifact Registry
**Description:**
Confirm ArtifactRegistry and trigger engine are operational for cross-workflow artifact tracking.

**Files to create/modify:**
- Same verification script extends to include artifact checks
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/workflows/artifact-registry.ts`
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/workflows/trigger-engine.ts`

**Implementation notes:**
- Test ArtifactRegistry.register() with test artifact
- Verify artifact can be queried by type
- No infrastructure modifications needed

**Dependencies:**
- T1.1, T1.2

---

### PHASE 2: PLANNING PIPELINE

#### T2.1 - Create PM Agent Prompt
**Description:**
Write the Project Manager agent prompt that consumes review analysis and produces an improvement plan.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/prompts/pm-analysis-to-plan.md` (CREATE)

**Prompt structure:**
- Input: Review analysis JSON from review:analyze pipeline
- Output: Improvement plan with:
  - List of chapters to modify
  - Specific improvements per chapter
  - Success metrics
  - Priority ranking
- Context: Access to book structure, prior release notes, personas

**Implementation notes:**
- Prompt should be deterministic and parseable
- Output format: Markdown with structured sections
- Reuse analysis schema from existing review system
- No code changes to agent invoker needed

**Dependencies:**
- T1.2 (review system must be verified)

---

#### T2.2 - Create PM Agent Invoker
**Description:**
Implement the PM agent invoker that calls Claude with the PM prompt and parsed output.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/invoker-pm.ts` (CREATE)
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/agents/invoker.ts` (reference)

**Implementation notes:**
- Use existing VPInvoker pattern from boardroom-vp-product.ts
- Accept analysis file path and book context as inputs
- Call Claude with PM prompt
- Parse output into structured improvement plan
- Return plan JSON for downstream consumption

**Dependencies:**
- T2.1

---

#### T2.3 - Create Planning CLI Command
**Description:**
Create `w1:planning` CLI command that orchestrates the planning phase.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-planning.ts` (CREATE)

**CLI interface:**
```
pnpm w1:planning --book <book-id> --analysis <path-to-analysis> [--output <dir>]
```

**Responsibilities:**
- Create workflow run (type: w1_editing, status: pending)
- Invoke PM agent with analysis
- Store resulting plan as artifact
- Output next CLI step to stdout

**Implementation notes:**
- Reuse WorkflowRepository for state management
- Register plan output as artifact (type: custom TBD)
- Output formatted guidance for next phase

**Dependencies:**
- T2.2, T1.1

---

### PHASE 3: CONTENT MODIFICATION PIPELINE

#### T3.1 - Create Writer Agent Prompt
**Description:**
Write the Writer agent prompt that implements improvements from the PM plan.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/prompts/writer-implement-plan.md` (CREATE)

**Prompt structure:**
- Input: Improvement plan + existing markdown chapters
- Output: Updated markdown + changelog
- Context: Style guides, rules, existing chapter structure
- Constraints: Preserve structure, update content only

**Implementation notes:**
- Prompt must be clear about which chapters to modify
- Output format: Updated markdown files + JSON changelog
- Changelog must list: modified chapters, what changed, why

**Dependencies:**
- T2.1 (plan structure must be defined)

---

#### T3.2 - Create Writer Agent Invoker
**Description:**
Implement writer agent invoker that calls Claude with plan and chapter context.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/invoker-writer.ts` (CREATE)

**Implementation notes:**
- Accept improvement plan path and book context
- Read relevant chapters from markdown
- Call Claude with writer prompt
- Parse output: updated chapters + changelog JSON
- Return structured result

**Dependencies:**
- T3.1

---

#### T3.3 - Create Editor Agent Prompt
**Description:**
Write the Editor agent prompt for style/consistency review.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/prompts/editor-review.md` (CREATE)

**Prompt structure:**
- Input: Updated chapters from writer + style guide
- Output: Approval/rejection + feedback
- Check: Grammar, tone, consistency, style compliance

**Implementation notes:**
- Output format: JSON with pass/fail + feedback items
- If fail, provide specific corrections needed

**Dependencies:**
- T3.1

---

#### T3.4 - Create Editor Agent Invoker
**Description:**
Implement editor agent invoker.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/invoker-editor.ts` (CREATE)

**Implementation notes:**
- Accept writer output path and style guide path
- Call Claude with editor prompt
- Return structured approval/rejection result
- Output format: JSON with { approved: boolean, feedback: string[] }

**Dependencies:**
- T3.3

---

#### T3.5 - Create Domain Expert Agent Prompt
**Description:**
Write the Domain Expert agent prompt for mechanical/rule consistency.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/prompts/domain-expert-review.md` (CREATE)

**Prompt structure:**
- Input: Updated chapters + rules document + persona concerns
- Output: Approval/rejection + mechanical feedback
- Check: Rules consistency, no contradictions, mechanical coherence

**Implementation notes:**
- Output format: JSON with pass/fail + specific mechanical issues
- Should reference persona-specific concerns if applicable

**Dependencies:**
- T3.1

---

#### T3.6 - Create Domain Expert Agent Invoker
**Description:**
Implement domain expert agent invoker.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/invoker-domain-expert.ts` (CREATE)

**Implementation notes:**
- Accept writer output path, rules document, persona concerns
- Call Claude with domain expert prompt
- Return structured approval/rejection result
- Output format: JSON with { approved: boolean, issues: string[] }

**Dependencies:**
- T3.5

---

#### T3.7 - Create Content Modification CLI Command
**Description:**
Create `w1:content-modify` CLI command that orchestrates writer/editor/domain expert loop.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-content-modify.ts` (CREATE)

**CLI interface:**
```
pnpm w1:content-modify --book <book-id> --plan <path> --iteration <number> [--output <dir>]
```

**Workflow:**
1. Invoke Writer agent with plan
2. Store writer output as artifact
3. Invoke Editor agent with writer output
4. If editor rejects: collect feedback, log rejection, prepare for next iteration
5. If editor approves: proceed to Domain Expert
6. Invoke Domain Expert agent
7. If domain expert rejects: collect feedback, log rejection, prepare for next iteration
8. If both approve: register artifacts, output completion status

**Implementation notes:**
- Track rejection count per phase for exit criteria
- Update workflow run status through each step
- Register intermediate outputs as artifacts
- Output clear next-step instructions
- If both agents reject after N iterations, signal to human gate

**Dependencies:**
- T3.2, T3.4, T3.6, T1.1

---

### PHASE 4: VALIDATION PIPELINE

#### T4.1 - Create Chapter Review Integration
**Description:**
Integrate existing review:chapter pipeline with W1 workflow for modified chapters.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-validate-chapters.ts` (CREATE)
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/review.ts` (reference)

**CLI interface:**
```
pnpm w1:validate-chapters --book <book-id> --chapters <chapter-list> --output <dir>
```

**Responsibilities:**
- Accept list of modified chapters from content modification phase
- Run review campaign on those chapters only (not full book)
- Use same persona strategy as baseline for comparison
- Generate review analysis
- Compare metrics to baseline

**Implementation notes:**
- Reuse ReviewOrchestrator from existing review system
- Filter to only modified chapters
- Store comparison metrics as artifact
- Output: pass/fail based on metric improvement or at least no degradation

**Dependencies:**
- T3.7 (need modified chapter list), T1.2 (review system)

---

#### T4.2 - Create Metrics Evaluator
**Description:**
Create PM evaluator that checks if chapter review metrics improved vs. baseline.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/prompts/pm-metrics-eval.md` (CREATE)
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/invoker-pm-metrics.ts` (CREATE)

**Prompt structure:**
- Input: Baseline metrics + new chapter review metrics
- Output: JSON with { approved: boolean, reasoning: string }
- Logic: Look for improvement or at least no significant degradation

**Implementation notes:**
- Metrics should include review scores, feedback themes
- Allow for acceptable variance (don't require perfection)
- Output decision: approve (proceed to human gate) or reject (loop back to planning)

**Dependencies:**
- T4.1

---

#### T4.3 - Create Validation CLI Command
**Description:**
Create `w1:validate` CLI command that orchestrates chapter review and metrics evaluation.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-validate.ts` (CREATE)

**CLI interface:**
```
pnpm w1:validate --book <book-id> --iteration <number> --chapters <chapter-list> [--baseline <metrics-file>]
```

**Workflow:**
1. Run chapter reviews (uses T4.1)
2. Compare metrics to baseline (uses T4.2)
3. If metrics don't improve: reject, output feedback for next iteration
4. If metrics improve: approve, register artifact, proceed to human gate

**Implementation notes:**
- Update workflow status through each step
- Register validation results as artifact
- Output clear decision and reasoning
- If rejection, suggest improvements based on feedback themes

**Dependencies:**
- T4.1, T4.2

---

### PHASE 5: HUMAN GATE

#### T5.1 - Create Human Approval CLI Command
**Description:**
Create `w1:human-approve` CLI command that shows human what changed and accepts approval/rejection.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-human-approve.ts` (CREATE)

**CLI interface:**
```
pnpm w1:human-approve --book <book-id> --workflow <run-id>
```

**Display:**
- Show improvement plan (from phase 2)
- Show chapter modifications (from phase 3)
- Show review metrics change (from phase 4)
- Show editor/domain expert feedback (from phase 3)

**User interaction:**
- Prompt: "Approve changes and proceed to finalization? (y/n)"
- If YES: Update workflow status to "approved", output next CLI command
- If NO: Prompt for feedback/rejection reason, update status to "rejected", output next CLI command

**Implementation notes:**
- Reuse CLIFormatter from existing CLI infrastructure
- Pull all artifacts from workflow run (ArtifactRegistry)
- Log rejection reason to workflow events
- Don't auto-proceed; require explicit user confirmation

**Dependencies:**
- T4.3, T1.1, T1.3

---

### PHASE 6: FINALIZATION

#### T6.1 - Create Print HTML Promotion
**Description:**
Integrate existing print HTML pipeline to promote updated content.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-finalize-print-html.ts` (CREATE)
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/html-gen/print/promote.ts` (reference)

**CLI interface:**
```
pnpm w1:finalize-print-html --book <book-id>
```

**Responsibilities:**
- Call existing print HTML build pipeline
- Promote built HTML to active version
- Register promoted HTML as artifact

**Implementation notes:**
- Reuse HtmlGenPrint class from existing infrastructure
- No new code needed; just orchestration wrapper
- Output: path to promoted print HTML file

**Dependencies:**
- T5.1 (human approval)

---

#### T6.2 - Create PDF Generation
**Description:**
Call existing PDF generation pipeline to create new PDF from promoted HTML.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-finalize-pdf.ts` (CREATE)
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/pdf-gen/pipeline.ts` (reference)

**CLI interface:**
```
pnpm w1:finalize-pdf --book <book-id> --html <path>
```

**Responsibilities:**
- Call existing PDF pipeline with promoted HTML
- Generate draft PDF
- Register PDF as artifact

**Implementation notes:**
- Reuse PDFPipeline class from existing infrastructure
- No new code needed; orchestration wrapper
- Output: path to generated PDF file

**Dependencies:**
- T6.1

---

#### T6.3 - Create Web HTML Generation
**Description:**
Call existing web HTML pipeline to generate web-viewable content.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-finalize-web-html.ts` (CREATE)
- Existing: `/Users/pandorz/Documents/razorweave/src/tooling/html-gen/web/promote.ts` (reference)

**CLI interface:**
```
pnpm w1:finalize-web-html --book <book-id>
```

**Responsibilities:**
- Call existing web HTML build pipeline
- Promote built HTML to active version
- Register promoted HTML as artifact

**Implementation notes:**
- Reuse HtmlGenWeb class from existing infrastructure
- No new code needed; orchestration wrapper
- Output: path to promoted web HTML file

**Dependencies:**
- T5.1 (human approval)

---

#### T6.4 - Create Release Notes Generation
**Description:**
Generate structured release notes from workflow artifacts.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/prompts/release-notes-gen.md` (CREATE)
- `/Users/pandorz/Documents/razorweave/src/tooling/agents/invoker-release-notes.ts` (CREATE)

**Prompt structure:**
- Input: Improvement plan + chapter modifications + metrics improvement
- Output: Release notes in Markdown format
- Content: Summary of changes, highlights, metrics, known issues

**Implementation notes:**
- Call Claude to synthesize release notes from artifacts
- Output format: Markdown with standard sections
- Keep tone user-friendly, not technical

**Dependencies:**
- T6.1, T6.3 (need finalized artifacts)

---

#### T6.5 - Create Finalization Orchestrator
**Description:**
Create `w1:finalize` CLI command that runs all finalization steps.

**Files to create/modify:**
- `/Users/pandorz/Documents/razorweave/src/tooling/cli-commands/w1-finalize.ts` (CREATE)

**CLI interface:**
```
pnpm w1:finalize --book <book-id> --workflow <run-id>
```

**Workflow:**
1. Promote print HTML (T6.1)
2. Generate PDF (T6.2)
3. Generate web HTML (T6.3)
4. Generate release notes (T6.4)
5. Update workflow status to "completed"
6. Register all artifacts
7. Output completion summary

**Implementation notes:**
- Run all steps sequentially
- If any step fails, mark workflow as "failed" and stop
- Output clear error messages for debugging
- Final output: summary of all generated artifacts

**Dependencies:**
- T6.1, T6.2, T6.3, T6.4, T1.1

---

## Integration Points

### From Prework Infrastructure
- **WorkflowRepository** - Track W1 workflow runs, state transitions
- **WorkflowStateMachine** - Enforce valid status transitions
- **ArtifactRegistry** - Register plan, chapters, reviews, HTML, PDF, release notes
- **ReviewOrchestrator** - Run chapter-level reviews in phase 4
- **CampaignClient** - Access review campaigns and personas
- **WorkflowEventEmitter** - Log workflow events for debugging

### From Existing Pipelines
- **HtmlGenPrint** - Phase 6, promote print HTML
- **HtmlGenWeb** - Phase 6, promote web HTML
- **PDFPipeline** - Phase 6, generate PDF from HTML
- **ReviewOrchestrator** - Phase 4, run chapter reviews

### CLI Command Pattern
All W1 CLI commands follow this pattern:
1. Accept workflow context (book-id, iteration, workflow-run-id)
2. Load necessary artifacts from ArtifactRegistry
3. Execute phase logic
4. Update WorkflowRepository status
5. Register output artifacts
6. Output formatted CLI guidance for next phase

---

## Dependencies Map

```
T1.1 (Verify Workflow)
  ↓
T1.2 (Verify Review) → T1.3 (Verify Artifacts)
  ↓
T2.1 (PM Prompt) → T2.2 (PM Invoker) → T2.3 (Planning CLI)
  ↓
T3.1 (Writer Prompt) → T3.2 (Writer Invoker)
T3.3 (Editor Prompt) → T3.4 (Editor Invoker)    → T3.7 (Content Modify CLI)
T3.5 (Domain Prompt) → T3.6 (Domain Invoker)
  ↓
T4.1 (Chapter Review) → T4.2 (Metrics Eval) → T4.3 (Validate CLI)
  ↓
T5.1 (Human Approve)
  ↓
T6.1 (Print HTML) ──┐
T6.2 (PDF Gen) ─────┤
T6.3 (Web HTML) ────┼─→ T6.5 (Finalize CLI)
T6.4 (Release Notes)─┘
```

---

## Minimal Implementation Principles

1. **Prompt-driven agents** - Complex logic lives in prompts, not code
2. **Reuse existing infrastructure** - WorkflowRepository, ArtifactRegistry, ReviewOrchestrator already exist
3. **CLI commands are orchestrators** - Each W1 CLI command is thin wrapper around invokers
4. **Agent invokers are thin** - Accept input, call Claude, parse output, return result
5. **No new database schema** - Use existing tables (workflow_runs, workflow_artifacts, etc.)
6. **State machine enforcement** - All status transitions validated by WorkflowStateMachine
7. **Artifact-driven** - All inter-phase communication via ArtifactRegistry

---

## Success Criteria

Each task is complete when:
1. Code files are created/modified
2. CLI command works end-to-end (if applicable)
3. Output artifacts are registered properly
4. Workflow state transitions are valid
5. Error handling is in place for common failures
6. Next-step guidance is clear and actionable

---

## Notes for Implementation

- **Agent prompts** should be deterministic and parseable (return structured JSON when needed)
- **CLI commands** should use CLIFormatter for consistent output
- **Workflow runs** should track current_agent field for transparency
- **Rejections** should be logged via WorkflowEventEmitter
- **Artifacts** should include metadata (e.g., iteration number, metrics)
- **Human gate** should show diffs/summaries, not raw files

---

## Estimated Task Counts by Phase

| Phase | Task Count | Primary Deliverables |
|-------|-----------|----------------------|
| 1. Foundation | 3 | Verification script |
| 2. Planning | 3 | PM agent + CLI |
| 3. Content Mod | 5 | Writer/Editor/Domain agents + CLI |
| 4. Validation | 3 | Chapter review + metrics eval + CLI |
| 5. Human Gate | 1 | Human approval CLI |
| 6. Finalization | 5 | HTML/PDF/notes orchestrators + CLI |
| **TOTAL** | **20** | **6 main CLIs** |

---

## Notes on Reuse

The following components already exist and should NOT be reimplemented:
- `WorkflowRepository` - use as-is for state management
- `WorkflowStateMachine` - use as-is for state validation
- `ArtifactRegistry` - use as-is for artifact storage
- `ArtifactQuery` - use as-is for artifact lookup
- `ReviewOrchestrator` - use as-is for running reviews
- `CampaignClient` - use as-is for review campaign access
- `HtmlGenPrint` - use as-is for print HTML generation
- `HtmlGenWeb` - use as-is for web HTML generation
- `PDFPipeline` - use as-is for PDF generation
- `CLIFormatter` - use as-is for output formatting

New code should be thin wrappers around these components.

