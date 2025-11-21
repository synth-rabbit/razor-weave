import type { PersonaReview } from './campaign-client.js';

export interface AnalyzerPromptData {
  campaignId: string;
  contentTitle: string;
  reviews: PersonaReview[];
  personaProfiles: Map<
    string,
    {
      name: string;
      archetype: string;
      experience_level: string;
    }
  >;
}

export function generateAnalyzerPrompt(
  data: AnalyzerPromptData
): string {
  const { campaignId, contentTitle, reviews, personaProfiles } = data;

  const reviewSummaries = reviews
    .map((review) => {
      const profile = personaProfiles.get(review.persona_id);
      const reviewData = JSON.parse(review.review_data);

      return `
**Persona:** ${profile?.name} (${profile?.archetype}, ${profile?.experience_level})
**Ratings:**
- Clarity: ${reviewData.ratings.clarity_readability}/10
- Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10
- Persona Fit: ${reviewData.ratings.persona_fit}/10
- Practical Usability: ${reviewData.ratings.practical_usability}/10

**Feedback:** ${reviewData.narrative_feedback}

**Issues:** ${reviewData.issue_annotations.length} identified
${reviewData.issue_annotations
  .map(
    (a: { section: string; issue: string; impact: string }) =>
      `  - ${a.section}: ${a.issue} (${a.impact})`
  )
  .join('\n')}
`;
    })
    .join('\n---\n');

  return `You are analyzing ${reviews.length} persona reviews for: ${contentTitle}

Campaign ID: ${campaignId}

# Review Data

${reviewSummaries}

# Analysis Instructions

Analyze the reviews above and provide a comprehensive analysis including:

## 1. Executive Summary
High-level overview of findings (2-3 sentences).

## 2. Priority Rankings
Identify the top issues ranked by severity × frequency. For each:
- Category name
- Severity score (1-10)
- Frequency (how many personas mentioned it)
- Affected persona IDs
- Description

## 3. Dimension Summaries
For each dimension (clarity, rules accuracy, persona fit, usability):
- Calculate average score
- Identify common themes from feedback

## 4. Persona Breakdowns
Group personas by experience level or archetype and identify:
- What worked well for this group
- What didn't work for this group

## 5. Trend Analysis (if applicable)
Compare to previous campaigns if data available.

**Output Format:**

Provide your analysis as valid JSON matching this schema:

\`\`\`json
{
  "executive_summary": "string (50+ chars)",
  "priority_rankings": [
    {
      "category": "string",
      "severity": number (1-10),
      "frequency": number,
      "affected_personas": ["persona-id"],
      "description": "string"
    }
  ],
  "dimension_summaries": {
    "clarity_readability": { "average": number, "themes": ["string"] },
    "rules_accuracy": { "average": number, "themes": ["string"] },
    "persona_fit": { "average": number, "themes": ["string"] },
    "practical_usability": { "average": number, "themes": ["string"] }
  },
  "persona_breakdowns": {
    "group_name": {
      "strengths": ["string"],
      "struggles": ["string"]
    }
  },
  "trend_analysis": "optional string"
}
\`\`\`

Focus on actionable insights that can guide content improvements.`;
}
