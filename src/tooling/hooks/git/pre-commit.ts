import { execSync } from 'child_process';
import { runLinters } from '../../scripts/run-linters.js';
import { validatePlanNaming } from '../../validators/plan-naming-validator.js';
import { getDatabase } from '../../database/index.js';
import { log } from '../../logging/logger.js';

export async function preCommit(): Promise<void> {
  log.info('🎣 Running pre-commit checks...\n');

  // 1. Get staged files
  const stagedFiles = getStagedFiles();

  // 2. Run linters on staged files
  await runLinters(stagedFiles);

  // 3. Run tests
  log.info('🧪 Running tests...');
  try {
    execSync('pnpm test', { stdio: 'inherit' });
    log.info('✅ Tests passed\n');
  } catch {
    log.error('❌ Tests failed');
    process.exit(1);
  }

  // 4. Validate plan naming
  const planFiles = stagedFiles.filter(f => f.startsWith('docs/plans/') && f.endsWith('.md'));
  if (planFiles.length > 0) {
    log.info('📋 Validating plan naming...');
    for (const file of planFiles) {
      const result = validatePlanNaming(file);
      if (!result.valid) {
        log.error(`❌ Invalid plan name: ${file}`);
        log.error(result.error);
        process.exit(1);
      }
    }
    log.info('✅ Plan naming validated\n');
  }

  // 5. Snapshot staged book files before commit
  const bookFiles = stagedFiles.filter(f =>
    f.startsWith('books/') && f.endsWith('.md')
  );

  if (bookFiles.length > 0) {
    log.info('📸 Creating pre-commit snapshots...');
    const db = getDatabase();

    for (const file of bookFiles) {
      try {
        await db.snapshots.createChapterSnapshot(file, 'git');
        log.info(`  ✓ ${file}`);
      } catch (error) {
        log.error(`  ✗ ${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    log.info('');
  }

  log.info('✨ All pre-commit checks passed!\n');
}

function getStagedFiles(): string[] {
  const output = execSync('git diff --cached --name-only', {
    encoding: 'utf-8',
  });
  return output.trim().split('\n').filter(Boolean);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  preCommit().catch((err) => log.error(err));
}
