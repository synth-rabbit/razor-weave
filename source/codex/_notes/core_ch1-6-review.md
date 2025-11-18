# Core Rulebook Draft – Chapters 1–6 Review Notes

These notes capture a quick quality and information pass on `source/codex/core.html` Chapters 1–6, against the 1.3 Player’s Handbook tone, `STYLE.md`, and `GLOSSARY.md`.

## Chapter 1 – Welcome to the Game

**Strengths**
- Tone and onboarding match the PHB’s inviting, collaborative voice.
- Clearly positions the book as single source of truth and sets fiction-first expectations.
- Gives a solid sense of scope (character creation, resolving uncertainty, multi-genre support).

**Quick fixes (safe to change now)**
- Clean up the final sentence “What happens next.” to read as a complete sentence or question (e.g., “What happens next?”) to avoid feeling like a typo.
- On first use of key terms (GM, player, character, Check), align capitalization and phrasing with `GLOSSARY.md` and PHB wording for consistency.

**Later revisions**
- Consider adding a single, very short cross-genre micro-example of play that reflects the 4d6 check structure without going deep into mechanics (to foreshadow the system’s feel).
- Once the final book file is in place, add glossary links on first use of GM, PC, NPC, Check, Tag, Condition, Clock in this chapter.

## Chapter 2 – Core Concepts at a Glance

**Strengths**
- Provides a compact, readable overview that mirrors the PHB’s early “what you need to know” section.
- Fiction-first explanation is clear and accessible to new players.
- Introduces Attributes, Characters, Checks, and state tools (Tags, Conditions, Clocks) at the right altitude.

**Quick fixes (safe to change now)**
- Add stable `id` attributes to all H3 headings (e.g., Fiction First, Characters, Checks and Outcomes, Tags/Conditions/Clocks, Table Collaboration) to match the “every H1–H4 has an ID” requirement.
- On first mention of Attributes, consider including abbreviations in parentheses (Might (MIG), Agility (AGI), etc.) to sync with the glossary and later mechanical chapters.

**Later revisions**
- Add a brief sentence that explicitly mentions the core 4d6 dice mechanic and DC ladder in the Checks and Outcomes section, with a pointer to the later detailed chapter.
- Tighten wording so “Check” and “Outcome tier” line up more explicitly with glossary terminology (Margin, DC ladder, outcome tiers).

## Chapter 3 – How to Use This Rulebook

**Strengths**
- Explains the structure of the book cleanly and matches the blueprint’s chapter groupings.
- Sets strong expectations that the book is both a tutorial and a reference.
- Glossary usage guidance (“authoritative source for terms”) is in line with STYLE guidelines.

**Quick fixes (safe to change now)**
- Ensure all H3 headings (e.g., Navigating the Book, Recognizing Rule Triggers, Using Examples, Using the Glossary, Reading as a Group) have explicit `id` attributes for deep linking.
- Where chapter ranges are referenced (e.g., “Chapters 6 through 13”), verify the numbers match the final blueprint and update wording if chapter count shifts later.

**Later revisions**
- Once the final HTML book exists, add internal links from the “structure of the book” bullets to specific chapter anchors.
- Expand “Using Examples” with one short, clearly labeled Trigger–Roll–Consequence outline that mirrors the formal example structure described in `STYLE.md`.

## Chapter 4 – Core Principles of Play

**Strengths**
- Captures key PHB-style principles: table as creative team, fiction-first, player intent, GM honesty.
- Examples (like the depot scene) show conversation flow without overloading mechanics.
- Sets cultural expectations in a way that supports many playstyles.

**Quick fixes (safe to change now)**
- Add `id` attributes to all H3 principle headings to allow direct linking to specific principles.
- Scan for opportunities to introduce safety/trust language explicitly (e.g., table safety, consent) if those terms appear elsewhere in the system, and harmonize phrasing when the broader book safety content is in place.

**Later revisions**
- Consider adding at least one more example that shows failure or partial success leading to interesting story outcomes, to reinforce “failure creates momentum.”
- When later chapters on alternative play modes and safety tools are drafted, add a short cross-reference here.

## Chapter 5 – Ways to Play the Game

**Strengths**
- Clearly describes multiple play modes (group, duet, GMless, solo, asynchronous, one shots, campaigns, hybrid) in a way that matches the blueprint.
- Emphasizes flexibility and validates different table preferences.
- The “Choosing the Right Mode” section provides clear guidance and framing.

**Quick fixes (safe to change now)**
- Add `id` attributes to all H3 headings for each play mode and the summary sections.
- Check terms like “GMless” and “solo play” against any glossary entries or PHB terminology for exact spelling and capitalization.

**Later revisions**
- Once Chapters 21–26 (GM section, GMless, solo framework) are written, add explicit forward references so this chapter feels tightly connected to the later, procedural content.
- Optionally add a tiny cross-genre example for one or two modes (e.g., what a solo scene or GMless framing actually looks like) to increase flavor.

## Chapter 6 – Character Creation

**Strengths**
- Follows the blueprint’s step sequence closely, including the “Learning by Example” and “Creation Flow” overview.
- Presents Attributes, Skills, and Proficiencies clearly with strong narrative framing and a good example character (Rella).
- Emphasizes collaborative, open lists for Skills/Proficiencies in line with the consolidation plan.

**Quick fixes (safe to change now)**
- Ensure all step headings (Step One, Step Two, etc., plus “Before You Choose Skills and Proficiencies”) have `id` attributes that match a consistent pattern for linking.
- On first mention of Skills and Proficiencies, align definitions and capitalization with `GLOSSARY.md` and the consolidation blueprint (e.g., “Skills are action based competencies; Proficiencies are narrative domain expertise”).

**Later revisions**
- When Skills/Proficiencies chapters (14–17) are in place, add explicit forward references from this chapter to those sections.
- Consider adding one more concise, end-to-end worked example summary for Rella that names Attributes, 1–2 Skills, and 1–2 Proficiencies in a single block, matching the Trigger–Roll–Consequence example style where appropriate.
