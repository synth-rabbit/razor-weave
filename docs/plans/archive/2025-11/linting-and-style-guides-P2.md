# Linting and Style Guides - Phase 2: Style Guides Migration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate source/STYLE.md to docs/style_guides/ and create new style guides for TypeScript, docs content, and git conventions.

**Architecture:** Organize style guides by purpose in docs/style_guides/ subdirectories. Each guide is self-contained markdown documentation.

**Tech Stack:** Markdown documentation

---

## Task 1: Migrate Book Writing Style Guide

**Files:**
- Read: `source/STYLE.md`
- Create: `docs/style_guides/book/writing-style-guide.md`

**Step 1: Read source/STYLE.md**

Run: `cat source/STYLE.md`

Review the content structure:
- Writing Quality Goals
- Content Substantiality
- Technical Standards

**Step 2: Create writing-style-guide.md**

```markdown
# Book Writing Style Guide

This guide defines the standards for writing Razorweave TTRPG books, including the core rulebook and setting books.

## Writing Quality Goals

**Depth, character, flavor, and clarity** are the pillars of our writing quality:

- **Depth**: Go beyond surface-level explanations. Provide context, implications, tactical considerations, and edge cases. Don't just tell readers *what* a rule does—explain *why* it exists, *when* to use it, and *how* it interacts with other systems.

- **Character**: Write with personality and voice. These books should be engaging and fun to read, not dry reference manuals. Use vivid examples, evocative language, and conversational tone where appropriate.

- **Flavor**: Add narrative context, thematic framing, and genre-specific color. Help readers visualize how mechanics manifest in the fiction. Include brief narrative examples alongside mechanical ones.

- **Clarity**: Despite depth and flavor, maintain crystal-clear explanations. Use concrete examples, step-by-step breakdowns, and explicit guidance. Readers should never be confused about how something works.

**Length is not a constraint.** If depth, clarity, or flavor require more words, use them. We prioritize quality over brevity.

## Content Substantiality

Avoid writing that reads as "a series of lists with brief bits of information." Instead:

- **Use prose and context**: Introduce concepts with narrative framing. Explain the "why" before the "what."
- **Integrate lists naturally**: When lists are needed, embed them in prose. Add explanatory sentences before and after.
- **Add connective tissue**: Show how concepts relate to each other. Use transitions between sections.
- **Include concrete scenarios**: Don't just list mechanics—show them in action through examples and use cases.
- **Remove redundant TOCs**: Chapter-level tables of contents are unnecessary. Let the content flow naturally.
- **Merge when appropriate**: If multiple short chapters cover closely related topics, consider consolidating them into a single, substantial chapter with clear sections.

**Good**: "When your character faces a challenge, you'll roll dice to determine the outcome. The game uses 4d6 as its core mechanic—four six-sided dice rolled together and summed. This creates a bell curve of results centered around 14, meaning most rolls cluster near that average while truly exceptional or disastrous outcomes remain rare. Here's how it works: [explanation with examples]."

**Avoid**: "Rolling Dice: Roll 4d6. Add them up. Compare to DC. Check outcome."

## Technical Standards

### Front Matter

Every chapter must include YAML front matter:

```yaml
---
title: "<Chapter Title>"
slug: <book>-<chapter-slug>
doc_type: book
version: 1.3
last_updated: YYYY-MM-DD
keywords: [ttrpg, <book>, <topic>]
---
```

### Heading Structure

- **Heading IDs**: Add stable IDs to all H2/H3 anchors for deep links
- **Hierarchy**: Use proper heading hierarchy (H1 for title, H2 for main sections, H3 for subsections)

### Tone and Voice

- Clear, confident, friendly
- Avoid slang
- Make content engaging and informative
- Keep GM callouts concise

### Accessibility

- Define all TTRPG jargon on first use
- Provide clear definitions for newcomers (e.g., "GM", "PC", "NPC", "session", "campaign")
- Assume zero prior TTRPG experience

### Examples

- At least one worked example per major rule
- Include cross-genre examples when relevant
- Show both mechanical resolution AND narrative outcome

### Mechanical Clarity

Always include:
- DC cues
- Outcome tiers
- Tags/Conditions
- GM Usage guidance

### Dice Notation (CRITICAL)

- This is a **4d6 system**. Always use `4d6` notation in examples.
- **NEVER use `d20`, `2d20`, or other dice** unless specifically required by a mechanic
- **Advantage**: Roll 5d6 (±1) or 6d6 (±2), keep best 4 dice
- **Disadvantage**: Roll 5d6 (±1) or 6d6 (±2), keep worst 4 dice
- **Outcome tiers**:
  - Critical Success (margin ≥+5)
  - Full Success (≥0)
  - Partial Success (-1 to -2)
  - Failure (≤-3)
  - Critical Failure (≤-7 or all 1s)
- **DC Ladder**:
  - 12 (Easy)
  - 14 (Routine)
  - 16 (Tough)
  - 18 (Hard)
  - 20 (Heroic)
  - 22 (Legendary)

### Narrative Utility

- Add "How to use this now" bullets for GMs/players
- Provide practical application guidance

### Tables and Figures

- Aim for readability
- Label with captions
- Include alt text for figures

### Cross-Links

- Prefer stable IDs
- Link to glossary terms on first use

### Glossary

- Use shared `GLOSSARY.md` with anchors
- Add index terms when build tool supports it

### Linting

- Docs should pass link-check
- Length-based linting rules (MD013) can be ignored in favor of depth and clarity

## Usage

This guide applies to:
- Core rulebook chapters
- Setting book content
- Campaign materials
- Lore and world-building documents

For PDF-specific formatting, see [pdf-style-guide.md](./pdf-style-guide.md).
```

