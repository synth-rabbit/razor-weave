-- Migration: 003_workflow_events_rejections
-- Description: Add workflow_events and rejections tables for tracking workflow lifecycle
-- Date: 2024-11-23

-- ============================================
-- WORKFLOW EVENTS
-- ============================================
-- Tracks all events within a workflow run (started, completed, rejected, etc.)
CREATE TABLE IF NOT EXISTS workflow_events (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
  event_type TEXT NOT NULL CHECK(event_type IN ('started', 'completed', 'rejected', 'escalated', 'paused', 'resumed')),
  agent_name TEXT,
  data TEXT, -- JSON payload
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_run ON workflow_events(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_type ON workflow_events(event_type);

-- ============================================
-- REJECTIONS
-- ============================================
-- Tracks content rejections during editing workflows with retry management
CREATE TABLE IF NOT EXISTS rejections (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
  event_id TEXT REFERENCES workflow_events(id),
  rejection_type TEXT NOT NULL CHECK(rejection_type IN ('style', 'mechanics', 'clarity', 'scope')),
  reason TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rejections_run ON rejections(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_rejections_type ON rejections(rejection_type);
CREATE INDEX IF NOT EXISTS idx_rejections_unresolved ON rejections(resolved) WHERE resolved = FALSE;
