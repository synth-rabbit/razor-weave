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
  VPType
} from './types';

export class BoardroomClient {
  private writer: EventWriter;

  constructor(eventsDir: string, sessionId: string, worktree: string) {
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
}