**Step 3: Verify file was created**

Run: `cat docs/style_guides/book/writing-style-guide.md | head -20`

Expected: Shows first 20 lines of the guide

**Step 4: Commit**

```bash
git add docs/style_guides/book/writing-style-guide.md
git commit -m "📝 docs(style-guides): migrate book writing guide from source/STYLE.md"
```

---

## Task 2: Create TypeScript Style Guide

**Files:**
- Create: `docs/style_guides/typescript/README.md`
- Create: `docs/style_guides/typescript/naming-conventions.md`

**Step 1: Create TypeScript README**

```markdown
# TypeScript Style Guide

Standards and best practices for TypeScript code in the Razorweave project.

## Core Principles

1. **Type Safety**: Prefer strict types over `any`
2. **ESM Only**: Use ES modules, never CommonJS
3. **Explicit > Implicit**: Favor clarity over brevity
4. **Test-Driven**: Write tests before implementation
5. **DRY**: Don't repeat yourself, but prefer clarity over cleverness

## Module System

### Always Use ESM

```typescript
// ✅ Good
import { Agent } from '@razorweave/shared';
export class ContentAgent implements Agent { }

// ❌ Bad
const { Agent } = require('@razorweave/shared');
module.exports = { ContentAgent };
```

### Export Conventions

```typescript
// ✅ Good - named exports
export class ContentAgent { }
export function validateContent() { }

// ❌ Avoid - default exports (harder to refactor)
export default class ContentAgent { }
```

### Barrel Exports

Use `index.ts` to re-export from subdirectories:

```typescript
// src/agents/index.ts
export * from './content/index.js';
export * from './review/index.js';
```

**Important**: Always use `.js` extension in imports (TypeScript will resolve to `.ts`):

```typescript
import { Agent } from './types.js'; // ✅ Correct
import { Agent } from './types';    // ❌ Wrong (breaks ESM)
```

## Type Safety

### Avoid `any`

```typescript
// ❌ Bad
function process(data: any) { }

// ✅ Good
function process(data: unknown) {
  if (typeof data === 'string') {
    // TypeScript knows data is string here
  }
}

// ✅ Better - use proper types
interface ProcessData {
  id: string;
  content: string;
}
function process(data: ProcessData) { }
```

### Explicit Return Types

```typescript
// ✅ Good - explicit return type
function calculateScore(input: number): number {
  return input * 2;
}

// ❌ Avoid - inferred return type
function calculateScore(input: number) {
  return input * 2;
}
```

### Use Discriminated Unions

```typescript
// ✅ Good - discriminated union
type Result =
  | { success: true; data: string }
  | { success: false; error: Error };

