# Reader Analytics Implementation Guide

**Date:** 2025-11-23
**Purpose:** Detailed implementation plan for reader analytics on GitHub Pages using Cloudflare's free tier.

---

## Executive Summary

This document outlines a two-part approach to reader analytics:

- **Part A: Cloudflare Web Analytics** - Basic traffic visibility in 5 minutes
- **Part B: Cloudflare Workers + D1** - Custom event collection for chapter-level insights

Both solutions are free, serverless, and compatible with GitHub Pages static hosting.

---

## Why This Approach

### Constraints Considered

| Constraint | Impact |
|------------|--------|
| GitHub Pages (static hosting) | No server-side code, need external API |
| Budget tied up in Claude API | Must use free-tier services |
| SQLite familiarity | Prefer SQLite-compatible storage |
| Data ownership | Want data exportable to local project.db |
| Privacy considerations | Prefer cookie-less, GDPR-friendly |

### Options Evaluated

| Option | Custom Events | Free | Data Export | Setup Time | Verdict |
|--------|---------------|------|-------------|------------|---------|
| Google Analytics | Yes | Yes | Complex | 10 min | Privacy concerns, complex |
| Plausible | Yes | No ($9/mo) | Yes | 5 min | Out of budget |
| Cloudflare Analytics | No | Yes | No | 5 min | Good for basics |
| Cloudflare Workers + D1 | Yes | Yes | Yes (SQLite) | 2 hours | Best for custom |
| Supabase | Yes | Yes | Yes | 1 hour | PostgreSQL, not SQLite |
| Turso | Yes | Yes | Yes (SQLite) | 2 hours | Needs proxy layer |
| Client-side only | Yes | Yes | Manual | 30 min | No aggregation |

### Decision Rationale

**Cloudflare Web Analytics (Part A):**
- Zero-effort baseline visibility
- Answers "is anyone visiting?" immediately
- No maintenance burden
- Privacy-first (no cookies, no PII)

**Cloudflare Workers + D1 (Part B):**
- SQLite at the edge - same query patterns as project.db
- Custom events for chapter-level analytics
- Data fully exportable
- Single vendor (Cloudflare) simplifies management
- Generous free tier covers expected traffic

---

## Cost Analysis

### Cloudflare Free Tier Limits

| Resource | Free Limit | Expected Usage | Headroom |
|----------|------------|----------------|----------|
| **Web Analytics** | Unlimited | N/A | Unlimited |
| **Workers Requests** | 100,000/day | ~500-2,000/day | 50-200x |
| **Workers CPU Time** | 10ms/request | ~1-2ms/request | 5-10x |
| **D1 Storage** | 5 GB | ~50 MB first year | 100x |
| **D1 Row Reads** | 5,000,000/day | ~10,000/day | 500x |
| **D1 Row Writes** | 100,000/day | ~500-2,000/day | 50-200x |

### Traffic Projections

| Scenario | Daily Visitors | Events/Visitor | Daily Events | Monthly Events |
|----------|----------------|----------------|--------------|----------------|
| Soft Launch | 20 | 10 | 200 | 6,000 |
| Growing | 100 | 10 | 1,000 | 30,000 |
| Active | 500 | 10 | 5,000 | 150,000 |
| Popular | 2,000 | 10 | 20,000 | 600,000 |

### Storage Projections

Assuming ~200 bytes per event row:

| Monthly Events | Monthly Storage | Annual Storage |
|----------------|-----------------|----------------|
| 6,000 | 1.2 MB | 14 MB |
| 30,000 | 6 MB | 72 MB |
| 150,000 | 30 MB | 360 MB |
| 600,000 | 120 MB | 1.4 GB |

**Conclusion:** Free tier comfortably covers all realistic scenarios for at least 2-3 years of growth.

### When You'd Need to Pay

| Trigger | Implication |
|---------|-------------|
| >100K requests/day | ~3,000+ concurrent daily readers |
| >5GB D1 storage | ~25 million events stored |
| >5M row reads/day | Heavy dashboard querying |

At that scale, you'd have a successful product and revenue to support $5-20/month for Workers Paid.

---

## Part A: Cloudflare Web Analytics

### What It Provides

- Page views and unique visitors
- Top pages
- Referrer sources
- Countries and regions
- Device types and browsers
- Core Web Vitals

### What It Doesn't Provide

- Custom events
- Chapter-level granularity
- Scroll depth
- Time on page (accurate)
- Search queries
- User sessions

