# Review System Phase 3: Analysis & CLI

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement analysis agent, CLI interface, parallel review execution, and end-to-end integration.

**Architecture:** Build analyzer agent prompt generation for cross-persona analysis. Create CLI commands following existing patterns. Implement parallel review execution via Claude Code Task tool. Add comprehensive end-to-end tests.

**Tech Stack:** TypeScript, Claude Code Task tool, existing CLI patterns

**Dependencies:** Phase 1 and Phase 2 must be complete

---

## Task 1: Create Analysis Output Schema

**Files:**
- Modify: `src/tooling/reviews/schemas.ts`

**Step 1: Add analysis schemas**

```typescript
export const PriorityRankingSchema = z.object({
  category: z.string(),
  severity: z.number().int().min(1).max(10),
  frequency: z.number().int().min(1),
  affected_personas: z.array(z.string()),
  description: z.string(),
});

export const DimensionSummarySchema = z.object({
  average: z.number().min(1).max(10),
  themes: z.array(z.string()),
});

export const PersonaBreakdownSchema = z.object({
  strengths: z.array(z.string()),
  struggles: z.array(z.string()),
});

export const AnalysisDataSchema = z.object({
  executive_summary: z.string().min(50),
  priority_rankings: z.array(PriorityRankingSchema),
  dimension_summaries: z.object({
    clarity_readability: DimensionSummarySchema,
    rules_accuracy: DimensionSummarySchema,
    persona_fit: DimensionSummarySchema,
    practical_usability: DimensionSummarySchema,
  }),
  persona_breakdowns: z.record(PersonaBreakdownSchema),
  trend_analysis: z.string().optional(),
});

export type AnalysisData = z.infer<typeof AnalysisDataSchema>;
export type PriorityRanking = z.infer<typeof PriorityRankingSchema>;
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/schemas.ts
git commit -m "feat(reviews): add analysis output schemas"
```

---

## Task 2: Test Analysis Schema Validation

**Files:**
- Modify: `src/tooling/reviews/schemas.test.ts`

**Step 1: Add analysis schema tests**

```typescript
describe('AnalysisDataSchema', () => {
  it('validates correct analysis data', () => {
    const validData = {
      executive_summary:
        'Overall strong content with minor clarity issues affecting beginners',
      priority_rankings: [
        {
          category: 'Combat Initiative',
          severity: 7,
          frequency: 3,
          affected_personas: ['core-sarah', 'core-alex'],
          description: 'Initiative rules unclear for new players',
        },
      ],
      dimension_summaries: {
        clarity_readability: {
          average: 7.5,
          themes: ['Clear structure', 'Jargon heavy'],
        },
        rules_accuracy: {
          average: 9.2,
          themes: ['Consistent', 'Well explained'],
        },
        persona_fit: {
          average: 6.8,
          themes: ['Great for veterans', 'Tough for newbies'],
        },
        practical_usability: {
          average: 8.1,
          themes: ['Table-ready', 'Examples helpful'],
        },
      },
      persona_breakdowns: {
        Beginners: {
          strengths: ['Clear examples'],
          struggles: ['Complex terminology'],
        },
        Veterans: {
          strengths: ['Comprehensive rules'],
          struggles: ['None identified'],
        },
      },
    };

    const result = AnalysisDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects short executive summary', () => {
    const invalidData = {
      executive_summary: 'Short',
      priority_rankings: [],
      dimension_summaries: {
        clarity_readability: { average: 8, themes: [] },
        rules_accuracy: { average: 9, themes: [] },
        persona_fit: { average: 7, themes: [] },
        practical_usability: { average: 8, themes: [] },
      },
      persona_breakdowns: {},
    };

    const result = AnalysisDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run tests**

Run: `pnpm test src/tooling/reviews/schemas.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/schemas.test.ts
git commit -m "test(reviews): add analysis schema validation tests"
```

---

## Task 3: Create Analyzer Prompt Generator

**Files:**
- Create: `src/tooling/reviews/analyzer-prompt.ts`

**Step 1: Write analyzer prompt function**

```typescript
import type { PersonaReview } from './campaign-client.js';

