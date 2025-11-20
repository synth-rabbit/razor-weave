/* eslint-disable no-console */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { log } from '../logging/logger.js';

// Get the repository root (3 levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../..');

export function runLinters(files?: string[]): void {
  log.info('🔍 Running linters...\n');

  const tsFiles = files?.filter(f => f.endsWith('.ts')) ?? [];
  const mdFiles = files?.filter(f => f.endsWith('.md')) ?? [];

  if (tsFiles.length > 0 || !files) {
    log.info('📝 Linting TypeScript...');
    try {
      // Group files by workspace
      const toolingFiles = tsFiles.filter(f => f.startsWith('src/tooling/'));
      const otherFiles = tsFiles.filter(f => !f.startsWith('src/tooling/'));

      // Lint tooling files from within the tooling workspace
      if (toolingFiles.length > 0) {
        const relativeFiles = toolingFiles.map(f => f.replace('src/tooling/', ''));
        const toolingDir = resolve(repoRoot, 'src/tooling');
        execSync(`cd "${toolingDir}" && eslint ${relativeFiles.join(' ')}`, {
          stdio: 'inherit',
          shell: '/bin/bash',
        });
      }

      // Lint other TypeScript files from root
      if (otherFiles.length > 0 || (!files && otherFiles.length === 0 && toolingFiles.length === 0)) {
        execSync(`eslint ${!files || otherFiles.length === 0 ? 'src/**/*.ts' : otherFiles.join(' ')}`, {
          stdio: 'inherit',
          cwd: repoRoot,
        });
      }

      log.info('✅ TypeScript lint passed\n');
    } catch {
      log.error('❌ TypeScript lint failed');
      process.exit(1);
    }
  }

  if (mdFiles.length > 0 || !files) {
    log.info('📝 Linting Markdown...');
    try {
      execSync(`markdownlint-cli2 ${files ? mdFiles.join(' ') : '**/*.md'}`, {
        stdio: 'inherit',
      });
      log.info('✅ Markdown lint passed\n');
    } catch {
      log.error('❌ Markdown lint failed');
      process.exit(1);
    }
  }

  log.info('✨ All linters passed!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLinters();
}
