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
