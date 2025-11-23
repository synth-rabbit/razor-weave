import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlanGenerator } from './generator';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_EVENTS_DIR = 'data/test-generator-events';
const TEST_OUTPUT_DIR = 'data/test-generator-output';

describe('PlanGenerator', () => {
  beforeEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_OUTPUT_DIR)) rmSync(TEST_OUTPUT_DIR, { recursive: true });
    mkdirSync(TEST_EVENTS_DIR, { recursive: true });
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true });

    // Create test events
    writeFileSync(
      join(TEST_EVENTS_DIR, '2024-11-22-test.jsonl'),
      [
        JSON.stringify({
          id: 'evt_1',
          ts: '2024-11-22T00:00:00Z',
          worktree: 'main',
          table: 'boardroom_sessions',
          op: 'INSERT',
          data: {
            id: 'sess_gen_test',
            proposal_path: 'docs/proposals/test.md',
            status: 'completed',
            created_at: '2024-11-22T00:00:00Z',
            completed_at: '2024-11-22T01:00:00Z',
          },
        }),
        JSON.stringify({
          id: 'evt_2',
          ts: '2024-11-22T00:01:00Z',
          worktree: 'main',
          table: 'vp_plans',
          op: 'INSERT',
          data: {
            id: 'plan_product',
            session_id: 'sess_gen_test',
            vp_type: 'product',
            status: 'approved',
            plan_path: null,
            created_at: '2024-11-22T00:01:00Z',
          },
        }),
        JSON.stringify({
          id: 'evt_3',
          ts: '2024-11-22T00:02:00Z',
          worktree: 'main',
          table: 'phases',
          op: 'INSERT',
          data: {
            id: 'phase_1',
            plan_id: 'plan_product',
            name: 'Phase 1: Foundation',
            description: 'Build the core infrastructure',
            sequence: 1,
            acceptance_criteria: JSON.stringify(['Tests pass', 'Coverage 80%']),
          },
        }),
        JSON.stringify({
          id: 'evt_4',
          ts: '2024-11-22T00:03:00Z',
          worktree: 'main',
          table: 'milestones',
          op: 'INSERT',
          data: {
            id: 'ms_1',
            phase_id: 'phase_1',
            name: 'Setup complete',
            description: 'Initial project setup',
            sequence: 1,
          },
        }),
        JSON.stringify({
          id: 'evt_5',
          ts: '2024-11-22T00:04:00Z',
          worktree: 'main',
          table: 'engineering_tasks',
          op: 'INSERT',
          data: {
            id: 'task_1',
            plan_id: 'plan_eng',
            milestone_id: 'ms_1',
            description: 'Create project structure',
            file_paths: JSON.stringify(['src/index.ts', 'package.json']),
            dependencies: null,
          },
        }),
      ].join('\n') + '\n'
    );
  });

  afterEach(() => {
    if (existsSync(TEST_EVENTS_DIR)) rmSync(TEST_EVENTS_DIR, { recursive: true });
    if (existsSync(TEST_OUTPUT_DIR)) rmSync(TEST_OUTPUT_DIR, { recursive: true });
  });

  describe('generateSessionSummary', () => {
    it('should generate markdown summary for a session', () => {
      const generator = new PlanGenerator(TEST_EVENTS_DIR);
      const markdown = generator.generateSessionSummary('sess_gen_test');

      expect(markdown).toContain('# Boardroom Session');
      expect(markdown).toContain('sess_gen_test');
      expect(markdown).toContain('completed');
    });

    it('should include phases', () => {
      const generator = new PlanGenerator(TEST_EVENTS_DIR);
      const markdown = generator.generateSessionSummary('sess_gen_test');

      expect(markdown).toContain('Phase 1: Foundation');
      expect(markdown).toContain('Build the core infrastructure');
    });

    it('should include acceptance criteria', () => {
      const generator = new PlanGenerator(TEST_EVENTS_DIR);
      const markdown = generator.generateSessionSummary('sess_gen_test');

      expect(markdown).toContain('Tests pass');
      expect(markdown).toContain('Coverage 80%');
    });
  });

  describe('generateVPPlan', () => {
    it('should generate VP Product plan document', () => {
      const generator = new PlanGenerator(TEST_EVENTS_DIR);
      const markdown = generator.generateVPPlan('sess_gen_test', 'product');

      expect(markdown).toContain('VP Product Plan');
      expect(markdown).toContain('Phase 1: Foundation');
    });
  });

  describe('saveToFile', () => {
    it('should save markdown to file', () => {
      const generator = new PlanGenerator(TEST_EVENTS_DIR);
      const markdown = generator.generateSessionSummary('sess_gen_test');
      const filePath = join(TEST_OUTPUT_DIR, 'test-summary.md');

      generator.saveToFile(markdown, filePath);

      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('Boardroom Session');
    });
  });

  describe('generateAll', () => {
    it('should generate all documents for a session', () => {
      const generator = new PlanGenerator(TEST_EVENTS_DIR);
      const files = generator.generateAll('sess_gen_test', TEST_OUTPUT_DIR);

      expect(files.length).toBeGreaterThan(0);
      expect(existsSync(join(TEST_OUTPUT_DIR, files[0]))).toBe(true);
    });
  });
});
