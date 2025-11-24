---
status: OPERATIONAL_PLAN
created: 2025-11-23
title: "W1 Editing Workflow - Execution Schedule"
author: VP Operations
---

# W1 Editing Workflow - Execution Schedule

Operational execution plan for the 6-phase W1 Editing Workflow with 20 engineering tasks across 6 execution batches.

---

## Executive Summary

**Total Engineering Effort:** 20 tasks across 6 phases
**Execution Strategy:** 6 batches with parallel-safe task grouping
**Critical Path:** ~40 hours sequential work, heavily parallelizable
**Risk Mitigation:** 3 high-severity, 4 medium-severity, 2 low-severity items
**Human Gates:** 2 mandatory approval points (after Phase 4 validation, after Phase 5 approval)

---

## EXECUTION BATCHES

### BATCH 1: Foundation Verification
**Status:** Sequential (foundational, must complete before proceeding)
**Target Duration:** 3-4 hours
**Human Gate:** No

#### Tasks (sequential order)
- **T1.1** - Verify Workflow Infrastructure
  - Create `/src/tooling/cli-commands/w1-verify-foundation.ts`
  - Verify WorkflowRepository, WorkflowStateMachine, schema initialization
  - Test workflow run creation/retrieval round-trip
  - Output: PASS/FAIL status to console

- **T1.2** - Verify Review System Infrastructure
  - Extend verification script to check ReviewOrchestrator, CampaignClient
  - Verify persona database is accessible
  - Test review campaign lookup
  - Output: PASS/FAIL status

- **T1.3** - Verify Artifact Registry
  - Extend verification script to test ArtifactRegistry.register()
  - Test artifact query by type
  - Verify trigger engine is operational
  - Output: PASS/FAIL status

#### Checkpoint Before Proceeding
- All three verification steps PASS
- Database tables exist and are accessible
- No schema errors reported
- All infrastructure classes instantiate without error
- CLI command executes cleanly with no warnings

#### Outputs
- Executable verification CLI: `pnpm w1:verify-foundation`
- Verification report documenting all checks passed
- Baseline performance metrics (optional)

---

### BATCH 2: Planning Pipeline
**Status:** Parallel (T2.1 and T2.2 can work in parallel; T2.3 depends on both)
**Target Duration:** 6-8 hours
**Dependency:** Batch 1 complete
**Human Gate:** No

#### Tasks (parallel groups)
- **T2.1** (parallel) - Create PM Agent Prompt
  - Create `/src/tooling/agents/prompts/pm-analysis-to-plan.md`
  - Structured input: Review analysis JSON
  - Structured output: Improvement plan with chapters, improvements, metrics, priority
  - Include context injection: book structure, release notes, personas

- **T2.2** (parallel) - Create PM Agent Invoker
  - Create `/src/tooling/agents/invoker-pm.ts`
  - Reference pattern: VPInvoker from existing boardroom-vp-product.ts
  - Accept: analysis file path, book context
  - Return: structured improvement plan JSON

- **T2.3** (sequential after T2.1 & T2.2) - Create Planning CLI Command
  - Create `/src/tooling/cli-commands/w1-planning.ts`
  - CLI: `pnpm w1:planning --book <id> --analysis <path> [--output <dir>]`
  - Create workflow run (type: w1_editing, status: pending)
  - Invoke PM agent, store plan as artifact
  - Output: next CLI step

#### Checkpoint Before Proceeding
- T2.3 CLI executes end-to-end with test data
- Improvement plan artifact is registered and queryable
- Output contains valid next-step guidance
- No errors in prompt parsing or artifact storage
- Plan JSON validates against expected schema

#### Outputs
- PM agent prompt template
- PM agent invoker implementation
- W1 planning CLI command
- Sample improvement plan artifact

---

### BATCH 3: Content Modification Pipeline
**Status:** Parallel (all 5 tasks can be developed in parallel; CLI depends on invokers)
**Target Duration:** 10-12 hours
**Dependency:** Batch 2 complete (T2.1 prompt structure finalized)
**Human Gate:** No (but tracks rejection counts)

