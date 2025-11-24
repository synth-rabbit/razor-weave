---
status: ENGINEERING_PLAN_SUMMARY
created: 2025-11-23
title: "W1 Engineering Tasks - Compact Summary"
author: VP Engineering
---

# W1 Engineering Tasks - Structured Summary

Minimal implementation plan for VP Product's 6-phase W1 workflow.

---

## PHASE 1: FOUNDATION VERIFICATION (3 tasks)

### T1.1 - Verify Workflow Infrastructure
- **Type:** Verification
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-verify-foundation.ts`
  - REF: `src/tooling/workflows/repository.ts`
- **Output:** CLI command that verifies WorkflowRepository + database connectivity
- **Dependencies:** None

### T1.2 - Verify Review System Infrastructure
- **Type:** Verification
- **Files:**
  - MODIFY: `src/tooling/cli-commands/w1-verify-foundation.ts` (extend)
  - REF: `src/tooling/reviews/orchestrator.ts`
- **Output:** Verification includes ReviewOrchestrator + CampaignClient checks
- **Dependencies:** T1.1

### T1.3 - Verify Artifact Registry
- **Type:** Verification
- **Files:**
  - MODIFY: `src/tooling/cli-commands/w1-verify-foundation.ts` (extend)
  - REF: `src/tooling/workflows/artifact-registry.ts`
- **Output:** Verification includes ArtifactRegistry checks
- **Dependencies:** T1.1, T1.2

---

## PHASE 2: PLANNING PIPELINE (3 tasks)

### T2.1 - Create PM Agent Prompt
- **Type:** Prompt
- **Files:**
  - CREATE: `src/tooling/agents/prompts/pm-analysis-to-plan.md`
- **Input:** Review analysis JSON
- **Output:** Improvement plan (chapters, improvements, metrics)
- **Dependencies:** T1.2

### T2.2 - Create PM Agent Invoker
- **Type:** Code (Invoker)
- **Files:**
  - CREATE: `src/tooling/agents/invoker-pm.ts`
  - REF: `src/tooling/agents/invoker.ts`
- **Responsibility:** Call Claude with PM prompt, parse output
- **Return:** Structured improvement plan
- **Dependencies:** T2.1

### T2.3 - Create Planning CLI Command
- **Type:** Code (CLI)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-planning.ts`
- **Interface:** `pnpm w1:planning --book <id> --analysis <path>`
- **Responsibility:** Orchestrate PM agent, create workflow run, register artifact
- **Dependencies:** T2.2, T1.1

---

## PHASE 3: CONTENT MODIFICATION (5 tasks)

### T3.1 - Create Writer Agent Prompt
- **Type:** Prompt
- **Files:**
  - CREATE: `src/tooling/agents/prompts/writer-implement-plan.md`
- **Input:** Improvement plan + markdown chapters
- **Output:** Updated markdown + changelog
- **Dependencies:** T2.1

### T3.2 - Create Writer Agent Invoker
- **Type:** Code (Invoker)
- **Files:**
  - CREATE: `src/tooling/agents/invoker-writer.ts`
- **Responsibility:** Call Claude with plan + chapters
- **Return:** Updated chapters + changelog JSON
- **Dependencies:** T3.1

### T3.3 - Create Editor Agent Prompt
- **Type:** Prompt
- **Files:**
  - CREATE: `src/tooling/agents/prompts/editor-review.md`
- **Input:** Updated chapters + style guide
- **Output:** Pass/fail + feedback
- **Dependencies:** T3.1

### T3.4 - Create Editor Agent Invoker
- **Type:** Code (Invoker)
- **Files:**
  - CREATE: `src/tooling/agents/invoker-editor.ts`
- **Responsibility:** Call Claude with editor prompt
- **Return:** { approved: boolean, feedback: string[] }
- **Dependencies:** T3.3

### T3.5 - Create Domain Expert Agent Prompt
- **Type:** Prompt
- **Files:**
  - CREATE: `src/tooling/agents/prompts/domain-expert-review.md`
- **Input:** Updated chapters + rules + personas
- **Output:** Pass/fail + mechanical issues
- **Dependencies:** T3.1

### T3.6 - Create Domain Expert Agent Invoker
- **Type:** Code (Invoker)
- **Files:**
  - CREATE: `src/tooling/agents/invoker-domain-expert.ts`
- **Responsibility:** Call Claude with domain expert prompt
- **Return:** { approved: boolean, issues: string[] }
- **Dependencies:** T3.5