export interface AnalyzerPromptData {
  campaignId: string;
  contentTitle: string;
  reviews: PersonaReview[];
  personaProfiles: Map<
    string,
    {
      name: string;
      archetype: string;
      experience_level: string;
    }
  >;
}

export function generateAnalyzerPrompt(
  data: AnalyzerPromptData
): string {
  const { campaignId, contentTitle, reviews, personaProfiles } = data;

  const reviewSummaries = reviews
    .map((review) => {
      const profile = personaProfiles.get(review.persona_id);
      const reviewData = JSON.parse(review.review_data);

      return `
**Persona:** ${profile?.name} (${profile?.archetype}, ${profile?.experience_level})
**Ratings:**
- Clarity: ${reviewData.ratings.clarity_readability}/10
- Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10
- Persona Fit: ${reviewData.ratings.persona_fit}/10
- Practical Usability: ${reviewData.ratings.practical_usability}/10

**Feedback:** ${reviewData.narrative_feedback}

**Issues:** ${reviewData.issue_annotations.length} identified
${reviewData.issue_annotations
  .map(
    (a: { section: string; issue: string; impact: string }) =>
      `  - ${a.section}: ${a.issue} (${a.impact})`
  )
  .join('\n')}
`;
    })
    .join('\n---\n');

  return `You are analyzing ${reviews.length} persona reviews for: ${contentTitle}

Campaign ID: ${campaignId}

# Review Data

${reviewSummaries}

# Analysis Instructions

Analyze the reviews above and provide a comprehensive analysis including:

## 1. Executive Summary
High-level overview of findings (2-3 sentences).

## 2. Priority Rankings
Identify the top issues ranked by severity × frequency. For each:
- Category name
- Severity score (1-10)
- Frequency (how many personas mentioned it)
- Affected persona IDs
- Description

## 3. Dimension Summaries
For each dimension (clarity, rules accuracy, persona fit, usability):
- Calculate average score
- Identify common themes from feedback

## 4. Persona Breakdowns
Group personas by experience level or archetype and identify:
- What worked well for this group
- What didn't work for this group

## 5. Trend Analysis (if applicable)
Compare to previous campaigns if data available.

**Output Format:**

Provide your analysis as valid JSON matching this schema:

\`\`\`json
{
  "executive_summary": "string (50+ chars)",
  "priority_rankings": [
    {
      "category": "string",
      "severity": number (1-10),
      "frequency": number,
      "affected_personas": ["persona-id"],
      "description": "string"
    }
  ],
  "dimension_summaries": {
    "clarity_readability": { "average": number, "themes": ["string"] },
    "rules_accuracy": { "average": number, "themes": ["string"] },
    "persona_fit": { "average": number, "themes": ["string"] },
    "practical_usability": { "average": number, "themes": ["string"] }
  },
  "persona_breakdowns": {
    "group_name": {
      "strengths": ["string"],
      "struggles": ["string"]
    }
  },
  "trend_analysis": "optional string"
}
\`\`\`

Focus on actionable insights that can guide content improvements.`;
}
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/analyzer-prompt.ts
git commit -m "feat(reviews): add analyzer prompt generator"
```

---

## Task 4: Test Analyzer Prompt Generation

**Files:**
- Create: `src/tooling/reviews/analyzer-prompt.test.ts`

**Step 1: Write tests**

```typescript
import { describe, it, expect } from 'vitest';
import { generateAnalyzerPrompt } from './analyzer-prompt.js';

