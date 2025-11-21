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

## Persona Sampling

Beyond the 10 core personas, you can include procedurally generated personas for broader coverage.

### Three Selection Modes

```bash
# Default: 10 core personas only
pnpm review book src/site/core_rulebook_web.html

# Core + sampled generated personas
pnpm review book src/site/core_rulebook_web.html --plus=20

# Generated personas only (no core)
pnpm review book src/site/core_rulebook_web.html --generated=50
```

### Focus Categories

Use `--focus` to weight persona selection toward specific content types:

```bash
pnpm review book chapters/combat.md --plus=15 --focus=combat
```

| Focus | Description | Primary Weight |
|-------|-------------|----------------|
| `general` | Even distribution across all dimensions | — |
| `gm-content` | GM guides, running the game | gm_philosophy |
| `combat` | Combat rules, tactics | Tactician archetype |
| `narrative` | Roleplay, story mechanics | fiction_first_alignment |
| `character-creation` | Character building | All archetypes evenly |
| `quickstart` | Beginner content | Newbie experience level |

### Path-Based Focus Inference

Without explicit `--focus`, the system infers from the content path:

| Path | Inferred Focus |
|------|----------------|
| `chapters/combat-rules.md` | `combat` |
| `chapters/gm-guide.md` | `gm-content` |
| `chapters/getting-started.md` | `quickstart` |
| `src/site/core_rulebook_web.html` | `general` |

### Validation Rules

- `--plus` and `--generated` are mutually exclusive
- `--focus` only applies when using `--plus` or `--generated`
- Requires sufficient generated personas in database

## Architecture

**Campaign-Based Model:**
- Each review is a campaign with unique ID
- Snapshots content for consistency
- Tracks all reviews and analysis
- Managed by ReviewOrchestrator

**Three Agent Roles:**
1. **Orchestrator** - Manages campaign lifecycle (ReviewOrchestrator class)
2. **Reviewer** - One per persona, evaluates content (parallel execution)
3. **Analyzer** - Aggregates reviews into insights (sequential after reviews)

**Campaign Lifecycle:**
1. `initializeCampaign()` → Creates campaign, snapshots content (status: pending)
2. `executeReviews()` → Launches reviewer agents in parallel (status: in_progress)
3. `executeAnalysis()` → Launches analyzer agent (status: analyzing)
4. `completeCampaign()` → Finalizes campaign (status: completed)

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
- Prompt file generation (writePromptFiles, writeAnalyzerPromptFile)
- Human-guided agent execution workflow
- Status checking CLI command (pnpm review status)
- Complete integration of all components

**✅ Persona Sampling Complete:**
- `--plus` flag for core + generated personas
- `--generated` flag for generated-only reviews
- `--focus` flag for weighted sampling
- Path-based focus inference
- Persona breakdown in CLI output

**System Status:** Fully Functional

The Review System is now complete and ready for use. Users can create campaigns, execute reviewer and analyzer agents via Claude Code, and check status at any point in the workflow.

## Phase 5: Human-Guided Agent Execution

### Workflow Overview

Phase 5 implements a human-guided approach where the CLI prepares everything and the user instructs Claude Code to execute agents in the same session.

### Complete Workflow Example

**Step 1: Create Campaign and Generate Prompts**

```bash
pnpm review book src/site/core_rulebook_web.html
```

CLI Output:
```
✅ Campaign created: campaign-20251119-143025-abc123
✅ Generated 10 review prompts

📁 Prompts directory: data/reviews/prompts/campaign-20251119-143025-abc123/

Next: Tell Claude Code to execute reviews

────────────────────────────────────────────────────────
Read prompts from data/reviews/prompts/campaign-20251119-143025-abc123/
and execute reviewer agents in batches of 5
────────────────────────────────────────────────────────

After agents complete, check status with:
  pnpm review status campaign-20251119-143025-abc123
```

**Step 2: Execute Reviewer Agents in Claude Code**

Copy the instruction from Step 1 and tell Claude Code:
> Read prompts from data/reviews/prompts/campaign-20251119-143025-abc123/ and execute reviewer agents in batches of 5

Claude Code will:
1. Read all .txt files from the prompts directory
2. Execute 5 agents in parallel (Batch 1)
3. Wait for Batch 1 to complete
4. Execute next 5 agents in parallel (Batch 2)
5. Report completion when all agents finish

**Step 3: Check Campaign Status**

```bash
pnpm review status campaign-20251119-143025-abc123
```

Output:
```
Campaign: campaign-20251119-143025-abc123
Status: in_progress
Expected reviews: 10
Completed reviews: 10
Missing reviews: (none)

✅ All reviews complete! Ready for analysis.

Next: Tell Claude Code to run analysis

────────────────────────────────────────────────────────
Read analyzer prompt from data/reviews/prompts/campaign-20251119-143025-abc123/analyzer.txt
and execute analyzer agent
────────────────────────────────────────────────────────
```

