# Project Hygiene Audit Execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute comprehensive read-only project audit to identify organizational issues and generate actionable cleanup recommendations.

**Architecture:** 5-phase analysis approach (Setup → Discovery → Classification → Analysis → Reporting) using Claude Code tools to scan project structure, analyze git history, review hook code, and generate prioritized findings report.

**Tech Stack:** Claude Code tools (Read, Grep, Glob, Bash), Markdown, Git

**Design Document:** `docs/plans/2025-11-20-project-audit-design.md`

---

## Task 1: Setup and Preparation

**Files:**
- Create: `data/audits/` directory
- Will Create: `data/audits/2025-11-20-project-audit.md`

**Step 1: Create audits directory**

```bash
mkdir -p /Users/pandorz/Documents/razorweave/data/audits
```

**Step 2: Get current git commit for metadata**

```bash
cd /Users/pandorz/Documents/razorweave && git log -1 --oneline
```

Expected: Short hash + commit message (e.g., `46c476b 📝 docs(design): add comprehensive...`)

**Step 3: Initialize findings collection**

Create empty findings structure in memory:
- File Organization findings: []
- Documentation Hygiene findings: []
- Data/Output Management findings: []
- System Configuration findings: []
- Project Structure findings: []

---

## Task 2: Discovery Phase - Root Directory Scan

**Step 1: List all files at project root**

Use Glob to list all files directly at root (not subdirectories):

```bash
ls -la /Users/pandorz/Documents/razorweave
```

Filter for:
- Regular files (not directories)
- Exclude hidden files starting with `.` (except .gitignore, .eslintrc.cjs, .prettierrc.cjs, .markdownlint.json)
- Exclude `node_modules/`, `.git/`, etc.

**Step 2: Compare against whitelist**

**Approved root files:**
- INDEX.md, README.md, PLAN.md, AGENTS.md
- package.json, pnpm-workspace.yaml, pnpm-lock.yaml
- tsconfig.json, tsconfig.tsbuildinfo
- .eslintrc.cjs, .prettierrc.cjs, .markdownlint.json, .gitignore
- .DS_Store (acceptable but note)

**Step 3: Identify violations**

For each file NOT in whitelist:
- Record: File path, size, last modified date
- Classify type: Test report, phase summary, task file, other
- Assign severity:
  - HIGH: Large files (>100KB), active outputs
  - MEDIUM: Documentation, summaries
  - LOW: Small temp files
- Suggest action: DELETE or MOVE to appropriate location

Add to "File Organization findings"

---

## Task 3: Discovery Phase - Documentation Scan

**Step 1: Scan docs/plans/ directory**

```bash
ls /Users/pandorz/Documents/razorweave/docs/plans/*.md
```

Count total plan files (expected: ~39 files)

**Step 2: Tag all plans for archival**

Per user input: ALL plans are completed

For each plan file:
- Record: Filename, date from filename (YYYY-MM-DD)
- Suggested action: ARCHIVE to `docs/plans/archive/2025-11/`
- Severity: MEDIUM
- Justification: "All plans completed per project status"

Add to "Documentation Hygiene findings"

**Step 3: Scan docs/reviews/ directory**

```bash
ls -lh /Users/pandorz/Documents/razorweave/docs/reviews/
```

For each file:
- Check last modified date
- If older than 30 days AND not referenced in recent work: flag as "potentially outdated"
- Severity: MEDIUM (user noted this is "in bad shape")
- Action: Review for deletion or archival

Add to "Documentation Hygiene findings"

**Step 4: Check for broken links**

Read INDEX.md:

```bash
grep -E '\[.*\]\(.*\)' /Users/pandorz/Documents/razorweave/INDEX.md
```

Extract all markdown links, verify target files exist:
- For each `[text](path)`, check if `path` exists
- Record broken links as HIGH severity
- Suggested action: FIX (update or remove link)

Add to "Documentation Hygiene findings"

---

## Task 4: Discovery Phase - Database and Data Management

**Step 1: Locate all database files**

```bash
find /Users/pandorz/Documents/razorweave -name "*.db" -o -name "*.db-shm" -o -name "*.db-wal" | grep -v node_modules
```

Expected locations:
- `/Users/pandorz/Documents/razorweave/data/project.db` (CORRECT)
- `/Users/pandorz/Documents/razorweave/src/tooling/data/project.db` (WRONG)

**Step 2: Check database sizes**