function handleResult(result: Result) {
  if (result.success) {
    console.log(result.data); // TypeScript knows data exists
  } else {
    console.error(result.error); // TypeScript knows error exists
  }
}
```

## Async/Await

### Always Use Async/Await

```typescript
// ✅ Good
async function loadData(): Promise<Data> {
  const response = await fetch(url);
  return await response.json();
}

// ❌ Avoid - promise chains
function loadData(): Promise<Data> {
  return fetch(url).then(r => r.json());
}
```

### Error Handling

```typescript
// ✅ Good - explicit error handling
async function loadData(): Promise<Data> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new DataLoadError('Failed to load data', { cause: error });
  }
}
```

## Error Handling

### Custom Error Classes

```typescript
// ✅ Good - custom error with context
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usage
throw new ValidationError('Invalid email', 'email', userInput);
```

### Never Swallow Errors

```typescript
// ❌ Bad
try {
  await dangerousOperation();
} catch {
  // Silently ignored!
}

// ✅ Good - at minimum log it
try {
  await dangerousOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw error; // Re-throw if caller should handle
}
```

## Agent Implementation Patterns

### Agent Interface

All agents should implement the base Agent interface:

```typescript
export interface Agent<TInput, TOutput> {
  name: string;
  execute(input: TInput): Promise<TOutput>;
  validate(input: TInput): ValidationResult;
}
```

### Agent Structure

```typescript
export class ContentAgent implements Agent<ContentInput, ContentOutput> {
  constructor(
    private readonly llm: LLMClient,
    private readonly bookReader: BookReader,
    private readonly bookWriter: BookWriter
  ) {}

  async execute(input: ContentInput): Promise<ContentOutput> {
    // 1. Validate input
    const validationResult = this.validate(input);
    if (!validationResult.valid) {
      throw new ValidationError(validationResult.error);
    }

    // 2. Gather context
    const context = await this.gatherContext(input);

    // 3. Call LLM
    const generated = await this.llm.complete(this.buildPrompt(context));

    // 4. Post-process
    const validated = this.validateOutput(generated);

    // 5. Write output
    return this.writeOutput(validated, input);
  }

  validate(input: ContentInput): ValidationResult {
    // Validation logic
  }

  private async gatherContext(input: ContentInput): Promise<Context> {
    // Context gathering logic
  }

  private buildPrompt(context: Context): string {
    // Prompt building logic
  }
}
```

## File Organization

### Package Structure

```
src/{package}/
  index.ts              (Barrel export)
  types.ts              (Shared types)
  {feature}/
    {feature}.ts        (Implementation)
    {feature}.test.ts   (Tests)
    index.ts            (Barrel export)
```

### Naming Conventions

See [naming-conventions.md](./naming-conventions.md) for detailed guidelines.

## Testing

### Test File Naming

- Test files: `{name}.test.ts`
- Located alongside implementation files

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { ContentAgent } from './content-agent.js';

describe('ContentAgent', () => {
  describe('execute', () => {
    it('generates content successfully', async () => {
      // Arrange
      const agent = new ContentAgent(mockLLM, mockReader, mockWriter);
      const input = { bookPath: 'test' };

      // Act
      const result = await agent.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toContain('expected text');
    });

    it('throws ValidationError for invalid input', async () => {
      // Arrange
      const agent = new ContentAgent(mockLLM, mockReader, mockWriter);
      const invalidInput = {};

      // Act & Assert
      await expect(agent.execute(invalidInput)).rejects.toThrow(ValidationError);
    });
  });
});
```

## Related Guides

- [Naming Conventions](./naming-conventions.md)
- [Code Organization](./code-organization.md)
- [Testing Patterns](./testing-patterns.md)
```

**Step 2: Create naming-conventions.md**

```markdown
# TypeScript Naming Conventions

## Files and Directories

### Files

- `kebab-case.ts` for implementation files
- `kebab-case.test.ts` for test files
- `index.ts` for barrel exports

```
content-agent.ts
content-agent.test.ts
index.ts
```

### Directories

