# Linting and Style Guides - Phase 3: Claude Hooks

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Claude hooks (SessionStart, BeforeToolCall, AfterToolCall, UserPromptSubmit) with full LLM-powered prompt optimization.

**Architecture:** Claude hooks in src/tooling/hooks/claude/ provide enhanced development experience with context loading, validation, and prompt optimization.

**Tech Stack:** TypeScript, @anthropic-ai/sdk (from @razorweave/shared), Node.js fs/path APIs

---

## Task 1: Implement SessionStart Hook

**Files:**
- Create: `src/tooling/hooks/claude/session-start.ts`
- Create: `src/tooling/hooks/claude/index.ts`

**Step 1: Implement session-start.ts**

```typescript
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
  } catch (error: any) {
    if (error.code === 'ENOENT') {
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
```

**Step 2: Create hooks/claude/index.ts**

```typescript
export * from './session-start.js';
export * from './before-tool-call.js';
export * from './after-tool-call.js';
export * from './user-prompt-submit.js';
```

**Step 3: Build and test**

```bash
pnpm --filter @razorweave/tooling build
pnpm --filter @razorweave/tooling exec tsx hooks/claude/session-start.ts
```

Expected: Displays context, project status, style guides

**Step 4: Commit**

```bash
git add src/tooling/hooks/claude/
git commit -m "✨ feat(tooling): implement SessionStart Claude hook"
```

---

## Task 2: Implement BeforeToolCall Hook

**Files:**
- Create: `src/tooling/hooks/claude/before-tool-call.ts`

**Step 1: Implement before-tool-call.ts**

```typescript
import { existsSync } from 'fs';
import { validatePlanNaming } from '../../validators/plan-naming-validator.js';

interface BeforeToolCallResult {
  allow: boolean;
  message?: string;
}

export async function beforeToolCall(
  tool: string,
  args: any
): Promise<BeforeToolCallResult> {
  // 1. Warn about critical file modifications
  if (tool === 'Edit' || tool === 'Write') {
    const criticalFiles = ['AGENTS.md', 'INDEX.md', 'PLAN.md', 'README.md'];
    const filePath = args.file_path;

    if (criticalFiles.includes(filePath)) {
      console.log(`⚠️  Modifying critical file: ${filePath}`);
      console.log('    (This file is auto-updated by post-commit hook)');
    }
  }

  // 2. Show relevant style guide for markdown files
  if (tool === 'Write' && args.file_path?.endsWith('.md')) {
    const guide = getRelevantStyleGuide(args.file_path);
    if (guide) {
      console.log(`📚 Relevant style guide: ${guide}`);
    }
  }

  // 3. Validate plan naming
  if (tool === 'Write' && args.file_path?.startsWith('docs/plans/')) {
    const result = validatePlanNaming(args.file_path);
    if (!result.valid) {
      console.error('❌ Invalid plan filename');
      console.error(result.error);
      return {
        allow: false,
        message: 'Plan filename does not follow naming convention',
      };
    }
    console.log(`✅ Plan naming validated: ${result.format}`);
  }

  // 4. Check if TypeScript file should have test
  if (tool === 'Write' && args.file_path?.endsWith('.ts') && !args.file_path.endsWith('.test.ts')) {
    const testPath = args.file_path.replace('.ts', '.test.ts');
    if (!existsSync(testPath)) {
      console.log(`💡 Consider creating test: ${testPath}`);
    }
  }

  return { allow: true };
}

function getRelevantStyleGuide(filePath: string): string | null {
  if (filePath.startsWith('docs/plans/')) {
    return 'docs/style_guides/docs/plan-format.md';
  }
  if (filePath.startsWith('docs/workflows/')) {
    return 'docs/style_guides/docs/README.md';
  }
  if (filePath.startsWith('books/') || filePath.includes('/manuscript/')) {
    return 'docs/style_guides/book/writing-style-guide.md';
  }
  if (filePath === 'README.md' || filePath.startsWith('src/')) {
    return 'docs/style_guides/docs/README.md';
  }
  return null;
}

// Note: This hook is called by Claude Code, not directly
// Export for use in .claude/hooks/before_tool_call.ts
```

**Step 2: Build and commit**

