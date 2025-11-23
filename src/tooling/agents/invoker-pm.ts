// src/tooling/agents/invoker-pm.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

export interface ImprovementPlan {
  plan_id: string;
  created_at: string;
  summary: string;
  target_issues: Array<{
    issue_id: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    affected_chapters: string[];
    improvement: string;
    success_metric: string;
    priority: number;
  }>;
  chapter_modifications: Array<{
    chapter_id: string;
    chapter_name: string;
    issues_addressed: string[];
    modifications: Array<{
      type: 'clarify' | 'expand' | 'restructure' | 'fix_mechanics' | 'improve_examples';
      target: string;
      instruction: string;
    }>;
  }>;
  constraints: {
    max_chapters_modified: number;
    preserve_structure: boolean;
    follow_style_guides: boolean;
  };
  estimated_impact: string;
}

export interface PMInvokerOptions {
  analysisPath: string;
  bookId: string;
  styleGuidesDir?: string;
}

export class PMInvoker {
  private client: Anthropic;
  private promptPath: string;

  constructor() {
    this.client = new Anthropic();
    this.promptPath = join(__dirname, 'prompts/pm-analysis-to-plan.md');
  }

  async invoke(options: PMInvokerOptions): Promise<ImprovementPlan> {
    // Load prompt template
    const promptTemplate = readFileSync(this.promptPath, 'utf-8');

    // Load analysis
    const analysis = readFileSync(options.analysisPath, 'utf-8');

    // Load style guides if available
    let styleGuides = '';
    if (options.styleGuidesDir) {
      const contentGuide = readFileSync(join(options.styleGuidesDir, 'content.md'), 'utf-8');
      const mechanicsGuide = readFileSync(join(options.styleGuidesDir, 'mechanics.md'), 'utf-8');
      styleGuides = `\n\n## Style Guides\n\n### Content Guide\n${contentGuide}\n\n### Mechanics Guide\n${mechanicsGuide}`;
    }

    // Build the full prompt
    const fullPrompt = `${promptTemplate}\n\n## Review Analysis\n\`\`\`json\n${analysis}\n\`\`\`${styleGuides}\n\nCreate the improvement plan now. Return ONLY the JSON object, no other text.`;

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

    const plan = JSON.parse(jsonMatch[0]) as ImprovementPlan;
    return plan;
  }
}
