# Core Rulebook Single-File HTML Book Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single, professional-grade Core Rulebook HTML file that consolidates all current Razorweave core materials into one navigable, mechanically authoritative, and stylistically consistent book.

**Architecture:** Use `source/codex/core_rulebook_blueprint_updated.md` as the chapter structure, `source/players_handbook`, `source/mechanics_reference`, and `source/gm_toolkit` as primary content sources, and assemble everything into a new `source/codex/book/core_rulebook.html` file with a single `<nav>` ToC and semantic chapter sections. Iterate chapter-by-chapter, starting with a quality pass on Chapters 1–6, then write and integrate subsequent chapters while keeping mechanics centralized and avoiding duplication.

**Tech Stack:** Markdown source chapters; HTML5 with a single embedded `<style>` block; existing Razorweave style guides (`docs/style_guides/*`, `source/codex/STYLE.md`); glossary and mechanics references (`source/codex/GLOSSARY.md`, `source/mechanics_reference/1.2_mechanics_reference.html`, `source/gm_toolkit/1.2_gm_toolkit.html`, `source/players_handbook/1.3_players_handbook.html`).

---

## Phase 1: Quick Quality Pass for Chapters 1–6

### Task 1: Review Chapter 1 – Welcome to the Game

**Files:**
- Read: `source/codex/core.html` (Chapter 1 section)
- Reference: `source/players_handbook/1.3_players_handbook.html`
- Reference: `source/codex/STYLE.md`
- Reference: `source/codex/GLOSSARY.md`

**Steps:**
1. Read Chapter 1 in `core.html` end-to-end in context.
2. Compare tone, onboarding clarity, and “what this game is” framing against the PHB introduction.
3. Check terminology and capitalisation against `GLOSSARY.md` (e.g., Attributes, Checks, Tags, Conditions, Clocks).
4. Note issues and improvement ideas in a working list (e.g. `source/codex/_notes/core_ch1-6-review.md`) under a “Chapter 1” heading.
5. Mark which issues are “quick fixes now” vs. “deeper rewrite later”.

### Task 2: Review Chapters 2–6 for Alignment

**Files:**
- Read: `source/codex/core.html` (Chapters 2–6 sections)
- Reference: `source/players_handbook/1.3_players_handbook.html`
- Reference: `source/codex/STYLE.md`
- Reference: `source/codex/GLOSSARY.md`

**Steps:**
1. For each chapter (2–6), read the current draft in `core.html` in full.
2. Spot-check chapter structure against `source/codex/core_rulebook_blueprint_updated.md` and note any structural mismatches or missing beats.
3. Verify that key concepts (Attributes, Checks, Tags/Conditions/Clocks, Skills/Proficiencies, Character Creation steps) are introduced at the right depth for a core book, not just gestured at.
4. Check a few representative examples in each chapter for STYLE compliance (dice notation, Trigger–Roll–Consequence structure, voice) and glossary alignment.
5. Append per-chapter notes under “Chapter 2–6” headings in `source/codex/_notes/core_ch1-6-review.md`, tagging items as “quick fix” or “later revision”.

### Task 3: Apply High-Impact Quick Fixes to Chapters 1–6

**Files:**
- Modify: `source/codex/core.html`
- Reference notes: `source/codex/_notes/core_ch1-6-review.md`

**Steps:**
1. Scan the notes and select only low-risk edits: terminology corrections, obvious clarity tweaks, removal of contradictions with the glossary or PHB, and small structure tweaks (e.g. heading names, anchor IDs).
2. Apply these small edits directly in `core.html`, keeping chapter boundaries and overall flow intact.
3. Leave deeper rewrites, major structural changes, and example overhauls in the notes as “later pass” items to address once the full book context exists.

---

## Phase 2: Create the Single-File Book Shell

### Task 4: Create `book` Directory and Initial HTML Shell

**Files:**
- Create: `source/codex/book/core_rulebook.html`
- Reference: `source/codex/core.html`
- Reference: `source/codex/STYLE.md`
- Reference: `source/codex/core_rulebook_consolidation_prompt.md`

**Steps:**
1. Ensure `source/codex/book/` exists (create the directory if needed).
2. Create `core_rulebook.html` with a minimal HTML5 structure: `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`.
3. Copy and adapt the `<style>` block from `source/codex/core.html` into `core_rulebook.html`, updating it to align with the consolidation prompt (semantic tags, readable max-width, styled tables, example/GM callout classes).
4. Add a `<main>` container and placeholder comments for each Part (I–V) and chapter range.

### Task 5: Implement Global Navigation and Chapter Anchor Structure

**Files:**
- Modify: `source/codex/book/core_rulebook.html`
- Reference: `source/codex/core_rulebook_blueprint_updated.md`

