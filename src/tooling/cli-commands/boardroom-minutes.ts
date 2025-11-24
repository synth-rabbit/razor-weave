/**
 * boardroom:minutes CLI Command
 *
 * Generates formal board meeting minutes from a completed boardroom session.
 * Creates a professional document suitable for company records.
 *
 * Usage:
 *   pnpm boardroom:minutes --session <id> [--events <dir>] [--output <dir>]
 */

import { parseArgs } from 'util';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, isAbsolute, join, dirname } from 'path';
import { CLIFormatter } from '../cli/formatter';
import { EventReader } from '../events/reader';
import { BoardroomClient } from '../boardroom/client';
import type { InsertEvent } from '../events/types';

// Get project root (git root or fallback to cwd)
function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

// Resolve path from project root
function resolveFromRoot(filepath: string): string {
  if (isAbsolute(filepath)) {
    return filepath;
  }
  return resolve(getProjectRoot(), filepath);
}

// Parse arguments
const { values } = parseArgs({
  options: {
    session: { type: 'string', short: 's' },
    events: { type: 'string', default: 'data/events' },
    output: { type: 'string', short: 'o', default: 'docs/plans/generated' },
  },
});

const sessionId = values.session;
const eventsDir = resolveFromRoot(values.events!);
const outputDir = resolveFromRoot(values.output!);

// Validate arguments
if (!sessionId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --session <id>',
      status: [{ label: 'Session ID required', success: false }],
    })
  );
  process.exit(1);
}

// Detect worktree
let worktree = 'main';
try {
  worktree = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
} catch {
  // Fallback to main
}

// Load session data from events
const reader = new EventReader(eventsDir);
const allEvents = reader.readAll();

// Find session
const sessionEvent = allEvents.find(
  (e) => e.table === 'boardroom_sessions' && e.op === 'INSERT' && (e as InsertEvent).data.id === sessionId
) as InsertEvent | undefined;

if (!sessionEvent) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Session not found: ${sessionId}`,
      status: [{ label: 'Session does not exist', success: false }],
    })
  );
  process.exit(1);
}

const session = sessionEvent.data;

// Load VP plans
const vpPlanEvents = allEvents.filter(
  (e) => e.table === 'vp_plans' && e.op === 'INSERT' && (e as InsertEvent).data.session_id === sessionId
) as InsertEvent[];

// Load phases
const planIds = new Set(vpPlanEvents.map((e) => e.data.id as string));
const phaseEvents = allEvents.filter(
  (e) => e.table === 'phases' && e.op === 'INSERT' && planIds.has((e as InsertEvent).data.plan_id as string)
) as InsertEvent[];

// Load execution batches
const opsPlanIds = new Set(
  vpPlanEvents.filter((e) => e.data.vp_type === 'ops').map((e) => e.data.id as string)
);
const batchEvents = allEvents.filter(
  (e) => e.table === 'execution_batches' && e.op === 'INSERT' && opsPlanIds.has((e as InsertEvent).data.plan_id as string)
) as InsertEvent[];

// Load risks
const riskEvents = allEvents.filter(
  (e) => e.table === 'operational_risks' && e.op === 'INSERT' && opsPlanIds.has((e as InsertEvent).data.plan_id as string)
) as InsertEvent[];

// Generate minutes document
const date = new Date().toISOString().split('T')[0];
const phases = phaseEvents.map((e) => e.data);
const batches = batchEvents.map((e) => e.data);
const risks = riskEvents.map((e) => e.data);

// Summarize VP contributions
const vpProductPhases = phases.length;
const vpEngineeringTasks = allEvents.filter(
  (e) => e.table === 'engineering_tasks' && e.op === 'INSERT'
).length;
const vpOpsBatches = batches.length;
const highRisks = risks.filter((r) => r.severity === 'high').length;

const lines: string[] = [];

// Header
lines.push('# Board Meeting Minutes');
lines.push('');
lines.push('---');
lines.push('');
lines.push(`**Date:** ${date}`);
lines.push(`**Session ID:** ${sessionId}`);
lines.push(`**Proposal:** ${session.proposal_path}`);
lines.push(`**Status:** ${session.status}`);
lines.push('');
lines.push('---');
lines.push('');

// Attendees
lines.push('## Attendees');
lines.push('');
lines.push('- **CEO** (Chairperson)');
lines.push('- **VP Product** (Strategic Direction)');
lines.push('- **VP Engineering** (Technical Architecture)');
lines.push('- **VP Operations** (Execution Planning)');
lines.push('');
lines.push('---');
lines.push('');

// Agenda
lines.push('## Agenda');
lines.push('');
lines.push('1. Review proposal and objectives');
lines.push('2. VP Product presents phase breakdown and acceptance criteria');
lines.push('3. VP Engineering presents technical tasks and dependencies');
lines.push('4. VP Operations presents execution schedule and risk assessment');
lines.push('5. Identify blockers and action items');
lines.push('6. CEO decision and next steps');
lines.push('');
lines.push('---');
lines.push('');

// VP Product Summary
lines.push('## VP Product Report');
lines.push('');
lines.push(`VP Product identified **${vpProductPhases} phases** for this initiative.`);
lines.push('');
if (phases.length > 0) {
  lines.push('### Phases');
  lines.push('');
  for (const phase of phases.sort((a, b) => (a.sequence as number) - (b.sequence as number))) {
    lines.push(`${phase.sequence}. **${phase.name}**`);
    if (phase.description) {
      lines.push(`   - ${phase.description}`);
    }
  }
  lines.push('');
}
lines.push('---');
lines.push('');

// VP Engineering Summary
lines.push('## VP Engineering Report');
lines.push('');
lines.push(`VP Engineering defined **${vpEngineeringTasks} engineering tasks** to implement the phases.`);
lines.push('');
lines.push('*See [VP Engineering Analysis](sess_' + sessionId.replace('sess_', '') + '-vp-engineering.md) for full task list.*');
lines.push('');
lines.push('---');
lines.push('');

// VP Ops Summary
lines.push('## VP Operations Report');
lines.push('');
lines.push(`VP Operations created **${vpOpsBatches} execution batches** with **${highRisks} high-severity risks** identified.`);
lines.push('');
if (batches.length > 0) {
  lines.push('### Execution Schedule Summary');
  lines.push('');
  lines.push('| Batch | Name | Parallel Safe | Human Gate |');
  lines.push('|-------|------|---------------|------------|');
  for (const batch of batches.sort((a, b) => (a.batch_number as number) - (b.batch_number as number))) {
    lines.push(`| ${batch.batch_number} | ${batch.name} | ${batch.parallel_safe ? '✅' : '❌'} | ${batch.human_gate ? '✅' : '-'} |`);
  }
  lines.push('');
}
if (highRisks > 0) {
  lines.push('### High-Severity Risks Requiring Attention');
  lines.push('');
  for (const risk of risks.filter((r) => r.severity === 'high')) {
    lines.push(`- **${risk.description}**`);
    lines.push(`  - Mitigation: ${risk.mitigation}`);
  }
  lines.push('');
}
lines.push('---');
lines.push('');

// Blockers
lines.push('## Blockers Identified');
lines.push('');
lines.push('*Blockers are issues that must be resolved before work can proceed.*');
lines.push('');
lines.push('- Review session documents for any BLOCKER flags');
lines.push('- Check acceptance criteria for Phase 1 dependencies');
lines.push('');
lines.push('---');
lines.push('');

// Action Items
lines.push('## Action Items');
lines.push('');
lines.push('| # | Action | Owner | Due |');
lines.push('|---|--------|-------|-----|');
lines.push('| 1 | Review and approve session plan | CEO | Immediate |');
lines.push('| 2 | Begin Phase 1 implementation | Engineering | After approval |');
lines.push('| 3 | Monitor execution against schedule | Operations | Ongoing |');
lines.push('');
lines.push('---');
lines.push('');

// Decision
lines.push('## CEO Decision');
lines.push('');
lines.push('**Status:** Pending approval');
lines.push('');
lines.push('To approve this session:');
lines.push('```');
lines.push(`pnpm boardroom:approve --session ${sessionId}`);
lines.push('```');
lines.push('');
lines.push('---');
lines.push('');

