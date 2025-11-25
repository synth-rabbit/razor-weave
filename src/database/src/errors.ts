/**
 * Error thrown when database operations fail.
 * Includes optional SQL query context.
 */
export class DatabaseError extends Error {
  /**
   * @param message - Error description
   * @param query - Optional SQL query that caused the error
   */
  constructor(
    message: string,
    public readonly query?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}
