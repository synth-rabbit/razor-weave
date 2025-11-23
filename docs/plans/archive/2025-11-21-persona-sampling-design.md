# Persona Sampling for Reviews

## Overview

Extend the review system to support flexible persona selection beyond the 10 core personas. Users can include sampled generated personas with weighted selection based on content focus.

## CLI Interface

### Three Persona Selection Modes

```bash
# Default: 10 core personas only
pnpm review:book src/site/core_rulebook_web.html

# Core + sampled generated personas
pnpm review:book src/site/core_rulebook_web.html --plus=20

# Generated personas only (no core)
pnpm review:book src/site/core_rulebook_web.html --generated=50
```

### Focus Override (Optional)

```bash
# Explicit focus for sampling weights
pnpm review:book chapters/combat.md --plus=15 --focus=combat

# Without --focus, inferred from path or defaults to 'general'
```

### Validation Rules

- `--plus` and `--generated` are mutually exclusive
- `--focus` only applies when `--plus` or `--generated` is used
- `--plus=0` and `--generated=0` are errors
- Requires at least N generated personas in database (error if not enough)

## Focus Categories

Six focus categories with dimension weights:

| Focus | Primary Weight (60%) | Secondary Weight (30%) | Even (10%) |
|-------|---------------------|------------------------|------------|
| `general` | — | — | All dimensions evenly |
| `gm-content` | gm_philosophy | experience_level | Rest |
| `combat` | archetype=Tactician | cognitive_style=Analytical | Rest |
| `narrative` | fiction_first_alignment | archetype=Socializer,Explorer | Rest |
| `character-creation` | archetype (all evenly) | experience_level | Rest |
| `quickstart` | experience_level=Newbie | archetype (all evenly) | Rest |

## Sampling Algorithm

1. Query all generated personas from database
2. Score each persona based on focus weights
3. Sort by score descending
4. Take top N with some randomization:
   - Top 70% selected deterministically by score
   - Bottom 30% randomly sampled from remaining pool

### Example: `--focus=combat --plus=10`

- 10 core personas (fixed)
- Score all generated personas: Tacticians with Analytical cognitive style score highest
- Pick top 7 by score + 3 random from remaining pool
- Total: 20 reviewers

## Path-Based Focus Inference

Inference runs when `--plus` or `--generated` is used without explicit `--focus`.

### Pattern Matching

Case-insensitive, checked against full path:

```typescript
const FOCUS_PATTERNS = {
  'gm-content': [/gm[-_]?/i, /game[-_]?master/i, /running[-_]/i],
  'combat': [/combat/i, /fighting/i, /weapons/i, /battle/i],
  'narrative': [/narrative/i, /roleplay/i, /story/i, /fiction/i],
  'character-creation': [/character/i, /creation/i, /build/i],
  'quickstart': [/quickstart/i, /intro/i, /getting[-_]?started/i, /beginner/i],
};
```

### Inference Logic

1. Check path against each pattern set
2. First match wins (order: quickstart, combat, narrative, character-creation, gm-content)
3. No match → `general`

### Examples

| Path | Inferred Focus |
|------|----------------|
| `chapters/combat-rules.md` | `combat` |
| `chapters/gm-guide.md` | `gm-content` |
| `src/site/core_rulebook_web.html` | `general` |
| `chapters/getting-started.md` | `quickstart` |

### CLI Output

```
📁 Focus: combat (inferred from path)
```

Or with explicit:

```
📁 Focus: narrative (specified)
```

## Implementation

### New Files

**`src/tooling/reviews/persona-sampler.ts`**

- `scoreFocus(persona, focus)` - Score persona against focus weights
- `samplePersonas(db, count, focus)` - Main sampling function
- `inferFocus(contentPath)` - Path pattern matching
- Focus weight configuration constants

**`src/tooling/reviews/persona-sampler.test.ts`**

- Test scoring algorithm
- Test sampling distribution
- Test path inference

### Modified Files

**`src/tooling/reviews/review-orchestrator.ts`**

- Update `InitializeCampaignParams` with new options:
  - `plusCount?: number`
  - `generatedCount?: number`
  - `focus?: FocusCategory`
- Update `resolvePersonaIds()` to handle three modes

**`src/tooling/cli-commands/review.ts`**

- Parse `--plus=N`, `--generated=N`, `--focus=<category>`
- Validate mutual exclusivity
- Pass options to orchestrator

**`src/tooling/cli-commands/run.ts`**

- Update argument parsing for new flags

## Error Handling

- `--plus` and `--generated` used together → Error with message
- Not enough generated personas → Error with count needed vs available
- Invalid focus category → Error listing valid options
- Inference fails → Silent fallback to `general`
