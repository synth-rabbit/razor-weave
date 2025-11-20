# Linting and Style Guides - Phase 1: Tooling Package Setup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create @razorweave/tooling workspace package with linter configurations, validators, and setup scripts.

**Architecture:** New workspace package in src/tooling/ containing all linting, validation, and automation code. Exports configurations and utilities used by git/Claude hooks.

**Tech Stack:** TypeScript, ESLint, Prettier, Markdownlint, Zod (validation), Node.js fs/path APIs

---

## Task 1: Create Tooling Package Structure

**Files:**
- Create: `src/tooling/package.json`
- Create: `src/tooling/tsconfig.json`
- Create: `src/tooling/README.md`
- Create: `src/tooling/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "@razorweave/tooling",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Linting, validation, and development tooling for Razorweave",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./linters/eslint-config": "./dist/linters/eslint-config.js",
    "./linters/prettier-config": "./dist/linters/prettier-config.js",
    "./linters/markdownlint-config": "./dist/linters/markdownlint-config.js",
    "./hooks/git": "./dist/hooks/git/index.js",
    "./hooks/claude": "./dist/hooks/claude/index.js"
  },
  "scripts": {
    "build": "tsc --build",
    "build:watch": "tsc --build --watch",
    "clean": "rm -rf dist tsconfig.tsbuildinfo",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@razorweave/shared": "workspace:*",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4",
    "markdownlint-cli2": "^0.12.1",
    "glob": "^10.3.10",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "."
  },
  "references": [
    { "path": "../shared" }
  ],
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create README.md**

```markdown
# @razorweave/tooling

Linting, validation, and development tooling for Razorweave.

## Purpose

Provides all development tooling including:
- Linter configurations (ESLint, Prettier, Markdownlint)
- Content validators (documentation structure, links, consistency)
- Git hooks (pre-commit, post-commit, etc.)
- Claude hooks (SessionStart, BeforeToolCall, etc.)
- Auto-updaters (AGENTS.md, INDEX.md, etc.)

## Development

```bash
pnpm build
pnpm build:watch
pnpm typecheck
```
```

**Step 4: Create directory structure**

Run:
```bash
cd src/tooling
mkdir -p linters validators hooks/{git,claude} updaters scripts
```

**Step 5: Create placeholder index.ts**

```typescript
// Tooling package exports
// Sub-modules are exported via package.json exports field

export {};
```

**Step 6: Install dependencies**

Run: `pnpm install`
Expected: Dependencies installed, workspace linked to @razorweave/shared

**Step 7: Build to verify structure**

Run: `pnpm --filter @razorweave/tooling build`
Expected: Build succeeds, dist/ directory created

**Step 8: Commit**

```bash
git add src/tooling/
git commit -m "✨ feat(tooling): create tooling package structure"
```

---

## Task 2: Implement ESLint Configuration

**Files:**
- Create: `src/tooling/linters/eslint-config.ts`
- Create: `src/tooling/linters/index.ts`

**Step 1: Create eslint-config.ts**

```typescript
// ESLint configuration for TypeScript code
export const eslintConfig = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // Enforce ESM (no require())
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="require"]',
        message: 'Use ESM imports instead of require()',
      },
    ],

    // Strict type safety
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' },
    ],

    // Code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
```

**Step 2: Create linters/index.ts**

```typescript
export * from './eslint-config.js';
export * from './prettier-config.js';
export * from './markdownlint-config.js';
```

**Step 3: Build and verify**

Run: `pnpm --filter @razorweave/tooling build`
Expected: Builds successfully, dist/linters/eslint-config.js created

**Step 4: Commit**

```bash
git add src/tooling/linters/
git commit -m "✨ feat(tooling): add ESLint configuration"
```

---

## Task 3: Implement Prettier Configuration

**Files:**
- Create: `src/tooling/linters/prettier-config.ts`

**Step 1: Create prettier-config.ts**

```typescript
// Prettier configuration for code formatting
export const prettierConfig = {
  semi: true,
  trailingComma: 'es5' as const,
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'avoid' as const,
};
```

**Step 2: Build and verify**

Run: `pnpm --filter @razorweave/tooling build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/tooling/linters/prettier-config.ts
git commit -m "✨ feat(tooling): add Prettier configuration"
```

---

## Task 4: Implement Markdownlint Configuration

**Files:**
- Create: `src/tooling/linters/markdownlint-config.ts`

**Step 1: Create markdownlint-config.ts**

```typescript
// Markdownlint configuration
export const markdownlintConfig = {
  // Disable line length (prioritize depth and clarity)
  MD013: false,

  // Enforce heading structure
  MD001: true, // Heading levels increment by one
  MD003: { style: 'atx' }, // Use # style headings

  // Enforce list consistency
  MD004: { style: 'dash' }, // Use - for unordered lists
  MD007: { indent: 2 }, // Unordered list indentation

  // Enforce link/image consistency
  MD034: true, // No bare URLs
  MD052: true, // Reference links should have labels

  // Enforce code block consistency
  MD040: true, // Fenced code blocks should have language
};
```

**Step 2: Build and verify**

Run: `pnpm --filter @razorweave/tooling build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/tooling/linters/markdownlint-config.ts
git commit -m "✨ feat(tooling): add Markdownlint configuration"
```

---

## Task 5: Implement Plan Naming Validator

**Files:**
- Create: `src/tooling/validators/plan-naming-validator.ts`
- Create: `src/tooling/validators/types.ts`
- Create: `src/tooling/validators/index.ts`

**Step 1: Create types.ts**

```typescript
// Shared types for validators
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  format?: string;
  metadata?: Record<string, any>;
}

