import { describe, it, expect, vi, beforeEach } from 'vitest';
import { beforeToolCall } from './before-tool-call.js';

// Mock the file system
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

// Mock the validator
vi.mock('../../validators/plan-naming-validator.js', () => ({
  validatePlanNaming: vi.fn(),
}));

describe('beforeToolCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow non-critical operations', async () => {
    const result = await beforeToolCall('Read', { file_path: 'src/index.ts' });
    expect(result.allow).toBe(true);
  });

  it('should warn about critical file modifications', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await beforeToolCall('Edit', { file_path: 'AGENTS.md' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Modifying critical file'));
    consoleSpy.mockRestore();
  });

  it('should validate plan naming for plan files', async () => {
    const { validatePlanNaming } = await import('../../validators/plan-naming-validator.js');
    (validatePlanNaming as any).mockReturnValue({ valid: true, format: 'index' });

    const result = await beforeToolCall('Write', { file_path: 'docs/plans/test-index.md' });
    expect(result.allow).toBe(true);
    expect(validatePlanNaming).toHaveBeenCalledWith('docs/plans/test-index.md');
  });

  it('should block invalid plan names', async () => {
    const { validatePlanNaming } = await import('../../validators/plan-naming-validator.js');
    (validatePlanNaming as any).mockReturnValue({
      valid: false,
      error: 'Invalid name'
    });

    const result = await beforeToolCall('Write', { file_path: 'docs/plans/bad-name.md' });
    expect(result.allow).toBe(false);
    expect(result.message).toContain('Plan filename does not follow naming convention');
  });

  it('should suggest tests for new TypeScript files', async () => {
    const { existsSync } = await import('fs');
    (existsSync as any).mockReturnValue(false);

    const consoleSpy = vi.spyOn(console, 'log');
    await beforeToolCall('Write', { file_path: 'src/new-file.ts' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Consider creating test'));
    consoleSpy.mockRestore();
  });

  it('should show style guide for markdown files', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await beforeToolCall('Write', { file_path: 'docs/plans/new-plan-index.md' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Relevant style guide'));
    consoleSpy.mockRestore();
  });
});
