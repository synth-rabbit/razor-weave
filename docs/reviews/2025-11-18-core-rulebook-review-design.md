# Core Rulebook Review and Enhancement Design

**Date:** 2025-11-18
**Scope:** Comprehensive content review, glossary/index integration, and TOC enhancement for `source/codex/book/core_rulebook.html`

## Overview

This design outlines a three-phase approach to reviewing, completing, and polishing the Razorweave Core Rulebook HTML. The work follows a "foundation before polish" strategy: fix content issues first, then integrate structural elements (glossary/index), then enhance presentation (TOC).

## Design Principles

- **Single source of truth:** All changes target `source/codex/book/core_rulebook.html`
- **Foundation before polish:** Content integrity before presentation enhancements
- **Systematic validation:** Automated checks where possible, manual review for quality
- **Standards compliance:** All work must align with `source/codex/STYLE.md` and `source/codex/GLOSSARY.md`

## Phase 1: Content Review & Documentation

### Objectives

Identify and document all consistency issues, completeness gaps, and quality observations across the entire 404KB HTML book.

### Consistency Check Implementation

Create a systematic validation approach covering:

**Mechanics Validation:**
- Extract all dice notation and flag any non-4d6 references (d20, 2d20, etc.)
- Parse all DC values and verify they match the standard ladder (12/14/16/18/20/22)
- Cross-reference advantage/disadvantage descriptions against GLOSSARY.md definitions (5d6/6d6 keep best/worst 4)
- Validate outcome tier margin ranges match STYLE.md specifications:
  - Critical Success ≥+5
  - Full Success ≥0
  - Partial Success -1 to -2
  - Failure ≤-3
  - Critical Failure ≤-7

**Terminology Validation:**
- Check all Tag and Condition references for proper capitalization
- Verify definitions match GLOSSARY.md canonical terms
- Ensure consistent spelling and usage across all chapters

**Link Validation:**
- Test every internal link (`href="#..."`) to ensure target IDs exist
- Verify bidirectional references (Ch 8 → Glossary, Glossary → Ch 8)
- Check cross-chapter references for accuracy

### Completeness Audit Implementation

Systematic chapter-by-chapter review noting:

- **Forward references:** Verify all "see Chapter X" references point to existing, relevant content
- **Placeholder content:** Identify TODO comments or incomplete sections
- **Missing examples:** Flag major rules without worked examples (STYLE.md requirement)
- **Sheet references:** Verify Chapter 27 references match files in `source/codex/sheets/`
- **VPC guidance:** Ensure Part III chapters (21-26) include VPC-aware guidance per prompt requirements
- **Structural gaps:** Check for missing sections promised in chapter introductions

### Quality Assessment Implementation

Generate observations (not prescriptions) about:

- **Prose depth:** Identify bullet-list-only sections vs. prose-rich explanations
- **Word counts:** Estimate chapter lengths and compare against 6000-12,000 word targets for GM chapters
- **Example quality:** Flag examples showing only mechanical resolution without narrative outcomes
- **Cross-genre coverage:** Note opportunities for cross-genre examples to strengthen understanding
- **Connective tissue:** Identify sections lacking transitions or contextual framing

### Deliverable

A detailed findings document (markdown format) cataloging all issues by chapter and type, prioritized by severity:
1. **Critical:** Broken mechanics, invalid links, missing referenced content
2. **High:** Terminology inconsistencies, incomplete examples, missing VPC guidance
3. **Medium:** Style suggestions, opportunities for depth, cross-genre examples

## Phase 2: Glossary & Index Integration

### Chapter 28: Glossary Generation

**Extraction Process:**

1. **Scan book for definitions** - Parse all chapters for explicitly defined terms:
   - Patterns: `**Term**: definition`, bolded terms with explanatory text
   - First-use emphasis (terms in bold/emphasis when introduced)
   - Dedicated definition sections within chapters

2. **Cross-reference with GLOSSARY.md:**
   - Terms in both: Use book's definition as primary (source of truth), note significant discrepancies
   - Terms only in GLOSSARY.md: Include and flag that they should appear in book content
   - Terms only in book: New discoveries to add to glossary

3. **Consistency validation:**
   - Where terms are defined multiple times, ensure consistency
   - Note discrepancies for fixing
   - Verify definitions match GLOSSARY.md canonical versions

