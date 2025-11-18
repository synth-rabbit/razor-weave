---
title: "Core Mechanical Concepts"
slug: mechanics-core-concepts
doc_type: book
version: 0.1.0
last_updated: 2025-11-08
keywords: [ttrpg, mechanics, core-concepts, dice]
---

# Core Mechanical Concepts {#core-concepts}

These fundamental mechanics apply across all genres and provide the foundation for every check, contest, and resolution in the game. Understanding these concepts allows you to adjudicate situations confidently and consistently.

## Rolling Dice {#rolling-dice}

This game uses **4d6** (four six-sided dice) as its core resolution mechanic. At its heart: **Roll 4 dice, add your bonus, compare to a target number (DC).**

### Basic Roll {#basic-roll}

1. **Roll 4d6**: Roll four six-sided dice simultaneously.
2. **Sum all dice**: Add all four dice together (no dropping or keeping subsets on a basic roll).
3. **Add bonus**: Add your relevant attribute bonus or skill bonus.
4. **Compare to DC**: Check your total against the Difficulty Class (DC).
5. **Calculate margin**: Subtract DC from your total (Roll - DC = Margin).
6. **Determine outcome**: Use margin to find your outcome tier (see below).

**Example**: You attempt to climb a rough wall (Athletics, DC 16, +3 bonus). You roll 4d6 and get 3, 5, 2, 4 = 14. Add your +3 bonus = 17 total. Margin: 17 - 16 = +1. This is a Full Success (margin ≥0).

**Key Statistics**:
- **Average roll**: 14 (without bonuses)
- **Range**: 4 to 24 (without bonuses)
- **Distribution**: Bell curve centered on 14

### Outcome Tiers {#outcome-tiers-dice}

Your margin determines how well you succeeded or how badly you failed:

| Margin | Outcome | What Happens in Story |
|--------|---------|----------------------|
| ≥ +5 | **Critical Success** | You succeed spectacularly with extra benefit. The lock opens silently and you find a hidden compartment. The crowd rallies and spreads your message beyond the square. |
| ≥ 0 | **Full Success** | You succeed cleanly. The lock opens. The crowd rallies. The enemy falls. |
| -1 to -2 | **Partial Success** | You succeed, but at a cost or with complication. The lock opens but your tools break. The crowd rallies but demands a favor. |
| ≤ -3 | **Failure** | You don't succeed, and trouble grows. The lock stays shut and guards approach. The crowd turns hostile. The enemy escapes. |
| ≤ -7 or all 1s | **Critical Failure** | A disaster occurs—the worst possible result. The lock jams permanently and alerts guards. The crowd riots. The enemy counterattacks viciously. |

**Special Rule**: Rolling all 1s (1, 1, 1, 1) is always a Critical Failure regardless of bonuses or margin.

**GM Guidance**: Frame outcomes in narrative terms first, mechanics second. A Partial Success isn't "you kind of succeed"—it's "you succeed, but what's the complication?" A Failure isn't "you fail"—it's "you fail, and how does the situation escalate?"

### Advantage {#advantage-dice}

When you have **advantage**, roll extra dice and keep the best 4. Favorable circumstances, clever preparation, superior positioning, or helpful tags grant advantage.

**Advantage comes in two levels:**

- **+1 Advantage**: Roll 5d6, keep the best 4 dice.
- **+2 Advantage**: Roll 6d6, keep the best 4 dice.

**Example (+1 Advantage)**: You attempt to track footprints with Survival, DC 16, +2 bonus. You have advantage from fresh mud. Roll 5d6: 2, 4, 5, 3, 6. Keep the best 4: 4, 5, 3, 6 = 18. Add +2 bonus = 20 total. Margin: +4 (Full Success, nearly Critical).

**Example (+2 Advantage)**: Same tracking attempt, but you also have a trained hound helping. Roll 6d6: 2, 4, 5, 3, 6, 1. Keep the best 4: 4, 5, 3, 6 = 18. Add +2 bonus = 20 total. Margin: +4 (Full Success).

**Stacking Rule**: Multiple sources of advantage do NOT stack beyond ±2. You either have +1 advantage, +2 advantage, or no advantage.

### Disadvantage {#disadvantage-dice}

When you have **disadvantage**, roll extra dice and keep the worst 4. Hostile conditions, penalties from conditions, hindering tags, or poor positioning impose disadvantage.

**Disadvantage comes in two levels:**

- **-1 Disadvantage**: Roll 5d6, keep the worst 4 dice.
- **-2 Disadvantage**: Roll 6d6, keep the worst 4 dice.

**Example (-1 Disadvantage)**: You attempt to climb a slick wall (Athletics, DC 16, +3 bonus). The Slick tag imposes disadvantage. Roll 5d6: 2, 4, 5, 3, 6. Keep the worst 4: 2, 4, 5, 3 = 14. Add +3 bonus = 17 total. Margin: +1 (Full Success, but barely).

