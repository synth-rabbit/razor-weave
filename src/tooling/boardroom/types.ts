// src/tooling/boardroom/types.ts
export type SessionStatus = 'active' | 'completed' | 'cancelled';
export type VPType = 'product' | 'engineering' | 'ops';
export type PlanStatus = 'draft' | 'reviewed' | 'approved';

export interface BoardroomSession {
  id: string;
  proposal_path: string;
  status: SessionStatus;
  created_at: string;
  completed_at: string | null;
}

export interface VPPlan {
  id: string;
  session_id: string;
  vp_type: VPType;
  status: PlanStatus;
  plan_path: string | null;
  created_at: string;
}

export interface Phase {
  id: string;
  plan_id: string;
  name: string;
  description: string | null;
  sequence: number;
  acceptance_criteria: string; // JSON array
}

export interface Milestone {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  sequence: number;
}

export interface EngineeringTask {
  id: string;
  plan_id: string;
  milestone_id: string;
  description: string;
  file_paths: string | null; // JSON array
  dependencies: string | null; // JSON array
}

export interface CEOFeedback {
  id: string;
  plan_id: string;
  feedback: string;
  created_at: string;
}

export interface BrainstormOpinion {
  id: string;
  session_id: string;
  question: string;
  options: string; // JSON array
  vp_ops_perspective: string;
  blockers: string | null; // JSON array
  ceo_decision: string;
  override_reasoning: string | null;
  created_at: string;
}

export interface VPConsultation {
  id: string;
  session_id: string;
  sprint_id: string | null;
  vp_type: VPType;
  question: string;
  context: string | null; // JSON
  response: string;
  outcome: string | null;
  created_at: string;
}

export interface SessionCheckpoint {
  id: string;
  session_id: string;
  vp_type: string;
  reference_id: string;
  description: string;
  created_at: string;
}

// VP Ops specific types
export interface ExecutionBatch {
  id: string;
  plan_id: string;
  batch_number: number;
  name: string;
  tasks: string; // JSON array of task descriptions
  parallel_safe: boolean;
  checkpoint: string;
  human_gate: boolean;
  human_gate_criteria: string | null;
}

export interface OperationalRisk {
  id: string;
  plan_id: string;
  description: string;
  mitigation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface BoardroomMinutes {
  id: string;
  session_id: string;
  date: string;
  attendees: string; // JSON array
  agenda: string; // JSON array
  vp_product_summary: string;
  vp_engineering_summary: string;
  vp_ops_summary: string;
  decisions: string; // JSON array
  action_items: string; // JSON array
  blockers: string; // JSON array
  next_steps: string;
  created_at: string;
}
