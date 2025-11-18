# Core Rulebook Review and Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Systematically review, validate, and enhance the Razorweave Core Rulebook HTML with integrated glossary, comprehensive index, and improved navigation.

**Architecture:** Three-phase sequential approach: (1) automated validation + manual review generates findings document, (2) programmatic term extraction generates glossary/index chapters with bidirectional links, (3) CSS/JS enhancements add responsive navigation features. Foundation before polish.

**Tech Stack:** Bash scripting (grep/sed/awk), Python for HTML parsing (BeautifulSoup), vanilla JavaScript for scroll-spy, CSS Grid/Flexbox for responsive layout.

---

## Phase 1: Content Review & Documentation

### Task 1: Set Up Review Infrastructure

**Files:**
- Create: `scripts/review/validate-mechanics.sh`
- Create: `scripts/review/validate-links.sh`
- Create: `scripts/review/extract-terms.py`
- Create: `docs/reviews/.gitkeep`

**Step 1: Create reviews directory**

```bash
mkdir -p docs/reviews
touch docs/reviews/.gitkeep
```

**Step 2: Create scripts directory**

```bash
mkdir -p scripts/review
```

**Step 3: Verify directories created**

Run: `ls -la docs/reviews scripts/review`
Expected: Both directories exist

**Step 4: Commit infrastructure**

```bash
git add docs/reviews/.gitkeep scripts/review
git commit -m "chore: create review infrastructure directories"
```

---

### Task 2: Validate Dice Notation

**Files:**
- Create: `scripts/review/validate-mechanics.sh`

**Step 1: Write dice notation validator**

```bash
#!/usr/bin/env bash
# validate-mechanics.sh - Check for non-standard dice notation

set -euo pipefail

HTML_FILE="${1:-source/codex/book/core_rulebook.html}"

echo "=== Dice Notation Validation ==="
echo "Checking for non-4d6 dice references..."
echo ""

# Find all dice notation patterns (e.g., 2d20, d20, 3d6, etc.)
# Exclude 4d6, 5d6, 6d6 (valid for advantage/disadvantage)
grep -n -E '\b([2-9]d[0-9]+|d20|1d[0-9]+|[0-9]+d[0-9]+)\b' "$HTML_FILE" \
  | grep -v '4d6' \
  | grep -v '5d6' \
  | grep -v '6d6' \
  || echo "No invalid dice notation found"

echo ""
echo "=== DC Value Validation ==="
echo "Checking for non-standard DC values..."
echo ""

# Find all DC references and check if they match standard ladder
# Standard: 12, 14, 16, 18, 20, 22
grep -n -o -E 'DC [0-9]+' "$HTML_FILE" \
  | grep -v 'DC 12' \
  | grep -v 'DC 14' \
  | grep -v 'DC 16' \
  | grep -v 'DC 18' \
  | grep -v 'DC 20' \
  | grep -v 'DC 22' \
  || echo "All DC values are standard"
```

**Step 2: Make script executable**

Run: `chmod +x scripts/review/validate-mechanics.sh`

**Step 3: Test script on core rulebook**

Run: `./scripts/review/validate-mechanics.sh source/codex/book/core_rulebook.html`
Expected: Output showing any non-standard dice notation or DC values

**Step 4: Commit validator**

```bash
git add scripts/review/validate-mechanics.sh
git commit -m "feat(review): add dice notation and DC value validator"
```

---

### Task 3: Validate Internal Links

**Files:**
- Create: `scripts/review/validate-links.sh`

**Step 1: Write link validator script**

```bash
#!/usr/bin/env bash
# validate-links.sh - Check all internal links have valid targets

set -euo pipefail

HTML_FILE="${1:-source/codex/book/core_rulebook.html}"

echo "=== Internal Link Validation ==="
echo ""

# Extract all hrefs that are internal links (start with #)
echo "Extracting all internal link targets..."
HREFS=$(grep -o 'href="#[^"]*"' "$HTML_FILE" | sed 's/href="#\([^"]*\)"/\1/' | sort -u)

# Extract all id attributes
echo "Extracting all id attributes..."
IDS=$(grep -o 'id="[^"]*"' "$HTML_FILE" | sed 's/id="\([^"]*\)"/\1/' | sort -u)

# Check each href has a matching id
echo ""
echo "Checking for broken links..."
BROKEN=0

for href in $HREFS; do
  if ! echo "$IDS" | grep -q "^${href}$"; then
    echo "BROKEN: #${href} (no matching id found)"
    BROKEN=$((BROKEN + 1))
  fi
done

echo ""
if [ $BROKEN -eq 0 ]; then
  echo "✓ All internal links are valid"
else
  echo "✗ Found $BROKEN broken link(s)"
  exit 1
fi
```

**Step 2: Make script executable**

Run: `chmod +x scripts/review/validate-links.sh`

**Step 3: Test link validator**

Run: `./scripts/review/validate-links.sh source/codex/book/core_rulebook.html`
Expected: List of broken internal links (if any)

**Step 4: Commit link validator**

```bash
git add scripts/review/validate-links.sh
git commit -m "feat(review): add internal link validator"
```

---

### Task 4: Extract Terms for Glossary

**Files:**
- Create: `scripts/review/extract-terms.py`

**Step 1: Write Python term extractor**

```python
#!/usr/bin/env python3
"""
extract-terms.py - Extract defined terms from core rulebook HTML
"""

import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

def extract_bold_terms(html_content: str) -> Dict[str, List[Tuple[str, str]]]:
    """
    Extract terms defined in bold with definitions.
    Returns dict mapping term -> [(chapter_id, context), ...]
    """
    terms = defaultdict(list)

    # Pattern: <strong>Term</strong>: definition text
    # or <b>Term</b>: definition text
    pattern = r'<(?:strong|b)>([^<]+)</(?:strong|b)>:\s*([^<.]+[.])'

    matches = re.finditer(pattern, html_content)

    for match in matches:
        term = match.group(1).strip()
        definition = match.group(2).strip()

        # Try to find chapter context
        start = max(0, match.start() - 500)
        context_before = html_content[start:match.start()]
        chapter_match = re.search(r'id="([^"]*ch[^"]*)"', context_before)
        chapter_id = chapter_match.group(1) if chapter_match else "unknown"

        terms[term].append((chapter_id, definition))

    return terms

def main():
    if len(sys.argv) < 2:
        print("Usage: extract-terms.py <html-file>")
        sys.exit(1)

    html_file = Path(sys.argv[1])

    if not html_file.exists():
        print(f"Error: {html_file} not found")
        sys.exit(1)

    html_content = html_file.read_text(encoding='utf-8')

    print("=== Term Extraction ===\n")

    terms = extract_bold_terms(html_content)

    print(f"Found {len(terms)} unique terms:\n")

    for term, occurrences in sorted(terms.items()):
        print(f"**{term}**")
        for chapter_id, definition in occurrences:
            print(f"  - Chapter: {chapter_id}")
            print(f"    Definition: {definition[:100]}...")
        print()

if __name__ == "__main__":
    main()
```

**Step 2: Make script executable**

Run: `chmod +x scripts/review/extract-terms.py`

**Step 3: Test term extraction**

Run: `./scripts/review/extract-terms.py source/codex/book/core_rulebook.html | head -50`
Expected: List of extracted terms with their definitions

**Step 4: Commit term extractor**

```bash
git add scripts/review/extract-terms.py
git commit -m "feat(review): add term extraction script for glossary"
```

---

### Task 5: Run Full Validation Suite

**Files:**
- Modify: `scripts/review/validate-mechanics.sh`
- Modify: `scripts/review/validate-links.sh`
- Read: `source/codex/book/core_rulebook.html`

**Step 1: Run dice notation validator**

Run: `./scripts/review/validate-mechanics.sh source/codex/book/core_rulebook.html > docs/reviews/mechanics-validation.txt`
Expected: Output file with validation results

**Step 2: Run link validator**

