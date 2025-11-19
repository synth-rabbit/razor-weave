# Razorweave Website

Static website for razorweave.com - tabletop RPG core rulebook.

## Local Development

```bash
cd src/site
pnpm install
pnpm dev       # Start local server at localhost:3000
```

## Build

```bash
pnpm build     # Outputs to dist/
```

## Deploy

Automatic deployment to GitHub Pages on push to main branch.

## Structure

- `public/` - Static assets (images, PDFs, fonts)
- `src/pages/` - HTML page templates
- `src/styles/` - CSS files
- `src/scripts/` - JavaScript files
- `src/partials/` - Shared HTML components (header, footer)
- `scripts/` - Build scripts

## Design

See `../../docs/plans/2025-11-19-razorweave-site-design.md` for complete design specifications.
