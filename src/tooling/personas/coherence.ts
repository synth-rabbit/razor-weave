import { loadSchema, type CombinationRules } from './schema.js';

export interface PersonaDimensions {
  archetypes: string;
  playstyle_modifiers: string[];
  cognitive_styles: { primary: string; secondary?: string };
  social_emotional_traits: string[];
  experience_levels: string;
  system_exposures: string[];
  life_contexts: string[];
  fiction_first_alignment: string;
  narrative_mechanics_comfort: string;
  gm_philosophy: string;
  genre_flexibility: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CoherenceResult extends ValidationResult {
  affinityScore: number; // 0.0 = neutral, >0.0 = positive affinity
}

/**
 * Validates quantity rules for a specific dimension
 */
export function validateQuantityRules(
  dimensionName: string,
  values: string[]
): ValidationResult {
  const schema = loadSchema();
  const errors: string[] = [];
  const warnings: string[] = [];

  const rule = schema.rules.quantity_rules[dimensionName];
  if (!rule) {
    errors.push(`No quantity rules defined for dimension: ${dimensionName}`);
    return { valid: false, errors, warnings };
  }

  // Handle cognitive_styles special case (primary + optional secondary)
  if (dimensionName === 'cognitive_styles') {
    const minTotal = rule.primary || 1;
    const maxTotal = minTotal + (rule.secondary_max || 0);

    if (values.length < minTotal) {
      errors.push(
        `${dimensionName} must have at least ${minTotal} value(s)`
      );
    }
    if (values.length > maxTotal) {
      errors.push(
        `${dimensionName} cannot exceed ${maxTotal} value(s) (${rule.primary} primary + ${rule.secondary_min}-${rule.secondary_max} secondary)`
      );
    }
  } else {
    // Standard min/max rules
    if (values.length < rule.min) {
      errors.push(
        `${dimensionName} must have at least ${rule.min} value(s)`
      );
    }
    if (values.length > rule.max) {
      // For single-value dimensions (min == max), use "exactly" wording
      if (rule.min === rule.max) {
        errors.push(
          `${dimensionName} must have exactly ${rule.max} value(s)`
        );
      } else {
        errors.push(
          `${dimensionName} cannot exceed ${rule.max} value(s)`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates exclusion rules across dimensions
 */
export function validateExclusions(
  dimensions: PersonaDimensions
): ValidationResult {
  const schema = loadSchema();
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const exclusionRule of schema.rules.exclusions) {
    // Get all values from the dimensions mentioned in this rule
    const relevantValues: string[] = [];
    for (const dimName of exclusionRule.dimensions) {
      const value = dimensions[dimName as keyof PersonaDimensions];
      if (Array.isArray(value)) {
        relevantValues.push(...value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle cognitive_styles object
        relevantValues.push(value.primary);
        if (value.secondary) {
          relevantValues.push(value.secondary);
        }
      } else if (value) {
        relevantValues.push(value);
      }
    }

    // Check each incompatible combination
    for (const incompatibleSet of exclusionRule.incompatible) {
      // Check if all values in the incompatible set are present
      const allPresent = incompatibleSet.every((val) =>
        relevantValues.includes(val)
      );

      if (allPresent) {
        // Generate appropriate error message
        if (exclusionRule.dimensions.length === 1) {
          errors.push(
            `Exclusion violation in ${exclusionRule.dimensions[0]}: ${incompatibleSet.join(' and ')} are incompatible`
          );
        } else {
          errors.push(
            `Exclusion violation: ${incompatibleSet.join(' and ')} are incompatible`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculates affinity score based on matching affinity rules
 */
export function checkAffinity(dimensions: PersonaDimensions): number {
  const schema = loadSchema();
  let totalScore = 0.0;

  for (const affinityRule of schema.rules.affinities) {
    let matches = true;

    // Check if all conditions in the affinity rule are met
    for (const [dimName, expectedValue] of Object.entries(
      affinityRule.combination
    )) {
      // Handle both singular and plural dimension names (schema uses singular)
      const normalizedDimName = normalizeDimensionName(dimName);
      const actualValue = dimensions[normalizedDimName as keyof PersonaDimensions];

      if (Array.isArray(expectedValue)) {
        // Expected value is an array - check if all are present in actual
        if (!Array.isArray(actualValue)) {
          matches = false;
          break;
        }
        const allPresent = expectedValue.every((val) =>
          actualValue.includes(val)
        );
        if (!allPresent) {
          matches = false;
          break;
        }
      } else if (Array.isArray(actualValue)) {
        // Actual value is an array - check if expected is in it
        if (!actualValue.includes(expectedValue)) {
          matches = false;
          break;
        }
      } else if (typeof actualValue === 'object' && actualValue !== null) {
        // Handle cognitive_styles object
        const cogStyle = actualValue as { primary: string; secondary?: string };
        if (
          cogStyle.primary !== expectedValue &&
          cogStyle.secondary !== expectedValue
        ) {
          matches = false;
          break;
        }
      } else {
        // Direct comparison
        if (actualValue !== expectedValue) {
          matches = false;
          break;
        }
      }
    }

    if (matches) {
      totalScore += affinityRule.weight;
    }
  }

  return totalScore;
}

/**
 * Master validation function combining all coherence checks
 */
export function validatePersonaCoherence(
  dimensions: PersonaDimensions
): CoherenceResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate quantity rules for each dimension
  const dimensionChecks: Array<[string, string | string[] | { primary: string; secondary?: string }]> = [
    ['archetypes', [dimensions.archetypes]],
    ['playstyle_modifiers', dimensions.playstyle_modifiers],
    ['cognitive_styles', getCognitiveStylesArray(dimensions.cognitive_styles)],
    ['social_emotional_traits', dimensions.social_emotional_traits],
    ['experience_levels', [dimensions.experience_levels]],
    ['system_exposures', dimensions.system_exposures],
    ['life_contexts', dimensions.life_contexts],
    ['fiction_first_alignment', [dimensions.fiction_first_alignment]],
    ['narrative_mechanics_comfort', [dimensions.narrative_mechanics_comfort]],
    ['gm_philosophy', [dimensions.gm_philosophy]],
    ['genre_flexibility', [dimensions.genre_flexibility]],
  ];

  for (const [dimName, values] of dimensionChecks) {
    const valueArray = Array.isArray(values) ? values : [values as string];
    const result = validateQuantityRules(dimName, valueArray);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  // Validate exclusion rules
  const exclusionResult = validateExclusions(dimensions);
  allErrors.push(...exclusionResult.errors);
  allWarnings.push(...exclusionResult.warnings);

  // Calculate affinity score
  const affinityScore = checkAffinity(dimensions);

  // Add warning if no affinities found
  if (affinityScore === 0.0) {
    allWarnings.push(
      'No affinity bonuses found - persona may lack thematic coherence'
    );
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    affinityScore,
  };
}

/**
 * Helper function to convert cognitive_styles object to array
 */
function getCognitiveStylesArray(cogStyles: {
  primary: string;
  secondary?: string;
}): string[] {
  const result = [cogStyles.primary];
  if (cogStyles.secondary) {
    result.push(cogStyles.secondary);
  }
  return result;
}

/**
 * Helper function to normalize dimension names (schema uses singular, code uses plural)
 */
function normalizeDimensionName(dimName: string): string {
  // Map singular to plural for consistency
  const mapping: Record<string, string> = {
    archetype: 'archetypes',
    experience_level: 'experience_levels',
  };
  return mapping[dimName] || dimName;
}
