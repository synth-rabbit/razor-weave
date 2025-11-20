# Copyright Remediation Plan

**Date:** November 20, 2025
**Based On:** Copyright Audit Findings (2025-11-20)
**Status:** PROPOSED - Awaiting Approval
**Estimated Effort:** 3-5 hours

---

## Overview

This plan addresses the two critical copyright issues identified in the audit:
1. **Issue #1:** Replace D&D 5e's "Advantage/Disadvantage" (144 occurrences, 18 files)
2. **Issue #2:** Replace Forged in the Dark's "Position and Effect" (4 occurrences, 3 files)

All replacements maintain the same mechanical function while using original Razorweave terminology.

---

## Issue #1: Replacing "Advantage/Disadvantage"

### Proposed Replacement Terminology

**Option A: "Edge/Burden" (RECOMMENDED)**
- ✅ Thematically appropriate (reflects fortune/adversity)
- ✅ Short, memorable, easy to say at table
- ✅ Completely distinct from D&D
- ✅ Works well in sentences ("You gain +1 Edge," "You have -2 Burden")
- ✅ Natural abbreviations ("+1 Edge" / "-2 Burden")

**Option B: "Favor/Hindrance"**
- ✅ Clear meaning
- ⚠️ Slightly longer
- ✅ Distinct from D&D
- ⚠️ "Favor" might be confused with narrative currency in other games

**Option C: "Boost/Drag"**
- ✅ Very short
- ✅ Casual, modern feel
- ⚠️ Might feel too informal for some tables
- ⚠️ "Drag" has other connotations

### Recommended Choice: **Edge/Burden**

**Reason:** Best balance of clarity, brevity, and thematic fit. "Edge" conveys having an advantage in plain language without copying D&D's term. "Burden" clearly communicates difficulty/hardship.

### Replacement Specifications

**Current Terminology:**
```markdown
- **+1 Advantage**: Roll 5d6, keep the best 4.
- **+2 Advantage**: Roll 6d6, keep the best 4.
- **-1 Disadvantage**: Roll 5d6, keep the worst 4.
- **-2 Disadvantage**: Roll 6d6, keep the worst 4.
```

**New Terminology:**
```markdown
- **+1 Edge**: Roll 5d6, keep the best 4.
- **+2 Edge**: Roll 6d6, keep the best 4.
- **-1 Burden**: Roll 5d6, keep the worst 4.
- **-2 Burden**: Roll 6d6, keep the worst 4.
```

**Alternative Formulations:**
- "You gain Edge" / "You gain +1 Edge"
- "You suffer Burden" / "You suffer -1 Burden"
- "You have Edge on this Check" → "You have +1 Edge on this Check"
- "Grant Advantage" → "Grant Edge"
- "Impose Disadvantage" → "Impose Burden"

### Search and Replace Operations

**Pattern 1: Basic mentions**
```bash
Find: \bAdvantage\b
Replace: Edge

Find: \bDisadvantage\b
Replace: Burden
```

**Pattern 2: With modifiers**
```bash
Find: \+(\d+) Advantage\b
Replace: +$1 Edge

Find: -(\d+) Disadvantage\b
Replace: -$1 Burden

Find: −(\d+) Disadvantage\b  # (en-dash variant)
Replace: −$1 Burden
```

**Pattern 3: Verbal forms**
```bash
Find: \bgrant(s|ing|ed)? Advantage\b
Replace: grant$1 Edge

Find: \bimpose(s|d)? Disadvantage\b
Replace: impose$1 Burden

Find: \bhave Advantage\b
Replace: have Edge

Find: \bhave Disadvantage\b
Replace: have Burden
```

### Files to Update (18 total)

**High Priority (Most occurrences):**
1. `books/core/v1/chapters/28-glossary.md` (20 occurrences)
2. `books/core/v1/chapters/18-extended-tags-conditions-reference.md` (26)
3. `books/core/v1/chapters/17-proficiencies-reference-by-domain.md` (21)
4. `books/core/v1/chapters/15-skills-reference-by-attribute.md` (14)
5. `books/core/v1/chapters/08-actions-checks-outcomes.md` (15)

**Medium Priority:**
6. `books/core/v1/chapters/09-tags-conditions-clocks.md` (10)
7. `books/core/v1/chapters/10-combat-basics.md` (8)
8. `books/core/v1/chapters/16-proficiencies-system-overview.md` (6)
9. `books/core/v1/chapters/29-index.md` (6)
10. `books/core/v1/chapters/24-npcs-vpcs-enemies.md` (5)

