# Audit Remediation - Phase 2: Critical Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address high-risk issues that could cause data loss or workflow disruption.

**Duration:** 1-2 weeks

**Prerequisite:** Phase 1 must be complete

---

## Dependency Tracking

**Three parallel tracks:**
- **Track A:** Logging (Tasks 1-2)
- **Track B:** Testing (Tasks 3-6)
- **Track C:** Type Safety (Tasks 7-9)

**Sequential:**
- **Error Handling:** Task 10 → Tasks 11-12

---

## Track A: Logging Infrastructure

### Task 1: Add Logging Framework

**Standalone** - Can start anytime

**Goal:** Replace console.log with proper logging framework (winston or pino)

**Files:**
- Create: `src/tooling/logging/logger.ts`
- Modify: `package.json` (add dependency)
- Create: `src/tooling/logging/logger.test.ts`

**Steps:**

1. **Choose logging library**

   Recommended: `pino` (fast, structured logging)

   ```bash
   pnpm add pino
   pnpm add -D pino-pretty @types/node
   ```

2. **Create logger module**

   Create `src/tooling/logging/logger.ts`:

   ```typescript
   import pino from 'pino';

   const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
     transport: {
       target: 'pino-pretty',
       options: {
         colorize: true,
         translateTime: 'HH:MM:ss',
         ignore: 'pid,hostname',
       },
     },
   });

   export default logger;

   // Convenience exports
   export const log = {
     debug: logger.debug.bind(logger),
     info: logger.info.bind(logger),
     warn: logger.warn.bind(logger),
     error: logger.error.bind(logger),
   };
   ```

3. **Write tests**

   Create `src/tooling/logging/logger.test.ts`:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import logger, { log } from './logger.js';

   describe('Logger', () => {
     it('should export logger instance', () => {
       expect(logger).toBeDefined();
       expect(logger.info).toBeInstanceOf(Function);
     });

     it('should export convenience log methods', () => {
       expect(log.debug).toBeInstanceOf(Function);
       expect(log.info).toBeInstanceOf(Function);
       expect(log.warn).toBeInstanceOf(Function);
       expect(log.error).toBeInstanceOf(Function);
     });
   });
   ```

4. **Run tests**

   ```bash
   pnpm test src/tooling/logging/logger.test.ts
   ```

   Expected: Tests pass

5. **Commit**

   ```bash
   git add package.json pnpm-lock.yaml src/tooling/logging/
   git commit -m "feat(logging): add pino logging framework

Added pino as the project logging framework to replace console.log calls.

Created logger module with:
- Structured logging (JSON)
- Pretty output for development
- Configurable log levels via LOG_LEVEL env var
- Convenience methods (log.info, log.error, etc.)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 2: Fix console.log Linter Warnings

**Depends on:** Task 1 (logging framework must exist)

**Goal:** Replace all console.log with logger

**Files:**
- Modify: All files with console.log (find with grep)

**Steps:**

1. **Find all console.log usage**

   ```bash
   grep -r "console\.log" src/tooling/ --include="*.ts" --exclude="*.test.ts" -n
   ```

   Note the file paths and line numbers.

2. **For each file, replace console.log**

   Add import at top:
   ```typescript
   import { log } from '../logging/logger.js'; // Adjust path as needed
   ```

   Replace:
   ```typescript
   console.log('message', data);
   ```

   With:
   ```typescript
   log.info('message', { data });
   ```

   **Mapping:**
   - `console.log()` → `log.info()`
   - `console.warn()` → `log.warn()`
   - `console.error()` → `log.error()`
   - `console.debug()` → `log.debug()`

3. **Run linter**

   ```bash
   pnpm lint
   ```

   Expected: No more console.log warnings (down from ~40)

4. **Run tests**

   ```bash
   pnpm test
   ```

   Expected: All tests still pass

