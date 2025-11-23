/**
 * boardroom:approve CLI Command
 *
 * Approves all VP plans for a session and marks session as complete.
 *
 * Usage:
 *   pnpm boardroom:approve --session <id> [--events <dir>]
 */

import { parseArgs } from 'util';
import { execSync } from 'child_process';
import { CLIFormatter } from '../cli/formatter';
import { SessionManager } from '../cli/session-manager';
import { EventWriter } from '../events/writer';
import { EventReader } from '../events/reader';
import type { InsertEvent } from '../events/types';

// Parse arguments
const { values } = parseArgs({
  options: {
    session: { type: 'string', short: 's' },
    events: { type: 'string', default: 'data/events' },
  },
});

const sessionId = values.session;
const eventsDir = values.events!;

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

if (session.status !== 'active') {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Session is not active: ${session.status}`,
      status: [{ label: 'Session must be active to approve', success: false }],
    })
  );
  process.exit(1);
}

// Load VP plans
const reader = new EventReader(eventsDir);
const allEvents = reader.readAll();
const vpPlanEvents = allEvents.filter(
  (e) =>
    e.table === 'vp_plans' &&
    e.op === 'INSERT' &&
    (e as InsertEvent).data.session_id === sessionId
) as InsertEvent[];

// Update plan statuses to approved
const writer = new EventWriter(eventsDir, sessionId, worktree);
const approvedPlans: string[] = [];

for (const planEvent of vpPlanEvents) {
  const planId = planEvent.data.id as string;
  const vpType = planEvent.data.vp_type as string;

  writer.write('vp_plans', 'UPDATE', { status: 'approved' }, planId);
  approvedPlans.push(`${vpType.toUpperCase()} (${planId})`);
}

// Complete session
sessionManager.completeSession(sessionId);

// Output formatted CLI response
const output = CLIFormatter.format({
  title: 'BOARDROOM SESSION APPROVED',
  content: [
    CLIFormatter.table([
      { key: 'Session ID', value: sessionId },
      { key: 'Proposal', value: session.proposal_path },
      { key: 'Plans Approved', value: String(approvedPlans.length) },
    ]),
    '',
    '## APPROVED PLANS',
    '',
    CLIFormatter.bullet(approvedPlans),
  ].join('\n'),
  status: [
    ...approvedPlans.map((p) => ({ label: `Approved: ${p}`, success: true })),
    { label: 'Session marked complete', success: true },
  ],
  nextStep: [
    'All VP plans have been approved and the session is complete.',
    '',
    'To view session details:',
    `  pnpm boardroom:status --session ${sessionId}`,
    '',
    'To generate plan documents:',
    `  pnpm boardroom:generate --session ${sessionId}`,
  ],
});

console.log(output);