- `kebab-case` for all directories

```
src/agents/content/
src/shared/llm/
```

## Variables and Constants

### Variables

- `camelCase` for variables and function parameters

```typescript
const userName = 'Alice';
const bookPath = '/path/to/book';

function processData(inputData: Data) { }
```

### Constants

- `SCREAMING_SNAKE_CASE` for true constants

```typescript
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;
```

### Booleans

- Prefix with `is`, `has`, `should`

```typescript
const isValid = true;
const hasContent = false;
const shouldRetry = true;
```

## Functions and Methods

### Functions

- `camelCase` for function names
- Verb-based names

```typescript
function validateInput(data: Input): ValidationResult { }
function generateContent(prompt: string): Promise<string> { }
```

### Async Functions

- Same naming as sync functions
- Return type shows it's async

```typescript
async function loadBook(path: string): Promise<Book> { }
```

### Method Names

- `camelCase` for public methods
- Prefix private methods with `_` (optional)

```typescript
class ContentAgent {
  async execute(input: Input): Promise<Output> { }

  private async _gatherContext(input: Input): Promise<Context> { }
}
```

## Classes and Interfaces

### Classes

- `PascalCase` for class names
- Noun-based names

```typescript
class ContentAgent { }
class BookReader { }
class ValidationError extends Error { }
```

### Interfaces

- `PascalCase` for interface names
- No `I` prefix

```typescript
// ✅ Good
interface Agent<TInput, TOutput> { }
interface ValidationResult { }

// ❌ Avoid I prefix
interface IAgent { }
```

### Type Aliases

- `PascalCase` for type aliases

```typescript
type BookPath = string;
type Result<T> = { success: boolean; data?: T; error?: Error };
```

## Generics

### Type Parameters

- Single uppercase letter for simple cases: `T`, `U`, `K`, `V`
- Descriptive `PascalCase` for complex cases: `TInput`, `TOutput`

```typescript
// Simple
function identity<T>(value: T): T { }

// Complex
interface Agent<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

## Enums

### Enum Names

- `PascalCase` for enum names

```typescript
enum AgentType {
  Content = 'content',
  Review = 'review',
  Playtest = 'playtest',
}
```

### Enum Members

- `PascalCase` for members
- String values in `lowercase`

```typescript
enum Status {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
}
```

## Imports and Exports

### Import Order

1. External dependencies
2. Workspace packages (@razorweave/*)
3. Relative imports

```typescript
// External
import { readFile } from 'fs/promises';
import { z } from 'zod';

// Workspace
import { Agent } from '@razorweave/shared';
import { LLMClient } from '@razorweave/shared/llm';

// Relative
import { ContentInput } from './types.js';
import { validateInput } from '../validators/index.js';
```

### Named Exports

- Always use named exports
- Never use default exports

```typescript
// ✅ Good
export class ContentAgent { }
export function validateInput() { }

// ❌ Avoid
export default class ContentAgent { }
```

## Examples

### Complete Example

```typescript
// content-agent.ts
import { Agent, ValidationResult } from '@razorweave/shared';
import { LLMClient } from '@razorweave/shared/llm';
import { BookReader, BookWriter } from '@razorweave/shared/fs';

const MAX_RETRIES = 3;
const DEFAULT_TEMPERATURE = 0.7;

interface ContentInput {
  bookPath: string;
  chapterName: string;
}

interface ContentOutput {
  content: string;
  metadata: Record<string, unknown>;
}

export class ContentAgent implements Agent<ContentInput, ContentOutput> {
  constructor(
    private readonly llm: LLMClient,
    private readonly bookReader: BookReader,
    private readonly bookWriter: BookWriter
  ) {}

  async execute(input: ContentInput): Promise<ContentOutput> {
    const validationResult = this.validate(input);
    if (!validationResult.valid) {
      throw new ValidationError(validationResult.error!);
    }

    const context = await this._gatherContext(input);
    const content = await this._generateContent(context);

    return {
      content,
      metadata: { generatedAt: new Date().toISOString() },
    };
  }

  validate(input: ContentInput): ValidationResult {
    if (!input.bookPath) {
      return { valid: false, error: 'bookPath is required' };
    }
    return { valid: true };
  }

