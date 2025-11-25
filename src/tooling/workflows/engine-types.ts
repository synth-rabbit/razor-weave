/**
 * Workflow Engine Type Definitions
 *
 * These types define the workflow engine framework for reliable, resumable,
 * Claude Code-orchestrated workflows with human decision gates.
 */

// =============================================================================
// Error Classes
// =============================================================================

/**
 * Base error for workflow-related errors
 */
export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

/**
 * Thrown when a workflow type is not found
 */
export class UnknownWorkflowError extends WorkflowError {
  constructor(workflowType: string) {
    super(
      `Unknown workflow type: ${workflowType}. Available types depend on registered workflows.`,
      'UNKNOWN_WORKFLOW',
      { workflowType }
    );
    this.name = 'UnknownWorkflowError';
  }
}

/**
 * Thrown when a checkpoint is not found
 */
export class CheckpointNotFoundError extends WorkflowError {
  constructor(runId: string) {
    super(
      `No checkpoint found for workflow run: ${runId}. The workflow may not exist or may have been deleted.`,
      'CHECKPOINT_NOT_FOUND',
      { runId }
    );
    this.name = 'CheckpointNotFoundError';
  }
}

/**
 * Thrown when a step is not found in the workflow definition
 */
export class StepNotFoundError extends WorkflowError {
  constructor(stepName: string, workflowType: string) {
    super(
      `Step "${stepName}" not found in workflow "${workflowType}". Check that the step name is correct.`,
      'STEP_NOT_FOUND',
      { stepName, workflowType }
    );
    this.name = 'StepNotFoundError';
  }
}

/**
 * Thrown when a precondition fails
 */
export class PreconditionFailedError extends WorkflowError {
  constructor(stepName: string, conditionName: string, errorMessage: string) {
    super(
      `Precondition "${conditionName}" failed for step "${stepName}": ${errorMessage}`,
      'PRECONDITION_FAILED',
      { stepName, conditionName }
    );
    this.name = 'PreconditionFailedError';
  }
}

/**
 * Thrown when a human gate option is invalid
 */
export class InvalidGateOptionError extends WorkflowError {
  constructor(option: string, validOptions: string[]) {
    super(
      `Invalid gate option: "${option}". Valid options are: ${validOptions.join(', ')}`,
      'INVALID_GATE_OPTION',
      { option, validOptions }
    );
    this.name = 'InvalidGateOptionError';
  }
}

// =============================================================================
// Workflow Definition Types
// =============================================================================

/**
 * Context passed to condition checks and available during step execution
 */
export interface StepContext {
  /** The current workflow run ID */
  runId: string;
  /** The current checkpoint state */
  checkpoint: Checkpoint;
  /** Result from the most recent step (if any) */
  result?: unknown;
  /** Book ID being processed */
  bookId: string;
  /** Database access for postcondition checks */
  db: ConditionDatabase;
}

/**
 * Database interface for condition checks (read-only queries)
 */
export interface ConditionDatabase {
  strategicPlanExists(runId: string): boolean;
  versionExists(versionId: string): boolean;
  artifactsExist(runId: string): boolean;
  workflowStatus(runId: string): string | null;
  getVersion(versionId: string): { id: string; book_id: string } | null;
}

/**
 * A condition that must be true before or after a step
 */
export interface Condition {
  /** Unique name for this condition */
  name: string;
  /** Check function that returns true if condition is met */
  check: (ctx: StepContext) => Promise<boolean> | boolean;
  /** Error message if condition fails */
  error: string;
}

/**
 * Conditional branching to determine next step
 */
export interface ConditionalNext {
  /** Expression to evaluate (uses step result) */
  condition: string;
  /** Step to go to if condition is true */
  onTrue: string;
  /** Step to go to if condition is false */
  onFalse: string;
  /** Safety limit for loops to prevent infinite iteration */
  maxIterations?: number;
}

/**
 * An option in a human decision gate
 */
export interface GateOption {
  /** Display label for this option */
  label: string;
  /** Step to go to if selected, or null to end workflow */
  nextStep: string | null;
  /** If true, human must provide additional text input */
  requiresInput?: boolean;
}

/**
 * Human decision gate - pauses workflow for human input
 */
export interface HumanGate {
  /** Question/prompt to show the human */
  prompt: string;
  /** Checkpoint keys to display as context */
  context: string[];
  /** Available options for the human to choose */
  options: GateOption[];
}

/**
 * A single step in a workflow
 */
export interface WorkflowStep {
  /** Unique identifier for this step */
  name: string;
  /** CLI command to run for this step */
  command: string;
  /** Conditions that must be true before running this step */
  preconditions: Condition[];
  /** Conditions that must be true after running this step */
  postconditions: Condition[];
  /** If true, this step can run in parallel with other parallel steps */
  parallel?: boolean;
  /** Key in checkpoint that contains items to parallelize over */
  parallelKey?: string;
  /** Human decision gate (if present, pauses for human input) */
  humanGate?: HumanGate;
  /** Next step to execute (string for simple, ConditionalNext for branching) */
  next?: string | ConditionalNext | null;
}

/**
 * Complete workflow definition
 */
export interface WorkflowDefinition {
  /** Workflow type identifier (e.g., 'w1_editing') */
  type: string;
  /** Human-readable name */
  name: string;
  /** All steps in this workflow */
  steps: WorkflowStep[];
  /** Name of the first step to execute */
  initialStep: string;
}

// =============================================================================
// Checkpoint Types
// =============================================================================

/**
 * Result of a completed step
 */
