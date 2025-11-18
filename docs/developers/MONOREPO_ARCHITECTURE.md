# Monorepo Architecture Guide

This guide explains the pnpm workspace monorepo structure used in Razorweave.

## Overview

Razorweave uses a monorepo with pnpm workspaces to organize multiple packages:

- **Shared build configuration** - Consistent TypeScript setup
- **Code reuse** - Packages can depend on each other
- **Atomic commits** - Related changes in one commit
- **Simplified dependency management** - One lock file

**Configuration:** `pnpm-workspace.yaml`

```yaml
packages:
  - 'src/*'
```

## Package Structure

All packages live in `src/` directory:

```
src/
├── agents/          - Agentic systems (planned)
├── cli/             - Command-line tools
├── maintenance/     - Maintenance utilities
├── shared/          - Shared utilities
├── site/            - Website generator
├── tooling/         - Build tools, hooks, database, validators
├── tools/           - Development tools
└── workflows/       - Workflow automation
```

Each package has:
- `package.json` - Package configuration and scripts
- `tsconfig.json` - TypeScript configuration (extends root)
- `src/` - Source TypeScript files
- `dist/` - Compiled JavaScript (gitignored)

## Key Packages

### @razorweave/tooling

**Purpose:** Development tooling and automation

**Contains:**
- Database client (`database/`)
- Git hooks (`hooks/git/`)
- Claude Code hooks (`hooks/claude/`)
- Validators (`validators/`)
- Linters (`linters/`)
- Scripts (`scripts/`)

**Used by:** Root package, other packages, git hooks

### @razorweave/shared

**Purpose:** Shared utilities across packages

**Contains:**
- Common types
- Utility functions
- Shared constants

**Used by:** All other packages

### Other Packages

- **@razorweave/cli** - CLI tools
- **@razorweave/site** - Website generator
- **@razorweave/workflows** - Workflow automation
- **@razorweave/agents** - Agentic systems (planned)

## Working with Packages

### Running Commands in Specific Package

```bash
# Run build in tooling package
pnpm --filter @razorweave/tooling build

# Run tests in tooling package
pnpm --filter @razorweave/tooling test

# Execute script from tooling package
pnpm --filter @razorweave/tooling exec tsx scripts/verify-database.ts
```

### Running Commands in All Packages

```bash
# Build all packages
pnpm -r build

# Build in parallel (faster)
pnpm -r --parallel build

# Type check all packages
pnpm -r typecheck
```

### Adding Dependencies

**To root package:**
```bash
pnpm add package-name
pnpm add -D dev-package-name
```

**To specific package:**
```bash
pnpm --filter @razorweave/tooling add package-name
```

**Workspace dependency (internal):**
```bash
pnpm --filter @razorweave/cli add @razorweave/shared@workspace:*
```

### Package Dependencies

Packages can depend on each other:

```json
{
  "dependencies": {
    "@razorweave/shared": "workspace:*"
  }
}
```

**Build order:** pnpm automatically builds dependencies first

## TypeScript Configuration

### Root tsconfig.json

Shared base configuration:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  }
}
```

### Package tsconfig.json

Extends root configuration:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

**Project references** enable:
- Faster builds (only rebuild changed packages)
- Better IDE support
- Type checking across packages

## Build System

### Build Order

1. **@razorweave/shared** - No dependencies
2. **@razorweave/tooling** - Depends on shared
3. **Other packages** - May depend on tooling/shared

### Build Commands

```bash
# Build single package
pnpm --filter @razorweave/tooling build

# Build all packages
pnpm build

# Clean build artifacts
pnpm clean

# Watch mode (auto-rebuild)
pnpm build:watch
```

### Build Output

Each package outputs to its own `dist/` directory:

```
src/tooling/
├── src/           # Source .ts files
│   ├── database/
│   └── hooks/
└── dist/          # Compiled .js files
    ├── database/
    └── hooks/
```

## Common Operations

### Adding New Package

1. **Create directory:**
   ```bash
   mkdir -p src/my-package/src
   cd src/my-package
   ```

2. **Create package.json:**
   ```json
   {
     "name": "@razorweave/my-package",
     "version": "0.1.0",
     "type": "module",
     "main": "./dist/index.js",
     "scripts": {
       "build": "tsc --build",
       "clean": "rm -rf dist tsconfig.tsbuildinfo"
     },
     "dependencies": {
       "@razorweave/shared": "workspace:*"
     }
   }
   ```

3. **Create tsconfig.json:**
   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     }
   }
   ```

4. **Install dependencies:**
   ```bash
   pnpm install
   ```

### Removing Package

1. Remove from workspace
2. Update dependent packages
3. Remove directory
4. Run `pnpm install`

### Debugging Build Issues

```bash
# Clean everything
pnpm clean
rm -rf node_modules
pnpm install

# Build with verbose output
pnpm --filter @razorweave/tooling build --verbose

# Check TypeScript errors
pnpm typecheck
```

## Related Documentation

- **[Getting Started](../GETTING_STARTED.md)** - Setup and basic commands
- **[Project Structure](../plans/DIRECTORY_STRUCTURE.md)** - Directory organization

## Summary

The monorepo architecture provides:

- ✅ Organized package structure
- ✅ Code reuse via workspace dependencies
- ✅ Atomic cross-package changes
- ✅ Consistent build configuration
- ✅ Fast builds with TypeScript project references
- ✅ Single dependency lock file
