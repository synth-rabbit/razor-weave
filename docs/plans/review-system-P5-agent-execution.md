# Review System Phase 5: Agent Execution

**Status:** Design Complete
**Phase:** 5 of 5
**Dependencies:** Phase 1-4 (Database, Content Snapshotting, Schemas, Orchestrator)

## Overview

Phase 5 implements actual agent execution for the Review System using a human-guided approach where the CLI prepares everything and the user instructs Claude Code to execute agents in the same session.

## Architecture Overview

**The Challenge:**

TypeScript CLI cannot directly invoke Claude Code Task tool. We need a way to execute reviewer and analyzer agents while maintaining simplicity and transparency.

**The Solution: Human-Guided Execution**

The CLI prepares everything (prompts, database, content snapshots), then outputs instructions for the user to tell Claude Code what to do in the same session.

**Three-Part System:**

1. **CLI (TypeScript)**: Prepares prompts, manages database, verifies completion
2. **Claude Code (same session)**: Executes agents in parallel batches
3. **User (orchestrator)**: Bridges CLI and Claude Code with simple instructions

**Why This Works:**

- CLI can do everything except launch agents (database, file I/O, prompts)
- Claude Code can do everything the CLI can't (Task tool, parallel execution)
- User provides simple glue: "Read prompts from X and execute in batches of 5"
- No shell script complexity, no session coordination, no fragile automation

## Workflow & User Experience

**Step 1: User Runs CLI Command**

```bash
pnpm review book src/site/core_rulebook_web.html
```

**CLI Actions:**
1. Snapshots book content to database (book_versions table)
2. Creates review campaign (review_campaigns table)
3. Generates prompt files for each persona
4. Outputs next steps for user

**CLI Output:**

```
✅ Campaign created: campaign-20251119-143025
✅ Content snapshotted: ID 42 (hash: abc123def...)
✅ Generated 10 review prompts in data/reviews/prompts/campaign-20251119-143025/

Next: Tell Claude Code to execute reviews

Copy this to Claude Code:
────────────────────────────────────────────────────────
Read prompts from data/reviews/prompts/campaign-20251119-143025/
and execute reviewer agents in batches of 5
────────────────────────────────────────────────────────

After agents complete, check status with:
  pnpm review status campaign-20251119-143025
```

**Step 2: User Tells Claude Code**

User pastes instruction into Claude Code (in the same session). Claude Code:
1. Reads all `.txt` files from prompts directory
2. Splits into batches of 5 (or user-specified size)
3. Executes Batch 1 in parallel (5 Task agents simultaneously)
4. Waits for Batch 1 completion
5. Executes Batch 2 in parallel
6. Reports completion summary

**Step 3: User Checks Status**

```bash
pnpm review status campaign-20251119-143025
```

**Output:**

```
Campaign: campaign-20251119-143025
Status: in_progress
Expected reviews: 10
Completed reviews: 10
Missing reviews: (none)

✅ All reviews complete! Ready for analysis.

Next: Tell Claude Code to run analysis

Copy this to Claude Code:
────────────────────────────────────────────────────────
Read analyzer prompt from data/reviews/prompts/campaign-20251119-143025/analyzer.txt
and execute analyzer agent
────────────────────────────────────────────────────────
```

**Step 4: User Runs Analysis**

User tells Claude Code to run analyzer. Claude Code:
1. Reads analyzer prompt
2. Launches single analyzer Task agent
3. Agent aggregates all reviews into analysis
4. Writes analysis to database and markdown

**Step 5: Campaign Complete**

```bash
pnpm review status campaign-20251119-143025
```

**Output:**

```
Campaign: campaign-20251119-143025
Status: completed
Reviews: 10/10
Analysis: Generated

📁 Outputs:
  Reviews: data/reviews/raw/campaign-20251119-143025/
  Analysis: data/reviews/analysis/campaign-20251119-143025.md
```

## Prompt File Structure

**Directory Layout:**

```
data/reviews/prompts/
  campaign-20251119-143025/
    core-sarah.txt
    core-alex.txt
    core-marcus.txt
    ...
    analyzer.txt
```

**Reviewer Prompt Template:**

