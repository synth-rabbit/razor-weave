---
status: DRAFT
created: 2024-11-23
workflow: Infrastructure
---

# Data Pipeline & Dashboard Proposal

**Date:** 2024-11-23
**Author:** CEO + Claude Code Analysis
**Purpose:** Establish a comprehensive data collection, analysis, and visualization infrastructure to enable data-driven decision making for both human operators and VP agents.

---

## Executive Summary

This proposal addresses a critical gap in our current infrastructure: **we have no visibility into how our content is actually consumed, and limited visibility into our operational costs and effectiveness.**

Currently:
- 400 synthetic personas simulate reader reactions, but we have zero data on real reader behavior
- Agent invocations have no cost or performance tracking
- Feedback comes through disconnected Google Forms
- VP agents operate on incomplete information
- No dashboard exists for human operators

This proposal establishes a complete data pipeline from collection through analysis to consumption, using free-tier services compatible with our GitHub Pages constraint.

### Key Decisions Required

1. **Approve Cloudflare as our analytics/edge platform** (free tier)
2. **Approve schema additions to project.db** for new data types
3. **Prioritize implementation phases** (4 phases proposed)
4. **Assign ownership** for ongoing maintenance

---

## Context

### Current State

#### What We Have

| Data Source | Status | Visibility |
|-------------|--------|------------|
| Book content | ✅ Active | Full - versioned in DB |
| Workflow runs | ✅ Active | Partial - status only, no cost/timing |
| Persona reviews | ✅ Active | Full - 400 personas, 79 reviews |
| Review campaigns | ✅ Active | Full - 6 campaigns, 4 analyses |
| Strategic plans | ✅ Active | Full - 4 plans tracked |
| Event logs | ⚠️ Partial | JSONL files exist, workflow_events table empty |
| Reader analytics | ❌ None | Zero visibility |
| User feedback | ❌ External | Google Forms, disconnected |
| Agent costs | ❌ None | No token/cost tracking |
| Version diffs | ❌ None | No change tracking |

#### Database Inventory

```
project.db: 4.6MB active
├── 30 tables defined
├── 400 personas
├── 79 completed reviews
├── 9 workflow runs (2 completed)
├── 34 workflow artifacts
├── 0 workflow events (gap!)
├── 0 rejections (gap!)
├── 0 escalations (gap!)
└── 0 reader data (gap!)
```

### Constraints

| Constraint | Impact |
|------------|--------|
| GitHub Pages hosting | No server-side code on main site |
| Budget allocated to Claude API | Must use free-tier services |
| SQLite preference | Pipeline should output to project.db |
| Data ownership | Want exportable data, not locked in |
| Privacy considerations | Prefer cookie-less, GDPR-friendly |

### Dependencies

- **Website deployed:** `src/site/` on GitHub Pages
- **project.db operational:** Schema migrations working
- **CLI tooling:** pnpm commands infrastructure exists
- **Workflow system:** W1 editing workflow functional

---

## Goals

### Primary Goals

1. **Collect real reader behavior data** to validate/calibrate persona predictions
2. **Track agent costs and performance** to optimize spending
3. **Provide VP agents with complete data** for better decision making
4. **Give human operators a dashboard** for oversight and intervention
5. **Close the feedback loop** with structured user feedback

### Secondary Goals

1. Measure improvement deltas between book versions
2. Identify content drop-off points and friction
3. Track search queries to understand reader intent
4. Enable data-driven prioritization of improvements

### Non-Goals (This Proposal)

1. Real-time alerting system
2. A/B testing framework
3. User authentication or accounts
4. Paid analytics services

---

