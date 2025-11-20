# Code Quality Audit Design

**Date:** 2025-11-20
**Status:** Design
**Output Location:** `data/audits/code-quality-audit-YYYY-MM-DD.md`

## Purpose & Goals

This audit will serve three primary goals:

1. **Decision-making for cleanup** - Identify what needs refactoring/reorganizing to inform future work priorities
2. **Quality baseline** - Establish current state metrics to track improvement over time
3. **Risk assessment** - Identify areas with poor test coverage or quality issues that could cause production problems

## Methodology

The audit combines automated analysis with manual code review:

- **Automated metrics**: Use existing tooling (eslint, TypeScript compiler, vitest) to gather quantitative data
- **Manual sampling**: Review representative files from each package for code smells and patterns
- **Dependency analysis**: Map inter-package dependencies and identify circular or problematic relationships
- **Test quality review**: Examine actual test files to assess if they're testing real behavior vs mocks

## Report Structure

The final audit report will be organized as:

### 1. Executive Summary

- High-level scores (organization, code quality, testing, standards consistency)
- Critical findings requiring immediate attention
- Top 3 priorities ranked by impact/risk
- Overall health assessment

### 2. Code Outside /src Analysis

**Categorization Framework**

All code outside `/src` will be classified into four categories:

1. **Acceptable tooling** - Build configs, linter configs, git hooks that legitimately belong at root (`.eslintrc.cjs`, `.prettierrc.cjs`, `vitest.config.ts`)
2. **Debatable but common** - Files that could live in `/src` but commonly live at root (`.claude/hooks/`, `scripts/`)
3. **Should relocate** - Code that clearly belongs in a package but lives outside
4. **Legacy/unclear** - Files whose purpose needs investigation before deciding

**For Each File:**

- Current location and purpose
- Whether it imports from `/src` packages (creates reverse dependency issues)
- Recommendation: keep, relocate, or investigate
- If relocate: suggested destination package
- Migration effort estimate (trivial, moderate, significant)

**Current Files Identified:**

- `.claude/hooks/` (4 TypeScript files)
- `scripts/verify-database.ts`

### 3. Package-by-Package Assessment

Each of the 8 packages will be analyzed using this template:

#### Organization & Structure

- Directory layout evaluation (logical grouping, depth, naming)
- Module boundaries and cohesion
- Public API surface vs internal implementation

#### Code Quality Deep Dive

- Sample 3-5 representative files for manual review
- Common patterns identified (good and problematic)
- Code smells:
  - Long functions (>50 lines)
  - Deep nesting (>3 levels)
  - Duplicated logic
  - Magic numbers
  - Unclear naming
  - Missing documentation
- Error handling patterns (or lack thereof)
- Type safety: proper TypeScript usage vs `any` abuse

#### Dependencies

- Imports from other packages (check for circular dependencies)
- External dependencies (unused? duplicated across packages?)
- Internal coupling assessment

#### Test Coverage

- Percentage of files with tests
- Unit vs integration test distribution
- Critical paths lacking coverage

#### Risk Score

Each package gets scored (Low/Medium/High/Critical) based on:

```
Risk = (Complexity + Poor Quality + Low Test Coverage + High Coupling)
```

**Packages to Analyze:**

1. `src/shared`
2. `src/agents`
3. `src/cli`
4. `src/maintenance`
5. `src/site`
6. `src/tooling`
7. `src/tools`
8. `src/workflows`

### 4. Standards Consistency & Gap Analysis

**Cross-Package Consistency Check**

Evaluate consistency across all packages in these areas:

#### Code Standards

- **Naming conventions**
  - Variables (camelCase, SCREAMING_SNAKE_CASE for constants?)
  - Functions (verb-first naming?)
  - Files (kebab-case, camelCase, PascalCase?)
  - Exports (named vs default?)
- **Error handling patterns**
  - Throw vs return errors?
  - Error types (custom classes, plain Error, typed objects?)
  - Error propagation strategy
- **Async patterns**
  - async/await vs promises
  - Error propagation in async code
- **File organization**
  - Index exports (barrel files)
  - Directory structure depth
  - Co-location of related code
- **Comment/documentation patterns**
  - TSDoc/JSDoc usage
  - When to comment (complex logic, why not what)
- **TypeScript strictness**
  - tsconfig settings across packages
  - `any` usage policies
  - Type inference vs explicit types

#### Project Structure Standards

- **Package.json structure**
  - Script naming conventions
  - Dependency organization
- **Build output**
  - `dist/` placement
  - Output structure consistency
- **Test file conventions**
  - `.test.ts` vs `.spec.ts`
  - Co-located vs `/tests` directory
  - Test file naming patterns
- **Config file locations**
  - Root vs package-level
  - Shared configs vs per-package
- **Import path styles**
  - Relative vs absolute imports
  - Index re-exports usage
  - Alias configuration

#### Findings Format

For each area, report:

- **Current state**: What patterns exist now (with examples from different packages)
- **Consistency score**: Percentage of packages following the same pattern
- **Standard recommendation**: If inconsistent, what should the standard be?
- **Standards gap**: Areas where NO clear pattern exists (needs new standard to be defined)

### 5. Comprehensive Testing Analysis

#### Test Coverage Metrics

Raw numbers gathered from vitest:

