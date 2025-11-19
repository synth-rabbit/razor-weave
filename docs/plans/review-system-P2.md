# Review System Phase 2: Review Workflow

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build reviewer agent prompt generation, orchestrator for parallel execution, and output validation.

**Architecture:** Generate detailed prompts for reviewer agents that include persona context and review dimensions. Orchestrator launches parallel reviewer agents via Claude Code Task tool, polls for completion, validates outputs, and handles failures.

**Tech Stack:** TypeScript, Claude Code Task tool, Zod for JSON schema validation

**Dependencies:** Phase 1 must be complete (database schema and CampaignClient working)

---

## Task 1: Install Zod for Schema Validation

**Step 1: Install dependency**

Run: `pnpm add zod`
Expected: Package installed successfully

**Step 2: Verify installation**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build(reviews): add zod for schema validation"
```

---

## Task 2: Create Review Output Schema Types

**Files:**
- Create: `src/tooling/reviews/schemas.ts`

**Step 1: Write Zod schemas**

```typescript
import { z } from 'zod';

export const IssueAnnotationSchema = z.object({
  section: z.string().min(1),
  issue: z.string().min(1),
  impact: z.string().min(1),
  location: z.string().min(1),
});

export const RatingsSchema = z.object({
  clarity_readability: z.number().int().min(1).max(10),
  rules_accuracy: z.number().int().min(1).max(10),
  persona_fit: z.number().int().min(1).max(10),
  practical_usability: z.number().int().min(1).max(10),
});

export const ReviewDataSchema = z.object({
  ratings: RatingsSchema,
  narrative_feedback: z.string().min(10),
  issue_annotations: z.array(IssueAnnotationSchema).min(1),
  overall_assessment: z.string().min(10),
});

export type ReviewData = z.infer<typeof ReviewDataSchema>;
export type IssueAnnotation = z.infer<typeof IssueAnnotationSchema>;
export type Ratings = z.infer<typeof RatingsSchema>;
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/schemas.ts
git commit -m "feat(reviews): add Zod schemas for review validation"
```

---

## Task 3: Test Review Schema Validation

**Files:**
- Create: `src/tooling/reviews/schemas.test.ts`

**Step 1: Write validation tests**

```typescript
import { describe, it, expect } from 'vitest';
import { ReviewDataSchema } from './schemas.js';