```bash
ls -lh /Users/pandorz/Documents/razorweave/data/project.db
ls -lh /Users/pandorz/Documents/razorweave/src/tooling/data/project.db
```

**Step 3: Flag misplaced database**

Finding:
- **Issue:** Database in `src/tooling/data/project.db`
- **Path:** `src/tooling/data/project.db`
- **Problem:** Project outputs should be in `data/`, not `src/`
- **Severity:** HIGH
- **Action:** MOVE to `data/project.db` or DELETE if duplicate

Add to "Data/Output Management findings"

**Step 4: Check test data accumulation**

```bash
ls /Users/pandorz/Documents/razorweave/data/test/*.db 2>/dev/null | wc -l
```

If count > 15:
- Severity: LOW
- Action: Cleanup old test databases
- Suggested: Keep only recent tests

Add to "Data/Output Management findings"

---

## Task 5: Discovery Phase - Git Hook Analysis (History)

**Step 1: Search for --no-verify commits**

```bash
cd /Users/pandorz/Documents/razorweave && git log --all --oneline -100 | grep -i "no-verify"
```

Also check commit messages:

```bash
git log --all --grep="no-verify" --grep="skip" --grep="bypass" -i --oneline -100
```

**Step 2: For each --no-verify commit found**

```bash
git show <hash> --stat
```

Record:
- Commit hash
- Date
- Message
- Files changed
- Pattern: Why was hook skipped? (test failures, hook errors, etc.)

**Step 3: Identify patterns**

Group commits by reason:
- Pre-commit test failures (common pattern)
- Hook execution errors
- Linting issues
- Other

Count occurrences of each pattern.

**Step 4: Record findings**

- **Issue:** Git hooks require --no-verify to bypass
- **Severity:** CRITICAL if blocking frequently, HIGH if occasional
- **Evidence:** List of commit hashes and patterns
- **Action:** FIX hook logic to reduce false positives

Add to "System Configuration findings"

---

## Task 6: Discovery Phase - Git Hook Analysis (Code Review)

**Step 1: Read pre-commit hook**

```bash
cat /Users/pandorz/Documents/razorweave/.husky/pre-commit
cat /Users/pandorz/Documents/razorweave/src/tooling/hooks/git/pre-commit.ts
```

**Step 2: Identify potentially restrictive rules**

Look for:
- Test execution that might fail on unrelated changes
- Linting that might be too strict
- Validation that doesn't allow exceptions

**Step 3: Cross-reference with --no-verify patterns**

For each pattern from Task 5:
- Find corresponding hook code
- Identify specific check that caused failure
- Assess: Is this a false positive or legitimate failure?

**Step 4: Document hook code issues**

For each overly restrictive rule:
- **File:** `src/tooling/hooks/git/pre-commit.ts`
- **Line:** Specific line number
- **Issue:** Description of false positive scenario
- **Suggested Fix:** Code change or configuration adjustment
- **Severity:** HIGH (if blocking work regularly)

Add to "System Configuration findings"

**Step 5: Check hook permissions**

```bash
ls -la /Users/pandorz/Documents/razorweave/.husky/
```

Verify all hooks are executable (should have `x` permission)

If not executable:
- Severity: CRITICAL
- Action: `chmod +x .husky/<hook-name>`

---

## Task 7: Discovery Phase - Project Structure Check

**Step 1: Check PLAN.md status**

```bash
cat /Users/pandorz/Documents/razorweave/PLAN.md
```

Expected: Empty or minimal content

Finding:
- **Issue:** PLAN.md is empty
- **Path:** `PLAN.md`
- **Problem:** Should contain current project status/milestones
- **Severity:** MEDIUM
- **Action:** FIX - populate with current project state

Add to "Project Structure findings"

**Step 2: Check AGENTS.md existence**

```bash
ls /Users/pandorz/Documents/razorweave/AGENTS.md 2>/dev/null
```

Expected: File not found

Finding:
- **Issue:** AGENTS.md missing from root
- **Path:** `AGENTS.md` (should exist)
- **Problem:** Should be auto-generated by post-commit hook
- **Severity:** MEDIUM
- **Action:** CREATE or trigger auto-generation (modify agent file to trigger hook)

Add to "Project Structure findings"

**Step 3: Verify INDEX.md references**

```bash
cat /Users/pandorz/Documents/razorweave/INDEX.md
```

Check if INDEX.md references AGENTS.md (line 9 should reference it)

If referenced but file doesn't exist:
- Broken reference finding already captured in Task 3

---

## Task 8: Classification Phase

