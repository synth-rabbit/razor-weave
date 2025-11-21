import { describe, it, expect } from 'vitest';
import { validatePlanNaming } from './plan-naming-validator.js';

describe('validatePlanNaming', () => {
  it('validates index file format', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-index.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('index');
  });

  it('validates phase file format without step', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-P1.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('phase');
    expect(result.metadata?.phaseNum).toBe(1);
  });

  it('validates phase file format with step', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-P1-initial-config.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('phase');
    expect(result.metadata?.phaseNum).toBe(1);
    expect(result.metadata?.phaseStep).toBe('initial-config');
  });

  it('validates tangent file format without step', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-P2-linting.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('tangent');
    expect(result.metadata?.tangentName).toBe('linting');
  });

  it('validates tangent file format with step', () => {
    const result = validatePlanNaming('docs/plans/typescript-setup-P2-linting-eslint.md');
    expect(result.valid).toBe(true);
    expect(result.format).toBe('tangent');
    expect(result.metadata?.tangentStep).toBe('eslint');
  });

  it('rejects files not in docs/plans/', () => {
    const result = validatePlanNaming('plans/test.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('docs/plans/');
  });

  it('rejects invalid format', () => {
    const result = validatePlanNaming('docs/plans/invalid-name.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must follow one of these formats');
  });
});
