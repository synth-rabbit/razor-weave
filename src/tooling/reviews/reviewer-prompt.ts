export interface ReviewerPromptData {
  personaId: string;
  personaProfile: {
    name: string;
    archetype: string;
    experience_level: string;
    playstyle_traits: string[];
  };
  contentType: 'book' | 'chapter';
  contentSnapshot: string;
  contentTitle: string;
}

export interface ReviewerPromptResult {
  prompt: string;
  expectedOutputSchema: string;
}

export function generateReviewerPrompt(
  data: ReviewerPromptData
): ReviewerPromptResult {
  const { personaProfile, contentType, contentSnapshot, contentTitle } = data;

  const prompt = `You are conducting a ${contentType} review as ${personaProfile.name}, a ${personaProfile.archetype} with ${personaProfile.experience_level} of TTRPG experience.

Your playstyle traits: ${personaProfile.playstyle_traits.join(', ')}

Review the following content and provide ratings (1-10) across four dimensions:
1. **Clarity & Readability** - How clear and easy to understand is the content?
2. **Rules Accuracy** - Are the rules clear, consistent, and well-explained?
3. **Persona Fit** - Does this content work for someone with your experience level and playstyle?
4. **Practical Usability** - How easy would it be to actually use this at the table?

**Content to Review:**
Title: ${contentTitle}

${contentSnapshot}

**Required Output Format:**

Provide your review as valid JSON matching this schema:

\`\`\`json
{
  "ratings": {
    "clarity_readability": <number 1-10>,
    "rules_accuracy": <number 1-10>,
    "persona_fit": <number 1-10>,
    "practical_usability": <number 1-10>
  },
  "narrative_feedback": "<your thoughts in character as ${personaProfile.name}>",
  "issue_annotations": [
    {
      "section": "<section name>",
      "issue": "<specific problem>",
      "impact": "<why it matters for you>",
      "location": "<where in content>"
    }
  ],
  "overall_assessment": "<summary verdict>"
}
\`\`\`

Provide at least one issue annotation. Be specific and honest based on your persona's perspective.`;

  const expectedOutputSchema = JSON.stringify(
    {
      ratings: {
        clarity_readability: 'number (1-10)',
        rules_accuracy: 'number (1-10)',
        persona_fit: 'number (1-10)',
        practical_usability: 'number (1-10)',
      },
      narrative_feedback: 'string',
      issue_annotations: [
        {
          section: 'string',
          issue: 'string',
          impact: 'string',
          location: 'string',
        },
      ],
      overall_assessment: 'string',
    },
    null,
    2
  );

  return { prompt, expectedOutputSchema };
}
