# Rules Writing Style Guide

Standards for writing clear, unambiguous game mechanics in Razorweave.

## Purpose

This guide covers writing:
- Core game mechanics
- Character abilities and talents
- Combat rules and procedures
- Skill checks and tests
- Edge cases and clarifications
- Reference tables and charts

**Note:** This guide is for game rules. For narrative content, see [Prose Style Guide](../prose/README.md). For overall book structure, see [Writing Style Guide](../book/writing-style-guide.md).

## Core Principles

### Clarity Over Cleverness

Rules must be understood during play, often under time pressure.

**Bad:**
> When circumstances align favorably, the GM may adjudicate a beneficial modifier.

**Good:**
> If you have advantage on a roll, add +2.

### Unambiguous Language

Every rule should have one clear interpretation.

**Bad:**
> The attack deals extra damage based on your skill.

**Good:**
> The attack deals +1d6 damage for each rank you have in the relevant skill.

### Consistent Terminology

Use the same term for the same concept throughout.

**Bad:**
> Roll 4d6. Take the total of your four dice. If your 4d6 result is...

**Good:**
> Roll 4d6. If your result is...

## Language Standards

### Must, May, Can, Should

Use precise modal verbs:

- **Must:** Mandatory, no exceptions
  - "You must have line of sight to the target."
- **May:** Optional, player/GM chooses
  - "The GM may allow advantage if circumstances warrant."
- **Can:** Possible within rules
  - "You can move up to your Speed each turn."
- **Should:** Recommendation, not requirement
  - "Combat should be a last resort."

### Active Voice

Write in active voice with clear subjects:

**Bad:**
> Damage is dealt by the weapon.

**Good:**
> The weapon deals damage.

**Bad:**
> The check is made with advantage.

**Good:**
> You make the check with advantage.

### Imperative Mood

Give instructions directly:

**Bad:**
> The player should roll 4d6.

**Good:**
> Roll 4d6.

### Present Tense

Rules are always "now," not past or future:

**Bad:**
> If you rolled a 6, you will add your skill.

**Good:**
> If you roll a 6, add your skill.

## Structure and Organization

### Rule Blocks

Each distinct rule gets its own clearly marked section:

```markdown
### Making a Skill Check

When you attempt a challenging task, roll 4d6. If your result equals or exceeds the target number, you succeed.

**Modifiers:**
- Advantage: +2 to the roll
- Disadvantage: -2 to the roll
- Skill ranks: +1 per rank in the relevant skill
```

### Procedures

Multi-step processes use numbered lists:

```markdown
### Resolving Combat

Follow these steps each round:

1. **Declare actions** - Each participant declares their intended action
2. **Determine order** - Act in order of Initiative (highest first)
3. **Resolve actions** - Each participant resolves their action in order
4. **End of round** - Apply ongoing effects, check conditions
```

### Examples

Provide concrete examples for complex rules:

```markdown
### Combining Conditions

Multiple conditions can affect the same roll.

**Example:** Kira is making a Stealth check. She has the "Shadowed" condition (+2), but is also "Injured" (-2). The modifiers cancel out, so she rolls with no modifier.
```

### Edge Cases

Address common questions and exceptions:

```markdown
### Interrupting Actions

You can interrupt another character's action only if you have:
- A reaction ability that specifically allows it, OR
- Higher Initiative and choose to "hold" your action

**Exception:** Environmental hazards can interrupt anyone at any time.
```

## Formatting Rules

### Keywords and Terms

**Game terms** (bold on first use in section):
> When you make a **Skill Check**, roll 4d6.

**Specific abilities or talents** (italics):
> The *Quick Draw* talent lets you draw weapons instantly.

**Conditions** (bold when listed, normal when referenced):
> **Stunned:** You cannot take actions.
> While stunned, you have disadvantage.

**Dice notation** (code format):
> Roll `4d6` and add your skill modifier.

### Numbers and Values

**Small numbers** (spell out one through nine):
> You can move up to three spaces.

**Large numbers, stats, modifiers** (use numerals):
> The weapon deals 12 damage.
> Add +2 to the roll.

**Ranges and spans** (use em dash or "to"):
> Difficulty ranges from 10-25.
> Difficulty ranges from 10 to 25.

### Tables

Use tables for quick reference:

```markdown
| Difficulty | Target Number | Example Task |
|------------|---------------|--------------|
| Easy       | 10            | Climb a ladder |
| Moderate   | 15            | Pick a simple lock |
| Hard       | 20            | Track in the rain |
| Very Hard  | 25            | Disarm a bomb |
```

