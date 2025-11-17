import { describe, it, expect, vi } from 'vitest';
import { postCheckout } from './post-checkout.js';
import { readFile } from 'fs/promises';

vi.mock('fs/promises');

describe('postCheckout', () => {
  it('reads and displays PROMPT.md context', async () => {
    const mockPrompt = `# Project

## Context
Working on feature X

## Instructions
Implement Y`;

    vi.mocked(readFile).mockResolvedValue(mockPrompt);

    const consoleSpy = vi.spyOn(console, 'log');

    await postCheckout();

    expect(readFile).toHaveBeenCalledWith('PROMPT.md', 'utf-8');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Context'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('feature X'));
  });

  it('handles missing PROMPT.md gracefully', async () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    vi.mocked(readFile).mockRejectedValue(error);

    const consoleSpy = vi.spyOn(console, 'warn');

    await postCheckout();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PROMPT.md not found'));
  });
});