5. **Commit**

   ```bash
   git add src/tooling/
   git commit -m "refactor(logging): replace console.log with pino logger

Replaced all console.log calls with structured logging using pino.

Changed ~40 occurrences across:
- CLI commands
- Database operations
- Persona generation
- Review system

Linter warnings reduced significantly.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Track B: Testing - Critical Gaps

### Task 3: Add Tests for database/schema.ts

**Parallelizable** with Tasks 4-6

**Goal:** Test the critical database schema module

**Files:**
- Create: `src/tooling/database/schema.test.ts`

**Steps:**

1. **Analyze schema.ts**

   Read `src/tooling/database/schema.ts` to understand:
   - What tables are created
   - What indexes exist
   - What constraints are enforced

2. **Write test file**

   Create `src/tooling/database/schema.test.ts`:

   ```typescript
   import { describe, it, expect, beforeEach } from 'vitest';
   import Database from 'better-sqlite3';
   import { createTables } from './schema.js';

   describe('Database Schema', () => {
     let db: Database.Database;

     beforeEach(() => {
       db = new Database(':memory:');
       createTables(db);
     });

     it('should create personas table', () => {
       const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='personas'").get();
       expect(table).toBeDefined();
     });

     it('should create review_campaigns table', () => {
       const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='review_campaigns'").get();
       expect(table).toBeDefined();
     });

     it('should create persona_reviews table', () => {
       const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='persona_reviews'").get();
       expect(table).toBeDefined();
     });

     it('should create book_versions table', () => {
       const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='book_versions'").get();
       expect(table).toBeDefined();
     });

     it('should enforce foreign key constraints', () => {
       const fkStatus = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
       expect(fkStatus.foreign_keys).toBe(1);
     });

     it('should have correct indexes', () => {
       const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
       expect(indexes.length).toBeGreaterThan(0);
     });
   });
   ```

3. **Run tests**

   ```bash
   pnpm test src/tooling/database/schema.test.ts
   ```

   Expected: All tests pass

4. **Commit**

   ```bash
   git add src/tooling/database/schema.test.ts
   git commit -m "test(database): add schema tests for table creation and constraints

Added comprehensive tests for database schema covering:
- Table creation (personas, reviews, campaigns, book_versions)
- Foreign key constraint enforcement
- Index creation

Coverage for critical database module.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 4: Add Tests for validators/ Module

**Parallelizable** with Tasks 3, 5-6

**Goal:** Test all 6 validator files

**Files:**
- Create tests for each validator in `src/tooling/validators/`

**Steps:**

1. **List validator files**

   ```bash
   ls src/tooling/validators/*.ts | grep -v test
   ```