describe('Analyzer Prompt Generator', () => {
  it('generates prompt with review summaries', () => {
    const reviews = [
      {
        id: 1,
        campaign_id: 'campaign-123',
        persona_id: 'core-sarah',
        review_data: JSON.stringify({
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Great content!',
          issue_annotations: [
            {
              section: 'Combat',
              issue: 'Unclear',
              impact: 'Confusion',
              location: 'Page 1',
            },
          ],
          overall_assessment: 'Good',
        }),
        agent_execution_time: null,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
      },
    ];

    const profiles = new Map([
      [
        'core-sarah',
        {
          name: 'Sarah',
          archetype: 'Explorer',
          experience_level: 'Newbie',
        },
      ],
    ]);

    const prompt = generateAnalyzerPrompt({
      campaignId: 'campaign-123',
      contentTitle: 'Test Book',
      reviews,
      personaProfiles: profiles,
    });

    expect(prompt).toContain('Sarah');
    expect(prompt).toContain('Explorer');
    expect(prompt).toContain('8/10');
    expect(prompt).toContain('priority_rankings');
    expect(prompt).toContain('dimension_summaries');
    expect(prompt).toContain('executive_summary');
  });

  it('includes all reviews in summary', () => {
    const reviews = [
      {
        id: 1,
        campaign_id: 'campaign-123',
        persona_id: 'core-sarah',
        review_data: JSON.stringify({
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Feedback 1',
          issue_annotations: [
            {
              section: 'A',
              issue: 'B',
              impact: 'C',
              location: 'D',
            },
          ],
          overall_assessment: 'Good',
        }),
        agent_execution_time: null,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        campaign_id: 'campaign-123',
        persona_id: 'core-alex',
        review_data: JSON.stringify({
          ratings: {
            clarity_readability: 7,
            rules_accuracy: 8,
            persona_fit: 6,
            practical_usability: 7,
          },
          narrative_feedback: 'Feedback 2',
          issue_annotations: [
            {
              section: 'E',
              issue: 'F',
              impact: 'G',
              location: 'H',
            },
          ],
          overall_assessment: 'Decent',
        }),
        agent_execution_time: null,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
      },
    ];

    const profiles = new Map([
      [
        'core-sarah',
        {
          name: 'Sarah',
          archetype: 'Explorer',
          experience_level: 'Newbie',
        },
      ],
      [
        'core-alex',
        {
          name: 'Alex',
          archetype: 'Tactician',
          experience_level: 'Veteran',
        },
      ],
    ]);

    const prompt = generateAnalyzerPrompt({
      campaignId: 'campaign-123',
      contentTitle: 'Test Book',
      reviews,
      personaProfiles: profiles,
    });

    expect(prompt).toContain('Sarah');
    expect(prompt).toContain('Alex');
    expect(prompt).toContain('Feedback 1');
    expect(prompt).toContain('Feedback 2');
  });
});
```

**Step 2: Run tests**

Run: `pnpm test src/tooling/reviews/analyzer-prompt.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/analyzer-prompt.test.ts
git commit -m "test(reviews): add analyzer prompt generation tests"
```

---

## Task 5: Create Analysis Markdown Writer

**Files:**
- Modify: `src/tooling/reviews/markdown-writer.ts`

**Step 1: Add analysis markdown function**

```typescript
import type { AnalysisData } from './schemas.js';

export interface AnalysisMarkdownData {
  campaignId: string;
  campaignName: string;
  contentTitle: string;
  personaCount: number;
  analysisData: AnalysisData;
}

