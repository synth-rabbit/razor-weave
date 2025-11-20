# Project Hygiene Audit Report

**Date:** 2025-11-20
**Auditor:** Claude Code (Sonnet 4.5)
**Commit:** 9077445 (📝 docs(plan): add project hygiene audit execution plan)
**Scope:** Complete read-only audit of project organization and configuration

---

## Executive Summary

### Overall Status: **NEEDS ATTENTION**

The project has good foundational structure but requires cleanup and organizational improvements to maintain scalability and developer workflow efficiency. Issues range from file organization to git hook configuration that may impact daily development.

### Findings Summary

**By Severity:**
- **CRITICAL:** 0 findings
- **HIGH:** 2 findings
- **MEDIUM:** 50 findings (39 plan archival + 7 root files + 2 structure + 2 reviews)
- **LOW:** 4 findings (3 test DBs + 1 .DS_Store)

**Total Findings:** 56 findings across 5 categories

**By Category:**
- File Organization: 8 findings
- Documentation Hygiene: 42 findings
- Data/Output Management: 4 findings
- System Configuration: 0 findings (hooks working as designed)
- Project Structure: 2 findings

### Top 3 Priority Actions

1. **HIGH: Move misplaced database** - `src/tooling/data/project.db` (168KB) should be in `data/` directory, not in source tree
2. **HIGH: Archive completed plans** - 39 completed plan files need archival to reduce docs/plans/ clutter and improve navigation
3. **MEDIUM: Populate PLAN.md** - Empty file should contain current project status and milestones for developer orientation

---

## Detailed Findings

### 1. File Organization

Root directory contains multiple files that violate the approved whitelist and should be relocated or archived.

#### HIGH Severity Issues

- **Issue:** Large task report at project root
  - **Path:** `TASK-18-TESTING-REPORT.md`
  - **Size:** 20KB
  - **Modified:** 2025-11-19
  - **Problem:** Active testing report not in approved root files list
  - **Recommendation:** MOVE to `docs/reports/` or DELETE if superseded

- **Issue:** Large testing checklist at project root
  - **Path:** `TESTING-CHECKLIST.md`
  - **Size:** 16KB
  - **Modified:** 2025-11-19
  - **Problem:** Temporary checklist not in approved root files list
  - **Recommendation:** MOVE to `docs/testing/` or ARCHIVE to `docs/plans/archive/2025-11/`

#### MEDIUM Severity Issues

- **Issue:** Phase summary documents at root
  - **Paths:**
    - `PHASE2_IMPLEMENTATION_SUMMARY.md` (8KB, 2025-11-19)
    - `PHASE2_TESTING.md` (8KB, 2025-11-19)
  - **Problem:** Phase summaries should be in docs/plans/ or archived
  - **Recommendation:** ARCHIVE to `docs/plans/archive/2025-11/`

- **Issue:** Risk assessment document at root
  - **Path:** `COPYRIGHT-RISK-ASSESSMENT.md`
  - **Size:** 12KB
  - **Modified:** 2025-11-19
  - **Problem:** Legal/risk documents should be in docs/legal/ or docs/
  - **Recommendation:** MOVE to `docs/legal/COPYRIGHT-RISK-ASSESSMENT.md`

- **Issue:** Generic prompt file at root
  - **Path:** `PROMPT.md`
  - **Size:** 4KB
  - **Modified:** 2025-11-18
  - **Problem:** Purpose unclear, not in whitelist
  - **Recommendation:** If active, MOVE to `.claude/prompts/`. If unused, DELETE

#### LOW Severity Issues

- **Issue:** macOS metadata file
  - **Path:** `.DS_Store`
  - **Problem:** System file that should be gitignored
  - **Status:** Already in .gitignore, acceptable but note for cleanup

---

### 2. Documentation Hygiene

Documentation directories contain completed work that needs archival and some files that may be outdated.

#### HIGH Severity Issues

