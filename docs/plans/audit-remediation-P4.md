# Audit Remediation - Phase 4: Code Standards & Documentation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish and document coding standards for long-term project health.

**Duration:** 1-2 weeks

**Prerequisite:** Phase 3 must be complete

---

## Standards (Tasks 1-4: All Standalone)

### Task 1: Extract Magic Numbers to Constants

**Standalone**

**Goal:** Replace hardcoded numbers with named constants (~10 files affected)

**Files:**
- Modify: Files with magic numbers (find with audit or grep)
- Create: `src/tooling/constants/` directory for shared constants

**Steps:**

1. **Find magic numbers**

   ```bash
   # Look for numeric literals (excluding 0, 1, -1 which are usually fine)
   grep -rn "[^0-9][2-9][0-9]*" src/tooling/ --include="*.ts" --exclude="*.test.ts"
   ```

   Review each occurrence to determine if it's a magic number or acceptable literal.

2. **Create constants file**

   Create `src/tooling/constants/index.ts`:

   ```typescript
   /**
    * Database and schema constants
    */
   export const MAX_PERSONA_NAME_LENGTH = 100;
   export const DEFAULT_REVIEW_CAMPAIGN_TIMEOUT = 300000; // 5 minutes in ms
   export const MIN_RATING_SCORE = 1;
   export const MAX_RATING_SCORE = 10;

   /**
    * File system constants
    */
   export const MAX_FILE_SIZE_MB = 50;
   export const DEFAULT_ENCODING = 'utf-8';

   /**
    * Review system constants
    */
   export const CORE_PERSONA_COUNT = 8;
   export const REVIEW_DIMENSIONS_COUNT = 4;
   ```

3. **Replace magic numbers in code**

   Before:
   ```typescript
   if (rating < 1 || rating > 10) {
     throw new ValidationError('Rating must be between 1 and 10');
   }
   ```

   After:
   ```typescript
   import { MIN_RATING_SCORE, MAX_RATING_SCORE } from '../constants/index.js';

   if (rating < MIN_RATING_SCORE || rating > MAX_RATING_SCORE) {
     throw new ValidationError(`Rating must be between ${MIN_RATING_SCORE} and ${MAX_RATING_SCORE}`);
   }
   ```

4. **Verify**

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   ```

5. **Commit**

   ```bash
   git add src/tooling/constants/ src/tooling/
   git commit -m "refactor: extract magic numbers to named constants

Created constants module for project-wide values:
- Database and schema constraints
- File system limits
- Review system parameters

Replaced ~10 magic numbers with descriptive constants improving:
- Code readability
- Maintainability
- Consistency across modules

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 2: Add JSDoc to Public APIs

**Standalone**

**Goal:** Document ~30 public functions/classes with JSDoc

**Files:**
- Modify: All public API files in `src/tooling/`

**Steps:**

1. **Identify public APIs**

   Public APIs are:
   - Exported functions/classes
   - CLI commands
   - Database client methods
   - Persona generation functions
   - Review system functions

2. **Add JSDoc comments**

   Example for a function:

   ```typescript
   /**
    * Generates a persona based on the provided specifications.
    *
    * @param spec - The persona specification including archetype and experience level
    * @param options - Optional generation parameters
    * @returns A fully hydrated persona object
    * @throws {ValidationError} If spec is invalid
    *
    * @example
    * ```typescript
    * const persona = await generatePersona({
    *   archetype: 'Explorer',
    *   experienceLevel: 'Newbie'
    * });
    * ```
    */
   export async function generatePersona(
     spec: PersonaSpec,
     options?: GenerationOptions
   ): Promise<Persona> {
     // ...
   }
   ```

   Example for a class:

   ```typescript
   /**
    * Client for managing review campaigns in the database.
    *
    * Provides CRUD operations for campaigns, persona reviews, and analysis results.
    * All operations use transactions for data consistency.
    *
    * @example
    * ```typescript
    * const client = new CampaignClient(db);
    * const campaignId = client.createCampaign({
    *   contentId: 'book-123',
    *   personaIds: ['p1', 'p2']
    * });
    * ```
    */
   export class CampaignClient {
     // ...
   }
   ```

3. **JSDoc for interfaces/types**

   ```typescript
   /**
    * Represents a test reader persona with specific characteristics and preferences.
    */
   export interface Persona {
     /** Unique identifier for the persona */
     id: string;

     /** Display name for the persona */
     name: string;

     /** Character archetype (Explorer, Tactician, etc.) */
     archetype: PersonaArchetype;

     /** TTRPG experience level */
     experienceLevel: ExperienceLevel;
   }
   ```

