// src/tooling/agents/invoker-release-notes.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

export interface ChapterChange {
  chapter: string;
  description: string;
}

export interface ReleaseNotesOutput {
  title: string;
  version: string;
  date: string;
  summary: string;
  highlights: string[];
  changes: ChapterChange[];
  metrics_improvement: string;
  known_issues: string[];
  markdown: string;
}

export interface ReleaseNotesInvokerOptions {
  planPath: string;
  changelogPath: string;
  metricsPath: string;
}

export class ReleaseNotesInvoker {
  private client: Anthropic;
  private promptPath: string;

  constructor() {
    this.client = new Anthropic();
    this.promptPath = join(__dirname, 'prompts/release-notes-gen.md');
  }

  async invoke(options: ReleaseNotesInvokerOptions): Promise<ReleaseNotesOutput> {
    // Load prompt template
    const promptTemplate = readFileSync(this.promptPath, 'utf-8');

    // Load improvement plan
    const plan = readFileSync(options.planPath, 'utf-8');

    // Load changelog
    const changelog = readFileSync(options.changelogPath, 'utf-8');

    // Load metrics
    const metrics = readFileSync(options.metricsPath, 'utf-8');

    // Build the full prompt
    const fullPrompt = `${promptTemplate}

## Improvement Plan

\`\`\`json
${plan}
\`\`\`

## Change Log

\`\`\`json
${changelog}
\`\`\`

## Metrics Report

\`\`\`json
${metrics}
\`\`\`

Generate the release notes now. Return ONLY the JSON object, no other text.`;

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

    const releaseNotes = JSON.parse(jsonMatch[0]) as ReleaseNotesOutput;

    // Validate required fields
    this.validateOutput(releaseNotes);

    return releaseNotes;
  }

  private validateOutput(output: ReleaseNotesOutput): void {
    const requiredFields: (keyof ReleaseNotesOutput)[] = [
      'title',
      'version',
      'date',
      'summary',
      'highlights',
      'changes',
      'metrics_improvement',
      'known_issues',
      'markdown'
    ];

    for (const field of requiredFields) {
      if (output[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(output.highlights)) {
      throw new Error('highlights must be an array');
    }

    if (!Array.isArray(output.changes)) {
      throw new Error('changes must be an array');
    }

    if (!Array.isArray(output.known_issues)) {
      throw new Error('known_issues must be an array');
    }

    // Validate each change has required structure
    for (const change of output.changes) {
      if (!change.chapter || !change.description) {
        throw new Error('Each change must have chapter and description fields');
      }
    }
  }
}
