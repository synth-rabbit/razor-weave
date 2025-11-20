# Razorweave Website - Phase 2: Enhanced Reader Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an enhanced online reading experience for the Razorweave Core Rulebook that surpasses PDF reading with navigation, responsive layouts, and cross-references.

**Architecture:** Adapt the existing standalone `core_rulebook.html` (485KB) into a web-integrated reader page. Extract content and TOC structure, apply synthwave theme styling, add enhanced navigation (breadcrumbs, progress indicator, quick jump menu), implement responsive layouts (collapsible TOC for tablet/mobile), and convert textual references to clickable links.

**Tech Stack:** HTML5, CSS3 (custom properties from theme.css), Vanilla JavaScript (progressive enhancement), existing build system (scripts/build.js)

**Dependencies:** Phase 1 complete (landing page, theme, components, build system all working)

---

## Task 1: Create Reader CSS File

**Files:**
- Create: `src/site/src/styles/reader.css`

**Step 1: Create reader-specific stylesheet**

```css
/* Reader Layout */
.reader-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.reader-toc {
  position: sticky;
  top: var(--spacing-lg);
  height: calc(100vh - var(--spacing-2xl));
  overflow-y: auto;
  padding-right: var(--spacing-md);
}

.reader-content {
  max-width: 800px;
  line-height: 1.7;
}

/* TOC Styling */
.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-list li {
  margin-bottom: var(--spacing-xs);
}

.toc-list a {
  display: block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  color: var(--color-ink-black);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.toc-list a:hover {
  background: var(--color-light-blue);
  color: var(--color-electric-blue);
}

.toc-list a.active {
  background: var(--color-electric-blue);
  color: var(--color-white);
  font-weight: 600;
}

/* Content Typography */
.reader-content h1 {
  color: var(--color-electric-blue);
  font-size: 2.75rem;
  margin-top: var(--spacing-2xl);
  margin-bottom: var(--spacing-lg);
}

.reader-content h2 {
  color: var(--color-deep-purple);
  font-size: 2rem;
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border-gray);
  padding-bottom: var(--spacing-sm);
}

.reader-content h3 {
  color: var(--color-hot-pink);
  font-size: 1.4rem;
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
}

.reader-content h4 {
  color: var(--color-ink-black);
  font-size: 1.1rem;
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

/* Tables */
.reader-content table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--spacing-lg) 0;
  font-size: 0.95rem;
}

.reader-content thead {
  background: var(--color-light-purple);
}

.reader-content th {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-weight: 600;
  color: var(--color-deep-purple);
  border-bottom: 2px solid var(--color-deep-purple);
}

.reader-content td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border-gray);
}

.reader-content tr:hover {
  background: var(--color-light-gray);
}

/* Lists */
.reader-content ul,
.reader-content ol {
  margin: var(--spacing-md) 0;
  padding-left: var(--spacing-xl);
}

.reader-content li {
  margin-bottom: var(--spacing-xs);
}

/* Code blocks */
.reader-content .example,
.reader-content .gm,
.reader-content .sheet-block {
  background: var(--color-light-gray);
  border-left: 4px solid var(--color-electric-blue);
  padding: var(--spacing-md) var(--spacing-lg);
  margin: var(--spacing-lg) 0;
  border-radius: var(--radius-md);
}

.reader-content .gm {
  border-left-color: var(--color-deep-purple);
  background: var(--color-light-purple);
}

.reader-content .sheet-block {
  border-left-color: var(--color-hot-pink);
  background: var(--color-light-pink);
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Tablet Responsive (768px and below) */
@media (max-width: 768px) {
  .reader-container {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 0;
  }

  .reader-toc {
    position: fixed;
    top: 0;
    left: -300px;
    width: 280px;
    height: 100vh;
    background: var(--color-white);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    transition: left var(--transition-normal);
    padding: var(--spacing-lg);
  }

  .reader-toc.open {
    left: 0;
  }

  .reader-content {
    padding: var(--spacing-lg);
  }

  .toc-toggle {
    display: block;
    position: fixed;
    top: var(--spacing-md);
    left: var(--spacing-md);
    z-index: 999;
    background: var(--color-electric-blue);
    color: var(--color-white);
    border: none;
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-md);
  }

  .toc-toggle:hover {
    background: var(--color-deep-purple);
  }
}

/* Desktop - hide toggle */
@media (min-width: 769px) {
  .toc-toggle {
    display: none;
  }
}

/* Mobile (480px and below) */
@media (max-width: 480px) {
  .reader-content h1 {
    font-size: 2rem;
  }

  .reader-content h2 {
    font-size: 1.5rem;
  }

  .reader-content h3 {
    font-size: 1.2rem;
  }
}
```

