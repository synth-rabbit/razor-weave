# Git Hooks Guide

This guide explains the git hooks system in Razorweave, what they enforce, and how to work with them effectively.

## Overview

Razorweave uses git hooks to automatically enforce code quality, run tests, and maintain project consistency. Hooks are installed automatically when you run `pnpm setup` and execute automatically at specific points in your git workflow.

## Installation

Git hooks are installed by running:

```bash
pnpm setup
```

This command:

1. Installs husky (git hooks framework)
2. Creates hook files in `.husky/` directory
3. Configures git to use these hooks

You should see output like:

```
📦 Installing git hooks...
✅ Git hooks installed
```

## Available Hooks

### pre-commit

**Trigger:** Before each commit is created

**Purpose:** Ensure code quality and prevent broken commits

**What it does:**

1. **Lints staged files**
   - TypeScript files: ESLint checks
   - Markdown files: Markdownlint checks
   - Blocks commit if linting fails

2. **Runs tests**
   - Executes `pnpm test`
   - Blocks commit if any test fails

3. **Validates plan naming** (if committing plan files)
   - Checks files in `docs/plans/`
   - Enforces naming conventions (kebab-case, date prefixes)
   - Blocks commit if validation fails

4. **Creates content snapshots** (if committing book files)
   - Snapshots files in `books/` directory
   - Stores in project database for version history
   - Does NOT block commit if snapshot fails (warns only)

**Example output:**

```
🎣 Running pre-commit checks...

🔍 Linting TypeScript...
✅ TypeScript linting passed

🔍 Linting Markdown...
✅ Markdown linting passed

🧪 Running tests...
✅ Tests passed

📋 Validating plan naming...
✅ Plan naming validated

📸 Creating pre-commit snapshots...
  ✓ books/core-rulebook/chapter-1.md
  ✓ books/core-rulebook/chapter-2.md

✨ All pre-commit checks passed!
```

**Common failures:**

| Error | Cause | Solution |
|-------|-------|----------|
| `❌ Linting failed` | Code doesn't meet style standards | Run `pnpm lint:fix` to auto-fix |
| `❌ Tests failed` | Breaking changes or test issues | Fix failing tests before committing |
| `❌ Invalid plan name` | Plan file doesn't follow conventions | Rename to match: `YYYY-MM-DD-description.md` |

### commit-msg

**Trigger:** After commit message is written, before commit is created

**Purpose:** Enforce consistent commit message format

**Format required:**

```
emoji type(scope): subject

Examples:
✨ feat(agents): add content generator
🐛 fix(api): resolve race condition
📝 docs(readme): update installation instructions
```

**Valid emoji-type pairs:**

| Emoji | Type | Usage |
|-------|------|-------|
| ✨ | `feat` | New features |
| 🐛 | `fix` | Bug fixes |
| 📝 | `docs` | Documentation changes |
| ♻️ | `refactor` | Code refactoring |
| 🎨 | `style` | Code style/formatting |
| ⚡ | `perf` | Performance improvements |
| 🔧 | `chore` | Build/tooling changes |
| 🧪 | `test` | Test additions/changes |
| 🚀 | `release` | Release commits |
| 🗑️ | `remove` | Removing code/features |

**Scope rules:**

- Lowercase letters, numbers, dots, hyphens allowed
- Examples: `auth`, `api`, `ui.components`, `db-migrations`

**Example output (success):**

```
✅ Commit message validated
```

**Example output (failure):**

```
❌ Invalid commit message format

Commit message must follow format: emoji type(scope): subject

Example: ✨ feat(agents): add content generator

Valid emojis and types:
  ✨ feat
  🐛 fix
  📝 docs
  ...
```

**Common failures:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Emoji does not match type` | Wrong emoji for type | Use correct emoji (e.g., ✨ for `feat`) |
| `must follow format` | Missing emoji, type, or scope | Include all parts: `emoji type(scope): subject` |
| Invalid scope characters | Uppercase or invalid chars | Use lowercase and hyphens only |

### post-commit

**Trigger:** After commit is successfully created

**Purpose:** Update derived files and track commit in database

**What it does:**

1. **Updates AGENTS.md** (if `src/agents/` files changed)
   - Regenerates agent documentation
   - Reflects latest agent code

2. **Resets PROMPT.md**
   - Clears context and instructions
   - Prepares for next work session

3. **Marks snapshots as committed**
   - Updates database with commit SHA
   - Links snapshots to specific commits

4. **Updates state database**
   - Records last commit SHA
   - Records commit timestamp

5. **Amends commit** (if AGENTS.md or PROMPT.md changed)
   - Automatically includes updated files
   - Uses `git commit --amend --no-edit --no-verify`

**Example output:**

```
🎣 Running post-commit updates...

✅ Updated AGENTS.md
✅ Reset PROMPT.md
✅ Marked snapshots as committed: a1b2c3d

📦 Amending commit with updated files...
✅ Commit amended with documentation updates