**Lower Priority (1-3 occurrences each):**
11. `books/core/v1/chapters/19-advancement-long-term-growth.md` (3)
12. `books/core/v1/chapters/07-characters-and-attributes.md` (2)
13. `books/core/v1/chapters/14-skills-system-overview.md` (2)
14. `books/core/v1/chapters/21-running-sessions.md` (2)
15. `books/core/v1/chapters/25-factions-fronts-world-pressure.md` (1)
16. `books/core/v1/chapters/20-optional-variant-rules.md` (1)
17. `books/core/v1/chapters/13-roleplaying-guidance-working-with-gm.md` (1)
18. `books/core/v1/chapters/11-exploration-social-play.md` (1)

### Glossary Updates Required

**Add new entries:**
```markdown
**Edge** – Favorable circumstances that improve your chances on a Check.
When you have Edge, you roll extra dice and keep the best results.
+1 Edge means roll 5d6 keep best 4. +2 Edge means roll 6d6 keep best 4.
Edge can come from Tags, Conditions, Proficiencies, positioning, or preparation.

**Burden** – Unfavorable circumstances that reduce your chances on a Check.
When you have Burden, you roll extra dice and keep the worst results.
-1 Burden means roll 5d6 keep worst 4. -2 Burden means roll 6d6 keep worst 4.
Burden can come from Tags, Conditions, injuries, environment, or pressure.
```

**Remove old entries:**
- Delete "Advantage" entry
- Delete "Disadvantage" entry

---

## Issue #2: Replacing "Position and Effect"

### Proposed Replacement Terminology

**Option A: "Risk and Impact" (RECOMMENDED)**
- ✅ Clear, plain language
- ✅ Describes exactly what they mean
- ✅ No association with Forged in the Dark
- ✅ Works well in sentences

**Option B: "Exposure and Magnitude"**
- ✅ More technical/formal
- ⚠️ Slightly more syllables
- ✅ Very distinct from FitD

**Option C: "Danger and Scope"**
- ✅ Clear meaning
- ⚠️ "Scope" might not be immediately clear for impact
- ✅ Distinct from FitD

### Recommended Choice: **Risk and Impact**

**Reason:** Most intuitive for players. "Risk" clearly means "what could go wrong" and "Impact" clearly means "how much effect you have." No learning curve.

### Replacement Specifications

**Current Phrasing (Chapter 09, line 29):**
```markdown
- Change position or effect (how risky an action feels or how big its impact is).
```

**New Phrasing:**
```markdown
- Change risk or impact (how dangerous an action is or how much effect it has).
```

**Current Phrasing (Chapter 18, line 19):**
```markdown
- Change position and effect—how exposed you are if something goes wrong,
  or how much impact success has.
```

**New Phrasing:**
```markdown
- Change risk and impact—how exposed you are if something goes wrong,
  or how much effect success has.
```

**Current Phrasing (Chapter 09, line 91):**
```markdown
- Some Tags shift DCs or change position and effect instead of modifying dice directly.
```

**New Phrasing:**
```markdown
- Some Tags shift DCs or change risk and impact instead of modifying dice directly.
```

### Files to Update (3 total)

1. `books/core/v1/chapters/09-tags-conditions-clocks.md`
   - Line ~29: Replace "position or effect" → "risk or impact"
   - Line ~91: Replace "position and effect" → "risk and impact"

2. `books/core/v1/chapters/18-extended-tags-conditions-reference.md`
   - Line ~19: Replace "position and effect" → "risk and impact"

3. `books/core/v1/chapters/24-npcs-vpcs-enemies.md`
   - (Verify exact context and replace if "position/effect" terminology present)

### Search and Replace Operations

```bash
Find: \bposition (or|and) effect\b
Replace: risk $1 impact

Find: \beffect (or|and) position\b
Replace: impact $1 risk

Find: \bposition/effect\b
Replace: risk/impact
```

### Glossary Updates Required

**Add entries (if needed):**
```markdown
**Risk** – How dangerous or exposed an action is. Tags, Conditions, and
circumstances can change the risk of a Check, making failure more or less costly.

**Impact** – How much effect a successful action has. Tags, positioning, and
preparation can change the impact of a Check, making success more or less powerful.
```

---

## Implementation Steps

### Phase 1: Preparation (30 minutes)

