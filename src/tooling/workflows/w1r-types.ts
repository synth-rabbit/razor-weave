// src/tooling/workflows/w1r-types.ts

/**
 * W1R Revision Workflow Types
 */

export interface FeedbackCategory {
  noIssues: boolean;
  notes: string;
}

export interface FeedbackTemplate {
  chapterNumber: number;
  chapterTitle: string;
  toneVoice: FeedbackCategory;
  contentToAdd: FeedbackCategory;
  contentToRemove: FeedbackCategory;
  pacingFlow: FeedbackCategory;
  clarity: FeedbackCategory;
  consistency: FeedbackCategory;
  creativeDirection: FeedbackCategory;
}

export interface ClarifyingMessage {
  role: 'writer' | 'human';
  content: string;
}

export interface WriterOutput {
  chapterPath: string;
  changeSummary: string;
}

export interface ReviewResult {
  assessment: 'approve' | 'approve_with_notes' | 'concerns';
  feedback: string;
}

export type ChapterStatus =
  | 'feedback'        // Awaiting human feedback
  | 'clarifying'      // Writer asking questions
  | 'writing'         // Writer producing changes
  | 'reviewing'       // Editor + Domain reviewing
  | 'human_decision'; // Awaiting approve/reject

export interface CompletedChapter {
  chapter: number;
  feedbackRounds: number;
  completedAt: string;
}

export interface W1RCheckpoint {
  workflowRunId: string;
  workflowType: 'w1r_revision';
  bookSlug: string;
  sourceVersion: string;

  // Position
  currentChapter: number;
  chapterStatus: ChapterStatus;

  // Current chapter state
  currentFeedback: FeedbackTemplate | null;
  clarifyingDialogue: ClarifyingMessage[];
  writerOutput: WriterOutput | null;
  editorReview: ReviewResult | null;
  domainReview: ReviewResult | null;

  // Iteration tracking
  currentChapterIteration: number;

  // History
  completedChapters: CompletedChapter[];

  // Workspace paths
  workspacePath: string;
}

export type ReviewOption = 'skip' | 'sanity' | 'comprehensive';

export const FEEDBACK_CATEGORIES = [
  'toneVoice',
  'contentToAdd',
  'contentToRemove',
  'pacingFlow',
  'clarity',
  'consistency',
  'creativeDirection',
] as const;

export type FeedbackCategoryKey = typeof FEEDBACK_CATEGORIES[number];

/**
 * Create an empty feedback template for a chapter
 */
export function createEmptyFeedback(chapterNumber: number, chapterTitle: string): FeedbackTemplate {
  const emptyCategory = (): FeedbackCategory => ({ noIssues: false, notes: '' });
  return {
    chapterNumber,
    chapterTitle,
    toneVoice: emptyCategory(),
    contentToAdd: emptyCategory(),
    contentToRemove: emptyCategory(),
    pacingFlow: emptyCategory(),
    clarity: emptyCategory(),
    consistency: emptyCategory(),
    creativeDirection: emptyCategory(),
  };
}

/**
 * Create initial W1R checkpoint
 */
export function createW1RCheckpoint(
  workflowRunId: string,
  bookSlug: string,
  sourceVersion: string,
  workspacePath: string
): W1RCheckpoint {
  return {
    workflowRunId,
    workflowType: 'w1r_revision',
    bookSlug,
    sourceVersion,
    currentChapter: 1,
    chapterStatus: 'feedback',
    currentFeedback: null,
    clarifyingDialogue: [],
    writerOutput: null,
    editorReview: null,
    domainReview: null,
    currentChapterIteration: 1,
    completedChapters: [],
    workspacePath,
  };
}
