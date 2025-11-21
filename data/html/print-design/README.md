# Print-Design HTML Output

This directory contains generated HTML files for the print-design workflow.

## Contents

- `core-rulebook.html` - Generated HTML for print/PDF output (gitignored)

## Usage

Generate HTML:

```bash
pnpm --filter @razorweave/tooling html:print:build
```

List builds:

```bash
pnpm --filter @razorweave/tooling html:print:list
```

Promote to exports (when ready):

```bash
pnpm --filter @razorweave/tooling html:print:promote
```

## Notes

- Generated files are tracked in the database (`html_builds` table)
- Each build records source hashes for change detection
- Use `promote` to copy validated builds to `books/core/v1/exports/html/`
