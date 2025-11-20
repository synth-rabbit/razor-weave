import { writeFile, mkdir } from 'fs/promises';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log } from '../logging/logger.js';

export async function setupHooks(): Promise<void> {
  try {
    log.info('🔧 Setting up Razorweave development environment...\n');

    // Find project root (3 levels up from this script: scripts -> tooling -> src -> root)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, '..', '..', '..');

    // 1. Install husky
    log.info('📦 Installing git hooks...');

    if (!existsSync(join(projectRoot, '.husky'))) {
      execSync('npx --prefix src/tooling husky install', { stdio: 'inherit', cwd: projectRoot });
    }

    // 2. Create git hook files
    await createGitHook(projectRoot, 'post-checkout', `#!/bin/sh
pnpm --filter @razorweave/tooling exec tsx hooks/git/post-checkout.ts
`);

    await createGitHook(projectRoot, 'pre-commit', `#!/bin/sh
pnpm --filter @razorweave/tooling exec tsx hooks/git/pre-commit.ts
`);

    await createGitHook(projectRoot, 'commit-msg', `#!/bin/sh
pnpm --filter @razorweave/tooling exec tsx hooks/git/commit-msg.ts "$1"
`);

    await createGitHook(projectRoot, 'post-commit', `#!/bin/sh
pnpm --filter @razorweave/tooling exec tsx hooks/git/post-commit.ts
`);

    log.info('✅ Git hooks installed\n');

    // 3. Create Claude hooks directory
    log.info('📦 Installing Claude hooks...');

    const claudeHooksDir = join(projectRoot, '.claude', 'hooks');
    await mkdir(claudeHooksDir, { recursive: true });

    await createClaudeHook(claudeHooksDir, 'session_start.ts', `
import { sessionStart } from '@razorweave/tooling/hooks/claude'
export default async function() { await sessionStart() }
`);

    await createClaudeHook(claudeHooksDir, 'before_tool_call.ts', `
import { beforeToolCall } from '@razorweave/tooling/hooks/claude'
export default async function(tool: string, args: unknown) {
  return await beforeToolCall(tool, args)
}
`);

    await createClaudeHook(claudeHooksDir, 'after_tool_call.ts', `
import { afterToolCall } from '@razorweave/tooling/hooks/claude'
export default async function(tool: string, args: unknown, result: unknown) {
  return await afterToolCall(tool, args, result)
}
`);

    await createClaudeHook(claudeHooksDir, 'user_prompt_submit.ts', `
import { userPromptSubmit } from '@razorweave/tooling/hooks/claude'
import { log } from '../logging/logger.js';
export default async function(prompt: string) {
  return await userPromptSubmit(prompt)
}
`);

    log.info('✅ Claude hooks installed\n');

    // 4. Create root config files
    log.info('📦 Creating configuration files...');

    await writeFile(
      join(projectRoot, '.eslintrc.cjs'),
      `module.exports = require('@razorweave/tooling/linters/eslint-config').eslintConfig;\n`
    );

    await writeFile(
      join(projectRoot, '.prettierrc.cjs'),
      `module.exports = require('@razorweave/tooling/linters/prettier-config').prettierConfig;\n`
    );

    const { markdownlintConfig } = await import('../linters/markdownlint-config.js');
    await writeFile(
      join(projectRoot, '.markdownlint.json'),
      JSON.stringify(markdownlintConfig, null, 2)
    );

    log.info('✅ Configuration files created\n');
    log.info('✨ Setup complete!\n');
    log.info('Next steps:');
    log.info('- Run `pnpm lint` to check code quality');
    log.info('- Run `pnpm validate` to check documentation');
    log.info('- Commit changes to test git hooks');
  } catch (error) {
    log.error('❌ Setup failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function createGitHook(
  projectRoot: string,
  hookName: string,
  content: string
): Promise<void> {
  const hookPath = join(projectRoot, '.husky', hookName);
  await writeFile(hookPath, content, { mode: 0o755 });
}

async function createClaudeHook(
  claudeHooksDir: string,
  filename: string,
  content: string
): Promise<void> {
  const hookPath = join(claudeHooksDir, filename);
  await writeFile(hookPath, content.trim());
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupHooks().catch((err) => log.error(err));
}