```bash
pnpm --filter @razorweave/tooling build
git add src/tooling/hooks/claude/
git commit -m "✨ feat(tooling): implement BeforeToolCall Claude hook"
```

---

## Task 3: Implement AfterToolCall Hook

**Files:**
- Create: `src/tooling/hooks/claude/after-tool-call.ts`

**Step 1: Implement after-tool-call.ts**

```typescript
export async function afterToolCall(
  tool: string,
  args: any,
  result: any
): Promise<void> {
  if (tool !== 'Write' && tool !== 'Edit') {
    return;
  }

  const filePath = args.file_path;

  // 1. Provide feedback for package.json changes
  if (filePath?.endsWith('package.json')) {
    console.log('📝 Package changed - INDEX.md will be updated on commit');
  }

  // 2. Provide feedback for agent changes
  if (filePath?.startsWith('src/agents/')) {
    console.log('📝 Agent changed - AGENTS.md will be updated on commit');
  }

  // 3. Check if plan was completed
  if (filePath?.startsWith('docs/plans/') && filePath.endsWith('-index.md')) {
    // Read the file to check status
    const fs = await import('fs/promises');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.includes('**Status:** Completed')) {
        console.log('✅ Plan completed - will be archived on commit');
      }
    } catch {
      // Ignore read errors
    }
  }

  // 4. Suggest related files
  if (filePath?.endsWith('.ts') && !filePath.endsWith('.test.ts')) {
    const testPath = filePath.replace('.ts', '.test.ts');
    console.log(`💡 Related test file: ${testPath}`);
  }
}

// Note: This hook is called by Claude Code, not directly
// Export for use in .claude/hooks/after_tool_call.ts
```

**Step 2: Build and commit**

```bash
pnpm --filter @razorweave/tooling build
git add src/tooling/hooks/claude/
git commit -m "✨ feat(tooling): implement AfterToolCall Claude hook"
```

---

## Task 4: Implement UserPromptSubmit with LLM Optimization

**Files:**
- Create: `src/tooling/hooks/claude/user-prompt-submit.ts`
- Create: `src/tooling/hooks/claude/prompt-optimizer.ts`

**Step 1: Create prompt-optimizer.ts**

```typescript
import { LLMClient } from '@razorweave/shared';
import { readFile } from 'fs/promises';
import { glob } from 'glob';

interface ProjectContext {
  summary: string;
  packages: string[];
  activePlans: string[];
  recentChanges: string;
}

export async function optimizePrompt(
  originalPrompt: string,
  context: ProjectContext
): Promise<string> {
  const llm = new LLMClient();

  const systemPrompt = `You are a prompt optimization assistant for the Razorweave TTRPG project management system.

Your task is to take vague or unclear user prompts and transform them into clear, actionable prompts with relevant context.

Guidelines:
1. Clarify vague terms and concepts
2. Add relevant project context the user may have forgotten
3. Restructure to be clear and actionable
4. If user is designing/brainstorming, frame as questions to explore
5. If user is implementing, frame with clear requirements
6. Keep the user's core intent intact
7. Be concise but complete

PROJECT CONTEXT:
${context.summary}

Current packages: ${context.packages.join(', ')}
Active plans: ${context.activePlans.join(', ') || 'None'}
Recent changes: ${context.recentChanges || 'None'}

USER'S ORIGINAL PROMPT:
"${originalPrompt}"

Provide an optimized version of this prompt that maintains the user's intent while adding clarity and context.
Respond with ONLY the optimized prompt, no preamble or explanation.`;

  try {
    const optimized = await llm.complete(systemPrompt);
    return optimized.trim();
  } catch (error) {
    console.error('Failed to optimize prompt:', error);
    // Fall back to original
    return originalPrompt;
  }
}

export async function gatherProjectContext(): Promise<ProjectContext> {
  // Get packages
  const packageFiles = await glob('src/*/package.json');
  const packages = packageFiles.map(f => {
    const parts = f.split('/');
    return parts[1]; // src/{package}/package.json
  });

  // Get active plans
  const indexFiles = await glob('docs/plans/*-index.md');
  const activePlans = [];
  for (const file of indexFiles) {
    try {
      const content = await readFile(file, 'utf-8');
      if (!content.includes('**Status:** Completed')) {
        const name = file.split('/').pop()?.replace('-index.md', '') || '';
        activePlans.push(name);
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Get recent changes
  const { execSync } = await import('child_process');
  let recentChanges = '';
  try {
    const output = execSync('git log -3 --oneline', { encoding: 'utf-8' });
    recentChanges = output.trim();
  } catch {
    recentChanges = 'Unable to read git history';
  }

  return {
    summary: `Razorweave is a TTRPG content creation system with ${packages.length} workspace packages.`,
    packages,
    activePlans,
    recentChanges,
  };
}
```

