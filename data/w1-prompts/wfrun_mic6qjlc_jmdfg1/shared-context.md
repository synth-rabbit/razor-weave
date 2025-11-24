# W1 Writer Shared Context

## Workflow Run
- Run ID: wfrun_mic6qjlc_jmdfg1
- Book: Razorweave Core Rulebook (core-rulebook)
- Chapters to modify: 4

## Improvement Plan Summary
Address mechanical clarity gaps in core rules chapters (Actions, Character Creation, Combat) by adding concrete DC ranges, procedural breakdowns, and Clock advancement rates to improve Persona Fit and Usability scores.

### Target Issues
| ID | Severity | Description |
|----|----------|-------------|
| issue-001 | high | DC guidelines lack concrete number ranges; Partial Success outcomes leave too much to GM interpretation; Strike outcomes lack specific mechanical definitions |
| issue-002 | high | Character creation optimization pathways unclear; attribute allocation guidance sparse; creation flow requires cross-referencing other chapters |
| issue-003 | high | Action economy described conceptually rather than procedurally; Resolve Clock advancement rates undefined; insufficient tactical depth |
| issue-004 | medium | Clock advancement triggers described narratively without mechanical specifics; Tag mechanical effects on Checks inconsistent; Condition effects need quick reference |

### Constraints
- Max chapters: 5
- Preserve structure: yes
- Word count target: maintain current

## Style Guides

### Content Style Guide
# Content Style Guide

This guide defines the voice, tone, and structural conventions for all Razorweave content. Writers and editors should reference this document to ensure consistency across all chapters, supplements, and reference materials.

---

## Voice and Tone

### Second Person, Direct Address

Address the reader directly using "you" and "your." This creates an instructive, conversational tone that invites participation.

**Do:**
- "You roll when the GM calls for a Check."
- "Your character begins with a small set of equipment."
- "When you declare an action, you state two things."

**Avoid:**
- "Players roll when the GM calls for a Check."
- "Characters begin with a small set of equipment."
- "When declaring an action, state two things."

### Instructive but Not Prescriptive

Explain how the system works while leaving room for table interpretation. Present mechanics as tools, not mandates.

**Do:**
- "The GM can use conversational order, popcorn order, or initiative rolls depending on the scene."
- "You can expand or revise identity elements later if the story reveals new truths."

**Avoid:**
- "You must use popcorn order for all combat scenes."
- "Never change identity elements after character creation."

### Fiction-First Emphasis

Always ground mechanical explanations in narrative context. Lead with what happens in the story, then explain how the system supports it.

**Do:**
- "Combat starts when violence breaks out and the moment-to-moment sequence of actions matters."
- "A Check only occurs when the outcome is meaningfully uncertain, the stakes matter to the story, and failure would move the scene forward."

**Avoid:**
- "Roll initiative at the start of combat."
- "Make a Check whenever attempting a difficult action."

---

## Terminology Consistency

Use these terms consistently throughout all content:

| Use This | Not This | Notes |
|----------|----------|-------|
| GM | DM, Referee, Narrator | Game Master is the standard term |
| PC | Hero, Player, Adventurer | Player Character when referring to the character sheet entity |
| Check | Roll, Test, Attempt | The resolution mechanic is always called a Check |
| DC | TN, Target, Difficulty | Difficulty Class is the target number |
| VPC | Major NPC, Boss | Vital Player Character for significant non-player characters |
| Edge | Advantage, Bonus dice | The favorable circumstance modifier |
| Burden | Disadvantage, Penalty dice | The unfavorable circumstance modifier |
| Tag | Marker, Label, Status | Descriptors for environments and situations |
| Condition | Status effect, Debuff | Persistent character states |
| Clock | Progress track, Timer | Segmented trackers for goals and threats |
| Attribute | Stat, Ability score | The four core capabilities (MIG, AGI, PRE, RSN) |
| Skill | Ability, Talent | Action-based competencies |
| Proficiency | Expertise, Specialty | Domain knowledge and tool familiarity |

---

## Section Structure

### Standard Chapter Flow

Chapters should follow this general structure:

