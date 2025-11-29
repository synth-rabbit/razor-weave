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
import { resolve, isAbsolute } from 'path';
import { CLIFormatter } from '../cli/formatter';
import { SessionManager } from '../cli/session-manager';
import { EventWriter, EventReader, Materializer } from '@razorweave/events';
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
    db: { type: 'string', default: 'data/project.db' },
  },
});

const sessionId = values.session;
const eventsDir = resolveFromRoot(values.events!);
const dbPath = resolveFromRoot(values.db!);

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

// Auto-materialize database
const materializer = new Materializer(eventsDir, dbPath);

// Register all boardroom tables
materializer.registerTable('boardroom_sessions', 'id');
materializer.registerTable('vp_plans', 'id');
materializer.registerTable('phases', 'id');
materializer.registerTable('milestones', 'id');
materializer.registerTable('engineering_tasks', 'id');
materializer.registerTable('ceo_feedback', 'id');
materializer.registerTable('brainstorm_opinions', 'id');
materializer.registerTable('vp_consultations', 'id');

// Register VP Ops tables
materializer.registerTable('execution_batches', 'id');
materializer.registerTable('operational_risks', 'id');
materializer.registerTable('boardroom_minutes', 'id');

// Register checkpoint table
materializer.registerTable('session_checkpoints', 'id');

materializer.materialize();

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
    { label: 'Database materialized', success: true },
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
