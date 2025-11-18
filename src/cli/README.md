# @razorweave/cli

Command-line interface for Razorweave.

## Purpose

Provides command-line tools to run agents, execute workflows, and manage the Razorweave project.

## Structure

- `commands/` - CLI command implementations organized by domain
- `lib/` - Command base classes and utilities
- `bin/` - Executable entry point

## Usage

```bash
# After building
razorweave --help

# Example commands (to be implemented)
razorweave content generate --book core --chapter intro
razorweave review run --book core
razorweave pipeline run --book core --full
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
