/**
 * boardroom:status CLI Command
 *
 * Shows status of a boardroom session including all VP plans.
 *
 * Usage:
 *   pnpm boardroom:status --session <id> [--events <dir>]
 *   pnpm boardroom:status --list [--events <dir>]
 */

import { parseArgs } from 'util';
import { execSync } from 'child_process';
import { resolve, isAbsolute } from 'path';
import { CLIFormatter } from '../cli/formatter';
import { SessionManager } from '../cli/session-manager';
import { EventReader } from '@razorweave/events';
import type { InsertEvent, UpdateEvent } from '@razorweave/events';

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
    list: { type: 'boolean', short: 'l' },
  },
});

const sessionId = values.session;
const eventsDir = resolveFromRoot(values.events!);
const listMode = values.list;

// Detect worktree
let worktree = 'main';
try {
  worktree = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
} catch {
  // Fallback to main
}

const sessionManager = new SessionManager(eventsDir, worktree);

// List mode
if (listMode) {
  const sessions = sessionManager.listSessions();

  if (sessions.length === 0) {
    console.log(
      CLIFormatter.format({
        title: 'BOARDROOM SESSIONS',
        content: 'No sessions found.',
        status: [{ label: 'No active sessions', pending: true }],
        nextStep: 'Start a new session with:\n  pnpm boardroom:vp-product --proposal <path>',
      })
    );
  } else {
    const sessionList = sessions.map((s) => ({
      key: s.id,
      value: `${s.status} - ${s.proposal_path}`,
    }));

    console.log(
      CLIFormatter.format({
        title: 'BOARDROOM SESSIONS',
        content: CLIFormatter.table(sessionList),
        status: [
          { label: `${sessions.filter((s) => s.status === 'active').length} active`, success: true },
          { label: `${sessions.filter((s) => s.status === 'completed').length} completed`, success: true },
        ],
        nextStep: 'View session details with:\n  pnpm boardroom:status --session <id>',
      })
    );
  }
  process.exit(0);
}

// Validate session ID
if (!sessionId) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --session <id> or --list',
      status: [{ label: 'Session ID or --list required', success: false }],
    })
  );
  process.exit(1);
}

// Load session
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

// Load VP plans and data
const reader = new EventReader(eventsDir);
const allEvents = reader.readAll();

// Build plan status map (considering updates)
const planStatusMap = new Map<string, string>();
const planTypeMap = new Map<string, string>();

for (const event of allEvents) {
  if (event.table === 'vp_plans') {
    if (event.op === 'INSERT') {
      const e = event as InsertEvent;
      if (e.data.session_id === sessionId) {
        planStatusMap.set(e.data.id as string, e.data.status as string);
        planTypeMap.set(e.data.id as string, e.data.vp_type as string);
      }
    } else if (event.op === 'UPDATE') {
      const e = event as UpdateEvent;
      if (planStatusMap.has(e.key) && e.data.status) {
        planStatusMap.set(e.key, e.data.status as string);
      }
    }
  }
}

// Count phases and tasks
const phaseCount = allEvents.filter(
  (e) => e.table === 'phases' && e.op === 'INSERT'
).length;
const taskCount = allEvents.filter(
  (e) => e.table === 'engineering_tasks' && e.op === 'INSERT'
).length;

// Build status items
const statusItems = [];
for (const [planId, status] of planStatusMap) {
  const vpType = planTypeMap.get(planId) || 'unknown';
  const isApproved = status === 'approved';
  const isReviewed = status === 'reviewed';
  statusItems.push({
    label: `VP ${vpType.toUpperCase()}: ${status}`,
    success: isApproved,
    pending: !isApproved && !isReviewed,
  });
}

// Determine next step
let nextStepContent: string[];
if (session.status === 'completed') {
  nextStepContent = ['Session is complete. All plans have been approved.'];
} else if (planStatusMap.size === 0) {
  nextStepContent = [
    'No VP plans yet. Start with VP Product:',
    `  pnpm boardroom:vp-product --proposal ${session.proposal_path}`,
  ];
} else if (!planTypeMap.has('engineering') || ![...planTypeMap.values()].includes('engineering')) {
  const productPlans = [...planTypeMap.entries()].filter(([, t]) => t === 'product');
  if (productPlans.length > 0) {
    nextStepContent = [
      'VP Product plan ready. Continue with VP Engineering:',
      `  pnpm boardroom:vp-engineering --session ${sessionId}`,
    ];
  } else {
    nextStepContent = ['Continue planning...'];
  }
} else if (![...planTypeMap.values()].includes('ops')) {
  nextStepContent = [
    'VP Engineering plan ready. Continue with VP Operations:',
    `  pnpm boardroom:vp-ops --session ${sessionId}`,
  ];
} else {
  nextStepContent = [
    'All VP plans created. Ready for approval:',
    `  pnpm boardroom:approve --session ${sessionId}`,
  ];
}

// Output formatted CLI response
const output = CLIFormatter.format({
  title: 'BOARDROOM SESSION STATUS',
  content: [
    CLIFormatter.table([
      { key: 'Session ID', value: sessionId },
      { key: 'Status', value: session.status },
      { key: 'Proposal', value: session.proposal_path },
      { key: 'Created', value: session.created_at },
      { key: 'VP Plans', value: String(planStatusMap.size) },
      { key: 'Phases', value: String(phaseCount) },
      { key: 'Tasks', value: String(taskCount) },
    ]),
  ].join('\n'),
  status: statusItems.length > 0 ? statusItems : [{ label: 'No VP plans yet', pending: true }],
  nextStep: nextStepContent,
});

console.log(output);
