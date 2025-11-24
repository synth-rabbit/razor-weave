# Data Dashboard Analysis

**Date:** 2025-11-23
**Purpose:** Initial analysis of available data sources for VP Agent and operator dashboards, plus identification of data opportunities.

---

## Part 1: Existing Data Sources

### Database Overview

**Location:** `data/project.db` (SQLite)
**Size:** ~4.6MB active + WAL

#### Table Inventory

| Table | Records | Purpose |
|-------|---------|---------|
| `books` | 1 | Book registry with status tracking |
| `book_versions` | 6 | Version history (content snapshots) |
| `chapter_versions` | 0 | Individual chapter history (not yet populated) |
| `workflow_runs` | 9 | W1-W4 workflow execution tracking |
| `workflow_events` | 0 | Event log (not yet populated) |
| `workflow_artifacts` | 34 | Output artifacts from workflow runs |
| `workflow_triggers` | - | Cross-workflow automation rules |
| `strategic_plans` | 4 | Active improvement plans |
| `personas` | 400 | Reviewer personas (9 core + 391 generated) |
| `persona_dimensions` | 3,181 | Persona trait attributes |
| `persona_reviews` | 79 | Completed persona reviews |
| `review_campaigns` | 6 | Review campaign tracking |
| `campaign_analyses` | 4 | Aggregated analysis reports |
| `rejections` | 0 | Rejection tracking (not yet populated) |
| `escalations` | 0 | Escalation tracking (not yet populated) |
| `boardroom_sessions` | 3 | VP planning sessions |
| `boardroom_minutes` | - | Session minutes |
| `vp_plans` | - | VP-generated plans |
| `phases` | - | Plan phases |
| `milestones` | - | Phase milestones |
| `engineering_tasks` | - | Task breakdown |
| `html_builds` | - | HTML build tracking |
| `plans` | - | Plan registry |
| `data_artifacts` | - | Generic artifact storage |

---

### Book Content Structure

**Current Book:** Razorweave Core Rulebook
**Status:** `editing`
**Current Version:** `1.2.0`

#### Version History on Disk

```
books/core/
├── v1.0.0/
├── v1.1.0/
└── v1.2.0/
    ├── chapters/     (30 markdown files)
    ├── sheets/       (reference sheets)
    └── exports/
        └── html/
```

#### Chapter List (30 chapters)

1. Welcome to the Game
2. Core Concepts
3. How to Use This Rulebook
4. Core Principles of Play
5. Ways to Play
6. Character Creation
7. Characters and Attributes
8. Actions, Checks, Outcomes
9. Tags, Conditions, Clocks
10. Combat Basics
11. Exploration & Social Play
12. Downtime, Recovery, Advancement Overview
13. Roleplaying Guidance & Working with GM
14. Skills System Overview
15. Skills Reference by Attribute
16. Proficiencies System Overview
17. Proficiencies Reference by Domain
18. Extended Tags & Conditions Reference
19. Advancement & Long-term Growth
20. Optional Variant Rules
21. Running Sessions
22. Running Campaigns
23. Designing Scenarios & One-shots
24. NPCs, VPCs, Enemies
25. Factions, Fronts, World Pressure
26. Alternative Play
27. Sheets and Play Aids
28. Glossary
29. Index
30. Inspirations and Acknowledgments

---

### Workflow System Data

#### Workflow Run Status Distribution

| Status | Count |
|--------|-------|
| completed | 2 |
| running | 1 |
| pending | 6 |

#### Artifact Types Produced

| Type | Count |
|------|-------|
| chapter | 12 |
| qa_report | 6 |
| design_plan | 4 |
| pdf_draft | 3 |
| print_html | 3 |
| release_notes | 3 |
| web_html | 3 |

#### Workflow Artifacts Directory Structure

