/**
 * boardroom:vp-product CLI Command
 *
 * Initiates a boardroom session and prepares VP Product invocation.
 * Outputs formatted CLI instructions for Claude Code orchestration.
 *
 * Usage:
 *   pnpm boardroom:vp-product --proposal <path> [--events <dir>]
 */

import { parseArgs } from 'util';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, isAbsolute } from 'path';
import { CLIFormatter } from '../cli/formatter';
import { SessionManager } from '../cli/session-manager';
import { VPInvoker } from '../agents/invoker';

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
    proposal: { type: 'string', short: 'p' },
    events: { type: 'string', default: 'data/events' },
  },
});

const proposalPathArg = values.proposal;
const eventsDir = resolveFromRoot(values.events!);

// Validate arguments
if (!proposalPathArg) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: 'Missing required argument: --proposal <path>',
      status: [{ label: 'Proposal path required', success: false }],
    })
  );
  process.exit(1);
}

// Resolve proposal path from project root
const proposalPath = resolveFromRoot(proposalPathArg);

if (!existsSync(proposalPath)) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Proposal file not found: ${proposalPath}`,
      status: [{ label: 'File does not exist', success: false }],
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

// Read proposal
const proposalContent = readFileSync(proposalPath, 'utf-8');

// Create session
const sessionManager = new SessionManager(eventsDir, worktree);
const session = sessionManager.startSession(proposalPath);

// Prepare VP Product invocation
const invoker = new VPInvoker(eventsDir, worktree);
const invocationContext = invoker.prepareProductInvocation({
  proposalPath,
  proposalContent,
  sessionId: session.id,
});

// Output formatted CLI response
const output = CLIFormatter.format({
  title: 'VP PRODUCT INVOCATION READY',
  content: [
    CLIFormatter.table([
      { key: 'Session ID', value: session.id },
      { key: 'Proposal', value: proposalPath },
      { key: 'Worktree', value: worktree },
    ]),
    '',
    '## VP PRODUCT PROMPT',
    '',
    '```',
    invocationContext.prompt,
    '```',
  ].join('\n'),
  status: [
    { label: 'Session created', success: true },
    { label: 'Proposal loaded', success: true },
    { label: 'VP Product prompt prepared', success: true },
    { label: 'Awaiting VP Product response', pending: true },
  ],
  nextStep: [
    'Invoke VP Product as a subagent with the prompt above.',
    'VP Product will analyze the proposal and create:',
    '  - Phases with acceptance criteria',
    '  - Milestones within each phase',
    '  - Risk assessment',
    '',
    'After VP Product completes, run:',
    `  pnpm boardroom:vp-engineering --session ${session.id}`,
  ],
});

console.log(output);
