import { describe, it, expect, vi, beforeEach } from 'vitest';
import { afterToolCall } from './after-tool-call.js';
import * as logger from '../../logging/logger.js';

// Mock the database
vi.mock('../../database/index.js', () => ({
  getDatabase: vi.fn(() => ({
    snapshots: {
      createChapterSnapshot: vi.fn(),
    },
    artifacts: {
      create: vi.fn(),
    },
  })),
}));

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => 'test content'),
}));

describe('afterToolCall', () => {
  let logSpy: ReturnType<typeof vi.spyOn<typeof logger.log, 'info'>>;

  beforeEach(() => {
    logSpy = vi.spyOn(logger.log, 'info');
  });

  it('should log successful file writes', async () => {
    await afterToolCall('Write', { file_path: 'test.txt' }, {});
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Created: test.txt'));
  });

  it('should log successful file edits', async () => {
    await afterToolCall('Edit', { file_path: 'test.txt' }, {});
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Updated: test.txt'));
  });

  it('should track test failures', async () => {
    await afterToolCall('Bash', { command: 'pnpm test' }, { stdout: 'FAIL some test' });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Tests failed'));
  });

  it('should track test passes', async () => {
    await afterToolCall('Bash', { command: 'pnpm test' }, { stdout: 'PASS all tests' });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Tests passed'));
  });

  it('should snapshot book chapter changes', async () => {
    await afterToolCall('Write', { file_path: 'books/core/chapter-01.md' }, {});

    // Verify snapshot was logged (indicating function was called)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Snapshotted'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('books/core/chapter-01.md'));
  });

  it('should archive data artifacts', async () => {
    await afterToolCall('Write', { file_path: 'data/output/test.json' }, {});

    // Verify artifact was archived (indicating function was called)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Archived'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('data/output/test.json'));
  });

  it('should always return success', async () => {
    const result = await afterToolCall('Read', {}, {});
    expect(result.success).toBe(true);
  });
});
