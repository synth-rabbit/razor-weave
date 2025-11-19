/* eslint-disable no-console */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { reviewBook, listCampaigns } from './review.js';

// Mock console.log to capture output
let consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput = [];
  console.log = (...args: unknown[]): void => {
    consoleOutput.push(args.join(' '));
  };
});

afterEach(() => {
  console.log = originalLog;
});

describe('Review CLI Commands', () => {
  const testDir = 'data/test-cli-commands';
  const testBookPath = `${testDir}/test-book.html`;

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testBookPath, '<html><body>Test</body></html>');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('reviewBook', () => {
    it('creates campaign and shows ID', () => {
      reviewBook(testBookPath);

      const output = consoleOutput.join('\n');
      expect(output).toContain('Campaign created');
      expect(output).toContain('campaign-');
    });
  });

  describe('listCampaigns', () => {
    it('shows campaign list', () => {
      reviewBook(testBookPath);
      listCampaigns();

      const output = consoleOutput.join('\n');
      expect(output).toContain('Found');
      expect(output).toContain('campaigns');
    });
  });
});