**Example (-2 Disadvantage)**: Same climb, but you're also Exhausted (imposes additional disadvantage level). Roll 6d6: 2, 4, 5, 3, 6, 1. Keep the worst 4: 2, 4, 3, 1 = 10. Add +3 bonus = 13 total. Margin: -3 (Failure).

**Stacking Rule**: Multiple sources of disadvantage do NOT stack beyond ±2. You either have -1 disadvantage, -2 disadvantage, or no disadvantage.

### Advantage and Disadvantage Interaction {#adv-disadv-interaction}

If you have both advantage and disadvantage from different sources, they cancel each other out:

- **+1 Advantage + -1 Disadvantage = Roll normally (4d6)**
- **+2 Advantage + -1 Disadvantage = +1 Advantage (5d6, keep best 4)**
- **+1 Advantage + -2 Disadvantage = -1 Disadvantage (5d6, keep worst 4)**
- **+2 Advantage + -2 Disadvantage = Roll normally (4d6)**

**Example**: You climb a rough wall (Elevated tag grants +1 advantage) while Exhausted (condition imposes -1 disadvantage). They cancel out, so you roll normally (4d6).

**GM Guidance**: Track advantage/disadvantage sources explicitly. When multiple sources apply, net them out before rolling. This keeps the math simple and the game moving quickly.

### Worked Examples {#worked-examples-dice}

**Example 1: Picking a Lock (No Modifiers)**

- **Skill**: Thievery, DC 14, +2 bonus
- **Roll**: 4d6 → 3, 3, 5, 4 = 15
- **Total**: 15 + 2 = 17
- **Margin**: 17 - 14 = +3 (Full Success)
- **Outcome**: The lock clicks open smoothly. You slip inside undetected.

**Example 2: Persuading a Hostile Merchant (Disadvantage)**

- **Skill**: Persuasion, DC 16, +1 bonus
- **Situation**: Merchant is Suspicious (condition grants -1 disadvantage)
- **Roll**: 5d6 → 2, 6, 4, 5, 3. Keep worst 4: 2, 4, 5, 3 = 14
- **Total**: 14 + 1 = 15
- **Margin**: 15 - 16 = -1 (Partial Success)
- **Outcome**: The merchant agrees, but demands payment up front and watches you closely.

**Example 3: Tracking Through a Forest (Advantage)**

- **Skill**: Survival, DC 18, +3 bonus
- **Situation**: Fresh mud grants +1 advantage
- **Roll**: 5d6 → 1, 3, 6, 4, 5. Keep best 4: 3, 6, 4, 5 = 18
- **Total**: 18 + 3 = 21
- **Margin**: 21 - 18 = +3 (Full Success)
- **Outcome**: You follow the trail confidently, noticing details others would miss (footprint depth suggests injury, pace indicates exhaustion).

**Example 4: Critical Success**

- **Skill**: Investigation, DC 16, +4 bonus
- **Roll**: 4d6 → 6, 6, 5, 5 = 22
- **Total**: 22 + 4 = 26
- **Margin**: 26 - 16 = +10 (Critical Success)
- **Outcome**: Not only do you find the hidden compartment, you discover a second secret passage and recognize the maker's mark as belonging to a legendary craftsman—granting a new lead.

**Example 5: Critical Failure (All 1s)**

- **Skill**: Stealth, DC 14, +3 bonus
- **Roll**: 4d6 → 1, 1, 1, 1 = 4 (all 1s)
- **Total**: 4 + 3 = 7
- **Margin**: 7 - 14 = -7 (would be Failure, but all 1s = Critical Failure)
- **Outcome**: You trip over a loose stone, sending it clattering down the corridor. Guards immediately converge on your position, and the alarm bell rings throughout the complex.

### Summary {#dice-summary}

- **Core Roll**: 4d6 + bonus vs DC
- **Average**: 14 (before bonuses)
- **Advantage**: Roll 5d6 or 6d6, keep best 4
- **Disadvantage**: Roll 5d6 or 6d6, keep worst 4
- **Outcome Tiers**: Crit Success (≥+5), Full (≥0), Partial (-1 to -2), Fail (≤-3), Crit Fail (≤-7 or all 1s)
- **Stacking**: Advantage/disadvantage net out, cap at ±2 levels

## DC Ladder {#dc-ladder}

The Difficulty Class (DC) ladder establishes target numbers for skill checks. The ladder balances accessibility with challenge across a 12-22 range:

- **DC 12**: Simple tasks with some risk of failure. Picking a common lock, tracking obvious footprints, or persuading a friendly NPC.
- **DC 14**: Routine challenges requiring competence. Climbing a rough wall with handholds, identifying common poisons, or calming a spooked animal.
- **DC 16**: Standard difficulty for trained individuals. Disabling a well-made trap, navigating through a storm, or negotiating a fair deal with a neutral party.
- **DC 18**: Difficult tasks demanding skill and focus. Forging convincing documents, treating exotic toxins, or infiltrating a guarded facility.
- **DC 20**: Very difficult challenges at the edge of normal capability. Picking an arcane lock, tracking through a blizzard, or swaying a hostile crowd.
- **DC 22**: Exceptional feats requiring expertise and favorable conditions. Disarming ancient mechanisms, predicting a rare celestial event, or persuading someone to betray core beliefs.

**GM Guidance**: Start with DC 16 as your baseline for "this requires a roll." Adjust up or down based on circumstances. Tags, conditions, and proficiencies modify DCs or grant advantage/disadvantage rather than stacking endless modifiers. Keep the math simple.

**Example**: Picking a lock starts at DC 14 for a common lock. An Ancient tag might raise it to DC 16. A Fine Tools proficiency might grant advantage instead of lowering the DC. A Dim tag might create complications without changing the target number.

## Outcome Tiers {#outcome-tiers}

