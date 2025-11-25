/**
 * Checkpoint Manager
 *
 * Manages checkpoint state for workflow runs. Provides save/load/update
 * operations for rich checkpoint data stored in the database.
 */

import { BaseRepository } from '@razorweave/database';
import { DatabaseError } from '../errors/index.js';
import type {
  Checkpoint,
  StepResult,
  ParallelItemResult,
  PendingRetry,
  GateDecision,
} from './engine-types.js';
import { createCheckpoint } from './engine-types.js';

/**
 * Database row structure for checkpoint data
 */
interface CheckpointRow {
  id: string;
  workflow_type: string;
  status: string;
  checkpoint_json: string | null;
  current_step: string | null;
  iteration_counts: string | null;
}

/**
 * CheckpointManager handles persistence of workflow checkpoint state.
 *
 * Checkpoints are stored in the workflow_runs table with:
 * - checkpoint_json: Full serialized checkpoint state
 * - current_step: Current step name (for quick queries)
 * - iteration_counts: JSON map of step -> iteration count
 */
export class CheckpointManager extends BaseRepository<CheckpointRow & { created_at: string }> {
  protected getIdPrefix(): string {
    return 'chkpt';
  }

  /**
   * Create a new checkpoint for a workflow run.
   * Call this when starting a new workflow.
   */
  create(workflowRunId: string, workflowType: string, initialStep: string): Checkpoint {
    return this.execute(() => {
      const checkpoint = createCheckpoint(workflowRunId, workflowType, initialStep);

      this.db
        .prepare(
          `
        UPDATE workflow_runs
        SET checkpoint_json = ?,
            current_step = ?,
            iteration_counts = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
        )
        .run(
          JSON.stringify(checkpoint),
          initialStep,
          JSON.stringify(checkpoint.iterationCounts),
          workflowRunId
        );

      return checkpoint;
    }, `create checkpoint for workflow run "${workflowRunId}"`);
  }

  /**
   * Load a checkpoint from the database.
   * Returns null if the workflow run doesn't exist or has no checkpoint.
   */
  load(workflowRunId: string): Checkpoint | null {
    return this.execute(() => {
      const row = this.db
        .prepare(
          `
        SELECT id, workflow_type, status, checkpoint_json, current_step, iteration_counts
        FROM workflow_runs
        WHERE id = ?
      `
        )
        .get(workflowRunId) as CheckpointRow | undefined;

      if (!row || !row.checkpoint_json) {
        return null;
      }

      try {
        return JSON.parse(row.checkpoint_json) as Checkpoint;
      } catch {
        throw new DatabaseError(
          `Invalid checkpoint JSON for workflow run "${workflowRunId}"`
        );
      }
    }, `load checkpoint for workflow run "${workflowRunId}"`);
  }

  /**
   * Save a checkpoint to the database.
   * Use this after any checkpoint state change.
   */
  save(checkpoint: Checkpoint): void {
    this.execute(() => {
      this.db
        .prepare(
          `
        UPDATE workflow_runs
        SET checkpoint_json = ?,
            current_step = ?,
            iteration_counts = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
        )
        .run(
          JSON.stringify(checkpoint),
          checkpoint.currentStep,
          JSON.stringify(checkpoint.iterationCounts),
          checkpoint.workflowRunId
        );
    }, `save checkpoint for workflow run "${checkpoint.workflowRunId}"`);
  }

  /**
   * Record a completed step in the checkpoint.
   */
  recordStepCompletion(checkpoint: Checkpoint, stepName: string, result: unknown): Checkpoint {
    const stepResult: StepResult = {
      step: stepName,
      completedAt: new Date().toISOString(),
      result,
    };

    const updated: Checkpoint = {
      ...checkpoint,
      completedSteps: [...checkpoint.completedSteps, stepResult],
      pendingRetry: undefined, // Clear any pending retry on success
    };

    this.save(updated);
    return updated;
  }

  /**
   * Update the current step in the checkpoint.
   */
  setCurrentStep(checkpoint: Checkpoint, stepName: string): Checkpoint {
    const updated: Checkpoint = {
      ...checkpoint,
      currentStep: stepName,
    };

    this.save(updated);
    return updated;
  }

  /**
   * Increment the iteration count for a step (used for loop tracking).
   */
  incrementIteration(checkpoint: Checkpoint, stepName: string): Checkpoint {
    const currentCount = checkpoint.iterationCounts[stepName] ?? 0;
    const updated: Checkpoint = {
      ...checkpoint,
      iterationCounts: {
        ...checkpoint.iterationCounts,
        [stepName]: currentCount + 1,
      },
    };

    this.save(updated);
    return updated;
  }

  /**
   * Get the iteration count for a step.
   */
  getIterationCount(checkpoint: Checkpoint, stepName: string): number {
    return checkpoint.iterationCounts[stepName] ?? 0;
  }

  /**
   * Record a pending retry for a failed step.
   */
  recordPendingRetry(
    checkpoint: Checkpoint,
    stepName: string,
    error: string,
    attempt: number
  ): Checkpoint {
    const pendingRetry: PendingRetry = {
      step: stepName,
      error,
      attempt,
    };

    const updated: Checkpoint = {
      ...checkpoint,
      pendingRetry,
    };

    this.save(updated);
    return updated;
  }

  /**
   * Clear pending retry (after successful retry or escalation).
   */
  clearPendingRetry(checkpoint: Checkpoint): Checkpoint {
    const updated: Checkpoint = {
      ...checkpoint,
      pendingRetry: undefined,
    };

    this.save(updated);
    return updated;
  }

