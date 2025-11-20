# Razorweave Website

The official website for Razorweave - a fiction-first tabletop RPG.

**Live Site:** https://razorweave.com
**Repository:** https://github.com/synth-rabbit/razor-weave

---

## Overview

Static website built with HTML5, CSS3, and vanilla JavaScript. Features a complete enhanced reader for the core rulebook, landing page, legal documentation, and deployment infrastructure for GitHub Pages.

**Key Features:**
- 📖 **Enhanced Reader** - Superior to PDF reading with TOC navigation, search, breadcrumbs, and progress tracking
- 🎨 **Synthwave Theme** - Electric Blue (#00D9FF), Hot Pink (#FF006E), Deep Purple (#7B2CBF)
- 📱 **Fully Responsive** - Desktop, tablet, and mobile optimized
- 🌙 **Dark Mode** - Persistent localStorage-based theme switching
- ⚡ **Fast & Accessible** - Semantic HTML, ARIA labels, keyboard navigation
- 🔍 **SEO Optimized** - Sitemap, robots.txt, Open Graph tags

---

## Quick Start

```bash
# Navigate to site directory
cd src/site

# Install dependencies
pnpm install

# Development server
pnpm dev        # Opens http://localhost:3000

# Build for production
pnpm build      # Outputs to dist/

# Deploy to GitHub Pages
npx gh-pages -d dist
```

---

## Deployment

The site is deployed to GitHub Pages with custom domain razorweave.com.

### Deploy Process

```bash
cd src/site
pnpm build
npx gh-pages -d dist
```

This automatically:
1. Builds the site to `dist/`
2. Pushes to `gh-pages` branch
3. GitHub Pages serves the site within 2-5 minutes

### GitHub Pages Settings

- **Source:** Deploy from branch `gh-pages` / (root)
- **Custom Domain:** razorweave.com (via `public/CNAME`)
- **HTTPS:** Enforced (Let's Encrypt)

### DNS Configuration

**A Records (apex domain):**
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**CNAME Record:**
```
www.razorweave.com → synth-rabbit.github.io
```

---

## Project Structure

```
src/site/
├── public/                  # Static assets (copied to dist/)
│   ├── CNAME               # Custom domain
│   ├── favicon.svg         # Site favicon
│   ├── robots.txt          # SEO crawler rules
│   ├── sitemap.xml         # SEO sitemap
│   └── images/             # All images
├── src/
│   ├── pages/              # HTML page templates
│   │   ├── index.html      # Landing page
│   │   ├── read.html       # Enhanced reader (8000+ lines)
│   │   ├── about.html      # About page
│   │   ├── license.html    # CC-BY-SA-4.0
│   │   ├── terms.html      # Terms of Service
│   │   ├── privacy.html    # Privacy Policy
│   │   └── 404.html        # Error page
│   ├── partials/           # Reusable components
│   │   ├── header.html     # Site header
│   │   └── footer.html     # Site footer
│   ├── styles/             # CSS files
│   │   ├── theme.css       # Theme variables
│   │   ├── components.css  # Reusable components
│   │   ├── landing.css     # Landing page
│   │   ├── reader.css      # Reader page (630+ lines)
│   │   ├── textures.css    # Texture overlays
│   │   └── animations.css  # Scroll animations
│   └── scripts/            # JavaScript
│       ├── nav-toggle.js   # Mobile nav
│       ├── scroll-animations.js  # Scroll effects
│       └── reader.js       # Reader features (460+ lines)
├── scripts/                # Build scripts
│   └── build.js            # Main build script
├── dist/                   # Build output (generated)
└── package.json
```

---

## Features

### Enhanced Reader (`read.html`)

Superior reading experience vs PDFs:

**Navigation:**
- Sticky TOC sidebar (desktop) / Overlay menu (mobile)
- Breadcrumb trail with auto-update on scroll
- Chapter prev/next buttons
- Quick jump modal (Ctrl+K / Cmd+K)
- Active section highlighting
- Reading progress bar

**Search:**
- Real-time content search
- Regex support
- Match highlighting
- Result navigation
- Case-sensitive toggle

**Responsive:**
- Desktop: Two-column (280px TOC + content)
- Tablet: Collapsible TOC overlay
- Mobile: Touch-optimized typography

### Dark Mode

- Toggle button in header
- Persists via localStorage
- Respects `prefers-color-scheme`
- Smooth transitions

### SEO & Social

- Meta descriptions on all pages
- Open Graph tags for rich previews
- Twitter Cards
- XML sitemap
- robots.txt
- Custom favicon

---

## Build Process

The `build.js` script:

1. Cleans `dist/` directory
2. Copies `public/` → `dist/`
3. Processes HTML pages:
   - Inserts `{{HEADER}}` from `partials/header.html`
   - Inserts `{{FOOTER}}` from `partials/footer.html`
4. Copies `styles/` → `dist/styles/`
5. Copies `scripts/` → `dist/scripts/`

**Result:** Complete static site in `dist/`

---

## Technology Stack

- **HTML5** - Semantic markup, ARIA accessibility
- **CSS3** - Custom properties, Grid, Flexbox
- **Vanilla JavaScript** - No frameworks
- **Node.js** - Build scripts
- **Google Fonts** - Space Grotesk & Inter
- **GitHub Pages** - Static hosting
- **gh-pages** - Automated deployment

---

## Browser Support

**Tested:**
- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+

**Mobile:**
- Safari iOS 15+
- Chrome Android 120+

**Progressive Enhancement:**
- Works without JavaScript (basic functionality)
- Degrades gracefully on older browsers

---

## License

**Content & Code:** CC-BY-SA-4.0
**Copyright:** © 2025 Joshua Edwards

See https://razorweave.com/license.html for full details.

---

## Credits

**Designer & Developer:** Panda Edwards (Joshua Edwards)
**AI Assistance:** Claude 4.5 Sonnet via Claude Code
**Fonts:** Space Grotesk & Inter (SIL OFL)
**UI Icons:** Heroicons (MIT)
**AI Art:** ChatGPT 5.1 DALL-E

---

## Support

**Bugs/Features:** https://github.com/synth-rabbit/razor-weave/issues
**Legal:** https://docs.google.com/forms/d/e/1FAIpQLScHNeNlfRkUW604dMDBH-FqVXae0TALEARfgs2ppxP0p3WPFg/viewform
**Feedback:** https://docs.google.com/forms/d/e/1FAIpQLSdnBO8_zf4pxOQeMN7pIUre7jkWJdPzMMNKJjLewajuqHkG6g/viewform