Run: `./scripts/review/validate-links.sh source/codex/book/core_rulebook.html > docs/reviews/link-validation.txt 2>&1 || true`
Expected: Output file with broken links (if any)

**Step 3: Run term extractor**

Run: `./scripts/review/extract-terms.py source/codex/book/core_rulebook.html > docs/reviews/extracted-terms.txt`
Expected: Output file with all extracted terms

**Step 4: Review validation outputs**

Run: `ls -lh docs/reviews/*.txt`
Expected: Three validation output files

**Step 5: Commit validation outputs**

```bash
git add docs/reviews/*.txt
git commit -m "chore(review): add validation output files"
```

---

### Task 6: Manual Chapter Review - Part I (Chapters 1-10)

**Files:**
- Read: `source/codex/book/core_rulebook.html` (Ch 1-10)
- Read: `source/codex/STYLE.md`
- Read: `source/codex/GLOSSARY.md`
- Create: `docs/reviews/2025-11-18-core-rulebook-review-findings.md` (partial)

**Step 1: Create findings document template**

```markdown
# Core Rulebook Review Findings

**Date:** 2025-11-18
**Reviewer:** Claude (Automated + Manual Review)
**Scope:** Complete review of `source/codex/book/core_rulebook.html` (404KB)

---

## Executive Summary

[To be completed after full review]

**Critical Issues:** TBD
**High Priority Issues:** TBD
**Medium Priority Issues:** TBD

---

## Part I: Core Rules (Chapters 1-10)

### Chapter 1: Introduction

**Consistency Issues:**
- [ ] [Issue description]

**Completeness Issues:**
- [ ] [Issue description]

**Quality Observations:**
- [ ] [Observation]

---

### Chapter 2: Core Mechanics

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 3: How to Use This Rulebook

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 4: Character Creation

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 5: Attributes

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 6: Skills & Proficiencies

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 7: Advancement

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 8: Core Resolution System

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 9: Combat System

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 10: Damage, Tags & Conditions

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---
```

**Step 2: Save template**

Save to: `docs/reviews/2025-11-18-core-rulebook-review-findings.md`

**Step 3: Commit findings template**

```bash
git add docs/reviews/2025-11-18-core-rulebook-review-findings.md
git commit -m "docs(review): create findings document template"
```

---

### Task 7: Manual Chapter Review - Part II (Chapters 11-20)

**Files:**
- Modify: `docs/reviews/2025-11-18-core-rulebook-review-findings.md`
- Read: `source/codex/book/core_rulebook.html` (Ch 11-20)

**Step 1: Add Part II section to findings**

Add after Part I section:

```markdown
## Part II: Advanced Topics (Chapters 11-20)

### Chapter 11: Clocks & Progress Tracking

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 12: Social Conflict

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 13: Equipment & Resources

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 14: Magic & Powers

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 15: Setting Elements

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 16: Sample Characters

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 17: Example of Play

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 18: Running the Game

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 19: Campaign Structures

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---

### Chapter 20: Session Zero

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

---
```

**Step 2: Commit Part II template**

```bash
git add docs/reviews/2025-11-18-core-rulebook-review-findings.md
git commit -m "docs(review): add Part II chapters to findings template"
```

---

### Task 8: Manual Chapter Review - Part III (Chapters 21-27)

**Files:**
- Modify: `docs/reviews/2025-11-18-core-rulebook-review-findings.md`
- Read: `source/codex/book/core_rulebook.html` (Ch 21-27)

**Step 1: Add Part III section to findings**

Add after Part II section:

```markdown
## Part III: GM Section (Chapters 21-26)

### Chapter 21: Fronts & Threats

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

**VPC Guidance:**
- [ ] Does this chapter include VPC-aware guidance?

---

### Chapter 22: Creating Scenarios

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

**VPC Guidance:**
- [ ] Does this chapter include VPC-aware guidance?

---

### Chapter 23: NPCs & Creatures

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

**VPC Guidance:**
- [ ] Does this chapter include VPC-aware guidance?

---

### Chapter 24: Worldbuilding

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

**VPC Guidance:**
- [ ] Does this chapter include VPC-aware guidance?

---

### Chapter 25: Alternative Play Modes

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

**VPC Guidance:**
- [ ] Does this chapter include VPC-aware guidance?

---

### Chapter 26: Safety Tools

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

**VPC Guidance:**
- [ ] Does this chapter include VPC-aware guidance?

---

## Part IV: Reference (Chapter 27)

### Chapter 27: Character Sheets & Play Aids

**Consistency Issues:**

**Completeness Issues:**

**Quality Observations:**

**Sheet References:**
- [ ] Verify references match files in `source/codex/sheets/`

---
```

**Step 2: Commit Part III template**

```bash
git add docs/reviews/2025-11-18-core-rulebook-review-findings.md
git commit -m "docs(review): add Part III & IV chapters to findings template"
```

---

### Task 9: Aggregate and Prioritize Findings

**Files:**
- Modify: `docs/reviews/2025-11-18-core-rulebook-review-findings.md`
- Read: `docs/reviews/mechanics-validation.txt`
- Read: `docs/reviews/link-validation.txt`
- Read: `docs/reviews/extracted-terms.txt`

**Step 1: Update Executive Summary**

At the top of findings document, update the Executive Summary section:

```markdown
## Executive Summary

**Review Scope:** Complete analysis of 404KB HTML document (27 chapters + planned Glossary/Index)

**Automated Validations:**
- Dice Notation: [X] issues found (see `mechanics-validation.txt`)
- DC Values: [X] issues found (see `mechanics-validation.txt`)
- Internal Links: [X] broken links found (see `link-validation.txt`)
- Extracted Terms: [X] unique terms identified (see `extracted-terms.txt`)

**Manual Review:**
- Chapters reviewed: 27/27
- Consistency issues identified: [X]
- Completeness gaps identified: [X]
- Quality observations: [X]

**Priority Breakdown:**

**Critical Issues (Fix Immediately):**
1. Broken internal links ([X] total)
2. Invalid mechanics references (non-4d6 dice, non-standard DCs)
3. [Other critical issues]

**High Priority Issues (Fix Before Phase 2):**
1. Terminology inconsistencies with GLOSSARY.md
2. Missing VPC guidance in Part III chapters
3. [Other high priority issues]

**Medium Priority Issues (Address in Phase 3 or Later):**
1. Chapters below word count targets
2. Missing cross-genre examples
3. [Other medium priority issues]

---
```

**Step 2: Add Appendices section at end**

```markdown
## Appendices

### Appendix A: All Broken Links

[Copy content from link-validation.txt]

---

### Appendix B: Non-Standard Mechanics

[Copy content from mechanics-validation.txt]

---

### Appendix C: Term Extraction Summary

[Copy summary from extracted-terms.txt]

Total unique terms: [X]
Terms in both book and GLOSSARY.md: [X]
Terms only in book: [X]
Terms only in GLOSSARY.md: [X]

---
```

**Step 3: Review and finalize document**

Read through entire findings document to ensure:
- All sections filled in
- Issues prioritized correctly
- Actionable items clearly stated

**Step 4: Commit completed findings**

```bash
git add docs/reviews/2025-11-18-core-rulebook-review-findings.md
git commit -m "docs(review): complete Phase 1 findings document"
```

---

## Phase 2: Glossary & Index Integration

### Task 10: Create Chapter 28 Structure (Glossary)

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Locate insertion point**

Find the end of Chapter 27 in core_rulebook.html (search for closing section tag or similar)

**Step 2: Add Chapter 28 HTML structure**

Insert before the closing `</main>` or `</body>` tag:

```html
<!-- ============================================================ -->
<!-- CHAPTER 28: GLOSSARY                                         -->
<!-- ============================================================ -->

<section id="ch28-glossary" class="chapter">
  <header class="chapter-header">
    <h1 class="chapter-title">Chapter 28: Glossary</h1>
    <p class="chapter-subtitle">Comprehensive definitions of game terms and concepts</p>
  </header>

  <nav class="glossary-nav" aria-label="Glossary sections">
    <ul>
      <li><a href="#glossary-core-mechanics">Core Mechanics</a></li>
      <li><a href="#glossary-attributes">Attributes</a></li>
      <li><a href="#glossary-character-types">Character Types</a></li>
      <li><a href="#glossary-conditions">Common Conditions</a></li>
      <li><a href="#glossary-tags">Common Tags</a></li>
    </ul>
  </nav>

  <!-- Sections will be added in next tasks -->

</section>
```