1. **Create implementation branch**
   ```bash
   git checkout -b fix/copyright-terminology
   ```

2. **Backup current state**
   ```bash
   git add -A
   git commit -m "📸 snapshot: pre-remediation state"
   ```

3. **Run baseline tests**
   ```bash
   pnpm test
   pnpm lint
   ```
   Ensure clean baseline before changes.

### Phase 2: Execute Replacements (1-2 hours)

**Step 1: Replace "Advantage/Disadvantage" → "Edge/Burden"**

Use your editor's global find-and-replace (with regex if supported):

1. Replace simple mentions:
   - Find: `\bAdvantage\b` → Replace: `Edge`
   - Find: `\bDisadvantage\b` → Replace: `Burden`

2. Review each replacement manually in high-priority files:
   - `chapters/08-actions-checks-outcomes.md`
   - `chapters/09-tags-conditions-clocks.md`
   - `chapters/28-glossary.md`

3. Run batch replace on remaining files

4. Search for any missed patterns:
   ```bash
   grep -ri "advantage" books/core/v1/chapters/
   grep -ri "disadvantage" books/core/v1/chapters/
   ```

**Step 2: Replace "Position/Effect" → "Risk/Impact"**

1. Open each of the 3 affected files
2. Manually replace each instance (only ~4 total)
3. Verify context makes sense with new terminology

**Step 3: Update Glossary (Chapter 28)**

1. Add "Edge" entry
2. Add "Burden" entry
3. Remove "Advantage" entry (if present)
4. Remove "Disadvantage" entry (if present)
5. Add "Risk" entry (if not present)
6. Add "Impact" entry (if not present)

**Step 4: Update Index (Chapter 29)**

1. Add index entries for "Edge"
2. Add index entries for "Burden"
3. Remove index entries for "Advantage"
4. Remove index entries for "Disadvantage"
5. Update index for "Risk" and "Impact" if needed

### Phase 3: Verification (1 hour)

**Step 1: Automated checks**
```bash
# Ensure no old terminology remains
grep -ri "\badvantage\b" books/core/v1/chapters/
grep -ri "\bdisadvantage\b" books/core/v1/chapters/
grep -ri "position.*effect" books/core/v1/chapters/
grep -ri "effect.*position" books/core/v1/chapters/

# Should all return 0 results (or only in comments/metadata)
```

**Step 2: Manual review**

1. Read through Chapter 08 (Actions, Checks, Outcomes) - verify flow
2. Read through Chapter 09 (Tags, Conditions, Clocks) - verify clarity
3. Spot-check 5 other chapters for consistency
4. Review Glossary for completeness

**Step 3: Test suite**
```bash
pnpm test        # Unit tests
pnpm lint        # Linting
pnpm build       # If applicable
```

**Step 4: Export HTML and review**
```bash
# If you have an HTML export script
pnpm export:html

# Open and check:
# - No broken references
# - Terms read naturally
# - Glossary links work
```

### Phase 4: Documentation (30 minutes)

**Step 1: Create commit**
```bash
git add -A
git commit -m "🔒 fix(copyright): replace D&D/FitD terminology with original terms

Replaced D&D 5e's 'Advantage/Disadvantage' with 'Edge/Burden' (144 instances, 18 files)
Replaced Forged in the Dark's 'Position/Effect' with 'Risk/Impact' (4 instances, 3 files)

Changes:
- Advantage → Edge (favorable circumstances, roll extra keep best)
- Disadvantage → Burden (unfavorable circumstances, roll extra keep worst)
- Position/Effect → Risk/Impact (danger level and success magnitude)

Mechanical function unchanged. Terminology now fully original.

Resolves copyright audit findings (2025-11-20).
Reduces legal risk from MODERATE-HIGH to LOW.

Files affected:
- 18 chapter files (Advantage/Disadvantage replacements)
- 3 chapter files (Position/Effect replacements)
- Updated Glossary (Chapter 28)
- Updated Index (Chapter 29)

Verified with:
- grep searches for remaining instances (0 found)
- Manual review of 7 chapters
- Full test suite passing
- Linting passing
"
```

**Step 2: Update COPYRIGHT-RISK-ASSESSMENT.md**
```markdown
## Updates (November 20, 2025)

### Remediation Completed ✅

**Issue #1: Advantage/Disadvantage (RESOLVED)**
- Replaced with "Edge/Burden" terminology
- 144 instances updated across 18 files
- Mechanical function preserved, terminology fully original

**Issue #2: Position/Effect (RESOLVED)**
- Replaced with "Risk/Impact" terminology
- 4 instances updated across 3 files
- Concepts preserved, terminology fully original

**New Risk Level: LOW**
- All critical copyright issues resolved
- Game mechanics remain inspired by modern RPG design
- All terminology now original or generic
- Safe for publication and commercial use
```

