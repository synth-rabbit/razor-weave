import { describe, it, expect } from 'vitest';
import { CLIFormatter, StatusItem } from './formatter';

describe('CLIFormatter', () => {
  describe('header', () => {
    it('should create a header with title', () => {
      const output = CLIFormatter.header('BOARDROOM STATUS');

      expect(output).toContain('═══════════════════════════════════════════════════════════');
      expect(output).toContain('BOARDROOM STATUS');
    });

    it('should center the title', () => {
      const output = CLIFormatter.header('TEST');
      const lines = output.split('\n');

      // Title should be on its own line between the box characters
      expect(lines.some(l => l.trim() === 'TEST')).toBe(true);
    });
  });

  describe('section', () => {
    it('should create a section with title and content', () => {
      const output = CLIFormatter.section('STATUS', ['Line 1', 'Line 2']);

      expect(output).toContain('───────────────────────────────────────────────────────────');
      expect(output).toContain('STATUS');
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
    });

    it('should accept string content', () => {
      const output = CLIFormatter.section('INFO', 'Single line content');

      expect(output).toContain('Single line content');
    });
  });

  describe('status', () => {
    it('should format success items with checkmark', () => {
      const items: StatusItem[] = [
        { label: 'Database connected', success: true },
        { label: 'Events loaded', success: true }
      ];

      const output = CLIFormatter.status(items);

      expect(output).toContain('✓ Database connected');
      expect(output).toContain('✓ Events loaded');
    });

    it('should format failure items with X', () => {
      const items: StatusItem[] = [
        { label: 'Tests passed', success: false }
      ];

      const output = CLIFormatter.status(items);

      expect(output).toContain('✗ Tests passed');
    });

    it('should format pending items with dash', () => {
      const items: StatusItem[] = [
        { label: 'Awaiting approval', pending: true }
      ];

      const output = CLIFormatter.status(items);

      expect(output).toContain('- Awaiting approval');
    });
  });

  describe('nextStep', () => {
    it('should create next step section with instruction', () => {
      const output = CLIFormatter.nextStep('Run: pnpm boardroom:approve --session sess_123');

      expect(output).toContain('NEXT STEP');
      expect(output).toContain('Run: pnpm boardroom:approve --session sess_123');
    });

    it('should support multiline instructions', () => {
      const output = CLIFormatter.nextStep([
        '1. Review the plan above',
        '2. Run: pnpm boardroom:approve',
        '3. Or provide feedback'
      ]);

      expect(output).toContain('1. Review the plan above');
      expect(output).toContain('2. Run: pnpm boardroom:approve');
    });
  });

  describe('footer', () => {
    it('should create closing footer', () => {
      const output = CLIFormatter.footer();

      expect(output).toContain('═══════════════════════════════════════════════════════════');
    });
  });

  describe('format', () => {
    it('should compose a complete CLI output', () => {
      const output = CLIFormatter.format({
        title: 'BOARDROOM SESSION',
        content: 'Session ID: sess_abc123\nStatus: Active',
        status: [
          { label: 'VP Product plan created', success: true },
          { label: 'VP Engineering plan pending', pending: true }
        ],
        nextStep: 'Run: pnpm boardroom:vp-engineering --session sess_abc123'
      });

      // Should have header
      expect(output).toContain('BOARDROOM SESSION');

      // Should have content
      expect(output).toContain('Session ID: sess_abc123');

      // Should have status section
      expect(output).toContain('STATUS');
      expect(output).toContain('✓ VP Product plan created');
      expect(output).toContain('- VP Engineering plan pending');

      // Should have next step
      expect(output).toContain('NEXT STEP');
      expect(output).toContain('pnpm boardroom:vp-engineering');

      // Should have footer
      const footerCount = (output.match(/═{59}/g) || []).length;
      expect(footerCount).toBeGreaterThanOrEqual(2); // header and footer
    });

    it('should handle minimal output (title only)', () => {
      const output = CLIFormatter.format({ title: 'SIMPLE' });

      expect(output).toContain('SIMPLE');
      expect(output).not.toContain('STATUS');
      expect(output).not.toContain('NEXT STEP');
    });
  });

  describe('table', () => {
    it('should format data as a simple table', () => {
      const output = CLIFormatter.table([
        { key: 'Session ID', value: 'sess_123' },
        { key: 'Status', value: 'active' },
        { key: 'Created', value: '2024-11-22' }
      ]);

      expect(output).toContain('Session ID');
      expect(output).toContain('sess_123');
      expect(output).toContain('Status');
      expect(output).toContain('active');
    });

    it('should align columns', () => {
      const output = CLIFormatter.table([
        { key: 'ID', value: '1' },
        { key: 'Very Long Key', value: '2' }
      ]);

      const lines = output.split('\n').filter(Boolean);
      // Both values should start at the same column
      const colonPositions = lines.map(l => l.indexOf(':'));
      const uniquePositions = new Set(colonPositions);
      expect(uniquePositions.size).toBe(1);
    });
  });

  describe('bullet', () => {
    it('should format items as bullet list', () => {
      const output = CLIFormatter.bullet(['Item 1', 'Item 2', 'Item 3']);

      expect(output).toContain('• Item 1');
      expect(output).toContain('• Item 2');
      expect(output).toContain('• Item 3');
    });
  });

  describe('numbered', () => {
    it('should format items as numbered list', () => {
      const output = CLIFormatter.numbered(['First', 'Second', 'Third']);

      expect(output).toContain('1. First');
      expect(output).toContain('2. Second');
      expect(output).toContain('3. Third');
    });
  });
});