**Step 3: Verify HTML is valid**

Run: `grep -A 10 'ch28-glossary' source/codex/book/core_rulebook.html`
Expected: Chapter 28 section visible

**Step 4: Commit chapter structure**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(glossary): add Chapter 28 structure"
```

---

### Task 11: Populate Core Mechanics Glossary Section

**Files:**
- Modify: `source/codex/book/core_rulebook.html`
- Read: `source/codex/GLOSSARY.md`
- Read: `docs/reviews/extracted-terms.txt`

**Step 1: Add Core Mechanics section**

Inside the `<section id="ch28-glossary">`, add:

```html
  <section id="glossary-core-mechanics" class="glossary-section">
    <h2>Core Mechanics</h2>

    <dl class="glossary-terms">
      <dt id="advantage">
        <strong>Advantage</strong>
      </dt>
      <dd>
        <p>Roll 5d6 and keep the best 4. This increases your expected result by approximately 2-3 points compared to a standard 4d6 roll. Advantage never stacks—multiple sources of advantage still result in only one extra die.</p>
        <p class="term-reference">Defined in: <a href="#ch8-core-resolution">Chapter 8: Core Resolution</a></p>
      </dd>

      <dt id="disadvantage">
        <strong>Disadvantage</strong>
      </dt>
      <dd>
        <p>Roll 5d6 and keep the worst 4. This decreases your expected result by approximately 2-3 points compared to a standard 4d6 roll. Disadvantage never stacks—multiple sources of disadvantage still result in only one fewer die counted.</p>
        <p class="term-reference">Defined in: <a href="#ch8-core-resolution">Chapter 8: Core Resolution</a></p>
      </dd>

      <dt id="dc">
        <strong>Difficulty Class (DC)</strong>
      </dt>
      <dd>
        <p>The target number that a check must meet or exceed to succeed. Razorweave uses a standard DC ladder: 12 (routine), 14 (challenging), 16 (difficult), 18 (formidable), 20 (heroic), 22 (legendary). All DCs in this game use this ladder—no arbitrary numbers.</p>
        <p class="term-reference">Defined in: <a href="#ch8-core-resolution">Chapter 8: Core Resolution</a></p>
      </dd>

      <dt id="margin">
        <strong>Margin</strong>
      </dt>
      <dd>
        <p>The difference between your check result and the DC. A positive margin means success; negative means failure. The magnitude determines your outcome tier: Critical Success (≥+5), Full Success (0 to +4), Partial Success (-1 to -2), Failure (-3 to -6), Critical Failure (≤-7).</p>
        <p class="term-reference">Defined in: <a href="#ch8-core-resolution">Chapter 8: Core Resolution</a></p>
      </dd>

      <dt id="proficiency">
        <strong>Proficiency</strong>
      </dt>
      <dd>
        <p>A +2 bonus applied to checks when you have relevant training, expertise, or specialization. Proficiencies are gained during character creation and advancement. You either have proficiency or you don't—there are no proficiency levels or stacking bonuses.</p>
        <p class="term-reference">Defined in: <a href="#ch6-skills">Chapter 6: Skills & Proficiencies</a></p>
      </dd>

      <!-- Add more core mechanics terms -->
    </dl>
  </section>
```

**Step 2: Verify glossary section renders**

Run: `grep -A 30 'glossary-core-mechanics' source/codex/book/core_rulebook.html`
Expected: Core mechanics terms visible

**Step 3: Commit core mechanics glossary**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(glossary): add core mechanics terms to Ch 28"
```

---

### Task 12: Populate Attributes Glossary Section

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add Attributes section after Core Mechanics**

```html
  <section id="glossary-attributes" class="glossary-section">
    <h2>Attributes</h2>

    <dl class="glossary-terms">
      <dt id="agility">
        <strong>Agility (AGI)</strong>
      </dt>
      <dd>
        <p>Measures coordination, reflexes, dexterity, and physical grace. Used for checks involving acrobatics, stealth, ranged combat, fine manipulation, and quick reactions.</p>
        <p class="term-reference">Defined in: <a href="#ch5-attributes">Chapter 5: Attributes</a></p>
      </dd>

      <dt id="might">
        <strong>Might (MIG)</strong>
      </dt>
      <dd>
        <p>Measures physical strength, endurance, and toughness. Used for checks involving athletics, melee combat, breaking things, carrying heavy loads, and resisting physical harm.</p>
        <p class="term-reference">Defined in: <a href="#ch5-attributes">Chapter 5: Attributes</a></p>
      </dd>

      <dt id="presence">
        <strong>Presence (PRE)</strong>
      </dt>
      <dd>
        <p>Measures charisma, force of personality, emotional intelligence, and social awareness. Used for checks involving persuasion, deception, intimidation, performance, and reading social situations.</p>
        <p class="term-reference">Defined in: <a href="#ch5-attributes">Chapter 5: Attributes</a></p>
      </dd>

      <dt id="reason">
        <strong>Reason (RSN)</strong>
      </dt>
      <dd>
        <p>Measures intelligence, logic, knowledge, and analytical thinking. Used for checks involving investigation, lore, problem-solving, magic/technology, and pattern recognition.</p>
        <p class="term-reference">Defined in: <a href="#ch5-attributes">Chapter 5: Attributes</a></p>
      </dd>
    </dl>
  </section>
```

**Step 2: Commit attributes glossary**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(glossary): add attributes to Ch 28"
```

---

### Task 13: Populate Conditions Glossary Section

**Files:**
- Modify: `source/codex/book/core_rulebook.html`
- Read: `source/codex/GLOSSARY.md` (Conditions section)

**Step 1: Add Conditions section**

```html
  <section id="glossary-conditions" class="glossary-section">
    <h2>Common Conditions</h2>

    <dl class="glossary-terms">
      <dt id="bleeding">
        <strong>Bleeding</strong>
      </dt>
      <dd>
        <p>You take 1 damage at the start of each of your turns until you receive medical attention or stabilize yourself (DC 14 MIG or RSN check). Bleeding stacks—each instance causes separate damage.</p>
        <p class="term-reference">Defined in: <a href="#ch10-conditions">Chapter 10: Damage, Tags & Conditions</a></p>
      </dd>

      <dt id="burning">
        <strong>Burning</strong>
      </dt>
      <dd>
        <p>You take 2 damage at the start of each of your turns. You or an ally can use an action to extinguish the flames (no check required). Burning doesn't stack—you're either on fire or you're not.</p>
        <p class="term-reference">Defined in: <a href="#ch10-conditions">Chapter 10: Damage, Tags & Conditions</a></p>
      </dd>

      <dt id="dazed">
        <strong>Dazed</strong>
      </dt>
      <dd>
        <p>You have disadvantage on all checks. You can still move and act normally, but you're disoriented and struggling to focus. Dazed typically lasts until the end of your next turn unless specified otherwise.</p>
        <p class="term-reference">Defined in: <a href="#ch10-conditions">Chapter 10: Damage, Tags & Conditions</a></p>
      </dd>

      <dt id="prone">
        <strong>Prone</strong>
      </dt>
      <dd>
        <p>You're lying on the ground. Attacks against you from Close range have advantage; attacks from Far or Distant range have disadvantage. You have disadvantage on attacks. Standing up from prone costs your movement action for the turn.</p>
        <p class="term-reference">Defined in: <a href="#ch9-combat">Chapter 9: Combat System</a></p>
      </dd>

      <dt id="stunned">
        <strong>Stunned</strong>
      </dt>
      <dd>
        <p>You can't take actions or move. You automatically fail AGI and MIG checks. Attacks against you have advantage. Stunned is a severe condition that typically lasts until the end of your next turn.</p>
        <p class="term-reference">Defined in: <a href="#ch10-conditions">Chapter 10: Damage, Tags & Conditions</a></p>
      </dd>

      <!-- Add more common conditions -->
    </dl>
  </section>