**Step 2: Verify file was created**

Run: `ls -la src/site/src/styles/reader.css`
Expected: File exists

**Step 3: Commit**

```bash
git add src/site/src/styles/reader.css
git commit -m "feat(site): add reader-specific CSS with responsive layouts

Added comprehensive CSS for enhanced reader experience:
- Two-column layout (TOC + content)
- Synthwave theme integration (Electric Blue, Hot Pink, Deep Purple)
- Responsive TOC (sticky desktop, overlay mobile)
- Typography styles for h1-h4, tables, lists
- Special blocks (examples, GM notes, character sheets)
- Smooth scrolling behavior

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Extract Rulebook Content Structure

**Files:**
- Read: `src/site/core_rulebook.html` (understand structure)
- Create: `src/site/scripts/extract-rulebook-content.js`

**Step 1: Create extraction script**

This script will help us understand and extract the TOC structure and content sections from the standalone rulebook.

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the standalone rulebook
const ruleBookPath = path.join(__dirname, '../core_rulebook.html');
const html = fs.readFileSync(ruleBookPath, 'utf-8');

// Extract TOC structure (nav element)
const tocMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
if (tocMatch) {
  console.log('TOC Structure Found:');
  console.log(tocMatch[1].substring(0, 500) + '...\n');
}

// Extract main content (main element)
const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
if (mainMatch) {
  console.log('Main Content Found:');
  console.log('Content length:', mainMatch[1].length, 'characters');
  console.log('First 500 chars:', mainMatch[1].substring(0, 500) + '...\n');
}

// Count sections
const sectionMatches = html.match(/<section/g);
console.log('Number of sections:', sectionMatches ? sectionMatches.length : 0);

// Check for IDs on headings
const h2Ids = html.match(/<h2[^>]+id=/g);
const h3Ids = html.match(/<h3[^>]+id=/g);
console.log('H2 elements with IDs:', h2Ids ? h2Ids.length : 0);
console.log('H3 elements with IDs:', h3Ids ? h3Ids.length : 0);

// Extract embedded styles length
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
console.log('\nEmbedded CSS length:', styleMatch ? styleMatch[1].length : 0, 'characters');
```

**Step 2: Run extraction script**

Run: `node src/site/scripts/extract-rulebook-content.js`
Expected: Output showing TOC structure, content length, section count, ID usage

**Step 3: Commit**

```bash
git add src/site/scripts/extract-rulebook-content.js
git commit -m "feat(site): add rulebook content extraction analysis script

Utility script to analyze core_rulebook.html structure:
- Extract TOC (nav) structure
- Identify main content boundaries
- Count sections and check heading IDs
- Measure embedded CSS

Helps inform read.html implementation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com)"
```

---

## Task 3: Create Reader JavaScript for TOC Toggle

**Files:**
- Create: `src/site/src/scripts/reader.js`

