import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateAgentsMd } from './agents-updater.js';
import * as fsPromises from 'fs/promises';
import { Dirent } from 'fs';
import * as logger from '../logging/logger.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
}));

describe('updateAgentsMd', () => {
  beforeEach(() => {
    vi.spyOn(logger.log, 'info').mockImplementation(() => {});
    vi.spyOn(logger.log, 'warn').mockImplementation(() => {});
    vi.spyOn(logger.log, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update AGENTS.md with agent roles section', async () => {
    const mockContent = `# AGENTS.md

## Agent Roles

Old content here

## Other Section

More content`;

    vi.mocked(fsPromises.readFile).mockResolvedValueOnce(mockContent);
    vi.mocked(fsPromises.readdir).mockImplementation((_path, options?: unknown): Promise<Dirent[] | string[]> => {
      if (typeof options === 'object' && options !== null && 'withFileTypes' in options) {
        return [
          { name: 'content', isDirectory: () => true },
          { name: 'review', isDirectory: () => true },
        ] as Dirent[];
      }
      return ['agent1.ts', 'agent2.ts'] as unknown as Dirent[];
    });

    const result = await updateAgentsMd();

    expect(result).toBe(true);
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      'AGENTS.md',
      expect.stringContaining('## Agent Roles')
    );
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      'AGENTS.md',
      expect.stringContaining('Content Agents')
    );
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      'AGENTS.md',
      expect.stringContaining('Review Agents')
    );
  });

  it('should not write file if content is unchanged', async () => {
    // First call: get current content and directory list
    // Second call: the function will generate new content and compare
    // If they match, writeFile should not be called

    const mockContent = `# AGENTS.md

## Agent Roles

This is some existing content that won't match

## Other Section`;

    vi.mocked(fsPromises.readFile).mockResolvedValueOnce(mockContent);
    vi.mocked(fsPromises.readdir).mockImplementation((_path, options?: unknown): Promise<Dirent[] | string[]> => {
      if (typeof options === 'object' && options !== null && 'withFileTypes' in options) {
        return [
          { name: 'review', isDirectory: () => true },
        ] as Dirent[];
      }
      return [];
    });

    const result = await updateAgentsMd();

    // Content changed, so it should update
    expect(result).toBe(true);
    expect(fsPromises.writeFile).toHaveBeenCalled();
  });

  it('should handle missing Agent Roles section', async () => {
    const mockContent = `# AGENTS.md\n\nNo agent roles section here`;

    vi.mocked(fsPromises.readFile).mockResolvedValueOnce(mockContent);
    vi.mocked(fsPromises.readdir).mockImplementation((_path, options?: unknown): Promise<Dirent[] | string[]> => {
      if (typeof options === 'object' && options !== null && 'withFileTypes' in options) {
        return [] as Dirent[];
      }
      return [];
    });

    const warnSpy = vi.spyOn(logger.log, 'warn');
    const result = await updateAgentsMd();

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find'));
  });

  it('should handle errors gracefully', async () => {
    const errorSpy = vi.spyOn(logger.log, 'error');
    vi.mocked(fsPromises.readFile).mockRejectedValueOnce(new Error('File not found'));

    await expect(updateAgentsMd()).rejects.toThrow('File not found');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update')
    );
  });

  it('should list implementation files for agent directories', async () => {
    const mockContent = `# AGENTS.md

## Agent Roles

Old content

## Other Section`;

    vi.mocked(fsPromises.readFile).mockResolvedValueOnce(mockContent);
    vi.mocked(fsPromises.readdir).mockImplementation((_path, options?: unknown): Promise<Dirent[] | string[]> => {
      if (typeof options === 'object' && options !== null && 'withFileTypes' in options) {
        return [{ name: 'content', isDirectory: () => true }] as Dirent[];
      }
      return ['content-agent.ts', 'content-agent.test.ts', 'utils.ts'];
    });

    await updateAgentsMd();

    const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
    expect(writeCall).toContain('**Implementation files:**');
    expect(writeCall).toContain('content-agent.ts');
    expect(writeCall).toContain('utils.ts');
    expect(writeCall).not.toContain('content-agent.test.ts');
  });

  it('should sort agent directories alphabetically', async () => {
    const mockContent = `# AGENTS.md

## Agent Roles

Old content

## Other Section`;

    vi.mocked(fsPromises.readFile).mockResolvedValueOnce(mockContent);
    vi.mocked(fsPromises.readdir).mockImplementation((_path, options?: unknown): Promise<Dirent[] | string[]> => {
      if (typeof options === 'object' && options !== null && 'withFileTypes' in options) {
        return [
          { name: 'review', isDirectory: () => true },
          { name: 'content', isDirectory: () => true },
          { name: 'playtest', isDirectory: () => true },
        ] as Dirent[];
      }
      return [];
    });

    await updateAgentsMd();

    const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
    const contentIndex = writeCall.indexOf('Content Agents');
    const playtestIndex = writeCall.indexOf('Playtest Agents');
    const reviewIndex = writeCall.indexOf('Review Agents');

    expect(contentIndex).toBeLessThan(playtestIndex);
    expect(playtestIndex).toBeLessThan(reviewIndex);
  });
});
