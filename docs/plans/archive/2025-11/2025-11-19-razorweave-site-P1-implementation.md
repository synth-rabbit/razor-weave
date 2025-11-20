# Razorweave Website - Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build foundation and landing page for razorweave.com with synthwave aesthetic, asset generation workflow, and GitHub Pages deployment.

**Architecture:** Static site with minimal build process. Shared CSS/HTML partials for consistency. AI-generated images for hero sections. Deploy to GitHub Pages with custom domain (razorweave.com).

**Tech Stack:**
- Plain HTML/CSS/JavaScript (no framework)
- Node.js build script for template processing
- Google Fonts (Space Grotesk, Inter)
- GitHub Actions for auto-deployment
- AI image generation (Midjourney/DALL-E/Stable Diffusion)

**Reference:** See `docs/plans/2025-11-19-razorweave-site-design.md` for complete design specifications.

---

## Task 1: Set Up Base File Structure

**Goal:** Create directory structure for the website in `src/site/`.

**Files:**
- Create: `src/site/public/images/hero/.gitkeep`
- Create: `src/site/public/images/textures/.gitkeep`
- Create: `src/site/public/images/decorative/.gitkeep`
- Create: `src/site/public/images/icons/.gitkeep`
- Create: `src/site/public/pdfs/.gitkeep`
- Create: `src/site/src/pages/.gitkeep`
- Create: `src/site/src/styles/.gitkeep`
- Create: `src/site/src/scripts/.gitkeep`
- Create: `src/site/src/partials/.gitkeep`
- Create: `src/site/scripts/.gitkeep`
- Create: `src/site/README.md`

### Step 1: Create public assets directories

```bash
mkdir -p src/site/public/images/{hero,textures,decorative,icons}
mkdir -p src/site/public/pdfs
touch src/site/public/images/hero/.gitkeep
touch src/site/public/images/textures/.gitkeep
touch src/site/public/images/decorative/.gitkeep
touch src/site/public/images/icons/.gitkeep
touch src/site/public/pdfs/.gitkeep
```

### Step 2: Create source directories

```bash
mkdir -p src/site/src/{pages,styles,scripts,partials}
mkdir -p src/site/scripts
touch src/site/src/pages/.gitkeep
touch src/site/src/styles/.gitkeep
touch src/site/src/scripts/.gitkeep
touch src/site/src/partials/.gitkeep
touch src/site/scripts/.gitkeep
```

### Step 3: Create README

File: `src/site/README.md`

```markdown
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
```

### Step 4: Commit base structure

```bash
git add src/site/
git commit -m "feat(site): create base directory structure

Added directory structure for Razorweave website:
- public/ for static assets (images, PDFs)
- src/ for source files (pages, styles, scripts, partials)
- scripts/ for build tooling

Phase 1: Foundation setup.
"
```

---

## Task 2: Set Up Package.json and Build System

**Goal:** Create package.json with build scripts and minimal build tooling.

**Files:**
- Create: `src/site/package.json`
- Create: `src/site/scripts/build.js`
- Create: `src/site/.gitignore`

### Step 1: Create package.json

File: `src/site/package.json`

```json
{
  "name": "razorweave-site",
  "version": "1.0.0",
  "description": "Static website for razorweave.com",
  "private": true,
  "scripts": {
    "dev": "live-server src/pages --port=3000 --open=/index.html",
    "build": "node scripts/build.js",
    "deploy": "pnpm build && gh-pages -d dist"
  },
  "devDependencies": {
    "live-server": "^1.2.2",
    "gh-pages": "^6.0.0",
    "fs-extra": "^11.1.1"
  },
  "keywords": ["ttrpg", "tabletop", "rpg", "razorweave"],
  "author": "Panda Edwards",
  "license": "UNLICENSED"
}
```

### Step 2: Create build script

File: `src/site/scripts/build.js`