**Step 1: Create reader interactivity script**

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // TOC Toggle for mobile
  const tocToggle = document.querySelector('.toc-toggle');
  const toc = document.querySelector('.reader-toc');
  const content = document.querySelector('.reader-content');

  if (tocToggle && toc) {
    tocToggle.addEventListener('click', () => {
      toc.classList.toggle('open');
      tocToggle.textContent = toc.classList.contains('open')
        ? 'Close Menu'
        : 'Table of Contents';
    });

    // Close TOC when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 &&
          toc.classList.contains('open') &&
          !toc.contains(e.target) &&
          !tocToggle.contains(e.target)) {
        toc.classList.remove('open');
        tocToggle.textContent = 'Table of Contents';
      }
    });

    // Close TOC when clicking a link on mobile
    if (window.innerWidth <= 768) {
      toc.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toc.classList.remove('open');
          tocToggle.textContent = 'Table of Contents';
        });
      });
    }
  }

  // Active section highlighting
  const tocLinks = document.querySelectorAll('.toc-list a');
  const sections = document.querySelectorAll('.reader-content section[id], .reader-content h2[id], .reader-content h3[id]');

  function updateActiveSection() {
    let current = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    tocLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  if (sections.length > 0) {
    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection(); // Initial call
  }

  // Smooth scroll polyfill for older browsers
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
});
```

**Step 2: Verify file was created**

Run: `ls -la src/site/src/scripts/reader.js`
Expected: File exists

**Step 3: Commit**

```bash
git add src/site/src/scripts/reader.js
git commit -m "feat(site): add reader interactivity (TOC toggle, active highlighting)

Implemented reader JavaScript features:
- Mobile TOC toggle (open/close overlay)
- Click outside to close on mobile
- Auto-close TOC when clicking link (mobile)
- Active section highlighting during scroll
- Smooth scroll polyfill for TOC links

Progressive enhancement - works without JS.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Build Read Page HTML Structure

**Files:**
- Modify: `src/site/src/pages/read.html`

**Step 1: Replace placeholder with reader structure**

Replace the entire contents of `read.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Read Online - Razorweave Core Rulebook</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Styles -->
  <link rel="stylesheet" href="/styles/theme.css">
  <link rel="stylesheet" href="/styles/components.css">
  <link rel="stylesheet" href="/styles/reader.css">
</head>
<body>
  {{HEADER}}

  <!-- TOC Toggle Button (mobile only) -->
  <button class="toc-toggle">Table of Contents</button>

  <div class="reader-container">
    <!-- Table of Contents Sidebar -->
    <aside class="reader-toc">
      <h2>Contents</h2>
      <ul class="toc-list">
        <li><a href="#introduction">Introduction</a></li>
        <li><a href="#core-mechanics">Core Mechanics</a></li>
        <li><a href="#character-creation">Character Creation</a></li>
        <li><a href="#combat">Combat</a></li>
        <li><a href="#gm-guide">GM Guide</a></li>
      </ul>
    </aside>

    <!-- Main Content -->
    <main class="reader-content">
      <section id="introduction">
        <h1>Razorweave Core Rulebook</h1>
        <p><strong>A fiction-first tabletop RPG where narrative drives mechanics.</strong></p>

        <h2 id="what-is-razorweave">What is Razorweave?</h2>
        <p>Razorweave is a tabletop roleplaying game designed for collaborative storytelling. The rules are simple, the narrative is central, and the mechanics get out of your way.</p>

        <h3 id="core-philosophy">Core Philosophy</h3>
        <p>Fiction first. Always. The narrative determines what happens, and the mechanics support the story.</p>
      </section>

      <section id="core-mechanics">
        <h2>Core Mechanics</h2>
        <p>This section describes the fundamental game mechanics...</p>

        <h3 id="resolution">Resolution System</h3>
        <p>When the outcome is uncertain, roll dice...</p>
      </section>

      <section id="character-creation">
        <h2>Character Creation</h2>
        <p>Create your character in 5 simple steps...</p>
      </section>

      <section id="combat">
        <h2>Combat</h2>
        <p>Combat in Razorweave is fast and narrative-focused...</p>
      </section>

      <section id="gm-guide">
        <h2>GM Guide</h2>
        <p>Running Razorweave requires minimal prep...</p>
      </section>
    </main>
  </div>

  {{FOOTER}}

  <script src="/scripts/reader.js"></script>
</body>
</html>
```

**Step 2: Build and test**

Run: `cd src/site && pnpm build`
Expected: Build completes successfully

Run: `open dist/read.html` (or view in browser)
Expected: Reader page displays with placeholder content, TOC sidebar visible on desktop

**Step 3: Commit**