**Steps:**
1. At the top of `<body>`, add a `<nav>` element with a single `<ul>` Table of Contents listing Chapters 1–28.
2. For each chapter, add a `<li><a>` entry with human-readable text and a stable `href` anchor ID (e.g. `#ch-01-welcome-to-the-game`).
3. In `<main>`, create a `<section>` for each chapter with matching `id` attributes and a top-level heading (e.g. `<h1>` or `<h2>`) that mirrors the blueprint titles.
4. Add brief placeholder comments or minimal stub paragraphs for chapters that have not yet been drafted to make navigation testable immediately.

### Task 6: Migrate Polished Content for Chapters 1–6

**Files:**
- Read: `source/codex/core.html`
- Modify: `source/codex/book/core_rulebook.html`
- Reference notes: `source/codex/_notes/core_ch1-6-review.md`

**Steps:**
1. Copy the reviewed and lightly fixed content for Chapters 1–6 from `core.html` into the corresponding `<section>` elements in `core_rulebook.html`.
2. Update heading levels and IDs to match the new anchor scheme while preserving their meaning.
3. Ensure that any internal references in Chapters 1–6 (e.g. “see Chapter 8”) match the blueprint numbering and anchor IDs.
4. Add HTML comments or TODO markers inside each chapter section to reference outstanding “later revision” items from the notes file.

---

## Phase 3: Core Rules and Mechanics Chapters (7–20)

### Task 7: Map Source Chapters to Core Rulebook Chapters

**Files:**
- Read: `source/codex/core_rulebook_blueprint_updated.md`
- Read: `source/players_handbook/chapters/*.md`
- Read: `source/mechanics_reference/chapters/*.md`
- Read: `source/gm_toolkit/chapters/*.md` (for overlapping material)
- Create: `source/codex/_notes/core_mapping_chapters_7-20.md`

**Steps:**
1. For each core rulebook chapter 7–20, identify primary and secondary source chapters across the PHB, mechanics reference, and GM toolkit.
2. Record a simple mapping in `core_mapping_chapters_7-20.md` (e.g. “Ch. 8 Actions, Checks, and Outcomes ← PHB 05, Mechanics 03”).
3. Note any conflicting explanations or duplicate procedures (e.g. multiple DC ladder descriptions, repeated outcome tier text).
4. Mark where mechanics should live canonically (e.g. DC ladder in the Checks chapter, Tags/Conditions definitions in a central reference).

### Task 8: Draft Chapter 7 – Characters and Attributes

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapter 7 section)
- Reference: `source/players_handbook/chapters/03-character-creation.md`
- Reference: `source/players_handbook/chapters/04-character-progression.md`
- Reference: `source/mechanics_reference/chapters/02-core-concepts.md`
- Reference: `source/codex/GLOSSARY.md`

**Steps:**
1. Outline the chapter in the book file: subheadings for Attribute definitions, narrative meaning of ratings, usage in checks, and growth preview.
2. Pull relevant mechanics and examples from PHB and mechanics reference, rewriting them to match 1.3 tone and STYLE requirements.
3. Ensure Attributes and their abbreviations match `GLOSSARY.md` exactly.
4. Insert at least one example for each Attribute that follows the Trigger–Roll–Consequence structure and uses correct dice notation.

### Task 9: Draft Chapter 8 – Actions, Checks, and Outcomes

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapter 8 section)
- Reference: `source/players_handbook/chapters/05-actions-and-checks.md`
- Reference: `source/mechanics_reference/chapters/03-check-resolution.md`
- Reference: `source/mechanics_reference/chapters/05-clocks-progress.md`
- Reference: `source/codex/STYLE.md`

**Steps:**
1. Define the core resolution loop (intent, approach, Attribute + Skill, roll, outcome tier) clearly and concisely.
2. Consolidate DC ladder, advantage/disadvantage, and outcome tier definitions from the mechanics reference into a single, authoritative presentation.
3. Rewrite examples to match STYLE and use glossary terms; avoid duplicating language that will appear verbatim in later reference chapters.
4. Ensure pointers to later chapters (e.g. Tags/Conditions/Clocks, extended references) use correct chapter numbers and anchors.

### Task 10: Draft Chapters 9–13 – Core Play Modes and Structure

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapters 9–13 sections)
- Reference: `source/players_handbook/chapters/06-combat-basics.md`
- Reference: `source/players_handbook/chapters/07-exploration-and-social.md`
- Reference: `source/players_handbook/chapters/10-downtime-and-recovery.md`
- Reference: `source/players_handbook/chapters/11-roleplaying-guidance.md`
- Reference: `source/players_handbook/chapters/12-alternative-play-modes.md`
- Reference: relevant `source/gm_toolkit/chapters/*.md` for overlapping procedures

**Steps:**
1. For each chapter, create a clear outline in the book file, ensuring coverage matches the blueprint headings.
2. Rewrite PHB procedures and examples into the new chapter structure, centralising mechanics where needed and trimming redundancy with mechanics-focused chapters.
3. Keep GM-only advice for the later GM Section; player-facing guidance stays here.
4. Add TODO comments where you intentionally defer deep example work or advanced options to later passes.

