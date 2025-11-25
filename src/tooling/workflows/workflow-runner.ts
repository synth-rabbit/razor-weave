/**
 * Workflow Runner
 *
 * Main orchestration component for the workflow engine. Executes workflow
 * definitions step-by-step with checkpoint persistence, retry logic,
 * human gates, and parallel execution support.
 */

import type Database from 'better-sqlite3';
import { SafeDatabaseClient, type BackupInfo } from '@razorweave/database';
import { CheckpointManager } from './checkpoint-manager.js';
import { WorkflowRepository } from './repository.js';
import type {
  WorkflowDefinition,
  WorkflowStep,
  Checkpoint,
  StepContext,
  StepInput,
  StepOutput,
  ConditionalNext,
  ConditionDatabase,
  ResumeContext,
} from './engine-types.js';
import { getStep, isTerminalStep } from './engine-types.js';

/**
 * Maximum number of retry attempts before escalating to human
 */
const MAX_RETRIES = 1;

/**
 * Result of running a workflow step
 */
export interface StepExecutionResult {
  /** Whether the step completed successfully */
  success: boolean;
  /** Step output data */
  output?: StepOutput;
  /** Error message if failed */
  error?: string;
  /** Whether this should escalate to human */
  escalate?: boolean;
  /** Next step to execute (null = workflow complete or human gate) */
  nextStep: string | null;
  /** Human gate info if applicable */
  humanGate?: {
    prompt: string;
    context: Record<string, unknown>;
    options: Array<{ label: string; nextStep: string | null; requiresInput?: boolean }>;
  };
}

/**
 * Result of starting/resuming a workflow
 */
export interface WorkflowExecutionResult {
  /** Workflow run ID */
  runId: string;
  /** Current status */
  status: 'running' | 'paused' | 'completed' | 'failed' | 'awaiting_human';
  /** Current step name */
  currentStep: string;
  /** Human gate info if awaiting human decision */
  humanGate?: StepExecutionResult['humanGate'];
  /** Error message if failed */
  error?: string;
  /** Parallel execution items to spawn (for Claude Code to handle) */
  parallelItems?: string[];
  /** Resume context for the next iteration */
  resumeContext: ResumeContext;
}

/**
 * Configuration for WorkflowRunner
 */
export interface WorkflowRunnerConfig {
  /** Database client (SafeDatabaseClient recommended) */
  db: Database.Database | SafeDatabaseClient;
  /** Workflow definitions registry */
  workflows: Map<string, WorkflowDefinition>;
  /** Path to database file (for backups) */
  dbPath?: string;
}

/**
 * WorkflowRunner orchestrates workflow execution with checkpoints,
 * retries, and human gates.
 *
 * Usage:
 * ```typescript
 * const runner = new WorkflowRunner({
 *   db: safeClient.getDb(),
 *   workflows: new Map([['w1_editing', W1EditingWorkflow]]),
 * });
 *
 * // Start a new workflow
 * const result = await runner.start('w1_editing', 'book_core');
 *
 * // Resume after human gate decision
 * const nextResult = await runner.handleGateDecision(runId, 'approve', 'LGTM');
 * ```
 */
export class WorkflowRunner {
  private readonly db: Database.Database;
  private readonly safeClient: SafeDatabaseClient | null;
  private readonly workflows: Map<string, WorkflowDefinition>;
  private readonly checkpointManager: CheckpointManager;
  private readonly workflowRepo: WorkflowRepository;

  constructor(config: WorkflowRunnerConfig) {
    if (config.db instanceof SafeDatabaseClient) {
      this.safeClient = config.db;
      this.db = config.db.getDb();
    } else {
      this.safeClient = null;
      this.db = config.db;
    }

    this.workflows = config.workflows;
    this.checkpointManager = new CheckpointManager(this.db);
    this.workflowRepo = new WorkflowRepository(this.db);
  }

  /**
   * Start a new workflow run.
   */
  async start(
    workflowType: string,
    bookId: string,
    inputVersionId?: string
  ): Promise<WorkflowExecutionResult> {
    // Validate workflow type exists
    const workflow = this.workflows.get(workflowType);
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    // Create backup before starting
    let backup: BackupInfo | undefined;
    if (this.safeClient) {
      backup = this.safeClient.backup();
    }

    // Create workflow run record
    const run = this.workflowRepo.create({
      workflow_type: workflowType as 'w1_editing',
      book_id: bookId,
      input_version_id: inputVersionId,
    });

    // Initialize checkpoint
    const checkpoint = this.checkpointManager.create(
      run.id,
      workflowType,
      workflow.initialStep
    );

    // Update workflow status to running
    this.workflowRepo.updateStatus(run.id, 'running');

    // Execute the first step
    return this.executeStep(workflow, checkpoint);
  }

