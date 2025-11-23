# E2E Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement end-to-end integration tests for complete workflows including persona generation, review campaigns, and CLI operations.

**Architecture:** Fix snapshot API to return consistent content IDs, then build E2E tests that validate complete workflows using in-memory databases and temporary files. Tests verify data integrity across the full lifecycle from persona generation through campaign completion.

**Tech Stack:** Vitest, better-sqlite3 (in-memory), Node.js fs module

---

## Phase 1: Fix Snapshot API Inconsistency

### Task 1: Update SnapshotClient to Return Content IDs

**Problem:** Current `createBookSnapshot()` and `createChapterSnapshot()` return database row IDs (numbers) but the review system expects content ID strings like "book-abc123" and "chapter-xyz789".

**Files:**
- Modify: `src/tooling/database/snapshot-client.ts:48-61`
- Test: `src/tooling/database/snapshot-client.test.ts` (create new)

**Step 1: Write failing test for book snapshot content ID**

Create: `src/tooling/database/snapshot-client.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from './schema.js';
import { SnapshotClient } from './snapshot-client.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';

describe('SnapshotClient', () => {
  let db: Database.Database;
  let client: SnapshotClient;
  const testDir = 'data/test-snapshots';
  const testBookPath = `${testDir}/test-book.html`;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
    client = new SnapshotClient(db);

    mkdirSync(testDir, { recursive: true });
    writeFileSync(testBookPath, '<html><body>Test</body></html>');
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('createBookSnapshot', () => {
    it('should return content ID string matching pattern book-*', async () => {
      const contentId = await client.createBookSnapshot({
        bookPath: testBookPath,
        version: '1.0.0',
        chapterCount: 1,
      });

      expect(typeof contentId).toBe('string');
      expect(contentId).toMatch(/^book-[a-f0-9]+$/);
    });

    it('should store content ID in database', async () => {
      const contentId = await client.createBookSnapshot({
        bookPath: testBookPath,
        version: '1.0.0',
        chapterCount: 1,
      });

      const row = db.prepare('SELECT * FROM book_versions WHERE content_id = ?').get(contentId);
      expect(row).toBeDefined();
      expect(row).toHaveProperty('content_id', contentId);
    });
  });

  describe('createChapterSnapshot', () => {
    it('should return content ID string matching pattern chapter-*', async () => {
      const chapterPath = `${testDir}/chapter-01.md`;
      writeFileSync(chapterPath, '# Chapter 1\n\nContent here');

      const contentId = await client.createChapterSnapshot(
        chapterPath,
        'claude'
      );

      expect(typeof contentId).toBe('string');
      expect(contentId).toMatch(/^chapter-[a-f0-9]+$/);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tooling/database/snapshot-client.test.ts
```

Expected: FAIL - "Expected string but got number"

**Step 3: Update createBookSnapshot to generate and return content ID**

Modify: `src/tooling/database/snapshot-client.ts:48-65`