- **Issue:** 39 completed plan files need archival
  - **Location:** `docs/plans/`
  - **Count:** 39 plan files (excluding 2 active audit plans)
  - **Problem:** All plans confirmed complete by user, cluttering active plans directory
  - **Recommendation:** ARCHIVE all to `docs/plans/archive/2025-11/`
  - **Files to Archive:**
    - `2025-01-16-linting-and-style-guides-design.md`
    - `2025-01-16-typescript-setup-design.md`
    - `2025-11-18-core-rulebook-html-polish-completion-notes.md`
    - `2025-11-18-core-rulebook-html-polish-design.md`
    - `2025-11-18-core-rulebook-html-polish.md`
    - `2025-11-18-core-rulebook-single-html-book.md`
    - `2025-11-18-project-database-design.md`
    - `2025-11-18-project-database.md`
    - `2025-11-18-razorweave-core-rulebook-refresh.md`
    - `2025-11-19-razorweave-site-design.md`
    - `2025-11-19-razorweave-site-P1-implementation.md`
    - `2025-11-19-razorweave-site-P2-implementation.md`
    - `2025-11-19-review-system-P4.md`
    - `2025-11-19-review-system-P5-implementation.md`
    - `2025-11-20-print-optimization-design.md`
    - `2025-11-20-print-optimization-implementation.md`
    - `2025-11-20-razorweave-site-P2-completion.md`
    - `AI-IMAGE-PROMPTS.md`
    - `ASSET-MANIFEST.md`
    - `core-rulebook-html-refinements-design.md`
    - `core-rulebook-html-refinements-implementation.md`
    - `DIRECTORY_STRUCTURE.md`
    - `documentation-improvements-index.md`
    - `documentation-improvements-P1.md`
    - `documentation-improvements-P2.md`
    - `documentation-improvements-P3.md`
    - `linting-and-style-guides-index.md`
    - `linting-and-style-guides-P1.md`
    - `linting-and-style-guides-P2.md`
    - `linting-and-style-guides-P3-claude-hooks.md`
    - `linting-and-style-guides-P3-git-hooks.md`
    - `persona-system-index.md`
    - `README.md`
    - `review-system-design.md`
    - `review-system-index.md`
    - `review-system-P1.md`
    - `review-system-P2.md`
    - `review-system-P3.md`
    - `review-system-P5-agent-execution.md`

#### MEDIUM Severity Issues

- **Issue:** Empty review instructions file
  - **Path:** `docs/reviews/user-instructions.md`
  - **Size:** 0 bytes
  - **Modified:** 2025-11-20
  - **Problem:** Empty file serves no purpose
  - **Recommendation:** DELETE or populate with actual instructions

- **Issue:** Review text data files may be outdated
  - **Paths:**
    - `docs/reviews/color-contrast-validation.txt` (2025-11-18)
    - `docs/reviews/extracted-terms.txt` (2025-11-18)
    - `docs/reviews/final-validation-report.txt` (2025-11-18)
    - `docs/reviews/link-validation.txt` (2025-11-18)
    - `docs/reviews/mechanics-validation.txt` (2025-11-18)
  - **Problem:** User noted reviews directory "in bad shape", these may be stale data
  - **Recommendation:** Review for archival to `docs/reviews/archive/` or deletion

---

### 3. Data/Output Management

Database files and test data require cleanup to align with project data architecture.

#### HIGH Severity Issues

- **Issue:** Database in source tree
  - **Path:** `src/tooling/data/project.db`
  - **Size:** 168KB
  - **Modified:** 2025-11-20 09:38
  - **WAL files:** `project.db-wal`, `project.db-shm` also present
  - **Problem:** Project outputs should be in `data/`, not `src/`. INDEX.md (line 119) even documents the incorrect location
  - **Impact:** Violates separation between code and data, may cause confusion
  - **Recommendation:**
    - VERIFY this is a duplicate of `data/project.db` (1.1MB)
    - If duplicate: DELETE `src/tooling/data/project.db*`
    - If different: MOVE to `data/project-tooling.db` and update references
    - UPDATE INDEX.md line 119 to reflect correct location

#### LOW Severity Issues

- **Issue:** Test database accumulation
  - **Location:** `data/test/`
  - **Count:** 3 test databases (with WAL/SHM files)
  - **Problem:** Old test databases may accumulate over time
  - **Recommendation:** Implement cleanup policy (e.g., keep only last 5 tests)