```
You are conducting a review for campaign-20251119-143025.

PERSONA: core-sarah (Explorer/Newbie)
- Name: Sarah Chen
- Archetype: Explorer
- Experience: Newbie
- Fiction-First: Curious
- Narrative/Mechanics: Neutral
- GM Philosophy: Non-GM
- Genre Flexibility: Neutral
- Cognitive Style: Visual Thinker

Full persona profile:
[Complete persona JSON from database]

CONTENT: Book "Core Rulebook" (version v-2025-11-19, hash abc123def)
- Content ID: 42 (stored in book_versions table)
- Retrieve content using:
  SELECT content FROM book_versions WHERE id = 42

TASK: Review this book from Sarah's perspective

Evaluate on 4 dimensions (1-10 scale):
1. Clarity & Readability - How clear and easy to understand
2. Rules Accuracy - Consistency and correctness of game mechanics
3. Persona Fit - Works for Sarah's experience level and style
4. Practical Usability - Easy to use at the table during gameplay

Provide:
- Ratings for each dimension
- Narrative feedback in Sarah's voice (what she thinks/feels)
- Issue annotations (specific problems with location and impact)
- Overall assessment

OUTPUT REQUIREMENTS:

1. Write review JSON to database:

import { getDatabase } from '@razorweave/tooling/database';
import { CampaignClient } from '@razorweave/tooling/reviews';

const db = getDatabase();
const campaignClient = new CampaignClient(db.raw);

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251119-143025',
  personaId: 'core-sarah',
  reviewData: {
    ratings: {
      clarity_readability: <1-10>,
      rules_accuracy: <1-10>,
      persona_fit: <1-10>,
      practical_usability: <1-10>
    },
    narrative_feedback: "<Sarah's thoughts in her voice>",
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
    campaignId: 'campaign-20251119-143025',
    personaName: 'Sarah Chen',
    personaArchetype: 'Explorer',
    personaExperience: 'Newbie',
    personaTraits: ['Curious', 'Visual Thinker'],
    contentTitle: 'Core Rulebook',
    reviewData: <your review JSON>
  },
  'data/reviews/raw/campaign-20251119-143025/core-sarah.md'
);

SCHEMA: Review data must match ReviewDataSchema

import { ReviewDataSchema } from '@razorweave/tooling/reviews/schemas';

Validate with:
ReviewDataSchema.parse(reviewData); // Throws if invalid
```

**Analyzer Prompt Template:**

Similar structure but aggregates all reviews:
- Lists all completed reviews from database
- Asks for cross-persona pattern analysis
- Outputs to `campaign_analyses` table
- Writes to `data/reviews/analysis/{campaignId}.md`

## Agent Execution & Batching

**How Claude Code Executes Agents:**

When user says: "Read prompts from data/reviews/prompts/campaign-X/ and run in batches of 5"

1. **Read prompt directory** (glob for `*.txt` files, exclude `analyzer.txt`)
2. **Split into batches** (Batch 1: 5 agents, Batch 2: 5 agents, etc.)
3. **Execute Batch 1 in parallel** (5 Task tool calls in single message)
4. **Wait for Batch 1 completion** (all agents finish or fail)
5. **Execute Batch 2 in parallel**
6. **Repeat until all batches complete**
7. **Summary report** (show which succeeded/failed)

**Batch Size Flexibility:**

User can specify any batch size (1-10):
- "batches of 3" → 3 parallel agents per batch
- "batches of 1" → Sequential execution (no parallelism)
- "batches of 10" → All at once (may slow system)

**Default:** 5 agents per batch (balanced performance)

**Single Message Execution:**

Claude Code must execute each batch in a single message with multiple Task tool calls to enable parallel execution. Each Task agent receives a prompt from one of the prompt files.

## Error Handling & Recovery

**Agent Failures:**

When an agent fails (error, timeout, wrong output):

1. **Detection**: CLI `pnpm review status <campaign-id>` shows which personas are missing reviews
2. **Manual Retry**: User identifies failed persona (e.g., "core-sarah failed")
3. **Selective Re-execution**: User tells Claude Code: "Read prompt for core-sarah and run that agent"
4. **Database Check**: Agent writes to same campaign_id, overwrites any partial data

**Validation Checks:**

Before marking campaign as complete:

```bash
pnpm review status campaign-20251119-143025
```

Output:
```
Campaign: campaign-20251119-143025
Status: in_progress
Expected reviews: 10
Completed reviews: 8
Missing reviews: core-sarah, core-alex
```

If missing reviews exist, user can re-run specific agents without restarting entire campaign.

**No Automated Retry**: We intentionally do NOT auto-retry because:
- Agents might fail for legitimate reasons (bad content, schema issues)
- Human should inspect error before retrying
- Prevents infinite retry loops

**Partial Completion**: Campaign can stay in `in_progress` state indefinitely. User decides when to proceed to analysis (even with some reviews missing).

**Analyzer Failures**: If analyzer agent fails, user can re-run it. Analysis overwrites previous attempt in `campaign_analyses` table.

## Implementation Components

**New Files to Create:**

1. **`src/tooling/reviews/prompt-generator.ts`**
   - `generateReviewerPrompt(db, campaignId, personaId): string`
   - `generateAnalyzerPrompt(db, campaignId): string`
   - Reads campaign, persona, content from database
   - Returns complete prompt text for agent