```javascript
#!/usr/bin/env node

/**
 * Build script for Razorweave website
 * Processes HTML partials and copies assets to dist/
 */

const fs = require('fs-extra');
const path = require('path');

const SRC = path.join(__dirname, '../src');
const PUBLIC = path.join(__dirname, '../public');
const DIST = path.join(__dirname, '../dist');

console.log('🏗️  Building Razorweave website...\n');

// Clean dist directory
console.log('🧹 Cleaning dist/');
fs.emptyDirSync(DIST);

// Copy public assets as-is
console.log('📦 Copying public assets...');
if (fs.existsSync(PUBLIC)) {
  fs.copySync(PUBLIC, DIST);
  console.log('✓ Public assets copied\n');
} else {
  console.log('⚠️  No public/ directory found, skipping\n');
}

// Process HTML pages (insert partials)
console.log('📄 Processing HTML pages...');
const pagesDir = path.join(SRC, 'pages');

if (fs.existsSync(pagesDir)) {
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

  // Read partials
  const headerPath = path.join(SRC, 'partials/header.html');
  const footerPath = path.join(SRC, 'partials/footer.html');

  const header = fs.existsSync(headerPath)
    ? fs.readFileSync(headerPath, 'utf8')
    : '';
  const footer = fs.existsSync(footerPath)
    ? fs.readFileSync(footerPath, 'utf8')
    : '';

  pages.forEach(page => {
    let content = fs.readFileSync(path.join(pagesDir, page), 'utf8');

    // Replace placeholders
    content = content.replace('{{HEADER}}', header);
    content = content.replace('{{FOOTER}}', footer);

    fs.writeFileSync(path.join(DIST, page), content);
    console.log(`✓ Processed ${page}`);
  });

  console.log('');
} else {
  console.log('⚠️  No src/pages/ directory found\n');
}

// Copy styles
console.log('🎨 Copying styles...');
const stylesDir = path.join(SRC, 'styles');
if (fs.existsSync(stylesDir)) {
  fs.copySync(stylesDir, path.join(DIST, 'styles'));
  console.log('✓ Styles copied\n');
}

// Copy scripts
console.log('📜 Copying scripts...');
const scriptsDir = path.join(SRC, 'scripts');
if (fs.existsSync(scriptsDir)) {
  fs.copySync(scriptsDir, path.join(DIST, 'scripts'));
  console.log('✓ Scripts copied\n');
}

console.log('✅ Build complete! Output in dist/\n');
```

### Step 3: Create .gitignore for site

File: `src/site/.gitignore`

```
# Dependencies
node_modules/

# Build output
dist/

# Logs
npm-debug.log*
pnpm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

### Step 4: Install dependencies

```bash
cd src/site
pnpm install
```

Expected output: `✓ Dependencies installed`

### Step 5: Test build script

```bash
pnpm build
```

Expected output:
```
🏗️  Building Razorweave website...
🧹 Cleaning dist/
📦 Copying public assets...
✓ Public assets copied
📄 Processing HTML pages...
⚠️  No src/pages/ directory found
✅ Build complete! Output in dist/
```

### Step 6: Commit build system

```bash
git add src/site/package.json src/site/scripts/build.js src/site/.gitignore
git commit -m "feat(site): add build system and package.json

Added build infrastructure:
- package.json with dev, build, deploy scripts
- build.js script to process HTML partials and copy assets
- .gitignore for node_modules and dist/
- Dependencies: live-server, gh-pages, fs-extra

Phase 1: Build system setup.
"
```

---

## Task 3: Create AI Image Prompts File

**Goal:** Copy the AI image prompts file from design docs to src/site/ for easy access.

**Files:**
- Create: `src/site/AI-IMAGE-PROMPTS.md` (copy from `docs/plans/`)

### Step 1: Copy prompts file

```bash
cp ../../docs/plans/AI-IMAGE-PROMPTS.md src/site/AI-IMAGE-PROMPTS.md
```

### Step 2: Commit prompts file

```bash
git add src/site/AI-IMAGE-PROMPTS.md
git commit -m "docs(site): add AI image generation prompts

Copied AI-IMAGE-PROMPTS.md to src/site/ for easy reference
during asset generation phase.

Contains detailed prompts for:
- Background textures (3)
- Hero images (2)
- Feature icons (4+)
- Decorative elements (7)
- UI icons (7+)

Phase 1: Asset generation preparation.
"
```

---

## Task 4: Create Theme CSS (Synthwave Color System)

**Goal:** Create foundational CSS with synthwave color system and typography.

**Files:**
- Create: `src/site/src/styles/theme.css`

### Step 1: Create theme.css with color system

File: `src/site/src/styles/theme.css`

```css
/**
 * Razorweave Website - Theme Styles
 * Synthwave color system and typography foundation
 */

/* ===================================
   SYNTHWAVE COLOR SYSTEM
   =================================== */

