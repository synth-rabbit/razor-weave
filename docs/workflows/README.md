# Workflow Documentation

This directory contains documentation for all project workflows and processes.

## Overview

Workflows define how work gets done in the Razorweave project. This includes content creation pipelines, development processes, automation systems, and tooling integration.

## Available Workflows

### [End-to-End Pipeline](END_TO_END_PIPELINE.md)

The complete workflow for creating, reviewing, editing, and releasing TTRPG books.

**Covers:**
- Content creation and review process
- Iterative improvement workflow
- PDF creation process
- Release pipeline

**Audience:** Everyone - this is the core workflow for the project

### [Git Hooks](GIT_HOOKS.md)

**Purpose:** Automated validation and enforcement on git operations

**Hooks Implemented:**
- `pre-commit` - Linting, tests, validation, snapshots
- `commit-msg` - Message format validation
- `post-commit` - Database updates, PROMPT.md reset
- `post-checkout` - PROMPT.md display

**Documentation:** [GIT_HOOKS.md](GIT_HOOKS.md)

**Quick Reference:** See [Git Commit Conventions](../style_guides/git/commit-conventions.md) for message format

**Audience:** All developers

### [Claude Code Hooks](CLAUDE_HOOKS.md)

**Purpose:** Integration with Claude Code environment

**Hooks Implemented:**
- `session_start` - Display project context
- `before_tool_call` - Pre-execution validation
- `after_tool_call` - Track changes and create snapshots
- `user_prompt_submit` - Prompt enhancement (planned)

**Documentation:** [CLAUDE_HOOKS.md](CLAUDE_HOOKS.md)

**Audience:** Claude Code users

### [Project Database](PROJECT_DATABASE.md)

**Purpose:** State persistence and content history tracking

**Features:**
- Chapter version snapshots
- Project state tracking
- Data artifact management
- Git commit integration
- Point-in-time recovery

**Documentation:** [PROJECT_DATABASE.md](PROJECT_DATABASE.md)

**Design Document:** [Project Database Design](../plans/2025-11-18-project-database-design.md)

**Audience:** All developers, content creators

### [Validation System](VALIDATION.md)

**Purpose:** Automated quality checks and standards enforcement

**Validators:**
- TypeScript linting (ESLint)
- Markdown linting (markdownlint)
- Plan naming validation
- Link validation (planned)
- Mechanics validation (planned)

**Documentation:** [VALIDATION.md](VALIDATION.md)

**Audience:** All developers

## Workflow Categories

### Content Workflows

Creating and managing game content:

- Writing manuscripts
- Generating content with agents
- Managing book versions
- Exporting formats (HTML, PDF)

**Documentation:**
- [End-to-End Pipeline](END_TO_END_PIPELINE.md)
- [Agentic Processes](../agents/AGENTIC_PROCESSES.md)

### Development Workflows

Building and maintaining the codebase:

- TypeScript development
- Running tests
- Building packages
- Managing dependencies
- Git workflow

**Documentation:**
- [Git Commit Conventions](../style_guides/git/commit-conventions.md)
- [TypeScript Style Guide](../style_guides/typescript/README.md)

### Review Workflows

Quality assurance and validation:

- Manual content reviews
- Automated validation
- Persona-based reviews
- Play session analysis

**Documentation:**
- [End-to-End Pipeline](END_TO_END_PIPELINE.md) (review section)
- [Reviews Directory](../reviews/README.md)
- [Persona System Index](../plans/persona-system-index.md)

### Release Workflows

Publishing completed work:

- PDF generation
- Website updates
- Version management
- Distribution

**Documentation:**
- [End-to-End Pipeline](END_TO_END_PIPELINE.md) (release section)

## Quick Reference

### Common Workflow Tasks

**Starting a new session:**
1. Git hooks initialize automatically
2. Claude hooks capture session state
3. Database tracks your work

**Making code changes:**
1. Create feature branch
2. Write code following [TypeScript Style Guide](../style_guides/typescript/README.md)
3. Run tests: `pnpm test`
4. Run linters: `pnpm lint`
5. Commit with [conventional format](../style_guides/git/commit-conventions.md)
6. Git hooks validate automatically

**Creating content:**
1. Navigate to appropriate manuscript directory
2. Edit markdown files
3. Follow [Writing Style Guide](../style_guides/book/writing-style-guide.md)
4. Changes auto-captured to database
5. Run validators: `pnpm validate`

**Running validations:**
```bash
# All validators
pnpm validate

# Individual validators
./scripts/review/validate-links.sh [file]
./scripts/review/validate-mechanics.sh [file]
tsx scripts/verify-database.ts
```

