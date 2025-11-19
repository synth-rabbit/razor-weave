#!/usr/bin/env node

/**
 * Simple CLI runner for testing persona commands
 * Usage:
 *   pnpm tsx src/tooling/cli-commands/run.ts hydrate-core
 *   pnpm tsx src/tooling/cli-commands/run.ts generate 10 --seed=42
 *   pnpm tsx src/tooling/cli-commands/run.ts stats
 */

import { hydrateCore, generate, stats } from './personas.js';
import {
  reviewBook,
  reviewChapter,
  listCampaigns,
  viewCampaign,
  statusCampaign,
  type ListCampaignsFilters,
} from './review.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'hydrate-core') {
      hydrateCore();
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
    } else if (command === 'review') {
      const subcommand = args[1];

      if (subcommand === 'status') {
        const campaignId = args[2];
        if (!campaignId) {
          console.error('Error: Please provide a campaign ID');
          console.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review status <campaign-id>');
          process.exit(1);
        }
        statusCampaign(campaignId);
      } else if (subcommand === 'book') {
        const bookPath = args[2];
        if (!bookPath) {
          console.error('Error: Please provide a book path');
          console.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review book <path> [--personas=all_core|id1,id2]');
          process.exit(1);
        }

        const options: { personas?: string } = {};
        for (let i = 3; i < args.length; i++) {
          if (args[i].startsWith('--personas=')) {
            options.personas = args[i].split('=')[1];
          }
        }

        reviewBook(bookPath, options);
      } else if (subcommand === 'chapter') {
        const chapterPath = args[2];
        if (!chapterPath) {
          console.error('Error: Please provide a chapter path');
          console.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review chapter <path> [--personas=all_core|id1,id2]');
          process.exit(1);
        }

        const options: { personas?: string } = {};
        for (let i = 3; i < args.length; i++) {
          if (args[i].startsWith('--personas=')) {
            options.personas = args[i].split('=')[1];
          }
        }

        reviewChapter(chapterPath, options);
      } else if (subcommand === 'list') {
        const filters: Partial<ListCampaignsFilters> = {};
        for (let i = 2; i < args.length; i++) {
          if (args[i].startsWith('--status=')) {
            filters.status = args[i].split('=')[1] as ListCampaignsFilters['status'];
          } else if (args[i].startsWith('--content-type=')) {
            filters.contentType = args[i].split('=')[1] as ListCampaignsFilters['contentType'];
          }
        }

        listCampaigns(filters);
      } else if (subcommand === 'view') {
        const campaignId = args[2];
        if (!campaignId) {
          console.error('Error: Please provide a campaign ID');
          console.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review view <campaign-id> [--format=text|json]');
          process.exit(1);
        }

        const options: { format?: 'text' | 'json' } = {};
        for (let i = 3; i < args.length; i++) {
          if (args[i].startsWith('--format=')) {
            const format = args[i].split('=')[1];
            if (format === 'text' || format === 'json') {
              options.format = format;
            }
          }
        }

        viewCampaign(campaignId, options);
      } else {
        console.error('Unknown review subcommand:', subcommand);
        console.error('Available subcommands: book, chapter, list, view, status');
        process.exit(1);
      }
    } else {
      console.error('Unknown command:', command);
      console.error('Available commands:');
      console.error('  hydrate-core                             - Load all core personas');
      console.error('  generate <count> [--seed=N]              - Generate N personas');
      console.error('  stats                                     - Show persona statistics');
      console.error('  review book <path> [--personas=...]       - Review an HTML book');
      console.error('  review chapter <path> [--personas=...]    - Review a markdown chapter');
      console.error('  review list [--status=...] [--content-type=...] - List campaigns');
      console.error('  review view <id> [--format=text|json]    - View campaign details');
      console.error('  review status <id>                        - Check campaign status');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void main();