:root {
  /* Core Synthwave Colors */
  --color-electric-blue: #00D9FF;
  --color-hot-pink: #FF006E;
  --color-deep-purple: #7B2CBF;

  /* Neutrals */
  --color-ink-black: #1A1A1A;
  --color-medium-gray: #6B6B6B;
  --color-border-gray: #E0E0E0;
  --color-light-gray: #F5F5F5;
  --color-white: #FFFFFF;

  /* Tinted Backgrounds */
  --color-light-blue: #E5FAFF;
  --color-light-pink: #FFE5F3;
  --color-light-purple: #F3E5FF;

  /* Semantic Colors */
  --color-success: #2D7A4F;
  --color-caution: #B88A2E;

  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}

/* ===================================
   TYPOGRAPHY
   =================================== */

body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.125rem; /* 18px base */
  line-height: 1.7;
  color: var(--color-ink-black);
  background: var(--color-white);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
  line-height: 1.2;
  margin: 0;
  font-weight: 700;
}

h1 {
  font-size: 3.5rem; /* 56px */
  color: var(--color-electric-blue);
  letter-spacing: -0.02em;
}

h2 {
  font-size: 2.5rem; /* 40px */
  color: var(--color-electric-blue);
  letter-spacing: -0.01em;
}

h3 {
  font-size: 1.75rem; /* 28px */
  color: var(--color-hot-pink);
}

h4 {
  font-size: 1.25rem; /* 20px */
  color: var(--color-hot-pink);
  font-weight: 600;
}

p {
  margin: 0 0 var(--spacing-md) 0;
}

a {
  color: var(--color-electric-blue);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-hot-pink);
}

/* ===================================
   UTILITIES
   =================================== */

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.text-center {
  text-align: center;
}

.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mt-lg { margin-top: var(--spacing-lg); }
.mt-xl { margin-top: var(--spacing-xl); }

.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }
.mb-xl { margin-bottom: var(--spacing-xl); }

/* ===================================
   RESPONSIVE
   =================================== */

@media (max-width: 768px) {
  body {
    font-size: 1rem; /* 16px on mobile */
  }

  h1 {
    font-size: 2.5rem; /* 40px */
  }

  h2 {
    font-size: 2rem; /* 32px */
  }

  h3 {
    font-size: 1.5rem; /* 24px */
  }

  .container {
    padding: 0 var(--spacing-md);
  }
}
```

### Step 2: Commit theme CSS

```bash
git add src/site/src/styles/theme.css
git commit -m "feat(site): add synthwave theme CSS

Created theme.css with:
- Synthwave color system (Electric Blue, Hot Pink, Deep Purple)
- CSS custom properties for colors, spacing, shadows
- Typography styles (Space Grotesk headings, Inter body)
- Utility classes (container, spacing, text alignment)
- Responsive breakpoints for mobile

Phase 1: Visual foundation.
"
```

---

## Task 5: Create Components CSS

**Goal:** Create reusable component styles (buttons, cards, navigation).

**Files:**
- Create: `src/site/src/styles/components.css`

### Step 1: Create components.css

File: `src/site/src/styles/components.css`

```css
/**
 * Razorweave Website - Component Styles
 * Reusable UI components (buttons, cards, navigation)
 */

/* ===================================
   BUTTONS
   =================================== */

.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: center;
}

.btn-primary {
  background: var(--color-electric-blue);
  color: var(--color-white);
}

.btn-primary:hover {
  background: var(--color-electric-blue);
  color: var(--color-white);
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: var(--color-hot-pink);
  border: 2px solid var(--color-hot-pink);
}

.btn-secondary:hover {
  background: var(--color-hot-pink);
  color: var(--color-white);
}

.btn-ghost {
  background: transparent;
  color: var(--color-electric-blue);
  text-decoration: underline;
  padding: 0.5rem 1rem;
}

.btn-ghost:hover {
  color: var(--color-hot-pink);
}

.btn-large {
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
}

/* ===================================
   CARDS
   =================================== */

