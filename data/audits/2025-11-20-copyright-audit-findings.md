# Copyright Audit Findings - Core Rulebook

**Date:** November 20, 2025
**Auditor:** AI Analysis
**Scope:** books/core/v1/ (all chapters and reference materials)
**Status:** REQUIRES REMEDIATION

---

## Executive Summary

**Risk Level: MODERATE-HIGH**

The Razorweave core rulebook contains **two critical copyright issues** that require immediate remediation before public release or commercial use. While most game mechanics and terminology are original or generic enough to be safe, specific terminology borrowed from D&D 5e and Forged in the Dark creates unnecessary legal risk.

**Critical Issues Found: 2**
- **Issue #1:** Extensive use of D&D 5e's "Advantage/Disadvantage" terminology
- **Issue #2:** Use of Forged in the Dark's "Position and Effect" terminology

---

## Critical Issues (MUST FIX)

### 🔴 Issue #1: D&D 5e Terminology - "Advantage" and "Disadvantage"

**Severity:** CRITICAL - High copyright risk
**Occurrences:** 144 instances across 18 files
**Source System:** Dungeons & Dragons 5th Edition (Wizards of the Coast)

**Problem:**
"Advantage" and "Disadvantage" are signature mechanics from D&D 5e, trademarked and strongly associated with WotC's product. While game mechanics cannot be copyrighted, using the exact terminology creates confusion about derivation and potential trademark issues.

**Files Affected (Top 10 by count):**
1. `books/core/v1/chapters/28-glossary.md` (20 occurrences)
2. `books/core/v1/chapters/18-extended-tags-conditions-reference.md` (26)
3. `books/core/v1/chapters/17-proficiencies-reference-by-domain.md` (21)
4. `books/core/v1/chapters/15-skills-reference-by-attribute.md` (14)
5. `books/core/v1/chapters/08-actions-checks-outcomes.md` (15)
6. `books/core/v1/chapters/09-tags-conditions-clocks.md` (10)
7. `books/core/v1/chapters/10-combat-basics.md` (8)
8. `books/core/v1/chapters/24-npcs-vpcs-enemies.md` (5)
9. Plus 10 more files with 1-6 occurrences each

**Example Usage:**
```markdown
- **+1 Advantage**: Roll 5d6, keep the best 4.
- **+2 Advantage**: Roll 6d6, keep the best 4.
- **-1 Disadvantage**: Roll 5d6, keep the worst 4.
- **-2 Disadvantage**: Roll 6d6, keep the worst 4.
```

**Recommendation:**
Replace "Advantage" and "Disadvantage" with Razorweave-specific terminology throughout all files.

---

### 🔴 Issue #2: Forged in the Dark Terminology - "Position and Effect"

**Severity:** CRITICAL - High copyright risk
**Occurrences:** 3 files
**Source System:** Forged in the Dark / Blades in the Dark (Evil Hat Productions)

**Problem:**
"Position" (risk level) and "Effect" (impact level) are signature concepts from the Forged in the Dark SRD. Using this exact terminology creates direct association with FitD games and potential copyright concerns.

**Files Affected:**
1. `books/core/v1/chapters/09-tags-conditions-clocks.md` (2 occurrences)
2. `books/core/v1/chapters/18-extended-tags-conditions-reference.md` (1 occurrence)
3. `books/core/v1/chapters/24-npcs-vpcs-enemies.md` (1 reference)

**Example Usage:**
```markdown
- Change position or effect (how risky an action feels or how big its impact is).

- Change position and effect—how exposed you are if something goes wrong,
  or how much impact success has.
```

**Recommendation:**
Replace "position and effect" with Razorweave-specific terminology. The concepts can remain (risk and impact assessment), but the exact phrasing must change.

---

## Moderate Issues (SHOULD ADDRESS)

### 🟡 Issue #3: "Clocks" Mechanic

**Severity:** MODERATE - Acceptable with original wording
**Source System:** Forged in the Dark / Blades in the Dark
**Status:** Currently SAFE but monitor

**Finding:**
Razorweave uses segmented "Clocks" (4, 6, or 8 segments) to track progress and threats. This mechanic originated in Blades in the Dark but has become common across many indie RPGs.

**Why This Is Currently Safe:**
- The mechanic itself cannot be copyrighted (only specific expression)
- "Clock" is a generic term for tracking progress
- Razorweave's descriptions appear to be in original words
- The implementation differs (no 12-segment clocks, different advancement rules)
- Clocks are now used in dozens of games, making them generic

**Recommendation:**
No immediate changes required. However, consider adding unique Razorweave branding ("Razorweave Trackers" or similar) if concerned about association with Blades in the Dark.

---

## Safe Findings (No Action Needed)

### ✅ Attribute Names

**Razorweave Uses:** Might (MIG), Agility (AGI), Presence (PRE), Reason (RSN)
**D&D Uses:** Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma

**Assessment:** SAFE - All attribute names are either original or generic enough to avoid copyright issues. The only D&D attribute name mentioned ("Charisma") appears only in a descriptive context explaining what Presence includes.

---

### ✅ Core Dice Mechanics

**Razorweave Uses:** 4d6 + modifiers, margin-based outcomes
**D&D Uses:** d20 + modifiers
**PbtA Uses:** 2d6 + stat

**Assessment:** SAFE - Completely different dice mechanics. Razorweave's 4d6 system is original.

---

### ✅ Skills System

**Assessment:** SAFE - Fiction-first skills that pair with different attributes depending on approach. While influenced by modern RPG design, the implementation and wording are original. No direct copying of D&D skill names detected.

---

### ✅ Tags and Conditions

**Assessment:** SAFE - These are generic game design concepts. The specific implementation (Tags for environment, Conditions for character state) is distinct and well-defined in original language.

---

### ✅ Combat System

**Assessment:** SAFE - Uses Clocks instead of Hit Points, which is explicitly called out as different from D&D. The text even includes a section "Why Clocks and Not Hit Points?" that differentiates the system.

---

### ✅ General Terminology

**Verified Terms NOT Found (Good!):**
- "Dungeon Master" ❌ (uses "GM" instead ✅)
- "Spell Slots" ❌
- "Cantrips" ❌
- "Bonus Action" ❌
- "Armor Class" ❌
- D&D attribute names (except in descriptive contexts) ❌
- PbtA "Moves" as a mechanic ❌

---

## Recommendations Priority

### HIGH PRIORITY (Do Before Any Public Release)

1. **Replace "Advantage/Disadvantage" globally** (Issue #1)
   - Affects 144 instances across 18 files
   - Most critical trademark/copyright risk
   - See Remediation Plan for replacement options

2. **Replace "Position and Effect" references** (Issue #2)
   - Affects 3 files
   - Creates direct association with Forged in the Dark
   - See Remediation Plan for replacement options

### MEDIUM PRIORITY (Consider for Polish)

3. **Add unique branding to "Clocks"** (Issue #3 - optional)
   - Not required but reduces FitD association
   - Could use "Razorweave Trackers," "Progress Wheels," etc.

4. **Review all examples for originality**
   - Ensure no example scenarios are copied from other games
   - Verify all flavor text is original

### LOW PRIORITY (Good Practices)

5. **Document inspiration sources**
   - Create an "Inspirations & Acknowledgments" page
   - Acknowledge games that influenced design (without copying)

6. **Maintain version history**
   - Keep git history showing iterative development
   - Proves independent creation if challenged

---

## Legal Context

### What Can Be Copyrighted
- **Specific expression** of rules (exact wording)
- **Flavor text** and examples
- **Artwork** and graphics
- **Character fiction** and world-building
- **Specific tables/charts** (if creative expression involved)

### What CANNOT Be Copyrighted
- **Game mechanics** themselves
- **Dice rolling methods**
- **Mathematical formulas**
- **Functional game systems**
- **Ideas and concepts**

### The Risk With Current Issues

The two critical issues (Advantage/Disadvantage, Position/Effect) fall into a gray area:
- The **mechanics** themselves are not copyrightable
- The **terminology** may be trademarked or so strongly associated with specific publishers that using it creates confusion about derivation
- Courts could view this as either:
  - "Functional terminology" (SAFE)
  - "Trade dress / trademark infringement" (RISKY)

**Best Practice:** Replace all strongly-associated terminology with original terms to eliminate risk entirely.

---

## Next Steps

1. ✅ Review this findings report
2. ⏭️ Review and approve the Remediation Plan
3. ⏭️ Execute find-and-replace operations across all affected files
4. ⏭️ Review changes for consistency and clarity
5. ⏭️ Update glossary and index with new terminology
6. ⏭️ Run tests to ensure no broken references
7. ⏭️ Commit changes with clear documentation

---

## Appendix: Search Methodology

**Tools Used:**
- ripgrep (Grep tool) for pattern matching
- Manual review of 4 core chapters
- Systematic terminology comparison with D&D 5e, PbtA, and FitD

**Search Patterns:**
```bash
# Advantage/Disadvantage
pattern: \b(Advantage|Disadvantage)\b
result: 144 total occurrences across 18 files

# Position and Effect
pattern: \b(position.{0,10}effect|effect.{0,10}position)\b
result: 3 files with 4 occurrences

# D&D attribute names
pattern: \b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b
result: 2 files (descriptive use only, not as attribute names)

# D&D mechanics
pattern: \b(spell slots?|cantrips?|bonus action)\b
result: 0 files

# Combat terms
pattern: \b(armor class|AC|hit points?|HP)\b
result: 1 file (only to explain why NOT using them)

# PbtA moves
pattern: \bmoves?\b
result: 51 occurrences (all normal English usage, not PbtA mechanics)
```

---

**REMEMBER: THIS IS NOT LEGAL ADVICE. CONSULT AN IP ATTORNEY BEFORE COMMERCIAL RELEASE.**
