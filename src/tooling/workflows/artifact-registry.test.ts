import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { unlinkSync } from 'fs';
import {
  ArtifactRegistry,
  InvalidArtifactPathError,
  ARTIFACT_TYPES,
  type ArtifactType,
  type RegisterArtifactInput,
} from './artifact-registry.js';

describe('ArtifactRegistry', () => {
  let db: Database.Database;
  let registry: ArtifactRegistry;
  const testDbPath = '/tmp/test-artifact-registry.db';

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');

    // Create the workflow_artifacts table (from migration 004)
    db.exec(`
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

    registry = new ArtifactRegistry(db);
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
    it('should create an ArtifactRegistry with a database', () => {
      expect(registry).toBeInstanceOf(ArtifactRegistry);
    });
  });

  describe('register', () => {
    it('should register an artifact and return it', () => {
      const input: RegisterArtifactInput = {
        workflowRunId: 'run_12345',
        artifactType: 'pdf_draft',
        artifactPath: '/output/book-draft.pdf',
      };

      const artifact = registry.register(input);

      expect(artifact.id).toMatch(/^art_[a-f0-9]{8}$/);
      expect(artifact.workflowRunId).toBe('run_12345');
      expect(artifact.artifactType).toBe('pdf_draft');
      expect(artifact.artifactPath).toBe('/output/book-draft.pdf');
      expect(artifact.metadata).toBeNull();
      expect(artifact.createdAt).toBeDefined();
    });

    it('should register an artifact with metadata', () => {
      const input: RegisterArtifactInput = {
        workflowRunId: 'run_12345',
        artifactType: 'pdf_draft',
        artifactPath: '/output/book-draft.pdf',
        metadata: { pages: 42, format: 'A4' },
      };

      const artifact = registry.register(input);

      expect(artifact.metadata).toEqual({ pages: 42, format: 'A4' });
    });

    it('should throw InvalidArtifactPathError for empty path', () => {
      const input: RegisterArtifactInput = {
        workflowRunId: 'run_12345',
        artifactType: 'pdf_draft',
        artifactPath: '',
      };

      expect(() => registry.register(input)).toThrow(InvalidArtifactPathError);
      expect(() => registry.register(input)).toThrow('Artifact path cannot be empty');
    });

    it('should throw InvalidArtifactPathError for whitespace-only path', () => {
      const input: RegisterArtifactInput = {
        workflowRunId: 'run_12345',
        artifactType: 'pdf_draft',
        artifactPath: '   ',
      };

      expect(() => registry.register(input)).toThrow(InvalidArtifactPathError);
    });

    it.each(ARTIFACT_TYPES)('should register artifact of type %s', (artifactType) => {
      const input: RegisterArtifactInput = {
        workflowRunId: 'run_test',
        artifactType,
        artifactPath: `/output/${artifactType}.txt`,
      };

      const artifact = registry.register(input);

      expect(artifact.artifactType).toBe(artifactType);
    });

    it('should generate unique IDs for each artifact', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const artifact = registry.register({
          workflowRunId: 'run_test',
          artifactType: 'chapter',
          artifactPath: `/chapter-${i}.md`,
        });
        ids.add(artifact.id);
      }

      expect(ids.size).toBe(10);
    });
  });

  describe('getById', () => {
    it('should return artifact by ID', () => {
      const registered = registry.register({
        workflowRunId: 'run_12345',
        artifactType: 'pdf_draft',
        artifactPath: '/output/book.pdf',
      });

      const retrieved = registry.getById(registered.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(registered.id);
      expect(retrieved!.workflowRunId).toBe('run_12345');
    });

    it('should return null for non-existent ID', () => {
      const result = registry.getById('art_nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByRunId', () => {
    it('should return all artifacts for a run', () => {
      registry.register({
        workflowRunId: 'run_abc',
        artifactType: 'chapter',
        artifactPath: '/chapters/01.md',
      });
      registry.register({
        workflowRunId: 'run_abc',
        artifactType: 'release_notes',
        artifactPath: '/release-notes.md',
      });
      registry.register({
        workflowRunId: 'run_other',
        artifactType: 'chapter',
        artifactPath: '/chapters/02.md',
      });

      const artifacts = registry.getByRunId('run_abc');

      expect(artifacts).toHaveLength(2);
      expect(artifacts.every((a) => a.workflowRunId === 'run_abc')).toBe(true);
    });

    it('should return empty array for non-existent run', () => {
      const artifacts = registry.getByRunId('run_nonexistent');

      expect(artifacts).toEqual([]);
    });

    it('should return artifacts in creation order', () => {
      registry.register({
        workflowRunId: 'run_order',
        artifactType: 'chapter',
        artifactPath: '/first.md',
      });
      registry.register({
        workflowRunId: 'run_order',
        artifactType: 'release_notes',
        artifactPath: '/second.md',
      });
      registry.register({
        workflowRunId: 'run_order',
        artifactType: 'pdf_draft',
        artifactPath: '/third.pdf',
      });

      const artifacts = registry.getByRunId('run_order');

      expect(artifacts[0].artifactPath).toBe('/first.md');
      expect(artifacts[1].artifactPath).toBe('/second.md');
      expect(artifacts[2].artifactPath).toBe('/third.pdf');
    });
  });

  describe('getByType', () => {
    it('should return all artifacts of a type', () => {
      registry.register({
        workflowRunId: 'run_1',
        artifactType: 'chapter',
        artifactPath: '/ch1.md',
      });
      registry.register({
        workflowRunId: 'run_2',
        artifactType: 'chapter',
        artifactPath: '/ch2.md',
      });
      registry.register({
        workflowRunId: 'run_1',
        artifactType: 'pdf_draft',
        artifactPath: '/book.pdf',
      });

      const artifacts = registry.getByType('chapter');

      expect(artifacts).toHaveLength(2);
      expect(artifacts.every((a) => a.artifactType === 'chapter')).toBe(true);
    });

    it('should return empty array for type with no artifacts', () => {
      registry.register({
        workflowRunId: 'run_1',
        artifactType: 'chapter',
        artifactPath: '/ch.md',
      });

      const artifacts = registry.getByType('pdf_print');

      expect(artifacts).toEqual([]);
    });

    it.each([
      'chapter',
      'release_notes',
      'print_html',
      'web_html',
      'pdf_draft',
      'pdf_digital',
      'pdf_print',
      'layout_plan',
      'design_plan',
      'deployment',
      'qa_report',
      'marketing_copy',
      'announcement',
      'playtest_session',
      'playtest_analysis',
      'playtest_feedback',
    ] as ArtifactType[])('should query by type: %s', (type) => {
      registry.register({
        workflowRunId: 'run_test',
        artifactType: type,
        artifactPath: `/artifact.${type}`,
      });

      const artifacts = registry.getByType(type);

      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].artifactType).toBe(type);
    });
  });

  describe('getByRunAndType', () => {
    it('should return artifacts matching both run and type', () => {
      registry.register({
        workflowRunId: 'run_a',
        artifactType: 'chapter',
        artifactPath: '/a-ch1.md',
      });
      registry.register({
        workflowRunId: 'run_a',
        artifactType: 'chapter',
        artifactPath: '/a-ch2.md',
      });
      registry.register({
        workflowRunId: 'run_a',
        artifactType: 'pdf_draft',
        artifactPath: '/a.pdf',
      });
      registry.register({
        workflowRunId: 'run_b',
        artifactType: 'chapter',
        artifactPath: '/b-ch1.md',
      });

      const artifacts = registry.getByRunAndType('run_a', 'chapter');

      expect(artifacts).toHaveLength(2);
      expect(artifacts.every((a) => a.workflowRunId === 'run_a')).toBe(true);
      expect(artifacts.every((a) => a.artifactType === 'chapter')).toBe(true);
    });

    it('should return empty array when no match', () => {
      registry.register({
        workflowRunId: 'run_x',
        artifactType: 'chapter',
        artifactPath: '/ch.md',
      });

      const artifacts = registry.getByRunAndType('run_x', 'pdf_draft');

      expect(artifacts).toEqual([]);
    });

    it('should return empty array for non-existent run', () => {
      const artifacts = registry.getByRunAndType('run_nonexistent', 'chapter');

      expect(artifacts).toEqual([]);
    });
  });

  describe('metadata serialization', () => {
    it('should serialize and deserialize complex metadata', () => {
      const complexMetadata = {
        pages: 100,
        chapters: ['intro', 'ch1', 'ch2'],
        settings: {
          format: 'A4',
          margins: { top: 1, bottom: 1, left: 1, right: 1 },
        },
        generated: true,
        timestamp: '2024-01-15T10:30:00Z',
      };

      const artifact = registry.register({
        workflowRunId: 'run_meta',
        artifactType: 'pdf_draft',
        artifactPath: '/complex.pdf',
        metadata: complexMetadata,
      });

      const retrieved = registry.getById(artifact.id);

      expect(retrieved!.metadata).toEqual(complexMetadata);
    });

    it('should handle null metadata', () => {
      const artifact = registry.register({
        workflowRunId: 'run_null',
        artifactType: 'chapter',
        artifactPath: '/no-meta.md',
      });

      const retrieved = registry.getById(artifact.id);

      expect(retrieved!.metadata).toBeNull();
    });

    it('should handle empty object metadata', () => {
      const artifact = registry.register({
        workflowRunId: 'run_empty',
        artifactType: 'chapter',
        artifactPath: '/empty-meta.md',
        metadata: {},
      });

      const retrieved = registry.getById(artifact.id);

      expect(retrieved!.metadata).toEqual({});
    });

    it('should preserve metadata through queries', () => {
      const meta = { version: 1, author: 'test' };

      registry.register({
        workflowRunId: 'run_preserve',
        artifactType: 'chapter',
        artifactPath: '/preserve.md',
        metadata: meta,
      });

      const byRun = registry.getByRunId('run_preserve');
      expect(byRun[0].metadata).toEqual(meta);

      const byType = registry.getByType('chapter');
      const artifact = byType.find((a) => a.workflowRunId === 'run_preserve');
      expect(artifact!.metadata).toEqual(meta);

      const byBoth = registry.getByRunAndType('run_preserve', 'chapter');
      expect(byBoth[0].metadata).toEqual(meta);
    });
  });

  describe('ARTIFACT_TYPES constant', () => {
    it('should contain all 16 artifact types', () => {
      expect(ARTIFACT_TYPES).toHaveLength(16);
    });

    it('should include all expected types', () => {
      const expectedTypes = [
        'chapter',
        'release_notes',
        'print_html',
        'web_html',
        'pdf_draft',
        'pdf_digital',
        'pdf_print',
        'layout_plan',
        'design_plan',
        'deployment',
        'qa_report',
        'marketing_copy',
        'announcement',
        'playtest_session',
        'playtest_analysis',
        'playtest_feedback',
      ];

      expectedTypes.forEach((type) => {
        expect(ARTIFACT_TYPES).toContain(type);
      });
    });
  });

  describe('InvalidArtifactPathError', () => {
    it('should have correct error name', () => {
      const error = new InvalidArtifactPathError('test message');
      expect(error.name).toBe('InvalidArtifactPathError');
    });

    it('should include the message', () => {
      const error = new InvalidArtifactPathError('custom error message');
      expect(error.message).toBe('custom error message');
    });
  });
});