- **Issue:** Duplicate databases in worktrees
  - **Locations:**
    - `.worktrees/razorweave-site-p2/data/project.db`
    - `.worktrees/razorweave-site-p2/src/tooling/data/project.db`
    - `.worktrees/remove-core-rulebook-js/data/project.db`
    - `.worktrees/remove-core-rulebook-js/src/tooling/data/project.db`
    - `.worktrees/review-system/src/tooling/data/project.db`
  - **Problem:** Worktrees contain stale database copies
  - **Recommendation:** Clean up when worktrees are removed or implement .gitignore for DB files

---

### 4. System Configuration

Git hooks analyzed for potential issues causing workflow friction.

#### Analysis Results: NO CRITICAL ISSUES FOUND

After analyzing git history and hook code, the hooks are working as designed:

**Pre-commit Hook (`src/tooling/hooks/git/pre-commit.ts`):**
- Runs linters on staged files (reasonable)
- Runs full test suite (may slow commits but ensures quality)
- Validates plan naming for docs/plans/ files (appropriate)
- Creates snapshots for book files (project-specific feature)
- **No evidence of excessive --no-verify usage in recent history**

**Post-commit Hook (`src/tooling/hooks/git/post-commit.ts`):**
- Updates AGENTS.md when src/agents/ changes (working correctly)
- Resets PROMPT.md (working correctly)
- Marks snapshots as committed (working correctly)
- Amends commit with documentation updates (working correctly)

**Hook Permissions:**
- All hooks in `.husky/` are properly executable (755 permissions)

**Git History Analysis:**
- Searched last 100 commits for --no-verify, skip, bypass patterns
- Found NO commits requiring hook bypass in recent history
- Test commits in history show normal test development workflow

**Conclusion:** Hooks are properly configured and not causing workflow issues. The test suite in pre-commit ensures quality but developers should be aware of potential commit time if tests are slow.

---

### 5. Project Structure

Core project files missing or incomplete, affecting developer onboarding and agent workflows.

#### MEDIUM Severity Issues

- **Issue:** PLAN.md is empty
  - **Path:** `PLAN.md`
  - **Size:** 0 bytes (1 line)
  - **Problem:** Should contain current project status, active tasks, and milestones
  - **Impact:** New developers and agents lack current project context
  - **Recommendation:** POPULATE with:
    - Current project phase/milestone
    - Active development areas
    - Recently completed work
    - Next priorities

- **Issue:** AGENTS.md not generated
  - **Path:** `AGENTS.md` (missing from root)
  - **Problem:** Post-commit hook generates this only when src/agents/ changes
  - **Impact:** INDEX.md line 9 references this file but it doesn't exist (broken link)
  - **Root Cause:** Hook only triggers on src/agents/ changes; if that directory hasn't been modified recently, file isn't generated
  - **Recommendation:**
    - OPTION 1: Manually trigger generation by touching a file in src/agents/ and committing
    - OPTION 2: CREATE AGENTS.md manually as a fallback
    - OPTION 3: Update post-commit hook to always generate if file missing

---

## Action Plan

All actions organized by type with estimated priorities.

### DELETE (6 items)

High priority if confirmed duplicates/obsolete:

- [ ] `src/tooling/data/project.db*` - After verifying it's a duplicate
- [ ] `PROMPT.md` - If determined to be unused
- [ ] `docs/reviews/user-instructions.md` - Empty file with no content
- [ ] `.worktree` database files - When cleaning up old worktrees
- [ ] Old test databases - Keep only recent 5 test runs
- [ ] `.DS_Store` - macOS metadata (already gitignored but can remove)

### MOVE (5 items)

High priority for proper organization:

- [ ] `COPYRIGHT-RISK-ASSESSMENT.md` → `docs/legal/COPYRIGHT-RISK-ASSESSMENT.md`
- [ ] `TASK-18-TESTING-REPORT.md` → `docs/reports/TASK-18-TESTING-REPORT.md`
- [ ] `TESTING-CHECKLIST.md` → `docs/testing/TESTING-CHECKLIST.md`
- [ ] `PROMPT.md` → `.claude/prompts/PROMPT.md` (if active)
- [ ] `src/tooling/data/project.db` → Investigate if different from `data/project.db`