4. **Document at least 30 public APIs**

   Priority modules:
   - `src/tooling/personas/generator.ts`
   - `src/tooling/reviews/campaign-client.ts`
   - `src/tooling/database/persona-client.ts`
   - `src/tooling/cli-commands/*.ts`

5. **Verify**

   ```bash
   pnpm exec tsc --noEmit
   ```

6. **Commit**

   ```bash
   git add src/tooling/
   git commit -m "docs: add JSDoc to public APIs

Added comprehensive JSDoc documentation to ~30 public APIs:
- Persona generation functions
- Review campaign client
- Database clients
- CLI command functions

Documentation includes:
- Function/class descriptions
- Parameter documentation
- Return type descriptions
- Error conditions
- Usage examples

Improves API discoverability and usage clarity.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 3: Create CONTRIBUTING.md

**Standalone**

**Goal:** Document coding standards and contribution guidelines

**Files:**
- Create: `CONTRIBUTING.md`

**Steps:**

1. **Create comprehensive contributing guide**

   Create `CONTRIBUTING.md`:

   ```markdown
   # Contributing to Razorweave

   ## Code Standards

   ### TypeScript

   - **Type Safety**: No `any` types (use `unknown` with type guards)
   - **Strict Mode**: Always enable strict TypeScript checking
   - **Interfaces**: Prefer interfaces over types for object shapes
   - **Naming**: PascalCase for types/interfaces, camelCase for functions/variables

   ### File Organization

   - **Naming**: kebab-case for files (e.g., `persona-generator.ts`)
   - **Location**: Place files in appropriate module directories
   - **Tests**: Co-locate tests with source (`*.test.ts`)
   - **Exports**: Use named exports, avoid default exports

   ### Error Handling

   See `docs/style_guides/ERROR_HANDLING.md` for detailed patterns.

   **Key Principles:**
   - Use custom error classes (DatabaseError, FileError, ValidationError)
   - Include context in error messages
   - Fail fast with input validation
   - Never silently swallow errors

   **Example:**

   ```typescript
   import { DatabaseError } from './errors/index.js';

   try {
     return db.prepare(query).all();
   } catch (error) {
     throw new DatabaseError(
       `Failed to execute query: ${error.message}`,
       query
     );
   }
   ```

   ### Testing

   See `TESTING.md` for complete testing guide.

   **Requirements:**
   - 80%+ code coverage
   - Tests for all public APIs
   - Integration tests for workflows
   - No `any` types in tests

   **Patterns:**

   ```typescript
   describe('Module', () => {
     it('should [expected behavior]', () => {
       // Arrange
       const input = createTestInput();

       // Act
       const result = functionUnderTest(input);

       // Assert
       expect(result).toBe(expected);
     });
   });
   ```

   ### Code Style

   - **Linting**: Run `pnpm lint` before committing
   - **Formatting**: Use project prettier/eslint config
   - **Magic Numbers**: Extract to named constants
   - **Comments**: Use JSDoc for public APIs
   - **DRY**: Don't repeat yourself - extract common logic
   - **YAGNI**: You ain't gonna need it - implement what's needed now

   ## Commit Standards

   Use conventional commits:

   ```
   <type>(<scope>): <description>

   [optional body]

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

   **Types:**
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `test`: Adding or updating tests
   - `refactor`: Code refactoring
   - `chore`: Maintenance tasks

   **Examples:**

   ```
   feat(personas): add affinity-based persona grouping
   fix(database): handle null values in review queries
   docs(api): add JSDoc to campaign client methods
   test(reviews): increase coverage to 85%
   ```

   ## Development Workflow

   1. **Before Starting:**
      - Pull latest from main
      - Run `pnpm install`
      - Run `pnpm test` to ensure baseline

   2. **During Development:**
      - Write tests first (TDD)
      - Run `pnpm test:watch` for rapid feedback
      - Keep commits small and focused

   3. **Before Committing:**
      - Run `pnpm lint`
      - Run `pnpm exec tsc --noEmit`
      - Run `pnpm test`
      - Verify all checks pass

   4. **Git Hooks:**
      - Pre-commit: Runs linting and type checking
      - Commit-msg: Validates commit message format

   ## Pull Requests

   - **Title**: Follow conventional commit format
   - **Description**: Explain what and why (not how)
   - **Tests**: Include test updates
   - **Documentation**: Update relevant docs
   - **Breaking Changes**: Call out in PR description

   ## Questions?

   - Check `docs/` for detailed documentation
   - Read `AGENTS.md` for AI assistant context
   - Ask in pull request comments
   ```

