# @razorweave/site

Static site generator for Razorweave.

## Purpose

Generates the static website for publishing Razorweave books and content.

## Structure

- `generator/` - Site generation logic
- `templates/` - HTML templates
- `static/` - Static assets (CSS, images, etc.)

## Output

Generated site is output to the `site/public/` directory.

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm build:watch

# Type check
pnpm typecheck
```
