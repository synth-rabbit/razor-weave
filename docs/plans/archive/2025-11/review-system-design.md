# Review System Design

**Date:** 2025-11-18
**Status:** Design Complete
**Author:** Claude Code

## Overview

The Review System is an agentic workflow for analyzing book and chapter content using multi-dimensional persona reviews. It generates structured reviews, comprehensive analysis, and actionable insights to guide the Iterative Editing workflow.

## Requirements

**Primary Functions:**
1. Review entire HTML books
2. Review individual markdown chapters
3. Analyze review output and produce summarized data
4. Store reviews in project database for querying and traceability
5. Generate markdown records for human review

**Review Dimensions:**
- Clarity & readability
- Rules accuracy
- Persona fit
- Practical usability

**Analysis Types:**
- Cross-persona pattern detection
- Dimension summaries
- Actionable priority rankings
- Persona breakdowns by archetype/experience
- Trend tracking across versions

**Constraints:**
- All agents operate through Claude Code (no API keys)
- File existence must be verified (agents may claim writes without committing)
- Content versions must be immutable during review

## Architecture: Campaign-Based Model

Reviews are organized into **review campaigns** - each campaign represents one complete review cycle (e.g., "Core Rulebook v1.2 Review - 2025-11-18").

**Why campaign-based:**
- Natural traceability: Always know when content was reviewed and by whom
- Version comparison: Clean trend tracking by comparing campaigns
- Flexible persona selection: Each campaign can use different persona sets
- Balanced complexity: Structured enough for insights without over-engineering

## Database Schema

**`review_campaigns` table:**
```sql
CREATE TABLE review_campaigns (
  id TEXT PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('book', 'chapter')),
  content_id INTEGER NOT NULL,
  persona_selection_strategy TEXT NOT NULL CHECK(
    persona_selection_strategy IN ('all_core', 'manual', 'smart_sampling')
  ),
  persona_ids TEXT NOT NULL, -- JSON array
  status TEXT NOT NULL CHECK(
    status IN ('pending', 'in_progress', 'analyzing', 'completed', 'failed')
  ),
  metadata TEXT, -- JSON for extensibility
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
```

**`persona_reviews` table:**
```sql
CREATE TABLE persona_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  review_data TEXT NOT NULL, -- JSON with ratings, feedback, annotations, assessment
  agent_execution_time INTEGER, -- milliseconds
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES review_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id)
);

CREATE INDEX idx_persona_reviews_campaign ON persona_reviews(campaign_id);
CREATE INDEX idx_persona_reviews_persona ON persona_reviews(persona_id);
```

**`campaign_analyses` table:**
```sql
CREATE TABLE campaign_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL UNIQUE,
  analysis_data TEXT NOT NULL, -- JSON with priorities, breakdowns, summaries
  markdown_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES review_campaigns(id) ON DELETE CASCADE
);

CREATE INDEX idx_campaign_analyses_campaign ON campaign_analyses(campaign_id);
```

## Agent Roles & Orchestration

**Orchestrator Agent (main conversation):**
- Creates review campaign record
- Snapshots content to database with version ID
- Selects personas based on strategy
- Launches reviewer agents in parallel (multiple Task tool calls)
- Polls for completion and verifies file existence
- Launches analyzer agent sequentially
- Updates campaign status throughout lifecycle
- Handles failures and provides diagnostics

