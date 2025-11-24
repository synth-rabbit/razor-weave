---
status: ENGINEERING_REFERENCE
created: 2025-11-23
title: "W1 Engineering Plan - Quick Index"
author: VP Engineering
---

# W1 Engineering Plan - Quick Reference Index

Complete VP Product 6-phase plan translated to 20 minimal engineering tasks.

---

## Documents Overview

| Document | Purpose | For Whom |
|----------|---------|----------|
| **w1-engineering-tasks.md** | Complete task breakdown with dependencies | Engineers implementing tasks |
| **w1-engineering-tasks-summary.md** | Compact structured task list | Project leads tracking progress |
| **w1-engineering-dataflow.md** | Visual data flow and execution patterns | Architects understanding flow |
| **w1-engineering-index.md** | This document - quick reference | Everyone (you are here) |

---

## Key Numbers

- **20 total engineering tasks**
  - 10 CLI commands (orchestrators)
  - 6 agent invokers
  - 6 agent prompts
  - 3 verifications
- **6 main CLI commands** (one per phase)
- **Reuse 11 existing components** (no reimplementation)
- **6 agent roles** (PM, Writer, Editor, Domain Expert, Release Notes, Metrics)

---

## Phase Summary

### Phase 1: Foundation Verification (3 tasks, 1 CLI)
**VP Product says:** Confirm Prework dependencies work
**Engineering:** Verify WorkflowRepository, ReviewOrchestrator, ArtifactRegistry
**CLI:** `pnpm w1:verify-foundation`

### Phase 2: Planning Pipeline (3 tasks, 1 CLI)
**VP Product says:** PM agent consumes analysis, produces plan
**Engineering:** PM agent prompt + invoker + CLI orchestrator
**CLI:** `pnpm w1:planning --book <id> --analysis <path>`
**Output:** Improvement plan artifact

### Phase 3: Content Modification Pipeline (5 tasks, 1 CLI)
**VP Product says:** Writer/Editor/Domain Expert agents modify content
**Engineering:** Writer, Editor, Domain Expert prompts + invokers + CLI loop
**CLI:** `pnpm w1:content-modify --book <id> --plan <path> --iteration <n>`
**Loop:** Writer → Editor (reject loop) → Domain Expert (reject loop)
**Output:** Approved chapters artifact

### Phase 4: Validation Pipeline (3 tasks, 1 CLI)
**VP Product says:** Chapter-level reviews on changed chapters
**Engineering:** Chapter review integration + metrics evaluator + CLI
**CLI:** `pnpm w1:validate --book <id> --iteration <n> --chapters <list>`
**Check:** Do metrics improve? If no, signal to restart from planning
**Output:** Validation approval artifact

### Phase 5: Human Gate (1 task, 1 CLI)
**VP Product says:** Human approves/rejects with feedback
**Engineering:** Human approval CLI with artifact display
**CLI:** `pnpm w1:human-approve --book <id> --workflow <run-id>`
**Decision:** Proceed to finalization OR restart from planning
**Output:** Human approval/rejection artifact

### Phase 6: Finalization (5 tasks, 1 CLI)
**VP Product says:** Promote HTML, PDF, web HTML, release notes
**Engineering:** Orchestrate print HTML, PDF, web HTML, release notes
**CLI:** `pnpm w1:finalize --book <id> --workflow <run-id>`
**Steps:** Print HTML → PDF → Web HTML → Release Notes → Complete
**Output:** All final artifacts

---

## File Creation Checklist

### CLI Commands (10 files in `src/tooling/cli-commands/`)
- [ ] w1-verify-foundation.ts (verification script)
- [ ] w1-planning.ts (orchestrate planning phase)
- [ ] w1-content-modify.ts (orchestrate writer/editor/domain loop)
- [ ] w1-validate-chapters.ts (run chapter reviews)
- [ ] w1-validate.ts (orchestrate validation phase)
- [ ] w1-human-approve.ts (human approval gate)
- [ ] w1-finalize-print-html.ts (integrate print HTML)
- [ ] w1-finalize-pdf.ts (integrate PDF generation)
- [ ] w1-finalize-web-html.ts (integrate web HTML)
- [ ] w1-finalize.ts (orchestrate finalization phase)

