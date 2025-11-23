/**
 * boardroom:generate CLI Command
 *
 * Generates plan documents for a completed boardroom session.
 *
 * Usage:
 *   pnpm boardroom:generate --session <id> [--events <dir>] [--output <dir>]
 */

import { parseArgs } from 'util';
import { CLIFormatter } from '../cli/formatter';
import { PlanGenerator } from '../plans/generator';

// Parse arguments
const { values } = parseArgs({
  options: {
    session: { type: 'string', short: 's' },
    events: { type: 'string', default: 'data/events' },
    output: { type: 'string', short: 'o', default: 'docs/plans/generated' },
  },
});

const sessionId = values.session;
const eventsDir = values.events!;
const outputDir = values.output!;

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

try {
  const generator = new PlanGenerator(eventsDir);
  const files = generator.generateAll(sessionId, outputDir);

  const output = CLIFormatter.format({
    title: 'PLAN DOCUMENTS GENERATED',
    content: [
      CLIFormatter.table([
        { key: 'Session ID', value: sessionId },
        { key: 'Output Directory', value: outputDir },
        { key: 'Files Generated', value: String(files.length) },
      ]),
      '',
      '## Generated Files',
      '',
      CLIFormatter.bullet(files.map((f) => `${outputDir}/${f}`)),
    ].join('\n'),
    status: files.map((f) => ({ label: `Generated: ${f}`, success: true })),
    nextStep: [
      'Plan documents have been generated.',
      '',
      'Next steps:',
      '1. Review generated documents',
      '2. Commit to git if satisfied',
      '3. Begin implementation',
    ],
  });

  console.log(output);
} catch (error) {
  console.error(
    CLIFormatter.format({
      title: 'ERROR',
      content: `Failed to generate plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: [{ label: 'Generation failed', success: false }],
    })
  );
  process.exit(1);
}
