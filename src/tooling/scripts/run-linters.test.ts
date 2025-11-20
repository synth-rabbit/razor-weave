import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runLinters } from './run-linters.js';
import * as childProcess from 'child_process';
import * as logger from '../logging/logger.js';

// Mock execSync
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('runLinters', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let execSyncMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(logger.log, 'info').mockImplementation(() => {});
    vi.spyOn(logger.log, 'error').mockImplementation(() => {});
    execSyncMock = vi.spyOn(childProcess, 'execSync').mockReturnValue(Buffer.from(''));
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should run TypeScript linter when no files specified', () => {
    runLinters();

    expect(execSyncMock).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Running linters'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('All linters passed'));
  });

  it('should filter and lint only TypeScript files', () => {
    runLinters(['src/tooling/test.ts', 'docs/README.md']);

    expect(execSyncMock).toHaveBeenCalled();
    const calls = execSyncMock.mock.calls.map((call: any) => String(call[0]));
    expect(calls.some((cmd: string) => cmd.includes('eslint'))).toBe(true);
  });

  it('should filter and lint only Markdown files', () => {
    runLinters(['docs/README.md']);

    expect(execSyncMock).toHaveBeenCalled();
    const calls = execSyncMock.mock.calls.map((call: any) => String(call[0]));
    expect(calls.some((cmd: string) => cmd.includes('markdownlint'))).toBe(true);
  });

  it('should handle TypeScript lint failure', () => {
    execSyncMock.mockImplementationOnce(() => {
      throw new Error('Lint failed');
    });

    expect(() => runLinters(['test.ts'])).toThrow('process.exit(1)');
  });

  it('should handle Markdown lint failure', () => {
    execSyncMock.mockImplementationOnce(() => {
      throw new Error('Markdown lint failed');
    });

    expect(() => runLinters(['test.md'])).toThrow('process.exit(1)');
  });

  it('should lint tooling files from tooling directory', () => {
    runLinters(['src/tooling/test.ts']);

    expect(execSyncMock).toHaveBeenCalled();
    const calls = execSyncMock.mock.calls;
    expect(calls.some((args: any) => {
      const cmd = args[0] as string;
      return cmd.includes('cd') && cmd.includes('tooling');
    })).toBe(true);
  });

  it('should lint both TS and MD files when both present', () => {
    runLinters(['test.ts', 'test.md']);

    expect(execSyncMock).toHaveBeenCalled();
    const calls = execSyncMock.mock.calls.map((call: any) => String(call[0]));
    expect(calls.some((cmd: string) => cmd.includes('eslint'))).toBe(true);
    expect(calls.some((cmd: string) => cmd.includes('markdownlint'))).toBe(true);
  });
});
