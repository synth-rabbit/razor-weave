import { describe, it, expect } from 'vitest';
import { validateLinks } from './link-validator.js';

describe('validateLinks', () => {
  it('finds no errors in valid markdown links', async () => {
    const content = '[Valid Link](./types.ts)';
    const errors = await validateLinks(content, 'validators/test.md');
    expect(errors).toHaveLength(0);
  });

  it('detects broken internal links', async () => {
    const content = '[Broken Link](./nonexistent.md)';
    const errors = await validateLinks(content, 'validators/test.md');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('link');
    expect(errors[0].message).toContain('Broken link');
  });

  it('skips external URLs', async () => {
    const content = '[External](https://example.com)';
    const errors = await validateLinks(content, 'validators/test.md');
    expect(errors).toHaveLength(0);
  });

  it('validates anchor links', async () => {
    const content = '[Anchor](./types.ts#some-heading)';
    const errors = await validateLinks(content, 'validators/test.md');
    // Will fail if anchor doesn't exist
    expect(errors[0]?.type).toBe('link');
  });
});
