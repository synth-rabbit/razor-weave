# Audit Remediation - Phase 3: Testing Infrastructure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reach 80%+ test coverage target through comprehensive testing infrastructure.

**Duration:** 2-3 weeks

**Prerequisite:** Phase 2 must be complete

---

## Module Coverage (Tasks 1-4: All Parallelizable)

### Task 1: Add Tests for linters/ Module

**Parallelizable** with Tasks 2-4

**Files:**
- Create tests for 4 linter files in `src/tooling/linters/`

**Steps:**

1. **List linter files**

   ```bash
   ls src/tooling/linters/*.ts | grep -v test
   ```

2. **For each linter, create tests**

   Example test structure:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { linterFunction } from './linter-file.js';

   describe('Linter Name', () => {
     it('should pass valid input', () => {
       const result = linterFunction(validInput);
       expect(result.errors).toHaveLength(0);
     });

     it('should detect violations', () => {
       const result = linterFunction(invalidInput);
       expect(result.errors).toHaveLength(1);
       expect(result.errors[0]).toContain('expected error message');
     });

     it('should handle edge cases', () => {
       // Test empty input, null, undefined, etc.
     });
   });
   ```

3. **Run tests**

   ```bash
   pnpm test src/tooling/linters/
   ```

   Expected: All tests pass

4. **Commit**

   ```bash
   git add src/tooling/linters/*.test.ts
   git commit -m "test(linters): add comprehensive tests for linter modules

Added test coverage for 4 linter modules:
- [list linters]

Tests cover valid inputs, violation detection, and edge cases.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 2: Add Tests for scripts/ Module

**Parallelizable** with Tasks 1, 3-4

**Files:**
- Create tests for 3 script files in `src/tooling/scripts/`

**Steps:**

1. **List script files**

   ```bash
   ls src/tooling/scripts/*.ts | grep -v test
   ```

2. **For each script, create tests**

   Scripts often do file I/O or database operations, so use mocks:

   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { scriptFunction } from './script-file.js';

   vi.mock('node:fs/promises');

   describe('Script Name', () => {
     beforeEach(() => {
       vi.clearAllMocks();
     });

     it('should execute successfully with valid input', async () => {
       const result = await scriptFunction(validInput);
       expect(result).toBe(expectedOutput);
     });

     it('should handle errors gracefully', async () => {
       // Mock failure scenario
       // Verify error handling
     });
   });
   ```

3. **Run tests**

   ```bash
   pnpm test src/tooling/scripts/
   ```

4. **Commit**

   ```bash
   git add src/tooling/scripts/*.test.ts
   git commit -m "test(scripts): add tests for utility scripts

Added test coverage for 3 utility scripts:
- verify-database.ts
- [list others]

Tests cover success paths and error handling.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 3: Add Tests for updaters/ Module

**Parallelizable** with Tasks 1-2, 4

**Files:**
- Create tests for 3 updater files in `src/tooling/updaters/`

**Steps:**

1. **List updater files**

   ```bash
   ls src/tooling/updaters/*.ts | grep -v test
   ```

2. **Create tests for each updater**

   Updaters likely modify data, so test before/after states:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { updaterFunction } from './updater-file.js';

   describe('Updater Name', () => {
     it('should update data correctly', () => {
       const input = { /* initial state */ };
       const result = updaterFunction(input);
       expect(result).toEqual({ /* expected updated state */ });
     });

     it('should not modify data when no update needed', () => {
       const input = { /* already correct */ };
       const result = updaterFunction(input);
       expect(result).toEqual(input);
     });
   });
   ```

3. **Run tests**

   ```bash
   pnpm test src/tooling/updaters/
   ```

4. **Commit**

   ```bash
   git add src/tooling/updaters/*.test.ts
   git commit -m "test(updaters): add tests for updater modules

Added test coverage for 3 updater modules:
- [list updaters]

Tests verify correct data transformations and idempotency.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 4: Improve CLI Commands Coverage (60% → 80%)

**Parallelizable** with Tasks 1-3

**Files:**
- Modify: `src/tooling/cli-commands/*.test.ts`
- May create: New test files if missing

**Steps:**

1. **Check current coverage**

   ```bash
   pnpm test src/tooling/cli-commands/ --coverage
   ```

   Note coverage percentage and which files/functions are not covered.

2. **Identify gaps**

   Look for:
   - CLI argument parsing not tested
   - Error paths not covered
   - Edge cases (missing arguments, invalid inputs)

3. **Add missing tests**

   ```typescript
   describe('CLI Command', () => {
     it('should handle missing required arguments', () => {
       expect(() => cliCommand([])).toThrow('Missing required argument');
     });

     it('should parse arguments correctly', () => {
       const result = cliCommand(['--flag', 'value']);
       expect(result.flag).toBe('value');
     });

     it('should show help when --help is passed', () => {
       const output = cliCommand(['--help']);
       expect(output).toContain('Usage:');
     });
   });
   ```

4. **Run coverage again**

   ```bash
   pnpm test src/tooling/cli-commands/ --coverage
   ```

   Expected: >= 80% coverage

5. **Commit**

   ```bash
   git add src/tooling/cli-commands/*.test.ts
   git commit -m "test(cli): improve CLI commands coverage to 80%

Enhanced test coverage for CLI commands:
- Added argument parsing tests
- Covered error paths
- Tested help output and validation

Coverage: 60% → 80%+

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Integration & E2E Tests (Tasks 5-7)

### Task 5: Add E2E Workflow Test: Generate Persona → Create Campaign → Run Review

**Depends on:** Existing unit tests (Phase 2 Tasks 3-6)

**Goal:** Test the complete workflow from persona generation to review completion

**Files:**
- Create: `src/tooling/integration/end-to-end.test.ts`

**Steps:**

1. **Create integration test directory if needed**

   ```bash
   mkdir -p src/tooling/integration
   ```

2. **Write E2E test**

   Create `src/tooling/integration/end-to-end.test.ts`:

   ```typescript
   import { describe, it, expect, beforeEach, afterEach } from 'vitest';
   import Database from 'better-sqlite3';
   import { generatePersona } from '../personas/generator.js';
   import { createCampaign } from '../reviews/campaign-client.js';
   import { createPersonaReview } from '../reviews/campaign-client.js';
   import { createTables } from '../database/schema.js';

   describe('End-to-End Workflow', () => {
     let db: Database.Database;

     beforeEach(() => {
       db = new Database(':memory:');
       createTables(db);
     });

     afterEach(() => {
       db.close();
     });

     it('should complete full persona review workflow', async () => {
       // Step 1: Generate a persona
       const persona = await generatePersona({
         archetype: 'Explorer',
         experienceLevel: 'Newbie',
       });

       // Insert persona into database
       const insertPersona = db.prepare(`
         INSERT INTO personas (id, name, archetype, experience_level, data)
         VALUES (?, ?, ?, ?, ?)
       `);
       insertPersona.run(
         persona.id,
         persona.name,
         persona.archetype,
         persona.experienceLevel,
         JSON.stringify(persona)
       );

       // Step 2: Create a review campaign
       const campaignId = createCampaign(db, {
         contentId: 'test-content-123',
         contentType: 'book',
         personaIds: [persona.id],
       });

       expect(campaignId).toBeDefined();

       // Step 3: Create a persona review
       const reviewId = createPersonaReview(db, {
         campaignId,
         personaId: persona.id,
         reviewData: {
           clarity: 8,
           accuracy: 9,
           personaFit: 7,
           usability: 8,
           feedback: 'Test review feedback',
         },
       });

       expect(reviewId).toBeGreaterThan(0);

       // Verify the workflow completed successfully
       const review = db.prepare('SELECT * FROM persona_reviews WHERE id = ?').get(reviewId);
       expect(review).toBeDefined();
     });
   });
   ```

3. **Run test**

   ```bash
   pnpm test src/tooling/integration/end-to-end.test.ts
   ```

   Expected: Test passes

4. **Commit**

   ```bash
   git add src/tooling/integration/
   git commit -m "test(integration): add end-to-end workflow test

Added E2E test covering complete review workflow:
1. Generate persona
2. Create review campaign
3. Create persona review

Validates integration between personas, database, and review systems.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 6: Add Git Commit Workflow Test

**Depends on:** Phase 2, Task 6 (git hooks coverage)

**Goal:** Test the git commit workflow including hooks

**Files:**
- Create: `src/tooling/hooks/git/commit-workflow.test.ts`

**Steps:**

1. **Write workflow test**

   ```typescript
   import { describe, it, expect, beforeEach, afterEach } from 'vitest';
   import { execSync } from 'node:child_process';
   import * as fs from 'node:fs/promises';
   import * as path from 'node:path';

   describe('Git Commit Workflow', () => {
     let testDir: string;

     beforeEach(async () => {
       // Create temp git repo for testing
       testDir = await fs.mkdtemp('/tmp/git-test-');
       execSync('git init', { cwd: testDir });
       execSync('git config user.email "test@example.com"', { cwd: testDir });
       execSync('git config user.name "Test User"', { cwd: testDir });
     });

     afterEach(async () => {
       // Clean up
       await fs.rm(testDir, { recursive: true });
     });

     it('should allow valid commit message', async () => {
       // Create a test file
       await fs.writeFile(path.join(testDir, 'test.txt'), 'test content');
       execSync('git add .', { cwd: testDir });

       // Commit with valid message
       const validMessage = 'feat: add new feature';
       expect(() => {
         execSync(`git commit -m "${validMessage}"`, { cwd: testDir });
       }).not.toThrow();
     });

     it('should reject invalid commit message', async () => {
       // Create a test file
       await fs.writeFile(path.join(testDir, 'test.txt'), 'test content');
       execSync('git add .', { cwd: testDir });

       // Try to commit with invalid message
       const invalidMessage = 'invalid message format';
       expect(() => {
         execSync(`git commit -m "${invalidMessage}"`, { cwd: testDir });
       }).toThrow();
     });
   });
   ```

2. **Run test**

   ```bash
   pnpm test src/tooling/hooks/git/commit-workflow.test.ts
   ```

3. **Commit**

   ```bash
   git add src/tooling/hooks/git/commit-workflow.test.ts
   git commit -m "test(hooks): add git commit workflow integration test

Added integration test for git commit workflow:
- Tests valid commit message formats
- Verifies hook rejection of invalid messages
- Uses temporary git repo for isolated testing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 7: Add CLI E2E Tests

**Depends on:** Task 4 (CLI coverage improvement)

**Goal:** Test CLI commands end-to-end with real database

**Files:**
- Create: `src/tooling/cli-commands/cli-e2e.test.ts`

**Steps:**

1. **Write CLI E2E test**

   ```typescript
   import { describe, it, expect, beforeEach, afterEach } from 'vitest';
   import Database from 'better-sqlite3';
   import { personasCommand } from './personas.js';
   import { reviewCommand } from './review.js';
   import { createTables } from '../database/schema.js';

   describe('CLI End-to-End', () => {
     let db: Database.Database;

     beforeEach(() => {
       db = new Database(':memory:');
       createTables(db);
     });

     afterEach(() => {
       db.close();
     });

     it('should generate personas via CLI', async () => {
       const result = await personasCommand(['generate', '--count', '5']);
       expect(result.generated).toBe(5);

       const personas = db.prepare('SELECT * FROM personas').all();
       expect(personas).toHaveLength(5);
     });

     it('should list personas via CLI', async () => {
       // Insert test persona
       db.prepare(`
         INSERT INTO personas (id, name, archetype, experience_level, data)
         VALUES (?, ?, ?, ?, ?)
       `).run('test-1', 'Test Persona', 'Explorer', 'Newbie', '{}');

       const result = await personasCommand(['list']);
       expect(result.personas).toHaveLength(1);
       expect(result.personas[0].name).toBe('Test Persona');
     });

     it('should create review campaign via CLI', async () => {
       const result = await reviewCommand([
         'book',
         '/path/to/test-book.html',
         '--personas', 'test-1,test-2'
       ]);

       expect(result.campaignId).toBeDefined();
     });
   });
   ```

2. **Run tests**

   ```bash
   pnpm test src/tooling/cli-commands/cli-e2e.test.ts
   ```

3. **Commit**

   ```bash
   git add src/tooling/cli-commands/cli-e2e.test.ts
   git commit -m "test(cli): add end-to-end CLI tests

Added E2E tests for CLI commands:
- Persona generation and listing
- Review campaign creation
- Full command execution with database

Validates CLI integration with database and business logic.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Test Infrastructure (Tasks 8-10)

### Task 8: Add Vitest Coverage Config

**Standalone**

**Files:**
- Modify: `vitest.config.ts`

**Steps:**

1. **Update vitest config**

   Open `vitest.config.ts` and add coverage configuration:

   ```typescript
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       coverage: {
         provider: 'v8', // or 'istanbul'
         reporter: ['text', 'json', 'html', 'lcov'],
         exclude: [
           'node_modules/',
           'dist/',
           '**/*.test.ts',
           '**/*.config.ts',
           '**/types/**',
         ],
         thresholds: {
           lines: 80,
           functions: 80,
           branches: 80,
           statements: 80,
         },
       },
     },
   });
   ```

2. **Install coverage provider if needed**

   ```bash
   pnpm add -D @vitest/coverage-v8
   ```

3. **Test coverage command**

   ```bash
   pnpm test --coverage
   ```

   Expected: Coverage report generated

4. **Commit**

   ```bash
   git add vitest.config.ts package.json pnpm-lock.yaml
   git commit -m "test(config): add vitest coverage configuration

