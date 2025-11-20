import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetPromptMd } from './prompt-updater.js';
import * as fsPromises from 'fs/promises';
import * as logger from '../logging/logger.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('resetPromptMd', () => {
  beforeEach(() => {
    vi.spyOn(logger.log, 'info').mockImplementation(() => {});
    vi.spyOn(logger.log, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reset PROMPT.md to template', async () => {
    const result = await resetPromptMd();

    expect(result).toBe(true);
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      'PROMPT.md',
      expect.stringContaining('# Razorweave Project')
    );
  });

  it('should include Quick Reference section', async () => {
    await resetPromptMd();

    const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
    expect(writeCall).toContain('## Quick Reference');
    expect(writeCall).toContain('### Start Here');
  });

  it('should include links to key files', async () => {
    await resetPromptMd();

    const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
    expect(writeCall).toContain('README.md');
    expect(writeCall).toContain('AGENTS.md');
    expect(writeCall).toContain('INDEX.md');
    expect(writeCall).toContain('PLAN.md');
  });

  it('should include Context and Instructions sections', async () => {
    await resetPromptMd();

    const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
    expect(writeCall).toContain('## Context');
    expect(writeCall).toContain('## Instructions');
  });

  it('should log success message', async () => {
    const logSpy = vi.spyOn(logger.log, 'info');

    await resetPromptMd();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Resetting PROMPT.md'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Reset PROMPT.md to template'));
  });

  it('should handle write errors', async () => {
    vi.mocked(fsPromises.writeFile).mockRejectedValueOnce(new Error('Permission denied'));

    await expect(resetPromptMd()).rejects.toThrow('Permission denied');
  });
});
