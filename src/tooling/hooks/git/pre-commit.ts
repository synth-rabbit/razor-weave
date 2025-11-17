import { execSync } from 'child_process';
import { runLinters } from '../../scripts/run-linters.js';
import { validatePlanNaming } from '../../validators/plan-naming-validator.js';

export async function preCommit(): Promise<void> {
  console.log('🎣 Running pre-commit checks...\n');

  // 1. Get staged files
  const stagedFiles = getStagedFiles();

  // 2. Run linters on staged files
  await runLinters(stagedFiles);

  // 3. Run tests
  console.log('🧪 Running tests...');
  try {
    execSync('pnpm test', { stdio: 'inherit' });
    console.log('✅ Tests passed\n');
  } catch {
    console.error('❌ Tests failed');
    process.exit(1);
  }

  // 4. Validate plan naming
  const planFiles = stagedFiles.filter(f => f.startsWith('docs/plans/') && f.endsWith('.md'));
  if (planFiles.length > 0) {
    console.log('📋 Validating plan naming...');
    for (const file of planFiles) {
      const result = validatePlanNaming(file);
      if (!result.valid) {
        console.error(`❌ Invalid plan name: ${file}`);
        console.error(result.error);
        process.exit(1);
      }
    }
    console.log('✅ Plan naming validated\n');
  }

  console.log('✨ All pre-commit checks passed!\n');
}

function getStagedFiles(): string[] {
  const output = execSync('git diff --cached --name-only', {
    encoding: 'utf-8',
  });
  return output.trim().split('\n').filter(Boolean);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  preCommit().catch(console.error);
}
