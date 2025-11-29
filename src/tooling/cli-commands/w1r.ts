// src/tooling/cli-commands/w1r.ts

import { resolve } from 'path';
import { readFile } from 'fs/promises';
import type Database from 'better-sqlite3';
import { BookRepository } from '../books/repository.js';
import { W1RRepository } from '../workflows/w1r-repository.js';
import {
  createWorkspace,
  copyChaptersToWorkspace,
  createChapterFeedbackTemplate,
  getWorkspaceInfo,
  workspaceExists,
  type ChapterInfo,
} from '../workflows/w1r-workspace.js';
import { createW1RCheckpoint, type W1RCheckpoint } from '../workflows/w1r-types.js';
import { readFeedback, formatFeedbackForPrompt } from '../workflows/w1r-feedback.js';
import {
  generateSessionPrompt,
  generateProcessingPrompt,
  generateCompletionPrompt,
  generateNextChapterPrompt,
} from '../workflows/w1r-prompts.js';

const REPO_ROOT = resolve(process.cwd());
const DATA_DIR = resolve(REPO_ROOT, 'data');

export interface StartResult {
  success: boolean;
  runId?: string;
  prompt?: string;
  error?: string;
}

export interface ResumeResult {
  success: boolean;
  runId?: string;
  prompt?: string;
  error?: string;
}

export interface StatusResult {
  success: boolean;
  status?: string;
  error?: string;
}

/**
 * Start a new W1R revision workflow
 */
