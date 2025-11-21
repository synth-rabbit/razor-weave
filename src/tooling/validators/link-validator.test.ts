import { describe, it, expect } from 'vitest';
import { validateLinks } from './link-validator.js';

describe('validateLinks', () => {
  it('finds no errors in valid markdown links', async () => {
    const content = '[Valid Link](./types.ts)';
    const errors = await validateLinks(
      content,
      '/Users/pandorz/Documents/razorweave/src/tooling/validators/test.md'
    );
    expect(errors).toHaveLength(0);
  });

  it('detects broken internal links', async () => {
    const content = '[Broken Link](./nonexistent.md)';
    const errors = await validateLinks(
      content,
      '/Users/pandorz/Documents/razorweave/src/tooling/validators/test.md'
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('link');
    expect(errors[0].message).toContain('Broken link');
  });

  it('skips external URLs', async () => {
    const content = '[External](https://example.com)';
    const errors = await validateLinks(
      content,
      '/Users/pandorz/Documents/razorweave/src/tooling/validators/test.md'
    );
    expect(errors).toHaveLength(0);
  });

  it('validates anchor links', async () => {
    const content = '[Anchor](./types.ts#some-heading)';
    const errors = await validateLinks(
      content,
      '/Users/pandorz/Documents/razorweave/src/tooling/validators/test.md'
    );
    // Will fail if anchor doesn't exist
    expect(errors[0]?.type).toBe('link');
  });

  it('validates same-file anchor links', async () => {
    const content = `# Test Document
## My Section
Some content here
[Link to section](#my-section)`;
    const errors = await validateLinks(
      content,
      '/Users/pandorz/Documents/razorweave/src/tooling/validators/test.md'
    );
    expect(errors).toHaveLength(0);
  });

  it('handles anchors with special characters', async () => {
    const content = `# Test Document
## User's Guide
Some content here
[Link to guide](#users-guide)`;
    const errors = await validateLinks(
      content,
      '/Users/pandorz/Documents/razorweave/src/tooling/validators/test.md'
    );
    expect(errors).toHaveLength(0);
  });
});
