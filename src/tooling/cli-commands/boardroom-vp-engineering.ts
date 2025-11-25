/**
 * boardroom:vp-engineering CLI Command
 *
 * Prepares VP Engineering invocation for an existing session.
 * Loads VP Product's plan and CEO feedback to provide context.
 *
 * Usage:
 *   pnpm boardroom:vp-engineering --session <id> [--events <dir>] [--feedback <text>]
 */

import { parseArgs } from 'util';
import { execSync } from 'child_process';
import { resolve, isAbsolute } from 'path';
import { CLIFormatter } from '../cli/formatter';
import { SessionManager } from '../cli/session-manager';
import { VPInvoker } from '../agents/invoker';
import { EventReader } from '@razorweave/events';
import type { InsertEvent } from '@razorweave/events';

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
    feedback: { type: 'string', short: 'f' },
  },
});

const sessionId = values.session;
const eventsDir = resolveFromRoot(values.events!);
const ceoFeedback = values.feedback;

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
  // Fallback to main if not in git repo
}

// Load session
const sessionManager = new SessionManager(eventsDir, worktree);
const session = sessionManager.getSession(sessionId);

if (!session) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Session not found: ${sessionId}`,
      status: [{ label: 'Session does not exist', success: false }],
    })
  );
  process.exit(1);
}

// Load VP Product's plan data from events
const reader = new EventReader(eventsDir);
const allEvents = reader.readAll();

// Find product plan
const vpPlanEvents = allEvents.filter(
  (e) => e.table === 'vp_plans' && e.op === 'INSERT'
) as InsertEvent[];
const productPlanEvent = vpPlanEvents.find(
  (e) => e.data.session_id === sessionId && e.data.vp_type === 'product'
);

if (!productPlanEvent) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `No VP Product plan found for session: ${sessionId}`,
      status: [{ label: 'VP Product plan required first', success: false }],
      nextStep: `Run: pnpm boardroom:vp-product --proposal <path>`,
    })
  );
  process.exit(1);
}

const productPlanId = productPlanEvent.data.id as string;

// Load phases for this plan
const phaseEvents = allEvents.filter(
  (e) =>
    e.table === 'phases' &&
    e.op === 'INSERT' &&
    (e as InsertEvent).data.plan_id === productPlanId
) as InsertEvent[];

const phases = phaseEvents.map((e) => ({
  name: e.data.name as string,
  description: e.data.description as string,
  sequence: e.data.sequence as number,
  acceptance_criteria: e.data.acceptance_criteria as string,
}));

// Load milestones
const milestoneEvents = allEvents.filter(
  (e) => e.table === 'milestones' && e.op === 'INSERT'
) as InsertEvent[];

const milestones = milestoneEvents
  .filter((e) => phaseEvents.some((p) => p.data.id === e.data.phase_id))
  .map((e) => ({
    name: e.data.name as string,
    description: e.data.description as string,
    phase_id: e.data.phase_id as string,
  }));

// Prepare VP Engineering invocation
const invoker = new VPInvoker(eventsDir, worktree);
const invocationContext = invoker.prepareEngineeringInvocation({
  sessionId,
  productPlan: {
    phases: phases.map((p) => ({ name: p.name, description: p.description })),
    milestones: milestones.map((m) => ({ name: m.name, phase_id: m.phase_id })),
  },
  ceoFeedback,
});

// Output formatted CLI response
const output = CLIFormatter.format({
  title: 'VP ENGINEERING INVOCATION READY',
  content: [
    CLIFormatter.table([
      { key: 'Session ID', value: sessionId },
      { key: 'Product Plan ID', value: productPlanId },
      { key: 'Phases', value: String(phases.length) },
      { key: 'Worktree', value: worktree },
    ]),
    '',
    '## PRODUCT PLAN SUMMARY',
    '',
    ...phases.map((p) => `### ${p.name}\n${p.description || 'No description'}`),
    '',
    '## VP ENGINEERING PROMPT',
    '',
    '```',
    invocationContext.prompt,
    '```',
  ].join('\n'),
  status: [
    { label: 'Session loaded', success: true },
    { label: 'VP Product plan loaded', success: true },
    { label: `${phases.length} phases found`, success: phases.length > 0 },
    { label: 'VP Engineering prompt prepared', success: true },
    { label: 'Awaiting VP Engineering response', pending: true },
  ],
  nextStep: [
    'Invoke VP Engineering as a subagent with the prompt above.',
    'VP Engineering will create:',
    '  - Engineering tasks mapped to milestones',
    '  - File paths for each task',
    '  - Task dependencies',
    '',
    'After VP Engineering completes, run:',
    `  pnpm boardroom:vp-ops --session ${sessionId}`,
  ],
});

console.log(output);
