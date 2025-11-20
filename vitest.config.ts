import { defineConfig } from 'vitest/config';
import { COVERAGE_THRESHOLDS } from './src/tooling/constants/index.js';

export default defineConfig({
  test: {
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