Configured vitest coverage reporting:
- Provider: v8
- Reporters: text, json, html, lcov
- Thresholds: 80% for all metrics
- Excluded: node_modules, dist, test files, configs

Run with: pnpm test --coverage

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 9: Set Up Coverage Reporting

**Depends on:** Task 8 (coverage config must exist)

**Files:**
- Modify: `package.json` (add coverage scripts)
- Create: `.gitignore` entry for coverage directory

**Steps:**

1. **Add coverage scripts to package.json**

   ```json
   {
     "scripts": {
       "test:coverage": "vitest run --coverage",
       "test:coverage:watch": "vitest watch --coverage",
       "test:coverage:ui": "vitest --ui --coverage"
     }
   }
   ```

2. **Update .gitignore**

   ```bash
   echo "coverage/" >> .gitignore
   echo ".nyc_output/" >> .gitignore
   ```

3. **Generate coverage report**

   ```bash
   pnpm test:coverage
   ```

   Expected: Coverage report in `coverage/` directory

4. **Verify HTML report**

   ```bash
   ls coverage/index.html
   ```

   Open in browser to view detailed coverage.

5. **Commit**

   ```bash
   git add package.json .gitignore
   git commit -m "test(coverage): set up coverage reporting scripts

Added coverage reporting infrastructure:
- npm scripts: test:coverage, test:coverage:watch, test:coverage:ui
- Gitignore: coverage/ directory
- HTML reports for detailed coverage visualization

Run: pnpm test:coverage

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 10: Document Testing Patterns in TESTING.md

**Standalone**

**Files:**
- Create or Modify: `TESTING.md`

**Steps:**

1. **Create comprehensive testing guide**

   Create or update `TESTING.md`:

   ```markdown
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
   pnpm test:watch
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

   vi.mock('node:fs/promises');
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

   ✅ Test behavior, not implementation
   ✅ Use in-memory database for database tests
   ✅ Mock file I/O operations
   ✅ Make tests independent and isolated
   ✅ Use proper types in test code

   ## Coverage Goals

   - Overall: 80%+
   - Critical modules (database, schemas): 90%+
   - All modules: At least 60%

   ## CI/CD

   Tests run on every commit via git hooks.
   Coverage reports generated on CI runs.
   ```

2. **Commit**

   ```bash
   git add TESTING.md
   git commit -m "docs: create comprehensive testing guide

