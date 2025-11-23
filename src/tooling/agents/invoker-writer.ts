// src/tooling/agents/invoker-writer.ts
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import Anthropic from '@anthropic-ai/sdk';

export interface ChapterChange {
  type: string;
  target: string;
  before_summary: string;
  after_summary: string;
}

export interface ChapterChangelog {
  chapter_id: string;
  changes: ChapterChange[];
}

export interface UpdatedChapter {
  chapter_id: string;
  chapter_path: string;
  content: string;
}

export interface WriterOutput {
  updated_chapters: UpdatedChapter[];
  changelog: ChapterChangelog[];
}

export interface WriterInvokerOptions {
  planPath: string;
  chapterPaths: string[];
  styleGuidesDir?: string;
}

export class WriterInvoker {
  private client: Anthropic;
  private promptPath: string;

  constructor() {
    this.client = new Anthropic();
    this.promptPath = join(__dirname, 'prompts/writer-plan-to-content.md');
  }

  async invoke(options: WriterInvokerOptions): Promise<WriterOutput> {
    // Load prompt template
    const promptTemplate = readFileSync(this.promptPath, 'utf-8');

    // Load improvement plan
    const plan = readFileSync(options.planPath, 'utf-8');

    // Load chapter content
    const chapters = this.loadChapters(options.chapterPaths);

    // Load style guides if available
    const styleGuides = this.loadStyleGuides(options.styleGuidesDir);

    // Build the full prompt
    const fullPrompt = this.buildPrompt(promptTemplate, plan, chapters, styleGuides);

    // Call Claude
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const output = JSON.parse(jsonMatch[0]) as WriterOutput;
    return output;
  }

  private loadChapters(chapterPaths: string[]): Map<string, { path: string; content: string }> {
    const chapters = new Map<string, { path: string; content: string }>();

    for (const chapterPath of chapterPaths) {
      if (!existsSync(chapterPath)) {
        throw new Error(`Chapter file not found: ${chapterPath}`);
      }

      const content = readFileSync(chapterPath, 'utf-8');
      const chapterId = this.extractChapterId(chapterPath);
      chapters.set(chapterId, { path: chapterPath, content });
    }

    return chapters;
  }

  private extractChapterId(filePath: string): string {
    const filename = basename(filePath);
    // Remove extension and return as chapter ID
    return filename.replace(/\.[^/.]+$/, '');
  }

  private loadStyleGuides(styleGuidesDir?: string): string {
    if (!styleGuidesDir || !existsSync(styleGuidesDir)) {
      return '';
    }

    const guides: string[] = [];

    // Try to load common style guide files
    const guideFiles = ['content.md', 'mechanics.md', 'formatting.md', 'voice.md'];

    for (const file of guideFiles) {
      const guidePath = join(styleGuidesDir, file);
      if (existsSync(guidePath)) {
        const content = readFileSync(guidePath, 'utf-8');
        const guideName = file.replace('.md', '');
        guides.push(`### ${guideName.charAt(0).toUpperCase() + guideName.slice(1)} Guide\n${content}`);
      }
    }

    // Also check for any other .md files in the directory
    try {
      const files = readdirSync(styleGuidesDir);
      for (const file of files) {
        if (file.endsWith('.md') && !guideFiles.includes(file)) {
          const guidePath = join(styleGuidesDir, file);
          const content = readFileSync(guidePath, 'utf-8');
          const guideName = file.replace('.md', '');
          guides.push(`### ${guideName.charAt(0).toUpperCase() + guideName.slice(1)} Guide\n${content}`);
        }
      }
    } catch {
      // Directory listing failed, continue with what we have
    }

    if (guides.length === 0) {
      return '';
    }

    return `\n\n## Style Guides\n\n${guides.join('\n\n')}`;
  }

  private buildPrompt(
    template: string,
    plan: string,
    chapters: Map<string, { path: string; content: string }>,
    styleGuides: string
  ): string {
    const chapterSection = this.formatChaptersForPrompt(chapters);

    return `${template}

## Improvement Plan

\`\`\`json
${plan}
\`\`\`

## Chapter Content

${chapterSection}
${styleGuides}

Execute the improvement plan now. Return ONLY the JSON object with updated_chapters and changelog, no other text.`;
  }

  private formatChaptersForPrompt(
    chapters: Map<string, { path: string; content: string }>
  ): string {
    const sections: string[] = [];

    for (const [chapterId, { path, content }] of chapters) {
      sections.push(`### Chapter: ${chapterId}
Path: ${path}

\`\`\`markdown
${content}
\`\`\``);
    }

    return sections.join('\n\n');
  }
}
