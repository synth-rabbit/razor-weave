import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { unlinkSync } from 'fs';
import {
  ArtifactQuery,
  WORKFLOW_DEPENDENCIES,
  type ArtifactSearchCriteria,
  type Artifact,
} from './artifact-query.js';
import type { ArtifactType } from './artifact-types.js';
import type { WorkflowType } from './types.js';

describe('ArtifactQuery', () => {
  let db: Database.Database;
  let query: ArtifactQuery;
  const testDbPath = '/tmp/test-artifact-query.db';

  /**
   * Helper to create the required database schema for tests.
   */
  function createSchema() {
    db.exec(`
      -- Books table
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        book_type TEXT NOT NULL CHECK(book_type IN ('core', 'source', 'campaign', 'supplement')),
        source_path TEXT NOT NULL,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'editing', 'published')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);

      -- Workflow runs table
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_type TEXT NOT NULL CHECK(workflow_type IN (
          'w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'
        )),
        book_id TEXT NOT NULL REFERENCES books(id),
        input_version_id TEXT,
        output_version_id TEXT,
        session_id TEXT,
        plan_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
          'pending', 'running', 'paused', 'completed', 'failed'
        )),
        current_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_workflow_runs_book ON workflow_runs(book_id);
      CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
      CREATE INDEX IF NOT EXISTS idx_workflow_runs_type ON workflow_runs(workflow_type);

      -- Workflow artifacts table
      CREATE TABLE IF NOT EXISTS workflow_artifacts (
        id TEXT PRIMARY KEY,
        workflow_run_id TEXT NOT NULL,
        artifact_type TEXT NOT NULL CHECK(artifact_type IN (
          'chapter', 'release_notes', 'print_html', 'web_html', 'pdf_draft',
          'pdf_digital', 'pdf_print', 'layout_plan', 'design_plan',
          'deployment', 'qa_report', 'marketing_copy', 'announcement',
          'playtest_session', 'playtest_analysis', 'playtest_feedback'
        )),
        artifact_path TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_artifacts_run ON workflow_artifacts(workflow_run_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_type ON workflow_artifacts(artifact_type);
    `);
  }

  /**
   * Helper to seed test data.
   */
  function seedTestData() {
    // Insert books
    db.exec(`
      INSERT INTO books (id, slug, title, book_type, source_path)
      VALUES
        ('book_core', 'core-rulebook', 'Core Rulebook', 'core', 'books/core'),
        ('book_source', 'sourcebook-alpha', 'Sourcebook Alpha', 'source', 'books/source');
    `);

    // Insert workflow runs
    db.exec(`
      INSERT INTO workflow_runs (id, workflow_type, book_id, status, input_version_id, output_version_id, created_at)
      VALUES
        ('wfrun_w1_1', 'w1_editing', 'book_core', 'completed', NULL, 'ver_w1_out', '2024-01-01 10:00:00'),
        ('wfrun_w1_2', 'w1_editing', 'book_core', 'completed', NULL, 'ver_w1_out_2', '2024-01-02 10:00:00'),
        ('wfrun_w2_1', 'w2_pdf', 'book_core', 'completed', 'ver_w1_out', 'ver_w2_out', '2024-01-03 10:00:00'),
        ('wfrun_w3_1', 'w3_publication', 'book_core', 'running', 'ver_w2_out', NULL, '2024-01-04 10:00:00'),
        ('wfrun_w1_source', 'w1_editing', 'book_source', 'pending', NULL, NULL, '2024-01-05 10:00:00');
    `);

    // Insert artifacts
    db.exec(`
      INSERT INTO workflow_artifacts (id, workflow_run_id, artifact_type, artifact_path, metadata, created_at)
      VALUES
        ('art_ch1', 'wfrun_w1_1', 'chapter', '/chapters/ch1.md', '{"chapter": 1}', '2024-01-01 11:00:00'),
        ('art_ch2', 'wfrun_w1_1', 'chapter', '/chapters/ch2.md', '{"chapter": 2}', '2024-01-01 12:00:00'),
        ('art_html1', 'wfrun_w1_1', 'print_html', '/html/book.html', NULL, '2024-01-01 13:00:00'),
        ('art_ch3', 'wfrun_w1_2', 'chapter', '/chapters/ch3.md', '{"chapter": 3}', '2024-01-02 11:00:00'),
        ('art_draft', 'wfrun_w1_2', 'pdf_draft', '/pdf/draft.pdf', '{"pages": 100}', '2024-01-02 12:00:00'),
        ('art_digital', 'wfrun_w2_1', 'pdf_digital', '/pdf/digital.pdf', '{"size": "5MB"}', '2024-01-03 11:00:00'),
        ('art_print', 'wfrun_w2_1', 'pdf_print', '/pdf/print.pdf', '{"bleed": true}', '2024-01-03 12:00:00'),
        ('art_deploy', 'wfrun_w3_1', 'deployment', '/deploy/record.json', NULL, '2024-01-04 11:00:00'),
        ('art_source_ch', 'wfrun_w1_source', 'chapter', '/source/ch1.md', NULL, '2024-01-05 11:00:00');
    `);
  }

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');
    createSchema();
    query = new ArtifactQuery(db);
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create an ArtifactQuery with a database', () => {
      expect(query).toBeInstanceOf(ArtifactQuery);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      seedTestData();
    });

    it('should return all artifacts when no criteria specified', () => {
      const result = query.search({});

      expect(result.artifacts.length).toBeGreaterThan(0);
      expect(result.totalCount).toBe(result.artifacts.length);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by bookSlug', () => {
      const result = query.search({ bookSlug: 'core-rulebook' });

      expect(result.artifacts.length).toBe(8); // All core-rulebook artifacts
      expect(result.artifacts.every((a) => a.bookSlug === 'core-rulebook')).toBe(true);
    });

    it('should filter by workflowType', () => {
      const result = query.search({ workflowType: 'w1_editing' });

      expect(result.artifacts.every((a) => a.workflowType === 'w1_editing')).toBe(true);
    });

    it('should filter by artifactType', () => {
      const result = query.search({ artifactType: 'chapter' });

      expect(result.artifacts.every((a) => a.artifactType === 'chapter')).toBe(true);
      expect(result.artifacts.length).toBe(4); // 4 chapters total
    });

    it('should filter by status', () => {
      const result = query.search({ status: 'completed' });

      expect(result.artifacts.every((a) => a.workflowStatus === 'completed')).toBe(true);
    });

    it('should filter by afterDate', () => {
      const afterDate = new Date('2024-01-02T00:00:00Z');
      const result = query.search({ afterDate });

      expect(result.artifacts.length).toBeGreaterThan(0);
      expect(
        result.artifacts.every((a) => new Date(a.createdAt) > afterDate)
      ).toBe(true);
    });

    it('should filter by beforeDate', () => {
      // Use a date that's clearly after some artifacts but before others
      // Artifacts from 2024-01-01 should be before this date
      const beforeDate = new Date('2024-01-01T14:00:00Z');
      const result = query.search({ beforeDate });

      expect(result.artifacts.length).toBeGreaterThan(0);
      // All returned artifacts should have been created before the filter date
      // Note: SQLite stores dates as strings, so comparison is lexicographic
      expect(
        result.artifacts.every((a) => a.createdAt < beforeDate.toISOString())
      ).toBe(true);
    });

    it('should combine multiple criteria', () => {
      const result = query.search({
        bookSlug: 'core-rulebook',
        workflowType: 'w1_editing',
        artifactType: 'chapter',
      });

      expect(result.artifacts.every((a) => a.bookSlug === 'core-rulebook')).toBe(true);
      expect(result.artifacts.every((a) => a.workflowType === 'w1_editing')).toBe(true);
      expect(result.artifacts.every((a) => a.artifactType === 'chapter')).toBe(true);
    });

    it('should support pagination with limit', () => {
      const result = query.search({}, 2);

      expect(result.artifacts.length).toBe(2);
      expect(result.totalCount).toBe(9); // Total artifacts
      expect(result.hasMore).toBe(true);
    });

    it('should support pagination with offset', () => {
      const firstPage = query.search({}, 2, 0);
      const secondPage = query.search({}, 2, 2);

      expect(firstPage.artifacts[0].id).not.toBe(secondPage.artifacts[0].id);
      expect(secondPage.hasMore).toBe(true);
    });

    it('should return empty result when no matches', () => {
      const result = query.search({ bookSlug: 'nonexistent-book' });

      expect(result.artifacts).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should include extended artifact information', () => {
      const result = query.search({ artifactType: 'chapter' }, 1);

      const artifact = result.artifacts[0];
      expect(artifact.id).toBeDefined();
      expect(artifact.workflowRunId).toBeDefined();
      expect(artifact.artifactType).toBe('chapter');
      expect(artifact.bookSlug).toBeDefined();
      expect(artifact.workflowType).toBeDefined();
      expect(artifact.workflowStatus).toBeDefined();
    });

    it('should order results by created_at descending (newest first)', () => {
      const result = query.search({});

      for (let i = 1; i < result.artifacts.length; i++) {
        const current = new Date(result.artifacts[i].createdAt).getTime();
        const previous = new Date(result.artifacts[i - 1].createdAt).getTime();
        expect(current).toBeLessThanOrEqual(previous);
      }
    });
  });

  describe('findLatestForBook', () => {
    beforeEach(() => {
      seedTestData();
    });

    it('should find the latest artifact of a type for a book', () => {
      const latest = query.findLatestForBook('core-rulebook', 'chapter');

      expect(latest).not.toBeNull();
      expect(latest!.artifactType).toBe('chapter');
      expect(latest!.bookSlug).toBe('core-rulebook');
      // Should be ch3 as it was created latest
      expect(latest!.artifactPath).toBe('/chapters/ch3.md');
    });

    it('should return null when no matching artifact', () => {
      const latest = query.findLatestForBook('core-rulebook', 'playtest_session');

      expect(latest).toBeNull();
    });

    it('should return null for non-existent book', () => {
      const latest = query.findLatestForBook('nonexistent', 'chapter');

      expect(latest).toBeNull();
    });

    it('should find latest pdf_digital', () => {
      const latest = query.findLatestForBook('core-rulebook', 'pdf_digital');

      expect(latest).not.toBeNull();
      expect(latest!.artifactPath).toBe('/pdf/digital.pdf');
      expect(latest!.metadata).toEqual({ size: '5MB' });
    });

    it('should include all artifact metadata', () => {
      const latest = query.findLatestForBook('core-rulebook', 'pdf_print');

      expect(latest).not.toBeNull();
      expect(latest!.id).toBe('art_print');
      expect(latest!.workflowRunId).toBe('wfrun_w2_1');
      expect(latest!.workflowType).toBe('w2_pdf');
      expect(latest!.workflowStatus).toBe('completed');
    });
  });

  describe('findByWorkflowType', () => {
    beforeEach(() => {
      seedTestData();
    });

    it('should find all artifacts from a workflow type for a book', () => {
      const artifacts = query.findByWorkflowType('core-rulebook', 'w1_editing');

      expect(artifacts.length).toBe(5); // ch1, ch2, html1, ch3, draft
      expect(artifacts.every((a) => a.workflowType === 'w1_editing')).toBe(true);
      expect(artifacts.every((a) => a.bookSlug === 'core-rulebook')).toBe(true);
    });

    it('should find W2 artifacts', () => {
      const artifacts = query.findByWorkflowType('core-rulebook', 'w2_pdf');

      expect(artifacts.length).toBe(2); // digital, print
      expect(artifacts.some((a) => a.artifactType === 'pdf_digital')).toBe(true);
      expect(artifacts.some((a) => a.artifactType === 'pdf_print')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const artifacts = query.findByWorkflowType('sourcebook-alpha', 'w2_pdf');

      expect(artifacts).toHaveLength(0);
    });

    it('should order by created_at descending', () => {
      const artifacts = query.findByWorkflowType('core-rulebook', 'w1_editing');

      for (let i = 1; i < artifacts.length; i++) {
        const current = new Date(artifacts[i].createdAt).getTime();
        const previous = new Date(artifacts[i - 1].createdAt).getTime();
        expect(current).toBeLessThanOrEqual(previous);
      }
    });
  });

  describe('findDependencies', () => {
    beforeEach(() => {
      seedTestData();
    });

    it('should return empty for W1 (no dependencies)', () => {
      const deps = query.findDependencies('w1_editing', 'core-rulebook');

      expect(deps).toHaveLength(0);
    });

    it('should find W1 artifacts as dependencies for W2', () => {
      const deps = query.findDependencies('w2_pdf', 'core-rulebook');

      expect(deps.length).toBeGreaterThan(0);
      expect(deps.every((a) => a.workflowType === 'w1_editing')).toBe(true);
      expect(deps.every((a) => a.workflowStatus === 'completed')).toBe(true);
    });

    it('should find W2 artifacts as dependencies for W3', () => {
      const deps = query.findDependencies('w3_publication', 'core-rulebook');

      expect(deps.length).toBeGreaterThan(0);
      expect(deps.every((a) => a.workflowType === 'w2_pdf')).toBe(true);
    });

    it('should find W1 artifacts as dependencies for W4', () => {
      const deps = query.findDependencies('w4_playtesting', 'core-rulebook');

      expect(deps.length).toBeGreaterThan(0);
      expect(deps.every((a) => a.workflowType === 'w1_editing')).toBe(true);
    });

    it('should only return artifacts from completed workflow runs', () => {
      const deps = query.findDependencies('w2_pdf', 'core-rulebook');

      expect(deps.every((a) => a.workflowStatus === 'completed')).toBe(true);
    });

    it('should return empty for book with no matching dependencies', () => {
      const deps = query.findDependencies('w2_pdf', 'sourcebook-alpha');

      // sourcebook-alpha only has pending workflow, so no completed deps
      expect(deps).toHaveLength(0);
    });
  });

  describe('getLineage', () => {
    beforeEach(() => {
      seedTestData();
    });

    it('should return artifact itself as first in lineage', () => {
      const lineage = query.getLineage('art_digital');

      expect(lineage.length).toBeGreaterThan(0);
      expect(lineage[0].id).toBe('art_digital');
    });

    it('should trace back through workflow chain', () => {
      // art_digital is from wfrun_w2_1, which has input_version_id = 'ver_w1_out'
      // wfrun_w1_1 has output_version_id = 'ver_w1_out'
      const lineage = query.getLineage('art_digital');

      expect(lineage.length).toBeGreaterThan(1);
      // First should be the artifact itself
      expect(lineage[0].id).toBe('art_digital');
      // Should contain W1 artifacts from the source workflow
      const w1Artifacts = lineage.filter((a) => a.workflowType === 'w1_editing');
      expect(w1Artifacts.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent artifact', () => {
      const lineage = query.getLineage('art_nonexistent');

      expect(lineage).toHaveLength(0);
    });

    it('should handle artifact with no upstream dependencies', () => {
      // art_ch1 is from wfrun_w1_1 which has no input_version_id
      const lineage = query.getLineage('art_ch1');

      expect(lineage.length).toBe(1);
      expect(lineage[0].id).toBe('art_ch1');
    });

    it('should not include duplicate artifacts', () => {
      const lineage = query.getLineage('art_digital');
      const ids = lineage.map((a) => a.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('empty results handling', () => {
    it('should handle search with no data', () => {
      const result = query.search({});

      expect(result.artifacts).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle findLatestForBook with no data', () => {
      const latest = query.findLatestForBook('core-rulebook', 'chapter');

      expect(latest).toBeNull();
    });

    it('should handle findByWorkflowType with no data', () => {
      const artifacts = query.findByWorkflowType('core-rulebook', 'w1_editing');

      expect(artifacts).toHaveLength(0);
    });

    it('should handle findDependencies with no data', () => {
      const deps = query.findDependencies('w2_pdf', 'core-rulebook');

      expect(deps).toHaveLength(0);
    });

    it('should handle getLineage with no data', () => {
      const lineage = query.getLineage('art_nonexistent');

      expect(lineage).toHaveLength(0);
    });
  });

  describe('WORKFLOW_DEPENDENCIES constant', () => {
    it('should define dependencies for all workflow types', () => {
      const workflowTypes: WorkflowType[] = ['w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'];

      workflowTypes.forEach((wf) => {
        expect(WORKFLOW_DEPENDENCIES[wf]).toBeDefined();
        expect(Array.isArray(WORKFLOW_DEPENDENCIES[wf])).toBe(true);
      });
    });

    it('should have W1 with no dependencies', () => {
      expect(WORKFLOW_DEPENDENCIES.w1_editing).toHaveLength(0);
    });

    it('should have W2 depend on W1', () => {
      expect(WORKFLOW_DEPENDENCIES.w2_pdf).toContain('w1_editing');
    });

    it('should have W3 depend on W2', () => {
      expect(WORKFLOW_DEPENDENCIES.w3_publication).toContain('w2_pdf');
    });

    it('should have W4 depend on W1', () => {
      expect(WORKFLOW_DEPENDENCIES.w4_playtesting).toContain('w1_editing');
    });
  });

  describe('metadata parsing', () => {
    beforeEach(() => {
      seedTestData();
    });

    it('should parse JSON metadata correctly', () => {
      const result = query.search({ artifactType: 'pdf_draft' });

      expect(result.artifacts.length).toBe(1);
      expect(result.artifacts[0].metadata).toEqual({ pages: 100 });
    });

    it('should handle null metadata', () => {
      const result = query.search({ artifactType: 'print_html' });

      expect(result.artifacts.length).toBe(1);
      expect(result.artifacts[0].metadata).toBeNull();
    });

    it('should handle complex metadata', () => {
      const latest = query.findLatestForBook('core-rulebook', 'pdf_print');

      expect(latest).not.toBeNull();
      expect(latest!.metadata).toEqual({ bleed: true });
    });
  });
});
