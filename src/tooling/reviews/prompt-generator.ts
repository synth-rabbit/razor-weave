import type Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '@razorweave/database';
import { getBookSnapshot, getChapterSnapshot } from './content-snapshot.js';
import type { ReviewData } from './schemas.js';

/**
 * Writes content snapshot to a file for agent access via Read tool.
 * Returns the absolute file path.
 */
function writeContentFile(
  campaignId: string,
  contentType: 'book' | 'chapter',
  content: string
): string {
  const ext = contentType === 'book' ? 'html' : 'md';
  const contentDir = join('data', 'reviews', 'content', campaignId);
  mkdirSync(contentDir, { recursive: true });

  const contentPath = join(contentDir, `content.${ext}`);
  writeFileSync(contentPath, content, 'utf-8');

  // Return path relative to repo root (agents work from there)
  return contentPath;
}

/**
 * Generates a reviewer prompt for a specific persona.
 * The prompt instructs the agent to:
 * 1. Read content using the Read tool
 * 2. Conduct review from persona's perspective
 * 3. Output JSON result to a specific file path
 */
export function generateReviewerPromptFile(
  db: Database.Database,
  campaignId: string,
  personaId: string
): string {
  const campaignClient = new CampaignClient(db);
  const personaClient = new PersonaClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const persona = personaClient.get(personaId);
  if (!persona) {
    throw new Error(`Persona not found: ${personaId}`);
  }

  // Get content from snapshot
  let content: string;
  let contentDescription: string;

  if (campaign.content_type === 'book') {
    const snapshot = getBookSnapshot(db, campaign.content_id);
    if (!snapshot) {
      throw new Error(`Book snapshot not found: ${campaign.content_id}`);
    }
    content = snapshot.content;
    contentDescription = `HTML book (version ${snapshot.version})`;
  } else {
    const snapshot = getChapterSnapshot(db, campaign.content_id);
    if (!snapshot) {
      throw new Error(`Chapter snapshot not found: ${campaign.content_id}`);
    }
    content = snapshot.content;
    contentDescription = `Markdown chapter: ${snapshot.chapter_name}`;
  }

  // Write content to file for agent to read
  const contentPath = writeContentFile(campaignId, campaign.content_type, content);

  // Output paths for agent results
  const outputDir = join('data', 'reviews', 'raw', campaignId);
  const jsonOutputPath = join(outputDir, `${personaId}.json`);
  const mdOutputPath = join(outputDir, `${personaId}.md`);

  const prompt = `# Review Task

You are a book reviewer with a specific persona. Read the content and provide a structured review.

## Your Persona: ${persona.name}

- **Archetype:** ${persona.archetype}
- **Experience Level:** ${persona.experience_level}
- **Fiction-First Alignment:** ${persona.fiction_first_alignment}
- **Narrative/Mechanics Comfort:** ${persona.narrative_mechanics_comfort}
- **GM Philosophy:** ${persona.gm_philosophy}
- **Genre Flexibility:** ${persona.genre_flexibility}
- **Cognitive Style:** ${persona.primary_cognitive_style}

Review the content AS THIS PERSONA. Your feedback should reflect their experience level, preferences, and perspective.

## Content to Review

**Type:** ${contentDescription}
**File:** ${contentPath}

Use the Read tool to read the content file. For large files, you may need to read in chunks.

## Review Criteria

Evaluate on 4 dimensions using a 1-10 scale:

1. **Clarity & Readability** - How clear and easy to understand for ${persona.name}
2. **Rules Accuracy** - Consistency and correctness of game mechanics
3. **Persona Fit** - How well it works for someone with ${persona.experience_level} experience
4. **Practical Usability** - Easy to reference and use at the gaming table

## Required Output

After reading and reviewing the content, write your review as JSON to:
**${jsonOutputPath}**

The JSON must follow this exact structure:
\`\`\`json
{
  "ratings": {
    "clarity_readability": <1-10>,
    "rules_accuracy": <1-10>,
    "persona_fit": <1-10>,
    "practical_usability": <1-10>
  },
  "narrative_feedback": "<Write 2-4 paragraphs in ${persona.name}'s voice about their overall impression>",
  "issue_annotations": [
    {
      "section": "<Section/chapter name where issue was found>",
      "issue": "<Clear description of the problem>",
      "impact": "<How this affects gameplay or understanding>",
      "location": "<Specific location within the section>"
    }
  ],
  "overall_assessment": "<1-2 sentence summary of the review>"
}
\`\`\`

**Important:**
- All rating values must be integers from 1-10
- \`issue_annotations\` must have at least 1 entry (identify at least one area for improvement)
- Write feedback in ${persona.name}'s authentic voice based on their persona traits
- Be specific about locations when noting issues

## Campaign Info

- Campaign ID: ${campaignId}
- Persona ID: ${personaId}

Begin by reading the content file, then write your JSON output.`;

  return prompt;
}

