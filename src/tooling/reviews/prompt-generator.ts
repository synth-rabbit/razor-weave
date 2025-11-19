import type Database from 'better-sqlite3';
import { CampaignClient } from './campaign-client.js';
import { PersonaClient } from '../database/persona-client.js';

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

  // Get content details
  const contentQuery = db.prepare('SELECT * FROM book_versions WHERE id = ?');
  const content = contentQuery.get(campaign.content_id) as {
    id: number;
    content_hash: string;
    version: string;
  };

  const prompt = `You are conducting a review for campaign-${campaignId}.

PERSONA: ${personaId} (${persona.archetype}/${persona.experience_level})
- Name: ${persona.name}
- Archetype: ${persona.archetype}
- Experience: ${persona.experience_level}
- Fiction-First: ${persona.fiction_first_alignment}
- Narrative/Mechanics: ${persona.narrative_mechanics_comfort}
- GM Philosophy: ${persona.gm_philosophy}
- Genre Flexibility: ${persona.genre_flexibility}
- Cognitive Style: ${persona.primary_cognitive_style}

Full persona profile:
${JSON.stringify(persona, null, 2)}

CONTENT: Book (version ${content.version}, hash ${content.content_hash})
- Content ID: ${content.id} (stored in book_versions table)
- Retrieve content using:
  SELECT content FROM book_versions WHERE id = ${content.id}

TASK: Review this book from ${persona.name}'s perspective

Evaluate on 4 dimensions (1-10 scale):
1. Clarity & Readability - How clear and easy to understand
2. Rules Accuracy - Consistency and correctness of game mechanics
3. Persona Fit - Works for ${persona.name}'s experience level and style
4. Practical Usability - Easy to use at the table during gameplay

Provide:
- Ratings for each dimension
- Narrative feedback in ${persona.name}'s voice
- Issue annotations (specific problems with location and impact)
- Overall assessment

OUTPUT REQUIREMENTS:

1. Write review JSON to database:

import { getDatabase } from '@razorweave/tooling/database';
import { CampaignClient } from '@razorweave/tooling/reviews';

const db = getDatabase();
const campaignClient = new CampaignClient(db.raw);

campaignClient.createPersonaReview({
  campaignId: '${campaignId}',
  personaId: '${personaId}',
  reviewData: {
    ratings: {
      clarity_readability: <1-10>,
      rules_accuracy: <1-10>,
      persona_fit: <1-10>,
      practical_usability: <1-10>
    },
    narrative_feedback: "<${persona.name}'s thoughts>",
    issue_annotations: [
      {
        section: "<section name>",
        issue: "<what's wrong>",
        impact: "<how it affects gameplay>",
        location: "<where in section>"
      }
    ],
    overall_assessment: "<summary>"
  },
  agentExecutionTime: <milliseconds>
});

2. Write markdown file:

import { writeReviewMarkdown } from '@razorweave/tooling/reviews';

writeReviewMarkdown(
  {
    campaignId: '${campaignId}',
    personaName: '${persona.name}',
    personaArchetype: '${persona.archetype}',
    personaExperience: '${persona.experience_level}',
    personaTraits: ['${persona.fiction_first_alignment}', '${persona.primary_cognitive_style}'],
    contentTitle: 'Book Review',
    reviewData: <your review JSON>
  },
  'data/reviews/raw/${campaignId}/${personaId}.md'
);

SCHEMA: Review data must match ReviewDataSchema

import { ReviewDataSchema } from '@razorweave/tooling/reviews/schemas';

Validate with:
ReviewDataSchema.parse(reviewData); // Throws if invalid
`;

  return prompt;
}
