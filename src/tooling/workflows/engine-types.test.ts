// src/tooling/workflows/engine-types.test.ts
import { describe, it, expect } from 'vitest';
import {
  defineWorkflow,
  createCheckpoint,
  getStep,
  isTerminalStep,
  type WorkflowDefinition,
  type WorkflowStep,
  type Checkpoint,
} from './engine-types.js';

describe('engine-types', () => {
  describe('createCheckpoint', () => {
    it('should create an empty checkpoint with initial values', () => {
      const checkpoint = createCheckpoint('run_123', 'w1_editing', 'strategic-planning');

      expect(checkpoint.workflowRunId).toBe('run_123');
      expect(checkpoint.workflowType).toBe('w1_editing');
      expect(checkpoint.currentStep).toBe('strategic-planning');
      expect(checkpoint.completedSteps).toEqual([]);
      expect(checkpoint.iterationCounts).toEqual({});
      expect(checkpoint.data).toEqual({});
      expect(checkpoint.pendingRetry).toBeUndefined();
      expect(checkpoint.parallelResults).toBeUndefined();
      expect(checkpoint.gateDecision).toBeUndefined();
    });
  });

  describe('defineWorkflow', () => {
    const validWorkflow: WorkflowDefinition = {
      type: 'test_workflow',
      name: 'Test Workflow',
      initialStep: 'step1',
      steps: [
        {
          name: 'step1',
          command: 'test:step1',
          preconditions: [],
          postconditions: [],
          next: 'step2',
        },
        {
          name: 'step2',
          command: 'test:step2',
          preconditions: [],
          postconditions: [],
          next: null,
        },
      ],
    };

    it('should return the workflow definition when valid', () => {
      const result = defineWorkflow(validWorkflow);
      expect(result).toEqual(validWorkflow);
    });

    it('should throw if initialStep does not exist', () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...validWorkflow,
        initialStep: 'nonexistent',
      };

      expect(() => defineWorkflow(invalidWorkflow)).toThrow(
        'initialStep "nonexistent" not found in steps'
      );
    });

    it('should throw if next step does not exist', () => {
      const invalidWorkflow: WorkflowDefinition = {
        type: 'test',
        name: 'Test',
        initialStep: 'step1',
        steps: [
          {
            name: 'step1',
            command: 'test',
            preconditions: [],
            postconditions: [],
            next: 'nonexistent',
          },
        ],
      };

      expect(() => defineWorkflow(invalidWorkflow)).toThrow(
        'step "step1" references non-existent next step "nonexistent"'
      );
    });

    it('should throw if conditional onTrue step does not exist', () => {
      const invalidWorkflow: WorkflowDefinition = {
        type: 'test',
        name: 'Test',
        initialStep: 'step1',
        steps: [
          {
            name: 'step1',
            command: 'test',
            preconditions: [],
            postconditions: [],
            next: {
              condition: 'true',
              onTrue: 'nonexistent',
              onFalse: 'step1',
            },
          },
        ],
      };

      expect(() => defineWorkflow(invalidWorkflow)).toThrow(
        'step "step1" references non-existent onTrue step "nonexistent"'
      );
    });

    it('should throw if conditional onFalse step does not exist', () => {
      const invalidWorkflow: WorkflowDefinition = {
        type: 'test',
        name: 'Test',
        initialStep: 'step1',
        steps: [
          {
            name: 'step1',
            command: 'test',
            preconditions: [],
            postconditions: [],
            next: {
              condition: 'true',
              onTrue: 'step1',
              onFalse: 'nonexistent',
            },
          },
        ],
      };

      expect(() => defineWorkflow(invalidWorkflow)).toThrow(
        'step "step1" references non-existent onFalse step "nonexistent"'
      );
    });

    it('should throw if human gate option references non-existent step', () => {
      const invalidWorkflow: WorkflowDefinition = {
        type: 'test',
        name: 'Test',
        initialStep: 'step1',
        steps: [
          {
            name: 'step1',
            command: 'test',
            preconditions: [],
            postconditions: [],
            humanGate: {
              prompt: 'Choose',
              context: [],
              options: [{ label: 'Option 1', nextStep: 'nonexistent' }],
            },
          },
        ],
      };

      expect(() => defineWorkflow(invalidWorkflow)).toThrow(
        'gate option "Option 1" in step "step1" references non-existent step "nonexistent"'
      );
    });

    it('should allow human gate option with null nextStep (end workflow)', () => {
      const validWorkflowWithGate: WorkflowDefinition = {
        type: 'test',
        name: 'Test',
        initialStep: 'step1',
        steps: [
          {
            name: 'step1',
            command: 'test',
            preconditions: [],
            postconditions: [],
            humanGate: {
              prompt: 'Choose',
              context: [],
              options: [{ label: 'End', nextStep: null }],
            },
          },
        ],
      };

      expect(() => defineWorkflow(validWorkflowWithGate)).not.toThrow();
    });
  });

  describe('getStep', () => {
    const workflow: WorkflowDefinition = {
      type: 'test',
      name: 'Test',
      initialStep: 'step1',
      steps: [
        { name: 'step1', command: 'cmd1', preconditions: [], postconditions: [], next: 'step2' },
        { name: 'step2', command: 'cmd2', preconditions: [], postconditions: [], next: null },
      ],
    };

    it('should return the step when found', () => {
      const step = getStep(workflow, 'step1');
      expect(step?.name).toBe('step1');
      expect(step?.command).toBe('cmd1');
    });

    it('should return undefined when step not found', () => {
      const step = getStep(workflow, 'nonexistent');
      expect(step).toBeUndefined();
    });
  });

  describe('isTerminalStep', () => {
    it('should return true for step with null next', () => {
      const step: WorkflowStep = {
        name: 'final',
        command: 'final',
        preconditions: [],
        postconditions: [],
        next: null,
      };
      expect(isTerminalStep(step)).toBe(true);
    });

    it('should return false for step with string next', () => {
      const step: WorkflowStep = {
        name: 'middle',
        command: 'middle',
        preconditions: [],
        postconditions: [],
        next: 'next-step',
      };
      expect(isTerminalStep(step)).toBe(false);
    });

    it('should return false for step with conditional next', () => {
      const step: WorkflowStep = {
        name: 'branch',
        command: 'branch',
        preconditions: [],
        postconditions: [],
        next: {
          condition: 'result.success',
          onTrue: 'success',
          onFalse: 'failure',
        },
      };
      expect(isTerminalStep(step)).toBe(false);
    });

    it('should return false for step with undefined next', () => {
      const step: WorkflowStep = {
        name: 'incomplete',
        command: 'incomplete',
        preconditions: [],
        postconditions: [],
      };
      expect(isTerminalStep(step)).toBe(false);
    });
  });
});