```typescript
import { createHash } from 'crypto';

interface CreateBookSnapshotOptions {
  bookPath: string;
  version: string;
  chapterCount: number;
}

async createBookSnapshot(options: CreateBookSnapshotOptions): Promise<string> {
  const { bookPath, version, chapterCount } = options;

  // Generate content ID from book path and timestamp
  const hash = createHash('sha256')
    .update(bookPath + Date.now().toString())
    .digest('hex')
    .substring(0, 12);
  const contentId = `book-${hash}`;

  const stmt = this.db.prepare(`
    INSERT INTO book_versions (
      content_id, book_path, version, chapter_count, content, content_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  // Read actual book content for hashing
  const content = readFileSync(bookPath, 'utf-8');
  const contentHash = createHash('sha256').update(content).digest('hex');

  stmt.run(contentId, bookPath, version, chapterCount, content, contentHash);

  return contentId;
}
```

**Step 4: Update createChapterSnapshot similarly**

Modify: `src/tooling/database/snapshot-client.ts:14-46`

```typescript
async createChapterSnapshot(
  filePath: string,
  source: 'git' | 'claude',
  options?: { commitSha?: string }
): Promise<string> {
  const content = readFileSync(filePath, 'utf-8');
  const hash = createHash('sha256').update(content).digest('hex');

  // Generate content ID
  const idHash = createHash('sha256')
    .update(filePath + Date.now().toString())
    .digest('hex')
    .substring(0, 12);
  const contentId = `chapter-${idHash}`;

  const bookPath = this.extractBookPath(filePath);
  const chapterName = this.extractChapterName(filePath);
  const version = 'draft';

  const stmt = this.db.prepare(`
    INSERT INTO chapter_versions (
      content_id, book_path, chapter_path, chapter_name, version,
      content, file_hash, source, commit_sha, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    contentId,
    bookPath,
    filePath,
    chapterName,
    version,
    content,
    hash,
    source,
    options?.commitSha || null
  );

  return contentId;
}
```

**Step 5: Update database schema to include content_id column**

Modify: `src/tooling/database/schema.ts` - Find book_versions and chapter_versions table definitions

Add `content_id TEXT PRIMARY KEY` as first column in both tables.

**Step 6: Run tests to verify they pass**

```bash
pnpm vitest run src/tooling/database/snapshot-client.test.ts
```

Expected: PASS (3 tests)

**Step 7: Commit**

```bash
git add src/tooling/database/snapshot-client.ts src/tooling/database/snapshot-client.test.ts src/tooling/database/schema.ts
git commit -m "feat(snapshots): return content ID strings instead of row IDs

- Generate content IDs with pattern book-* and chapter-*
- Add content_id primary key to book_versions and chapter_versions tables
- Update createBookSnapshot to accept options object
- Add tests for content ID generation

This fixes API inconsistency for review system integration."
```

---

## Phase 2: E2E Review Workflow Test

### Task 2: Create E2E Test for Full Review Workflow

**Files:**
- Create: `src/tooling/e2e/review-workflow.test.ts`

**Step 1: Write test setup and teardown**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { ProjectDatabase } from '../database/client.js';
import { generatePersonaBatch } from '../personas/generator.js';
import { CampaignClient } from '../reviews/campaign-client.js';
import { mkdirSync, rmSync, writeFileSync } from 'fs';

describe('E2E Review Workflow', () => {
  let db: Database.Database;
  let projectDb: ProjectDatabase;
  let campaignClient: CampaignClient;
  const testDir = 'data/test-e2e';
  const testBookPath = `${testDir}/test-book.html`;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
    projectDb = new ProjectDatabase(':memory:');
    campaignClient = new CampaignClient(db);

    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      testBookPath,
      '<html><body><h1>Test Book</h1><p>Test content for review</p></body></html>'
    );
  });

  afterEach(() => {
    db.close();
    projectDb.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  // Tests will go here
});
```

**Step 2: Write test for complete workflow**

Add to test file:

```typescript
it('should complete workflow: generate personas → snapshot → campaign → reviews', async () => {
  // Step 1: Generate test personas
  const personas = generatePersonaBatch(3, { seed: 12345 });
  expect(personas).toHaveLength(3);

  // Step 2: Save personas to database
  const personaIds: string[] = [];
  for (const persona of personas) {
    const id = projectDb.personas.create({
      name: `E2E Persona ${personas.indexOf(persona) + 1}`,
      type: 'generated',
      archetype: persona.dimensions.archetypes,
      experience_level: persona.dimensions.experience_levels,
      fiction_first_alignment: persona.dimensions.fiction_first_alignment,
      narrative_mechanics_comfort: persona.dimensions.narrative_mechanics_comfort,
      gm_philosophy: persona.dimensions.gm_philosophy,
      genre_flexibility: persona.dimensions.genre_flexibility,
      primary_cognitive_style: persona.dimensions.cognitive_styles.primary,
      secondary_cognitive_style: persona.dimensions.cognitive_styles.secondary,
      playstyle_modifiers: persona.dimensions.playstyle_modifiers,
      social_emotional_traits: persona.dimensions.social_emotional_traits,
      system_exposures: persona.dimensions.system_exposures,
      life_contexts: persona.dimensions.life_contexts,
      generated_seed: persona.seed,
    });
    personaIds.push(id);
  }

  // Step 3: Create content snapshot
  const contentId = await projectDb.snapshots.createBookSnapshot({
    bookPath: testBookPath,
    version: '1.0.0',
    chapterCount: 1,
  });

  expect(typeof contentId).toBe('string');
  expect(contentId).toMatch(/^book-/);

  // Step 4: Create review campaign
  const snapshot = '<html><body><h1>Test Book</h1><p>Test content for review</p></body></html>';
  const campaignId = campaignClient.createCampaign({
    contentId,
    contentType: 'book',
    personaIds,
    selectionStrategy: 'manual',
    contentSnapshot: snapshot,
  });

  expect(campaignId).toMatch(/^campaign-/);

  // Step 5: Verify campaign creation
  const campaign = campaignClient.getCampaign(campaignId);
  expect(campaign?.status).toBe('pending');
  expect(campaign?.persona_count).toBe(3);

  // Step 6: Transition to in_progress
  campaignClient.updateCampaignStatus(campaignId, 'in_progress');

  // Step 7: Create reviews for each persona
  for (const personaId of personaIds) {
    const reviewId = campaignClient.createPersonaReview({
      campaignId,
      personaId,
      reviewData: {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: `Review from ${personaId}`,
        issue_annotations: [],
      },
    });
    expect(reviewId).toBeGreaterThan(0);
  }

  // Step 8: Verify all reviews created
  const reviews = campaignClient.getCampaignReviews(campaignId);
  expect(reviews).toHaveLength(3);

  // Step 9: Complete campaign
  campaignClient.updateCampaignStatus(campaignId, 'analyzing');
  campaignClient.updateCampaignStatus(campaignId, 'completed');

  const final = campaignClient.getCampaign(campaignId);
  expect(final?.status).toBe('completed');
});
```

**Step 3: Run test**

```bash
pnpm vitest run src/tooling/e2e/review-workflow.test.ts
```

Expected: PASS if snapshot API fixed, otherwise identify failing assertion

**Step 4: Add test for snapshot integrity**

```typescript
it('should preserve content snapshot even if source file changes', async () => {
  const personas = generatePersonaBatch(1);
  const personaId = projectDb.personas.create({
    name: 'Integrity Test',
    type: 'generated',
    archetype: personas[0]?.dimensions.archetypes ?? 'Explorer',
    experience_level: personas[0]?.dimensions.experience_levels ?? 'Beginner',
    fiction_first_alignment: personas[0]?.dimensions.fiction_first_alignment ?? 'Balanced',
    narrative_mechanics_comfort: personas[0]?.dimensions.narrative_mechanics_comfort ?? 'Medium',
    gm_philosophy: personas[0]?.dimensions.gm_philosophy ?? 'Facilitative',
    genre_flexibility: personas[0]?.dimensions.genre_flexibility ?? 'Medium',
    primary_cognitive_style: personas[0]?.dimensions.cognitive_styles.primary ?? 'Analytical',
    playstyle_modifiers: personas[0]?.dimensions.playstyle_modifiers ?? [],
    social_emotional_traits: personas[0]?.dimensions.social_emotional_traits ?? [],
    system_exposures: personas[0]?.dimensions.system_exposures ?? [],
    life_contexts: personas[0]?.dimensions.life_contexts ?? [],
    generated_seed: personas[0]?.seed ?? 0,
  });

  const originalContent = '<html><body><h1>Original</h1></body></html>';
  writeFileSync(testBookPath, originalContent);

  const contentId = await projectDb.snapshots.createBookSnapshot({
    bookPath: testBookPath,
    version: '1.0.0',
    chapterCount: 1,
  });

  const campaignId = campaignClient.createCampaign({
    contentId,
    contentType: 'book',
    personaIds: [personaId],
    selectionStrategy: 'manual',
    contentSnapshot: originalContent,
  });

  // Modify source file
  writeFileSync(testBookPath, '<html><body><h1>Modified</h1></body></html>');

  // Verify snapshot unchanged
  const campaign = campaignClient.getCampaign(campaignId);
  expect(campaign?.content_snapshot).toBe(originalContent);

  // Verify hash validation
  const snapshot = db.prepare(
    'SELECT content_hash FROM book_versions WHERE content_id = ?'
  ).get(contentId);

  expect(snapshot).toBeDefined();
  expect(snapshot).toHaveProperty('content_hash');
});
```

**Step 5: Run all E2E tests**

```bash
pnpm vitest run src/tooling/e2e/
```

Expected: PASS (2 tests)

**Step 6: Commit**

```bash
git add src/tooling/e2e/review-workflow.test.ts
git commit -m "test(e2e): add review workflow integration tests

- Test complete persona → campaign → review workflow
- Verify content snapshot integrity
- Test campaign lifecycle state transitions
- All tests use in-memory database for isolation"
```

---

## Phase 3: Git Commit Workflow Test

### Task 3: Test Git Operations in E2E Context

**Files:**
- Create: `src/tooling/e2e/git-workflow.test.ts`

**Step 1: Write test for commit creation with state tracking**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { StateClient } from '../database/state-client.js';

describe('E2E Git Workflow', () => {
  let db: Database.Database;
  let stateClient: StateClient;
  const testDir = 'data/test-git-workflow';
  const testFile = `${testDir}/test.md`;

  beforeEach(() => {
    db = new Database(':memory:');
    createTables(db);
    stateClient = new StateClient(db);

    // Create test directory and init git repo
    mkdirSync(testDir, { recursive: true });
    execSync('git init', { cwd: testDir });
    execSync('git config user.email "test@test.com"', { cwd: testDir });
    execSync('git config user.name "Test User"', { cwd: testDir });
  });

  afterEach(() => {
    db.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should track file changes through commit lifecycle', () => {
    // Write initial file
    writeFileSync(testFile, '# Initial Content\n');
    execSync('git add .', { cwd: testDir });
    execSync('git commit -m "Initial commit"', { cwd: testDir });

    const firstCommit = execSync('git rev-parse HEAD', { cwd: testDir })
      .toString()
      .trim();

    // Store snapshot with commit SHA
    const snapshotId = db.prepare(`
      INSERT INTO chapter_versions (
        content_id, book_path, chapter_path, chapter_name, version,
        content, file_hash, source, commit_sha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'chapter-test1',
      testDir,
      testFile,
      'test.md',
      'v1',
      '# Initial Content\n',
      'hash123',
      'git',
      firstCommit
    ).lastInsertRowid;

    expect(snapshotId).toBeGreaterThan(0);

    // Modify and commit again
    writeFileSync(testFile, '# Updated Content\n');
    execSync('git add .', { cwd: testDir });
    execSync('git commit -m "Update content"', { cwd: testDir });

    const secondCommit = execSync('git rev-parse HEAD', { cwd: testDir })
      .toString()
      .trim();

    expect(secondCommit).not.toBe(firstCommit);

    // Verify we can retrieve snapshots by commit SHA
    const snapshot = db.prepare(
      'SELECT * FROM chapter_versions WHERE commit_sha = ?'
    ).get(firstCommit);

    expect(snapshot).toBeDefined();
    expect(snapshot.content).toBe('# Initial Content\n');
  });

  it('should handle state transitions during git operations', () => {
    // Set initial state
    stateClient.setState('workflow', 'editing');

    writeFileSync(testFile, 'Content\n');
    execSync('git add .', { cwd: testDir });

    // Transition state before commit
    stateClient.setState('workflow', 'committing');

    execSync('git commit -m "Test commit"', { cwd: testDir });

    // Update state after commit
    const commitSha = execSync('git rev-parse HEAD', { cwd: testDir })
      .toString()
      .trim();

    stateClient.setState('last_commit', commitSha);
    stateClient.setState('workflow', 'idle');

    // Verify states
    expect(stateClient.getState('workflow')).toBe('idle');
    expect(stateClient.getState('last_commit')).toBe(commitSha);
  });
});
```

**Step 2: Run test**

```bash
pnpm vitest run src/tooling/e2e/git-workflow.test.ts
```

Expected: PASS (2 tests)

**Step 3: Commit**

```bash
git add src/tooling/e2e/git-workflow.test.ts
git commit -m "test(e2e): add git workflow integration tests

