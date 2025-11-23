# Persona Sampling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend review system to support `--plus=N` and `--generated=N` flags with focus-weighted persona sampling.

**Architecture:** New `persona-sampler.ts` module handles focus inference, scoring, and sampling. Orchestrator delegates persona selection to sampler. CLI parses new flags and validates mutual exclusivity.

**Tech Stack:** TypeScript, better-sqlite3, vitest

---

## Task 1: Focus Types and Constants

**Files:**
- Create: `src/tooling/reviews/persona-sampler.ts`
- Test: `src/tooling/reviews/persona-sampler.test.ts`

**Step 1: Write the failing test for focus types**

```typescript
// src/tooling/reviews/persona-sampler.test.ts
import { describe, it, expect } from 'vitest';
import { FOCUS_CATEGORIES, type FocusCategory } from './persona-sampler.js';

describe('persona-sampler', () => {
  describe('FOCUS_CATEGORIES', () => {
    it('should have all 6 focus categories', () => {
      const categories: FocusCategory[] = [
        'general',
        'gm-content',
        'combat',
        'narrative',
        'character-creation',
        'quickstart',
      ];
      expect(Object.keys(FOCUS_CATEGORIES)).toEqual(categories);
    });

    it('should have weight config for each category', () => {
      for (const category of Object.keys(FOCUS_CATEGORIES)) {
        const config = FOCUS_CATEGORIES[category as FocusCategory];
        expect(config).toHaveProperty('primaryWeight');
        expect(config).toHaveProperty('secondaryWeight');
        expect(config.primaryWeight + config.secondaryWeight).toBeLessThanOrEqual(1);
      }
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/reviews/persona-sampler.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// src/tooling/reviews/persona-sampler.ts

export type FocusCategory =
  | 'general'
  | 'gm-content'
  | 'combat'
  | 'narrative'
  | 'character-creation'
  | 'quickstart';

export interface FocusWeightConfig {
  primaryWeight: number;
  secondaryWeight: number;
  primaryDimension?: {
    field: string;
    values?: string[]; // If specified, only these values get the weight
  };
  secondaryDimension?: {
    field: string;
    values?: string[];
  };
}

export const FOCUS_CATEGORIES: Record<FocusCategory, FocusWeightConfig> = {
  general: {
    primaryWeight: 0,
    secondaryWeight: 0,
    // Even distribution - no weighting
  },
  'gm-content': {
    primaryWeight: 0.6,
    secondaryWeight: 0.3,
    primaryDimension: { field: 'gm_philosophy' },
    secondaryDimension: { field: 'experience_level' },
  },
  combat: {
    primaryWeight: 0.6,
    secondaryWeight: 0.3,
    primaryDimension: { field: 'archetype', values: ['Tactician'] },
    secondaryDimension: { field: 'primary_cognitive_style', values: ['Analytical'] },
  },
  narrative: {
    primaryWeight: 0.6,
    secondaryWeight: 0.3,
    primaryDimension: { field: 'fiction_first_alignment' },
    secondaryDimension: { field: 'archetype', values: ['Socializer', 'Explorer'] },
  },
  'character-creation': {
    primaryWeight: 0.3,
    secondaryWeight: 0.3,
    primaryDimension: { field: 'archetype' }, // All archetypes evenly
    secondaryDimension: { field: 'experience_level' },
  },
  quickstart: {
    primaryWeight: 0.6,
    secondaryWeight: 0.3,
    primaryDimension: { field: 'experience_level', values: ['Newbie'] },
    secondaryDimension: { field: 'archetype' }, // All archetypes
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/reviews/persona-sampler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/reviews/persona-sampler.ts src/tooling/reviews/persona-sampler.test.ts
git commit -m "feat(reviews): add focus category types and constants"
```

---

## Task 2: Path-Based Focus Inference

**Files:**
- Modify: `src/tooling/reviews/persona-sampler.ts`
- Modify: `src/tooling/reviews/persona-sampler.test.ts`

