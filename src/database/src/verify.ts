// src/tooling/database/verify.ts
// Verify database integrity after migration

import Database from 'better-sqlite3';

interface VerificationResult {
  table: string;
  check: string;
  passed: boolean;
  details?: string;
}

export function verifyDatabase(dbPath: string): VerificationResult[] {
  const db = new Database(dbPath, { readonly: true });
  const results: VerificationResult[] = [];

  try {
    // Check required tables exist
    const requiredTables = [
      'books',
      'book_versions',
      'workflow_runs',
      'plans',
      'personas',
      'review_campaigns',
      'persona_reviews',
      'html_builds'
    ];

    for (const table of requiredTables) {
      const exists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(table);

      results.push({
        table,
        check: 'Table exists',
        passed: !!exists,
        details: exists ? undefined : 'Table not found'
      });
    }

    // Check books table has Core Rulebook
    const coreBook = db.prepare("SELECT * FROM books WHERE slug = 'core-rulebook'").get() as { id: string; slug: string } | undefined;
    results.push({
      table: 'books',
      check: 'Core Rulebook registered',
      passed: !!coreBook,
      details: coreBook ? `ID: ${coreBook.id}` : 'Core Rulebook not found'
    });

    // Check book_versions has book_id column
    const tableInfo = db.prepare("PRAGMA table_info(book_versions)").all() as { name: string }[];
    const hasBookId = tableInfo.some((col) => col.name === 'book_id');
    results.push({
      table: 'book_versions',
      check: 'book_id column exists',
      passed: hasBookId,
      details: hasBookId ? undefined : 'book_id column not found'
    });

    // Check book_versions records are linked to books
    const totalVersions = (db.prepare("SELECT COUNT(*) as count FROM book_versions").get() as { count: number }).count;
    const linkedVersions = (db.prepare("SELECT COUNT(*) as count FROM book_versions WHERE book_id IS NOT NULL").get() as { count: number }).count;
    results.push({
      table: 'book_versions',
      check: 'Versions linked to books',
      passed: totalVersions === 0 || linkedVersions > 0,
      details: `${linkedVersions}/${totalVersions} versions have book_id`
    });

    // Check schema_migrations records
    const migrations = db.prepare("SELECT COUNT(*) as count FROM schema_migrations").get() as { count: number };
    results.push({
      table: 'schema_migrations',
      check: 'Migrations recorded',
      passed: migrations.count > 0,
      details: `${migrations.count} migrations applied`
    });

    // Check workflow_runs table structure
    const workflowInfo = db.prepare("PRAGMA table_info(workflow_runs)").all() as { name: string }[];
    const hasRequiredColumns = ['id', 'workflow_type', 'book_id', 'status'].every(
      col => workflowInfo.some(c => c.name === col)
    );
    results.push({
      table: 'workflow_runs',
      check: 'Required columns exist',
      passed: hasRequiredColumns,
      details: hasRequiredColumns ? undefined : 'Missing required columns'
    });

    // Check plans table structure
    const plansInfo = db.prepare("PRAGMA table_info(plans)").all() as { name: string }[];
    const hasPlansColumns = ['id', 'file_path', 'title', 'status'].every(
      col => plansInfo.some(c => c.name === col)
    );
    results.push({
      table: 'plans',
      check: 'Required columns exist',
      passed: hasPlansColumns,
      details: hasPlansColumns ? undefined : 'Missing required columns'
    });

    // Summary statistics
    const stats = {
      books: (db.prepare("SELECT COUNT(*) as count FROM books").get() as { count: number }).count,
      book_versions: totalVersions,
      personas: (db.prepare("SELECT COUNT(*) as count FROM personas").get() as { count: number }).count,
      reviews: (db.prepare("SELECT COUNT(*) as count FROM persona_reviews").get() as { count: number }).count,
      campaigns: (db.prepare("SELECT COUNT(*) as count FROM review_campaigns").get() as { count: number }).count
    };

    console.log('\nData statistics:');
    console.log(`  Books: ${stats.books}`);
    console.log(`  Book versions: ${stats.book_versions}`);
    console.log(`  Personas: ${stats.personas}`);
    console.log(`  Review campaigns: ${stats.campaigns}`);
    console.log(`  Persona reviews: ${stats.reviews}`);

    return results;
  } finally {
    db.close();
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = process.argv[2] || 'data/project.db';

  console.log(`Verifying database: ${dbPath}\n`);

  const results = verifyDatabase(dbPath);

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const details = result.details ? ` (${result.details})` : '';
    console.log(`${status} ${result.table}: ${result.check}${details}`);

    if (result.passed) passed++;
    else failed++;
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}
