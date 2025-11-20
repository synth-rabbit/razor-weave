# Testing Guide

## Overview

This project uses Vitest for testing with an 80% coverage target.

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test path/to/test.ts

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test

# Coverage with UI
pnpm test:coverage:ui
```

## Test Structure

### Unit Tests

Located alongside source files: `*.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from './module.js';

describe('Module Name', () => {
  it('should do something', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

Located in `src/tooling/integration/`

Test multiple modules working together.

### E2E Tests

Test complete workflows with real database (in-memory).

## Testing Patterns

### Database Tests

Always use in-memory database:

```typescript
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  createTables(db);
});

afterEach(() => {
  db.close();
});
```

### File I/O Tests

Use vitest mocks:

```typescript
import { vi } from 'vitest';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));
```

### Logger Tests

Spy on logger instead of console:

```typescript
import * as logger from '../logging/logger.js';

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(logger.log, 'info').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### Error Testing

```typescript
it('should throw DatabaseError on invalid query', () => {
  expect(() => client.query('INVALID')).toThrow(DatabaseError);
});
```

## Anti-Patterns

❌ Don't test implementation details
❌ Don't use actual files (use mocks or temp files)
❌ Don't use the real project database
❌ Don't write tests dependent on execution order
❌ Don't use `any` type in tests
❌ Don't spy on console.log (use logger spy)

✅ Test behavior, not implementation
✅ Use in-memory database for database tests
✅ Mock file I/O operations
✅ Make tests independent and isolated
✅ Use proper types in test code
✅ Spy on logger.log methods for output testing

## Coverage Goals

- Overall: 80%+
- Critical modules (database, schemas): 90%+
- All modules: At least 60%

## CI/CD

Tests run on every commit via git hooks.
Coverage reports generated with `pnpm test:coverage`.

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - JSON data
- `coverage/lcov.info` - LCOV format for CI tools
