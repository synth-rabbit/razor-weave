# AI Image Generation Prompts - Razorweave Website

**Purpose:** This document contains detailed prompts for generating all visual assets for the Razorweave website using AI image generation tools (Midjourney, DALL-E, Stable Diffusion, etc.).

**Color Palette Reference:**
- Electric Blue: #00D9FF
- Hot Pink: #FF006E
- Deep Purple: #7B2CBF
- Ink Black: #1A1A1A

---

## Background Textures

### 1. Paper Texture (Subtle)

**File:** `public/images/textures/paper-subtle.png`
**Dimensions:** 500x500px (tileable seamless)
**Tool:** Midjourney, DALL-E, or Stable Diffusion

**Prompt:**
```
Create a subtle paper texture with fine grain, cream/white color,
tileable seamless pattern, minimal contrast, soft and organic feel,
high resolution 500x500px, suitable for website background overlay,
natural paper fibers barely visible, clean and professional
```

**Settings:**
- Aspect ratio: 1:1
- Style: Photorealistic, subtle
- Output: PNG with transparency

**Usage:** Background overlay for body and cards (10-15% opacity)

---

### 2. Tech Grid Pattern

**File:** `public/images/textures/tech-grid.png`
**Dimensions:** 800x800px (tileable seamless)

**Prompt:**
```
Create a geometric grid pattern with circuit board aesthetic,
electric blue (#00D9FF) lines on transparent background,
synthwave style, minimal and clean, 800x800px tileable seamless pattern,
subtle sci-fi tech feel, low opacity suitable for background overlay,
thin lines, geometric precision, modern and sleek
```

**Settings:**
- Aspect ratio: 1:1
- Style: Vector-like, geometric, clean
- Colors: Electric blue on transparent
- Output: PNG with transparency

**Usage:** Hero section background overlay, decorative tech aesthetic

---

### 3. Noise/Grain Overlay

**File:** `public/images/textures/noise-overlay.png`
**Dimensions:** 512x512px (tileable seamless)

**Prompt:**
```
Create a fine grain noise texture, monochrome gray,
512x512px tileable seamless pattern, film grain aesthetic,
subtle and barely visible, suitable for adding depth to flat colors,
very fine particles, organic randomness, professional quality
```

**Settings:**
- Aspect ratio: 1:1
- Style: Photographic grain
- Output: PNG with transparency

**Usage:** Overlay on solid color sections (5-10% opacity) for depth

---

## Hero & Atmospheric Images

### 4. Landing Page Hero Background

**File:** `public/images/hero/landing-hero-bg.jpg`
**Dimensions:** 1920x1080px (16:9)

**Prompt:**
```
Create abstract atmospheric scene for tabletop RPG website hero section,
synthwave aesthetic with electric blue (#00D9FF) and hot pink (#FF006E) colors,
mysterious and cozy atmosphere, subtle geometric elements,
hints of adventure and storytelling without literal characters,
wide landscape format 1920x1080px, suitable as website header background,
evocative and moody but not dark, inviting feel, soft gradients,
abstract shapes suggesting journey and discovery, professional quality
```

**Alternative Prompt (More Abstract):**
```
Synthwave gradient background, electric blue to hot pink,
geometric shapes floating in space, mysterious fog or mist,
cozy warm lighting, abstract representation of storytelling and adventure,
no people or specific objects, 1920x1080px wide format,
suitable for website hero section, cinematic and atmospheric
```

**Settings:**
- Aspect ratio: 16:9
- Style: Abstract, atmospheric, cinematic
- Quality: High resolution, optimized for web
- Output: JPG (~200KB max)

**Usage:** Landing page hero section background

---

### 5. Preview Section Scene

**File:** `public/images/hero/preview-scene.jpg`
**Dimensions:** 1200x800px (3:2)

**Prompt:**
```
Create evocative tabletop RPG gameplay scene,
group of diverse adventurers in mysterious cozy tavern or around campfire,
synthwave color palette with electric blue (#00D9FF) and hot pink (#FF006E) lighting accents,
atmospheric and inviting, sense of camaraderie and adventure,
1200x800px horizontal format, cinematic composition, suitable for website preview section,
PbtA fiction-first aesthetic, emphasis on narrative moment over combat,
warm firelight mixed with neon accents, friends sharing stories, moody and evocative
```

**Alternative Prompt:**
```
Group of friends around table playing tabletop RPG,
dice and character sheets visible, warm cozy lighting with synthwave neon accents,
electric blue and hot pink glow, mysterious atmospheric background,
sense of immersion and storytelling, 1200x800px, photorealistic style,
diversity in characters, focus on connection and narrative not combat
```

