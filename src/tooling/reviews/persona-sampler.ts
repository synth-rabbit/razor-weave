// src/tooling/reviews/persona-sampler.ts
import type Database from 'better-sqlite3';

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
