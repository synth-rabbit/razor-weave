import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { ReviewData, AnalysisData } from './schemas.js';
import { FileError } from '../errors/index.js';

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

  try {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, markdown, 'utf-8');
  } catch (error) {
    throw new FileError(
      `Failed to write review markdown: ${error instanceof Error ? error.message : String(error)}`,
      outputPath
    );
  }
}

export interface AnalysisMarkdownData {
  campaignId: string;
  campaignName: string;
  contentType: 'book' | 'chapter';
  contentTitle: string;
  personaCount: number;
  analysisData: AnalysisData;
  createdAt: string;
  outputPath?: string;
}

export function writeAnalysisMarkdown(data: AnalysisMarkdownData): void {
  const {
    campaignId,
    campaignName,
    contentTitle,
    personaCount,
    analysisData,
    createdAt,
    outputPath,
  } = data;

  // Build Priority Rankings section
  const priorityRankingsContent = analysisData.priority_rankings
    .map((ranking, idx) => {
      const affectedPersonas = ranking.affected_personas.join(', ');
      return `${idx + 1}. **${ranking.category}** (Severity: ${ranking.severity}, Frequency: ${ranking.frequency}/${personaCount})
   - Affected personas: ${affectedPersonas}
   - Description: ${ranking.description}`;
    })
    .join('\n\n');

  // Build Dimension Summaries section
  const dimensionSummariesContent = `### Clarity & Readability
Average: ${analysisData.dimension_summaries.clarity_readability.average}/10 | Common themes: ${analysisData.dimension_summaries.clarity_readability.themes.join(', ')}

### Rules Accuracy
Average: ${analysisData.dimension_summaries.rules_accuracy.average}/10 | Common themes: ${analysisData.dimension_summaries.rules_accuracy.themes.join(', ')}

### Persona Fit
Average: ${analysisData.dimension_summaries.persona_fit.average}/10 | Common themes: ${analysisData.dimension_summaries.persona_fit.themes.join(', ')}

### Practical Usability
Average: ${analysisData.dimension_summaries.practical_usability.average}/10 | Common themes: ${analysisData.dimension_summaries.practical_usability.themes.join(', ')}`;

  // Build Persona Breakdowns section
  const personaBreakdownsContent = Object.entries(analysisData.persona_breakdowns)
    .map(([groupName, breakdown]) => {
      const strengthsCount = breakdown.strengths.length;
      const strugglesCount = breakdown.struggles.length;
      const totalItems = strengthsCount + strugglesCount;

      return `### ${groupName} (${totalItems} items)
- Strengths: ${breakdown.strengths.join(', ')}
- Struggles: ${breakdown.struggles.join(', ')}`;
    })
    .join('\n\n');

  // Build Trend Analysis section
  const trendAnalysisContent = analysisData.trend_analysis
    ? `## Trend Analysis\n${analysisData.trend_analysis}`
    : '';

  const markdown = `# Campaign Analysis: ${campaignName}
Date: ${createdAt} | Personas: ${personaCount} | Content: ${contentTitle}

## Executive Summary
${analysisData.executive_summary}

## Priority Rankings
${priorityRankingsContent}

## Dimension Summaries
${dimensionSummariesContent}

## Persona Breakdowns
${personaBreakdownsContent}

${trendAnalysisContent}`.trim();

  const finalOutputPath = outputPath || `data/reviews/analysis/${campaignId}.md`;

  try {
    mkdirSync(dirname(finalOutputPath), { recursive: true });
    writeFileSync(finalOutputPath, markdown, 'utf-8');
  } catch (error) {
    throw new FileError(
      `Failed to write analysis markdown: ${error instanceof Error ? error.message : String(error)}`,
      finalOutputPath
    );
  }
}
