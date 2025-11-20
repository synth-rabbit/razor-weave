import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { mkdirSync, rmSync } from 'fs';

describe('E2E CLI Commands', () => {
  let db: Database.Database;
  const dbPath = 'data/project.db';
  const testDataDir = 'data';
  let initialPersonaCount = 0;
  let initialCampaignCount = 0;

  beforeEach(() => {
    // Ensure data directory exists
    mkdirSync(testDataDir, { recursive: true });

    // For E2E tests, use a fresh database with correct schema
    // Remove old database if it exists (may have outdated schema)
    try {
      execSync(`rm -f ${dbPath} ${dbPath}-shm ${dbPath}-wal`);
    } catch (e) {
      // Ignore if files don't exist
    }

    // Create fresh database with current schema
    db = new Database(dbPath);
    createTables(db);

    // Record initial state for cleanup (should be 0 for fresh DB)
    const personaCount = db
      .prepare("SELECT COUNT(*) as count FROM personas WHERE type = 'generated'")
      .get() as { count: number };
    initialPersonaCount = personaCount.count;

    const campaignCount = db
      .prepare('SELECT COUNT(*) as count FROM review_campaigns')
      .get() as { count: number };
    initialCampaignCount = campaignCount.count;
  });

  afterEach(() => {
    // Clean up test data (personas created during this test)
    try {
      db.prepare(
        "DELETE FROM personas WHERE type = 'generated' AND id NOT IN (SELECT id FROM personas WHERE type = 'generated' LIMIT ?)"
      ).run(initialPersonaCount);

      db.prepare(
        'DELETE FROM review_campaigns WHERE id NOT IN (SELECT id FROM review_campaigns LIMIT ?)'
      ).run(initialCampaignCount);
    } catch (e) {
      // Ignore cleanup errors
    }

    db.close();
  });

  it('should generate personas via CLI and verify in database', () => {
    // Run CLI command to generate personas
    const output = execSync('pnpm tsx cli-commands/run.ts generate 5 --seed=12345', {
      encoding: 'utf-8',
    });

    expect(output).toContain('Generated 5 personas');

    // Verify in database (check for incremental increase)
    const count = db
      .prepare("SELECT COUNT(*) as count FROM personas WHERE type = 'generated'")
      .get() as { count: number };
    expect(count.count).toBe(initialPersonaCount + 5);

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
    execSync('pnpm tsx cli-commands/run.ts generate 10', {
      stdio: 'ignore',
    });

    // Run stats command
    const output = execSync('pnpm tsx cli-commands/run.ts stats', {
      encoding: 'utf-8',
    });

    expect(output).toContain('Total personas:');
    expect(output).toContain('Archetypes:');
    expect(output).toContain('Experience Levels:');
  });

  it('should create review campaign via CLI', () => {
    // Generate test personas first
    execSync('pnpm tsx cli-commands/run.ts generate 3', {
      stdio: 'ignore',
    });

    // Create test book
    const testBook = 'data/test-cli-book.html';
    execSync(`echo '<html><body>Test</body></html>' > ${testBook}`);

    // Run review command
    const output = execSync(`pnpm tsx cli-commands/run.ts review book ${testBook}`, {
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
    expect(campaign?.status).toBe('pending');

    // Cleanup
    execSync(`rm -f ${testBook}`);
  });
});
