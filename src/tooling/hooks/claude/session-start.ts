import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';
import { log } from '../../logging/logger.js';

export async function sessionStart(): Promise<void> {
  log.info('🚀 Razorweave Session Starting...\n');

  // 1. Read and display PROMPT.md
  await displayPromptContext();

  // 2. Show project status
  await displayProjectStatus();

  // 3. Show relevant style guides
  await displayRelevantGuides();

  log.info('\n✨ Ready to work!\n');
}

async function displayPromptContext(): Promise<void> {
  try {
    const content = await readFile('PROMPT.md', 'utf-8');

    const context = extractSection(content, '## Context');
    const instructions = extractSection(content, '## Instructions');

    log.info('📋 Session Context:');
    if (context && context.trim()) {
      log.info(context);
    } else {
      log.info('(No context set - update PROMPT.md with current focus)');
    }

    if (instructions && instructions.trim()) {
      log.info('\n📝 Active Instructions:');
      log.info(instructions);
    }
    log.info('');
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      log.warn('⚠️  PROMPT.md not found\n');
    } else {
      throw error;
    }
  }
}

async function displayProjectStatus(): Promise<void> {
  log.info('📊 Project Status:');

  // Count packages
  const packages = await glob('src/*/package.json');
  log.info(`- Packages: ${packages.length}`);

  // Count active plans
  const indexFiles = await glob('docs/plans/*-index.md');
  const activePlans = [];
  for (const file of indexFiles) {
    const content = await readFile(file, 'utf-8');
    if (!content.includes('**Status:** Completed')) {
      activePlans.push(file);
    }
  }
  log.info(`- Active Plans: ${activePlans.length}`);

  if (activePlans.length > 0) {
    log.info('\n  Active:');
    activePlans.forEach(plan => {
      const name = plan.split('/').pop()?.replace('-index.md', '');
      log.info(`  - ${name}`);
    });
  }

  log.info('');
}

async function displayRelevantGuides(): Promise<void> {
  const guides = [
    { path: 'docs/style_guides/typescript/README.md', name: 'TypeScript' },
    { path: 'docs/style_guides/book/writing-style-guide.md', name: 'Book Writing' },
    { path: 'docs/style_guides/git/commit-conventions.md', name: 'Git Conventions' },
  ];

  const existing = guides.filter(g => existsSync(g.path));

  if (existing.length > 0) {
    log.info('📚 Available Style Guides:');
    existing.forEach(g => log.info(`- ${g.name}: ${g.path}`));
  }
}

function extractSection(content: string, heading: string): string | null {
  const regex = new RegExp(`${heading}\\n([\\s\\S]*?)(?:\\n##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  sessionStart().catch((err) => log.error(err));
}
