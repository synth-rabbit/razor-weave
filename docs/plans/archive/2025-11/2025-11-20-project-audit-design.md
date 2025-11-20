# Razorweave Project Hygiene Audit - Design Document

**Created:** 2025-11-20
**Status:** Design Complete
**Type:** Diagnostic Tool / Analysis

---

## Overview

**Purpose:** Comprehensive read-only analysis of project organization, identifying files in wrong locations, outdated documentation, configuration issues, and git hook problems. Output prioritized by severity with specific remediation actions.

**Context:** Project has accumulated organizational debt - root directory clutter, misplaced outputs, completed plans needing archival, and git hooks occasionally blocking legitimate operations. Need systematic audit to identify all issues and create actionable cleanup plan.

**Key Constraint:** Audit must be 100% read-only - no modifications, only diagnostic output.

---

## Architecture & Approach

**Audit Name:** Razorweave Project Hygiene Audit

**Execution Model:**
1. **Discovery Phase** - Scan entire project tree, read configs, analyze git history
2. **Classification Phase** - Categorize each finding by type and severity
3. **Analysis Phase** - Generate recommendations with specific file paths and actions
4. **Reporting Phase** - Write structured markdown to `data/audits/2025-11-20-project-audit.md`

**Severity Levels:**
- **CRITICAL** - Breaks functionality or blocks development (e.g., hooks causing failures)
- **HIGH** - Wrong but not blocking (e.g., outputs in `src/tooling/data/`)
- **MEDIUM** - Organizational issues (e.g., root clutter, archival needed)
- **LOW** - Nice-to-have improvements (e.g., minor inconsistencies)

**Output Format:**
- Executive summary with severity breakdown and counts
- Detailed findings organized by category
- Action plan grouped by action type (DELETE, MOVE, ARCHIVE, FIX, CREATE)
- Each finding includes: file path, issue description, severity, recommended action

**Output Location:** `data/audits/2025-11-20-project-audit.md` (timestamped for history tracking)

---

## Analysis Categories & Checks

### Category 1: File Organization

**Checks:**
- **Root Directory Audit**: Identify non-essential files at root
  - Whitelist: INDEX.md, README.md, PLAN.md, AGENTS.md
  - Plus standard configs: package.json, tsconfig.json, .eslintrc.cjs, .prettierrc.cjs, .markdownlint.json, pnpm-workspace.yaml, .gitignore
  - Flag: Test reports, phase summaries, task files
- **Misplaced Outputs**: Find outputs that belong in `data/` or `docs/`
- **Temp/Generated Files**: Identify `.DS_Store`, build artifacts, or other cruft

**Expected Findings:**
- TASK-18-TESTING-REPORT.md (MEDIUM - MOVE to data/ or DELETE)
- PHASE2_*.md files (MEDIUM - MOVE to docs/ or data/)
- Other non-essential root files

### Category 2: Documentation Hygiene

**Checks:**
- **Completed Plans**: Scan `docs/plans/` - ALL plans are completed per user input
  - Recommendation: Archive all to `docs/plans/archive/2025-11/`
- **Outdated Reviews**: Check `docs/reviews/` for old/unused files
  - Criteria: Last modified date, content relevance
- **Broken References**: Validate internal links in INDEX.md and READMEs
  - Parse markdown, extract links, verify targets exist
- **Orphaned Docs**: Find documentation files not referenced anywhere
  - Search for references across all docs

**Expected Findings:**
- 39 plan files to archive (MEDIUM - ARCHIVE)
- docs/reviews/ cleanup candidates (varies by age)
- Potentially broken links in INDEX.md

### Category 3: Data/Output Management

**Checks:**
- **Database Locations**:
  - Verify `data/project.db` exists (primary location)
  - Flag `src/tooling/data/project.db` as misplaced output
- **Test Data Cleanup**: Check `data/test/` for accumulation
  - Count test databases, flag if excessive (>10-15)
- **Output Directory Structure**: Ensure outputs go to `data/` subdirectories, not `src/`

**Expected Findings:**
- src/tooling/data/project.db (HIGH - MOVE to data/ or DELETE if duplicate)
- Potential test database accumulation (LOW - cleanup suggestion)

### Category 4: System Configuration

