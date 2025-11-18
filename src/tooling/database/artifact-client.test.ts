// src/tooling/database/artifact-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDatabase } from './client.js';
import { unlinkSync, mkdirSync } from 'fs';

describe('ArtifactClient', () => {
  let db: ProjectDatabase;
  const testDbPath = 'data/test-artifacts.db';

  beforeEach(() => {
    mkdirSync('data', { recursive: true });
    db = new ProjectDatabase(testDbPath);
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(testDbPath + '-shm');
      unlinkSync(testDbPath + '-wal');
    } catch {
      // Ignore
    }
  });

  it('should create artifact', () => {
    const id = db.artifacts.create('data/test.json', '{"foo":"bar"}', 'generated_content');

    expect(id).toBeGreaterThan(0);
  });

  it('should get artifact by id', () => {
    const id = db.artifacts.create('data/test.json', '{"foo":"bar"}', 'generated_content');

    const artifact = db.artifacts.get(id);

    expect(artifact).toBeDefined();
    expect(artifact?.content).toBe('{"foo":"bar"}');
  });

  it('should get artifacts by path', () => {
    db.artifacts.create('data/analysis/report.json', '{"v":1}', 'analysis');
    db.artifacts.create('data/analysis/report.json', '{"v":2}', 'analysis');

    const artifacts = db.artifacts.getByPath('data/analysis/report.json');

    expect(artifacts).toHaveLength(2);
  });

  it('should archive artifacts', () => {
    const id = db.artifacts.create('data/test.json', 'content', 'cache');

    db.artifacts.archive(id);

    const artifact = db.artifacts.get(id);
    expect(artifact).toBeNull(); // Archived artifacts excluded
  });
});