**Step 4: Execute Analyzer Agent in Claude Code**

Tell Claude Code:
> Read analyzer prompt from data/reviews/prompts/campaign-20251119-143025-abc123/analyzer.txt and execute analyzer agent

Claude Code will execute the analyzer agent to aggregate all reviews.

**Step 5: Verify Completion**

```bash
pnpm review status campaign-20251119-143025-abc123
```

Output:
```
Campaign: campaign-20251119-143025-abc123
Status: completed
Reviews: 10/10
Analysis: Generated

📁 Outputs:
  Reviews: data/reviews/raw/campaign-20251119-143025-abc123/
  Analysis: data/reviews/analysis/campaign-20251119-143025-abc123.md
```

### Prompt File Structure

Prompts are written to `data/reviews/prompts/{campaignId}/`:

```
data/reviews/prompts/campaign-20251119-143025-abc123/
├── core-sarah.txt       (Reviewer prompt for Sarah persona)
├── core-alex.txt        (Reviewer prompt for Alex persona)
├── core-marcus.txt      (Reviewer prompt for Marcus persona)
├── ...                  (One file per persona)
└── analyzer.txt         (Analyzer prompt, generated after reviews)
```

Each reviewer prompt contains:
- Complete persona profile (archetype, experience, traits)
- Content reference (database ID and SQL to retrieve)
- Task description (review dimensions, output format)
- Executable TypeScript code snippets for database writes
- Schema validation requirements

The analyzer prompt contains:
- Campaign overview
- All completed reviews (aggregated from database)
- Analysis instructions (priority rankings, dimension summaries)
- Executable TypeScript code for writing analysis

### Batching Strategy

User controls batch size when instructing Claude Code:

- `batches of 1` → Sequential execution (no parallelism)
- `batches of 5` → 5 parallel agents per batch (recommended)
- `batches of 10` → All at once (may slow system)

Recommended: **batches of 5** balances performance and system load.

## CLI Commands Reference

### Create Campaign and Generate Prompts

```bash
# Review book with all core personas
pnpm review book <path-to-book.html>

# Review with specific personas
pnpm review book <path> --personas=core-sarah,core-alex

# Review chapter
pnpm review chapter <path-to-chapter.md> --personas=all_core

# Include generated personas (core + 20 sampled)
pnpm review book <path> --plus=20

# Use only generated personas (no core)
pnpm review book <path> --generated=50

# Specify focus for weighted sampling
pnpm review book <path> --plus=15 --focus=combat
```

**Options:**

| Flag | Description |
|------|-------------|
| `--personas=<ids>` | Comma-separated persona IDs, or `all_core` |
| `--plus=<N>` | Add N sampled generated personas to core |
| `--generated=<N>` | Use only N generated personas (no core) |
| `--focus=<category>` | Weight sampling: general, gm-content, combat, narrative, character-creation, quickstart |

### Check Campaign Status

```bash
pnpm review status <campaign-id>
```

Shows:
- Campaign status (pending, in_progress, analyzing, completed)
- Expected vs completed review counts
- Missing persona reviews (if any)
- Next step instructions

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
pnpm review view <campaign-id>
```

Shows full campaign metadata, reviews, and analysis.

## Programmatic Usage

```typescript
import { ReviewOrchestrator } from '@razorweave/tooling/reviews';
import { getDatabase } from '@razorweave/tooling/database';
import { CampaignClient } from '@razorweave/tooling/reviews';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());
const orchestrator = new ReviewOrchestrator(db.getDb(), campaignClient);

// Create campaign with core personas only
const campaignId = orchestrator.initializeCampaign({
  campaignName: 'My Review',
  contentType: 'book',
  contentPath: 'path/to/book.html',
  personaSelectionStrategy: 'all_core',
});

// Or with persona sampling
const sampledCampaignId = orchestrator.initializeCampaign({
  campaignName: 'Sampled Review',
  contentType: 'book',
  contentPath: 'path/to/book.html',
  personaSelectionStrategy: 'all_core',
  plusCount: 20,           // Add 20 generated personas to core
  focus: 'combat',         // Weight sampling toward combat-focused personas
});

// Or generated only
const generatedCampaignId = orchestrator.initializeCampaign({
  campaignName: 'Generated Only Review',
  contentType: 'chapter',
  contentPath: 'chapters/combat.md',
  personaSelectionStrategy: 'manual',
  generatedCount: 50,      // Use 50 generated personas, no core
  focus: 'combat',
});

// Execute reviews (generates prompt files)
orchestrator.executeReviews(campaignId);

// Execute analysis (generates analyzer prompt)
orchestrator.executeAnalysis(campaignId);

// Complete campaign
orchestrator.completeCampaign(campaignId);
```

## Future Features

- Version comparison and regression detection
- Review retry for failed personas (currently manual)
- Automated batch size optimization
- Interactive analysis dashboard
- Export campaign results to various formats
