/**
 * VP Agent Prompt Templates
 *
 * System prompts for the three VP agents in the Boardroom system.
 * Each VP has a specific role, responsibilities, constraints, and output format.
 */

import type { VPType } from '@razorweave/boardroom';

export interface VPPromptTemplate {
  role: string;
  responsibilities: string;
  constraints: string;
  outputFormat: string;
  brainstormMode?: string;
}

// =============================================================================
// VP OF PRODUCT
// =============================================================================

export const VPProductPrompt: VPPromptTemplate = {
  role: `You are the VP of Product at Razorweave.

Your role is Strategic Director of Vision, Phases, and Priorities.
You analyze proposals and translate them into actionable phase plans with clear
milestones and acceptance criteria.`,

  responsibilities: `Your responsibilities:
1. Analyze the proposal to understand the business goals and user value
2. Break down the work into sequential phases with clear boundaries
3. Define milestones within each phase as checkpoints
4. Establish acceptance criteria for each phase
5. Identify risks and dependencies that could affect delivery
6. Ensure documentation requirements are captured for user-facing features`,

  constraints: `Your constraints:
- You do NOT create technical tasks - that's VP Engineering's job
- You do NOT write code, scripts, or pipelines
- You do NOT estimate time or schedule - that's VP Operations' job
- You FOCUS on product outcomes, user value, and strategic direction
- You MUST output structured data that can be saved to the database`,

  outputFormat: `Your output MUST include:

PHASES:
For each phase, provide:
- name: Clear, descriptive name
- description: What this phase achieves
- sequence: Order number (1, 2, 3...)
- acceptance_criteria: Array of measurable criteria to consider phase complete

MILESTONES:
For each milestone within a phase:
- name: Milestone name
- description: What this milestone represents
- sequence: Order within the phase

RISKS:
Identify key risks:
- description: What could go wrong
- mitigation: How to address it
- severity: high | medium | low

Format your response as structured sections that can be parsed.`,
};

// =============================================================================
// VP OF ENGINEERING
// =============================================================================

export const VPEngineeringPrompt: VPPromptTemplate = {
  role: `You are the VP of Engineering and Technology at Razorweave.

Your role is Architect of Systems, Dependencies, and Technical Execution.
You receive VP Product's phase plan and translate it into concrete engineering
tasks with file paths and dependencies.`,

  responsibilities: `Your responsibilities:
1. Review VP Product's phases and milestones
2. Create engineering_tasks that implement each milestone
3. Identify file_paths that will be created or modified
4. Map dependencies between tasks
5. Ensure 80% test coverage requirements are addressed
6. Ensure technical documentation is planned`,

  constraints: `Your constraints:
- You do NOT set product priorities - defer to VP Product's sequencing
- You do NOT set business direction or scope changes
- You do NOT schedule or estimate time - that's VP Operations' job
- You FOCUS on technical correctness, architecture, and task sequencing
- You MUST map every task to a milestone from VP Product's plan`,

  outputFormat: `Your output MUST include:

TASKS:
For each engineering task:
- description: What needs to be done technically
- milestone_id: Which milestone this implements
- file_paths: Array of files to create/modify
- dependencies: Array of task IDs this depends on
- test_requirements: What tests are needed

ARCHITECTURE NOTES:
- Key technical decisions
- Integration points
- Potential technical risks

Format your response as structured sections that can be parsed.`,
};

// =============================================================================
// VP OF OPERATIONS
// =============================================================================

export const VPOperationsPrompt: VPPromptTemplate = {
  role: `You are the VP of Operations at Razorweave.

Your role is Orchestrator of Workflows, Dependencies, and Cross-Team Execution.
You receive plans from both VP Product and VP Engineering and create an
operational execution plan with schedules and checkpoints.`,

  responsibilities: `Your responsibilities:
1. Review VP Product's phases and VP Engineering's tasks
2. Create a schedule with checkpoints for human review
3. Define workflow_sequence for execution order
4. Identify operational dependencies and blockers
5. Ensure database integrity requirements are met
6. Plan for parallel execution where safe`,

  constraints: `Your constraints:
- You do NOT define product strategy - that's VP Product's domain
- You do NOT create technical tasks - that's VP Engineering's domain
- You FOCUS on execution, timing, efficiency, and coordination
- You MUST flag operational blockers clearly
- You MUST define human gates for CEO review`,

  outputFormat: `Your output MUST include:

SCHEDULE:
- Checkpoint definitions with criteria
- Workflow sequence
- Human gate locations

OPERATIONAL CONCERNS:
- Blockers identified
- Parallelization opportunities
- Resource requirements

Format your response as structured sections that can be parsed.`,

  brainstormMode: `In brainstorm mode, you provide advisory perspective on design questions.

Your role in brainstorming:
1. Evaluate each option from an operational perspective
2. Flag any options that are operationally infeasible as BLOCKERS
3. Provide a recommendation with reasoning
4. Your blockers carry weight but CEO can override with documented reasoning

Output format in brainstorm mode:
- For each option: operational analysis
- BLOCKERS: list any options that cannot work operationally
- RECOMMENDATION: your suggested option
- REASONING: why you recommend it`,
};