### Agent Invokers (6 files in `src/tooling/agents/`)
- [ ] invoker-pm.ts (PM analysis → plan)
- [ ] invoker-writer.ts (plan → updated chapters)
- [ ] invoker-editor.ts (chapters → style review)
- [ ] invoker-domain-expert.ts (chapters → rules review)
- [ ] invoker-pm-metrics.ts (baseline + new → metrics eval)
- [ ] invoker-release-notes.ts (plan + chapters + metrics → notes)

### Agent Prompts (6 files in `src/tooling/agents/prompts/`)
- [ ] pm-analysis-to-plan.md (analyze → improvement plan)
- [ ] writer-implement-plan.md (plan → updated content)
- [ ] editor-review.md (content → style feedback)
- [ ] domain-expert-review.md (content → rules feedback)
- [ ] pm-metrics-eval.md (metrics → improvement assessment)
- [ ] release-notes-gen.md (artifacts → release notes)

---

## Dependency Graph (Simplified)

```
Foundation Verification (T1)
    ↓
Planning (T2)
    ↓
Content Modification Loop (T3)
    ↓
Validation (T4)
    ↓ [if metrics OK]
    ↓ [if metrics fail → back to Planning]
    ↓
Human Gate (T5)
    ↓ [if approved]
    ↓ [if rejected → back to Planning]
    ↓
Finalization (T6)
    ↓
✓ Complete
```

---

## Integration Checklist

### Prework Infrastructure (Reuse - do NOT modify)
- [ ] WorkflowRepository - for workflow run state
- [ ] WorkflowStateMachine - for state validation
- [ ] ArtifactRegistry - for artifact storage/retrieval
- [ ] ReviewOrchestrator - for chapter reviews
- [ ] CampaignClient - for review campaigns

### Existing Pipelines (Reuse - do NOT reimplement)
- [ ] HtmlGenPrint - print HTML generation
- [ ] HtmlGenWeb - web HTML generation
- [ ] PDFPipeline - PDF generation
- [ ] CLIFormatter - CLI output formatting
- [ ] BookRepository - book data access

---

## Implementation Flow

### Week 1: Setup & Verification
1. Create w1-verify-foundation.ts
2. Verify all Prework components work
3. Test round-trip: workflow create → update → retrieve

### Week 2: Planning & Prompts
1. Write all 6 agent prompts
2. Create 6 agent invokers
3. Create w1-planning.ts CLI
4. Test PM agent end-to-end

### Week 3: Content Modification
1. Create writer, editor, domain expert invokers
2. Create w1-content-modify.ts CLI with rejection loop
3. Test full loop with test data
4. Verify artifact registration

### Week 4: Validation & Human Gate
1. Create chapter review integration
2. Create metrics evaluator prompt + invoker
3. Create w1-validate.ts and w1-human-approve.ts
4. Test validation loop

### Week 5: Finalization
1. Create finalization wrapper CLIs (HTML, PDF, web HTML, notes)
2. Create w1-finalize.ts orchestrator
3. Integrate with existing generators
4. Test full end-to-end W1 workflow

### Week 6: Testing & Documentation
1. End-to-end workflow test
2. Error handling verification
3. Feedback loop testing
4. Performance check

---

## Key Design Patterns

### 1. Thin Wrapper CLIs
Each phase CLI is a thin wrapper that:
- Loads workflow context from database
- Calls agent invoker or existing pipeline
- Registers outputs as artifacts
- Updates workflow status
- Outputs formatted next-step instructions