.card {
  background: var(--color-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-accent-left {
  border-left: 4px solid var(--color-electric-blue);
}

.card-accent-top {
  border-top: 4px solid var(--color-hot-pink);
}

.card h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
}

.card p:last-child {
  margin-bottom: 0;
}

/* ===================================
   GRID LAYOUTS
   =================================== */

.grid {
  display: grid;
  gap: var(--spacing-lg);
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .grid-3,
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ===================================
   HEADER / NAVIGATION
   =================================== */

.site-header {
  background: var(--color-light-blue);
  border-bottom: 3px solid var(--color-electric-blue);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: var(--shadow-sm);
}

.site-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-logo {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-electric-blue);
  text-decoration: none;
  letter-spacing: 0.05em;
}

.site-logo:hover {
  color: var(--color-hot-pink);
}

.site-nav {
  display: flex;
  gap: var(--spacing-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.site-nav a {
  color: var(--color-ink-black);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.site-nav a:hover {
  background: var(--color-electric-blue);
  color: var(--color-white);
}

.site-nav a.active {
  background: var(--color-hot-pink);
  color: var(--color-white);
}

/* Mobile Navigation Toggle */
.nav-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.nav-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-ink-black);
  margin: 5px 0;
  transition: all var(--transition-fast);
}

@media (max-width: 768px) {
  .nav-toggle {
    display: block;
  }

  .site-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-light-blue);
    flex-direction: column;
    gap: 0;
    padding: var(--spacing-md);
    display: none;
    border-bottom: 3px solid var(--color-electric-blue);
  }

  .site-nav.open {
    display: flex;
  }

  .site-nav a {
    padding: var(--spacing-sm);
  }
}

/* ===================================
   FOOTER
   =================================== */

.site-footer {
  background: var(--color-light-gray);
  border-top: 2px solid var(--color-border-gray);
  padding: var(--spacing-xl) 0 var(--spacing-lg);
  margin-top: var(--spacing-2xl);
}

.site-footer .container {
  text-align: center;
}

.site-footer nav {
  margin-bottom: var(--spacing-md);
}

.site-footer nav a {
  color: var(--color-ink-black);
  margin: 0 var(--spacing-md);
  font-size: 0.95rem;
}

.site-footer p {
  color: var(--color-medium-gray);
  font-size: 0.875rem;
  margin: 0;
}

/* ===================================
   HERO SECTION
   =================================== */

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-2xl) 0;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.hero h1 {
  margin-bottom: var(--spacing-md);
  font-size: 4rem;
  background: linear-gradient(135deg, var(--color-electric-blue), var(--color-hot-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero p {
  font-size: 1.25rem;
  color: var(--color-medium-gray);
  margin-bottom: var(--spacing-xl);
}

.hero-cta {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2.5rem;
  }

  .hero p {
    font-size: 1.125rem;
  }

  .hero-cta {
    flex-direction: column;
    align-items: stretch;
  }
}
```

### Step 2: Commit components CSS

```bash
git add src/site/src/styles/components.css
git commit -m "feat(site): add component styles CSS

Created components.css with:
- Button styles (primary, secondary, ghost)
- Card components with hover effects
- Grid layout utilities (2, 3, 4 columns)
- Site header/navigation (sticky, responsive)
- Site footer
- Hero section layout

All components use synthwave color palette and are
fully responsive with mobile breakpoints.

Phase 1: Component foundation.
"
```

---

## Task 6: Create Header Partial

**Goal:** Create reusable header component with site navigation.

**Files:**
- Create: `src/site/src/partials/header.html`

### Step 1: Create header.html

File: `src/site/src/partials/header.html`

```html
<header class="site-header">
  <div class="container">
    <a href="/index.html" class="site-logo">RAZORWEAVE</a>

    <button class="nav-toggle" aria-label="Toggle navigation">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <nav>
      <ul class="site-nav">
        <li><a href="/index.html">Home</a></li>
        <li><a href="/read.html">Read</a></li>
        <li><a href="/about.html">About</a></li>
        <li><a href="/license.html">License</a></li>
      </ul>
    </nav>
  </div>
</header>
```

### Step 2: Commit header partial

```bash
git add src/site/src/partials/header.html
git commit -m "feat(site): add header partial

Created reusable header component with:
- RAZORWEAVE logo/wordmark
- Navigation links (Home, Read, About, License)
- Mobile hamburger menu toggle
- Responsive layout

Will be inserted into all pages via build script.

Phase 1: Shared components.
"
```

---

## Task 7: Create Footer Partial

**Goal:** Create reusable footer component with links and copyright.

**Files:**
- Create: `src/site/src/partials/footer.html`

### Step 1: Create footer.html

File: `src/site/src/partials/footer.html`

```html
<footer class="site-footer">
  <div class="container">
    <nav>
      <a href="/about.html">About</a>
      <a href="/license.html">License</a>
      <a href="https://github.com/synth-rabbit/razor-weave" target="_blank" rel="noopener">GitHub</a>
    </nav>
    <p>&copy; 2025 Panda Edwards. All rights reserved.</p>
  </div>
</footer>
```

### Step 2: Commit footer partial

```bash
git add src/site/src/partials/footer.html
git commit -m "feat(site): add footer partial

Created reusable footer component with:
- Links to About, License, GitHub
- Copyright notice
- Centered layout

Will be inserted into all pages via build script.

Phase 1: Shared components.
"
```

---

## Task 8: Create Landing Page (index.html)

**Goal:** Build the landing page with hero, features, preview, and downloads sections.

**Files:**
- Create: `src/site/src/pages/index.html`
- Create: `src/site/src/styles/landing.css`

### Step 1: Create landing.css for page-specific styles

File: `src/site/src/styles/landing.css`

```css
/**
 * Landing Page Specific Styles
 */

/* Hero Background Effects */
.hero {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f3460 100%);
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><line x1="0" y1="0" x2="100" y2="100" stroke="rgba(0,217,255,0.1)" stroke-width="1"/></svg>');
  background-size: 100px 100px;
  opacity: 0.3;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
}

/* Features Section */
.features {
  padding: var(--spacing-2xl) 0;
  background: var(--color-white);
}

.features h2 {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.feature-icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon svg {
  width: 100%;
  height: 100%;
}

.feature-card h3 {
  margin-bottom: var(--spacing-sm);
}

/* Preview Section */
.preview {
  padding: var(--spacing-2xl) 0;
  background: var(--color-light-blue);
}

.preview .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  align-items: center;
}

.preview-text h2 {
  margin-bottom: var(--spacing-md);
}

.preview-image {
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.preview-image img {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 768px) {
  .preview .container {
    grid-template-columns: 1fr;
  }
}

/* Downloads Section */
.downloads {
  padding: var(--spacing-2xl) 0;
  background: var(--color-white);
  text-align: center;
}

.downloads h2 {
  margin-bottom: var(--spacing-md);
}

.downloads p {
  max-width: 600px;
  margin: 0 auto var(--spacing-xl);
  color: var(--color-medium-gray);
}

.download-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xl);
}