**Step 2: Create user-prompt-submit.ts**

```typescript
import { optimizePrompt, gatherProjectContext } from './prompt-optimizer.js';
import { existsSync } from 'fs';

interface UserPromptResult {
  optimizedPrompt: string;
  autoInvoke?: string;
  metadata?: Record<string, any>;
}

export async function userPromptSubmit(prompt: string): Promise<UserPromptResult> {
  const intent = parseIntent(prompt);

  // 1. Detect if brainstorming/planning is needed
  if (shouldBrainstorm(intent, prompt)) {
    console.log('🧠 Detected design/planning request');
    console.log('🎯 Optimizing prompt and invoking brainstorming skill...\n');

    const context = await gatherProjectContext();
    const optimized = await optimizePrompt(prompt, context);

    return {
      optimizedPrompt: `I'm using the brainstorming skill to refine this idea.

${optimized}

Let me start by asking questions to understand what you're building.`,
      autoInvoke: 'superpowers:brainstorming',
      metadata: {
        originalPrompt: prompt,
        contextAdded: context.summary,
      },
    };
  }

  // 2. Detect if implementation plan is needed
  if (shouldWritePlan(intent, prompt)) {
    console.log('📋 Detected implementation request');
    console.log('🎯 Optimizing prompt and invoking writing-plans skill...\n');

    const context = await gatherProjectContext();
    const optimized = await optimizePrompt(prompt, context);

    return {
      optimizedPrompt: `I'm using the writing-plans skill to create a detailed implementation plan.

${optimized}

Let me create a comprehensive plan with exact file paths and code examples.`,
      autoInvoke: 'superpowers:writing-plans',
      metadata: {
        originalPrompt: prompt,
        contextAdded: context.summary,
      },
    };
  }

  // 3. For non-workflow prompts, load relevant style guides
  const guides = await loadRelevantGuides(intent);
  if (guides.length > 0) {
    console.log('📚 Auto-loaded style guides:');
    guides.forEach(g => console.log(`- ${g}`));
    console.log('');

    return {
      optimizedPrompt: `${prompt}

Note: Relevant style guides are available:
${guides.map(g => `- ${g}`).join('\n')}`,
    };
  }

  // 4. No optimization needed
  return { optimizedPrompt: prompt };
}

interface Intent {
  keywords: string[];
  isDesigning: boolean;
  isImplementing: boolean;
  mentionsDesignDoc: boolean;
}

function parseIntent(prompt: string): Intent {
  const lower = prompt.toLowerCase();
  const keywords = extractKeywords(lower);

  return {
    keywords,
    isDesigning: keywords.some(kw =>
      ['design', 'brainstorm', 'architecture', 'approach', 'how should'].includes(kw)
    ),
    isImplementing: keywords.some(kw =>
      ['implement', 'build', 'create', 'write code'].includes(kw)
    ),
    mentionsDesignDoc: lower.includes('design') && (lower.includes('approved') || lower.includes('ready')),
  };
}

function extractKeywords(text: string): string[] {
  const keywordPhrases = [
    'how should', 'what approach', 'design', 'brainstorm', 'architecture',
    'implement', 'build', 'create', 'write code', 'add feature',
  ];

  return keywordPhrases.filter(phrase => text.includes(phrase));
}

function shouldBrainstorm(intent: Intent, prompt: string): boolean {
  const lower = prompt.toLowerCase();

  // Brainstorm keywords
  const brainstormKeywords = [
    'design', 'brainstorm', 'how should', 'what approach',
    'architecture', 'should i', 'explore options', 'what\'s the best way',
  ];

  const hasBrainstormIntent = brainstormKeywords.some(kw => lower.includes(kw));

  // Don't brainstorm if already implementing
  const notImplementing = !lower.includes('implement') &&
                         !lower.includes('write the code') &&
                         !lower.includes('create the');

  return hasBrainstormIntent && notImplementing;
}