### 2. Agent Prompts Are Business Logic
Complex decision logic lives in prompts, not code:
- PM prompt defines "what is an improvement plan?"
- Editor prompt defines "what is good style?"
- Domain prompt defines "what is rules consistency?"
- Metrics prompt defines "what is improvement?"

### 3. Artifact-Driven Communication
- Phases communicate via ArtifactRegistry
- No direct file passing between phases
- All artifacts have metadata (iteration, version, etc.)
- Queries use artifact type filters

### 4. State Machine Enforced
- WorkflowStateMachine validates all transitions
- Invalid transitions throw InvalidTransitionError
- Database constraints enforce data integrity
- All updates via WorkflowRepository (never direct DB writes)

### 5. Rejection Tracking
- Rejections logged as artifacts with metadata
- Rejection reasons captured in feedback
- Clear path to retry or restart
- No silent failures

---

## Data Exchange Format

### Agent Prompts Output JSON (when structured)
```json
{
  "approved": boolean,
  "reasoning": "string",
  "feedback": ["item1", "item2"],
  "issues": ["issue1", "issue2"]
}
```

### Improvement Plan Format
```markdown
# Improvement Plan

## Chapters to Modify
- Chapter 1: [specific improvement]
- Chapter 2: [specific improvement]

## Success Metrics
- [metric 1]
- [metric 2]

## Priority
[ranking and rationale]
```

### Chapter Updates Format
```json
{
  "updated_chapters": [
    {
      "name": "chapter_1.md",
      "changes": [
        "Updated section X because [reason]",
        "Clarified section Y because [reason]"
      ]
    }
  ],
  "summary": "Modified 3 chapters focusing on clarity"
}
```

---

## CLI Command Quick Reference

### Verification
```bash
pnpm w1:verify-foundation
```

### Phase 2: Planning
```bash
pnpm w1:planning --book core --analysis data/reviews/analysis
```

### Phase 3: Content Modification
```bash
pnpm w1:content-modify --book core --plan art_... --iteration 1
```

### Phase 4: Validation
```bash
pnpm w1:validate --book core --iteration 1 --chapters chapter_1,chapter_2
```

### Phase 5: Human Approval
```bash
pnpm w1:human-approve --book core --workflow wfrun_...
```

### Phase 6: Finalization
```bash
pnpm w1:finalize --book core --workflow wfrun_...
```

---

## Testing Strategy

### Unit Tests
- Invoker logic (parsing, error handling)
- Prompt output parsing
- State transitions

### Integration Tests
- Full phase workflows
- Artifact registration/retrieval
- Status updates

### End-to-End Tests
- Complete W1 cycle from planning to finalization
- Rejection loops and retries
- Human gate approval/rejection

### Smoke Tests
- CLI commands execute
- Database operations succeed
- Output formatting works

---

## Success Criteria

All 20 tasks are complete when:

### Functionality
- [ ] All 10 CLI commands execute without errors
- [ ] All 6 agent invokers parse Claude output correctly
- [ ] All 6 prompts return expected output format
- [ ] WorkflowRepository state transitions work
- [ ] ArtifactRegistry stores/retrieves artifacts
- [ ] Rejection loops work correctly
- [ ] Human gate displays all needed info
- [ ] Finalization produces all outputs

### Quality
- [ ] Error handling in place for common failures
- [ ] Clear error messages for debugging
- [ ] Formatted output guides next steps
- [ ] No silent failures
- [ ] Database constraints enforced

### Integration
- [ ] Prework components used correctly
- [ ] Existing pipelines integrated properly
- [ ] No reimplementation of existing code
- [ ] All data flows through artifacts

### Testing
- [ ] Full W1 end-to-end test passes
- [ ] Rejection loop test passes
- [ ] Human gate test passes
- [ ] Finalization test passes

---

## Estimated Timeline

