/**
 * WorkflowStateMachine - Enforces valid state transitions for workflow runs.
 *
 * Valid transitions:
 * - pending -> running
 * - running -> paused, completed, failed
 * - paused -> running, failed
 * - completed -> (terminal - no transitions allowed)
 * - failed -> (terminal - no transitions allowed)
 */

import { WorkflowStatus, isTerminalState } from './types.js';

/**
 * Error thrown when an invalid state transition is attempted
 */
export class InvalidTransitionError extends Error {
  constructor(
    public readonly fromState: WorkflowStatus,
    public readonly toState: WorkflowStatus,
  ) {
    super(`Invalid transition from '${fromState}' to '${toState}'`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * State transition map defining valid transitions from each state
 */
const VALID_TRANSITIONS: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  pending: ['running'],
  running: ['paused', 'completed', 'failed'],
  paused: ['running', 'failed'],
  completed: [], // terminal
  failed: [], // terminal
} as const;

/**
 * WorkflowStateMachine enforces valid state transitions for workflow runs.
 *
 * Usage:
 * ```typescript
 * const machine = new WorkflowStateMachine('pending');
 * machine.canTransitionTo('running'); // true
 * machine.transition('running'); // state is now 'running'
 * machine.getValidTransitions(); // ['paused', 'completed', 'failed']
 * ```
 */
export class WorkflowStateMachine {
  private _currentState: WorkflowStatus;

  /**
   * Create a new state machine with the given initial state
   * @param currentState - The current workflow status
   */
  constructor(currentState: WorkflowStatus) {
    this._currentState = currentState;
  }

  /**
   * Get the current state of the workflow
   */
  get currentState(): WorkflowStatus {
    return this._currentState;
  }

  /**
   * Check if a transition to the given state is valid
   * @param newState - The target state to check
   * @returns true if the transition is valid, false otherwise
   */
  canTransitionTo(newState: WorkflowStatus): boolean {
    // No-op transition (same state) is always valid
    if (newState === this._currentState) {
      return true;
    }
    const validTransitions = VALID_TRANSITIONS[this._currentState];
    return validTransitions.includes(newState);
  }

  /**
   * Transition to a new state. Throws if the transition is invalid.
   * @param newState - The target state to transition to
   * @throws {InvalidTransitionError} if the transition is not valid
   */
  transition(newState: WorkflowStatus): void {
    if (!this.canTransitionTo(newState)) {
      throw new InvalidTransitionError(this._currentState, newState);
    }
    this._currentState = newState;
  }

  /**
   * Get all valid transitions from the current state
   * @returns Array of valid target states
   */
  getValidTransitions(): WorkflowStatus[] {
    return [...VALID_TRANSITIONS[this._currentState]];
  }

  /**
   * Check if the current state is a terminal state
   * @returns true if in a terminal state (completed or failed)
   */
  isTerminal(): boolean {
    return isTerminalState(this._currentState);
  }
}