.external-links {
  margin-top: var(--spacing-lg);
}

.external-links h3 {
  font-size: 1rem;
  color: var(--color-medium-gray);
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.external-links a {
  margin: 0 var(--spacing-sm);
}
```

### Step 2: Create index.html

File: `src/site/src/pages/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Razorweave - Tabletop RPG Core Rulebook</title>
  <meta name="description" content="A fiction-first tabletop RPG with modular complexity. Read online, download PDFs, and start your adventure.">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Styles -->
  <link rel="stylesheet" href="/styles/theme.css">
  <link rel="stylesheet" href="/styles/components.css">
  <link rel="stylesheet" href="/styles/landing.css">
</head>
<body>
  {{HEADER}}

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <h1>RAZORWEAVE</h1>
      <p class="hero-tagline">A fiction-first tabletop RPG where narrative drives mechanics, not the other way around.</p>
      <div class="hero-cta">
        <a href="/read.html" class="btn btn-primary btn-large">Start Reading</a>
        <a href="#downloads" class="btn btn-secondary btn-large">Download PDF</a>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features" id="features">
    <div class="container">
      <h2>What Makes This Special</h2>

      <div class="grid grid-3">
        <div class="card card-accent-left feature-card">
          <div class="feature-icon">
            <!-- Icon will be added later -->
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <h3>Fiction-First Mechanics</h3>
          <p>Your narrative choices shape the rules, not vice versa. Describe what your character does, and the mechanics follow naturally.</p>
        </div>

        <div class="card card-accent-left feature-card">
          <div class="feature-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="12" y="12" width="40" height="40" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <h3>Quick Character Creation</h3>
          <p>Jump into the game in minutes with streamlined character creation. Focus on story, not stat optimization.</p>
        </div>

        <div class="card card-accent-left feature-card">
          <div class="feature-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 8 L56 56 L8 56 Z" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <h3>Modular Complexity</h3>
          <p>Start with core rules and add depth as you grow. Perfect for newcomers and veterans alike.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Preview Section -->
  <section class="preview" id="preview">
    <div class="container">
      <div class="preview-text">
        <h2>Discover the World</h2>
        <p>Explore the complete core rulebook online with enhanced navigation, search, and bookmarking. A reading experience designed to be better than PDFs.</p>
        <a href="/read.html" class="btn btn-primary">Read the Full Book</a>
      </div>
      <div class="preview-image">
        <!-- Placeholder for preview image -->
        <img src="/images/hero/preview-scene.jpg" alt="Preview of Razorweave gameplay" style="aspect-ratio: 3/2; background: linear-gradient(135deg, var(--color-light-blue), var(--color-light-pink));">
      </div>
    </div>
  </section>

  <!-- Downloads Section -->
  <section class="downloads" id="downloads">
    <div class="container">
      <h2>Get the Game</h2>
      <p>Download the core rulebook in digital or print-friendly format. Free and ready to play.</p>

      <div class="download-buttons">
        <a href="/pdfs/razorweave-core-digital.pdf" class="btn btn-primary btn-large" download>
          Download Digital PDF
        </a>
        <a href="/pdfs/razorweave-core-print.pdf" class="btn btn-secondary btn-large" download>
          Download Print-Friendly PDF
        </a>
      </div>

      <div class="external-links">
        <h3>Also available on:</h3>
        <a href="https://itch.io" target="_blank" rel="noopener">itch.io</a>
        <span>•</span>
        <a href="https://drivethrurpg.com" target="_blank" rel="noopener">DriveThruRPG</a>
      </div>
    </div>
  </section>

  {{FOOTER}}

  <!-- Scripts -->
  <script src="/scripts/nav-toggle.js"></script>
</body>
</html>
```

### Step 3: Create nav-toggle.js for mobile menu

File: `src/site/src/scripts/nav-toggle.js`

```javascript
/**
 * Mobile Navigation Toggle
 */

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded',
        siteNav.classList.contains('open')
      );
    });

    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-header')) {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('open')) {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
