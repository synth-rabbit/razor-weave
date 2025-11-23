#!/usr/bin/env tsx
// src/tooling/cli-commands/plans-index.ts
// Generate plan index from frontmatter

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { generatePlanIndex } from '../plans/lifecycle.js';

function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

const { values } = parseArgs({
  options: {
    output: { type: 'string', short: 'o' },
    'dry-run': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' }
  },
  strict: true
});

if (values.help) {
  console.log(`
Usage: pnpm plans:index [options]

Options:
  -o, --output <path>  Output file (default: docs/plans/README.md)
  --dry-run            Show index without writing
  -h, --help           Show this help
`);
  process.exit(0);
}

const projectRoot = getProjectRoot();
const plansDir = resolve(projectRoot, 'docs/plans');
const outputPath = values.output || resolve(plansDir, 'README.md');

console.log(`Generating plan index...`);
console.log(`Plans directory: ${plansDir}`);

const index = generatePlanIndex(plansDir);

if (values['dry-run']) {
  console.log('\n[DRY RUN] Generated index:\n');
  console.log(index);
} else {
  writeFileSync(outputPath, index);
  console.log(`\nIndex written to: ${outputPath}`);
}