**Settings:**
- Aspect ratio: 3:2
- Style: Cinematic, evocative, warm
- Quality: High resolution
- Output: JPG (~150KB max)

**Usage:** Landing page preview section, emotional connection before CTA

---

## Feature Icons

**General Settings for All Icons:**
- Dimensions: 64x64px
- Format: SVG (if tool supports) or PNG with transparency
- Style: Geometric, minimalist, line-based
- Line weight: 2-3px, clean and modern

---

### 6. Icon - Fiction First

**File:** `public/images/icons/icon-fiction-first.svg`

**Prompt:**
```
Create minimalist line icon representing storytelling and narrative,
geometric style, open book with flowing lines or speech bubble with story elements,
electric blue (#00D9FF), 64x64px, clean and modern,
simple line art, 2-3px line weight, suitable for website feature icon
```

**Alternative Elements:**
- Quill pen with flowing ink
- Story scroll unfurling
- Abstract speech bubbles interconnected

---

### 7. Icon - Character Creation

**File:** `public/images/icons/icon-character-creation.svg`

**Prompt:**
```
Create minimalist line icon representing character creation,
geometric style, abstract person silhouette or character sheet symbol,
hot pink (#FF006E), 64x64px, simple and recognizable,
clean line art, 2-3px line weight, modern and professional
```

**Alternative Elements:**
- Character profile with customization symbols
- Dice with character attributes
- Building blocks forming a character

---

### 8. Icon - Modular Complexity

**File:** `public/images/icons/icon-modular.svg`

**Prompt:**
```
Create minimalist line icon representing modular building blocks,
geometric style, stacked or interlocking shapes suggesting scalability,
electric blue (#00D9FF), 64x64px, clean geometric forms,
simple line art, 2-3px line weight, shows growth or customization
```

**Alternative Elements:**
- Puzzle pieces interlocking
- Layers or tiers showing progression
- Building blocks with plus/minus symbols

---

### 9. Icon - [Fourth Feature TBD]

**File:** `public/images/icons/icon-[feature-name].svg`

**Prompt:**
```
[To be determined based on fourth feature selection]
Use same style: minimalist line icon, geometric, 2-3px lines,
electric blue or hot pink, 64x64px
```

---

## Decorative Elements

### 10. Corner Ornaments (4 variations)

**Files:**
- `public/images/decorative/corner-tl.svg` (top-left)
- `public/images/decorative/corner-tr.svg` (top-right)
- `public/images/decorative/corner-bl.svg` (bottom-left)
- `public/images/decorative/corner-br.svg` (bottom-right)

**Dimensions:** 150x150px each

**Base Prompt:**
```
Create geometric corner ornament in synthwave style,
L-shaped border decoration with sharp angles and clean lines,
electric blue (#00D9FF) to hot pink (#FF006E) gradient,
modern minimalist design, suitable for framing content sections,
150x150px, transparent background, clean vector style
```

**Variations:** Generate 4 times with slight asymmetry prompt variations:
- Top-left: Add "asymmetric sharp angles pointing inward"
- Top-right: Add "flowing curves mixed with geometric shapes"
- Bottom-left: Add "circuit-board inspired corner design"
- Bottom-right: Add "hexagonal geometric pattern corner"

**Settings:**
- Format: SVG preferred (or high-res PNG with transparency)
- Style: Geometric, vector-like, clean
- Colors: Blue-to-pink gradient

**Usage:** Frame hero sections, feature cards, decorative page accents

---

### 11. Section Dividers (3 variations)

**Files:**
- `public/images/decorative/divider-01.svg`
- `public/images/decorative/divider-02.svg`
- `public/images/decorative/divider-03.svg`

**Dimensions:** 1200px width x 50px height

**Prompts:**

**Divider 1:**
```
Create horizontal decorative divider line, geometric synthwave style,
hot pink (#FF006E) primary with electric blue (#00D9FF) accent dots,
clean modern design, 1200px wide x 50px tall,
thin horizontal line with geometric embellishments in center,
transparent background, suitable for separating content sections
```

**Divider 2:**
```
Create horizontal decorative divider, geometric wave pattern,
electric blue (#00D9FF) with hot pink highlights,
1200px x 50px, clean vector style, subtle and modern,
flowing geometric shapes suggesting movement
```

