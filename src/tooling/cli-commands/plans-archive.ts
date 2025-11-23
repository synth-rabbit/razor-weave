#!/usr/bin/env tsx
// src/tooling/cli-commands/plans-archive.ts
// Archive completed plans older than N days

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { archiveCompletedPlans } from '../plans/lifecycle.js';

function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

const { values } = parseArgs({
  options: {
    days: { type: 'string', short: 'd', default: '7' },
    'dry-run': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' }
  },
  strict: true
});

if (values.help) {
  console.log(`
Usage: pnpm plans:archive [options]

Options:
  -d, --days <n>    Archive plans older than N days (default: 7)
  --dry-run         Show what would be archived without doing it
  -h, --help        Show this help
`);
  process.exit(0);
}

const projectRoot = getProjectRoot();
const plansDir = resolve(projectRoot, 'docs/plans');
const archiveDir = resolve(projectRoot, 'docs/plans/archive');
const daysOld = parseInt(values.days || '7', 10);

console.log(`Archiving completed plans older than ${daysOld} days...`);
console.log(`Plans directory: ${plansDir}`);
console.log(`Archive directory: ${archiveDir}`);

if (values['dry-run']) {
  console.log('[DRY RUN MODE]');
}

const archived = archiveCompletedPlans(plansDir, archiveDir, daysOld);

if (archived.length === 0) {
  console.log('\nNo plans to archive.');
} else {
  console.log(`\nArchived ${archived.length} plan(s):`);
  for (const file of archived) {
    console.log(`  - ${file}`);
  }
}
