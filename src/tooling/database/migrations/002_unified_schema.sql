-- Migration: 002_unified_schema
-- Description: Add books registry, workflow_runs, and plans tables for unified schema
-- Date: 2024-11-23

-- ============================================
-- BOOKS REGISTRY
-- ============================================
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  book_type TEXT NOT NULL CHECK(book_type IN ('core', 'source', 'campaign', 'supplement')),
  source_path TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'editing', 'published')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

-- ============================================
-- SEED CORE RULEBOOK
-- ============================================
INSERT OR IGNORE INTO books (id, slug, title, book_type, source_path, status)
VALUES ('book_core', 'core-rulebook', 'Razorweave Core Rulebook', 'core', 'books/core-rulebook', 'editing');

-- ============================================
-- MODIFY BOOK_VERSIONS (add book_id column)
-- ============================================
-- SQLite doesn't enforce FK constraints added via ALTER TABLE, but the column is useful
ALTER TABLE book_versions ADD COLUMN book_id TEXT;
ALTER TABLE book_versions ADD COLUMN workflow_run_id TEXT;

CREATE INDEX IF NOT EXISTS idx_book_versions_book_id ON book_versions(book_id);

-- Backfill book_id for existing records
UPDATE book_versions SET book_id = 'book_core' WHERE book_path LIKE '%core-rulebook%';

-- ============================================
-- WORKFLOW RUNS
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL CHECK(workflow_type IN (
    'w1_editing', 'w2_pdf', 'w3_publication', 'w4_playtesting'
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_book ON workflow_runs(book_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_type ON workflow_runs(workflow_type);

-- ============================================
-- PLANS (for lifecycle tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN (
    'draft', 'active', 'complete', 'archived'
  )),
  session_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_file_path ON plans(file_path);