#### Tasks (parallel groups)
- **T3.1** (parallel) - Create Writer Agent Prompt
  - Create `/src/tooling/agents/prompts/writer-implement-plan.md`
  - Input: improvement plan + existing markdown chapters
  - Output: updated markdown + JSON changelog (chapters modified, what changed, why)
  - Constraints: preserve structure, update content only

- **T3.2** (parallel) - Create Writer Agent Invoker
  - Create `/src/tooling/agents/invoker-writer.ts`
  - Accept: improvement plan path, book context
  - Read: relevant chapters from markdown
  - Parse: updated chapters + changelog JSON
  - Return: structured result with file paths and change summary

- **T3.3** (parallel) - Create Editor Agent Prompt
  - Create `/src/tooling/agents/prompts/editor-review.md`
  - Input: updated chapters + style guide
  - Output: JSON with { approved: boolean, feedback: string[] }
  - Check: grammar, tone, consistency, style compliance

- **T3.4** (parallel) - Create Editor Agent Invoker
  - Create `/src/tooling/agents/invoker-editor.ts`
  - Accept: writer output path, style guide path
  - Parse: approval/rejection result
  - Return: JSON { approved: boolean, feedback: string[] }

- **T3.5** (parallel) - Create Domain Expert Agent Prompt
  - Create `/src/tooling/agents/prompts/domain-expert-review.md`
  - Input: updated chapters + rules document + persona concerns
  - Output: JSON with { approved: boolean, issues: string[] }
  - Check: rules consistency, no contradictions, mechanical coherence

- **T3.6** (parallel) - Create Domain Expert Agent Invoker
  - Create `/src/tooling/agents/invoker-domain-expert.ts`
  - Accept: writer output path, rules document, persona concerns
  - Parse: approval/rejection result
  - Return: JSON { approved: boolean, issues: string[] }

- **T3.7** (sequential after T3.2, T3.4, T3.6) - Create Content Modification CLI
  - Create `/src/tooling/cli-commands/w1-content-modify.ts`
  - CLI: `pnpm w1:content-modify --book <id> --plan <path> --iteration <number> [--output <dir>]`
  - Workflow:
    1. Invoke Writer agent
    2. Invoke Editor agent (if rejects: log and exit for iteration)
    3. Invoke Domain Expert agent (if rejects: log and exit for iteration)
    4. Register artifacts, output completion

#### Checkpoint Before Proceeding
- T3.7 CLI executes end-to-end with sample plan
- Writer output artifact is valid markdown + changelog
- Editor approval/rejection parsed correctly
- Domain Expert approval/rejection parsed correctly
- Rejection feedback is logged and actionable
- Both agents can reject/approve independently
- Rejection count tracking works

#### Outputs
- 6 agent prompts (writer, editor domain expert)
- 3 agent invokers (writer, editor, domain expert)
- Content modification CLI orchestrator
- Sample chapter modifications with rejection tracking

---

### BATCH 4: Validation Pipeline
**Status:** Sequential (T4.1 → T4.2 → T4.3)
**Target Duration:** 8-10 hours
**Dependency:** Batch 3 complete
**Human Gate:** No (gating happens after this phase)

#### Tasks (sequential order)
- **T4.1** - Create Chapter Review Integration
  - Create `/src/tooling/cli-commands/w1-validate-chapters.ts`
  - CLI: `pnpm w1:validate-chapters --book <id> --chapters <list> --output <dir>`
  - Reuse ReviewOrchestrator, filter to modified chapters only
  - Run review campaign on those chapters
  - Compare metrics to baseline
  - Output: comparison metrics as artifact

