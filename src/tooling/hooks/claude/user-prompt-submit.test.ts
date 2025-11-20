import { describe, it, expect } from 'vitest';
import { userPromptSubmit } from './user-prompt-submit.js';

describe('userPromptSubmit', () => {
  it('should return the prompt unchanged', async () => {
    const prompt = 'Test prompt';
    const result = await userPromptSubmit(prompt);

    expect(result.prompt).toBe(prompt);
    expect(result.modified).toBe(false);
  });

  it('should handle empty prompts', async () => {
    const result = await userPromptSubmit('');

    expect(result.prompt).toBe('');
    expect(result.modified).toBe(false);
  });

  it('should handle complex prompts', async () => {
    const prompt = 'Create a new feature\nwith multiple lines\nand special characters: !@#$%';
    const result = await userPromptSubmit(prompt);

    expect(result.prompt).toBe(prompt);
    expect(result.modified).toBe(false);
  });
});
