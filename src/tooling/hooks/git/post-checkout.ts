import { readFile } from 'fs/promises';

export async function postCheckout(): Promise<void> {
  try {
    const content = await readFile('PROMPT.md', 'utf-8');

    const context = extractSection(content, '## Context');
    const instructions = extractSection(content, '## Instructions');

    console.log('📋 Current Context:');
    if (context) {
      console.log(context);
    } else {
      console.log('(No context set)');
    }

    if (instructions) {
      console.log('\n📝 Active Instructions:');
      console.log(instructions);
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.warn('⚠️  PROMPT.md not found');
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
  postCheckout().catch(console.error);
}
