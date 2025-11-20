# Linting and Style Guides System Design

**Date:** 2025-01-16
**Status:** Approved

## Overview

Implement comprehensive linting, formatting, validation, and style guides for the Razorweave project. This system enforces code quality, documentation standards, and automates maintenance tasks through git and Claude hooks.

## Goals

1. **Code Quality**: ESLint + Prettier for TypeScript, Markdownlint for documentation
2. **Content Validation**: Automated checking of PLAN.md, README.md, AGENTS.md, INDEX.md
3. **Style Guides**: Clear guidelines for TypeScript, book writing, docs, and git conventions
4. **Automation**: Git hooks for pre-commit validation and post-commit updates
5. **Developer Experience**: Claude hooks for context loading and prompt optimization

## Architecture

### Integrated Tooling Package Approach

All tooling lives in a dedicated workspace package:

```
src/tooling/                    @razorweave/tooling
  linters/                      (ESLint, Prettier, Markdownlint configs)
  validators/                   (Content, link, structure validators)
  hooks/
    git/                        (Git hook implementations)
    claude/                     (Claude hook implementations)
  updaters/                     (Auto-update AGENTS.md, INDEX.md, etc.)
  scripts/                      (Setup, run-linters, run-validators)
```

**Benefits:**
- All tooling in one place
- Can be built and tested like other packages
- Hooks import validators and linters
- Easier to maintain and version

**Root Integration:**
- `.husky/` - Git hooks delegate to tooling package
- `.claude/hooks/` - Claude hooks delegate to tooling package
- Config files (`.eslintrc.cjs`, etc.) import from tooling package

## Tooling Package Structure

### Package Configuration

```json
{
  "name": "@razorweave/tooling",
  "dependencies": {
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "prettier": "^3.2.4",
    "markdownlint-cli2": "^0.12.1",
    "husky": "^8.0.3",
    "@commitlint/config-conventional": "^18.6.0",
    "@razorweave/shared": "workspace:*"
  }
}
```

### Directory Organization

**Linters (`linters/`):**
- `eslint-config.ts` - TypeScript linting rules
- `prettier-config.ts` - Code formatting rules
- `markdownlint-config.ts` - Markdown linting rules

**Validators (`validators/`):**
- `content-validator.ts` - Validates PLAN.md, README.md, AGENTS.md, INDEX.md
- `link-validator.ts` - Checks internal links and anchors
- `structure-validator.ts` - Validates document structure
- `consistency-validator.ts` - Cross-reference validation
- `plan-naming-validator.ts` - Validates plan file naming

**Hooks (`hooks/`):**
- `git/` - post-checkout, pre-commit, commit-msg, post-commit
- `claude/` - session-start, before-tool-call, after-tool-call, user-prompt-submit

**Updaters (`updaters/`):**
- `agents-updater.ts` - Auto-update AGENTS.md
- `index-updater.ts` - Auto-update INDEX.md
- `plan-updater.ts` - Auto-update PLAN.md
- `prompt-updater.ts` - Reset PROMPT.md to template
- `readme-updater.ts` - Auto-update README.md
- `plan-archiver.ts` - Archive completed plans

## Style Guides Organization

### Directory Structure

```
docs/style_guides/
  typescript/                   (NEW)
    README.md                   (Best practices)
    naming-conventions.md
    code-organization.md
    testing-patterns.md

  book/                         (EXISTING - enhanced)
    writing-style-guide.md      (Migrated from source/STYLE.md)
    pdf-style-guide.md

  prose/                        (EXISTING)
  rules/                        (EXISTING)
  pdf/                          (EXISTING)

  docs/                         (NEW)
    README.md                   (Guide for /docs content)
    plan-format.md
    workflow-format.md
    agent-format.md

  git/                          (NEW)
    commit-conventions.md       (Conventional commits with emoji)
    branching-strategy.md
```

### Style Guide Migration

**source/STYLE.md → docs/style_guides/book/writing-style-guide.md**

- Extract writing quality goals (depth, character, flavor, clarity)
- Include content substantiality guidelines
- Include technical standards (front matter, dice notation)
- Keep as comprehensive guide for book writing

**Note:** `source/` directory is temporary and will be deleted once book content is integrated.

## Git Hooks Implementation

### post-checkout

**Purpose:** Display PROMPT.md context

```typescript
export async function postCheckout() {
  const prompt = await readFile('PROMPT.md')
  console.log('📋 Current Context:', extractContext(prompt))
  if (hasInstructions(prompt)) {
    console.log('📝 Active Instructions:', extractInstructions(prompt))
  }
}
```

### pre-commit

**Purpose:** Run linters, tests, and validators

