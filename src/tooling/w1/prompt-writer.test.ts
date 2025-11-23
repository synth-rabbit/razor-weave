import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { W1PromptWriter } from './prompt-writer.js';

describe('W1PromptWriter', () => {
  const testRunId = 'wfrun_test_writer';
  const testPromptsDir = `data/w1-prompts/${testRunId}`;
  let writer: W1PromptWriter;

  beforeEach(() => {
    writer = new W1PromptWriter({ runId: testRunId });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testPromptsDir)) {
      rmSync(testPromptsDir, { recursive: true });
    }
  });

  describe('writeSharedContext', () => {
    it('writes shared context to correct path', () => {
      const content = '# Test Shared Context\nThis is test content.';
      const path = writer.writeSharedContext(content);

      expect(path).toContain('shared-context.md');
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, 'utf-8')).toBe(content);
    });

    it('creates directory if it does not exist', () => {
      const content = '# Test';
      const path = writer.writeSharedContext(content);

      expect(existsSync(testPromptsDir)).toBe(true);
      expect(existsSync(path)).toBe(true);
    });
  });
});
