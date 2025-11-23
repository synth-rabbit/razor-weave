-- Migration: 004_workflow_artifacts
-- Description: Add workflow_artifacts table for cross-workflow artifact sharing

CREATE TABLE IF NOT EXISTS workflow_artifacts (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL CHECK(artifact_type IN (
    'chapter', 'release_notes', 'print_html', 'web_html', 'pdf_draft',
    'pdf_digital', 'pdf_print', 'layout_plan', 'design_plan',
    'deployment', 'qa_report', 'marketing_copy', 'announcement',
    'playtest_session', 'playtest_analysis', 'playtest_feedback'
  )),
  artifact_path TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artifacts_run ON workflow_artifacts(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON workflow_artifacts(artifact_type);