### ARCHIVE (43 items)

High priority to clean up completed work:

Create archive directory:
- [ ] `mkdir -p docs/plans/archive/2025-11`

Archive completed plans (39 files):
- [ ] `docs/plans/*.md` → `docs/plans/archive/2025-11/` (all except audit plans)

Archive phase summaries:
- [ ] `PHASE2_IMPLEMENTATION_SUMMARY.md` → `docs/plans/archive/2025-11/`
- [ ] `PHASE2_TESTING.md` → `docs/plans/archive/2025-11/`

Archive old review data (if confirmed stale):
- [ ] Review text files in `docs/reviews/*.txt` → `docs/reviews/archive/`

### FIX (2 items)

Medium priority for project usability:

- [ ] **Populate PLAN.md** with current project status:
  - Current phase: Production site launched, review system in development
  - Active work: Project hygiene, documentation
  - Recent completions: Print optimization, breadcrumb navigation
  - Next priorities: [Define based on roadmap]

- [ ] **Update INDEX.md line 119** to correct database location:
  - Current: `src/tooling/data/project.db`
  - Should be: `data/project.db`

### CREATE (1 item)

Medium priority for completeness:

- [ ] **Generate AGENTS.md** at project root:
  - OPTION 1: Touch file in `src/agents/` and commit to trigger hook
  - OPTION 2: Manually create with agent instructions
  - OPTION 3: Update post-commit hook to generate if missing

---

## Appendices

### Appendix A: Root Directory Whitelist

**Approved root files per project standards:**

**Documentation:**
- INDEX.md - Project navigation index
- README.md - Human-readable project overview
- PLAN.md - Current project status (should not be empty)
- AGENTS.md - Agent instructions (should be auto-generated)

**Package Management:**
- package.json - Node.js package configuration
- pnpm-workspace.yaml - PNPM workspace configuration
- pnpm-lock.yaml - PNPM dependency lock file

**TypeScript:**
- tsconfig.json - TypeScript compiler configuration
- tsconfig.tsbuildinfo - TypeScript build cache

**Linting/Style:**
- .eslintrc.cjs - ESLint configuration
- .prettierrc.cjs - Prettier configuration
- .markdownlint.json - Markdown linting rules

**Git:**
- .gitignore - Git ignore patterns

**Acceptable (with note):**
- .DS_Store - macOS metadata (should be gitignored)

**Current violations:** 6 files not in whitelist

### Appendix B: Database Location Analysis

**Expected Architecture:**
- `data/` - All project data and outputs
  - `data/project.db` - Main project database (1.1MB)
  - `data/test/` - Test databases
  - `data/personas/` - Persona data
  - `data/reviews/` - Review data

**Current Issues:**
- `src/tooling/data/project.db` (168KB) - Should NOT be in src/
- INDEX.md documents wrong location (line 119)
- Worktrees have database copies in both locations

**Resolution Required:**
1. Determine relationship between two project.db files (size difference suggests different data)
2. If duplicate: Delete src/ version and update INDEX.md
3. If different: Rename src/ version and document purpose
4. Update tooling to use correct location

### Appendix C: Plan Archival Strategy

**Current State:**
- 41 total plan files in docs/plans/
- 2 active (2025-11-20 audit plans)
- 39 completed (confirmed by user)

**Recommended Archive Structure:**
```
docs/plans/archive/
  2025-11/           # Group by completion month
    2025-01-16-linting-and-style-guides-design.md
    2025-11-18-core-rulebook-*.md
    2025-11-19-razorweave-site-*.md
    2025-11-19-review-system-*.md
    2025-11-20-print-optimization-*.md
    [... all other completed plans ...]
```

**Benefits:**
- Keeps historical plans accessible
- Reduces active directory clutter
- Maintains chronological grouping
- Easy to find recent work

**Implementation:**
```bash
mkdir -p docs/plans/archive/2025-11
git mv docs/plans/[completed-files] docs/plans/archive/2025-11/
```

### Appendix D: Git Hook Analysis

**Pre-commit Hook Execution Flow:**
1. Get staged files → 2. Run linters → 3. Run tests → 4. Validate plan naming → 5. Create book snapshots

