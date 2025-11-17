import { readFile } from 'fs/promises';
import { ValidationResult } from '../../validators/types.js';

const EMOJI_TYPE_MAP: Record<string, string> = {
  '✨': 'feat',
  '🐛': 'fix',
  '📝': 'docs',
  '♻️': 'refactor',
  '🎨': 'style',
  '⚡': 'perf',
  '🔧': 'chore',
  '🧪': 'test',
  '🚀': 'release',
  '🗑️': 'remove',
};

export function validateCommitMsg(message: string): ValidationResult {
  // Pattern: emoji type(scope): subject
  // Scope allows letters, numbers, dots, hyphens
  const pattern = /^([^\s]+)\s([a-z]+)\(([a-z0-9.-]+)\):\s(.+)$/;
  const match = message.match(pattern);

  if (!match) {
    return {
      valid: false,
      error: `Commit message must follow format: emoji type(scope): subject

Example: ✨ feat(agents): add content generator

Valid emojis and types:
${Object.entries(EMOJI_TYPE_MAP)
  .map(([emoji, type]) => `  ${emoji} ${type}`)
  .join('\n')}`,
    };
  }

  const [, emoji, type] = match;

  // Validate emoji matches type
  if (EMOJI_TYPE_MAP[emoji] !== type) {
    return {
      valid: false,
      error: `Emoji ${emoji} does not match type "${type}". Use ${
        Object.entries(EMOJI_TYPE_MAP).find(([, t]) => t === type)?.[0] || '?'
      } for ${type}`,
    };
  }

  return { valid: true };
}

export async function commitMsg(commitMsgFile: string): Promise<void> {
  const message = await readFile(commitMsgFile, 'utf-8');
  const firstLine = message.split('\n')[0];

  const result = validateCommitMsg(firstLine);

  if (!result.valid) {
    console.error('❌ Invalid commit message format\n');
    console.error(result.error);
    process.exit(1);
  }

  console.log('✅ Commit message validated');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const commitMsgFile = process.argv[2];
  if (!commitMsgFile) {
    console.error('Usage: commit-msg <commit-msg-file>');
    process.exit(1);
  }
  commitMsg(commitMsgFile).catch(console.error);
}