  private async _gatherContext(input: ContentInput): Promise<string> {
    const existingContent = await this.bookReader.read(input.bookPath);
    return existingContent;
  }

  private async _generateContent(context: string): Promise<string> {
    return await this.llm.complete({
      prompt: context,
      temperature: DEFAULT_TEMPERATURE,
      maxRetries: MAX_RETRIES,
    });
  }
}
```
```

**Step 3: Create directory and commit**

```bash
mkdir -p docs/style_guides/typescript
git add docs/style_guides/typescript/
git commit -m "📝 docs(style-guides): create TypeScript style guide"
```

---

## Task 3: Create Docs Content Style Guide

**Files:**
- Create: `docs/style_guides/docs/README.md`
- Create: `docs/style_guides/docs/plan-format.md`

**Step 1: Create docs README**

```markdown
# Docs Content Style Guide

Standards for writing documentation in the `docs/` directory.

## Purpose

This guide covers:
- Writing plans in `docs/plans/`
- Writing workflow documentation in `docs/workflows/`
- Writing agent documentation in `docs/agents/`
- General documentation best practices

## General Principles

### Clarity First

- Write for readers with zero context
- Explain jargon on first use
- Use concrete examples
- Break complex topics into sections

### Structure

- Use clear heading hierarchy
- Include table of contents for long docs
- Add front matter when relevant
- Use consistent formatting

### Links

- Use relative links for internal docs
- Check that all links work
- Prefer stable heading IDs for anchors

## Documentation Types

### Plans

See [plan-format.md](./plan-format.md) for detailed guidelines on writing implementation plans.

### Workflows

Write workflow docs in `docs/workflows/`:

- Describe the process step-by-step
- Include inputs and outputs for each step
- Show how steps connect
- Provide examples

### Agent Documentation

Write agent docs in `docs/agents/`:

- Describe agent purpose
- List inputs and outputs
- Show example usage
- Document configuration options

## Markdown Standards

### Headings

```markdown
# Document Title (H1 - only one per doc)

## Main Section (H2)

### Subsection (H3)

#### Detail (H4 - sparingly)
```

### Code Blocks

Always specify language:

```markdown
\`\`\`typescript
const example = 'code';
\`\`\`

\`\`\`bash
pnpm install
\`\`\`
```

### Lists

Use `-` for unordered lists:

```markdown
- Item one
- Item two
  - Nested item
```

Use numbers for ordered lists:

```markdown
1. First step
2. Second step
3. Third step
```

### Emphasis

- `**bold**` for important terms
- `*italic*` for emphasis
- `` `code` `` for inline code, file names, commands

### Links

```markdown
[Link Text](./relative/path.md)
[External Link](https://example.com)
[Heading Link](#heading-id)
```

## File Naming

- Use kebab-case: `plan-format.md`
- Be descriptive: `content-validation-workflow.md`
- Follow plan naming for plans: see [plan-format.md](./plan-format.md)

## Front Matter

Optional YAML front matter for metadata:

```yaml
---
title: "Document Title"
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
---
```

## Examples

### Good Documentation Structure

```markdown
# Feature Name

Brief description of what this feature does.

## Overview

1-2 paragraph explanation of the feature.

## How It Works

Step-by-step explanation:

1. First step
2. Second step
3. Third step

## Usage

\`\`\`typescript
// Code example
import { Feature } from './feature';
\`\`\`

## Configuration

Available options:
- `option1` - Description
- `option2` - Description

## See Also

- [Related Doc](./related.md)
```

## Related Guides

- [Plan Format](./plan-format.md)
```

**Step 2: Create plan-format.md**

```markdown
# Plan Format Guide

Guidelines for writing implementation plans in `docs/plans/`.

## Plan Naming Convention

### Formats

Plans follow a specific naming convention to prevent confusion about phases and tangents:

**1. Index File**
- Pattern: `{topic-name}-index.md`
- Example: `linting-and-style-guides-index.md`
- Purpose: Track the plan across all phases and tangents

