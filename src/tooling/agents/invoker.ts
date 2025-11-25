/**
 * VP Agent Invoker
 *
 * Prepares invocation context for VP agents and processes their outputs.
 * Stores results in the event log for later materialization.
 */

import { EventWriter } from '@razorweave/events';
import {
  buildVPPrompt,
  ProductContext,
  EngineeringContext,
  OpsContext,
  OpsBrainstormContext,
} from './prompts';
import type { VPType } from '@razorweave/boardroom';

export interface InvocationContext {
  vpType: VPType;
  prompt: string;
  sessionId: string;
}

export interface ParsedPhase {
  name: string;
  description: string;
  sequence: number;
  acceptance_criteria: string[];
}

export interface ParsedMilestone {
  name: string;
  description: string;
  phase_name: string;
  sequence: number;
}

export interface ParsedRisk {
  description: string;
  mitigation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ParsedTask {
  description: string;
  milestone_id: string;
  file_paths: string[];
  dependencies: string[];
  test_requirements: string;
}

export interface ParsedCheckpoint {
  name: string;
  criteria: string;
}

export interface VPInvocationResult {
  success: boolean;
  error?: string;
  phases?: ParsedPhase[];
  milestones?: ParsedMilestone[];
  risks?: ParsedRisk[];
  tasks?: ParsedTask[];
  checkpoints?: ParsedCheckpoint[];
  concerns?: string;
  blockers?: string;
  recommendation?: string;
  reasoning?: string;
}

export class VPInvoker {
  private readonly eventsDir: string;
  private readonly worktree: string;

  constructor(eventsDir: string, worktree: string) {
    this.eventsDir = eventsDir;
    this.worktree = worktree;
  }

  /**
   * Prepare VP Product invocation context
   */
  prepareProductInvocation(context: ProductContext): InvocationContext {
    return {
      vpType: 'product',
      prompt: buildVPPrompt('product', context),
      sessionId: context.sessionId,
    };
  }

  /**
   * Prepare VP Engineering invocation context
   */
  prepareEngineeringInvocation(context: EngineeringContext): InvocationContext {
    return {
      vpType: 'engineering',
      prompt: buildVPPrompt('engineering', context),
      sessionId: context.sessionId,
    };
  }

  /**
   * Prepare VP Operations invocation context
   */
  prepareOpsInvocation(
    context: OpsContext | OpsBrainstormContext
  ): InvocationContext {
    return {
      vpType: 'ops',
      prompt: buildVPPrompt('ops', context),
      sessionId: context.sessionId,
    };
  }