4. **Generate HTML glossary:**
   - Organize by category (Core Mechanics, Attributes, Character Types, Common Conditions, Common Tags)
   - Maintain all anchor IDs for link compatibility (#advantage, #dc, #bleeding, etc.)
   - Add mini-TOC at top linking to each section
   - Style with book's existing classes for visual consistency
   - Include links back to where each term is first defined in the book

### Chapter 29: Comprehensive Hybrid Index

Structure the index in three integrated parts:

**1. Quick Reference Section (top, visually distinct)**

The "I need this now" reference for common lookups:
- DC Ladder table with links to Ch 8 detailed explanation
- Outcome Tiers with margin ranges and examples
- Advantage/Disadvantage mechanics summary (5d6/6d6 rules)
- Common Tag/Condition quick-lookup grid

**2. Topical Index**

Major categories with grouped terms and chapter references:
- **Core Mechanics:** 4d6, Checks, Clocks, Margin, Proficiencies, Skills
- **Character & Attributes:** AGI, MIG, PRE, RSN, Advancement, Character Creation
- **Combat & Conflict:** Damage, Tags, Conditions, Positioning, Combat Flow
- **GM Tools:** Fronts, Scenarios, VPCs, Session Structure, Campaign Shapes
- **Alternative Play:** GMless, Solo, Shared Authority, Rotating Facilitator
- **Skills & Proficiencies:** (by domain and attribute)
- **Reference Materials:** Sheets, Templates, Play Aids

**3. Alphabetical Index**

Complete A-Z listing with chapter references formatted as:
- **Term**: Ch 8, Ch 14, Ch 18
- Each chapter number as clickable link to relevant section
- Use sub-entries for complex topics (e.g., "Advantage: general rules (Ch 8), with skills (Ch 14)")

### Cross-Reference Link Fixing

While integrating Chapters 28-29, systematically fix broken links identified in Phase 1:
- Update `href` targets to point to correct IDs
- Ensure bidirectional references work
- Add missing links where concepts are cross-referenced but not linked
- Verify glossary links from all chapters work after Ch 28 creation

## Phase 3: TOC Enhancement

### Navigation Utility Features

**Sticky Navigation:**
- Fix nav bar to top of viewport on scroll
- Ensure TOC always accessible without scrolling back up
- Smooth transition when nav becomes sticky
- Respect reduced-motion preferences

**Back-to-Top Links:**
- Floating button appearing after scrolling down
- Smooth scroll animation to return to top/TOC
- Keyboard accessible (Focus visible, Enter/Space activation)
- Hide on print

**Current Section Highlighting:**
- Scroll-spy JavaScript to detect which chapter is in viewport
- Highlight corresponding TOC entry
- Update as user scrolls through content
- Graceful degradation if JavaScript disabled

**Keyboard Navigation:**
- Add `accesskey` attributes for quick jumps:
  - Alt+1: Part I
  - Alt+2: Part II
  - Alt+3: Part III (GM Section)
  - Alt+4: Part IV (Reference)
  - Alt+G: Glossary
  - Alt+I: Index
- Document keyboard shortcuts in Ch 3 (How to Use This Rulebook)

**Print-Friendly TOC:**
- CSS print stylesheet generates proper table of contents page
- Include page numbers when printing
- Expand all sections for full visibility
- Remove interactive elements (sticky nav, back-to-top button)

### Layout Refinement

**Improved Visual Hierarchy:**

Typography and spacing to distinguish Parts from Chapters:
- Parts: Larger font-size, bold weight, subtle background color
- Chapters: Normal weight, indented or visually nested under Parts
- Use CSS custom properties for consistent spacing scale

**Responsive Behavior:**

- **Mobile (< 640px):**
  - Stack vertically with collapsible Part sections (accordion pattern)
  - Tap to expand/collapse each Part's chapter list
  - Sticky header compressed (smaller padding)

- **Tablet (640px - 1024px):**
  - Two-column layout for Parts (space-efficient)
  - Collapsible sections optional (more screen space)

- **Desktop (> 1024px):**
  - Current horizontal layout enhanced
  - Better whitespace and hover states
  - Full visibility without collapsing

**Visual Polish:**

- Subtle borders separating Parts
- Hover states with color/background transitions
- Active state for current section
- Improve color contrast for WCAG AA accessibility
- Focus indicators for keyboard navigation
- Smooth transitions respecting reduced-motion preferences

**Whitespace Management:**

- Consistent padding/margins using spacing scale
- Reduce visual crowding in current flex layout
- Better breathing room between Parts and Chapters
- Align with book's overall design (currently clean, minimal aesthetic)

### Secondary Enhancements (Time Permitting)

**Collapsible Sections:**
- Allow users to collapse/expand each Part's chapter list independently
- Remember state in localStorage (optional)
- Accessible implementation (ARIA attributes, keyboard support)

**Chapter Progress Indicators:**
- Show read/unread status (requires localStorage)
- Bookmark functionality for resuming reading
- Visual indicator in TOC (e.g., checkmark, progress dot)

## Implementation Considerations

### Tooling and Automation

**Phase 1: Content Review**

- **HTML Parsing:** Use grep/sed for pattern matching (dice notation, DC values)
- **Validation Agent:** Deploy specialized subagent to process 404KB file in chunks
  - Chunk by chapter (section tags with IDs)
  - Parallel validation where possible
  - Aggregate findings into structured report
- **Link Validation:** Extract all `href="#..."` and `id="..."` attributes, cross-reference programmatically
- **Scripting:** Bash/Python scripts for mechanical checks (regex for dice notation, DC values)

**Phase 2: Glossary & Index Generation**

- **Parsing:** Extract bold terms (`<strong>`, `<b>`) and surrounding context from HTML
- **Term Dictionary:** Build data structure mapping terms to source locations (chapter ID, section ID, line number)
- **Categorization:** Group terms by type (manual categorization with automated sorting within groups)
- **HTML Generation:** Programmatically generate sorted/categorized sections for Ch 28-29
- **Link Generation:** Automatically create bidirectional links between glossary and source definitions

**Phase 3: TOC Enhancement**

- **Pure CSS:** Sticky nav, responsive layouts, visual polish, print styles
- **Minimal JavaScript:**
  - Scroll-spy for current section highlighting
  - Back-to-top button show/hide on scroll
  - Collapsible sections (if implemented)
  - Progressive enhancement (works without JS, better with JS)
- **Accessibility:** ARIA labels, keyboard navigation, focus management, reduced-motion support

### Validation and Testing

**Phase 1:**
- Manual spot-check of automated findings for accuracy
- Cross-reference sample chapters against STYLE.md manually
- Verify link validation catches known broken links

**Phase 2:**
- Manual review that glossary includes all expected terms
- Verify index links point to correct chapter sections
- Cross-check glossary definitions against GLOSSARY.md
- Test that fixing broken links doesn't break working ones

**Phase 3:**
- Visual testing at breakpoints: 320px, 640px, 768px, 1024px, 1440px
- Keyboard navigation testing (Tab, Enter, accesskey shortcuts)
- Screen reader testing (macOS VoiceOver minimum)
- Print preview testing for stylesheet
- Test with JavaScript disabled (graceful degradation)
- Color contrast validation (WCAG AA minimum)

### Deliverables

1. **Findings Document** (Phase 1)
   - Markdown format: `docs/reviews/2025-11-18-core-rulebook-review-findings.md`
   - Organized by chapter and issue type
   - Prioritized by severity (Critical > High > Medium)
   - Actionable items with line numbers/section IDs where applicable

2. **Updated core_rulebook.html** (Phase 2 & 3)
   - Chapter 28 (Glossary) completed with extracted terms
   - Chapter 29 (Index) completed with comprehensive hybrid structure
   - All cross-reference links fixed
   - Enhanced TOC with navigation features
   - Responsive, accessible, print-friendly

3. **Optional: Updated GLOSSARY.md** (Phase 2)
   - Add new terms discovered in book that aren't in baseline GLOSSARY.md
   - Note discrepancies between book definitions and glossary
   - Maintain same format and anchor IDs

4. **Test Report** (Phase 3)
   - Browser/device testing results
   - Accessibility validation results
   - Link validation confirmation
   - Known issues or limitations

## Success Criteria

- **Phase 1:** Comprehensive findings document delivered with categorized, prioritized issues
- **Phase 2:** Ch 28 and Ch 29 exist and are complete; all critical broken links fixed
- **Phase 3:** TOC is responsive, accessible, and includes navigation utility features
- **Overall:** Book passes consistency checks, completeness audit shows no critical gaps, STYLE.md compliance verified

## Next Steps

After design approval:
1. Create isolated git worktree for this work
2. Generate detailed implementation plan (task breakdown with verification steps)
3. Execute phases sequentially with review checkpoints between phases
4. Commit each phase independently for clean history