export interface ValidationError {
  type: 'structure' | 'link' | 'completeness' | 'consistency';
  message: string;
  line?: number;
}
```

**Step 2: Create plan-naming-validator.ts**

```typescript
import { ValidationResult } from './types.js';

/**
 * Validates plan file naming conventions
 *
 * Formats:
 * - Index: {topic-name}-index.md
 * - Phase: {topic-name}-P{phase-number}[-{phase-step}].md
 * - Tangent: {topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md
 */
export function validatePlanNaming(filePath: string): ValidationResult {
  // Must be in docs/plans/
  if (!filePath.startsWith('docs/plans/')) {
    return {
      valid: false,
      error: 'Plan files must be in docs/plans/ directory',
    };
  }

  const filename = filePath.split('/').pop()!;
  const nameWithoutExt = filename.replace('.md', '');

  // Format 1: Index file
  // Pattern: {topic-name}-index.md
  const indexPattern = /^[a-z0-9-]+-index$/;
  if (indexPattern.test(nameWithoutExt)) {
    return { valid: true, format: 'index' };
  }

  // Format 2: Phase file
  // Pattern: {topic-name}-P{phase-number}[-{phase-step}].md
  const phasePattern = /^([a-z0-9-]+)-P(\d+)(?:-([a-z0-9-]+))?$/;
  const phaseMatch = nameWithoutExt.match(phasePattern);
  if (phaseMatch) {
    const [, topicName, phaseNum, phaseStep] = phaseMatch;
    return {
      valid: true,
      format: 'phase',
      metadata: { topicName, phaseNum: parseInt(phaseNum), phaseStep },
    };
  }

  // Format 3: Tangent file
  // Pattern: {topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md
  const tangentPattern = /^([a-z0-9-]+)-P(\d+)-([a-z0-9-]+)(?:-([a-z0-9-]+))?$/;
  const tangentMatch = nameWithoutExt.match(tangentPattern);
  if (tangentMatch) {
    const [, topicName, phaseNum, tangentName, tangentStep] = tangentMatch;
    return {
      valid: true,
      format: 'tangent',
      metadata: { topicName, phaseNum: parseInt(phaseNum), tangentName, tangentStep },
    };
  }

  // Invalid format
  return {
    valid: false,
    error: `Plan filename must follow one of these formats:
- Index: {topic-name}-index.md
- Phase: {topic-name}-P{phase-number}[-{phase-step}].md
- Tangent: {topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md

Examples:
- typescript-setup-index.md
- typescript-setup-P1.md
- typescript-setup-P1-initial-config.md
- typescript-setup-P2-linting.md
- typescript-setup-P2-linting-eslint-setup.md`,
  };
}
```

**Step 3: Create validators/index.ts**

```typescript
export * from './types.js';
export * from './plan-naming-validator.js';
```

**Step 4: Write test for plan naming validator**

Create: `src/tooling/validators/plan-naming-validator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validatePlanNaming } from './plan-naming-validator.js';

