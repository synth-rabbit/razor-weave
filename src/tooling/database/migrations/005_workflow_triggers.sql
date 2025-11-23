-- Migration: 005_workflow_triggers
-- Description: Add workflow_triggers table for cross-workflow automation
-- Date: 2024-11-23

-- ============================================
-- WORKFLOW TRIGGERS
-- ============================================
-- Enables cross-workflow automation:
--   - W1 complete -> start W2
--   - W2 approved -> start W3
--   - Manual trigger for ad-hoc workflows
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_triggers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_workflow_type TEXT NOT NULL CHECK(source_workflow_type IN (
    'w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'
  )),
  target_workflow_type TEXT NOT NULL CHECK(target_workflow_type IN (
    'w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'
  )),
  trigger_condition TEXT NOT NULL CHECK(trigger_condition IN (
    'on_complete', 'on_approve', 'manual'
  )),
  enabled BOOLEAN DEFAULT TRUE,
  config TEXT, -- JSON for additional trigger configuration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for finding triggers by source workflow
CREATE INDEX IF NOT EXISTS idx_triggers_source ON workflow_triggers(source_workflow_type);

-- Index for finding triggers by target workflow
CREATE INDEX IF NOT EXISTS idx_triggers_target ON workflow_triggers(target_workflow_type);

-- Partial index for quickly finding active triggers
CREATE INDEX IF NOT EXISTS idx_triggers_enabled ON workflow_triggers(enabled) WHERE enabled = TRUE;
