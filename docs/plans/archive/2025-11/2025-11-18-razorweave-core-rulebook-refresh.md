# Razorweave Core Rulebook Web Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign `src/site/core_rulebook_web.html` into a polished single-file experience with modern navigation, typography, sheet styling, interactivity, and print polish.

**Architecture:** Keep everything inside the HTML file. Use semantic sections, CSS custom properties for the illuminated-UI theme, and lightweight vanilla JS for interactivity (TOC slide-out, scrollspy, accordions). Responsive layout relies on CSS Grid/Flexbox with fallbacks stacked vertically on small screens.

**Tech Stack:** Plain HTML5, CSS3 (custom properties, grid, flex), vanilla ES modules, prefers-reduced-motion + print media queries.

---

### Task 1: Define Theme Tokens, Textures, and Base Typography

**Files:**
- Modify: `src/site/core_rulebook_web.html` (`<style>` block and `<body>` scaffolding)

**Step 1: Introduce CSS custom properties**

Add a `:root` block with palette, spacing, elevation, and typography scale:

```css
:root {
  --color-parchment-light: #f8f2e5;
  --color-parchment-dark: #e6dac1;
  --color-ink: #221a11;
  --color-ember: #b7482b;
  --color-sapphire: #0d4f8b;
  --color-amethyst: #6a3fb5;
  --color-gold: #c9a75f;
  --font-display: "Spectral SC", "Cormorant Garamond", serif;
  --font-body: "Source Serif 4", "Georgia", serif;
  --font-ui: "Inter", "Source Sans 3", sans-serif;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --radius-card: 18px;
  --shadow-card: 0 15px 40px rgba(12, 18, 31, 0.18);
}
```

**Step 2: Apply parchment background and texture**

Wrap existing `main` content in a `.codex-shell` element:

```html
<body>
  <div class="codex-shell">
    <aside class="toc-panel">…</aside>
    <main class="codex-content">…</main>
  </div>
</body>
```

Add CSS for a layered parchment look using gradients and background images (inline SVG noise or data URI). Ensure body gets a diagonal jewel-toned gradient behind the parchment panel.

**Step 3: Reset typography rhythm**

Use base font-size 17px, `line-height: 1.65`, `max-width: 72ch`. Update headings to follow the 3-tier scale with small caps, letterspace, and chapter numerals. Example:

```css
h1 {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 3vw, 3.4rem);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
p {
  font-family: var(--font-body);
  margin-bottom: var(--space-4);
}
```

**Step 4: Verify locally**

Run `open src/site/core_rulebook_web.html` and confirm:
- Background shows parchment slab with soft drop-shadow.
- Text uses new fonts/spacing and remains legible on mobile.

**Step 5: Commit**

```bash
git add src/site/core_rulebook_web.html
git commit -m "feat: add theme tokens and base typography"
```

---

### Task 2: Build Responsive Layout Scaffold and Hero Elements

**Files:**
- Modify: `src/site/core_rulebook_web.html`

**Step 1: Implement grid container**

Add `.codex-shell` grid with columns `[toc-panel 320px][content auto][sidenotes 240px]` at ≥1280px, collapsing to two columns at 1024px, stack at 767px. Ensure `.codex-content` keeps padding and drop-shadow.

**Step 2: Add hero banner + chapter intro pattern**

Create a `.chapter-hero` component with gradient overlay, chapter numeral, title, and summary text. Use `::before` pseudo-element for watercolor splash.

```html
<section class="chapter-hero" id="chapter-1">
  <div class="chapter-meta">
    <span class="chapter-number">I</span>
    <h1>Foundations of Razorweave</h1>
    <p class="chapter-lede">…</p>
  </div>
</section>
```

**Step 3: Add sidenote rail**

Introduce `.sidenote` elements for GM notes/examples aligned in the third column; on narrow screens they drop inline. Style with gold borders and icon badges.

**Step 4: Verify layout**

Use `open src/site/core_rulebook_web.html` and resize browser ensuring:
- Grid collapses smoothly.
- Chapter hero spans full width with baselined text.

**Step 5: Commit**

```bash
git add src/site/core_rulebook_web.html
git commit -m "feat: scaffold codex layout and hero sections"
```

---

### Task 3: Implement Slide-Out Table of Contents with Scrollspy

**Files:**
- Modify: `src/site/core_rulebook_web.html` (HTML structure, CSS, JS)

**Step 1: Replace existing `<nav>` with slide-out panel**

Structure:

```html
<aside class="toc-panel collapsed" aria-label="Table of contents">
  <button class="toc-toggle" aria-expanded="false">
    <span class="sr-only">Toggle table of contents</span>
    <svg>…sigil…</svg>
  </button>
  <div class="toc-scroll">
    <button class="toc-pin">Pin</button>
    <ul class="toc-root" role="tree">…</ul>
  </div>
</aside>
```

**Step 2: Style animations**

Use CSS transitions to slide panel (`transform: translateX(-100%)`) when collapsed. Provide glassmorphism background with blur. Keep `@media (prefers-reduced-motion)` overrides to disable sliding.

**Step 3: Build JS for toggle/pin + nested collapsing**

Add a `<script>` block:

```js
const toc = document.querySelector(".toc-panel");
const toggle = toc.querySelector(".toc-toggle");
toggle.addEventListener("click", () => {
  toc.classList.toggle("collapsed");
  toggle.setAttribute("aria-expanded", !toc.classList.contains("collapsed"));
});

document.querySelectorAll(".toc-root button").forEach((btn) => {
  btn.addEventListener("click", () => btn.parentElement.classList.toggle("is-open"));
});
```

Add keyboard shortcuts (`[` toggles, `Shift+[ ` pins) and ensure focus trapping when open on mobile.

