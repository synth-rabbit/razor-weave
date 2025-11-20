import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupHooks } from './setup-hooks.js';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import * as logger from '../logging/logger.js';

// Mock file system operations
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('setupHooks', () => {
  beforeEach(() => {
    vi.spyOn(logger.log, 'info').mockImplementation(() => {});
    vi.spyOn(logger.log, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create .husky directory if it does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await setupHooks();

    expect(childProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('husky install'),
      expect.any(Object)
    );
  });

  it('should skip husky install if .husky exists', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    await setupHooks();

    expect(childProcess.execSync).not.toHaveBeenCalled();
  });

  it('should create all git hook files', async () => {
    await setupHooks();

    const writeFileCalls = vi.mocked(fsPromises.writeFile).mock.calls;
    const hookFiles = writeFileCalls
      .map(call => call[0] as string)
      .filter((path) => path.includes('.husky'));

    expect(hookFiles.some((path: string) => path.includes('post-checkout'))).toBe(true);
    expect(hookFiles.some((path: string) => path.includes('pre-commit'))).toBe(true);
    expect(hookFiles.some((path: string) => path.includes('commit-msg'))).toBe(true);
    expect(hookFiles.some((path: string) => path.includes('post-commit'))).toBe(true);
  });

  it('should create Claude hooks directory', async () => {
    await setupHooks();

    expect(fsPromises.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('.claude/hooks'),
      expect.objectContaining({ recursive: true })
    );
  });

  it('should create all Claude hook files', async () => {
    await setupHooks();

    const writeFileCalls = vi.mocked(fsPromises.writeFile).mock.calls;
    const claudeFiles = writeFileCalls
      .map(call => call[0] as string)
      .filter(path => path.includes('.claude/hooks'));

    expect(claudeFiles.some(path => path.includes('session_start.ts'))).toBe(true);
    expect(claudeFiles.some(path => path.includes('before_tool_call.ts'))).toBe(true);
    expect(claudeFiles.some(path => path.includes('after_tool_call.ts'))).toBe(true);
    expect(claudeFiles.some(path => path.includes('user_prompt_submit.ts'))).toBe(true);
  });

  it('should create configuration files', async () => {
    await setupHooks();

    const writeFileCalls = vi.mocked(fsPromises.writeFile).mock.calls;
    const configFiles = writeFileCalls.map(call => call[0] as string);

    expect(configFiles.some(path => path.includes('.eslintrc.cjs'))).toBe(true);
    expect(configFiles.some(path => path.includes('.prettierrc.cjs'))).toBe(true);
    expect(configFiles.some(path => path.includes('.markdownlint.json'))).toBe(true);
  });

  it('should log success messages', async () => {
    const logSpy = vi.spyOn(logger.log, 'info');

    await setupHooks();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Setting up'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Setup complete'));
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(fsPromises.writeFile).mockRejectedValueOnce(new Error('Write failed'));
    const errorSpy = vi.spyOn(logger.log, 'error');

    await expect(setupHooks()).rejects.toThrow('Write failed');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Setup failed'),
      expect.any(String)
    );
  });
});