```

**Step 2: Commit conditions glossary**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(glossary): add conditions to Ch 28"
```

---

### Task 14: Populate Tags Glossary Section

**Files:**
- Modify: `source/codex/book/core_rulebook.html`
- Read: `source/codex/GLOSSARY.md` (Tags section)

**Step 1: Add Tags section**

```html
  <section id="glossary-tags" class="glossary-section">
    <h2>Common Tags</h2>

    <dl class="glossary-terms">
      <dt id="area">
        <strong>Area</strong>
      </dt>
      <dd>
        <p>This attack or effect targets everyone in a defined zone (Close range burst, Far range cone, etc.). Allies and enemies alike are affected unless the description specifies otherwise. Area effects are powerful but indiscriminate.</p>
        <p class="term-reference">Defined in: <a href="#ch10-tags">Chapter 10: Damage, Tags & Conditions</a></p>
      </dd>

      <dt id="forceful">
        <strong>Forceful</strong>
      </dt>
      <dd>
        <p>On a hit, you can push the target one range band away from you (Close to Far, Far to Distant). The target must be roughly your size or smaller. This forced movement happens before any other effects resolve.</p>
        <p class="term-reference">Defined in: <a href="#ch10-tags">Chapter 10: Damage, Tags & Conditions</a></p>
      </dd>

      <dt id="messy">
        <strong>Messy</strong>
      </dt>
      <dd>
        <p>This weapon or attack is brutal, loud, and obvious. It leaves evidence (blood, property damage, noise). Great for intimidation; terrible for subtlety. Messy attacks draw attention.</p>
        <p class="term-reference">Defined in: <a href="#ch10-tags">Chapter 10: Damage, Tags & Conditions</a></p>
      </dd>

      <dt id="precise">
        <strong>Precise</strong>
      </dt>
      <dd>
        <p>You can target specific body parts, objects, or weak points. On a Full Success or better, you can inflict a specific condition (disarm, blind, etc.) instead of dealing damage. The GM determines what's possible based on the situation.</p>
        <p class="term-reference">Defined in: <a href="#ch10-tags">Chapter 10: Damage, Tags & Conditions</a></p>
      </dd>

      <!-- Add more common tags -->
    </dl>
  </section>
```

**Step 2: Commit tags glossary**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(glossary): add tags to Ch 28"
```

---

### Task 15: Create Chapter 29 Structure (Index)

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add Chapter 29 HTML structure after Chapter 28**

```html
<!-- ============================================================ -->
<!-- CHAPTER 29: INDEX                                            -->
<!-- ============================================================ -->

<section id="ch29-index" class="chapter">
  <header class="chapter-header">
    <h1 class="chapter-title">Chapter 29: Comprehensive Index</h1>
    <p class="chapter-subtitle">Quick reference and complete topical index</p>
  </header>

  <nav class="index-nav" aria-label="Index sections">
    <ul>
      <li><a href="#index-quick-reference">Quick Reference</a></li>
      <li><a href="#index-topical">Topical Index</a></li>
      <li><a href="#index-alphabetical">Alphabetical Index</a></li>
    </ul>
  </nav>

  <!-- Sections will be added in next tasks -->

</section>
```

**Step 2: Commit chapter structure**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(index): add Chapter 29 structure"
```

---

### Task 16: Create Quick Reference Section

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add Quick Reference section**

```html
  <section id="index-quick-reference" class="index-section quick-ref">
    <h2>Quick Reference</h2>
    <p class="section-intro">The most commonly referenced rules during play.</p>

    <div class="quick-ref-grid">
      <!-- DC Ladder -->
      <div class="quick-ref-card">
        <h3>DC Ladder</h3>
        <table class="dc-ladder-table">
          <thead>
            <tr>
              <th>Difficulty</th>
              <th>DC</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Routine</td>
              <td>12</td>
              <td>Basic tasks requiring minimal skill</td>
            </tr>
            <tr>
              <td>Challenging</td>
              <td>14</td>
              <td>Tasks requiring competence and focus</td>
            </tr>
            <tr>
              <td>Difficult</td>
              <td>16</td>
              <td>Tasks requiring expertise and effort</td>
            </tr>
            <tr>
              <td>Formidable</td>
              <td>18</td>
              <td>Tasks that test even skilled characters</td>
            </tr>
            <tr>
              <td>Heroic</td>
              <td>20</td>
              <td>Tasks at the edge of possibility</td>
            </tr>
            <tr>
              <td>Legendary</td>
              <td>22</td>
              <td>Tasks that define legends</td>
            </tr>
          </tbody>
        </table>
        <p class="ref-link">See <a href="#ch8-dc-ladder">Chapter 8: DC Ladder</a></p>
      </div>

      <!-- Outcome Tiers -->
      <div class="quick-ref-card">
        <h3>Outcome Tiers</h3>
        <table class="outcome-tiers-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Margin</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Critical Success</td>
              <td>≥ +5</td>
              <td>Exceptional success with bonus benefit</td>
            </tr>
            <tr>
              <td>Full Success</td>
              <td>0 to +4</td>
              <td>Complete success, achieve your goal</td>
            </tr>
            <tr>
              <td>Partial Success</td>
              <td>-1 to -2</td>
              <td>Success with complication or cost</td>
            </tr>
            <tr>
              <td>Failure</td>
              <td>-3 to -6</td>
              <td>You don't achieve your goal</td>
            </tr>
            <tr>
              <td>Critical Failure</td>
              <td>≤ -7</td>
              <td>Catastrophic failure with consequence</td>
            </tr>
          </tbody>
        </table>
        <p class="ref-link">See <a href="#ch8-outcome-tiers">Chapter 8: Outcome Tiers</a></p>
      </div>

      <!-- Advantage/Disadvantage -->
      <div class="quick-ref-card">
        <h3>Advantage & Disadvantage</h3>
        <dl>
          <dt>Advantage</dt>
          <dd>Roll 5d6, keep best 4 (+2-3 average increase)</dd>

          <dt>Disadvantage</dt>
          <dd>Roll 5d6, keep worst 4 (-2-3 average decrease)</dd>

          <dt>Stacking</dt>
          <dd>Never stacks. Multiple sources = one extra die rolled.</dd>
        </dl>
        <p class="ref-link">See <a href="#ch8-advantage">Chapter 8: Advantage</a></p>
      </div>

      <!-- Range Bands -->
      <div class="quick-ref-card">
        <h3>Range Bands</h3>
        <dl>
          <dt>Close</dt>
          <dd>Within arm's reach (~5 feet)</dd>

          <dt>Far</dt>
          <dd>Same room, shouting distance (~30 feet)</dd>

          <dt>Distant</dt>
          <dd>Down the street, need to yell (~100 feet)</dd>

          <dt>Remote</dt>
          <dd>Across the battlefield, barely visible (~300 feet)</dd>
        </dl>
        <p class="ref-link">See <a href="#ch9-range">Chapter 9: Range & Positioning</a></p>
      </div>
    </div>
  </section>
```