**Divider 3:**
```
Create horizontal decorative divider, circuit board aesthetic,
hot pink primary with electric blue nodes,
1200px x 50px, geometric tech pattern,
thin lines with connection points, clean and professional
```

**Settings:**
- Format: SVG preferred
- Aspect ratio: 24:1 (very wide, short)
- Style: Vector, geometric, clean

**Usage:** Separate major sections on landing page

---

## UI Icons

**Note:** Consider using open-source icon library (Heroicons, Feather Icons, Phosphor Icons) instead of generating. If generating, use these prompts:

### Navigation Icons

**Files:** `public/images/icons/ui-*.svg`

**General Prompt Template:**
```
Create minimalist [ICON NAME] icon,
geometric style, 24x24px, 2px line weight,
ink black (#1A1A1A), clean and modern,
simple line art suitable for UI navigation
```

**Specific Icons:**

1. **ui-menu.svg** - Hamburger menu (3 horizontal lines)
2. **ui-search.svg** - Magnifying glass
3. **ui-bookmark.svg** - Bookmark outline
4. **ui-bookmark-filled.svg** - Bookmark filled
5. **ui-close.svg** - X close button
6. **ui-arrow-left.svg** - Left arrow (previous)
7. **ui-arrow-right.svg** - Right arrow (next)

**Recommendation:** Use Heroicons (MIT license) or similar for consistency and time savings.

---

## Generation Workflow

### Recommended Tools

**For Textures & Patterns:**
- **Midjourney** - Best for seamless patterns with `--tile` parameter
- **Stable Diffusion** - Good for tileable textures with proper prompting

**For Hero/Atmospheric Images:**
- **Midjourney** - Excellent for atmospheric, artistic scenes
- **DALL-E 3** - Good for precise composition control
- **Stable Diffusion XL** - High quality, free, good for landscapes

**For Icons & Decorative Elements:**
- **Vector generation tools** (if available)
- **Midjourney + vectorization** (trace in Illustrator/Inkscape)
- **Manual creation in Figma/Illustrator** (recommended for consistency)

### Generation Steps

1. **Start with high-priority assets:**
   - Hero images (landing-hero-bg.jpg, preview-scene.jpg)
   - Feature icons (4 icons)
   - Paper texture

2. **Generate in batches:**
   - Group similar assets (all textures together, all icons together)
   - Maintain consistent style parameters

3. **Post-processing:**
   - Optimize images (compress JPGs, optimize PNGs)
   - Ensure proper dimensions (resize if needed)
   - Convert to appropriate formats (PNG → WebP for better compression)

4. **Organize files:**
   - Place in correct directories as specified
   - Use exact filenames from manifest
   - Test loading in browser

### Quality Checklist

Before using generated assets:

- [ ] Correct dimensions and aspect ratio
- [ ] File size optimized for web (textures <100KB, heroes <200KB, icons <10KB)
- [ ] Colors match synthwave palette (#00D9FF, #FF006E)
- [ ] Transparent backgrounds where specified
- [ ] Tileable patterns tested for seaming
- [ ] Icons are clear and recognizable at 64px

---

## Color Extraction from Existing Rulebook

If you want to extract exact colors from the existing synthwave rulebook for consistency:

**Primary Palette (from core_rulebook.html):**
```css
--color-electric-blue: #00D9FF
--color-hot-pink: #FF006E
--color-deep-purple: #7B2CBF
--color-ink-black: #1A1A1A
--color-light-blue: #E5FAFF
--color-light-pink: #FFE5F3
```

Use these hex codes in AI prompts for accurate color matching.

---

## Alternative: CSS-Only Approaches

If AI generation proves challenging, some elements can be created with pure CSS:

**Hero Background:**
```css
background: linear-gradient(135deg, #00D9FF 0%, #FF006E 100%);
/* Add animated geometric shapes with CSS */
```

**Corner Ornaments:**
```css
/* Use border + clip-path for geometric corners */
```

**Icons:**
- Use icon fonts (Font Awesome, Heroicons)
- Or simple SVG hand-coded shapes

**Textures:**
- Use CSS `filter: contrast() brightness()` on noise images
- Or data URI inline SVG patterns

---

## Need Help?

If you encounter issues with AI generation:

1. Try alternative prompts provided above
2. Use negative prompts to avoid unwanted elements (e.g., "no people, no text")
3. Generate multiple variations and choose best
4. Consider manual creation in design tools for critical assets

**Remember:** Perfect is the enemy of good. Placeholder images work fine for initial development - you can always upgrade assets later.
