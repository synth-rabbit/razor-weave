import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

export interface DimensionSchema {
  version: number;
  created: string;
  archetypes: string[];
  playstyle_modifiers: string[];
  cognitive_styles: string[];
  social_emotional_traits: string[];
  experience_levels: string[];
  system_exposures: string[];
  life_contexts: string[];
  fiction_first_alignment: string[];
  narrative_mechanics_comfort: string[];
  gm_philosophy: string[];
  genre_flexibility: string[];
}

export interface QuantityRule {
  min: number;
  max: number;
  primary?: number;
  secondary_min?: number;
  secondary_max?: number;
}

export interface ExclusionRule {
  dimensions: string[];
  incompatible: string[][];
}

export interface AffinityRule {
  combination: Record<string, string | string[]>;
  weight: number;
}

export interface CombinationRules {
  version: number;
  created: string;
  quantity_rules: Record<string, QuantityRule>;
  exclusions: ExclusionRule[];
  affinities: AffinityRule[];
}

export interface Schema extends DimensionSchema {
  rules: CombinationRules;
}

let cachedSchema: Schema | null = null;

export function loadSchema(): Schema {
  if (cachedSchema) {
    return cachedSchema;
  }

  const dimensionsPath = join(process.cwd(), 'data/personas/schema/dimensions.yaml');
  const rulesPath = join(process.cwd(), 'data/personas/schema/combination-rules.yaml');

  const dimensionsYaml = readFileSync(dimensionsPath, 'utf-8');
  const rulesYaml = readFileSync(rulesPath, 'utf-8');

  const dimensions = YAML.parse(dimensionsYaml) as DimensionSchema;
  const rules = YAML.parse(rulesYaml) as CombinationRules;

  cachedSchema = { ...dimensions, rules };
  return cachedSchema;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDimensions(
  dimensionName: keyof DimensionSchema,
  values: string[]
): ValidationResult {
  const schema = loadSchema();
  const errors: string[] = [];

  // Check if dimension exists
  const validValues = schema[dimensionName];
  if (!validValues || !Array.isArray(validValues)) {
    return { valid: false, errors: [`Unknown dimension: ${dimensionName}`] };
  }

  // Validate each value
  for (const value of values) {
    if (!validValues.includes(value)) {
      errors.push(`Invalid ${dimensionName}: ${value}`);
    }
  }

  // Check quantity rules
  const rule = schema.rules.quantity_rules[dimensionName];
  if (rule) {
    if (values.length < rule.min) {
      errors.push(`${dimensionName} must have at least ${rule.min} value(s)`);
    }
    if (values.length > rule.max) {
      errors.push(`${dimensionName} must have exactly ${rule.max} value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