**Step 2: Commit quick reference**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(index): add quick reference section to Ch 29"
```

---

### Task 17: Create Topical Index Section

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add Topical Index section**

```html
  <section id="index-topical" class="index-section">
    <h2>Topical Index</h2>
    <p class="section-intro">Major topics grouped by category.</p>

    <div class="topical-index">
      <!-- Core Mechanics -->
      <div class="topic-group">
        <h3>Core Mechanics</h3>
        <ul>
          <li><a href="#ch8-4d6">4d6 Resolution</a> (Ch 8)</li>
          <li><a href="#advantage">Advantage & Disadvantage</a> (Ch 8, <a href="#glossary-core-mechanics">Glossary</a>)</li>
          <li><a href="#ch11-clocks">Clocks</a> (Ch 11)</li>
          <li><a href="#dc">Difficulty Class (DC)</a> (Ch 8, <a href="#glossary-core-mechanics">Glossary</a>)</li>
          <li><a href="#margin">Margin & Outcome Tiers</a> (Ch 8, <a href="#glossary-core-mechanics">Glossary</a>)</li>
          <li><a href="#proficiency">Proficiencies</a> (Ch 6, <a href="#glossary-core-mechanics">Glossary</a>)</li>
          <li><a href="#ch6-skills">Skills</a> (Ch 6)</li>
        </ul>
      </div>

      <!-- Character & Attributes -->
      <div class="topic-group">
        <h3>Character & Attributes</h3>
        <ul>
          <li><a href="#ch7-advancement">Advancement</a> (Ch 7)</li>
          <li><a href="#agility">Agility (AGI)</a> (Ch 5, <a href="#glossary-attributes">Glossary</a>)</li>
          <li><a href="#ch4-character-creation">Character Creation</a> (Ch 4)</li>
          <li><a href="#might">Might (MIG)</a> (Ch 5, <a href="#glossary-attributes">Glossary</a>)</li>
          <li><a href="#presence">Presence (PRE)</a> (Ch 5, <a href="#glossary-attributes">Glossary</a>)</li>
          <li><a href="#reason">Reason (RSN)</a> (Ch 5, <a href="#glossary-attributes">Glossary</a>)</li>
          <li><a href="#ch16-sample-characters">Sample Characters</a> (Ch 16)</li>
        </ul>
      </div>

      <!-- Combat & Conflict -->
      <div class="topic-group">
        <h3>Combat & Conflict</h3>
        <ul>
          <li><a href="#ch9-combat">Combat System</a> (Ch 9)</li>
          <li><a href="#glossary-conditions">Conditions</a> (<a href="#ch10-conditions">Ch 10</a>, Glossary)</li>
          <li><a href="#ch10-damage">Damage</a> (Ch 10)</li>
          <li><a href="#ch9-range">Range & Positioning</a> (Ch 9)</li>
          <li><a href="#ch12-social-conflict">Social Conflict</a> (Ch 12)</li>
          <li><a href="#glossary-tags">Tags</a> (<a href="#ch10-tags">Ch 10</a>, Glossary)</li>
        </ul>
      </div>

      <!-- GM Tools -->
      <div class="topic-group">
        <h3>GM Tools</h3>
        <ul>
          <li><a href="#ch19-campaign-structures">Campaign Structures</a> (Ch 19)</li>
          <li><a href="#ch21-fronts">Fronts & Threats</a> (Ch 21)</li>
          <li><a href="#ch23-npcs">NPCs & Creatures</a> (Ch 23)</li>
          <li><a href="#ch18-running">Running the Game</a> (Ch 18)</li>
          <li><a href="#ch22-scenarios">Scenarios</a> (Ch 22)</li>
          <li><a href="#ch20-session-zero">Session Zero</a> (Ch 20)</li>
          <li><a href="#ch24-worldbuilding">Worldbuilding</a> (Ch 24)</li>
        </ul>
      </div>

      <!-- Alternative Play -->
      <div class="topic-group">
        <h3>Alternative Play Modes</h3>
        <ul>
          <li><a href="#ch25-gmless">GMless Play</a> (Ch 25)</li>
          <li><a href="#ch25-rotating">Rotating Facilitator</a> (Ch 25)</li>
          <li><a href="#ch25-shared-authority">Shared Authority</a> (Ch 25)</li>
          <li><a href="#ch25-solo">Solo Play</a> (Ch 25)</li>
        </ul>
      </div>

      <!-- Reference Materials -->
      <div class="topic-group">
        <h3>Reference Materials</h3>
        <ul>
          <li><a href="#ch27-sheets">Character Sheets</a> (Ch 27)</li>
          <li><a href="#ch28-glossary">Glossary</a> (Ch 28)</li>
          <li><a href="#ch29-index">Index</a> (Ch 29)</li>
          <li><a href="#ch27-play-aids">Play Aids & Templates</a> (Ch 27)</li>
          <li><a href="#ch26-safety-tools">Safety Tools</a> (Ch 26)</li>
        </ul>
      </div>
    </div>
  </section>
```

**Step 2: Commit topical index**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(index): add topical index section to Ch 29"
```

---

### Task 18: Create Alphabetical Index Section

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add Alphabetical Index section**

```html
  <section id="index-alphabetical" class="index-section">
    <h2>Alphabetical Index</h2>
    <p class="section-intro">Complete A-Z listing of all terms and topics.</p>

    <div class="alphabetical-index">
      <div class="index-letter-group">
        <h3>A</h3>
        <dl>
          <dt>Advancement</dt>
          <dd><a href="#ch7-advancement">Ch 7</a></dd>

          <dt>Advantage</dt>
          <dd><a href="#ch8-advantage">Ch 8</a>, <a href="#advantage">Glossary</a></dd>

          <dt>Agility (AGI)</dt>
          <dd><a href="#ch5-attributes">Ch 5</a>, <a href="#agility">Glossary</a></dd>

          <dt>Area (Tag)</dt>
          <dd><a href="#ch10-tags">Ch 10</a>, <a href="#area">Glossary</a></dd>
        </dl>
      </div>

      <div class="index-letter-group">
        <h3>B</h3>
        <dl>
          <dt>Bleeding (Condition)</dt>
          <dd><a href="#ch10-conditions">Ch 10</a>, <a href="#bleeding">Glossary</a></dd>

          <dt>Burning (Condition)</dt>
          <dd><a href="#ch10-conditions">Ch 10</a>, <a href="#burning">Glossary</a></dd>
        </dl>
      </div>

      <div class="index-letter-group">
        <h3>C</h3>
        <dl>
          <dt>Campaign Structures</dt>
          <dd><a href="#ch19-campaign-structures">Ch 19</a></dd>

          <dt>Character Creation</dt>
          <dd><a href="#ch4-character-creation">Ch 4</a></dd>

          <dt>Character Sheets</dt>
          <dd><a href="#ch27-sheets">Ch 27</a></dd>

          <dt>Clocks</dt>
          <dd><a href="#ch11-clocks">Ch 11</a></dd>

          <dt>Combat System</dt>
          <dd><a href="#ch9-combat">Ch 9</a></dd>

          <dt>Conditions</dt>
          <dd><a href="#ch10-conditions">Ch 10</a>, <a href="#glossary-conditions">Glossary</a></dd>

          <dt>Critical Failure</dt>
          <dd><a href="#ch8-outcome-tiers">Ch 8</a></dd>

          <dt>Critical Success</dt>
          <dd><a href="#ch8-outcome-tiers">Ch 8</a></dd>
        </dl>
      </div>

      <div class="index-letter-group">
        <h3>D</h3>
        <dl>
          <dt>Damage</dt>
          <dd><a href="#ch10-damage">Ch 10</a></dd>

          <dt>Dazed (Condition)</dt>
          <dd><a href="#ch10-conditions">Ch 10</a>, <a href="#dazed">Glossary</a></dd>

          <dt>Difficulty Class (DC)</dt>
          <dd><a href="#ch8-dc-ladder">Ch 8</a>, <a href="#dc">Glossary</a></dd>

          <dt>Disadvantage</dt>
          <dd><a href="#ch8-advantage">Ch 8</a>, <a href="#disadvantage">Glossary</a></dd>
        </dl>
      </div>

      <!-- Continue with E-Z... -->
      <!-- This would be populated programmatically or manually with all terms -->

      <div class="index-letter-group">
        <h3>E-Z</h3>
        <p><em>Additional entries to be added during implementation...</em></p>
      </div>
    </div>
  </section>
```