```typescript
export async function preCommit() {
  const stagedFiles = await getStagedFiles()

  // 1. Run linters
  await runESLint(stagedFiles.filter(f => f.endsWith('.ts')))
  await runPrettier(stagedFiles)
  await runMarkdownlint(stagedFiles.filter(f => f.endsWith('.md')))

  // 2. Run tests
  await runTests()

  // 3. Validate style guides
  await validateStyleGuides(stagedFiles)

  // 4. Validate plan naming
  await validatePlanNaming(stagedFiles.filter(f => f.startsWith('docs/plans/')))
}
```

### commit-msg

**Purpose:** Enforce conventional commits with emoji

**Format:** `emoji type(scope): subject`

**Example:** `✨ feat(agents): add content generator`

```typescript
const EMOJI_MAP = {
  feat: '✨',      // New feature
  fix: '🐛',       // Bug fix
  docs: '📝',      // Documentation
  refactor: '♻️',  // Refactoring
  style: '🎨',     // Code style
  perf: '⚡',      // Performance
  chore: '🔧',     // Maintenance
  test: '🧪',      // Tests
  release: '🚀',   // Release
  remove: '🗑️'     // Removal
}
```

### post-commit

**Purpose:** Automatically update documentation

```typescript
export async function postCommit() {
  const lastCommit = await getLastCommit()
  let filesUpdated = false

  // Update based on what changed
  if (lastCommit.hasChanges('src/agents')) {
    await updateAgentsMd()
    filesUpdated = true
  }

  if (lastCommit.hasStructuralChanges()) {
    await updateIndexMd()
    filesUpdated = true
  }

  if (lastCommit.hasChanges('docs/plans')) {
    await updatePlanMd()
    await archiveCompletedPlans()
    filesUpdated = true
  }

  // Always reset PROMPT.md
  await resetPromptMd()
  filesUpdated = true

  if (lastCommit.hasChanges('src/*/package.json')) {
    await updateReadmeMd()
    filesUpdated = true
  }

  // Amend commit with updated files
  if (filesUpdated) {
    await gitAmend()
  }
}
```

## Claude Hooks Implementation

### SessionStart

**Purpose:** Load project context and display current status

```typescript
export async function sessionStart() {
  const prompt = await readPromptMd()
  console.log('📋 Session Context:', prompt.context)

  if (prompt.instructions) {
    console.log('📝 Active Instructions:', prompt.instructions)
  }

  const status = await getProjectStatus()
  console.log('📊 Project Status:', status)

  const guides = await findRelevantStyleGuides(prompt)
  if (guides.length > 0) {
    console.log('📚 Relevant Style Guides:', guides)
  }
}
```

### BeforeToolCall

**Purpose:** Validate operations and enforce standards

```typescript
export async function beforeToolCall(tool: string, args: any) {
  // Prevent accidental deletions
  const criticalFiles = ['AGENTS.md', 'INDEX.md', 'PLAN.md', 'README.md']
  if ((tool === 'Edit' || tool === 'Write') && criticalFiles.includes(args.file_path)) {
    console.log(`⚠️  Modifying critical file: ${args.file_path}`)
  }

  // Check style guides
  if (tool === 'Write' && args.file_path.endsWith('.md')) {
    const guide = await getRelevantStyleGuide(args.file_path)
    if (guide) console.log(`📚 Relevant style guide: ${guide}`)
  }

  // Validate plan naming
  if (tool === 'Write' && args.file_path.startsWith('docs/plans/')) {
    const isValid = validatePlanNaming(args.file_path)
    if (!isValid) {
      throw new Error('Plan filename must follow naming convention')
    }
  }

  return { allow: true }
}
```

### AfterToolCall

**Purpose:** Track changes and provide feedback

```typescript
export async function afterToolCall(tool: string, args: any, result: any) {
  if (tool === 'Write' || tool === 'Edit') {
    // Provide feedback
    if (args.file_path?.startsWith('src/')) {
      if (args.file_path.includes('package.json')) {
        console.log('📝 Package changed - INDEX.md will be updated on commit')
      }
      if (args.file_path.startsWith('src/agents/')) {
        console.log('📝 Agent changed - AGENTS.md will be updated on commit')
      }
    }

    // Check plan completion
    if (args.file_path?.startsWith('docs/plans/')) {
      const status = await getPlanStatus(args.file_path)
      if (status === 'completed') {
        console.log('✅ Plan completed - will be archived on commit')
      }
    }
  }
}
```

### UserPromptSubmit (Full Optimization)

**Purpose:** Auto-trigger workflows and optimize prompts

