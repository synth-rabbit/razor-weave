# @razorweave/tooling

Comprehensive linting, validation, and development tooling for the Razorweave project.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Linter Configurations](#linter-configurations)
- [Validators](#validators)
- [Git Hooks](#git-hooks)
- [Claude Hooks](#claude-hooks)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Development](#development)

## Overview

The `@razorweave/tooling` package is the central hub for all development tooling in the Razorweave project. It provides:

- **Linter configurations**: Pre-configured ESLint, Prettier, and Markdownlint settings optimized for TypeScript and documentation
- **Content validators**: Automated validation of documentation structure, naming conventions, and link integrity
- **Git hooks**: Automated quality checks and documentation updates on git operations
- **Claude hooks**: Enhanced Claude Code experience with context loading and validation
- **Setup scripts**: One-command installation of all development tooling

This package ensures code quality, documentation consistency, and streamlined development workflows across the entire Razorweave monorepo.

## Installation

The tooling package is automatically available in the Razorweave workspace:

```bash
# Install all workspace dependencies
pnpm install

# Build the tooling package
pnpm --filter @razorweave/tooling build
```

## Quick Start

### First-Time Setup

Run the setup script to install all hooks and configuration files:

```bash
pnpm setup
```

This command will:
1. Install Husky for git hooks
2. Create git hook files in `.husky/`
3. Create Claude hook files in `.claude/hooks/`
4. Generate configuration files:
   - `.eslintrc.cjs` - ESLint configuration
   - `.prettierrc.cjs` - Prettier configuration
   - `.markdownlint.json` - Markdownlint configuration

### Daily Development

```bash
# Lint TypeScript code
pnpm lint:ts

# Lint markdown files
pnpm lint:md

# Auto-fix linting issues
pnpm lint:fix

# Validate documentation structure
pnpm validate

# Run tests
pnpm --filter @razorweave/tooling test
```

## Linter Configurations

### ESLint Configuration

The ESLint configuration enforces TypeScript best practices and code quality standards.

**Key Rules:**
- Enforces ESM imports (no `require()`)
- Strict type safety with no `any` types
- Explicit function return types (warning)
- No unused variables (except those prefixed with `_`)
- No `console.log` (use `console.warn` or `console.error`)
- Enforces `const` over `let` where possible

**Usage:**

```typescript
// In your package's .eslintrc.cjs
module.exports = require('@razorweave/tooling/linters/eslint-config').eslintConfig;
```

**Import in TypeScript:**

```typescript
import { eslintConfig } from '@razorweave/tooling/linters/eslint-config';
```

### Prettier Configuration

Consistent code formatting across the project.

**Settings:**
- Semicolons: Yes
- Single quotes: Yes
- Trailing commas: ES5
- Print width: 100 characters
- Tab width: 2 spaces
- Arrow function parentheses: Avoid when possible

**Usage:**

```typescript
// In your package's .prettierrc.cjs
module.exports = require('@razorweave/tooling/linters/prettier-config').prettierConfig;
```

**Import in TypeScript:**

```typescript
import { prettierConfig } from '@razorweave/tooling/linters/prettier-config';
```

### Markdownlint Configuration

Ensures consistent markdown formatting in documentation.

**Key Rules:**
- No line length limit (prioritize clarity over brevity)
- Heading levels must increment by one
- Use ATX-style headings (`#` syntax)
- Use dashes (`-`) for unordered lists
- No bare URLs (must use link syntax)
- Code blocks must specify language

**Usage:**

```typescript
import { markdownlintConfig } from '@razorweave/tooling/linters/markdownlint-config';
```

## Validators

### Plan Naming Validator

Validates that plan files follow the Razorweave naming conventions.

**Supported Formats:**
1. **Index files**: `{topic-name}-index.md`
   - Example: `typescript-setup-index.md`

2. **Phase files**: `{topic-name}-P{phase-number}[-{phase-step}].md`
   - Example: `typescript-setup-P1.md`
   - Example: `typescript-setup-P1-initial-config.md`

3. **Tangent files**: `{topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md`
   - Example: `typescript-setup-P2-linting.md`
   - Example: `typescript-setup-P2-linting-eslint.md`

**API:**

```typescript
import { validatePlanNaming } from '@razorweave/tooling/validators';

const result = validatePlanNaming('docs/plans/my-feature-P1.md');

if (result.valid) {
  console.log(`Valid ${result.format} file`);
  console.log('Metadata:', result.metadata);
} else {
  console.error(result.error);
}
```

**Return Type:**

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  format?: 'index' | 'phase' | 'tangent';
  metadata?: {
    topicName?: string;
    phaseNum?: number;
    phaseStep?: string;
    tangentName?: string;
    tangentStep?: string;
  };
}
```

### Link Validator

Validates internal markdown links and anchors.

**Features:**
- Checks that linked files exist
- Validates anchor links point to actual headings
- Skips external URLs (http/https)
- Provides detailed error messages with file paths

**API:**

```typescript
import { validateLinks } from '@razorweave/tooling/validators';

const content = await readFile('docs/README.md', 'utf-8');
const errors = await validateLinks(content, 'docs/README.md');

if (errors.length > 0) {
  errors.forEach(error => {
    console.error(`${error.type}: ${error.message}`);
  });
}
```

**Return Type:**

```typescript
interface ValidationError {
  type: 'structure' | 'link' | 'completeness' | 'consistency';
  message: string;
  line?: number;
}
```

## Git Hooks

The following git hooks are automatically installed by the setup script:

### post-checkout

Displays the PROMPT.md context file after switching branches, helping developers understand the current branch's purpose and context.

### pre-commit

Runs before each commit to ensure code quality:
- Lints staged TypeScript files
- Validates markdown formatting
- Runs validators on documentation files

### commit-msg

Enforces conventional commit message format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Maintenance tasks

### post-commit

Automatically updates documentation files after successful commits:
- Updates AGENTS.md with agent metadata
- Updates INDEX.md with file listings
- Stages and amends the commit if changes are made

## Claude Hooks

Claude hooks enhance the Claude Code development experience:

### SessionStart

Runs when a new Claude Code session begins:
- Loads project context from PROMPT.md
- Displays current git status
- Shows recently modified files

### BeforeToolCall

Validates operations before tool execution:
- Checks file paths are valid
- Warns about potentially destructive operations
- Suggests alternatives when appropriate

### AfterToolCall

Provides feedback after tool execution:
- Confirms successful operations
- Reports errors with context
- Suggests next steps

### UserPromptSubmit

Processes user prompts before sending to Claude:
- Expands skill references
- Adds relevant context
- Optimizes prompt clarity

## Scripts

### setup-hooks.ts

The main setup script that configures the development environment.

**Usage:**

```bash
# From project root
pnpm setup

# Or directly
pnpm --filter @razorweave/tooling exec tsx scripts/setup-hooks.ts
```

**What it does:**
1. Installs Husky for git hook management
2. Creates git hook files in `.husky/` directory
3. Creates Claude hook files in `.claude/hooks/` directory
4. Generates configuration files in project root
5. Makes all hook files executable

## API Reference

### Exported Modules

All modules are exported via the package.json exports field for clean imports:

```typescript
// Main package (currently empty, sub-modules preferred)
import {} from '@razorweave/tooling';

// Linter configurations
import { eslintConfig } from '@razorweave/tooling/linters/eslint-config';
import { prettierConfig } from '@razorweave/tooling/linters/prettier-config';
import { markdownlintConfig } from '@razorweave/tooling/linters/markdownlint-config';

// Validators
import {
  validatePlanNaming,
  validateLinks,
  ValidationResult,
  ValidationError
} from '@razorweave/tooling/validators';

// Scripts
import { setupHooks } from '@razorweave/tooling/scripts';

// Git hooks (will be available in future)
import {} from '@razorweave/tooling/hooks/git';

// Claude hooks (will be available in future)
import {} from '@razorweave/tooling/hooks/claude';
```

### Type Definitions

**ValidationResult:**

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  format?: string;
  metadata?: Record<string, any>;
}
```

**ValidationError:**

```typescript
interface ValidationError {
  type: 'structure' | 'link' | 'completeness' | 'consistency';
  message: string;
  line?: number;
}
```

## Examples

### Example 1: Validate Plan Files

```typescript
import { validatePlanNaming } from '@razorweave/tooling/validators';
import { glob } from 'glob';

async function validateAllPlans() {
  const planFiles = await glob('docs/plans/**/*.md');

  for (const file of planFiles) {
    const result = validatePlanNaming(file);

    if (!result.valid) {
      console.error(`Invalid plan name: ${file}`);
      console.error(result.error);
    } else {
      console.log(`✓ ${file} (${result.format})`);
    }
  }
}

validateAllPlans();
```

### Example 2: Validate Links in Documentation

```typescript
import { validateLinks } from '@razorweave/tooling/validators';
import { readFile } from 'fs/promises';
import { glob } from 'glob';

async function validateAllLinks() {
  const mdFiles = await glob('docs/**/*.md');
  let hasErrors = false;

  for (const file of mdFiles) {
    const content = await readFile(file, 'utf-8');
    const errors = await validateLinks(content, file);

    if (errors.length > 0) {
      console.error(`\nErrors in ${file}:`);
      errors.forEach(err => console.error(`  - ${err.message}`));
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.log('✓ All links are valid');
  }
}

validateAllLinks();
```

### Example 3: Use Linter Configurations Programmatically

```typescript
import { eslintConfig } from '@razorweave/tooling/linters/eslint-config';
import { ESLint } from 'eslint';

async function lintFiles(files: string[]) {
  const eslint = new ESLint({
    baseConfig: eslintConfig,
    fix: true,
  });

  const results = await eslint.lintFiles(files);
  await ESLint.outputFixes(results);

  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  console.log(resultText);
}

lintFiles(['src/**/*.ts']);
```

### Example 4: Custom Validation Script

```typescript
import { validatePlanNaming, validateLinks } from '@razorweave/tooling/validators';
import { readFile } from 'fs/promises';

async function validateDocumentation(filePath: string) {
  // Check file naming
  const nameResult = validatePlanNaming(filePath);
  if (!nameResult.valid) {
    console.error('Naming error:', nameResult.error);
    return false;
  }

  // Check links
  const content = await readFile(filePath, 'utf-8');
  const linkErrors = await validateLinks(content, filePath);
  if (linkErrors.length > 0) {
    console.error('Link errors:', linkErrors);
    return false;
  }

  console.log('✓ Documentation is valid');
  return true;
}
```

## Development

### Building

```bash
# Build once
pnpm build

# Build in watch mode for development
pnpm build:watch

# Clean build artifacts
pnpm clean
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test plan-naming-validator
```

### Type Checking

```bash
# Type check without building
pnpm typecheck
```

### Project Structure

```
src/tooling/
├── linters/              # Linter configuration modules
│   ├── eslint-config.ts
│   ├── prettier-config.ts
│   ├── markdownlint-config.ts
│   └── index.ts
├── validators/           # Validation utilities
│   ├── types.ts
│   ├── plan-naming-validator.ts
│   ├── plan-naming-validator.test.ts
│   ├── link-validator.ts
│   ├── link-validator.test.ts
│   └── index.ts
├── scripts/              # Setup and utility scripts
│   ├── setup-hooks.ts
│   └── index.ts
├── hooks/                # Git and Claude hooks
│   ├── git/             # (To be implemented)
│   └── claude/          # (To be implemented)
├── updaters/            # Auto-update utilities
│   └── (To be implemented)
├── index.ts             # Main package entry
├── package.json         # Package configuration
├── tsconfig.json        # TypeScript configuration
├── vitest.config.ts     # Test configuration
└── README.md            # This file
```

### Contributing

When adding new features to the tooling package:

1. Add the implementation in the appropriate directory
2. Export the module from the directory's `index.ts`
3. Add the export path to `package.json` exports field
4. Write comprehensive tests
5. Update this README with usage examples
6. Run `pnpm build` and `pnpm test` to verify

### Dependencies

**Production:**
- `@razorweave/shared` - Shared types and utilities
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint rules
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `eslint` - JavaScript/TypeScript linter
- `prettier` - Code formatter
- `markdownlint-cli2` - Markdown linter
- `glob` - File pattern matching
- `zod` - Schema validation
- `husky` - Git hooks management

**Development:**
- `@types/node` - Node.js type definitions
- `typescript` - TypeScript compiler
- `vitest` - Unit testing framework

## License

Part of the Razorweave project.
