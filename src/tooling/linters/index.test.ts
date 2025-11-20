import { describe, it, expect } from 'vitest';
import { eslintConfig, prettierConfig, markdownlintConfig } from './index.js';

describe('Linters Index', () => {
  it('should export eslintConfig', () => {
    expect(eslintConfig).toBeDefined();
    expect(typeof eslintConfig).toBe('object');
    expect(eslintConfig.parser).toBe('@typescript-eslint/parser');
  });

  it('should export prettierConfig', () => {
    expect(prettierConfig).toBeDefined();
    expect(typeof prettierConfig).toBe('object');
    expect(prettierConfig.semi).toBe(true);
  });

  it('should export markdownlintConfig', () => {
    expect(markdownlintConfig).toBeDefined();
    expect(typeof markdownlintConfig).toBe('object');
    expect(markdownlintConfig.MD013).toBe(false);
  });
});
