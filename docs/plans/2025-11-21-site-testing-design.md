# Site Testing Design

**Status:** Approved
**Date:** 2025-11-21

## Overview

End-to-end testing and visual regression for the Razorweave website (`src/site/`) using Playwright. Tests gate deployment to GitHub Pages and run on a scheduled basis to catch regressions.

## Goals

1. Catch JS regressions (TOC, keyboard nav, scroll behavior)
2. Catch visual/layout regressions across browsers
3. Validate print layout for read.html
4. Gate deployments - no deploy if tests fail
5. Scheduled runs to catch external breakage

## Test Structure

```
src/site/
├── tests/
│   ├── e2e/
│   │   ├── reader.spec.ts      # read.html functionality
│   │   ├── navigation.spec.ts  # site-wide nav, links
│   │   └── print.spec.ts       # print layout for read.html
│   ├── visual/
│   │   ├── snapshots/          # baseline screenshots (committed)
│   │   └── visual.spec.ts      # visual regression tests
│   └── playwright.config.ts
```

## Test Coverage

### reader.spec.ts (~8 tests)

- TOC toggle opens/closes on click
- TOC closes when clicking outside (mobile)
- TOC link click scrolls to section and closes TOC (mobile)
- Active section highlights on scroll
- Keyboard navigation works (if implemented)
- No console errors on page load
- All internal anchor links resolve
- Page renders without JS (graceful degradation)

### navigation.spec.ts (~6 tests)

- Nav toggle works on mobile viewport
- All nav links resolve (no 404s)
- PDF download link exists and points to valid file
- External links have rel="noopener"
- Footer links work
- 404 page renders correctly for bad URLs

### print.spec.ts (~3 tests)

- Print media query applies (TOC hidden, content full-width)
- No content overflow/clipping in print
- Page breaks don't split mid-paragraph (spot check)

### visual.spec.ts (~8 screenshots)

- read.html @ desktop (1280px)
- read.html @ mobile (375px)
- read.html @ print
- index.html @ desktop
- index.html @ mobile
- about.html @ desktop
- 404.html @ desktop
- read.html TOC open state @ mobile

**Total: ~25 tests + 8 visual snapshots**

## CI/CD Pipeline

### Workflow Structure

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup Node + pnpm
      - Install dependencies
      - Install Playwright browsers
      - Build site
      - Run Playwright tests
      - Upload test artifacts (screenshots, traces) on failure

  deploy:
    needs: test  # Gate: only deploy if tests pass
    runs-on: ubuntu-latest
    steps:
      - Build site
      - Deploy to GitHub Pages

  smoke-test:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - Run quick smoke test against live site (page loads, no 5xx errors)
```

### Scheduled Runs

Separate workflow with cron trigger:

- Schedule: Daily at 6am UTC
- Runs full test suite against live site
- Creates GitHub issue on failure

## Playwright Configuration

```typescript
{
  webServer: {
    command: 'pnpm preview',
    port: 4173
  },
  projects: [
    { name: 'desktop-chrome', use: { viewport: { width: 1280, height: 720 } } },
    { name: 'mobile-chrome', use: { viewport: { width: 375, height: 667 } } },
    { name: 'desktop-firefox', use: { browserName: 'firefox' } },
    { name: 'desktop-safari', use: { browserName: 'webkit' } }
  ],
  snapshotPathTemplate: '{testDir}/visual/snapshots/{projectName}/{testFilePath}/{arg}{ext}'
}
```

## Visual Regression Approach

- Baseline screenshots committed to repo
- ~8 screenshots total (~1-2MB)
- GitHub shows image diffs in PRs
- Developer updates baselines with `pnpm test:visual:update`

## Package Scripts

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:visual": "playwright test visual.spec.ts",
    "test:visual:update": "playwright test visual.spec.ts --update-snapshots",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug"
  }
}
```

## Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

## Implementation Phases

| Phase | Tasks |
|-------|-------|
| 1. Setup | Install Playwright, config, CI workflow updates |
| 2. Core tests | reader.spec.ts, navigation.spec.ts |
| 3. Print tests | print.spec.ts with emulateMedia |
| 4. Visual regression | visual.spec.ts, generate baselines |
| 5. CI integration | Deploy gate, smoke test, scheduled runs |

## Out of Scope (YAGNI)

- Unit tests for JS (Playwright covers real behavior)
- Cross-browser visual regression (functional cross-browser only)
- Accessibility testing (could add later with @axe-core/playwright)
- Performance testing (could add later)

## Developer Workflow

1. Make CSS/JS changes
2. Run `pnpm build` to rebuild dist/
3. Run `pnpm test` to run all tests
4. If visual changes are intentional:
   - Run `pnpm test:visual:update`
   - Review diff in git
   - Commit new snapshots
5. Push PR -> CI runs tests -> reviewer sees screenshot diffs
