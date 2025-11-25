-- Migration 007: Book Releases (Semantic Versioning)
-- Adds semantic versioning support for book releases

-- Add version column to books table if not exists
ALTER TABLE books ADD COLUMN current_version TEXT DEFAULT '1.0.0';

-- Create book_releases table to track version history
CREATE TABLE IF NOT EXISTS book_releases (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id),
  version TEXT NOT NULL,
  version_major INTEGER NOT NULL DEFAULT 1,
  version_minor INTEGER NOT NULL DEFAULT 0,
  version_patch INTEGER NOT NULL DEFAULT 0,
  source_path TEXT NOT NULL,
  created_from_workflow TEXT REFERENCES workflow_runs(id),
  release_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, version)
);

CREATE INDEX IF NOT EXISTS idx_book_releases_book_id ON book_releases(book_id);
CREATE INDEX IF NOT EXISTS idx_book_releases_version ON book_releases(version);

-- Insert initial version for existing books
INSERT OR IGNORE INTO book_releases (id, book_id, version, version_major, version_minor, version_patch, source_path, created_at)
SELECT
  'bkr_' || substr(hex(randomblob(8)), 1, 16),
  id,
  '1.0.0',
  1,
  0,
  0,
  source_path,
  created_at
FROM books;