**Reviewer Agent (one per persona):**
- Receives persona ID and content version ID
- Hydrates full persona profile from database
- Reads immutable content snapshot
- Conducts four-dimension review
- Generates structured output:
  - Ratings (1-10 for each dimension)
  - Narrative feedback (persona's voice)
  - Issue annotations (specific callouts)
  - Overall assessment (summary verdict)
- Stores review JSON in `persona_reviews` table
- Writes markdown to `data/reviews/raw/{campaign_id}/{persona_id}.md`
- Returns completion status to orchestrator

**Analyzer Agent:**
- Triggered after all reviewers complete
- Reads all reviews for the campaign
- Performs cross-persona pattern analysis
- Calculates dimension summaries (averages, themes)
- Generates priority rankings (severity × frequency)
- Creates persona breakdowns (by archetype, experience level)
- Compares to previous campaigns for trend analysis
- Stores analysis JSON in `campaign_analyses` table
- Writes markdown to `data/reviews/analysis/{campaign_id}.md`

**Parallel Execution:**
Orchestrator launches reviewers using multiple Task tool calls in a single message for parallel execution. Waits for all to complete before triggering analyzer sequentially.

## Data Flow & Workflow

**Step 1: Campaign Initialization**
```
User: pnpm review book core/v1
  ↓
Orchestrator creates review_campaigns record (status: pending)
  ↓
Snapshot content to book_versions/chapter_versions with hash
  ↓
Select personas (all_core/manual/smart_sampling)
  ↓
Update campaign status to 'in_progress'
```

**Step 2: Parallel Review Execution**
```
Orchestrator launches N reviewer agents in parallel
  ↓
Each Reviewer Agent:
  - Hydrate persona from database
  - Read content version from database
  - Conduct four-dimension review
  - Write JSON to persona_reviews table
  - Write markdown to data/reviews/raw/{campaign_id}/{persona_id}.md
  - Report completion
  ↓
Orchestrator verifies:
  - Database record exists
  - Markdown file exists on disk
  - Review JSON is valid
```

**Step 3: Analysis & Aggregation**
```
All reviewers complete + verified
  ↓
Update campaign status to 'analyzing'
  ↓
Launch Analyzer Agent:
  - Read all reviews for campaign
  - Cross-persona pattern detection
  - Dimension summaries
  - Priority rankings (severity × frequency)
  - Persona breakdowns
  - Trend analysis (compare to previous campaigns)
  - Write JSON to campaign_analyses table
  - Write markdown to data/reviews/analysis/{campaign_id}.md
  ↓
Update campaign status to 'completed'
```

**Step 4: Output & Integration**
```
Campaign analysis markdown → Human review
  ↓
Structured data in database → Iterative Editing workflow queries
  ↓
Trend data → Version comparison and progress tracking
```

## Markdown Output Structure

**Individual Review:** `data/reviews/raw/{campaign_id}/{persona_id}.md`
```markdown
# Review: {Persona Name} - {Content Title}
Campaign: {campaign_id} | Date: {timestamp}

## Persona Profile
- Archetype: {archetype}
- Experience: {experience_level}
- Playstyle: {key traits}

## Structured Ratings
- Clarity & Readability: {score}/10
- Rules Accuracy: {score}/10
- Persona Fit: {score}/10
- Practical Usability: {score}/10

## Narrative Feedback
{Persona's voice describing their experience reading/using the content}

## Issue Annotations
### Section: {section_name}
**Issue:** {specific problem}
**Impact:** {why it matters for this persona}
**Location:** {paragraph/page reference}

## Overall Assessment
{Summary verdict on whether content works for this persona}
```

**Campaign Analysis:** `data/reviews/analysis/{campaign_id}.md`
```markdown
# Campaign Analysis: {campaign_name}
Date: {timestamp} | Personas: {count} | Content: {title}

## Executive Summary
{High-level overview of findings}

## Priority Rankings
1. **{Issue category}** (Severity: {score}, Frequency: {count}/{total} personas)
   - Affected personas: {list}
   - Description: {details}

## Dimension Summaries
### Clarity & Readability
Average: {score}/10 | Common themes: {themes}

### Rules Accuracy
Average: {score}/10 | Common themes: {themes}

### Persona Fit
Average: {score}/10 | Common themes: {themes}

### Practical Usability
Average: {score}/10 | Common themes: {themes}

## Persona Breakdowns
### Beginners ({count} personas)
- Strengths: {what worked}
- Struggles: {what didn't}

### Veterans ({count} personas)
- Strengths: {what worked}
- Struggles: {what didn't}

## Trend Analysis
{Comparison to previous campaigns if available}
```

## Quality Checks & Validation

**File Existence Verification:**
After each reviewer agent reports completion, orchestrator verifies markdown file exists at expected path using file system checks. After analyzer completes, verify analysis markdown exists. If file is missing, mark agent work as 'failed' even if it reported success. This catches cases where agents think they wrote files but didn't actually commit to disk.

**Database Record Verification:**
Check that `persona_reviews` record exists with valid `review_data` JSON. Check that `campaign_analyses` record exists with valid `analysis_data`. Cross-validate markdown file paths match database records.

**Reviewer Output Validation:**
- All four dimension scores present (1-10 range)
- Narrative feedback non-empty
- At least one issue annotation
- Overall assessment present
- Invalid output triggers retry or failure

**Analyzer Output Validation:**
- Priority rankings present (if reviews found issues)
- Dimension summaries for all four dimensions
- Persona breakdowns grouped by relevant attributes
- Empty or malformed analysis fails with detailed error messages

**Content Snapshotting:**
Before review starts, snapshot content to `book_versions`/`chapter_versions` with file hash. Ensures all reviewers evaluate identical content even if source file changes mid-campaign.

**Campaign Integrity Checks:**
Verify all expected reviewer agents completed AND wrote files before triggering analysis. If any fail, mark campaign 'failed' with list of failed persona IDs. Support retry or partial-result continuation.

**Idempotency:**
Each campaign uses unique ID. Re-running creates new campaign record rather than overwriting, preserving historical data for trend analysis.

## Implementation Components

**TypeScript Modules:**

**`src/tooling/reviews/campaign-client.ts`**
- Database client for review tables (campaigns, reviews, analyses)
- CRUD operations and status transitions
- Query helpers for trend analysis

**`src/tooling/reviews/orchestrator.ts`**
- Main orchestration logic
- Campaign lifecycle management
- Parallel agent launching via Task tool
- Completion polling and verification
- Failure handling and diagnostics

**`src/tooling/reviews/reviewer-agent-prompt.ts`**
- Generates detailed prompts for reviewer agents
- Includes persona profile, content path, review dimensions
- Specifies output schema requirements

**`src/tooling/reviews/analyzer-agent-prompt.ts`**
- Generates prompts for analyzer agents
- Instructions for cross-persona analysis
- Priority ranking algorithms
- Persona breakdown strategies
- Trend analysis methodology

**`src/tooling/reviews/content-snapshot.ts`**
- Snapshots HTML/markdown content to database
- Calculates file hashes for version tracking
- Handles both book and chapter content types

**`src/tooling/reviews/validators.ts`**
- JSON schema validation for review output
- JSON schema validation for analysis output
- File existence checks
- Campaign integrity verification

**`src/tooling/cli-commands/review.ts`**
- CLI entry point for review commands
- Argument parsing: `pnpm review book|chapter <path> [--personas=id1,id2]`
- Progress display and result summary
- Error reporting

## CLI Interface

**Review a book:**
```bash
pnpm review book core/v1
pnpm review book core/v1 --personas=all_core
pnpm review book core/v1 --personas=core-sarah,core-alex
```

**Review a chapter:**
```bash
pnpm review chapter core/v1/chapters/03-combat.md
pnpm review chapter core/v1/chapters/03-combat.md --personas=smart_sampling
```

**List campaigns:**
```bash
pnpm review list
pnpm review list --status=completed
pnpm review list --content=core/v1
```

**View campaign:**
```bash
pnpm review view {campaign_id}
pnpm review view {campaign_id} --format=json
```

**Retry failed reviews:**
```bash
pnpm review retry {campaign_id}
```

## Future Considerations

**Version Comparison (after version tracking fully operational):**
- Compare specific version pairs (v1.2 vs v1.3)
- Visualize score trajectories over time
- Identify regressions in specific dimensions
- Track improvement velocity

**Smart Sampling Implementation:**
- Analyze content type/topic from title and headings
- Select personas based on content characteristics:
  - Combat chapters → tactics-focused personas
  - Intro chapters → beginner personas
  - GM guidance → GM-focused personas
- Balance experience levels and archetypes
- Minimum diversity requirements

**Parallel Scaling:**
- Monitor performance with 10 concurrent reviewer agents
- Identify Claude Code concurrency limits
- Implement batching strategies if needed (2 batches of 5)
- Consider sequential fallback for resource constraints

**Iterative Editing Integration:**
- Define query API for editing workflow
- Provide filtered views (e.g., "all HIGH priority issues")
- Support issue status tracking (acknowledged, fixed, deferred)
- Link edits back to campaign recommendations

**Enhanced Trend Analysis:**
- Automatic regression detection (scores dropping between versions)
- Issue persistence tracking (same problems across campaigns)
- Persona satisfaction trends over time
- Dimension-specific progress reports

**Review Quality Metrics:**
- Track reviewer agent execution times
- Measure review depth (annotation count, feedback length)
- Identify consistently harsh/lenient personas
- Calibrate scoring across personas

**Content Change Detection:**
- Diff previous version against current
- Focus reviews on changed sections
- Skip unchanged sections in incremental reviews
- Highlight new content for reviewers

**Multi-book Comparisons:**
- Compare review scores across different books
- Identify systemic writing patterns (good or bad)
- Cross-book persona satisfaction analysis
- Benchmark against best-performing content

## Questions for Future Implementation

When ready to implement, consider:

1. **Persona Selection Strategy Priority:** Should we implement all three (all_core, manual, smart_sampling) in first version, or start with all_core and add others incrementally?

2. **Failure Recovery:** Should campaigns with partial failures support continuing with available reviews, or always require full completion?

3. **Review Granularity:** Should chapter reviews support reviewing specific sections within a chapter, or only whole chapters?

4. **Analysis Customization:** Should users be able to configure which analysis types to run (e.g., skip trend analysis for first review), or always run all analysis types?

5. **Concurrent Campaign Limits:** Should the system prevent multiple campaigns from running simultaneously, or allow concurrent campaigns with resource warnings?

6. **Review Archives:** Should old campaigns be automatically archived after a certain period, or maintain full history indefinitely?

7. **Human Review Integration:** Should the system support humans adding comments/annotations to campaign analysis, or keep analysis read-only?

## Success Criteria

**Functional Requirements:**
- [ ] Can review entire HTML books
- [ ] Can review individual markdown chapters
- [ ] Generates valid reviews for all selected personas
- [ ] Produces comprehensive campaign analysis
- [ ] Stores all data in database with queryable structure
- [ ] Writes human-readable markdown for all outputs
- [ ] Handles failures gracefully with clear diagnostics

**Quality Requirements:**
- [ ] File existence verification catches missing writes
- [ ] Content snapshots ensure review consistency
- [ ] Parallel execution completes faster than sequential
- [ ] Analysis provides actionable insights
- [ ] Trend tracking works across multiple campaigns

**Integration Requirements:**
- [ ] Review data accessible to Iterative Editing workflow
- [ ] Compatible with existing persona system
- [ ] Works with current database schema
- [ ] CLI integrates with existing tooling commands

## Next Steps

1. Set up git worktree for isolated development
2. Create detailed implementation plan with task breakdown
3. Implement database schema updates
4. Build campaign client and orchestrator
5. Develop reviewer agent prompt templates
6. Develop analyzer agent prompt templates
7. Implement validators and quality checks
8. Build CLI interface
9. Test with single persona end-to-end
10. Test with all core personas in parallel
11. Validate markdown output formats
12. Document usage and examples
