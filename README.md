# Razorweave

A fiction-first tabletop RPG core rulebook project.

## Website

Live at: [razorweave.com](https://razorweave.com)

The website provides:
- Enhanced online reading experience
- PDF downloads (digital and print-friendly)
- About and licensing information

## Repository Structure

```
.
├── books/                 # Core rulebook content and exports
├── src/
│   ├── site/             # Website source (HTML, CSS, JS)
│   └── tooling/          # Project tooling and scripts
├── docs/                  # Design documents and plans
└── .github/              # GitHub Actions workflows
```

## Local Development

### Website

```bash
cd src/site
pnpm install
pnpm dev       # Start local server at localhost:3000
pnpm build     # Build for production
```

### Tooling

```bash
pnpm install   # Install all workspace dependencies
pnpm test      # Run tests
pnpm lint      # Lint code
```

## Design Documents

See `docs/plans/` for comprehensive design specifications:
- [Website Design](docs/plans/2025-11-19-razorweave-site-design.md)
- [AI Image Prompts](docs/plans/AI-IMAGE-PROMPTS.md)
- [Asset Manifest](docs/plans/ASSET-MANIFEST.md)

## Deployment

The website automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

Deployment workflow: `.github/workflows/deploy-site.yml`

## License

[To be determined]

## Author

Panda Edwards
