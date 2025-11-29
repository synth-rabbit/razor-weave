// src/tooling/workflows/w1r-prompts.ts

import type { W1RCheckpoint } from './w1r-types.js';
import type { WorkspaceInfo, ChapterInfo } from './w1r-workspace.js';

/**
 * Generate the initial/resume prompt for a W1R session
 */
export function generateSessionPrompt(
  checkpoint: W1RCheckpoint,
  workspace: WorkspaceInfo,
  chapter: ChapterInfo,
  feedbackPath: string
): string {
  const lines = [
    `We are working on w1r run ${checkpoint.workflowRunId} for ${checkpoint.bookSlug}.`,
    `Chapter ${chapter.number}: ${chapter.title}`,
    '',
    `Feedback template: ${feedbackPath}`,
    '',
    'Await my confirmation, then await my feedback on this chapter.',
    '',
    'When I confirm feedback is ready, run:',
    `  pnpm w1r:process --run ${checkpoint.workflowRunId} --chapter ${chapter.number}`,
    '',
    'That command will return instructions for:',
    '1. Analyzing the feedback',
    '2. Clarification dialogue (if needed)',
    '3. Writing the updated chapter',
    '4. Editor and Domain expert review',
    '',
    `Output will be written to: ${workspace.outputsPath}/${String(chapter.number).padStart(2, '0')}-output.md`,
  ];

  return lines.join('\n');
}

/**
 * Generate the processing instructions prompt (returned by w1r:process)
 */
export function generateProcessingPrompt(
  checkpoint: W1RCheckpoint,
  chapter: ChapterInfo,
  chapterContent: string,
  feedbackFormatted: string
): string {
  return `## W1R Processing: Chapter ${chapter.number} - ${chapter.title}

### Your Role
You are processing feedback for a creative revision workflow. The author has provided structured feedback on this chapter.

### Chapter Content
The chapter is located at: ${checkpoint.workspacePath}/chapters/${chapter.filename}

### Author's Feedback
${feedbackFormatted}

### Instructions

**Phase 1: Assessment**
Review the feedback and the chapter. Determine if you need clarification on any points.

If the feedback is clear and actionable, say: "The feedback is clear. I'm ready to make the changes."

If you need clarification, ask ONE question at a time. Wait for my response before asking another.

**Phase 2: Writing**
Once you understand the feedback (after clarification or if none needed):
1. Read the current chapter content
2. Make the requested changes
3. Write the updated chapter back to the same file
4. Create a change summary

**Phase 3: Self-Review**
After writing the updated chapter, conduct two reviews:

1. **Editor Review** - Assess:
   - Prose quality, grammar, readability
   - Consistency with the book's style
   - Pacing and flow
   - Whether changes appropriately address the feedback

2. **Domain Expert Review** - Assess:
   - Rules accuracy and clarity
   - Mechanical consistency with other chapters
   - Whether examples correctly demonstrate concepts
   - Player/GM usability

Format each review as:
**Assessment:** [Approve / Approve with notes / Concerns]
**Feedback:** [Your observations]

**Phase 4: Present to Human**
After both reviews, present:
1. Summary of changes made
2. Editor review findings
3. Domain expert review findings

Then ask: "Would you like to approve this chapter, or provide additional feedback?"

If approved, run:
  pnpm w1r:approve --run ${checkpoint.workflowRunId} --chapter ${chapter.number}

### Begin
Start by assessing the feedback. Do you need any clarification, or is the feedback clear?`;
}

/**
 * Generate Editor review prompt
 */
export function generateEditorPrompt(
  chapter: ChapterInfo,
  originalContent: string,
  updatedContent: string,
  feedbackSummary: string
): string {
  return `## Editor Review: Chapter ${chapter.number} - ${chapter.title}

### Your Role
You are a professional editor reviewing changes made to this chapter.

### Context
The author provided this feedback:
${feedbackSummary}

### Your Focus
- Prose quality, grammar, readability
- Consistency with the book's style
- Pacing and flow
- Whether the changes appropriately address the author's feedback

### Original Chapter
\`\`\`markdown
${originalContent.slice(0, 2000)}...
\`\`\`
(truncated for review)

### Updated Chapter
\`\`\`markdown
${updatedContent.slice(0, 2000)}...
\`\`\`
(truncated for review)

### Provide Your Review
Format:
**Assessment:** [Approve / Approve with notes / Concerns]

**Feedback:**
- [Your observations and suggestions]`;
}

/**
 * Generate Domain Expert review prompt
 */
export function generateDomainPrompt(
  chapter: ChapterInfo,
  originalContent: string,
  updatedContent: string,
  feedbackSummary: string
): string {
  return `## Domain Expert Review: Chapter ${chapter.number} - ${chapter.title}

### Your Role
You are a TTRPG rules expert reviewing changes made to this chapter.

### Context
The author provided this feedback:
${feedbackSummary}

### Your Focus
- Rules accuracy and clarity
- Mechanical consistency with other chapters
- Whether examples correctly demonstrate concepts
- Player/GM usability

### Original Chapter
\`\`\`markdown
${originalContent.slice(0, 2000)}...
\`\`\`
(truncated for review)

### Updated Chapter
\`\`\`markdown
${updatedContent.slice(0, 2000)}...
\`\`\`
(truncated for review)

### Provide Your Review
Format:
**Assessment:** [Approve / Approve with notes / Concerns]

**Feedback:**
- [Your observations and suggestions]`;
}

/**
 * Generate completion prompt (after all chapters done)
 */
export function generateCompletionPrompt(
  checkpoint: W1RCheckpoint,
  nextVersion: string
): string {
  const totalRounds = checkpoint.completedChapters.reduce(
    (sum, ch) => sum + ch.feedbackRounds, 0
  );
  const avgRounds = (totalRounds / checkpoint.completedChapters.length).toFixed(1);

  return `## W1R Revision Complete!

**Book:** ${checkpoint.bookSlug}
**Chapters completed:** ${checkpoint.completedChapters.length}
**Total feedback rounds:** ${totalRounds} (avg ${avgRounds} per chapter)

### Before promoting to v${nextVersion}, would you like to run chapter reviews?

**Options:**
1. **Skip reviews** - Promote now
2. **Sanity check** - 20 reviewers per chapter (10 core + 10 targeted)
3. **Comprehensive** - 50 reviewers per chapter (10 core + 40 distributed)

Reply with your choice (1, 2, or 3).`;
}

/**
 * Generate next chapter prompt (after approval)
 */
export function generateNextChapterPrompt(
  checkpoint: W1RCheckpoint,
  workspace: WorkspaceInfo,
  chapter: ChapterInfo,
  feedbackPath: string
): string {
  const completedCount = checkpoint.completedChapters.length;

  return `## Chapter ${checkpoint.currentChapter - 1} Approved!

Progress: ${completedCount}/30 chapters complete

---

${generateSessionPrompt(checkpoint, workspace, chapter, feedbackPath)}`;
}
