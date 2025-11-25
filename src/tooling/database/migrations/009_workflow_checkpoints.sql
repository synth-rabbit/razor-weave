-- Migration: 009_workflow_checkpoints
-- Description: Add checkpoint support to workflow_runs and backup tracking table
-- Date: 2024-11-25

-- ============================================
-- EXTEND WORKFLOW_RUNS FOR CHECKPOINTS
-- ============================================
-- Add columns for rich checkpoint state

-- Full serialized checkpoint state (JSON)
ALTER TABLE workflow_runs ADD COLUMN checkpoint_json TEXT;

-- Current step name (for quick queries without parsing JSON)
ALTER TABLE workflow_runs ADD COLUMN current_step TEXT;

-- Iteration counts for loop tracking (JSON map: step -> count)
ALTER TABLE workflow_runs ADD COLUMN iteration_counts TEXT;

-- Index for finding runs at specific steps
CREATE INDEX IF NOT EXISTS idx_workflow_runs_current_step ON workflow_runs(current_step);

-- ============================================
-- DATABASE BACKUPS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS database_backups (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  path TEXT NOT NULL,
  workflow_run_id TEXT,
  size_bytes INTEGER,
  FOREIGN KEY (workflow_run_id) REFERENCES workflow_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_database_backups_created ON database_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_database_backups_workflow ON database_backups(workflow_run_id);
