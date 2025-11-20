# Razorweave Website Design

**Date:** 2025-11-19
**Status:** Approved
**Repository:** https://github.com/synth-rabbit/razor-weave
**Domain:** razorweave.com

## Overview

### Project Goals

Design and implement a professional, characterful website for the Razorweave tabletop RPG that:
- **Promotes discovery and engagement** - Get visitors excited about the game and let them explore by reading online
- **Provides superior reading experience** - Make reading online meaningfully better than reading a PDF
- **Distributes the rulebook** - Offer digital and print-friendly PDF downloads (site is one of multiple distribution channels including itch.io, DriveThruRPG)
- **Builds community** - Create a welcoming hub for players and GMs

### Target Audience

**Broad mix** - Design for accessibility across experience levels:
- TTRPG veterans looking for fresh mechanics
- Curious newcomers interested in learning
- PbtA-adjacent players (fiction-first, narrative mechanics)

### Visual Foundation

**Synthwave aesthetic** from `books/core/v1/exports/html/core_rulebook.html`:
- Electric Blue (#00D9FF), Hot Pink (#FF006E), Deep Purple (#7B2CBF)
- Space Grotesk headings, Inter body text
- Modern, vibrant, characterful
- Cozy yet mysterious tone

---

## Site Architecture

### Sitemap

```
/ (home)                - Landing page (discovery & excitement)
/read                   - Enhanced reader experience (core value proposition)
/about                  - Team, philosophy, credits
/license                - Legal and licensing information
```

**Architecture Approach:** Hybrid - Focused landing page + dedicated enhanced reader + simple info pages

**Why this approach:**
- Reading experience already polished (synthwave rulebook) - we enhance it
- Landing page focuses purely on excitement and discovery
- Clean separation: marketing vs. content vs. info
- Easy to maintain and expand

### Repository Structure

```
razor-weave/
├── public/                     # Static assets deployed as-is
│   ├── images/                # AI-generated and sourced images
│   │   ├── hero/             # Landing page hero images
│   │   ├── textures/         # Background patterns and textures
│   │   ├── decorative/       # Corner ornaments, dividers
│   │   └── icons/            # Feature icons, UI elements
│   ├── pdfs/                  # PDF downloads
│   │   ├── razorweave-core-digital.pdf
│   │   └── razorweave-core-print.pdf
│   └── fonts/                 # Web fonts (if self-hosting)
├── src/
│   ├── pages/                 # HTML pages
│   │   ├── index.html        # Landing page
│   │   ├── read.html         # Enhanced reader
│   │   ├── about.html        # About page
│   │   └── license.html      # License page
│   ├── styles/                # Shared CSS
│   │   ├── theme.css         # Synthwave color system & typography
│   │   ├── components.css    # Reusable components (buttons, cards, nav)
│   │   ├── landing.css       # Landing page specific styles
│   │   └── reader.css        # Reader-specific enhancements
│   ├── scripts/               # JavaScript for interactivity
│   │   ├── reader.js         # Phase 1-3 reader features
│   │   ├── search.js         # Real-time search functionality
│   │   ├── bookmarks.js      # Bookmarking with localStorage
│   │   └── landing.js        # Landing page interactions (minimal)
│   └── partials/              # Shared HTML snippets
│       ├── header.html       # Site navigation
│       └── footer.html       # Footer with links
├── .github/
│   └── workflows/
│       └── deploy.yml         # Auto-deploy to GitHub Pages
├── AI-IMAGE-PROMPTS.md        # Prompts for generating images
├── ASSET-MANIFEST.md          # File locations and usage reference
├── package.json               # Build scripts
├── README.md                  # Local development instructions
└── scripts/
    └── build.js               # Build script (process partials, copy assets)
```

---

## Landing Page Design

### Layout Sections (Top to Bottom)

#### 1. Hero Section
**Full viewport height, immediately engaging**

**Content:**
- Large headline: "RAZORWEAVE" (synthwave gradient)
- Tagline: One sentence explaining the game (AI-drafted)
- Two CTAs:
  - **Primary:** "Start Reading" (Electric Blue button) → `/read`
  - **Secondary:** "Download PDF" (outlined Hot Pink button) → downloads

**Visual:**
- CSS geometric background: Animated grid, glowing shapes, synthwave gradients
- Optional AI-generated background image (abstract/atmospheric, mysterious + cozy)
- Smooth scroll indicator to next section

**Asset needed:** `public/images/hero/landing-hero-bg.jpg` (1920x1080px)

---

#### 2. What Makes This Special
**3-4 key features in grid layout**

**Content (AI-drafted based on rulebook):**
- **Fiction-First Mechanics** - Narrative drives the action
- **Quick Character Creation** - Jump into the game fast
- **Modular Complexity** - Start simple, add depth as you grow
- **[Fourth feature TBD]**

**Visual:**
- Grid: 2x2 on desktop, 1 column on mobile
- CSS geometric icons for each feature (or sourced icon set)
- Short descriptions (50-75 words each)
- Clean cards with subtle shadows

**Assets needed:** `public/images/icons/feature-*.svg` (64x64px, 4 icons)

---

#### 3. Preview Section
**Taste of the content, drive to reader**

**Content:**
- Pull quote or excerpt from the rulebook
- Brief description of what readers will discover
- CTA: "Read the Full Book" → `/read`

**Visual:**
- AI-generated scene image (gameplay moment, evocative)
- Text overlaid or side-by-side depending on image composition
- Generous whitespace

**Asset needed:** `public/images/hero/preview-scene.jpg` (1200x800px)

---

#### 4. Downloads & Community
**Get the game, connect with players**

**Content:**
- PDF download buttons (print-friendly and digital versions)
- Links to external distribution (itch.io, DriveThruRPG)
- Optional: Discord/community links

**Visual:**
- Centered layout, clear button hierarchy
- Icons for each platform
- Brief description of PDF differences (digital vs print-friendly)

**Assets needed:** Platform icons (if not using Font Awesome or similar)

---

#### 5. Footer
**Simple navigation, legal, social**

**Content:**
- Links to About, License
- Copyright notice
- Social links (if applicable)

**Visual:**
- Light blue background (matches reader TOC sidebar)
- Minimal, clean typography

---

## Reader Experience Design

### Starting Point
**Existing:** `books/core/v1/exports/html/core_rulebook.html`
- Synthwave color system
- Sidebar TOC with colored background
- Cover page with author attribution
- Good typography and spacing

### Phased Enhancements

---

### **Phase 1: Core Improvements (Easy)**

#### 1. Enhanced Navigation

**Breadcrumb Trail:**
- Position: Top of content area, below site header
- Format: `Home > Read > Part I: Foundations > Chapter 3: How to Use This Rulebook`
- Links are clickable, current page is text only
- Responsive: Collapse to "... > Current Chapter" on mobile

**Chapter Navigation Bar:**
- Position: Sticky at bottom of viewport (or top, after testing)
- Content: `← Previous Chapter | Chapter Title | Next Chapter →`
- Keyboard shortcuts: Arrow keys to navigate
- Smooth scroll to top on navigation

**Progress Indicator:**
- Thin bar at top of viewport showing scroll position in current chapter
- Electric Blue fill, light gray background
- Fades out after 2 seconds of no scrolling

**Quick Jump Menu:**
- Dropdown or modal overlay: "Jump to..."
- Lists all chapters with part groupings
- Keyboard shortcut: `/` or `Ctrl+K` to open
- Search-enabled (filter chapters as you type)

---

#### 2. Responsive Layouts

**Desktop (>1024px):**
- Sidebar TOC visible (current design)
- Main content centered, max-width 960px
- Generous margins

**Tablet (768-1024px):**
- Sidebar TOC becomes collapsible (hamburger menu icon)
- Opens as overlay from left side
- Main content full-width with padding

**Mobile (<768px):**
- TOC hidden by default, tap icon (top-left) to reveal overlay
- Optimized line length (shorter for readability)
- Larger tap targets for navigation
- Reduced font sizes slightly for mobile

**Reader Mode Toggle:**
- Button in header: "Focus Mode" or eye icon
- Hides TOC sidebar entirely for distraction-free reading
- Press `Esc` to exit
- Preference saved in localStorage

---

#### 3. Cross-References

**Implementation:**
- Add `id` attributes to all sections/headings (many already exist)
- Convert textual references to clickable links
  - Example: "see Chapter 5" → `<a href="#ch-05-ways-to-play">Chapter 5</a>`
- External link indicator (↗) for references to other pages/sites
- Smooth scroll animation when clicking anchor links (300ms ease-in-out)

**Content Markup:**
- Use semantic HTML: `<a href="#section-id">Reference Text</a>`
- Add `title` attributes for preview on hover
- Style links distinctly: Electric Blue underline on hover

---

### **Phase 2: Interactive Features (Medium)**

#### 1. Bookmarking

**Features:**
- "Bookmark this section" button (bookmark icon) next to each H2/H3 heading
- Stores in localStorage:
  - Section ID
  - Section title
  - Scroll position
  - Timestamp
- "My Bookmarks" dropdown in header (max 10 bookmarks)
- Click bookmark to jump to saved position
- Remove bookmarks via "x" button in dropdown
- On return visit: Modal prompt "Continue where you left off?" with link to last position

**Visual:**
- Bookmarked sections show filled bookmark icon
- Unbookmarked sections show outline bookmark icon on hover
- Dropdown styled like TOC (light blue background)

---

#### 2. Real-Time Search

**Features:**
- Search box in header/sidebar (always accessible, sticky)
- Instant results as you type (client-side search, no backend)
- Searches: All headings, paragraph text, table content
- Highlights matches in yellow (`<mark>` tags)
- Shows count: "Found 12 matches for 'tags'"
- Jump buttons: Next/Previous match
- Keyboard shortcuts: `Ctrl+F` opens search, `Enter` for next match
- Clear button to remove highlights

**Implementation:**
- Use simple JavaScript string matching (case-insensitive)
- Debounce input (200ms) to avoid lag
- Scroll to first match automatically
- Limit results displayed in dropdown (top 20), show "X more results"

**Optional Enhancement:**
- "Search within current chapter only" toggle
- Fuzzy matching for typos

---

### **Phase 3: Reading Modes (Advanced - Optional)**

**Three View Modes:**

1. **Full Rules (Default):** Everything visible
2. **Beginner Mode:** Hides advanced/optional sections, shows only core rules
3. **Quick Reference:** Collapses explanations, shows only tables/summaries/key rules

**Implementation:**

**Content Tagging:**
- Add `data-complexity="beginner|core|advanced"` to sections
- Add `data-content-type="explanation|rule|table|example"` for filtering
- One-time markup effort during content import

**Mode Selector:**
- Toggle buttons in header: "Full | Beginner | Reference"
- JavaScript shows/hides sections based on selected mode
- Store preference in localStorage
- Smooth transitions (fade in/out, 200ms)

**Examples:**
- **Beginner mode:** Hide "Optional Variant Rules", "Advanced Combat Tactics", GM-only sections
- **Reference mode:** Hide examples, flavor text, show only mechanics/tables

**Why Phase 3 is optional:**
- Requires significant content tagging effort
- Value depends on rulebook structure
- Phase 1 & 2 already deliver superior-to-PDF experience

---

## Visual Design System

### Color Palette

**From Synthwave Rulebook:**

```css
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
}
```

**Usage:**
- **Primary (Electric Blue):** H1/H2 headings, primary CTAs, links, active states
- **Secondary (Hot Pink):** H3/H4 headings, accents, hover states, highlights
- **Tertiary (Deep Purple):** Subtle accents, borders
- **Neutrals:** Body text (Ink Black), backgrounds (White, Light Gray)
- **Tinted backgrounds:** Section backgrounds, callout boxes, navigation

---

### Typography

**Font Stack:**

```css
/* Headings */
font-family: "Space Grotesk", system-ui, -apple-system, sans-serif;

/* Body */
font-family: "Inter", system-ui, -apple-system, sans-serif;

/* Code/Monospace (if needed) */
font-family: "JetBrains Mono", monospace;
```

**Load from Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

**Type Scale:**
- H1: 2.75rem (Electric Blue, bold)
- H2: 2rem (Electric Blue, semi-bold)
- H3: 1.4rem (Hot Pink, semi-bold)
- H4: 1.1rem (Hot Pink, medium)
- Body: 1.125rem (Ink Black, regular)
- Small: 0.95rem (Medium Gray, regular)

**Line Heights:**
- Headings: 1.2
- Body: 1.7
- Captions: 1.5

---

### Component Patterns

#### Buttons

**Primary Button:**
```css
background: var(--color-electric-blue);
color: var(--color-white);
padding: 0.75rem 2rem;
border-radius: 4px;
font-weight: 600;
transition: all 0.2s ease;

/* Hover */
box-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
transform: translateY(-2px);
```

**Secondary Button:**
```css
background: transparent;
border: 2px solid var(--color-hot-pink);
color: var(--color-hot-pink);
padding: 0.75rem 2rem;
border-radius: 4px;
font-weight: 600;

/* Hover */
background: var(--color-hot-pink);
color: var(--color-white);
```

**Ghost Button:**
```css
background: transparent;
border: none;
color: var(--color-electric-blue);
text-decoration: underline;
font-weight: 500;

/* Hover */
color: var(--color-hot-pink);
```

---

#### Cards/Sections

**Feature Card:**
```css
background: var(--color-white);
padding: 2rem;
border-radius: 8px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
border-left: 4px solid var(--color-electric-blue);

/* With texture background */
background-image: url('/public/images/textures/paper-subtle.png');
background-repeat: repeat;
```

**Callout Box:**
```css
background: var(--color-light-blue);
border-left: 4px solid var(--color-electric-blue);
padding: 1rem 1.5rem;
margin: 1.5rem 0;
border-radius: 4px;
```

---

#### Navigation

**Site Header:**
```css
background: var(--color-light-blue);
border-bottom: 3px solid var(--color-electric-blue);
padding: 1rem 2rem;
position: sticky;
top: 0;
z-index: 1000;
```

**Navigation Links:**
```css
color: var(--color-ink-black);
font-weight: 500;
padding: 0.5rem 1rem;
border-radius: 4px;

/* Hover */
background: var(--color-electric-blue);
color: var(--color-white);

/* Active */
background: var(--color-hot-pink);
color: var(--color-white);
```

---

### Visual Consistency

**Design Principle:** Site uses the same CSS custom properties as the rulebook, ensuring seamless visual transition between marketing pages and reading experience.

**Key Patterns:**
- Generous whitespace and padding
- Subtle shadows for depth
- Bold color accents (never overwhelming)
- Clean, geometric shapes
- Consistent border-radius (4px for small, 8px for large)

---

## Asset Manifest

### Overview

This section provides detailed specifications for all visual assets needed, including AI generation prompts, file locations, and usage notes.

---

### 1. Background Textures

#### Paper Texture (Subtle)

**Filename:** `public/images/textures/paper-subtle.png`
**Dimensions:** 500x500px (tileable)
**Format:** PNG with transparency
**Opacity when used:** 10-15%

**AI Generation Prompt:**
```
Create a subtle paper texture with fine grain, cream/white color,
tileable seamless pattern, minimal contrast, soft and organic feel,
high resolution 500x500px, suitable for website background overlay
```

**Usage:** Body background, card backgrounds for organic warmth

---

#### Tech Grid Pattern

**Filename:** `public/images/textures/tech-grid.png`
**Dimensions:** 800x800px (tileable)
**Format:** PNG with transparency
**Colors:** Electric Blue (#00D9FF) on transparent background

**AI Generation Prompt:**
```
Create a geometric grid pattern with circuit board aesthetic,
electric blue (#00D9FF) lines on transparent background,
synthwave style, minimal and clean, 800x800px tileable seamless pattern,
subtle sci-fi tech feel, low opacity suitable for background overlay
```

**Usage:** Hero section background, decorative overlay for landing page

---

#### Noise/Grain Overlay

**Filename:** `public/images/textures/noise-overlay.png`
**Dimensions:** 512x512px (tileable)
**Format:** PNG with transparency
**Opacity when used:** 5-10%

**AI Generation Prompt:**
```
Create a fine grain noise texture, monochrome gray,
512x512px tileable seamless pattern, film grain aesthetic,
subtle and barely visible, suitable for adding depth to flat colors
```

**Usage:** Applied over solid color sections to add texture and break up digital flatness

---

### 2. Decorative Elements

#### Corner Ornaments (Set of 4)

**Filenames:**
- `public/images/decorative/corner-tl.svg` (top-left)
- `public/images/decorative/corner-tr.svg` (top-right)
- `public/images/decorative/corner-bl.svg` (bottom-left)
- `public/images/decorative/corner-br.svg` (bottom-right)

**Dimensions:** 150x150px each
**Format:** SVG (scalable, clean)
**Colors:** Electric Blue and Hot Pink gradient

**AI Generation Prompt:**
```
Create geometric corner ornament in synthwave style,
L-shaped border decoration with sharp angles and clean lines,
electric blue (#00D9FF) to hot pink (#FF006E) gradient,
modern minimalist design, suitable for framing content sections,
SVG format, 150x150px, transparent background
```

**Generate 4 variations:** One for each corner, with slight asymmetry for organic feel

**Usage:** Frame hero sections, feature cards, decorative accents

---

#### Section Dividers (Set of 3)

**Filenames:**
- `public/images/decorative/divider-01.svg`
- `public/images/decorative/divider-02.svg`
- `public/images/decorative/divider-03.svg`

**Dimensions:** 1200px width x 50px height
**Format:** SVG
**Colors:** Hot Pink (#FF006E) with Electric Blue accents

**AI Generation Prompt:**
```
Create horizontal decorative divider line, geometric synthwave style,
hot pink (#FF006E) primary with electric blue (#00D9FF) accent details,
clean modern design, 1200px wide x 50px tall,
SVG format, transparent background, suitable for separating content sections
```

**Generate 3 variations:** Different geometric patterns for visual variety

**Usage:** Separate major sections on landing page, visual breaks in long content

---

### 3. Feature Icons (Set of 4+)

**Filenames:**
- `public/images/icons/icon-fiction-first.svg`
- `public/images/icons/icon-character-creation.svg`
- `public/images/icons/icon-modular.svg`
- `public/images/icons/icon-[feature-4].svg`

**Dimensions:** 64x64px
**Format:** SVG
**Style:** Geometric, minimalist, line-based
**Colors:** Electric Blue (#00D9FF) or Hot Pink (#FF006E)

**AI Generation Prompts:**

**Icon 1 - Fiction First:**
```
Create minimalist line icon representing storytelling and narrative,
geometric style, open book with flowing lines or speech bubble with story elements,
electric blue (#00D9FF), 64x64px, SVG format, clean and modern
```

**Icon 2 - Character Creation:**
```
Create minimalist line icon representing character creation,
geometric style, abstract person silhouette or character sheet symbol,
hot pink (#FF006E), 64x64px, SVG format, simple and recognizable
```

**Icon 3 - Modular Complexity:**
```
Create minimalist line icon representing modular building blocks,
geometric style, stacked or interlocking shapes suggesting scalability,
electric blue (#00D9FF), 64x64px, SVG format, clean geometric forms
```

**Icon 4 - [TBD based on fourth feature]:**
```
[Prompt to be determined based on selected fourth feature]
```

**Usage:** Landing page "What Makes This Special" section, feature highlights

---

### 4. Hero & Atmospheric Images

#### Landing Page Hero Background

**Filename:** `public/images/hero/landing-hero-bg.jpg`
**Dimensions:** 1920x1080px (16:9 aspect ratio)
**Format:** JPG (optimized for web, ~200KB max)
**Style:** Abstract/atmospheric, mysterious and cozy

**AI Generation Prompt:**
```
Create abstract atmospheric scene for tabletop RPG website hero section,
synthwave aesthetic with electric blue and hot pink colors,
mysterious and cozy atmosphere, subtle geometric elements,
hints of adventure and storytelling without literal characters,
wide landscape format 1920x1080px, suitable as website header background,
evocative and moody but not dark, inviting feel
```

**Usage:** Landing page hero section background (optional, can use pure CSS if preferred)

---

#### Preview Section Scene

**Filename:** `public/images/hero/preview-scene.jpg`
**Dimensions:** 1200x800px (3:2 aspect ratio)
**Format:** JPG (optimized for web, ~150KB max)
**Style:** Gameplay scene, evocative moment

**AI Generation Prompt:**
```
Create evocative tabletop RPG gameplay scene,
group of diverse adventurers in mysterious cozy tavern or around campfire,
synthwave color palette with electric blue and hot pink lighting accents,
atmospheric and inviting, sense of camaraderie and adventure,
1200x800px, cinematic composition, suitable for website preview section,
PbtA fiction-first aesthetic, emphasis on narrative moment over combat
```

**Usage:** Landing page preview section, drives emotional connection before CTA to read

---

### 5. UI Elements & Icons

#### Navigation Icons

**Filenames:**
- `public/images/icons/ui-menu.svg` (hamburger menu)
- `public/images/icons/ui-search.svg` (magnifying glass)
- `public/images/icons/ui-bookmark.svg` (bookmark outline)
- `public/images/icons/ui-bookmark-filled.svg` (bookmark filled)
- `public/images/icons/ui-close.svg` (X close button)
- `public/images/icons/ui-arrow-left.svg` (previous)
- `public/images/icons/ui-arrow-right.svg` (next)

**Dimensions:** 24x24px
**Format:** SVG
**Colors:** Ink Black (#1A1A1A) default, changes to Electric Blue on hover/active

**Source:** Use open-source icon library (Heroicons, Feather Icons, or similar) or generate simple geometric versions

**Usage:** Reader navigation, mobile menu, search, bookmarking UI

---

### Asset Summary Table

| Asset Type | Quantity | Format | Location | Priority |
|------------|----------|--------|----------|----------|
| Background Textures | 3 | PNG | `/public/images/textures/` | High |
| Corner Ornaments | 4 | SVG | `/public/images/decorative/` | Medium |
| Section Dividers | 3 | SVG | `/public/images/decorative/` | Low |
| Feature Icons | 4+ | SVG | `/public/images/icons/` | High |
| Hero Images | 2 | JPG | `/public/images/hero/` | High |
| UI Icons | 7+ | SVG | `/public/images/icons/` | High |

**Total Assets:** ~23 files

**Implementation Strategy:**
1. Start with **High priority** assets (textures, feature icons, hero images, UI icons)
2. Build landing page and reader with placeholders
3. Add **Medium priority** decorative elements
4. **Low priority** assets can be added later for polish

---

## Build System & Deployment

### Local Development Setup

**Prerequisites:**
- Node.js 18+ and pnpm installed
- Git configured

**Initial Setup:**

```bash
# Clone repository
git clone https://github.com/synth-rabbit/razor-weave.git
cd razor-weave

# Install dependencies
pnpm install

# Start local development server
pnpm dev
```

**Development server runs at:** `http://localhost:3000`

---

### Build Process

**Simple Static Build:**

No complex static site generator needed. Use lightweight build script:

**`package.json` scripts:**

```json
{
  "name": "razorweave-site",
  "version": "1.0.0",
  "scripts": {
    "dev": "live-server src/pages --port=3000",
    "build": "node scripts/build.js",
    "deploy": "pnpm build && gh-pages -d dist"
  },
  "devDependencies": {
    "live-server": "^1.2.2",
    "gh-pages": "^6.0.0"
  }
}
```

**Build script (`scripts/build.js`):**

```javascript
// Simple build: process HTML partials, copy assets to dist/
const fs = require('fs-extra');
const path = require('path');

const SRC = path.join(__dirname, '../src');
const PUBLIC = path.join(__dirname, '../public');
const DIST = path.join(__dirname, '../dist');

// Clean dist
fs.emptyDirSync(DIST);

// Copy public assets as-is
fs.copySync(PUBLIC, DIST);

// Process pages (insert partials: header, footer)
const pages = fs.readdirSync(path.join(SRC, 'pages'));
const header = fs.readFileSync(path.join(SRC, 'partials/header.html'), 'utf8');
const footer = fs.readFileSync(path.join(SRC, 'partials/footer.html'), 'utf8');

pages.forEach(page => {
  let content = fs.readFileSync(path.join(SRC, 'pages', page), 'utf8');

  // Replace placeholders
  content = content.replace('{{HEADER}}', header);
  content = content.replace('{{FOOTER}}', footer);

  fs.writeFileSync(path.join(DIST, page), content);
});

// Copy styles and scripts
fs.copySync(path.join(SRC, 'styles'), path.join(DIST, 'styles'));
fs.copySync(path.join(SRC, 'scripts'), path.join(DIST, 'scripts'));

console.log('✅ Build complete! Output in dist/');
```

**Pages use placeholders:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Razorweave - Tabletop RPG</title>
  <link rel="stylesheet" href="/styles/theme.css">
</head>
<body>
  {{HEADER}}

  <main>
    <!-- Page content -->
  </main>

  {{FOOTER}}
</body>
</html>
```

---

### GitHub Actions Deployment

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

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
        run: pnpm install

      - name: Build site
        run: pnpm build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: razorweave.com
```

**What this does:**
1. Triggers on every push to `main` branch
2. Installs dependencies
3. Runs build script
4. Deploys `dist/` folder to `gh-pages` branch
5. Sets up custom domain (razorweave.com)

---

### Custom Domain Setup

**GitHub Repository Settings:**
1. Go to repository Settings → Pages
2. Source: Deploy from a branch → `gh-pages` branch
3. Custom domain: Enter `razorweave.com`
4. Enable "Enforce HTTPS" (after DNS propagates)

**DNS Configuration (at domain registrar):**

**Option A: Apex Domain (razorweave.com)**

Add `A` records pointing to GitHub Pages IPs:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Option B: WWW Subdomain (www.razorweave.com)**

Add `CNAME` record:
```
www.razorweave.com → synth-rabbit.github.io
```

**Recommendation:** Use both (A records for apex, CNAME for www) and redirect www → apex or vice versa.

**Verification:**
- DNS changes take 24-48 hours to propagate
- Test with `dig razorweave.com` or `nslookup razorweave.com`
- GitHub will auto-generate SSL certificate via Let's Encrypt

---

### Deployment Workflow

**Typical workflow:**

1. **Develop locally:**
   ```bash
   pnpm dev
   # Edit files in src/
   # View at localhost:3000
   ```

2. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add landing page hero section"
   git push origin main
   ```

3. **Auto-deploy:**
   - GitHub Actions triggers
   - Builds site (1-2 minutes)
   - Deploys to razorweave.com
   - Check Actions tab for status

4. **Verify live site:**
   - Visit https://razorweave.com
   - Check for errors in browser console
   - Test on mobile/tablet

---

## Implementation Roadmap

### Phase 1: Foundation & Landing Page (Week 1-2)

**Goals:**
- Set up repository and build system
- Create landing page with core sections
- Generate/source high-priority assets

**Tasks:**

1. **Repository Setup**
   - Initialize repository structure
   - Set up build scripts and GitHub Actions
   - Configure custom domain DNS

2. **Asset Generation**
   - Generate hero images using AI prompts
   - Source/create feature icons
   - Generate background textures
   - Organize in `/public/images/`

3. **Shared Components**
   - Create `theme.css` with synthwave color system
   - Build `components.css` (buttons, cards, navigation)
   - Create `header.html` and `footer.html` partials

4. **Landing Page (`index.html`)**
   - Hero section with CSS background + optional AI image
   - "What Makes This Special" feature grid
   - Preview section with AI-generated scene
   - Downloads & community section
   - Footer with navigation

5. **Testing & Polish**
   - Test responsive layouts (mobile, tablet, desktop)
   - Verify all links and CTAs
   - Optimize images (compression, lazy loading)
   - Deploy to staging (GitHub Pages)

**Deliverable:** Functional landing page at razorweave.com

---

### Phase 2: Reader Experience - Core Improvements (Week 3-4)

**Goals:**
- Adapt existing rulebook HTML for website
- Implement Phase 1 reader enhancements
- Superior reading experience vs PDF

**Tasks:**

1. **Reader Page Setup**
   - Create `/read` route
   - Import rulebook HTML from `books/core/v1/exports/html/core_rulebook.html`
   - Integrate with site header/footer
   - Apply consistent styling

2. **Enhanced Navigation**
   - Implement breadcrumb trail
   - Build chapter navigation bar (prev/next)
   - Create progress indicator
   - Add quick jump menu with keyboard shortcut

3. **Responsive Layouts**
   - Adapt TOC for tablet (collapsible)
   - Optimize for mobile (overlay TOC)
   - Implement reader mode toggle (distraction-free)
   - Test on various devices

4. **Cross-References**
   - Add/verify `id` attributes on all sections
   - Convert textual references to clickable links
   - Implement smooth scroll for anchor navigation
   - Test all internal links

**Deliverable:** Enhanced reader experience at razorweave.com/read

---

### Phase 3: Reader Experience - Interactive Features (Week 5-6)

**Goals:**
- Add bookmarking functionality
- Implement real-time search
- Polish reader interactions

**Tasks:**

1. **Bookmarking System**
   - Build bookmark buttons (add/remove)
   - Implement localStorage storage
   - Create "My Bookmarks" dropdown
   - "Continue where you left off" prompt on return
   - Test across browsers

2. **Real-Time Search**
   - Build search input UI
   - Implement client-side search (headings + content)
   - Add highlight functionality (`<mark>` tags)
   - Next/previous match navigation
   - Show results count
   - Test performance with large document

3. **Polish & Testing**
   - Keyboard shortcuts for navigation and search
   - Smooth animations and transitions
   - Error handling and edge cases
   - Accessibility testing (screen readers, keyboard nav)
   - Cross-browser testing (Chrome, Firefox, Safari)

**Deliverable:** Fully interactive reader with bookmarks and search

---

### Phase 4: About, License, and Final Polish (Week 7)

**Goals:**
- Complete remaining pages
- Final polish and optimization
- Launch preparation

**Tasks:**

1. **About Page**
   - Write/draft content (team, philosophy, credits)
   - Design layout (simple, text-focused)
   - Add team photos or illustrations (optional)

2. **License Page**
   - Format license text clearly
   - Add attributions for images, fonts, libraries
   - Link to Creative Commons or relevant licenses

3. **Final Polish**
   - Add decorative elements (corner ornaments, dividers)
   - Optimize all images (WebP format, lazy loading)
   - Minify CSS and JavaScript
   - Add meta tags for SEO (title, description, og:image)
   - Test page load performance (Lighthouse)

4. **Content Population**
   - Use AI to draft landing page copy based on rulebook
   - Review and edit for tone and accuracy
   - Populate PDFs (even if placeholder versions initially)

5. **Pre-Launch Checklist**
   - All pages render correctly
   - No broken links or images
   - Mobile/tablet/desktop tested
   - DNS configured and SSL working
   - Analytics set up (Google Analytics or Plausible)

**Deliverable:** Complete, polished website ready for launch

---

### Phase 5 (Optional): Reading Modes & Advanced Features

**Goals:**
- Implement beginner/full/reference reading modes
- Add any nice-to-have features

**Tasks:**

1. **Content Tagging**
   - Add `data-complexity` attributes to rulebook sections
   - Add `data-content-type` for filtering
   - Test tagging accuracy

2. **Mode Selector UI**
   - Build mode toggle buttons
   - Implement show/hide logic
   - Store preference in localStorage
   - Test transitions and edge cases

3. **Additional Features (if time)**
   - Print optimization (print specific chapters)
   - Share functionality (share specific sections)
   - Dark mode toggle
   - Internationalization preparation

**Deliverable:** Advanced reading modes for power users

---

## Success Metrics

### Launch Goals

**Qualitative:**
- Reading online is noticeably better than reading a PDF
- Site feels professional and polished
- Visitors understand what makes the game special within 30 seconds
- Navigation is intuitive (no confusion about how to start reading)

**Quantitative (post-launch tracking):**
- Time on site (average session duration)
- Bounce rate from landing page
- Click-through rate: Landing → Reader
- PDF downloads vs. Read online ratio
- Mobile vs. Desktop traffic split

---

## Future Considerations

### Potential Enhancements (Post-Launch)

1. **Community Features**
   - Blog or devlog section
   - Player-submitted content (optional rules, scenarios)
   - Forum or Discord integration

2. **Content Expansion**
   - Supplemental materials (character sheets, reference cards)
   - FAQ section based on common questions
   - Starter scenario or quickstart guide

3. **Technical Improvements**
   - Progressive Web App (PWA) for offline reading
   - Dark mode toggle
   - Internationalization (multiple languages)
   - Advanced search (fuzzy matching, filters)

4. **Analytics & Optimization**
   - A/B testing landing page CTAs
   - Heatmaps to understand reader behavior
   - Performance monitoring and optimization

---

## Questions for Implementation Planning

Before starting implementation, these questions should be answered:

1. **Content readiness:** Is the rulebook content final, or will it change during site development?
2. **Timeline:** Is there a hard deadline or launch target?
3. **Design review:** Who will review/approve design decisions (solo or team)?
4. **Asset generation:** Will you generate AI images yourself, or need assistance with prompts?
5. **PDF preparation:** Are print-friendly and digital PDFs ready, or need creation?
6. **Analytics:** Do you want to track visitor behavior? (Google Analytics, Plausible, etc.)
7. **Community:** Are Discord/social links ready to include on launch?

---

## Appendix: AI Image Prompt Reference

See separate file: **`AI-IMAGE-PROMPTS.md`** in repository root

---

## Appendix: Asset File Reference

See separate file: **`ASSET-MANIFEST.md`** in repository root

---

## Next Steps

1. **Review this design document** - Confirm all sections align with vision
2. **Set up repository** - Initialize structure and build system
3. **Generate assets** - Use AI prompts to create images and icons
4. **Create implementation plan** - Break down tasks into detailed steps
5. **Set up git worktree** - Isolated workspace for development
6. **Begin Phase 1** - Landing page foundation

**Ready to move to implementation planning?**