## Dice Notation

Razorweave uses the **4d6 system**. Follow these standards:

### Standard Format

- **4d6:** Roll four six-sided dice, sum the results
- **2d6:** Roll two six-sided dice (for damage or other rolls)
- **1d6:** Roll one six-sided die

**Examples:**
> Roll 4d6 for skill checks.
> The weapon deals 2d6 damage.

### Modifiers

Place modifiers after the dice:

- **4d6+2:** Roll 4d6, add 2 to the result
- **2d6-1:** Roll 2d6, subtract 1 from the result

### Multiple Dice Types

If using multiple die types in one roll (rare), separate clearly:

- **1d6 + 2d6:** Roll one d6, then roll two d6, sum all results
- **4d6 + 1d8:** Roll four d6 and one d8, sum all results

### Take Highest/Lowest

When rolling multiple dice and taking subset:

- **Roll 5d6, keep highest 4:** Roll five dice, sum the four highest
- **Roll 5d6, drop lowest:** Same as above

### Advantage/Disadvantage

Razorweave uses modifiers, not multiple rolls:

**Bad:**
> Roll 4d6 twice and take the higher result.

**Good:**
> You have advantage. Add +2 to your roll.

## Common Patterns

### Checks and Tests

**Standard skill check:**
> Roll 4d6. If your result equals or exceeds the target number, you succeed.

**Opposed check:**
> Both participants roll 4d6. The higher result wins. Ties go to the defender.

**Success with cost:**
> If you succeed by less than 5, you succeed but suffer a consequence.

### Conditions and Effects

**Applying a condition:**
> The target becomes **Stunned** until the end of their next turn.

**Removing a condition:**
> At the start of your turn, make a Stamina check (difficulty 15). If you succeed, remove the **Poisoned** condition.

**Condition effects:**
> **Blinded:** You have disadvantage on attack rolls and cannot see beyond 5 feet.

### Actions and Reactions

**Action types:**
> **Action:** Takes your main action for the turn.
> **Quick Action:** Takes your bonus action for the turn.
> **Reaction:** Happens outside your turn in response to a trigger.
> **Free:** No action cost.

**Trigger format:**
> **Trigger:** When an ally within 30 feet takes damage.
> **Effect:** You can move up to your Speed toward them.

### Duration and Timing

Be specific about when effects start and end:

**Bad:**
> Lasts one round.

**Good:**
> Lasts until the end of your next turn.

**Better:**
> Lasts until the start of your next turn.

**Common durations:**
- Until the start/end of your next turn
- For 1 minute (10 rounds)
- Until you take a rest
- Permanent (until removed)

## Writing Abilities

### Ability Template

Use consistent structure for character abilities:

```markdown
### [Ability Name]

**Type:** Action / Quick Action / Reaction / Passive
**Cost:** [Resource cost if any]
**Range:** [Distance]
**Duration:** [How long it lasts]
**Trigger:** [For reactions only]

[Description of what the ability does]

**Effect:** [Mechanical effect in clear terms]

**Example:** [Concrete usage example]
```

### Example Ability

```markdown
### Defensive Stance

**Type:** Quick Action
**Duration:** Until the start of your next turn

You adopt a defensive posture, making yourself harder to hit.

**Effect:** You gain +3 to Defense until the start of your next turn. While in defensive stance, you cannot move more than 5 feet.

**Example:** Surrounded by three enemies, Marcus uses a Quick Action to enter defensive stance. His Defense increases from 17 to 20. He can still attack on his turn, but can only shift 5 feet.
```

## Writing Talents

### Talent Template

```markdown
### [Talent Name]

**Prerequisites:** [Required ranks, abilities, or conditions]
**Benefit:** [What this talent provides]

[Longer description if needed]

**Special:** [Edge cases or interactions]
```

### Example Talent

```markdown
### Combat Reflexes

**Prerequisites:** Initiative +2 or higher
**Benefit:** You gain one additional reaction per round.

Normally, you can take only one reaction between your turns. With this talent, you can take two.

**Special:** You still cannot take multiple reactions in response to the same trigger.
```

## Common Mistakes

### Vague Quantities

**Bad:**
> Deals extra damage.

**Good:**
> Deals +1d6 damage.

### Undefined Triggers

**Bad:**
> When appropriate, you can reroll.

**Good:**
> When you roll a 1 on any die, you can reroll that die once.

### Ambiguous Targeting

**Bad:**
> Affects nearby enemies.

