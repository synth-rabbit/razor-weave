# Review System Phase 5 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable human-guided agent execution for the Review System by generating standalone prompt files that contain all necessary context, code, and instructions for Claude Code agents to execute reviews and analysis.

**Architecture:** CLI generates text files containing prompts + database access code. User tells Claude Code to read these files and launch Task agents. Agents write results to database and markdown. CLI verifies completion by checking database.

**Tech Stack:** TypeScript, better-sqlite3, Vitest, existing review system (CampaignClient, PersonaClient, content snapshots)

---

## Task 1: Create Prompt Generator for Reviewer Agents

**Files:**
- Create: `src/tooling/reviews/prompt-generator.ts`
- Test: `src/tooling/reviews/prompt-generator.test.ts`
- Reference: `src/tooling/reviews/reviewer-prompt.ts` (existing)

**Step 1: Write the failing test**

Create test file that verifies prompt generation with complete output:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { PersonaClient } from '../database/persona-client.js';
import { CampaignClient } from './campaign-client.js';
import { snapshotBook } from './content-snapshot.js';
import { generateReviewerPromptFile } from './prompt-generator.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

describe('generateReviewerPromptFile', () => {
  let db: Database.Database;
  let personaClient: PersonaClient;
  let campaignClient: CampaignClient;
  const testBookPath = 'data/test/prompt-gen-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(testBookPath, '<html><body><h1>Test Book</h1></body></html>');

    db = new Database(':memory:');
    createTables(db);
    personaClient = new PersonaClient(db);
    campaignClient = new CampaignClient(db);

    personaClient.create({
      id: 'test-sarah',
      name: 'Sarah Chen',
      type: 'core',
      archetype: 'Explorer',
      experience_level: 'Newbie',
      fiction_first_alignment: 'Curious',
      narrative_mechanics_comfort: 'Neutral',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'Neutral',
      primary_cognitive_style: 'Visual',
    });
  });

  afterEach(() => {
    db.close();
    rmSync('data/test', { recursive: true, force: true });
  });

  it('generates complete prompt file with all sections', () => {
    // Create campaign
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0',
      source: 'claude',
    });

    const campaignId = campaignClient.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-sarah'],
    });

    // Generate prompt
    const promptText = generateReviewerPromptFile(db, campaignId, 'test-sarah');

    // Verify sections exist
    expect(promptText).toContain('You are conducting a review for campaign');
    expect(promptText).toContain('PERSONA: test-sarah');
    expect(promptText).toContain('Sarah Chen');
    expect(promptText).toContain('Explorer');
    expect(promptText).toContain('Newbie');
    expect(promptText).toContain('CONTENT:');
    expect(promptText).toContain('TASK: Review this book');
    expect(promptText).toContain('OUTPUT REQUIREMENTS');
    expect(promptText).toContain('campaignClient.createPersonaReview');
    expect(promptText).toContain('writeReviewMarkdown');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/tooling/reviews/prompt-generator.test.ts
```

Expected: FAIL - "Cannot find module './prompt-generator.js'"

**Step 3: Write minimal implementation**

Create `src/tooling/reviews/prompt-generator.ts`:

```typescript
import type Database from 'better-sqlite3';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';