function shouldWritePlan(intent: Intent, prompt: string): boolean {
  const lower = prompt.toLowerCase();

  // Plan keywords
  const planKeywords = [
    'implement', 'build', 'create a plan',
    'step by step', 'detailed plan', 'how do i implement',
  ];

  const hasPlanIntent = planKeywords.some(kw => lower.includes(kw));

  // Check if design exists or is referenced
  const hasDesign = intent.mentionsDesignDoc ||
                   lower.includes('design is approved') ||
                   lower.includes('ready to implement') ||
                   lower.includes('from the design');

  return hasPlanIntent && hasDesign;
}

async function loadRelevantGuides(intent: Intent): Promise<string[]> {
  const guides: string[] = [];

  // TypeScript guide for code tasks
  if (intent.keywords.some(kw => ['implement', 'code', 'typescript'].includes(kw))) {
    if (existsSync('docs/style_guides/typescript/README.md')) {
      guides.push('docs/style_guides/typescript/README.md');
    }
  }

  // Book writing guide for content tasks
  if (intent.keywords.some(kw => ['write', 'content', 'book', 'chapter'].includes(kw))) {
    if (existsSync('docs/style_guides/book/writing-style-guide.md')) {
      guides.push('docs/style_guides/book/writing-style-guide.md');
    }
  }

  // Plan guide for planning tasks
  if (intent.keywords.some(kw => ['plan', 'design'].includes(kw))) {
    if (existsSync('docs/style_guides/docs/plan-format.md')) {
      guides.push('docs/style_guides/docs/plan-format.md');
    }
  }

  return guides;
}

// Note: This hook is called by Claude Code, not directly
// Export for use in .claude/hooks/user_prompt_submit.ts
```

**Step 3: Build and test**

```bash
pnpm --filter @razorweave/tooling build
```

**Step 4: Commit**

```bash
git add src/tooling/hooks/claude/
git commit -m "✨ feat(tooling): implement UserPromptSubmit with LLM optimization"
```

---

## Task 5: Update Setup Script for Claude Hooks

**Files:**
- Modify: `src/tooling/scripts/setup-hooks.ts`

**Step 1: Verify Claude hooks creation**

The setup script already creates Claude hooks. Verify they delegate correctly to tooling package:

Check `.claude/hooks/user_prompt_submit.ts` after running `pnpm setup`:

```typescript
import { userPromptSubmit } from '@razorweave/tooling/hooks/claude'
export default async function(prompt: string) {
  return await userPromptSubmit(prompt)
}
```

**Step 2: Test the setup**

```bash
# Run setup
pnpm setup

# Verify Claude hooks created
ls -la .claude/hooks/

# Should see:
# - session_start.ts
# - before_tool_call.ts
# - after_tool_call.ts
# - user_prompt_submit.ts
```

**Step 3: Verify hooks work**

Create test scenario:

```bash
# Start new Claude session
# Should trigger SessionStart hook
# Should display context, project status, guides

# Try vague prompt:
# "I want to create a bunch of validation rules"
# Should trigger UserPromptSubmit
# Should optimize prompt
# Should invoke brainstorming skill
```

---

## Verification

After completing all tasks:

**Test SessionStart:**
- Start new Claude session
- Should display PROMPT.md context
- Should show project status
- Should list style guides

**Test BeforeToolCall:**
- Try to write AGENTS.md → Should warn it's auto-updated
- Try to write invalid plan name → Should reject
- Try to write markdown → Should show relevant guide

**Test AfterToolCall:**
- Edit src/agents/content/index.ts → Should note AGENTS.md will update
- Edit package.json → Should note INDEX.md will update

**Test UserPromptSubmit:**
- Type: "How should I structure the validators?" → Should invoke brainstorming
- Type: "Implement the link validator from the design" → Should invoke writing-plans
- Type: "Fix typo in README" → Should proceed normally

**Phase 3 (Claude Hooks) Complete!**

All implementation plans finished!