**2. Phase File**
- Pattern: `{topic-name}-P{phase-number}[-{phase-step}].md`
- Examples:
  - `linting-and-style-guides-P1.md`
  - `linting-and-style-guides-P1-initial-setup.md`
- Purpose: Main phase implementation

**3. Tangent File**
- Pattern: `{topic-name}-P{phase-number}-{tangent-name}[-{tangent-step}].md`
- Examples:
  - `linting-and-style-guides-P3-git-hooks.md`
  - `linting-and-style-guides-P3-claude-hooks-optimization.md`
- Purpose: Tangent from main phase

### Rules

- All lowercase
- Use hyphens (`-`) not underscores
- Topic name should be descriptive but concise
- Phase numbers start at 1
- Optional step names add clarity

## Index File Structure

```markdown
# {Topic Name} - Plan Index

## Overview

[Brief description of the overall topic and goals]

## Phases

### Phase 1: [Phase Name]
**Status:** [Not Started | In Progress | Completed | Blocked]
**Files:**
- [\`{topic}-P1.md\`](./{topic}-P1.md)

**Summary:** [What this phase accomplishes]

### Phase 2: [Phase Name]
**Status:** [Not Started | In Progress | Completed]
**Files:**
- [\`{topic}-P2.md\`](./{topic}-P2.md)

**Tangents:**
- [\`{topic}-P2-tangent-name.md\`](./{topic}-P2-tangent-name.md) - [Description]

**Summary:** [What this phase accomplishes]

## Progress Tracking

- [ ] Phase 1 complete
- [ ] Phase 2 complete

## Design Document

Full design: [\`YYYY-MM-DD-{topic}-design.md\`](./YYYY-MM-DD-{topic}-design.md)

## Key Decisions

List important architectural or design decisions made.

## Notes

[Any cross-phase notes, decisions, or context]
```

## Implementation Plan Structure

Implementation plans created with `superpowers:writing-plans` must follow this structure:

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---

## Task 1: [Component Name]

**Files:**
- Create: \`exact/path/to/file.ts\`
- Modify: \`exact/path/to/existing.ts:123-145\`
- Test: \`tests/exact/path/to/test.ts\`

**Step 1: [Action]**

[Details with code examples]

**Step 2: [Action]**

[Details]

...

---

## Task 2: [Component Name]

...
```

### Plan Requirements

- **Exact file paths** - Always specify full paths
- **Complete code** - Include actual code, not "add validation here"
- **Test-first** - Write tests before implementation
- **Bite-sized steps** - Each step is 2-5 minutes
- **Frequent commits** - Commit after each task

## Design Document Structure

Design documents created with `superpowers:brainstorming` should include:

```markdown
# [Feature Name] Design

**Date:** YYYY-MM-DD
**Status:** [Draft | Approved | Implemented]

## Overview

Description of what's being designed.

## Goals

What this feature accomplishes.

## Architecture

How it's structured.

## Implementation Phases

What phases will implement this.

## Key Decisions

Important choices made during design.

## References

Related documents.
```

## Status Values

Use consistent status values:

- **Not Started** - Phase not begun
- **In Progress** - Currently working on it
- **Completed** - Finished and verified
- **Blocked** - Cannot proceed (explain why)

## Related Guides

- [Docs README](./README.md)
```

**Step 3: Create directory and commit**

```bash
mkdir -p docs/style_guides/docs
git add docs/style_guides/docs/
git commit -m "📝 docs(style-guides): create docs content style guide"
```

---

## Task 4: Create Git Conventions Guide

**Files:**
- Create: `docs/style_guides/git/commit-conventions.md`

**Step 1: Create commit-conventions.md**

```markdown
# Git Commit Conventions

Razorweave uses conventional commits with emoji prefixes.

## Format

```
emoji type(scope): subject

[optional body]

[optional footer]
```

## Emoji and Type Mapping

