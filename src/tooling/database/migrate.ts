// src/tooling/database/migrate.ts
// Migration runner for database schema changes

import Database from 'better-sqlite3';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface MigrationResult {
  version: number;
  name: string;
  applied: boolean;
  error?: string;
}

export function getMigrationsDir(): string {
  return join(__dirname, 'migrations');
}

export function getAppliedMigrations(db: Database.Database): number[] {
  // Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const rows = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all() as { version: number }[];
  return rows.map(r => r.version);
}

export function getPendingMigrations(migrationsDir: string, appliedVersions: number[]): { version: number; name: string; path: string }[] {
  if (!existsSync(migrationsDir)) {
    return [];
  }

  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const pending: { version: number; name: string; path: string }[] = [];

  for (const file of files) {
    // Extract version from filename like "002_unified_schema.sql"
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) continue;

    const version = parseInt(match[1], 10);
    const name = match[2];

    if (!appliedVersions.includes(version)) {
      pending.push({
        version,
        name,
        path: join(migrationsDir, file)
      });
    }
  }

  return pending;
}

export function applyMigration(
  db: Database.Database,
  migration: { version: number; name: string; path: string }
): MigrationResult {
  const sql = readFileSync(migration.path, 'utf-8');

  try {
    db.exec('BEGIN TRANSACTION');

    // Execute the entire SQL file as one batch - SQLite handles multi-statement SQL
    // We just need to wrap problematic ALTER TABLE statements
    const lines = sql.split('\n');
    let currentStatement = '';
    let inMultiLineStatement = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip pure comment lines
      if (trimmed.startsWith('--') && !inMultiLineStatement) {
        continue;
      }

      currentStatement += line + '\n';

      // Track if we're in a multi-line statement (CREATE TABLE, etc.)
      if (trimmed.startsWith('CREATE TABLE') || trimmed.startsWith('CREATE INDEX') ||
          trimmed.startsWith('INSERT') || trimmed.startsWith('UPDATE') ||
          trimmed.startsWith('ALTER TABLE')) {
        inMultiLineStatement = true;
      }

      // Check if statement is complete (ends with semicolon)
      if (trimmed.endsWith(';')) {
        inMultiLineStatement = false;
        const statement = currentStatement.trim();
        currentStatement = '';

        if (statement && !statement.match(/^--/)) {
          try {
            db.exec(statement);
          } catch (stmtError) {
            const errorMsg = String(stmtError);
            if (errorMsg.includes('duplicate column name') ||
                errorMsg.includes('already exists') ||
                errorMsg.includes('UNIQUE constraint failed')) {
              console.log(`  Skipping (already applied): ${statement.slice(0, 60).replace(/\n/g, ' ')}...`);
            } else {
              throw stmtError;
            }
          }
        }
      }
    }

    // Record migration
    db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(
      migration.version,
      migration.name
    );

    db.exec('COMMIT');

    return { version: migration.version, name: migration.name, applied: true };
  } catch (error) {
    db.exec('ROLLBACK');
    return {
      version: migration.version,
      name: migration.name,
      applied: false,
      error: String(error)
    };
  }
}

export function runMigrations(dbPath: string, options?: { dryRun?: boolean }): MigrationResult[] {
  const db = new Database(dbPath);
  const results: MigrationResult[] = [];

  try {
    const migrationsDir = getMigrationsDir();
    const appliedVersions = getAppliedMigrations(db);
    const pending = getPendingMigrations(migrationsDir, appliedVersions);

    console.log(`Database: ${dbPath}`);
    console.log(`Applied migrations: ${appliedVersions.length}`);
    console.log(`Pending migrations: ${pending.length}`);

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return results;
    }

    for (const migration of pending) {
      console.log(`\nApplying migration ${migration.version}: ${migration.name}`);

      if (options?.dryRun) {
        console.log('  [DRY RUN] Would apply migration');
        results.push({ version: migration.version, name: migration.name, applied: false });
      } else {
        const result = applyMigration(db, migration);
        results.push(result);

        if (result.applied) {
          console.log('  Applied successfully.');
        } else {
          console.error(`  FAILED: ${result.error}`);
          break; // Stop on first failure
        }
      }
    }

    return results;
  } finally {
    db.close();
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = process.argv[2] || 'data/project.db';
  const dryRun = process.argv.includes('--dry-run');

  console.log('Running database migrations...');
  if (dryRun) {
    console.log('[DRY RUN MODE]');
  }

  const results = runMigrations(dbPath, { dryRun });

  const failed = results.filter(r => !r.applied && r.error);
  if (failed.length > 0) {
    console.error('\nMigration failed!');
    process.exit(1);
  }

  console.log('\nMigrations complete.');
}
