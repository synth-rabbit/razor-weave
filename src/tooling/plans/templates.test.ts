import { describe, it, expect } from 'vitest';
import { Templates } from './templates';

describe('Plan Templates', () => {
  describe('designHeader', () => {
    it('should generate design header with session info', () => {
      const output = Templates.designHeader({
        sessionId: 'sess_123',
        date: '2024-11-22',
        title: 'Test Design',
      });

      expect(output).toContain('# Test Design');
      expect(output).toContain('sess_123');
      expect(output).toContain('2024-11-22');
    });
  });

  describe('phaseHeader', () => {
    it('should generate phase plan header', () => {
      const output = Templates.phaseHeader({
        sessionId: 'sess_123',
        date: '2024-11-22',
      });

      expect(output).toContain('Phase Plan');
      expect(output).toContain('sess_123');
    });
  });

  describe('taskHeader', () => {
    it('should generate task header with execution instructions', () => {
      const output = Templates.taskHeader({
        sessionId: 'sess_123',
        date: '2024-11-22',
      });

      expect(output).toContain('Task Plan');
      expect(output).toContain('executing-plans');
    });
  });

  describe('phase', () => {
    it('should generate phase section', () => {
      const output = Templates.phase('Foundation', 'Build the base', 1);

      expect(output).toContain('Phase 1: Foundation');
      expect(output).toContain('Build the base');
    });
  });

  describe('acceptanceCriteria', () => {
    it('should generate checkbox list', () => {
      const output = Templates.acceptanceCriteria(['Tests pass', 'Coverage 80%']);

      expect(output).toContain('- [ ] Tests pass');
      expect(output).toContain('- [ ] Coverage 80%');
    });

    it('should return empty string for empty criteria', () => {
      const output = Templates.acceptanceCriteria([]);
      expect(output).toBe('');
    });
  });

  describe('task', () => {
    it('should generate task section with files', () => {
      const output = Templates.task(
        'Create project',
        ['src/index.ts', 'package.json'],
        []
      );

      expect(output).toContain('Task: Create project');
      expect(output).toContain('`src/index.ts`');
    });

    it('should include dependencies', () => {
      const output = Templates.task('Build', [], ['task_1', 'task_2']);

      expect(output).toContain('Dependencies:');
      expect(output).toContain('task_1, task_2');
    });
  });

  describe('executionHandoff', () => {
    it('should generate handoff section', () => {
      const output = Templates.executionHandoff('sess_123');

      expect(output).toContain('Execution Handoff');
      expect(output).toContain('Subagent-Driven');
      expect(output).toContain('sess_123');
    });
  });
});
