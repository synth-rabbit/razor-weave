import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { reviewBook, listCampaigns } from './review.js';
import * as logger from '../logging/logger.js';

// Spy on logger to capture output
let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(logger.log, 'info').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
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

      const output = logSpy.mock.calls.map(call => String(call[0])).join('\n');
      expect(output).toContain('Campaign created');
      expect(output).toContain('campaign-');
    });
  });

  describe('listCampaigns', () => {
    it('shows campaign list', () => {
      reviewBook(testBookPath);
      listCampaigns();

      const output = logSpy.mock.calls.map(call => String(call[0])).join('\n');
      expect(output).toContain('Found');
      expect(output).toContain('campaigns');
    });
  });
});