```
data/w1-artifacts/
├── release-notes-v1.0.0-20251123.md
├── wfrun_miby9oo6_a7xlw7/
├── wfrun_mic5vslx_4umpzj/
└── wfrun_mic6qjlc_jmdfg1/

data/w1-prompts/
├── wfrun_miby9oo6_a7xlw7/
├── wfrun_mic5vslx_4umpzj/
└── wfrun_mic6qjlc_jmdfg1/

data/w1-strategic/
├── strat_mic3cd588cipbd/
├── strat_mic5qiyqvb2l73/
├── strat_mic6ibp5xjkx66/
└── strat_mic6oh76zceg7x/
```

---

### Persona Review System

#### Persona Archetype Distribution

| Archetype | Count |
|-----------|-------|
| Achiever | 52 |
| Tactician | 51 |
| Method Actor | 50 |
| Socializer | 45 |
| Storyteller | 44 |
| Power Gamer | 42 |
| Killer | 40 |
| Explorer | 40 |
| Casual Gamer | 36 |

#### Persona Experience Level Distribution

| Experience Level | Count |
|------------------|-------|
| Long-term GM | 63 |
| Hybrid GM/Player | 59 |
| Experienced (3-10 years) | 57 |
| Early Intermediate (1-3 years) | 57 |
| Veteran (10-20 years) | 55 |
| Forever GM | 55 |
| Newbie (0-1 years) | 54 |

#### Persona Dimension Types

| Dimension Type | Count |
|----------------|-------|
| system_exposures | 817 |
| social_emotional_traits | 806 |
| playstyle_modifiers | 781 |
| life_contexts | 777 |

#### Review Campaign Status

| Status | Count |
|--------|-------|
| completed | 2 |
| in_progress | 4 |

#### Sample Review Metrics (from completed campaigns)

- **Clarity & Readability:** 8.6/10 average
- **Rules Accuracy:** 8.0/10 average
- **Persona Fit:** 7.7/10 average
- **Practical Usability:** 8.0/10 average

#### Priority Issue Rankings (from campaign analysis)

| Rank | Chapter | Severity | Frequency |
|------|---------|----------|-----------|
| 1 | Chapter 10 - Combat Basics | 10 | 14/20 |
| 2 | Chapter 6 - Character Creation | 9 | 13/20 |
| 3 | Chapter 9 - Tags, Conditions, Clocks | 8 | 12/20 |
| 4 | Chapter 5 - Ways to Play | 7 | 12/20 |
| 5 | Chapter 8 - Actions, Checks, Outcomes | 6 | 9/20 |

---

### Event Sourcing

**Location:** `data/events/`

#### Event Files

```
2025-11-23-sess_687bc31b.jsonl   (30KB)
2025-11-23-sess_c7c49ec7.jsonl   (10KB)
2025-11-23-session-*.jsonl       (various small files)
```

#### Event Structure (sample)

```json
{
  "id": "evt_02e704b1",
  "ts": "2025-11-23T13:33:08.437Z",
  "worktree": "main",
  "table": "vp_plans",
  "op": "INSERT",
  "data": { ... }
}
```

**Event types observed:** INSERT, UPDATE on tables including vp_plans, phases, milestones, boardroom_sessions

---

### Visual Issue Tracking

**Location:** `data/issues/`

| File | Issue Type |
|------|------------|
| double-headers-on-tables-example.png | Layout |
| gam-guidance-clipping-content-example.png | Overflow |
| mostly-empty-page-example.png | Layout |
| mostly-empty-page-example-2.png | Layout |
| overflowing-example-box.png | Overflow |
| overflowing-example-box-2.png | Overflow |
| overflowing-example-box-3.png | Overflow |
| weird-ampersand-inclusion.png | Typography |
| weird-bullets-example.png | Typography |
| weird-pink-line-example.png | Styling |

---

### PDF Assets

**Location:** `data/pdfs/`

```
data/pdfs/
├── assets/
│   ├── cover-artwork.png        (3.1MB)
│   ├── part-1-background.png    (2.9MB)
│   ├── part-2-background.png    (2.5MB)
│   ├── part-3-background.png    (2.1MB)
│   └── part-4-background.png    (2.2MB)
└── draft/
    ├── core-rulebook.pdf           (13.1MB)
    └── core-rulebook-2025-11-23.pdf (13.2MB)
```

---

### Website Structure

**Location:** `src/site/`

