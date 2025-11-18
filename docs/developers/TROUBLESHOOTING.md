# Troubleshooting Guide

Common issues and solutions for Razorweave development.

## Setup Issues

### pnpm install fails

**Symptoms:** Errors during `pnpm install`

**Solutions:**

1. Check Node.js version:
   ```bash
   node --version  # Should be >= 18.0.0
   ```

2. Check pnpm version:
   ```bash
   pnpm --version  # Should be >= 8.0.0
   ```

3. Clear pnpm cache:
   ```bash
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

### Git hooks not running

**Symptoms:** Commits succeed without validation

**Solutions:**

1. Run setup again:
   ```bash
   pnpm setup
   ```

2. Check hook files:
   ```bash
   ls -la .husky/
   ```

3. Verify git config:
   ```bash
   git config core.hooksPath
   # Should output: .husky
   ```

### Tests fail on fresh install

**Solutions:**

1. Build all packages:
   ```bash
   pnpm build
   ```

2. Clear test cache:
   ```bash
   pnpm test --clearCache
   ```

3. Check TypeScript errors:
   ```bash
   pnpm typecheck
   ```

## Build Issues

### Build fails with type errors

**Solutions:**

1. Clean and rebuild:
   ```bash
   pnpm clean
   pnpm build
   ```

2. Check tsconfig.json is correct

3. Verify dependencies are installed:
   ```bash
   pnpm install
   ```

### "Cannot find module" errors

**Symptoms:** Import statements fail at runtime

**Solutions:**

1. Check the package is built:
   ```bash
   pnpm --filter @razorweave/tooling build
   ```

2. Verify package.json exports are correct

3. Use correct import paths (include `.js` extension):
   ```typescript
   // Correct
   import { foo } from './bar.js';

   // Wrong
   import { foo } from './bar';
   ```

### Build is slow

**Solutions:**

1. Use watch mode for development:
   ```bash
   pnpm build:watch
   ```

2. Build only the package you're working on:
   ```bash
   pnpm --filter @razorweave/tooling build
   ```

## Git Hook Issues

### pre-commit hook fails - linting errors

**Solutions:**

1. Auto-fix lint issues:
   ```bash
   pnpm lint:fix
   ```

2. Fix remaining issues manually

3. Run linting before committing:
   ```bash
   pnpm lint
   ```

### pre-commit hook fails - test failures

**Solutions:**

1. Run tests locally:
   ```bash
   pnpm test
   ```

2. Fix failing tests

3. Verify all tests pass before committing

### commit-msg hook fails

**Cause:** Commit message doesn't follow format

**Solution:** Use correct format:
```
emoji type(scope): description

Examples:
✨ feat(auth): add user login
🐛 fix(api): resolve timeout issue
📝 docs(readme): update setup steps
```

### post-commit hook fails

**Symptoms:** Commit succeeds but warnings appear

**Usually safe to ignore** - post-commit is informational

**If concerned:**
```bash
# Check what changed
git diff HEAD~1 HEAD

# Check database
ls -la src/tooling/data/project.db
```

## Database Issues

### Database locked error

**Cause:** Another process is using the database

**Solutions:**

1. Close other connections (VS Code extensions, etc.)

2. Find processes:
   ```bash
   lsof src/tooling/data/project.db
   ```

3. Kill if needed:
   ```bash
   kill <PID>
   ```

### Database corruption

**Symptoms:** Errors when accessing database

**Solutions:**

1. Check integrity:
   ```bash
   sqlite3 src/tooling/data/project.db "PRAGMA integrity_check;"
   ```

2. Restore from backup if available

3. Recreate database:
   ```bash
   rm src/tooling/data/project.db
   pnpm --filter @razorweave/tooling exec tsx scripts/verify-database.ts
   ```

## Validation Issues

### Validation script fails

**Solutions:**

1. Check script exists:
   ```bash
   ls -la scripts/
   ```

2. Verify dependencies:
   ```bash
   pnpm install
   ```

3. Check script permissions:
   ```bash
   chmod +x scripts/review/*.sh
   ```

### Plan naming validation fails

**Cause:** Filename doesn't follow convention

**Solution:** Rename to match format:
```bash
# Format: YYYY-MM-DD-description.md or topic-name-P1.md
mv docs/plans/myplan.md docs/plans/2025-11-18-my-feature.md
```

### Link validation fails

**Cause:** Broken internal links

**Solution:**

1. Check file exists at referenced path

2. Update link to correct path

3. Verify relative paths are correct

## Claude Code Hook Issues

### Hooks not running in Claude Code

**Solutions:**

1. Check hooks directory:
   ```bash
   ls -la .claude/hooks/
   ```

2. Rebuild tooling:
   ```bash
   pnpm --filter @razorweave/tooling build
   ```

3. Restart Claude Code session

### Hook error messages

**Solution:** Check hook implementation for bugs:
```bash
# Test hook directly
pnpm --filter @razorweave/tooling exec tsx src/hooks/claude/session-start.ts
```

## Performance Issues

### Slow tests

**Solutions:**

1. Run specific test file:
   ```bash
   pnpm test path/to/test.test.ts
   ```

2. Use watch mode:
   ```bash
   pnpm test --watch
   ```

3. Disable parallel execution if needed:
   ```bash
   pnpm test --no-threads
   ```

### Slow linting

**Solution:** Lint only changed files (hooks do this automatically)

### High memory usage

**Solutions:**

1. Close unused applications

2. Limit parallel operations:
   ```bash
   pnpm -r build  # Sequential
   # Instead of
   pnpm -r --parallel build
   ```

## Platform-Specific Issues

### macOS: Permission denied errors

**Solution:**
```bash
chmod +x .husky/*
chmod +x scripts/review/*.sh
```

### Windows: ENOENT errors

**Cause:** Path separators or line endings

**Solutions:**

1. Configure git line endings:
   ```bash
   git config core.autocrlf true
   ```

2. Use forward slashes in paths

### Linux: sqlite3 not found

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install sqlite3

# Fedora
sudo dnf install sqlite
```

## Getting More Help

If issues persist:

1. Check [Getting Started Guide](../GETTING_STARTED.md) troubleshooting section
2. Search existing documentation
3. Check git history for recent changes
4. Create an issue with:
   - Error message (full)
   - Steps to reproduce
   - Environment (OS, Node version, pnpm version)
   - What you've tried

## Common Error Messages

### "TypeError: Cannot read property 'X' of undefined"

**Likely cause:** Missing dependency or unbuilt package

**Solution:** Build all packages:
```bash
pnpm build
```

### "EACCES: permission denied"

**Solution:** Check file permissions:
```bash
ls -la <file-path>
chmod +x <file-path>  # If needed
```

### "Module not found"

**Solution:**
1. Install dependencies: `pnpm install`
2. Build package: `pnpm build`
3. Check import path uses `.js` extension

### "spawn ENAMETOOLONG"

**Cause:** Command line too long

**Solution:** Use shorter paths or break into multiple commands

## Quick Fixes

### Complete reset

```bash
# Nuclear option - completely reset everything
rm -rf node_modules
rm -rf src/*/node_modules
rm -rf src/*/dist
pnpm store prune
pnpm install
pnpm build
pnpm test
```

### Quick validation check

```bash
# Run all checks without committing
pnpm lint
pnpm typecheck
pnpm test
pnpm validate
```

### Verify setup

```bash
# Check everything is configured correctly
node --version
pnpm --version
pnpm install
pnpm build
pnpm test
git config core.hooksPath
ls -la .husky/
ls -la .claude/hooks/
```