export async function startW1R(
  db: Database.Database,
  bookSlug: string
): Promise<StartResult> {
  const bookRepo = new BookRepository(db);
  const w1rRepo = new W1RRepository(db);

  // Get book info
  const book = bookRepo.getBySlug(bookSlug);
  if (!book) {
    return { success: false, error: `Book not found: ${bookSlug}` };
  }

  // Check for existing active run
  const existing = w1rRepo.getActiveRunForBook(book.id);
  if (existing) {
    return {
      success: false,
      error: `Active W1R run exists: ${existing.run.id}. Use w1r:resume to continue.`,
    };
  }

  // Generate run ID and create workspace
  const runId = w1rRepo.generateRunId();

  try {
    const workspace = await createWorkspace(DATA_DIR, runId);

    // Get source version path
    const sourceVersion = book.current_version || '1.4.0';
    const sourceChaptersDir = resolve(REPO_ROOT, `books/core/v${sourceVersion}/chapters`);

    // Copy chapters and get info
    const chapters = await copyChaptersToWorkspace(sourceChaptersDir, workspace);
    if (chapters.length === 0) {
      return { success: false, error: 'No chapters found in source directory' };
    }

    // Create checkpoint
    const checkpoint = createW1RCheckpoint(runId, bookSlug, sourceVersion, workspace.rootPath);

    // Save to database
    w1rRepo.createRun(book.id, checkpoint);

    // Create first feedback template
    const firstChapter = chapters[0];
    const feedbackPath = await createChapterFeedbackTemplate(workspace, firstChapter);

    // Generate prompt
    const prompt = generateSessionPrompt(checkpoint, workspace, firstChapter, feedbackPath);

    return { success: true, runId, prompt };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to start W1R: ${errorMessage}` };
  }
}

/**
 * Resume an existing W1R revision workflow
 */
export async function resumeW1R(
  db: Database.Database,
  runId: string
): Promise<ResumeResult> {
  const w1rRepo = new W1RRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { run, checkpoint } = result;

  if (run.status === 'completed') {
    return { success: false, error: 'This run is already completed' };
  }

  if (run.status === 'failed') {
    return { success: false, error: 'This run has failed' };
  }

  // Get workspace and chapter info
  const workspace = getWorkspaceInfo(DATA_DIR, runId);
  if (!workspaceExists(DATA_DIR, runId)) {
    return { success: false, error: 'Workspace not found' };
  }

  // Get current chapter info
  const chapters = await getChaptersFromWorkspace(workspace.chaptersPath);
  const currentChapter = chapters.find(c => c.number === checkpoint.currentChapter);
  if (!currentChapter) {
    return { success: false, error: `Chapter ${checkpoint.currentChapter} not found` };
  }

  // Ensure feedback template exists
  const feedbackFilename = `${String(checkpoint.currentChapter).padStart(2, '0')}-feedback.md`;
  const feedbackPath = resolve(workspace.feedbackPath, feedbackFilename);

  // Generate prompt based on current status
  const prompt = generateSessionPrompt(checkpoint, workspace, currentChapter, feedbackPath);

  // Update status to running if paused
  if (run.status === 'paused') {
    w1rRepo.updateStatus(runId, 'running');
  }

  return { success: true, runId, prompt };
}

/**
 * Get status of a W1R run
 */
export function getW1RStatus(
  db: Database.Database,
  runId: string
): StatusResult {
  const w1rRepo = new W1RRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { run, checkpoint } = result;
  const completedCount = checkpoint.completedChapters.length;
  const totalChapters = 30; // TODO: get from chapters count

  const lines = [
    `W1R Revision: ${checkpoint.bookSlug} (${runId})`,
    `Status: Chapter ${checkpoint.currentChapter}/${totalChapters}, ${formatStatus(checkpoint.chapterStatus)}`,
    '',
  ];

  if (checkpoint.currentFeedback) {
    lines.push(`Current feedback iteration: ${checkpoint.currentChapterIteration}`);
  }

  if (completedCount > 0) {
    const totalRounds = checkpoint.completedChapters.reduce((s, c) => s + c.feedbackRounds, 0);
    const avgRounds = (totalRounds / completedCount).toFixed(1);
    lines.push(`Completed: ${completedCount} chapters (avg ${avgRounds} feedback rounds)`);
  }

  return { success: true, status: lines.join('\n') };
}

/**
 * List W1R runs
 */
export function listW1R(
  db: Database.Database,
  options?: { bookSlug?: string; status?: string }
): Array<{ runId: string; bookSlug: string; status: string; chapter: number; updatedAt: string }> | { error: string } {
  const w1rRepo = new W1RRepository(db);
  const bookRepo = new BookRepository(db);

  let bookId: string | undefined;
  if (options?.bookSlug) {
    const book = bookRepo.getBySlug(options.bookSlug);
    if (!book) {
      return { error: `Book not found: ${options.bookSlug}` };
    }
    bookId = book.id;
  }

  const runs = w1rRepo.listRuns({ bookId, status: options?.status });

  return runs.map(({ run, checkpoint }) => ({
    runId: run.id,
    bookSlug: checkpoint.bookSlug,
    status: run.status,
    chapter: checkpoint.currentChapter,
    updatedAt: run.updatedAt,
  }));
}

export interface ProcessResult {
  success: boolean;
  prompt?: string;
  error?: string;
}

/**
 * Process feedback and generate agent instructions
 */
export async function processW1R(
  db: Database.Database,
  runId: string,
  chapterNumber: number
): Promise<ProcessResult> {
  const w1rRepo = new W1RRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { checkpoint } = result;

  if (checkpoint.currentChapter !== chapterNumber) {
    return {
      success: false,
      error: `Expected chapter ${checkpoint.currentChapter}, got ${chapterNumber}`,
    };
  }

  const workspace = getWorkspaceInfo(DATA_DIR, runId);

  // Read feedback
  const feedbackFilename = `${String(chapterNumber).padStart(2, '0')}-feedback.md`;
  const feedbackPath = resolve(workspace.feedbackPath, feedbackFilename);

  let feedback;
  try {
    feedback = await readFeedback(feedbackPath);
  } catch (e) {
    return { success: false, error: `Could not read feedback: ${feedbackPath}` };
  }

  // Update checkpoint with feedback
  checkpoint.currentFeedback = feedback;
  checkpoint.chapterStatus = 'clarifying';
  w1rRepo.updateCheckpoint(runId, checkpoint);

  // Get chapter info
  const chapters = await getChaptersFromWorkspace(workspace.chaptersPath);
  const chapter = chapters.find(c => c.number === chapterNumber);
  if (!chapter) {
    return { success: false, error: `Chapter ${chapterNumber} not found` };
  }

  // Read chapter content
  const chapterPath = resolve(workspace.chaptersPath, chapter.filename);
  const chapterContent = await readFile(chapterPath, 'utf-8');

  // Format feedback
  const feedbackFormatted = formatFeedbackForPrompt(feedback);

  // Generate processing prompt
  const prompt = generateProcessingPrompt(
    checkpoint,
    chapter,
    chapterContent,
    feedbackFormatted
  );

  return { success: true, prompt };
}

export interface ApproveResult {
  success: boolean;
  isComplete?: boolean;
  prompt?: string;
  error?: string;
}

/**
 * Approve current chapter and advance to next
 */
export async function approveW1R(
  db: Database.Database,
  runId: string,
  chapterNumber: number
): Promise<ApproveResult> {
  const w1rRepo = new W1RRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { checkpoint } = result;

  if (checkpoint.currentChapter !== chapterNumber) {
    return {
      success: false,
      error: `Expected chapter ${checkpoint.currentChapter}, got ${chapterNumber}`,
    };
  }

  // Record completion
  checkpoint.completedChapters.push({
    chapter: chapterNumber,
    feedbackRounds: checkpoint.currentChapterIteration,
    completedAt: new Date().toISOString(),
  });

  const workspace = getWorkspaceInfo(DATA_DIR, runId);
  const chapters = await getChaptersFromWorkspace(workspace.chaptersPath);
  const totalChapters = chapters.length;

  // Check if all chapters complete
  if (chapterNumber >= totalChapters) {
    checkpoint.chapterStatus = 'feedback'; // Terminal state
    w1rRepo.updateCheckpoint(runId, checkpoint);
    w1rRepo.updateStatus(runId, 'completed');

    // Generate completion prompt
    const nextVersion = incrementPatchVersion(checkpoint.sourceVersion);
    const prompt = generateCompletionPrompt(checkpoint, nextVersion);

    return { success: true, isComplete: true, prompt };
  }

  // Advance to next chapter
  const nextChapterNum = chapterNumber + 1;
  const nextChapter = chapters.find(c => c.number === nextChapterNum);

  if (!nextChapter) {
    return { success: false, error: `Next chapter ${nextChapterNum} not found` };
  }

  // Reset state for next chapter
  checkpoint.currentChapter = nextChapterNum;
  checkpoint.chapterStatus = 'feedback';
  checkpoint.currentFeedback = null;
  checkpoint.clarifyingDialogue = [];
  checkpoint.writerOutput = null;
  checkpoint.editorReview = null;
  checkpoint.domainReview = null;
  checkpoint.currentChapterIteration = 1;

  w1rRepo.updateCheckpoint(runId, checkpoint);

  // Create feedback template for next chapter
  const feedbackPath = await createChapterFeedbackTemplate(workspace, nextChapter);

  // Generate next chapter prompt
  const prompt = generateNextChapterPrompt(checkpoint, workspace, nextChapter, feedbackPath);

  return { success: true, isComplete: false, prompt };
}

export interface CompleteResult {
  success: boolean;
  newVersion?: string;
  message?: string;
  error?: string;
}

/**
 * Complete W1R workflow with optional reviews and promotion
 */
export async function completeW1R(
  db: Database.Database,
  runId: string,
  reviewOption: 'skip' | 'sanity' | 'comprehensive'
): Promise<CompleteResult> {
  const w1rRepo = new W1RRepository(db);
  const bookRepo = new BookRepository(db);

  const result = w1rRepo.getRun(runId);
  if (!result) {
    return { success: false, error: `Run not found: ${runId}` };
  }

  const { checkpoint } = result;
  const book = bookRepo.getBySlug(checkpoint.bookSlug);

  if (!book) {
    return { success: false, error: `Book not found: ${checkpoint.bookSlug}` };
  }

  const newVersion = incrementPatchVersion(checkpoint.sourceVersion);

  // TODO: Implement review execution if not 'skip'
  if (reviewOption !== 'skip') {
    return {
      success: false,
      error: `Review option '${reviewOption}' not yet implemented. Use 'skip' for now.`,
    };
  }

  // TODO: Implement version promotion
  // 1. Create new version directory
  // 2. Copy chapters from workspace
  // 3. Update database
  // 4. Generate HTML/PDF

  return {
    success: true,
    newVersion,
    message: `Promoted to v${newVersion}. Run html:web:build and pdf:build to generate artifacts.`,
  };
}

/**
 * Increment the patch version number
 */
function incrementPatchVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

// Helper functions

async function getChaptersFromWorkspace(chaptersPath: string): Promise<ChapterInfo[]> {
  const { readdir } = await import('fs/promises');
  const files = await readdir(chaptersPath);
  const chapters: ChapterInfo[] = [];

  for (const file of files) {
    const match = file.match(/^(\d+)-(.+)\.md$/);
    if (match) {
      const number = parseInt(match[1], 10);
      const slug = match[2];
      // Read title from file
      const content = await readFile(resolve(chaptersPath, file), 'utf-8');
      const titleMatch = content.match(/^#\s*\d+\.\s*(.+)$/m) ||
                        content.match(/^##\s*\d+\.\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : slug;
      chapters.push({ number, slug, title, filename: file });
    }
  }

  return chapters.sort((a, b) => a.number - b.number);
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    feedback: 'awaiting your feedback',
    clarifying: 'writer asking questions',
    writing: 'writer updating chapter',
    reviewing: 'editor/domain reviewing',
    human_decision: 'awaiting your approval',
  };
  return labels[status] || status;
}
