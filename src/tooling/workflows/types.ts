/**
 * Workflow type definitions for the Razorweave workflow system.
 * These types align with the database schema in 002_unified_schema.sql
 */

/**
 * Valid workflow statuses matching the CHECK constraint in workflow_runs table
 */
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

/**
 * Valid workflow types matching the CHECK constraint in workflow_runs table
 */
export type WorkflowType = 'w1_editing' | 'w2_pdf' | 'w3_publication' | 'w4_playtesting';

/**
 * Interface representing a workflow run record from the database
 */
export interface WorkflowRun {
  id: string;
  workflow_type: WorkflowType;
  book_id: string;
  input_version_id?: string | null;
  output_version_id?: string | null;
  session_id?: string | null;
  plan_id?: string | null;
  status: WorkflowStatus;
  current_agent?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * All valid workflow statuses as an array for runtime validation
 */
export const WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
] as const;

/**
 * All valid workflow types as an array for runtime validation
 */
export const WORKFLOW_TYPES: readonly WorkflowType[] = [
  'w1_editing',
  'w2_pdf',
  'w3_publication',
  'w4_playtesting',
] as const;

/**
 * Terminal states that cannot transition to any other state
 */
export const TERMINAL_STATES: readonly WorkflowStatus[] = ['completed', 'failed'] as const;

/**
 * Check if a status is a terminal state
 */
export function isTerminalState(status: WorkflowStatus): boolean {
  return TERMINAL_STATES.includes(status);
}
