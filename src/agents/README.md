# @razorweave/agents

Agent implementations for content, review, playtest, PDF, and release.

## Purpose

This package contains all agent implementations that use LLMs and traditional code to generate content, run reviews, simulate playtests, create PDFs, and handle releases.

## Structure

- `content/` - Content generation agents (chapter, lore, campaign generators)
- `review/` - Persona-based review agents and analysis generators
- `playtest/` - Play session simulation and analysis
- `pdf/` - HTML and PDF generation
- `release/` - Publication automation and site updates

## Agent Pattern

All agents follow a consistent structure:
1. Read context (rules, content, style guides)
2. Build prompt from context
3. Call LLM
4. Post-process and validate
5. Write output

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm build:watch

# Type check
pnpm typecheck
```