```

### Step 4: Build and test landing page

```bash
pnpm build
```

Expected: No errors, dist/ contains index.html with header/footer inserted

### Step 5: Test local server

```bash
pnpm dev
```

Expected: Browser opens to localhost:3000 showing landing page

Manual verification:
- [ ] Header displays with navigation
- [ ] Hero section visible with gradient background
- [ ] Features section shows 3 cards
- [ ] Preview section layout correct
- [ ] Downloads section shows buttons
- [ ] Footer displays
- [ ] Mobile menu toggle works (resize browser)

### Step 6: Commit landing page

```bash
git add src/site/src/pages/index.html src/site/src/styles/landing.css src/site/src/scripts/nav-toggle.js
git commit -m "feat(site): add landing page

Created complete landing page with sections:
- Hero: Gradient background, title, tagline, CTAs
- Features: 3 cards highlighting game features
- Preview: Image + text encouraging online reading
- Downloads: PDF download buttons + external links

Includes:
- landing.css for page-specific styles
- nav-toggle.js for mobile menu functionality
- Placeholder icons and images (to be replaced)
- Fully responsive layout

Phase 1: Landing page foundation.
"
```

---

## Task 9: Create Placeholder Pages (About, License, Read)

**Goal:** Create basic placeholder pages for About, License, and Read sections.

**Files:**
- Create: `src/site/src/pages/about.html`
- Create: `src/site/src/pages/license.html`
- Create: `src/site/src/pages/read.html`

### Step 1: Create about.html

File: `src/site/src/pages/about.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - Razorweave</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles/theme.css">
  <link rel="stylesheet" href="/styles/components.css">

  <style>
    .about-page {
      padding: var(--spacing-2xl) 0;
    }

    .about-page .container {
      max-width: 800px;
    }

    .about-page h1 {
      margin-bottom: var(--spacing-lg);
    }

    .about-page h2 {
      margin-top: var(--spacing-xl);
      margin-bottom: var(--spacing-md);
    }
  </style>
</head>
<body>
  {{HEADER}}

  <main class="about-page">
    <div class="container">
      <h1>About Razorweave</h1>

      <section>
        <h2>The Project</h2>
        <p>Razorweave is a fiction-first tabletop RPG designed to put narrative at the forefront. Inspired by PbtA mechanics but with its own unique approach, the game emphasizes collaborative storytelling and meaningful character choices.</p>
        <p>[Content to be added: Project goals, philosophy, what makes it unique]</p>
      </section>

      <section>
        <h2>The Designer</h2>
        <p><strong>Panda Edwards</strong></p>
        <p>[Content to be added: Bio, design philosophy, contact information]</p>
      </section>

      <section>
        <h2>Credits & Acknowledgements</h2>
        <p>[Content to be added: Playtesters, contributors, inspirations]</p>
      </section>
    </div>
  </main>

  {{FOOTER}}