2. **Commit**

   ```bash
   git add CONTRIBUTING.md
   git commit -m "docs: create comprehensive contributing guide

Added CONTRIBUTING.md with:
- TypeScript and code standards
- Error handling patterns
- Testing requirements
- Code style guidelines
- Commit message format
- Development workflow
- Pull request guidelines

Provides clear guidance for all contributors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 4: Update TESTING.md

**Standalone**

**Goal:** Enhance testing guide with additional patterns and anti-patterns

**Files:**
- Modify: `TESTING.md` (created in Phase 3)

**Steps:**

1. **Add anti-patterns section**

   Add to `TESTING.md`:

   ```markdown
   ## Common Anti-Patterns

   ### Testing Implementation Details

   ❌ **Bad:**
   ```typescript
   it('should call internal helper function', () => {
     const spy = vi.spyOn(module, '_internalHelper');
     module.publicFunction();
     expect(spy).toHaveBeenCalled();
   });
   ```

   ✅ **Good:**
   ```typescript
   it('should return correct result', () => {
     const result = module.publicFunction();
     expect(result).toBe(expectedValue);
   });
   ```

   ### Mocking Everything

   ❌ **Bad:**
   ```typescript
   vi.mock('./module1.js');
   vi.mock('./module2.js');
   vi.mock('./module3.js');
   // Testing nothing but mocks
   ```

   ✅ **Good:**
   ```typescript
   // Only mock external dependencies (fs, database, network)
   vi.mock('node:fs/promises');
   // Test actual module integration
   ```

   ### Test-Dependent Tests

   ❌ **Bad:**
   ```typescript
   it('should create user', () => {
     userId = createUser(); // Leaking state
   });

   it('should update user', () => {
     updateUser(userId); // Depends on previous test
   });
   ```

   ✅ **Good:**
   ```typescript
   it('should update user', () => {
     const userId = createUser(); // Independent
     updateUser(userId);
     expect(getUser(userId)).toBe(updatedUser);
   });
   ```

   ## Testing Patterns by Module

   ### Database Tests

   ```typescript
   import Database from 'better-sqlite3';
   import { createTables } from '../database/schema.js';

   describe('Database Module', () => {
     let db: Database.Database;

     beforeEach(() => {
       db = new Database(':memory:');
       createTables(db);
     });

     afterEach(() => {
       db.close();
     });

     it('should insert and retrieve data', () => {
       const insert = db.prepare('INSERT INTO table (col) VALUES (?)');
       insert.run('value');

       const result = db.prepare('SELECT * FROM table').get();
       expect(result.col).toBe('value');
     });
   });
   ```

   ### Async Function Tests

   ```typescript
   it('should handle async operations', async () => {
     const result = await asyncFunction();
     expect(result).toBeDefined();
   });

   it('should handle async errors', async () => {
     await expect(failingAsyncFunction()).rejects.toThrow(ErrorType);
   });
   ```

   ### File I/O Tests

   ```typescript
   import { vi } from 'vitest';
   import * as fs from 'node:fs/promises';

   vi.mock('node:fs/promises');

   it('should read file', async () => {
     vi.mocked(fs.readFile).mockResolvedValue('file content');

     const content = await readMyFile('path');
     expect(content).toBe('file content');
     expect(fs.readFile).toHaveBeenCalledWith('path', 'utf-8');
   });
   ```

   ## Coverage Tips

   - **Focus on behavior**: Test what the code does, not how it does it
   - **Edge cases**: Empty arrays, null, undefined, boundary values
   - **Error paths**: Every throw/reject should be tested
   - **Integration**: At least one E2E test per major workflow
   ```

2. **Commit**

   ```bash
   git add TESTING.md
   git commit -m "docs: enhance testing guide with patterns and anti-patterns

Updated TESTING.md with:
- Common anti-patterns to avoid
- Testing patterns by module type
- Database testing examples
- Async function testing
- File I/O mocking patterns
- Coverage tips

Provides comprehensive guidance for writing effective tests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Organization (Tasks 5-6: Optional)

### Task 5: Split Large Directories (Optional)

**Optional**

**Goal:** Organize large directories (e.g., `reviews/` with 24 files)

**Note:** This task is optional. Only do it if the directory is genuinely hard to navigate.

**Files:**
- Reorganize: `src/tooling/reviews/` (if needed)