export function writeAnalysisMarkdown(
  data: AnalysisMarkdownData,
  outputPath: string
): void {
  const { campaignId, campaignName, contentTitle, personaCount, analysisData } = data;

  const markdown = `# Campaign Analysis: ${campaignName}

**Date:** ${new Date().toISOString()}
**Campaign ID:** ${campaignId}
**Content:** ${contentTitle}
**Personas Reviewed:** ${personaCount}

---

## Executive Summary

${analysisData.executive_summary}

---

## Priority Rankings

${analysisData.priority_rankings
  .sort((a, b) => b.severity * b.frequency - a.severity * a.frequency)
  .map(
    (pr, idx) => `### ${idx + 1}. ${pr.category}

**Severity:** ${pr.severity}/10
**Frequency:** ${pr.frequency}/${personaCount} personas
**Affected Personas:** ${pr.affected_personas.join(', ')}

${pr.description}
`
  )
  .join('\n')}

---

## Dimension Summaries

### Clarity & Readability
**Average Score:** ${analysisData.dimension_summaries.clarity_readability.average.toFixed(1)}/10

**Common Themes:**
${analysisData.dimension_summaries.clarity_readability.themes.map((t) => `- ${t}`).join('\n')}

### Rules Accuracy
**Average Score:** ${analysisData.dimension_summaries.rules_accuracy.average.toFixed(1)}/10

**Common Themes:**
${analysisData.dimension_summaries.rules_accuracy.themes.map((t) => `- ${t}`).join('\n')}

### Persona Fit
**Average Score:** ${analysisData.dimension_summaries.persona_fit.average.toFixed(1)}/10

**Common Themes:**
${analysisData.dimension_summaries.persona_fit.themes.map((t) => `- ${t}`).join('\n')}

### Practical Usability
**Average Score:** ${analysisData.dimension_summaries.practical_usability.average.toFixed(1)}/10

**Common Themes:**
${analysisData.dimension_summaries.practical_usability.themes.map((t) => `- ${t}`).join('\n')}

---

## Persona Breakdowns

${Object.entries(analysisData.persona_breakdowns)
  .map(
    ([group, breakdown]) => `### ${group}

**Strengths:**
${breakdown.strengths.map((s) => `- ${s}`).join('\n')}

**Struggles:**
${breakdown.struggles.map((s) => `- ${s}`).join('\n')}
`
  )
  .join('\n')}

${analysisData.trend_analysis ? `---\n\n## Trend Analysis\n\n${analysisData.trend_analysis}` : ''}
`;

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf-8');
}
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/markdown-writer.ts
git commit -m "feat(reviews): add analysis markdown writer"
```

---

## Task 6: Create CLI Command Module

**Files:**
- Create: `src/tooling/cli-commands/review.ts`

**Step 1: Write CLI command structure**

```typescript
import { getDatabase } from '../database/index.js';
import { CampaignClient } from '../reviews/campaign-client.js';
import { ReviewOrchestrator } from '../reviews/orchestrator.js';

export interface ReviewBookOptions {
  personas?: string;
}

/**
 * Command: review book <path>
 * Reviews an HTML book using selected personas
 */
export async function reviewBook(
  bookPath: string,
  options?: ReviewBookOptions
): Promise<void> {
  console.log(`\nReviewing book: ${bookPath}\n`);

  const db = getDatabase();
  const campaignClient = new CampaignClient(db.raw);
  const orchestrator = new ReviewOrchestrator(db.raw, campaignClient);

  // Parse persona selection
  let personaSelectionStrategy: 'all_core' | 'manual' = 'all_core';
  let personaIds: string[] | undefined;

  if (options?.personas && options.personas !== 'all_core') {
    personaSelectionStrategy = 'manual';
    personaIds = options.personas.split(',').map((id) => id.trim());
  }

  // Initialize campaign
  console.log('Creating review campaign...');
  const campaignId = orchestrator.initializeCampaign({
    campaignName: `${bookPath} Review - ${new Date().toISOString()}`,
    contentType: 'book',
    contentPath: bookPath,
    personaSelectionStrategy,
    personaIds,
  });

  console.log(`Campaign created: ${campaignId}`);

  // TODO: Execute reviews (Phase 3 implementation)
  console.log('Review execution not yet implemented');
}

/**
 * Command: review chapter <path>
 * Reviews a markdown chapter using selected personas
 */
export async function reviewChapter(
  chapterPath: string,
  options?: ReviewBookOptions
): Promise<void> {
  console.log(`\nReviewing chapter: ${chapterPath}\n`);

  // Similar to reviewBook but with contentType: 'chapter'
  console.log('Chapter review not yet implemented');
}

/**
 * Command: review list
 * Lists all review campaigns
 */
export async function listCampaigns(
  filters?: { status?: string; contentType?: string }
): Promise<void> {
  const db = getDatabase();
  const campaignClient = new CampaignClient(db.raw);

  const campaigns = campaignClient.listCampaigns(filters || {});

  console.log(`\nFound ${campaigns.length} campaigns:\n`);

  for (const campaign of campaigns) {
    console.log(`[${campaign.status}] ${campaign.campaign_name}`);
    console.log(`  ID: ${campaign.id}`);
    console.log(`  Type: ${campaign.content_type}`);
    console.log(`  Created: ${campaign.created_at}`);
    console.log('');
  }
}

/**
 * Command: review view <campaign-id>
 * Views campaign details
 */
export async function viewCampaign(
  campaignId: string,
  options?: { format?: 'text' | 'json' }
): Promise<void> {
  const db = getDatabase();
  const campaignClient = new CampaignClient(db.raw);

  const campaign = campaignClient.getCampaign(campaignId);

  if (!campaign) {
    console.error(`Campaign not found: ${campaignId}`);
    return;
  }

  if (options?.format === 'json') {
    console.log(JSON.stringify(campaign, null, 2));
    return;
  }

  console.log(`\nCampaign: ${campaign.campaign_name}\n`);
  console.log(`Status: ${campaign.status}`);
  console.log(`Type: ${campaign.content_type}`);
  console.log(`Content ID: ${campaign.content_id}`);
  console.log(`Personas: ${JSON.parse(campaign.persona_ids).join(', ')}`);
  console.log(`Created: ${campaign.created_at}`);
  if (campaign.completed_at) {
    console.log(`Completed: ${campaign.completed_at}`);
  }

  // Show reviews
  const reviews = campaignClient.getCampaignReviews(campaignId);
  console.log(`\nReviews: ${reviews.length}\n`);

  for (const review of reviews) {
    console.log(`  [${review.status}] ${review.persona_id}`);
  }

  // Show analysis if exists
  const analysis = campaignClient.getCampaignAnalysis(campaignId);
  if (analysis) {
    console.log(`\nAnalysis: ${analysis.markdown_path}`);
  }
}
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/cli-commands/review.ts
git commit -m "feat(reviews): add CLI command structure"
```

---

## Task 7: Test CLI Commands

**Files:**
- Create: `src/tooling/cli-commands/review.test.ts`

**Step 1: Write CLI tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { reviewBook, listCampaigns, viewCampaign } from './review.js';

// Mock console.log to capture output
let consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput = [];
  console.log = (...args: unknown[]) => {
    consoleOutput.push(args.join(' '));
  };
});

