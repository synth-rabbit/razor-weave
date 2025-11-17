import { describe, it, expect } from 'vitest';
import { validateCommitMsg } from './commit-msg.js';

describe('validateCommitMsg', () => {
  it('validates correct commit message', () => {
    const msg = '✨ feat(agents): add content generator';
    const result = validateCommitMsg(msg);
    expect(result.valid).toBe(true);
  });

  it('rejects message without emoji', () => {
    const msg = 'feat(agents): add content generator';
    const result = validateCommitMsg(msg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('emoji');
  });

  it('rejects message with wrong emoji', () => {
    const msg = '🐛 feat(agents): add content generator';
    const result = validateCommitMsg(msg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Emoji');
  });

  it('rejects message without scope', () => {
    const msg = '✨ feat: add content generator';
    const result = validateCommitMsg(msg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('scope');
  });

  it('validates all emoji/type combinations', () => {
    const validMessages = [
      '✨ feat(agents): new feature',
      '🐛 fix(cli): bug fix',
      '📝 docs(readme): documentation',
      '♻️ refactor(shared): refactoring',
      '🎨 style(agents): formatting',
      '⚡ perf(validators): performance',
      '🔧 chore(deps): maintenance',
      '🧪 test(validators): testing',
      '🚀 release(v1.0.0): release',
      '🗑️ remove(tools): removal',
    ];

    validMessages.forEach(msg => {
      expect(validateCommitMsg(msg).valid).toBe(true);
    });
  });
});
