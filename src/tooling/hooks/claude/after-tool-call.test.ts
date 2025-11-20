import { describe, it, expect, vi } from 'vitest';
import { afterToolCall } from './after-tool-call.js';

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
  it('should log successful file writes', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await afterToolCall('Write', { file_path: 'test.txt' }, {});
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Created: test.txt'));
    consoleSpy.mockRestore();
  });

  it('should log successful file edits', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await afterToolCall('Edit', { file_path: 'test.txt' }, {});
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Updated: test.txt'));
    consoleSpy.mockRestore();
  });

  it('should track test failures', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await afterToolCall('Bash', { command: 'pnpm test' }, { stdout: 'FAIL some test' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Tests failed'));
    consoleSpy.mockRestore();
  });

  it('should track test passes', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await afterToolCall('Bash', { command: 'pnpm test' }, { stdout: 'PASS all tests' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Tests passed'));
    consoleSpy.mockRestore();
  });

  it('should snapshot book chapter changes', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await afterToolCall('Write', { file_path: 'books/core/chapter-01.md' }, {});

    // Verify snapshot was logged (indicating function was called)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Snapshotted'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('books/core/chapter-01.md'));
    consoleSpy.mockRestore();
  });

  it('should archive data artifacts', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await afterToolCall('Write', { file_path: 'data/output/test.json' }, {});

    // Verify artifact was archived (indicating function was called)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Archived'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('data/output/test.json'));
    consoleSpy.mockRestore();
  });

  it('should always return success', async () => {
    const result = await afterToolCall('Read', {}, {});
    expect(result.success).toBe(true);
  });
});
