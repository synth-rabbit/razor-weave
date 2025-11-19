# Review System Phase 1: Database Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up database schema, campaign client, and content snapshotting infrastructure.

**Architecture:** Extend existing database schema with three new tables. Create CampaignClient following the same patterns as PersonaClient. Add content snapshot utilities with hash validation.

**Tech Stack:** TypeScript, better-sqlite3, Vitest

---

## Task 1: Add review_campaigns Table Schema

**Files:**
- Modify: `src/tooling/database/schema.ts` (after persona tables)

**Step 1: Add table creation SQL**

In `schema.ts`, add after the personas table block:

```typescript
// Create review_campaigns table
db.exec(`
  CREATE TABLE IF NOT EXISTS review_campaigns (
    id TEXT PRIMARY KEY,
    campaign_name TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK(content_type IN ('book', 'chapter')),
    content_id INTEGER NOT NULL,
    persona_selection_strategy TEXT NOT NULL CHECK(
      persona_selection_strategy IN ('all_core', 'manual', 'smart_sampling')
    ),
    persona_ids TEXT NOT NULL,
    status TEXT NOT NULL CHECK(
      status IN ('pending', 'in_progress', 'analyzing', 'completed', 'failed')
    ),
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_campaigns_status ON review_campaigns(status);
  CREATE INDEX IF NOT EXISTS idx_campaigns_content ON review_campaigns(content_type, content_id);
  CREATE INDEX IF NOT EXISTS idx_campaigns_created ON review_campaigns(created_at);
`);
```

**Step 2: Verify schema compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No compilation errors

**Step 3: Commit**

```bash
git add src/tooling/database/schema.ts
git commit -m "feat(reviews): add review_campaigns table schema"
```

---

## Task 2: Add persona_reviews Table Schema

**Files:**
- Modify: `src/tooling/database/schema.ts` (after review_campaigns)

**Step 1: Add table creation SQL**

```typescript
// Create persona_reviews table
db.exec(`
  CREATE TABLE IF NOT EXISTS persona_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL,
    persona_id TEXT NOT NULL,
    review_data TEXT NOT NULL,
    agent_execution_time INTEGER,
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES review_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
  );

  CREATE INDEX IF NOT EXISTS idx_persona_reviews_campaign ON persona_reviews(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_persona_reviews_persona ON persona_reviews(persona_id);
  CREATE INDEX IF NOT EXISTS idx_persona_reviews_status ON persona_reviews(status);
`);
```

**Step 2: Verify schema compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No compilation errors

**Step 3: Commit**

```bash
git add src/tooling/database/schema.ts
git commit -m "feat(reviews): add persona_reviews table schema"
```

---

## Task 3: Add campaign_analyses Table Schema

**Files:**
- Modify: `src/tooling/database/schema.ts` (after persona_reviews)

**Step 1: Add table creation SQL**

```typescript
// Create campaign_analyses table
db.exec(`
  CREATE TABLE IF NOT EXISTS campaign_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL UNIQUE,
    analysis_data TEXT NOT NULL,
    markdown_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES review_campaigns(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_campaign_analyses_campaign ON campaign_analyses(campaign_id);
`);
```

**Step 2: Verify schema compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No compilation errors

**Step 3: Commit**

```bash
git add src/tooling/database/schema.ts
git commit -m "feat(reviews): add campaign_analyses table schema"
```

---

## Task 4: Create CampaignClient Types

**Files:**
- Create: `src/tooling/reviews/campaign-client.ts`

**Step 1: Write type definitions**

```typescript
import Database from 'better-sqlite3';

export type CampaignStatus =
  | 'pending'
  | 'in_progress'
  | 'analyzing'
  | 'completed'
  | 'failed';

export type ContentType = 'book' | 'chapter';

export type PersonaSelectionStrategy =
  | 'all_core'
  | 'manual'
  | 'smart_sampling';

export interface CreateCampaignData {
  campaignName: string;
  contentType: ContentType;
  contentId: number;
  personaSelectionStrategy: PersonaSelectionStrategy;
  personaIds: string[];
  metadata?: Record<string, unknown>;
}

export interface Campaign {
  id: string;
  campaign_name: string;
  content_type: ContentType;
  content_id: number;
  persona_selection_strategy: PersonaSelectionStrategy;
  persona_ids: string;
  status: CampaignStatus;
  metadata: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PersonaReviewData {
  campaignId: string;
  personaId: string;
  reviewData: {
    ratings: {
      clarity_readability: number;
      rules_accuracy: number;
      persona_fit: number;
      practical_usability: number;
    };
    narrative_feedback: string;
    issue_annotations: Array<{
      section: string;
      issue: string;
      impact: string;
      location: string;
    }>;
    overall_assessment: string;
  };
  agentExecutionTime?: number;
}

export interface PersonaReview {
  id: number;
  campaign_id: string;
  persona_id: string;
  review_data: string;
  agent_execution_time: number | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface CampaignAnalysisData {
  campaignId: string;
  analysisData: {
    executive_summary: string;
    priority_rankings: Array<{
      category: string;
      severity: number;
      frequency: number;
      affected_personas: string[];
      description: string;
    }>;
    dimension_summaries: {
      clarity_readability: { average: number; themes: string[] };
      rules_accuracy: { average: number; themes: string[] };
      persona_fit: { average: number; themes: string[] };
      practical_usability: { average: number; themes: string[] };
    };
    persona_breakdowns: Record<
      string,
      { strengths: string[]; struggles: string[] }
    >;
    trend_analysis?: string;
  };
  markdownPath: string;
}

export interface CampaignAnalysis {
  id: number;
  campaign_id: string;
  analysis_data: string;
  markdown_path: string;
  created_at: string;
}
```

**Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No compilation errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.ts
git commit -m "feat(reviews): add CampaignClient type definitions"
```

---

## Task 5: Test CampaignClient.createCampaign

**Files:**
- Create: `src/tooling/reviews/campaign-client.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync } from 'fs';
import Database from 'better-sqlite3';
import { CampaignClient } from './campaign-client.js';
import { createTables } from '../database/schema.js';

describe('CampaignClient', () => {
  let db: Database.Database;
  let client: CampaignClient;

  beforeEach(() => {
    mkdirSync('data', { recursive: true });
    db = new Database(':memory:');
    createTables(db);
    client = new CampaignClient(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createCampaign', () => {
    it('creates a campaign with all_core strategy', () => {
      const campaignId = client.createCampaign({
        campaignName: 'Core Rulebook v1.2 Review',
        contentType: 'book',
        contentId: 1,
        personaSelectionStrategy: 'all_core',
        personaIds: ['core-sarah', 'core-alex'],
      });

      expect(campaignId).toMatch(/^campaign-\d{8}-\d{6}-[a-z0-9]+$/);

      const campaign = client.getCampaign(campaignId);
      expect(campaign).toBeDefined();
      expect(campaign?.campaign_name).toBe('Core Rulebook v1.2 Review');
      expect(campaign?.content_type).toBe('book');
      expect(campaign?.content_id).toBe(1);
      expect(campaign?.status).toBe('pending');
      expect(JSON.parse(campaign!.persona_ids)).toEqual([
        'core-sarah',
        'core-alex',
      ]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: FAIL - "CampaignClient is not defined" or similar

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.test.ts
git commit -m "test(reviews): add CampaignClient.createCampaign test"
```

---

## Task 6: Implement CampaignClient.createCampaign

**Files:**
- Modify: `src/tooling/reviews/campaign-client.ts`

**Step 1: Write minimal implementation**

Add to campaign-client.ts:

```typescript
export class CampaignClient {
  constructor(private db: Database.Database) {}

  createCampaign(data: CreateCampaignData): string {
    const id = this.generateCampaignId();
    const personaIdsJson = JSON.stringify(data.personaIds);
    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

    const stmt = this.db.prepare(`
      INSERT INTO review_campaigns (
        id, campaign_name, content_type, content_id,
        persona_selection_strategy, persona_ids, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.campaignName,
      data.contentType,
      data.contentId,
      data.personaSelectionStrategy,
      personaIdsJson,
      'pending',
      metadataJson
    );

    return id;
  }

  getCampaign(id: string): Campaign | null {
    const stmt = this.db.prepare(`
      SELECT * FROM review_campaigns WHERE id = ?
    `);

    const row = stmt.get(id);
    return row ? (row as Campaign) : null;
  }

  private generateCampaignId(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
    const randomPart = Math.random().toString(36).slice(2, 8);
    return `campaign-${datePart}-${timePart}-${randomPart}`;
  }
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.ts
git commit -m "feat(reviews): implement CampaignClient.createCampaign"
```

---

## Task 7: Test CampaignClient.updateStatus

**Files:**
- Modify: `src/tooling/reviews/campaign-client.test.ts`

**Step 1: Write the failing test**

Add to the CampaignClient describe block:

```typescript
describe('updateStatus', () => {
  it('updates campaign status', () => {
    const id = client.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId: 1,
      personaSelectionStrategy: 'all_core',
      personaIds: ['core-sarah'],
    });

    client.updateStatus(id, 'in_progress');

    const campaign = client.getCampaign(id);
    expect(campaign?.status).toBe('in_progress');
  });

  it('sets completed_at when status is completed', () => {
    const id = client.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId: 1,
      personaSelectionStrategy: 'all_core',
      personaIds: ['core-sarah'],
    });

    client.updateStatus(id, 'completed');

    const campaign = client.getCampaign(id);
    expect(campaign?.status).toBe('completed');
    expect(campaign?.completed_at).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: FAIL - "updateStatus is not a function"

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.test.ts
git commit -m "test(reviews): add CampaignClient.updateStatus test"
```

---

## Task 8: Implement CampaignClient.updateStatus

**Files:**
- Modify: `src/tooling/reviews/campaign-client.ts`

**Step 1: Write minimal implementation**

Add to CampaignClient class:

```typescript
updateStatus(campaignId: string, status: CampaignStatus): void {
  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  const stmt = this.db.prepare(`
    UPDATE review_campaigns
    SET status = ?, completed_at = ?
    WHERE id = ?
  `);

  stmt.run(status, completedAt, campaignId);
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.ts
git commit -m "feat(reviews): implement CampaignClient.updateStatus"
```

---

## Task 9: Test CampaignClient.createPersonaReview

**Files:**
- Modify: `src/tooling/reviews/campaign-client.test.ts`

**Step 1: Write the failing test**

Add new describe block:

```typescript
describe('createPersonaReview', () => {
  it('creates a persona review record', () => {
    const campaignId = client.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId: 1,
      personaSelectionStrategy: 'all_core',
      personaIds: ['core-sarah'],
    });

    const reviewId = client.createPersonaReview({
      campaignId,
      personaId: 'core-sarah',
      reviewData: {
        ratings: {
          clarity_readability: 8,
          rules_accuracy: 9,
          persona_fit: 7,
          practical_usability: 8,
        },
        narrative_feedback: 'Great content!',
        issue_annotations: [],
        overall_assessment: 'Solid work',
      },
      agentExecutionTime: 5000,
    });

    expect(reviewId).toBeGreaterThan(0);

    const review = client.getPersonaReview(reviewId);
    expect(review).toBeDefined();
    expect(review?.campaign_id).toBe(campaignId);
    expect(review?.persona_id).toBe('core-sarah');
    expect(review?.status).toBe('completed');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: FAIL - "createPersonaReview is not a function"

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.test.ts
git commit -m "test(reviews): add CampaignClient.createPersonaReview test"
```

---

## Task 10: Implement CampaignClient.createPersonaReview

**Files:**
- Modify: `src/tooling/reviews/campaign-client.ts`

**Step 1: Write minimal implementation**

Add to CampaignClient class:

```typescript
createPersonaReview(data: PersonaReviewData): number {
  const reviewDataJson = JSON.stringify(data.reviewData);

  const stmt = this.db.prepare(`
    INSERT INTO persona_reviews (
      campaign_id, persona_id, review_data,
      agent_execution_time, status
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.campaignId,
    data.personaId,
    reviewDataJson,
    data.agentExecutionTime || null,
    'completed'
  );

  return result.lastInsertRowid as number;
}

getPersonaReview(id: number): PersonaReview | null {
  const stmt = this.db.prepare(`
    SELECT * FROM persona_reviews WHERE id = ?
  `);

  const row = stmt.get(id);
  return row ? (row as PersonaReview) : null;
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.ts
git commit -m "feat(reviews): implement CampaignClient.createPersonaReview"
```

---

## Task 11: Test CampaignClient.getCampaignReviews

**Files:**
- Modify: `src/tooling/reviews/campaign-client.test.ts`

**Step 1: Write the failing test**

```typescript
describe('getCampaignReviews', () => {
  it('returns all reviews for a campaign', () => {
    const campaignId = client.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId: 1,
      personaSelectionStrategy: 'all_core',
      personaIds: ['core-sarah', 'core-alex'],
    });

    client.createPersonaReview({
      campaignId,
      personaId: 'core-sarah',
      reviewData: {
        ratings: { clarity_readability: 8, rules_accuracy: 9, persona_fit: 7, practical_usability: 8 },
        narrative_feedback: 'Great!',
        issue_annotations: [],
        overall_assessment: 'Good',
      },
    });

    client.createPersonaReview({
      campaignId,
      personaId: 'core-alex',
      reviewData: {
        ratings: { clarity_readability: 7, rules_accuracy: 8, persona_fit: 6, practical_usability: 7 },
        narrative_feedback: 'Nice!',
        issue_annotations: [],
        overall_assessment: 'Decent',
      },
    });

    const reviews = client.getCampaignReviews(campaignId);
    expect(reviews).toHaveLength(2);
    expect(reviews.map((r) => r.persona_id)).toEqual(['core-sarah', 'core-alex']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: FAIL - "getCampaignReviews is not a function"

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.test.ts
git commit -m "test(reviews): add CampaignClient.getCampaignReviews test"
```

---

## Task 12: Implement CampaignClient.getCampaignReviews

**Files:**
- Modify: `src/tooling/reviews/campaign-client.ts`

**Step 1: Write minimal implementation**

```typescript
getCampaignReviews(campaignId: string): PersonaReview[] {
  const stmt = this.db.prepare(`
    SELECT * FROM persona_reviews
    WHERE campaign_id = ?
    ORDER BY created_at ASC
  `);

  const rows = stmt.all(campaignId);
  return rows as PersonaReview[];
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.ts
git commit -m "feat(reviews): implement CampaignClient.getCampaignReviews"
```

---

## Task 13: Test CampaignClient.createCampaignAnalysis

**Files:**
- Modify: `src/tooling/reviews/campaign-client.test.ts`

**Step 1: Write the failing test**

```typescript
describe('createCampaignAnalysis', () => {
  it('creates campaign analysis record', () => {
    const campaignId = client.createCampaign({
      campaignName: 'Test Campaign',
      contentType: 'book',
      contentId: 1,
      personaSelectionStrategy: 'all_core',
      personaIds: ['core-sarah'],
    });

    const analysisId = client.createCampaignAnalysis({
      campaignId,
      analysisData: {
        executive_summary: 'Overall good',
        priority_rankings: [],
        dimension_summaries: {
          clarity_readability: { average: 8, themes: [] },
          rules_accuracy: { average: 9, themes: [] },
          persona_fit: { average: 7, themes: [] },
          practical_usability: { average: 8, themes: [] },
        },
        persona_breakdowns: {},
      },
      markdownPath: 'data/reviews/analysis/test.md',
    });

    expect(analysisId).toBeGreaterThan(0);

    const analysis = client.getCampaignAnalysis(campaignId);
    expect(analysis).toBeDefined();
    expect(analysis?.campaign_id).toBe(campaignId);
    expect(analysis?.markdown_path).toBe('data/reviews/analysis/test.md');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: FAIL

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.test.ts
git commit -m "test(reviews): add CampaignClient.createCampaignAnalysis test"
```

---

## Task 14: Implement CampaignClient.createCampaignAnalysis

**Files:**
- Modify: `src/tooling/reviews/campaign-client.ts`

**Step 1: Write minimal implementation**

```typescript
createCampaignAnalysis(data: CampaignAnalysisData): number {
  const analysisDataJson = JSON.stringify(data.analysisData);

  const stmt = this.db.prepare(`
    INSERT INTO campaign_analyses (
      campaign_id, analysis_data, markdown_path
    ) VALUES (?, ?, ?)
  `);

  const result = stmt.run(
    data.campaignId,
    analysisDataJson,
    data.markdownPath
  );

  return result.lastInsertRowid as number;
}

getCampaignAnalysis(campaignId: string): CampaignAnalysis | null {
  const stmt = this.db.prepare(`
    SELECT * FROM campaign_analyses WHERE campaign_id = ?
  `);

  const row = stmt.get(campaignId);
  return row ? (row as CampaignAnalysis) : null;
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.ts
git commit -m "feat(reviews): implement CampaignClient.createCampaignAnalysis"
```

---

## Task 15: Test CampaignClient.listCampaigns with Filters

**Files:**
- Modify: `src/tooling/reviews/campaign-client.test.ts`

**Step 1: Write the failing test**

```typescript
describe('listCampaigns', () => {
  beforeEach(() => {
    client.createCampaign({
      campaignName: 'Campaign 1',
      contentType: 'book',
      contentId: 1,
      personaSelectionStrategy: 'all_core',
      personaIds: ['core-sarah'],
    });

    const id2 = client.createCampaign({
      campaignName: 'Campaign 2',
      contentType: 'chapter',
      contentId: 2,
      personaSelectionStrategy: 'manual',
      personaIds: ['core-alex'],
    });

    client.updateStatus(id2, 'completed');
  });

  it('lists all campaigns', () => {
    const campaigns = client.listCampaigns({});
    expect(campaigns).toHaveLength(2);
  });

  it('filters by status', () => {
    const campaigns = client.listCampaigns({ status: 'completed' });
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].campaign_name).toBe('Campaign 2');
  });

  it('filters by content type', () => {
    const campaigns = client.listCampaigns({ contentType: 'book' });
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].campaign_name).toBe('Campaign 1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: FAIL

**Step 3: Commit**

```bash
git add src/tooling/reviews/campaign-client.test.ts
git commit -m "test(reviews): add CampaignClient.listCampaigns tests"
```

---

## Task 16: Implement CampaignClient.listCampaigns

**Files:**
- Modify: `src/tooling/reviews/campaign-client.ts`

**Step 1: Add filter interface**

```typescript
export interface CampaignListFilters {
  status?: CampaignStatus;
  contentType?: ContentType;
  contentId?: number;
}
```

**Step 2: Write implementation**

```typescript
listCampaigns(filters: CampaignListFilters): Campaign[] {
  let sql = 'SELECT * FROM review_campaigns WHERE 1=1';
  const params: unknown[] = [];

  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.contentType) {
    sql += ' AND content_type = ?';
    params.push(filters.contentType);
  }

  if (filters.contentId !== undefined) {
    sql += ' AND content_id = ?';
    params.push(filters.contentId);
  }

  sql += ' ORDER BY created_at DESC';

  const stmt = this.db.prepare(sql);
  const rows = stmt.all(...params);
  return rows as Campaign[];
}
```

**Step 3: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/campaign-client.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/tooling/reviews/campaign-client.ts
git commit -m "feat(reviews): implement CampaignClient.listCampaigns with filters"
```

---

## Task 17: Create Content Snapshot Types

**Files:**
- Create: `src/tooling/reviews/content-snapshot.ts`

**Step 1: Write type definitions**

```typescript
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import Database from 'better-sqlite3';

export interface SnapshotBookData {
  bookPath: string;
  version: string;
  source: 'git' | 'claude';
  commitSha?: string;
  metadata?: Record<string, unknown>;
}

export interface SnapshotChapterData {
  bookPath: string;
  chapterPath: string;
  version: string;
  source: 'git' | 'claude';
  commitSha?: string;
  metadata?: Record<string, unknown>;
}

export interface BookSnapshot {
  id: number;
  book_path: string;
  version: string;
  content: string;
  metadata: string | null;
  file_hash: string;
  source: 'git' | 'claude';
  commit_sha: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface ChapterSnapshot {
  id: number;
  book_path: string;
  chapter_path: string;
  version: string;
  content: string;
  metadata: string | null;
  file_hash: string;
  source: 'git' | 'claude';
  commit_sha: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}
```

**Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No compilation errors

**Step 3: Commit**

```bash
git add src/tooling/reviews/content-snapshot.ts
git commit -m "feat(reviews): add content snapshot type definitions"
```

---

## Task 18: Test snapshotBook

**Files:**
- Create: `src/tooling/reviews/content-snapshot.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import Database from 'better-sqlite3';
import { snapshotBook, getBookSnapshot } from './content-snapshot.js';
import { createTables } from '../database/schema.js';

describe('Content Snapshot', () => {
  let db: Database.Database;
  const testBookPath = 'data/test/test-book.html';

  beforeEach(() => {
    mkdirSync('data/test', { recursive: true });
    writeFileSync(
      testBookPath,
      '<html><body><h1>Test Book</h1></body></html>'
    );
    db = new Database(':memory:');
    createTables(db);
  });

  afterEach(() => {
    db.close();
    rmSync('data/test', { recursive: true, force: true });
  });

  describe('snapshotBook', () => {
    it('creates book snapshot with file hash', () => {
      const id = snapshotBook(db, {
        bookPath: testBookPath,
        version: 'v1.2',
        source: 'git',
        commitSha: 'abc123',
      });

      expect(id).toBeGreaterThan(0);

      const snapshot = getBookSnapshot(db, id);
      expect(snapshot).toBeDefined();
      expect(snapshot?.book_path).toBe(testBookPath);
      expect(snapshot?.version).toBe('v1.2');
      expect(snapshot?.file_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(snapshot?.content).toContain('Test Book');
    });

    it('throws if file does not exist', () => {
      expect(() =>
        snapshotBook(db, {
          bookPath: 'nonexistent.html',
          version: 'v1.0',
          source: 'git',
        })
      ).toThrow('File not found');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/content-snapshot.test.ts`
Expected: FAIL

**Step 3: Commit**

```bash
git add src/tooling/reviews/content-snapshot.test.ts
git commit -m "test(reviews): add snapshotBook test"
```

---

## Task 19: Implement snapshotBook

**Files:**
- Modify: `src/tooling/reviews/content-snapshot.ts`

**Step 1: Write minimal implementation**

```typescript
export function snapshotBook(
  db: Database.Database,
  data: SnapshotBookData
): number {
  if (!existsSync(data.bookPath)) {
    throw new Error(`File not found: ${data.bookPath}`);
  }

  const content = readFileSync(data.bookPath, 'utf-8');
  const fileHash = calculateHash(content);
  const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

  const stmt = db.prepare(`
    INSERT INTO book_versions (
      book_path, version, content, metadata,
      file_hash, source, commit_sha
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.bookPath,
    data.version,
    content,
    metadataJson,
    fileHash,
    data.source,
    data.commitSha || null
  );

  return result.lastInsertRowid as number;
}

export function getBookSnapshot(
  db: Database.Database,
  id: number
): BookSnapshot | null {
  const stmt = db.prepare(`
    SELECT * FROM book_versions WHERE id = ?
  `);

  const row = stmt.get(id);
  return row ? (row as BookSnapshot) : null;
}

function calculateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/content-snapshot.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/content-snapshot.ts
git commit -m "feat(reviews): implement snapshotBook with hash validation"
```

---

## Task 20: Test snapshotChapter

**Files:**
- Modify: `src/tooling/reviews/content-snapshot.test.ts`

**Step 1: Write the failing test**

```typescript
describe('snapshotChapter', () => {
  const testChapterPath = 'data/test/chapter-01.md';

  beforeEach(() => {
    writeFileSync(testChapterPath, '# Chapter 1\n\nTest content');
  });

  it('creates chapter snapshot with file hash', () => {
    const id = snapshotChapter(db, {
      bookPath: 'core/v1',
      chapterPath: testChapterPath,
      version: 'v1.2',
      source: 'git',
      commitSha: 'abc123',
    });

    expect(id).toBeGreaterThan(0);

    const snapshot = getChapterSnapshot(db, id);
    expect(snapshot).toBeDefined();
    expect(snapshot?.chapter_path).toBe(testChapterPath);
    expect(snapshot?.file_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(snapshot?.content).toContain('Chapter 1');
  });

  it('throws if file does not exist', () => {
    expect(() =>
      snapshotChapter(db, {
        bookPath: 'core/v1',
        chapterPath: 'nonexistent.md',
        version: 'v1.0',
        source: 'git',
      })
    ).toThrow('File not found');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/tooling/reviews/content-snapshot.test.ts`
Expected: FAIL

**Step 3: Commit**

```bash
git add src/tooling/reviews/content-snapshot.test.ts
git commit -m "test(reviews): add snapshotChapter test"
```

---

## Task 21: Implement snapshotChapter

**Files:**
- Modify: `src/tooling/reviews/content-snapshot.ts`

**Step 1: Write minimal implementation**

```typescript
export function snapshotChapter(
  db: Database.Database,
  data: SnapshotChapterData
): number {
  if (!existsSync(data.chapterPath)) {
    throw new Error(`File not found: ${data.chapterPath}`);
  }

  const content = readFileSync(data.chapterPath, 'utf-8');
  const fileHash = calculateHash(content);
  const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

  const stmt = db.prepare(`
    INSERT INTO chapter_versions (
      book_path, chapter_path, version, content,
      metadata, file_hash, source, commit_sha
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.bookPath,
    data.chapterPath,
    data.version,
    content,
    metadataJson,
    fileHash,
    data.source,
    data.commitSha || null
  );

  return result.lastInsertRowid as number;
}

export function getChapterSnapshot(
  db: Database.Database,
  id: number
): ChapterSnapshot | null {
  const stmt = db.prepare(`
    SELECT * FROM chapter_versions WHERE id = ?
  `);

  const row = stmt.get(id);
  return row ? (row as ChapterSnapshot) : null;
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/content-snapshot.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/reviews/content-snapshot.ts
git commit -m "feat(reviews): implement snapshotChapter with hash validation"
```

---

## Task 22: Test Hash Consistency

**Files:**
- Modify: `src/tooling/reviews/content-snapshot.test.ts`

**Step 1: Write the failing test**

```typescript
describe('hash consistency', () => {
  it('generates same hash for identical content', () => {
    const id1 = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0',
      source: 'git',
    });

    const id2 = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.1',
      source: 'git',
    });

    const snapshot1 = getBookSnapshot(db, id1);
    const snapshot2 = getBookSnapshot(db, id2);

    expect(snapshot1?.file_hash).toBe(snapshot2?.file_hash);
  });

  it('generates different hash for different content', () => {
    const id1 = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.0',
      source: 'git',
    });

    writeFileSync(testBookPath, '<html><body><h1>Modified</h1></body></html>');

    const id2 = snapshotBook(db, {
      bookPath: testBookPath,
      version: 'v1.1',
      source: 'git',
    });

    const snapshot1 = getBookSnapshot(db, id1);
    const snapshot2 = getBookSnapshot(db, id2);

    expect(snapshot1?.file_hash).not.toBe(snapshot2?.file_hash);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/tooling/reviews/content-snapshot.test.ts`
Expected: PASS (should already pass with current implementation)

**Step 3: Commit**

```bash
git add src/tooling/reviews/content-snapshot.test.ts
git commit -m "test(reviews): add hash consistency validation tests"
```

---

## Task 23: Integrate CampaignClient into Database Index

**Files:**
- Modify: `src/tooling/database/index.ts`

**Step 1: Import and add CampaignClient**

Find the section where database clients are exported and add:

```typescript
import { CampaignClient } from '../reviews/campaign-client.js';

// In the getDatabase() return object, add:
campaigns: new CampaignClient(db),
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No compilation errors

**Step 3: Commit**

```bash
git add src/tooling/database/index.ts
git commit -m "feat(reviews): integrate CampaignClient into database index"
```

---

## Task 24: Run Full Test Suite

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: If tests fail, debug and fix**

Fix any issues that arise from integration.

**Step 3: Commit fixes if needed**

```bash
git add .
git commit -m "fix(reviews): resolve test failures from integration"
```

---

## Task 25: Verify Schema Migrations

**Files:**
- Test: `src/tooling/database/schema.test.ts` (if it exists)

**Step 1: Write schema integration test**

If schema.test.ts doesn't exist, create it:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from './schema.js';

describe('Database Schema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('creates all tables without errors', () => {
    expect(() => createTables(db)).not.toThrow();
  });

  it('creates review_campaigns table', () => {
    createTables(db);

    const result = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='review_campaigns'"
      )
      .get();

    expect(result).toBeDefined();
  });

  it('creates persona_reviews table', () => {
    createTables(db);

    const result = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='persona_reviews'"
      )
      .get();

    expect(result).toBeDefined();
  });

  it('creates campaign_analyses table', () => {
    createTables(db);

    const result = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='campaign_analyses'"
      )
      .get();

    expect(result).toBeDefined();
  });
});
```

**Step 2: Run test**

Run: `pnpm test src/tooling/database/schema.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tooling/database/schema.test.ts
git commit -m "test(database): add schema validation tests for review tables"
```

---

## Phase 1 Complete

**Verification Checklist:**

Run all commands to verify:

```bash
# All tests pass
pnpm test

# TypeScript compiles
pnpm exec tsc --noEmit

# Schema creates successfully
pnpm tsx src/tooling/database/schema.ts
```

**Expected Results:**
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Database schema creates without errors
- [ ] CampaignClient fully functional
- [ ] Content snapshots working with hash validation

**Files Created/Modified:**
- Modified: `src/tooling/database/schema.ts` (added 3 tables)
- Created: `src/tooling/reviews/campaign-client.ts`
- Created: `src/tooling/reviews/campaign-client.test.ts`
- Created: `src/tooling/reviews/content-snapshot.ts`
- Created: `src/tooling/reviews/content-snapshot.test.ts`
- Modified: `src/tooling/database/index.ts`
- Created/Modified: `src/tooling/database/schema.test.ts`

**Next Phase:** [Phase 2: Review Workflow](./review-system-P2.md)