describe('validatePlanNaming', () => {
  it('validates index file format', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-index.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('index');
  });

  it('validates phase file format without step', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-P1.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('phase');
    expect(result.metadata?.phaseNum).toBe(1);
  });

  it('validates phase file format with step', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-P1-initial-config.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('phase');
    expect(result.metadata?.phaseNum).toBe(1);
    expect(result.metadata?.phaseStep).toBe('initial-config');
  });

  it('validates tangent file format without step', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-P2-linting.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('tangent');
    expect(result.metadata?.tangentName).toBe('linting');
  });

  it('validates tangent file format with step', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-P2-linting-eslint.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('tangent');
    expect(result.metadata?.tangentStep).toBe('eslint');
  });

  it('rejects files not in docs/plans/', () => {
    const result = validatePlanNaming('plans/test.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('docs/plans/');
  });

  it('rejects invalid format', () => {
    const result = validatePlanNaming('docs/plans/invalid-name.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must follow one of these formats');
  });
});
```

**Step 5: Run test to verify it fails**

Run: `pnpm --filter @razorweave/tooling test`
Expected: Tests fail (vitest not configured yet)

**Step 6: Add vitest config**

Create: `src/tooling/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

Update `src/tooling/package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 7: Run tests again**

Run: `pnpm --filter @razorweave/tooling test`
Expected: All tests pass

**Step 8: Build and commit**

```bash
pnpm --filter @razorweave/tooling build
git add src/tooling/validators/
git commit -m "✨ feat(tooling): add plan naming validator with tests"
```

---

## Task 6: Implement Link Validator

**Files:**
- Create: `src/tooling/validators/link-validator.ts`

**Step 1: Write test for link validator**

Create: `src/tooling/validators/link-validator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateLinks } from './link-validator.js';

