// src/tooling/workflows/w1-workflow.test.ts
import { describe, it, expect } from 'vitest';
import { w1EditingWorkflow } from './w1-workflow.js';
import { getStep, isTerminalStep } from './engine-types.js';

describe('w1EditingWorkflow', () => {
  describe('workflow structure', () => {
    it('should have correct type and name', () => {
      expect(w1EditingWorkflow.type).toBe('w1_editing');
      expect(w1EditingWorkflow.name).toBe('W1 Editing Workflow');
    });

    it('should start with strategic step', () => {
      expect(w1EditingWorkflow.initialStep).toBe('strategic');
    });

    it('should have all required steps', () => {
      const stepNames = w1EditingWorkflow.steps.map((s) => s.name);
      expect(stepNames).toContain('strategic');
      expect(stepNames).toContain('writer');
      expect(stepNames).toContain('editor');
      expect(stepNames).toContain('domain');
      expect(stepNames).toContain('validate');
      expect(stepNames).toContain('human_gate');
      expect(stepNames).toContain('finalize');
    });

    it('should have finalize as terminal step', () => {
      const finalizeStep = getStep(w1EditingWorkflow, 'finalize');
      expect(finalizeStep).toBeDefined();
      expect(isTerminalStep(finalizeStep!)).toBe(true);
    });
  });

  describe('step progression', () => {
    it('strategic should lead to writer', () => {
      const step = getStep(w1EditingWorkflow, 'strategic');
      expect(step?.next).toBe('writer');
    });

    it('writer should lead to editor', () => {
      const step = getStep(w1EditingWorkflow, 'writer');
      expect(step?.next).toBe('editor');
    });

    it('editor should branch based on decision', () => {
      const step = getStep(w1EditingWorkflow, 'editor');
      expect(typeof step?.next).toBe('object');
      const next = step?.next as { onTrue: string; onFalse: string };
      expect(next.onTrue).toBe('domain');
      expect(next.onFalse).toBe('writer');
    });

    it('domain should branch based on decision', () => {
      const step = getStep(w1EditingWorkflow, 'domain');
      expect(typeof step?.next).toBe('object');
      const next = step?.next as { onTrue: string; onFalse: string };
      expect(next.onTrue).toBe('validate');
      expect(next.onFalse).toBe('writer');
    });

    it('validate should lead to human_gate', () => {
      const step = getStep(w1EditingWorkflow, 'validate');
      expect(step?.next).toBe('human_gate');
    });
  });

  describe('human gate', () => {
    it('should have human gate on human_gate step', () => {
      const step = getStep(w1EditingWorkflow, 'human_gate');
      expect(step?.humanGate).toBeDefined();
    });

    it('should have correct gate options', () => {
      const step = getStep(w1EditingWorkflow, 'human_gate');
      const options = step?.humanGate?.options;

      expect(options).toHaveLength(4);

      const approveOption = options?.find((o) => o.label === 'Approve');
      expect(approveOption?.nextStep).toBe('finalize');

      const rejectOption = options?.find((o) => o.label === 'Reject');
      expect(rejectOption?.nextStep).toBeNull();

      const changesOption = options?.find((o) => o.label === 'Request Changes');
      expect(changesOption?.nextStep).toBe('writer');
      expect(changesOption?.requiresInput).toBe(true);

      const reviewOption = options?.find((o) => o.label === 'Full Review');
      expect(reviewOption?.nextStep).toBe('full_review');
    });

    it('should show relevant context', () => {
      const step = getStep(w1EditingWorkflow, 'human_gate');
      expect(step?.humanGate?.context).toContain('validationResult');
      expect(step?.humanGate?.context).toContain('writerStats');
    });
  });

  describe('iteration limits', () => {
    it('editor loop should have max 3 iterations', () => {
      const step = getStep(w1EditingWorkflow, 'editor');
      const next = step?.next as { maxIterations?: number };
      expect(next.maxIterations).toBe(3);
    });

    it('domain loop should have max 3 iterations', () => {
      const step = getStep(w1EditingWorkflow, 'domain');
      const next = step?.next as { maxIterations?: number };
      expect(next.maxIterations).toBe(3);
    });
  });

  describe('commands', () => {
    it('should have correct commands for each step', () => {
      const commands: Record<string, string> = {
        strategic: 'pnpm w1:strategic',
        writer: 'pnpm w1:content-modify',
        editor: 'pnpm w1:content-modify --generate-editor',
        domain: 'pnpm w1:content-modify --generate-domain',
        validate: 'pnpm w1:validate-chapters',
        human_gate: 'pnpm w1:human-gate',
        finalize: 'pnpm w1:finalize',
      };

      for (const [stepName, expectedCommand] of Object.entries(commands)) {
        const step = getStep(w1EditingWorkflow, stepName);
        expect(step?.command).toBe(expectedCommand);
      }
    });
  });

  describe('postconditions', () => {
    it('strategic should have strategic_plan_created postcondition', () => {
      const step = getStep(w1EditingWorkflow, 'strategic');
      const postconditionNames = step?.postconditions.map((p) => p.name);
      expect(postconditionNames).toContain('strategic_plan_created');
    });

    it('writer should have writer_artifacts_exist postcondition', () => {
      const step = getStep(w1EditingWorkflow, 'writer');
      const postconditionNames = step?.postconditions.map((p) => p.name);
      expect(postconditionNames).toContain('writer_artifacts_exist');
    });

    it('editor should have editor_review_recorded postcondition', () => {
      const step = getStep(w1EditingWorkflow, 'editor');
      const postconditionNames = step?.postconditions.map((p) => p.name);
      expect(postconditionNames).toContain('editor_review_recorded');
    });

    it('domain should have domain_review_recorded postcondition', () => {
      const step = getStep(w1EditingWorkflow, 'domain');
      const postconditionNames = step?.postconditions.map((p) => p.name);
      expect(postconditionNames).toContain('domain_review_recorded');
    });

    it('validate should have validation_passed postcondition', () => {
      const step = getStep(w1EditingWorkflow, 'validate');
      const postconditionNames = step?.postconditions.map((p) => p.name);
      expect(postconditionNames).toContain('validation_passed');
    });

    it('finalize should have final_artifacts_generated postcondition', () => {
      const step = getStep(w1EditingWorkflow, 'finalize');
      const postconditionNames = step?.postconditions.map((p) => p.name);
      expect(postconditionNames).toContain('final_artifacts_generated');
    });
  });

  describe('preconditions', () => {
    it('strategic should require analysis_available', () => {
      const step = getStep(w1EditingWorkflow, 'strategic');
      const preconditionNames = step?.preconditions.map((p) => p.name);
      expect(preconditionNames).toContain('analysis_available');
    });

    it('writer should require strategic_plan_available', () => {
      const step = getStep(w1EditingWorkflow, 'writer');
      const preconditionNames = step?.preconditions.map((p) => p.name);
      expect(preconditionNames).toContain('strategic_plan_available');
    });

    it('editor should require writer_output_available', () => {
      const step = getStep(w1EditingWorkflow, 'editor');
      const preconditionNames = step?.preconditions.map((p) => p.name);
      expect(preconditionNames).toContain('writer_output_available');
    });

    it('domain should require editor_approved', () => {
      const step = getStep(w1EditingWorkflow, 'domain');
      const preconditionNames = step?.preconditions.map((p) => p.name);
      expect(preconditionNames).toContain('editor_approved');
    });

    it('validate should require domain_approved', () => {
      const step = getStep(w1EditingWorkflow, 'validate');
      const preconditionNames = step?.preconditions.map((p) => p.name);
      expect(preconditionNames).toContain('domain_approved');
    });
  });
});
