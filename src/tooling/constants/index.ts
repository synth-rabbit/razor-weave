/**
 * Global constants for the tooling package.
 * Centralizes magic numbers for maintainability and consistency.
 */

/**
 * Coverage thresholds for test suite
 */
export const COVERAGE_THRESHOLDS = {
  /** Minimum line coverage percentage */
  LINES: 80,
  /** Minimum function coverage percentage */
  FUNCTIONS: 80,
  /** Minimum branch coverage percentage */
  BRANCHES: 80,
  /** Minimum statement coverage percentage */
  STATEMENTS: 80,
} as const;

/**
 * Persona generation constants
 */
export const PERSONA_GENERATION = {
  /** Seed increment for each persona in a batch to ensure diversity */
  BATCH_SEED_INCREMENT: 1000,
  /** Seed increment for retry attempts when validation fails */
  RETRY_SEED_INCREMENT: 100000,
} as const;

/**
 * Testing constants
 */
export const TESTING = {
  /** Default execution time for mock agent reviews (milliseconds) */
  MOCK_AGENT_EXECUTION_TIME_MS: 5000,
} as const;