Added TESTING.md with:
- Test running commands
- Test structure and patterns
- Database testing best practices
- File I/O mocking patterns
- Error testing patterns
- Anti-patterns to avoid
- Coverage goals

Provides clear guidance for writing tests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Remaining Test Type Safety (Tasks 11-18)

### Tasks 11-18: Fix `any` Types in Remaining Test Files

**All Parallelizable**

**Goal:** Eliminate remaining `any` types in test files

**Affected Files:**
- CLI command tests (`src/tooling/cli-commands/*.test.ts`)
- Validator tests (`src/tooling/validators/*.test.ts`)
- Script tests (`src/tooling/scripts/*.test.ts`)
- Linter tests (`src/tooling/linters/*.test.ts`)
- Updater tests (`src/tooling/updaters/*.test.ts`)
- Integration tests (`src/tooling/integration/*.test.ts`)
- Hook tests (`src/tooling/hooks/**/*.test.ts`)
- Any other test files with `any` types

**Steps for each task:**

1. **Find `any` types in target directory**

   ```bash
   grep -r ": any" src/tooling/[module]/*.test.ts
   ```

2. **Replace with proper types**

   Use same approach as Phase 2 Tasks 7-9:
   - Define interfaces
   - Type mocks correctly
   - Use type guards

3. **Verify**

   ```bash
   pnpm exec tsc --noEmit
   pnpm test src/tooling/[module]/
   ```

