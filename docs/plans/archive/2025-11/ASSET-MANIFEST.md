# Asset Manifest - Razorweave Website

**Quick reference for all visual assets, their locations, and usage.**

Last updated: 2025-11-19

---

## Asset Directory Structure

```
public/images/
├── hero/
│   ├── landing-hero-bg.jpg
│   └── preview-scene.jpg
├── textures/
│   ├── paper-subtle.png
│   ├── tech-grid.png
│   └── noise-overlay.png
├── decorative/
│   ├── corner-tl.svg
│   ├── corner-tr.svg
│   ├── corner-bl.svg
│   ├── corner-br.svg
│   ├── divider-01.svg
│   ├── divider-02.svg
│   └── divider-03.svg
└── icons/
    ├── icon-fiction-first.svg
    ├── icon-character-creation.svg
    ├── icon-modular.svg
    ├── icon-[feature-4].svg
    ├── ui-menu.svg
    ├── ui-search.svg
    ├── ui-bookmark.svg
    ├── ui-bookmark-filled.svg
    ├── ui-close.svg
    ├── ui-arrow-left.svg
    └── ui-arrow-right.svg
```

---

## Complete Asset List

### Background Textures

| Asset | Filename | Dimensions | Format | Size | Priority | Usage |
|-------|----------|------------|--------|------|----------|-------|
| Paper Texture | `textures/paper-subtle.png` | 500x500px | PNG | <100KB | High | Body background overlay (10-15% opacity) |
| Tech Grid | `textures/tech-grid.png` | 800x800px | PNG | <100KB | High | Hero section background, tech aesthetic |
| Noise Overlay | `textures/noise-overlay.png` | 512x512px | PNG | <50KB | High | Depth overlay on solid colors (5-10% opacity) |

**Notes:**
- All textures must be tileable/seamless
- Use transparency (alpha channel)
- Test tiling before finalizing

---

### Hero & Atmospheric Images

| Asset | Filename | Dimensions | Format | Size | Priority | Usage |
|-------|----------|------------|--------|------|----------|-------|
| Landing Hero BG | `hero/landing-hero-bg.jpg` | 1920x1080px | JPG | <200KB | High | Landing page hero section background |
| Preview Scene | `hero/preview-scene.jpg` | 1200x800px | JPG | <150KB | High | Landing page preview section |

**Notes:**
- Optimize for web (compress without visible quality loss)
- Test loading speed
- Consider WebP format for better compression
- Optional: Generate @2x versions for retina displays

---

### Feature Icons

| Asset | Filename | Dimensions | Format | Size | Priority | Usage |
|-------|----------|------------|--------|------|----------|-------|
| Fiction First | `icons/icon-fiction-first.svg` | 64x64px | SVG | <10KB | High | Landing page feature section |
| Character Creation | `icons/icon-character-creation.svg` | 64x64px | SVG | <10KB | High | Landing page feature section |
| Modular Complexity | `icons/icon-modular.svg` | 64x64px | SVG | <10KB | High | Landing page feature section |
| [Feature 4 TBD] | `icons/icon-[name].svg` | 64x64px | SVG | <10KB | High | Landing page feature section |

**Notes:**
- Use consistent line weight (2-3px)
- Electric Blue or Hot Pink colors
- Transparent backgrounds
- Test visibility at smaller sizes (32px, 48px)

---

### Decorative Elements

| Asset | Filename | Dimensions | Format | Size | Priority | Usage |
|-------|----------|------------|--------|------|----------|-------|
| Corner Top-Left | `decorative/corner-tl.svg` | 150x150px | SVG | <10KB | Medium | Section frames, decorative accents |
| Corner Top-Right | `decorative/corner-tr.svg` | 150x150px | SVG | <10KB | Medium | Section frames, decorative accents |
| Corner Bottom-Left | `decorative/corner-bl.svg` | 150x150px | SVG | <10KB | Medium | Section frames, decorative accents |
| Corner Bottom-Right | `decorative/corner-br.svg` | 150x150px | SVG | <10KB | Medium | Section frames, decorative accents |
| Divider 1 | `decorative/divider-01.svg` | 1200x50px | SVG | <10KB | Low | Section separators, visual breaks |
| Divider 2 | `decorative/divider-02.svg` | 1200x50px | SVG | <10KB | Low | Section separators, visual breaks |
| Divider 3 | `decorative/divider-03.svg` | 1200x50px | SVG | <10KB | Low | Section separators, visual breaks |

**Notes:**
- Blue-to-pink gradients
- Transparent backgrounds
- Can be added after initial launch

---

### UI Navigation Icons

| Asset | Filename | Dimensions | Format | Size | Priority | Usage |
|-------|----------|------------|--------|------|----------|-------|
| Menu (Hamburger) | `icons/ui-menu.svg` | 24x24px | SVG | <5KB | High | Mobile navigation toggle |
| Search | `icons/ui-search.svg` | 24x24px | SVG | <5KB | High | Search input icon |
| Bookmark Outline | `icons/ui-bookmark.svg` | 24x24px | SVG | <5KB | High | Bookmark button (inactive state) |
| Bookmark Filled | `icons/ui-bookmark-filled.svg` | 24x24px | SVG | <5KB | High | Bookmark button (active state) |
| Close | `icons/ui-close.svg` | 24x24px | SVG | <5KB | High | Modal close, menu close |
| Arrow Left | `icons/ui-arrow-left.svg` | 24x24px | SVG | <5KB | High | Previous chapter navigation |
| Arrow Right | `icons/ui-arrow-right.svg` | 24x24px | SVG | <5KB | High | Next chapter navigation |