afterEach(() => {
  console.log = originalLog;
});

describe('Review CLI Commands', () => {
  const testBookPath = 'data/test/test-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(testBookPath, '<html><body>Test</body></html>');
  });

  afterEach(() => {
    rmSync('data/test', { recursive: true, force: true });
  });

  describe('reviewBook', () => {
    it('creates campaign and shows ID', async () => {
      await reviewBook(testBookPath);

      const output = consoleOutput.join('\n');
      expect(output).toContain('Campaign created');
      expect(output).toContain('campaign-');
    });
  });

  describe('listCampaigns', () => {
    it('shows campaign list', async () => {
      await reviewBook(testBookPath);
      await listCampaigns();

      const output = consoleOutput.join('\n');
      expect(output).toContain('Found');
      expect(output).toContain('campaigns');
    });
  });
});
```

**Step 2: Run tests**

Run: `pnpm test src/tooling/cli-commands/review.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/cli-commands/review.test.ts
git commit -m "test(reviews): add CLI command tests"
```

---

## Task 8: Add CLI Integration to run.ts

**Files:**
- Modify: `src/tooling/cli-commands/run.ts`

**Step 1: Import review commands**

Find the imports section and add:

```typescript
import {
  reviewBook,
  reviewChapter,
  listCampaigns,
  viewCampaign,
} from './review.js';
```

**Step 2: Add command handlers**

Find the command switch/if-else and add:

```typescript
} else if (command === 'review') {
  const subcommand = args[0];

  if (subcommand === 'book') {
    const bookPath = args[1];
    const personas = args.find((a) => a.startsWith('--personas='))?.split('=')[1];
    await reviewBook(bookPath, { personas });
  } else if (subcommand === 'chapter') {
    const chapterPath = args[1];
    const personas = args.find((a) => a.startsWith('--personas='))?.split('=')[1];
    await reviewChapter(chapterPath, { personas });
  } else if (subcommand === 'list') {
    const status = args.find((a) => a.startsWith('--status='))?.split('=')[1];
    const contentType = args.find((a) => a.startsWith('--content-type='))?.split('=')[1];
    await listCampaigns({ status, contentType });
  } else if (subcommand === 'view') {
    const campaignId = args[1];
    const format = args.find((a) => a.startsWith('--format='))?.split('=')[1] as 'text' | 'json';
    await viewCampaign(campaignId, { format });
  } else {
    console.error('Unknown review subcommand');
  }
}
```

**Step 3: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/tooling/cli-commands/run.ts
git commit -m "feat(reviews): integrate review commands into CLI"
```