</body>
</html>
```

### Step 2: Create license.html

File: `src/site/src/pages/license.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>License - Razorweave</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles/theme.css">
  <link rel="stylesheet" href="/styles/components.css">

  <style>
    .license-page {
      padding: var(--spacing-2xl) 0;
    }

    .license-page .container {
      max-width: 800px;
    }

    .license-page h1 {
      margin-bottom: var(--spacing-lg);
    }

    .license-page h2 {
      margin-top: var(--spacing-xl);
      margin-bottom: var(--spacing-md);
    }
  </style>
</head>
<body>
  {{HEADER}}

  <main class="license-page">
    <div class="container">
      <h1>License & Legal</h1>

      <section>
        <h2>Rulebook License</h2>
        <p>[Content to be added: License for the Razorweave core rulebook]</p>
      </section>

      <section>
        <h2>Website License</h2>
        <p>[Content to be added: Website content and code licensing]</p>
      </section>

      <section>
        <h2>Third-Party Attributions</h2>
        <h3>Fonts</h3>
        <ul>
          <li><strong>Space Grotesk</strong> - Licensed under <a href="https://scripts.sil.org/OFL" target="_blank" rel="noopener">SIL Open Font License</a></li>
          <li><strong>Inter</strong> - Licensed under <a href="https://scripts.sil.org/OFL" target="_blank" rel="noopener">SIL Open Font License</a></li>
        </ul>

        <h3>Images</h3>
        <p>[Content to be added: Image attributions for AI-generated or CC-licensed images]</p>

        <h3>Code Libraries</h3>
        <ul>
          <li><strong>live-server</strong> - MIT License</li>
          <li><strong>gh-pages</strong> - MIT License</li>
          <li><strong>fs-extra</strong> - MIT License</li>
        </ul>
      </section>
    </div>
  </main>

  {{FOOTER}}
</body>
</html>
```

### Step 3: Create read.html (placeholder)

File: `src/site/src/pages/read.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Read Online - Razorweave</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles/theme.css">
  <link rel="stylesheet" href="/styles/components.css">

  <style>
    .reader-placeholder {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--spacing-2xl);
    }

    .reader-placeholder h1 {
      margin-bottom: var(--spacing-md);
    }

    .reader-placeholder p {
      color: var(--color-medium-gray);
      max-width: 600px;
      margin: 0 auto var(--spacing-lg);
    }
  </style>
</head>
<body>
  {{HEADER}}

  <main class="reader-placeholder">
    <div class="container">
      <h1>Enhanced Reader Coming Soon</h1>
      <p>The enhanced online reading experience with navigation, search, and bookmarking will be implemented in Phase 2.</p>
      <p>For now, you can download the PDF to read the complete core rulebook.</p>
      <a href="/index.html#downloads" class="btn btn-primary">Download PDF</a>
    </div>
  </main>

  {{FOOTER}}
</body>
</html>
```

### Step 4: Build and test all pages

```bash
pnpm build
```

Expected: All 4 HTML files in dist/ with header/footer inserted

### Step 5: Test navigation between pages

```bash
pnpm dev
```

Manual verification:
- [ ] Click "About" in navigation → loads about.html
- [ ] Click "License" in navigation → loads license.html
- [ ] Click "Read" in navigation → loads read.html placeholder
- [ ] Click "Home" or logo → returns to index.html
- [ ] All pages show header and footer
- [ ] All pages load styles correctly

### Step 6: Commit placeholder pages

```bash
git add src/site/src/pages/about.html src/site/src/pages/license.html src/site/src/pages/read.html
git commit -m "feat(site): add placeholder pages for About, License, Read

Created basic page structure:
- about.html: Placeholder for project, designer, credits
- license.html: Placeholder for licensing and attributions
- read.html: Placeholder for Phase 2 enhanced reader

All pages include:
- Header/footer partials
- Responsive layout
- Basic content structure for future completion

