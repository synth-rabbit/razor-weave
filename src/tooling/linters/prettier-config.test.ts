import { describe, it, expect } from 'vitest';
import { prettierConfig } from './prettier-config.js';

describe('Prettier Configuration', () => {
  it('should export a valid Prettier config object', () => {
    expect(prettierConfig).toBeDefined();
    expect(typeof prettierConfig).toBe('object');
  });

  it('should use semicolons', () => {
    expect(prettierConfig.semi).toBe(true);
  });

  it('should use ES5 trailing commas', () => {
    expect(prettierConfig.trailingComma).toBe('es5');
  });

  it('should use single quotes', () => {
    expect(prettierConfig.singleQuote).toBe(true);
  });

  it('should have correct print width', () => {
    expect(prettierConfig.printWidth).toBe(100);
  });

  it('should use 2 spaces for tab width', () => {
    expect(prettierConfig.tabWidth).toBe(2);
  });

  it('should use spaces instead of tabs', () => {
    expect(prettierConfig.useTabs).toBe(false);
  });

  it('should avoid arrow function parentheses when possible', () => {
    expect(prettierConfig.arrowParens).toBe('avoid');
  });
});
