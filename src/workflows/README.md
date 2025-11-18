# @razorweave/workflows

Workflow orchestration for content pipelines.

## Purpose

Implements the end-to-end pipeline for creating, reviewing, improving, and publishing content. Orchestrates multiple agents to execute complex multi-step workflows.

## Structure

- `pipelines/` - Pipeline implementations (content, improvement, PDF, release)
- `orchestration/` - Pipeline execution and state management
- `stages/` - Individual workflow stages

## Pipelines

Implements the iterative improvement process:
1. Content creation → review → analysis
2. Iterative improvement (PM → Writer → Expert → Editor loop)
3. HTML generation
4. PDF creation (draft → production)
5. Release

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm build:watch

# Type check
pnpm typecheck
```