**Building the project:**
```bash
# Build all packages
pnpm build

# Build and watch for changes
pnpm build:watch

# Type checking
pnpm typecheck
```

## Process Integration

### How Workflows Connect

```
Content Creation
    ↓
Database Snapshots (Claude hooks)
    ↓
Git Commit (with validation via git hooks)
    ↓
Database Commit Tracking (post-commit hook)
    ↓
Review Process
    ↓
Iterative Editing
    ↓
Validation (automated scripts)
    ↓
PDF Generation
    ↓
Release
```

### Automation Points

1. **Session Start** - Claude hooks initialize state
2. **File Changes** - Claude hooks capture to database
3. **Pre-Commit** - Git hooks run linters and validators
4. **Commit Message** - Git hooks validate format
5. **Post-Commit** - Git hooks update database
6. **Validation Scripts** - Can run manually or via CI

## Workflow Tools

### Git Hooks

Location: `.husky/`
Implementation: `src/tooling/hooks/git/`

**Setup:**
```bash
pnpm setup
```

**Hooks:**
- `commit-msg` - Validates commit format
- `pre-commit` - Runs quality checks
- `post-commit` - Updates database
- `post-checkout` - Updates environment

### Claude Hooks

Location: `.claude/hooks/`
Implementation: `src/tooling/hooks/claude/`

**Automatic Setup** - Hooks run when Claude Code starts

### Validation Scripts

Location: `scripts/review/`

**Usage:**
```bash
pnpm validate
```

### Database Tools

Location: `src/tooling/database/`

**Usage:**
```typescript
import { ProjectDatabase } from '@razorweave/tooling/database';

const db = new ProjectDatabase();
const history = db.snapshots.getChapterHistory('path/to/chapter.md');
```

## Workflow Best Practices

### Version Control

- Commit frequently with clear messages
- Use conventional commit format
- Let git hooks validate automatically
- Create feature branches for major work
- Keep commits focused and atomic

### Content Creation

- Follow style guides
- Use validation scripts regularly
- Review git diffs before committing
- Reference design documents
- Track work in database

### Quality Assurance

- Run validators before committing
- Fix issues immediately
- Use review process for major changes
- Monitor quality metrics
- Document deviations from standards

### Database Usage

- Trust automatic snapshots
- Query history when needed
- Use for recovery if needed
- Don't manually edit database
- Monitor database size

## Troubleshooting Workflows

### Git Hook Failures

**Problem:** Pre-commit hook fails

**Solutions:**
1. Check linting errors: `pnpm lint`
2. Fix errors: `pnpm lint:fix`
3. Review validation output
4. Fix issues and retry commit

**Problem:** Commit message rejected

**Solutions:**
1. Review [commit conventions](../style_guides/git/commit-conventions.md)
2. Use correct emoji and format
3. Check examples in conventions guide

### Build Failures

**Problem:** `pnpm build` fails

**Solutions:**
1. Check TypeScript errors
2. Run `pnpm typecheck`
3. Verify dependencies: `pnpm install`
4. Review error messages
5. Check for circular dependencies

### Validation Failures

**Problem:** Validation scripts report errors

**Solutions:**
1. Review specific validation output
2. Fix issues in source files
3. Re-run validation
4. Check validation script documentation

### Database Issues

**Problem:** Database errors or corruption

**Solutions:**
1. Run `tsx scripts/verify-database.ts`
2. Check database file permissions
3. Review recent changes
4. Restore from backup if needed

## Future Workflows

Planned workflow enhancements:

- **Continuous Integration** - Automated testing and validation
- **Automated Reviews** - Persona-based review workflows
- **Content Generation** - Automated content creation workflows
- **PDF Pipeline** - Automated PDF generation
- **Release Automation** - Automated publishing and deployment

## Related Documentation

- [Style Guides](../style_guides/README.md) - Standards for all workflows
- [Plans](../plans/README.md) - Design documents for workflows
- [Agents](../agents/README.md) - Automated agent workflows
- [Reviews](../reviews/README.md) - Review process documentation
- [Project README](../../README.md) - Project overview
- [Project Index](../../INDEX.md) - File navigation

## Contributing

### Adding New Workflows

1. Document the workflow purpose and scope
2. Describe inputs, process, and outputs
3. Include examples and best practices
4. Link to related documentation
5. Add troubleshooting section
6. Update this README index

### Updating Workflows

1. Review existing documentation
2. Test workflow changes
3. Update documentation to match
4. Update cross-references
5. Notify team of changes

### Workflow Documentation Standards

Follow [Docs Style Guide](../style_guides/docs/README.md):

- Clear step-by-step instructions
- Examples of common use cases
- Troubleshooting guidance
- Links to related resources
- Keep documentation up to date
