# Audit Remediation Plan - Design

**Date:** 2025-11-20
**Author:** Claude Code (Sonnet 4.5) with User
**Status:** Design Complete - Ready for Implementation Planning
**Related Audits:**
- `data/audits/2025-11-20-project-audit.md` (56 findings)
- `data/audits/2025-11-20-code-quality-audit.md` (99 issues)

---

## Executive Summary

This plan addresses all findings from both the Project Hygiene Audit and Code Quality Audit, totaling ~99 distinct issues. The work is organized into 4 phases prioritized by risk and impact, with clear dependency tracking to enable parallel execution where possible.

**Key Decisions:**
- **Organization:** Risk-based phases with dependency tracking
- **Parallel Work:** Quick wins batch upfront, then independence markers
- **Task Sizing:** Each task completable in single context window/session
- **Test Coverage Target:** 80%+ (raised from audit's 60% recommendation)

**Total Scope:** 53 tasks across 4 phases
**Estimated Duration:** 8-12 weeks of focused work

---

## Design Rationale

### Organizational Approach

**Chosen: Hybrid Risk + Dependency Model**

We're using a mix of:
- **Risk-based prioritization** (HIGH → MEDIUM → LOW)
- **Dependency-aware grouping** (tasks flow naturally together)

**Why not pure risk?** Some high-risk items depend on lower-risk foundation work (e.g., error handling implementation depends on defining error standards first).

**Why not pure sequence?** Many tasks are independent and can run in parallel, enabling faster overall completion.

### Parallel Work Strategy

**Chosen: Quick Wins Batch + Independence Markers**

**Phase 1:** All tasks parallelizable (no dependencies)
**Phases 2-4:** Each task marked with:
- **Standalone** - Can start anytime
- **Parallelizable** - Can run alongside specific other tasks
- **Depends on:** Lists prerequisite tasks

**Why this approach?** Provides maximum flexibility - you can decide day-by-day whether to tackle things in parallel or focus on one track, while always knowing what's available to work on.

### Task Granularity

**Chosen: Grouped by Module, Context-Window Sized**

Each task:
- Scoped to single module/directory
- Completable in one focused session
- Won't hit context limits or require compaction

**Examples:**
- ✅ "Fix `any` types in database/ tests" (6 test files)
- ✅ "Add tests for validators/ module" (6 validator files)
- ❌ "Fix all test type safety" (too broad, 17+ files)

---

## Phase Breakdown

### Phase 1: Quick Wins (15 tasks, 1-3 days)

**Goal:** Get early momentum with fast, independent fixes.

**All tasks parallelizable - no dependencies**

**TypeScript Fixes (3 tasks)**
1. Remove unused variables (`CombinationRules`, `personasWithAffinity`)
2. Add type annotation (fix implicit `any` on parameter `r`)
3. Add missing `await` keywords (4 async functions)

**File Organization (7 tasks)**
4. Archive 39 completed plans to `docs/plans/archive/2025-11/`
5. Move phase summaries to archive
6. Relocate copyright assessment to `docs/legal/`
7. Move testing docs to proper directories
8. Clean review directory (delete empty file, archive stale `.txt` files)
9. Delete duplicate database files (after verification)
10. Relocate `verify-database.ts` to `src/tooling/scripts/`

**Documentation (3 tasks)**
11. Populate `PLAN.md` with current status
12. Update `INDEX.md` database location reference
13. Document `maintenance/` and `tools/` package purposes

**Cleanup (2 tasks)**
14. Delete `.DS_Store`
15. Generate `AGENTS.md`

### Phase 2: Critical Fixes (12 tasks, 1-2 weeks)

**Goal:** Address high-risk issues that could cause data loss or workflow disruption.

**Logging Infrastructure**
1. Add logging framework (winston/pino) - **Standalone**
2. Fix console.log linter warnings - **Depends on:** Task 1

**Testing - Critical Gaps**
3. Add tests for `database/schema.ts` - **Parallelizable** with 4-6
4. Add tests for `validators/` module - **Parallelizable** with 3, 5-6
5. Add tests for `hooks/claude/` module - **Parallelizable** with 3-4, 6
6. Improve `hooks/git/` coverage to 80% - **Parallelizable** with 3-5

**Test Type Safety - By Module**
7. Fix `any` types in `database/` tests (6 files) - **Standalone**
8. Fix `any` types in `personas/` tests (4 files) - **Parallelizable** with 7, 9
9. Fix `any` types in `reviews/` tests (11 files) - **Parallelizable** with 7-8

**Error Handling Foundation**
10. Define error handling standard - **Standalone**
11. Implement error handling in `database/` - **Depends on:** Task 10
12. Implement error handling in file I/O - **Depends on:** Task 10

### Phase 3: Testing Infrastructure (18 tasks, 2-3 weeks)

**Goal:** Reach 80%+ test coverage target.

**Module Coverage - All Parallelizable**
1. Add tests for `linters/` module (4 files)
2. Add tests for `scripts/` module (3 files)
3. Add tests for `updaters/` module (3 files)
4. Improve CLI commands coverage (60% → 80%)

**Integration & E2E Tests**
5. Add E2E workflow test: "Generate persona → Create campaign → Run review" - **Depends on:** Existing unit tests
6. Add git commit workflow test - **Depends on:** Phase 2, Task 6
7. Add CLI E2E tests - **Depends on:** Task 4

**Test Infrastructure**
8. Add vitest coverage config - **Standalone**
9. Set up coverage reporting - **Depends on:** Task 8
10. Document testing patterns in `TESTING.md` - **Standalone**

**Remaining Test Type Safety (8 tasks)**
11-18. Fix `any` types in remaining test files (CLI, validators, scripts) - **Parallelizable**

**Note:** May need additional tasks during implementation to reach 80% threshold.

### Phase 4: Code Standards & Documentation (8 tasks, 1-2 weeks)

**Goal:** Establish and document coding standards.

**Standards - All Standalone**
1. Extract magic numbers to constants (~10 files)
2. Add JSDoc to public APIs (~30 functions/classes)
3. Create `CONTRIBUTING.md` (error handling, naming, file organization)
4. Update `TESTING.md` (test patterns, anti-patterns)

**Organization - Optional**
5. Split large directories (e.g., `reviews/` with 24 files) - **Optional**
6. Consolidate tooling configs - **Optional**

**Final Cleanup**
7. Review and merge/document `maintenance` and `tools` packages
8. Establish quarterly audit cadence

---

## Success Criteria

### Overall Goals
- Improve project hygiene: "NEEDS ATTENTION" → "GOOD"
- Improve code quality: 6/10 → 8/10
- Test coverage: 17.5% → 80%+
- TypeScript errors: 3 → 0
- Linter violations: 90%+ reduction

### Phase Completion Criteria

**Phase 1 Complete:**
- ✅ 0 TypeScript compilation errors
- ✅ 0 files in project root violating whitelist
- ✅ PLAN.md and INDEX.md populated
- ✅ All 39 plans archived
- ✅ AGENTS.md exists

**Phase 2 Complete:**
- ✅ Logging framework in place, 0 console.log
- ✅ Critical modules have test coverage (schema, validators, claude hooks)
- ✅ Git hooks coverage >= 80%
- ✅ 0 `any` types in test files
- ✅ Error handling standard documented and implemented

**Phase 3 Complete:**
- ✅ Test coverage >= 80%
- ✅ All modules have test coverage
- ✅ E2E workflow tests exist
- ✅ Coverage reporting configured
- ✅ TESTING.md guide created

**Phase 4 Complete:**
- ✅ <10 magic numbers
- ✅ Public APIs have JSDoc
- ✅ CONTRIBUTING.md exists
- ✅ Package purposes documented
- ✅ Quarterly audit scheduled

### Final Target Metrics

| Metric | Current | Target | Delta |
|--------|---------|--------|-------|
| TypeScript errors | 3 | 0 | -3 |
| Linter errors | 41 | 0 | -41 |
| Linter warnings | 143 | <10 | -133+ |
| Test coverage | 17.5% | 80%+ | +62.5% |
| Untested packages | 7/8 | 0/8 | -7 |
| Code quality score | 6/10 | 8/10 | +2 |

---

## Risk Assessment

### Low Risk
- File organization tasks (moves, archives)
- Documentation updates
- TypeScript fixes (unused vars, missing awaits)

### Medium Risk
- Test type safety fixes (may reveal hidden bugs)
- Error handling implementation (changes behavior)
- Logging framework (replaces console.log everywhere)

### High Risk
- Database schema tests (may reveal schema bugs)
- E2E tests (may reveal integration bugs)
- 80% coverage target (ambitious, may need scope adjustment)

### Mitigation Strategies
1. **Incremental rollout** - Each phase builds on previous
2. **Test-first approach** - Add tests before refactoring
3. **Validation checkpoints** - Run full test suite after each task
4. **Rollback readiness** - Git commits after each completed task

---

## Dependencies & Sequencing

### Critical Path
1. Phase 1 (Quick Wins) → Enables clean workspace
2. Phase 2, Task 10 (Error standard) → Enables Tasks 11-12
3. Phase 2, Tasks 1-9 → Foundation for Phase 3
4. Phase 3, Tasks 1-10 → Enables 80% coverage target
5. Phase 4 → Final polish

### Parallel Opportunities

**Phase 1:** All 15 tasks can run simultaneously

**Phase 2:** Three parallel tracks possible:
- Track A: Logging (Tasks 1-2)
- Track B: Testing (Tasks 3-6)
- Track C: Type Safety (Tasks 7-9)
- Sequential: Error Handling (10 → 11-12)

**Phase 3:** Module tests (1-4) can all run in parallel

**Phase 4:** All tasks except 7-8 are independent

---

## Implementation Approach

### Task Execution Pattern
1. Read task requirements
2. Identify affected files/modules
3. Make changes (sized for single context window)
4. Run tests
5. Fix any failures
6. Commit with descriptive message
7. Update progress tracking

### Testing Strategy
- Run `pnpm test` after each task
- Run `pnpm typecheck` after TypeScript changes
- Run `pnpm lint` after linter-related changes
- Monitor coverage with `pnpm test --coverage` (after Phase 3, Task 8)

### Progress Tracking
- Use TodoWrite tool for task tracking
- Mark tasks in_progress when starting
- Mark completed immediately after verification
- Update metrics after each phase

---

## Future Considerations

### Not Included in This Plan
- Implementing stub packages (agents, workflows, tools)
- Adding features beyond current codebase
- Performance optimization
- Security hardening beyond error handling

### Next Steps After Completion
1. Run final audit to validate improvements
2. Establish baseline for future audits
3. Set up quarterly audit schedule
4. Consider automated quality gates in CI/CD

---

## Appendices

### A. Related Documents
- Project Hygiene Audit: `data/audits/2025-11-20-project-audit.md`
- Code Quality Audit: `data/audits/2025-11-20-code-quality-audit.md`
- Implementation Plans: TBD (will be in `docs/plans/audit-remediation-*.md`)

### B. Task Count Summary
- Phase 1: 15 tasks (all parallel)
- Phase 2: 12 tasks (3 tracks + 1 sequential)
- Phase 3: 18 tasks (mix of parallel and dependent)
- Phase 4: 8 tasks (mostly parallel)
- **Total: 53 tasks**

### C. Estimated Effort by Phase
- Phase 1: 1-3 days (quick wins)
- Phase 2: 1-2 weeks (critical fixes)
- Phase 3: 2-3 weeks (testing infrastructure)
- Phase 4: 1-2 weeks (standards & docs)
- **Total: 8-12 weeks**

---

## Design Approval

**Design Validated:** 2025-11-20
**Ready for Implementation Planning:** Yes
**Next Step:** Create detailed implementation plans for each phase

---

**End of Design Document**
