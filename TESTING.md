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

Located in `src/tooling/e2e/`

Test complete workflows from start to finish using real implementations.

**Pattern:**

```typescript
import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';

describe('E2E Workflow', () => {
  let db: Database.Database;
  const dbPath = 'data/project.db';

  beforeEach(() => {
    // For E2E tests, use fresh database with current schema
    execSync(`rm -f ${dbPath} ${dbPath}-shm ${dbPath}-wal`);
    db = new Database(dbPath);
    createTables(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should complete full workflow', () => {
    // Execute CLI commands
    execSync('pnpm tsx cli-commands/run.ts generate 5 --seed=12345');

    // Verify database state
    const count = db.prepare('SELECT COUNT(*) as count FROM personas').get();
    expect(count.count).toBe(5);
  });
});
```

**Characteristics:**
- Use real CLI commands via `execSync`
- Use actual database files (not `:memory:` for CLI tests)
- Clean up test data in `afterEach`
- Test complete user workflows
- Verify both command output AND database state
- Use fresh database per test to avoid schema issues

**Example Tests:**
- `review-workflow.test.ts` - Persona → Snapshot → Campaign → Review workflow
- `git-workflow.test.ts` - Git operations with state tracking
- `cli-commands.test.ts` - CLI command execution and database verification

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

it('should handle async errors', async () => {
  await expect(asyncOperation()).rejects.toThrow(ValidationError);
});
```

### Async/Await Testing

Always use `async/await` for asynchronous tests:

```typescript
// ✅ Good
it('should process data asynchronously', async () => {
  const result = await processData(input);
  expect(result).toBeDefined();
});

// ❌ Bad - missing await
it('should process data asynchronously', () => {
  const result = processData(input);  // Returns Promise, not result!
  expect(result).toBeDefined();
});
```

### Mock Best Practices

**Spy on modules, not implementation:**

```typescript
// ✅ Good - spy on module boundary
import * as fileOps from '../utils/file-ops.js';
vi.spyOn(fileOps, 'readFile').mockResolvedValue('content');

// ❌ Bad - tightly coupled to implementation
vi.mock('../utils/file-ops.js', () => ({
  readFile: vi.fn(() => 'content'),
  // Must update mock when adding new exports
}));
```

**Reset mocks between tests:**

```typescript
beforeEach(() => {
  vi.clearAllMocks();  // Clear call history
});

afterEach(() => {
  vi.restoreAllMocks();  // Restore original implementations
});
```

**Verify mock calls:**

```typescript
it('should call database with correct parameters', () => {
  const spy = vi.spyOn(db, 'prepare');

  client.getUser('user-123');

  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining('SELECT * FROM users WHERE id = ?')
  );
  expect(spy).toHaveBeenCalledTimes(1);
});
```

### Test Data Builders

Use builder pattern for complex test data:

```typescript
function createTestPersona(overrides = {}) {
  return {
    id: 'test-persona',
    name: 'Test Persona',
    archetype: 'Explorer',
    experience_level: 'Newbie',
    ...overrides,
  };
}

it('should process veteran persona differently', () => {
  const persona = createTestPersona({ experience_level: 'Veteran' });
  const result = processPersona(persona);
  expect(result.complexity).toBe('high');
});
```

### Parameterized Tests

Use `it.each` for testing multiple scenarios:

```typescript
it.each([
  { input: 'book-abc123', expected: 'book' },
  { input: 'chapter-def456', expected: 'chapter' },
  { input: 'invalid', expected: null },
])('should parse content ID: $input', ({ input, expected }) => {
  expect(parseContentId(input)).toBe(expected);
});
```

## Anti-Patterns

### What NOT to Do

❌ **Don't test implementation details**
```typescript
// ❌ Bad - tests internal implementation
it('should call private method', () => {
  expect(obj._internalMethod).toHaveBeenCalled();
});

// ✅ Good - tests public behavior
it('should return processed result', () => {
  expect(obj.process()).toBe(expected);
});
```

❌ **Don't use actual files**
```typescript
// ❌ Bad
beforeEach(() => {
  writeFileSync('test-data.json', JSON.stringify(data));
});

// ✅ Good
import { vi } from 'vitest';
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(JSON.stringify(data)),
}));
```

❌ **Don't use the real project database**
```typescript
// ❌ Bad
const db = new Database('data/project.db');