export function generateReviewerPromptFile(
  db: Database.Database,
  campaignId: string,
  personaId: string
): string {
  const campaignClient = new CampaignClient(db);
  const personaClient = new PersonaClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const persona = personaClient.getById(personaId);
  if (!persona) {
    throw new Error(`Persona not found: ${personaId}`);
  }

  // Get content details
  const contentQuery = db.prepare('SELECT * FROM book_versions WHERE id = ?');
  const content = contentQuery.get(campaign.content_id) as {
    id: number;
    content_hash: string;
    version: string;
  };

  const prompt = `You are conducting a review for campaign-${campaignId}.

PERSONA: ${personaId} (${persona.archetype}/${persona.experience_level})
- Name: ${persona.name}
- Archetype: ${persona.archetype}
- Experience: ${persona.experience_level}
- Fiction-First: ${persona.fiction_first_alignment}
- Narrative/Mechanics: ${persona.narrative_mechanics_comfort}
- GM Philosophy: ${persona.gm_philosophy}
- Genre Flexibility: ${persona.genre_flexibility}
- Cognitive Style: ${persona.primary_cognitive_style}

Full persona profile:
${JSON.stringify(persona, null, 2)}

CONTENT: Book (version ${content.version}, hash ${content.content_hash})
- Content ID: ${content.id} (stored in book_versions table)
- Retrieve content using:
  SELECT content FROM book_versions WHERE id = ${content.id}

TASK: Review this book from ${persona.name}'s perspective

Evaluate on 4 dimensions (1-10 scale):
1. Clarity & Readability - How clear and easy to understand
2. Rules Accuracy - Consistency and correctness of game mechanics
3. Persona Fit - Works for ${persona.name}'s experience level and style
4. Practical Usability - Easy to use at the table during gameplay

Provide:
- Ratings for each dimension
- Narrative feedback in ${persona.name}'s voice
- Issue annotations (specific problems with location and impact)
- Overall assessment

OUTPUT REQUIREMENTS:

1. Write review JSON to database:

import { getDatabase } from '@razorweave/tooling/database';
import { CampaignClient } from '@razorweave/tooling/reviews';

const db = getDatabase();
const campaignClient = new CampaignClient(db.raw);

campaignClient.createPersonaReview({
  campaignId: '${campaignId}',
  personaId: '${personaId}',
  reviewData: {
    ratings: {
      clarity_readability: <1-10>,
      rules_accuracy: <1-10>,
      persona_fit: <1-10>,
      practical_usability: <1-10>
    },
    narrative_feedback: "<${persona.name}'s thoughts>",
    issue_annotations: [
      {
        section: "<section name>",
        issue: "<what's wrong>",
        impact: "<how it affects gameplay>",
        location: "<where in section>"
      }
    ],
    overall_assessment: "<summary>"
  },
  agentExecutionTime: <milliseconds>
});

2. Write markdown file:

import { writeReviewMarkdown } from '@razorweave/tooling/reviews';

writeReviewMarkdown(
  {
    campaignId: '${campaignId}',
    personaName: '${persona.name}',
    personaArchetype: '${persona.archetype}',
    personaExperience: '${persona.experience_level}',
    personaTraits: ['${persona.fiction_first_alignment}', '${persona.primary_cognitive_style}'],
    contentTitle: 'Book Review',
    reviewData: <your review JSON>
  },
  'data/reviews/raw/${campaignId}/${personaId}.md'
);

SCHEMA: Review data must match ReviewDataSchema

import { ReviewDataSchema } from '@razorweave/tooling/reviews/schemas';

Validate with:
ReviewDataSchema.parse(reviewData); // Throws if invalid
`;

  return prompt;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/tooling/reviews/prompt-generator.test.ts
```

Expected: PASS - All assertions pass

**Step 5: Commit**

```bash
git add src/tooling/reviews/prompt-generator.ts src/tooling/reviews/prompt-generator.test.ts
git commit -m "feat(reviews): add reviewer prompt file generator

- Generates complete standalone prompts for reviewer agents
- Includes persona profile, content reference, task description
- Provides executable TypeScript code for database writes
- Includes markdown writer integration
- Full test coverage with in-memory database

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add Analyzer Prompt Generator

**Files:**
- Modify: `src/tooling/reviews/prompt-generator.ts`
- Modify: `src/tooling/reviews/prompt-generator.test.ts`

**Step 1: Write the failing test**

Add to `prompt-generator.test.ts`:

```typescript
it('generates analyzer prompt with all reviews', () => {
  // Create campaign with reviews
  const contentId = snapshotBook(db, {
    bookPath: testBookPath,
    version: 'v1.0',
    source: 'claude',
  });

  const campaignId = campaignClient.createCampaign({
    campaignName: 'Test Campaign',
    contentType: 'book',
    contentId,
    personaSelectionStrategy: 'manual',
    personaIds: ['test-sarah'],
  });

  // Create mock review
  campaignClient.updateStatus(campaignId, 'in_progress');
  campaignClient.createPersonaReview({
    campaignId,
    personaId: 'test-sarah',
    reviewData: {
      ratings: {
        clarity_readability: 8,
        rules_accuracy: 9,
        persona_fit: 7,
        practical_usability: 8,
      },
      narrative_feedback: 'Good content',
      issue_annotations: [],
      overall_assessment: 'Solid',
    },
    agentExecutionTime: 5000,
  });

  // Generate analyzer prompt
  const promptText = generateAnalyzerPromptFile(db, campaignId);

  // Verify sections
  expect(promptText).toContain('You are analyzing reviews for campaign');
  expect(promptText).toContain('test-sarah');
  expect(promptText).toContain('Sarah Chen');
  expect(promptText).toContain('clarity_readability: 8');
  expect(promptText).toContain('campaignClient.createCampaignAnalysis');
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/tooling/reviews/prompt-generator.test.ts
```

Expected: FAIL - "generateAnalyzerPromptFile is not a function"

**Step 3: Write implementation**

Add to `prompt-generator.ts`:

```typescript
export function generateAnalyzerPromptFile(
  db: Database.Database,
  campaignId: string
): string {
  const campaignClient = new CampaignClient(db);
  const personaClient = new PersonaClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const reviews = campaignClient.getCampaignReviews(campaignId);
  if (reviews.length === 0) {
    throw new Error(`No reviews found for campaign: ${campaignId}`);
  }

  // Format reviews for display
  const reviewSummaries = reviews
    .map((review) => {
      const persona = personaClient.getById(review.persona_id);
      const data = JSON.parse(review.review_data);

      return `
**Persona:** ${persona?.name} (${persona?.archetype}, ${persona?.experience_level})
**Ratings:**
- clarity_readability: ${data.ratings.clarity_readability}/10
- rules_accuracy: ${data.ratings.rules_accuracy}/10
- persona_fit: ${data.ratings.persona_fit}/10
- practical_usability: ${data.ratings.practical_usability}/10

**Feedback:** ${data.narrative_feedback}
**Assessment:** ${data.overall_assessment}
**Issues:** ${data.issue_annotations.length} identified
`;
    })
    .join('\n---\n');

  const prompt = `You are analyzing reviews for campaign-${campaignId}.

# Review Data

${reviewSummaries}

# Analysis Task

Analyze the ${reviews.length} reviews above and provide comprehensive analysis.

OUTPUT REQUIREMENTS:

1. Write analysis JSON to database:

import { getDatabase } from '@razorweave/tooling/database';
import { CampaignClient } from '@razorweave/tooling/reviews';

const db = getDatabase();
const campaignClient = new CampaignClient(db.raw);

campaignClient.createCampaignAnalysis({
  campaignId: '${campaignId}',
  analysisData: {
    executive_summary: "<2-3 sentence overview>",
    priority_rankings: [
      {
        category: "<issue category>",
        severity: <1-10>,
        frequency: <count>,
        affected_personas: ["<persona-id>"],
        description: "<what and why>"
      }
    ],
    dimension_summaries: {
      clarity_readability: {
        average: <calculated average>,
        themes: ["<common theme>"]
      },
      rules_accuracy: {
        average: <calculated average>,
        themes: ["<common theme>"]
      },
      persona_fit: {
        average: <calculated average>,
        themes: ["<common theme>"]
      },
      practical_usability: {
        average: <calculated average>,
        themes: ["<common theme>"]
      }
    },
    persona_breakdowns: {
      "<group name>": {
        strengths: ["<what worked>"],
        struggles: ["<what didn't>"]
      }
    }
  },
  markdownPath: 'data/reviews/analysis/${campaignId}.md'
});

2. Write markdown file to data/reviews/analysis/${campaignId}.md

Use markdown formatting for readability.
`;

  return prompt;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/tooling/reviews/prompt-generator.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/reviews/prompt-generator.ts src/tooling/reviews/prompt-generator.test.ts
git commit -m "feat(reviews): add analyzer prompt file generator

- Generates analyzer prompts with all review data
- Includes formatted review summaries for analysis
- Provides database write code for analysis results
- Test coverage for analyzer prompt generation

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create Prompt Writer (File I/O)

**Files:**
- Create: `src/tooling/reviews/prompt-writer.ts`
- Test: `src/tooling/reviews/prompt-writer.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import Database from 'better-sqlite3';
import { createTables } from '../database/schema.js';
import { PersonaClient } from '../database/persona-client.js';
import { CampaignClient } from './campaign-client.js';
import { snapshotBook } from './content-snapshot.js';
import { writePromptFiles } from './prompt-writer.js';

describe('writePromptFiles', () => {
  let db: Database.Database;
  let personaClient: PersonaClient;
  let campaignClient: CampaignClient;
  const testBookPath = 'data/test/prompt-writer-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(testBookPath, '<html><body><h1>Test</h1></body></html>');

    db = new Database(':memory:');
    createTables(db);
    personaClient = new PersonaClient(db);
    campaignClient = new CampaignClient(db);

    // Create test personas
    personaClient.create({
      id: 'test-p1',
      name: 'Persona 1',
      type: 'core',
      archetype: 'Explorer',
      experience_level: 'Newbie',
      fiction_first_alignment: 'Curious',
      narrative_mechanics_comfort: 'Neutral',
      gm_philosophy: 'Non-GM',
      genre_flexibility: 'Neutral',
      primary_cognitive_style: 'Visual',
    });

    personaClient.create({
      id: 'test-p2',
      name: 'Persona 2',
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
    if (existsSync('data/reviews/prompts')) {
      rmSync('data/reviews/prompts', { recursive: true, force: true });
    }
  });

  it('creates prompt directory and writes persona files', () => {
    // Create campaign
    const contentId = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0',
      source: 'claude',
    });

    const campaignId = campaignClient.createCampaign({
      campaignName: 'Test',
      contentType: 'book',
      contentId,
      personaSelectionStrategy: 'manual',
      personaIds: ['test-p1', 'test-p2'],
    });

    // Write prompts
    const result = writePromptFiles(db, campaignId);

    // Verify directory created
    expect(existsSync(`data/reviews/prompts/${campaignId}`)).toBe(true);

    // Verify files created
    expect(result.reviewerPrompts).toHaveLength(2);
    expect(result.reviewerPrompts).toContain(
      `data/reviews/prompts/${campaignId}/test-p1.txt`
    );
    expect(result.reviewerPrompts).toContain(
      `data/reviews/prompts/${campaignId}/test-p2.txt`
    );

    // Verify file contents
    const p1Content = readFileSync(
      `data/reviews/prompts/${campaignId}/test-p1.txt`,
      'utf-8'
    );
    expect(p1Content).toContain('test-p1');
    expect(p1Content).toContain('Persona 1');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/tooling/reviews/prompt-writer.test.ts
```

Expected: FAIL - "Cannot find module './prompt-writer.js'"

**Step 3: Write implementation**

Create `src/tooling/reviews/prompt-writer.ts`:

```typescript
import type Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'fs';
import { CampaignClient } from './campaign-client.js';
import { generateReviewerPromptFile } from './prompt-generator.js';

export interface WritePromptFilesResult {
  campaignId: string;
  promptDirectory: string;
  reviewerPrompts: string[];
}

export function writePromptFiles(
  db: Database.Database,
  campaignId: string
): WritePromptFilesResult {
  const campaignClient = new CampaignClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Determine persona IDs
  const personaIds =
    campaign.persona_selection_strategy === 'all_core'
      ? getAllCorePersonaIds(db)
      : JSON.parse(campaign.persona_ids || '[]');

  if (personaIds.length === 0) {
    throw new Error('No personas selected for campaign');
  }

  // Create prompt directory
  const promptDirectory = `data/reviews/prompts/${campaignId}`;
  mkdirSync(promptDirectory, { recursive: true });

  // Write reviewer prompts
  const reviewerPrompts: string[] = [];
  for (const personaId of personaIds) {
    const promptText = generateReviewerPromptFile(db, campaignId, personaId);
    const filePath = `${promptDirectory}/${personaId}.txt`;
    writeFileSync(filePath, promptText, 'utf-8');
    reviewerPrompts.push(filePath);
  }

  return {
    campaignId,
    promptDirectory,
    reviewerPrompts,
  };
}

function getAllCorePersonaIds(db: Database.Database): string[] {
  const query = db.prepare("SELECT id FROM personas WHERE type = 'core'");
  const rows = query.all() as { id: string }[];
  return rows.map((r) => r.id);
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/tooling/reviews/prompt-writer.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/reviews/prompt-writer.ts src/tooling/reviews/prompt-writer.test.ts
git commit -m "feat(reviews): add prompt file writer

- Creates prompt directory for campaigns
- Writes one .txt file per persona
- Resolves persona IDs from campaign config
- Returns list of generated prompt paths
- Full test coverage

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Update Review Orchestrator

**Files:**
- Modify: `src/tooling/reviews/review-orchestrator.ts`
- Modify: `src/tooling/reviews/review-orchestrator.test.ts`

**Step 1: Write the failing test**

Add to `review-orchestrator.test.ts`:

```typescript
it('executeReviews generates prompt files', () => {
  // Setup
  const contentId = snapshotBook(db, {
    bookPath: testBookPath,
    version: 'v1.0',
    source: 'claude',
  });

  const campaignId = orchestrator.initializeCampaign({
    campaignName: 'Test',
    contentType: 'book',
    contentPath: testBookPath,
    personaSelectionStrategy: 'manual',
    personaIds: ['test-sarah'],
  });

  // Execute reviews
  orchestrator.executeReviews(campaignId);

  // Verify prompts created
  const promptPath = `data/reviews/prompts/${campaignId}/test-sarah.txt`;
  expect(existsSync(promptPath)).toBe(true);

  const content = readFileSync(promptPath, 'utf-8');
  expect(content).toContain('test-sarah');
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/tooling/reviews/review-orchestrator.test.ts
```

Expected: FAIL - Test expects prompts but orchestrator still has placeholder logging

**Step 3: Implement prompt generation**

Update `review-orchestrator.ts` `executeReviews` method:

```typescript
import { writePromptFiles } from './prompt-writer.js';

// ... existing code ...

executeReviews(campaignId: string): void {
  const campaign = this.campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  if (campaign.status !== 'pending') {
    throw new Error('Campaign must be in pending status to execute reviews');
  }

  this.campaignClient.updateStatus(campaignId, 'in_progress');

  const personaIds = this.resolvePersonaIds(campaign);
  if (personaIds.length === 0) {
    throw new Error('No personas selected for review');
  }

  // Generate prompt files
  const result = writePromptFiles(this.db, campaignId);

  console.log(`\n✅ Generated ${result.reviewerPrompts.length} review prompts`);
  console.log(`📁 Location: ${result.promptDirectory}/`);
  console.log('\nNext: Tell Claude Code to execute reviews');
  console.log('\nCopy this to Claude Code:');
  console.log('─'.repeat(60));
  console.log(`Read prompts from ${result.promptDirectory}/`);
  console.log('and execute reviewer agents in batches of 5');
  console.log('─'.repeat(60));
  console.log('\nAfter agents complete, check status with:');
  console.log(`  pnpm review status ${campaignId}`);
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/tooling/reviews/review-orchestrator.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/reviews/review-orchestrator.ts src/tooling/reviews/review-orchestrator.test.ts
git commit -m "feat(reviews): update orchestrator to generate prompts

- Replace placeholder logging with prompt generation
- Output user instructions for Claude Code
- Include campaign status checking command
- Update tests to verify prompt file creation

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Add Status Checking CLI Command

**Files:**
- Modify: `src/tooling/cli-commands/review.ts`
- Modify: `src/tooling/cli-commands/run.ts`
- Modify: `src/tooling/cli-commands/review.test.ts`

**Step 1: Write the failing test**

Add to `review.test.ts`:

```typescript
import { statusCampaign } from './review.js';

describe('statusCampaign', () => {
  it('shows campaign progress', () => {
    // Create campaign with reviews
    reviewBook(testBookPath, { personas: 'test-sarah,test-alex' });
    const campaignId = consoleOutput
      .find((line) => line.includes('campaign-'))
      ?.match(/campaign-[a-z0-9-]+/)?.[0];

    consoleOutput = [];
    statusCampaign(campaignId!);

    const output = consoleOutput.join('\n');
    expect(output).toContain('Campaign:');
    expect(output).toContain('Status:');
    expect(output).toContain('Expected reviews:');
    expect(output).toContain('Completed reviews:');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/tooling/cli-commands/review.test.ts
```

Expected: FAIL - "statusCampaign is not a function"

**Step 3: Implement status command**

Add to `review.ts`:

```typescript
export function statusCampaign(campaignId: string): void {
  const db = getDatabase();
  const campaignClient = new CampaignClient(db.raw);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    console.error(`Campaign not found: ${campaignId}`);
    process.exit(1);
  }

  const reviews = campaignClient.getCampaignReviews(campaignId);

  // Determine expected count
  const personaIds =
    campaign.persona_selection_strategy === 'all_core'
      ? getAllCorePersonaIds(db.raw)
      : JSON.parse(campaign.persona_ids || '[]');

  const expectedCount = personaIds.length;
  const completedCount = reviews.length;

  console.log(`\nCampaign: ${campaignId}`);
  console.log(`Status: ${campaign.status}`);
  console.log(`Expected reviews: ${expectedCount}`);
  console.log(`Completed reviews: ${completedCount}`);

  if (completedCount < expectedCount) {
    const missing = personaIds.filter(
      (id) => !reviews.some((r) => r.persona_id === id)
    );
    console.log(`Missing reviews: ${missing.join(', ')}`);
  } else if (completedCount === expectedCount && campaign.status === 'in_progress') {
    console.log('\n✅ All reviews complete! Ready for analysis.');
    console.log('\nNext: Tell Claude Code to run analysis');
    console.log('\nCopy this to Claude Code:');
    console.log('─'.repeat(60));
    console.log(
      `Read analyzer prompt from data/reviews/prompts/${campaignId}/analyzer.txt`
    );
    console.log('and execute analyzer agent');
    console.log('─'.repeat(60));
  } else if (campaign.status === 'completed') {
    const analysis = campaignClient.getCampaignAnalysis(campaignId);
    console.log(`\n✅ Campaign complete`);
    console.log(`\n📁 Outputs:`);
    console.log(`  Reviews: data/reviews/raw/${campaignId}/`);
    if (analysis) {
      console.log(`  Analysis: ${analysis.markdown_path}`);
    }
  }
}

function getAllCorePersonaIds(db: Database.Database): string[] {
  const query = db.prepare("SELECT id FROM personas WHERE type = 'core'");
  const rows = query.all() as { id: string }[];
  return rows.map((r) => r.id);
}
```

Update `run.ts` to add status command:

```typescript
import { statusCampaign } from './review.js';

// In main():
} else if (subcommand === 'status') {
  const campaignId = args[2];
  if (!campaignId) {
    console.error('Error: Please provide a campaign ID');
    console.error('Usage: pnpm tsx src/tooling/cli-commands/run.ts review status <campaign-id>');
    process.exit(1);
  }

  await statusCampaign(campaignId);
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/tooling/cli-commands/review.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/tooling/cli-commands/review.ts src/tooling/cli-commands/run.ts src/tooling/cli-commands/review.test.ts
git commit -m "feat(reviews): add campaign status checking

- New statusCampaign() function shows progress
- Displays expected vs completed review counts
- Lists missing reviews if incomplete
- Shows next steps based on campaign state
- Integrated into CLI: pnpm review status <id>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Export New Functions

**Files:**
- Modify: `src/tooling/reviews/index.ts`

**Step 1: Add exports**

```typescript
export { generateReviewerPromptFile, generateAnalyzerPromptFile } from './prompt-generator.js';
export { writePromptFiles } from './prompt-writer.js';
export type { WritePromptFilesResult } from './prompt-writer.js';
```

**Step 2: Verify imports work**

```bash
pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/index.ts
git commit -m "feat(reviews): export prompt generation functions

- Export generateReviewerPromptFile
- Export generateAnalyzerPromptFile
- Export writePromptFiles and its result type

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Update Documentation

**Files:**
- Modify: `docs/workflows/REVIEW_SYSTEM.md`

**Step 1: Update implementation status**

Update the "Implementation Status" section:

```markdown
## Implementation Status

**✅ Phase 1-4 Complete:**
- Database schema and clients
- Content snapshotting with hash validation
- Review and analysis schemas (Zod)
- Prompt generators (reviewer and analyzer)
- Markdown writers
- CLI command interface
- ReviewOrchestrator class with full lifecycle management

**✅ Phase 5 Complete:**
- Prompt file generation (generateReviewerPromptFile, generateAnalyzerPromptFile)
- Prompt file writer (writePromptFiles)
- Updated ReviewOrchestrator to generate prompts
- Campaign status checking (pnpm review status)
- User instructions for agent execution

**Workflow:**
1. Run `pnpm review book <path>` to create campaign and generate prompts
2. CLI outputs instructions for Claude Code
3. User tells Claude Code to execute agents in batches
4. Run `pnpm review status <campaign-id>` to check progress
5. CLI shows next steps (analysis or completion)

**Note:** Agent execution requires human to instruct Claude Code in same session.
No automated agent launching. This is by design for transparency and control.
```

**Step 2: Commit**

```bash
git add docs/workflows/REVIEW_SYSTEM.md
git commit -m "docs(reviews): update implementation status for Phase 5

- Mark Phase 5 as complete
- Document new prompt generation functions
- Describe human-guided workflow
- Note intentional design decision (no automation)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Run Integration Test

**Files:**
- None (manual verification)

**Step 1: Run full test suite**

```bash
pnpm test src/tooling/reviews/
```

Expected: All tests pass

**Step 2: Test end-to-end workflow manually**

```bash
# 1. Create campaign
pnpm tsx src/tooling/cli-commands/run.ts review book src/site/core_rulebook_web.html

# 2. Verify prompts created
ls data/reviews/prompts/campaign-*/

# 3. Check a prompt file
cat data/reviews/prompts/campaign-*/core-sarah.txt

# 4. Check status
pnpm tsx src/tooling/cli-commands/run.ts review status campaign-<id>
```

Expected:
- Campaign created
- Prompt files exist
- Prompt contains all sections
- Status shows 0/10 reviews completed

**Step 3: Document manual test results**

Create git commit with test results in commit message.

**Step 4: Commit**

```bash
git commit --allow-empty -m "test(reviews): verify Phase 5 end-to-end workflow

Manual testing completed:
✅ Campaign creation generates prompts
✅ Prompt files contain all required sections
✅ Status checking shows correct counts
✅ CLI outputs correct user instructions

Ready for human-guided agent execution.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Success Criteria

- ✅ `generateReviewerPromptFile()` creates complete standalone prompts
- ✅ `generateAnalyzerPromptFile()` aggregates all reviews
- ✅ `writePromptFiles()` writes prompts to filesystem
- ✅ `ReviewOrchestrator.executeReviews()` generates prompts and outputs instructions
- ✅ `pnpm review status <id>` shows campaign progress
- ✅ All tests pass
- ✅ Documentation updated
- ✅ End-to-end workflow verified

## Next Steps (Future)

After this implementation:
1. User can run `pnpm review book <path>`
2. User tells Claude Code to execute agents
3. Agents write reviews to database
4. User runs `pnpm review status <id>`
5. User tells Claude Code to run analysis
6. Campaign completes with all outputs

Future enhancements:
- Analyzer prompt file generation in `writePromptFiles()`
- Retry mechanism for failed agents
- Progress tracking during execution
