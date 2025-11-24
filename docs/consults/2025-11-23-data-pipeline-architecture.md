# Data Analysis Pipeline Architecture

**Date:** 2025-11-23
**Purpose:** Complete architecture for data collection, storage, analysis, and consumption once all components are implemented.

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA SOURCES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Website    │  │   Feedback   │  │    Agent     │  │   Workflow   │     │
│  │   Readers    │  │    Widget    │  │ Invocations  │  │    System    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │                 │              │
│         ▼                 ▼                 ▼                 ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Chapter     │  │  Structured  │  │  Token/Cost  │  │  Run State   │     │
│  │  Views       │  │  Issues      │  │  Metrics     │  │  Changes     │     │
│  │  Scroll      │  │  Ratings     │  │  Timings     │  │  Artifacts   │     │
│  │  Time        │  │  Playtests   │  │  Errors      │  │  Events      │     │
│  │  Search      │  │  Requests    │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COLLECTION LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐ │
│  │      Cloudflare Edge            │    │         Local CLI               │ │
│  │  ┌───────────────────────────┐  │    │  ┌───────────────────────────┐  │ │
│  │  │  razorweave-analytics     │  │    │  │  pnpm run workflow:*      │  │ │
│  │  │  Worker                   │  │    │  │  pnpm run review:*        │  │ │
│  │  │  - /api/session           │  │    │  │  pnpm run w1:*            │  │ │
│  │  │  - /api/events            │  │    │  │                           │  │ │
│  │  │  - /api/feedback          │  │    │  │  Instrumented with:       │  │ │
│  │  └───────────────────────────┘  │    │  │  - Token counting         │  │ │
│  │              │                  │    │  │  - Timing wrappers        │  │ │
│  │              ▼                  │    │  │  - Event emission         │  │ │
│  │  ┌───────────────────────────┐  │    │  └───────────────────────────┘  │ │
│  │  │  D1: razorweave_analytics │  │    │              │                  │ │
│  │  │  - reader_sessions        │  │    │              ▼                  │ │
│  │  │  - reader_events          │  │    │  ┌───────────────────────────┐  │ │
│  │  │  - feedback_submissions   │  │    │  │  project.db               │  │ │
│  │  │  - daily_stats            │  │    │  │  - workflow_runs          │  │ │
│  │  └───────────────────────────┘  │    │  │  - workflow_events        │  │ │
│  │                                 │    │  │  - agent_invocations      │  │ │
│  └─────────────────────────────────┘    │  │  - review_campaigns       │  │ │
│                                         │  │  - persona_reviews        │  │ │
│                                         │  │  - ...                    │  │ │
│                                         │  └───────────────────────────┘  │ │
│                                         │              │                  │ │
│                                         │              ▼                  │ │
│                                         │  ┌───────────────────────────┐  │ │
│                                         │  │  data/events/*.jsonl      │  │ │
│                                         │  │  (Append-only audit log)  │  │ │
│                                         │  └───────────────────────────┘  │ │
│                                         └─────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SYNC / ETL LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Scheduled Sync Job                                │    │
│  │                    (pnpm run sync:analytics)                         │    │
│  │                                                                      │    │
│  │  1. Fetch new events from D1 via /api/export                        │    │
│  │  2. Insert into project.db reader_events_local table                │    │
│  │  3. Update sync watermark in state table                            │    │
│  │  4. Run aggregation queries                                         │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Aggregation Jobs                                  │    │
│  │                    (pnpm run aggregate:daily)                        │    │
│  │                                                                      │    │
│  │  Compute and store:                                                  │    │
│  │  - daily_chapter_metrics (views, avg_time, scroll_completion)       │    │
│  │  - daily_feedback_summary (issues by chapter, ratings)              │    │
│  │  - daily_agent_costs (tokens, cost, duration by agent type)         │    │
│  │  - weekly_trends (week-over-week deltas)                            │    │
│  │  - version_comparisons (metric diffs between book versions)         │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED DATA STORE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         project.db                                   │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │    │
│  │  │  CONTENT        │  │  WORKFLOWS      │  │  REVIEWS        │      │    │
│  │  │  books          │  │  workflow_runs  │  │  personas       │      │    │
│  │  │  book_versions  │  │  workflow_events│  │  review_campaigns│     │    │
│  │  │  chapter_vers.  │  │  workflow_artifacts│ │  persona_reviews│    │    │
│  │  │  version_diffs  │  │  rejections     │  │  campaign_analyses│    │    │
│  │  └─────────────────┘  │  escalations    │  └─────────────────┘      │    │
│  │                       └─────────────────┘                            │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │    │
│  │  │  READER DATA    │  │  FEEDBACK       │  │  AGENT COSTS    │      │    │
│  │  │  reader_events  │  │  feedback_items │  │  agent_invoc.   │      │    │
│  │  │  reader_sessions│  │  playtest_sess. │  │  daily_agent_   │      │    │
│  │  │  daily_chapter_ │  │  issue_reports  │  │    costs        │      │    │
│  │  │    metrics      │  │                 │  │                 │      │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  AGGREGATES & MATERIALIZED VIEWS                             │    │    │
│  │  │  - dashboard_current_state (single row, latest metrics)     │    │    │
│  │  │  - chapter_health_scores (composite score per chapter)      │    │    │
│  │  │  - weekly_trends (7-day rolling aggregates)                 │    │    │
│  │  │  - version_comparison_cache (pre-computed diffs)            │    │    │
│  │  │  - persona_coverage_matrix (who reviewed what)              │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ANALYSIS LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Query Interfaces                                  │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │    │
│  │  │  Dashboard API  │  │  VP Agent API   │  │  Report Gen.    │      │    │
│  │  │                 │  │                 │  │                 │      │    │
│  │  │  Fast queries   │  │  Rich queries   │  │  Scheduled      │      │    │
│  │  │  from aggregates│  │  with joins     │  │  batch queries  │      │    │
│  │  │                 │  │                 │  │                 │      │    │
│  │  │  < 50ms target  │  │  < 500ms target │  │  No time limit  │      │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Analysis Functions                                │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  Chapter Health Score                                        │    │    │
│  │  │  = f(persona_scores, reader_engagement, feedback_sentiment,  │    │    │
│  │  │      scroll_completion, time_on_page, search_appearances)    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  Improvement Delta                                           │    │    │
│  │  │  = compare(version_N_metrics, version_N+1_metrics)           │    │    │
│  │  │    for each chapter modified in workflow run                 │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  Persona-Reality Correlation                                 │    │    │
│  │  │  = correlate(persona_predictions, actual_reader_behavior)    │    │    │
│  │  │    to validate/calibrate persona accuracy                    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  Cost Efficiency                                             │    │    │
│  │  │  = (metric_improvement / tokens_spent)                       │    │    │
│  │  │    per agent, per chapter, per workflow run                  │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONSUMERS                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         HUMAN OPERATOR                                 │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                      Dashboard UI                                │  │  │
│  │  │                                                                  │  │  │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │  │  │
│  │  │  │ Pipeline     │ │ Reader       │ │ Cost         │             │  │  │
│  │  │  │ Status       │ │ Engagement   │ │ Tracking     │             │  │  │
│  │  │  │              │ │              │ │              │             │  │  │
│  │  │  │ • Active runs│ │ • Views/day  │ │ • $/version  │             │  │  │
│  │  │  │ • Blockers   │ │ • Top chapts │ │ • $/chapter  │             │  │  │
│  │  │  │ • Success %  │ │ • Drop-offs  │ │ • Token burn │             │  │  │
│  │  │  └──────────────┘ └──────────────┘ └──────────────┘             │  │  │
│  │  │                                                                  │  │  │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │  │  │
│  │  │  │ Chapter      │ │ Feedback     │ │ Version      │             │  │  │
│  │  │  │ Health       │ │ Inbox        │ │ Timeline     │             │  │  │
│  │  │  │              │ │              │ │              │             │  │  │
│  │  │  │ • Heatmap    │ │ • New issues │ │ • Releases   │             │  │  │
│  │  │  │ • Trends     │ │ • Sentiment  │ │ • Deltas     │             │  │  │
│  │  │  │ • Alerts     │ │ • Patterns   │ │ • Adoption   │             │  │  │
│  │  │  └──────────────┘ └──────────────┘ └──────────────┘             │  │  │
│  │  │                                                                  │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          VP AGENTS                                     │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │  │
│  │  │  VP Product     │  │  VP Engineering │  │  VP Ops         │        │  │
│  │  │                 │  │                 │  │                 │        │  │
│  │  │  Consumes:      │  │  Consumes:      │  │  Consumes:      │        │  │
│  │  │  • Chapter      │  │  • Agent costs  │  │  • Pipeline     │        │  │
│  │  │    health       │  │  • Token usage  │  │    status       │        │  │
│  │  │  • Reader data  │  │  • Error rates  │  │  • Escalations  │        │  │
│  │  │  • Feedback     │  │  • Performance  │  │  • Resource     │        │  │
│  │  │  • Persona      │  │  • Code quality │  │    utilization  │        │  │
│  │  │    reviews      │  │                 │  │                 │        │  │
│  │  │                 │  │                 │  │                 │        │  │
│  │  │  Produces:      │  │  Produces:      │  │  Produces:      │        │  │
│  │  │  • Priority     │  │  • Optimization │  │  • Capacity     │        │  │
│  │  │    rankings     │  │    plans        │  │    plans        │        │  │
│  │  │  • Improvement  │  │  • Tech debt    │  │  • Incident     │        │  │
│  │  │    plans        │  │    tickets      │  │    responses    │        │  │
│  │  │  • Success      │  │  • Refactoring  │  │  • Process      │        │  │
│  │  │    criteria     │  │    proposals    │  │    improvements │        │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       AUTOMATED REPORTS                                │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │  │
│  │  │  Daily Digest   │  │  Weekly Summary │  │  Release Report │        │  │
│  │  │                 │  │                 │  │                 │        │  │
│  │  │  • New feedback │  │  • Trend graphs │  │  • Before/after │        │  │
│  │  │  • Run status   │  │  • Top issues   │  │    metrics      │        │  │
│  │  │  • Alerts       │  │  • Cost summary │  │  • Changelog    │        │  │
│  │  │                 │  │  • Reader stats │  │  • Attribution  │        │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequences

### Sequence 1: Reader Views Chapter

```
Reader opens read.html
       │
       ▼
┌──────────────────┐
│ analytics.js     │
│ - Get/create     │
│   visitor ID     │
│ - Init session   │
└────────┬─────────┘
         │ POST /api/session
         ▼
┌──────────────────┐
│ Worker           │
│ - Create session │
│ - Return ID      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ D1: sessions     │
└──────────────────┘

Reader scrolls to Chapter 6
       │
       ▼
┌──────────────────┐
│ analytics.js     │
│ - Detect chapter │
│ - Queue event    │
└────────┬─────────┘
         │ (batched)
         │ POST /api/events
         ▼
┌──────────────────┐
│ Worker           │
│ - Validate       │
│ - Insert batch   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ D1: events       │
│ - chapter_view   │
│ - scroll_depth   │
│ - time_on_chapter│
└──────────────────┘
```

### Sequence 2: Nightly Sync & Aggregation

```
Cron: 3:00 AM
       │
       ▼
┌──────────────────┐
│ sync:analytics   │
│ - GET /api/export│
│   ?since=...     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ D1: events       │──────┐
└──────────────────┘      │
                          │ JSON response
                          ▼
┌──────────────────────────────┐
│ project.db                   │
│ INSERT INTO reader_events_   │
│   local                      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ aggregate:daily              │
│                              │
│ UPDATE daily_chapter_metrics │
│ UPDATE chapter_health_scores │
│ UPDATE weekly_trends         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ project.db: aggregates       │
│ - Ready for dashboard        │
│ - Ready for VP agents        │
└──────────────────────────────┘
```

### Sequence 3: VP Product Reviews Data

```
VP Product agent invoked
       │
       ▼
┌──────────────────────────────┐
│ Query: chapter_health_scores │
│                              │
│ SELECT chapter_id,           │
│   health_score,              │
│   reader_engagement,         │
│   feedback_sentiment,        │
│   persona_avg_score          │
│ FROM chapter_health_scores   │
│ WHERE book_id = 'core'       │
│ ORDER BY health_score ASC    │
│ LIMIT 5                      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Returns lowest-health        │
│ chapters with breakdown      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Query: detailed feedback     │
│                              │
│ SELECT * FROM feedback_items │
│ WHERE chapter_id IN (...)    │
│ ORDER BY created_at DESC     │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ VP Product produces:         │
│ - Improvement plan           │
│ - Priority rankings          │
│ - Success criteria           │
└──────────────────────────────┘
```

### Sequence 4: Workflow Run with Cost Tracking

```
pnpm w1:content-modify
       │
       ▼
┌──────────────────────────────┐
│ Create workflow_run          │
│ ID: wfrun_xxx                │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Invoke Writer Agent          │
│ ┌──────────────────────────┐ │
│ │ Instrumentation wrapper  │ │
│ │ - Start timer            │ │
│ │ - Count input tokens     │ │
│ └──────────────────────────┘ │
│          │                   │
│          ▼                   │
│ ┌──────────────────────────┐ │
│ │ Claude API call          │ │
│ └──────────────────────────┘ │
│          │                   │
│          ▼                   │
│ ┌──────────────────────────┐ │
│ │ Instrumentation wrapper  │ │
│ │ - Stop timer             │ │
│ │ - Count output tokens    │ │
│ │ - Calculate cost         │ │
│ │ - Record to DB           │ │
│ └──────────────────────────┘ │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ INSERT INTO agent_invocations│
│ - workflow_run_id            │
│ - agent_type: 'writer'       │
│ - input_tokens: 15000        │
│ - output_tokens: 3000        │
│ - cost_usd: 0.054            │
│ - duration_ms: 8500          │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Emit workflow_event          │
│ - type: 'agent_completed'    │
│ - agent: 'writer'            │
│ - status: 'success'          │
└──────────────────────────────┘
```

---

## Schema Additions for Full Pipeline

### Reader Analytics Tables (synced from D1)

```sql
-- Synced from Cloudflare D1
CREATE TABLE reader_events_local (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  remote_id INTEGER UNIQUE,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  chapter_id TEXT,
  chapter_name TEXT,
  event_data TEXT,
  created_at TEXT NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reader_sessions_local (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  referrer TEXT,
  landing_page TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Feedback Tables

```sql
CREATE TABLE feedback_items (
  id TEXT PRIMARY KEY,
  chapter_id TEXT,
  chapter_name TEXT,
  feedback_type TEXT NOT NULL CHECK(feedback_type IN (
    'issue', 'clarification', 'praise', 'suggestion'
  )),
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  content TEXT NOT NULL,
  contact_email TEXT,
  session_id TEXT,
  book_version TEXT,
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'triaged', 'addressed', 'wontfix')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  addressed_at TIMESTAMP,
  addressed_in_version TEXT
);

CREATE TABLE playtest_sessions (
  id TEXT PRIMARY KEY,
  session_type TEXT NOT NULL CHECK(session_type IN ('oneshot', 'campaign', 'solo')),
  player_count INTEGER,
  duration_minutes INTEGER,
  gm_experience TEXT,
  chapters_used TEXT, -- JSON array
  issues TEXT, -- JSON array
  highlights TEXT, -- JSON array
  overall_rating INTEGER CHECK(overall_rating BETWEEN 1 AND 10),
  would_recommend BOOLEAN,
  free_comments TEXT,
  contact_email TEXT,
  book_version TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Agent Cost Tracking Tables

```sql
CREATE TABLE agent_invocations (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT REFERENCES workflow_runs(id),
  agent_type TEXT NOT NULL,
  agent_name TEXT,
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  duration_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'timeout')),
  error_message TEXT,
  metadata TEXT, -- JSON for additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invocations_run ON agent_invocations(workflow_run_id);
CREATE INDEX idx_invocations_agent ON agent_invocations(agent_type);
CREATE INDEX idx_invocations_created ON agent_invocations(created_at);
```

### Aggregate Tables

```sql
-- Daily chapter metrics (computed nightly)
CREATE TABLE daily_chapter_metrics (
  date TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_seconds REAL,
  avg_scroll_depth REAL,
  scroll_completion_rate REAL, -- % reaching 90%+
  search_appearances INTEGER DEFAULT 0,
  bookmark_adds INTEGER DEFAULT 0,
  PRIMARY KEY (date, chapter_id)
);

-- Chapter health scores (computed nightly)
CREATE TABLE chapter_health_scores (
  chapter_id TEXT PRIMARY KEY,
  chapter_name TEXT,
  health_score REAL, -- 0-100 composite
  reader_engagement_score REAL,
  feedback_sentiment_score REAL,
  persona_avg_score REAL,
  issue_count INTEGER,
  last_modified_version TEXT,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly trends
CREATE TABLE weekly_trends (
  week_start TEXT NOT NULL, -- ISO week start date
  metric_name TEXT NOT NULL,
  metric_scope TEXT, -- 'global', 'chapter:xx', 'agent:xx'
  value REAL NOT NULL,
  previous_value REAL,
  delta_pct REAL,
  PRIMARY KEY (week_start, metric_name, metric_scope)
);

-- Daily agent costs
CREATE TABLE daily_agent_costs (
  date TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  invocation_count INTEGER DEFAULT 0,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  avg_duration_ms REAL,
  error_count INTEGER DEFAULT 0,
  PRIMARY KEY (date, agent_type)
);

-- Version comparison cache
CREATE TABLE version_comparisons (
  id TEXT PRIMARY KEY,
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  chapter_id TEXT,
  metric_name TEXT NOT NULL,
  from_value REAL,
  to_value REAL,
  delta REAL,
  delta_pct REAL,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_version, to_version, chapter_id, metric_name)
);
```

---

## CLI Commands for Pipeline

```bash
# Sync reader analytics from D1 to local
pnpm run sync:analytics

# Run daily aggregation jobs
pnpm run aggregate:daily

# Generate dashboard snapshot
pnpm run dashboard:snapshot

# Export data for VP agent consumption
pnpm run export:vp-product
pnpm run export:vp-engineering
pnpm run export:vp-ops

# Generate reports
pnpm run report:daily
pnpm run report:weekly
pnpm run report:release --version=1.2.0
```

---

## Key Metrics by Consumer

### Human Operator Dashboard

| Widget | Primary Metric | Source Tables |
|--------|---------------|---------------|
| Pipeline Status | Active runs, success rate | `workflow_runs`, `workflow_events` |
| Reader Engagement | Views/day, unique visitors | `daily_chapter_metrics` |
| Cost Tracking | $/day, $/version | `daily_agent_costs` |
| Chapter Health | Composite scores, heatmap | `chapter_health_scores` |
| Feedback Inbox | New items, sentiment | `feedback_items` |
| Version Timeline | Releases, deltas | `book_versions`, `version_comparisons` |

### VP Product Agent

| Query | Purpose | Source Tables |
|-------|---------|---------------|
| Lowest health chapters | Prioritize improvements | `chapter_health_scores` |
| Feedback by chapter | Understand issues | `feedback_items` |
| Reader drop-offs | Identify friction | `daily_chapter_metrics` |
| Persona predictions vs reality | Calibrate personas | `persona_reviews`, `reader_events_local` |
| Version deltas | Measure improvement | `version_comparisons` |

### VP Engineering Agent

| Query | Purpose | Source Tables |
|-------|---------|---------------|
| Agent cost breakdown | Optimize spending | `daily_agent_costs`, `agent_invocations` |
| Error rates by agent | Identify issues | `agent_invocations` |
| Token efficiency | Cost per improvement | `agent_invocations`, `version_comparisons` |
| Performance trends | SLA tracking | `agent_invocations` |

### VP Ops Agent

| Query | Purpose | Source Tables |
|-------|---------|---------------|
| Pipeline health | Capacity planning | `workflow_runs`, `workflow_events` |
| Escalation patterns | Process improvement | `escalations`, `rejections` |
| Run duration trends | Throughput optimization | `workflow_runs` |
| Resource utilization | Budget planning | `daily_agent_costs` |

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
- [ ] Deploy Cloudflare Web Analytics (Part A)
- [ ] Deploy Cloudflare Worker + D1 (Part B)
- [ ] Add client SDK to read.html
- [ ] Verify events flowing

### Phase 2: Sync & Aggregation (Week 2)
- [ ] Create sync script for D1 → project.db
- [ ] Add reader analytics tables to project.db
- [ ] Create daily aggregation job
- [ ] Add `chapter_health_scores` computation

### Phase 3: Agent Instrumentation (Week 2-3)
- [ ] Create `agent_invocations` table
- [ ] Wrap Claude API calls with instrumentation
- [ ] Add cost tracking to all workflows
- [ ] Create `daily_agent_costs` aggregation

### Phase 4: Feedback System (Week 3)
- [ ] Add feedback endpoint to Worker
- [ ] Create in-site feedback widget
- [ ] Add `feedback_items` table
- [ ] Create feedback sync job

### Phase 5: Dashboard & Reports (Week 4)
- [ ] Create dashboard query layer
- [ ] Build initial dashboard UI or CLI output
- [ ] Create daily/weekly report generators
- [ ] Wire up VP agent data access

---

## Appendix: Sample Queries

### Chapter Health Score Computation

```sql
-- Compute composite health score (run nightly)
INSERT OR REPLACE INTO chapter_health_scores
SELECT
  c.chapter_id,
  c.chapter_name,
  -- Composite: 40% engagement, 30% feedback, 30% personas
  (COALESCE(e.engagement_score, 50) * 0.4 +
   COALESCE(f.sentiment_score, 50) * 0.3 +
   COALESCE(p.persona_score, 50) * 0.3) as health_score,
  e.engagement_score,
  f.sentiment_score,
  p.persona_score,
  COALESCE(f.issue_count, 0),
  c.last_version,
  datetime('now')
FROM (
  SELECT DISTINCT chapter_id, chapter_name, book_version as last_version
  FROM daily_chapter_metrics
) c
LEFT JOIN (
  -- Engagement: normalize views, time, scroll to 0-100
  SELECT chapter_id,
    (MIN(views, 100) * 0.3 +
     MIN(avg_time_seconds / 300 * 100, 100) * 0.3 +
     scroll_completion_rate * 0.4) as engagement_score
  FROM daily_chapter_metrics
  WHERE date >= date('now', '-7 days')
  GROUP BY chapter_id
) e ON c.chapter_id = e.chapter_id
LEFT JOIN (
  -- Feedback sentiment: issues drag down score
  SELECT chapter_id,
    100 - (COUNT(CASE WHEN severity = 'critical' THEN 1 END) * 20 +
           COUNT(CASE WHEN severity = 'high' THEN 1 END) * 10 +
           COUNT(CASE WHEN severity = 'medium' THEN 1 END) * 5) as sentiment_score,
    COUNT(*) as issue_count
  FROM feedback_items
  WHERE status != 'wontfix'
  GROUP BY chapter_id
) f ON c.chapter_id = f.chapter_id
LEFT JOIN (
  -- Persona scores from reviews
  SELECT
    json_extract(review_data, '$.chapter_id') as chapter_id,
    AVG(json_extract(review_data, '$.ratings.overall')) * 10 as persona_score
  FROM persona_reviews
  WHERE status = 'completed'
  GROUP BY chapter_id
) p ON c.chapter_id = p.chapter_id;
```

### Cost Efficiency by Agent

```sql
SELECT
  agent_type,
  SUM(total_cost_usd) as total_cost,
  SUM(invocation_count) as total_invocations,
  SUM(total_cost_usd) / SUM(invocation_count) as cost_per_invocation,
  SUM(error_count) * 100.0 / SUM(invocation_count) as error_rate_pct
FROM daily_agent_costs
WHERE date >= date('now', '-30 days')
GROUP BY agent_type
ORDER BY total_cost DESC;
```

### Reader Engagement Trend

```sql
SELECT
  date,
  SUM(views) as total_views,
  SUM(unique_visitors) as total_visitors,
  AVG(avg_scroll_depth) as avg_scroll_depth,
  AVG(scroll_completion_rate) as avg_completion
FROM daily_chapter_metrics
WHERE date >= date('now', '-14 days')
GROUP BY date
ORDER BY date;
```
