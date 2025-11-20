# Audit Remediation - Phase 1: Quick Wins

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete 15 fast, independent fixes to get early momentum and clean the workspace.

**Duration:** 1-3 days

**All tasks parallelizable - pick any order**

---

## Task 1: Remove Unused Variable `CombinationRules`

**TypeScript Error:** Variable declared but never used

**Files:**
- Modify: `src/tooling/personas/generator.ts`

**Steps:**

1. **Locate the unused variable**

   Open `src/tooling/personas/generator.ts` and find the `CombinationRules` variable (likely near the top of the file)

2. **Remove the variable declaration**

   Delete the entire line/block defining `CombinationRules`

3. **Verify TypeScript compilation**

   ```bash
   pnpm exec tsc --noEmit
   ```

   Expected: One fewer error (should go from 3 to 2 errors)

4. **Run tests to ensure nothing breaks**

   ```bash
   pnpm test src/tooling/personas/generator.test.ts
   ```

   Expected: All tests pass

5. **Commit**

   ```bash
   git add src/tooling/personas/generator.ts
   git commit -m "fix(personas): remove unused CombinationRules variable

Removed unused variable CombinationRules that was flagged by TypeScript compiler.
This reduces TypeScript errors from 3 to 2.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 2: Remove Unused Variable `personasWithAffinity`

**TypeScript Error:** Variable declared but never used

**Files:**
- Modify: `src/tooling/personas/coherence.ts`

**Steps:**

1. **Locate the unused variable**

   Open `src/tooling/personas/coherence.ts` and find `personasWithAffinity`

2. **Remove the variable declaration**

   Delete the line/block defining `personasWithAffinity`

3. **Verify TypeScript compilation**

   ```bash
   pnpm exec tsc --noEmit
   ```

   Expected: One fewer error (should go from 2 to 1 error)

4. **Run tests**

   ```bash
   pnpm test src/tooling/personas/coherence.test.ts
   ```

   Expected: All tests pass

5. **Commit**

   ```bash
   git add src/tooling/personas/coherence.ts
   git commit -m "fix(personas): remove unused personasWithAffinity variable

Removed unused variable personasWithAffinity flagged by TypeScript compiler.
This reduces TypeScript errors from 2 to 1.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 3: Add Type Annotation to Parameter `r`

**TypeScript Error:** Parameter 'r' implicitly has 'any' type

**Files:**
- Modify: `src/tooling/database/schema.ts`

**Steps:**

1. **Locate the parameter with implicit any**

   Open `src/tooling/database/schema.ts` and search for parameter `r` without a type annotation

   Likely in a callback function like `.map(r => ...)` or `.filter(r => ...)`

2. **Determine the correct type**

   Look at the context:
   - If it's from a database query result, it might be `unknown` or a specific row type
   - Check what properties are accessed on `r` to infer the type
   - Common pattern: `(r: unknown)` then type-guard, or `(r: DatabaseRow)` if type is known

3. **Add the type annotation**

   Change from:
   ```typescript
   .map(r => ...)
   ```

   To:
   ```typescript
   .map((r: unknown) => ...)
   ```

   Or use a more specific type if you can determine it from context.

4. **Verify TypeScript compilation**

   ```bash
   pnpm exec tsc --noEmit
   ```

   Expected: Zero TypeScript errors!

5. **Run tests**

   ```bash
   pnpm test src/tooling/database/schema.test.ts
   ```

   Expected: All tests pass (or test file doesn't exist yet - that's Phase 2)