✨ Post-commit complete!
```

**Important notes:**

- This hook runs automatically - no user action needed
- Amending is safe because commit hasn't been pushed yet
- If AGENTS.md or PROMPT.md don't need updates, no amend occurs

### post-checkout

**Trigger:** After checking out a branch or commit

**Purpose:** Display context for the checked-out branch

**What it does:**

1. Reads `PROMPT.md` if it exists
2. Displays `## Context` section
3. Displays `## Instructions` section
4. Warns if PROMPT.md doesn't exist

**Example output (with PROMPT.md):**

```
📋 Current Context:
Working on authentication system

📝 Active Instructions:
Implement OAuth2 flow with refresh tokens
```

**Example output (without PROMPT.md):**

```
⚠️  PROMPT.md not found
```

**Use case:**

PROMPT.md is used to maintain context when switching between branches. You can create it to remind yourself (or Claude Code) what you're working on.

## Integration with Tooling Package

All hooks are implemented in the `@razorweave/tooling` package:

- **Hook scripts:** `.husky/pre-commit`, etc. (shell wrappers)
- **Implementation:** `src/tooling/hooks/git/pre-commit.ts`, etc. (TypeScript logic)

This architecture allows:

- Testing hooks as regular TypeScript code
- Sharing hook logic across tools
- Version control of hook implementations

## Troubleshooting Hook Failures

### Pre-commit failures

**Linting errors:**

```bash
# Auto-fix linting issues
pnpm lint:fix

# Check what's wrong
pnpm lint
```

**Test failures:**

```bash
# Run tests with details
pnpm test

# Run specific test file
pnpm test path/to/test.test.ts
```

**Plan naming errors:**

```bash
# Rename plan file to match convention
# Format: YYYY-MM-DD-description.md or YYYY-MM-DD-description-PN.md
mv docs/plans/myplan.md docs/plans/2025-11-18-my-plan.md
```

### Commit message failures

**Fix emoji mismatch:**

```bash
# If you used wrong emoji, amend commit message
git commit --amend

# Change first line to use correct emoji-type pair
```

**Fix format:**

```bash
# Ensure format is: emoji type(scope): subject
# Example: ✨ feat(auth): add login
git commit --amend
```

### Post-commit issues

**Amend conflicts:**

If post-commit amend fails:

```bash
# Check status
git status

# If conflicts, resolve and commit
git add .
git commit
```

## Bypassing Hooks (Not Recommended)

You can bypass hooks with:

```bash
git commit --no-verify
```

**When to use:**

- Emergency hotfixes
- Debugging hook issues
- Temporary WIP commits you'll fix later

**When NOT to use:**

- Regular development (hooks exist for good reasons)
- Commits you plan to push
- "I don't feel like fixing tests"

**Warning:** Bypassing hooks can introduce broken code to the repository. Use sparingly.

## Disabling Hooks

To temporarily disable hooks:

```bash
# Remove git hooks configuration
git config core.hooksPath /dev/null
```

To re-enable:

```bash
# Restore hooks
git config core.hooksPath .husky
```

**Better alternative:** Fix the hook issue instead of disabling them.

## Adding New Hooks

To add a new git hook:

1. **Create TypeScript implementation:**
   ```typescript
   // src/tooling/hooks/git/my-hook.ts
   export async function myHook(): Promise<void> {
     // Hook logic here
   }
   ```

2. **Add to setup script:**
   ```typescript
   // src/tooling/scripts/setup-hooks.ts
   await createGitHook(projectRoot, 'my-hook', `#!/bin/sh
   pnpm --filter @razorweave/tooling exec tsx hooks/git/my-hook.ts
   `);
   ```

3. **Write tests:**
   ```typescript
   // src/tooling/hooks/git/my-hook.test.ts
   import { describe, it, expect } from 'vitest';
   import { myHook } from './my-hook.js';
   ```

4. **Run setup:**
   ```bash
   pnpm setup
   ```

## Performance Notes

Hooks add time to git operations:

- **pre-commit:** 5-30 seconds (tests + linting)
- **commit-msg:** <1 second (validation only)
- **post-commit:** 1-5 seconds (database + file updates)
- **post-checkout:** <1 second (display only)

To minimize impact:

- Keep tests fast
- Run `pnpm test` before committing (catch issues early)
- Use `pnpm lint:fix` before committing (fix issues early)

## Related Documentation

- **[Getting Started](../GETTING_STARTED.md)** - Initial setup including hooks
- **[Project Database](PROJECT_DATABASE.md)** - How hooks use the database
- **[Validation Scripts](VALIDATION.md)** - What validation runs in hooks

## Summary

Git hooks in Razorweave ensure:

- ✅ Code passes linting and formatting standards
- ✅ All tests pass before committing
- ✅ Commit messages are consistent
- ✅ Content history is tracked in database
- ✅ Derived documentation stays up to date

They run automatically and help maintain project quality with minimal manual effort.
