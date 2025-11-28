# W1R Revision Workflow Design

**Created:** 2025-11-28
**Status:** Design Complete
**Purpose:** Human-driven creative revision workflow for post-w1 refinement

## Overview

W1R (w1-revision) is a chapter-by-chapter workflow that allows the author to make creative adjustments after w1 editing is complete. Unlike w1's automated strategic approach, w1r keeps the human in the driver's seat at every step, using AI agents as collaborative assistants.

### Key Differences from W1

| Aspect | W1 | W1R |
|--------|----|----|
| Scope | Whole book at once | Chapter-by-chapter |
| Driver | Strategic plan from analysis | Human feedback per chapter |
| Writer behavior | Executes plan | Clarifies then executes |
| Review gates | Auto-loop on rejection | Human sees all feedback, decides |
| Purpose | Initial editing pass | Creative refinement |

## Workflow Structure

### Core Loop (per chapter)

```
┌─────────────────────────────────────────────────────────┐
│  1. Human provides structured feedback                  │
│           ↓                                             │
│  2. Writer (optionally) asks clarifying questions       │
│           ↓                                             │
│  3. Writer produces updated chapter                     │
│           ↓                                             │
│  4. Editor + Domain expert review → findings to Human   │
│           ↓                                             │
│  5. Human: Approve → next chapter                       │
│           OR Reject → back to step 1 with new feedback  │
└─────────────────────────────────────────────────────────┘
```

### Progression

- **Strict sequential**: Chapter 1 must be approved before Chapter 2 begins
- **Single active revision**: Only one w1r run active per book at a time

### End of Book

After Chapter 30 is approved:
1. Option to run chapter-level reviews before promotion
2. Patch version increment (e.g., 1.4.0 → 1.4.1)
3. Generate HTML and PDF artifacts

## Feedback Template

```markdown
# Chapter Feedback: [Chapter Title]

## Tone/Voice
- [ ] No issues
- [Your notes, e.g., "Make the combat examples more visceral"]

## Content to Add
- [ ] No issues
- [Your notes, e.g., "Need an example of `contested checks` in social situations"]

## Content to Remove/Trim
- [ ] No issues
- [Your notes]

## Pacing/Flow
- [ ] No issues
- [Your notes]

## Clarity
- [ ] No issues
- [Your notes, with `specific text` in backticks when referencing passages]

## Consistency
- [ ] No issues
- [Your notes on alignment with other chapters, terminology]

## Creative Direction
- [ ] No issues
- [Bigger picture notes that don't fit above]
```

**Usage:**
- Check the box if no issues in that category
- Otherwise, leave unchecked and write feedback
- Use backticks for specific text references
- Can be general ("tighten the pacing") or specific

## Agent Behaviors

### Writer Agent

**Phase 1: Assessment**
- Receives feedback and current chapter
- Decides if clarification is needed based on:
  - Ambiguity in feedback
  - Scope of changes
  - Potential conflicts between feedback items

**Phase 2: Clarifying Dialogue (if needed)**
- Iterative Q&A until confident
- Can ask multiple rounds of questions
- Human can say "just write it" to skip

Example:
```
Writer: "You mentioned tightening pacing in the middle - are you referring
        to the skill resolution section or the extended example? Or both?"

You:    "The extended example - it repeats concepts already covered."

Writer: "Got it. One more: for the tone shift to 'more visceral combat
        examples' - should I maintain the current PG-13 level or can I
        push slightly darker?"

You:    "Keep it PG-13, just more active verbs and sensory details."

Writer: "Clear. I'm ready to write."
```

**Phase 3: Execute**
- Produces the updated chapter markdown
- Includes a brief change summary (what was modified and why)

### Editor Agent

**Focus areas:**
- Prose quality, grammar, readability
- Consistency with book's style guide
- Pacing and flow improvements
- Whether the Writer addressed the human's feedback appropriately

**Output:** Assessment (Approve with notes / Concerns) + specific feedback

### Domain Expert Agent

**Focus areas:**
- Rules accuracy and clarity
- Mechanical consistency with other chapters
- Whether examples correctly demonstrate concepts
- TTRPG-specific concerns (player/GM usability)

**Output:** Assessment (Approve / Concerns) + specific feedback

### Review Output Format

```markdown
## Editor Review

**Assessment:** Approve with notes

**Feedback:**
- The pacing improvements work well in the middle section
- Note: Line 67 introduces "advantage" but chapter 8 calls it "edge" -
  terminology inconsistency

## Domain Expert Review

**Assessment:** Concerns

**Feedback:**
- Combat example now correctly shows contested check resolution
- Concern: The new example on line 112 implies stacking bonuses,
  which contradicts the core resolution rules
```

## CLI Commands

### User-Facing Commands

```bash
# Start new revision
pnpm w1r:start --book core-rulebook

# Resume existing revision
pnpm w1r:resume --run <id>

# Check status
pnpm w1r:status --run <id>

# List revisions
pnpm w1r:list [--book <slug>] [--status <status>]
```

