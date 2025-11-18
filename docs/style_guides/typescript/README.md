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
