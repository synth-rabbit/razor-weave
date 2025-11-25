// src/tooling/cli/command-builder.ts
import { parseArgs, type ParseArgsConfig } from 'node:util';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { CLIFormatter } from './formatter.js';
import { createTables } from '../database/schema.js';
import { runMigrations } from '../database/migrate.js';

/**
 * Option definition for CLI arguments.
 */
export interface OptionDef {
  type: 'string' | 'boolean';
  short?: string;
  default?: string | boolean;
  required?: boolean;
  description?: string;
}

/**
 * Parsed command context available to command handlers.
 */
export interface CommandContext<T extends Record<string, OptionDef>> {
  /** Parsed argument values */
  args: {
    [K in keyof T]: T[K]['type'] extends 'boolean' ? boolean : string | undefined;
  };
  /** Positional arguments */
  positionals: string[];
  /** Initialized database connection (if useDatabase was called) */
  db: Database.Database | null;
  /** Project root directory */
  projectRoot: string;
  /** Resolved database path */
  dbPath: string;
}

/**
 * Result of command execution for formatting.
 */
export interface CommandResult {
  title: string;
  content: string | string[];
  status?: Array<{ label: string; success?: boolean; pending?: boolean }>;
  nextStep?: string[];
}

/**
 * Builder for creating CLI commands with standardized patterns.
 *
 * @example
 * ```typescript
 * new CommandBuilder('book:list')
 *   .description('Lists all books in the registry')
 *   .option('status', { type: 'string', short: 's', description: 'Filter by status' })
 *   .option('db', { type: 'string', default: 'data/project.db' })
 *   .useDatabase()
 *   .run(async (ctx) => {
 *     const books = bookRepo.list();
 *     return {
 *       title: 'BOOK LIST',
 *       content: books.map(b => b.title).join('\n'),
 *       status: [{ label: `${books.length} found`, success: true }],
 *     };
 *   });
 * ```
 */
export class CommandBuilder<T extends Record<string, OptionDef> = Record<string, never>> {
  private name: string;
  private desc: string = '';
  private options: T = {} as T;
  private allowPositionals: boolean = false;
  private needsDatabase: boolean = false;
  private validators: Array<(ctx: CommandContext<T>) => void> = [];

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Set command description.
   */
  description(desc: string): this {
    this.desc = desc;
    return this;
  }

  /**
   * Add a command-line option.
   */
  option<K extends string, O extends OptionDef>(
    name: K,
    def: O
  ): CommandBuilder<T & Record<K, O>> {
    (this.options as Record<string, OptionDef>)[name] = def;
    return this as unknown as CommandBuilder<T & Record<K, O>>;
  }

  /**
   * Allow positional arguments.
   */
  positionals(): this {
    this.allowPositionals = true;
    return this;
  }

  /**
   * Enable database initialization with standard pragmas and migrations.
   */
  useDatabase(): this {
    this.needsDatabase = true;
    return this;
  }

  /**
   * Add a validation function that runs before the handler.
   * Throw an error to fail validation with that message.
   */
  validate(fn: (ctx: CommandContext<T>) => void): this {
    this.validators.push(fn);
    return this;
  }

  /**
   * Execute the command with the given handler.
   */
  async run(handler: (ctx: CommandContext<T>) => Promise<CommandResult> | CommandResult): Promise<void> {
    const ctx = this.buildContext();
    let db: Database.Database | null = null;

    try {
      // Initialize database if needed
      if (this.needsDatabase) {
        db = new Database(ctx.dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 5000');
        db.pragma('synchronous = NORMAL');
        createTables(db);

        try {
          runMigrations(ctx.dbPath);
        } catch {
          // Migrations might already be applied
        }

        ctx.db = db;
      }

      // Run validators
      for (const validator of this.validators) {
        validator(ctx);
      }

      // Run handler
      const result = await handler(ctx);

      // Output result
      console.log(CLIFormatter.format(result));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        CLIFormatter.format({
          title: 'ERROR',
          content: `${this.name} failed: ${errorMessage}`,
          status: [{ label: 'Command failed', success: false }],
        })
      );
      process.exit(1);
    } finally {
      db?.close();
    }
  }

  /**
   * Build the command context from parsed arguments.
   */
  private buildContext(): CommandContext<T> {
    const projectRoot = this.getProjectRoot();

    // Build parseArgs config
    const parseConfig: ParseArgsConfig = {
      options: {},
      allowPositionals: this.allowPositionals,
    };

    // Always include db option
    if (this.needsDatabase && !this.options['db' as keyof T]) {
      (parseConfig.options as Record<string, { type: 'string'; default?: string }>)['db'] = {
        type: 'string',
        default: 'data/project.db',
      };
    }

    for (const [name, def] of Object.entries(this.options)) {
      (parseConfig.options as Record<string, { type: 'string' | 'boolean'; short?: string; default?: string | boolean }>)[name] = {
        type: def.type,
        ...(def.short && { short: def.short }),
        ...(def.default !== undefined && { default: def.default }),
      };
    }

    const { values, positionals } = parseArgs(parseConfig);

    // Determine db path
    const dbPathValue = (values as Record<string, string | boolean | undefined>)['db'] ?? 'data/project.db';
    const dbPath = resolve(projectRoot, String(dbPathValue));

    return {
      args: values as CommandContext<T>['args'],
      positionals,
      db: null,
      projectRoot,
      dbPath,
    };
  }

  /**
   * Get project root directory.
   */
  private getProjectRoot(): string {
    try {
      return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    } catch {
      return process.cwd();
    }
  }
}

/**
 * Helper to require a string option or positional argument.
 * Throws with descriptive message if missing.
 */
export function requireArg(
  ctx: { args: Record<string, string | boolean | undefined>; positionals: string[] },
  name: string,
  positionalIndex?: number
): string {
  const value = ctx.args[name] ?? (positionalIndex !== undefined ? ctx.positionals[positionalIndex] : undefined);

  if (!value || typeof value !== 'string') {
    const usage = positionalIndex !== undefined
      ? `--${name} <value> or positional argument`
      : `--${name} <value>`;
    throw new Error(`Missing required argument: ${usage}`);
  }

  return value;
}

/**
 * Helper to validate string is one of allowed values.
 */
export function validateEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  name: string
): T | undefined {
  if (value === undefined) return undefined;

  if (!allowed.includes(value as T)) {
    throw new Error(`Invalid ${name}: ${value}. Valid values: ${allowed.join(', ')}`);
  }

  return value as T;
}
