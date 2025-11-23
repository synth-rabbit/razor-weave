// src/tooling/boardroom/client.ts
import { randomUUID } from 'crypto';
import { EventWriter } from '../events/writer';
import type {
  BoardroomSession,
  VPPlan,
  Phase,
  Milestone,
  EngineeringTask,
  CEOFeedback,
  BrainstormOpinion,
  VPConsultation,
  SessionCheckpoint,
  VPType,
  ExecutionBatch,
  OperationalRisk,
  BoardroomMinutes
} from './types';

export class BoardroomClient {
  private writer: EventWriter;
  private sessionId: string;

  constructor(eventsDir: string, sessionId: string, worktree: string) {
    this.sessionId = sessionId;
    this.writer = new EventWriter(eventsDir, sessionId, worktree);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID().slice(0, 8)}`;
  }

  createSession(proposalPath: string): BoardroomSession {
    const session: BoardroomSession = {
      id: this.generateId('sess'),
      proposal_path: proposalPath,
      status: 'active',
      created_at: new Date().toISOString(),
      completed_at: null
    };

    this.writer.write('boardroom_sessions', 'INSERT', session as unknown as Record<string, unknown>);
    return session;
  }

  createVPPlan(sessionId: string, vpType: VPType): VPPlan {
    const plan: VPPlan = {
      id: this.generateId('plan'),
      session_id: sessionId,
      vp_type: vpType,
      status: 'draft',
      plan_path: null,
      created_at: new Date().toISOString()
    };

    this.writer.write('vp_plans', 'INSERT', plan as unknown as Record<string, unknown>);
    return plan;
  }

  updateVPPlanStatus(planId: string, status: 'reviewed' | 'approved', planPath?: string): void {
    const data: Record<string, unknown> = { status };
    if (planPath) data.plan_path = planPath;

    this.writer.write('vp_plans', 'UPDATE', data, planId);
  }

  createPhase(
    planId: string,
    name: string,
    description: string | null,
    sequence: number,
    acceptanceCriteria: string[]
  ): Phase {
    const phase: Phase = {
      id: this.generateId('phase'),
      plan_id: planId,
      name,
      description,
      sequence,
      acceptance_criteria: JSON.stringify(acceptanceCriteria)
    };

    this.writer.write('phases', 'INSERT', phase as unknown as Record<string, unknown>);
    return phase;
  }

  createMilestone(phaseId: string, name: string, description: string | null, sequence: number): Milestone {
    const milestone: Milestone = {
      id: this.generateId('ms'),
      phase_id: phaseId,
      name,
      description,
      sequence
    };

    this.writer.write('milestones', 'INSERT', milestone as unknown as Record<string, unknown>);
    return milestone;
  }

  createEngineeringTask(
    planId: string,
    milestoneId: string,
    description: string,
    filePaths?: string[],
    dependencies?: string[]
  ): EngineeringTask {
    const task: EngineeringTask = {
      id: this.generateId('task'),
      plan_id: planId,
      milestone_id: milestoneId,
      description,
      file_paths: filePaths ? JSON.stringify(filePaths) : null,
      dependencies: dependencies ? JSON.stringify(dependencies) : null
    };

    this.writer.write('engineering_tasks', 'INSERT', task as unknown as Record<string, unknown>);
    return task;
  }

  addCEOFeedback(planId: string, feedback: string): CEOFeedback {
    const fb: CEOFeedback = {
      id: this.generateId('fb'),
      plan_id: planId,
      feedback,
      created_at: new Date().toISOString()
    };

    this.writer.write('ceo_feedback', 'INSERT', fb as unknown as Record<string, unknown>);
    return fb;
  }

  recordBrainstormOpinion(
    sessionId: string,
    question: string,
    options: string[],
    vpOpsPerspective: string,
    blockers: string[] | null,
    ceoDecision: string,
    overrideReasoning: string | null
  ): BrainstormOpinion {
    const opinion: BrainstormOpinion = {
      id: this.generateId('op'),
      session_id: sessionId,
      question,
      options: JSON.stringify(options),
      vp_ops_perspective: vpOpsPerspective,
      blockers: blockers ? JSON.stringify(blockers) : null,
      ceo_decision: ceoDecision,
      override_reasoning: overrideReasoning,
      created_at: new Date().toISOString()
    };

    this.writer.write('brainstorm_opinions', 'INSERT', opinion as unknown as Record<string, unknown>);
    return opinion;
  }

  recordVPConsultation(
    sessionId: string,
    sprintId: string | null,
    vpType: VPType,
    question: string,
    context: Record<string, unknown> | null,
    response: string,
    outcome: string | null
  ): VPConsultation {
    const consultation: VPConsultation = {
      id: this.generateId('cons'),
      session_id: sessionId,
      sprint_id: sprintId,
      vp_type: vpType,
      question,
      context: context ? JSON.stringify(context) : null,
      response,
      outcome,
      created_at: new Date().toISOString()
    };

    this.writer.write('vp_consultations', 'INSERT', consultation as unknown as Record<string, unknown>);
    return consultation;
  }

  emitCheckpoint(vpType: string, referenceId: string, description: string): SessionCheckpoint {
    const checkpoint: SessionCheckpoint = {
      id: this.generateId('chk'),
      session_id: this.sessionId,
      vp_type: vpType,
      reference_id: referenceId,
      description,
      created_at: new Date().toISOString()
    };

    this.writer.write('session_checkpoints', 'INSERT', checkpoint as unknown as Record<string, unknown>);
    return checkpoint;
  }

  // VP Ops specific methods
  createExecutionBatch(
    planId: string,
    batchNumber: number,
    name: string,
    tasks: string[],
    parallelSafe: boolean,
    checkpoint: string,
    humanGate: boolean,
    humanGateCriteria: string | null
  ): ExecutionBatch {
    const batch: ExecutionBatch = {
      id: this.generateId('batch'),
      plan_id: planId,
      batch_number: batchNumber,
      name,
      tasks: JSON.stringify(tasks),
      parallel_safe: parallelSafe,
      checkpoint,
      human_gate: humanGate,
      human_gate_criteria: humanGateCriteria
    };

    this.writer.write('execution_batches', 'INSERT', batch as unknown as Record<string, unknown>);
    return batch;
  }

  createOperationalRisk(
    planId: string,
    description: string,
    mitigation: string,
    severity: 'high' | 'medium' | 'low'
  ): OperationalRisk {
    const risk: OperationalRisk = {
      id: this.generateId('risk'),
      plan_id: planId,
      description,
      mitigation,
      severity
    };

    this.writer.write('operational_risks', 'INSERT', risk as unknown as Record<string, unknown>);
    return risk;
  }

  // Board Minutes
  createBoardroomMinutes(
    sessionId: string,
    data: {
      attendees: string[];
      agenda: string[];
      vpProductSummary: string;
      vpEngineeringSummary: string;
      vpOpsSummary: string;
      decisions: string[];
      actionItems: string[];
      blockers: string[];
      nextSteps: string;
    }
  ): BoardroomMinutes {
    const minutes: BoardroomMinutes = {
      id: this.generateId('min'),
      session_id: sessionId,
      date: new Date().toISOString().split('T')[0],
      attendees: JSON.stringify(data.attendees),
      agenda: JSON.stringify(data.agenda),
      vp_product_summary: data.vpProductSummary,
      vp_engineering_summary: data.vpEngineeringSummary,
      vp_ops_summary: data.vpOpsSummary,
      decisions: JSON.stringify(data.decisions),
      action_items: JSON.stringify(data.actionItems),
      blockers: JSON.stringify(data.blockers),
      next_steps: data.nextSteps,
      created_at: new Date().toISOString()
    };

    this.writer.write('boardroom_minutes', 'INSERT', minutes as unknown as Record<string, unknown>);
    return minutes;
  }
}