- Overall coverage percentage (lines, branches, functions, statements)
- Per-package coverage breakdown
- Files with 0% coverage (flagged as critical risk)
- Coverage trend (if git history allows comparison)

#### Test Quality Assessment

Manual review of test files to evaluate:

**Anti-patterns to detect:**

- Tests that only verify mocks were called (not testing real behavior)
- Tests without meaningful assertions (`expect(true).toBe(true)`)
- Overly broad try-catch blocks hiding failures
- Brittle tests (coupled to implementation details)
- Missing edge case coverage (null, empty, error conditions)
- Flaky tests (timing-dependent, order-dependent)

**Test distribution:**

- **Unit tests**: Isolated function/class testing
- **Integration tests**: Multiple components working together
- **End-to-end tests**: Full workflow validation
- **Ratio analysis**: Is the balance appropriate for this project?

**Current state:**

- 28 test files
- 75 non-test TypeScript files
- ~37% test file ratio (good baseline, but need to check quality and coverage)

#### Gap Analysis with Risk Scoring

For each package, identify:

**Critical paths lacking tests:**

- Database operations (data loss risk)
- File system operations (data corruption risk)
- CLI commands (user-facing, hard to debug)
- Public APIs (breaking changes impact users)

**Risk score formula:**

```
Risk = (Complexity × Impact × Usage Frequency) / Test Coverage
```

**Output:** Prioritized list of "highest risk untested code" with specific file:line references

### 6. Cross-Cutting Concerns & Architecture

#### Monorepo Architecture Evaluation

**Package dependency graph:**

- Visualize which packages import from which
- Identify circular dependencies (major red flag)
- Evaluate dependency direction (does it flow logically?)
- Should `shared` be the only package others depend on, or are there other acceptable patterns?

**Package boundaries assessment:**

- Are responsibilities clearly separated?
- Is there code that belongs in a different package?
- Should any packages be merged or split?
- Are there "god packages" doing too much?

**Current package structure:**

```
src/
├── shared/      - Common utilities, types
├── agents/      - Automated agents
├── cli/         - CLI entry points
├── maintenance/ - Maintenance tasks
├── site/        - Website/documentation
├── tooling/     - Development tools
├── tools/       - ?
└── workflows/   - Workflow orchestration
```

#### Build & Deployment Hygiene

- Do all packages build independently?
- Are `dist/` outputs gitignored consistently?
- Do build scripts follow the same patterns?
- Are there unused build artifacts?
- Is the monorepo workspace configuration correct?

#### Common Code Smells Across Codebase

These will be identified through sampling and pattern matching:

- **Duplicated logic** - Same code in multiple packages (should be in `shared`)
- **Inappropriate coupling** - Reaching into internal implementation of other packages
- **Missing abstraction layers** - Direct database access everywhere vs through a client
- **Configuration management** - Hardcoded values, env vars, config files (inconsistent patterns)
- **God objects** - Classes/modules doing too many things
- **Feature envy** - Code that uses another module more than its own
- **Long parameter lists** - Functions with >4 parameters

### 7. Prioritized Recommendations

Final section ranks all findings by:

- **Impact**: How much does fixing this improve the codebase? (1-10)
- **Effort**: How hard is it to fix? (1-10)
- **Risk**: What could break if we do this? (Low/Medium/High)

**Output categories:**

1. **Quick Wins** (Low effort, High impact)
   - Should do these first
   - Example: Move misplaced files, fix obvious bugs

2. **Strategic Improvements** (High effort, High impact)
   - Plan these carefully
   - Example: Refactor package boundaries, establish testing standards

3. **Future Considerations** (High effort, Low-Medium impact)
   - Good ideas but not urgent
   - Example: Consolidate build configs

4. **Avoid** (High effort, Low impact)
   - Don't waste time on these
   - Explicitly call out to prevent bikeshedding

## Analysis Tools & Commands

**Coverage:**

```bash
pnpm test --coverage
```

**TypeScript errors:**

```bash
pnpm typecheck
```

**Linting:**

```bash
pnpm lint
```

**Dependency analysis:**

```bash
# Find circular dependencies
npx madge --circular --extensions ts src/

# Visualize dependency graph
npx madge --image graph.svg src/
```

**Code complexity:**

```bash
# Can use ts-complexity or similar tool
# Look for functions with cyclomatic complexity >10
```

## Success Criteria

The audit will be considered complete when it provides:

1. ✅ Clear baseline metrics for all quality dimensions
2. ✅ Specific, actionable recommendations with effort estimates
3. ✅ Risk-scored priorities for addressing issues
4. ✅ Standards recommendations for establishing consistency
5. ✅ Gap analysis showing what standards are missing
6. ✅ Architecture recommendations if structural issues exist

## Next Steps

After this design is approved:

1. Execute the audit following this methodology
2. Write findings to `data/audits/code-quality-audit-YYYY-MM-DD.md`
3. Review findings with team
4. Prioritize improvements based on impact/effort matrix
5. Create implementation plans for top priorities

## Notes

- This is a **diagnostic audit only** - no fixes will be made during the audit
- Focus is on objective analysis and clear recommendations
- Output should be decision-ready: clear enough to act on without further investigation
- Standards recommendations should be based on current patterns + industry best practices
