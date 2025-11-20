import { describe, it, expect } from 'vitest';
import { markdownlintConfig } from './markdownlint-config.js';

describe('Markdownlint Configuration', () => {
  it('should export a valid markdownlint config object', () => {
    expect(markdownlintConfig).toBeDefined();
    expect(typeof markdownlintConfig).toBe('object');
  });

  it('should disable line length rule (MD013)', () => {
    expect(markdownlintConfig.MD013).toBe(false);
  });

  it('should enforce heading structure rules', () => {
    expect(markdownlintConfig.MD001).toBe(true); // Heading levels increment by one
    expect(markdownlintConfig.MD003).toEqual({ style: 'atx' }); // Use # style headings
  });

  it('should enforce list consistency rules', () => {
    expect(markdownlintConfig.MD004).toEqual({ style: 'dash' }); // Use - for unordered lists
    expect(markdownlintConfig.MD007).toEqual({ indent: 2 }); // Unordered list indentation
  });

  it('should enforce link/image consistency', () => {
    expect(markdownlintConfig.MD034).toBe(true); // No bare URLs
    expect(markdownlintConfig.MD052).toBe(true); // Reference links should have labels
  });

  it('should enforce code block language specification', () => {
    expect(markdownlintConfig.MD040).toBe(true); // Fenced code blocks should have language
  });
});
