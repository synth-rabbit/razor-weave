-- Migration 008: Strategic Plans
-- Adds support for W1 strategic workflow plans with state persistence

CREATE TABLE IF NOT EXISTS strategic_plans (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id),
  book_slug TEXT NOT NULL,
  workflow_run_id TEXT REFERENCES workflow_runs(id),
  source_analysis_path TEXT,
  goal_json TEXT NOT NULL,
  areas_json TEXT NOT NULL,
  state_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_strategic_plans_book_id ON strategic_plans(book_id);
CREATE INDEX IF NOT EXISTS idx_strategic_plans_status ON strategic_plans(status);
CREATE INDEX IF NOT EXISTS idx_strategic_plans_workflow_run_id ON strategic_plans(workflow_run_id);
