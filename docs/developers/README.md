# Developer Documentation

Welcome to the Razorweave developer documentation. This directory contains technical documentation for developers working on the project.

## Getting Started

**New to the project?** Start with the [Getting Started Guide](../GETTING_STARTED.md)

## Documentation Index

### Setup and Onboarding

- **[Getting Started Guide](../GETTING_STARTED.md)** - Installation, setup, first steps
- **[Git Hooks Guide](../workflows/GIT_HOOKS.md)** - Automated quality checks
- **[Project Database](../workflows/PROJECT_DATABASE.md)** - Content history and state

### Architecture

- **[Monorepo Architecture](MONOREPO_ARCHITECTURE.md)** - Package structure and workspace setup
- **[Directory Structure](../plans/DIRECTORY_STRUCTURE.md)** - Project organization
- **[Database Design](../plans/2025-11-18-project-database-design.md)** - Database architecture

### Development Workflows

- **[Validation Scripts](../workflows/VALIDATION.md)** - Quality checks and linting
- **[Claude Code Hooks](../workflows/CLAUDE_HOOKS.md)** - Claude Code integration
- **[End-to-End Pipeline](../workflows/END_TO_END_PIPELINE.md)** - Complete workflow

### Troubleshooting

- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Getting Started - Troubleshooting](../GETTING_STARTED.md#troubleshooting)** - Setup issues

## Quick Links

### Common Tasks

**Set up development environment:**
```bash
pnpm install
pnpm setup
pnpm test
```

**Run quality checks:**
```bash
pnpm lint
pnpm typecheck
pnpm validate
```

**Build and test:**
```bash
pnpm build
pnpm test
```

**Work with specific package:**
```bash
pnpm --filter @razorweave/tooling build
pnpm --filter @razorweave/tooling test
```

### Key Files

- **package.json** - Root package configuration and scripts
- **pnpm-workspace.yaml** - Monorepo workspace configuration
- **tsconfig.json** - TypeScript compiler configuration
- **.eslintrc.cjs** - ESLint configuration
- **.markdownlint.json** - Markdownlint configuration

### Key Directories

- **src/tooling/** - Build tools, hooks, validators, database
- **src/shared/** - Shared utilities
- **docs/** - All documentation
- **scripts/** - Validation and review scripts

## Development Process

### 1. Before Starting Work

- Pull latest changes
- Check PLAN.md for current focus
- Read relevant design documents in docs/plans/
- Review style guides for the area you're working on

### 2. During Development

- Follow style guides
- Write tests for new code
- Run validation frequently
- Keep commits focused and atomic
- Use conventional commit messages

### 3. Before Committing

- Run tests: `pnpm test`
- Run linting: `pnpm lint`
- Run validation: `pnpm validate`
- Review your changes
- Write clear commit message

(Git hooks will run these automatically, but running manually gives faster feedback)

### 4. After Committing

- Verify post-commit hook succeeded
- Check that tests still pass
- Push when ready

## Code Quality Standards

### TypeScript

- Use explicit return types
- Enable `strict` mode
- Prefer `const` over `let`
- Use meaningful variable names
- Write JSDoc comments for public APIs

**See:** [TypeScript Style Guide](../style_guides/typescript/README.md)

### Testing

- Write tests for all new code
- Test both success and failure paths
- Use descriptive test names
- Mock external dependencies
- Aim for high coverage

### Documentation

- Document public APIs
- Update docs when changing behavior
- Add examples for complex features
- Keep README files current

**See:** [Docs Style Guide](../style_guides/docs/README.md)

## Project Tools

### Database

**Location:** `src/tooling/data/project.db`

**Purpose:** Track content history, project state, artifacts

**Access:**
```typescript
import { getDatabase } from '@razorweave/tooling/database';
const db = getDatabase();
```

**See:** [Project Database Guide](../workflows/PROJECT_DATABASE.md)

### Validators

**Purpose:** Enforce standards automatically

**Types:**
- Plan naming validation
- Link validation
- TypeScript linting
- Markdown linting

**See:** [Validation Scripts Guide](../workflows/VALIDATION.md)

### Git Hooks

**Purpose:** Automated quality checks

**Hooks:**
- pre-commit: Linting, tests, validation
- commit-msg: Message format
- post-commit: Database updates
- post-checkout: Context display

**See:** [Git Hooks Guide](../workflows/GIT_HOOKS.md)

### Claude Code Hooks

**Purpose:** Enhance Claude Code sessions

**Hooks:**
- session_start: Display context
- before_tool_call: Validation
- after_tool_call: Tracking
- user_prompt_submit: Enhancement (planned)

**See:** [Claude Code Hooks Guide](../workflows/CLAUDE_HOOKS.md)

## Related Resources

- **[Main README](../../README.md)** - Project overview
- **[AGENTS.md](../../AGENTS.md)** - Agentic systems
- **[INDEX.md](../../INDEX.md)** - Project navigation
- **[PLAN.md](../../PLAN.md)** - Current project status

## Getting Help

1. Check this documentation
2. Review style guides
3. Look at existing code for examples
4. Ask in project discussions
5. Create an issue if you find bugs or have suggestions

## Contributing

We welcome contributions! Before starting:

1. Read the relevant style guides
2. Check existing plans and issues
3. Discuss major changes first
4. Follow the development process above
5. Write tests and documentation

Thank you for contributing to Razorweave!