**Step 1: Write the failing tests for inferFocus**

```typescript
// Add to persona-sampler.test.ts
import { inferFocus } from './persona-sampler.js';

describe('inferFocus', () => {
  it('should infer gm-content from gm paths', () => {
    expect(inferFocus('chapters/gm-guide.md')).toBe('gm-content');
    expect(inferFocus('docs/game-master-tips.md')).toBe('gm-content');
    expect(inferFocus('running-the-game.md')).toBe('gm-content');
  });

  it('should infer combat from combat paths', () => {
    expect(inferFocus('chapters/combat.md')).toBe('combat');
    expect(inferFocus('rules/fighting-rules.md')).toBe('combat');
    expect(inferFocus('weapons-and-armor.md')).toBe('combat');
    expect(inferFocus('battle-system.md')).toBe('combat');
  });

  it('should infer narrative from narrative paths', () => {
    expect(inferFocus('chapters/narrative.md')).toBe('narrative');
    expect(inferFocus('roleplay-tips.md')).toBe('narrative');
    expect(inferFocus('story-creation.md')).toBe('narrative');
  });

  it('should infer character-creation from character paths', () => {
    expect(inferFocus('chapters/character-creation.md')).toBe('character-creation');
    expect(inferFocus('build-guide.md')).toBe('character-creation');
  });

  it('should infer quickstart from intro paths', () => {
    expect(inferFocus('quickstart.md')).toBe('quickstart');
    expect(inferFocus('intro-guide.md')).toBe('quickstart');
    expect(inferFocus('getting-started.md')).toBe('quickstart');
    expect(inferFocus('beginner-guide.md')).toBe('quickstart');
  });

  it('should return general for unmatched paths', () => {
    expect(inferFocus('src/site/core_rulebook_web.html')).toBe('general');
    expect(inferFocus('random-file.md')).toBe('general');
  });

  it('should be case-insensitive', () => {
    expect(inferFocus('COMBAT-RULES.MD')).toBe('combat');
    expect(inferFocus('GM-Guide.md')).toBe('gm-content');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/reviews/persona-sampler.test.ts`
Expected: FAIL with "inferFocus is not exported"

**Step 3: Write implementation**

```typescript
// Add to persona-sampler.ts

const FOCUS_PATTERNS: Record<FocusCategory, RegExp[]> = {
  general: [], // No patterns - fallback
  'gm-content': [/gm[-_]?/i, /game[-_]?master/i, /running[-_]/i],
  combat: [/combat/i, /fighting/i, /weapons/i, /battle/i],
  narrative: [/narrative/i, /roleplay/i, /story/i, /fiction/i],
  'character-creation': [/character/i, /creation/i, /build/i],
  quickstart: [/quickstart/i, /intro/i, /getting[-_]?started/i, /beginner/i],
};

// Order matters - first match wins
const INFERENCE_ORDER: FocusCategory[] = [
  'quickstart',
  'combat',
  'narrative',
  'character-creation',
  'gm-content',
];

/**
 * Infer focus category from content path.
 * Returns 'general' if no patterns match.
 */
export function inferFocus(contentPath: string): FocusCategory {
  for (const category of INFERENCE_ORDER) {
    const patterns = FOCUS_PATTERNS[category];
    for (const pattern of patterns) {
      if (pattern.test(contentPath)) {
        return category;
      }
    }
  }
  return 'general';
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/reviews/persona-sampler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/reviews/persona-sampler.ts src/tooling/reviews/persona-sampler.test.ts
git commit -m "feat(reviews): add path-based focus inference"
```

---

## Task 3: Persona Scoring Function

**Files:**
- Modify: `src/tooling/reviews/persona-sampler.ts`
- Modify: `src/tooling/reviews/persona-sampler.test.ts`

**Step 1: Write the failing tests for scorePersona**

