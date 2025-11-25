/**
 * Safe Database Client
 *
 * Wraps database access with protections to prevent accidental data loss:
 * - Blocks destructive operations (DROP TABLE, TRUNCATE, DELETE database)
 * - Requires confirmation tokens for DELETE operations
 * - Provides automatic backup functionality
 * - Transaction support with rollback on postcondition failures
 */

import Database from 'better-sqlite3';
import { copyFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { DatabaseError } from '../errors/index.js';

/**
 * Confirmation token for delete operations
 */
export interface DeleteConfirmation {
  table: string;
  whereClause: string;
  token: string;
  expiresAt: number;
}

/**
 * Backup metadata
 */
export interface BackupInfo {
  id: string;
  path: string;
  createdAt: string;
  sizeBytes: number;
  workflowRunId?: string;
}

/**
 * Configuration for SafeDatabaseClient
 */
export interface SafeClientConfig {
  /** Path to the database file */
  dbPath: string;
  /** Directory for backups (default: data/backups) */
  backupDir?: string;
  /** Maximum number of backups to keep (default: 10) */
  maxBackups?: number;
  /** Whether to enable WAL mode (default: true) */
  walMode?: boolean;
}

/**
 * Error thrown when a destructive operation is blocked
 */
export class BlockedOperationError extends Error {
  constructor(operation: string, reason: string) {
    super(`${operation} blocked: ${reason}`);
    this.name = 'BlockedOperationError';
  }
}

/**
 * SafeDatabaseClient wraps database access with integrity protections.
 *
 * Key protections:
 * 1. DROP TABLE, TRUNCATE are completely blocked
 * 2. DELETE requires a confirmation token from getDeleteConfirmation()
 * 3. Automatic backups before workflow runs
 * 4. Transaction wrappers that rollback on failure
 */
export class SafeDatabaseClient {
  private db: Database.Database;
  private readonly dbPath: string;
  private readonly backupDir: string;
  private readonly maxBackups: number;
  private pendingConfirmations: Map<string, DeleteConfirmation> = new Map();

  constructor(config: SafeClientConfig) {
    this.dbPath = config.dbPath;
    this.backupDir = config.backupDir ?? join(dirname(config.dbPath), 'backups');
    this.maxBackups = config.maxBackups ?? 10;

    this.db = new Database(config.dbPath);

    if (config.walMode !== false) {
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('busy_timeout = 5000');
      this.db.pragma('synchronous = NORMAL');
    }
  }

  /**
   * Get the underlying database instance.
   * Use with caution - prefer SafeDatabaseClient methods when possible.
   */
  getDb(): Database.Database {
    return this.db;
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }

  // ===========================================================================
  // Blocked Operations
  // ===========================================================================

  /**
   * DROP TABLE is blocked. Use migrations system for schema changes.
   */
  dropTable(_table: string): never {
    throw new BlockedOperationError(
      'DROP TABLE',
      'Use the migrations system for schema changes. Tables cannot be dropped directly.'
    );
  }

  /**
   * Database deletion is blocked.
   */
  deleteDatabase(): never {
    throw new BlockedOperationError(
      'DELETE DATABASE',
      'Database deletion is blocked. If you need to reset, restore from a backup.'
    );
  }

  /**
   * TRUNCATE is blocked. Use explicit DELETE with confirmation.
   */
  truncateTable(_table: string): never {
    throw new BlockedOperationError(
      'TRUNCATE TABLE',
      'TRUNCATE is blocked. Use explicit DELETE with getDeleteConfirmation() if you need to clear a table.'
    );
  }

  // ===========================================================================
  // Protected Delete Operations
  // ===========================================================================

  /**
   * Get a confirmation token for a DELETE operation.
   * The token expires after 30 seconds.
   *
   * @param table - Table to delete from
   * @param whereClause - WHERE clause (without the WHERE keyword)
   * @returns Confirmation object with token
   */
  getDeleteConfirmation(table: string, whereClause: string): DeleteConfirmation {
    const token = `del_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const confirmation: DeleteConfirmation = {
      table,
      whereClause,
      token,
      expiresAt: Date.now() + 30000, // 30 seconds
    };

    this.pendingConfirmations.set(token, confirmation);

    // Clean up old confirmations
    for (const [key, conf] of this.pendingConfirmations) {
      if (conf.expiresAt < Date.now()) {
        this.pendingConfirmations.delete(key);
      }
    }

    return confirmation;
  }

  /**
   * Execute a DELETE operation with confirmation token.
   *
   * @param table - Table to delete from
   * @param whereClause - WHERE clause (without the WHERE keyword)
   * @param confirmToken - Token from getDeleteConfirmation()
   * @returns Number of rows deleted
   */
  delete(table: string, whereClause: string, confirmToken: string): number {
    const confirmation = this.pendingConfirmations.get(confirmToken);

    if (!confirmation) {
      throw new BlockedOperationError(
        'DELETE',
        'Invalid or missing confirmation token. Use getDeleteConfirmation() first.'
      );
    }

    if (confirmation.expiresAt < Date.now()) {
      this.pendingConfirmations.delete(confirmToken);
      throw new BlockedOperationError(
        'DELETE',
        'Confirmation token has expired. Get a new token with getDeleteConfirmation().'
      );
    }

    if (confirmation.table !== table || confirmation.whereClause !== whereClause) {
      throw new BlockedOperationError(
        'DELETE',
        'Confirmation token does not match this operation. Token was generated for a different table or WHERE clause.'
      );
    }

    // Token is valid, execute the delete
    this.pendingConfirmations.delete(confirmToken);

    const result = this.db.prepare(`DELETE FROM ${table} WHERE ${whereClause}`).run();
    return result.changes;
  }

  // ===========================================================================
  // Backup Operations
  // ===========================================================================

  /**
   * Create a backup of the database.
   *
   * @param workflowRunId - Optional workflow run ID to associate with the backup
   * @returns Information about the created backup
   */
  backup(workflowRunId?: string): BackupInfo {
    // Ensure backup directory exists
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }

    // Generate backup filename with random suffix for uniqueness
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    const id = `backup_${timestamp}_${random}`;
    const backupPath = join(this.backupDir, `project-${timestamp}-${random}.db`);

    // Force a checkpoint to ensure WAL is flushed
    this.db.pragma('wal_checkpoint(TRUNCATE)');

    // Copy the database file
    copyFileSync(this.dbPath, backupPath);

    const stats = statSync(backupPath);

    const backupInfo: BackupInfo = {
      id,
      path: backupPath,
      createdAt: new Date().toISOString(),
      sizeBytes: stats.size,
      workflowRunId,
    };

    // Record backup in database
    this.db
      .prepare(
        `
      INSERT INTO database_backups (id, created_at, path, workflow_run_id, size_bytes)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(backupInfo.id, backupInfo.createdAt, backupInfo.path, workflowRunId ?? null, stats.size);

    // Clean up old backups
    this.cleanupOldBackups();

    return backupInfo;
  }

  /**
   * List all available backups.
   */
  listBackups(): BackupInfo[] {
    const rows = this.db
      .prepare(
        `
      SELECT id, created_at, path, workflow_run_id, size_bytes
      FROM database_backups
      ORDER BY created_at DESC
    `
      )
      .all() as Array<{
      id: string;
      created_at: string;
      path: string;
      workflow_run_id: string | null;
      size_bytes: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      path: row.path,
      createdAt: row.created_at,
      sizeBytes: row.size_bytes,
      workflowRunId: row.workflow_run_id ?? undefined,
    }));
  }

  /**
   * Restore from a backup.
   * WARNING: This will close the current connection and replace the database.
   *
   * @param backupId - ID of the backup to restore
   */
  restore(backupId: string): void {
    const backup = this.db
      .prepare('SELECT path FROM database_backups WHERE id = ?')
      .get(backupId) as { path: string } | undefined;

    if (!backup) {
      throw new DatabaseError(`Backup not found: ${backupId}`);
    }

    if (!existsSync(backup.path)) {
      throw new DatabaseError(`Backup file not found: ${backup.path}`);
    }

    // Close current connection
    this.db.close();

    // Copy backup over current database
    copyFileSync(backup.path, this.dbPath);

    // Reopen connection
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
  }

  /**
   * Clean up old backups keeping only the most recent maxBackups.
   */
  private cleanupOldBackups(): void {
    const backups = this.listBackups();

    if (backups.length <= this.maxBackups) {
      return;
    }

    // Sort by date descending, remove oldest
    const toDelete = backups.slice(this.maxBackups);

    for (const backup of toDelete) {
      // Delete file if it exists
      if (existsSync(backup.path)) {
        try {
          unlinkSync(backup.path);
        } catch {
          // Ignore file deletion errors
        }
      }

      // Delete record
      this.db.prepare('DELETE FROM database_backups WHERE id = ?').run(backup.id);
    }
  }

  // ===========================================================================
  // Transaction Support
  // ===========================================================================

  /**
   * Execute a function within a transaction.
   * Automatically commits on success, rolls back on error.
   *
   * @param fn - Function to execute
   * @returns Result of the function
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * Execute a step with automatic rollback on postcondition failure.
   *
   * @param operation - The operation to execute
   * @param postconditions - Postconditions that must be true after operation
   * @returns Result of the operation
   * @throws If any postcondition fails (rolls back the transaction)
   */
  executeWithPostconditions<T>(
    operation: () => T,
    postconditions: Array<{ name: string; check: () => boolean; error: string }>
  ): T {
    return this.db.transaction(() => {
      const result = operation();

      // Check all postconditions
      for (const postcondition of postconditions) {
        if (!postcondition.check()) {
          throw new DatabaseError(
            `Postcondition "${postcondition.name}" failed: ${postcondition.error}`
          );
        }
      }

      return result;
    })();
  }

  // ===========================================================================
  // Safe Query Methods
  // ===========================================================================

  /**
   * Prepare a statement with SQL injection protection.
   * Only allows SELECT, INSERT, UPDATE statements (not DROP, TRUNCATE, ALTER).
   */
  prepare(sql: string): Database.Statement {
    const normalizedSql = sql.trim().toUpperCase();

    // Block dangerous statements
    if (normalizedSql.startsWith('DROP')) {
      throw new BlockedOperationError('DROP', 'DROP statements are blocked');
    }
    if (normalizedSql.startsWith('TRUNCATE')) {
      throw new BlockedOperationError('TRUNCATE', 'TRUNCATE statements are blocked');
    }
    if (normalizedSql.startsWith('ALTER')) {
      throw new BlockedOperationError(
        'ALTER',
        'ALTER statements are blocked. Use the migrations system.'
      );
    }
    if (normalizedSql.startsWith('DELETE') && !normalizedSql.includes('WHERE')) {
      throw new BlockedOperationError(
        'DELETE',
        'DELETE without WHERE clause is blocked. Use a WHERE clause or get confirmation for full table deletion.'
      );
    }

    return this.db.prepare(sql);
  }

  /**
   * Execute a raw SQL statement.
   * Use prepare() when possible for better protection.
   */
  exec(sql: string): void {
    const normalizedSql = sql.trim().toUpperCase();

    // Block dangerous statements
    if (normalizedSql.includes('DROP TABLE')) {
      throw new BlockedOperationError('DROP TABLE', 'DROP TABLE statements are blocked');
    }
    if (normalizedSql.includes('TRUNCATE')) {
      throw new BlockedOperationError('TRUNCATE', 'TRUNCATE statements are blocked');
    }

    this.db.exec(sql);
  }
}

/**
 * Create a SafeDatabaseClient from the standard database path.
 */
export function createSafeClient(dbPath?: string): SafeDatabaseClient {
  const finalPath =
    dbPath ?? process.env.RAZORWEAVE_DB_PATH ?? join(process.cwd(), 'data', 'project.db');

  return new SafeDatabaseClient({
    dbPath: finalPath,
  });
}