### T3.7 - Create Content Modification CLI Command
- **Type:** Code (CLI)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-content-modify.ts`
- **Interface:** `pnpm w1:content-modify --book <id> --plan <path> --iteration <n>`
- **Workflow:** Writer → Editor (loop if reject) → Domain Expert (loop if reject)
- **Output:** Updated chapters + approval status
- **Dependencies:** T3.2, T3.4, T3.6, T1.1

---

## PHASE 4: VALIDATION PIPELINE (3 tasks)

### T4.1 - Create Chapter Review Integration
- **Type:** Code (Integration)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-validate-chapters.ts`
  - REF: `src/tooling/reviews/orchestrator.ts` (ReviewOrchestrator)
- **Interface:** `pnpm w1:validate-chapters --book <id> --chapters <list>`
- **Responsibility:** Run chapter-only review campaign, compare to baseline
- **Output:** Review metrics + comparison
- **Dependencies:** T3.7, T1.2

### T4.2 - Create Metrics Evaluator
- **Type:** Prompt + Invoker
- **Files:**
  - CREATE: `src/tooling/agents/prompts/pm-metrics-eval.md`
  - CREATE: `src/tooling/agents/invoker-pm-metrics.ts`
- **Input:** Baseline metrics + new metrics
- **Output:** { approved: boolean, reasoning: string }
- **Responsibility:** Evaluate if metrics improved or stable
- **Dependencies:** T4.1

### T4.3 - Create Validation CLI Command
- **Type:** Code (CLI)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-validate.ts`
- **Interface:** `pnpm w1:validate --book <id> --iteration <n> --chapters <list>`
- **Workflow:** Run chapter reviews → Evaluate metrics → Approve/Reject
- **Output:** Validation result + next step
- **Dependencies:** T4.1, T4.2

---

## PHASE 5: HUMAN GATE (1 task)

### T5.1 - Create Human Approval CLI Command
- **Type:** Code (CLI)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-human-approve.ts`
- **Interface:** `pnpm w1:human-approve --book <id> --workflow <run-id>`
- **Display:** Plan + chapters + metrics + feedback
- **Interaction:** Prompt for approval (y/n), accept optional feedback
- **Output:** Workflow status update + next CLI command
- **Dependencies:** T4.3, T1.1, T1.3

---

## PHASE 6: FINALIZATION (5 tasks)

### T6.1 - Create Print HTML Promotion
- **Type:** Code (Integration)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-finalize-print-html.ts`
  - REF: `src/tooling/html-gen/print/promote.ts` (HtmlGenPrint)
- **Interface:** `pnpm w1:finalize-print-html --book <id>`
- **Responsibility:** Build + promote print HTML
- **Output:** Path to promoted HTML file
- **Dependencies:** T5.1

### T6.2 - Create PDF Generation
- **Type:** Code (Integration)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-finalize-pdf.ts`
  - REF: `src/tooling/pdf-gen/pipeline.ts` (PDFPipeline)
- **Interface:** `pnpm w1:finalize-pdf --book <id> --html <path>`
- **Responsibility:** Generate PDF from promoted HTML
- **Output:** Path to generated PDF file
- **Dependencies:** T6.1

