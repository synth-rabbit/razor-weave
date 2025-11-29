// src/tooling/workflows/w1r-workspace.ts

import { mkdir, cp, readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { writeFeedbackTemplate } from './w1r-feedback.js';

export interface WorkspaceInfo {
  runId: string;
  rootPath: string;
  chaptersPath: string;
  feedbackPath: string;
  outputsPath: string;
}

export interface ChapterInfo {
  number: number;
  slug: string;
  title: string;
  filename: string;
}

/**
 * Create W1R workspace directory structure
 */
export async function createWorkspace(
  dataDir: string,
  runId: string
): Promise<WorkspaceInfo> {
  const rootPath = join(dataDir, 'w1r', runId);
  const chaptersPath = join(rootPath, 'chapters');
  const feedbackPath = join(rootPath, 'feedback');
  const outputsPath = join(rootPath, 'outputs');

  await mkdir(chaptersPath, { recursive: true });
  await mkdir(feedbackPath, { recursive: true });
  await mkdir(outputsPath, { recursive: true });

  return {
    runId,
    rootPath,
    chaptersPath,
    feedbackPath,
    outputsPath,
  };
}

/**
 * Copy chapters from source version to workspace
 */
export async function copyChaptersToWorkspace(
  sourceChaptersDir: string,
  workspace: WorkspaceInfo
): Promise<ChapterInfo[]> {
  const files = await readdir(sourceChaptersDir);
  const chapters: ChapterInfo[] = [];

  for (const file of files) {
    if (!file.endsWith('.md') || file === 'README.md') continue;

    const match = file.match(/^(\d+)-(.+)\.md$/);
    if (!match) continue;

    const number = parseInt(match[1], 10);
    const slug = match[2];

    // Copy file
    const sourcePath = join(sourceChaptersDir, file);
    const destPath = join(workspace.chaptersPath, file);
    await cp(sourcePath, destPath);

    // Extract title from file
    const content = await readFile(sourcePath, 'utf-8');
    const title = extractChapterTitle(content, slug);

    chapters.push({ number, slug, title, filename: file });
  }

  // Sort by chapter number
  chapters.sort((a, b) => a.number - b.number);

  return chapters;
}

/**
 * Extract chapter title from markdown content
 */
function extractChapterTitle(content: string, fallback: string): string {
  // Try # N. Title format
  let match = content.match(/^#\s*\d+\.\s*(.+)$/m);
  if (match) return match[1].trim();

  // Try ## N. Title format
  match = content.match(/^##\s*\d+\.\s*(.+)$/m);
  if (match) return match[1].trim();

  // Try # Chapter N: Title format
  match = content.match(/^#\s*Chapter\s+\d+:\s*(.+)$/m);
  if (match) return match[1].trim();

  // Fallback to slug converted to title case
  return fallback
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Create feedback template file for a chapter
 */
export async function createChapterFeedbackTemplate(
  workspace: WorkspaceInfo,
  chapter: ChapterInfo
): Promise<string> {
  const filename = `${String(chapter.number).padStart(2, '0')}-feedback.md`;
  const path = join(workspace.feedbackPath, filename);

  await writeFeedbackTemplate(path, chapter.number, chapter.title);

  return path;
}

/**
 * Get path for chapter output file
 */
export function getOutputPath(workspace: WorkspaceInfo, chapterNumber: number): string {
  const filename = `${String(chapterNumber).padStart(2, '0')}-output.md`;
  return join(workspace.outputsPath, filename);
}

/**
 * Get path for chapter file in workspace
 */
export function getChapterPath(workspace: WorkspaceInfo, chapter: ChapterInfo): string {
  return join(workspace.chaptersPath, chapter.filename);
}

/**
 * Check if workspace exists
 */
export function workspaceExists(dataDir: string, runId: string): boolean {
  const rootPath = join(dataDir, 'w1r', runId);
  return existsSync(rootPath);
}

/**
 * Get workspace info for existing workspace
 */
export function getWorkspaceInfo(dataDir: string, runId: string): WorkspaceInfo {
  const rootPath = join(dataDir, 'w1r', runId);
  return {
    runId,
    rootPath,
    chaptersPath: join(rootPath, 'chapters'),
    feedbackPath: join(rootPath, 'feedback'),
    outputsPath: join(rootPath, 'outputs'),
  };
}
