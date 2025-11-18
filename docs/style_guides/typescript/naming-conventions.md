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
