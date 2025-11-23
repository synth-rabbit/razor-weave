# PDF Production Design — Core Rulebook First Draft

**Date**: 2025-11-22
**Status**: Approved
**Goal**: Generate a professional quality first draft PDF suitable for website download preview

---

## Overview

Transform `data/html/print-design/core-rulebook.html` into a bold, visually striking PDF that leverages print-specific strengths: typography, layout control, spacing, ornamentation, and decorative elements.

**Output**: `data/pdfs/draft/core-rulebook.pdf`

---

## Design Decisions

| Aspect | Decision |
|--------|----------|
| Page size | US Letter (8.5×11") |
| Visual style | Bold reimagining — retro-futurist |
| Chapter openers | Typographic impact only (no per-chapter illustrations) |
| Page backgrounds | Hybrid — dark openers/specials, light content |
| Decorative elements | Grids + geometric borders + sun motifs (layered strategically) |
| PDF library | pdfkit (programmatic generation) |
| Cover | Full generated artwork + logo + corner decorations |
| Reference sheets | Full redesign freedom with source sync to markdown |

---

## Page Architecture & Layout System

### Page Dimensions

- US Letter: 612 × 792 points (8.5 × 11 inches at 72 DPI)
- Margins: 54pt (0.75") on all sides for standard content
- Live area: 504 × 684 points
- Full-bleed pages (cover, chapter openers): extend to edge, add 9pt bleed for print safety

### Grid System

- 12-column grid within live area (42pt columns)
- Body text spans 8 columns (336pt) for comfortable line length
- Callouts/examples can span 10-12 columns for emphasis
- Gutter: 18pt between columns

### Page Types

| Type | Background | Use |
|------|------------|-----|
| **Cover page** | Dark gradient + generated art | First page — logo, title, author |
| **Chapter opener** | Dark (deep purple #1a0a2e → black gradient) | First page of each chapter |
| **Content page** | Light (off-white #fafafa) | Regular body content |
| **Special section** | Dark | GM boxes, reference sheets |

### Cover Page Composition

- Full-bleed dark gradient background
- Generated artwork: Retro-futurist landscape (sun/horizon, grid, mountains)
- Logo SVG (`src/site/public/images/logos/main-logo.svg`) centered upper third
- "Core Rulebook" subtitle in Space Grotesk
- "by Panda Edwards" author credit
- Corner decorations (existing assets from `src/site/public/images/decorative/`)
- No header/footer

### Running Headers/Footers (content pages only)

- Header: Chapter title (left), "RAZORWEAVE" (right) — 9pt Space Grotesk, electric blue
- Footer: Page number centered, geometric accent line above
- Cover + chapter openers: no header/footer

---

## Typography System

### Font Stack

| Role | Font | Weight | Size Range | Color |
|------|------|--------|------------|-------|
| **Display** (chapter numbers) | Space Grotesk | 700 | 144–200pt | Gradient (cyan → magenta) |
| **Chapter titles** | Space Grotesk | 700 | 36–48pt | Electric blue #00D9FF |
| **Section headings (h2)** | Space Grotesk | 600 | 24pt | Electric blue #00D9FF |
| **Subsection (h3)** | Space Grotesk | 600 | 18pt | Hot pink #FF006E |
| **Subhead (h4)** | Space Grotesk | 500 | 14pt | Hot pink #FF006E |
| **Body text** | Inter | 400 | 11pt | Ink black #1A1A1A (light) / White (dark) |
| **Body emphasis** | Inter | 600 | 11pt | Inherit |
| **Captions/labels** | Inter | 500 | 9pt | Medium gray #6B6B6B |
| **Code/monospace** | JetBrains Mono | 400 | 10pt | Deep purple #7B2CBF |

### Typography Treatments

- **Chapter numbers**: Massive (144pt+), chrome gradient effect via linear gradient fill, slight letter-spacing expansion
- **Drop caps**: First letter of each chapter's opening paragraph — 4-line drop cap in Space Grotesk 700, electric blue
- **Pull quotes**: Oversized (16pt) Inter italic, hot pink left border, centered in column

### Spacing

- Body leading: 16pt (11pt text × 1.45)
- Heading leading: 1.1× font size
- Paragraph spacing: 11pt after
- Left-aligned body text (no justification)
- Soft hyphens allowed for long words

---

## Callouts, Boxes & Special Elements

### Example Boxes (blue accent)

- Background: Light blue #E5FAFF
- Left border: 4pt electric blue #00D9FF
- Padding: 18pt all sides
- Title ("Example" or "Example — Title"): Space Grotesk 600, 12pt, electric blue
- Body: Inter 400, 10pt, ink black
- Optional: Subtle torn-paper edge effect

### GM Boxes (pink accent)

- Background: Dark purple #1a0a2e
- Left border: 4pt hot pink #FF006E
- Padding: 18pt all sides
- Title ("GM Guidance"): Space Grotesk 600, 12pt, hot pink
- Body: Inter 400, 10pt, white #FFFFFF
- Corner decorations: Small geometric accents (chevrons or angular brackets)

### Tables

- Header row: Alternating electric blue / hot pink backgrounds, white text
- Body rows: Alternating white / light gray #F5F5F5
- Cell padding: 8pt vertical, 12pt horizontal
- Borders: 1pt border-gray #E0E0E0
- Header text: Space Grotesk 600, 10pt
- Body text: Inter 400, 10pt

### Horizontal Rules

- Standard: 2pt hot pink line, 60% opacity
- Section dividers: 3pt gradient line (cyan → pink → purple)

### Lists

- Bullet character: Small geometric shape (diamond ◆ or triangle ▸) in electric blue
- Numbered lists: Numbers in Space Grotesk 600, electric blue
- Indent: 18pt per level

---

## Chapter Opener Pages

### Layout (full page, no header/footer)

- Full-bleed dark background: Deep purple #1a0a2e → black vertical gradient
- Perspective grid lines: Subtle cyan lines receding to horizon point (SVG-generated)
- Geometric accent: Horizontal stripe band at ~60% page height

### Chapter Number

- Position: Upper area, centered
- Size: 144–200pt depending on digit count
- Font: Space Grotesk 700
- Effect: Chrome gradient fill (cyan #00D9FF → white → magenta #FF006E)
- Optional glow: Subtle outer glow in electric blue (layered text)

### Chapter Title

- Position: Below number, centered
- Size: 36pt
- Font: Space Grotesk 700
- Color: White with subtle text-shadow
- Letter-spacing: +2% for presence

### Part Dividers (Parts I–IV)

- More dramatic: Larger sun/horizon motif (generated artwork)
- "PART I" in 72pt Space Grotesk 700
- Part title ("Foundations") in 28pt below
- Four pages with generated retro-futurist backgrounds

### Visual Layout

```
┌─────────────────────────────────┐
│  ░░░ perspective grid lines ░░░ │
│                                 │
│            ╔═══╗                │
│            ║ 8 ║  ← chrome num  │
│            ╚═══╝                │
│                                 │
│   ══════════════════════════    │ ← gradient stripe
│                                 │
│    ACTIONS, CHECKS, AND         │
│         OUTCOMES                │ ← title
│                                 │
│  ▸ corner decorations ◂         │
└─────────────────────────────────┘
```

---

## Reference Sheets — Functional Design

### Design Philosophy

- **Player-first**: Optimized for actual table use, not just reading
- **Scan/print friendly**: High contrast, no dark fills in writable areas
- **Content freedom**: Add, restructure, or enhance content where it improves usability
- **Source sync**: Any content changes get back-ported to `books/core/v1/sheets/*.md`

### Multi-Page Sheet Handling

- Sheets that exceed one page split at logical section breaks
- Repeated header strip on continuation pages ("Character Sheet — Page 2 of 2")
- Page 1 contains most-referenced info; overflow goes to page 2
- Avoid orphaned sections (minimum 3 lines before break)

### Sheet Redesign Scope

| Sheet | Potential Improvements |
|-------|------------------------|
| **Character Sheet** | Add quick-reference sidebar (common DCs, action types), optimize stat block layout |
| **Advancement Tracker** | Visual milestone path, clearer XP thresholds, celebration checkboxes |
| **Session Log** | Structured sections: Date/Players/Summary/Threads/Next Session |
| **GM Session Prep** | Add clock slots, NPC quick-stat blocks, scene planning boxes |
| **Campaign Fronts** | Card-based layout, doom track visualization, connected threat mapping |
| **NPC/VPC Profile** | Portrait frame, relationship tracker, key quotes section |
| **Tags & Conditions** | Visual icons per tag, alphabetical + categorical views |
| **Clocks Templates** | Actual drawable clock diagrams (4/6/8/12 segments) |
| **DC Tiers** | Poster-style quick reference, bold tier names, example actions |

### Universal Sheet Elements

- Sheet ID code (bottom corner): "RW-CS-01" for version tracking
- Page URL footer: "razorweave.com/sheets" for digital access
- Generous write-space: 24pt minimum line height
- Hole-punch safe: 72pt left margin on odd pages, 72pt right on even (binder use)

### Source Sync Workflow

1. Design sheet in PDF pipeline
2. If content changes → update `books/core/v1/sheets/*.md`
3. Regenerate HTML from markdown (existing pipeline)
4. Version bump sheet ID code

---

## Visual Assets & Image Generation

### Required Generated Assets

| Asset | Purpose | Aspect Ratio | Notes |
|-------|---------|--------------|-------|
| **Cover artwork** | Hero image for cover page | Portrait 2:3 (1024×1536) | Retro-futurist landscape |
| **Part I divider** | "Foundations" background | Landscape 3:2 (1536×1024) | Sunrise, hope |
| **Part II divider** | "Skills & Proficiencies" | Landscape 3:2 | Technical machinery |
| **Part III divider** | "Game Master Section" | Landscape 3:2 | Command center |
| **Part IV divider** | "Reference & Glossary" | Landscape 3:2 | Digital archive |

### SVG-Generated Elements (no image generation needed)

- Perspective grid backgrounds (procedural)
- Corner decorations (existing assets)
- Gradient stripes and horizontal rules
- Clock diagrams for sheets
- Geometric bullet points and accents

### Image Generation Prompts

#### Cover Artwork

```
Retro-futurist synthwave landscape, chrome sun with horizontal scan lines
setting behind geometric mountains, neon pink and cyan gradient sky,
perspective grid floor extending to horizon, no text, no people,
dramatic lighting, 80s sci-fi movie poster aesthetic, clean vector style.
Use aspect ratio 2:3 (portrait).
```

#### Part I: Foundations

```
Synthwave sunrise scene, striped sun rising over flat grid plane horizon,
warm gradient sky (orange to purple to deep blue), minimal geometric shapes,
sense of beginning and potential, clean and hopeful, no text.
Use aspect ratio 3:2 (landscape).
```

#### Part II: Skills & Proficiencies

```
Abstract technical machinery, interlocking chrome gears and geometric patterns,
cyan and magenta accent lighting, blueprint aesthetic mixed with synthwave,
organized complexity, precision engineering vibe, no text.
Use aspect ratio 3:2 (landscape).
```

#### Part III: Game Master Section

```
Retro-futurist command center, curved screens displaying abstract data,
dramatic purple and pink lighting, single empty chair facing displays,
sense of control and oversight, cinematic composition, no text.
Use aspect ratio 3:2 (landscape).
```

#### Part IV: Reference & Glossary

```
Digital archive aesthetic, floating data panels and holographic indexes,
organized rows of glowing information, library meets data center,
cool cyan tones with purple accents, structured and navigable, no text.
Use aspect ratio 3:2 (landscape).
```

### Asset Delivery

- PNG format, high resolution
- Location: `data/assets/pdf/`
- Embedded at 150+ DPI for print quality

---

## Technical Implementation — pdfkit Pipeline

### Library Stack

| Package | Purpose |
|---------|---------|
| `pdfkit` | Core PDF generation — text, graphics, layout |
| `svg-to-pdfkit` | Render SVG assets (logo, corners, decorations) |
| `cheerio` | Parse source HTML to extract structured content |
| `fontkit` | Font embedding (pdfkit dependency) |

### Pipeline Flow

```
data/html/print-design/core-rulebook.html
              ↓
    Parse HTML → Structured AST
    (cheerio extracts chapters, sections, callouts, tables)
              ↓
    Content Normalization
    (clean whitespace, resolve entities, structure tables)
              ↓
    PDF Document Creation
    (pdfkit instance with page settings)
              ↓
    Page-by-Page Rendering
    ├── Cover page (artwork + logo + text)
    ├── Table of Contents (auto-generated with page numbers)
    ├── Part dividers (artwork + typography)
    ├── Chapter openers (procedural backgrounds + chrome numbers)
    ├── Content pages (body text, callouts, tables)
    └── Reference sheets (custom layouts)
              ↓
    Post-processing
    (PDF outline/bookmarks, metadata, compression)
              ↓
    data/pdfs/draft/core-rulebook.pdf
```

### Font Embedding

- Download TTF/OTF files for Space Grotesk, Inter, JetBrains Mono
- Place in `src/tooling/pdf-gen/fonts/`
- Register with pdfkit at document creation
- Subset fonts for smaller file size

### Page State Management

```typescript
interface PageState {
  currentPage: number;
  currentChapter: string;
  yPosition: number;       // cursor position
  pageType: 'cover' | 'toc' | 'part' | 'chapter-opener' | 'content' | 'sheet';
  columnWidth: number;
}
```

### Content Flow Algorithm

1. Measure text block height before rendering
2. If won't fit on current page → trigger page break
3. Handle widows/orphans (minimum 2 lines before/after break)
4. Track page numbers for TOC back-fill

---

## Production Workflow

### Directory Structure

```
src/tooling/pdf-gen/
├── index.ts                    # Public exports
├── cli.ts                      # CLI command wiring
├── pipeline.ts                 # Main orchestration
├── parser.ts                   # HTML → structured content
├── fonts/                      # TTF/OTF font files
│   ├── SpaceGrotesk-*.ttf
│   ├── Inter-*.ttf
│   └── JetBrainsMono-*.ttf
├── renderers/
│   ├── cover.ts                # Cover page renderer
│   ├── toc.ts                  # Table of contents
│   ├── part-divider.ts         # Part opener pages
│   ├── chapter-opener.ts       # Chapter title pages
│   ├── content.ts              # Body text, paragraphs
│   ├── callouts.ts             # Example/GM boxes
│   ├── tables.ts               # Table rendering
│   └── sheets/                 # Per-sheet custom renderers
│       ├── character-sheet.ts
│       ├── advancement-tracker.ts
│       └── ...
├── graphics/
│   ├── grid-background.ts      # Procedural perspective grid
│   ├── chrome-text.ts          # Gradient text effects
│   ├── decorations.ts          # Corner pieces, rules
│   └── clocks.ts               # Clock diagram drawing
└── utils/
    ├── layout.ts               # Page breaks, flow control
    ├── colors.ts               # Color system constants
    └── measure.ts              # Text measurement helpers

data/assets/pdf/
├── cover-artwork.png           # Generated images
├── part-1-background.png
├── part-2-background.png
├── part-3-background.png
└── part-4-background.png

data/pdfs/draft/
└── core-rulebook.pdf           # Output
```

### CLI Commands

```bash
pnpm pdf:build              # Build draft PDF from HTML
pnpm pdf:build --quick      # Skip sheets (faster iteration)
pnpm pdf:sheets             # Rebuild sheets only
```

### Build Steps

1. **Validate inputs**: Check HTML exists, fonts present, assets available
2. **Parse HTML**: Extract content structure with cheerio
3. **Initialize PDF**: Create pdfkit doc with US Letter, register fonts
4. **Render cover**: Artwork + logo + title composition
5. **Render TOC placeholder**: Reserve pages, backfill after content
6. **Render parts & chapters**: Loop through content, track page numbers
7. **Render sheets**: Custom layout per sheet type
8. **Backfill TOC**: Insert actual page numbers
9. **Add PDF outline**: Bookmarks for navigation
10. **Write file**: Stream to `data/pdfs/draft/core-rulebook.pdf`

### Iteration Workflow

- `--quick` flag skips sheets for faster design iteration
- Individual sheet renderers testable in isolation
- Hot-reload-friendly: small changes don't require full rebuild

---

## Implementation Phases

| Phase | Scope |
|-------|-------|
| **1. Foundation** | pdfkit setup, font embedding, basic page rendering, CLI wiring |
| **2. Typography** | Text rendering, heading styles, chrome effects, drop caps |
| **3. Structure** | Cover, TOC, chapter openers, part dividers, page flow |
| **4. Content** | Body text, callouts, tables, lists, horizontal rules |
| **5. Sheets** | Custom renderers for each reference sheet, source sync |
| **6. Polish** | PDF bookmarks, metadata, compression, final review |

---

## Success Criteria

- PDF renders all 30 chapters with correct styling
- Chapter openers have dramatic typographic presence
- Reference sheets are functional and print-ready
- File size reasonable (<50MB target)
- PDF bookmarks enable navigation
- Visual style is bold, cohesive, and distinctly retro-futurist