**Checks:**
- **Git Hooks Analysis**:
  - Scan git log for `--no-verify` commits (last 50-100 commits)
  - Review hook code in `.husky/` and `src/tooling/hooks/git/`
  - Identify specific scenarios causing false positives
  - Look for overly restrictive patterns
- **Claude Hooks**: Verify hooks are executable and properly configured
  - Check `.claude/hooks/` permissions
  - Validate settings.local.json structure
- **Permissions**: Check all hooks have execute permissions

**Expected Findings:**
- Multiple --no-verify commits (CRITICAL/HIGH - analyze patterns)
- Potential hook code issues (varies - could be HIGH if blocking work)

### Category 5: Project Structure

**Checks:**
- **Core Files Status**:
  - PLAN.md - Check if empty (known issue)
  - AGENTS.md - Check if missing at root (known issue)
  - INDEX.md - Validate references are accurate
- **Expected Directories**: Verify standard structure exists
  - docs/, data/, src/, books/, .husky/, .claude/

**Expected Findings:**
- PLAN.md empty (MEDIUM - FIX with current status)
- AGENTS.md missing from root (MEDIUM - CREATE or trigger auto-generation)

---

## Output Structure

**File:** `data/audits/2025-11-20-project-audit.md`

### Template Structure

```markdown
# Razorweave Project Hygiene Audit
**Date:** 2025-11-20
**Auditor:** Claude Code (automated)
**Commit:** [hash] on main branch

---

## Executive Summary

**Overall Status:** [Good/Fair/Needs Attention/Critical]

**Findings by Severity:**
- CRITICAL: X issues
- HIGH: X issues
- MEDIUM: X issues
- LOW: X issues
- TOTAL: X issues

**Findings by Category:**
- File Organization: X issues
- Documentation Hygiene: X issues
- Data/Output Management: X issues
- System Configuration: X issues
- Project Structure: X issues

**Top 3 Priority Actions:**
1. [Most critical issue]
2. [Second priority]
3. [Third priority]

---

## Detailed Findings

### 1. File Organization

#### CRITICAL Issues
[List if any]

#### HIGH Issues
- **Issue:** [Description]
  - **Path:** `path/to/file`
  - **Problem:** [What's wrong]
  - **Recommendation:** [ACTION] to `correct/path`

#### MEDIUM Issues
[List with same structure]

#### LOW Issues
[List with same structure]

### 2. Documentation Hygiene
[Same structure, organized by severity]

### 3. Data/Output Management
[Same structure]

### 4. System Configuration

#### Git Hooks Analysis
- **--no-verify Commits Found:** X commits
- **Patterns Identified:**
  - [Pattern 1 with example commits]
  - [Pattern 2 with example commits]
- **Hook Code Issues:**
  - [Specific overly restrictive rules]
  - [False positive scenarios]

[Then organized by severity]

### 5. Project Structure
[Same structure]

---

## Action Plan

### DELETE (X items)
- [ ] `path/file1` - Reason: [outdated test report]
- [ ] `path/file2` - Reason: [old phase summary]

### MOVE (X items)
- [ ] `src/tooling/data/project.db` → `data/project.db` - Reason: [wrong output location]
- [ ] `root/TASK-18-TESTING-REPORT.md` → `data/reports/` - Reason: [misplaced output]

### ARCHIVE (X items)
- [ ] `docs/plans/*.md` → `docs/plans/archive/2025-11/` - Reason: [all plans completed]

### FIX (X items)
- [ ] Git hook: pre-commit.ts line XX - Reason: [overly restrictive pattern]
- [ ] PLAN.md - Reason: [empty, needs current status]

### CREATE (X items)
- [ ] AGENTS.md - Reason: [should be auto-generated at root]
- [ ] data/audits/ directory - Reason: [new directory for audit history]

---

## Appendices

### A. Root Directory Whitelist

**Core Project Files:**
- INDEX.md - Navigation index
- README.md - Project overview
- PLAN.md - Current project status
- AGENTS.md - Agent role definitions (auto-generated)

**Configuration Files:**
- package.json - Workspace root configuration
- pnpm-workspace.yaml - Monorepo configuration
- tsconfig.json - TypeScript configuration
- .eslintrc.cjs - ESLint configuration
- .prettierrc.cjs - Prettier configuration
- .markdownlint.json - Markdown linting rules
- .gitignore - Git exclusions

**Generated/Managed:**
- pnpm-lock.yaml - Dependency lock file
- tsconfig.tsbuildinfo - TypeScript build cache
- .DS_Store - macOS metadata (acceptable, not harmful)

**Hidden Directories:**
- .git/, .github/, .husky/, .claude/, .idea/
- node_modules/
- .worktrees/

**Everything else at root is flagged for review.**

### B. Commit Analysis Details
[Full list of --no-verify commits with:
- Commit hash
- Date
- Message
- Files affected
- Reason for --no-verify (if discernible)]

### C. Hook Code Recommendations
[Specific code changes for hooks with:
- File path
- Line numbers
- Current code
- Suggested fix
- Rationale]
```

---

## Implementation Approach

**Execution Method:** Single comprehensive analysis pass using Claude Code tools (Read, Grep, Glob, Bash for git commands). All findings collected in memory, then written to markdown file in one operation.

### Implementation Steps

**1. Setup**
- Check if `data/audits/` directory exists
- Create if needed
- Get current git commit hash for report metadata

**2. Discovery Phase**
- **Root scan**: List all files at root, compare against whitelist
- **Docs scan**: Recursively list all files in `docs/`
  - Tag all `docs/plans/*.md` as archival candidates
  - Check `docs/reviews/` file ages
- **Database check**: Verify locations and sizes of project.db files
- **Git log analysis**: `git log --all --oneline --grep="no-verify" -100` plus `git log --all --oneline -100 | grep -i skip`
- **Hook review**: Read all hook files from `.husky/` and `src/tooling/hooks/`

**3. Classification Phase**
- Apply whitelist rules to root files
- Classify non-whitelist files by pattern:
  - `TASK-*.md` → Test reports (MEDIUM - DELETE or MOVE)
  - `PHASE*.md` → Phase summaries (MEDIUM - MOVE to docs/ or data/)
  - Other docs → Manual review
- Tag database locations:
  - `data/project.db` → Correct (note in report)
  - `src/tooling/data/project.db` → Wrong (HIGH - MOVE or DELETE)
- Classify findings by severity using rules:
  - CRITICAL: Git hooks blocking work, broken core functionality
  - HIGH: Wrong locations affecting development workflow
  - MEDIUM: Organization/cleanup needed
  - LOW: Minor improvements, nice-to-haves

**4. Analysis Phase**
- **Cross-reference check**: Parse INDEX.md links, verify targets exist
- **Git hook pattern analysis**:
  - Group --no-verify commits by type/context
  - Review hook code for patterns matching those contexts
  - Identify specific overly restrictive rules
- **Generate recommendations**: For each finding, specify:
  - Exact file path
  - Current state vs desired state
  - Specific action (DELETE/MOVE/ARCHIVE/FIX/CREATE)
  - Severity justification

**5. Reporting Phase**
- Build markdown document following template structure
- Organize findings by category and severity
- Generate action plan with checkboxes
- Write to `data/audits/2025-11-20-project-audit.md`
- Print executive summary to console

**No Changes Made:** Audit is 100% read-only. All recommendations are suggestions only. User will execute cleanup based on audit findings.

**Estimated Duration:** 5-10 minutes for comprehensive analysis and report generation.

---

## Success Criteria

1. **Completeness**: All 5 categories analyzed, all findings documented
2. **Actionability**: Every finding has specific file path and recommended action
3. **Prioritization**: Severity levels accurately reflect impact on work
4. **Traceability**: Git hook issues traced to specific commits and code patterns
5. **Read-Only**: No files modified, no commits made during audit
6. **Reproducibility**: Audit can be re-run to track cleanup progress

---

## Future Enhancements

- **Automated cleanup script**: Generate bash script to execute all action items
- **Trend tracking**: Compare multiple audit runs to show improvement over time
- **Integration**: Run audit as pre-release check or monthly maintenance task
- **Hook testing**: Automated tests to verify hooks don't produce false positives
- **Documentation linting**: Extend to check style guide compliance

---

## Notes

- User confirmed ALL plans are completed, so archival recommendation is blanket
- `docs/reviews/` flagged as "in bad shape" by user - prioritize this category
- Git hooks have required `--no-verify` multiple times - this is HIGH priority to fix
- `src/tooling/data/` should NEVER contain project outputs - only `data/` is proper location
