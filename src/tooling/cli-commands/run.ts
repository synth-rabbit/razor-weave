#!/usr/bin/env node

/**
 * Simple CLI runner for testing persona commands
 * Usage:
 *   pnpm tsx src/tooling/cli-commands/run.ts hydrate-core
 *   pnpm tsx src/tooling/cli-commands/run.ts generate 10 --seed=42
 *   pnpm tsx src/tooling/cli-commands/run.ts stats
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { hydrateCore, generate, stats } from './personas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
import { log } from '../logging/logger.js';
import Database from 'better-sqlite3';
import { BookRepository } from '../books/repository.js';
import { getVersionedSourcePath } from '../books/types.js';

/**
 * Resolve a book slug or path to an actual HTML file path.
 * If input looks like a slug (no / or . characters), look up in database.
 * Otherwise, treat as a file path.
 */
function resolveBookPath(input: string): string {
  // If it looks like a file path, use it directly
  if (input.includes('/') || input.includes('.')) {
    return input;
  }

  // Looks like a slug - try to resolve from database
  const dbPath = resolve(REPO_ROOT, 'data/project.db');
  if (!existsSync(dbPath)) {
    log.warn(`Database not found at ${dbPath}, treating input as path`);
    return input;
  }

  const db = new Database(dbPath);
  const bookRepo = new BookRepository(db);
  const book = bookRepo.getBySlug(input);
  db.close();

  if (!book) {
    log.warn(`Book with slug "${input}" not found in database, treating as path`);
    return input;
  }

  // Resolve to HTML file path - try common locations
  const versionedPath = getVersionedSourcePath(book);
  const possiblePaths = [
    // Versioned exports path (primary location)
    resolve(REPO_ROOT, versionedPath, 'exports/html', `${book.slug.replace(/-/g, '_')}.html`),
    resolve(REPO_ROOT, versionedPath, 'exports/html/core_rulebook.html'), // legacy name
    // Promoted HTML paths
    resolve(REPO_ROOT, 'data/html/promoted', `${book.slug}.html`),
    resolve(REPO_ROOT, 'data/html/print/promoted', `${book.slug}.html`),
    // Site paths
    resolve(REPO_ROOT, 'src/site', `${book.slug.replace(/-/g, '_')}.html`),
    resolve(REPO_ROOT, 'src/site', `${book.slug.replace(/-/g, '_')}_web.html`),
    resolve(REPO_ROOT, 'src/site', 'core_rulebook.html'), // fallback for core-rulebook
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      log.info(`Resolved book slug "${input}" to: ${path}`);
      return path;
    }
  }

  // Last resort - use the versioned source_path from database
  const sourcePath = resolve(REPO_ROOT, getVersionedSourcePath(book));
  log.warn(`Could not find HTML file for "${input}", using source_path: ${sourcePath}`);
  return sourcePath;
}
import {
  reviewBook,
  reviewChapter,
  listCampaigns,
  viewCampaign,
  statusCampaign,
  analyzeCampaign,
  addReviewers,
  reanalyzeCampaign,
  collectCampaignReviews,
  type ListCampaignsFilters,
} from './review.js';
import {
  buildPrintHtml,
  listPrintBuilds,
  diffPrintBuild,
  promotePrintBuild,
} from '../html-gen/print/index.js';
import {
  buildWebReader,
  listWebBuilds,
  formatBuildList,
  diffWebBuild,
  formatDiff,
  promoteWebBuild,
} from '../html-gen/web/index.js';
import { getDatabase } from '@razorweave/database';
import { HtmlBuildClient } from '../html-gen/build-client.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'hydrate-core') {
      hydrateCore();
    } else if (command === 'generate') {
      const count = parseInt(args[1], 10);
      if (isNaN(count) || count <= 0) {
        log.error('Error: Please provide a valid count for generate command');
        log.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts generate <count> [--seed=<number>]');
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
          log.error('Error: Please provide a campaign ID');
          log.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review status <campaign-id>');
          process.exit(1);
        }
        statusCampaign(campaignId);
      } else if (subcommand === 'book') {
        const bookPath = args[2];
        if (!bookPath) {
          log.error('Error: Please provide a book slug or path');
          log.error('Usage: pnpm review:book <slug-or-path> [--personas=...] [--plus=N] [--generated=N] [--focus=...]');
          log.error('Examples:');
          log.error('  pnpm review:book core-rulebook');
          log.error('  pnpm review:book src/site/core_rulebook_web.html');
          process.exit(1);
        }

        const options: { personas?: string; plus?: number; generated?: number; focus?: string } = {};
        for (let i = 3; i < args.length; i++) {
          if (args[i].startsWith('--personas=')) {
            options.personas = args[i].split('=')[1];
          } else if (args[i].startsWith('--plus=')) {
            options.plus = parseInt(args[i].split('=')[1], 10);
          } else if (args[i].startsWith('--generated=')) {
            options.generated = parseInt(args[i].split('=')[1], 10);
          } else if (args[i].startsWith('--focus=')) {
            options.focus = args[i].split('=')[1];
          }
        }

        const resolvedPath = resolveBookPath(bookPath);
        reviewBook(resolvedPath, options);
      } else if (subcommand === 'chapter') {
        const chapterPath = args[2];
        if (!chapterPath) {
          log.error('Error: Please provide a chapter path');
          log.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review chapter <path> [--personas=...] [--plus=N] [--generated=N] [--focus=...]');
          process.exit(1);
        }

        const options: { personas?: string; plus?: number; generated?: number; focus?: string } = {};
        for (let i = 3; i < args.length; i++) {
          if (args[i].startsWith('--personas=')) {
            options.personas = args[i].split('=')[1];
          } else if (args[i].startsWith('--plus=')) {
            options.plus = parseInt(args[i].split('=')[1], 10);
          } else if (args[i].startsWith('--generated=')) {
            options.generated = parseInt(args[i].split('=')[1], 10);
          } else if (args[i].startsWith('--focus=')) {
            options.focus = args[i].split('=')[1];
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
          log.error('Error: Please provide a campaign ID');
          log.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review view <campaign-id> [--format=text|json]');
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
      } else if (subcommand === 'analyze') {
        const campaignId = args[2];
        if (!campaignId) {
          log.error('Error: Please provide a campaign ID');
          log.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review analyze <campaign-id>');
          process.exit(1);
        }
        analyzeCampaign(campaignId);
      } else if (subcommand === 'add-reviewers') {
        const campaignId = args[2];
        if (!campaignId) {
          log.error('Error: Please provide a campaign ID');
          log.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review add-reviewers <campaign-id> [--core] [--plus=N] [--personas=...] [--focus=...]');
          process.exit(1);
        }

        const options: { core?: boolean; plus?: number; personas?: string; focus?: string } = {};
        for (let i = 3; i < args.length; i++) {
          if (args[i] === '--core') {
            options.core = true;
          } else if (args[i].startsWith('--plus=')) {
            options.plus = parseInt(args[i].split('=')[1], 10);
          } else if (args[i].startsWith('--personas=')) {
            options.personas = args[i].split('=')[1];
          } else if (args[i].startsWith('--focus=')) {
            options.focus = args[i].split('=')[1];
          }
        }

        addReviewers(campaignId, options);
      } else if (subcommand === 'reanalyze') {
        const campaignId = args[2];
        if (!campaignId) {
          log.error('Error: Please provide a campaign ID');
          log.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review reanalyze <campaign-id>');
          process.exit(1);
        }
        reanalyzeCampaign(campaignId);
      } else if (subcommand === 'collect') {
        const campaignId = args[2];
        if (!campaignId) {
          log.error('Error: Please provide a campaign ID');
          log.error('Usage: pnpm review:collect <campaign-id>');
          process.exit(1);
        }
        collectCampaignReviews(campaignId);
      } else {
        log.error(`Unknown review subcommand: ${subcommand}`);
        log.error('Available subcommands: book, chapter, list, view, status, analyze, add-reviewers, reanalyze, collect');
        process.exit(1);
      }
    } else if (command === 'html' && args[1] === 'print') {
      const subcommand = args[2];

      switch (subcommand) {
        case 'build': {
          const db = getDatabase();
          const result = await buildPrintHtml({
            bookPath: resolve(REPO_ROOT, 'books/core/v1.3.0'),
            chaptersDir: resolve(REPO_ROOT, 'books/core/v1.3.0/chapters'),
            sheetsDir: resolve(REPO_ROOT, 'books/core/v1.3.0/sheets'),
            outputPath: resolve(REPO_ROOT, 'data/html/print-design/core-rulebook.html'),
            db: db.db,
          });
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
          break;
        }
        case 'list': {
          const db = getDatabase();
          const result = listPrintBuilds(db.db);
          console.log(JSON.stringify(result, null, 2));
          break;
        }
        case 'diff': {
          const buildId = args[3];
          if (!buildId) {
            log.error('Usage: html print diff <build-id>');
            process.exit(1);
          }
          const db = getDatabase();
          const client = new HtmlBuildClient(db.db);
          const latest = client.getLatestBuild('print-design');
          if (!latest) {
            log.error('No builds found');
            process.exit(1);
          }
          const result = diffPrintBuild(db.db, buildId, latest.buildId);
          console.log(JSON.stringify(result, null, 2));
          break;
        }
        case 'promote': {
          const result = await promotePrintBuild({
            sourcePath: resolve(REPO_ROOT, 'data/html/print-design/core-rulebook.html'),
            targetPath: resolve(REPO_ROOT, 'books/core/v1/exports/html/core_rulebook.html'),
          });
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
          break;
        }
        default:
          log.error(`Unknown html print command: ${subcommand}`);
          log.error('Available: build, list, diff, promote');
          process.exit(1);
      }
    } else if (command === 'html' && args[1] === 'web') {
      const subcommand = args[2];
      const db = getDatabase();

      switch (subcommand) {
        case 'build': {
          const force = args.includes('--force');
          const result = await buildWebReader({
            bookPath: resolve(REPO_ROOT, 'books/core/v1'),
            chaptersDir: resolve(REPO_ROOT, 'books/core/v1/chapters'),
            sheetsDir: resolve(REPO_ROOT, 'books/core/v1/sheets'),
            outputPath: resolve(REPO_ROOT, 'data/html/web-reader/core-rulebook.html'),
            templatePath: resolve(REPO_ROOT, 'src/tooling/html-gen/templates/web-reader.html'),
            db: db.db,
            force,
          });
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.status === 'failed' ? 1 : 0);
          break;
        }
        case 'list': {
          const limitArg = args.find(a => a.startsWith('--limit='));
          const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 10;
          const builds = listWebBuilds(db.db, limit);
          console.log(formatBuildList(builds));
          break;
        }
        case 'diff': {
          const buildId = args[3];
          if (!buildId) {
            log.error('Usage: html web diff <build-id>');
            process.exit(1);
          }
          const diff = diffWebBuild(db.db, buildId, resolve(REPO_ROOT, 'books/core/v1/chapters'));
          console.log(formatDiff(diff));
          break;
        }
        case 'promote': {
          const result = await promoteWebBuild({
            sourcePath: resolve(REPO_ROOT, 'data/html/web-reader/core-rulebook.html'),
            targetPath: resolve(REPO_ROOT, 'src/site/pages/read.html'),
          });
          console.log(result.success ? 'Promoted successfully!' : `Failed: ${result.error}`);
          process.exit(result.success ? 0 : 1);
          break;
        }
        default:
          log.error(`Unknown html web command: ${subcommand}`);
          log.error('Available: build, list, diff, promote');
          process.exit(1);
      }
    } else {
      log.error(`Unknown command: ${command}`);
      log.error('Available commands:');
      log.error('  hydrate-core                             - Load all core personas');
      log.error('  generate <count> [--seed=N]              - Generate N personas');
      log.error('  stats                                     - Show persona statistics');
      log.error('  review book <path> [options]              - Review an HTML book');
      log.error('  review chapter <path> [options]           - Review a markdown chapter');
      log.error('    Options: --personas=..., --plus=N, --generated=N, --focus=<category>');
      log.error('    Focus categories: general, gm-content, combat, narrative, character-creation, quickstart');
      log.error('  review list [--status=...] [--content-type=...] - List campaigns');
      log.error('  review view <id> [--format=text|json]    - View campaign details');
      log.error('  review status <id>                        - Check campaign status');
      log.error('  review analyze <id>                       - Analyze campaign reviews');
      log.error('  review add-reviewers <id> [options]       - Add reviewers to campaign');
      log.error('    Options: --core, --plus=N, --personas=..., --focus=<category>');
      log.error('  review reanalyze <id>                     - Rerun analysis (overwrites existing)');
      log.error('  html print build                          - Build print-design HTML');
      log.error('  html print list                           - List print builds');
      log.error('  html print diff <build-id>                - Diff vs latest build');
      log.error('  html print promote                        - Copy to exports/');
      log.error('  html web build [--force]                  - Build web-reader HTML');
      log.error('  html web list [--limit=N]                 - List web builds');
      log.error('  html web diff <build-id>                  - Diff vs build');
      log.error('  html web promote                          - Copy to site pages/');
      process.exit(1);
    }
  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

void main();
