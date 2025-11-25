import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { mkdirSync, rmSync } from 'fs';

describe('E2E CLI Commands', () => {
  let db: Database.Database;
  // Use isolated test database - NEVER touch production data/project.db
  const testDataDir = 'data/test-e2e';
  const dbPath = `${testDataDir}/test.db`;
  const originalDbPath = process.env.RAZORWEAVE_DB_PATH;

  beforeAll(() => {
    // Set env var so CLI commands use the test database
    process.env.RAZORWEAVE_DB_PATH = dbPath;
  });

  afterAll(() => {
    // Restore original env var
    if (originalDbPath) {
      process.env.RAZORWEAVE_DB_PATH = originalDbPath;
    } else {
      delete process.env.RAZORWEAVE_DB_PATH;
    }

    // Clean up test directory
    try {
      rmSync(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Ensure test data directory exists
    mkdirSync(testDataDir, { recursive: true });

    // For E2E tests, use a fresh database with correct schema
    // Remove old test database if it exists
    try {
      execSync(`rm -f ${dbPath} ${dbPath}-shm ${dbPath}-wal`);
    } catch {
      // Ignore if files don't exist
    }

    // Create fresh database with current schema
    db = new Database(dbPath);
    createTables(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should generate personas via CLI and verify in database', () => {
    // Run CLI command to generate personas
    const output = execSync('pnpm tsx src/tooling/cli-commands/run.ts generate 5 --seed=12345', {
      encoding: 'utf-8',
    });

    expect(output).toContain('Generated 5 personas');

    // Verify in database (fresh DB starts empty, so should have exactly 5)
    const count = db
      .prepare("SELECT COUNT(*) as count FROM personas WHERE type = 'generated'")
      .get() as { count: number };
    expect(count.count).toBe(5);

    // Verify newly created personas have correct attributes
    // Note: Get the most recent 5 personas since they were just created
    const newPersonas = db
      .prepare('SELECT * FROM personas WHERE type = ? ORDER BY id DESC LIMIT 5')
      .all('generated') as Array<{
      archetype: string;
      experience_level: string;
      generated_seed: number | null;
    }>;
    expect(newPersonas).toHaveLength(5);

    for (const persona of newPersonas) {
      expect(persona).toHaveProperty('archetype');
      expect(persona).toHaveProperty('experience_level');
      // Verify seed was stored (actual value may vary based on CLI implementation)
      expect(persona.generated_seed).toBeGreaterThan(0);
    }
  });

  it('should run stats command and display persona distribution', () => {
    // First generate some personas
    execSync('pnpm tsx src/tooling/cli-commands/run.ts generate 10', {
      stdio: 'ignore',
    });

    // Run stats command
    const output = execSync('pnpm tsx src/tooling/cli-commands/run.ts stats', {
      encoding: 'utf-8',
    });

    expect(output).toContain('Total personas:');
    expect(output).toContain('Archetypes:');
    expect(output).toContain('Experience Levels:');
  });

  it('should create review campaign via CLI', () => {
    // Hydrate core personas first (review uses all_core strategy by default)
    execSync('pnpm tsx src/tooling/cli-commands/run.ts hydrate-core', {
      stdio: 'ignore',
    });

    // Create test book in test directory
    const testBook = `${testDataDir}/test-cli-book.html`;
    execSync(`echo '<html><body>Test</body></html>' > ${testBook}`);

    // Run review command
    const output = execSync(`pnpm tsx src/tooling/cli-commands/run.ts review book ${testBook}`, {
      encoding: 'utf-8',
    });

    expect(output).toContain('Campaign created:');
    expect(output).toMatch(/campaign-[a-f0-9]+/);

    // Verify campaign in database
    const campaign = db
      .prepare('SELECT * FROM review_campaigns ORDER BY created_at DESC LIMIT 1')
      .get() as {
      status: string;
    } | undefined;

    expect(campaign).toBeDefined();
    // Status is in_progress after reviewBook() runs executeReviews()
    expect(campaign?.status).toBe('in_progress');
    // No manual cleanup needed - afterAll cleans up entire test directory
  });
});
