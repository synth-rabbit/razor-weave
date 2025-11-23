// src/tooling/agents/invoker-editor.ts
import { readFileSync } from 'fs';
import { join, basename } from 'path';
import Anthropic from '@anthropic-ai/sdk';

export interface EditorFeedbackItem {
  issue: string;
  location: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'suggestion';
}

export interface EditorReviewResult {
  approved: boolean;
  feedback: EditorFeedbackItem[];
  summary: string;
}

export interface EditorInvokerOptions {
  chapterPaths: string[];
  styleGuidesDir: string;
}

export class EditorInvoker {
  private client: Anthropic;
  private promptPath: string;

  constructor() {
    this.client = new Anthropic();
    this.promptPath = join(__dirname, 'prompts/editor-review.md');
  }

  async invoke(options: EditorInvokerOptions): Promise<EditorReviewResult> {
    // Load prompt template
    const promptTemplate = readFileSync(this.promptPath, 'utf-8');

    // Load chapters
    const chapters = options.chapterPaths.map((chapterPath) => {
      const content = readFileSync(chapterPath, 'utf-8');
      const name = basename(chapterPath);
      return { name, path: chapterPath, content };
    });

    // Format chapters for prompt
    const chaptersContent = chapters
      .map((ch) => `### ${ch.name}\n\`\`\`markdown\n${ch.content}\n\`\`\``)
      .join('\n\n');

    // Load style guides
    let styleGuides = '';
    if (options.styleGuidesDir) {
      try {
        const contentGuide = readFileSync(join(options.styleGuidesDir, 'content.md'), 'utf-8');
        const mechanicsGuide = readFileSync(join(options.styleGuidesDir, 'mechanics.md'), 'utf-8');
        styleGuides = `\n\n## Style Guides\n\n### Content Guide\n${contentGuide}\n\n### Mechanics Guide\n${mechanicsGuide}`;
      } catch {
        // Style guides are optional, continue without them
      }
    }

    // Build the full prompt
    const fullPrompt = `${promptTemplate}\n\n## Chapters to Review\n\n${chaptersContent}${styleGuides}\n\nPerform the editorial review now. Return ONLY the JSON object, no other text.`;

    // Call Claude
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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

    const result = JSON.parse(jsonMatch[0]) as EditorReviewResult;
    return result;
  }
}
