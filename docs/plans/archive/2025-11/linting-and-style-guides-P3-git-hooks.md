# Linting and Style Guides - Phase 3: Git Hooks

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement git hooks (post-checkout, pre-commit, commit-msg, post-commit) with auto-updaters for documentation.

**Architecture:** Git hooks in src/tooling/hooks/git/ delegate to TypeScript implementations. Auto-updaters in src/tooling/updaters/ handle documentation synchronization.

**Tech Stack:** TypeScript, Node.js fs/child_process, git commands

---

## Task 1: Implement Post-Checkout Hook

**Files:**
- Create: `src/tooling/hooks/git/post-checkout.ts`
- Create: `src/tooling/hooks/git/index.ts`

**Step 1: Write test for post-checkout**

Create: `src/tooling/hooks/git/post-checkout.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { postCheckout } from './post-checkout.js';
import { readFile } from 'fs/promises';

vi.mock('fs/promises');

describe('postCheckout', () => {
  it('reads and displays PROMPT.md context', async () => {
    const mockPrompt = `# Project

## Context
Working on feature X

## Instructions
Implement Y`;

    vi.mocked(readFile).mockResolvedValue(mockPrompt);

    const consoleSpy = vi.spyOn(console, 'log');

    await postCheckout();

    expect(readFile).toHaveBeenCalledWith('PROMPT.md', 'utf-8');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Context'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('feature X'));
  });

  it('handles missing PROMPT.md gracefully', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));

    const consoleSpy = vi.spyOn(console, 'warn');

    await postCheckout();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PROMPT.md not found'));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @razorweave/tooling test post-checkout`
Expected: FAIL - postCheckout not defined

**Step 3: Implement post-checkout.ts**

```typescript
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
  } catch (error: any) {
    if (error.code === 'ENOENT') {
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @razorweave/tooling test post-checkout`
Expected: PASS

**Step 5: Create hooks/git/index.ts**

```typescript
export * from './post-checkout.js';
export * from './pre-commit.js';
export * from './commit-msg.js';
export * from './post-commit.js';
```

**Step 6: Build and commit**

```bash
pnpm --filter @razorweave/tooling build
git add src/tooling/hooks/
git commit -m "✨ feat(tooling): implement post-checkout hook"
```

---

## Task 2: Implement Pre-Commit Hook

**Files:**
- Create: `src/tooling/hooks/git/pre-commit.ts`
- Create: `src/tooling/scripts/run-linters.ts`

**Step 1: Create run-linters.ts**

```typescript
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
```

**Step 2: Implement pre-commit.ts**

```typescript
import { execSync } from 'child_process';
import { runLinters } from '../scripts/run-linters.js';
import { validatePlanNaming } from '../validators/plan-naming-validator.js';

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
```

**Step 3: Update scripts/index.ts**

```typescript
export * from './setup-hooks.js';
export * from './run-linters.js';
```

**Step 4: Build and commit**

```bash
pnpm --filter @razorweave/tooling build
git add src/tooling/
git commit -m "✨ feat(tooling): implement pre-commit hook with linters"
```

---

## Task 3: Implement Commit-Msg Hook

**Files:**
- Create: `src/tooling/hooks/git/commit-msg.ts`

**Step 1: Write test for commit-msg**

Create: `src/tooling/hooks/git/commit-msg.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateCommitMsg } from './commit-msg.js';

describe('validateCommitMsg', () => {
  it('validates correct commit message', () => {
    const msg = '✨ feat(agents): add content generator';
    const result = validateCommitMsg(msg);
    expect(result.valid).toBe(true);
  });

  it('rejects message without emoji', () => {
    const msg = 'feat(agents): add content generator';
    const result = validateCommitMsg(msg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('emoji');
  });

  it('rejects message with wrong emoji', () => {
    const msg = '🐛 feat(agents): add content generator';
    const result = validateCommitMsg(msg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('emoji');
  });

  it('rejects message without scope', () => {
    const msg = '✨ feat: add content generator';
    const result = validateCommitMsg(msg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('scope');
  });

  it('validates all emoji/type combinations', () => {
    const validMessages = [
      '✨ feat(agents): new feature',
      '🐛 fix(cli): bug fix',
      '📝 docs(readme): documentation',
      '♻️ refactor(shared): refactoring',
      '🎨 style(agents): formatting',
      '⚡ perf(validators): performance',
      '🔧 chore(deps): maintenance',
      '🧪 test(validators): testing',
      '🚀 release(v1.0.0): release',
      '🗑️ remove(tools): removal',
    ];

    validMessages.forEach(msg => {
      expect(validateCommitMsg(msg).valid).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @razorweave/tooling test commit-msg`