  /**
   * Initialize parallel results tracking for a set of items.
   */
  initializeParallelResults(checkpoint: Checkpoint, itemKeys: string[]): Checkpoint {
    const parallelResults: Record<string, ParallelItemResult> = {};
    for (const key of itemKeys) {
      parallelResults[key] = {
        status: 'pending',
        retryCount: 0,
      };
    }

    const updated: Checkpoint = {
      ...checkpoint,
      parallelResults,
    };

    this.save(updated);
    return updated;
  }

  /**
   * Record a parallel item completion.
   */
  recordParallelItemCompletion(
    checkpoint: Checkpoint,
    itemKey: string,
    result: unknown
  ): Checkpoint {
    if (!checkpoint.parallelResults) {
      throw new DatabaseError('Cannot record parallel item completion: no parallel results initialized');
    }

    const updated: Checkpoint = {
      ...checkpoint,
      parallelResults: {
        ...checkpoint.parallelResults,
        [itemKey]: {
          status: 'completed',
          result,
          retryCount: checkpoint.parallelResults[itemKey]?.retryCount ?? 0,
        },
      },
    };

    this.save(updated);
    return updated;
  }

  /**
   * Record a parallel item failure.
   */
  recordParallelItemFailure(
    checkpoint: Checkpoint,
    itemKey: string,
    error: string
  ): Checkpoint {
    if (!checkpoint.parallelResults) {
      throw new DatabaseError('Cannot record parallel item failure: no parallel results initialized');
    }

    const currentRetryCount = checkpoint.parallelResults[itemKey]?.retryCount ?? 0;

    const updated: Checkpoint = {
      ...checkpoint,
      parallelResults: {
        ...checkpoint.parallelResults,
        [itemKey]: {
          status: 'failed',
          error,
          retryCount: currentRetryCount + 1,
        },
      },
    };

    this.save(updated);
    return updated;
  }

  /**
   * Get parallel execution status.
   */
  getParallelStatus(checkpoint: Checkpoint): {
    total: number;
    completed: number;
    failed: string[];
    pending: string[];
  } | null {
    if (!checkpoint.parallelResults) {
      return null;
    }

    const entries = Object.entries(checkpoint.parallelResults);
    const completed = entries.filter(([, r]) => r.status === 'completed').map(([k]) => k);
    const failed = entries.filter(([, r]) => r.status === 'failed').map(([k]) => k);
    const pending = entries.filter(([, r]) => r.status === 'pending').map(([k]) => k);

    return {
      total: entries.length,
      completed: completed.length,
      failed,
      pending,
    };
  }

  /**
   * Clear parallel results (after all items complete or step advances).
   */
  clearParallelResults(checkpoint: Checkpoint): Checkpoint {
    const updated: Checkpoint = {
      ...checkpoint,
      parallelResults: undefined,
    };

    this.save(updated);
    return updated;
  }

  /**
   * Record a human gate decision.
   */
  recordGateDecision(
    checkpoint: Checkpoint,
    gateName: string,
    option: string,
    input?: string
  ): Checkpoint {
    const gateDecision: GateDecision = {
      gate: gateName,
      option,
      input,
    };

    const updated: Checkpoint = {
      ...checkpoint,
      gateDecision,
    };

    this.save(updated);
    return updated;
  }

  /**
   * Clear gate decision (after processing).
   */
  clearGateDecision(checkpoint: Checkpoint): Checkpoint {
    const updated: Checkpoint = {
      ...checkpoint,
      gateDecision: undefined,
    };

    this.save(updated);
    return updated;
  }

  /**
   * Store arbitrary data in the checkpoint.
   */
  setData(checkpoint: Checkpoint, key: string, value: unknown): Checkpoint {
    const updated: Checkpoint = {
      ...checkpoint,
      data: {
        ...checkpoint.data,
        [key]: value,
      },
    };

    this.save(updated);
    return updated;
  }

  /**
   * Get data from the checkpoint.
   */
  getData<T>(checkpoint: Checkpoint, key: string): T | undefined {
    return checkpoint.data[key] as T | undefined;
  }

  /**
   * Get the result of a specific completed step.
   */
  getStepResult(checkpoint: Checkpoint, stepName: string): unknown | undefined {
    const stepResult = checkpoint.completedSteps.find((s) => s.step === stepName);
    return stepResult?.result;
  }

  /**
   * Check if a step has been completed.
   */
  isStepCompleted(checkpoint: Checkpoint, stepName: string): boolean {
    return checkpoint.completedSteps.some((s) => s.step === stepName);
  }

  /**
   * Get all workflow runs with pending retries (for monitoring/recovery).
   */
  getRunsWithPendingRetries(): Array<{ runId: string; step: string; error: string; attempt: number }> {
    return this.execute(() => {
      const rows = this.db
        .prepare(
          `
        SELECT id, checkpoint_json
        FROM workflow_runs
        WHERE status = 'running'
          AND checkpoint_json LIKE '%"pendingRetry":%'
      `
        )
        .all() as Array<{ id: string; checkpoint_json: string }>;

      const results: Array<{ runId: string; step: string; error: string; attempt: number }> = [];

      for (const row of rows) {
        try {
          const checkpoint = JSON.parse(row.checkpoint_json) as Checkpoint;
          if (checkpoint.pendingRetry) {
            results.push({
              runId: row.id,
              step: checkpoint.pendingRetry.step,
              error: checkpoint.pendingRetry.error,
              attempt: checkpoint.pendingRetry.attempt,
            });
          }
        } catch {
          // Skip malformed checkpoints
        }
      }

      return results;
    }, 'get runs with pending retries');
  }
}