## Solution Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Website Readers    Feedback Widget    Agent Calls    Workflow System   │
│       │                   │                │                │           │
│       ▼                   ▼                ▼                ▼           │
└───────┬───────────────────┴────────────────┴────────────────┴───────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       COLLECTION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐    ┌────────────────────────────────┐   │
│  │   Cloudflare Edge          │    │        Local CLI                │   │
│  │   ┌──────────────────────┐ │    │   ┌──────────────────────────┐ │   │
│  │   │ razorweave-analytics │ │    │   │ Instrumented agent calls │ │   │
│  │   │ Worker               │ │    │   │ Workflow event emission  │ │   │
│  │   │ - /api/session       │ │    │   └──────────────────────────┘ │   │
│  │   │ - /api/events        │ │    │                │               │   │
│  │   │ - /api/feedback      │ │    │                ▼               │   │
│  │   └──────────────────────┘ │    │   ┌──────────────────────────┐ │   │
│  │            │               │    │   │      project.db          │ │   │
│  │            ▼               │    │   └──────────────────────────┘ │   │
│  │   ┌──────────────────────┐ │    │                │               │   │
│  │   │    D1 Database       │ │    │                ▼               │   │
│  │   │ razorweave_analytics │ │    │   ┌──────────────────────────┐ │   │
│  │   └──────────────────────┘ │    │   │  data/events/*.jsonl     │ │   │
│  └────────────────────────────┘    │   └──────────────────────────┘ │   │
│                                    └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
        │                                            │
        │              Nightly Sync                  │
        └────────────────────┬───────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      UNIFIED DATA STORE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                         project.db                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  Content    │ │  Workflows  │ │  Reviews    │ │  Reader     │        │
│  │  books      │ │  runs       │ │  personas   │ │  events     │        │
│  │  versions   │ │  events     │ │  campaigns  │ │  sessions   │        │
│  │  chapters   │ │  artifacts  │ │  analyses   │ │  feedback   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    AGGREGATES                                      │  │
│  │  daily_chapter_metrics | chapter_health_scores | daily_agent_costs │  │
│  │  weekly_trends | version_comparisons | persona_coverage_matrix     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONSUMERS                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│  │ Human Dashboard │ │   VP Agents     │ │ Automated       │            │
│  │                 │ │                 │ │ Reports         │            │
│  │ • Pipeline      │ │ • VP Product    │ │                 │            │
│  │ • Engagement    │ │ • VP Engineering│ │ • Daily digest  │            │
│  │ • Costs         │ │ • VP Ops        │ │ • Weekly summary│            │
│  │ • Health        │ │                 │ │ • Release report│            │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Component 1: Cloudflare Web Analytics

**What:** Free, privacy-focused page view analytics.

**Why:** Zero-effort baseline visibility, no cookies, GDPR-compliant.

**Implementation:**
1. Create Cloudflare account (free)
2. Add site to Web Analytics
3. Add single script tag to `src/site/_includes/layouts/base.njk`

**Provides:**
- Page views and unique visitors
- Referrer sources
- Device/browser breakdown
- Geographic distribution
- Core Web Vitals

**Limitations:**
- No custom events
- No chapter-level granularity
- Data stays in Cloudflare dashboard

**Time to implement:** 10 minutes

---

### Component 2: Cloudflare Workers + D1

**What:** Custom event collection API with SQLite edge database.

**Why:** Enables chapter-level tracking, scroll depth, search queries, and full data export.

#### Worker API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/session` | POST | Initialize reader session |
| `/api/events` | POST | Batch event ingestion |
| `/api/feedback` | POST | Structured feedback submission |
| `/api/stats` | GET | Dashboard queries |
| `/api/export` | GET | Sync data to local project.db |
| `/health` | GET | Health check |

#### D1 Schema

```sql
-- Reader sessions
CREATE TABLE reader_sessions (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  referrer TEXT,
  landing_page TEXT
);

-- Reader events
CREATE TABLE reader_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  chapter_id TEXT,
  chapter_name TEXT,
  event_data TEXT, -- JSON
  created_at TEXT NOT NULL
);

-- Feedback submissions
CREATE TABLE feedback_submissions (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  chapter_id TEXT,
  feedback_type TEXT NOT NULL,
  severity TEXT,
  content TEXT NOT NULL,
  contact_email TEXT,
  book_version TEXT,
  created_at TEXT NOT NULL
);
```

#### Event Types Collected

| Event | Trigger | Data |
|-------|---------|------|
| `page_view` | Page load | `path` |
| `session_start` | First visit | (none) |
| `session_end` | Page unload | (none) |
| `chapter_view` | Chapter scrolled into view | (none) |
| `scroll_depth` | Threshold crossed | `depth` (25/50/75/90/100) |
| `time_on_chapter` | Chapter change/unload | `seconds` |
| `search` | Search submitted | `query`, `resultsCount` |
| `bookmark` | Bookmark toggled | `action` |
| `navigation` | User navigates | `fromChapter`, `method` |

#### Client SDK

JavaScript SDK (~200 lines) added to read.html:
- Generates/retrieves visitor ID (localStorage)
- Initializes session with server
- Queues events and batches requests
- Tracks scroll depth via Intersection Observer
- Reports time on chapter
- Exposes API for manual tracking

**Time to implement:** 2-3 hours

---

### Component 3: Agent Instrumentation

**What:** Wrapper around Claude API calls to track tokens, cost, and duration.

**Why:** Enable cost optimization and performance analysis.

#### Schema Addition

```sql
CREATE TABLE agent_invocations (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT,
  agent_type TEXT NOT NULL,
  agent_name TEXT,
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  duration_ms INTEGER NOT NULL,
  status TEXT CHECK(status IN ('success', 'failed', 'timeout')),
  error_message TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Instrumentation Wrapper

```typescript
async function invokeAgentWithTracking<T>(
  workflowRunId: string,
  agentType: string,
  agentName: string,
  invokeFn: () => Promise<{ result: T; usage: TokenUsage }>
): Promise<T> {
  const start = Date.now();
  try {
    const { result, usage } = await invokeFn();
    await db.insert('agent_invocations', {
      id: generateId(),
      workflow_run_id: workflowRunId,
      agent_type: agentType,
      agent_name: agentName,
      input_tokens: usage.input,
      output_tokens: usage.output,
      cost_usd: calculateCost(usage),
      duration_ms: Date.now() - start,
      status: 'success',
    });
    return result;
  } catch (error) {
    await db.insert('agent_invocations', {
      // ... error tracking
      status: 'failed',
      error_message: error.message,
    });
    throw error;
  }
}
```

**Time to implement:** 2-4 hours

---

### Component 4: Structured Feedback System

**What:** In-site feedback widget replacing Google Forms.

**Why:** Connect feedback to chapters, versions, and sessions.

#### Feedback Types

| Type | Use Case | Fields |
|------|----------|--------|
| `issue` | Report a problem | chapter, severity, category, description |
| `clarification` | Rule is unclear | section, confusion type, context |
| `suggestion` | Improvement idea | area, suggestion, rationale |
| `praise` | Positive feedback | chapter, what worked |

#### Widget Placement

- Floating feedback button on read.html
- Per-chapter feedback link
- Post-bookmark prompt ("Saved! Have feedback on this chapter?")

#### Schema

```sql
CREATE TABLE feedback_items (
  id TEXT PRIMARY KEY,
  chapter_id TEXT,
  chapter_name TEXT,
  feedback_type TEXT NOT NULL,
  severity TEXT,
  category TEXT,
  content TEXT NOT NULL,
  contact_email TEXT,
  session_id TEXT,
  book_version TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP,
  addressed_at TIMESTAMP,
  addressed_in_version TEXT
);
```

**Time to implement:** 3-4 hours

---

### Component 5: Sync & Aggregation

**What:** Nightly job to sync D1 data to project.db and compute aggregates.

**Why:** Unified data store for VP agents and dashboard queries.

#### Sync Process

1. Query D1 `/api/export?since={last_sync_timestamp}`
2. Insert new events into `reader_events_local`
3. Update sync watermark in `state` table
4. Run aggregation queries

#### Aggregation Tables

```sql
-- Daily chapter metrics
CREATE TABLE daily_chapter_metrics (
  date TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_seconds REAL,
  avg_scroll_depth REAL,
  scroll_completion_rate REAL,
  search_appearances INTEGER DEFAULT 0,
  bookmark_adds INTEGER DEFAULT 0,
  PRIMARY KEY (date, chapter_id)
);

-- Chapter health scores (composite)
CREATE TABLE chapter_health_scores (
  chapter_id TEXT PRIMARY KEY,
  chapter_name TEXT,
  health_score REAL,           -- 0-100 composite
  reader_engagement_score REAL,
  feedback_sentiment_score REAL,
  persona_avg_score REAL,
  issue_count INTEGER,
  last_modified_version TEXT,
  computed_at TIMESTAMP
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
```

#### Health Score Formula

```
health_score = (
  reader_engagement_score * 0.40 +
  feedback_sentiment_score * 0.30 +
  persona_avg_score * 0.30
)

where:
  reader_engagement_score = f(views, time_on_page, scroll_completion)
  feedback_sentiment_score = 100 - (critical*20 + high*10 + medium*5)
  persona_avg_score = avg(persona_ratings) * 10
```

**Time to implement:** 3-4 hours

---

### Component 6: Dashboard & Queries

**What:** Query layer for human dashboard and VP agent consumption.

#### Dashboard Widgets (Human Operator)

| Widget | Metrics | Source |
|--------|---------|--------|
| Pipeline Status | Active runs, success rate, blockers | `workflow_runs`, `escalations` |
| Reader Engagement | Views/day, top chapters, drop-offs | `daily_chapter_metrics` |
| Cost Tracking | $/day, $/version, token burn rate | `daily_agent_costs` |
| Chapter Health | Heatmap, trends, alerts | `chapter_health_scores` |
| Feedback Inbox | New items, sentiment patterns | `feedback_items` |
| Version Timeline | Releases, improvement deltas | `version_comparisons` |

#### VP Agent Data Access

**VP Product:**
- `chapter_health_scores` - prioritize improvements
- `feedback_items` - understand user pain points
- `reader_events_local` - validate persona predictions
- `version_comparisons` - measure improvement effectiveness

**VP Engineering:**
- `agent_invocations` - cost breakdown by agent
- `daily_agent_costs` - spending trends
- Error rates and performance metrics

**VP Ops:**
- `workflow_runs` - pipeline health
- `escalations` - process issues
- Resource utilization trends

---

## Cost Analysis

### Cloudflare Free Tier Limits

| Resource | Free Limit | Expected Usage | Headroom |
|----------|------------|----------------|----------|
| Web Analytics | Unlimited | N/A | ∞ |
| Workers Requests | 100,000/day | ~500-2,000/day | 50-200x |
| Workers CPU Time | 10ms/request | ~1-2ms/request | 5-10x |
| D1 Storage | 5 GB | ~50 MB year 1 | 100x |
| D1 Row Reads | 5,000,000/day | ~10,000/day | 500x |
| D1 Row Writes | 100,000/day | ~500-2,000/day | 50-200x |

### Traffic Projections

| Scenario | Daily Visitors | Events/Visitor | Daily Events | Monthly |
|----------|----------------|----------------|--------------|---------|
| Soft Launch | 20 | 10 | 200 | 6,000 |
| Growing | 100 | 10 | 1,000 | 30,000 |
| Active | 500 | 10 | 5,000 | 150,000 |
| Popular | 2,000 | 10 | 20,000 | 600,000 |

### Storage Projections

| Monthly Events | Monthly Storage | Annual | 5GB Limit |
|----------------|-----------------|--------|-----------|
| 6,000 | 1.2 MB | 14 MB | 357 years |
| 30,000 | 6 MB | 72 MB | 69 years |
| 150,000 | 30 MB | 360 MB | 14 years |
| 600,000 | 120 MB | 1.4 GB | 3.5 years |

### When Paid Tier Required

| Trigger | Traffic Level | Cost |
|---------|---------------|------|
| >100K requests/day | ~3,000+ daily readers | $5/month |
| >5GB D1 storage | ~25M events stored | $5/month |

**Conclusion:** Free tier covers all realistic scenarios for 2+ years. At scale requiring payment, we'd have revenue to support $5-20/month.

---

## Implementation Plan

### Phase 1: Quick Wins (Week 1)

**Goal:** Establish baseline visibility with minimal effort.

| Task | Time | Dependencies |
|------|------|--------------|
| Deploy Cloudflare Web Analytics | 10 min | Cloudflare account |
| Create D1 database and schema | 30 min | Wrangler CLI |
| Deploy Worker with event ingestion | 2 hours | D1 ready |
| Add client SDK to read.html | 1 hour | Worker deployed |
| Verify events flowing | 30 min | All above |

**Deliverables:**
- Basic page view analytics in Cloudflare dashboard
- Chapter-level event collection operational
- `/api/stats` endpoint returning data

### Phase 2: Sync & Aggregation (Week 2)

**Goal:** Unify data in project.db for analysis.

| Task | Time | Dependencies |
|------|------|--------------|
| Add reader analytics tables to project.db | 30 min | Schema defined |
| Create sync script (D1 → project.db) | 2 hours | Tables ready |
| Add aggregation jobs | 2 hours | Sync working |
| Compute chapter health scores | 2 hours | Aggregation ready |

**Deliverables:**
- `pnpm sync:analytics` command
- `pnpm aggregate:daily` command
- `chapter_health_scores` table populated

### Phase 3: Agent Instrumentation (Week 2-3)

**Goal:** Track all agent costs and performance.

| Task | Time | Dependencies |
|------|------|--------------|
| Add `agent_invocations` table | 30 min | Schema defined |
| Create instrumentation wrapper | 2 hours | Table ready |
| Wrap all Claude API calls | 2 hours | Wrapper ready |
| Add `daily_agent_costs` aggregation | 1 hour | Invocations tracked |

**Deliverables:**
- All agent calls logged with tokens/cost/timing
- Cost breakdown queries available
- VP Engineering has cost visibility

### Phase 4: Feedback & Dashboard (Week 3-4)

**Goal:** Close the feedback loop and provide human visibility.

| Task | Time | Dependencies |
|------|------|--------------|
| Add feedback endpoint to Worker | 1 hour | Worker deployed |
| Add `feedback_items` table | 30 min | Schema defined |
| Create in-site feedback widget | 3 hours | Endpoint ready |
| Create dashboard query layer | 2 hours | All data available |
| Create CLI dashboard output | 2 hours | Query layer ready |

**Deliverables:**
- Feedback widget on read.html
- `pnpm dashboard:status` command
- VP agents have full data access

---

## Success Criteria

### Phase 1 Success

1. ✅ Cloudflare Web Analytics showing page views
2. ✅ D1 receiving chapter_view events
3. ✅ `/api/stats` returns non-empty data after browsing

### Phase 2 Success

1. ✅ Sync imports events from D1 to project.db
2. ✅ `chapter_health_scores` computed for all chapters
3. ✅ Queries return accurate aggregates

### Phase 3 Success

1. ✅ All agent invocations logged with tokens and cost
2. ✅ `daily_agent_costs` shows accurate totals
3. ✅ Can answer "how much did version X.Y.Z cost?"

### Phase 4 Success

1. ✅ Feedback widget collects submissions
2. ✅ Feedback visible in project.db
3. ✅ Dashboard query layer serves all widgets
4. ✅ VP agents can query complete data

### Overall Success

1. **Persona validation:** Can correlate persona predictions with reader behavior
2. **Cost visibility:** Know cost per version, per chapter, per agent
3. **Improvement measurement:** Before/after metrics for each workflow run
4. **Feedback loop closed:** User feedback → issue tracking → addressed in version

---

## Risks & Mitigations

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cloudflare service changes | Low | High | Data export capability built-in |
| D1 free tier removed | Low | Medium | <5GB data, easy to migrate |
| Worker rate limiting | Low | Low | Far below limits |
| Client SDK blocked by browsers | Medium | Medium | Fallback to aggregate-only |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sync job failures | Medium | Low | Watermark prevents data loss |
| Schema drift D1 ↔ project.db | Medium | Medium | Version sync scripts |
| Dashboard query performance | Low | Low | Aggregates pre-computed |

### Privacy Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PII in event data | Low | High | No PII collected except optional email |
| Visitor tracking concerns | Medium | Medium | Random ID, no cookies, clear privacy policy |
| GDPR compliance | Low | High | Cookie-less, data export available |

---

## Alternatives Considered

### Alternative 1: Google Analytics

**Pros:** Feature-rich, widely supported
**Cons:** Privacy concerns, complex setup, data locked in Google, cookies required
**Decision:** Rejected for privacy and data ownership reasons

### Alternative 2: Self-Hosted Analytics (Plausible/Umami)

**Pros:** Full control, privacy-focused
**Cons:** Requires server hosting, adds cost/complexity
**Decision:** Rejected due to hosting constraint

### Alternative 3: Client-Side Only (localStorage)

**Pros:** Zero infrastructure, works offline
**Cons:** No aggregation across users, requires manual export
**Decision:** Rejected for lack of aggregate visibility

### Alternative 4: Supabase

**Pros:** PostgreSQL, generous free tier, real-time subscriptions
**Cons:** Different query patterns than SQLite, additional vendor
**Decision:** Considered viable, but Cloudflare D1 preferred for SQLite compatibility

---

## Maintenance & Ownership

### Ongoing Tasks

| Task | Frequency | Owner |
|------|-----------|-------|
| Monitor D1 storage usage | Monthly | Ops |
| Review aggregation accuracy | Weekly | Engineering |
| Process feedback items | As needed | Product |
| Update client SDK | As needed | Engineering |

### Documentation Required

- [ ] Worker deployment runbook
- [ ] D1 schema migration process
- [ ] Sync job troubleshooting
- [ ] Dashboard query reference

---

## Appendices

### Appendix A: Complete Schema Changes

See `docs/consults/2025-11-23-data-pipeline-architecture.md` for full schema definitions.

### Appendix B: Worker Implementation

See `docs/consults/2025-11-23-reader-analytics-implementation.md` for complete Worker code.

### Appendix C: Client SDK Implementation

See `docs/consults/2025-11-23-reader-analytics-implementation.md` for complete JavaScript SDK.

### Appendix D: Sample Queries

```sql
-- Most viewed chapters (7 days)
SELECT chapter_name, SUM(views) as total_views
FROM daily_chapter_metrics
WHERE date >= date('now', '-7 days')
GROUP BY chapter_id
ORDER BY total_views DESC;

-- Cost per workflow run
SELECT
  workflow_run_id,
  SUM(cost_usd) as total_cost,
  SUM(input_tokens + output_tokens) as total_tokens
FROM agent_invocations
GROUP BY workflow_run_id;

-- Chapter health ranking
SELECT chapter_name, health_score, issue_count
FROM chapter_health_scores
ORDER BY health_score ASC
LIMIT 10;

-- Persona prediction vs reality correlation
SELECT
  p.chapter_id,
  AVG(p.persona_score) as predicted_score,
  r.avg_scroll_depth as actual_engagement
FROM persona_chapter_scores p
JOIN daily_chapter_metrics r ON p.chapter_id = r.chapter_id
GROUP BY p.chapter_id;
```

---

## Decision Points for Board

1. **Approve Cloudflare platform?**
   - Free tier adequate for projected growth
   - SQLite compatibility with existing infrastructure
   - Data export ensures no lock-in

2. **Approve 4-phase implementation?**
   - Phase 1: Reader analytics (Week 1)
   - Phase 2: Sync & aggregation (Week 2)
   - Phase 3: Agent instrumentation (Week 2-3)
   - Phase 4: Feedback & dashboard (Week 3-4)

3. **Approve schema additions?**
   - 6 new tables for reader data
   - 5 new aggregate tables
   - 1 new table for agent costs

4. **Assign ownership?**
   - Engineering: Implementation and maintenance
   - Product: Feedback triage
   - Ops: Monitoring and capacity

---

## References

- `docs/consults/2025-11-23-data-dashboard-analysis.md` - Initial data analysis
- `docs/consults/2025-11-23-reader-analytics-implementation.md` - Implementation guide
- `docs/consults/2025-11-23-data-pipeline-architecture.md` - Full architecture

---

*This proposal is input for a Board session on Data Pipeline infrastructure.*