6. **Commit**

   ```bash
   git add src/tooling/database/schema.ts
   git commit -m "fix(database): add type annotation to parameter r

Added explicit type annotation to parameter 'r' to eliminate implicit any.
This resolves the last TypeScript compilation error.

TypeScript errors: 1 → 0 ✅

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 4: Archive 39 Completed Plans

**Files:**
- Create: `docs/plans/archive/2025-11/`
- Move: 39 plan files from `docs/plans/` to `docs/plans/archive/2025-11/`

**Plans to Archive:**

See `data/audits/2025-11-20-project-audit.md` section "Completed Plans to Archive" for the full list of 39 plans.

**Steps:**

1. **Create archive directory**

   ```bash
   mkdir -p docs/plans/archive/2025-11
   ```

2. **Move completed plans**

   ```bash
   # Move all the completed plan files
   git mv docs/plans/persona-generation-* docs/plans/archive/2025-11/
   git mv docs/plans/review-system-* docs/plans/archive/2025-11/
   git mv docs/plans/core-rulebook-* docs/plans/archive/2025-11/
   git mv docs/plans/documentation-improvements-* docs/plans/archive/2025-11/
   # ... repeat for all 39 files listed in the audit
   ```

   **Tip:** You can use a text editor to prepare the full list of `git mv` commands from the audit report, then paste them all at once.

3. **Verify the moves**

   ```bash
   # Should show 39 files
   ls -1 docs/plans/archive/2025-11/ | wc -l

   # Should NOT show the moved files
   ls docs/plans/
   ```

4. **Commit**

   ```bash
   git commit -m "chore(docs): archive 39 completed plans to 2025-11

Archived all completed implementation plans from November 2025 to keep
the active plans directory clean and organized.

Plans archived:
- Persona generation (index + 3 phases)
- Review system (index + 4 phases)
- Core rulebook HTML (index + 2 phases + design)
- Documentation improvements (index + 3 phases)
- Various design documents and assessments

Total: 39 files moved to docs/plans/archive/2025-11/

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 5: Move Phase Summaries to Archive

**Files:**
- Move: `docs/plans/*-final-assessment.md` files to `docs/plans/archive/2025-11/`

**Steps:**

1. **Find phase summary files**

   ```bash
   ls docs/plans/*-final-assessment.md
   ```

2. **Move them to archive**

   ```bash
   git mv docs/plans/*-final-assessment.md docs/plans/archive/2025-11/
   ```

3. **Commit**

   ```bash
   git commit -m "chore(docs): archive phase assessment summaries

Moved phase final assessment documents to archive alongside their
corresponding implementation plans.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 6: Relocate Copyright Assessment to Legal Directory

**Files:**
- Create: `docs/legal/`
- Move: `docs/plans/copyright-assessment.md` to `docs/legal/copyright-assessment.md`

**Steps:**

1. **Create legal directory**

   ```bash
   mkdir -p docs/legal
   ```

2. **Move copyright assessment**

   ```bash
   git mv docs/plans/copyright-assessment.md docs/legal/copyright-assessment.md
   ```

3. **Update any references**

   Check if any other files reference this document:

   ```bash
   grep -r "copyright-assessment" docs/ --include="*.md"
   ```

   If found, update the paths to `docs/legal/copyright-assessment.md`

4. **Commit**

   ```bash
   git add docs/legal/copyright-assessment.md
   # Add any files with updated references
   git commit -m "chore(docs): relocate copyright assessment to legal directory

Moved copyright-assessment.md from plans/ to new legal/ directory for
better organization of legal documentation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 7: Move Testing Docs to Proper Directories

**Files:**
- Move: Testing-related docs from `docs/plans/` to `docs/workflows/` or appropriate location

**Steps:**

1. **Identify testing documentation**

   ```bash
   ls docs/plans/ | grep -i test
   ```

   Look for files like testing guidelines, test strategy docs, etc.

2. **Move to workflows directory**

   ```bash
   git mv docs/plans/[testing-doc].md docs/workflows/[testing-doc].md
   ```

3. **Update TESTING.md if it exists**

   If there's a root `TESTING.md`, ensure it references the new location.

