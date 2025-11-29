// src/tooling/workflows/w1r-feedback.ts

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { FeedbackTemplate, FeedbackCategory, FeedbackCategoryKey } from './w1r-types.js';
import { createEmptyFeedback, FEEDBACK_CATEGORIES } from './w1r-types.js';

const CATEGORY_LABELS: Record<FeedbackCategoryKey, string> = {
  toneVoice: 'Tone/Voice',
  contentToAdd: 'Content to Add',
  contentToRemove: 'Content to Remove/Trim',
  pacingFlow: 'Pacing/Flow',
  clarity: 'Clarity',
  consistency: 'Consistency',
  creativeDirection: 'Creative Direction',
};

/**
 * Generate markdown feedback template for a chapter
 */
export function generateFeedbackMarkdown(chapterNumber: number, chapterTitle: string): string {
  const lines: string[] = [
    `# Chapter ${chapterNumber} Feedback: ${chapterTitle}`,
    '',
  ];

  for (const key of FEEDBACK_CATEGORIES) {
    const label = CATEGORY_LABELS[key];
    lines.push(`## ${label}`);
    lines.push('- [ ] No issues');
    lines.push('- ');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Parse markdown feedback into structured template
 */
export function parseFeedbackMarkdown(markdown: string): FeedbackTemplate {
  const lines = markdown.split('\n');

  // Extract chapter info from title
  const titleMatch = lines[0]?.match(/^# Chapter (\d+) Feedback: (.+)$/);
  if (!titleMatch) {
    throw new Error('Invalid feedback format: missing chapter title');
  }

  const chapterNumber = parseInt(titleMatch[1], 10);
  const chapterTitle = titleMatch[2];

  const feedback = createEmptyFeedback(chapterNumber, chapterTitle);

  let currentCategory: FeedbackCategoryKey | null = null;

  for (const line of lines) {
    // Check for category header
    for (const key of FEEDBACK_CATEGORIES) {
      if (line.startsWith(`## ${CATEGORY_LABELS[key]}`)) {
        currentCategory = key;
        break;
      }
    }

    if (!currentCategory) continue;

    // Check for "No issues" checkbox
    if (line.match(/^- \[x\] No issues/i)) {
      feedback[currentCategory].noIssues = true;
    }

    // Collect notes (lines starting with "- " that aren't the checkbox)
    if (line.startsWith('- ') && !line.includes('No issues')) {
      const note = line.slice(2).trim();
      if (note) {
        if (feedback[currentCategory].notes) {
          feedback[currentCategory].notes += '\n' + note;
        } else {
          feedback[currentCategory].notes = note;
        }
      }
    }
  }

  return feedback;
}

/**
 * Write feedback template to file
 */
export async function writeFeedbackTemplate(
  path: string,
  chapterNumber: number,
  chapterTitle: string
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const content = generateFeedbackMarkdown(chapterNumber, chapterTitle);
  await writeFile(path, content, 'utf-8');
}

/**
 * Read and parse feedback from file
 */
export async function readFeedback(path: string): Promise<FeedbackTemplate> {
  const content = await readFile(path, 'utf-8');
  return parseFeedbackMarkdown(content);
}

/**
 * Check if feedback has any actual content (not all "no issues")
 */
export function hasFeedbackContent(feedback: FeedbackTemplate): boolean {
  for (const key of FEEDBACK_CATEGORIES) {
    const category = feedback[key];
    if (!category.noIssues && category.notes.trim()) {
      return true;
    }
  }
  return false;
}

/**
 * Format feedback for display/prompts
 */
export function formatFeedbackForPrompt(feedback: FeedbackTemplate): string {
  const sections: string[] = [];

  for (const key of FEEDBACK_CATEGORIES) {
    const category = feedback[key];
    const label = CATEGORY_LABELS[key];

    if (category.noIssues) {
      sections.push(`**${label}:** No issues`);
    } else if (category.notes.trim()) {
      sections.push(`**${label}:**\n${category.notes}`);
    }
  }

  return sections.join('\n\n');
}