### Implementation Steps

#### Step 1: Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Create account with email
3. No domain required for Web Analytics

#### Step 2: Set Up Web Analytics

1. In Cloudflare dashboard, go to **Analytics & Logs** → **Web Analytics**
2. Click **Add a site**
3. Enter your domain: `razorweave.com` (or your GitHub Pages domain)
4. Select **JS Snippet** (not DNS-based, since you're on GitHub Pages)
5. Copy the provided script tag

#### Step 3: Add Script to Site

Add to `src/site/_includes/layouts/base.njk` before `</body>`:

```html
<!-- Cloudflare Web Analytics -->
<script
  defer
  src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'
></script>
```

Replace `YOUR_TOKEN_HERE` with the token from Step 2.

#### Step 4: Deploy and Verify

1. Commit and push changes
2. Wait for GitHub Pages to rebuild
3. Visit your site
4. Check Cloudflare dashboard (data appears within minutes)

### Time to Complete: 5-10 minutes

---

## Part B: Cloudflare Workers + D1

### What It Provides

- Chapter view tracking
- Scroll depth / reading progress
- Time on chapter
- Search query logging
- Navigation patterns
- Bookmark events
- Custom event flexibility
- SQLite data export

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Pages                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  read.html                                               │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │  razorweave-analytics.js                            ││    │
│  │  │  - Collects events                                  ││    │
│  │  │  - Batches requests                                 ││    │
│  │  │  - Sends to Worker API                              ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ POST /api/events
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  razorweave-analytics Worker                            │    │
│  │  - Validates events                                     │    │
│  │  - Handles CORS                                         │    │
│  │  - Writes to D1                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  D1 Database: razorweave_analytics                      │    │
│  │  - reader_events table                                  │    │
│  │  - reader_sessions table                                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Manual export / API query
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Local Development                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  project.db                                              │    │
│  │  - Merged reader analytics                               │    │
│  │  - VP agent analysis                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

#### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser for OAuth authentication.

#### Step 3: Create Project Directory

```bash
mkdir -p src/analytics
cd src/analytics
```

#### Step 4: Initialize Worker Project

```bash
wrangler init razorweave-analytics
```

Select:
- TypeScript: Yes
- Package manager: pnpm (or npm)
- Git: No (already in repo)

#### Step 5: Create D1 Database

```bash
wrangler d1 create razorweave-analytics
```

Save the output - you'll need the database_id:

```
✅ Successfully created DB 'razorweave-analytics'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### Step 6: Configure wrangler.toml

Create/update `src/analytics/wrangler.toml`:

```toml
name = "razorweave-analytics"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "razorweave-analytics"
database_id = "YOUR_DATABASE_ID_HERE"
```

#### Step 7: Create Database Schema

Create `src/analytics/schema.sql`:

```sql
-- Reader sessions (one per visitor per day)
CREATE TABLE IF NOT EXISTS reader_sessions (
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

CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON reader_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON reader_sessions(started_at);

-- Reader events (individual interactions)
CREATE TABLE IF NOT EXISTS reader_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  chapter_id TEXT,
  chapter_name TEXT,
  event_data TEXT, -- JSON for flexible payload
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES reader_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_events_session ON reader_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON reader_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_chapter ON reader_events(chapter_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON reader_events(created_at);

-- Aggregated daily stats (for fast dashboard queries)
CREATE TABLE IF NOT EXISTS daily_stats (
  date TEXT NOT NULL,
  chapter_id TEXT,
  metric TEXT NOT NULL,
  value INTEGER NOT NULL,
  PRIMARY KEY (date, chapter_id, metric)
);

CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_chapter ON daily_stats(chapter_id);
```

Apply the schema:

```bash
wrangler d1 execute razorweave-analytics --file=./schema.sql
```

#### Step 8: Create Worker Code

Create `src/analytics/src/index.ts`:

```typescript
export interface Env {
  DB: D1Database;
}

// Event types we accept
type EventType =
  | 'page_view'
  | 'chapter_view'
  | 'scroll_depth'
  | 'time_on_chapter'
  | 'search'
  | 'bookmark'
  | 'navigation'
  | 'session_start'
  | 'session_end';

interface AnalyticsEvent {
  type: EventType;
  sessionId: string;
  visitorId: string;
  chapterId?: string;
  chapterName?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

interface SessionInit {
  visitorId: string;
  userAgent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  referrer?: string;
  landingPage?: string;
}

// CORS headers for cross-origin requests from GitHub Pages
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Event ingestion endpoint
    if (url.pathname === '/api/events' && request.method === 'POST') {
      try {
        const payload = await request.json() as { events: AnalyticsEvent[] };

        if (!payload.events || !Array.isArray(payload.events)) {
          return new Response(
            JSON.stringify({ error: 'Invalid payload: events array required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Process events in batch
        const now = new Date().toISOString();
        const statements: D1PreparedStatement[] = [];

        for (const event of payload.events) {
          if (!event.type || !event.sessionId || !event.visitorId) {
            continue; // Skip invalid events
          }

          statements.push(
            env.DB.prepare(`
              INSERT INTO reader_events (session_id, event_type, chapter_id, chapter_name, event_data, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
              event.sessionId,
              event.type,
              event.chapterId || null,
              event.chapterName || null,
              event.data ? JSON.stringify(event.data) : null,
              event.timestamp || now
            )
          );
        }

        if (statements.length > 0) {
          await env.DB.batch(statements);
        }

        return new Response(
          JSON.stringify({ success: true, processed: statements.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Event ingestion error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Session initialization endpoint
    if (url.pathname === '/api/session' && request.method === 'POST') {
      try {
        const payload = await request.json() as SessionInit;

        if (!payload.visitorId) {
          return new Response(
            JSON.stringify({ error: 'visitorId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const sessionId = crypto.randomUUID();
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO reader_sessions (id, visitor_id, started_at, last_seen_at, user_agent, viewport_width, viewport_height, referrer, landing_page)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          sessionId,
          payload.visitorId,
          now,
          now,
          payload.userAgent || null,
          payload.viewportWidth || null,
          payload.viewportHeight || null,
          payload.referrer || null,
          payload.landingPage || null
        ).run();

        return new Response(
          JSON.stringify({ sessionId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Session init error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Stats endpoint (for dashboard queries)
    if (url.pathname === '/api/stats' && request.method === 'GET') {
      try {
        const days = parseInt(url.searchParams.get('days') || '7');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Chapter view counts
        const chapterViews = await env.DB.prepare(`
          SELECT chapter_id, chapter_name, COUNT(*) as views
          FROM reader_events
          WHERE event_type = 'chapter_view'
            AND created_at >= ?
            AND chapter_id IS NOT NULL
          GROUP BY chapter_id, chapter_name
          ORDER BY views DESC
        `).bind(startDate.toISOString()).all();

        // Daily event counts
        const dailyCounts = await env.DB.prepare(`
          SELECT DATE(created_at) as date, event_type, COUNT(*) as count
          FROM reader_events
          WHERE created_at >= ?
          GROUP BY DATE(created_at), event_type
          ORDER BY date DESC
        `).bind(startDate.toISOString()).all();

        // Session counts
        const sessionCounts = await env.DB.prepare(`
          SELECT DATE(started_at) as date, COUNT(*) as sessions, COUNT(DISTINCT visitor_id) as unique_visitors
          FROM reader_sessions
          WHERE started_at >= ?
          GROUP BY DATE(started_at)
          ORDER BY date DESC
        `).bind(startDate.toISOString()).all();

        return new Response(
          JSON.stringify({
            period: { days, startDate: startDate.toISOString() },
            chapterViews: chapterViews.results,
            dailyCounts: dailyCounts.results,
            sessionCounts: sessionCounts.results
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Stats query error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Export endpoint (for syncing to local project.db)
    if (url.pathname === '/api/export' && request.method === 'GET') {
      try {
        const since = url.searchParams.get('since');
        const limit = parseInt(url.searchParams.get('limit') || '10000');

        let query = `
          SELECT
            e.id, e.session_id, e.event_type, e.chapter_id, e.chapter_name,
            e.event_data, e.created_at,
            s.visitor_id, s.user_agent, s.viewport_width, s.viewport_height,
            s.referrer, s.landing_page, s.started_at as session_started
          FROM reader_events e
          JOIN reader_sessions s ON e.session_id = s.id
        `;

        if (since) {
          query += ` WHERE e.created_at > ? ORDER BY e.created_at ASC LIMIT ?`;
          const results = await env.DB.prepare(query).bind(since, limit).all();
          return new Response(
            JSON.stringify({ events: results.results, hasMore: results.results.length === limit }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          query += ` ORDER BY e.created_at DESC LIMIT ?`;
          const results = await env.DB.prepare(query).bind(limit).all();
          return new Response(
            JSON.stringify({ events: results.results, hasMore: results.results.length === limit }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      } catch (error) {
        console.error('Export error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};
```

#### Step 9: Deploy Worker

```bash
cd src/analytics
wrangler deploy
```

Note the deployed URL (e.g., `https://razorweave-analytics.YOUR_SUBDOMAIN.workers.dev`)

#### Step 10: Create Client SDK

Create `src/site/public/scripts/analytics.js`:

```javascript
/**
 * Razorweave Reader Analytics SDK
 * Collects reading behavior and sends to Cloudflare Worker
 */
(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    endpoint: 'https://razorweave-analytics.YOUR_SUBDOMAIN.workers.dev',
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    scrollDepthThresholds: [25, 50, 75, 90, 100],
    timeOnPageInterval: 30000, // Report time every 30 seconds
  };

  // State
  let sessionId = null;
  let visitorId = null;
  let eventQueue = [];
  let scrollDepthsReported = new Set();
  let currentChapter = null;
  let chapterStartTime = null;
  let lastActivityTime = Date.now();

  // Generate or retrieve visitor ID (persisted in localStorage)
  function getVisitorId() {
    let id = localStorage.getItem('rw_visitor_id');
    if (!id) {
      id = 'v_' + crypto.randomUUID();
      localStorage.setItem('rw_visitor_id', id);
    }
    return id;
  }

  // Initialize session with the server
  async function initSession() {
    visitorId = getVisitorId();

    try {
      const response = await fetch(`${CONFIG.endpoint}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          userAgent: navigator.userAgent,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          referrer: document.referrer || null,
          landingPage: window.location.pathname,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionId = data.sessionId;
        console.debug('[RW Analytics] Session initialized:', sessionId);
      }
    } catch (error) {
      console.error('[RW Analytics] Session init failed:', error);
      // Generate local session ID as fallback
      sessionId = 'local_' + crypto.randomUUID();
    }
  }

  // Queue an event for sending
  function trackEvent(type, chapterId, chapterName, data) {
    if (!sessionId) {
      console.debug('[RW Analytics] No session, queueing event');
    }

    eventQueue.push({
      type,
      sessionId: sessionId || 'pending',
      visitorId,
      chapterId,
      chapterName,
      data,
      timestamp: new Date().toISOString(),
    });

    lastActivityTime = Date.now();

    // Flush if batch size reached
    if (eventQueue.length >= CONFIG.batchSize) {
      flushEvents();
    }
  }

  // Send queued events to server
  async function flushEvents() {
    if (eventQueue.length === 0) return;

    const events = eventQueue.splice(0, eventQueue.length);

    // Update pending session IDs
    events.forEach(e => {
      if (e.sessionId === 'pending' && sessionId) {
        e.sessionId = sessionId;
      }
    });

    try {
      await fetch(`${CONFIG.endpoint}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
      console.debug('[RW Analytics] Flushed', events.length, 'events');
    } catch (error) {
      console.error('[RW Analytics] Flush failed:', error);
      // Re-queue failed events
      eventQueue.unshift(...events);
    }
  }

  // Track chapter view
  function trackChapterView(chapterId, chapterName) {
    // Report time on previous chapter
    if (currentChapter && chapterStartTime) {
      const timeSpent = Math.round((Date.now() - chapterStartTime) / 1000);
      trackEvent('time_on_chapter', currentChapter.id, currentChapter.name, { seconds: timeSpent });
    }

    // Reset scroll depth tracking for new chapter
    scrollDepthsReported.clear();

    // Track new chapter view
    currentChapter = { id: chapterId, name: chapterName };
    chapterStartTime = Date.now();
    trackEvent('chapter_view', chapterId, chapterName, {});
  }

  // Track scroll depth
  function trackScrollDepth() {
    if (!currentChapter) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

    for (const threshold of CONFIG.scrollDepthThresholds) {
      if (scrollPercent >= threshold && !scrollDepthsReported.has(threshold)) {
        scrollDepthsReported.add(threshold);
        trackEvent('scroll_depth', currentChapter.id, currentChapter.name, { depth: threshold });
      }
    }
  }

  // Track search queries
  function trackSearch(query, resultsCount) {
    trackEvent('search', null, null, { query, resultsCount });
  }

  // Track bookmark actions
  function trackBookmark(chapterId, chapterName, action) {
    trackEvent('bookmark', chapterId, chapterName, { action }); // 'add' or 'remove'
  }

  // Track navigation
  function trackNavigation(from, to, method) {
    trackEvent('navigation', to.id, to.name, {
      fromChapter: from?.id,
      method, // 'toc', 'prev', 'next', 'search', 'bookmark'
    });
  }

  // Observe chapter changes (for single-page reader)
  function observeChapterChanges() {
    // Look for chapter headings that become visible
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const heading = entry.target;
          const chapterId = heading.id || heading.dataset.chapter;
          const chapterName = heading.textContent?.trim();

          if (chapterId && chapterId !== currentChapter?.id) {
            trackChapterView(chapterId, chapterName);
          }
        }
      }
    }, { threshold: 0.5 });

    // Observe all chapter headings
    document.querySelectorAll('h1[id], h2[id], [data-chapter]').forEach(el => {
      observer.observe(el);
    });
  }

  // Initialize
  async function init() {
    await initSession();

    // Track initial page view
    trackEvent('page_view', null, null, { path: window.location.pathname });

    // Set up scroll tracking (throttled)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScrollDepth, 150);
    }, { passive: true });

    // Set up chapter observation
    observeChapterChanges();

    // Periodic flush
    setInterval(flushEvents, CONFIG.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      // Report final time on chapter
      if (currentChapter && chapterStartTime) {
        const timeSpent = Math.round((Date.now() - chapterStartTime) / 1000);
        trackEvent('time_on_chapter', currentChapter.id, currentChapter.name, { seconds: timeSpent });
      }
      trackEvent('session_end', null, null, {});

      // Synchronous send on unload
      if (eventQueue.length > 0 && navigator.sendBeacon) {
        navigator.sendBeacon(
          `${CONFIG.endpoint}/api/events`,
          JSON.stringify({ events: eventQueue })
        );
      }
    });

    console.debug('[RW Analytics] Initialized');
  }

  // Expose API for manual tracking
  window.RazorweaveAnalytics = {
    trackChapterView,
    trackSearch,
    trackBookmark,
    trackNavigation,
    trackEvent: (type, data) => trackEvent(type, currentChapter?.id, currentChapter?.name, data),
    flush: flushEvents,
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

#### Step 11: Add SDK to Site

Add to `src/site/_includes/layouts/base.njk` or `src/site/pages/read.html`:

```html
<!-- Razorweave Analytics (before </body>) -->
<script src="/scripts/analytics.js"></script>
```

#### Step 12: Hook Up Reader UI Events

In your existing reader JavaScript, add calls to the analytics API:

```javascript
// When user searches
searchInput.addEventListener('submit', (e) => {
  const query = e.target.value;
  const results = performSearch(query);
  RazorweaveAnalytics.trackSearch(query, results.length);
});

// When user bookmarks
bookmarkButton.addEventListener('click', () => {
  const isAdding = toggleBookmark();
  RazorweaveAnalytics.trackBookmark(
    currentChapter.id,
    currentChapter.title,
    isAdding ? 'add' : 'remove'
  );
});

// When user navigates via TOC
tocLink.addEventListener('click', (e) => {
  RazorweaveAnalytics.trackNavigation(
    { id: currentChapter.id, name: currentChapter.title },
    { id: targetChapter.id, name: targetChapter.title },
    'toc'
  );
});
```

### Time to Complete: 2-3 hours

---

## Data Export and Sync

### Manual Export via CLI

Query the Worker's export endpoint:

```bash
curl "https://razorweave-analytics.YOUR_SUBDOMAIN.workers.dev/api/export?limit=10000" \
  -o reader_events_export.json
```

### Sync to Local project.db

Create `src/tooling/scripts/sync-reader-analytics.ts`:

```typescript
import Database from 'better-sqlite3';

const WORKER_URL = 'https://razorweave-analytics.YOUR_SUBDOMAIN.workers.dev';
const DB_PATH = 'data/project.db';

async function syncReaderAnalytics() {
  const db = new Database(DB_PATH);

  // Get last sync timestamp
  const lastSync = db.prepare(`
    SELECT value FROM state WHERE key = 'reader_analytics_last_sync'
  `).get()?.value;

  // Fetch new events from Worker
  const url = lastSync
    ? `${WORKER_URL}/api/export?since=${encodeURIComponent(lastSync)}&limit=10000`
    : `${WORKER_URL}/api/export?limit=10000`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.events.length === 0) {
    console.log('No new events to sync');
    return;
  }

  // Insert events into local DB
  const insert = db.prepare(`
    INSERT OR IGNORE INTO reader_events_local
    (remote_id, session_id, visitor_id, event_type, chapter_id, chapter_name, event_data, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((events) => {
    for (const event of events) {
      insert.run(
        event.id,
        event.session_id,
        event.visitor_id,
        event.event_type,
        event.chapter_id,
        event.chapter_name,
        event.event_data,
        event.created_at
      );
    }
  });

  insertMany(data.events);

  // Update last sync timestamp
  const latestEvent = data.events[data.events.length - 1];
  db.prepare(`
    INSERT OR REPLACE INTO state (key, value, updated_at)
    VALUES ('reader_analytics_last_sync', ?, datetime('now'))
  `).run(latestEvent.created_at);

  console.log(`Synced ${data.events.length} events`);

  if (data.hasMore) {
    console.log('More events available, run again to continue sync');
  }

  db.close();
}

syncReaderAnalytics().catch(console.error);
```

Add migration for local table:

```sql
-- Migration: Add reader analytics local table
CREATE TABLE IF NOT EXISTS reader_events_local (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  remote_id INTEGER,
  session_id TEXT,
  visitor_id TEXT,
  event_type TEXT NOT NULL,
  chapter_id TEXT,
  chapter_name TEXT,
  event_data TEXT,
  created_at TEXT NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(remote_id)
);

CREATE INDEX IF NOT EXISTS idx_reader_local_type ON reader_events_local(event_type);
CREATE INDEX IF NOT EXISTS idx_reader_local_chapter ON reader_events_local(chapter_id);
CREATE INDEX IF NOT EXISTS idx_reader_local_created ON reader_events_local(created_at);
```

---

## Verification Checklist

### Part A Verification

- [ ] Script tag added to base layout
- [ ] Site deployed to GitHub Pages
- [ ] Visit site and wait 5 minutes
- [ ] Check Cloudflare dashboard shows data

### Part B Verification

- [ ] Wrangler CLI installed and authenticated
- [ ] D1 database created and schema applied
- [ ] Worker deployed successfully
- [ ] Worker health check responds: `curl https://YOUR_WORKER/health`
- [ ] Client SDK added to read.html
- [ ] Open browser console, verify `[RW Analytics] Initialized` message
- [ ] Scroll around, wait 30 seconds
- [ ] Check stats endpoint: `curl https://YOUR_WORKER/api/stats`
- [ ] Events appear in response

---

## Appendix: Event Types Reference

| Event Type | Trigger | Data Fields |
|------------|---------|-------------|
| `page_view` | Page load | `path` |
| `session_start` | Session created | (none) |
| `session_end` | Page unload | (none) |
| `chapter_view` | Chapter scrolled into view | (none) |
| `scroll_depth` | Scroll threshold crossed | `depth` (25/50/75/90/100) |
| `time_on_chapter` | Chapter changed or page unload | `seconds` |
| `search` | Search submitted | `query`, `resultsCount` |
| `bookmark` | Bookmark toggled | `action` ('add'/'remove') |
| `navigation` | User navigates | `fromChapter`, `method` |

---

## Appendix: Useful Queries

### Most Viewed Chapters (Last 7 Days)

```sql
SELECT chapter_name, COUNT(*) as views
FROM reader_events
WHERE event_type = 'chapter_view'
  AND created_at > datetime('now', '-7 days')
GROUP BY chapter_id
ORDER BY views DESC;
```

### Average Time per Chapter

```sql
SELECT chapter_name, AVG(json_extract(event_data, '$.seconds')) as avg_seconds
FROM reader_events
WHERE event_type = 'time_on_chapter'
GROUP BY chapter_id
ORDER BY avg_seconds DESC;
```

### Drop-off Points (Low Scroll Depth)

```sql
SELECT chapter_name,
  SUM(CASE WHEN json_extract(event_data, '$.depth') >= 50 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_past_50
FROM reader_events
WHERE event_type = 'scroll_depth'
GROUP BY chapter_id
HAVING COUNT(*) > 10
ORDER BY pct_past_50 ASC;
```

### Popular Search Queries

```sql
SELECT json_extract(event_data, '$.query') as query, COUNT(*) as searches
FROM reader_events
WHERE event_type = 'search'
GROUP BY query
ORDER BY searches DESC
LIMIT 20;
```
