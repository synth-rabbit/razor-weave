# Contributing to Razorweave

Thank you for your interest in contributing to Razorweave! This guide will help you understand our development process and standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Documentation](#documentation)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Git
- Text editor with TypeScript support

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/razorweave.git
cd razorweave

# Install dependencies
pnpm install

# Run tests to verify setup
pnpm test

# Run linters
pnpm lint
```

## Development Workflow

1. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [Code Standards](#code-standards)

3. **Write tests** for new functionality (see [Testing](#testing))

4. **Run linters and tests** before committing:
   ```bash
   pnpm lint
   pnpm test
   ```

5. **Commit your changes** using [Conventional Commits](#commit-messages)

6. **Push and create a Pull Request**

## Code Standards

### TypeScript

- **Use TypeScript** for all new code
- **Enable strict mode** - all code must compile with `strict: true`
- **Prefer interfaces over types** for object shapes
- **Use explicit return types** for public functions
- **Avoid `any`** - use `unknown` if type is truly unknown

**Example:**

```typescript
// ✅ Good
export function processData(input: string): ProcessedData {
  return { value: input.trim() };
}

// ❌ Bad
export function processData(input: any) {
  return { value: input.trim() };
}
```

### Code Style

We use ESLint and Prettier for consistent formatting:

```bash
pnpm lint:fix  # Auto-fix style issues
```

**Key conventions:**

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Line length:** 100 characters max
- **Trailing commas:** Always in multiline

### Naming Conventions

- **Files:** `kebab-case.ts`
- **Classes:** `PascalCase`
- **Functions/variables:** `camelCase`
- **Constants:** `SCREAMING_SNAKE_CASE`
- **Interfaces:** `PascalCase` (no `I` prefix)

### Magic Numbers

Extract magic numbers to constants:

```typescript
// ✅ Good
import { COVERAGE_THRESHOLDS } from '../constants/index.js';
const threshold = COVERAGE_THRESHOLDS.LINES;

// ❌ Bad
const threshold = 80;
```

### Error Handling

Use custom error classes from `errors/index.ts`:

```typescript
import { DatabaseError, FileError, ValidationError } from '../errors/index.js';

throw new DatabaseError('Query failed', query);
```

## Testing

We use Vitest with an **80% coverage target**.

### Test Structure

- **Unit tests:** `*.test.ts` alongside source files
- **Integration tests:** `src/tooling/integration/`
- **E2E tests:** `src/tooling/e2e/`

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Module Name', () => {
  it('should do something specific', () => {
    const result = functionUnderTest(input);
    expect(result).toBe(expected);
  });
});
```

### Running Tests

```bash
pnpm test                # Run all tests
pnpm test:coverage       # With coverage report
pnpm test path/to/test.ts  # Run specific test
```

### Test Best Practices

✅ **Do:**
- Test behavior, not implementation
- Use in-memory database for database tests
- Mock file I/O operations
- Make tests independent and isolated
- Use proper TypeScript types in tests

❌ **Don't:**
- Test implementation details
- Use actual files (use mocks or temp files)
- Use the real project database
- Write tests dependent on execution order
- Use `any` type in tests

See [TESTING.md](./TESTING.md) for comprehensive testing patterns.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **refactor:** Code refactoring
- **test:** Test additions/changes
- **chore:** Build process or tooling changes
- **style:** Code style changes (formatting)
- **perf:** Performance improvements

### Scope

Optional, indicates the affected area:
- `reviews` - Review system
- `personas` - Persona generation
- `database` - Database clients
- `cli` - CLI commands
- `site` - Website

### Examples

```
feat(reviews): add campaign analysis aggregation

Implemented analyzer agent that processes all persona reviews
and generates priority rankings, dimension summaries, and
persona breakdowns.

fixes #123
```

```
docs: add JSDoc to public APIs

Added comprehensive documentation to SnapshotClient and
CampaignClient with examples and parameter descriptions.
```

```
test(database): add snapshot client integration tests

Verified createBookSnapshot, createChapterSnapshot,
and history retrieval functionality.
```

### Commit Attribution

All commits should include:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Pull Requests

### Before Creating a PR

1. ✅ All tests pass locally
2. ✅ Linters pass (`pnpm lint`)
3. ✅ Code coverage meets threshold (80%+)
4. ✅ Documentation updated (if adding features)
5. ✅ Commit messages follow conventions

### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- Added X feature
- Fixed Y bug
- Refactored Z module

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Breaking Changes
[List any breaking changes or "None"]
```

### Review Process

- PRs require at least one approval
- Address review feedback promptly
- Keep PRs focused and reasonably sized
- Rebase on main before merging

## Documentation

### Code Documentation

Add JSDoc comments to all public APIs:

```typescript
/**
 * Creates a snapshot of a book HTML file.
 * Generates a unique content ID and stores file content with hash verification.
 *
 * @param db - The better-sqlite3 database instance
 * @param data - Book snapshot configuration
 * @returns Content ID in format 'book-{12hexchars}'
 * @throws Error if file does not exist
 *
 * @example
 * ```ts
 * const contentId = snapshotBook(db, {
 *   bookPath: 'site/core_rulebook.html',
 *   version: 'v1.0',
 *   source: 'claude'
 * });
 * ```
 */
export function snapshotBook(
  db: Database.Database,
  data: SnapshotBookData
): string {
  // implementation
}
```

### Markdown Documentation

- Use `kebab-case` for filenames
- Follow markdown best practices
- Run `pnpm markdownlint` to check formatting

### Design Documents

For major features, create a design document in `docs/plans/`:

```
docs/plans/feature-name-design.md
docs/plans/feature-name-implementation.md
```

## Questions or Issues?

- Check existing [Issues](https://github.com/your-org/razorweave/issues)
- Join discussions in [Discussions](https://github.com/your-org/razorweave/discussions)
- Review [Documentation](./docs/)

Thank you for contributing to Razorweave! 🎲