1. **Opening Hook** - A brief paragraph establishing what this chapter covers and why it matters to play
2. **Core Concept** - Clear explanation of the central idea or mechanic
3. **How It Works** - Step-by-step procedural guidance
4. **Examples** - Concrete illustrations using blockquote callouts
5. **GM Guidance** - Tips for running the content at the table (where applicable)
6. **Chapter Summary** - Brief recap of key points (for longer chapters)

### Section Openers

Begin major sections with a grounding statement that connects to the reader's experience or the broader system.

**Good opener:**
> "Tags, Conditions, and Clocks are the tools the game uses to make the world feel solid and responsive."

**Weak opener:**
> "This section describes Tags."

### Transitions Between Sections

Use transitional sentences to connect sections and maintain reading flow.

**Example:**
> "The principles in this chapter describe how the table works together. The next chapter expands on these principles by showing how different modes of play shape the experience of the system."

---

## Tone Guidelines

### Active Voice

Prefer active constructions that clearly identify who performs the action.

**Do:**
- "The GM sets a Difficulty Class to represent how hard the task is."
- "Players describe what their characters attempt."

**Avoid:**
- "A Difficulty Class is set to represent task difficulty."
- "What characters attempt is described by players."

### Concise Sentences

Keep sentences focused on a single idea. Break complex explanations into multiple sentences.

**Do:**
> "Checks should move the story forward, not stall it. When in doubt, use partial successes to trade progress for cost rather than stopping action."

**Avoid:**
> "Checks should move the story forward rather than stalling it, which means that when in doubt you should use partial successes to trade progress for cost because this keeps the action moving."

### Concrete Over Abstract

Use specific examples rather than abstract descriptions when explaining concepts.

**Do:**
> "A concept like 'retired scout with a guilty conscience' offers a clearer direction than simply 'fighter.'"

**Avoid:**
> "More specific concepts provide better direction than generic ones."

### Accessible Vocabulary

Write for readers who may be new to tabletop RPGs. Avoid jargon without explanation. Define terms on first use.

---

## Using Examples

### Example Blockquotes

Use blockquote callouts for examples. Format with a bold label followed by the example content.

```markdown
> **Example**
> A character wants to leap between rooftops during a chase in heavy rain. The gap is significant, the conditions are poor, and falling would be dangerous. The outcome is uncertain, the stakes are serious, and the character's choices matter. The GM calls for a Check.
```

### Example Types

- **Narrative examples** - Short fiction snippets showing the mechanic in play
- **Cross-genre examples** - Demonstrate how the same mechanic works across different settings
- **Counter-examples** - Show what does not trigger a rule or mechanic

### Example Labels

Use descriptive labels when an example illustrates a specific concept:

- `> **Example - When to Roll**`
- `> **Example - Intent and Approach**`
- `> **Example - Cross-Genre Check**`

---

## Writing Conventions

### Numbers

- Spell out numbers one through nine in prose: "choose three items," "roll four dice"
- Use numerals for 10 and above: "a 12-segment Clock," "DC 16"
- Always use numerals for game mechanics: "4d6," "DC 14," "+2 Edge"
- Use numerals in tables and stat blocks

### Lists

Use **numbered lists** for sequential procedures:
> 1. The player declares intent and approach.
> 2. The GM decides whether a Check is needed.
> 3. The GM sets DC and notes modifiers.

Use **bulleted lists** for non-sequential items:
> - Environmental Tags
> - Situational Tags
> - Atmospheric Tags

### Emphasis

- Use **bold** for game terms on first significant use in a section
- Use **bold** for defined terms in explanatory text
- Use *italics* for Tag and Condition names: *Dim Light*, *Exhausted*, *Bleeding*
- Use *italics* for emphasis within sentences (sparingly)
- Avoid ALL CAPS for emphasis

### Contractions

Use contractions sparingly. They are acceptable in conversational passages but should be avoided in formal rule explanations.

**Acceptable:**
> "You don't need to memorize the entire book before you play."

**Preferred in rules text:**
> "You do not need to optimize your Skills."

---

## Callout Types

Use blockquote callouts consistently:

### Example Callout
```markdown
> **Example**
> [Example content here]
```

