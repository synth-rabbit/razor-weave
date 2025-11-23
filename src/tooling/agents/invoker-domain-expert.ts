// src/tooling/agents/invoker-domain-expert.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Domain Expert Review Issue
 * Represents a specific issue found during domain expert review
 */
export interface DomainExpertIssue {
  type: 'rules_contradiction' | 'term_inconsistency' | 'balance_concern' | 'missing_reference';
  description: string;
  location: string;
  impact: 'critical' | 'major' | 'minor';
}

/**
 * Domain Expert Review Result
 * The structured output from a domain expert review
 */
export interface DomainExpertReviewResult {
  approved: boolean;
  issues: DomainExpertIssue[];
  summary: string;
}

/**
 * Domain Expert Invoker Options
 */
export interface DomainExpertInvokerOptions {
  chapterPaths: string[];
  rulesDocPath?: string;
  mechanicsGuide: string;
}

/**
 * Domain Expert Agent Invoker
 *
 * Invokes a domain expert agent to review game content for:
 * - Rules contradictions
 * - Term inconsistencies
 * - Balance concerns
 * - Missing references
 *
 * The domain expert has deep knowledge of game mechanics and ensures
 * content consistency across chapters.
 */
export class DomainExpertInvoker {
  private client: Anthropic;
  private promptPath: string;

  constructor() {
    this.client = new Anthropic();
    this.promptPath = join(__dirname, 'prompts/domain-expert-review.md');
  }

  /**
   * Invoke the domain expert agent to review game content
   */
  async invoke(options: DomainExpertInvokerOptions): Promise<DomainExpertReviewResult> {
    // Load prompt template (with fallback for when prompt file doesn't exist yet)
    let promptTemplate: string;
    try {
      promptTemplate = readFileSync(this.promptPath, 'utf-8');
    } catch {
      promptTemplate = this.getDefaultPromptTemplate();
    }

    // Load chapter contents
    const chapterContents: string[] = [];
    for (const chapterPath of options.chapterPaths) {
      try {
        const content = readFileSync(chapterPath, 'utf-8');
        chapterContents.push(`## Chapter: ${chapterPath}\n\n${content}`);
      } catch {
        chapterContents.push(`## Chapter: ${chapterPath}\n\n[ERROR: Could not read file]`);
      }
    }

    // Load rules document if provided
    let rulesContent = '';
    if (options.rulesDocPath) {
      try {
        rulesContent = readFileSync(options.rulesDocPath, 'utf-8');
      } catch {
        rulesContent = '[ERROR: Could not read rules document]';
      }
    }

    // Build the full prompt
    const fullPrompt = this.buildPrompt(
      promptTemplate,
      chapterContents,
      rulesContent,
      options.mechanicsGuide
    );

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
    const result = this.parseResponse(content.text);
    return result;
  }

  /**
   * Build the complete prompt for the domain expert agent
   */
  private buildPrompt(
    template: string,
    chapters: string[],
    rulesContent: string,
    mechanicsGuide: string
  ): string {
    const parts: string[] = [template];

    parts.push('\n\n## MECHANICS GUIDE\n');
    parts.push(mechanicsGuide);

    if (rulesContent) {
      parts.push('\n\n## RULES DOCUMENT\n');
      parts.push(rulesContent);
    }

    parts.push('\n\n## CHAPTERS TO REVIEW\n');
    parts.push(chapters.join('\n\n---\n\n'));

    parts.push('\n\nReview the content now. Return ONLY the JSON object, no other text.');

    return parts.join('');
  }

  /**
   * Parse the agent's response into a structured result
   */
  private parseResponse(text: string): DomainExpertReviewResult {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON found, construct a result from the text
      return {
        approved: false,
        issues: [{
          type: 'rules_contradiction',
          description: 'Unable to parse domain expert response',
          location: 'response',
          impact: 'critical'
        }],
        summary: text.slice(0, 500)
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the result
      return {
        approved: Boolean(parsed.approved),
        issues: this.normalizeIssues(parsed.issues || []),
        summary: String(parsed.summary || '')
      };
    } catch {
      return {
        approved: false,
        issues: [{
          type: 'rules_contradiction',
          description: 'Invalid JSON in domain expert response',
          location: 'response',
          impact: 'critical'
        }],
        summary: text.slice(0, 500)
      };
    }
  }

  /**
   * Normalize and validate issues array
   */
  private normalizeIssues(issues: unknown[]): DomainExpertIssue[] {
    const validTypes = ['rules_contradiction', 'term_inconsistency', 'balance_concern', 'missing_reference'] as const;
    const validImpacts = ['critical', 'major', 'minor'] as const;

    return issues.map((issue: unknown) => {
      const i = issue as Record<string, unknown>;
      return {
        type: validTypes.includes(i.type as typeof validTypes[number])
          ? i.type as DomainExpertIssue['type']
          : 'rules_contradiction',
        description: String(i.description || ''),
        location: String(i.location || ''),
        impact: validImpacts.includes(i.impact as typeof validImpacts[number])
          ? i.impact as DomainExpertIssue['impact']
          : 'major'
      };
    });
  }

  /**
   * Default prompt template when file doesn't exist
   */
  private getDefaultPromptTemplate(): string {
    return `# Domain Expert Review Agent

You are a domain expert reviewer for tabletop game content. Your role is to review chapters and content for consistency, correctness, and balance.

## Your Responsibilities

1. **Rules Contradictions**: Identify any content that contradicts established game rules
2. **Term Inconsistencies**: Flag any inconsistent use of game terminology
3. **Balance Concerns**: Note any mechanics or content that could create balance issues
4. **Missing References**: Identify references to content that doesn't exist or isn't defined

## Review Guidelines

- Be thorough but fair in your assessment
- Distinguish between critical issues (blocking), major issues (should fix), and minor issues (nice to fix)
- Provide specific locations for each issue
- Give clear, actionable descriptions

## Output Format

Return a JSON object with this structure:
\`\`\`json
{
  "approved": boolean,
  "issues": [
    {
      "type": "rules_contradiction" | "term_inconsistency" | "balance_concern" | "missing_reference",
      "description": "Clear description of the issue",
      "location": "Chapter or section where issue was found",
      "impact": "critical" | "major" | "minor"
    }
  ],
  "summary": "Brief overall assessment of the content"
}
\`\`\`

Set "approved" to true only if there are no critical or major issues.`;
  }
}