4. **Commit**

   ```bash
   git add src/tooling/[module]/*.test.ts
   git commit -m "test([module]): eliminate any types from tests

Replaced all 'any' types with proper TypeScript types.
Improved type safety and test reliability.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

**Note:** If needed, create additional tasks beyond 18 to reach 80% coverage goal. Monitor coverage with `pnpm test:coverage` and add tests for any modules below threshold.

---

## Phase 3 Completion Checklist

After completing all tasks, verify:

```bash
# ✅ All modules have test coverage
find src/tooling -name "*.ts" -not -name "*.test.ts" -exec basename {} \; | while read f; do
  [ -f "src/tooling/$(dirname $f)/$(basename $f .ts).test.ts" ] || echo "Missing test: $f"
done

# ✅ Test coverage >= 80%
pnpm test:coverage
# Check overall coverage in output

# ✅ E2E tests exist
ls src/tooling/integration/end-to-end.test.ts
ls src/tooling/hooks/git/commit-workflow.test.ts
ls src/tooling/cli-commands/cli-e2e.test.ts

# ✅ Coverage reporting configured
pnpm test:coverage
ls coverage/index.html

# ✅ TESTING.md guide created
ls TESTING.md

# ✅ Zero any types in all test files
grep -r ": any" src/tooling/**/*.test.ts | wc -l
# Should be 0

# ✅ All tests pass
pnpm test
```

---

## Moving to Phase 4

Once Phase 3 is complete:

1. Read `docs/plans/audit-remediation-P4.md`
2. Create todos for all 8 Phase 4 tasks
3. Begin execution (mostly parallel tasks)

---

**Phase 3 Status:** Ready for Execution
