import { ValidationResult } from './types.js';

/**
 * Validates plan file naming conventions
 *
 * Formats:
 * - Index: {topic-name}-index.md
 * - Phase: {topic-name}-P{phase-number}[-{phase-step}].md
 * - Tangent: {topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md
 */
export function validatePlanNaming(filePath: string): ValidationResult {
  // Must be in docs/plans/
  if (!filePath.startsWith('docs/plans/')) {
    return {
      valid: false,
      error: 'Plan files must be in docs/plans/ directory',
    };
  }

  const filename = filePath.split('/').pop()!;

  // Skip README.md files - they're navigation, not plans
  if (filename === 'README.md') {
    return { valid: true, format: 'readme' };
  }

  const nameWithoutExt = filename.replace('.md', '');

  // Format 1: Index file
  // Pattern: {topic-name}-index.md
  const indexPattern = /^[a-z0-9-]+-index$/;
  if (indexPattern.test(nameWithoutExt)) {
    return { valid: true, format: 'index' };
  }

  // Check for P{N} pattern
  const generalPattern = /^([a-z0-9-]+)-P(\d+)(?:-(.+))?$/;
  const generalMatch = nameWithoutExt.match(generalPattern);

  if (generalMatch) {
    const [, topicName, phaseNumStr, suffix] = generalMatch;
    const phaseNum = parseInt(phaseNumStr);

    // No suffix = Phase without step
    if (!suffix) {
      return {
        valid: true,
        format: 'phase',
        metadata: { topicName, phaseNum, phaseStep: undefined },
      };
    }

    // With suffix, we need to determine if it's phase or tangent
    // Heuristic: Check if suffix matches tangent pattern (1-2 simple words without hyphens)
    // Special case: Phase 1 (P1) always uses phase format, even with simple words
    const tangentSuffixPattern = /^([a-z0-9]+)(?:-([a-z0-9]+))?$/;
    const tangentSuffixMatch = suffix.match(tangentSuffixPattern);

    // If suffix is 1-2 simple words AND phase number > 1, treat as tangent
    // Otherwise, treat as phase
    if (tangentSuffixMatch && phaseNum > 1) {
      const [, tangentName, tangentStep] = tangentSuffixMatch;
      return {
        valid: true,
        format: 'tangent',
        metadata: { topicName, phaseNum, tangentName, tangentStep },
      };
    } else {
      return {
        valid: true,
        format: 'phase',
        metadata: { topicName, phaseNum, phaseStep: suffix },
      };
    }
  }

  // Invalid format
  return {
    valid: false,
    error: `Plan filename must follow one of these formats:
- Index: {topic-name}-index.md
- Phase: {topic-name}-P{phase-number}[-{phase-step}].md
- Tangent: {topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md

Examples:
- typescript-setup-index.md
- typescript-setup-P1.md
- typescript-setup-P1-initial-config.md
- typescript-setup-P2-linting.md
- typescript-setup-P2-linting-eslint-setup.md`,
  };
}
