# Razorweave Core Rulebook

This directory contains the Razorweave Core Rulebook in multiple formats optimized for different use cases.

## Files

### `core_rulebook_web.html`
**Purpose:** Interactive web version for browser viewing
**Features:**
- JavaScript enhancements for improved navigation
- Back-to-top button for quick scrolling
- Scroll-spy navigation highlighting
- Keyboard shortcuts for navigation
- Optimized for online reading experience

**Use this version for:**
- Hosting on the web
- Interactive browser viewing
- Players/GMs accessing the rules online

### `core_rulebook_print.html`
**Purpose:** Print-optimized version for PDF generation
**Features:**
- No JavaScript dependencies
- Clean, static HTML
- Optimized for PDF rendering
- Consistent pagination-friendly layout

**Use this version for:**
- Generating PDFs with tools like Prince, WeasyPrint, or Puppeteer
- Print-friendly distribution
- Offline archival copies

### `core_rulebook.html` (Original)
**Purpose:** Reference/backup copy
**Status:** Preserved for historical reference
**Note:** New development should target either the web or print version as appropriate

## Development Strategy

Both versions currently share:
- Identical content structure
- Same CSS foundation
- Same semantic HTML markup

The versions will diverge as follows:
- **Web version** receives JavaScript enhancements (Tasks 22-24)
- **Print version** remains static and JavaScript-free

## Content Updates

When updating rulebook content:
1. Make content changes to **both** `core_rulebook_web.html` and `core_rulebook_print.html`
2. Keep the core content synchronized between versions
3. Only add JavaScript/interactive features to the web version
4. Test both versions after major updates

## PDF Generation

To generate a PDF from the print version:

```bash
# Using Puppeteer (Node.js)
npx puppeteer-pdf core_rulebook_print.html core_rulebook.pdf

# Using WeasyPrint (Python)
weasyprint core_rulebook_print.html core_rulebook.pdf

# Using Prince
prince core_rulebook_print.html -o core_rulebook.pdf
```

## Version Control

Both versions are tracked in git to maintain history and enable comparisons. The split occurred to support:
1. Enhanced web experience with JavaScript
2. Clean PDF generation without script artifacts
3. Independent optimization for each use case

---

**Last Updated:** 2025-11-18
**Current Version:** 1.0