4. **Commit**

   ```bash
   git add docs/workflows/
   git commit -m "chore(docs): relocate testing documentation to workflows

Moved testing documentation from plans/ to workflows/ directory where
it better fits with other process documentation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 8: Clean Review Directory

**Files:**
- Delete: `docs/reviews/user-instructions.md` (empty file)
- Move: Stale `.txt` files to `docs/reviews/archive/`

**Steps:**

1. **Check for empty file**

   ```bash
   wc -l docs/reviews/user-instructions.md
   ```

   If it's empty (0 lines or only whitespace):

2. **Remove empty file**

   ```bash
   git rm docs/reviews/user-instructions.md
   ```

3. **Find stale .txt files**

   ```bash
   ls docs/reviews/*.txt
   ```

4. **Archive them**

   ```bash
   mkdir -p docs/reviews/archive
   git mv docs/reviews/*.txt docs/reviews/archive/
   ```

5. **Commit**

   ```bash
   git commit -m "chore(docs): clean reviews directory

Removed empty user-instructions.md file and archived stale .txt files
to keep the reviews directory clean.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 9: Delete Duplicate Database Files

**Files:**
- Delete: Duplicate database files after verification

**Steps:**

1. **Find database files**

   ```bash
   find . -name "*.db" -not -path "*/node_modules/*"
   ```

   Expected to find:
   - `src/tooling/data/project.db` (correct location)
   - Possible duplicates in other locations

2. **Verify which is the active database**

   Check the codebase to see which database path is used:

   ```bash
   grep -r "\.db" src/tooling/ --include="*.ts" | grep -v test | grep -v node_modules
   ```

   The active database should be `src/tooling/data/project.db`

3. **Backup before deletion (safety)**

   ```bash
   cp [duplicate-db-path] /tmp/backup-db-before-delete.db
   ```

4. **Delete duplicates**

   ```bash
   git rm [duplicate-db-path]
   ```

5. **Run tests to ensure database still works**

   ```bash
   pnpm test src/tooling/database/
   ```

   Expected: All tests pass

6. **Commit**

   ```bash
   git commit -m "chore(database): remove duplicate database files

Removed duplicate database files. The canonical database location is
src/tooling/data/project.db as referenced in the codebase.

Verified all tests pass with single database file.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 10: Relocate verify-database.ts Script

**Files:**
- Move: `src/tooling/verify-database.ts` to `src/tooling/scripts/verify-database.ts`

**Steps:**

1. **Verify the scripts directory exists**

   ```bash
   ls src/tooling/scripts/
   ```

   If it doesn't exist:

   ```bash
   mkdir -p src/tooling/scripts
   ```

2. **Move the script**

   ```bash
   git mv src/tooling/verify-database.ts src/tooling/scripts/verify-database.ts
   ```

3. **Update any imports/references**

   Search for files that import or reference this script:

   ```bash
   grep -r "verify-database" src/ --include="*.ts" --include="*.json"
   ```

   Update paths from `./verify-database` to `./scripts/verify-database`

4. **Update package.json scripts if present**

   Check `package.json` for any scripts that run this file:

   ```bash
   grep "verify-database" package.json
   ```

   Update the path if found.

5. **Test the script still runs**

   ```bash
   pnpm tsx src/tooling/scripts/verify-database.ts
   ```

   Expected: Script runs successfully

6. **Commit**

   ```bash
   git add src/tooling/scripts/verify-database.ts package.json
   # Add any other files with updated imports
   git commit -m "chore(tooling): move verify-database to scripts directory

Relocated verify-database.ts to scripts/ subdirectory for better
organization of utility scripts. Updated all references.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 11: Populate PLAN.md with Current Status

**Files:**
- Modify: `PLAN.md`

**Steps:**

1. **Read the current INDEX.md for context**

   ```bash
   cat INDEX.md
   ```

2. **Update PLAN.md with current project status**

   Open `PLAN.md` and add content describing:
   - Current phase: Audit remediation
   - Completed work: Persona system, Review system, Core Rulebook HTML
   - In progress: Fixing 99 audit findings
   - Next up: User testing, iterative improvements

   Example structure:

   ```markdown
   # Razorweave Project Plan

   ## Current Status

   **Phase:** Quality Improvement (Audit Remediation)
   **Last Updated:** 2025-11-20

   ### Completed
   - ✅ Persona Generation System (automated test reader personas)
   - ✅ Review System (agentic book review with analysis)
   - ✅ Core Rulebook HTML (polished web version)

   ### In Progress
   - 🔄 Audit Remediation (99 findings from hygiene + code quality audits)
     - Phase 1: Quick Wins (15 tasks)
     - Phase 2: Critical Fixes (12 tasks)
     - Phase 3: Testing Infrastructure (18 tasks)
     - Phase 4: Code Standards (8 tasks)

   ### Upcoming
   - 📋 User testing with generated personas
   - 📋 Iterative content improvements based on feedback
   - 📋 Additional book development

   ## Milestones

   See `docs/plans/audit-remediation-index.md` for detailed remediation plan.
   ```

3. **Commit**

   ```bash
   git add PLAN.md
   git commit -m "docs: populate PLAN.md with current project status

Added current project status, completed work, in-progress audit
remediation, and upcoming milestones to PLAN.md.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 12: Update INDEX.md Database Location Reference

**Files:**
- Modify: `INDEX.md`

**Steps:**

1. **Read current INDEX.md**

   ```bash
   cat INDEX.md
   ```

2. **Find database location reference**

   Look for any mention of database file location.

3. **Update to correct path**

   Ensure it references `src/tooling/data/project.db` (not any old/wrong paths)

   Update the line to:

   ```markdown
   - **Project Database**: `src/tooling/data/project.db`
   ```

4. **Verify the path is correct**

   ```bash
   ls -lh src/tooling/data/project.db
   ```

   Expected: File exists and has reasonable size (> 0 bytes)

5. **Commit**

   ```bash
   git add INDEX.md
   git commit -m "docs: update database location reference in INDEX.md

Corrected database file path to src/tooling/data/project.db.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 13: Document maintenance/ and tools/ Package Purposes

**Files:**
- Create or Modify: `packages/maintenance/README.md`
- Create or Modify: `packages/tools/README.md`

**Steps:**

1. **Investigate maintenance package**

   ```bash
   ls packages/maintenance/
   cat packages/maintenance/package.json
   ```

   Determine what this package is for.

2. **Create README for maintenance**

   Create `packages/maintenance/README.md` with:

   ```markdown
   # Maintenance Package

   **Purpose:** [Describe what this package does]

   **Status:** [Active/Stub/Experimental]

   ## Contents

   [List main files/modules]

   ## Usage

   [How to use this package]
   ```

3. **Investigate tools package**

   ```bash
   ls packages/tools/
   cat packages/tools/package.json
   ```

4. **Create README for tools**

   Create `packages/tools/README.md` with similar structure.

5. **Commit**

   ```bash
   git add packages/maintenance/README.md packages/tools/README.md
   git commit -m "docs: document maintenance and tools package purposes

Added README files to maintenance and tools packages explaining their
purpose, status, and usage.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 14: Delete .DS_Store

**Files:**
- Delete: `.DS_Store` (macOS folder metadata file)

**Steps:**

1. **Find all .DS_Store files**

   ```bash
   find . -name ".DS_Store"
   ```

2. **Delete them**

   ```bash
   find . -name ".DS_Store" -delete
   ```

3. **Add to .gitignore if not already there**

   ```bash
   grep ".DS_Store" .gitignore
   ```

   If not found, add it:

   ```bash
   echo ".DS_Store" >> .gitignore
   ```

4. **Commit**

   ```bash
   git add .gitignore
   git commit -m "chore: remove .DS_Store and add to gitignore

Removed macOS system files and ensured they won't be committed in future.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Task 15: Generate AGENTS.md

**Files:**
- Create: `AGENTS.md`

**Steps:**

1. **Create AGENTS.md file**

   This file should contain instructions for AI agents working on the project.

   ```markdown
   # Agent Instructions

   Welcome, AI assistant! This document provides context and guidelines for working on the Razorweave project.

   ## Quick Start

   1. **Read First:**
      - `README.md` - Project overview
      - `INDEX.md` - File navigation
      - `PLAN.md` - Current status

   2. **Key Directories:**
      - `docs/` - All documentation
      - `src/tooling/` - TypeScript automation tools
      - `books/` - TTRPG content (markdown)
      - `data/` - Audits, personas, reviews

   3. **Before Making Changes:**
      - Run `pnpm test` to ensure tests pass
      - Run `pnpm lint` to check code style
      - Run `pnpm exec tsc --noEmit` to check types

   ## Project Context

   **What:** Razorweave is a TTRPG system with automated quality tooling

   **Tooling Architecture:**
   - Persona generation (test reader personas)
   - Review system (agentic book reviews)
   - Database (SQLite in `src/tooling/data/project.db`)

   **Tech Stack:**
   - TypeScript
   - Vitest (testing)
   - SQLite (database)
   - pnpm (package manager)

   ## Workflows

   - **Agentic Processes:** `docs/agents/AGENTIC_PROCESSES.md`
   - **End-to-End Pipeline:** `docs/workflows/END_TO_END_PIPELINE.md`
   - **Review System:** `docs/workflows/REVIEW_SYSTEM.md`

   ## Standards

   - **Style Guides:** `docs/style_guides/`
   - **File Naming:** kebab-case for files, PascalCase for types
   - **Commits:** Conventional commits (feat/fix/docs/chore/refactor/test)

   ## Testing

   - Tests in `src/tooling/**/*.test.ts`
   - Run specific test: `pnpm test path/to/test.ts`
   - Coverage target: 80%+

   ## Common Tasks

   ### Running the CLI

   ```bash
   pnpm tsx src/tooling/cli-commands/run.ts [command] [args]
   ```

   ### Database Operations

   ```bash
   # Verify database
   pnpm tsx src/tooling/scripts/verify-database.ts

   # Direct SQL
   sqlite3 src/tooling/data/project.db
   ```

   ### Linting & Validation

   ```bash
   # Run all linters
   pnpm lint

   # Fix auto-fixable issues
   pnpm lint:fix
   ```

   ## Current Focus

   See `PLAN.md` for current project status and priorities.

   ---

   **Questions?** Check `docs/` directory or ask the human developer.
   ```

