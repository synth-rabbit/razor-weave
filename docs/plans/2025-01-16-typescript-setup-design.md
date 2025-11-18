# TypeScript Project Setup Design

**Date:** 2025-01-16
**Status:** Approved

## Overview

This document describes the TypeScript monorepo setup for the Razorweave project. The setup provides infrastructure for agents, CLI tools, workflows, and site generation without implementing the actual business logic.

## Architecture Decisions

### Monorepo Structure

**Approach:** Feature-based packages using pnpm workspaces

**Rationale:**
- Clean separation between agents, CLI, workflows, and site generation
- Shared code in dedicated package
- Agents grouped together (share similar patterns)
- Better than agent-per-package (too fragmented) or layer-based (unclear boundaries)

### Build System

**Tools:** TypeScript Compiler (tsc) + ES Modules

**Rationale:**
- No additional build complexity
- Native TypeScript support
- Sufficient for Node.js CLI tools and agents
- ESM is modern standard, future-proof
- TypeScript project references enable fast incremental builds

### Package Manager

**Choice:** pnpm

**Rationale:**
- Excellent monorepo support
- Faster installs
- Efficient disk usage
- Better dependency management

## Project Structure

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'src/*'
```

### Package Organization

```
src/
  agents/                    @razorweave/agents
    content/                 Content generation agents
    review/                  Persona-based review agents
    playtest/                Play session simulation
    pdf/                     PDF generation
    release/                 Publication automation

  cli/                       @razorweave/cli
    commands/                CLI command implementations
    bin/                     Executable entry point

  site/                      @razorweave/site
    generator/               Static site generator
    templates/               HTML templates
    static/                  Static assets

  workflows/                 @razorweave/workflows
    pipelines/               Pipeline implementations
    orchestration/           Pipeline execution
    stages/                  Individual workflow stages

  maintenance/               @razorweave/maintenance
    scripts/                 Maintenance utilities

  tools/                     @razorweave/tools
    scripts/                 Helper scripts
    templates/               Document templates

  shared/                    @razorweave/shared [NEW]
    types/                   Shared TypeScript types
    llm/                     LLM client wrappers
    fs/                      File system helpers
    utils/                   Common utilities
    personas/                Persona management
```

## Technical Configuration

### TypeScript Configuration

**Root tsconfig.json:**
- Target: ES2022
- Module: ES2022
- Strict mode enabled
- Project references for incremental builds
- Declaration files generated

**Per-package tsconfig.json:**
- Extends root configuration
- References shared package
- Package-specific output directories

### Package Configuration

**Each package includes:**
- `type: "module"` for ESM
- Exports field with TypeScript declarations
- Project references to dependencies
- Build scripts

**CLI package includes:**
- Bin field for executable
- Shebang in entry file

## Shared Package Design

### Purpose

Common code used across all packages to avoid duplication.

### Key Abstractions

**LLM Client Interface:**
```typescript
interface LLMClient {
  complete(prompt: string, options?: CompletionOptions): Promise<string>
  stream(prompt: string, options?: CompletionOptions): AsyncIterator<string>
}
```

**Agent Base Type:**
```typescript
interface Agent<TInput, TOutput> {
  name: string
  execute(input: TInput): Promise<TOutput>
  validate(input: TInput): ValidationResult
}
```

**Path Constants:**
Centralized path resolution for `books/`, `data/`, `rules/` directories.

### Organization

- `types/` - Shared TypeScript types (Book, Persona, Agent, Config)
- `llm/` - LLM client abstraction and provider wrappers
- `fs/` - File system utilities (BookReader, BookWriter, paths, markdown)
- `utils/` - Common utilities (logger, errors, validation)
- `personas/` - Persona loading and selection

## Agent Architecture

### Pattern

All agents implement consistent structure:
1. Read context (rules, content, style guides)
2. Build prompt from context
3. Call LLM
4. Post-process and validate
5. Write output

### Hybrid Approach

**LLM handles:**
- Content generation
- Persona-based reviews
- Analysis and recommendations
- Design suggestions

**Traditional code handles:**
- File I/O and parsing
- Path resolution
- Markdown processing
- Data aggregation
- Pipeline orchestration
- Quality gate checks

## CLI Structure

### Organization

Commands organized by domain:
- `content/` - Content generation and editing
- `review/` - Review execution and analysis
- `playtest/` - Playtest simulation
- `pdf/` - PDF generation
- `release/` - Publication

### Integration

- Simple commands: CLI directly calls agents
- Complex commands: CLI delegates to workflow orchestrator
- Workflows package handles iterative improvement process

## Workflow Orchestration

### Purpose

Implements the iterative improvement process from END_TO_END_PIPELINE.md:
1. Content creation → review → analysis
2. Iterative improvement (PM → Writer → Expert → Editor loop)
3. HTML generation
4. PDF creation (draft → production)
5. Release

### State Management

Tracks pipeline progress in `data/workflows/state/`:
- Current stage
- Iteration count
- Metrics history
- Agent outputs

Allows resuming interrupted pipelines and auditing the process.

## Development Workflow

### Building

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Watch mode
pnpm -r --parallel build:watch
```

### Testing

Framework (vitest) configured but no tests implemented yet.

## Implementation Scope

### What Gets Created

- ✅ pnpm workspace configuration
- ✅ All package.json files with dependencies
- ✅ All tsconfig.json files with project references
- ✅ Directory structure with placeholder files
- ✅ Basic README files for each package
- ✅ Build scripts configured

### What Does NOT Get Created

- ❌ Actual agent implementations
- ❌ Workflow logic
- ❌ CLI commands
- ❌ Tests

Implementation of business logic will be done separately with individual plans for each workflow.

## Dependencies

### Shared Dependencies (Root)

- TypeScript
- Vitest
- ESLint / Prettier (optional)

### Package-Specific Dependencies

**@razorweave/shared:**
- @anthropic-ai/sdk (for Claude API)
- zod (schema validation)

**@razorweave/cli:**
- commander or clipanion (CLI framework)

**@razorweave/site:**
- TBD based on static site generator choice

Other packages depend on workspace packages, minimal external dependencies.

## Future Considerations

### Potential Enhancements

- Add linting and formatting (ESLint, Prettier)
- Add pre-commit hooks
- Add CI/CD configuration
- Consider additional build tools if needed (esbuild for bundling)
- Add Docker configuration for deployment
- Add configuration file support (razorweave.config.ts)

### Migration Path

If monorepo becomes too large:
- Can split into separate repositories
- Can add build caching (Turborepo, Nx)
- Can extract shared package to separate npm package

## References

- [Directory Structure](DIRECTORY_STRUCTURE.md)
- [End-to-End Pipeline](../workflows/END_TO_END_PIPELINE.md)
- [Agent Instructions](../../AGENTS.md)