| Phase | Tasks | Duration | Dependency |
|-------|-------|----------|------------|
| Foundation | 3 | 2 days | None |
| Planning | 3 | 4 days | T1 |
| Content Modification | 5 | 6 days | T2 |
| Validation | 3 | 4 days | T3 |
| Human Gate | 1 | 2 days | T4 |
| Finalization | 5 | 4 days | T5 |
| Testing | - | 3 days | T6 |
| **TOTAL** | **20** | **~25 days** | - |

---

## Questions & Answers

### Q: Do I need to modify the database schema?
**A:** No. Prework already created all needed tables. Use WorkflowRepository and ArtifactRegistry.

### Q: Do I need to reimplement agents?
**A:** No. Create thin prompts and invoker wrappers. Complex logic lives in prompts.

### Q: How do I handle agent failures?
**A:** Catch exceptions, log via artifact, output error message. Update workflow status to "failed".

### Q: What if an agent rejects changes?
**A:** Log rejection as artifact with feedback. Current CLI should output retry instructions.

### Q: How do I test without Claude API?
**A:** Mock the agent invocation. For full integration, call Claude directly.

### Q: What about concurrent runs?
**A:** WorkflowRepository uses database row IDs. SQLite handles locking. Consider serial execution for safety.

### Q: How do I debug workflow state?
**A:** Query workflow_runs and workflow_artifacts tables. Check current_agent field and status.

---

## File Structure After Implementation

```
src/tooling/
├── cli-commands/
│   ├── w1-verify-foundation.ts          ✓ CREATE
│   ├── w1-planning.ts                   ✓ CREATE
│   ├── w1-content-modify.ts             ✓ CREATE
│   ├── w1-validate-chapters.ts          ✓ CREATE
│   ├── w1-validate.ts                   ✓ CREATE
│   ├── w1-human-approve.ts              ✓ CREATE
│   ├── w1-finalize-print-html.ts        ✓ CREATE
│   ├── w1-finalize-pdf.ts               ✓ CREATE
│   ├── w1-finalize-web-html.ts          ✓ CREATE
│   └── w1-finalize.ts                   ✓ CREATE
├── agents/
│   ├── invoker-pm.ts                    ✓ CREATE
│   ├── invoker-writer.ts                ✓ CREATE
│   ├── invoker-editor.ts                ✓ CREATE
│   ├── invoker-domain-expert.ts         ✓ CREATE
│   ├── invoker-pm-metrics.ts            ✓ CREATE
│   ├── invoker-release-notes.ts         ✓ CREATE
│   └── prompts/
│       ├── pm-analysis-to-plan.md       ✓ CREATE
│       ├── writer-implement-plan.md     ✓ CREATE
│       ├── editor-review.md             ✓ CREATE
│       ├── domain-expert-review.md      ✓ CREATE
│       ├── pm-metrics-eval.md           ✓ CREATE
│       └── release-notes-gen.md         ✓ CREATE
└── workflows/
    ├── repository.ts                    ✓ EXISTING (use as-is)
    ├── state-machine.ts                 ✓ EXISTING (use as-is)
    ├── artifact-registry.ts             ✓ EXISTING (use as-is)
    └── [other infrastructure]           ✓ EXISTING (use as-is)
```

---

## Start Here

1. **Read this document** (you are here)
2. **Read w1-engineering-tasks.md** - detailed task breakdown
3. **Read w1-engineering-dataflow.md** - understand data flow
4. **Reference w1-engineering-tasks-summary.md** - when implementing
5. **Start with T1.1** - verify foundation works
6. **Follow dependency graph** - don't skip tasks

---

## Contact Points

- **Infrastructure questions** → Review src/tooling/workflows/
- **Existing pipeline questions** → Review src/tooling/html-gen/, src/tooling/pdf-gen/
- **Database schema** → Review src/tooling/database/schema.ts
- **Agent patterns** → Review src/tooling/agents/
- **CLI patterns** → Review src/tooling/cli-commands/ (existing commands)

---

Last Updated: 2025-11-23
Next Review: After implementation sprint complete

