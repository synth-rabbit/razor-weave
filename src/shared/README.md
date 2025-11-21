# @razorweave/shared

Shared types, utilities, and abstractions for Razorweave.

## Purpose

This package provides common code used across all workspace packages to avoid duplication and ensure consistency.

## Structure

- `types/` - Shared TypeScript types (Book, Persona, Agent, Config, etc.)
- `llm/` - LLM client abstraction and provider wrappers
- `fs/` - File system utilities (BookReader, BookWriter, paths, markdown)
- `utils/` - Common utilities (logger, errors, validation)
- `personas/` - Persona loading and selection

## Usage

Import from other workspace packages:

```typescript
import { LLMClient, BookReader } from '@razorweave/shared';
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm build:watch

# Type check
pnpm typecheck
```
