import { readFile } from 'fs/promises';
import { log } from '../../logging/logger.js';

export async function postCheckout(): Promise<void> {
  try {
    const content = await readFile('PROMPT.md', 'utf-8');

    const context = extractSection(content, '## Context');
    const instructions = extractSection(content, '## Instructions');

    log.info('📋 Current Context:');
    if (context) {
      log.info(context);
    } else {
      log.info('(No context set)');
    }

    if (instructions) {
      log.info('\n📝 Active Instructions:');
      log.info(instructions);
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      log.warn('⚠️  PROMPT.md not found');
    } else {
      throw error;
    }
  }
}

function extractSection(content: string, heading: string): string | null {
  const regex = new RegExp(`${heading}\\n([\\s\\S]*?)(?:\\n##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  postCheckout().catch((err) => log.error(err));
}
