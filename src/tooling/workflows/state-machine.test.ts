import { describe, it, expect } from 'vitest';
import { WorkflowStateMachine, InvalidTransitionError } from './state-machine.js';
import { WorkflowStatus, WORKFLOW_STATUSES, TERMINAL_STATES, isTerminalState } from './types.js';

describe('WorkflowStateMachine', () => {
  describe('constructor', () => {
    it('should initialize with the given state', () => {
      const machine = new WorkflowStateMachine('pending');
      expect(machine.currentState).toBe('pending');
    });

    it.each(WORKFLOW_STATUSES)('should accept %s as initial state', (status) => {
      const machine = new WorkflowStateMachine(status);
      expect(machine.currentState).toBe(status);
    });
  });

  describe('valid transitions', () => {
    describe('from pending', () => {
      it('should allow transition to running', () => {
        const machine = new WorkflowStateMachine('pending');
        expect(machine.canTransitionTo('running')).toBe(true);
        machine.transition('running');
        expect(machine.currentState).toBe('running');
      });
    });

    describe('from running', () => {
      it('should allow transition to paused', () => {
        const machine = new WorkflowStateMachine('running');
        expect(machine.canTransitionTo('paused')).toBe(true);
        machine.transition('paused');
        expect(machine.currentState).toBe('paused');
      });

      it('should allow transition to completed', () => {
        const machine = new WorkflowStateMachine('running');
        expect(machine.canTransitionTo('completed')).toBe(true);
        machine.transition('completed');
        expect(machine.currentState).toBe('completed');
      });

      it('should allow transition to failed', () => {
        const machine = new WorkflowStateMachine('running');
        expect(machine.canTransitionTo('failed')).toBe(true);
        machine.transition('failed');
        expect(machine.currentState).toBe('failed');
      });
    });

    describe('from paused', () => {
      it('should allow transition to running', () => {
        const machine = new WorkflowStateMachine('paused');
        expect(machine.canTransitionTo('running')).toBe(true);
        machine.transition('running');
        expect(machine.currentState).toBe('running');
      });

      it('should allow transition to failed', () => {
        const machine = new WorkflowStateMachine('paused');
        expect(machine.canTransitionTo('failed')).toBe(true);
        machine.transition('failed');
        expect(machine.currentState).toBe('failed');
      });
    });
  });

  describe('invalid transitions', () => {
    describe('from pending', () => {
      it.each(['paused', 'completed', 'failed'] as WorkflowStatus[])(
        'should not allow transition to %s',
        (targetState) => {
          const machine = new WorkflowStateMachine('pending');
          expect(machine.canTransitionTo(targetState)).toBe(false);
          expect(() => machine.transition(targetState)).toThrow(InvalidTransitionError);
        },
      );

      it('should allow no-op transition to pending (self)', () => {
        const machine = new WorkflowStateMachine('pending');
        expect(machine.canTransitionTo('pending')).toBe(true);
        expect(() => machine.transition('pending')).not.toThrow();
      });
    });

    describe('from running', () => {
      it('should not allow transition to pending', () => {
        const machine = new WorkflowStateMachine('running');
        expect(machine.canTransitionTo('pending')).toBe(false);
        expect(() => machine.transition('pending')).toThrow(InvalidTransitionError);
      });

      it('should allow no-op transition to running (self)', () => {
        const machine = new WorkflowStateMachine('running');
        expect(machine.canTransitionTo('running')).toBe(true);
        expect(() => machine.transition('running')).not.toThrow();
      });
    });

    describe('from paused', () => {
      it('should not allow transition to pending', () => {
        const machine = new WorkflowStateMachine('paused');
        expect(machine.canTransitionTo('pending')).toBe(false);
        expect(() => machine.transition('pending')).toThrow(InvalidTransitionError);
      });

      it('should allow no-op transition to paused (self)', () => {
        const machine = new WorkflowStateMachine('paused');
        expect(machine.canTransitionTo('paused')).toBe(true);
        expect(() => machine.transition('paused')).not.toThrow();
      });
    });
  });

  describe('terminal states', () => {
    // States that cannot be transitioned TO from terminal states
    const NON_SELF_STATES = WORKFLOW_STATUSES.filter((s) => s !== 'completed' && s !== 'failed');

    describe('completed state', () => {
      it.each(NON_SELF_STATES)('should reject transition to %s', (targetState) => {
        const machine = new WorkflowStateMachine('completed');
        // Same-state transition is allowed (no-op), others are rejected
        if (targetState !== 'completed') {
          expect(machine.canTransitionTo(targetState)).toBe(false);
          expect(() => machine.transition(targetState)).toThrow(InvalidTransitionError);
        }
      });

      it('should allow no-op transition to same state', () => {
        const machine = new WorkflowStateMachine('completed');
        expect(machine.canTransitionTo('completed')).toBe(true);
        expect(() => machine.transition('completed')).not.toThrow();
      });

      it('should have no valid transitions (except no-op)', () => {
        const machine = new WorkflowStateMachine('completed');
        expect(machine.getValidTransitions()).toEqual([]);
      });

      it('should report as terminal', () => {
        const machine = new WorkflowStateMachine('completed');
        expect(machine.isTerminal()).toBe(true);
      });
    });

    describe('failed state', () => {
      it.each(NON_SELF_STATES)('should reject transition to %s', (targetState) => {
        const machine = new WorkflowStateMachine('failed');
        if (targetState !== 'failed') {
          expect(machine.canTransitionTo(targetState)).toBe(false);
          expect(() => machine.transition(targetState)).toThrow(InvalidTransitionError);
        }
      });

      it('should allow no-op transition to same state', () => {
        const machine = new WorkflowStateMachine('failed');
        expect(machine.canTransitionTo('failed')).toBe(true);
        expect(() => machine.transition('failed')).not.toThrow();
      });

      it('should have no valid transitions (except no-op)', () => {
        const machine = new WorkflowStateMachine('failed');
        expect(machine.getValidTransitions()).toEqual([]);
      });

      it('should report as terminal', () => {
        const machine = new WorkflowStateMachine('failed');
        expect(machine.isTerminal()).toBe(true);
      });
    });
  });

  describe('getValidTransitions', () => {
    it('should return ["running"] for pending', () => {
      const machine = new WorkflowStateMachine('pending');
      expect(machine.getValidTransitions()).toEqual(['running']);
    });

    it('should return ["paused", "completed", "failed"] for running', () => {
      const machine = new WorkflowStateMachine('running');
      expect(machine.getValidTransitions()).toEqual(['paused', 'completed', 'failed']);
    });

    it('should return ["running", "completed", "failed"] for paused', () => {
      const machine = new WorkflowStateMachine('paused');
      expect(machine.getValidTransitions()).toEqual(['running', 'completed', 'failed']);
    });

    it('should return [] for completed', () => {
      const machine = new WorkflowStateMachine('completed');
      expect(machine.getValidTransitions()).toEqual([]);
    });

    it('should return [] for failed', () => {
      const machine = new WorkflowStateMachine('failed');
      expect(machine.getValidTransitions()).toEqual([]);
    });

    it('should return a new array each time (not the internal reference)', () => {
      const machine = new WorkflowStateMachine('running');
      const transitions1 = machine.getValidTransitions();
      const transitions2 = machine.getValidTransitions();
      expect(transitions1).not.toBe(transitions2);
      expect(transitions1).toEqual(transitions2);
    });
  });

  describe('isTerminal', () => {
    it.each(TERMINAL_STATES)('should return true for %s', (status) => {
      const machine = new WorkflowStateMachine(status);
      expect(machine.isTerminal()).toBe(true);
    });

    it.each(['pending', 'running', 'paused'] as WorkflowStatus[])(
      'should return false for %s',
      (status) => {
        const machine = new WorkflowStateMachine(status);
        expect(machine.isTerminal()).toBe(false);
      },
    );
  });

  describe('InvalidTransitionError', () => {
    it('should include from and to states in the error', () => {
      const machine = new WorkflowStateMachine('pending');
      try {
        machine.transition('completed');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidTransitionError);
        const err = error as InvalidTransitionError;
        expect(err.fromState).toBe('pending');
        expect(err.toState).toBe('completed');
        expect(err.message).toContain('pending');
        expect(err.message).toContain('completed');
      }
    });

    it('should have correct error name', () => {
      const error = new InvalidTransitionError('pending', 'completed');
      expect(error.name).toBe('InvalidTransitionError');
    });
  });

  describe('multi-step workflows', () => {
    it('should support full happy path: pending -> running -> completed', () => {
      const machine = new WorkflowStateMachine('pending');
      machine.transition('running');
      machine.transition('completed');
      expect(machine.currentState).toBe('completed');
      expect(machine.isTerminal()).toBe(true);
    });

    it('should support failure path: pending -> running -> failed', () => {
      const machine = new WorkflowStateMachine('pending');
      machine.transition('running');
      machine.transition('failed');
      expect(machine.currentState).toBe('failed');
      expect(machine.isTerminal()).toBe(true);
    });

    it('should support pause and resume: pending -> running -> paused -> running -> completed', () => {
      const machine = new WorkflowStateMachine('pending');
      machine.transition('running');
      machine.transition('paused');
      machine.transition('running');
      machine.transition('completed');
      expect(machine.currentState).toBe('completed');
    });

    it('should support fail from paused: pending -> running -> paused -> failed', () => {
      const machine = new WorkflowStateMachine('pending');
      machine.transition('running');
      machine.transition('paused');
      machine.transition('failed');
      expect(machine.currentState).toBe('failed');
    });
  });
});

describe('types', () => {
  describe('isTerminalState', () => {
    it('should return true for completed', () => {
      expect(isTerminalState('completed')).toBe(true);
    });

    it('should return true for failed', () => {
      expect(isTerminalState('failed')).toBe(true);
    });

    it.each(['pending', 'running', 'paused'] as WorkflowStatus[])(
      'should return false for %s',
      (status) => {
        expect(isTerminalState(status)).toBe(false);
      },
    );
  });
});
