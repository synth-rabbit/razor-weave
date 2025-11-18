import { execSync } from 'child_process';

export async function runLinters(files?: string[]): Promise<void> {
  console.log('🔍 Running linters...\n');

  const tsFiles = files?.filter(f => f.endsWith('.ts')) ?? [];
  const mdFiles = files?.filter(f => f.endsWith('.md')) ?? [];

  if (tsFiles.length > 0 || !files) {
    console.log('📝 Linting TypeScript...');
    try {
      // Group files by workspace
      const toolingFiles = tsFiles.filter(f => f.startsWith('src/tooling/'));
      const otherFiles = tsFiles.filter(f => !f.startsWith('src/tooling/'));

      // Lint tooling files from within the tooling workspace
      if (toolingFiles.length > 0) {
        const relativeFiles = toolingFiles.map(f => f.replace('src/tooling/', ''));
        execSync(`cd src/tooling && eslint ${relativeFiles.join(' ')}`, {
          stdio: 'inherit',
          shell: '/bin/bash',
        });
      }

      // Lint other TypeScript files from root
      if (otherFiles.length > 0 || (!files && otherFiles.length === 0 && toolingFiles.length === 0)) {
        execSync(`eslint ${!files || otherFiles.length === 0 ? 'src/**/*.ts' : otherFiles.join(' ')}`, {
          stdio: 'inherit',
        });
      }

      console.log('✅ TypeScript lint passed\n');
    } catch {
      console.error('❌ TypeScript lint failed');
      process.exit(1);
    }
  }

  if (mdFiles.length > 0 || !files) {
    console.log('📝 Linting Markdown...');
    try {
      execSync(`markdownlint-cli2 ${files ? mdFiles.join(' ') : '**/*.md'}`, {
        stdio: 'inherit',
      });
      console.log('✅ Markdown lint passed\n');
    } catch {
      console.error('❌ Markdown lint failed');
      process.exit(1);
    }
  }

  console.log('✨ All linters passed!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLinters().catch(console.error);
}