**Steps:**

1. **Analyze directory structure**

   ```bash
   ls -1 src/tooling/reviews/ | wc -l
   ```

   If > 20 files, consider splitting.

2. **Propose subdirectories**

   Example for reviews:
   - `reviews/campaigns/` - Campaign management
   - `reviews/prompts/` - Prompt generation
   - `reviews/schemas/` - Schema definitions
   - `reviews/writers/` - Markdown writers

3. **Move files**

   ```bash
   mkdir -p src/tooling/reviews/campaigns
   git mv src/tooling/reviews/campaign-*.ts src/tooling/reviews/campaigns/
   # Update imports in affected files
   ```

4. **Update imports**

   Use find/replace to update import paths.

5. **Run tests**

   ```bash
   pnpm test
   ```

6. **Commit**

   ```bash
   git add src/tooling/reviews/
   git commit -m "refactor(reviews): organize into subdirectories

Split large reviews/ directory into logical subdirectories:
- campaigns/ - Campaign management (client, orchestrator)
- prompts/ - Prompt generation and writing
- schemas/ - Review and analysis schemas
- writers/ - Markdown output writers

Improved organization for 24+ file module.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 6: Consolidate Tooling Configs (Optional)

**Optional**

**Goal:** Centralize configuration files

**Files:**
- May consolidate: Multiple config files into single configs

**Note:** This is optional and only worthwhile if there are many scattered configs.

**Steps:**

1. **Inventory config files**

   ```bash
   find . -name "*.config.*" -o -name ".*rc" | grep -v node_modules
   ```

2. **Identify consolidation opportunities**

   - Can eslint/prettier configs be merged?
   - Can TypeScript configs extend from a base?
   - Can vitest config include all test patterns?

3. **Consolidate where beneficial**

   Example: Create `tsconfig.base.json` extended by package configs.

4. **Test**

   ```bash
   pnpm lint
   pnpm exec tsc --noEmit
   pnpm test
   ```

5. **Commit**

   ```bash
   git add *.config.* tsconfig*.json
   git commit -m "chore(config): consolidate tooling configurations

Centralized configuration files:
- Created tsconfig.base.json for shared settings
- Merged duplicate eslint rules
- Simplified config inheritance

Reduced duplication and improved consistency.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Final Cleanup (Tasks 7-8)

### Task 7: Review and Document Stub Packages

**Goal:** Decide fate of `maintenance/` and `tools/` packages

**Files:**
- Modify: `packages/maintenance/README.md`
- Modify: `packages/tools/README.md`
- Possibly: Merge packages or mark as stubs

**Steps:**

1. **Analyze package contents**

   ```bash
   ls packages/maintenance/
   ls packages/tools/
   cat packages/maintenance/package.json
   cat packages/tools/package.json
   ```

2. **Determine status**

   For each package:
   - **Active**: Has code, used by project → Document thoroughly
   - **Stub**: Planned but not implemented → Mark as stub, document plan
   - **Obsolete**: No longer needed → Remove package

3. **Update READMEs**

   If **active**, document:
   - Purpose and responsibilities
   - How to use the package
   - Examples

   If **stub**, document:
   - Planned purpose
   - Current status: "Not yet implemented"
   - Timeline (if known)

   If **obsolete**, remove:
   ```bash
   git rm -r packages/[package-name]
   ```

4. **Update main package.json if needed**

   Remove references to deleted packages.

