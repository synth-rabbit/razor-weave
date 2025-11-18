# Validation Scripts Guide

This guide explains the validation system in Razorweave and how to use the various validation scripts.

## Overview

Razorweave uses validation scripts to ensure content quality, code standards, and documentation consistency. Validators run automatically via git hooks and can be run manually for quick feedback.

## Running Validation

### All Validators

```bash
pnpm validate
```

Runs all validation scripts in the correct order.

### Individual Validators

```bash
# Lint TypeScript
pnpm lint:ts

# Lint Markdown
pnpm lint:md

# Auto-fix linting issues
pnpm lint:fix

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## Available Validation Scripts

### TypeScript Linting

**Purpose:** Enforce TypeScript code quality standards

**Command:** `pnpm lint:ts`

**What it checks:**
- ESLint rules for TypeScript
- Code style consistency
- Potential bugs and anti-patterns
- Unused variables and imports

**Auto-fix:** `pnpm lint:fix`

**Configuration:** `.eslintrc.cjs` (extends `@razorweave/tooling/linters/eslint-config`)

### Markdown Linting

**Purpose:** Enforce markdown formatting standards

**Command:** `pnpm lint:md`

**What it checks:**
- Heading structure and hierarchy
- List formatting
- Link syntax
- Code block formatting
- Line length (informational)

**Configuration:** `.markdownlint.json` (from `@razorweave/tooling/linters/markdownlint-config`)

**Common issues:**
- Missing blank lines around headings
- Inconsistent list markers
- Trailing whitespace
- Multiple consecutive blank lines

### Plan Naming Validation

**Purpose:** Enforce plan file naming conventions

**Runs:** Automatically in pre-commit hook for plan files

**Formats allowed:**
- Index: `{topic-name}-index.md`
- Phase: `{topic-name}-P{N}.md` or `{topic-name}-P{N}-{step}.md`
- README: `README.md`

**Examples:**
- ✅ `documentation-improvements-index.md`
- ✅ `documentation-improvements-P1.md`
- ✅ `documentation-improvements-P2-structure.md`
- ❌ `my-plan.md` (no format indicator)
- ❌ `plan.md` (too generic)

**See:** `src/tooling/validators/plan-naming-validator.ts`

### Link Validation

**Purpose:** Verify internal documentation links

**Status:** Implemented (`src/tooling/validators/link-validator.ts`)

**Command:** `scripts/review/validate-links.sh` (when integrated)

**What it checks:**
- All markdown links are valid
- Referenced files exist
- No broken cross-references
- Anchor links point to existing headings

**Planned integration:** Add to pre-commit hook

### Mechanics Validation (Planned)

**Purpose:** Validate game mechanics consistency

**Script:** `scripts/review/validate-mechanics.sh`

**Status:** Design phase

**What it will check:**
- Mechanics terminology consistency
- Rule references are valid
- Stat blocks follow format
- Dice notation is correct

### Term Extraction (Analysis)

**Purpose:** Extract glossary terms from content

**Script:** `scripts/review/extract-terms.py`

**Status:** Utility script

**Usage:**
```bash
python scripts/review/extract-terms.py books/core/v1/manuscript/
```

**Output:** List of terms that may need glossary entries

## Validation in Git Hooks

Validation runs automatically in the pre-commit hook:

### What Runs

1. **TypeScript linting** on staged `.ts` files
2. **Markdown linting** on staged `.md` files
3. **Tests** (full test suite)
4. **Plan naming validation** on files in `docs/plans/`

### Commit Blocked If:
- Any linting errors
- Any test failures
- Invalid plan naming

### Example Output

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

✨ All pre-commit checks passed!
```

**See:** [Git Hooks Guide](GIT_HOOKS.md) for details

## Common Validation Errors

### ESLint Errors

**Error:** `'variable' is defined but never used`

**Solution:**
- Remove unused variables
- Or prefix with `_` if intentionally unused (rare)

**Error:** `Missing return type on function`

**Solution:** Add explicit return type annotation

```typescript
// Before
export function myFunc() {
  return "value";
}

// After
export function myFunc(): string {
  return "value";
}
```

### Markdownlint Errors

**Error:** `MD022/blanks-around-headings`

**Solution:** Add blank lines before and after headings

```markdown
<!-- Before -->
Some text
## Heading
More text

<!-- After -->
Some text

## Heading

More text
```

**Error:** `MD029/ol-prefix`

**Solution:** Use consistent list numbering

```markdown
<!-- Use this -->
1. First
2. Second
3. Third

<!-- Not this -->
1. First
1. Second
1. Third
```

### Plan Naming Errors

**Error:** `Plan filename does not follow naming convention`

**Solution:** Rename to match format

```bash
# Wrong
mv docs/plans/myplan.md docs/plans/documentation-P1.md

# Right
mv docs/plans/myplan.md docs/plans/documentation-improvements-P1.md
```

## Troubleshooting

### Tests fail but pass locally

**Cause:** Different environment or stale cache

**Solutions:**
```bash
# Clear caches
pnpm clean
rm -rf node_modules
pnpm install

# Run fresh build
pnpm build
pnpm test
```

### Linting takes too long

**Cause:** Linting entire codebase

**Solution:** Lint only changed files (git hooks do this automatically)

### Validation script fails

**Cause:** Script dependencies not installed

**Solution:**
```bash
# Reinstall dependencies
pnpm install

# Rebuild tooling package
pnpm --filter @razorweave/tooling build
```

## Adding New Validators

### 1. Create validator implementation

```typescript
// src/tooling/validators/my-validator.ts
import { ValidationResult } from './types.js';

export function validateMyThing(input: string): ValidationResult {
  if (/* validation logic */) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Specific error message with fix suggestion'
  };
}
```

### 2. Write tests

```typescript
// src/tooling/validators/my-validator.test.ts
import { describe, it, expect } from 'vitest';
import { validateMyThing } from './my-validator.js';

describe('validateMyThing', () => {
  it('accepts valid input', () => {
    const result = validateMyThing('valid-input');
    expect(result.valid).toBe(true);
  });

  it('rejects invalid input', () => {
    const result = validateMyThing('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('error message');
  });
});
```

### 3. Integrate with hooks (optional)

Add to `src/tooling/hooks/git/pre-commit.ts` if validation should run on commit.

### 4. Test

```bash
pnpm --filter @razorweave/tooling build
pnpm --filter @razorweave/tooling test
```

## Related Documentation

- **[Git Hooks Guide](GIT_HOOKS.md)** - Automatic validation triggers
- **[Getting Started](../GETTING_STARTED.md)** - Setup and commands
- **[AGENTS.md](../../AGENTS.md)** - Validation as simple agents

## Summary

Razorweave validation ensures:

- ✅ Code meets TypeScript standards
- ✅ Markdown follows formatting rules
- ✅ Plan files follow naming conventions
- ✅ Tests pass before commits
- ✅ Links are valid (planned)
- ✅ Mechanics are consistent (planned)

Validation runs automatically via git hooks, providing fast feedback and maintaining project quality.
