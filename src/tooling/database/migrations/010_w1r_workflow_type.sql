-- Migration: 010_w1r_workflow_type
-- Description: Add w1r_revision workflow type for chapter-by-chapter revision workflow
-- Date: 2025-11-29

-- SQLite doesn't allow modifying CHECK constraints, so we recreate the table

-- Step 1: Create new table with updated constraint
CREATE TABLE workflow_runs_new (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL CHECK(workflow_type IN (
    'w1_editing', 'w1r_revision', 'w2_pdf', 'w3_publication', 'w4_playtesting'
  )),
  book_id TEXT NOT NULL REFERENCES books(id),
  input_version_id TEXT REFERENCES book_versions(content_id),
  output_version_id TEXT REFERENCES book_versions(content_id),
  session_id TEXT,
  plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending', 'running', 'paused', 'completed', 'failed'
  )),
  current_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checkpoint_json TEXT,
  current_step TEXT,
  iteration_counts TEXT
);

-- Step 2: Copy existing data
INSERT INTO workflow_runs_new
SELECT * FROM workflow_runs;

-- Step 3: Drop old table
DROP TABLE workflow_runs;

-- Step 4: Rename new table
ALTER TABLE workflow_runs_new RENAME TO workflow_runs;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_workflow_runs_book ON workflow_runs(book_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_type ON workflow_runs(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_current_step ON workflow_runs(current_step);