2. **For each validator, create a test**

   Example for `plan-naming-validator.ts`:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { validatePlanName } from './plan-naming-validator.js';

   describe('Plan Naming Validator', () => {
     it('should accept valid index plan', () => {
       expect(validatePlanName('feature-index.md')).toBe(true);
     });

     it('should accept valid phase plan', () => {
       expect(validatePlanName('feature-P1.md')).toBe(true);
       expect(validatePlanName('feature-P2-step1.md')).toBe(true);
     });

     it('should reject invalid names', () => {
       expect(validatePlanName('invalid.md')).toBe(false);
       expect(validatePlanName('no-extension')).toBe(false);
     });
   });
   ```

   Repeat for all validators.

3. **Run tests**

   ```bash
   pnpm test src/tooling/validators/
   ```

   Expected: All tests pass

4. **Commit**

   ```bash
   git add src/tooling/validators/*.test.ts
   git commit -m "test(validators): add tests for all validator modules

Added comprehensive test coverage for 6 validator modules:
- plan-naming-validator
- [list others]

Tests cover valid/invalid cases and edge conditions.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 5: Add Tests for hooks/claude/ Module

**Parallelizable** with Tasks 3-4, 6

**Goal:** Test Claude hooks module

**Files:**
- Create tests for files in `src/tooling/hooks/claude/`

**Steps:**

1. **Analyze Claude hooks**

   ```bash
   ls src/tooling/hooks/claude/
   ```

   Understand what each hook does.

2. **Write tests**

   Create test files for each hook. Example structure:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { claudeHookFunction } from './claude-hook-file.js';

   describe('Claude Hook', () => {
     it('should process valid input', () => {
       const result = claudeHookFunction(validInput);
       expect(result).toBeDefined();
     });

     it('should handle edge cases', () => {
       // Test edge cases specific to the hook
     });
   });
   ```

3. **Run tests**

   ```bash
   pnpm test src/tooling/hooks/claude/
   ```

   Expected: All tests pass

4. **Commit**

   ```bash
   git add src/tooling/hooks/claude/*.test.ts
   git commit -m "test(hooks): add tests for Claude hooks module

Added test coverage for Claude Code hooks:
- [list hooks tested]

Ensures hooks behave correctly for user workflows.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 6: Improve hooks/git/ Coverage to 80%

**Parallelizable** with Tasks 3-5

**Goal:** Increase git hooks test coverage from current level to 80%

**Files:**
- Modify: `src/tooling/hooks/git/*.test.ts`
- May create: New test files if needed

**Steps:**

1. **Check current coverage**

   ```bash
   pnpm test src/tooling/hooks/git/ --coverage
   ```

   Note which files/functions are not covered.

2. **Identify gaps**

   Look at coverage report for:
   - Uncovered functions
   - Uncovered branches (if/else paths)
   - Edge cases not tested

3. **Add missing tests**

   For each gap, add tests. Example:

   ```typescript
   it('should handle error case when git fails', async () => {
     // Mock git failure
     // Verify error handling
   });

   it('should validate commit message format', () => {
     // Test valid and invalid commit messages
   });
   ```

4. **Run coverage again**

   ```bash
   pnpm test src/tooling/hooks/git/ --coverage
   ```

   Expected: >= 80% coverage

5. **Commit**

   ```bash
   git add src/tooling/hooks/git/*.test.ts
   git commit -m "test(hooks): improve git hooks coverage to 80%

Enhanced test coverage for git hooks module:
- Added tests for error paths
- Covered edge cases
- Tested commit message validation

Coverage: [previous]% → 80%+

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Track C: Test Type Safety

### Task 7: Fix `any` Types in database/ Tests

**Standalone**

**Goal:** Replace all `any` types in 6 database test files

**Files:**
- Modify: 6 test files in `src/tooling/database/*.test.ts`

**Steps:**

1. **Find `any` types in database tests**

   ```bash
   grep -n ": any" src/tooling/database/*.test.ts
   ```

2. **For each occurrence, determine correct type**

   Common patterns:
   - Database row results → `unknown` then type-guard, or specific interface
   - Mock functions → `vi.fn<ReturnType>()`
   - Test data → Define interface for test data

3. **Replace `any` with proper types**

   Before:
   ```typescript
   const result: any = db.prepare("SELECT * FROM personas").all();
   ```

   After:
   ```typescript
   interface PersonaRow {
     id: number;
     name: string;
     // ... other fields
   }
   const result = db.prepare("SELECT * FROM personas").all() as PersonaRow[];
   ```

4. **Verify types**

   ```bash
   pnpm exec tsc --noEmit
   ```

   Expected: No type errors

5. **Run tests**

   ```bash
   pnpm test src/tooling/database/
   ```

   Expected: All tests pass

6. **Commit**

   ```bash
   git add src/tooling/database/*.test.ts
   git commit -m "test(database): eliminate any types from test files

Replaced all 'any' types in database tests with proper TypeScript types:
- Defined interfaces for database rows
- Typed mock functions correctly
- Used type guards for unknown values

Improved type safety and caught potential bugs.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 8: Fix `any` Types in personas/ Tests

**Parallelizable** with Tasks 7, 9

**Goal:** Replace all `any` types in 4 persona test files

**Files:**
- Modify: 4 test files in `src/tooling/personas/*.test.ts`

**Steps:**

1. **Find `any` types**

   ```bash
   grep -n ": any" src/tooling/personas/*.test.ts
   ```

2. **Replace with proper types**

   Use the same approach as Task 7:
   - Define interfaces for test data
   - Type mock functions
   - Use type guards for unknown values

3. **Verify and test**

   ```bash
   pnpm exec tsc --noEmit
   pnpm test src/tooling/personas/
   ```

4. **Commit**

   ```bash
   git add src/tooling/personas/*.test.ts
   git commit -m "test(personas): eliminate any types from test files

Replaced all 'any' types in persona tests with proper TypeScript types.
Improved type safety and test reliability.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 9: Fix `any` Types in reviews/ Tests

**Parallelizable** with Tasks 7-8

**Goal:** Replace all `any` types in 11 review test files

**Files:**
- Modify: 11 test files in `src/tooling/reviews/*.test.ts`

**Steps:**

1. **Find `any` types**

   ```bash
   grep -n ": any" src/tooling/reviews/*.test.ts
   ```

2. **Replace with proper types**

   Same approach as Tasks 7-8.

   Special attention to:
   - Review JSON schemas (use schema types)
   - Campaign data structures
   - Mock personas for testing

3. **Verify and test**

   ```bash
   pnpm exec tsc --noEmit
   pnpm test src/tooling/reviews/
   ```

4. **Commit**

   ```bash
   git add src/tooling/reviews/*.test.ts
   git commit -m "test(reviews): eliminate any types from test files

Replaced all 'any' types in review tests (11 files) with proper types.

Used schema types for review data structures.
Properly typed mock personas and campaign data.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Error Handling Foundation (Sequential)

### Task 10: Define Error Handling Standard

**Standalone**

**Goal:** Document error handling patterns for the project

**Files:**
- Create: `docs/style_guides/ERROR_HANDLING.md`

**Steps:**

1. **Create error handling guide**

   Create `docs/style_guides/ERROR_HANDLING.md`:

   ```markdown
   # Error Handling Standards

   ## Principles

   1. **Fail fast** - Validate inputs early
   2. **Specific errors** - Use custom error classes, not generic Error
   3. **Context** - Include relevant data in error messages
   4. **No silent failures** - Always propagate or log errors

   ## Custom Error Classes

   ```typescript
   export class DatabaseError extends Error {
     constructor(message: string, public readonly query?: string) {
       super(message);
       this.name = 'DatabaseError';
     }
   }

   export class ValidationError extends Error {
     constructor(message: string, public readonly field?: string) {
       super(message);
       this.name = 'ValidationError';
     }
   }
   ```

   ## Patterns

   ### Database Operations

   ```typescript
   try {
     const result = db.prepare(query).all();
     return result;
   } catch (error) {
     throw new DatabaseError(`Failed to execute query: ${error}`, query);
   }
   ```

   ### File I/O

   ```typescript
   try {
     const content = await fs.readFile(path, 'utf-8');
     return content;
   } catch (error) {
     throw new FileError(`Failed to read file: ${path}`, path);
   }
   ```

   ### Validation

   ```typescript
   if (!isValid(input)) {
     throw new ValidationError('Invalid input', 'fieldName');
   }
   ```

   ## Testing Errors

   ```typescript
   it('should throw DatabaseError on query failure', () => {
     expect(() => client.query(invalidSQL)).toThrow(DatabaseError);
   });
   ```
   ```

2. **Create error class module**

   Create `src/tooling/errors/index.ts`:

   ```typescript
   export class DatabaseError extends Error {
     constructor(message: string, public readonly query?: string) {
       super(message);
       this.name = 'DatabaseError';
     }
   }

   export class FileError extends Error {
     constructor(message: string, public readonly path?: string) {
       super(message);
       this.name = 'FileError';
     }
   }

   export class ValidationError extends Error {
     constructor(message: string, public readonly field?: string) {
       super(message);
       this.name = 'ValidationError';
     }
   }
   ```

3. **Write tests for error classes**

   Create `src/tooling/errors/index.test.ts`:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { DatabaseError, FileError, ValidationError } from './index.js';

   describe('Error Classes', () => {
     it('should create DatabaseError with context', () => {
       const error = new DatabaseError('Query failed', 'SELECT * FROM users');
       expect(error.name).toBe('DatabaseError');
       expect(error.message).toBe('Query failed');
       expect(error.query).toBe('SELECT * FROM users');
     });

     // Similar tests for FileError and ValidationError
   });
   ```

4. **Run tests**

   ```bash
   pnpm test src/tooling/errors/
   ```

5. **Commit**

   ```bash
   git add docs/style_guides/ERROR_HANDLING.md src/tooling/errors/
   git commit -m "docs(standards): define error handling standard and custom error classes

Created error handling standard document covering:
- Error handling principles
- Custom error classes (DatabaseError, FileError, ValidationError)
- Patterns for database, file I/O, and validation
- Testing error conditions

Implemented custom error classes with tests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 11: Implement Error Handling in database/

**Depends on:** Task 10 (error standard must be defined)

**Goal:** Replace generic error handling with custom DatabaseError

**Files:**
- Modify: All files in `src/tooling/database/` (except tests)

**Steps:**

1. **Add error imports**

   In each database file:
   ```typescript
   import { DatabaseError } from '../errors/index.js';
   ```

2. **Replace generic errors**

   Before:
   ```typescript
   try {
     return db.prepare(query).all();
   } catch (error) {
     console.error('Query failed:', error);
     throw error;
   }
   ```

   After:
   ```typescript
   try {
     return db.prepare(query).all();
   } catch (error) {
     throw new DatabaseError(
       `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`,
       query
     );
   }
   ```

3. **Update tests to expect DatabaseError**

   ```typescript
   it('should throw DatabaseError on invalid query', () => {
     expect(() => client.query('INVALID SQL')).toThrow(DatabaseError);
   });
   ```

4. **Run tests**

   ```bash
   pnpm test src/tooling/database/
   ```

5. **Commit**

   ```bash
   git add src/tooling/database/
   git commit -m "feat(database): implement custom error handling

Replaced generic error handling with DatabaseError throughout database module:
- Added DatabaseError imports
- Wrapped database operations with try/catch
- Included query context in error messages
- Updated tests to expect DatabaseError

Follows error handling standard from docs/style_guides/ERROR_HANDLING.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 12: Implement Error Handling in File I/O

**Depends on:** Task 10 (error standard must be defined)

**Goal:** Replace generic file I/O errors with custom FileError

**Files:**
- Modify: All files performing file operations (grep for `fs.readFile`, `fs.writeFile`)

**Steps:**

1. **Find all file I/O operations**

   ```bash
   grep -r "fs\." src/tooling/ --include="*.ts" --exclude="*.test.ts" -l
   ```

2. **For each file, add error handling**

   Import:
   ```typescript
   import { FileError } from '../errors/index.js';
   ```

   Wrap operations:
   ```typescript
   try {
     const content = await fs.readFile(path, 'utf-8');
     return content;
   } catch (error) {
     throw new FileError(
       `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
       path
     );
   }
   ```

3. **Update tests**

   ```typescript
   it('should throw FileError when file does not exist', async () => {
     await expect(readFile('/nonexistent')).rejects.toThrow(FileError);
   });
   ```

4. **Run tests**

   ```bash
   pnpm test
   ```

5. **Commit**

   ```bash
   git add src/tooling/
   git commit -m "feat(file-io): implement custom error handling for file operations

Replaced generic file I/O errors with FileError:
- Wrapped all fs operations with try/catch
- Included file path in error context
- Updated tests to expect FileError

Follows error handling standard from docs/style_guides/ERROR_HANDLING.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Phase 2 Completion Checklist

After completing all 12 tasks, verify:

```bash
# ✅ Logging framework in place
pnpm test src/tooling/logging/

# ✅ No console.log warnings
pnpm lint | grep console

# ✅ Critical modules have test coverage
pnpm test src/tooling/database/schema.test.ts
pnpm test src/tooling/validators/
pnpm test src/tooling/hooks/claude/

# ✅ Git hooks coverage >= 80%
pnpm test src/tooling/hooks/git/ --coverage

# ✅ Zero any types in test files
grep -r ": any" src/tooling/database/*.test.ts src/tooling/personas/*.test.ts src/tooling/reviews/*.test.ts

# ✅ Error handling standard documented and implemented
ls docs/style_guides/ERROR_HANDLING.md
pnpm test src/tooling/errors/

# ✅ All tests pass
pnpm test
```

---

## Moving to Phase 3

Once Phase 2 is complete:

1. Read `docs/plans/audit-remediation-P3.md`
2. Create todos for all 18 Phase 3 tasks
3. Begin execution (many tasks parallelizable)

---

**Phase 2 Status:** Ready for Execution