  /**
   * Process VP Product output and store in event log
   */
  processProductOutput(
    sessionId: string,
    planId: string,
    output: string
  ): VPInvocationResult {
    try {
      const phases = this.parsePhases(output);
      const milestones = this.parseMilestones(output);
      const risks = this.parseRisks(output);

      const writer = new EventWriter(this.eventsDir, sessionId, this.worktree);

      // Write phases
      for (const phase of phases) {
        writer.write('phases', 'INSERT', {
          id: `phase_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          plan_id: planId,
          name: phase.name,
          description: phase.description,
          sequence: phase.sequence,
          acceptance_criteria: JSON.stringify(phase.acceptance_criteria),
        });
      }

      // Write milestones
      for (const milestone of milestones) {
        writer.write('milestones', 'INSERT', {
          id: `ms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          phase_name: milestone.phase_name,
          name: milestone.name,
          description: milestone.description,
          sequence: milestone.sequence,
        });
      }

      return {
        success: true,
        phases,
        milestones,
        risks,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process VP Engineering output and store in event log
   */
  processEngineeringOutput(
    sessionId: string,
    planId: string,
    output: string
  ): VPInvocationResult {
    try {
      const tasks = this.parseTasks(output);

      const writer = new EventWriter(this.eventsDir, sessionId, this.worktree);

      // Write tasks
      for (const task of tasks) {
        writer.write('engineering_tasks', 'INSERT', {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          plan_id: planId,
          milestone_id: task.milestone_id,
          description: task.description,
          file_paths: JSON.stringify(task.file_paths),
          dependencies: JSON.stringify(task.dependencies),
        });
      }

      return {
        success: true,
        tasks,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process VP Ops output and store in event log
   */
  processOpsOutput(sessionId: string, output: string): VPInvocationResult {
    try {
      const checkpoints = this.parseCheckpoints(output);
      const concerns = this.parseConcerns(output);

      return {
        success: true,
        checkpoints,
        concerns,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process VP Ops brainstorm output
   */
  processOpsBrainstormOutput(
    sessionId: string,
    output: string
  ): VPInvocationResult {
    try {
      const blockers = this.parseBlockers(output);
      const recommendation = this.parseRecommendation(output);
      const reasoning = this.parseReasoning(output);

      return {
        success: true,
        blockers,
        recommendation,
        reasoning,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==========================================================================
  // PARSERS
  // ==========================================================================

  private parsePhases(output: string): ParsedPhase[] {
    const phases: ParsedPhase[] = [];
    const phaseSection = this.extractSection(output, 'PHASES');
    if (!phaseSection) return phases;

    // Match phase headers like "### Phase 1: Foundation"
    const phaseMatches = phaseSection.matchAll(
      /###\s+(.+?)\n(?:Description:\s*(.+?)\n)?(?:Sequence:\s*(\d+)\n)?(?:Acceptance Criteria:\n((?:- .+\n?)+))?/gi
    );

    for (const match of phaseMatches) {
      const name = match[1].trim();
      const description = match[2]?.trim() || '';
      const sequence = parseInt(match[3] || '1', 10);
      const criteriaText = match[4] || '';
      const acceptance_criteria = criteriaText
        .split('\n')
        .filter((l) => l.startsWith('-'))
        .map((l) => l.replace(/^-\s*/, '').trim());

      phases.push({ name, description, sequence, acceptance_criteria });
    }

    return phases;
  }

  private parseMilestones(output: string): ParsedMilestone[] {
    const milestones: ParsedMilestone[] = [];
    const section = this.extractSection(output, 'MILESTONES');
    if (!section) return milestones;

    const matches = section.matchAll(
      /###\s+(.+?)\n(?:Description:\s*(.+?)\n)?(?:Phase:\s*(.+?)\n)?(?:Sequence:\s*(\d+))?/gi
    );

    for (const match of matches) {
      milestones.push({
        name: match[1].trim(),
        description: match[2]?.trim() || '',
        phase_name: match[3]?.trim() || '',
        sequence: parseInt(match[4] || '1', 10),
      });
    }

    return milestones;
  }

  private parseRisks(output: string): ParsedRisk[] {
    const risks: ParsedRisk[] = [];
    const section = this.extractSection(output, 'RISKS');
    if (!section) return risks;

    const matches = section.matchAll(
      /###\s+(.+?)\n(?:Description:\s*(.+?)\n)?(?:Mitigation:\s*(.+?)\n)?(?:Severity:\s*(high|medium|low))?/gi
    );

    for (const match of matches) {
      risks.push({
        description: match[2]?.trim() || match[1].trim(),
        mitigation: match[3]?.trim() || '',
        severity: (match[4]?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
      });
    }

    return risks;
  }

  private parseTasks(output: string): ParsedTask[] {
    const tasks: ParsedTask[] = [];
    const section = this.extractSection(output, 'TASKS');
    if (!section) return tasks;

    const matches = section.matchAll(
      /###\s+(.+?)\n(?:Milestone:\s*(.+?)\n)?(?:File Paths:\s*(.+?)\n)?(?:Dependencies:\s*(.+?)\n)?(?:Test Requirements:\s*(.+?))?(?=\n###|\n##|$)/gis
    );

    for (const match of matches) {
      const filePaths = match[3]
        ? match[3]
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : [];
      const dependencies = match[4]?.toLowerCase() === 'none' ? [] : (match[4]?.split(',').map((d) => d.trim()) || []);

      tasks.push({
        description: match[1].trim(),
        milestone_id: match[2]?.trim() || '',
        file_paths: filePaths,
        dependencies,
        test_requirements: match[5]?.trim() || '',
      });
    }

    return tasks;
  }

  private parseCheckpoints(output: string): ParsedCheckpoint[] {
    const checkpoints: ParsedCheckpoint[] = [];
    const section = this.extractSection(output, 'SCHEDULE');
    if (!section) return checkpoints;

    const matches = section.matchAll(/###\s+(.+?)\n(?:Criteria:\s*(.+?))?(?=\n###|\n##|$)/gis);

    for (const match of matches) {
      checkpoints.push({
        name: match[1].trim(),
        criteria: match[2]?.trim() || '',
      });
    }

    return checkpoints;
  }

  private parseConcerns(output: string): string {
    const section = this.extractSection(output, 'OPERATIONAL CONCERNS');
    return section || '';
  }

  private parseBlockers(output: string): string {
    const section = this.extractSection(output, 'BLOCKERS');
    return section || '';
  }

  private parseRecommendation(output: string): string {
    const section = this.extractSection(output, 'RECOMMENDATION');
    if (!section) return '';
    return section.split('\n')[0]?.trim() || '';
  }

  private parseReasoning(output: string): string {
    const section = this.extractSection(output, 'REASONING');
    return section || '';
  }

  private extractSection(output: string, sectionName: string): string | null {
    const regex = new RegExp(
      `##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##[^#]|$)`,
      'i'
    );
    const match = output.match(regex);
    return match ? match[1].trim() : null;
  }
}