Every check resolves into outcome tiers based on your margin (Roll - DC). See [Rolling Dice](#rolling-dice) above for the complete outcome tier table and margin thresholds.

**Critical Success (Margin ≥+5)**: You succeed spectacularly with extra benefit. The lock opens silently and you find a hidden compartment. The crowd rallies and spreads your message beyond the square.

**Full Success (Margin ≥0)**: You achieve your goal cleanly. The lock opens, the crowd rallies, the enemy falls. Success means progress without compromise. The fiction moves in your favor.

**Partial Success (Margin -1 to -2)**: You achieve your goal but with a cost, complication, or lesser effect. The lock opens but your tools break. The crowd rallies but demands a favor. The enemy falls but reinforcements heard the fight. Partials keep the story moving while maintaining tension.

**Failure (Margin ≤-3)**: You don't achieve your goal, and the situation complicates. The lock stays shut and the patrol rounds the corner. The crowd turns hostile. The enemy escapes and raises the alarm. Failures introduce new problems, not dead ends.

**Critical Failure (Margin ≤-7 or all 1s)**: A disaster occurs—the worst possible result. The lock jams permanently and alerts guards. The crowd riots against you. The enemy counterattacks with devastating force.

**GM Guidance**: Frame outcomes in terms of goals and complications, not just success/failure. A Partial on a Persuasion check doesn't mean "half-convinced"—it means the NPC agrees but wants something in return, or agrees publicly while planning betrayal. Make complications interesting and consequential.

**Example**: A character attempts to sneak past guards (Stealth, DC 16). On a Success, they pass unnoticed. On a Partial, they pass but a Suspicion clock advances by 1 segment, or they leave evidence behind. On a Failure, a guard spots them and sounds the alarm.

## Advantage and Disadvantage {#advantage-disadvantage}

Advantage and disadvantage modify how you roll without changing the target DC. See [Rolling Dice](#rolling-dice) above for complete mechanics and examples.

**Advantage**: Roll 5d6 (±1) or 6d6 (±2) and keep the best 4 dice. Favorable circumstances, clever preparation, or helpful tags grant advantage.

**Disadvantage**: Roll 5d6 (±1) or 6d6 (±2) and keep the worst 4 dice. Hostile conditions, penalties from conditions, or hindering tags impose disadvantage.

**Stacking**: Multiple sources of advantage or disadvantage do not stack beyond ±2 levels. You either have +1/+2 advantage, -1/-2 disadvantage, or neither. If you have both, they net out (e.g., +1 advantage and -1 disadvantage cancel to a normal 4d6 roll).

**GM Guidance**: Use advantage and disadvantage for circumstantial modifiers instead of adjusting DCs. A character with the high ground gets advantage on ranged attacks rather than reducing the DC. A Frightened character has disadvantage on opposed checks rather than facing a higher DC.

**Example**: A character climbs a slick wall (Athletics, DC 16). The Slick tag imposes -1 disadvantage, so they roll 5d6 and keep the worst 4 dice. If they had a rope (providing +1 advantage) and the wall was still slick, the advantage and disadvantage cancel, and they roll normally (4d6).

## Position and Effect {#position-and-effect}

Position and effect describe risk and impact, adding texture to resolution:

**Position** measures what you risk:

- **High Position**: Minimal risk. Failure means setbacks, not disaster. Researching in a safe library, negotiating from a position of strength.
- **Standard Position**: Moderate risk. Failure brings complications. Sneaking through patrols, treating injuries in the field.
- **Low Position**: Serious risk. Failure escalates dramatically. Defusing a trap under fire, fleeing a collapsing ruin.

**Effect** measures what you achieve:

- **Great Effect**: Significant progress or impact. Clear 2 clock segments, achieve multiple goals, or create lasting change.
- **Standard Effect**: Meaningful progress. Clear 1 clock segment, achieve your immediate goal.
- **Limited Effect**: Minor progress. Partial clock advance, achieve part of your goal.

**GM Guidance**: Set position and effect before the roll based on the situation, approach, and tools available. A well-prepared infiltration has higher position than a desperate improvisation. A ritual with rare components has greater effect than one with common substitutes.

**Example**: A character tries to sway a neutral merchant (Persuasion, DC 16). Standard position (failure means they refuse and grow suspicious) and standard effect (success means they agree to help). If the character had leverage from a previous favor, they might have high position. If they were asking for something exceptional, it might be limited effect.

## Checks and Contests {#checks-and-contests}

**Checks** resolve actions against static opposition. Roll against the DC and consult outcome tiers.

**Contests** resolve opposed actions. Both parties roll their relevant skill. Higher result wins. Margin of success determines degree of victory:

- **Margin 1-3**: Narrow victory. You succeed but barely.
- **Margin 4-6**: Clear victory. You succeed convincingly.
- **Margin 7+**: Decisive victory. You dominate the contest.

**Ties**: In contests, ties result in a Partial outcome for both parties. Neither achieves their goal cleanly, but the situation shifts.

**GM Guidance**: Use checks for most situations. Reserve contests for direct opposition between characters or when both parties actively resist. A character sneaking past a guard uses a check (Stealth vs DC), not a contest, unless the guard is actively searching for them.

**Example - Check**: A character picks a lock (Thievery, DC 16). They roll once against the DC.

**Example - Contest**: Two characters race to grab an artifact. Both roll Athletics. If one rolls 18 and the other rolls 14, the first character wins with a margin of 4—a clear victory. They reach the artifact first and have time to secure it before the other arrives.

## Worked Examples {#worked-examples}

### Example 1: Infiltrating a Castle

**Situation**: A character sneaks through a castle during a festival. The halls are Crowded (tag) and Dim (tag), but guards have Alert (tag) status.

**Skill**: Stealth, DC 16 (base, +2 from Alert)
**Position**: Standard (failure means confrontation)
**Effect**: Standard (success means reaching the target undetected)
**Modifiers**: Advantage from Dim and Crowded tags (they cancel the +2 DC from Alert, so GM rules advantage applies and DC stays 16)

**Outcome - Success (18)**: The character weaves through festival crowds and shadows, reaching their target with guards none the wiser.

**Outcome - Partial (15)**: The character reaches the target, but a Suspicion clock advances by 1 segment. Guards noticed something but haven't pinpointed the threat.

**Outcome - Failure (12)**: A guard spots suspicious movement. The character must decide: flee, fight, or attempt a fast-talk (new check, possibly at disadvantage).

### Example 2: Treating Poison

**Situation**: A character treats a companion suffering from a Poisoned condition (disadvantage on strenuous actions).

**Skill**: Medicine, DC 16
**Position**: Standard (failure means the condition persists)
**Effect**: Standard (success clears the condition)
**Modifiers**: None, unless the character has First Aid proficiency (grants advantage)

**Outcome - Success (17)**: The poison is neutralized. The Poisoned condition clears immediately.

**Outcome - Partial (14)**: The poison's effects lessen. The condition will clear after the next scene, or the character can try again after gathering better supplies.

**Outcome - Failure (11)**: The poison persists. The Poisoned condition remains, and the character may need to seek professional help or rare antidotes.

### Example 3: Contested Negotiation

**Situation**: Two merchants bid for exclusive rights to a trade route. Both use Negotiation in a contest.

**Skill**: Negotiation (contest)
**Position**: High for both (failure means the other wins, but no other risk)
**Effect**: Great (winner secures exclusive rights)

**Roll**: Merchant A rolls 19. Merchant B rolls 13. Margin of 6.

**Outcome**: Merchant A wins clearly, securing the exclusive rights and favorable terms. Merchant B walks away with minor concessions but misses the primary opportunity.

## GM Usage Notes {#gm-usage}

- Default to DC 16 for standard challenges. Adjust by ±2 for easier or harder tasks. Rarely go below 12 or above 22.
- Use advantage and disadvantage instead of accumulating +/- modifiers. Keep the math simple and the rolls quick.
- Set position and effect explicitly before rolling to calibrate risk and reward.
- Frame Partials as "yes, but" and Failures as "no, and" to keep the story moving.
- For contests, describe margin of victory in narrative terms: narrow, clear, or decisive.

These core concepts form the mechanical foundation for all resolution in the game. The following chapters build on this framework with specific applications, genre variations, and detailed reference materials.