**Step 3: Update this remediation plan status**
```markdown
**Status:** COMPLETED (2025-11-20)
**Actual Effort:** [X] hours
**Result:** All critical copyright issues resolved. Risk level reduced to LOW.
```

---

## Testing Checklist

After implementation, verify:

- [ ] Grep search for "Advantage" returns 0 results in chapter files
- [ ] Grep search for "Disadvantage" returns 0 results in chapter files
- [ ] Grep search for "position.*effect" returns 0 results
- [ ] Grep search for "effect.*position" returns 0 results
- [ ] Glossary includes "Edge" definition
- [ ] Glossary includes "Burden" definition
- [ ] Glossary includes "Risk" definition (or suitable context)
- [ ] Glossary includes "Impact" definition (or suitable context)
- [ ] Index updated with new terms
- [ ] All chapter examples use new terminology correctly
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] HTML export (if applicable) displays correctly
- [ ] Manual read-through of Chapter 08 confirms natural language flow
- [ ] Manual read-through of Chapter 09 confirms clarity
- [ ] Git commit includes full documentation

---

## Rollback Plan

If issues arise during implementation:

```bash
# Return to pre-remediation state
git reset --hard [snapshot-commit-hash]

# Or create a revert commit
git revert [remediation-commit-hash]
```

Keep the snapshot commit (`📸 snapshot: pre-remediation state`) for at least 30 days after successful remediation.

---

## Success Criteria

**Remediation is successful when:**

1. ✅ Zero instances of "Advantage/Disadvantage" in core rulebook
2. ✅ Zero instances of "position and/or effect" in FitD context
3. ✅ All tests passing
4. ✅ All lints passing
5. ✅ Glossary updated with new terminology
6. ✅ Manual review confirms natural language flow
7. ✅ COPYRIGHT-RISK-ASSESSMENT.md updated to reflect LOW risk
8. ✅ Git history documents the change with full rationale

---

## Alternative Terminology (If Edge/Burden Not Preferred)

If "Edge/Burden" doesn't resonate with you after testing, here are complete alternatives:

### Alternative Set A: "Favor/Hindrance"
```
+1 Favor / -1 Hindrance
"You gain Favor on this Check"
"The terrain imposes Hindrance"
```

### Alternative Set B: "Boost/Drag"
```
+1 Boost / -1 Drag
"You have Boost from cover"
"The storm creates Drag"
```

### Alternative Set C: "Assist/Hamper"
```
+1 Assist / -1 Hamper
"Your Proficiency Assists"
"The condition Hampers your movement"
```

**Note:** If changing from the recommended "Edge/Burden", update the entire plan with your chosen alternative before executing Phase 2.

---

## Questions Before Implementation

Before executing this plan, confirm:

1. ✅ Do you approve "Edge/Burden" as the replacement for "Advantage/Disadvantage"?
   - If NO: Which alternative do you prefer?

2. ✅ Do you approve "Risk/Impact" as the replacement for "Position/Effect"?
   - If NO: Which alternative do you prefer?

3. ✅ Should we also rebrand "Clocks" to something Razorweave-specific?
   - Optional: "Progress Trackers", "Razorweave Wheels", "Countdown Circles"
   - Or keep "Clocks" as generic enough

4. ✅ Is there a preferred order for file updates?
   - Alphabetical?
   - By chapter number?
   - By occurrence count (high to low)?

---

## Post-Remediation Steps

After successful implementation:

1. **Legal review** (if budget allows)
   - Share updated rulebook with IP attorney
   - Get professional clearance opinion
   - ~$500-2000 typically

2. **Trademark search** for "Razorweave"
   - Ensure name is available
   - Consider trademark registration if going commercial
   - ~$225-400 per class

3. **Document design process**
   - Keep git history showing iterative development
   - Maintain design notes showing independent creation
   - Proves originality if ever challenged

4. **Create attribution page** (optional but good practice)
   - Acknowledge games that inspired design
   - List without copying: "Inspired by modern RPG design including [list]"
   - Shows good faith and awareness

---

**Ready to proceed when you approve the terminology choices.**