```typescript
export async function userPromptSubmit(prompt: string) {
  const intent = parseIntent(prompt)
  const llm = new LLMClient()

  // Detect workflow needs
  if (shouldBrainstorm(intent, prompt) || shouldWritePlan(intent, prompt)) {
    // Gather context
    const context = await gatherProjectContext()

    // Use LLM to optimize prompt
    const optimizedPrompt = await llm.complete(`
You are a prompt optimization assistant for a TTRPG project.

PROJECT CONTEXT:
${context.summary}
Packages: ${context.packages.join(', ')}
Active plans: ${context.activePlans.join(', ')}

USER'S ORIGINAL PROMPT:
"${prompt}"

TASK:
1. Clarify vague terms
2. Add relevant project context
3. Restructure to be clear and actionable
4. Frame as questions (brainstorm) or requirements (implement)

OPTIMIZED PROMPT:
`)

    // Determine skill to invoke
    const skill = shouldBrainstorm(intent, prompt)
      ? 'superpowers:brainstorming'
      : 'superpowers:writing-plans'

    console.log('🎯 Optimizing prompt for better results...')
    console.log(`📋 Auto-invoking: ${skill}`)

    return {
      optimizedPrompt: `I'm using the ${skill.split(':')[1]} skill.\n\n${optimizedPrompt}\n\nLet me proceed.`,
      autoInvoke: skill,
      metadata: { originalPrompt: prompt, contextAdded: context.summary }
    }
  }

  // Load relevant style guides
  const guides = await loadRelevantGuides(intent)
  if (guides.length > 0) {
    console.log('📚 Auto-loaded style guides:', guides)
    return {
      optimizedPrompt: `${prompt}\n\nRelevant guides: ${guides.join(', ')}`
    }
  }

  return { optimizedPrompt: prompt }
}

function shouldBrainstorm(intent: Intent, prompt: string): boolean {
  const keywords = ['design', 'brainstorm', 'how should', 'what approach',
                   'architecture', 'should i', 'explore options']
  return keywords.some(kw => prompt.toLowerCase().includes(kw)) &&
         !prompt.toLowerCase().includes('implement')
}

function shouldWritePlan(intent: Intent, prompt: string): boolean {
  const keywords = ['implement', 'build', 'create a plan', 'step by step']
  const hasDesign = intent.mentionsDesignDoc ||
                   prompt.includes('design is approved')
  return keywords.some(kw => prompt.toLowerCase().includes(kw)) && hasDesign
}
```

**Example Flow:**

```
User: "I want to create a bunch of bungles with 3 borgles"

Hook detects: Brainstorming needed

LLM optimizes to:
"I need to design a system for creating multiple entities called 'bungles',
where each contains 3 sub-components called 'borgles'.

Questions to explore:
- What are bungles/borgles in the TTRPG context?
- Are these content types or data structures?
- How do they relate to existing packages (agents, workflows)?
- What's the use case?"