| Emoji | Type | Description | Example |
|-------|------|-------------|---------|
| ✨ | feat | New feature | `✨ feat(agents): add content generator` |
| 🐛 | fix | Bug fix | `🐛 fix(cli): handle missing config file` |
| 📝 | docs | Documentation | `📝 docs(readme): update installation steps` |
| ♻️ | refactor | Code refactoring | `♻️ refactor(shared): simplify LLM client` |
| 🎨 | style | Code style | `🎨 style(agents): format with prettier` |
| ⚡ | perf | Performance | `⚡ perf(validators): optimize link checking` |
| 🔧 | chore | Maintenance | `🔧 chore(deps): update typescript to 5.3` |
| 🧪 | test | Tests | `🧪 test(validators): add link validator tests` |
| 🚀 | release | Release | `🚀 release(v1.0.0): initial release` |
| 🗑️ | remove | Removal | `🗑️ remove(tools): delete unused script` |

## Scope

Scope should match the package name:

- `agents` - Changes to @razorweave/agents
- `cli` - Changes to @razorweave/cli
- `shared` - Changes to @razorweave/shared
- `site` - Changes to @razorweave/site
- `workflows` - Changes to @razorweave/workflows
- `tooling` - Changes to @razorweave/tooling
- `tools` - Changes to @razorweave/tools
- `maintenance` - Changes to @razorweave/maintenance

For cross-package or root changes, use a descriptive scope:

- `monorepo` - Changes affecting multiple packages
- `deps` - Dependency updates
- `ci` - CI/CD changes
- `docs` - Documentation not tied to specific package

## Subject

- Use imperative mood: "add feature" not "added feature"
- Don't capitalize first letter
- No period at the end
- Keep under 72 characters

## Examples

### Good Commits

```bash
✨ feat(agents): add review agent with persona support
🐛 fix(cli): handle ENOENT when config file missing
📝 docs(style-guides): create TypeScript conventions guide
♻️ refactor(shared): extract LLM client interface
🧪 test(validators): add comprehensive link validation tests
🔧 chore(deps): update all dependencies to latest
```

### Bad Commits

```bash
# Missing emoji
feat(agents): add feature

# Wrong emoji for type
✨ fix(cli): bug fix

# Capitalized subject
✨ feat(agents): Add new feature

# Period at end
✨ feat(agents): add feature.

# Past tense
✨ feat(agents): added new feature

# Too vague
✨ feat(agents): updates

# No scope
✨ feat: add feature
```

## Body

Optional detailed explanation:

- Explain *what* and *why*, not *how*
- Wrap at 72 characters
- Separate from subject with blank line

```bash
✨ feat(agents): add content generation caching

Implement LRU cache for generated content to avoid
regenerating identical chapters. Cache invalidates
when rules or style guides change.

Reduces generation time by ~40% for iterative edits.
```

## Footer

Optional metadata:

```bash
✨ feat(agents): add review agent

Implements persona-based review with configurable
review dimensions and quality gates.

Closes #123
Breaking change: Review agent API changed
```

## Commit Message Hook

The `commit-msg` git hook enforces this format automatically. If your commit doesn't match the pattern, it will be rejected with a helpful error message.

## Tools

### Commitizen (Optional)

For interactive commit creation:

```bash
pnpm add -D commitizen cz-conventional-changelog

# Then use:
pnpm exec git-cz
```

### Conventional Changelog (Future)

Auto-generate changelogs from commits:

```bash
pnpm add -D conventional-changelog-cli
```

## Related

- [Git Hooks](../../tooling/hooks/git/) - Automated enforcement
- [Docs Style Guide](../docs/README.md) - Documentation standards
```

**Step 2: Create directory and commit**

```bash
mkdir -p docs/style_guides/git
git add docs/style_guides/git/
git commit -m "📝 docs(style-guides): create git commit conventions guide"
```

---

## Verification

After completing all tasks:

**Check style guides created:**
```bash
ls -la docs/style_guides/
```

Expected directories:
- book/ (with writing-style-guide.md)
- typescript/ (with README.md, naming-conventions.md)
- docs/ (with README.md, plan-format.md)
- git/ (with commit-conventions.md)
- prose/ (existing)
- rules/ (existing)
- pdf/ (existing)

**Verify content migrated:**
```bash
cat docs/style_guides/book/writing-style-guide.md | grep "Writing Quality Goals"
```

Expected: Shows the Writing Quality Goals section

**Phase 2 Complete!**

Next: Phase 3 - Hooks Implementation