#### Pages

- `index.njk` - Homepage
- `read.html` - Online rulebook reader
- `about.njk` - About page
- `license.njk` - License info
- `privacy.njk` - Privacy policy
- `terms.njk` - Terms of service
- `404.njk` - Error page

**Current analytics:** None
**Current feedback:** Google Forms (external)

---

## Part 2: Recommended Dashboard Widgets

### For Human Operator

1. **Workflow Pipeline Status**
   - Current runs with status indicators
   - Success/failure rates over time
   - Active blockers and escalations

2. **Version Timeline**
   - Book versions with diff summaries
   - Change volume per version
   - Triggering campaigns/issues

3. **Issue Heatmap**
   - Chapters ranked by severity × frequency
   - Trend over versions (improving/worsening)
   - Linked to specific persona feedback

4. **Metric Trends**
   - Clarity/usability/accuracy scores over time
   - Before/after comparisons per improvement cycle
   - Persona segment breakdowns

### For VP Agents

1. **Active Strategic Plans**
   - Status, areas, cycles completed
   - Cumulative delta tracking
   - Blocked items

2. **Review Coverage**
   - Which personas have reviewed which versions
   - Coverage gaps by archetype/experience
   - Review freshness

3. **Improvement Delta Tracking**
   - Before/after metrics per improvement area
   - Success rate of interventions
   - Cost per point of improvement

4. **Artifact Production Log**
   - What's been generated, what's pending
   - Artifact dependencies
   - Output quality signals

---

## Part 3: Missing Data (Gaps in Current System)

| Gap | Impact |
|-----|--------|
| `workflow_events` empty | No event-level visibility into workflow execution |
| `rejections` empty | No rejection workflow data captured |
| `escalations` empty | No escalation patterns visible |
| `chapter_versions` empty | No granular chapter history |
| No timing/cost metrics | Can't optimize agent economics |
| No reader analytics | No real-world usage validation |
| Feedback via Google Forms | Disconnected from data model |

---

## Part 4: Data Opportunities (What Doesn't Exist)

### Tier 1: Reader Analytics (Website)

**What doesn't exist:** Any visibility into how people actually use the rulebook.

| Data Point | Value | Implementation |
|------------|-------|----------------|
| Page/Chapter views | Which content is actually read? | Client-side events to DB |
| Reading depth | How far do readers scroll? | Intersection observer |
| Time on chapter | Engagement proxy | Session tracking |
| Search queries | What are people looking for? | Log search input |
| Navigation patterns | How do people move through the book? | Clickstream logging |
| Bookmark usage | What content is saved for reference? | Bookmark events |
| Device/viewport | Mobile vs desktop patterns | User agent + viewport |
| Drop-off points | Where do readers abandon? | Session end analysis |

**Why it matters:** Currently persona reviews are synthetic (400 generated personas simulating reactions). Real reader behavior would:
- Validate persona predictions against actual usage
- Prioritize improvements based on real friction
- Measure if version changes improved engagement

---

### Tier 2: Structured Feedback System

**Current state:** Google Forms (unstructured, disconnected)

**What could exist:**

| Feedback Type | Schema | Connection |
|---------------|--------|------------|
| Chapter-specific feedback | `{chapter_id, rating, issue_type, free_text}` | Links to `chapter_versions` |
| Rule clarification requests | `{section, confusion_type, context}` | Maps to priority rankings |
| Playtest reports | `{session_type, player_count, duration, issues[], highlights[]}` | New `playtest_sessions` table |
| Error reports | `{location, error_type, screenshot_url}` | Links to visual issues |

**Why it matters:** Closes the feedback loop:
```
personas predict issues → writers fix → feedback confirms/contradicts
```

---

### Tier 3: Workflow Cost & Performance Metrics

**What doesn't exist:** Visibility into agent economics.

| Metric | Current Gap | Value |
|--------|-------------|-------|
| Token usage per agent call | Not tracked | Cost optimization |
| Agent execution time | Partial (only on reviews) | Performance baseline |
| Rejection frequency by agent | `rejections` table empty | Identify weak agents |
| Retry cost | Not computed | True cost of iteration |
| Time-to-completion per run | Can compute from timestamps | SLA tracking |

