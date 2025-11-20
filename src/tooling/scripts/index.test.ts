import { describe, it, expect } from 'vitest';
import { setupHooks, runLinters } from './index.js';

describe('Scripts Index', () => {
  it('should export setupHooks function', () => {
    expect(setupHooks).toBeDefined();
    expect(typeof setupHooks).toBe('function');
  });

  it('should export runLinters function', () => {
    expect(runLinters).toBeDefined();
    expect(typeof runLinters).toBe('function');
  });
});