```bash
git add src/site/src/pages/read.html
git commit -m "feat(site): implement reader page structure with placeholder content

Created enhanced reader page with:
- Two-column layout (TOC sidebar + main content)
- Mobile TOC toggle button
- Placeholder sections matching rulebook structure
- Header/footer integration via partials
- Reader CSS and JavaScript loaded

Next: Replace placeholder content with actual rulebook.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Import Actual Rulebook Content

**Files:**
- Read: `src/site/core_rulebook.html` (extract TOC and content)
- Modify: `src/site/src/pages/read.html`

**Step 1: Extract TOC from core_rulebook.html**

Manually review `core_rulebook.html` and extract the actual TOC structure from the `<nav>` element. Update the TOC in `read.html` to match the real structure with actual section links.

**Step 2: Extract main content from core_rulebook.html**

Copy the `<main>` content from `core_rulebook.html` (all the sections) and paste into the `.reader-content` area of `read.html`, replacing the placeholder sections.

**Step 3: Remove embedded styles**

The content from `core_rulebook.html` may reference embedded CSS classes. Since we're using `reader.css` now, ensure all styling comes from our CSS files, not inline styles.

**Step 4: Build and visually test**

Run: `cd src/site && pnpm build`
Expected: Build completes

Run: `npx live-server dist --port=3000 --open=/read.html`
Expected: Full rulebook content displays with synthwave styling, TOC links work

**Step 5: Commit**

```bash
git add src/site/src/pages/read.html
git commit -m "feat(site): import full rulebook content into reader page

Replaced placeholder content with actual Razorweave rulebook:
- Extracted TOC structure from core_rulebook.html
- Imported all main content sections
- Preserved heading IDs for anchor links
- Removed embedded styles (using reader.css instead)

Reader now displays complete rulebook with synthwave theme.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com)"
```

---

## Task 6: Add Breadcrumb Navigation

**Files:**
- Modify: `src/site/src/styles/reader.css` (add breadcrumb styles)
- Modify: `src/site/src/pages/read.html` (add breadcrumb markup)
- Modify: `src/site/src/scripts/reader.js` (add breadcrumb updates)

**Step 1: Add breadcrumb CSS**

Add to `src/site/src/styles/reader.css`:

```css
/* Breadcrumb Navigation */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) 0;
  margin-bottom: var(--spacing-lg);
  font-size: 0.9rem;
  color: var(--color-medium-gray);
}

.breadcrumb a {
  color: var(--color-electric-blue);
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: var(--color-medium-gray);
}

.breadcrumb-current {
  font-weight: 600;
  color: var(--color-ink-black);
}

@media (max-width: 768px) {
  .breadcrumb {
    font-size: 0.85rem;
    padding: var(--spacing-sm) 0;
  }
}
```

**Step 2: Add breadcrumb markup to read.html**

Add after `<main class="reader-content">`:

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/index.html">Home</a>
  <span class="breadcrumb-separator">/</span>
  <a href="/read.html">Read</a>
  <span class="breadcrumb-separator">/</span>
  <span class="breadcrumb-current" id="breadcrumb-current">Introduction</span>
</nav>
```

**Step 3: Add breadcrumb update to reader.js**

Add to `updateActiveSection()` function:

```javascript
// Update breadcrumb
const breadcrumbCurrent = document.getElementById('breadcrumb-current');
if (breadcrumbCurrent && current) {
  const activeLink = document.querySelector(`.toc-list a[href="#${current}"]`);
  if (activeLink) {
    breadcrumbCurrent.textContent = activeLink.textContent;
  }
}
```

**Step 4: Build and test**

Run: `cd src/site && pnpm build && npx live-server dist --port=3000 --open=/read.html`
Expected: Breadcrumb appears above content, updates as you scroll

**Step 5: Commit**

```bash
git add src/site/src/styles/reader.css src/site/src/pages/read.html src/site/src/scripts/reader.js
git commit -m "feat(site): add breadcrumb navigation with scroll-based updates

Implemented breadcrumb trail:
- Shows current location (Home / Read / Section)
- Updates automatically as user scrolls
- Mobile responsive (smaller text)
- Semantic nav with aria-label

Improves wayfinding in long document.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Add Progress Indicator

**Files:**
- Modify: `src/site/src/styles/reader.css` (add progress bar styles)
- Modify: `src/site/src/pages/read.html` (add progress bar markup)
- Modify: `src/site/src/scripts/reader.js` (add progress calculation)

**Step 1: Add progress bar CSS**

Add to `src/site/src/styles/reader.css`:

```css
/* Progress Indicator */
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--color-light-gray);
  z-index: 9999;
}

