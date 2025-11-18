// src/tooling/database/types.ts

export interface ChapterVersion {
  id: number;
  book_path: string;
  chapter_path: string;
  chapter_name: string;
  version: string;
  content: string;
  metadata: string | null;
  file_hash: string | null;
  source: 'git' | 'claude';
  commit_sha: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface BookVersion {
  id: number;
  book_path: string;
  version: string;
  content: string;
  metadata: string | null;
  file_hash: string | null;
  source: 'git' | 'claude';
  commit_sha: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface DataArtifact {
  id: number;
  artifact_type: string;
  artifact_path: string;
  content: string;
  metadata: string | null;
  created_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface StateEntry {
  id: number;
  key: string;
  value: string | null;
  updated_at: string;
  archived: boolean;
  archived_at: string | null;
}

export interface ContentDiff {
  added: string;
  removed: string;
  unchanged: string;
}
