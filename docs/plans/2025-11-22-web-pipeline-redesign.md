# Web HTML Pipeline Redesign

**Date:** 2025-11-22
**Status:** Approved
**Goal:** Fix immediate site issues and establish a maintainable web pipeline using Eleventy

## Problem Statement

The local `src/site` is broken and out of sync with production:
- Vite dev server doesn't serve styles/scripts correctly
- HTML bugs (e.g., `about.html` has a `<link>` inside a `<style>` block)
- Missing features that exist on production (bookmarks, reader settings)
- Fragile `{{HEADER}}` partial injection system prone to errors

Production (razorweave.com) is the source of truth - local is stale/broken.

## Goals

1. **Unblock testing** - Fix immediate issues so local dev works
2. **Production parity** - Local matches razorweave.com behavior
3. **Don't worry about it** - Architecture that prevents future issues
4. **CI/CD compatibility** - Don't break existing GitHub Actions deployment

## Approach: Two Phases

### Phase 1: Quick Fixes (Unblock Testing)

#### Step 1.1: Mirror Production
```bash
wget --mirror --convert-links --page-requisites \
  --no-parent -P data/production-mirror \
  https://razorweave.com/
```
Creates complete reference copy at `data/production-mirror/razorweave.com/`.

#### Step 1.2: Diff and Compare
- Compare `production-mirror/.../styles/` vs `src/site/src/styles/`
- Compare `production-mirror/.../scripts/` vs `src/site/src/scripts/`
- Identify what's missing locally
- Identify what's different
- **Preserve** recent html-gen changes (sheets.css, print.css, reader.css edits)

#### Step 1.3: Surgical Merge
- Pull missing JS features from production (bookmarks, reader settings)
- Pull missing CSS that doesn't conflict with html-gen work
- Fix HTML bugs manually
- Don't overwrite recent improvements

#### Step 1.4: Fix Vite Dev Server
- Serve `src/styles/` at `/styles/`
- Serve `src/scripts/` at `/scripts/`
- Serve `public/` for images and assets
- Single command `pnpm dev` that works

#### Step 1.5: Validate
- Visual comparison: local vs production
- Run existing Playwright tests
- Manual test of interactive features

### Phase 2: Eleventy Migration

#### Why Eleventy
| Factor | Why Eleventy |
|--------|-------------|
| Project size | 7 pages - perfect scale for 11ty |
| Existing setup | Works with existing HTML/CSS/JS |
| Template inheritance | Prevents bugs like malformed about.html |
| Zero config start | Works out of the box |
| Markdown support | Native support for book content |
| Hot reload | Built-in dev server |
| Longevity | Mature, stable, minimal dependencies |

#### Step 2.1: Add Eleventy
```bash
cd src/site
pnpm add -D @11ty/eleventy
```

#### Step 2.2: Directory Structure
```
src/site/
├── _includes/
│   ├── layouts/
│   │   └── base.njk        # Full HTML shell
│   └── partials/
│       ├── header.njk      # Migrated from header.html
│       └── footer.njk      # Migrated from footer.html
├── pages/
│   ├── index.njk
│   ├── about.njk
│   ├── read.njk            # Includes html-gen output
│   ├── license.njk
│   ├── privacy.njk
│   ├── terms.njk
│   └── 404.njk
├── src/
│   ├── styles/             # Keep existing CSS
│   └── scripts/            # Keep existing JS
├── public/                  # Static assets
├── .eleventy.js            # Eleventy config
└── package.json
```

#### Step 2.3: Integration with html-gen
- **html-gen responsibility:** Markdown → HTML with transforms (GM boxes, example blocks, sheets, fill-lines)
- **Eleventy responsibility:** Site shell (layouts, header, footer, navigation, scripts)
- **Contract:** html-gen outputs content-only HTML, Eleventy wraps it

#### Step 2.4: Update Scripts

**src/site/package.json:**
```json
{
  "scripts": {
    "dev": "eleventy --serve",
    "build": "eleventy",
    "deploy": "pnpm build && gh-pages -d dist"
  }
}
```

**Root package.json additions:**
```json
{
  "scripts": {
    "site:dev": "pnpm --filter razorweave-site dev",
    "site:build": "pnpm --filter razorweave-site build",
    "site:test": "pnpm --filter razorweave-site test",
    "site:test:visual": "pnpm --filter razorweave-site test:visual",
    "site:deploy": "pnpm --filter razorweave-site deploy"
  }
}
```

#### Step 2.5: Eleventy Config
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy("public");

  return {
    dir: {
      input: "pages",
      includes: "../_includes",
      output: "dist"
    }
  };
};
```

## CI/CD Compatibility

**Existing workflows:**
- `deploy-site.yml`: Test → Build → Deploy to GitHub Pages
- `site-health-check.yml`: Daily tests against live site

**Key integration points:**
| Step | Requirement |
|------|-------------|
| `pnpm install` | Dependencies in `src/site/package.json` |
| `pnpm build` | Must output to `./src/site/dist` |
| `pnpm test` | Playwright tests must pass |
| Publish dir | `./src/site/dist` |

**Migration safety:**
- Configure Eleventy to output to `dist/` (not default `_site/`)
- As long as `pnpm build` produces correct `dist/`, CI works unchanged
- Tests run before deploy, broken builds won't deploy

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Production has features not in repo | Mirror + diff approach |
| Eleventy learning curve | Minimal - works with existing HTML |
| Breaking CI | Run both builds, compare before switching |
| html-gen integration complexity | Clear contract: content vs shell |
| Overwriting html-gen work | Surgical merge, preserve recent changes |

## Success Criteria

1. `pnpm site:dev` starts working dev server with hot reload
2. Local site visually matches razorweave.com
3. All interactive features work (bookmarks, reader settings, dark mode)
4. Playwright tests pass
5. `pnpm site:build` produces deployable `dist/`
6. CI/CD continues working without modification