**Good:**
> Affects all enemies within 10 feet of you.

### Missing Duration

**Bad:**
> You gain +2 to Defense.

**Good:**
> You gain +2 to Defense until the end of your next turn.

### Circular References

**Bad:**
> You have advantage when you would normally have advantage.

**Good:**
> You have advantage on Stealth checks made in dim light or darkness.

### Undefined Scope

**Bad:**
> This doesn't work in some situations.

**Good:**
> This doesn't work against targets immune to fear.

## Edge Case Handling

### When Rules Conflict

Address precedence clearly:

```markdown
### Specific Beats General

When a specific rule contradicts a general rule, the specific rule takes precedence.

**Example:** The general rule says you can move only once per turn. The *Burst of Speed* talent says you can move twice. The talent takes precedence.
```

### Undefined Situations

Provide GM guidance:

```markdown
### GM Adjudication

If a situation is not covered by these rules, the GM decides the outcome based on:

1. Similar existing rules
2. Game balance considerations
3. Narrative logic
4. Player consensus

The GM's ruling becomes the rule for that situation unless changed later.
```

### Interpretation Disputes

Encourage clear resolution:

```markdown
### Rules Questions

If players disagree about a rule's interpretation:

1. The GM makes a quick ruling to keep play moving
2. Mark the question for later research
3. Discuss and establish a table ruling between sessions
4. Document table rulings for future reference
```

## Testing Your Rules

Before finalizing a rule, ask:

- [ ] Can this be read and understood in 30 seconds during play?
- [ ] Is every term defined or standard?
- [ ] Are all numbers, ranges, and durations specified?
- [ ] Are edge cases addressed?
- [ ] Does this conflict with existing rules?
- [ ] Can this be misinterpreted?
- [ ] Is the power level appropriate?
- [ ] Does the example clarify the rule?

## Examples by Category

### Combat Mechanic

```markdown
### Making an Attack

When you attack a target, follow these steps:

1. **Declare target** - Choose one target within range
2. **Roll attack** - Roll 4d6 + your Combat skill
3. **Compare to Defense** - If your result equals or exceeds the target's Defense, you hit
4. **Roll damage** - Roll your weapon's damage dice
5. **Apply damage** - Reduce the target's Health by the damage rolled

**Critical Hit:** If you roll 24 or higher on your attack roll, double the damage dice (roll twice as many dice).

**Critical Miss:** If you roll 4 or less on your attack roll, you lose your next action.
```

### Environmental Rule

```markdown
### Difficult Terrain

Spaces filled with rubble, dense vegetation, or other obstacles are difficult terrain.

**Effect:** Each foot of movement in difficult terrain costs 2 feet (half your normal Speed).

**Example:** Kira has Speed 30. To cross a 10-foot rubble-filled area, she must spend 20 feet of movement (2 feet per 1 foot of difficult terrain).

**Climbing and Swimming:** These always count as difficult terrain unless you have a special ability.
```

### Social Mechanic

```markdown
### Persuasion Check

When you attempt to convince someone to do something, roll 4d6 + your Persuasion skill against a difficulty set by the GM.

**Difficulty Guidelines:**
- **Easy (10):** They're already inclined to help
- **Moderate (15):** They're neutral
- **Hard (20):** They're opposed
- **Very Hard (25):** They're hostile or you're asking something dangerous

**Modifiers:**
- +2: You offer something they want
- -2: What you ask goes against their values
- +2: You have evidence or leverage
- -2: They don't trust you

**Success:** They agree to your request (within reason).
**Failure:** They refuse. Further attempts today are at disadvantage (-2).
```

## Revision Checklist

Before submitting rules content:

- [ ] All game terms defined or standard
- [ ] All numbers specified (no "extra" or "bonus")
- [ ] All ranges specified (no "nearby")
- [ ] All durations specified (no "a while")
- [ ] Active voice used
- [ ] Present tense used
- [ ] Imperative mood for instructions
- [ ] Clear subject in every sentence
- [ ] No ambiguous pronouns
- [ ] Examples provided for complex rules
- [ ] Edge cases addressed
- [ ] No conflicts with existing rules
- [ ] Consistent with established terminology
- [ ] Can be read and understood quickly
- [ ] Tables formatted consistently

## Related Guides

- [Writing Style Guide](../book/writing-style-guide.md) - Overall content standards
- [Prose Style Guide](../prose/README.md) - Narrative writing
- [Docs Style Guide](../docs/README.md) - Documentation format