```typescript
// Add to persona-sampler.test.ts
import { scorePersona } from './persona-sampler.js';

describe('scorePersona', () => {
  const tactician = {
    id: 'gen-1',
    archetype: 'Tactician',
    experience_level: 'Veteran',
    primary_cognitive_style: 'Analytical',
    fiction_first_alignment: 'Low',
    gm_philosophy: 'Traditional',
  };

  const newbieExplorer = {
    id: 'gen-2',
    archetype: 'Explorer',
    experience_level: 'Newbie',
    primary_cognitive_style: 'Visual',
    fiction_first_alignment: 'High',
    gm_philosophy: 'Collaborative',
  };

  it('should return 0 for general focus (even distribution)', () => {
    expect(scorePersona(tactician, 'general')).toBe(0);
    expect(scorePersona(newbieExplorer, 'general')).toBe(0);
  });

  it('should score Tactician higher for combat focus', () => {
    const tacticianScore = scorePersona(tactician, 'combat');
    const explorerScore = scorePersona(newbieExplorer, 'combat');
    expect(tacticianScore).toBeGreaterThan(explorerScore);
    expect(tacticianScore).toBeGreaterThan(0.5); // Primary match
  });

  it('should score Newbie higher for quickstart focus', () => {
    const newbieScore = scorePersona(newbieExplorer, 'quickstart');
    const veteranScore = scorePersona(tactician, 'quickstart');
    expect(newbieScore).toBeGreaterThan(veteranScore);
    expect(newbieScore).toBeGreaterThan(0.5); // Primary match
  });

  it('should score based on gm_philosophy for gm-content', () => {
    // Both should get some score since gm_philosophy is weighted
    const score1 = scorePersona(tactician, 'gm-content');
    const score2 = scorePersona(newbieExplorer, 'gm-content');
    // Scores depend on diversity, both have valid gm_philosophy
    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score2).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/reviews/persona-sampler.test.ts`
Expected: FAIL with "scorePersona is not exported"

**Step 3: Write implementation**

```typescript
// Add to persona-sampler.ts

export interface PersonaForScoring {
  id: string;
  archetype: string;
  experience_level: string;
  primary_cognitive_style: string;
  fiction_first_alignment: string;
  gm_philosophy: string;
  [key: string]: string; // Allow dynamic field access
}

/**
 * Score a persona against a focus category.
 * Higher scores = better match for focus.
 * Returns 0-1 range.
 */
export function scorePersona(
  persona: PersonaForScoring,
  focus: FocusCategory
): number {
  const config = FOCUS_CATEGORIES[focus];

  // General focus = even distribution, no scoring
  if (focus === 'general') {
    return 0;
  }

  let score = 0;

  // Primary dimension scoring
  if (config.primaryDimension) {
    const field = config.primaryDimension.field;
    const value = persona[field];
    const allowedValues = config.primaryDimension.values;

    if (allowedValues) {
      // Specific values get the weight
      if (allowedValues.includes(value)) {
        score += config.primaryWeight;
      }
    } else {
      // Any value gets weight (for diversity)
      if (value) {
        score += config.primaryWeight;
      }
    }
  }

  // Secondary dimension scoring
  if (config.secondaryDimension) {
    const field = config.secondaryDimension.field;
    const value = persona[field];
    const allowedValues = config.secondaryDimension.values;

    if (allowedValues) {
      if (allowedValues.includes(value)) {
        score += config.secondaryWeight;
      }
    } else {
      if (value) {
        score += config.secondaryWeight;
      }
    }
  }

  return score;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/reviews/persona-sampler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/reviews/persona-sampler.ts src/tooling/reviews/persona-sampler.test.ts
git commit -m "feat(reviews): add persona scoring for focus categories"
```

---

## Task 4: Sampling Function

**Files:**
- Modify: `src/tooling/reviews/persona-sampler.ts`
- Modify: `src/tooling/reviews/persona-sampler.test.ts`

**Step 1: Write the failing tests for samplePersonas**