  /**
   * Resume a paused or interrupted workflow.
   */
  async resume(runId: string): Promise<WorkflowExecutionResult> {
    // Load checkpoint
    const checkpoint = this.checkpointManager.load(runId);
    if (!checkpoint) {
      throw new Error(`No checkpoint found for workflow run: ${runId}`);
    }

    // Get workflow definition
    const workflow = this.workflows.get(checkpoint.workflowType);
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${checkpoint.workflowType}`);
    }

    // Check for pending retry
    if (checkpoint.pendingRetry) {
      return this.handlePendingRetry(workflow, checkpoint);
    }

    // Check for incomplete parallel execution
    const parallelStatus = this.checkpointManager.getParallelStatus(checkpoint);
    if (parallelStatus && parallelStatus.pending.length > 0) {
      return this.handleParallelResume(workflow, checkpoint, parallelStatus);
    }

    // Continue from current step
    return this.executeStep(workflow, checkpoint);
  }

  /**
   * Handle a human gate decision.
   */
  async handleGateDecision(
    runId: string,
    option: string,
    input?: string
  ): Promise<WorkflowExecutionResult> {
    // Load checkpoint
    let checkpoint = this.checkpointManager.load(runId);
    if (!checkpoint) {
      throw new Error(`No checkpoint found for workflow run: ${runId}`);
    }

    // Get workflow and current step
    const workflow = this.workflows.get(checkpoint.workflowType);
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${checkpoint.workflowType}`);
    }

    const step = getStep(workflow, checkpoint.currentStep);
    if (!step?.humanGate) {
      throw new Error(`Current step "${checkpoint.currentStep}" has no human gate`);
    }

    // Find the selected option
    const selectedOption = step.humanGate.options.find((o) => o.label === option);
    if (!selectedOption) {
      throw new Error(`Invalid gate option: ${option}`);
    }

    // Record decision
    checkpoint = this.checkpointManager.recordGateDecision(
      checkpoint,
      checkpoint.currentStep,
      option,
      input
    );

    // Check if workflow should end
    if (selectedOption.nextStep === null) {
      this.workflowRepo.updateStatus(checkpoint.workflowRunId, 'completed');
      return {
        runId: checkpoint.workflowRunId,
        status: 'completed',
        currentStep: checkpoint.currentStep,
        resumeContext: this.buildResumeContext(checkpoint),
      };
    }

    // Move to next step
    checkpoint = this.checkpointManager.setCurrentStep(checkpoint, selectedOption.nextStep);
    checkpoint = this.checkpointManager.clearGateDecision(checkpoint);

    // Execute the next step
    return this.executeStep(workflow, checkpoint);
  }

  /**
   * Record completion of a parallel item.
   */
  async recordParallelItemResult(
    runId: string,
    itemKey: string,
    success: boolean,
    result?: unknown,
    error?: string
  ): Promise<{ allComplete: boolean; nextResult?: WorkflowExecutionResult }> {
    let checkpoint = this.checkpointManager.load(runId);
    if (!checkpoint) {
      throw new Error(`No checkpoint found for workflow run: ${runId}`);
    }

    if (success) {
      checkpoint = this.checkpointManager.recordParallelItemCompletion(
        checkpoint,
        itemKey,
        result
      );
    } else {
      checkpoint = this.checkpointManager.recordParallelItemFailure(
        checkpoint,
        itemKey,
        error ?? 'Unknown error'
      );
    }

    // Check if all items are complete
    const status = this.checkpointManager.getParallelStatus(checkpoint);
    if (!status || status.pending.length > 0) {
      return { allComplete: false };
    }

    // All items complete - check for failures
    if (status.failed.length > 0) {
      // Retry failed items (up to limit)
      const failedItems = status.failed.filter((key) => {
        const itemResult = checkpoint.parallelResults![key];
        return itemResult.retryCount <= MAX_RETRIES;
      });

      if (failedItems.length > 0) {
        // Return items to retry
        return {
          allComplete: false,
          nextResult: {
            runId,
            status: 'running',
            currentStep: checkpoint.currentStep,
            parallelItems: failedItems,
            resumeContext: this.buildResumeContext(checkpoint),
          },
        };
      }

      // Too many failures - escalate
      this.workflowRepo.updateStatus(runId, 'paused');
      return {
        allComplete: true,
        nextResult: {
          runId,
          status: 'paused',
          currentStep: checkpoint.currentStep,
          error: `Parallel execution failed for items: ${status.failed.join(', ')}`,
          resumeContext: this.buildResumeContext(checkpoint),
        },
      };
    }

    // All succeeded - advance to next step
    const workflow = this.workflows.get(checkpoint.workflowType)!;
    const step = getStep(workflow, checkpoint.currentStep)!;

    // Record step completion with combined results
    checkpoint = this.checkpointManager.recordStepCompletion(
      checkpoint,
      checkpoint.currentStep,
      checkpoint.parallelResults
    );

    // Clear parallel results
    checkpoint = this.checkpointManager.clearParallelResults(checkpoint);

    // Move to next step
    const nextStepName = this.evaluateNextStep(step, checkpoint, undefined);
    if (nextStepName === null) {
      this.workflowRepo.updateStatus(runId, 'completed');
      return {
        allComplete: true,
        nextResult: {
          runId,
          status: 'completed',
          currentStep: checkpoint.currentStep,
          resumeContext: this.buildResumeContext(checkpoint),
        },
      };
    }

    checkpoint = this.checkpointManager.setCurrentStep(checkpoint, nextStepName);
    return {
      allComplete: true,
      nextResult: await this.executeStep(workflow, checkpoint),
    };
  }

  /**
   * Get the current state of a workflow run.
   */
  getState(runId: string): WorkflowExecutionResult | null {
    const checkpoint = this.checkpointManager.load(runId);
    if (!checkpoint) return null;

    const run = this.workflowRepo.getById(runId);
    if (!run) return null;

    return {
      runId,
      status: run.status as WorkflowExecutionResult['status'],
      currentStep: checkpoint.currentStep,
      resumeContext: this.buildResumeContext(checkpoint),
    };
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * Execute a single workflow step.
   */
  private async executeStep(
    workflow: WorkflowDefinition,
    checkpoint: Checkpoint
  ): Promise<WorkflowExecutionResult> {
    const step = getStep(workflow, checkpoint.currentStep);
    if (!step) {
      throw new Error(`Step not found: ${checkpoint.currentStep}`);
    }

    // Check preconditions
    const ctx = this.buildStepContext(checkpoint);
    for (const condition of step.preconditions) {
      const passed = await condition.check(ctx);
      if (!passed) {
        this.workflowRepo.updateStatus(checkpoint.workflowRunId, 'failed');
        return {
          runId: checkpoint.workflowRunId,
          status: 'failed',
          currentStep: checkpoint.currentStep,
          error: `Precondition "${condition.name}" failed: ${condition.error}`,
          resumeContext: this.buildResumeContext(checkpoint),
        };
      }
    }

    // Check for human gate
    if (step.humanGate) {
      this.workflowRepo.updateStatus(checkpoint.workflowRunId, 'paused');
      return {
        runId: checkpoint.workflowRunId,
        status: 'awaiting_human',
        currentStep: checkpoint.currentStep,
        humanGate: {
          prompt: step.humanGate.prompt,
          context: this.extractGateContext(checkpoint, step.humanGate.context),
          options: step.humanGate.options,
        },
        resumeContext: this.buildResumeContext(checkpoint),
      };
    }

    // Check for parallel execution
    if (step.parallel && step.parallelKey) {
      const items = checkpoint.data[step.parallelKey] as string[] | undefined;
      if (!items || items.length === 0) {
        throw new Error(
          `Parallel step "${step.name}" requires data at key "${step.parallelKey}"`
        );
      }

      // Initialize parallel tracking
      checkpoint = this.checkpointManager.initializeParallelResults(checkpoint, items);

      return {
        runId: checkpoint.workflowRunId,
        status: 'running',
        currentStep: checkpoint.currentStep,
        parallelItems: items,
        resumeContext: this.buildResumeContext(checkpoint),
      };
    }

    // Build step input
    const stepInput = this.buildStepInput(checkpoint);

    // Return step input for Claude Code to execute
    // The actual execution happens externally - Claude Code runs the command
    // and calls back with the result
    return {
      runId: checkpoint.workflowRunId,
      status: 'running',
      currentStep: checkpoint.currentStep,
      resumeContext: {
        ...this.buildResumeContext(checkpoint),
        // Include step input for command execution
      },
    };
  }

  /**
   * Process the result of a step execution.
   */
  async processStepResult(
    runId: string,
    output: StepOutput
  ): Promise<WorkflowExecutionResult> {
    let checkpoint = this.checkpointManager.load(runId);
    if (!checkpoint) {
      throw new Error(`No checkpoint found for workflow run: ${runId}`);
    }

    const workflow = this.workflows.get(checkpoint.workflowType)!;
    const step = getStep(workflow, checkpoint.currentStep)!;

    // Check postconditions
    if (!output.postconditionsPassed) {
      // Handle retry
      const attempt = (checkpoint.pendingRetry?.attempt ?? 0) + 1;
      if (attempt > MAX_RETRIES) {
        // Escalate to human
        checkpoint = this.checkpointManager.recordPendingRetry(
          checkpoint,
          checkpoint.currentStep,
          output.error ?? 'Postcondition failed',
          attempt
        );
        this.workflowRepo.updateStatus(runId, 'paused');

        return {
          runId,
          status: 'paused',
          currentStep: checkpoint.currentStep,
          error: `Step "${step.name}" failed after ${MAX_RETRIES} retries: ${output.error}. Escalated to human.`,
          resumeContext: this.buildResumeContext(checkpoint),
        };
      }

      // Record retry and re-execute
      checkpoint = this.checkpointManager.recordPendingRetry(
        checkpoint,
        checkpoint.currentStep,
        output.error ?? 'Postcondition failed',
        attempt
      );

      return this.executeStep(workflow, checkpoint);
    }

    // Step succeeded - record completion
    checkpoint = this.checkpointManager.recordStepCompletion(
      checkpoint,
      checkpoint.currentStep,
      output.result
    );

    // Handle loop iteration tracking
    if (step.next && typeof step.next !== 'string' && step.next.maxIterations) {
      checkpoint = this.checkpointManager.incrementIteration(checkpoint, checkpoint.currentStep);
    }

    // Determine next step
    const nextStepName = this.evaluateNextStep(step, checkpoint, output);

    if (nextStepName === null) {
      // Workflow complete
      this.workflowRepo.updateStatus(runId, 'completed');
      return {
        runId,
        status: 'completed',
        currentStep: checkpoint.currentStep,
        resumeContext: this.buildResumeContext(checkpoint),
      };
    }

    // Move to next step
    checkpoint = this.checkpointManager.setCurrentStep(checkpoint, nextStepName);
    return this.executeStep(workflow, checkpoint);
  }

  /**
   * Handle pending retry situation.
   */
  private async handlePendingRetry(
    workflow: WorkflowDefinition,
    checkpoint: Checkpoint
  ): Promise<WorkflowExecutionResult> {
    // If we're resuming with a pending retry, it means human has reviewed
    // and wants to retry. Clear the retry and proceed.
    checkpoint = this.checkpointManager.clearPendingRetry(checkpoint);
    return this.executeStep(workflow, checkpoint);
  }

  /**
   * Handle resuming parallel execution.
   */
  private async handleParallelResume(
    _workflow: WorkflowDefinition,
    checkpoint: Checkpoint,
    status: { total: number; completed: number; failed: string[]; pending: string[] }
  ): Promise<WorkflowExecutionResult> {
    return {
      runId: checkpoint.workflowRunId,
      status: 'running',
      currentStep: checkpoint.currentStep,
      parallelItems: status.pending,
      resumeContext: this.buildResumeContext(checkpoint),
    };
  }

  /**
   * Evaluate which step should be next.
   */
  private evaluateNextStep(
    step: WorkflowStep,
    checkpoint: Checkpoint,
    output: StepOutput | undefined
  ): string | null {
    if (step.next === null || step.next === undefined) {
      return null;
    }

    if (typeof step.next === 'string') {
      return step.next;
    }

    // Conditional next
    const conditional = step.next as ConditionalNext;

    // Check max iterations (count is incremented AFTER this check in processStepResult)
    // So if maxIterations = 3, we allow iterations 0, 1, 2 and break on 3
    if (conditional.maxIterations) {
      const count = this.checkpointManager.getIterationCount(checkpoint, step.name);
      if (count > conditional.maxIterations) {
        // Max iterations exceeded - go to onFalse to break the loop
        return conditional.onFalse;
      }
    }

    // Evaluate condition
    // The condition is a simple expression like "result.decision === 'approved'"
    // For safety, we use output.nextStepHint if provided
    if (output?.nextStepHint) {
      return output.nextStepHint;
    }

    // Simple condition evaluation
    if (output?.result && typeof output.result === 'object') {
      const result = output.result as Record<string, unknown>;

      // Parse conditions like "result.field === 'value'" or "result.field === true"
      const stringMatch = conditional.condition.match(/result\.(\w+)\s*===?\s*['"](\w+)['"]/);
      if (stringMatch) {
        const [, field, value] = stringMatch;
        if (result[field] === value) {
          return conditional.onTrue;
        }
        return conditional.onFalse;
      }

      // Parse boolean conditions like "result.continue === true"
      const boolMatch = conditional.condition.match(/result\.(\w+)\s*===?\s*(true|false)/);
      if (boolMatch) {
        const [, field, value] = boolMatch;
        const expectedValue = value === 'true';
        if (result[field] === expectedValue) {
          return conditional.onTrue;
        }
        return conditional.onFalse;
      }
    }

    // Default to onFalse if we can't evaluate
    return conditional.onFalse;
  }

  /**
   * Build step context for condition evaluation.
   */
  private buildStepContext(checkpoint: Checkpoint): StepContext {
    const lastResult = checkpoint.completedSteps.length > 0
      ? checkpoint.completedSteps[checkpoint.completedSteps.length - 1].result
      : undefined;

    // Get bookId from workflow run
    const run = this.workflowRepo.getById(checkpoint.workflowRunId);

    return {
      runId: checkpoint.workflowRunId,
      checkpoint,
      result: lastResult,
      bookId: run?.book_id ?? '',
      db: this.buildConditionDatabase(),
    };
  }

  /**
   * Build condition database interface.
   */
  private buildConditionDatabase(): ConditionDatabase {
    return {
      strategicPlanExists: (runId: string) => {
        const row = this.db
          .prepare('SELECT 1 FROM strategic_plans WHERE workflow_run_id = ?')
          .get(runId);
        return row !== undefined;
      },
      versionExists: (versionId: string) => {
        const row = this.db
          .prepare('SELECT 1 FROM book_versions WHERE content_id = ?')
          .get(versionId);
        return row !== undefined;
      },
      artifactsExist: (runId: string) => {
        const row = this.db
          .prepare('SELECT 1 FROM workflow_artifacts WHERE workflow_run_id = ?')
          .get(runId);
        return row !== undefined;
      },
      workflowStatus: (runId: string) => {
        const row = this.db
          .prepare('SELECT status FROM workflow_runs WHERE id = ?')
          .get(runId) as { status: string } | undefined;
        return row?.status ?? null;
      },
      getVersion: (versionId: string) => {
        const row = this.db
          .prepare('SELECT content_id as id, book_id FROM book_versions WHERE content_id = ?')
          .get(versionId) as { id: string; book_id: string } | undefined;
        return row ?? null;
      },
    };
  }

  /**
   * Build step input for command execution.
   */
  private buildStepInput(checkpoint: Checkpoint): StepInput {
    return {
      runId: checkpoint.workflowRunId,
      step: checkpoint.currentStep,
      checkpoint,
      retryContext: checkpoint.pendingRetry
        ? {
            error: checkpoint.pendingRetry.error,
            attempt: checkpoint.pendingRetry.attempt,
          }
        : undefined,
    };
  }

  /**
   * Build resume context for the caller.
   */
  private buildResumeContext(checkpoint: Checkpoint): ResumeContext {
    const lastResult = checkpoint.completedSteps.length > 0
      ? checkpoint.completedSteps[checkpoint.completedSteps.length - 1].result
      : undefined;

    const parallelStatus = this.checkpointManager.getParallelStatus(checkpoint);

    return {
      workflowType: checkpoint.workflowType,
      runId: checkpoint.workflowRunId,
      currentStep: checkpoint.currentStep,
      completedSteps: checkpoint.completedSteps.map((s) => s.step),
      lastStepOutput: lastResult,
      pendingRetry: checkpoint.pendingRetry,
      parallelStatus: parallelStatus
        ? {
            total: parallelStatus.total,
            completed: parallelStatus.completed,
            failed: parallelStatus.failed,
          }
        : undefined,
    };
  }

  /**
   * Extract context values for human gate display.
   */
  private extractGateContext(
    checkpoint: Checkpoint,
    keys: string[]
  ): Record<string, unknown> {
    const context: Record<string, unknown> = {};

    for (const key of keys) {
      // Handle nested keys like "metrics.baseline"
      const parts = key.split('.');
      let value: unknown = checkpoint.data;

      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[part];
        } else {
          value = undefined;
          break;
        }
      }

      // Also check step results
      if (value === undefined) {
        for (const stepResult of checkpoint.completedSteps) {
          if (stepResult.result && typeof stepResult.result === 'object') {
            value = stepResult.result;
            for (const part of parts) {
              if (value && typeof value === 'object') {
                value = (value as Record<string, unknown>)[part];
              } else {
                value = undefined;
                break;
              }
            }
            if (value !== undefined) break;
          }
        }
      }

      context[key] = value;
    }

    return context;
  }
}
