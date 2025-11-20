# Review System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an agentic review system that analyzes book/chapter content using multi-dimensional persona reviews, generates structured analysis, and stores queryable results for the Iterative Editing workflow.

**Architecture:** Campaign-based model with three agent roles (Orchestrator, Reviewer, Analyzer). Orchestrator launches parallel reviewer agents via Claude Code Task tool, verifies outputs, then triggers sequential analysis. All data stored in SQLite with markdown outputs for human review.

**Tech Stack:**
- TypeScript + better-sqlite3 for database
- Vitest for testing
- Claude Code Task tool for parallel agent execution
- File system for markdown outputs

---

## Phase Overview

### Phase 1: Database Foundation
**Goal:** Set up database schema, campaign client, and content snapshotting.

**Deliverables:**
- Three new database tables (review_campaigns, persona_reviews, campaign_analyses)
- CampaignClient for CRUD operations
- Content snapshot utilities with hash validation
- Full test coverage

**Estimated:** 25-30 tasks (~2-3 hours)

**File:** [review-system-P1.md](./review-system-P1.md)

---

### Phase 2: Review Workflow
**Goal:** Build reviewer agent prompts, orchestrator, and validation.

**Deliverables:**
- Reviewer agent prompt generator
- Orchestrator for parallel review execution
- Output validators (JSON schema, file existence)
- Integration tests

**Estimated:** 30-35 tasks (~3-4 hours)

**File:** [review-system-P2.md](./review-system-P2.md)

---

### Phase 3: Analysis & CLI
**Goal:** Implement analysis agent, CLI interface, and end-to-end workflow.

**Deliverables:**
- Analyzer agent prompt generator
- Cross-persona analysis logic
- CLI commands (review, list, view, retry)
- End-to-end integration tests
- User documentation

**Estimated:** 35-40 tasks (~4-5 hours)

**File:** [review-system-P3.md](./review-system-P3.md)

---

## Implementation Order

1. **Phase 1 (P1)** - Database foundation must be complete before P2
2. **Phase 2 (P2)** - Review workflow must work before P3
3. **Phase 3 (P3)** - Analysis and CLI build on P1 + P2

Each phase should be implemented sequentially. Within each phase, follow TDD strictly:
- Write failing test
- Run test to verify failure
- Implement minimal code
- Run test to verify pass
- Commit

---

## Success Criteria

**Phase 1 Complete:**
- [ ] All schema migrations applied
- [ ] CampaignClient passes all tests
- [ ] Content snapshots working with hash validation
- [ ] Schema tests pass

**Phase 2 Complete:**
- [ ] Reviewer prompts generate valid JSON schemas
- [ ] Orchestrator launches parallel agents
- [ ] Validators catch invalid outputs
- [ ] Single-persona review works end-to-end

**Phase 3 Complete:**
- [ ] Analysis aggregates multi-persona reviews
- [ ] CLI commands functional
- [ ] All core personas review works in parallel
- [ ] Markdown outputs properly formatted
- [ ] Full test suite passes

**Project Complete:**
- [ ] Can review HTML books via CLI
- [ ] Can review markdown chapters via CLI
- [ ] Parallel execution faster than sequential
- [ ] Database stores queryable results
- [ ] Trend analysis works across campaigns
- [ ] Documentation complete

---

## Design Decisions

**Questions from design doc - decisions for implementation:**

1. **Persona Selection:** Start with `all_core` only. Add `manual` and `smart_sampling` in future iterations.

2. **Failure Recovery:** Campaigns with partial failures mark as 'failed' with diagnostics. Support retry command to re-run failed persona reviews.

3. **Review Granularity:** Chapter reviews analyze whole chapters only. Section-level granularity is future work.

4. **Analysis Customization:** Run all analysis types always. Configuration can be added later if needed.

5. **Concurrent Campaigns:** Allow concurrent campaigns but log warning about resource usage. No hard limits initially.

6. **Review Archives:** Keep full history indefinitely. Archiving is future work.

7. **Human Review Integration:** Analysis is read-only initially. Comment system is future work.

---

## Testing Strategy

**Unit Tests:**
- Every database client method
- Every validator function
- Every utility function
- JSON schema validation

**Integration Tests:**
- CampaignClient + schema
- Content snapshot + database
- Reviewer prompt generation + validation
- Analyzer prompt generation + validation

**End-to-End Tests:**
- Single persona book review
- Multi-persona parallel reviews
- Campaign failure handling
- CLI command execution

---

## Commit Strategy

**Frequent small commits following conventional commits:**

```bash
# Examples:
feat(reviews): add review_campaigns table schema
test(reviews): add CampaignClient.create test
feat(reviews): implement CampaignClient.create
test(reviews): add content snapshot hash validation
fix(reviews): handle missing content files gracefully
```

**Commit after:**
- Each test passes (RED → GREEN)
- Each meaningful refactor (REFACTOR)
- Adding new test file
- Completing logical component

---

## Next Steps

1. Review this index and phase plans
2. Choose execution approach (subagent-driven vs parallel session)
3. Execute Phase 1 task-by-task
4. Verify Phase 1 complete before starting Phase 2
5. Execute Phase 2 task-by-task
6. Verify Phase 2 complete before starting Phase 3
7. Execute Phase 3 task-by-task
8. Final verification and documentation

---

**Related Design Doc:** [review-system-design.md](./review-system-design.md)