**Step 2: Commit alphabetical index structure**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(index): add alphabetical index section to Ch 29"
```

---

### Task 19: Fix Broken Internal Links from Phase 1

**Files:**
- Modify: `source/codex/book/core_rulebook.html`
- Read: `docs/reviews/link-validation.txt`

**Step 1: Review broken links report**

Run: `cat docs/reviews/link-validation.txt`
Expected: List of broken internal links

**Step 2: For each broken link, add missing ID or fix href**

Example fixes:
- If `href="#advantage"` exists but no matching ID, add `id="advantage"` to the definition
- If `href="#ch8-advantage"` points to wrong section, update to correct ID
- If duplicate IDs exist, consolidate or rename

**Step 3: Re-run link validator to verify fixes**

Run: `./scripts/review/validate-links.sh source/codex/book/core_rulebook.html`
Expected: "✓ All internal links are valid"

**Step 4: Commit link fixes**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "fix(links): resolve all broken internal links from Phase 1 review"
```

---

### Task 20: Add Bidirectional Glossary Links

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add "See Glossary" links to term definitions in main content**

For each term defined in chapters that's also in the glossary, add a link:

Example in Chapter 8:

```html
<p>When you have <strong id="advantage-definition">advantage</strong>, roll 5d6 and keep the best 4.
<em>(See also: <a href="#advantage">Glossary: Advantage</a>)</em></p>
```

**Step 2: Verify glossary already links back to definitions**

Check that each glossary entry has:
```html
<p class="term-reference">Defined in: <a href="#ch8-core-resolution">Chapter 8: Core Resolution</a></p>
```

**Step 3: Test bidirectional links**

Manually click through several terms:
- From chapter to glossary
- From glossary back to chapter

**Step 4: Commit bidirectional links**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(glossary): add bidirectional links between chapters and glossary"
```

---

## Phase 3: TOC Enhancement

### Task 21: Add Sticky Navigation CSS

**Files:**
- Modify: `source/codex/book/core_rulebook.html` (add `<style>` in `<head>` or create separate CSS file)

**Step 1: Locate or create style section**

Find the `<head>` section and add or update the style block:

**Step 2: Add sticky navigation styles**

```css
/* ===== STICKY NAVIGATION ===== */

:root {
  --nav-height: 60px;
  --spacing-unit: 8px;
  --color-bg-nav: #ffffff;
  --color-border: #e0e0e0;
  --color-text-primary: #2c3e50;
  --color-accent: #3498db;
  --transition-speed: 0.3s;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.toc-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--color-bg-nav);
  border-bottom: 2px solid var(--color-border);
  padding: calc(var(--spacing-unit) * 2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow var(--transition-speed) ease;
}

.toc-nav.scrolled {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Ensure content doesn't hide under sticky nav */
main {
  scroll-margin-top: calc(var(--nav-height) + calc(var(--spacing-unit) * 2));
}

section[id] {
  scroll-margin-top: calc(var(--nav-height) + calc(var(--spacing-unit) * 2));
}
```

**Step 3: Apply .toc-nav class to TOC**

Find the table of contents `<nav>` element and add `class="toc-nav"`:

```html
<nav class="toc-nav" aria-label="Table of Contents">
  <!-- existing TOC content -->
</nav>
```

**Step 4: Test sticky navigation**

Open the HTML file in browser and scroll down. Verify:
- Nav sticks to top of viewport
- Shadow increases when scrolling
- Content doesn't hide under nav

**Step 5: Commit sticky nav CSS**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(toc): add sticky navigation CSS"
```

---

### Task 22: Add Back-to-Top Button

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add back-to-top button HTML**

Before closing `</body>` tag:

```html
<button
  id="back-to-top"
  class="back-to-top-btn"
  aria-label="Back to top"
  title="Back to top"
  hidden>
  ↑ Top
</button>
```

**Step 2: Add back-to-top CSS**

```css
/* ===== BACK TO TOP BUTTON ===== */

.back-to-top-btn {
  position: fixed;
  bottom: calc(var(--spacing-unit) * 3);
  right: calc(var(--spacing-unit) * 3);
  z-index: 999;

  /* Styling */
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  /* Transitions */
  opacity: 0;
  transform: translateY(100px);
  transition: opacity var(--transition-speed) ease,
              transform var(--transition-speed) ease;
}

.back-to-top-btn:not([hidden]) {
  opacity: 1;
  transform: translateY(0);
}

.back-to-top-btn:hover {
  background: #2980b9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.back-to-top-btn:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Hide on print */
@media print {
  .back-to-top-btn {
    display: none !important;
  }
}
```

**Step 3: Add back-to-top JavaScript**

Before closing `</body>` tag:

```html
<script>
(function() {
  const backToTopBtn = document.getElementById('back-to-top');
  const showThreshold = 300; // Show after scrolling 300px

  function toggleBackToTop() {
    if (window.scrollY > showThreshold) {
      backToTopBtn.hidden = false;
    } else {
      backToTopBtn.hidden = true;
    }
  }

  function scrollToTop(e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Show/hide on scroll
  window.addEventListener('scroll', toggleBackToTop, { passive: true });

  // Scroll to top on click
  backToTopBtn.addEventListener('click', scrollToTop);

  // Initial check
  toggleBackToTop();
})();
</script>
```

**Step 4: Test back-to-top button**

- Scroll down 300px → button appears
- Click button → smooth scroll to top
- Test keyboard navigation (Tab to focus, Enter to activate)

**Step 5: Commit back-to-top feature**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(toc): add back-to-top button with smooth scroll"
```

---

### Task 23: Add Scroll-Spy Current Section Highlighting

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add scroll-spy CSS**

```css
/* ===== SCROLL SPY ===== */

.toc-nav a {
  position: relative;
  color: var(--color-text-primary);
  text-decoration: none;
  padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
  border-radius: 4px;
  transition: background-color var(--transition-speed) ease;
}

.toc-nav a:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

.toc-nav a.active {
  background-color: rgba(52, 152, 219, 0.2);
  font-weight: bold;
  color: var(--color-accent);
}

.toc-nav a.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 70%;
  background: var(--color-accent);
  border-radius: 2px;
}
```

**Step 2: Add scroll-spy JavaScript**

```html
<script>
(function() {
  const sections = document.querySelectorAll('section[id^="ch"]');
  const navLinks = document.querySelectorAll('.toc-nav a[href^="#ch"]');

  function updateActiveSection() {
    const scrollPos = window.scrollY + 100; // Offset for sticky nav

    let currentSection = null;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
        currentSection = section.id;
      }
    });

    // Update nav links
    navLinks.forEach(link => {
      const href = link.getAttribute('href').substring(1); // Remove #

      if (href === currentSection) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Update on scroll
  window.addEventListener('scroll', updateActiveSection, { passive: true });

  // Initial check
  updateActiveSection();
})();
</script>
```

**Step 3: Test scroll-spy**

- Scroll through document
- Verify TOC highlights current chapter
- Check that highlighting updates smoothly

**Step 4: Commit scroll-spy feature**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(toc): add scroll-spy current section highlighting"
```

---

### Task 24: Add Keyboard Navigation Shortcuts

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add accesskey attributes to TOC links**

Update TOC structure:

```html
<nav class="toc-nav" aria-label="Table of Contents">
  <ul>
    <li><a href="#part1" accesskey="1">Part I: Core Rules</a></li>
    <li><a href="#part2" accesskey="2">Part II: Advanced Topics</a></li>
    <li><a href="#part3" accesskey="3">Part III: GM Section</a></li>
    <li><a href="#part4" accesskey="4">Part IV: Reference</a></li>
    <li><a href="#ch28-glossary" accesskey="g">Glossary</a></li>
    <li><a href="#ch29-index" accesskey="i">Index</a></li>
  </ul>
</nav>
```

**Step 2: Add keyboard shortcut documentation**

Find Chapter 3 (How to Use This Rulebook) and add section:

```html
<section id="ch3-keyboard-shortcuts">
  <h2>Keyboard Navigation Shortcuts</h2>

  <p>This rulebook supports keyboard shortcuts for quick navigation:</p>

  <table>
    <thead>
      <tr>
        <th>Shortcut</th>
        <th>Destination</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><kbd>Alt + 1</kbd> (Windows) / <kbd>Ctrl + Alt + 1</kbd> (Mac)</td>
        <td>Part I: Core Rules</td>
      </tr>
      <tr>
        <td><kbd>Alt + 2</kbd> (Windows) / <kbd>Ctrl + Alt + 2</kbd> (Mac)</td>
        <td>Part II: Advanced Topics</td>
      </tr>
      <tr>
        <td><kbd>Alt + 3</kbd> (Windows) / <kbd>Ctrl + Alt + 3</kbd> (Mac)</td>
        <td>Part III: GM Section</td>
      </tr>
      <tr>
        <td><kbd>Alt + 4</kbd> (Windows) / <kbd>Ctrl + Alt + 4</kbd> (Mac)</td>
        <td>Part IV: Reference</td>
      </tr>
      <tr>
        <td><kbd>Alt + G</kbd> (Windows) / <kbd>Ctrl + Alt + G</kbd> (Mac)</td>
        <td>Glossary</td>
      </tr>
      <tr>
        <td><kbd>Alt + I</kbd> (Windows) / <kbd>Ctrl + Alt + I</kbd> (Mac)</td>
        <td>Index</td>
      </tr>
    </tbody>
  </table>

  <p>Additionally, use <kbd>Tab</kbd> to navigate between links and <kbd>Enter</kbd> to follow them.</p>
</section>
```

**Step 3: Test keyboard shortcuts**

- Test Alt+1, Alt+2, etc. (Windows) or Ctrl+Alt+1, etc. (Mac)
- Verify navigation works
- Test Tab navigation through TOC

**Step 4: Commit keyboard navigation**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(toc): add keyboard navigation shortcuts with documentation"
```

---

### Task 25: Add Responsive Layout CSS

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add responsive breakpoints and mobile styles**

```css
/* ===== RESPONSIVE LAYOUT ===== */

/* Mobile (< 640px) */
@media (max-width: 639px) {
  .toc-nav {
    padding: var(--spacing-unit);
  }

  .toc-nav ul {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing-unit) / 2);
  }

  .toc-part {
    margin-bottom: calc(var(--spacing-unit) * 2);
  }

  .toc-part-title {
    font-size: 1.1rem;
    padding: var(--spacing-unit);
    background: rgba(52, 152, 219, 0.1);
    border-radius: 4px;
    cursor: pointer;
  }

  .toc-chapters {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--transition-speed) ease;
  }

  .toc-part.expanded .toc-chapters {
    max-height: 500px;
  }

  .back-to-top-btn {
    bottom: calc(var(--spacing-unit) * 2);
    right: calc(var(--spacing-unit) * 2);
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
}

/* Tablet (640px - 1024px) */
@media (min-width: 640px) and (max-width: 1023px) {
  .toc-nav ul {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-unit);
  }

  .toc-part {
    display: flex;
    flex-direction: column;
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
  .toc-nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--spacing-unit) * 2);
    justify-content: center;
  }

  .toc-part {
    display: flex;
    align-items: center;
    gap: var(--spacing-unit);
  }

  .toc-part-title {
    font-weight: bold;
    font-size: 1.2rem;
    color: var(--color-accent);
  }

  .toc-chapters {
    display: flex;
    gap: calc(var(--spacing-unit) / 2);
  }
}
```

**Step 2: Add mobile accordion JavaScript**

```html
<script>
(function() {
  // Mobile accordion for TOC (only on small screens)
  function initMobileAccordion() {
    if (window.innerWidth >= 640) return;

    const parts = document.querySelectorAll('.toc-part');

    parts.forEach(part => {
      const title = part.querySelector('.toc-part-title');

      if (title && !title.hasAttribute('data-accordion-init')) {
        title.setAttribute('data-accordion-init', 'true');
        title.setAttribute('role', 'button');
        title.setAttribute('aria-expanded', 'false');

        title.addEventListener('click', function() {
          const isExpanded = part.classList.toggle('expanded');
          this.setAttribute('aria-expanded', isExpanded);
        });
      }
    });
  }

  // Initialize on load and resize
  initMobileAccordion();
  window.addEventListener('resize', initMobileAccordion);
})();
</script>
```

**Step 3: Test responsive layouts**

Test at breakpoints:
- 320px (small mobile)
- 640px (tablet)
- 1024px (desktop)
- 1440px (large desktop)

Verify:
- Mobile: Accordion collapses/expands
- Tablet: Two-column grid
- Desktop: Horizontal flex layout

**Step 4: Commit responsive layout**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(toc): add responsive layout for mobile/tablet/desktop"
```

---

### Task 26: Add Print Stylesheet

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add print-specific CSS**

```css
/* ===== PRINT STYLES ===== */

@media print {
  /* Remove interactive elements */
  .back-to-top-btn,
  .toc-nav.sticky {
    display: none !important;
  }

  /* Reset nav to static */
  .toc-nav {
    position: static;
    box-shadow: none;
    border-bottom: 2px solid #000;
    page-break-after: always;
  }

  /* Expand all collapsed sections */
  .toc-chapters {
    max-height: none !important;
    overflow: visible !important;
  }

  /* Print-friendly TOC layout */
  .toc-nav ul {
    display: block;
  }

  .toc-part {
    margin-bottom: 1em;
    page-break-inside: avoid;
  }

  .toc-part-title {
    font-weight: bold;
    font-size: 1.2em;
    margin-bottom: 0.5em;
  }

  .toc-chapters {
    margin-left: 1em;
  }

  .toc-chapters a::after {
    content: " ......................... " attr(data-page);
    font-size: 0.9em;
  }

  /* Chapter breaks */
  .chapter {
    page-break-before: always;
  }

  .chapter:first-of-type {
    page-break-before: auto;
  }

  /* Prevent orphans and widows */
  p, li {
    orphans: 3;
    widows: 3;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  /* Print links with URLs */
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
  }

  /* Don't print internal link URLs */
  a[href^="#"]::after {
    content: "";
  }
}
```

**Step 2: Test print preview**

Open browser print preview:
- Verify back-to-top button hidden
- Check TOC appears as first page
- Ensure chapters start on new pages
- Test that all sections expanded

**Step 3: Commit print stylesheet**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(toc): add print-friendly stylesheet"
```

---

### Task 27: Add Accessibility Features (ARIA, Focus)

**Files:**
- Modify: `source/codex/book/core_rulebook.html`

**Step 1: Add ARIA landmarks and labels**

Update main structure:

```html
<body>
  <header role="banner">
    <h1>Razorweave Core Rulebook</h1>
  </header>

  <nav class="toc-nav" role="navigation" aria-label="Table of Contents">
    <!-- existing TOC -->
  </nav>

  <main role="main" id="main-content">
    <!-- chapters -->
  </main>

  <footer role="contentinfo">
    <!-- footer if exists -->
  </footer>
</body>
```

**Step 2: Add skip link for keyboard users**

After opening `<body>`:

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

CSS for skip link:

```css
/* ===== ACCESSIBILITY ===== */

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-accent);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
  z-index: 10000;
  transition: top var(--transition-speed) ease;
}

.skip-link:focus {
  top: 0;
  outline: 2px solid #fff;
  outline-offset: -2px;
}

/* Enhanced focus indicators */
a:focus,
button:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Focus visible polyfill for better UX */
a:focus:not(:focus-visible),
button:focus:not(:focus-visible) {
  outline: none;
}

a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Step 3: Add ARIA live region for scroll-spy updates**

```html
<div aria-live="polite" aria-atomic="true" class="sr-only" id="current-section-announce"></div>
```

Update scroll-spy JavaScript:

```javascript
// In updateActiveSection function, after updating nav links:
const announcer = document.getElementById('current-section-announce');
if (currentSection && announcer) {
  const sectionTitle = document.getElementById(currentSection)?.querySelector('h1, h2')?.textContent;
  if (sectionTitle) {
    announcer.textContent = `Now viewing: ${sectionTitle}`;
  }
}
```