**Notes:**
- Consider using Heroicons or Feather Icons library instead of generating
- Ink Black (#1A1A1A) default color
- Changes to Electric Blue on hover/active (via CSS)

---

## Asset Status Tracking

Use this checklist to track asset generation progress:

### High Priority (Required for Launch)

- [ ] `textures/paper-subtle.png`
- [ ] `textures/tech-grid.png`
- [ ] `textures/noise-overlay.png`
- [ ] `hero/landing-hero-bg.jpg`
- [ ] `hero/preview-scene.jpg`
- [ ] `icons/icon-fiction-first.svg`
- [ ] `icons/icon-character-creation.svg`
- [ ] `icons/icon-modular.svg`
- [ ] `icons/icon-[feature-4].svg`
- [ ] `icons/ui-menu.svg`
- [ ] `icons/ui-search.svg`
- [ ] `icons/ui-bookmark.svg`
- [ ] `icons/ui-bookmark-filled.svg`
- [ ] `icons/ui-close.svg`
- [ ] `icons/ui-arrow-left.svg`
- [ ] `icons/ui-arrow-right.svg`

### Medium Priority (Nice to Have)

- [ ] `decorative/corner-tl.svg`
- [ ] `decorative/corner-tr.svg`
- [ ] `decorative/corner-bl.svg`
- [ ] `decorative/corner-br.svg`

### Low Priority (Post-Launch)

- [ ] `decorative/divider-01.svg`
- [ ] `decorative/divider-02.svg`
- [ ] `decorative/divider-03.svg`

---

## File Naming Conventions

**Textures:** `[type]-[descriptor].png`
- Examples: `paper-subtle.png`, `tech-grid.png`

**Hero Images:** `[page]-[purpose]-[descriptor].jpg`
- Examples: `landing-hero-bg.jpg`, `preview-scene.jpg`

**Icons:** `icon-[name].svg` or `ui-[function].svg`
- Examples: `icon-fiction-first.svg`, `ui-menu.svg`

**Decorative:** `[type]-[position/number].svg`
- Examples: `corner-tl.svg`, `divider-01.svg`

**Rules:**
- Use lowercase
- Use hyphens for spaces
- Be descriptive but concise
- Include position/number for sets

---

## Usage Examples

### HTML

```html
<!-- Hero background -->
<section class="hero" style="background-image: url('/public/images/hero/landing-hero-bg.jpg')">
  ...
</section>

<!-- Feature icon -->
<img src="/public/images/icons/icon-fiction-first.svg" alt="Fiction First" width="64" height="64">

<!-- Corner ornament -->
<div class="corner-frame">
  <img src="/public/images/decorative/corner-tl.svg" class="corner corner-tl">
</div>
```

### CSS

```css
/* Paper texture overlay */
body {
  background-image: url('/public/images/textures/paper-subtle.png');
  background-repeat: repeat;
  opacity: 0.15;
}

/* Tech grid pattern */
.hero::before {
  content: '';
  background-image: url('/public/images/textures/tech-grid.png');
  background-repeat: repeat;
  opacity: 0.3;
}
```

---

## Optimization Checklist

Before deploying assets:

- [ ] **Compress images** - Use TinyPNG, ImageOptim, or Squoosh
- [ ] **Test file sizes** - Ensure within size limits
- [ ] **Verify colors** - Match synthwave palette (#00D9FF, #FF006E)
- [ ] **Test tiling** - Seamless patterns have no visible seams
- [ ] **Check transparency** - Alpha channels work correctly
- [ ] **Validate dimensions** - Correct pixel sizes
- [ ] **Test loading** - No slow page loads or FOUC (flash of unstyled content)
- [ ] **Responsive testing** - Images scale properly on mobile/tablet
- [ ] **Accessibility** - All images have alt text in HTML

---

## Alternative Asset Sources

If AI generation is not producing desired results:

**Textures:**
- [Subtle Patterns](https://www.toptal.com/designers/subtlepatterns/) - Free seamless patterns
- [Transparent Textures](https://www.transparenttextures.com/) - PNG textures

**Icons:**
- [Heroicons](https://heroicons.com/) - MIT license, clean design
- [Feather Icons](https://feathericons.com/) - MIT license, minimalist
- [Phosphor Icons](https://phosphoricons.com/) - MIT license, geometric

**Images:**
- [Unsplash](https://unsplash.com/) - Free high-res photos (CC0)
- [Pexels](https://www.pexels.com/) - Free stock photos
- [Pixabay](https://pixabay.com/) - CC0 images

**Gradients:**
- Generate synthwave gradients with CSS instead of images
- Use `linear-gradient(135deg, #00D9FF, #FF006E)`

---

## Version History

| Date | Changes | Updated By |
|------|---------|------------|
| 2025-11-19 | Initial manifest created | Design document |

---

## Notes

- All file paths are relative to repository root
- `public/` directory is deployed as-is (static assets)
- Optimize all assets before committing to repository
- Test images in browser dev tools (Network tab) to verify sizes
- Consider using WebP format for better compression (with JPG fallback)
- SVG assets can be inlined in HTML for better performance (eliminates HTTP requests)

---

**Ready to start generating assets?** See `AI-IMAGE-PROMPTS.md` for detailed generation instructions.