- Test commit lifecycle with snapshot tracking
- Verify commit SHA storage and retrieval
- Test state transitions during git operations"
```

---

## Phase 4: CLI E2E Tests

### Task 4: Test CLI Commands End-to-End

**Files:**
- Create: `src/tooling/e2e/cli-commands.test.ts`

**Step 1: Write test for persona CLI workflow**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';

describe('E2E CLI Commands', () => {
  let db: Database.Database;
  const dbPath = 'data/test-cli.db';

  beforeEach(() => {
    db = new Database(dbPath);
    createTables(db);
  });

  afterEach(() => {
    db.close();
    execSync(`rm -f ${dbPath}`);
  });

  it('should generate personas via CLI and verify in database', () => {
    // Run CLI command to generate personas
    const output = execSync(
      'pnpm tsx src/tooling/cli-commands/run.ts generate 5 --seed 12345',
      { encoding: 'utf-8' }
    );

    expect(output).toContain('Generated 5 personas');

    // Verify in database
    const count = db.prepare('SELECT COUNT(*) as count FROM personas').get();
    expect(count.count).toBe(5);

    // Verify personas have correct attributes
    const personas = db.prepare('SELECT * FROM personas WHERE type = ?').all('generated');
    expect(personas).toHaveLength(5);

    for (const persona of personas) {
      expect(persona).toHaveProperty('archetype');
      expect(persona).toHaveProperty('experience_level');
      expect(persona.generated_seed).toBe(12345);
    }
  });

  it('should run stats command and display persona distribution', () => {
    // First generate some personas
    execSync('pnpm tsx src/tooling/cli-commands/run.ts generate 10');

    // Run stats command
    const output = execSync(
      'pnpm tsx src/tooling/cli-commands/run.ts stats',
      { encoding: 'utf-8' }
    );

    expect(output).toContain('Total personas:');
    expect(output).toContain('Archetypes:');
    expect(output).toContain('Experience Levels:');
  });

  it('should create review campaign via CLI', () => {
    // Generate test personas first
    execSync('pnpm tsx src/tooling/cli-commands/run.ts generate 3');

    // Create test book
    const testBook = 'data/test-cli-book.html';
    execSync(`echo '<html><body>Test</body></html>' > ${testBook}`);

    // Run review command
    const output = execSync(
      `pnpm tsx src/tooling/cli-commands/run.ts review book ${testBook}`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('Campaign created:');
    expect(output).toMatch(/campaign-[a-f0-9]+/);

    // Verify campaign in database
    const campaign = db.prepare(
      'SELECT * FROM review_campaigns ORDER BY created_at DESC LIMIT 1'
    ).get();

    expect(campaign).toBeDefined();
    expect(campaign.status).toBe('pending');

    // Cleanup
    execSync(`rm -f ${testBook}`);
  });
});
```

