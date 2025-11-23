-- Migration: 006_escalations
-- Description: Add escalations table for tracking human review escalations
-- Date: 2024-11-23

-- ============================================
-- ESCALATIONS
-- ============================================
-- Tracks escalations to human review when retry limits are exceeded.
-- Links to workflow_runs and rejections for full context.
-- ============================================

CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id),
  rejection_type TEXT NOT NULL CHECK(rejection_type IN ('style', 'mechanics', 'clarity', 'scope')),
  retry_count INTEGER NOT NULL,
  escalated_to TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'acknowledged', 'resolved')),
  resolution TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Index for finding escalations by workflow run
CREATE INDEX IF NOT EXISTS idx_escalations_run ON escalations(workflow_run_id);

-- Index for finding pending escalations (most common query)
CREATE INDEX IF NOT EXISTS idx_escalations_pending ON escalations(status) WHERE status = 'pending';

-- Index for finding escalations by target (human-reviewer, senior-editor, etc.)
CREATE INDEX IF NOT EXISTS idx_escalations_target ON escalations(escalated_to);

-- Unique constraint to prevent duplicate escalations for same workflow+type combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_escalations_unique ON escalations(workflow_run_id, rejection_type);