.reading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-electric-blue), var(--color-hot-pink));
  transition: width 0.1s ease;
  width: 0%;
}

@media (max-width: 768px) {
  .reading-progress {
    height: 3px;
  }
}
```

**Step 2: Add progress bar markup**

Add at the very top of `<body>` in `read.html` (before `{{HEADER}}`):

```html
<div class="reading-progress">
  <div class="reading-progress-bar" id="progress-bar"></div>
</div>
```

**Step 3: Add progress calculation to reader.js**

Add new function and call it:

```javascript
// Reading Progress Indicator
function updateReadingProgress() {
  const progressBar = document.getElementById('progress-bar');
  if (!progressBar) return;

  const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;

  progressBar.style.width = scrolled + '%';
}

window.addEventListener('scroll', updateReadingProgress);
updateReadingProgress(); // Initial call
```

**Step 4: Build and test**

Run: `cd src/site && pnpm build && npx live-server dist --port=3000 --open=/read.html`
Expected: Progress bar at top of page fills as you scroll

**Step 5: Commit**

```bash
git add src/site/src/styles/reader.css src/site/src/pages/read.html src/site/src/scripts/reader.js
git commit -m "feat(site): add reading progress indicator bar

Implemented fixed progress bar at page top:
- Shows reading progress as user scrolls
- Gradient fill (Electric Blue → Hot Pink)
- Smooth transitions
- Mobile responsive (thinner bar)

Visual feedback for long-form reading.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Add Chapter Navigation (Prev/Next)

**Files:**
- Modify: `src/site/src/styles/reader.css` (add chapter nav styles)
- Modify: `src/site/src/scripts/reader.js` (add chapter nav generation)

**Step 1: Add chapter navigation CSS**

Add to `src/site/src/styles/reader.css`:

```css
/* Chapter Navigation */
.chapter-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-xl);
  border-top: 2px solid var(--color-border-gray);
  gap: var(--spacing-md);
}

.chapter-nav-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-white);
  border: 2px solid var(--color-electric-blue);
  border-radius: var(--radius-md);
  color: var(--color-electric-blue);
  text-decoration: none;
  font-weight: 600;
  transition: all var(--transition-fast);
  flex: 1;
  max-width: 300px;
}

.chapter-nav-btn:hover {
  background: var(--color-electric-blue);
  color: var(--color-white);
}

.chapter-nav-btn.prev {
  justify-content: flex-start;
}

.chapter-nav-btn.next {
  justify-content: flex-end;
  text-align: right;
}

.chapter-nav-label {
  font-size: 0.85rem;
  opacity: 0.8;
  display: block;
  margin-bottom: var(--spacing-xs);
}

@media (max-width: 768px) {
  .chapter-nav {
    flex-direction: column;
  }

  .chapter-nav-btn {
    width: 100%;
    max-width: none;
  }

  .chapter-nav-btn.next {
    text-align: left;
    justify-content: flex-start;
  }
}
```

**Step 2: Add chapter navigation generation to reader.js**

Add new function:

```javascript
// Generate Chapter Navigation
function generateChapterNav() {
  const mainSections = Array.from(document.querySelectorAll('.reader-content > section[id]'));

  mainSections.forEach((section, index) => {
    const navDiv = document.createElement('div');
    navDiv.className = 'chapter-nav';

    // Previous button
    if (index > 0) {
      const prevSection = mainSections[index - 1];
      const prevTitle = prevSection.querySelector('h2')?.textContent || 'Previous Section';
      const prevLink = document.createElement('a');
      prevLink.href = '#' + prevSection.id;
      prevLink.className = 'chapter-nav-btn prev';
      prevLink.innerHTML = `
        <span>
          <span class="chapter-nav-label">Previous</span>
          ${prevTitle}
        </span>
      `;
      navDiv.appendChild(prevLink);
    } else {
      navDiv.appendChild(document.createElement('div')); // Spacer
    }

    // Next button
    if (index < mainSections.length - 1) {
      const nextSection = mainSections[index + 1];
      const nextTitle = nextSection.querySelector('h2')?.textContent || 'Next Section';
      const nextLink = document.createElement('a');
      nextLink.href = '#' + nextSection.id;
      nextLink.className = 'chapter-nav-btn next';
      nextLink.innerHTML = `
        <span>
          <span class="chapter-nav-label">Next</span>
          ${nextTitle}
        </span>
      `;
      navDiv.appendChild(nextLink);
    }

    section.appendChild(navDiv);
  });
}

// Call after DOM loads
generateChapterNav();
```