### GM Guidance Callout
```markdown
> **GM Guidance**
> [Advice for running the game]
```

### Note Callout
```markdown
> **Note**
> [Important clarification or reminder]
```

### Warning Callout
```markdown
> **Warning**
> [Caution about common mistakes or edge cases]
```

---

## Chapter Summary Pattern

End longer chapters with a summary section that:
1. Recaps the main concepts covered
2. Connects to upcoming content
3. Reinforces the fiction-first philosophy

**Example:**
> "Character Creation turns an idea into a playable character who fits naturally into the world and the campaign. By moving from concept to identity, Attributes, Skills, Proficiencies, gear, background, relationships, and goals, you build a character who feels grounded and ready for play. Later chapters explain how these elements interact with the core mechanics during sessions."


### Mechanics Style Guide
# Mechanics Style Guide

This guide defines formatting standards for game mechanics, dice notation, rules text patterns, and mechanical terminology. Use this guide to ensure all mechanical content is consistent, clear, and correctly formatted.

---

## Game Term Formatting

### Term Formatting Table

| Term Type | Format | Examples |
|-----------|--------|----------|
| Dice notation | Plain text, no spaces | 4d6, 2d6+3, 1d8-1 |
| Difficulty Class | DC + space + number | DC 12, DC 16, DC 20 |
| Attributes | Bold on first use, then plain | **Might (MIG)**, then MIG or Might |
| Attribute abbreviations | ALL CAPS | MIG, AGI, PRE, RSN |
| Tags | Italic | *Dim Light*, *Cramped*, *Elevated* |
| Conditions | Italic | *Exhausted*, *Bleeding*, *Frightened* |
| Skills | Plain text, capitalized | Stealth, Observation, Technical Work |
| Proficiencies | Plain text, capitalized | Telegraph Instruments, Precision Tools |
| Edge/Burden | Bold when defined, plain after | **Edge**, **Burden**, then Edge, Burden |
| Clock names | Quoted, Title Case | "Evacuation Complete" Clock |
| Clock segments | Numeral + hyphen + segment | 6-segment Clock, 4-segment Clock |
| Outcome tiers | Bold | **Full Success**, **Partial Success** |
| Actions | Bold | **Strike**, **Maneuver**, **Set Up** |

### Inline Mechanical References

When referencing mechanics inline:

**Do:**
- "Make a Check against DC 14."
- "Roll 4d6 and add your Agility."
- "The *Exhausted* Condition imposes Burden."
- "A 6-segment Clock tracks progress."

**Avoid:**
- "Make a check against difficulty 14."
- "Roll four six-sided dice and add agility."
- "The Exhausted condition imposes burden."
- "A six segment clock tracks progress."

---

## Dice Notation Standards

### Basic Notation

| Format | Meaning | Example |
|--------|---------|---------|
| NdX | Roll N dice with X sides | 4d6 = roll 4 six-sided dice |
| NdX+M | Roll NdX, add M to total | 2d6+3 = roll 2d6, add 3 |
| NdX-M | Roll NdX, subtract M from total | 1d8-1 = roll 1d8, subtract 1 |

### Edge and Burden Notation

| Modifier | Notation | Description |
|----------|----------|-------------|
| +1 Edge | Roll 5d6, keep best 4 | Add one die, drop lowest |
| +2 Edge | Roll 6d6, keep best 4 | Add two dice, drop two lowest |
| -1 Burden | Roll 5d6, keep worst 4 | Add one die, drop highest |
| -2 Burden | Roll 6d6, keep worst 4 | Add two dice, drop two highest |

### Writing About Dice

When explaining dice mechanics in prose:

**Do:**
> "Roll **4d6**, apply modifiers, and compare the total to the DC."

> "With +1 Edge, roll 5d6 and keep the best 4 dice."

**Avoid:**
> "Roll four six-sided dice."

> "With advantage, roll an extra die and drop the lowest."

### Dice in Examples

In examples, show the full mechanical sequence:

> **Example - Calculating Margin**
> The DC is 16. You roll 4d6 and get 3, 4, 5, 6 for a total of 18.
> Your Attribute adds +2, bringing your result to 20.
> Margin = 20 - 16 = +4, which is a **Full Success**.