```typescript
// Add to persona-sampler.test.ts
import Database from 'better-sqlite3';
import { samplePersonas } from './persona-sampler.js';

describe('samplePersonas', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    // Create personas table
    db.exec(`
      CREATE TABLE personas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'generated',
        archetype TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        primary_cognitive_style TEXT,
        fiction_first_alignment TEXT,
        gm_philosophy TEXT,
        active INTEGER DEFAULT 1
      )
    `);

    // Insert test personas
    const insert = db.prepare(`
      INSERT INTO personas (id, name, type, archetype, experience_level, primary_cognitive_style, fiction_first_alignment, gm_philosophy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 5 Tacticians (good for combat)
    for (let i = 0; i < 5; i++) {
      insert.run(`tact-${i}`, `Tactician ${i}`, 'generated', 'Tactician', 'Veteran', 'Analytical', 'Low', 'Traditional');
    }
    // 5 Explorers (good for narrative)
    for (let i = 0; i < 5; i++) {
      insert.run(`exp-${i}`, `Explorer ${i}`, 'generated', 'Explorer', 'Intermediate', 'Visual', 'High', 'Collaborative');
    }
    // 5 Newbies (good for quickstart)
    for (let i = 0; i < 5; i++) {
      insert.run(`newb-${i}`, `Newbie ${i}`, 'generated', 'Socializer', 'Newbie', 'Verbal', 'Medium', 'Hybrid');
    }
  });

  afterEach(() => {
    db.close();
  });

  it('should sample requested count', () => {
    const result = samplePersonas(db, 5, 'general');
    expect(result).toHaveLength(5);
  });

  it('should return all if count exceeds available', () => {
    const result = samplePersonas(db, 100, 'general');
    expect(result).toHaveLength(15); // Only 15 in db
  });

  it('should favor Tacticians for combat focus', () => {
    const result = samplePersonas(db, 7, 'combat');
    const tacticians = result.filter(id => id.startsWith('tact-'));
    // With 70% deterministic, should get most tacticians
    expect(tacticians.length).toBeGreaterThanOrEqual(4);
  });

  it('should favor Newbies for quickstart focus', () => {
    const result = samplePersonas(db, 7, 'quickstart');
    const newbies = result.filter(id => id.startsWith('newb-'));
    expect(newbies.length).toBeGreaterThanOrEqual(4);
  });

  it('should return unique IDs', () => {
    const result = samplePersonas(db, 10, 'general');
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it('should throw if not enough generated personas', () => {
    // Clear all personas
    db.exec('DELETE FROM personas');
    expect(() => samplePersonas(db, 5, 'general')).toThrow(/not enough/i);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/reviews/persona-sampler.test.ts`
Expected: FAIL with "samplePersonas is not exported"

**Step 3: Write implementation**

```typescript
// Add to persona-sampler.ts
import type Database from 'better-sqlite3';

/**
 * Sample generated personas with focus-weighted selection.
 *
 * Algorithm:
 * 1. Query all generated personas
 * 2. Score each against focus
 * 3. Sort by score descending
 * 4. Take top 70% deterministically
 * 5. Randomly sample remaining 30% from pool
 *
 * @param db - Database connection
 * @param count - Number of personas to sample
 * @param focus - Focus category for weighting
 * @returns Array of persona IDs
 * @throws Error if not enough generated personas available
 */
export function samplePersonas(
  db: Database.Database,
  count: number,
  focus: FocusCategory
): string[] {
  // Query all generated personas
  const stmt = db.prepare(`
    SELECT id, archetype, experience_level, primary_cognitive_style,
           fiction_first_alignment, gm_philosophy
    FROM personas
    WHERE type = 'generated' AND active = 1
  `);
  const personas = stmt.all() as PersonaForScoring[];

  if (personas.length === 0) {
    throw new Error('Not enough generated personas: 0 available, need ' + count);
  }

  // Adjust count if more requested than available
  const actualCount = Math.min(count, personas.length);

  if (actualCount < count) {
    // Warning: not enough personas, using all available
  }

  // For general focus, just random sample
  if (focus === 'general') {
    return shuffleAndTake(personas.map(p => p.id), actualCount);
  }

  // Score and sort
  const scored = personas.map(p => ({
    id: p.id,
    score: scorePersona(p, focus),
  }));
  scored.sort((a, b) => b.score - a.score);

  // 70% deterministic from top scores
  const deterministicCount = Math.ceil(actualCount * 0.7);
  const randomCount = actualCount - deterministicCount;

  const result: string[] = [];

  // Take top scorers deterministically
  for (let i = 0; i < deterministicCount && i < scored.length; i++) {
    result.push(scored[i].id);
  }

  // Randomly sample from remaining pool
  if (randomCount > 0) {
    const remaining = scored.slice(deterministicCount).map(s => s.id);
    const randomPicks = shuffleAndTake(remaining, randomCount);
    result.push(...randomPicks);
  }

  return result;
}

/**
 * Fisher-Yates shuffle and take first N elements
 */
function shuffleAndTake(arr: string[], count: number): string[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/tooling/reviews/persona-sampler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/reviews/persona-sampler.ts src/tooling/reviews/persona-sampler.test.ts
git commit -m "feat(reviews): add focus-weighted persona sampling"
```

---

## Task 5: Export from Index

**Files:**
- Modify: `src/tooling/reviews/index.ts`

**Step 1: Add exports**

```typescript
// Add to src/tooling/reviews/index.ts
export {
  inferFocus,
  scorePersona,
  samplePersonas,
  FOCUS_CATEGORIES,
  type FocusCategory,
  type PersonaForScoring,
} from './persona-sampler.js';
```

**Step 2: Run tests to verify nothing broke**

Run: `pnpm vitest run src/tooling/reviews/`
Expected: All PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/index.ts
git commit -m "feat(reviews): export persona sampler from index"
```

---

## Task 6: Update Orchestrator Types

**Files:**
- Modify: `src/tooling/reviews/review-orchestrator.ts`

**Step 1: Update InitializeCampaignParams interface**

Add to existing interface:

```typescript
// In src/tooling/reviews/review-orchestrator.ts
// Update the InitializeCampaignParams interface

export interface InitializeCampaignParams {
  campaignName: string;
  contentType: 'book' | 'chapter';
  contentPath: string;
  personaSelectionStrategy: 'all_core' | 'manual';
  personaIds?: string[];
  bookPath?: string;
  chapterName?: string;
  // NEW: Sampling options
  plusCount?: number;      // Core + N generated
  generatedCount?: number; // N generated only
  focus?: FocusCategory;   // Override inferred focus
}
```

**Step 2: Add import**

```typescript
// Add to imports at top
import { inferFocus, samplePersonas, type FocusCategory } from './persona-sampler.js';
```

**Step 3: Run tests**

Run: `pnpm vitest run src/tooling/reviews/`
Expected: PASS (no behavior change yet)

**Step 4: Commit**

```bash
git add src/tooling/reviews/review-orchestrator.ts
git commit -m "feat(reviews): add sampling options to orchestrator params"
```

---

## Task 7: Implement Orchestrator Sampling Logic

**Files:**
- Modify: `src/tooling/reviews/review-orchestrator.ts`
- Modify: `src/tooling/reviews/review-orchestrator.test.ts`

**Step 1: Write failing tests**

```typescript
// Add to review-orchestrator.test.ts
describe('persona sampling modes', () => {
  let db: Database.Database;
  let campaignClient: CampaignClient;
  let orchestrator: ReviewOrchestrator;

  beforeEach(() => {
    db = new Database(':memory:');
    // Setup schema (existing setup code)
    // ... existing setup ...

    // Add generated personas for sampling tests
    const insertPersona = db.prepare(`
      INSERT INTO personas (id, name, type, archetype, experience_level, primary_cognitive_style, fiction_first_alignment, gm_philosophy, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    for (let i = 0; i < 20; i++) {
      insertPersona.run(
        `gen-${i}`,
        `Generated ${i}`,
        'generated',
        i % 2 === 0 ? 'Tactician' : 'Explorer',
        'Intermediate',
        'Analytical',
        'Medium',
        'Hybrid'
      );
    }
  });

  it('should use core only by default', () => {
    const campaignId = orchestrator.initializeCampaign({
      campaignName: 'Test',
      contentType: 'book',
      contentPath: 'test.html',
      personaSelectionStrategy: 'all_core',
    });

    const campaign = campaignClient.getCampaign(campaignId);
    const personaIds = JSON.parse(campaign!.persona_ids);
    // Should only have core personas
    expect(personaIds.every((id: string) => id.startsWith('core-'))).toBe(true);
  });

  it('should add sampled personas with plusCount', () => {
    const campaignId = orchestrator.initializeCampaign({
      campaignName: 'Test',
      contentType: 'book',
      contentPath: 'test.html',
      personaSelectionStrategy: 'all_core',
      plusCount: 5,
    });

    const campaign = campaignClient.getCampaign(campaignId);
    const personaIds = JSON.parse(campaign!.persona_ids);
    const coreCount = personaIds.filter((id: string) => id.startsWith('core-')).length;
    const genCount = personaIds.filter((id: string) => id.startsWith('gen-')).length;

    expect(coreCount).toBe(10); // All core
    expect(genCount).toBe(5);   // Plus 5 generated
  });

  it('should use only generated with generatedCount', () => {
    const campaignId = orchestrator.initializeCampaign({
      campaignName: 'Test',
      contentType: 'book',
      contentPath: 'test.html',
      personaSelectionStrategy: 'all_core', // Ignored when generatedCount set
      generatedCount: 8,
    });

    const campaign = campaignClient.getCampaign(campaignId);
    const personaIds = JSON.parse(campaign!.persona_ids);

    expect(personaIds).toHaveLength(8);
    expect(personaIds.every((id: string) => id.startsWith('gen-'))).toBe(true);
  });

  it('should infer focus from path when not specified', () => {
    const campaignId = orchestrator.initializeCampaign({
      campaignName: 'Test',
      contentType: 'chapter',
      contentPath: 'chapters/combat-rules.md',
      personaSelectionStrategy: 'all_core',
      plusCount: 5,
      // focus not specified - should infer 'combat'
    });

    // Focus affects sampling, verify via campaign or sampling behavior
    const campaign = campaignClient.getCampaign(campaignId);
    expect(campaign).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/tooling/reviews/review-orchestrator.test.ts`
Expected: FAIL (new tests fail)

**Step 3: Update resolvePersonaIds method**

```typescript
// Replace resolvePersonaIds in review-orchestrator.ts

private resolvePersonaIds(
  campaign: Campaign,
  params: InitializeCampaignParams
): string[] {
  const personaClient = new PersonaClient(this.db);

  // Mode 1: Generated only
  if (params.generatedCount !== undefined && params.generatedCount > 0) {
    const focus = params.focus ?? inferFocus(params.contentPath);
    return samplePersonas(this.db, params.generatedCount, focus);
  }

  // Get core personas
  let coreIds: string[] = [];
  if (params.personaSelectionStrategy === 'all_core') {
    const allPersonas = personaClient.getAll();
    coreIds = allPersonas.filter(p => p.type === 'core').map(p => p.id);
  } else if (params.personaSelectionStrategy === 'manual' && params.personaIds) {
    coreIds = params.personaIds;
  }

  // Mode 2: Core + generated
  if (params.plusCount !== undefined && params.plusCount > 0) {
    const focus = params.focus ?? inferFocus(params.contentPath);
    const sampledIds = samplePersonas(this.db, params.plusCount, focus);
    return [...coreIds, ...sampledIds];
  }

  // Mode 3: Core only (default)
  return coreIds;
}
```

**Step 4: Update initializeCampaign to pass params**

```typescript
// In initializeCampaign method, update the persona resolution call:

// Before createCampaign, resolve personas with full params
const resolvedPersonaIds = this.resolvePersonaIds(
  { persona_selection_strategy: params.personaSelectionStrategy } as Campaign,
  params
);

// Then use resolvedPersonaIds in createCampaign
const campaignId = this.campaignClient.createCampaign({
  campaignName,
  contentType,
  contentId,
  personaSelectionStrategy: params.personaSelectionStrategy,
  personaIds: resolvedPersonaIds,
});
```

**Step 5: Run tests**

Run: `pnpm vitest run src/tooling/reviews/review-orchestrator.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/tooling/reviews/review-orchestrator.ts src/tooling/reviews/review-orchestrator.test.ts
git commit -m "feat(reviews): implement persona sampling in orchestrator"
```

---

## Task 8: Update CLI Argument Parsing

**Files:**
- Modify: `src/tooling/cli-commands/review.ts`
- Modify: `src/tooling/cli-commands/run.ts`

**Step 1: Update review.ts options interface**

```typescript
// In src/tooling/cli-commands/review.ts

export interface ReviewBookOptions {
  personas?: string;
  plus?: number;
  generated?: number;
  focus?: string;
}
```

**Step 2: Update executeReviewCampaign**

```typescript
// Update executeReviewCampaign function signature and body

function executeReviewCampaign(
  contentPath: string,
  contentType: 'book' | 'chapter',
  options?: ReviewBookOptions
): void {
  log.info(`\nReviewing ${contentType}: ${contentPath}\n`);

  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);
  const orchestrator = new ReviewOrchestrator(rawDb, campaignClient);

  // Validate mutual exclusivity
  if (options?.plus !== undefined && options?.generated !== undefined) {
    log.error('Error: --plus and --generated are mutually exclusive');
    process.exit(1);
  }

  // Parse persona selection
  let personaSelectionStrategy: 'all_core' | 'manual' = 'all_core';
  let personaIds: string[] | undefined;

  if (options?.personas && options.personas !== 'all_core') {
    personaSelectionStrategy = 'manual';
    personaIds = options.personas.split(',').map((id) => id.trim());
  }

  // Validate focus if provided
  const validFocuses = ['general', 'gm-content', 'combat', 'narrative', 'character-creation', 'quickstart'];
  if (options?.focus && !validFocuses.includes(options.focus)) {
    log.error(`Error: Invalid focus '${options.focus}'. Valid options: ${validFocuses.join(', ')}`);
    process.exit(1);
  }

  // Initialize campaign with sampling options
  log.info('Creating review campaign...');
  const campaignId = orchestrator.initializeCampaign({
    campaignName: `${contentPath} Review - ${new Date().toISOString()}`,
    contentType,
    contentPath,
    personaSelectionStrategy,
    personaIds,
    plusCount: options?.plus,
    generatedCount: options?.generated,
    focus: options?.focus as FocusCategory | undefined,
  });

  // Generate prompt files and show next steps
  orchestrator.executeReviews(campaignId);
}
```

**Step 3: Add FocusCategory import**

```typescript
// Add to imports at top of review.ts
import type { FocusCategory } from '../reviews/index.js';
```

**Step 4: Update run.ts argument parsing**

```typescript
// In run.ts, update the review book/chapter sections to parse new flags

} else if (subcommand === 'book') {
  const bookPath = args[2];
  if (!bookPath) {
    log.error('Error: Please provide a book path');
    log.error('Usage: pnpm review:book <path> [--personas=...] [--plus=N] [--generated=N] [--focus=...]');
    process.exit(1);
  }

  const options: { personas?: string; plus?: number; generated?: number; focus?: string } = {};
  for (let i = 3; i < args.length; i++) {
    if (args[i].startsWith('--personas=')) {
      options.personas = args[i].split('=')[1];
    } else if (args[i].startsWith('--plus=')) {
      options.plus = parseInt(args[i].split('=')[1], 10);
    } else if (args[i].startsWith('--generated=')) {
      options.generated = parseInt(args[i].split('=')[1], 10);
    } else if (args[i].startsWith('--focus=')) {
      options.focus = args[i].split('=')[1];
    }
  }

  reviewBook(bookPath, options);
}
```

**Step 5: Same update for chapter subcommand**

(Similar pattern for the chapter handling)

**Step 6: Run tests**

Run: `pnpm vitest run src/tooling/`
Expected: PASS

**Step 7: Commit**

```bash
git add src/tooling/cli-commands/review.ts src/tooling/cli-commands/run.ts
git commit -m "feat(reviews): add --plus, --generated, --focus CLI flags"
```

---

## Task 9: Add CLI Output for Focus

**Files:**
- Modify: `src/tooling/reviews/review-orchestrator.ts`

**Step 1: Update executeReviews to show focus**

```typescript
// In executeReviews method, after resolving personas, add focus output

executeReviews(campaignId: string): void {
  const campaign = this.campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  if (campaign.status !== 'pending') {
    throw new Error('Campaign must be in pending status to execute reviews');
  }

  // Update status to in_progress
  this.campaignClient.updateStatus(campaignId, 'in_progress');

  // Resolve persona IDs
  const personaIds = JSON.parse(campaign.persona_ids || '[]') as string[];
  if (personaIds.length === 0) {
    throw new Error('No personas selected for review');
  }

  // Generate prompt files
  const writtenFiles = writePromptFiles(this.db, campaignId);

  // Count persona types
  const coreCount = personaIds.filter(id => id.startsWith('core-')).length;
  const generatedCount = personaIds.length - coreCount;

  // Output instructions for user
  log.info(`\n✅ Campaign created: ${campaignId}`);
  log.info(`✅ Generated ${writtenFiles.length} review prompts`);
  if (coreCount > 0 && generatedCount > 0) {
    log.info(`   (${coreCount} core + ${generatedCount} sampled)`);
  } else if (generatedCount > 0) {
    log.info(`   (${generatedCount} sampled generated)`);
  }
  log.info(`\n📁 Prompts directory: data/reviews/prompts/${campaignId}/\n`);
  log.info('Next: Tell Claude Code to execute reviews\n');
  log.info('────────────────────────────────────────────────────────');
  log.info(`Read prompts from data/reviews/prompts/${campaignId}/`);
  log.info(`and execute reviewer agents in batches of 5`);
  log.info('────────────────────────────────────────────────────────\n');
  log.info(`After agents complete, check status with:`);
  log.info(`  pnpm review:status ${campaignId}\n`);
}
```

**Step 2: Run tests**

Run: `pnpm vitest run src/tooling/reviews/`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/review-orchestrator.ts
git commit -m "feat(reviews): show persona breakdown in CLI output"
```

---

## Task 10: Manual Testing

**Step 1: Hydrate core personas**

```bash
pnpm personas:hydrate
```

**Step 2: Generate some test personas**

```bash
pnpm personas:generate 50
```

**Step 3: Test default (core only)**

```bash
pnpm review:book src/site/core_rulebook_web.html
```
Expected: 10 prompts generated

**Step 4: Test --plus flag**

```bash
pnpm review:book src/site/core_rulebook_web.html --plus=5
```
Expected: 15 prompts (10 core + 5 sampled)

**Step 5: Test --generated flag**

```bash
pnpm review:book src/site/core_rulebook_web.html --generated=8
```
Expected: 8 prompts (all sampled)

**Step 6: Test --focus flag**

```bash
pnpm review:book chapters/combat.md --plus=10 --focus=combat
```
Expected: Prompts with combat-weighted sampling

**Step 7: Test mutual exclusivity error**

```bash
pnpm review:book test.html --plus=5 --generated=5
```
Expected: Error message about mutual exclusivity

**Step 8: Final commit**

```bash
git add -A
git commit -m "feat(reviews): complete persona sampling implementation"
```