describe('Review Schemas', () => {
  describe('ReviewDataSchema', () => {
    it('validates correct review data', () => {
      const validData = {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback:
          'This content was clear and well-structured for my playstyle.',
        issue_annotations: [
          {
            section: 'Combat Rules',
            issue: 'Initiative rules unclear',
            impact: 'Confusion during first combat encounter',
            location: 'Page 42, paragraph 3',
          },
        ],
        overall_assessment: 'Strong content with minor clarity issues',
      };

      const result = ReviewDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects ratings out of range', () => {
      const invalidData = {
        ratings: {
          clarity_readability: 11,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'Test feedback',
        issue_annotations: [
          {
            section: 'Test',
            issue: 'Test',
            impact: 'Test',
            location: 'Test',
          },
        ],
        overall_assessment: 'Test assessment',
      };

      const result = ReviewDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing issue annotations', () => {
      const invalidData = {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'Test feedback',
        issue_annotations: [],
        overall_assessment: 'Test assessment',
      };

      const result = ReviewDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects short feedback', () => {
      const invalidData = {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'Short',
        issue_annotations: [
          {
            section: 'Test',
            issue: 'Test',
            impact: 'Test',
            location: 'Test',
          },
        ],
        overall_assessment: 'Test assessment',
      };

      const result = ReviewDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
```

**Step 2: Run test**

Run: `pnpm test src/tooling/reviews/schemas.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/schemas.test.ts
git commit -m "test(reviews): add review schema validation tests"
```

---

## Task 4: Create Reviewer Prompt Generator Types

**Files:**
- Create: `src/tooling/reviews/reviewer-prompt.ts`

**Step 1: Write type definitions**

```typescript
export interface ReviewerPromptData {
  personaId: string;
  personaProfile: {
    name: string;
    archetype: string;
    experience_level: string;
    playstyle_traits: string[];
  };
  contentType: 'book' | 'chapter';
  contentSnapshot: string;
  contentTitle: string;
}

export interface ReviewerPromptResult {
  prompt: string;
  expectedOutputSchema: string;
}
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/reviewer-prompt.ts
git commit -m "feat(reviews): add reviewer prompt generator types"
```

---

## Task 5: Test Reviewer Prompt Generation

**Files:**
- Create: `src/tooling/reviews/reviewer-prompt.test.ts`

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { generateReviewerPrompt } from './reviewer-prompt.js';

describe('Reviewer Prompt Generator', () => {
  it('generates prompt with persona context', () => {
    const result = generateReviewerPrompt({
      personaId: 'core-sarah',
      personaProfile: {
        name: 'Sarah',
        archetype: 'Explorer',
        experience_level: 'Newbie (0-1 years)',
        playstyle_traits: ['Curious', 'Visual Thinker'],
      },
      contentType: 'book',
      contentSnapshot: '<html><body><h1>Test Book</h1></body></html>',
      contentTitle: 'Core Rulebook v1.2',
    });

    expect(result.prompt).toContain('Sarah');
    expect(result.prompt).toContain('Explorer');
    expect(result.prompt).toContain('Newbie');
    expect(result.prompt).toContain('clarity_readability');
    expect(result.prompt).toContain('rules_accuracy');
    expect(result.prompt).toContain('persona_fit');
    expect(result.prompt).toContain('practical_usability');
    expect(result.expectedOutputSchema).toContain('ratings');
  });

  it('includes content snapshot in prompt', () => {
    const result = generateReviewerPrompt({
      personaId: 'core-alex',
      personaProfile: {
        name: 'Alex',
        archetype: 'Tactician',
        experience_level: 'Veteran (5+ years)',
        playstyle_traits: ['Analytical'],
      },
      contentType: 'chapter',
      contentSnapshot: '# Combat Rules\n\nTest content',
      contentTitle: 'Chapter 3: Combat',
    });

    expect(result.prompt).toContain('Combat Rules');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/reviewer-prompt.test.ts`
Expected: FAIL

**Step 3: Commit**

```bash
git add src/tooling/reviews/reviewer-prompt.test.ts
git commit -m "test(reviews): add reviewer prompt generation tests"
```

---

## Task 6: Implement Reviewer Prompt Generation

**Files:**
- Modify: `src/tooling/reviews/reviewer-prompt.ts`

**Step 1: Write implementation**

```typescript
export function generateReviewerPrompt(
  data: ReviewerPromptData
): ReviewerPromptResult {
  const { personaProfile, contentType, contentSnapshot, contentTitle } = data;

  const prompt = `You are conducting a ${contentType} review as ${personaProfile.name}, a ${personaProfile.archetype} with ${personaProfile.experience_level} of TTRPG experience.

Your playstyle traits: ${personaProfile.playstyle_traits.join(', ')}

Review the following content and provide ratings (1-10) across four dimensions:
1. **Clarity & Readability** - How clear and easy to understand is the content?
2. **Rules Accuracy** - Are the rules clear, consistent, and well-explained?
3. **Persona Fit** - Does this content work for someone with your experience level and playstyle?
4. **Practical Usability** - How easy would it be to actually use this at the table?

**Content to Review:**
Title: ${contentTitle}

${contentSnapshot}

**Required Output Format:**

Provide your review as valid JSON matching this schema:

\`\`\`json
{
  "ratings": {
    "clarity_readability": <number 1-10>,
    "rules_accuracy": <number 1-10>,
    "persona_fit": <number 1-10>,
    "practical_usability": <number 1-10>
  },
  "narrative_feedback": "<your thoughts in character as ${personaProfile.name}>",
  "issue_annotations": [
    {
      "section": "<section name>",
      "issue": "<specific problem>",
      "impact": "<why it matters for you>",
      "location": "<where in content>"
    }
  ],
  "overall_assessment": "<summary verdict>"
}
\`\`\`

Provide at least one issue annotation. Be specific and honest based on your persona's perspective.`;

  const expectedOutputSchema = JSON.stringify(
    {
      ratings: {
        clarity_readability: 'number (1-10)',
        rules_accuracy: 'number (1-10)',
        persona_fit: 'number (1-10)',
        practical_usability: 'number (1-10)',
      },
      narrative_feedback: 'string',
      issue_annotations: [
        {
          section: 'string',
          issue: 'string',
          impact: 'string',
          location: 'string',
        },
      ],
      overall_assessment: 'string',
    },
    null,
    2
  );

  return { prompt, expectedOutputSchema };
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/reviewer-prompt.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/reviewer-prompt.ts
git commit -m "feat(reviews): implement reviewer prompt generation"
```

---

## Task 7: Create Validators Module

**Files:**
- Create: `src/tooling/reviews/validators.ts`

**Step 1: Write validator functions**

```typescript
import { existsSync } from 'fs';
import { ReviewDataSchema } from './schemas.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateReviewData(data: unknown): ValidationResult {
  const result = ReviewDataSchema.safeParse(data);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );

  return { valid: false, errors };
}

export function validateFileExists(filePath: string): ValidationResult {
  if (!existsSync(filePath)) {
    return {
      valid: false,
      errors: [`File does not exist: ${filePath}`],
    };
  }

  return { valid: true, errors: [] };
}

export function validateReviewComplete(
  campaignId: string,
  personaId: string,
  reviewDbRecord: unknown,
  markdownPath: string
): ValidationResult {
  const errors: string[] = [];

  // Check database record exists
  if (!reviewDbRecord) {
    errors.push(`No database record for ${personaId} in ${campaignId}`);
  }

  // Check markdown file exists
  if (!existsSync(markdownPath)) {
    errors.push(`Markdown file missing: ${markdownPath}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/validators.ts
git commit -m "feat(reviews): add validation functions"
```

---

## Task 8: Test Validators

**Files:**
- Create: `src/tooling/reviews/validators.test.ts`

**Step 1: Write tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import {
  validateReviewData,
  validateFileExists,
  validateReviewComplete,
} from './validators.js';

describe('Validators', () => {
  describe('validateReviewData', () => {
    it('validates correct review data', () => {
      const validData = {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'This is good feedback that is long enough',
        issue_annotations: [
          {
            section: 'Combat',
            issue: 'Unclear',
            impact: 'Confusion',
            location: 'Page 1',
          },
        ],
        overall_assessment: 'Good overall with some issues',
      };

      const result = validateReviewData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid data', () => {
      const invalidData = {
        ratings: { clarity_readability: 11 },
      };

      const result = validateReviewData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateFileExists', () => {
    const testFilePath = 'data/test/validation-test.txt';

    beforeEach(() => {
      mkdirSync('data/test', { recursive: true });
    });

    afterEach(() => {
      rmSync('data/test', { recursive: true, force: true });
    });

    it('validates existing file', () => {
      writeFileSync(testFilePath, 'test');

      const result = validateFileExists(testFilePath);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing file', () => {
      const result = validateFileExists('nonexistent.txt');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('does not exist');
    });
  });

  describe('validateReviewComplete', () => {
    const testFilePath = 'data/test/review.md';

    beforeEach(() => {
      mkdirSync('data/test', { recursive: true });
    });

    afterEach(() => {
      rmSync('data/test', { recursive: true, force: true });
    });

    it('validates complete review', () => {
      writeFileSync(testFilePath, '# Review');

      const result = validateReviewComplete(
        'campaign-123',
        'persona-1',
        { id: 1 },
        testFilePath
      );

      expect(result.valid).toBe(true);
    });

    it('catches missing database record', () => {
      writeFileSync(testFilePath, '# Review');

      const result = validateReviewComplete(
        'campaign-123',
        'persona-1',
        null,
        testFilePath
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('No database record');
    });

    it('catches missing markdown file', () => {
      const result = validateReviewComplete(
        'campaign-123',
        'persona-1',
        { id: 1 },
        'nonexistent.md'
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Markdown file missing');
    });
  });
});
```

**Step 2: Run tests**

Run: `pnpm test src/tooling/reviews/validators.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/validators.test.ts
git commit -m "test(reviews): add validator tests"
```

---

## Task 9: Create Orchestrator Types

**Files:**
- Create: `src/tooling/reviews/orchestrator.ts`

**Step 1: Write type definitions**

```typescript
import type { CampaignStatus } from './campaign-client.js';

export interface OrchestratorConfig {
  campaignName: string;
  contentType: 'book' | 'chapter';
  contentPath: string;
  personaSelectionStrategy: 'all_core' | 'manual' | 'smart_sampling';
  personaIds?: string[];
}

export interface ReviewerAgentTask {
  personaId: string;
  campaignId: string;
  contentSnapshotId: number;
  outputPath: string;
}

export interface OrchestratorResult {
  campaignId: string;
  status: CampaignStatus;
  successfulReviews: number;
  failedReviews: number;
  errors: string[];
}
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/orchestrator.ts
git commit -m "feat(reviews): add orchestrator type definitions"
```

---

## Task 10: Test Orchestrator Campaign Creation

**Files:**
- Create: `src/tooling/reviews/orchestrator.test.ts`

**Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';
import { ReviewOrchestrator } from './orchestrator.js';

describe('ReviewOrchestrator', () => {
  let db: Database.Database;
  let orchestrator: ReviewOrchestrator;
  const testContentPath = 'data/test/test-content.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(testContentPath, '<html><body>Test</body></html>');

    db = new Database(':memory:');
    createTables(db);

    // Create test persona
    const personaClient = new PersonaClient(db);
    personaClient.create({
      id: 'test-persona',
      name: 'Test Persona',
      type: 'core',
      archetype: 'Explorer',
      experience_level: 'Newbie',
      fiction_first_alignment: 'Curious',
      narrative_mechanics_comfort: 'Neutral',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'Neutral',
      primary_cognitive_style: 'Analytical',
    });

    const campaignClient = new CampaignClient(db);
    orchestrator = new ReviewOrchestrator(db, campaignClient);
  });

  afterEach(() => {
    db.close();
    rmSync('data/test', { recursive: true, force: true });
  });

  describe('initializeCampaign', () => {
    it('creates campaign and snapshots content', () => {
      const campaignId = orchestrator.initializeCampaign({
        campaignName: 'Test Campaign',
        contentType: 'book',
        contentPath: testContentPath,
        personaSelectionStrategy: 'manual',
        personaIds: ['test-persona'],
      });

      expect(campaignId).toMatch(/^campaign-/);

      const campaign = orchestrator.getCampaign(campaignId);
      expect(campaign?.campaign_name).toBe('Test Campaign');
      expect(campaign?.status).toBe('pending');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/orchestrator.test.ts`
Expected: FAIL

**Step 3: Commit**

```bash
git add src/tooling/reviews/orchestrator.test.ts
git commit -m "test(reviews): add orchestrator campaign initialization test"
```

---

## Task 11: Implement Orchestrator.initializeCampaign

**Files:**
- Modify: `src/tooling/reviews/orchestrator.ts`

**Step 1: Write implementation**

```typescript
import Database from 'better-sqlite3';
import { CampaignClient } from './campaign-client.js';
import { snapshotBook, snapshotChapter } from './content-snapshot.js';

export class ReviewOrchestrator {
  constructor(
    private db: Database.Database,
    private campaignClient: CampaignClient
  ) {}

  initializeCampaign(config: OrchestratorConfig): string {
    // Snapshot content
    const contentId =
      config.contentType === 'book'
        ? snapshotBook(this.db, {
            bookPath: config.contentPath,
            version: new Date().toISOString(),
            source: 'claude',
          })
        : snapshotChapter(this.db, {
            bookPath: 'unknown',
            chapterPath: config.contentPath,
            version: new Date().toISOString(),
            source: 'claude',
          });

    // Get persona IDs based on strategy
    const personaIds = this.selectPersonas(config);

    // Create campaign
    const campaignId = this.campaignClient.createCampaign({
      campaignName: config.campaignName,
      contentType: config.contentType,
      contentId,
      personaSelectionStrategy: config.personaSelectionStrategy,
      personaIds,
    });

    return campaignId;
  }

  getCampaign(campaignId: string) {
    return this.campaignClient.getCampaign(campaignId);
  }

  private selectPersonas(config: OrchestratorConfig): string[] {
    if (config.personaSelectionStrategy === 'manual') {
      return config.personaIds || [];
    }

    if (config.personaSelectionStrategy === 'all_core') {
      // Get all core personas from database
      const stmt = this.db.prepare(`
        SELECT id FROM personas WHERE type = 'core' AND active = TRUE
      `);
      const rows = stmt.all() as Array<{ id: string }>;
      return rows.map((r) => r.id);
    }

    // smart_sampling not implemented yet
    throw new Error('smart_sampling not yet implemented');
  }
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/orchestrator.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/orchestrator.ts
git commit -m "feat(reviews): implement orchestrator campaign initialization"
```

---

## Task 12: Create Markdown Writer Module

**Files:**
- Create: `src/tooling/reviews/markdown-writer.ts`

**Step 1: Write markdown generation function**

```typescript
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { ReviewData } from './schemas.js';

export interface ReviewMarkdownData {
  campaignId: string;
  personaName: string;
  personaArchetype: string;
  personaExperience: string;
  personaTraits: string[];
  contentTitle: string;
  reviewData: ReviewData;
}

export function writeReviewMarkdown(
  data: ReviewMarkdownData,
  outputPath: string
): void {
  const { reviewData, personaName, personaArchetype, personaExperience, personaTraits, contentTitle, campaignId } = data;

  const markdown = `# Review: ${personaName} - ${contentTitle}

Campaign: ${campaignId} | Date: ${new Date().toISOString()}

## Persona Profile

- **Archetype:** ${personaArchetype}
- **Experience:** ${personaExperience}
- **Playstyle:** ${personaTraits.join(', ')}

## Structured Ratings

- **Clarity & Readability:** ${reviewData.ratings.clarity_readability}/10
- **Rules Accuracy:** ${reviewData.ratings.rules_accuracy}/10
- **Persona Fit:** ${reviewData.ratings.persona_fit}/10
- **Practical Usability:** ${reviewData.ratings.practical_usability}/10

## Narrative Feedback

${reviewData.narrative_feedback}

## Issue Annotations

${reviewData.issue_annotations
  .map(
    (annotation, idx) => `### ${idx + 1}. ${annotation.section}

**Issue:** ${annotation.issue}

**Impact:** ${annotation.impact}

**Location:** ${annotation.location}
`
  )
  .join('\n')}

## Overall Assessment

${reviewData.overall_assessment}
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
git commit -m "feat(reviews): add markdown writer for review output"
```

---

## Task 13: Test Markdown Writer

**Files:**
- Create: `src/tooling/reviews/markdown-writer.test.ts`

**Step 1: Write tests**

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, rmSync, existsSync } from 'fs';
import { writeReviewMarkdown } from './markdown-writer.js';

describe('Markdown Writer', () => {
  const testOutputPath = 'data/test/reviews/test-review.md';

  afterEach(() => {
    if (existsSync('data/test')) {
      rmSync('data/test', { recursive: true, force: true });
    }
  });

  it('writes review markdown with all sections', () => {
    writeReviewMarkdown(
      {
        campaignId: 'campaign-test-123',
        personaName: 'Sarah',
        personaArchetype: 'Explorer',
        personaExperience: 'Newbie (0-1 years)',
        personaTraits: ['Curious', 'Visual Thinker'],
        contentTitle: 'Core Rulebook v1.2',
        reviewData: {
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Great content overall!',
          issue_annotations: [
            {
              section: 'Combat',
              issue: 'Initiative unclear',
              impact: 'Confusion in first session',
              location: 'Page 42',
            },
          ],
          overall_assessment: 'Solid work with minor issues',
        },
      },
      testOutputPath
    );

    expect(existsSync(testOutputPath)).toBe(true);

    const content = readFileSync(testOutputPath, 'utf-8');
    expect(content).toContain('# Review: Sarah - Core Rulebook v1.2');
    expect(content).toContain('Explorer');
    expect(content).toContain('8/10');
    expect(content).toContain('Great content overall!');
    expect(content).toContain('Initiative unclear');
  });
});
```

**Step 2: Run tests**

Run: `pnpm test src/tooling/reviews/markdown-writer.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/markdown-writer.test.ts
git commit -m "test(reviews): add markdown writer tests"
```

---

## Task 14: Document Orchestrator Usage

**Files:**
- Modify: `src/tooling/reviews/orchestrator.ts`

**Step 1: Add JSDoc comments**

Add documentation for the ReviewOrchestrator class:

```typescript
/**
 * ReviewOrchestrator manages the review campaign lifecycle.
 *
 * Responsibilities:
 * 1. Initialize campaigns and snapshot content
 * 2. Launch parallel reviewer agents via Task tool
 * 3. Poll for completion and validate outputs
 * 4. Handle failures and provide diagnostics
 * 5. Trigger analysis after all reviews complete
 *
 * Usage:
 * ```typescript
 * const orchestrator = new ReviewOrchestrator(db, campaignClient);
 *
 * const campaignId = orchestrator.initializeCampaign({
 *   campaignName: 'Core Rulebook v1.2 Review',
 *   contentType: 'book',
 *   contentPath: 'src/site/core_rulebook_web.html',
 *   personaSelectionStrategy: 'all_core'
 * });
 *
 * await orchestrator.executeReviews(campaignId);
 * await orchestrator.runAnalysis(campaignId);
 * ```
 */
export class ReviewOrchestrator {
  // ... existing code
}
```

**Step 2: Commit**

```bash
git add src/tooling/reviews/orchestrator.ts
git commit -m "docs(reviews): add orchestrator usage documentation"
```

---

## Phase 2 Complete

**Verification Checklist:**

Run all commands to verify:

```bash
# All tests pass
pnpm test src/tooling/reviews/

# TypeScript compiles
pnpm exec tsc --noEmit
```

**Expected Results:**
- [ ] All review module tests passing
- [ ] Zod schemas validating correctly
- [ ] Reviewer prompts generating with persona context
- [ ] Validators catching invalid outputs
- [ ] Orchestrator initializing campaigns
- [ ] Markdown writer creating formatted output

**Files Created/Modified:**
- Created: `src/tooling/reviews/schemas.ts`
- Created: `src/tooling/reviews/schemas.test.ts`
- Created: `src/tooling/reviews/reviewer-prompt.ts`
- Created: `src/tooling/reviews/reviewer-prompt.test.ts`
- Created: `src/tooling/reviews/validators.ts`
- Created: `src/tooling/reviews/validators.test.ts`
- Created: `src/tooling/reviews/orchestrator.ts`
- Created: `src/tooling/reviews/orchestrator.test.ts`
- Created: `src/tooling/reviews/markdown-writer.ts`
- Created: `src/tooling/reviews/markdown-writer.test.ts`

**Note:** This phase provides the foundation for review execution. Phase 3 will add:
- Actual parallel agent execution via Task tool
- Analysis agent prompts and logic
- CLI commands for user interaction
- End-to-end integration tests

**Next Phase:** [Phase 3: Analysis & CLI](./review-system-P3.md)