Invokes: superpowers:brainstorming with optimized prompt
```

## Plan Naming Convention

### Formats

**Index file:**
- Pattern: `{topic-name}-index.md`
- Example: `typescript-setup-index.md`
- Purpose: Track plan across all phases and tangents

**Phase file:**
- Pattern: `{topic-name}-P{phase-number}[-{phase-step}].md`
- Examples:
  - `typescript-setup-P1.md`
  - `typescript-setup-P1-initial-config.md`
- Purpose: Main phase implementation

**Tangent file:**
- Pattern: `{topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md`
- Examples:
  - `typescript-setup-P2-linting.md`
  - `typescript-setup-P2-linting-eslint-setup.md`
- Purpose: Tangent from main phase

### Validation

```typescript
export function validatePlanNaming(filePath: string): ValidationResult {
  const filename = filePath.split('/').pop()!.replace('.md', '')

  // Index pattern
  if (/^[a-z0-9-]+-index$/.test(filename)) {
    return { valid: true, format: 'index' }
  }

  // Phase pattern
  const phaseMatch = filename.match(/^([a-z0-9-]+)-P(\d+)(?:-([a-z0-9-]+))?$/)
  if (phaseMatch) {
    return { valid: true, format: 'phase' }
  }

  // Tangent pattern
  const tangentMatch = filename.match(/^([a-z0-9-]+)-P(\d+)-([a-z0-9-]+)(?:-([a-z0-9-]+))?$/)
  if (tangentMatch) {
    return { valid: true, format: 'tangent' }
  }

  return { valid: false, error: 'Invalid plan naming format' }
}
```

## Linter Configurations

### ESLint (TypeScript)

```typescript
export const eslintConfig = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  rules: {
    // Enforce ESM
    'no-restricted-syntax': ['error', {
      selector: 'CallExpression[callee.name="require"]',
      message: 'Use ESM imports instead of require()'
    }],

    // Type safety
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',

    // Code quality
    'prefer-const': 'error',
    'no-var': 'error'
  }
}
```

### Prettier

```typescript
export const prettierConfig = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2
}
```

### Markdownlint

```typescript
export const markdownlintConfig = {
  'MD013': false,  // No line length (prioritize depth/clarity)
  'MD001': true,   // Heading levels increment by one
  'MD003': { style: 'atx' },
  'MD034': true,   // No bare URLs
  'MD040': true    // Fenced code blocks need language
}
```

## Content Validators

### Structure Validation

- PLAN.md must have "Current Status" and "Milestones" sections
- README.md must mention all workspace packages
- AGENTS.md must have "Agent Roles" section
- INDEX.md must have "Source Code" section

### Link Validation

- All internal links must point to existing files
- All anchor links must point to existing headings
- External URLs are skipped

### Consistency Validation

- Packages in README match actual src/ directories
- Agents in AGENTS.md match src/agents/ subdirectories
- Plans in PLAN.md have corresponding files in docs/plans/

## Auto-Updaters

### AGENTS.md

- Scan src/agents/ subdirectories
- Generate "Agent Roles" section
- Include descriptions from package.json or index.ts
- List agent files

### INDEX.md

- Scan all workspace packages
- Generate "Source Code" section
- Include package descriptions
- List subdirectories

### PLAN.md

- Find all *-index.md files in docs/plans/
- Extract status from each index
- Generate "Active Plans" section
- Exclude completed plans

### PROMPT.md

- Reset to template after every commit
- Preserve sections before "## Context"
- Clear Context and Instructions sections

### Plan Archiver

- Detect completed plans (status: completed)
- Move all related files to docs/plans/_archive/{topic}/
- Log archival action

## Setup and Installation

### Setup Script

```bash
# Run once after cloning
pnpm setup
```

**Actions:**
1. Install husky and create .husky/ directory
2. Create git hook files
3. Create .claude/hooks/ directory
4. Create Claude hook files
5. Create root config files (.eslintrc.cjs, .prettierrc.cjs, .markdownlint.json)
6. Run initial validation

### Package.json Scripts

```json
{
  "setup": "pnpm --filter @razorweave/tooling exec tsx scripts/setup-hooks.ts",
  "lint": "pnpm --filter @razorweave/tooling exec tsx scripts/run-linters.ts",
  "lint:fix": "pnpm lint --fix",
  "validate": "pnpm --filter @razorweave/tooling exec tsx scripts/run-validators.ts"
}
```

### Verification

After setup:
- ✅ `.husky/` directory with 4 hooks
- ✅ `.claude/hooks/` directory with 4 hooks
- ✅ Config files in root
- ✅ `pnpm lint` passes
- ✅ `pnpm validate` passes
- ✅ Test commit triggers all hooks

## Implementation Phases

### Phase 1: Tooling Package Setup

1. Create src/tooling/ package
2. Implement linter configurations
3. Implement validators
4. Create setup script

### Phase 2: Style Guides Migration

1. Migrate source/STYLE.md → docs/style_guides/book/writing-style-guide.md
2. Create TypeScript style guide
3. Create docs style guide
4. Create git conventions guide

### Phase 3: Hooks Implementation

**Git Hooks:**
1. Implement post-checkout
2. Implement pre-commit
3. Implement commit-msg
4. Implement post-commit
5. Implement auto-updaters

**Claude Hooks:**
1. Implement SessionStart
2. Implement BeforeToolCall
3. Implement AfterToolCall
4. Implement UserPromptSubmit with LLM optimization

## Benefits

### For Developers

- **Consistent Code Quality**: ESLint + Prettier enforce standards
- **Automated Docs**: No manual INDEX.md/AGENTS.md updates
- **Clear Guidelines**: Style guides for all content types
- **Prevented Mistakes**: Pre-commit validation catches issues
- **Better Prompts**: LLM optimization improves vague requests

### For Claude

- **Context Awareness**: SessionStart loads current state
- **Standard Enforcement**: BeforeToolCall validates operations
- **Workflow Automation**: UserPromptSubmit auto-invokes skills
- **Clear Naming**: Plan naming prevents phase confusion

### For Project

- **Documentation Freshness**: Auto-updated on every commit
- **Quality Gates**: Pre-commit prevents bad commits
- **Audit Trail**: Conventional commits with emoji
- **Organized Plans**: Index + phase + tangent system

## Future Enhancements

- CI/CD integration for validation
- VS Code extensions for real-time feedback
- Additional validators (spell check, terminology)
- Metrics tracking (doc coverage, lint violations)
- Custom markdownlint rules for TTRPG content
