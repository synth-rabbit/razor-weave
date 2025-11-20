import { describe, it, expect } from 'vitest';
import { updateAgentsMd, resetPromptMd } from './index.js';

describe('Updaters Index', () => {
  it('should export updateAgentsMd function', () => {
    expect(updateAgentsMd).toBeDefined();
    expect(typeof updateAgentsMd).toBe('function');
  });

  it('should export resetPromptMd function', () => {
    expect(resetPromptMd).toBeDefined();
    expect(typeof resetPromptMd).toBe('function');
  });
});