describe('validateLinks', () => {
  it('finds no errors in valid markdown links', async () => {
    const content = '[Valid Link](./existing-file.md)';
    const errors = await validateLinks(content, 'test.md');
    expect(errors).toHaveLength(0);
  });

  it('detects broken internal links', async () => {
    const content = '[Broken Link](./nonexistent.md)';
    const errors = await validateLinks(content, 'test.md');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('link');
    expect(errors[0].message).toContain('Broken link');
  });

  it('skips external URLs', async () => {
    const content = '[External](https://example.com)';
    const errors = await validateLinks(content, 'test.md');
    expect(errors).toHaveLength(0);
  });

  it('validates anchor links', async () => {
    const content = '[Anchor](./existing-file.md#some-heading)';
    const errors = await validateLinks(content, 'test.md');
    // Will fail if anchor doesn't exist
    expect(errors[0]?.type).toBe('link');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @razorweave/tooling test link-validator`
Expected: FAIL - validateLinks not defined

**Step 3: Implement link-validator.ts**

```typescript
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { ValidationError } from './types.js';

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

export async function validateLinks(
  content: string,
  filePath: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const fileDir = dirname(filePath);
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const [, , url] = match;

    // Skip external URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      continue;
    }

    // Skip mailto and other protocols
    if (url.includes(':')) {
      continue;
    }

    // Parse file and anchor
    const [targetFile, anchor] = url.split('#');

    // Resolve target file path
    const targetPath = resolve(fileDir, targetFile);

    // Check if file exists
    if (!existsSync(targetPath)) {
      errors.push({
        type: 'link',
        message: `Broken link: ${url} (target not found at ${targetPath})`,
      });
      continue;
    }

    // Check anchor if present
    if (anchor) {
      const hasAnchor = await checkAnchorExists(targetPath, anchor);
      if (!hasAnchor) {
        errors.push({
          type: 'link',
          message: `Broken anchor: ${url} (anchor #${anchor} not found)`,
        });
      }
    }
  }

  return errors;
}

async function checkAnchorExists(filePath: string, anchor: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Convert anchor to heading format
    // #my-heading -> ## My Heading or ### My Heading, etc.
    const headingText = anchor.replace(/-/g, ' ');
    const headingRegex = new RegExp(`^#{1,6}\\s+${headingText}`, 'mi');

    return headingRegex.test(content);
  } catch {
    return false;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @razorweave/tooling test link-validator`
Expected: PASS

**Step 5: Update validators/index.ts**

```typescript
export * from './types.js';
export * from './plan-naming-validator.js';
export * from './link-validator.js';
```

**Step 6: Build and commit**

```bash
pnpm --filter @razorweave/tooling build
git add src/tooling/validators/
git commit -m "✨ feat(tooling): add link validator with tests"
```

---

## Task 7: Implement Setup Script

**Files:**
- Create: `src/tooling/scripts/setup-hooks.ts`
- Create: `src/tooling/scripts/index.ts`

**Step 1: Create setup-hooks.ts**

```typescript
import { writeFile, mkdir } from 'fs/promises';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export async function setupHooks(): Promise<void> {
  console.log('🔧 Setting up Razorweave development environment...\n');

  const projectRoot = process.cwd();

  // 1. Install husky
  console.log('📦 Installing git hooks...');

  if (!existsSync(join(projectRoot, '.husky'))) {
    execSync('pnpm exec husky install', { stdio: 'inherit' });
  }

  // 2. Create git hook files
  await createGitHook(projectRoot, 'post-checkout', `#!/bin/sh
pnpm --filter @razorweave/tooling exec tsx hooks/git/post-checkout.ts
`);

  await createGitHook(projectRoot, 'pre-commit', `#!/bin/sh
pnpm --filter @razorweave/tooling exec tsx hooks/git/pre-commit.ts
`);

  await createGitHook(projectRoot, 'commit-msg', `#!/bin/sh
pnpm --filter @razorweave/tooling exec tsx hooks/git/commit-msg.ts "$1"
`);

  await createGitHook(projectRoot, 'post-commit', `#!/bin/sh
pnpm --filter @razorweave/tooling exec tsx hooks/git/post-commit.ts
`);

  console.log('✅ Git hooks installed\n');

  // 3. Create Claude hooks directory
  console.log('📦 Installing Claude hooks...');

  const claudeHooksDir = join(projectRoot, '.claude', 'hooks');
  await mkdir(claudeHooksDir, { recursive: true });

  await createClaudeHook(claudeHooksDir, 'session_start.ts', `
import { sessionStart } from '@razorweave/tooling/hooks/claude'
export default async function() { await sessionStart() }
`);

  await createClaudeHook(claudeHooksDir, 'before_tool_call.ts', `
import { beforeToolCall } from '@razorweave/tooling/hooks/claude'
export default async function(tool: string, args: any) {
  return await beforeToolCall(tool, args)
}
`);

  await createClaudeHook(claudeHooksDir, 'after_tool_call.ts', `
import { afterToolCall } from '@razorweave/tooling/hooks/claude'
export default async function(tool: string, args: any, result: any) {
  return await afterToolCall(tool, args, result)
}
`);

  await createClaudeHook(claudeHooksDir, 'user_prompt_submit.ts', `
import { userPromptSubmit } from '@razorweave/tooling/hooks/claude'
export default async function(prompt: string) {
  return await userPromptSubmit(prompt)
}
`);

  console.log('✅ Claude hooks installed\n');

  // 4. Create root config files
  console.log('📦 Creating configuration files...');

  await writeFile(
    join(projectRoot, '.eslintrc.cjs'),
    `module.exports = require('@razorweave/tooling/linters/eslint-config').eslintConfig;\n`
  );

  await writeFile(
    join(projectRoot, '.prettierrc.cjs'),
    `module.exports = require('@razorweave/tooling/linters/prettier-config').prettierConfig;\n`
  );

  const { markdownlintConfig } = await import('../linters/markdownlint-config.js');
  await writeFile(
    join(projectRoot, '.markdownlint.json'),
    JSON.stringify(markdownlintConfig, null, 2)
  );

  console.log('✅ Configuration files created\n');
  console.log('✨ Setup complete!\n');
  console.log('Next steps:');
  console.log('- Run `pnpm lint` to check code quality');
  console.log('- Run `pnpm validate` to check documentation');
  console.log('- Commit changes to test git hooks');
}

async function createGitHook(
  projectRoot: string,
  hookName: string,
  content: string
): Promise<void> {
  const hookPath = join(projectRoot, '.husky', hookName);
  await writeFile(hookPath, content, { mode: 0o755 });
}

async function createClaudeHook(
  claudeHooksDir: string,
  filename: string,
  content: string
): Promise<void> {
  const hookPath = join(claudeHooksDir, filename);
  await writeFile(hookPath, content.trim());
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupHooks().catch(console.error);
}
```

**Step 2: Create scripts/index.ts**

```typescript
export * from './setup-hooks.js';
```

**Step 3: Update root package.json**

Modify: `package.json`

Add to scripts:
```json
{
  "scripts": {
    "setup": "pnpm --filter @razorweave/tooling exec tsx scripts/setup-hooks.ts"
  }
}
```

**Step 4: Add husky dependency**

Update `src/tooling/package.json` dependencies:
```json
{
  "dependencies": {
    "husky": "^8.0.3"
  }
}
```

Run: `pnpm install`

**Step 5: Build and test setup script**

```bash
pnpm --filter @razorweave/tooling build
pnpm setup
```

Expected:
- .husky/ directory created with hooks
- .claude/hooks/ directory created
- Config files created in root

**Step 6: Commit**

```bash
git add src/tooling/scripts/ package.json
git commit -m "✨ feat(tooling): add setup script for hooks and configs"
```

---

## Task 8: Add Root-Level Scripts

**Files:**
- Modify: `package.json`

**Step 1: Add lint and validate scripts**

Update root `package.json`:

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "build:watch": "pnpm -r --parallel build:watch",
    "clean": "pnpm -r clean",
    "test": "vitest",
    "typecheck": "pnpm -r typecheck",
    "setup": "pnpm --filter @razorweave/tooling exec tsx scripts/setup-hooks.ts",
    "lint": "pnpm lint:ts && pnpm lint:md",
    "lint:ts": "eslint 'src/**/*.ts'",
    "lint:md": "markdownlint-cli2 '**/*.md' '#node_modules' '#dist'",
    "lint:fix": "eslint 'src/**/*.ts' --fix && prettier 'src/**/*.ts' --write",
    "validate": "pnpm --filter @razorweave/tooling exec tsx scripts/run-validators.ts"
  }
}
```

**Step 2: Add lint dependencies to root**

Update root `package.json` devDependencies:

```json
{
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "markdownlint-cli2": "^0.12.1",
    "prettier": "^3.2.4",
    "typescript": "^5.3.3",
    "vitest": "^1.1.0"
  }
}
```

**Step 3: Install dependencies**

Run: `pnpm install`

**Step 4: Test lint commands**

Run: `pnpm lint:ts`
Expected: Lints TypeScript files (may report violations)

Run: `pnpm lint:md`
Expected: Lints markdown files

**Step 5: Commit**

```bash
git add package.json
git commit -m "✨ feat(tooling): add lint and validate scripts to root"
```

---

## Task 9: Create README for Tooling Package

**Files:**
- Modify: `src/tooling/README.md`

**Step 1: Update README with usage examples**

```markdown
# @razorweave/tooling

Linting, validation, and development tooling for Razorweave.

## Purpose

Provides all development tooling including:
- **Linter configurations**: ESLint, Prettier, Markdownlint
- **Content validators**: Documentation structure, links, consistency
- **Git hooks**: pre-commit, post-commit, etc.
- **Claude hooks**: SessionStart, BeforeToolCall, etc.
- **Auto-updaters**: AGENTS.md, INDEX.md, etc.

## Setup

First-time setup:

```bash
pnpm install
pnpm build
pnpm setup
```

This will:
- Install git hooks in `.husky/`
- Create Claude hooks in `.claude/hooks/`
- Generate config files (`.eslintrc.cjs`, `.prettierrc.cjs`, `.markdownlint.json`)

## Usage

### Linting

```bash
# Lint TypeScript code
pnpm lint:ts

# Lint markdown files
pnpm lint:md

# Auto-fix issues
pnpm lint:fix
```

### Validation

```bash
# Validate documentation
pnpm validate
```

### Configurations

Import configurations in other packages:

```typescript
import { eslintConfig } from '@razorweave/tooling/linters/eslint-config';
import { prettierConfig } from '@razorweave/tooling/linters/prettier-config';
import { markdownlintConfig } from '@razorweave/tooling/linters/markdownlint-config';
```

## Git Hooks

Automatically run on git operations:

- **post-checkout**: Displays PROMPT.md context
- **pre-commit**: Runs linters and validators
- **commit-msg**: Enforces conventional commits
- **post-commit**: Auto-updates documentation files

## Claude Hooks

Automatically enhance Claude Code experience:

- **SessionStart**: Loads project context
- **BeforeToolCall**: Validates operations
- **AfterToolCall**: Provides feedback
- **UserPromptSubmit**: Optimizes prompts and auto-invokes skills

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm build:watch

# Run tests
pnpm test

# Type check
pnpm typecheck
```
```

**Step 2: Commit**

```bash
git add src/tooling/README.md
git commit -m "📝 docs(tooling): update README with usage examples"
```

---

## Verification

After completing all tasks:

**Check package structure:**
```bash
ls -la src/tooling/
```

Expected directories:
- linters/
- validators/
- scripts/
- hooks/ (will be populated in Phase 3)
- updaters/ (will be populated later)

**Check builds:**
```bash
pnpm -r build
```

Expected: All packages build successfully

**Check setup:**
```bash
pnpm setup
```

Expected: Hooks and configs created

**Check linting:**
```bash
pnpm lint
```

Expected: Lints pass or show violations

**Phase 1 Complete!**

Next: Phase 2 - Style Guides Migration
