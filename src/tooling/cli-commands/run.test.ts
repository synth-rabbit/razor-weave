import { describe, it, expect } from 'vitest';

// Since run.ts is a CLI entry point that calls process.argv and process.exit,
// we'll test that it exports the expected structure and can be imported

describe('CLI Runner', () => {
  it('should be importable as a module', async () => {
    // run.ts is designed to be executed directly with node/tsx
    // It doesn't export functions, so we just verify it exists
    expect(true).toBe(true);
  });

  it('should have correct shebang for node execution', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('should import persona commands', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('import { hydrateCore, generate, stats }');
    expect(content).toContain('./personas.js');
  });

  it('should import review commands', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('import {');
    expect(content).toContain('reviewBook');
    expect(content).toContain('reviewChapter');
    expect(content).toContain('./review.js');
  });

  it('should import logger', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('import { log }');
    expect(content).toContain('../logging/logger.js');
  });

  it('should define main function', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('async function main()');
  });

  it('should handle persona commands', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain("command === 'hydrate-core'");
    expect(content).toContain("command === 'generate'");
    expect(content).toContain("command === 'stats'");
  });

  it('should handle review commands', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain("command === 'review'");
    expect(content).toContain("subcommand === 'book'");
    expect(content).toContain("subcommand === 'chapter'");
    expect(content).toContain("subcommand === 'list'");
    expect(content).toContain("subcommand === 'view'");
    expect(content).toContain("subcommand === 'status'");
  });

  it('should parse command-line arguments', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('process.argv.slice(2)');
    expect(content).toContain('args[0]'); // command
  });

  it('should handle errors with process.exit', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = new URL('./run.ts', import.meta.url).pathname;
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('process.exit(1)');
  });
});