---

## Difficulty Class Standards

### Standard DC Ladder

Always use this ladder consistently:

| DC | Difficulty Level | When to Use |
|----|------------------|-------------|
| 12 | Easy | Favorable conditions, strong positioning |
| 14 | Routine | Standard conditions, typical challenges |
| 16 | Tough | Unfavorable conditions, skilled opposition |
| 18 | Hard | Hostile conditions, significant obstacles |
| 20 | Heroic | Extreme conditions, exceptional challenges |
| 22 | Legendary | Near-impossible, setting-defining moments |

### DC in Prose

Reference DCs naturally:

**Do:**
> "The GM sets a DC of 16 for the tough climb."
> "Against DC 14, this is a Routine task."

**Avoid:**
> "The GM sets difficulty at sixteen."
> "This is difficulty class 14."

### When to Specify DC

- Always specify DC when showing example Checks
- Specify DC ranges when discussing task categories
- Use descriptive terms (Easy, Routine, Tough) alongside numbers

---

## Rules Text Patterns

### Check Format

When describing a Check in rules text, use this pattern:

```
[Situation] → [Attribute]-based Check → [DC/difficulty] → [Outcome interpretation]
```

**Example:**
> When a character attempts to calm a frightened NPC, the GM calls for a PRE-based Check. Against DC 14, a **Full Success** calms the NPC completely. A **Partial Success** calms them but creates an obligation. **Failure** spreads the panic further.

### Outcome Format

Present outcome tiers in a consistent order:

1. **Critical Success** (margin +5 or more)
2. **Full Success** (margin 0 to +4)
3. **Partial Success** (margin -1 to -2)
4. **Failure** (margin -3 to -6)
5. **Critical Failure** (margin -7 or worse, or all 1s)

When space is limited, you may omit Critical tiers and focus on Full/Partial/Failure.

### Tag Application Pattern

When describing how Tags apply:

```
[Tag name] + [mechanical effect] + [fictional context]
```

**Example:**
> *Dim Light* imposes Burden on actions requiring clear sight but grants Edge on Stealth attempts. Characters can use light sources to remove this Tag from their immediate area.

### Condition Application Pattern

When describing how Conditions work:

```
[Condition name] + [source] + [effect] + [clearing method]
```

**Example:**
> **Exhausted** - Acquired through overexertion or sustained hardship. Imposes Burden on demanding physical actions. Clears after meaningful rest or appropriate aid.

---

## Clock Mechanics Documentation

### Clock Sizes

Use standard clock sizes:

| Segments | Use Case |
|----------|----------|
| 4-segment | Quick threats, minor goals, time pressure |
| 6-segment | Standard projects, moderate obstacles |
| 8-segment | Major endeavors, significant threats |

### Clock Notation

Write clock references consistently:

**Do:**
- "Create a 6-segment 'Investigation' Clock."
- "The 'Flood Waters Rise' Clock has 4 segments."
- "Tick the Clock forward by 2 segments."

**Avoid:**
- "Create a six segment investigation clock."
- "The flood waters rise clock has four segments."
- "Advance the clock two segments."

### Clock Advancement

Document clock advancement clearly:

| Result | Clock Effect |
|--------|--------------|
| **Critical Success** | Tick 2-3 segments |
| **Full Success** | Tick 1-2 segments |
| **Partial Success** | Tick 1 segment, plus complication |
| **Failure** | No progress, may tick threat Clock |

### Opposing Clocks

When documenting racing clocks:

> **Example - Opposing Clocks**
> The group investigates a corrupt official while the official works to cover their tracks.
> - "Expose the Official" - 6-segment Clock (investigation progress)
> - "Cover-Up" - 4-segment Clock (enemy countermeasures)
>
> Successful investigation Checks advance the first Clock. Failures, loud approaches, or conspicuous actions advance the second. Which Clock fills first determines the outcome.

---

## Example Patterns

### Combat Example Pattern

```markdown
> **Example - [Combat Concept]**
> [Scene setup with relevant Tags]
> [Character action and intent]
> [Check details: Attribute, DC, modifiers]
> [Outcome and fictional result]
> [Clock or Condition changes if applicable]
```

