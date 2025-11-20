import { describe, it, expect, vi } from 'vitest';
import { postCheckout } from './post-checkout.js';
import { readFile } from 'fs/promises';
import * as logger from '../../logging/logger.js';

vi.mock('fs/promises');

describe('postCheckout', () => {
  it('reads and displays PROMPT.md context', async () => {
    const mockPrompt = `# Project

## Context
Working on feature X

## Instructions
Implement Y`;

    vi.mocked(readFile).mockResolvedValue(mockPrompt);

    const logSpy = vi.spyOn(logger.log, 'info');

    await postCheckout();

    expect(readFile).toHaveBeenCalledWith('PROMPT.md', 'utf-8');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Context'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('feature X'));
  });

  it('handles missing PROMPT.md gracefully', async () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    vi.mocked(readFile).mockRejectedValue(error);

    const warnSpy = vi.spyOn(logger.log, 'warn');

    await postCheckout();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('PROMPT.md not found'));
  });
});
