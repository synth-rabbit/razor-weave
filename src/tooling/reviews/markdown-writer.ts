import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { ReviewData } from './schemas.js';

export interface ReviewMarkdownData {
  campaignId: string;
  personaName: string;
  personaArchetype: string;
  personaExperience: string;
  personaTraits: string[];
  contentTitle: string;
  reviewData: ReviewData;
}

export function writeReviewMarkdown(
  data: ReviewMarkdownData,
  outputPath: string
): void {
  const { reviewData, personaName, personaArchetype, personaExperience, personaTraits, contentTitle, campaignId } = data;

  const markdown = `# Review: ${personaName} - ${contentTitle}

Campaign: ${campaignId} | Date: ${new Date().toISOString()}

## Persona Profile

- **Archetype:** ${personaArchetype}
- **Experience:** ${personaExperience}
- **Playstyle:** ${personaTraits.join(', ')}

## Structured Ratings

- **Clarity & Readability:** ${reviewData.ratings.clarity_readability}/10
- **Rules Accuracy:** ${reviewData.ratings.rules_accuracy}/10
- **Persona Fit:** ${reviewData.ratings.persona_fit}/10
- **Practical Usability:** ${reviewData.ratings.practical_usability}/10

## Narrative Feedback

${reviewData.narrative_feedback}

## Issue Annotations

${reviewData.issue_annotations
  .map(
    (annotation, idx) => `### ${idx + 1}. ${annotation.section}

**Issue:** ${annotation.issue}

**Impact:** ${annotation.impact}

**Location:** ${annotation.location}
`
  )
  .join('\n')}

## Overall Assessment

${reviewData.overall_assessment}
`;

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf-8');
}