5. **Commit**

   ```bash
   git add packages/ package.json
   git commit -m "chore(packages): document and organize stub packages

Reviewed maintenance and tools packages:
- [Documented/Marked as stub/Removed] maintenance package
- [Documented/Marked as stub/Removed] tools package

Updated READMEs to clarify purpose and status.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Task 8: Establish Quarterly Audit Cadence

**Goal:** Schedule regular project audits

**Files:**
- Create: `docs/processes/AUDIT_CADENCE.md`
- Modify: `PLAN.md` to include audit schedule

**Steps:**

1. **Create audit cadence document**

   Create `docs/processes/AUDIT_CADENCE.md`:

   ```markdown
   # Audit Cadence

   ## Schedule

   Project audits are conducted quarterly to maintain code quality and project hygiene.

   **Next Audits:**
   - 2025-Q1: February 2025
   - 2025-Q2: May 2025
   - 2025-Q3: August 2025
   - 2025-Q4: November 2025

   ## Audit Checklist

   ### Project Hygiene Audit

   - [ ] Check for files violating root whitelist
   - [ ] Review plan directory organization
   - [ ] Verify documentation is current
   - [ ] Check for orphaned files
   - [ ] Review database location and integrity

   ### Code Quality Audit

   - [ ] Run linter: `pnpm lint`
   - [ ] Check TypeScript errors: `pnpm exec tsc --noEmit`
   - [ ] Generate coverage report: `pnpm test:coverage`
   - [ ] Review coverage gaps
   - [ ] Check for `any` types: `grep -r ": any" src/`
   - [ ] Identify magic numbers
   - [ ] Review public APIs for documentation

   ### Metrics to Track

   | Metric | Target | Current |
   |--------|--------|---------|
   | Test Coverage | 80%+ | [UPDATE] |
   | TypeScript Errors | 0 | [UPDATE] |
   | Linter Errors | 0 | [UPDATE] |
   | Linter Warnings | <10 | [UPDATE] |
   | Code Quality Score | 8/10 | [UPDATE] |

   ## Audit Process

   1. **Run Audit Tools**
      - Execute hygiene audit
      - Execute code quality audit
      - Generate reports in `data/audits/YYYY-MM-DD-*.md`

   2. **Review Findings**
      - Categorize by severity (CRITICAL, HIGH, MEDIUM, LOW)
      - Identify trends from previous audits
      - Note improvements

   3. **Create Remediation Plan**
      - If >20 findings: Create formal remediation plan
      - If <20 findings: Add to backlog as individual tasks
      - Prioritize by risk and impact

   4. **Execute Remediation**
      - Complete high-priority items within 2 weeks
      - Schedule medium/low items for next sprint

   ## Continuous Monitoring

   Between quarterly audits:
   - Git hooks enforce commit message format
   - CI runs linting and tests
   - Code reviews check for anti-patterns
   - Coverage reports on every PR
   ```

2. **Update PLAN.md**

   Add to `PLAN.md`:

   ```markdown
   ## Audit Schedule

   **Next Quarterly Audit:** February 2025

   See `docs/processes/AUDIT_CADENCE.md` for details.
   ```

3. **Set calendar reminder**

   (If you have access to a calendar system, set recurring reminders)

4. **Commit**

   ```bash
   git add docs/processes/AUDIT_CADENCE.md PLAN.md
   git commit -m "docs: establish quarterly audit cadence

Created audit process documentation:
- Quarterly audit schedule
- Hygiene and code quality checklists
- Metrics tracking template
- Audit process workflow
- Continuous monitoring practices

Updated PLAN.md with next audit date.

Ensures ongoing project health maintenance.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## Phase 4 Completion Checklist

After completing all 8 tasks, verify:

```bash
# ✅ Magic numbers extracted
grep -r "src/tooling/constants" src/tooling/ --include="*.ts" | wc -l
# Should have imports of constants

# ✅ Public APIs documented
# Manually review key modules for JSDoc

# ✅ CONTRIBUTING.md exists
ls CONTRIBUTING.md

# ✅ TESTING.md updated
grep "Anti-Pattern" TESTING.md

# ✅ Packages documented
ls packages/*/README.md

# ✅ Audit cadence established
ls docs/processes/AUDIT_CADENCE.md
grep "Next Quarterly Audit" PLAN.md

# ✅ All tests still pass
pnpm test

# ✅ Linting passes
pnpm lint

# ✅ No TypeScript errors
pnpm exec tsc --noEmit
```

---

## Final Audit Metrics

After completing all 4 phases, verify success criteria:

```bash
# Run final audit
pnpm exec tsx src/tooling/audits/code-quality-audit.ts
pnpm exec tsx src/tooling/audits/project-hygiene-audit.ts
```

**Expected Results:**

| Metric | Before | Target | Achieved |
|--------|--------|--------|----------|
| TypeScript errors | 3 | 0 | ? |
| Linter errors | 41 | 0 | ? |
| Linter warnings | 143 | <10 | ? |
| Test coverage | 17.5% | 80%+ | ? |
| Untested packages | 7/8 | 0/8 | ? |
| Code quality score | 6/10 | 8/10 | ? |

---

## Celebration & Next Steps

**Congratulations!** You've completed all 53 tasks across 4 phases, improving project quality from 6/10 to 8/10.

**Next Steps:**
1. Celebrate the achievement
2. Run final metrics audit
3. Document lessons learned
4. Plan next quarter's priorities
5. Return to feature development with confidence

**Audit Remediation Complete!** 🎉

---

**Phase 4 Status:** Ready for Execution