### Agent-Driven Commands (run via Bash in session)

```bash
# Process feedback and run agents
pnpm w1r:process --run <id> --chapter <n>

# Mark chapter approved, advance to next
pnpm w1r:approve --run <id> --chapter <n>

# Complete workflow, handle promotion
pnpm w1r:complete --run <id>
```

## Prompt-Driven Flow

### Starting/Resuming

Running `pnpm w1r:start` or `pnpm w1r:resume` outputs a prompt to paste into Claude Code:

```
We are working on w1r run wfrun_abc123 for core-rulebook.
Chapter 1: Welcome to the Game

Feedback template created: data/w1r/wfrun_abc123/feedback/01-feedback.md

Await my confirmation, then await my feedback on Chapter 1.

When I confirm feedback is ready, run:
  pnpm w1r:process --run wfrun_abc123 --chapter 1

That command will return instructions for analyzing feedback,
clarification dialogue, writing, and editor/domain review.

Output will be written to: data/w1r/wfrun_abc123/outputs/01-output.md
```

### After Approval

Agent runs approval command which:
- Marks chapter complete in database
- Creates next feedback template
- Outputs next chapter prompt (same structure)

### Completion Prompt

After Chapter 30 is approved:

```
W1R revision complete for core-rulebook!

All 30 chapters approved.
Total feedback rounds: 42 (avg 1.4 per chapter)

Before promoting to v1.4.1, would you like to run chapter reviews?

Options:
1. Skip reviews - promote now
2. Sanity check - 20 reviewers (10 core + 10 targeted) per chapter
3. Comprehensive - 50 reviewers (10 core + 40 distributed) per chapter

Reply with your choice (1/2/3).
```

## Workspace Structure

```
data/w1r/<run-id>/
├── chapters/           # Copied from source version at start
│   ├── 01-welcome-to-the-game.md
│   ├── 02-core-concepts.md
│   └── ...
├── feedback/           # Feedback templates, one per chapter
│   ├── 01-feedback.md
│   ├── 02-feedback.md
│   └── ...
└── outputs/            # Review results and change summaries
    ├── 01-output.md
    ├── 02-output.md
    └── ...
```

## Database Schema

### Workflow Run (existing table)

```sql
-- Uses existing workflow_runs table
workflow_type = 'w1r_revision'
```

### Checkpoint Structure

```typescript
interface W1RCheckpoint {
  workflowRunId: string;
  workflowType: 'w1r_revision';

  // Position
  currentChapter: number;  // 1-30
  chapterStatus: 'feedback' | 'clarifying' | 'writing' | 'reviewing' | 'human_decision';

  // Current chapter state
  currentFeedback: FeedbackTemplate | null;
  clarifyingDialogue: Array<{
    role: 'writer' | 'human';
    content: string;
  }>;
  writerOutput: {
    chapterPath: string;
    changeSummary: string;
  } | null;
  editorReview: {
    assessment: string;
    feedback: string;
  } | null;
  domainReview: {
    assessment: string;
    feedback: string;
  } | null;

  // Iteration tracking
  currentChapterIteration: number;

  // History
  completedChapters: Array<{
    chapter: number;
    feedbackRounds: number;
    completedAt: string;
  }>;
}
```

### Status Display

`pnpm w1r:status --run <id>` shows:

```
W1R Revision: core-rulebook (wfrun_abc123)
Status: Chapter 12/30, awaiting your feedback

Last action: Editor + Domain review complete (2 hours ago)

Your feedback: "Tighten pacing in skill resolution, add contested check example"
Changes made: Trimmed 180 words from resolution section, added social
              conflict example with contested Influence checks
Reviews: Editor approved with terminology note, Domain flagged bonus stacking

Completed: 11 chapters (avg 1.3 feedback rounds each)
```

## Review Options (End of Book)

### Sanity Check (20 reviewers per chapter)
- 10 core personas (always included)
- 10 targeted personas (fit target audience profile)
- Quick validation pass

### Comprehensive (50 reviewers per chapter)
- 10 core personas (always included)
- 40 personas using normal review distribution
- Deep validation before promotion

Both use **chapter-level reviews**, not full book reviews.

## Promotion Flow

After reviews (or skip):
1. Create new version directory: `books/core/v1.4.1/`
2. Copy revised chapters from workspace
3. Update database: `current_version` → `1.4.1`
4. Generate HTML (web + print)
5. Generate PDF
6. Archive or clean up workspace

## Implementation Notes

### Files to Create

- `src/tooling/cli-commands/w1r.ts` - CLI command handlers
- `src/tooling/workflows/w1r-workflow.ts` - Workflow definition
- `src/tooling/workflows/w1r-prompts.ts` - Prompt generation
- `src/tooling/workflows/w1r-agents.ts` - Agent prompt templates (Writer, Editor, Domain)

### Integration Points

- Reuse existing `workflow_runs` table
- Reuse existing review system for end-of-book reviews
- Reuse existing version promotion logic
- Reuse existing HTML/PDF generation