**Step 3: Build and test**

Run: `cd src/site && pnpm build && npx live-server dist --port=3000 --open=/read.html`
Expected: Prev/Next buttons appear at bottom of each section

**Step 4: Commit**

```bash
git add src/site/src/styles/reader.css src/site/src/scripts/reader.js
git commit -m "feat(site): add chapter navigation (prev/next buttons)

Implemented chapter navigation at section ends:
- Previous/Next buttons linking to adjacent sections
- Generated dynamically from section structure
- Mobile responsive (stacked layout)
- Smooth scroll on click

Improves sequential reading flow.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Add Quick Jump Menu with Keyboard Shortcut

**Files:**
- Modify: `src/site/src/styles/reader.css` (add modal styles)
- Modify: `src/site/src/scripts/reader.js` (add quick jump modal)

**Step 1: Add quick jump modal CSS**

Add to `src/site/src/styles/reader.css`:

```css
/* Quick Jump Modal */
.quick-jump-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  align-items: center;
  justify-content: center;
}

.quick-jump-overlay.active {
  display: flex;
}

.quick-jump-modal {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.quick-jump-header {
  padding: var(--spacing-lg);
  border-bottom: 2px solid var(--color-border-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-jump-header h3 {
  margin: 0;
  color: var(--color-electric-blue);
}

.quick-jump-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-medium-gray);
  cursor: pointer;
  padding: var(--spacing-xs);
  line-height: 1;
}

.quick-jump-close:hover {
  color: var(--color-ink-black);
}

.quick-jump-content {
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.quick-jump-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.quick-jump-list li {
  margin-bottom: var(--spacing-sm);
}

.quick-jump-list a {
  display: block;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-light-gray);
  border-radius: var(--radius-sm);
  color: var(--color-ink-black);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.quick-jump-list a:hover {
  background: var(--color-electric-blue);
  color: var(--color-white);
}

.quick-jump-shortcut {
  font-size: 0.85rem;
  color: var(--color-medium-gray);
  margin-top: var(--spacing-xs);
}

@media (max-width: 768px) {
  .quick-jump-modal {
    width: 95%;
    max-height: 90vh;
  }
}
```

**Step 2: Add quick jump modal markup and JS**

Add to `reader.js`:

```javascript
// Quick Jump Modal
function createQuickJumpModal() {
  const overlay = document.createElement('div');
  overlay.className = 'quick-jump-overlay';
  overlay.id = 'quick-jump-overlay';

  const modal = document.createElement('div');
  modal.className = 'quick-jump-modal';

  const header = document.createElement('div');
  header.className = 'quick-jump-header';
  header.innerHTML = `
    <h3>Quick Jump</h3>
    <button class="quick-jump-close" aria-label="Close">&times;</button>
  `;

  const content = document.createElement('div');
  content.className = 'quick-jump-content';

  const list = document.createElement('ul');
  list.className = 'quick-jump-list';

  // Populate with all H2 sections
  document.querySelectorAll('.reader-content h2[id]').forEach(heading => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#' + heading.id;
    link.textContent = heading.textContent;
    link.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
    li.appendChild(link);
    list.appendChild(li);
  });

  content.appendChild(list);

  const shortcutHint = document.createElement('p');
  shortcutHint.className = 'quick-jump-shortcut';
  shortcutHint.textContent = 'Press Ctrl+K (or Cmd+K on Mac) to open quick jump';
  content.appendChild(shortcutHint);

  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close button
  header.querySelector('.quick-jump-close').addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
    }
  });

  return overlay;
}

