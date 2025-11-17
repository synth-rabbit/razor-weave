import { execSync } from 'child_process';

export async function runLinters(files?: string[]): Promise<void> {
  console.log('🔍 Running linters...\n');

  const tsFiles = files?.filter(f => f.endsWith('.ts')) ?? [];
  const mdFiles = files?.filter(f => f.endsWith('.md')) ?? [];

  if (tsFiles.length > 0 || !files) {
    console.log('📝 Linting TypeScript...');
    try {
      execSync(`eslint ${files ? tsFiles.join(' ') : 'src/**/*.ts'}`, {
        stdio: 'inherit',
      });
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
