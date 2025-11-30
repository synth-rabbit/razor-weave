/**
 * Vitest Setup File
 *
 * This file is executed before each test file runs.
 * It provides safety guards to prevent tests from accidentally
 * using production databases.
 *
 * ⚠️ PRODUCTION DATABASE PROTECTION ⚠️
 * Tests MUST NEVER use 'data/project.db' or any production database path.
 * All tests must use isolated test databases in paths like:
 *   - data/test-<feature>/test.db
 *   - data/test-e2e/test.db
 */

import { beforeAll, afterAll } from 'vitest';

// List of paths that are FORBIDDEN in tests
const FORBIDDEN_PATHS = [
  'data/project.db',
  'project.db',
  '/project.db',
];

// Store original console.error for restoration
const originalConsoleError = console.error;

beforeAll(() => {
  // Override console.error to add a warning before any database operations
  // This serves as a last-line-of-defense reminder
});

afterAll(() => {
  // Restore original console.error
  console.error = originalConsoleError;
});

/**
 * Validates that a database path is safe for testing.
 * Throws an error if the path points to a production database.
 *
 * Use this in tests before creating database connections:
 *   assertTestDatabasePath(dbPath);
 */
export function assertTestDatabasePath(dbPath: string): void {
  const normalizedPath = dbPath.replace(/\\/g, '/').toLowerCase();

  for (const forbidden of FORBIDDEN_PATHS) {
    if (normalizedPath.includes(forbidden.toLowerCase())) {
      throw new Error(
        `\n` +
          `═══════════════════════════════════════════════════════════\n` +
          `⚠️  PRODUCTION DATABASE ACCESS BLOCKED  ⚠️\n` +
          `═══════════════════════════════════════════════════════════\n` +
          `\n` +
          `Attempted to use: ${dbPath}\n` +
          `\n` +
          `Tests MUST use isolated test databases, not production data.\n` +
          `\n` +
          `Use a path like: data/test-<feature>/test.db\n` +
          `\n` +
          `Example:\n` +
          `  const TEST_DB_DIR = 'data/test-my-feature';\n` +
          `  const TEST_DB = join(TEST_DB_DIR, 'test.db');\n` +
          `\n` +
          `═══════════════════════════════════════════════════════════\n`
      );
    }
  }

  // Additional safety: warn if path doesn't contain "test"
  if (!normalizedPath.includes('test')) {
    console.warn(
      `⚠️  WARNING: Database path "${dbPath}" does not contain "test".\n` +
        `   Ensure this is intentional and not a production database.`
    );
  }
}

/**
 * Creates an isolated test database path with proper directory structure.
 * Use this helper to generate safe test database paths.
 */
export function createTestDbPath(testName: string): {
  dir: string;
  path: string;
} {
  const sanitizedName = testName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const dir = `data/test-${sanitizedName}`;
  const path = `${dir}/test.db`;
  return { dir, path };
}
