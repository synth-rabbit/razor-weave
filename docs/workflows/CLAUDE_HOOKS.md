# Claude Code Hooks Guide

This guide explains how Razorweave integrates with Claude Code using custom hooks to enhance the development experience.

## Overview

Claude Code hooks extend Claude with project-specific intelligence, providing context, validation, and automatic tracking. These hooks run automatically during Claude Code sessions without any manual intervention.

**Location:** `.claude/hooks/`

**Implementation:** Hooks are implemented in TypeScript (`src/tooling/hooks/claude/`) and wrapped in thin `.ts` files in `.claude/hooks/`

## Installation

Claude Code hooks are installed automatically when you run:

```bash
pnpm setup
```

This creates hook files in `.claude/hooks/` that reference implementations in `src/tooling/hooks/claude/`.

## Available Hooks

### session_start

**Trigger:** When Claude Code session starts

**Purpose:** Provide project context and status at the beginning of each session

**What it does:**

1. **Displays PROMPT.md context**
   - Reads `PROMPT.md` file (if exists)
   - Shows `## Context` section (current focus area)
   - Shows `## Instructions` section (active tasks)

2. **Shows project status**
   - Counts workspace packages
   - Lists active implementation plans
   - Provides overview of current work

3. **Lists available style guides**
   - TypeScript style guide
   - Book writing style guide
   - Git commit conventions

**Example output:**

```
🚀 Razorweave Session Starting...

📋 Session Context:
Working on documentation improvements Phase 3

📝 Active Instructions:
Create tool documentation for Claude hooks and validation scripts

📊 Project Status:
- Packages: 8
- Active Plans: 2

  Active:
  - documentation-improvements
  - core-rulebook-review

📚 Available Style Guides:
- TypeScript: docs/style_guides/typescript/README.md
- Book Writing: docs/style_guides/book/writing-style-guide.md
- Git Conventions: docs/style_guides/git/commit-conventions.md

✨ Ready to work!
```

**Configuration:**

Create or update `PROMPT.md` in project root:

```markdown
## Context
Brief description of what you're currently working on

## Instructions
Specific tasks or focus areas for this session
```

### before_tool_call

**Trigger:** Before Claude executes any tool (Write, Edit, Read, Bash, etc.)

**Purpose:** Pre-validate operations and provide helpful context

**What it does:**

1. **Warns about critical file modifications**
   - Alerts when editing AGENTS.md, INDEX.md, PLAN.md, README.md
   - Notes that these may be auto-updated by git hooks

2. **Shows relevant style guide**
   - When creating markdown files, displays appropriate style guide path
   - Matches file location to style guide (plans, workflows, books, etc.)

3. **Validates plan naming**
   - Enforces plan naming conventions for files in `docs/plans/`
   - Blocks creation if name doesn't follow `YYYY-MM-DD-description.md` format
   - Allows index files and README.md

4. **Suggests test creation**
   - When creating `.ts` files, checks if `.test.ts` exists
   - Suggests creating tests for new TypeScript files

**Example output (plan validation):**

```
✅ Plan naming validated: Date-prefixed plan
```

**Example output (critical file warning):**

```
⚠️  Modifying critical file: AGENTS.md
    (This file is auto-updated by post-commit hook)
```

**Example output (blocking invalid plan name):**

```
❌ Invalid plan filename
Plan files must follow: YYYY-MM-DD-description.md

Examples:
  ✓ 2025-11-18-project-database.md
  ✓ 2025-11-18-feature-name-P1.md
  ✗ myplan.md
  ✗ project-database.md
```

### after_tool_call

**Trigger:** After Claude successfully executes a tool

**Purpose:** Track changes, create snapshots, and provide feedback

**What it does:**

1. **Logs successful file writes**
   - Shows confirmation when files are created
   - Displays: `✅ Created: path/to/file.ts`

2. **Logs successful file edits**
   - Shows confirmation when files are updated
   - Displays: `✏️  Updated: path/to/file.ts`

3. **Tracks test execution results**
   - Monitors bash commands for test runs
   - Reports test pass/fail status
   - Displays: `✅ Tests passed` or `⚠️  Tests failed`

4. **Snapshots book/chapter changes**
   - Automatically creates database snapshots for files in `books/` directory
   - Snapshots are marked with source `'claude'`
   - Displays: `📸 Snapshotted: books/core/chapter-1.md`

5. **Archives generated artifacts**
   - Stores files in `data/` directory (except database) to artifacts table
   - Tracks generated content for version history
   - Displays: `📦 Archived: data/analysis/results.json`

**Example output (file operations):**

```
✅ Created: src/agents/content/generator.ts
📸 Snapshotted: books/core/v1/manuscript/chapters/01-intro.md
✅ Tests passed
```

**Database integration:**

After-tool-call hook uses the project database to:
- Create chapter snapshots automatically
- Store generated artifacts
- Track content modifications

**See:** [Project Database Guide](PROJECT_DATABASE.md) for details

### user_prompt_submit

**Trigger:** When user submits a prompt to Claude

**Purpose:** Enhance prompts with project context (future feature)

**Current status:** Pass-through (no modification)

**Planned enhancements:**

- Expand shorthand commands (e.g., "fix tests" → "run tests, fix failures, verify passing")
- Add missing context from PROMPT.md
- Clarify ambiguous requests based on project state
- Suggest related tasks from active plans