---

## Task 9: Document Review System Usage

**Files:**
- Create: `docs/workflows/REVIEW_SYSTEM.md`

**Step 1: Write usage documentation**

```markdown
# Review System Usage

The Review System conducts automated multi-persona reviews of book and chapter content using Claude Code agents.

## Quick Start

### Review a Book

```bash
# Review with all core personas
pnpm review book src/site/core_rulebook_web.html

# Review with specific personas
pnpm review book src/site/core_rulebook_web.html --personas=core-sarah,core-alex
```

### Review a Chapter

```bash
pnpm review chapter chapters/combat.md --personas=all_core
```

### List Campaigns

```bash
# All campaigns
pnpm review list

# Filter by status
pnpm review list --status=completed

# Filter by type
pnpm review list --content-type=book
```

### View Campaign Details

```bash
pnpm review view campaign-20251118-143025-abc123
```

## Architecture

**Campaign-Based Model:**
- Each review is a campaign with unique ID
- Snapshots content for consistency
- Tracks all reviews and analysis

**Three Agent Roles:**
1. **Orchestrator** - Manages campaign lifecycle
2. **Reviewer** - One per persona, evaluates content
3. **Analyzer** - Aggregates reviews into insights

## Review Dimensions

Every review scores content on four dimensions (1-10):

1. **Clarity & Readability** - How clear and easy to understand
2. **Rules Accuracy** - Consistency and correctness
3. **Persona Fit** - Works for this persona's experience/style
4. **Practical Usability** - Easy to use at the table

## Outputs

**Individual Reviews:**
- Database: `persona_reviews` table
- Markdown: `data/reviews/raw/{campaign_id}/{persona_id}.md`

**Campaign Analysis:**
- Database: `campaign_analyses` table
- Markdown: `data/reviews/analysis/{campaign_id}.md`

## Analysis Features

**Priority Rankings:**
- Issues ranked by severity × frequency
- Shows which personas affected
- Actionable recommendations

**Dimension Summaries:**
- Average scores per dimension
- Common themes across personas

**Persona Breakdowns:**
- Groups by experience level or archetype
- Strengths and struggles per group

**Trend Tracking:**
- Compare campaigns across versions
- Track improvement over time

## Database Schema

**review_campaigns:**
- Campaign metadata and lifecycle
- Links to content snapshot
- Persona selection strategy

**persona_reviews:**
- Individual review data (JSON)
- Links to campaign and persona
- Agent execution time

**campaign_analyses:**
- Aggregated analysis (JSON)
- Links to campaign
- Markdown output path

## Future Features

- Smart persona sampling based on content type
- Version comparison and regression detection
- Review retry for failed personas
- Interactive analysis dashboard
```

**Step 2: Commit**

```bash
git add docs/workflows/REVIEW_SYSTEM.md
git commit -m "docs(reviews): add review system usage guide"
```