export interface StepResult {
  /** Name of the step that completed */
  step: string;
  /** ISO timestamp when the step completed */
  completedAt: string;
  /** Result data from the step */
  result: unknown;
}

/**
 * Result of a parallel item execution
 */
export interface ParallelItemResult {
  /** Current status of this parallel item */
  status: 'pending' | 'completed' | 'failed';
  /** Result data if completed */
  result?: unknown;
  /** Error message if failed */
  error?: string;
  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Human gate decision record
 */
export interface GateDecision {
  /** Name of the gate */
  gate: string;
  /** Option that was selected */
  option: string;
  /** Additional input if the option required it */
  input?: string;
}

/**
 * Pending retry information
 */
export interface PendingRetry {
  /** Name of the step that failed */
  step: string;
  /** Error message from the failure */
  error: string;
  /** Current attempt number */
  attempt: number;
}

/**
 * Complete checkpoint state for a workflow run
 */
export interface Checkpoint {
  /** Unique workflow run ID */
  workflowRunId: string;
  /** Type of workflow being executed */
  workflowType: string;
  /** Name of the current step */
  currentStep: string;
  /** All completed steps with their results */
  completedSteps: StepResult[];
  /** Iteration counts for loop tracking (step name -> count) */
  iterationCounts: Record<string, number>;
  /** Pending retry information if a step failed */
  pendingRetry?: PendingRetry;
  /** Results of parallel item executions */
  parallelResults?: Record<string, ParallelItemResult>;
  /** Human gate decision if one was made */
  gateDecision?: GateDecision;
  /** Arbitrary data stored by steps (e.g., improvementAreas) */
  data: Record<string, unknown>;
}

// =============================================================================
// Step Input/Output Types
// =============================================================================

/**
 * Input provided to a step command
 */
export interface StepInput {
  /** Workflow run ID */
  runId: string;
  /** Current step name */
  step: string;
  /** Current checkpoint state */
  checkpoint: Checkpoint;
  /** Retry context if this is a retry attempt */
  retryContext?: {
    /** Error from previous attempt */
    error: string;
    /** Current attempt number */
    attempt: number;
  };
}

/**
 * Output from a step command
 */
export interface StepOutput {
  /** Whether the step succeeded */
  success: boolean;
  /** Result data from the step */
  result?: unknown;
  /** Error message if failed */
  error?: string;
  /** Whether all postconditions passed */
  postconditionsPassed: boolean;
  /** Hint for which step should run next (for conditional branches) */
  nextStepHint?: string;
}

// =============================================================================
// Resume Context
// =============================================================================

/**
 * Context for resuming an interrupted workflow
 */
export interface ResumeContext {
  /** Type of workflow */
  workflowType: string;
  /** Workflow run ID */
  runId: string;
  /** Current step name */
  currentStep: string;
  /** Names of all completed steps */
  completedSteps: string[];
  /** Output from the last completed step */
  lastStepOutput: unknown;
  /** Pending retry information if resuming after a failure */
  pendingRetry?: {
    step: string;
    error: string;
    attempt: number;
  };
  /** Status of parallel execution if applicable */
  parallelStatus?: {
    total: number;
    completed: number;
    failed: string[];
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a new empty checkpoint for a workflow run
 */
export function createCheckpoint(
  workflowRunId: string,
  workflowType: string,
  initialStep: string
): Checkpoint {
  return {
    workflowRunId,
    workflowType,
    currentStep: initialStep,
    completedSteps: [],
    iterationCounts: {},
    data: {},
  };
}

/**
 * Helper to define a workflow with type checking
 */
export function defineWorkflow(definition: WorkflowDefinition): WorkflowDefinition {
  // Validate that initialStep exists
  const stepNames = new Set(definition.steps.map((s) => s.name));
  if (!stepNames.has(definition.initialStep)) {
    throw new Error(
      `Invalid workflow definition: initialStep "${definition.initialStep}" not found in steps`
    );
  }

  // Validate that all next references exist
  for (const step of definition.steps) {
    // Validate next step references
    if (step.next !== null && step.next !== undefined) {
      if (typeof step.next === 'string') {
        if (!stepNames.has(step.next)) {
          throw new Error(
            `Invalid workflow definition: step "${step.name}" references non-existent next step "${step.next}"`
          );
        }
      } else {
        // ConditionalNext
        if (!stepNames.has(step.next.onTrue)) {
          throw new Error(
            `Invalid workflow definition: step "${step.name}" references non-existent onTrue step "${step.next.onTrue}"`
          );
        }
        if (!stepNames.has(step.next.onFalse)) {
          throw new Error(
            `Invalid workflow definition: step "${step.name}" references non-existent onFalse step "${step.next.onFalse}"`
          );
        }
      }
    }

    // Validate human gate options (separate from next validation)
    if (step.humanGate) {
      for (const option of step.humanGate.options) {
        if (option.nextStep !== null && !stepNames.has(option.nextStep)) {
          throw new Error(
            `Invalid workflow definition: gate option "${option.label}" in step "${step.name}" references non-existent step "${option.nextStep}"`
          );
        }
      }
    }
  }

  return definition;
}

/**
 * Get a step from a workflow definition by name
 */
export function getStep(workflow: WorkflowDefinition, stepName: string): WorkflowStep | undefined {
  return workflow.steps.find((s) => s.name === stepName);
}

/**
 * Check if a step is the terminal step (next is null)
 */
export function isTerminalStep(step: WorkflowStep): boolean {
  return step.next === null;
}
