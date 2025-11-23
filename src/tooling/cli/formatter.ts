/**
 * CLI Output Formatter
 *
 * Provides consistent formatting for all Boardroom CLI commands.
 * Output is designed to be both human-readable and parseable by Claude Code
 * for orchestration.
 */

const BOX_WIDTH = 59;
const DOUBLE_LINE = '═'.repeat(BOX_WIDTH);
const SINGLE_LINE = '─'.repeat(BOX_WIDTH);

export interface StatusItem {
  label: string;
  success?: boolean;
  pending?: boolean;
}

export interface TableRow {
  key: string;
  value: string;
}

export interface FormatOptions {
  title: string;
  content?: string | string[];
  status?: StatusItem[];
  nextStep?: string | string[];
}

export const CLIFormatter = {
  /**
   * Create a header with title
   */
  header(title: string): string {
    return [DOUBLE_LINE, title, DOUBLE_LINE, ''].join('\n');
  },

  /**
   * Create a section with title and content
   */
  section(title: string, content: string | string[]): string {
    const lines = Array.isArray(content) ? content : [content];
    return [SINGLE_LINE, title, SINGLE_LINE, ...lines, ''].join('\n');
  },

  /**
   * Format status items with checkmarks, X marks, or dashes
   */
  status(items: StatusItem[]): string {
    return items
      .map((item) => {
        if (item.pending) return `- ${item.label}`;
        if (item.success === false) return `✗ ${item.label}`;
        return `✓ ${item.label}`;
      })
      .join('\n');
  },

  /**
   * Create next step section
   */
  nextStep(instruction: string | string[]): string {
    const lines = Array.isArray(instruction) ? instruction : [instruction];
    return this.section('NEXT STEP', lines);
  },

  /**
   * Create closing footer
   */
  footer(): string {
    return DOUBLE_LINE;
  },

  /**
   * Compose a complete CLI output
   */
  format(options: FormatOptions): string {
    const parts: string[] = [];

    // Header
    parts.push(this.header(options.title));

    // Content
    if (options.content) {
      const lines = Array.isArray(options.content)
        ? options.content
        : options.content.split('\n');
      parts.push(lines.join('\n'));
      parts.push('');
    }

    // Status section
    if (options.status && options.status.length > 0) {
      parts.push(this.section('STATUS', this.status(options.status).split('\n')));
    }

    // Next step section
    if (options.nextStep) {
      parts.push(this.nextStep(options.nextStep));
    }

    // Footer
    parts.push(this.footer());

    return parts.join('\n');
  },

  /**
   * Format data as a simple key-value table
   */
  table(rows: TableRow[]): string {
    const maxKeyLength = Math.max(...rows.map((r) => r.key.length));
    return rows.map((r) => `${r.key.padEnd(maxKeyLength)}: ${r.value}`).join('\n');
  },

  /**
   * Format items as bullet list
   */
  bullet(items: string[]): string {
    return items.map((item) => `• ${item}`).join('\n');
  },

  /**
   * Format items as numbered list
   */
  numbered(items: string[]): string {
    return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
  },
};