---

## Task 10: Create End-to-End Integration Test

**Files:**
- Create: `src/tooling/reviews/integration.test.ts`

**Step 1: Write integration test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';
import { ReviewOrchestrator } from './orchestrator.js';
import { snapshotBook } from './content-snapshot.js';
import { writeReviewMarkdown } from './markdown-writer.js';

describe('Review System Integration', () => {
  let db: Database.Database;
  let campaignClient: CampaignClient;
  let personaClient: PersonaClient;
  const testBookPath = 'data/test/integration-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(
      testBookPath,
      '<html><body><h1>Integration Test Book</h1><p>Test content</p></body></html>'
    );

    db = new Database(':memory:');
    createTables(db);

    campaignClient = new CampaignClient(db);
    personaClient = new PersonaClient(db);

    // Create test personas
    personaClient.create({
      id: 'test-sarah',
      name: 'Test Sarah',
      type: 'core',
      archetype: 'Explorer',
      experience_level: 'Newbie',
      fiction_first_alignment: 'Curious',
      narrative_mechanics_comfort: 'Neutral',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'Neutral',
      primary_cognitive_style: 'Analytical',
    });

    personaClient.create({
      id: 'test-alex',
      name: 'Test Alex',
      type: 'core',
      archetype: 'Tactician',
      experience_level: 'Veteran',
      fiction_first_alignment: 'Confident',
      narrative_mechanics_comfort: 'High',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'High',
      primary_cognitive_style: 'Strategic',
    });
  });

  afterEach(() => {
    db.close();
    rmSync('data/test', { recursive: true, force: true });
  });

  it('completes full campaign workflow', () => {
    // Step 1: Snapshot content
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0-test',
      source: 'claude',
    });

    expect(contentId).toBeGreaterThan(0);

    // Step 2: Create campaign
    const campaignId = campaignClient.createCampaign({
      campaignName: 'Integration Test Campaign',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-sarah', 'test-alex'],
    });

    expect(campaignId).toMatch(/^campaign-/);

    // Step 3: Simulate reviews
    campaignClient.updateStatus(campaignId, 'in_progress');

    const reviewId1 = campaignClient.createPersonaReview({
      campaignId,
      personaId: 'test-sarah',
      reviewData: {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback:
          'As a new player, I found the content mostly clear and helpful.',
        issue_annotations: [
          {
            section: 'Introduction',
            issue: 'Some jargon not explained',
            impact: 'Had to look up terms',
            location: 'First paragraph',
          },
        ],
        overall_assessment:
          'Great starting point with minor clarity issues',
      },
      agentExecutionTime: 5000,
    });

    const reviewId2 = campaignClient.createPersonaReview({
      campaignId,
      personaId: 'test-alex',
      reviewData: {
        ratings: {
          clarity_readability: 9,
          rules_accuracy: 10,
          persona_fit: 8,
          practical_usability: 9,
        },
        narrative_feedback:
          'Comprehensive and well-structured. Perfect for veterans.',
        issue_annotations: [
          {
            section: 'Introduction',
            issue: 'Could use more advanced examples',
            impact: 'Minor - not critical',
            location: 'Examples section',
          },
        ],
        overall_assessment: 'Excellent resource',
      },
      agentExecutionTime: 4500,
    });

    expect(reviewId1).toBeGreaterThan(0);
    expect(reviewId2).toBeGreaterThan(0);

    // Step 4: Write review markdown
    const review1 = campaignClient.getPersonaReview(reviewId1);
    expect(review1).toBeDefined();

    const markdownPath1 = `data/test/reviews/${campaignId}/test-sarah.md`;
    writeReviewMarkdown(
      {
        campaignId,
        personaName: 'Test Sarah',
        personaArchetype: 'Explorer',
        personaExperience: 'Newbie',
        personaTraits: ['Curious', 'Visual Thinker'],
        contentTitle: 'Integration Test Book',
        reviewData: JSON.parse(review1!.review_data),
      },
      markdownPath1
    );

    expect(existsSync(markdownPath1)).toBe(true);

    // Step 5: Simulate analysis
    campaignClient.updateStatus(campaignId, 'analyzing');

    const analysisId = campaignClient.createCampaignAnalysis({
      campaignId,
      analysisData: {
        executive_summary:
          'Overall strong content with excellent scores across all dimensions. Minor clarity issues for beginners.',
        priority_rankings: [
          {
            category: 'Jargon Clarification',
            severity: 5,
            frequency: 1,
            affected_personas: ['test-sarah'],
            description:
              'Some terminology not explained for new players',
          },
        ],
        dimension_summaries: {
          clarity_readability: {
            average: 8.5,
            themes: ['Clear structure', 'Minor jargon issues'],
          },
          rules_accuracy: {
            average: 9.5,
            themes: ['Comprehensive', 'Well explained'],
          },
          persona_fit: {
            average: 7.5,
            themes: [
              'Great for veterans',
              'Good for beginners with guidance',
            ],
          },
          practical_usability: {
            average: 8.5,
            themes: ['Table-ready', 'Examples helpful'],
          },
        },
        persona_breakdowns: {
          Beginners: {
            strengths: ['Clear structure', 'Helpful examples'],
            struggles: ['Jargon not explained'],
          },
          Veterans: {
            strengths: ['Comprehensive', 'Advanced depth'],
            struggles: ['Could use more advanced examples'],
          },
        },
      },
      markdownPath: `data/test/reviews/analysis/${campaignId}.md`,
    });

    expect(analysisId).toBeGreaterThan(0);

    // Step 6: Complete campaign
    campaignClient.updateStatus(campaignId, 'completed');

    const finalCampaign = campaignClient.getCampaign(campaignId);
    expect(finalCampaign?.status).toBe('completed');
    expect(finalCampaign?.completed_at).toBeDefined();

    // Verify all data retrievable
    const allReviews = campaignClient.getCampaignReviews(campaignId);
    expect(allReviews).toHaveLength(2);

    const analysis = campaignClient.getCampaignAnalysis(campaignId);
    expect(analysis).toBeDefined();
  });
});
```

**Step 2: Run test**

Run: `pnpm test src/tooling/reviews/integration.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/integration.test.ts
git commit -m "test(reviews): add end-to-end integration test"
```

---

## Phase 3 Complete

**Verification Checklist:**

```bash
# All tests pass
pnpm test

