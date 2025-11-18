# Core Books Style & Standards

## Writing Quality Goals

**Depth, character, flavor, and clarity** are the pillars of our writing quality:

- **Depth**: Go beyond surface-level explanations. Provide context, implications, tactical considerations, and edge cases. Don't just tell readers *what* a rule does—explain *why* it exists, *when* to use it, and *how* it interacts with other systems.
- **Character**: Write with personality and voice. These books should be engaging and fun to read, not dry reference manuals. Use vivid examples, evocative language, and conversational tone where appropriate.
- **Flavor**: Add narrative context, thematic framing, and genre-specific color. Help readers visualize how mechanics manifest in the fiction. Include brief narrative examples alongside mechanical ones.
- **Clarity**: Despite depth and flavor, maintain crystal-clear explanations. Use concrete examples, step-by-step breakdowns, and explicit guidance. Readers should never be confused about how something works.

**Length is not a constraint.** If depth, clarity, or flavor require more words, use them. We prioritize quality over brevity.

## Content Substantiality

Avoid writing that reads as "a series of lists with brief bits of information." Instead:

- **Use prose and context**: Introduce concepts with narrative framing. Explain the "why" before the "what."
- **Integrate lists naturally**: When lists are needed, embed them in prose. Add explanatory sentences before and after.
- **Add connective tissue**: Show how concepts relate to each other. Use transitions between sections.
- **Include concrete scenarios**: Don't just list mechanics—show them in action through examples and use cases.
- **Remove redundant TOCs**: Chapter-level tables of contents are unnecessary. Let the content flow naturally.
- **Merge when appropriate**: If multiple short chapters cover closely related topics, consider consolidating them into a single, substantial chapter with clear sections.

**Good**: "When your character faces a challenge, you'll roll dice to determine the outcome. The game uses 4d6 as its core mechanic—four six-sided dice rolled together and summed. This creates a bell curve of results centered around 14, meaning most rolls cluster near that average while truly exceptional or disastrous outcomes remain rare. Here's how it works: [explanation with examples]."

**Avoid**: "Rolling Dice: Roll 4d6. Add them up. Compare to DC. Check outcome."

## Technical Standards

- Front matter on every chapter:

```yaml
---
title: "<Chapter Title>"
slug: <book>-<chapter-slug>
doc_type: book
version: 1.3
last_updated: YYYY-MM-DD
keywords: [ttrpg, <book>, <topic>]
---
```

- Heading IDs: add stable IDs to all H2/H3 anchors for deep links.
- Tone: clear, confident, friendly; avoid slang; make content engaging and informative; keep GM callouts concise.
- Accessibility: define all TTRPG jargon on first use; provide clear definitions for newcomers (e.g., "GM", "PC", "NPC", "session", "campaign"); assume zero prior TTRPG experience.
- Examples: at least one worked example per major rule; include cross-genre examples when relevant; show both mechanical resolution AND narrative outcome.
- Mechanical clarity: always include DC cues, outcome tiers, Tags/Conditions, and GM Usage.
- **Dice Notation (CRITICAL):**
  - This is a **4d6 system**. Always use `4d6` notation in examples.
  - **NEVER use `d20`, `2d20`, or other dice** unless specifically required by a mechanic (e.g., rolling extra dice for advantage/disadvantage).
  - **Advantage:** Roll 5d6 (±1) or 6d6 (±2), keep best 4 dice.
  - **Disadvantage:** Roll 5d6 (±1) or 6d6 (±2), keep worst 4 dice.
  - **Outcome tiers:** Critical Success (margin ≥+5), Full Success (≥0), Partial Success (-1 to -2), Failure (≤-3), Critical Failure (≤-7 or all 1s).
  - **DC Ladder:** 12 (Easy), 14 (Routine), 16 (Tough), 18 (Hard), 20 (Heroic), 22 (Legendary).
- Narrative utility: add "How to use this now" bullets for GMs/players.
- Tables: aim for readability; label with captions; include alt text for figures.
- Cross-links: prefer stable IDs; link to glossary terms on first use.
- Glossary: use a shared `GLOSSARY.md` with anchors; add index terms only when you adopt a build tool.
- Lint: docs should pass link-check; length-based linting rules (MD013) can be ignored in favor of depth and clarity.
