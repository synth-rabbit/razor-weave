# GPT Instructions Redesign

**Date:** 2025-11-26
**Status:** Complete
**File:** `docs/gpt/INSTRUCTIONS.md`

---

## Problem

The original GPT instructions produced mechanically correct but immersion-breaking output during play. Verbose procedural blocks like:

```
RESOLUTION PROCEDURE
1. Confirm Intent & Approach
Intent: Kai wants to understand what's wrong here...
2. Assess Edge / Burden (from Tags & fiction)
Tags active:
Dim Light → Burden on spotting details
...
```

Read like a rulebook, not a story. Character creation worked well; gameplay did not.

---

## Design Goals

1. **Narrative immersion** — Fiction stays in focus; mechanics stay compact
2. **Player freedom** — Custom skills, proficiencies, gear allowed
3. **VPCs as party members** — Not sidekicks; they act, have opinions, roll transparently
4. **Replayability** — Same setting + different character = different story
5. **Fit within 8k character limit** — Instructions must be concise

---

## Key Changes

### Setup Flow
- Ask "Create Character or Choose Setting?" first
- Ask "Roll yourself or GPT rolls?"
- Player input into VPC creation (roles, personalities)

### Character Creation
- Emphasize player can create custom skills, proficiencies, gear
- GPT advises but player creativity wins

### Story Generation
- Build from character goals, relationships, personal threads
- Filter through setting's tone/themes/locations/factions
- Settings doc "Potential Adventures" are inspiration, not scripts
- Fallback hook question only if player skipped detailed goals

### Scene Format
Narrative with stakes woven in → Tags inline → Clocks

### Resolution Format
**Pre-roll:** Narrative → `Tags: X (+), Y (−) = Net` → `Roll: 4d6+N vs DC` → Clocks

**Post-roll:** `Outcome (+N) → effect` → Narrative → Updated clocks

### VPC Behavior
- Have opinions, discuss plans
- Take actions, might disagree
- Transparent rolls in same format as player

### Combat
- Same compact format as non-combat
- One action per roll
- No verbose procedure blocks
- Establish "taken out" meaning before first blow

---

## Format Examples

### Scene Opening
```
*The sun has slipped behind the skyline, leaving Lantern Street Market
washed in gray-blue light. Something is wrong with the geometry tonight;
one row of stalls seems longer than it should be. If you linger without
finding Old Marn's trail, whatever warped this place might notice you first.*

`Tags: Dim Light, Uneasy Silence, Skewed Geometry`
`[██░░░░] Investigation 2/6 | [█░░░░░░░] Instability 1/8`

*What does Kai do?*
```

### Pre-Roll
```
*The distorted stalls play tricks on your eyes, but that same wrongness
makes anomalies easier to spot. The dim light works against you.*

`Tags: Dim Light (−), Skewed Geometry (+) = Even`
`Roll: 4d6+3 (RSN + Observation) vs DC 14`
`[██░░░░] Investigation 2/6 | [█░░░░░░░] Instability 1/8`
```

### Post-Roll
```
`Full Success (+5) → +2 Investigation`

*Kai's eyes adjust to the wrongness. There—a stall that wasn't there
yesterday, its awning marked with a symbol from Old Marn's stories.*

`[████░░] Investigation 4/6 | [█░░░░░░░] Instability 1/8`
```

---

## Validation

- [x] Goals are part of v1.4.0 rules (Chapter 6, Step 8)
- [x] Stakes declaration is in rules for combat "taken out" meaning
- [x] Format keeps mechanics visible but compact
- [x] Instructions fit within 8k limit (~4k characters)
- [x] Settings doc reviewed — "Potential Adventures" flagged as inspiration not scripts

---

## Implementation

Updated `docs/gpt/INSTRUCTIONS.md` with all changes.

GPT conversation starter should be configured to:
> "Would you like to **Create a Character** or **Choose a Setting** first?"
