/**
 * Plan Generator
 *
 * Generates human-readable markdown documents from boardroom session data.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { EventReader } from '../events/reader';
import type { InsertEvent, UpdateEvent, DatabaseEvent } from '../events/types';
import type { VPType } from '../boardroom/types';

interface SessionData {
  id: string;
  proposal_path: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface PhaseData {
  id: string;
  plan_id: string;
  name: string;
  description: string;
  sequence: number;
  acceptance_criteria: string[];
}

interface MilestoneData {
  id: string;
  phase_id: string;
  name: string;
  description: string;
  sequence: number;
}

interface TaskData {
  id: string;
  plan_id: string;
  milestone_id: string;
  description: string;
  file_paths: string[];
  dependencies: string[];
}

export class PlanGenerator {
  private reader: EventReader;

  constructor(eventsDir: string) {
    this.reader = new EventReader(eventsDir);
  }

  /**
   * Generate a summary document for a boardroom session
   */
  generateSessionSummary(sessionId: string): string {
    const session = this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const phases = this.loadPhases(sessionId);
    const milestones = this.loadMilestones(phases.map((p) => p.id));
    const tasks = this.loadTasks(sessionId);

    const lines: string[] = [];

    // Header
    lines.push(`# Boardroom Session Summary`);
    lines.push('');
    lines.push(`**Session ID:** ${session.id}`);
    lines.push(`**Status:** ${session.status}`);
    lines.push(`**Proposal:** ${session.proposal_path}`);
    lines.push(`**Created:** ${session.created_at}`);
    if (session.completed_at) {
      lines.push(`**Completed:** ${session.completed_at}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    // Phases
    if (phases.length > 0) {
      lines.push('## Phases');
      lines.push('');

      for (const phase of phases.sort((a, b) => a.sequence - b.sequence)) {
        lines.push(`### ${phase.name}`);
        lines.push('');
        if (phase.description) {
          lines.push(phase.description);
          lines.push('');
        }

        // Acceptance criteria
        if (phase.acceptance_criteria.length > 0) {
          lines.push('**Acceptance Criteria:**');
          for (const criterion of phase.acceptance_criteria) {
            lines.push(`- ${criterion}`);
          }
          lines.push('');
        }

        // Milestones for this phase
        const phaseMilestones = milestones.filter((m) => m.phase_id === phase.id);
        if (phaseMilestones.length > 0) {
          lines.push('**Milestones:**');
          for (const ms of phaseMilestones.sort((a, b) => a.sequence - b.sequence)) {
            lines.push(`- ${ms.name}: ${ms.description || 'No description'}`);
          }
          lines.push('');
        }
      }
    }

    // Tasks summary
    if (tasks.length > 0) {
      lines.push('## Engineering Tasks');
      lines.push('');
      lines.push(`Total tasks: ${tasks.length}`);
      lines.push('');

      for (const task of tasks) {
        lines.push(`- **${task.description}**`);
        if (task.file_paths.length > 0) {
          lines.push(`  - Files: ${task.file_paths.join(', ')}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate a VP-specific plan document
   */
  generateVPPlan(sessionId: string, vpType: VPType): string {
    const session = this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const lines: string[] = [];

    lines.push(`# VP ${vpType.charAt(0).toUpperCase() + vpType.slice(1)} Plan`);
    lines.push('');
    lines.push(`**Session:** ${sessionId}`);
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    if (vpType === 'product') {
      const phases = this.loadPhases(sessionId);
      const milestones = this.loadMilestones(phases.map((p) => p.id));

      lines.push('## Phases');
      lines.push('');

      for (const phase of phases.sort((a, b) => a.sequence - b.sequence)) {
        lines.push(`### ${phase.sequence}. ${phase.name}`);
        lines.push('');
        if (phase.description) {
          lines.push(phase.description);
          lines.push('');
        }

        if (phase.acceptance_criteria.length > 0) {
          lines.push('**Acceptance Criteria:**');
          for (const c of phase.acceptance_criteria) {
            lines.push(`- [ ] ${c}`);
          }
          lines.push('');
        }

        const phaseMilestones = milestones.filter((m) => m.phase_id === phase.id);
        if (phaseMilestones.length > 0) {
          lines.push('**Milestones:**');
          for (const ms of phaseMilestones) {
            lines.push(`1. ${ms.name}`);
          }
          lines.push('');
        }
      }
    } else if (vpType === 'engineering') {
      const tasks = this.loadTasks(sessionId);

      lines.push('## Engineering Tasks');
      lines.push('');

      for (const task of tasks) {
        lines.push(`### ${task.description}`);
        lines.push('');
        if (task.file_paths.length > 0) {
          lines.push('**Files:**');
          for (const f of task.file_paths) {
            lines.push(`- \`${f}\``);
          }
          lines.push('');
        }
        if (task.dependencies.length > 0) {
          lines.push(`**Dependencies:** ${task.dependencies.join(', ')}`);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Save markdown content to a file
   */
  saveToFile(content: string, filePath: string): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Generate all documents for a session
   */
  generateAll(sessionId: string, outputDir: string): string[] {
    const files: string[] = [];

    // Session summary
    const summaryContent = this.generateSessionSummary(sessionId);
    const summaryFile = `${sessionId}-summary.md`;
    this.saveToFile(summaryContent, join(outputDir, summaryFile));
    files.push(summaryFile);

    // VP Product plan
    try {
      const productContent = this.generateVPPlan(sessionId, 'product');
      const productFile = `${sessionId}-vp-product.md`;
      this.saveToFile(productContent, join(outputDir, productFile));
      files.push(productFile);
    } catch {
      // No product plan
    }

    // VP Engineering plan
    try {
      const engContent = this.generateVPPlan(sessionId, 'engineering');
      const engFile = `${sessionId}-vp-engineering.md`;
      this.saveToFile(engContent, join(outputDir, engFile));
      files.push(engFile);
    } catch {
      // No engineering plan
    }

    return files;
  }

  // ==========================================================================
  // Data Loading
  // ==========================================================================

  private loadSession(sessionId: string): SessionData | null {
    const events = this.reader.readByTable('boardroom_sessions');
    const sessionState = new Map<string, SessionData>();

    for (const event of events) {
      if (event.op === 'INSERT') {
        const e = event as InsertEvent;
        if (e.data.id === sessionId) {
          sessionState.set(sessionId, e.data as unknown as SessionData);
        }
      } else if (event.op === 'UPDATE') {
        const e = event as UpdateEvent;
        if (e.key === sessionId && sessionState.has(sessionId)) {
          const current = sessionState.get(sessionId)!;
          sessionState.set(sessionId, { ...current, ...e.data } as SessionData);
        }
      }
    }

    return sessionState.get(sessionId) || null;
  }

  private loadPhases(sessionId: string): PhaseData[] {
    const events = this.reader.readAll();
    const phases: PhaseData[] = [];

    // First find plan IDs for this session
    const planIds = new Set<string>();
    for (const event of events) {
      if (event.table === 'vp_plans' && event.op === 'INSERT') {
        const e = event as InsertEvent;
        if (e.data.session_id === sessionId) {
          planIds.add(e.data.id as string);
        }
      }
    }

    // Then load phases for those plans
    for (const event of events) {
      if (event.table === 'phases' && event.op === 'INSERT') {
        const e = event as InsertEvent;
        if (planIds.has(e.data.plan_id as string)) {
          let criteria: string[] = [];
          try {
            criteria = JSON.parse((e.data.acceptance_criteria as string) || '[]');
          } catch {
            criteria = [];
          }

          phases.push({
            id: e.data.id as string,
            plan_id: e.data.plan_id as string,
            name: e.data.name as string,
            description: (e.data.description as string) || '',
            sequence: (e.data.sequence as number) || 1,
            acceptance_criteria: criteria,
          });
        }
      }
    }

    return phases;
  }

  private loadMilestones(phaseIds: string[]): MilestoneData[] {
    const events = this.reader.readByTable('milestones');
    const milestones: MilestoneData[] = [];

    for (const event of events) {
      if (event.op === 'INSERT') {
        const e = event as InsertEvent;
        if (phaseIds.includes(e.data.phase_id as string)) {
          milestones.push({
            id: e.data.id as string,
            phase_id: e.data.phase_id as string,
            name: e.data.name as string,
            description: (e.data.description as string) || '',
            sequence: (e.data.sequence as number) || 1,
          });
        }
      }
    }

    return milestones;
  }

  private loadTasks(sessionId: string): TaskData[] {
    const events = this.reader.readByTable('engineering_tasks');
    const tasks: TaskData[] = [];

    for (const event of events) {
      if (event.op === 'INSERT') {
        const e = event as InsertEvent;
        let filePaths: string[] = [];
        let dependencies: string[] = [];

        try {
          filePaths = JSON.parse((e.data.file_paths as string) || '[]');
        } catch {
          filePaths = [];
        }

        try {
          dependencies = JSON.parse((e.data.dependencies as string) || '[]');
        } catch {
          dependencies = [];
        }

        tasks.push({
          id: e.data.id as string,
          plan_id: e.data.plan_id as string,
          milestone_id: e.data.milestone_id as string,
          description: e.data.description as string,
          file_paths: filePaths,
          dependencies,
        });
      }
    }

    return tasks;
  }
}
