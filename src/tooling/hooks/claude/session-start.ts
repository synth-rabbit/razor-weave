import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';

export async function sessionStart(): Promise<void> {
  console.log('🚀 Razorweave Session Starting...\n');

  // 1. Read and display PROMPT.md
  await displayPromptContext();

  // 2. Show project status
  await displayProjectStatus();

  // 3. Show relevant style guides
  await displayRelevantGuides();

  console.log('\n✨ Ready to work!\n');
}

async function displayPromptContext(): Promise<void> {
  try {
    const content = await readFile('PROMPT.md', 'utf-8');

    const context = extractSection(content, '## Context');
    const instructions = extractSection(content, '## Instructions');

    console.log('📋 Session Context:');
    if (context && context.trim()) {
      console.log(context);
    } else {
      console.log('(No context set - update PROMPT.md with current focus)');
    }

    if (instructions && instructions.trim()) {
      console.log('\n📝 Active Instructions:');
      console.log(instructions);
    }
    console.log('');
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.warn('⚠️  PROMPT.md not found\n');
    } else {
      throw error;
    }
  }
}

async function displayProjectStatus(): Promise<void> {
  console.log('📊 Project Status:');

  // Count packages
  const packages = await glob('src/*/package.json');
  console.log(`- Packages: ${packages.length}`);

  // Count active plans
  const indexFiles = await glob('docs/plans/*-index.md');
  const activePlans = [];
  for (const file of indexFiles) {
    const content = await readFile(file, 'utf-8');
    if (!content.includes('**Status:** Completed')) {
      activePlans.push(file);
    }
  }
  console.log(`- Active Plans: ${activePlans.length}`);

  if (activePlans.length > 0) {
    console.log('\n  Active:');
    activePlans.forEach(plan => {
      const name = plan.split('/').pop()?.replace('-index.md', '');
      console.log(`  - ${name}`);
    });
  }

  console.log('');
}

async function displayRelevantGuides(): Promise<void> {
  const guides = [
    { path: 'docs/style_guides/typescript/README.md', name: 'TypeScript' },
    { path: 'docs/style_guides/book/writing-style-guide.md', name: 'Book Writing' },
    { path: 'docs/style_guides/git/commit-conventions.md', name: 'Git Conventions' },
  ];

  const existing = guides.filter(g => existsSync(g.path));

  if (existing.length > 0) {
    console.log('📚 Available Style Guides:');
    existing.forEach(g => console.log(`- ${g.name}: ${g.path}`));
  }
}

function extractSection(content: string, heading: string): string | null {
  const regex = new RegExp(`${heading}\\n([\\s\\S]*?)(?:\\n##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  sessionStart().catch(console.error);
}
