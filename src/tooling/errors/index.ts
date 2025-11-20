/**
 * Error thrown when database operations fail.
 * Includes optional SQL query context.
 */
export class DatabaseError extends Error {
  /**
   * @param message - Error description
   * @param query - Optional SQL query that caused the error
   */
  constructor(message: string, public readonly query?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Error thrown when file system operations fail.
 * Includes optional file path context.
 */
export class FileError extends Error {
  /**
   * @param message - Error description
   * @param path - Optional file path that caused the error
   */
  constructor(message: string, public readonly path?: string) {
    super(message);
    this.name = 'FileError';
  }
}

/**
 * Error thrown when data validation fails.
 * Includes optional field name context.
 */
export class ValidationError extends Error {
  /**
   * @param message - Error description
   * @param field - Optional field name that failed validation
   */
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