// ✅ Good
const db = new Database(':memory:');
```

❌ **Don't write order-dependent tests**
```typescript
// ❌ Bad - test2 depends on test1
it('test1: should create user', () => {
  db.createUser({ id: 1, name: 'Alice' });
});

it('test2: should find user', () => {
  const user = db.getUser(1);  // Depends on test1!
  expect(user.name).toBe('Alice');
});

// ✅ Good - independent tests
describe('User operations', () => {
  beforeEach(() => {
    db.createUser({ id: 1, name: 'Alice' });
  });

  it('should find created user', () => {
    const user = db.getUser(1);
    expect(user.name).toBe('Alice');
  });
});
```

❌ **Don't use `any` type**
```typescript
// ❌ Bad
it('should process data', () => {
  const result: any = processData(input);
  expect(result.value).toBeDefined();
});

// ✅ Good
it('should process data', () => {
  const result: ProcessedData = processData(input);
  expect(result.value).toBeDefined();
});
```

❌ **Don't spy on console.log**
```typescript
// ❌ Bad
const consoleSpy = vi.spyOn(console, 'log');

// ✅ Good
import * as logger from '../logging/logger.js';
const logSpy = vi.spyOn(logger.log, 'info');
```

❌ **Don't mock what you don't own**
```typescript
// ❌ Bad - mocking third-party library internals
vi.mock('better-sqlite3', () => ({
  Database: vi.fn(() => ({
    prepare: vi.fn(),
    // Deep mocking library internals
  })),
}));

// ✅ Good - use in-memory database or wrap in adapter
const db = new Database(':memory:');
```

❌ **Don't test multiple things in one test**
```typescript
// ❌ Bad
it('should handle user workflow', () => {
  const user = createUser(data);
  expect(user.id).toBeDefined();

  const updated = updateUser(user.id, newData);
  expect(updated.name).toBe(newData.name);

  deleteUser(user.id);
  expect(getUser(user.id)).toBeNull();
});

// ✅ Good - separate tests
describe('User operations', () => {
  it('should create user with ID', () => {
    const user = createUser(data);
    expect(user.id).toBeDefined();
  });

  it('should update user data', () => {
    const user = createUser(data);
    const updated = updateUser(user.id, newData);
    expect(updated.name).toBe(newData.name);
  });

  it('should delete user', () => {
    const user = createUser(data);
    deleteUser(user.id);
    expect(getUser(user.id)).toBeNull();
  });
});
```

### What TO Do

✅ **Test behavior, not implementation**
✅ **Use in-memory database for database tests**
✅ **Mock file I/O operations**
✅ **Make tests independent and isolated**
✅ **Use proper types in test code**
✅ **Spy on logger.log methods for output testing**
✅ **Reset mocks between tests**
✅ **Use test data builders for complex objects**
✅ **Write focused, single-purpose tests**
✅ **Mock at module boundaries, not internals**

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

## Debugging Tests

### Run Single Test

```bash
pnpm test path/to/test.ts -t "test name pattern"
```

### Enable Verbose Output

```bash
pnpm test --reporter=verbose
```

### Debug with Node Inspector

```bash
node --inspect-brk node_modules/.bin/vitest run path/to/test.ts
```

Then open `chrome://inspect` in Chrome.

### Common Issues

**Issue: Test hangs indefinitely**
- Missing `await` on async operation
- Database connection not closed in `afterEach`
- Background process still running

**Issue: Flaky tests (inconsistent pass/fail)**
- Race conditions in async code
- Order-dependent tests
- Shared mutable state between tests
- Time-based assertions (use mocked timers)

**Issue: "Database is locked"**
- Multiple tests accessing same database file
- Use `:memory:` for unit/integration tests
- Use fresh database per test for E2E tests

## Best Practices Summary

1. **Write tests first** (TDD) - Ensures tests actually verify behavior
2. **One assertion per test** (when possible) - Easier to debug failures
3. **Descriptive test names** - "should do X when Y" format
4. **Arrange-Act-Assert** - Clear test structure
5. **Test edge cases** - Empty arrays, null, undefined, boundary values
6. **Avoid test interdependence** - Each test should run in isolation
7. **Use meaningful test data** - Avoid magic numbers in assertions
8. **Clean up after tests** - Close connections, remove temp files
9. **Mock external dependencies** - Network, filesystem, time
10. **Maintain test quality** - Tests are code too!
