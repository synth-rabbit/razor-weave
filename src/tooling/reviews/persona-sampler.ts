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