# TypeScript compiles
pnpm exec tsc --noEmit

# CLI commands available
pnpm review list
```

**Expected Results:**
- [ ] Analysis schemas validating correctly
- [ ] Analyzer prompts generating with review context
- [ ] Analysis markdown writer producing formatted output
- [ ] CLI commands functional
- [ ] Integration test passing
- [ ] Documentation complete

**Files Created/Modified:**
- Modified: `src/tooling/reviews/schemas.ts` (added analysis schemas)
- Modified: `src/tooling/reviews/schemas.test.ts`
- Created: `src/tooling/reviews/analyzer-prompt.ts`
- Created: `src/tooling/reviews/analyzer-prompt.test.ts`
- Modified: `src/tooling/reviews/markdown-writer.ts`
- Created: `src/tooling/cli-commands/review.ts`
- Created: `src/tooling/cli-commands/review.test.ts`
- Modified: `src/tooling/cli-commands/run.ts`
- Created: `docs/workflows/REVIEW_SYSTEM.md`
- Created: `src/tooling/reviews/integration.test.ts`

**Remaining Work (Future Phases):**
- Implement parallel agent execution via Task tool
- Add agent result polling and validation
- Implement retry mechanism for failed reviews
- Add smart persona sampling strategy
- Build version comparison features
- Create analysis dashboard

---

**Project Complete!** All three phases provide a solid foundation for the Review System. The parallel execution and agent orchestration can be added incrementally once the base system is validated.

**Back to:** [Review System Index](./review-system-index.md)