**Step 4: Add scrollspy**

Use `IntersectionObserver` to toggle `.active` classes and update `aria-current="true"` on visible sections. Provide `data-toc-target` attributes.

**Step 5: Verify**

Run `open src/site/core_rulebook_web.html` and test:
- Panel slides in/out, can pin, and nested lists collapse.
- Scrollspy highlights current section; keyboard shortcut works.

**Step 6: Commit**

```bash
git add src/site/core_rulebook_web.html
git commit -m "feat: add slide-out TOC with scrollspy"
```

---

### Task 4: Enhance Typography, Drop Caps, and Content Modules

**Files:**
- Modify: `src/site/core_rulebook_web.html`

**Step 1: Implement drop caps and small caps**

Add `.dropcap:first-letter` styles for introductory paragraphs and `.section-label` small caps for subsections. Example CSS:

```css
.dropcap:first-letter {
  float: left;
  font-size: 4.2rem;
  line-height: 0.9;
  color: var(--color-ember);
  margin-right: var(--space-3);
}
```

**Step 2: Create reusable callout components**

Define `.callout-rule`, `.callout-example`, `.callout-gm` with icons, gradient borders, and optional collapsible content using `<details>`.

**Step 3: Implement inline glossary popovers**

Add `<button class="term">` wrappers with tooltip-like panels triggered via JS (ARIA `role="tooltip"`). Provide fallback static definitions for print by duplicating definitions in footers.

**Step 4: Verify readability**

Open file, verify baseline grid (inspect using `body::before` debug overlay if needed), ensure headings/p callouts consistent.

**Step 5: Commit**

```bash
git add src/site/core_rulebook_web.html
git commit -m "feat: refine typography and rule callouts"
```

---

### Task 5: Rework Reference Sections, Index, and Tables

**Files:**
- Modify: `src/site/core_rulebook_web.html`

**Step 1: Create ledger mode layout**

Wrap dense sections in `.ledger` container:

```html
<section class="ledger" id="index">
  <header>
    <h2>Index of Threads</h2>
    <div class="ledger-filters">
      <button data-filter="all" class="chip active">All</button>
      …
    </div>
  </header>
  <div class="ledger-grid">
    <article class="ledger-entry">…</article>
  </div>
</section>
```

Use CSS grid with 2–3 columns, column rules, and smaller serif text.

**Step 2: Enhance tables**

Introduce `.table-scroll` wrappers with sticky headers, zebra stripes referencing theme colors, and responsive stacks for mobile. Add `data-label` attributes for pseudo-content on small screens.

**Step 3: Implement collapsible accordions for FAQs**

Use `<details class="accordion">` with custom triangle icons; ensure they integrate with ledger backgrounds.

**Step 4: Verify**

Reload page, ensure filters respond (use simple JS to toggle `.is-hidden`), mobile view stacks columns cleanly.

**Step 5: Commit**

```bash
git add src/site/core_rulebook_web.html
git commit -m "feat: redesign ledger/index layouts and tables"
```

---

### Task 6: Redesign Character Sheets and Interactive Panels

**Files:**
- Modify: `src/site/core_rulebook_web.html`

**Step 1: Build sheet containers**

Use `.sheet` wrappers with blueprint grid background, labeled sections via CSS grid:

```html
<section class="sheet" aria-label="Character sheet">
  <header>
    <h3>Character Sheet</h3>
    <button class="sheet-export">Export PDF</button>
  </header>
  <div class="sheet-grid">
    <div class="sheet-block attributes">…</div>
    <div class="sheet-block abilities">…</div>
  </div>
</section>
```

**Step 2: Add interactive cues**

Include hover/focus states mimicking writable fields, optional `<input type="text">` placeholders for future functionality (but keep static for now). Print styles should remove backgrounds but keep borders.

**Step 3: Provide icons and progress trackers**

Embed inline SVG icons (quill, die, weave) for headings. Add `.trackers` with pseudo-numeric counters and `progress` bars styled to look like etched gauges.

**Step 4: Verify**

Open page in desktop + print preview; ensure sheets feel like full-size forms and align to grid.

**Step 5: Commit**

```bash
git add src/site/core_rulebook_web.html
git commit -m "feat: refresh character sheet styling"
```

---

### Task 7: Print Styles, Reduced Motion, and Final QA

**Files:**
- Modify: `src/site/core_rulebook_web.html`

**Step 1: Add `@media print` block**

Set `@page` margins (0.7in top/bottom, 0.65in sides), define running headers/footers using `@page :right` and CSS `content`. Remove box shadows, background gradients, and convert palette to CMYK-safe equivalents (dark desaturated jewel tones).

**Step 2: Add utility classes**

Create `.print-break-before`, `.print-break-after`, `.no-print`, `.print-only` to manage pagination. Apply to major sections and interactive-only widgets (e.g., TOC toggle).

**Step 3: Respect reduced motion**

Add `@media (prefers-reduced-motion: reduce)` to disable transitions/animations for TOC, tooltips, gradients.

**Step 4: Final verification**

Commands:
```bash
open src/site/core_rulebook_web.html            # verify desktop interactions
open -a "Google Chrome" src/site/core_rulebook_web.html --args --print-to-pdf=/tmp/razorweave.pdf
```
Confirm PDF shows clean margins, headers/footers, monochrome-friendly colors.

**Step 5: Commit**

```bash
git add src/site/core_rulebook_web.html
git commit -m "feat: add print styles and accessibility polish"
```

---

### Wrap-up

After completing all tasks, run a thorough manual QA:

```bash
git status
open src/site/core_rulebook_web.html
```

Ensure no TODO comments remain, then consolidate into a final commit or PR summary referencing this plan.