2. **`src/tooling/reviews/prompt-writer.ts`**
   - `writePromptFiles(db, campaignId): void`
   - Creates `data/reviews/prompts/{campaignId}/` directory
   - Writes one `.txt` file per persona
   - Returns list of generated prompt paths

**Files to Modify:**

1. **`src/tooling/reviews/review-orchestrator.ts`**
   - `executeReviews()`: Generate prompt files, output user instructions
   - `executeAnalysis()`: Generate analyzer prompt, output user instructions
   - Remove placeholder console.log statements
   - Add prompt generation logic

2. **`src/tooling/cli-commands/review.ts`**
   - Add `statusCampaign(campaignId)` function
   - Update `reviewBook()` to call `orchestrator.executeReviews()` and show instructions
   - Output format: "Run this command in Claude Code: Read prompts from data/reviews/prompts/campaign-X/ and execute in batches of 5"

**Test Files:**

1. **`src/tooling/reviews/prompt-generator.test.ts`**
   - Test reviewer prompt generation with mock database
   - Test analyzer prompt generation
   - Verify prompts contain all required sections

2. **`src/tooling/reviews/prompt-writer.test.ts`**
   - Test file creation in correct directory
   - Test file naming (persona-id.txt)
   - Test directory cleanup/overwrite behavior

## Testing Strategy

**Unit Tests:**

1. **Prompt Generation Tests** (`prompt-generator.test.ts`)
   - Mock database with sample campaign/persona/content
   - Verify prompt contains all required sections:
     - Persona profile (archetype, experience, traits)
     - Content reference (ID, hash, retrieval SQL)
     - Task description (review dimensions, output format)
     - Schema requirements
   - Test both reviewer and analyzer prompts

2. **Prompt File Writing Tests** (`prompt-writer.test.ts`)
   - Verify directory creation (`data/reviews/prompts/{campaignId}/`)
   - Verify file naming (`{persona-id}.txt`)
   - Test overwrite behavior (re-running campaign)
   - Test cleanup on campaign restart

3. **Orchestrator Tests** (`review-orchestrator.test.ts` updates)
   - Test `executeReviews()` generates correct number of prompt files
   - Test `executeAnalysis()` generates analyzer prompt
   - Verify status transitions (pending → in_progress → analyzing)

**Integration Tests:**

1. **End-to-End Workflow Test** (`integration.test.ts` update)
   - Create campaign
   - Generate prompts
   - Verify prompt files exist and contain correct data
   - Manually simulate agent execution (write reviews to DB)
   - Generate analyzer prompt
   - Manually simulate analysis
   - Complete campaign

**Manual Testing:**

1. Run `pnpm review book src/site/core_rulebook_web.html`
2. Verify prompts generated correctly
3. Copy prompt text and execute agents in Claude Code session
4. Verify agents write to database and markdown files
5. Run `pnpm review status <campaign-id>` to check completion
6. Run analyzer and verify analysis output

## Summary & Next Steps

**What Phase 5 Delivers:**

A complete human-guided agent execution system where:
1. CLI prepares everything (content snapshots, prompts, database setup)
2. User instructs Claude Code to execute agents in the same session
3. Agents write reviews/analysis to database and markdown
4. CLI verifies completion and provides status

**Key Benefits:**

- **Simple**: No shell script complexity or session coordination
- **Transparent**: User sees exactly what agents are doing
- **Flexible**: Easy to retry failed agents or adjust batch size
- **Testable**: All prompt generation logic is unit-testable

**Documentation to Update:**

1. **`docs/workflows/REVIEW_SYSTEM.md`**
   - Update "Implementation Status" section
   - Add Phase 5 workflow examples
   - Document prompt file structure
   - Add troubleshooting section

2. **Create `docs/workflows/REVIEW_WORKFLOW_EXAMPLE.md`**
   - Step-by-step walkthrough of running a review
   - Example prompts and outputs
   - Common issues and solutions

**Implementation Order:**

1. Create `prompt-generator.ts` (core logic)
2. Create `prompt-writer.ts` (file I/O)
3. Update `review-orchestrator.ts` (integrate prompt generation)
4. Update `review.ts` CLI commands (add status checking)
5. Write tests for all new components
6. Manual end-to-end test with real book
7. Update documentation

## Success Criteria

- ✅ CLI generates complete, standalone prompts for each persona
- ✅ Prompts include all necessary context (persona, content, schema)
- ✅ User can execute agents with single instruction to Claude Code
- ✅ Agents write reviews to database and markdown successfully
- ✅ Status command shows completion progress accurately
- ✅ Failed agents can be retried individually
- ✅ Analysis aggregates all reviews correctly
- ✅ Full workflow tested end-to-end with real book