/**
 * Generates an analyzer prompt for aggregating all reviews in a campaign.
 * The prompt instructs the agent to:
 * 1. Read all review JSON files
 * 2. Analyze patterns and generate insights
 * 3. Output analysis to a specific file path
 */
export function generateAnalyzerPromptFile(
  db: Database.Database,
  campaignId: string
): string {
  const campaignClient = new CampaignClient(db);
  const personaClient = new PersonaClient(db);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const reviews = campaignClient.getCampaignReviews(campaignId);
  if (reviews.length === 0) {
    throw new Error(`No reviews found for campaign: ${campaignId}`);
  }

  // Format review file paths and summaries for the prompt
  const reviewDir = join('data', 'reviews', 'raw', campaignId);
  const reviewInfo = reviews.map((review) => {
    const persona = personaClient.get(review.persona_id);
    const data = JSON.parse(review.review_data) as ReviewData;
    const avgScore = (
      data.ratings.clarity_readability +
      data.ratings.rules_accuracy +
      data.ratings.persona_fit +
      data.ratings.practical_usability
    ) / 4;

    return {
      personaId: review.persona_id,
      personaName: persona?.name ?? review.persona_id,
      archetype: persona?.archetype ?? 'unknown',
      experience: persona?.experience_level ?? 'unknown',
      avgScore: Math.round(avgScore * 10) / 10,
      issueCount: data.issue_annotations.length,
      filePath: join(reviewDir, `${review.persona_id}.json`),
    };
  });

  const reviewSummary = reviewInfo
    .map((r) => `- ${r.personaName} (${r.archetype}/${r.experience}): avg ${r.avgScore}/10, ${r.issueCount} issues`)
    .join('\n');

  const reviewFilePaths = reviewInfo
    .map((r) => `  - ${r.filePath}`)
    .join('\n');

  const outputPath = join('data', 'reviews', 'analysis', `${campaignId}.md`);

  const prompt = `# Review Analysis Task

Analyze ${reviews.length} reviews for campaign ${campaignId} and generate a comprehensive analysis report.

## Review Summary

${reviewSummary}

## Review Files

Read all review JSON files to conduct your analysis:
${reviewFilePaths}

## Analysis Requirements

Generate a markdown analysis report with:

### 1. Executive Summary
2-3 sentences summarizing overall quality and key findings.

### 2. Dimension Averages
Calculate and report the average score for each dimension across all reviews:
- Clarity & Readability
- Rules Accuracy
- Persona Fit
- Practical Usability

### 3. Priority Issues
Identify the top issues by:
- **Frequency** - How many reviewers mentioned it
- **Severity** - Average impact rating
- **Affected personas** - Which reviewer types struggle most

### 4. Persona Breakdowns
Group findings by persona archetype:
- What works well for each group
- What each group struggles with

### 5. Recommendations
Actionable recommendations prioritized by impact.

## Output

Write your analysis as markdown to:
**${outputPath}**

Format the report for readability with clear headers and bullet points.

Begin by reading the review files, then write your analysis.`;

  return prompt;
}