Expected: FAIL - validateCommitMsg not defined

**Step 3: Implement commit-msg.ts**

```typescript
import { readFile } from 'fs/promises';
import { ValidationResult } from '../validators/types.js';

const EMOJI_TYPE_MAP: Record<string, string> = {
  '✨': 'feat',
  '🐛': 'fix',
  '📝': 'docs',
  '♻️': 'refactor',
  '🎨': 'style',
  '⚡': 'perf',
  '🔧': 'chore',
  '🧪': 'test',
  '🚀': 'release',
  '🗑️': 'remove',
};

export function validateCommitMsg(message: string): ValidationResult {
  // Pattern: emoji type(scope): subject
  const pattern = /^(.)\s([a-z]+)\(([a-z-]+)\):\s(.+)$/;
  const match = message.match(pattern);

  if (!match) {
    return {
      valid: false,
      error: `Commit message must follow format: emoji type(scope): subject

Example: ✨ feat(agents): add content generator

Valid emojis and types:
${Object.entries(EMOJI_TYPE_MAP)
  .map(([emoji, type]) => `  ${emoji} ${type}`)
  .join('\n')}`,
    };
  }

  const [, emoji, type, scope, subject] = match;

  // Validate emoji matches type
  if (EMOJI_TYPE_MAP[emoji] !== type) {
    return {
      valid: false,
      error: `Emoji ${emoji} does not match type "${type}". Use ${
        Object.entries(EMOJI_TYPE_MAP).find(([, t]) => t === type)?.[0] || '?'
      } for ${type}`,
    };
  }

  return { valid: true };
}

export async function commitMsg(commitMsgFile: string): Promise<void> {
  const message = await readFile(commitMsgFile, 'utf-8');
  const firstLine = message.split('\n')[0];

  const result = validateCommitMsg(firstLine);

  if (!result.valid) {
    console.error('❌ Invalid commit message format\n');
    console.error(result.error);
    process.exit(1);
  }

  console.log('✅ Commit message validated');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const commitMsgFile = process.argv[2];
  if (!commitMsgFile) {
    console.error('Usage: commit-msg <commit-msg-file>');
    process.exit(1);
  }
  commitMsg(commitMsgFile).catch(console.error);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @razorweave/tooling test commit-msg`
Expected: PASS

**Step 5: Build and commit**

```bash
pnpm --filter @razorweave/tooling build
git add src/tooling/hooks/git/
git commit -m "✨ feat(tooling): implement commit-msg hook with emoji validation"
```

---

## Task 4: Implement AGENTS.md Updater

**Files:**
- Create: `src/tooling/updaters/agents-updater.ts`
- Create: `src/tooling/updaters/index.ts`

**Step 1: Implement agents-updater.ts**

```typescript
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

export async function updateAgentsMd(): Promise<boolean> {
  console.log('📝 Updating AGENTS.md...');

  try {
    // Read current AGENTS.md
    const content = await readFile('AGENTS.md', 'utf-8');

    // Get agent directories
    const agentsPath = 'src/agents';
    const agentDirs = await getDirectories(agentsPath);

    // Generate updated agent roles section
    const updatedRoles = await generateAgentRoles(agentDirs);

    // Find and replace Agent Roles section
    const agentRolesStart = content.indexOf('## Agent Roles');
    if (agentRolesStart === -1) {
      console.warn('⚠️  Could not find "## Agent Roles" section');
      return false;
    }

    // Find next ## heading or end of file
    const nextSectionMatch = content
      .substring(agentRolesStart + 15)
      .match(/\n## /);
    const agentRolesEnd = nextSectionMatch
      ? agentRolesStart + 15 + nextSectionMatch.index!
      : content.length;

    const beforeSection = content.substring(0, agentRolesStart);
    const afterSection = content.substring(agentRolesEnd);
    const updatedContent = beforeSection + updatedRoles + afterSection;

    // Only write if changed
    if (content !== updatedContent) {
      await writeFile('AGENTS.md', updatedContent);
      console.log('✅ Updated AGENTS.md');
      return true;
    }

    console.log('ℹ️  AGENTS.md already up to date');
    return false;
  } catch (error) {
    console.error('❌ Failed to update AGENTS.md:', error);
    throw error;
  }
}

async function getDirectories(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

async function generateAgentRoles(agentDirs: string[]): Promise<string> {
  let output = '## Agent Roles\n\n';

  for (const dir of agentDirs.sort()) {
    const agentName = titleCase(dir);
    const agentPath = `src/agents/${dir}`;

    output += `### ${agentName} Agents (\`${agentPath}/\`)\n`;
    output += `${getAgentDescription(dir)}\n\n`;

    // Check for README or files
    try {
      const files = await readdir(agentPath);
      const tsFiles = files.filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
      if (tsFiles.length > 0) {
        output += `**Implementation files:**\n`;
        tsFiles.forEach(f => {
          output += `- \`${f}\`\n`;
        });
        output += '\n';
      }
    } catch {
      // Directory might not exist yet
    }
  }

  return output;
}

function titleCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getAgentDescription(dir: string): string {
  const descriptions: Record<string, string> = {
    content: 'Generate or revise manuscript content for books and settings.',
    review: 'Conduct persona-based reviews of content.',
    playtest: 'Simulate or analyze play sessions.',
    pdf: 'Generate and design PDF outputs.',
    release: 'Handle publication and website updates.',
  };
  return descriptions[dir] || 'Agent implementation.';
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAgentsMd().catch(console.error);
}
```

**Step 2: Create updaters/index.ts**

```typescript
export * from './agents-updater.js';
export * from './index-updater.js';
export * from './plan-updater.js';
export * from './prompt-updater.js';
export * from './readme-updater.js';
export * from './plan-archiver.js';
```

**Step 3: Build and test**

```bash
pnpm --filter @razorweave/tooling build
pnpm --filter @razorweave/tooling exec tsx updaters/agents-updater.ts
```

Expected: AGENTS.md updated with current agent structure

**Step 4: Commit**

```bash
git add src/tooling/updaters/ AGENTS.md
git commit -m "✨ feat(tooling): implement AGENTS.md auto-updater"
```

---

## Task 5: Implement Post-Commit Hook

**Files:**
- Create: `src/tooling/hooks/git/post-commit.ts`
- Create: `src/tooling/updaters/prompt-updater.ts`

**Step 1: Implement prompt-updater.ts**

```typescript
import { writeFile } from 'fs/promises';

const PROMPT_TEMPLATE = `# Razorweave Project

## Quick Reference

This project contains all materials for creating, editing, and publishing the Razorweave TTRPG system and setting books.

### Start Here

- **For Humans**: See [README.md](README.md) for project overview and getting started
- **For Agents**: See [AGENTS.md](AGENTS.md) for agent instructions and workflows
- **Find Files**: See [INDEX.md](INDEX.md) for navigation and file locations
- **Current Status**: See [PLAN.md](PLAN.md) for project state and milestones

### Documentation

All detailed documentation is located in \`docs/\`:

- **Project Architecture**: [docs/plans/DIRECTORY_STRUCTURE.md](docs/plans/DIRECTORY_STRUCTURE.md)
- **Workflows**: [docs/workflows/END_TO_END_PIPELINE.md](docs/workflows/END_TO_END_PIPELINE.md)
- **Agentic Processes**: [docs/agents/AGENTIC_PROCESSES.md](docs/agents/AGENTIC_PROCESSES.md)
- **Style Guides**: [docs/style_guides/](docs/style_guides/)
- **Plans**: [docs/plans/](docs/plans/)

## Context

## Instructions

`;

export async function resetPromptMd(): Promise<boolean> {
  console.log('📝 Resetting PROMPT.md...');
  await writeFile('PROMPT.md', PROMPT_TEMPLATE);
  console.log('✅ Reset PROMPT.md to template');
  return true;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetPromptMd().catch(console.error);
}
```

**Step 2: Implement post-commit.ts**

```typescript
import { execSync } from 'child_process';
import { updateAgentsMd } from '../updaters/agents-updater.js';
import { resetPromptMd } from '../updaters/prompt-updater.js';

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

  // 3. Amend commit with updated files if any changed
  if (filesUpdated) {
    console.log('\n📦 Amending commit with updated files...');
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
```

**Step 3: Build and commit**

```bash
pnpm --filter @razorweave/tooling build
git add src/tooling/
git commit -m "✨ feat(tooling): implement post-commit hook with auto-updaters"
```

---

## Verification

After completing all tasks:

**Test hooks:**
```bash
# Setup hooks
pnpm setup

# Test post-checkout
git checkout -b test-branch
# Should display PROMPT.md context

# Test pre-commit (make a change first)
echo "test" >> test.txt
git add test.txt
git commit -m "test: commit"
# Should run linters and validators

# Test commit-msg
git commit --allow-empty -m "invalid message"
# Should fail

git commit --allow-empty -m "✨ feat(test): valid message"
# Should pass

# Test post-commit
# Make change to src/agents/
# Commit it
# Should auto-update AGENTS.md and PROMPT.md
```

**Phase 3 (Git Hooks) Complete!**

Next: Phase 3 (Claude Hooks) - Tangent
