# Razorweave Documentation

Welcome to the Razorweave project documentation. This directory contains all design documents, style guides, workflow documentation, and project plans.

## Documentation Structure

### For New Developers

Start here if you're new to the project:

1. **[Getting Started](GETTING_STARTED.md)** - Installation, setup, and first steps
2. **[Project README](../README.md)** - Project overview and introduction
3. **[Directory Structure](plans/DIRECTORY_STRUCTURE.md)** - How the project is organized
4. **[Style Guides](style_guides/README.md)** - Coding and writing standards

### Documentation Categories

#### [Style Guides](style_guides/)

Comprehensive standards for code, writing, and git workflow:

- **[Style Guides Index](style_guides/README.md)** - Overview and navigation
- Book content guides (writing, PDF formatting)
- Code standards (TypeScript, naming conventions)
- Documentation standards (docs, plan format)
- Git workflow (commit conventions)

#### [Plans](plans/)

Design documents and implementation plans:

- **[Plans Index](plans/README.md)** - Index of all design documents
- Architecture proposals
- Feature design documents
- Implementation plans
- Project structure documentation

#### [Workflows](workflows/)

Process and workflow documentation:

- **[Workflows Index](workflows/README.md)** - Index of workflow documentation
- End-to-end pipeline
- Git hooks system
- Claude Code hooks
- Database usage
- Validation processes

#### [Agents](agents/)

Automated agent documentation:

- **[Agents Index](agents/README.md)** - Overview of agentic systems
- Agentic process descriptions
- Agent capabilities and workflows
- Integration patterns

#### [Reviews](reviews/)

Review reports and findings:

- **[Reviews Index](reviews/README.md)** - Index of review reports
- Code review reports
- Content review findings
- Validation results

## Quick Reference

### Common Documentation Needs

**I need to write game content:**
- [Prose Style Guide](style_guides/prose/README.md)
- [Rules Style Guide](style_guides/rules/README.md)
- [Book Formatting Guide](style_guides/book/)

**I need to write code:**
- [TypeScript Style Guide](style_guides/typescript/README.md)
- [Naming Conventions](style_guides/typescript/naming-conventions.md)

**I need to commit code:**
- [Git Commit Conventions](style_guides/git/commit-conventions.md)

**I need to understand workflows:**
- [End-to-End Pipeline](workflows/END_TO_END_PIPELINE.md)
- [Git Hooks Guide](workflows/GIT_HOOKS.md)
- [Project Database Guide](workflows/PROJECT_DATABASE.md)
- [Agentic Processes](agents/AGENTIC_PROCESSES.md)

**I need to write documentation:**
- [Docs Style Guide](style_guides/docs/README.md)
- [Plan Format Guide](style_guides/docs/plan-format.md)

**I need to understand the project structure:**
- [Directory Structure](plans/DIRECTORY_STRUCTURE.md)
- [Project README](../README.md)
- [Project Index](../INDEX.md)

### Common Tasks

**Setting up the project:**
- [Getting Started Guide](GETTING_STARTED.md) - Complete setup instructions
- [Troubleshooting Setup](GETTING_STARTED.md#troubleshooting) - Common issues

**Working with git:**
- [Git Hooks Guide](workflows/GIT_HOOKS.md) - What hooks do and how to use them
- [Git Commit Conventions](style_guides/git/commit-conventions.md) - Message format

**Using the database:**
- [Project Database Guide](workflows/PROJECT_DATABASE.md) - Query and recover content
- [Database Schema](workflows/PROJECT_DATABASE.md#schema-overview) - Tables and structure

**Running validation:**
- [Validation Commands](GETTING_STARTED.md#validation) - How to run validators
- [Git Hooks Pre-commit](workflows/GIT_HOOKS.md#pre-commit) - What's checked automatically

## Documentation Standards

All documentation in this directory should follow:

1. **Markdown Format** - Use `.md` extension
2. **Clear Structure** - Use heading hierarchy properly
3. **Cross-References** - Link to related documentation
4. **Examples** - Include practical examples where relevant
5. **Maintenance** - Keep documentation up to date with implementation

See [Docs Style Guide](style_guides/docs/README.md) for detailed standards.

## Contributing to Documentation

### Adding New Documentation

1. Determine the appropriate category (plans, workflows, style_guides, etc.)
2. Follow the naming convention: `kebab-case.md`
3. Follow the structure of similar documents
4. Add your document to the appropriate README index
5. Cross-reference from related documents

### Updating Existing Documentation

1. Read the full document before making changes
2. Check for related documents that may need updates
3. Update cross-references if you change headings or structure
4. Use clear commit messages (see [Git Commit Conventions](style_guides/git/commit-conventions.md))

### Documentation Review

Documentation should be reviewed:
- When features are implemented or changed
- Every 6 months for accuracy
- When user feedback indicates confusion
- Before major releases

## Finding Help

**Can't find what you need?**

1. Check the [Project Index](../INDEX.md) for file locations
2. Use search to find keywords across documentation
3. Check related documentation categories
4. Ask in project discussions

**Documentation seems outdated?**

1. Check git history to see when it was last updated
2. Compare with actual implementation
3. Create an issue or submit a pull request with updates

## Related Resources

- [Project README](../README.md) - Main project overview
- [Project Index](../INDEX.md) - File navigation guide
- [AGENTS.md](../AGENTS.md) - Agent quick reference
- [PLAN.md](../PLAN.md) - Current project status
