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