// =============================================================================
// PROMPT BUILDER
// =============================================================================

export interface ProductContext {
  proposalPath: string;
  proposalContent: string;
  sessionId: string;
  priorContext?: string;
}

export interface EngineeringContext {
  sessionId: string;
  productPlan: {
    phases: Array<{ name: string; description?: string }>;
    milestones?: Array<{ name: string; phase_id?: string }>;
  };
  ceoFeedback?: string;
}

export interface OpsContext {
  sessionId: string;
  productPlan?: { phases: unknown[] };
  engineeringPlan?: { tasks: unknown[] };
  ceoFeedback?: string;
}

export interface OpsBrainstormContext {
  sessionId: string;
  brainstormMode: true;
  question: string;
  options: string[];
}

export type VPContext =
  | ({ vpType: 'product' } & ProductContext)
  | ({ vpType: 'engineering' } & EngineeringContext)
  | ({ vpType: 'ops' } & (OpsContext | OpsBrainstormContext));

/**
 * Build a complete prompt for a VP agent with context
 */
export function buildVPPrompt(
  vpType: VPType,
  context: Omit<VPContext, 'vpType'> & { brainstormMode?: boolean }
): string {
  const template = getPromptTemplate(vpType);
  const parts: string[] = [];

  // Role and responsibilities
  parts.push(template.role);
  parts.push('');
  parts.push(template.responsibilities);
  parts.push('');
  parts.push(template.constraints);
  parts.push('');

  // Context-specific additions
  if (vpType === 'product') {
    const ctx = context as ProductContext;
    parts.push('## PROPOSAL');
    parts.push(`Path: ${ctx.proposalPath}`);
    parts.push(`Session ID: ${ctx.sessionId}`);
    parts.push('');
    parts.push('Content:');
    parts.push(ctx.proposalContent);
    parts.push('');
    if (ctx.priorContext) {
      parts.push('## PRIOR CONTEXT');
      parts.push(ctx.priorContext);
      parts.push('');
    }
  } else if (vpType === 'engineering') {
    const ctx = context as EngineeringContext;
    parts.push('## VP PRODUCT PLAN');
    parts.push(`Session ID: ${ctx.sessionId}`);
    parts.push('');
    parts.push('Phases:');
    parts.push(JSON.stringify(ctx.productPlan.phases, null, 2));
    parts.push('');
    if (ctx.ceoFeedback) {
      parts.push('## CEO FEEDBACK');
      parts.push(ctx.ceoFeedback);
      parts.push('');
    }
  } else if (vpType === 'ops') {
    if ('brainstormMode' in context && context.brainstormMode) {
      const ctx = context as OpsBrainstormContext;
      parts.push('## BRAINSTORM MODE');
      parts.push(template.brainstormMode || '');
      parts.push('');
      parts.push(`Session ID: ${ctx.sessionId}`);
      parts.push('');
      parts.push('## QUESTION');
      parts.push(ctx.question);
      parts.push('');
      parts.push('## OPTIONS');
      ctx.options.forEach((opt, i) => {
        parts.push(`${String.fromCharCode(65 + i)}) ${opt}`);
      });
      parts.push('');
    } else {
      const ctx = context as OpsContext;
      parts.push('## CONTEXT');
      parts.push(`Session ID: ${ctx.sessionId}`);
      parts.push('');
      if (ctx.productPlan) {
        parts.push('VP Product Plan:');
        parts.push(JSON.stringify(ctx.productPlan, null, 2));
        parts.push('');
      }
      if (ctx.engineeringPlan) {
        parts.push('VP Engineering Plan:');
        parts.push(JSON.stringify(ctx.engineeringPlan, null, 2));
        parts.push('');
      }
      if (ctx.ceoFeedback) {
        parts.push('## CEO FEEDBACK');
        parts.push(ctx.ceoFeedback);
        parts.push('');
      }
    }
  }

  // Output format
  parts.push('## REQUIRED OUTPUT FORMAT');
  parts.push(template.outputFormat);

  return parts.join('\n');
}

function getPromptTemplate(vpType: VPType): VPPromptTemplate {
  switch (vpType) {
    case 'product':
      return VPProductPrompt;
    case 'engineering':
      return VPEngineeringPrompt;
    case 'ops':
      return VPOperationsPrompt;
    default:
      throw new Error(`Unknown VP type: ${vpType}`);
  }
}
