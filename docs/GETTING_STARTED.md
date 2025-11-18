# Getting Started with Razorweave Development

Welcome to Razorweave! This guide will help you set up your development environment and start contributing to the project.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
  - Check: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)
- **pnpm**: Version 8.0.0 or higher
  - Check: `pnpm --version`
  - Install: `npm install -g pnpm`

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd razorweave
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the root workspace and all packages in the monorepo.

### 3. Set Up Development Environment

```bash
pnpm setup
```

This setup script will:

- Install git hooks (pre-commit, commit-msg, post-commit, post-checkout)
- Install Claude Code hooks (session_start, before_tool_call, after_tool_call, user_prompt_submit)
- Create configuration files (.eslintrc.cjs, .prettierrc.cjs, .markdownlint.json)

You should see output like:

```
🔧 Setting up Razorweave development environment...

📦 Installing git hooks...
✅ Git hooks installed

📦 Installing Claude hooks...
✅ Claude hooks installed

📦 Creating configuration files...
✅ Configuration files created

✨ Setup complete!
```

### 4. Verify Installation

```bash
pnpm test
```

All tests should pass. If you see failures, check the troubleshooting section below.

## Available Commands

### Building

```bash
# Build all packages
pnpm build

# Build with watch mode (rebuilds on file changes)
pnpm build:watch

# Clean build artifacts
pnpm clean
```

### Testing

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (auto-rerun on changes)
pnpm test --watch
```

### Linting and Formatting

```bash
# Lint TypeScript and Markdown
pnpm lint

# Lint TypeScript only
pnpm lint:ts

# Lint Markdown only
pnpm lint:md

# Auto-fix linting issues
pnpm lint:fix
```

### Validation

```bash
# Run all validation scripts
pnpm validate
```

This runs project-specific validators including:

- Link validation (internal documentation links)
- Plan naming validation
- Database integrity checks

### Type Checking

```bash
# Type-check all packages without building
pnpm typecheck
```

## Project Structure

Razorweave is organized as a pnpm workspace monorepo:

```
razorweave/
├── src/
│   ├── tooling/       # Build tools, hooks, validators, database
│   ├── shared/        # Shared utilities
│   ├── agents/        # Agentic systems (future)
│   ├── cli/           # Command-line interface
│   ├── site/          # Website/publishing
│   ├── workflows/     # Workflow automation
│   ├── tools/         # Additional tools
│   └── maintenance/   # Maintenance utilities
├── docs/              # Documentation
├── scripts/           # Build and validation scripts
├── .husky/            # Git hooks
└── .claude/           # Claude Code configuration
```

## Common Workflows

### Content Editing

1. Make changes to content files
2. Run validation: `pnpm validate`
3. Review validation output
4. Commit changes (git hooks will run automatically)

### Code Changes

1. Make changes to TypeScript files
2. Run tests: `pnpm test`
3. Run type check: `pnpm typecheck`
4. Run linting: `pnpm lint`
5. Build: `pnpm build`
6. Commit changes

### Documentation Changes

1. Make changes to Markdown files
2. Run Markdown linting: `pnpm lint:md`
3. Run validation: `pnpm validate`
4. Commit changes

### Working with a Specific Package

```bash
# Run command in specific package
pnpm --filter @razorweave/tooling build
pnpm --filter @razorweave/tooling test

# Run script from specific package
pnpm --filter @razorweave/tooling exec tsx scripts/setup-hooks.ts
```

## Git Hooks

After running `pnpm setup`, several git hooks will be active:

### pre-commit

Runs before each commit:

- Linting (TypeScript and Markdown)
- Tests
- Validation scripts
- Database snapshots

If any check fails, the commit will be blocked. Fix the issues and try again.

### commit-msg

Validates commit message format. Messages should follow conventional commits:

```
type(scope): description

feat(auth): add user authentication
fix(api): resolve race condition in database
docs(readme): update installation instructions
```

### post-commit

Runs after successful commit:

- Updates project database
- Resets PROMPT.md (if exists)

### post-checkout

Runs after branch checkout:

- Displays PROMPT.md context (if exists)

**For more details, see:** [Git Hooks Documentation](workflows/GIT_HOOKS.md)

## Project Database

Razorweave uses a SQLite database to track:

- Generated artifacts (content snapshots)
- Project state
- Content version history

**Database location:** `src/tooling/data/project.db`

**For more details, see:** [Project Database User Guide](workflows/PROJECT_DATABASE.md)

## Troubleshooting

### pnpm install fails

**Issue:** Dependency installation errors

**Solutions:**

1. Check Node.js version: `node --version` (must be >=18.0.0)
2. Check pnpm version: `pnpm --version` (must be >=8.0.0)
3. Clear cache: `pnpm store prune`
4. Remove node_modules: `rm -rf node_modules` and retry

### Git hooks not running

**Issue:** Hooks don't execute on commit

**Solutions:**

1. Run setup again: `pnpm setup`
2. Check .husky/ directory exists
3. Verify hooks are executable: `ls -la .husky/`
4. Check git config: `git config core.hooksPath` (should be `.husky`)

### Tests fail after installation

**Issue:** Tests fail on fresh clone

**Solutions:**

1. Rebuild all packages: `pnpm build`
2. Clear test cache: `pnpm test --clearCache`
3. Check for TypeScript errors: `pnpm typecheck`

### Build errors

**Issue:** Build command fails

**Solutions:**

1. Clean build artifacts: `pnpm clean`
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Check for TypeScript errors: `pnpm typecheck`
4. Build packages individually to isolate issue:
   ```bash
   pnpm --filter @razorweave/shared build
   pnpm --filter @razorweave/tooling build
   ```

### Validation failures

**Issue:** `pnpm validate` reports errors

**Solutions:**

1. Check specific error messages for guidance
2. For link validation: ensure all referenced files exist
3. For plan naming: follow kebab-case conventions
4. For database: run `pnpm --filter @razorweave/tooling exec tsx scripts/verify-database.ts`

## Next Steps

Now that you're set up, explore:

- **[Documentation Hub](README.md)** - Central documentation index
- **[Style Guides](style_guides/README.md)** - Writing and coding standards
- **[Workflows](workflows/README.md)** - Common development workflows
- **[Plans](plans/README.md)** - Design documents and implementation plans

## Getting Help

If you encounter issues not covered here:

1. Check the [Documentation Hub](README.md) for detailed guides
2. Review existing [plans](plans/) for implementation details
3. Search existing issues in the repository
4. Ask for help in project communication channels

Happy coding!