// Create modal
const quickJumpModal = createQuickJumpModal();

// Keyboard shortcut (Ctrl+K or Cmd+K)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    quickJumpModal.classList.add('active');
  }
});
```

**Step 3: Build and test**

Run: `cd src/site && pnpm build && npx live-server dist --port=3000 --open=/read.html`
Expected: Press Ctrl+K (or Cmd+K) to open quick jump modal

**Step 4: Commit**

```bash
git add src/site/src/styles/reader.css src/site/src/scripts/reader.js
git commit -m "feat(site): add quick jump modal with keyboard shortcut

Implemented quick navigation modal:
- Keyboard shortcut (Ctrl+K / Cmd+K)
- Shows all major sections (H2 headings)
- Click to jump to section
- Close with X button, Escape key, or clicking outside
- Mobile responsive design

Improves navigation speed for power users.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Final Testing and Polish

**Files:**
- Test: All reader features across browsers and devices

**Step 1: Create testing checklist**

Test the following in Chrome, Firefox, and Safari:

**Desktop (1920x1080):**
- [ ] TOC sidebar visible and sticky
- [ ] TOC links work and highlight active section
- [ ] Breadcrumb updates on scroll
- [ ] Progress bar fills correctly
- [ ] Chapter nav buttons work
- [ ] Quick jump (Ctrl+K) opens and works
- [ ] Smooth scrolling works
- [ ] All content renders correctly

**Tablet (768px):**
- [ ] TOC becomes overlay
- [ ] TOC toggle button appears
- [ ] TOC overlay opens/closes correctly
- [ ] Clicking link closes TOC
- [ ] Clicking outside closes TOC
- [ ] Content readable and properly spaced

**Mobile (375px):**
- [ ] TOC overlay works smoothly
- [ ] Typography scales down appropriately
- [ ] Touch scrolling smooth
- [ ] Progress bar visible and accurate
- [ ] Chapter nav stacks vertically
- [ ] Quick jump modal responsive

**Step 2: Fix any issues found**

If you find layout issues, update CSS as needed.

**Step 3: Build final version**

Run: `cd src/site && pnpm build`
Expected: Clean build with no errors

**Step 4: Commit**

```bash
git add src/site/src/styles/reader.css src/site/src/scripts/reader.js src/site/src/pages/read.html
git commit -m "feat(site): final polish and cross-browser testing

Tested and verified reader experience:
- Desktop: TOC sidebar, smooth scrolling, all features
- Tablet: Collapsible TOC overlay, responsive layout
- Mobile: Touch-optimized, readable typography
- Cross-browser: Chrome, Firefox, Safari tested

All Phase 2 features complete and working.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com)"
```

---

## Phase 2 Complete

**Verification Checklist:**

Run all commands to verify:

```bash
# Build succeeds
cd src/site && pnpm build

# Serve locally
npx live-server dist --port=3000 --open=/read.html

# Check all files exist
ls -la src/site/src/styles/reader.css
ls -la src/site/src/scripts/reader.js
ls -la src/site/src/pages/read.html
```

**Expected Results:**
- [ ] Enhanced reader page displays complete rulebook
- [ ] TOC sidebar works (sticky on desktop, overlay on mobile)
- [ ] Breadcrumb trail updates on scroll
- [ ] Progress bar shows reading progress
- [ ] Chapter navigation (prev/next) works
- [ ] Quick jump modal (Ctrl+K) functional
- [ ] Smooth scrolling throughout
- [ ] Responsive on desktop, tablet, mobile
- [ ] All content properly styled with synthwave theme

**Files Created/Modified:**
- Created: `src/site/src/styles/reader.css`
- Created: `src/site/src/scripts/reader.js`
- Created: `src/site/scripts/extract-rulebook-content.js`
- Modified: `src/site/src/pages/read.html`

**Total Estimated Time:** 3-5 hours for all 10 tasks

---

## Next Phase

**Phase 3** will add interactive features:
- Bookmarking system (localStorage)
- Real-time search with highlighting
- Keyboard shortcuts for power users
- Additional polish and accessibility

The reader is now functional and superior to PDF reading! 🎉