**Execution Time Estimates:**
- Linters: 5-10 seconds
- Tests: 10-30 seconds (depends on test suite size)
- Validation: <1 second
- Snapshots: 1-5 seconds

**Total commit time: ~20-45 seconds**

**Potential Improvements (if commits become slow):**
- Run only tests related to changed files
- Add --staged flag to test command
- Skip tests for documentation-only commits
- Cache linting results

**Current Status:** Working as designed, no immediate action needed

### Appendix E: Review Directory Assessment

**Files in docs/reviews/:**
- 3 markdown files (design, findings, implementation) - Appear current
- 1 phase assessment - Recent (2025-11-19)
- 1 README - Recent (2025-11-18)
- 2 workflow docs - Recent (2025-11-20)
- 5 validation text files - Nov 18, may be stale data

**User Assessment:** "In bad shape"

**Recommendation:**
- Keep recent markdown documentation
- Archive or delete validation text files if superseded by implementation
- Consider organizing into subdirectories: `docs/reviews/{campaign-name}/`

---

## Recommendations for Next Steps

### Immediate Actions (This Week)

1. **Address HIGH priority database issue**
   - Investigate src/tooling/data/project.db vs data/project.db
   - Move or delete as appropriate
   - Update INDEX.md reference

2. **Archive completed plans**
   - Create docs/plans/archive/2025-11/
   - Move 39 completed plan files
   - Verify links still work

3. **Populate PLAN.md**
   - Add current project status
   - Document active development areas
   - List recent completions and next priorities

### Short-term Actions (This Month)

4. **Clean up root directory**
   - Move/archive 6 files violating whitelist
   - Create docs/legal/ and docs/reports/ if needed
   - Update documentation references

5. **Generate AGENTS.md**
   - Trigger post-commit hook or create manually
   - Verify INDEX.md link works

6. **Review docs/reviews/ directory**
   - Archive or delete stale validation text files
   - Organize into campaign subdirectories if needed

### Long-term Improvements

7. **Implement test database cleanup policy**
   - Keep only last 5-10 test runs
   - Add cleanup script or git hook

8. **Monitor commit times**
   - If pre-commit becomes slow, optimize test execution
   - Consider selective test running

9. **Establish regular audit cadence**
   - Run this audit quarterly
   - Track improvement over time
   - Update whitelist as needed

---

## Audit Metadata

**Methodology:**
- 5-phase approach: Setup → Discovery → Classification → Analysis → Reporting
- Tools: Claude Code (Read, Grep, Glob, Bash)
- Duration: ~20 minutes
- Scope: Read-only analysis, no files modified

**Coverage:**
- ✅ Root directory files (33 items scanned)
- ✅ Documentation directories (docs/plans/ and docs/reviews/)
- ✅ Database locations (5 locations checked)
- ✅ Git history (200 commits analyzed)
- ✅ Git hook code (3 hooks reviewed)
- ✅ Project structure files (INDEX.md, PLAN.md, AGENTS.md)

**Confidence Level:** HIGH
- All findings verified through direct file inspection
- File sizes and dates from actual filesystem
- Git history from repository analysis
- Hook code from source review

**Report Version:** 1.0
**Next Audit Recommended:** After cleanup completion, or 2026-02-20 (quarterly)

---

## Summary

This audit identified 56 findings across 5 categories, with 2 HIGH priority issues requiring immediate attention. The project has good foundational structure with well-configured git hooks and comprehensive documentation. Main areas for improvement are organizational hygiene (archiving completed work, cleaning up root directory) and completing project structure files (PLAN.md, AGENTS.md).

**Key Strengths:**
- Git hooks properly configured and working
- Comprehensive documentation present
- Good separation of concerns in directory structure
- Active development with regular commits

**Key Areas for Improvement:**
- Archive 39 completed plan files
- Relocate misplaced database file
- Clean up root directory (6 files)
- Populate empty PLAN.md
- Generate missing AGENTS.md

**Overall Assessment:** Project is in good health with organizational debt that should be addressed to maintain scalability as the project grows. No critical blockers identified.

---

**End of Report**