- **T4.2** - Create Metrics Evaluator
  - Create `/src/tooling/agents/prompts/pm-metrics-eval.md`
  - Create `/src/tooling/agents/invoker-pm-metrics.ts`
  - Input: baseline metrics + new chapter review metrics
  - Output: JSON with { approved: boolean, reasoning: string }
  - Logic: check for improvement OR no significant degradation
  - Allow acceptable variance (don't require perfection)

- **T4.3** - Create Validation CLI Command
  - Create `/src/tooling/cli-commands/w1-validate.ts`
  - CLI: `pnpm w1:validate --book <id> --iteration <number> --chapters <list> [--baseline <file>]`
  - Workflow:
    1. Run chapter reviews (uses T4.1)
    2. Compare metrics to baseline (uses T4.2)
    3. If rejected: output feedback, update status to "validation_failed"
    4. If approved: register artifact, update status to "validation_passed"

#### Checkpoint Before Proceeding
- T4.3 CLI executes end-to-end with sample chapters
- Chapter review metrics are captured and comparable
- Metrics evaluator correctly determines pass/fail
- Baseline comparison is accurate
- Rejection provides actionable feedback
- Artifact is registered with metadata (iteration, metrics)

#### Outputs
- Chapter review integration CLI
- Metrics evaluator prompt and invoker
- Validation orchestrator CLI
- Sample validation report with metrics comparison

---

### BATCH 5: Human Approval Gate
**Status:** Synchronous (requires user input)
**Target Duration:** 1-2 hours (implementation) + variable (user decision time)
**Dependency:** Batch 4 complete and validation passed
**Human Gate:** YES - Critical approval point

#### Tasks (sequential order)
- **T5.1** - Create Human Approval CLI Command
  - Create `/src/tooling/cli-commands/w1-human-approve.ts`
  - CLI: `pnpm w1:human-approve --book <id> --workflow <run-id>`
  - Display:
    - Improvement plan (from phase 2)
    - Chapter modifications summary (from phase 3)
    - Review metrics delta (from phase 4)
    - Editor/domain expert feedback (from phase 3)
  - Prompt user: "Approve changes and proceed to finalization? (y/n)"
  - If YES: update workflow status to "approved", output finalization CLI
  - If NO: capture rejection reason, update status to "rejected", output next-step guidance

#### Checkpoint Before Proceeding
- T5.1 displays all required information clearly
- User can easily review changes and make informed decision
- Approval/rejection is captured in workflow
- CLI provides clear next steps regardless of decision
- No auto-proceeding; explicit user confirmation required

#### Outputs
- Human approval CLI command
- Artifact summary/diff display logic
- Workflow status updated to "approved" or "rejected"
- Audit trail of user decision

#### HUMAN GATE CRITERIA
**Approval Required If:**
- Validation phase metrics improved OR held steady with clear improvements
- Both editor and domain expert approved content
- Release notes are reasonable and accurate
- No unresolved design concerns from previous cycles

**May Reject If:**
- Validation metrics degraded significantly
- User has concerns about completeness
- Release notes don't capture the actual changes
- Previous iteration feedback was not adequately addressed

---

### BATCH 6: Finalization
**Status:** Parallel (T6.1, T6.2, T6.3 can run in parallel; T6.5 orchestrates)
**Target Duration:** 5-7 hours
**Dependency:** Batch 5 complete with approval
**Human Gate:** No (final quality check)

#### Tasks (parallel groups)
- **T6.1** (parallel) - Create Print HTML Promotion
  - Create `/src/tooling/cli-commands/w1-finalize-print-html.ts`
  - CLI: `pnpm w1:finalize-print-html --book <id>`
  - Call existing HtmlGenPrint pipeline
  - Promote to active version
  - Register promoted HTML as artifact
  - Output: path to promoted file

- **T6.2** (parallel) - Create PDF Generation
  - Create `/src/tooling/cli-commands/w1-finalize-pdf.ts`
  - CLI: `pnpm w1:finalize-pdf --book <id> --html <path>`
  - Call existing PDFPipeline with promoted HTML
  - Register PDF as artifact
  - Output: path to generated PDF

- **T6.3** (parallel) - Create Web HTML Generation
  - Create `/src/tooling/cli-commands/w1-finalize-web-html.ts`
  - CLI: `pnpm w1:finalize-web-html --book <id>`
  - Call existing HtmlGenWeb pipeline
  - Promote to active version
  - Register promoted HTML as artifact
  - Output: path to promoted file

- **T6.4** (parallel) - Create Release Notes Generation
  - Create `/src/tooling/agents/prompts/release-notes-gen.md`
  - Create `/src/tooling/agents/invoker-release-notes.ts`
  - Input: improvement plan + chapter mods + metrics improvement
  - Output: release notes in Markdown format
  - Content: summary of changes, highlights, metrics, known issues
  - Keep tone user-friendly

- **T6.5** (sequential after T6.1, T6.2, T6.3, T6.4) - Create Finalization Orchestrator
  - Create `/src/tooling/cli-commands/w1-finalize.ts`
  - CLI: `pnpm w1:finalize --book <id> --workflow <run-id>`
  - Workflow (sequential):
    1. Promote print HTML (T6.1)
    2. Generate PDF (T6.2)
    3. Generate web HTML (T6.3)
    4. Generate release notes (T6.4)
    5. Update workflow status to "completed"
    6. Register all artifacts
    7. Output completion summary

#### Checkpoint Before Proceeding
- All four parallel components (T6.1-T6.4) generate output successfully
- HTML files are valid and accessible
- PDF generates without corruption or warnings
- Release notes are properly formatted and readable
- All artifacts are registered with correct metadata
- Workflow status transitions to "completed"
- Final summary is clear and actionable

#### Outputs
- Print HTML promotion CLI
- PDF generation CLI
- Web HTML generation CLI
- Release notes generation prompt and invoker
- Finalization orchestrator CLI
- Completion summary with all artifact locations

---

## OPERATIONAL RISKS

### HIGH SEVERITY

#### Risk 1: Review Token Budget Exhaustion
**Description:**
Reviews cost 15K-50K tokens per cycle. If validation review costs exceed budget, workflow stalls.

**Mitigation:**
- Use existing analysis from prework (reduce new review tokens to ~20K)
- Implement token budget check in T4.1 before running reviews
- Create token estimation in T4.3 validation CLI
- Option to skip new reviews if baseline analysis is recent (<24 hours old)
- Budget cap: 40K tokens per validation cycle

**Severity:** HIGH
**Detection Point:** T4.1 execution (before token spend)
**Responsible:** VP Engineering + Finance (token allocation)

---

#### Risk 2: Content Modification Loop Divergence
**Description:**
Writer/Editor/Domain Expert feedback loops may not converge if agents provide conflicting corrections. After 3-4 iterations, content may degrade instead of improve.

**Mitigation:**
- Implement iteration cap in T3.7: max 3 rejection rounds
- After 3 rejections: escalate to human review with detailed feedback
- Track rejection reason categorization (style vs. mechanics vs. completeness)
- If both agents reject same content repeatedly, flag as "unresolvable" and hold at human gate (T5.1)
- Define clear exit criteria for rejections

**Severity:** HIGH
**Detection Point:** T3.7 execution (rejection tracking)
**Responsible:** VP Operations + Lead Engineer

---

#### Risk 3: Metrics Regression After Validation
**Description:**
Validation phase (T4.3) approves, human approves (T5.1), but PDF/HTML generation (T6) introduces new issues or the changes don't actually address the original problems.

**Mitigation:**
- Store baseline and new metrics in artifact with full provenance
- In T5.1, display actual metric deltas (not just approval/rejection)
- Add "metrics verification" optional step in T6.5: re-run quick validation on final output
- Keep rollback procedure documented (how to revert if T6 artifacts are corrupted)
- Require explicit user acknowledgment of metrics at T5.1 before proceeding

**Severity:** HIGH
**Detection Point:** T5.1 (human review) and T6.5 (finalization)
**Responsible:** VP Operations + PM Agent

---

### MEDIUM SEVERITY

#### Risk 4: Agent Prompt Instability
**Description:**
Agent prompts (T2.1, T3.1, T3.3, T3.5, T4.2, T6.4) may produce unparseable output if Claude's behavior changes or if context is misaligned.

**Mitigation:**
- Define strict output schema in each prompt (JSON with specific fields)
- Implement parsing validation in each invoker (T2.2, T3.2, T3.4, T3.6, T4.2, T6.4)
- Log raw agent output if parsing fails
- Add retry logic: if parse fails, provide error feedback and re-invoke agent with corrected prompt
- Version all prompts in git with clear "breaking change" notes

**Severity:** MEDIUM
**Detection Point:** Invoker execution (parsing stage)
**Responsible:** Lead Engineer + Agent Prompt Owner

---

#### Risk 5: Artifact Storage Capacity
**Description:**
Each W1 cycle produces ~10-20 artifacts (plans, chapters, reviews, HTML, PDF, notes). Multiple cycles will accumulate data in SQLite.

**Mitigation:**
- Implement artifact lifecycle policy: auto-archive old artifacts after 30 days
- Monitor database size in T1.1 verification (add size check to checkpoint)
- Add cleanup CLI command: `pnpm w1:cleanup-artifacts --before <date>`
- Use artifact metadata (created_at, book_id) for retention queries
- Set max artifacts per workflow run: 50

**Severity:** MEDIUM
**Detection Point:** T1.1 verification + periodic health checks
**Responsible:** DevOps/Infrastructure

---

#### Risk 6: Human Gate Abandonment
**Description:**
T5.1 human approval gate may be skipped or ignored, causing unapproved changes to proceed to finalization.

**Mitigation:**
- Make T5.1 CLI mandatory with explicit user interaction (not silent)
- Log user identity and timestamp of approval decision
- Require 2FA or explicit code input to proceed from T5.1
- Add pre-finalization check in T6.5: verify workflow status is "approved" before proceeding
- Email/notification to stakeholders when pending approval for >4 hours

**Severity:** MEDIUM
**Detection Point:** T5.1 execution + T6.5 verification
**Responsible:** VP Operations

---

#### Risk 7: Batch Interdependency Breakdown
**Description:**
If Batch 1 verification passes but infrastructure is actually unstable, Batches 2-6 will fail later, wasting time.

**Mitigation:**
- Extend Batch 1 verification with smoke tests: create test workflow, create artifact, query artifact
- Add "full round-trip test" in Batch 1: run simplified version of Batch 2 (planning with dummy data)
- Monitor for errors in downstream batches and trace back to root cause
- Keep Batch 1 checkpoint strict: no warnings, all checks green

**Severity:** MEDIUM
**Detection Point:** Batch 1 checkpoint + Batch 2 execution
**Responsible:** QA + Lead Engineer

---

### LOW SEVERITY

#### Risk 8: CLI Documentation Drift
**Description:**
CLI commands (T2.3, T3.7, T4.3, T5.1, T6.x) change signature or behavior, but documentation isn't updated.

**Mitigation:**
- Add `--help` output to each CLI command with full parameter descriptions
- Generate CLI reference doc from `--help` output
- Version CLI signatures in git commits
- Add integration tests for each CLI command signature

**Severity:** LOW
**Detection Point:** CI/CD testing
**Responsible:** Documentation + QA

---

#### Risk 9: Agent Invoker Code Duplication
**Description:**
Multiple agent invokers (T2.2, T3.2, T3.4, T3.6, T4.2, T6.4) may implement similar patterns, leading to maintenance burden.

**Mitigation:**
- Create abstract base class or factory for agent invokers
- Define common patterns: load context, call Claude, parse output, return result
- Reuse parsing utility functions across invokers
- Document invoker pattern in contributing guide

**Severity:** LOW
**Detection Point:** Code review
**Responsible:** Lead Engineer

---

## EXECUTION TIMELINE

### Week 1 (Days 1-5)
- **Day 1-2:** Batch 1 (Foundation Verification) - 3-4 hours
- **Day 2-3:** Batch 2 (Planning Pipeline) - 6-8 hours
- **Day 3-4:** Batch 3 begins (Content Modification Pipeline - parallel development)

### Week 2 (Days 6-10)
- **Day 5-6:** Batch 3 continues (parallel invokers and prompts)
- **Day 7:** Batch 3 complete (T3.7 CLI) - 10-12 hours total
- **Day 7-8:** Batch 4 (Validation Pipeline) - 8-10 hours

### Week 3 (Days 11-15)
- **Day 9-10:** Batch 5 (Human Approval Gate) - 1-2 hours
- **Day 10-11:** Batch 6 (Finalization) - parallel development
- **Day 12-13:** Batch 6 complete (T6.5 orchestrator) - 5-7 hours total

### Estimated Total: 40-45 hours of sequential work, 2-3 weeks of calendar time with parallelization

---

## CHECKPOINTS & GATES

### Pre-Batch Verification
Each batch must have a passing checkpoint before proceeding to the next batch.

| Batch | Checkpoint | Approval Required | Decision Criteria |
|-------|-----------|------------------|------------------|
| 1 | All 3 verification steps PASS | VP Engineering | No errors, all infrastructure accessible |
| 2 | T2.3 CLI works end-to-end | VP Engineering | Plan artifact valid and registered |
| 3 | T3.7 CLI handles approval/rejection | VP Engineering | Writer, editor, domain expert all functional |
| 4 | T4.3 produces valid metrics comparison | VP Engineering | Baseline vs. new metrics measurable |
| 5 | T5.1 displays all required info, requires explicit approval | VP Operations | User can make informed decision |
| 6 | All artifacts registered, workflow status "completed" | VP Engineering | No errors in any finalization step |

### Human Gates (Gating Points)
1. **After Batch 4 (Validation):** Human reviews validation metrics → approves or rejects
2. **After Batch 5 (Human Approval):** Human decides final approval before finalization

---

## SUCCESS CRITERIA

### Per Batch
- All tasks in batch complete
- All checkpoints pass
- No critical errors in logs
- All CLI commands executable
- All artifacts properly registered

### Overall
- All 20 tasks complete
- All 6 batches executed sequentially with proper dependencies
- Both human gates function and require explicit user input
- Complete end-to-end W1 workflow executable from CLI
- Documentation updated for all new CLI commands
- No unmitigated HIGH-severity risks remaining

---

## ROLLBACK PROCEDURE

If workflow fails at any checkpoint:

1. **Identify failure point** - which batch/checkpoint failed
2. **Assess scope** - is it isolated or affecting downstream batches
3. **Determine fix** - code fix, prompt adjustment, data cleanup
4. **Rollback options:**
   - If Batch 1-2 fail: restart from that batch
   - If Batch 3-4 fail: may need to revert content changes (keep in git)
   - If Batch 5 fails: loop back to Batch 3 (content modification)
   - If Batch 6 fails: revert finalized artifacts, assess root cause

5. **Document** - log failure reason, fix applied, decision made

---

## NEXT STEPS (POST-EXECUTION)

Once W1 execution schedule is complete:

1. **Integrate with W2** (PDF Workflow) - review how W1 artifacts feed W2
2. **Load test** - run W1 with full content (not just samples)
3. **Document user guide** - how operators run W1 end-to-end
4. **Setup monitoring** - track W1 workflow runs, success rates, token spend
5. **Plan W4 feedback loop** - design how W4 playtest feedback feeds back into W1

---

## APPENDIX: TASK REFERENCE

### By Phase
- **Phase 1:** T1.1, T1.2, T1.3
- **Phase 2:** T2.1, T2.2, T2.3
- **Phase 3:** T3.1, T3.2, T3.3, T3.4, T3.5, T3.6, T3.7
- **Phase 4:** T4.1, T4.2, T4.3
- **Phase 5:** T5.1
- **Phase 6:** T6.1, T6.2, T6.3, T6.4, T6.5

### By Type
- **Prompts:** T2.1, T3.1, T3.3, T3.5, T4.2, T6.4
- **Invokers:** T2.2, T3.2, T3.4, T3.6, T4.2, T6.4
- **CLI Commands:** T2.3, T3.7, T4.1, T4.3, T5.1, T6.1, T6.2, T6.3, T6.5
- **Verification:** T1.1, T1.2, T1.3

### By Criticality
- **Critical Path:** T1.1 → T2.3 → T3.7 → T4.3 → T5.1 → T6.5
- **Parallelizable:** T2.1/T2.2, T3.1-6, T6.1-4
- **Gating:** T5.1 (human approval), T4.3 (validation)

---

## Questions for Leadership

1. **Token Budget:** Is 40K tokens/cycle acceptable for validation reviews, or do we need to reduce?
2. **Rejection Ceiling:** Is 3 iteration limit for content modification appropriate, or should it be higher/lower?
3. **Approval Authority:** Who is the final human approver for T5.1? Single person or panel?
4. **Artifact Retention:** How long should old W1 cycle artifacts be retained before archive/deletion?
5. **Feedback Loop:** After W1 completes, how soon should W2 (PDF) start, and should they overlap?

---

## End of Document
