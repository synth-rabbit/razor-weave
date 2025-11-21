# Audit Remediation - Master Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 99 issues identified in project hygiene and code quality audits to improve project from 6/10 to 8/10 quality score.

**Scope:** 53 tasks across 4 phases addressing TypeScript errors, test coverage, linter violations, file organization, and code standards.

**Related Documents:**
- Design: `docs/plans/2025-11-20-audit-remediation-design.md`
- Project Hygiene Audit: `data/audits/2025-11-20-project-audit.md`
- Code Quality Audit: `data/audits/2025-11-20-code-quality-audit.md`

---

## Phase Overview

### Phase 1: Quick Wins (15 tasks, 1-3 days)
**Status:** Not Started
**Plan:** `audit-remediation-P1.md`

Fast, independent fixes for immediate momentum:
- Fix 3 TypeScript errors
- Archive 39 completed plans
- Organize documentation
- Clean up root directory
- Generate AGENTS.md

**All tasks parallelizable - no dependencies**

### Phase 2: Critical Fixes (12 tasks, 1-2 weeks)
**Status:** Not Started
**Plan:** `audit-remediation-P2.md`

High-risk issues that could cause data loss or workflow disruption:
- Add logging framework (replace console.log)
- Test critical modules (schema, validators, hooks)
- Fix test type safety (`any` types)
- Implement error handling standard

**3 parallel tracks + 1 sequential**

### Phase 3: Testing Infrastructure (18 tasks, 2-3 weeks)
**Status:** Not Started
**Plan:** `audit-remediation-P3.md`

Reach 80%+ test coverage target:
- Add tests for all modules
- E2E workflow tests
- Coverage reporting setup
- Fix remaining test type safety

**Mix of parallel and dependent tasks**

### Phase 4: Code Standards & Documentation (8 tasks, 1-2 weeks)
**Status:** ✅ Complete (6 commits, all tasks finished)
**Plan:** `audit-remediation-P4.md`

Establish and document coding standards:
- Extract magic numbers
- Add JSDoc to public APIs
- Create CONTRIBUTING.md
- Establish quarterly audit cadence

**Mostly parallel tasks**

**Completed:** 2025-11-20 (commits 1078004 through aad1ab6)

---

## Success Criteria

### Final Target Metrics

| Metric | Current | Target | Delta |
|--------|---------|--------|-------|
| TypeScript errors | 3 | 0 | -3 |
| Linter errors | 41 | 0 | -41 |
| Linter warnings | 143 | <10 | -133+ |
| Test coverage | 17.5% | 80%+ | +62.5% |
| Untested packages | 7/8 | 0/8 | -7 |
| Code quality score | 6/10 | 8/10 | +2 |

### Phase Completion Gates

**Phase 1 Complete:**
- ✅ 0 TypeScript compilation errors
- ✅ 0 files in project root violating whitelist
- ✅ PLAN.md and INDEX.md populated
- ✅ All 39 plans archived
- ✅ AGENTS.md exists

**Phase 2 Complete:**
- ✅ Logging framework in place, 0 console.log
- ✅ Critical modules have test coverage
- ✅ Git hooks coverage >= 80%
- ✅ 0 `any` types in test files
- ✅ Error handling standard documented

**Phase 3 Complete:**
- ✅ Test coverage >= 80%
- ✅ All modules have test coverage
- ✅ E2E workflow tests exist
- ✅ Coverage reporting configured

**Phase 4 Complete:**
- ✅ <10 magic numbers
- ✅ Public APIs have JSDoc
- ✅ CONTRIBUTING.md exists
- ✅ Quarterly audit scheduled

---

## Execution Strategy

### Verification After Each Task

Run these commands after completing each task:

```bash
# TypeScript compilation
pnpm exec tsc --noEmit

# Linting
pnpm lint

# Tests (if applicable)
pnpm test

# Full validation
pnpm lint && pnpm exec tsc --noEmit && pnpm test
```

### Commit Pattern

Each task should result in exactly one commit:

```bash
git add [files]
git commit -m "[type]: [description]

[Body with details]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Commit types:**
- `fix:` - Bug fixes, error corrections
- `refactor:` - Code reorganization, cleanup
- `test:` - Adding or updating tests
- `docs:` - Documentation updates
- `chore:` - File moves, archiving, tooling

### Progress Tracking

Use TodoWrite tool to:
1. Create todos for all tasks in current phase
2. Mark tasks `in_progress` when starting
3. Mark `completed` immediately after verification
4. Update metrics after each phase

---

## Dependencies & Sequencing

### Critical Path
1. Phase 1 → Clean workspace foundation
2. Phase 2, Task 10 (Error standard) → Enables Tasks 11-12
3. Phase 2 completion → Foundation for Phase 3
4. Phase 3 completion → Enables 80% coverage target
5. Phase 4 → Final polish

### Parallel Opportunities

**Phase 1:** All 15 tasks can run simultaneously

**Phase 2:** Three parallel tracks:
- Track A: Logging (Tasks 1-2)
- Track B: Testing (Tasks 3-6)
- Track C: Type Safety (Tasks 7-9)
- Sequential: Error Handling (10 → 11-12)

**Phase 3:** Module tests (Tasks 1-4) can all run in parallel

**Phase 4:** All tasks except 7-8 are independent

---

## Risk Mitigation

### High-Risk Tasks
- Database schema tests (may reveal bugs)
- E2E tests (may reveal integration issues)
- 80% coverage target (ambitious)

### Strategies
1. **Incremental rollout** - Each phase builds on previous
2. **Test-first approach** - Add tests before refactoring
3. **Validation checkpoints** - Run full suite after each task
4. **Rollback readiness** - Commit after each completed task

---

## Getting Started

### Prerequisites
- All git changes committed or stashed
- Node/pnpm environment working
- Tests passing: `pnpm test`

### Start Phase 1

1. Read Phase 1 plan: `docs/plans/audit-remediation-P1.md`
2. Create todos for all 15 tasks
3. Pick any task (all parallelizable)
4. Complete task following plan
5. Run verification commands
6. Commit
7. Move to next task

---

## Estimated Timeline

- **Phase 1:** 1-3 days (quick wins)
- **Phase 2:** 1-2 weeks (critical fixes)
- **Phase 3:** 2-3 weeks (testing infrastructure)
- **Phase 4:** 1-2 weeks (standards & docs)
- **Total:** 8-12 weeks of focused work

---

**Plan Status:** Ready for Execution
**Next Step:** Begin Phase 1 - Read `audit-remediation-P1.md`
