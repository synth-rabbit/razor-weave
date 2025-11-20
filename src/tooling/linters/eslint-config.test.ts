import { describe, it, expect } from 'vitest';
import { eslintConfig } from './eslint-config.js';

describe('ESLint Configuration', () => {
  it('should export a valid ESLint config object', () => {
    expect(eslintConfig).toBeDefined();
    expect(typeof eslintConfig).toBe('object');
  });

  it('should use TypeScript parser', () => {
    expect(eslintConfig.parser).toBe('@typescript-eslint/parser');
  });

  it('should have correct parser options', () => {
    expect(eslintConfig.parserOptions).toBeDefined();
    expect(eslintConfig.parserOptions.ecmaVersion).toBe(2022);
    expect(eslintConfig.parserOptions.sourceType).toBe('module');
    expect(eslintConfig.parserOptions.project).toBe('./tsconfig.json');
  });

  it('should extend recommended configs', () => {
    expect(eslintConfig.extends).toContain('eslint:recommended');
    expect(eslintConfig.extends).toContain('plugin:@typescript-eslint/recommended');
    expect(eslintConfig.extends).toContain('plugin:@typescript-eslint/recommended-requiring-type-checking');
  });

  it('should enforce ESM imports (no require)', () => {
    const noRequireRule = eslintConfig.rules['no-restricted-syntax'];
    expect(noRequireRule).toBeDefined();
    expect(Array.isArray(noRequireRule)).toBe(true);
    expect(noRequireRule[0]).toBe('error');
  });

  it('should enforce strict type safety rules', () => {
    expect(eslintConfig.rules['@typescript-eslint/no-explicit-any']).toBe('error');
    expect(eslintConfig.rules['@typescript-eslint/explicit-function-return-type']).toBe('warn');
  });

  it('should enforce code quality rules', () => {
    expect(eslintConfig.rules['prefer-const']).toBe('error');
    expect(eslintConfig.rules['no-var']).toBe('error');
  });

  it('should allow console.warn and console.error', () => {
    const consoleRule = eslintConfig.rules['no-console'];
    expect(consoleRule).toBeDefined();
    expect(Array.isArray(consoleRule)).toBe(true);
    expect(consoleRule[1]).toHaveProperty('allow');
    const consoleRuleConfig = consoleRule[1] as { allow: string[] };
    expect(consoleRuleConfig.allow).toContain('warn');
    expect(consoleRuleConfig.allow).toContain('error');
  });

  it('should ignore dist and node_modules', () => {
    expect(eslintConfig.ignorePatterns).toContain('dist/');
    expect(eslintConfig.ignorePatterns).toContain('node_modules/');
  });

  it('should ignore unused vars with underscore prefix', () => {
    const unusedVarsRule = eslintConfig.rules['@typescript-eslint/no-unused-vars'];
    expect(Array.isArray(unusedVarsRule)).toBe(true);
    expect(unusedVarsRule[1]).toHaveProperty('argsIgnorePattern');
    const unusedVarsRuleConfig = unusedVarsRule[1] as { argsIgnorePattern: string };
    expect(unusedVarsRuleConfig.argsIgnorePattern).toBe('^_');
  });
});