Phase 1: Site structure complete.
"
```

---

## Task 10: Set Up GitHub Actions Deployment

**Goal:** Configure automatic deployment to GitHub Pages on push to main.

**Files:**
- Create: `.github/workflows/deploy-site.yml`

### Step 1: Create GitHub Actions workflow

File: `.github/workflows/deploy-site.yml`

```yaml
name: Deploy Website to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'src/site/**'
      - '.github/workflows/deploy-site.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: |
          cd src/site
          pnpm install

      - name: Build site
        run: |
          cd src/site
          pnpm build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./src/site/dist
          cname: razorweave.com
```

### Step 2: Commit GitHub Actions workflow

```bash
git add .github/workflows/deploy-site.yml
git commit -m "ci(site): add GitHub Actions auto-deployment

Configured automatic deployment to GitHub Pages:
- Triggers on push to main branch
- Only runs when src/site/** changes
- Builds site and deploys to gh-pages branch
- Sets up custom domain (razorweave.com)

Deployment process:
1. Checkout code
2. Install Node.js and pnpm
3. Install dependencies
4. Build site
5. Deploy dist/ to GitHub Pages

Phase 1: Deployment automation.
"
```

### Step 3: Configure GitHub Pages in repository settings

**Manual steps (to be done in GitHub web UI):**

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `root`
4. Custom domain: `razorweave.com`
5. Enable "Enforce HTTPS" (after DNS propagates)

**DNS Configuration (at domain registrar):**

Add A records for `razorweave.com`:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Or add CNAME record for `www.razorweave.com`:
```
www.razorweave.com → synth-rabbit.github.io
```

---

## Task 11: Create GitHub Repository README

**Goal:** Create README for the GitHub repository with setup instructions.

**Files:**
- Create: `README.md` (root of repository)

### Step 1: Create README.md

File: `README.md` (in repository root, not src/site/)

```markdown
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
```

### Step 2: Commit README

```bash
git add README.md
git commit -m "docs: add repository README

Created root README with:
- Project overview
- Repository structure
- Local development instructions
- Links to design documents
- Deployment information

Phase 1: Documentation.
"
```

---

## Task 12: Push to GitHub and Verify Deployment

**Goal:** Push all changes to GitHub and verify auto-deployment works.

### Step 1: Push to origin

```bash
git push -u origin main
```

Expected: All commits pushed to https://github.com/synth-rabbit/razor-weave

### Step 2: Verify GitHub Actions run

1. Go to repository on GitHub
2. Click "Actions" tab
3. Verify "Deploy Website to GitHub Pages" workflow runs
4. Check for green checkmark (success)

Expected: Workflow completes successfully in ~2 minutes

### Step 3: Verify GitHub Pages deployment

1. Go to repository Settings → Pages
2. Verify "Your site is live at https://razorweave.com"
3. Check DNS status (may take 24-48 hours to propagate)

### Step 4: Test live site

Visit https://synth-rabbit.github.io/razor-weave/ (immediate) or https://razorweave.com (after DNS)

Manual verification:
- [ ] Landing page loads correctly
- [ ] Navigation works (Home, About, License, Read)
- [ ] Styles load (synthwave colors visible)
- [ ] Mobile menu toggle works (resize browser)
- [ ] Footer displays
- [ ] No console errors

---

## Summary

**Phase 1 Complete!**

You now have:
- ✅ Base file structure for website
- ✅ Build system (Node.js script, partials processing)
- ✅ Synthwave theme CSS with color system
- ✅ Component library (buttons, cards, grid, nav, footer)
- ✅ Header and footer partials
- ✅ Complete landing page with hero, features, preview, downloads
- ✅ Placeholder pages (About, License, Read)
- ✅ GitHub Actions auto-deployment
- ✅ Live site at razorweave.com (pending DNS)

**Total Tasks:** 12
**Total Commits:** 12
**Estimated Time:** 4-6 hours

---

## Next Steps

**Asset Generation:**
Before moving to Phase 2 (Reader Experience), generate visual assets using AI:

1. Review `src/site/AI-IMAGE-PROMPTS.md`
2. Generate high-priority assets:
   - Background textures (3)
   - Hero images (2)
   - Feature icons (4)
   - UI icons (7)
3. Place assets in `src/site/public/images/`
4. Update landing page to use real images
5. Commit assets

**Phase 2: Reader Experience**
Implement enhanced online reading:
- Import and adapt core rulebook HTML
- Phase 1 reader enhancements (nav, responsive, cross-refs)
- Phase 2 features (bookmarks, search)
- Phase 3 features (reading modes - optional)

**Ready to generate assets or move to Phase 2?**