### Task 11: Implement Skills and Proficiencies Chapters (14–17)

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapters 14–17 sections)
- Reference: `source/mechanics_reference/chapters/06-skills-introduction.md`
- Reference: `source/mechanics_reference/chapters/07–11` (genre skills)
- Reference: `source/mechanics_reference/chapters/12–17` (proficiencies)
- Reference: `source/codex/core_rulebook_blueprint_updated.md` (consolidation model)

**Steps:**
1. Revisit the Skills/Proficiencies consolidation decisions in the blueprint and restate them briefly at the top of these chapters.
2. Write the Skills and Proficiencies system overview chapters first (14 and 16), focusing on philosophy, structure, and usage with Attributes/Checks.
3. Build example reference lists by Attribute (Skills) and by domain (Proficiencies), trimming genre-specific bloat while preserving useful examples.
4. Ensure all names, categories, and training levels are internally consistent and clearly explained; reference the glossary where appropriate.

### Task 12: Draft Extended Mechanical References (18–20)

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapters 18–20 sections)
- Reference: `source/mechanics_reference/chapters/04-tags-conditions-overview.md`
- Reference: `source/mechanics_reference/chapters/18-tags-conditions-glossary.md`
- Reference: `source/mechanics_reference/chapters/19-combat-reference.md`
- Reference: `source/mechanics_reference/chapters/20-progression-reference.md`

**Steps:**
1. Flesh out the extended Tags/Conditions reference with clear categorisation and GM guidance, avoiding redefinition of core terms already covered earlier.
2. Build concise, table-friendly references for combat and progression, following the HTML/CSS style for tables and keeping them readable on-screen.
3. Cross-check that no core mechanic is only defined here; everything should already be introduced earlier and merely summarised or expanded in these chapters.

---

## Phase 4: Game Master Section (21–26)

### Task 13: Design GM Section Structure and Mapping

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapters 21–26 sections)
- Read: `source/gm_toolkit/chapters/*.md`
- Read: `source/gm_toolkit/1.2_gm_toolkit.html`
- Reference: `source/codex/core_rulebook_blueprint_updated.md`

**Steps:**
1. Map GM toolkit chapters to the GM Section blueprint (running sessions, campaigns, scenarios, factions, GMless, solo).
2. Decide which GM-facing procedures should remain here vs. which have already been centralised earlier as general rules.
3. Note any high-value worked examples that should be modernised and included.

### Task 14: Draft GM-Facing Chapters 21–24

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapters 21–24 sections)
- Reference: relevant `source/gm_toolkit/chapters/*.md`

**Steps:**
1. Write concise, practical guidance on session structure, scene framing, pacing, and campaign planning, pulling from the GM toolkit but rewriting to match core style and updated mechanics.
2. Integrate Clocks, Tags, and Conditions as tools GMs use, pointing back to the mechanical chapters rather than redefining them.
3. Include a small number of updated, cross-genre examples that show how to apply tools in play.

### Task 15: Draft GMless and Solo Play Chapters 25–26

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapters 25–26 sections)
- Reference: `source/players_handbook/chapters/12-alternative-play-modes.md`
- Reference: relevant `source/gm_toolkit/chapters/18-solo-play.md` and related narrative structure chapters

**Steps:**
1. Present clear, step-by-step procedures for GMless and solo play built on the same mechanical chassis as group play.
2. Define how authority rotates or how oracles/prompts are used, referencing Clocks and Tags where relevant.
3. Trim or relocate advanced theory that is better suited for a future supplement; keep the core book focused on usable procedures.

---

## Phase 5: Glossary, Index, and Final Consistency

### Task 16: Build the Glossary Chapter (27)

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapter 27 section)
- Read: `source/codex/GLOSSARY.md`

**Steps:**
1. Convert `GLOSSARY.md` into an HTML glossary section with anchors for each term.
2. Ensure definitions match the actual usage in the book; adjust chapter text if necessary to eliminate terminology drift.
3. Add cross-references (e.g. “See also: Tags, Conditions”) where helpful.

### Task 17: Build the Index Chapter (28)

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (Chapter 28 section)

**Steps:**
1. Decide on the level of index granularity (core terms and key mechanics vs. exhaustive keyword list).
2. Create an index with links to chapter anchors and, where useful, specific subheadings.
3. Scan for missing obvious entries (e.g. core mechanics, play modes, GM tools).

### Task 18: Global Consistency and Navigation Pass

**Files:**
- Modify: `source/codex/book/core_rulebook.html`
- Reference: `source/codex/STYLE.md`
- Reference: `source/codex/GLOSSARY.md`

**Steps:**
1. Verify that every chapter and major section has a stable, human-readable ID and appears in the `<nav>` TOC.
2. Check that glossary terms are consistently capitalised and used as defined.
3. Spot-check examples across the book for STYLE compliance and mechanical correctness.
4. Fix broken links, anchors, and any remaining duplicate or contradictory presentations of key mechanics.