### T6.3 - Create Web HTML Generation
- **Type:** Code (Integration)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-finalize-web-html.ts`
  - REF: `src/tooling/html-gen/web/promote.ts` (HtmlGenWeb)
- **Interface:** `pnpm w1:finalize-web-html --book <id>`
- **Responsibility:** Build + promote web HTML
- **Output:** Path to promoted HTML file
- **Dependencies:** T5.1

### T6.4 - Create Release Notes Generation
- **Type:** Prompt + Invoker
- **Files:**
  - CREATE: `src/tooling/agents/prompts/release-notes-gen.md`
  - CREATE: `src/tooling/agents/invoker-release-notes.ts`
- **Input:** Plan + modifications + metrics
- **Output:** Release notes in Markdown
- **Responsibility:** Synthesize user-friendly release notes
- **Dependencies:** T6.1, T6.3

### T6.5 - Create Finalization Orchestrator
- **Type:** Code (CLI)
- **Files:**
  - CREATE: `src/tooling/cli-commands/w1-finalize.ts`
- **Interface:** `pnpm w1:finalize --book <id> --workflow <run-id>`
- **Workflow:** Print HTML → PDF → Web HTML → Release Notes → Complete
- **Output:** Completion summary + artifact paths
- **Dependencies:** T6.1, T6.2, T6.3, T6.4, T1.1

---

## File Summary

### Files to CREATE (20 total)

**CLI Commands (6):**
1. `src/tooling/cli-commands/w1-verify-foundation.ts`
2. `src/tooling/cli-commands/w1-planning.ts`
3. `src/tooling/cli-commands/w1-content-modify.ts`
4. `src/tooling/cli-commands/w1-validate-chapters.ts`
5. `src/tooling/cli-commands/w1-validate.ts`
6. `src/tooling/cli-commands/w1-human-approve.ts`
7. `src/tooling/cli-commands/w1-finalize-print-html.ts`
8. `src/tooling/cli-commands/w1-finalize-pdf.ts`
9. `src/tooling/cli-commands/w1-finalize-web-html.ts`
10. `src/tooling/cli-commands/w1-finalize.ts`

**Agent Invokers (7):**
11. `src/tooling/agents/invoker-pm.ts`
12. `src/tooling/agents/invoker-writer.ts`
13. `src/tooling/agents/invoker-editor.ts`
14. `src/tooling/agents/invoker-domain-expert.ts`
15. `src/tooling/agents/invoker-pm-metrics.ts`
16. `src/tooling/agents/invoker-release-notes.ts`

**Agent Prompts (6):**
17. `src/tooling/agents/prompts/pm-analysis-to-plan.md`
18. `src/tooling/agents/prompts/writer-implement-plan.md`
19. `src/tooling/agents/prompts/editor-review.md`
20. `src/tooling/agents/prompts/domain-expert-review.md`
21. `src/tooling/agents/prompts/pm-metrics-eval.md`
22. `src/tooling/agents/prompts/release-notes-gen.md`

### Files to REFERENCE (no changes)

- `src/tooling/workflows/repository.ts`
- `src/tooling/workflows/state-machine.ts`
- `src/tooling/workflows/artifact-registry.ts`
- `src/tooling/workflows/trigger-engine.ts`
- `src/tooling/reviews/orchestrator.ts`
- `src/tooling/reviews/campaign-client.ts`
- `src/tooling/html-gen/print/promote.ts`
- `src/tooling/html-gen/web/promote.ts`
- `src/tooling/pdf-gen/pipeline.ts`
- `src/tooling/cli/formatter.ts`
- `src/tooling/agents/invoker.ts`

---

## Task Counts by Type

| Type | Count |
|------|-------|
| Verification (CLI) | 1 |
| Planning Agent + CLI | 3 |
| Content Mod Agents + CLI | 5 |
| Validation Agents + CLI | 3 |
| Human Gate (CLI) | 1 |
| Finalization Agents + CLI | 5 |
| **Total** | **20** |

---

## Integration Points Summary

### Consume From Prework
- **WorkflowRepository** → T1.1, T2.3, T3.7, T4.3, T5.1, T6.5
- **WorkflowStateMachine** → T1.1, T2.3, T3.7, T4.3, T5.1, T6.5
- **ArtifactRegistry** → T1.3, T2.3, T3.7, T4.3, T5.1, T6.5
- **ReviewOrchestrator** → T1.2, T4.1
- **CampaignClient** → T1.2, T4.1

### Integrate With Existing Pipelines
- **HtmlGenPrint** → T6.1
- **HtmlGenWeb** → T6.3
- **PDFPipeline** → T6.2

### Reuse Utilities
- **CLIFormatter** → All CLI commands
- **SessionManager** → Potentially T2.3

---

## Implementation Strategy

1. **Start with Foundation (T1.1-T1.3)** - Verify all Prework infrastructure works
2. **Build Prompts & Invokers** - Create all agent prompts and invokers (T2.1-T2.2, T3.1-T3.6, T4.2, T6.4)
3. **Build CLI Commands** - Create orchestrator CLIs (T2.3, T3.7, T4.1, T4.3, T5.1, T6.1-T6.5)
4. **Test End-to-End** - Walk through full W1 workflow with test data

---

## Success Criteria

All 20 tasks complete when:
- [ ] All CLI commands execute without errors
- [ ] All agent prompts return parseable output
- [ ] All workflow runs transition through valid states
- [ ] All artifacts register correctly
- [ ] Full W1 workflow can execute end-to-end
- [ ] Human gate shows all necessary information
- [ ] Finalization produces all expected outputs (HTML, PDF, release notes)

