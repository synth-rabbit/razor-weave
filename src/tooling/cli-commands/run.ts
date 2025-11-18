#!/usr/bin/env node

/**
 * Simple CLI runner for testing persona commands
 * Usage:
 *   pnpm tsx src/tooling/cli-commands/run.ts hydrate-core
 *   pnpm tsx src/tooling/cli-commands/run.ts generate 10 --seed=42
 *   pnpm tsx src/tooling/cli-commands/run.ts stats
 */

import { hydrateCore, generate, stats } from './personas.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'hydrate-core') {
      await hydrateCore();
    } else if (command === 'generate') {
      const count = parseInt(args[1], 10);
      if (isNaN(count) || count <= 0) {
        console.error('Error: Please provide a valid count for generate command');
        console.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts generate <count> [--seed=<number>]');
        process.exit(1);
      }

      const options: { seed?: number; batchSize?: number } = {};

      for (let i = 2; i < args.length; i++) {
        if (args[i].startsWith('--seed=')) {
          options.seed = parseInt(args[i].split('=')[1], 10);
        } else if (args[i].startsWith('--batch-size=')) {
          options.batchSize = parseInt(args[i].split('=')[1], 10);
        }
      }

      await generate(count, options);
    } else if (command === 'stats') {
      await stats();
    } else {
      console.error('Unknown command:', command);
      console.error('Available commands:');
      console.error('  hydrate-core                             - Load all core personas');
      console.error('  generate <count> [--seed=N]              - Generate N personas');
      console.error('  stats                                     - Show persona statistics');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