**Implementation note:** This hook is ready for LLM-based prompt optimization when `@razorweave/shared` LLMClient is available.

## Hook Configuration

All hooks are configured via `.claude/hooks/` directory:

```
.claude/
  hooks/
    session_start.ts        - Session initialization
    before_tool_call.ts     - Pre-execution validation
    after_tool_call.ts      - Post-execution tracking
    user_prompt_submit.ts   - Prompt enhancement (future)
```

Each hook file is a thin wrapper that imports from the actual implementation:

```typescript
// .claude/hooks/session_start.ts
import { sessionStart } from '@razorweave/tooling/hooks/claude'
export default async function() { await sessionStart() }
```

## Integration with Database

Claude Code hooks integrate tightly with the project database:

### session_start
- **Reads:** Active plans from database and filesystem
- **Displays:** Current project state

### after_tool_call
- **Writes:** Chapter snapshots (marked as `source: 'claude'`)
- **Writes:** Artifact records for generated content
- **Tracks:** File modifications over time

**Why database integration matters:**

1. **Content history:** Every Claude-generated chapter edit is snapshotted
2. **Artifact tracking:** Generated files are cataloged for analysis
3. **Recovery:** Can restore previous versions if needed
4. **Analytics:** Track Claude's contributions to the project

**See:** [Project Database Guide](PROJECT_DATABASE.md) for query examples

## Troubleshooting

### Hook not running

**Symptoms:** No output from hooks during Claude Code session

**Causes & Solutions:**

1. **Hooks not installed**
   ```bash
   # Re-run setup
   pnpm setup
   ```

2. **Check hook files exist**
   ```bash
   ls -la .claude/hooks/
   ```

3. **Verify tooling package built**
   ```bash
   pnpm --filter @razorweave/tooling build
   ```

### "Plan filename does not follow naming convention"

**Cause:** Creating plan file without proper date prefix

**Solution:** Use format `YYYY-MM-DD-description.md`

```bash
# Wrong
docs/plans/my-feature.md

# Right
docs/plans/2025-11-18-my-feature.md
```

**Exception:** Index files and README.md are allowed

### Snapshot creation fails

**Symptoms:** Error when modifying book files

**Causes & Solutions:**

1. **Database locked**
   - Wait for other operations to complete
   - Close database connections in other tools

2. **File permissions**
   - Check `src/tooling/data/project.db` is writable
   - Verify file exists: `ls -la src/tooling/data/project.db`

3. **Database error**
   - Run verification: `pnpm --filter @razorweave/tooling exec tsx scripts/verify-database.ts`

### PROMPT.md not found warning

**Cause:** No PROMPT.md file in project root

**Solution:** Create one to set session context:

```markdown
## Context
Working on Phase 3 documentation

## Instructions
Create guides for Claude hooks and validation scripts
```

**Note:** This is informational, not an error. PROMPT.md is optional.

## Disabling Hooks

To temporarily disable hooks:

1. **Rename .claude directory:**
   ```bash
   mv .claude .claude.disabled
   ```

2. **Re-enable:**
   ```bash
   mv .claude.disabled .claude
   ```

**Better alternative:** Fix the issue causing problems instead of disabling hooks.

## Adding Custom Hooks

### 1. Create implementation in tooling package

```typescript
// src/tooling/hooks/claude/my-custom-hook.ts
export async function myCustomHook(args: unknown): Promise<void> {
  console.log('🎯 Running my custom hook');
  // Your logic here
}
```

### 2. Export from index

```typescript
// src/tooling/hooks/claude/index.ts
export * from './my-custom-hook.js';
```

### 3. Add to setup script

```typescript
// src/tooling/scripts/setup-hooks.ts
await createClaudeHook(claudeHooksDir, 'my_custom_hook.ts', `
import { myCustomHook } from '@razorweave/tooling/hooks/claude'
export default async function(args: unknown) {
  return await myCustomHook(args)
}
`);
```

### 4. Rebuild and run setup

```bash
pnpm --filter @razorweave/tooling build
pnpm setup
```

## Performance Notes

Claude Code hooks add minimal overhead:

- **session_start:** ~200-500ms (runs once per session)
- **before_tool_call:** <50ms (pre-validation only)
- **after_tool_call:** ~100-300ms (includes database writes)
- **user_prompt_submit:** <10ms (currently pass-through)

**Performance tips:**

- Keep hook logic simple and fast
- Use async operations for database writes
- Cache expensive computations
- Avoid network requests in hooks

## Related Documentation

- **[AGENTS.md](../../AGENTS.md)** - Overview of all agentic systems
- **[Git Hooks Guide](GIT_HOOKS.md)** - Git-based automation
- **[Project Database](PROJECT_DATABASE.md)** - Database integration
- **[Getting Started](../GETTING_STARTED.md)** - Initial setup

## Summary

Claude Code hooks enhance the development experience by:

- ✅ Providing session context automatically
- ✅ Validating operations before execution
- ✅ Tracking all file changes
- ✅ Creating automatic content snapshots
- ✅ Suggesting relevant style guides
- ✅ Integrating with project database
- 📋 Prompt enhancement (planned)

They run transparently, requiring no manual intervention, while ensuring quality and maintaining comprehensive project history.
