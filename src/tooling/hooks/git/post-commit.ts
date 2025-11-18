import { execSync } from 'child_process';
import { updateAgentsMd } from '../../updaters/agents-updater.js';
import { resetPromptMd } from '../../updaters/prompt-updater.js';
import { getDatabase } from '../../database/index.js';

export async function postCommit(): Promise<void> {
  console.log('🎣 Running post-commit updates...\n');

  const lastCommit = getLastCommit();
  const changedFiles = getChangedFiles(lastCommit);
  let filesUpdated = false;

  // 1. Update AGENTS.md if src/agents changed
  if (changedFiles.some(f => f.startsWith('src/agents/'))) {
    const updated = await updateAgentsMd();
    if (updated) filesUpdated = true;
  }

  // 2. Always reset PROMPT.md
  await resetPromptMd();
  filesUpdated = true;

  // 3. Mark recent snapshots as committed
  const commitSha = getLastCommit();
  const db = getDatabase();
  db.snapshots.markAsCommitted(commitSha);
  console.log(`✅ Marked snapshots as committed: ${commitSha.substring(0, 7)}\n`);

  // Update state
  db.state.set('last_commit', commitSha);
  db.state.set('last_commit_time', new Date().toISOString());

  // 4. Amend commit with updated files if any changed
  if (filesUpdated) {
    console.log('📦 Amending commit with updated files...');
    try {
      execSync('git add AGENTS.md PROMPT.md', { stdio: 'inherit' });
      execSync('git commit --amend --no-edit --no-verify', { stdio: 'inherit' });
      console.log('✅ Commit amended with documentation updates');
    } catch (error) {
      console.error('❌ Failed to amend commit:', error);
    }
  }

  console.log('\n✨ Post-commit complete!\n');
}

function getLastCommit(): string {
  return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
}

function getChangedFiles(commit: string): string[] {
  const output = execSync(`git diff-tree --no-commit-id --name-only -r ${commit}`, {
    encoding: 'utf-8',
  });
  return output.trim().split('\n').filter(Boolean);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  postCommit().catch(console.error);
}
