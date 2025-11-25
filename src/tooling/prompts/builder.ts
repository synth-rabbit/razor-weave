// src/tooling/prompts/builder.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * A section in a prompt document.
 */
export interface PromptSection {
  title: string;
  content: string;
  level?: 1 | 2 | 3;
}

/**
 * Builder for constructing multi-section prompts with consistent formatting.
 *
 * @example
 * ```typescript
 * const prompt = new PromptBuilder('W1 Planning Task')
 *   .context({ Book: 'Core Rulebook', RunId: 'wfrun_123' })
 *   .section('Review Analysis', analysisContent)
 *   .sectionFromFile('Style Guide', 'docs/style_guides/content.md', { optional: true })
 *   .section('Task', 'Create an improvement plan...')
 *   .codeBlock('bash', 'pnpm w1:planning --save')
 *   .build();
 * ```
 */
export class PromptBuilder {
  private title: string;
  private sections: PromptSection[] = [];
  private contextItems: Array<{ key: string; value: string }> = [];

  constructor(title: string) {
    this.title = title;
  }

  /**
   * Add context key-value pairs that appear at the top of the prompt.
   */
  context(items: Record<string, string | number | boolean>): this {
    for (const [key, value] of Object.entries(items)) {
      this.contextItems.push({ key, value: String(value) });
    }
    return this;
  }

  /**
   * Add a section with a title and content.
   */
  section(title: string, content: string, level: 1 | 2 | 3 = 2): this {
    this.sections.push({ title, content, level });
    return this;
  }

  /**
   * Add a section whose content is loaded from a file.
   * If optional is true and file doesn't exist, the section is skipped.
   */
  sectionFromFile(
    title: string,
    filePath: string,
    options: { optional?: boolean; level?: 1 | 2 | 3; basePath?: string } = {}
  ): this {
    const fullPath = options.basePath ? join(options.basePath, filePath) : filePath;

    if (!existsSync(fullPath)) {
      if (options.optional) {
        return this;
      }
      throw new Error(`Prompt file not found: ${fullPath}`);
    }

    const content = readFileSync(fullPath, 'utf-8');
    this.sections.push({ title, content, level: options.level ?? 2 });
    return this;
  }

  /**
   * Add multiple files from a directory as subsections.
   */
  sectionsFromDir(
    title: string,
    dirPath: string,
    files: Array<{ name: string; filename: string }>,
    options: { optional?: boolean; level?: 1 | 2 | 3 } = {}
  ): this {
    let content = '';
    const level = options.level ?? 2;
    const subLevel = Math.min(level + 1, 3) as 1 | 2 | 3;

    for (const file of files) {
      const fullPath = join(dirPath, file.filename);
      if (existsSync(fullPath)) {
        const fileContent = readFileSync(fullPath, 'utf-8');
        content += `${'#'.repeat(subLevel + 1)} ${file.name}\n${fileContent}\n\n`;
      } else if (!options.optional) {
        throw new Error(`File not found: ${fullPath}`);
      }
    }

    if (content) {
      this.sections.push({ title, content: content.trim(), level });
    } else if (!options.optional) {
      this.sections.push({ title, content: '_No content available_', level });
    }

    return this;
  }

  /**
   * Add a code block.
   */
  codeBlock(language: string, code: string, sectionTitle?: string): this {
    const content = `\`\`\`${language}\n${code}\n\`\`\``;
    if (sectionTitle) {
      this.sections.push({ title: sectionTitle, content, level: 2 });
    } else {
      // Append to last section or create new one
      if (this.sections.length > 0) {
        this.sections[this.sections.length - 1].content += '\n\n' + content;
      } else {
        this.sections.push({ title: 'Code', content, level: 2 });
      }
    }
    return this;
  }

  /**
   * Add a list of items.
   */
  list(items: string[], sectionTitle?: string): this {
    const content = items.map((item) => `- ${item}`).join('\n');
    if (sectionTitle) {
      this.sections.push({ title: sectionTitle, content, level: 2 });
    } else if (this.sections.length > 0) {
      this.sections[this.sections.length - 1].content += '\n\n' + content;
    }
    return this;
  }

  /**
   * Add a key-value table.
   */
  table(rows: Array<{ key: string; value: string }>, sectionTitle?: string): this {
    const content = rows.map((r) => `- **${r.key}:** ${r.value}`).join('\n');
    if (sectionTitle) {
      this.sections.push({ title: sectionTitle, content, level: 2 });
    } else if (this.sections.length > 0) {
      this.sections[this.sections.length - 1].content += '\n\n' + content;
    }
    return this;
  }

  /**
   * Add raw content without a section header.
   */
  raw(content: string): this {
    if (this.sections.length > 0) {
      this.sections[this.sections.length - 1].content += '\n\n' + content;
    } else {
      this.sections.push({ title: '', content, level: 2 });
    }
    return this;
  }

  /**
   * Build the final prompt string.
   */
  build(): string {
    const parts: string[] = [];

    // Title
    parts.push(`# ${this.title}`);

    // Context block
    if (this.contextItems.length > 0) {
      parts.push('\n## Context\n');
      parts.push(this.contextItems.map((item) => `- **${item.key}:** ${item.value}`).join('\n'));
    }

    // Sections
    for (const section of this.sections) {
      if (section.title) {
        parts.push(`\n${'#'.repeat((section.level ?? 2) + 1)} ${section.title}\n`);
      } else {
        parts.push('\n');
      }
      parts.push(section.content);
    }

    return parts.join('\n').trim() + '\n';
  }

  /**
   * Build and return as an object with metadata.
   */
  buildWithMeta(): { prompt: string; sectionCount: number; charCount: number } {
    const prompt = this.build();
    return {
      prompt,
      sectionCount: this.sections.length,
      charCount: prompt.length,
    };
  }
}

/**
 * Helper to interpolate variables into a template string.
 * Uses {{variable}} syntax.
 */
export function interpolate(template: string, vars: Record<string, string | number | boolean>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in vars) {
      return String(vars[key]);
    }
    return `{{${key}}}`;
  });
}

/**
 * Load a prompt template file and interpolate variables.
 */
export function loadTemplate(
  templatePath: string,
  vars: Record<string, string | number | boolean>,
  options: { basePath?: string } = {}
): string {
  const fullPath = options.basePath ? join(options.basePath, templatePath) : templatePath;

  if (!existsSync(fullPath)) {
    throw new Error(`Template not found: ${fullPath}`);
  }

  const template = readFileSync(fullPath, 'utf-8');
  return interpolate(template, vars);
}