**Suggested schema addition:**

```sql
CREATE TABLE agent_invocations (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT,
  agent_type TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd REAL,
  duration_ms INTEGER,
  status TEXT CHECK(status IN ('success', 'failed', 'timeout')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Tier 4: Content Version Diffing

**What doesn't exist:** Programmatic change tracking.

Currently `book_versions` stores full content blobs. Missing:
- Semantic diff between versions
- Per-chapter change summaries
- Change attribution (which issue/campaign drove this edit?)

**Suggested schema addition:**

```sql
CREATE TABLE version_diffs (
  id TEXT PRIMARY KEY,
  from_version_id TEXT NOT NULL,
  to_version_id TEXT NOT NULL,
  chapter_path TEXT,
  change_type TEXT CHECK(change_type IN ('addition', 'deletion', 'modification')),
  line_count_delta INTEGER,
  word_count_delta INTEGER,
  triggering_campaign_id TEXT,
  triggering_issue_ids TEXT, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Tier 5: Publication & Distribution Analytics

**What doesn't exist:** Post-publication lifecycle data.

| Data Source | What to Track |
|-------------|---------------|
| PDF downloads | Count, source page, user agent |
| Print-on-demand orders | Integration with DriveThruRPG, etc. |
| Version adoption | Are readers using latest version? |
| Link/citation tracking | Who's linking to content? |

---

## Part 5: Data Pipeline Architecture

### Current State

```
SQLite (project.db) ← CLI commands write directly
                   ← Event JSONL files (append-only log)
```

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Collection Layer                                           │
├─────────────────────────────────────────────────────────────┤
│  • Website: JS SDK → events API                             │
│  • Feedback: Form widget → structured endpoint              │
│  • Agents: Instrumented calls → invocation log              │
│  • Git hooks: Version events                                │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Storage Layer                                              │
├─────────────────────────────────────────────────────────────┤
│  • Raw events: JSONL files (current) or append-only table   │
│  • Processed: SQLite project.db (current, extended)         │
│  • Aggregates: Materialized views or summary tables         │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Analysis Layer                                             │
├─────────────────────────────────────────────────────────────┤
│  • Dashboard: Read from aggregates                          │
│  • VP Agents: Query processed data + raw when needed        │
│  • Reports: Scheduled summaries (weekly metrics, etc.)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 6: Prioritized Implementation Path

### Phase 1: Quick Wins (Highest Value, Lowest Effort)

1. **Instrument agent invocations** - Add cost/timing capture to existing agent calls
2. **Populate workflow_events** - Wire up event emission that's already designed
3. **Add reader analytics to site** - Start with chapter view events

### Phase 2: Structured Feedback

1. **Build in-site feedback widget** - Replace Google Forms
2. **Create playtest_sessions table** - Structured playtest data capture
3. **Link feedback to chapters/versions** - Proper foreign keys

### Phase 3: Advanced Analytics

1. **Version diffing** - Compute and store change summaries
2. **Aggregate metrics tables** - Pre-computed dashboard data
3. **Trend analysis** - Time-series views of key metrics

### Phase 4: Distribution Analytics

1. **PDF download tracking** - Server-side logging
2. **Version adoption tracking** - Identify outdated readers
3. **External integrations** - Print-on-demand, etc.

---

## Appendix: File Locations Reference

| Category | Location |
|----------|----------|
| Database | `data/project.db` |
| Event logs | `data/events/*.jsonl` |
| Review analyses | `data/reviews/analysis/*.md` |
| Review prompts | `data/reviews/prompts/` |
| Visual issues | `data/issues/*.png` |
| Workflow artifacts | `data/w1-artifacts/` |
| Workflow prompts | `data/w1-prompts/` |
| Strategic plans | `data/w1-strategic/` |
| PDF drafts | `data/pdfs/draft/` |
| PDF assets | `data/pdfs/assets/` |
| Book content | `books/core/v*/` |
| Website source | `src/site/` |
| Website build | `src/site/dist/` |