**Step 4: Add screen-reader-only class**

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Step 5: Test accessibility**

- Test keyboard navigation (Tab, Shift+Tab, Enter, Space)
- Test skip link (Tab after page load, Enter to activate)
- Test with screen reader (macOS VoiceOver: Cmd+F5)
- Verify focus indicators visible

**Step 6: Commit accessibility features**

```bash
git add source/codex/book/core_rulebook.html
git commit -m "feat(a11y): add ARIA landmarks, skip link, and enhanced focus indicators"
```

---

### Task 28: Validate Color Contrast (WCAG AA)

**Files:**
- Read: `source/codex/book/core_rulebook.html`
- Create: `docs/reviews/accessibility-contrast-report.txt`

**Step 1: Review current color palette**

Document all color combinations used:
- Text on background
- Links on background
- Active/hover states
- Button colors

**Step 2: Test contrast ratios**

Use WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/) or browser DevTools:

Required ratios (WCAG AA):
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

**Step 3: Document findings**

Create report:

```
# Color Contrast Validation Report

**Date:** 2025-11-18
**Standard:** WCAG 2.1 Level AA

## Results

### Text Colors

- Primary text (#2c3e50) on white (#ffffff): [ratio] ✓/✗
- Accent text (#3498db) on white (#ffffff): [ratio] ✓/✗
- Link text (#3498db) on white (#ffffff): [ratio] ✓/✗

### Interactive Elements

- Active link (#2980b9) on light blue bg (rgba(52, 152, 219, 0.2)): [ratio] ✓/✗
- Back-to-top button white text on accent (#3498db): [ratio] ✓/✗

### Findings

- [List any failing combinations]
- [Recommended adjustments]

## Recommendations

[If any colors fail, suggest adjustments]
```

**Step 4: Adjust colors if needed**

If any combinations fail, update CSS variables:

```css
:root {
  --color-text-primary: #1a2332; /* Darker for better contrast */
  --color-accent: #2980b9; /* Adjusted if needed */
}
```

**Step 5: Save and commit report**

```bash
git add docs/reviews/accessibility-contrast-report.txt
git commit -m "docs(a11y): add color contrast validation report"
```

---

### Task 29: Final Validation and Testing

**Files:**
- Read: `source/codex/book/core_rulebook.html`
- Create: `docs/reviews/phase-3-testing-report.md`

**Step 1: Run all automated validators**

```bash
# Link validation
./scripts/review/validate-links.sh source/codex/book/core_rulebook.html

# Mechanics validation
./scripts/review/validate-mechanics.sh source/codex/book/core_rulebook.html
```

**Step 2: Browser compatibility testing**

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Verify:
- Sticky nav works
- Scroll-spy updates
- Back-to-top appears/hides
- Responsive layouts at all breakpoints
- JavaScript graceful degradation

**Step 3: Create testing report**

```markdown
# Phase 3 Testing Report

**Date:** 2025-11-18
**Tester:** Claude

## Browser Testing

### Chrome [version]
- ✓ Sticky navigation
- ✓ Scroll-spy highlighting
- ✓ Back-to-top button
- ✓ Keyboard shortcuts
- ✓ Responsive layouts (320px, 640px, 1024px, 1440px)

### Firefox [version]
- [Same checklist]

### Safari [version]
- [Same checklist]

## Accessibility Testing

- ✓ Keyboard navigation (Tab, Shift+Tab, Enter)
- ✓ Skip link functional
- ✓ ARIA landmarks present
- ✓ Screen reader announcements (VoiceOver)
- ✓ Focus indicators visible
- ✓ Color contrast passes WCAG AA

## Link Validation

- ✓ All internal links valid
- ✓ Glossary bidirectional links working
- ✓ Index links working

## Print Testing

- ✓ TOC renders on first page
- ✓ Chapters break to new pages
- ✓ Interactive elements hidden
- ✓ All sections expanded

## Known Issues

[List any issues discovered]

## Recommendations

[Any follow-up work needed]
```

**Step 4: Save testing report**

```bash
git add docs/reviews/phase-3-testing-report.md
git commit -m "docs(testing): add Phase 3 comprehensive testing report"
```

---

### Task 30: Final Commit and Cleanup

**Files:**
- Modify: `docs/plans/2025-11-18-core-rulebook-review-design.md`
- Read: All modified files

**Step 1: Review all changes**

Run: `git log --oneline --graph`
Expected: Clean commit history showing all phases

**Step 2: Update design document with completion notes**

Add at end of design document:

```markdown
## Implementation Complete

**Completion Date:** 2025-11-18

**Deliverables:**
- ✓ Phase 1 Findings Document: `docs/reviews/2025-11-18-core-rulebook-review-findings.md`
- ✓ Phase 2 Glossary: Chapter 28 integrated into `core_rulebook.html`
- ✓ Phase 2 Index: Chapter 29 integrated into `core_rulebook.html`
- ✓ Phase 3 TOC Enhancements: Responsive, accessible navigation
- ✓ All broken links fixed
- ✓ Validation scripts: `scripts/review/`
- ✓ Testing reports: `docs/reviews/`

**Success Criteria Met:**
- ✓ Comprehensive findings document with prioritized issues
- ✓ Chapters 28-29 complete with bidirectional links
- ✓ TOC responsive and accessible (WCAG AA)
- ✓ All automated validations passing
- ✓ Cross-browser tested

**Commit Count:** [X] commits across 3 phases
```

**Step 3: Commit design completion notes**

```bash
git add docs/plans/2025-11-18-core-rulebook-review-design.md
git commit -m "docs(design): mark implementation complete"
```

**Step 4: Final status check**

```bash
git status
git log --oneline | wc -l
git diff main --stat
```

Expected: Clean working directory, ~30 commits, significant additions to core_rulebook.html

---

## Execution Notes

**Phase Dependencies:**
- Phase 2 depends on Phase 1 findings (broken links must be identified before fixing)
- Phase 3 can begin after Phase 2 structural changes complete

**Commit Strategy:**
- Commit after each task (frequent commits)
- Each commit message follows conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Each phase ends with a summary commit

**Testing Strategy:**
- Automated validation runs after each relevant task
- Manual testing after major features (sticky nav, scroll-spy)
- Comprehensive testing at end of Phase 3

**Review Checkpoints:**
- End of Phase 1: Review findings document for completeness
- End of Phase 2: Verify all links working, glossary/index complete
- End of Phase 3: Full accessibility and cross-browser test

---

## Required Skills

- @superpowers:verification-before-completion - Must verify all validations pass before claiming completion
- @superpowers:test-driven-development - Write validator scripts before running manual reviews
- @superpowers:systematic-debugging - If links break during Phase 2, use systematic approach to identify cause

---

## Success Criteria

**Phase 1 Complete:**
- ✓ `docs/reviews/2025-11-18-core-rulebook-review-findings.md` exists with all chapters reviewed
- ✓ Validation scripts in `scripts/review/` functional
- ✓ Issues categorized by severity

**Phase 2 Complete:**
- ✓ Chapter 28 (Glossary) contains all major game terms
- ✓ Chapter 29 (Index) has Quick Reference, Topical, and Alphabetical sections
- ✓ `./scripts/review/validate-links.sh` reports zero broken links

**Phase 3 Complete:**
- ✓ Sticky navigation works at all screen sizes
- ✓ Scroll-spy highlights current section
- ✓ Back-to-top button appears after 300px scroll
- ✓ Keyboard shortcuts documented and functional
- ✓ Responsive layouts tested at 320px, 640px, 1024px, 1440px
- ✓ Print preview shows clean TOC page
- ✓ WCAG AA color contrast validated
- ✓ Testing report documents all validations passing

**Overall Success:**
- ✓ All automated validations passing
- ✓ Cross-browser compatibility verified
- ✓ Accessibility validated (keyboard nav, screen reader, ARIA)
- ✓ Clean commit history (~30 commits across 3 phases)
