import { defineConfig } from 'vitest/config';
import { COVERAGE_THRESHOLDS } from './src/tooling/constants/index.js';

export default defineConfig({
  test: {
    // ⚠️ CRITICAL: All tests MUST use isolated test databases!
    // NEVER use 'data/project.db' in tests - use 'data/test-<feature>/test.db'
    // See src/tooling/test/vitest-setup.ts for helper utilities.
    setupFiles: ['./src/tooling/test/vitest-setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.worktrees/**',
      '**/*.spec.ts',  // Playwright tests
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/types/**',
        '.worktrees/**',
      ],
      thresholds: {
        lines: COVERAGE_THRESHOLDS.LINES,
        functions: COVERAGE_THRESHOLDS.FUNCTIONS,
        branches: COVERAGE_THRESHOLDS.BRANCHES,
        statements: COVERAGE_THRESHOLDS.STATEMENTS,
      },
    },
  },
});