**Step 2: Run test**

```bash
pnpm vitest run src/tooling/e2e/cli-commands.test.ts
```

Expected: PASS (3 tests) - may need to adjust based on actual CLI behavior

**Step 3: Commit**

```bash
git add src/tooling/e2e/cli-commands.test.ts
git commit -m "test(e2e): add CLI command integration tests

- Test persona generation via CLI with database verification
- Test stats command output
- Test review campaign creation via CLI
- All tests verify actual database state after CLI execution"
```

---

## Final Task: Update Test Documentation

### Task 5: Document E2E Testing Patterns

**Files:**
- Modify: `TESTING.md`

**Step 1: Add E2E testing section**

Add to `TESTING.md` after integration tests section:

```markdown
### E2E Tests

Located in `src/tooling/e2e/`

Test complete workflows from start to finish.

**Pattern:**

```typescript
import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';

describe('E2E Workflow', () => {
  let db: Database.Database;
  const dbPath = 'data/test-e2e.db';

  beforeEach(() => {
    db = new Database(dbPath);
    createTables(db);
  });

  afterEach(() => {
    db.close();
    execSync(`rm -f ${dbPath}`);
  });

  it('should complete full workflow', () => {
    // Execute CLI commands
    execSync('pnpm tsx src/tooling/cli-commands/run.ts ...');

    // Verify database state
    const result = db.prepare('SELECT ...').get();
    expect(result).toBeDefined();
  });
});
```

**Characteristics:**
- Use real CLI commands via execSync
- Use actual database files (not :memory: for CLI tests)
- Clean up test data in afterEach
- Test complete user workflows
- Verify both command output and database state

**Example Tests:**
- `review-workflow.test.ts` - Persona → Campaign → Review
- `git-workflow.test.ts` - Git operations with state tracking
- `cli-commands.test.ts` - CLI command execution and verification
```

**Step 2: Commit**

```bash
git add TESTING.md
git commit -m "docs(testing): add E2E testing patterns and examples

- Document E2E test structure with execSync pattern
- Add examples for workflow, git, and CLI tests
- Explain cleanup patterns for E2E tests"
```

---

## Success Criteria

- [ ] Snapshot API returns content ID strings (book-*, chapter-*)
- [ ] Database schema updated with content_id columns
- [ ] E2E review workflow test passes (3 scenarios)
- [ ] Git workflow test passes (2 scenarios)
- [ ] CLI commands test passes (3 scenarios)
- [ ] TESTING.md documents E2E patterns
- [ ] All new tests have >90% code coverage
- [ ] No segmentation faults or test flakiness
- [ ] Tests run in <5 seconds total

---

## Notes

**Why fix snapshot API first:** The review system expects content IDs, not database row IDs. This is a breaking change that must be done before E2E tests can work.

**Why use actual DB files for CLI tests:** CLI commands operate on real database files, not in-memory databases. E2E tests should match real usage.

**Why separate E2E from integration:** Integration tests mock external dependencies. E2E tests use real CLI, real git, real filesystem.

**Testing philosophy:** Test behavior, not implementation. E2E tests verify the system works from a user's perspective.