**Full Example:**
> **Example - Strike Action**
> In a rooftop fight marked *Elevated* with *Fragile Cover*, Kira attempts to disarm her opponent with a quick strike to their weapon arm.
>
> The GM calls for an AGI-based Check against DC 16. Kira has +1 Edge from flanking established by an ally's Set Up.
>
> She rolls 5d6 (keeping best 4): 2, 3, 5, 5, 6. Keeping 3, 5, 5, 6 = 19. With AGI +1, her total is 20. Margin = +4, a **Full Success**.
>
> The opponent's weapon clatters across the rooftop. The GM ticks 2 segments on their Resolve Clock and applies the *Disarmed* Tag.

### Skill Check Example Pattern

```markdown
> **Example - [Skill Check Type]**
> *Trigger:* [What prompts the Check]
> *Assessment:* [Why a Check is appropriate]
> *Roll:* [Mechanical details]
> *Consequence:* [Outcome by tier]
```

**Full Example:**
> **Example - Social Influence**
> *Trigger:* A character wants to convince the factory foreman to delay shipment of suspicious crates.
>
> *Assessment:* The outcome is uncertain (the foreman has orders), consequential (the shipment contains evidence), and within the character's influence (they have documentation of safety violations).
>
> *Roll:* PRE-based Check against DC 14 (Routine social situation) with potential Edge from the documentation.
>
> *Consequence:* **Full Success** - the foreman agrees and becomes a potential ally. **Partial Success** - the foreman delays but demands a personal favor in return. **Failure** - the foreman refuses and reports the inquiry to management.

---

## Consistency Rules

### Define Before Use

Always define game terms before using them in complex explanations:

**Do:**
> **Edge** grants favorable dice. When you have Edge, roll additional dice and keep the best results. With +1 Edge, roll 5d6 and keep the best 4.

**Avoid:**
> Roll with Edge to improve your chances. Edge means rolling extra dice.

### DC Range Consistency

Always use the standard DC values. Do not invent intermediate values:

**Do:** DC 12, DC 14, DC 16, DC 18, DC 20, DC 22

**Avoid:** DC 13, DC 15, DC 17, DC 19

### Clock Size Consistency

Use standard clock sizes. Do not use non-standard segments:

**Do:** 4-segment, 6-segment, 8-segment

**Avoid:** 3-segment, 5-segment, 7-segment, 10-segment

### Attribute Reference Consistency

When referencing Attributes:

- First mention: **Might (MIG)**, **Agility (AGI)**, **Presence (PRE)**, **Reason (RSN)**
- Subsequent mentions: Use either full name or abbreviation consistently within a section
- In mechanical notation: Use abbreviations (MIG-based Check, PRE roll)

### Tag and Condition Consistency

- Always italicize Tag and Condition names
- Use Title Case: *Dim Light*, *Fragile Cover*, *Exhausted*
- Be consistent with Tag naming: *Elevated* not *High Ground* (unless both are defined)

---

## Quick Reference Summary

### Number Formatting

| Context | Format |
|---------|--------|
| Dice | 4d6, 2d6+3 |
| DC | DC 12, DC 16 |
| Margin | +4, -2 |
| Clock segments | 6-segment |
| Edge/Burden | +1 Edge, -2 Burden |

### Text Formatting

| Element | Format |
|---------|--------|
| Tags | *Italic* |
| Conditions | *Italic* |
| Attributes (first use) | **Bold** |
| Actions | **Bold** |
| Outcome tiers | **Bold** |
| Skills | Plain, Capitalized |
| Proficiencies | Plain, Capitalized |

### Standard Values

| Category | Values |
|----------|--------|
| DCs | 12, 14, 16, 18, 20, 22 |
| Clock sizes | 4, 6, 8 segments |
| Edge/Burden cap | +/-2 |
| Margin tiers | +5 crit, 0+ full, -1/-2 partial, -3 fail, -7 crit fail |


## Cross-Chapter Consistency Notes
- Use consistent terminology (see style guide tables)
- Example characters referenced across chapters should match
- Quick-reference table formatting should be uniform