2. **Save the file**

   Save to `AGENTS.md` in the project root.

3. **Commit**

   ```bash
   git add AGENTS.md
   git commit -m "docs: create AGENTS.md for AI assistant onboarding

Added comprehensive agent instructions document covering:
- Quick start and navigation
- Project context and architecture
- Workflows and standards
- Common tasks and commands

This provides AI assistants with essential context for working on
the Razorweave project.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Phase 1 Completion Checklist

After completing all 15 tasks, verify:

```bash
# ✅ Zero TypeScript errors
pnpm exec tsc --noEmit

# ✅ No linter errors (warnings are OK for now)
pnpm lint

# ✅ All tests still pass
pnpm test

# ✅ Root directory is clean
ls | grep -v "^node_modules$\|^packages$\|^src$\|^books$\|^data$\|^docs$\|^public$\|^dist$\|^\.git$\|\.md$\|\.json$\|\.lock$\|\.config\.\|^\.

" || echo "Root directory clean!"

# ✅ Key files exist
ls AGENTS.md PLAN.md INDEX.md
```

**Expected Results:**
- 0 TypeScript errors (down from 3)
- AGENTS.md exists
- PLAN.md populated
- INDEX.md updated
- 39 plans archived
- Root directory follows whitelist

---

## Moving to Phase 2

Once Phase 1 is complete:

1. Read `docs/plans/audit-remediation-P2.md`
2. Create todos for all 12 Phase 2 tasks
3. Choose a track (Logging, Testing, or Type Safety) or the sequential Error Handling track
4. Begin execution

---

**Phase 1 Status:** Ready for Execution
