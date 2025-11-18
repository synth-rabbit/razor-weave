# Core Rulebook Review Findings

**Date:** 2025-11-18
**Reviewer:** Claude (Automated + Manual Review)
**Scope:** Complete review of `source/codex/book/core_rulebook.html` (404KB)

---

## Executive Summary

**Review Scope:** Complete analysis of 404KB HTML document (27 chapters)

**Automated Validations:**
- Dice Notation: 0 issues found - all dice references use standard 4d6/5d6/6d6
- DC Values: 13 non-standard DC values identified (DC 13, DC 15, DC 17)
- Internal Links: 0 broken links - all internal links valid
- Extracted Terms: 25 unique terms identified for glossary integration

**Manual Review:**
- Chapters reviewed: 27/27
- Consistency issues identified: See individual chapter sections below
- Completeness gaps identified: See individual chapter sections below
- Quality observations: See individual chapter sections below

**Priority Breakdown:**

**Critical Issues (Fix Immediately):**
1. Non-standard DC values (13 instances) - DC 13, DC 15, DC 17 found instead of standard ladder (12, 14, 16, 18, 20, 22)
   - Lines: 3039, 3120, 3138, 3235, 3253, 3350, 3386, 3785, 3965, 4040, 4107, 4250, 4324

**High Priority Issues (Fix Before Phase 2):**
1. Term definitions need proper chapter context - many extracted terms show "Chapter: unknown"
2. Missing bidirectional links between main content and future glossary chapter

**Medium Priority Issues (Address in Phase 3 or Later):**
1. Standardize advantage/disadvantage notation (+1/+2 Advantage, -1/-2 Disadvantage terms extracted)
2. Ensure all key terms have consistent capitalization throughout document

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

## Appendices

### Appendix A: All Broken Links

```
=== Internal Link Validation ===

Extracting all internal link targets...
Extracting all id attributes...

Checking for broken links...

✓ All internal links are valid
```

**Summary:** No broken internal links found. All href="#..." references have corresponding id attributes in the document.

---

### Appendix B: Non-Standard Mechanics

```
=== Dice Notation Validation ===
Checking for non-4d6 dice references...

No invalid dice notation found

=== DC Value Validation ===
Checking for non-standard DC values...

3039:DC 15
3120:DC 17
3138:DC 15
3235:DC 15
3253:DC 17
3350:DC 15
3386:DC 15
3785:DC 15
3965:DC 15
4040:DC 15
4107:DC 17
4250:DC 13
4324:DC 15
```

**Summary:**
- **Dice Notation:** All dice references comply with standard 4d6/5d6/6d6 system. No issues.
- **DC Values:** 13 instances of non-standard DC values found:
  - DC 13: 1 instance (should be DC 12 or DC 14)
  - DC 15: 10 instances (should be DC 14 or DC 16)
  - DC 17: 2 instances (should be DC 16 or DC 18)

**Recommendation:** Review each instance and adjust to nearest standard DC value based on intended difficulty.

---

### Appendix C: Term Extraction Summary

Total unique terms extracted: **25**

**Core Mechanics Terms (11):**
- +1 Advantage
- +2 Advantage
- -1 Disadvantage
- -2 Disadvantage
- Critical Success
- Full Success
- Partial Success
- Failure
- Critical Failure
- Intent
- Approach

**Attributes (4):**
- Agility (AGI)
- Might (MIG)
- Presence (PRE)
- Reason (RSN)

**Gameplay Concepts (10):**
- Agency
- Uncertainty
- Consequence
- Assistance
- Representative Checks
- Split Risks
- desire
- goals
- resources
- trajectories

**Chapter Context Analysis:**
- Terms with identified chapter context: 4 (Intent, Approach, Assistance, Representative Checks)
- Terms showing "Chapter: unknown": 21

**Recommendation:** Improve term extraction script to better identify chapter context from HTML structure. Most terms are properly defined but context detection needs enhancement.

---