**Step 1: Assign final severity levels**

Review all findings collected in Tasks 2-7:

Apply severity rules:
- **CRITICAL:** Blocks work or causes failures (e.g., hooks requiring --no-verify frequently)
- **HIGH:** Wrong location affecting workflow (e.g., src/tooling/data/project.db)
- **MEDIUM:** Organization/cleanup needed (e.g., root clutter, plan archival, empty PLAN.md)
- **LOW:** Minor improvements (e.g., test data cleanup, .DS_Store)

**Step 2: Count findings by category**

- File Organization: X findings
- Documentation Hygiene: X findings
- Data/Output Management: X findings
- System Configuration: X findings
- Project Structure: X findings

**Step 3: Count findings by severity**

- CRITICAL: X
- HIGH: X
- MEDIUM: X
- LOW: X
- TOTAL: X

---

## Task 9: Analysis Phase

**Step 1: Identify top 3 priorities**

Sort all findings by:
1. Severity (CRITICAL > HIGH > MEDIUM > LOW)
2. Impact (how much it affects daily work)
3. Frequency (how often it's encountered)

Select top 3 most critical issues.

**Step 2: Determine overall status**

Based on severity counts:
- **Critical:** Any CRITICAL issues present
- **Needs Attention:** Multiple HIGH issues
- **Fair:** Mostly MEDIUM/LOW issues
- **Good:** Only LOW severity issues

**Step 3: Generate action plan**

Group all findings by action type:

**DELETE actions:**
- List files to delete with reasons

**MOVE actions:**
- List files to move with source → destination

**ARCHIVE actions:**
- List files to archive with destination

**FIX actions:**
- List configurations to fix with specific changes

**CREATE actions:**
- List files to create with purpose

---

## Task 10: Reporting Phase

**Step 1: Generate Executive Summary**

Write summary section with:
- Overall status
- Findings by severity (counts)
- Findings by category (counts)
- Top 3 priority actions

**Step 2: Generate Detailed Findings sections**

For each category (File Organization, Documentation Hygiene, etc.):

Group findings by severity (CRITICAL → HIGH → MEDIUM → LOW)

For each finding:
```markdown
#### [SEVERITY] Issues

- **Issue:** [Description]
  - **Path:** `exact/file/path`
  - **Problem:** [What's wrong]
  - **Recommendation:** [ACTION] to `correct/path`
```

**Step 3: Generate Action Plan section**

For each action type (DELETE, MOVE, ARCHIVE, FIX, CREATE):

```markdown
### [ACTION TYPE] (X items)
- [ ] `path/to/file` - Reason: [explanation]
```

**Step 4: Generate Appendices**

**Appendix A:** Root Directory Whitelist (from design)

**Appendix B:** Full commit analysis (table of --no-verify commits)

**Appendix C:** Hook code recommendations (specific code changes)

**Step 5: Write complete markdown to file**

Write all sections to:

```
/Users/pandorz/Documents/razorweave/data/audits/2025-11-20-project-audit.md
```

Include:
- Header with date, auditor, commit hash
- Executive Summary
- All 5 detailed findings sections
- Action Plan
- Appendices

**Step 6: Verify file was written**

```bash
ls -lh /Users/pandorz/Documents/razorweave/data/audits/2025-11-20-project-audit.md
```

Expected: File exists with reasonable size (>50KB for comprehensive audit)

---

## Task 11: Output and Summary

**Step 1: Print executive summary to console**

Display:
- Overall status
- Severity counts
- Top 3 priorities
- File location

**Step 2: Provide next steps**

Inform user:
```
✅ Audit complete!

📊 Report: data/audits/2025-11-20-project-audit.md

Next steps:
1. Review the audit report
2. Address CRITICAL issues first
3. Work through action plan by priority
4. Re-run audit after cleanup to track progress
```

---

## Success Criteria

- ✅ All 5 categories analyzed
- ✅ Every finding has specific file path and action
- ✅ Severity levels accurately reflect impact
- ✅ Git hook issues traced to commits and code
- ✅ No files modified (read-only audit)
- ✅ Report written to `data/audits/2025-11-20-project-audit.md`
- ✅ Executive summary printed to console

---

## Notes

- This is a READ-ONLY audit - no files are modified except creating the audit report
- Can be executed directly on main branch (no worktree needed)
- All findings are recommendations only - user decides what to act on
- Audit can be re-run after cleanup to track improvement

**Estimated Total Time:** 15-20 minutes for comprehensive execution
