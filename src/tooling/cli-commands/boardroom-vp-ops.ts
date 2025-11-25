/**
 * boardroom:vp-ops CLI Command
 *
 * Prepares VP Operations invocation for an existing session.
 * Loads both VP Product and VP Engineering plans to provide context.
 * Also supports brainstorm mode for design questions.
 *
 * Usage:
 *   pnpm boardroom:vp-ops --session <id> [--events <dir>] [--feedback <text>]
 *   pnpm boardroom:vp-ops --session <id> --brainstorm --question <text> --options <a,b,c>
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
    brainstorm: { type: 'boolean', short: 'b' },
    question: { type: 'string', short: 'q' },
    options: { type: 'string', short: 'o' },
  },
});

const sessionId = values.session;
const eventsDir = resolveFromRoot(values.events!);
const ceoFeedback = values.feedback;
const brainstormMode = values.brainstorm;
const question = values.question;
const optionsStr = values.options;

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

if (brainstormMode && (!question || !optionsStr)) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Brainstorm mode requires --question and --options',
      status: [{ label: 'Question and options required', success: false }],
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

// Prepare VP Ops invocation
const invoker = new VPInvoker(eventsDir, worktree);

let invocationContext;
if (brainstormMode) {
  const options = optionsStr!.split(',').map((o) => o.trim());
  invocationContext = invoker.prepareOpsInvocation({
    sessionId,
    brainstormMode: true,
    question: question!,
    options,
  });
} else {
  // Load plans from events
  const reader = new EventReader(eventsDir);
  const allEvents = reader.readAll();

  const phaseEvents = allEvents.filter(
    (e) => e.table === 'phases' && e.op === 'INSERT'
  ) as InsertEvent[];
  const taskEvents = allEvents.filter(
    (e) => e.table === 'engineering_tasks' && e.op === 'INSERT'
  ) as InsertEvent[];

  invocationContext = invoker.prepareOpsInvocation({
    sessionId,
    productPlan: { phases: phaseEvents.map((e) => e.data) },
    engineeringPlan: { tasks: taskEvents.map((e) => e.data) },
    ceoFeedback,
  });
}

// Output formatted CLI response
const title = brainstormMode ? 'VP OPS BRAINSTORM READY' : 'VP OPERATIONS INVOCATION READY';
const nextStepContent = brainstormMode
  ? [
      'Invoke VP Operations as a subagent with the prompt above.',
      'VP Ops will analyze each option and provide:',
      '  - Operational perspective on each option',
      '  - Any BLOCKERS (options that are infeasible)',
      '  - A recommendation with reasoning',
      '',
      'Present VP Ops response to the CEO for final decision.',
    ]
  : [
      'Invoke VP Operations as a subagent with the prompt above.',
      'VP Operations will create:',
      '  - Schedule with checkpoints',
      '  - Workflow sequence',
      '  - Human gate locations',
      '',
      'After VP Operations completes, run:',
      `  pnpm boardroom:approve --session ${sessionId}`,
    ];

const output = CLIFormatter.format({
  title,
  content: [
    CLIFormatter.table([
      { key: 'Session ID', value: sessionId },
      { key: 'Mode', value: brainstormMode ? 'Brainstorm' : 'Operations' },
      { key: 'Worktree', value: worktree },
    ]),
    '',
    brainstormMode ? `## QUESTION\n\n${question}` : '',
    brainstormMode ? `## OPTIONS\n\n${optionsStr!.split(',').map((o, i) => `${String.fromCharCode(65 + i)}) ${o.trim()}`).join('\n')}` : '',
    '',
    '## VP OPS PROMPT',
    '',
    '```',
    invocationContext.prompt,
    '```',
  ].join('\n'),
  status: [
    { label: 'Session loaded', success: true },
    { label: brainstormMode ? 'Brainstorm mode active' : 'Plans loaded', success: true },
    { label: 'VP Ops prompt prepared', success: true },
    { label: 'Awaiting VP Ops response', pending: true },
  ],
  nextStep: nextStepContent,
});

console.log(output);