// Footer
lines.push('## Next Meeting');
lines.push('');
lines.push('The next board meeting will be scheduled after Phase 1 completion for progress review.');
lines.push('');
lines.push('---');
lines.push('');
lines.push(`*Minutes generated on ${new Date().toISOString()}*`);
lines.push('');

// Save to file
const content = lines.join('\n');
const filename = `${sessionId}-minutes.md`;
const filePath = join(outputDir, filename);

// Ensure directory exists
const dir = dirname(filePath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

writeFileSync(filePath, content, 'utf-8');

// Also save to events for record keeping
const client = new BoardroomClient(eventsDir, sessionId, worktree);
client.createBoardroomMinutes(sessionId, {
  attendees: ['CEO', 'VP Product', 'VP Engineering', 'VP Operations'],
  agenda: [
    'Review proposal and objectives',
    'VP Product phase breakdown',
    'VP Engineering technical tasks',
    'VP Operations execution schedule',
    'Identify blockers',
    'CEO decision',
  ],
  vpProductSummary: `${vpProductPhases} phases defined`,
  vpEngineeringSummary: `${vpEngineeringTasks} engineering tasks`,
  vpOpsSummary: `${vpOpsBatches} batches, ${highRisks} high-severity risks`,
  decisions: ['Pending CEO approval'],
  actionItems: [
    'Review and approve session plan',
    'Begin Phase 1 implementation after approval',
    'Monitor execution against schedule',
  ],
  blockers: [],
  nextSteps: 'Await CEO approval, then begin Phase 1',
});

// Output success
console.log(
  CLIFormatter.format({
    title: 'BOARD MINUTES GENERATED',
    content: [
      CLIFormatter.table([
        { key: 'Session ID', value: sessionId },
        { key: 'Output File', value: filePath },
        { key: 'Phases', value: String(vpProductPhases) },
        { key: 'Tasks', value: String(vpEngineeringTasks) },
        { key: 'Batches', value: String(vpOpsBatches) },
        { key: 'High Risks', value: String(highRisks) },
      ]),
    ].join('\n'),
    status: [
      { label: 'Minutes document created', success: true },
      { label: 'Events recorded', success: true },
    ],
    nextStep: [
      'Review the minutes document:',
      `  cat ${filePath}`,
      '',
      'To approve this session:',
      `  pnpm boardroom:approve --session ${sessionId}`,
    ],
  })
);
