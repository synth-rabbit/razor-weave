import { describe, it, expect } from 'vitest';
import {
  VPProductPrompt,
  VPEngineeringPrompt,
  VPOperationsPrompt,
  buildVPPrompt,
} from './prompts';

describe('VP Prompts', () => {
  describe('VPProductPrompt', () => {
    it('should have role description', () => {
      expect(VPProductPrompt.role).toContain('VP of Product');
    });

    it('should have responsibilities', () => {
      expect(VPProductPrompt.responsibilities).toContain('phases');
      expect(VPProductPrompt.responsibilities).toContain('milestones');
    });

    it('should have constraints', () => {
      expect(VPProductPrompt.constraints.toLowerCase()).toContain('not create technical tasks');
    });

    it('should have output format', () => {
      expect(VPProductPrompt.outputFormat).toContain('PHASES');
      expect(VPProductPrompt.outputFormat).toContain('acceptance_criteria');
    });
  });

  describe('VPEngineeringPrompt', () => {
    it('should have role description', () => {
      expect(VPEngineeringPrompt.role).toContain('VP of Engineering');
    });

    it('should have responsibilities', () => {
      expect(VPEngineeringPrompt.responsibilities).toContain('engineering_tasks');
      expect(VPEngineeringPrompt.responsibilities).toContain('dependencies');
    });

    it('should have constraints', () => {
      expect(VPEngineeringPrompt.constraints.toLowerCase()).toContain('not set product priorities');
    });

    it('should have output format', () => {
      expect(VPEngineeringPrompt.outputFormat).toContain('TASKS');
      expect(VPEngineeringPrompt.outputFormat).toContain('file_paths');
    });
  });

  describe('VPOperationsPrompt', () => {
    it('should have role description', () => {
      expect(VPOperationsPrompt.role).toContain('VP of Operations');
    });

    it('should have responsibilities', () => {
      expect(VPOperationsPrompt.responsibilities).toContain('schedule');
      expect(VPOperationsPrompt.responsibilities).toContain('checkpoints');
    });

    it('should have constraints', () => {
      expect(VPOperationsPrompt.constraints.toLowerCase()).toContain('not define product strategy');
    });

    it('should have brainstorm mode', () => {
      expect(VPOperationsPrompt.brainstormMode).toBeDefined();
      expect(VPOperationsPrompt.brainstormMode).toContain('advisory');
    });
  });

  describe('buildVPPrompt', () => {
    it('should build VP Product prompt with context', () => {
      const prompt = buildVPPrompt('product', {
        proposalPath: 'docs/proposals/test.md',
        proposalContent: '# Test Proposal\n\nBuild something cool.',
        sessionId: 'sess_123',
      });

      expect(prompt).toContain('VP of Product');
      expect(prompt).toContain('Test Proposal');
      expect(prompt).toContain('sess_123');
    });

    it('should build VP Engineering prompt with product plan', () => {
      const prompt = buildVPPrompt('engineering', {
        sessionId: 'sess_123',
        productPlan: {
          phases: [{ name: 'Phase 1', description: 'First phase' }],
        },
        ceoFeedback: 'Looks good, proceed.',
      });

      expect(prompt).toContain('VP of Engineering');
      expect(prompt).toContain('Phase 1');
      expect(prompt).toContain('Looks good');
    });

    it('should build VP Operations prompt with all plans', () => {
      const prompt = buildVPPrompt('ops', {
        sessionId: 'sess_123',
        productPlan: { phases: [] },
        engineeringPlan: { tasks: [] },
        ceoFeedback: 'All good.',
      });

      expect(prompt).toContain('VP of Operations');
      expect(prompt).toContain('All good');
    });

    it('should build VP Ops brainstorm prompt', () => {
      const prompt = buildVPPrompt('ops', {
        sessionId: 'sess_123',
        brainstormMode: true,
        question: 'Which approach should we use?',
        options: ['Option A', 'Option B'],
      });

      expect(prompt).toContain('brainstorm');
      expect(prompt).toContain('Option A');
      expect(prompt).toContain('Option B');
    });
  });
});
