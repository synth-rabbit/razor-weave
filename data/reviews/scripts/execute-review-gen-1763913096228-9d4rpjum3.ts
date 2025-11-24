/**
 * Execute reviewer prompt for persona gen-1763913096228-9d4rpjum3
 * Campaign: campaign-20251123-192801-j6p4e486
 * Persona: Generated Persona 583138 (Socializer/Newbie with Visual learning style)
 */
import { getDatabase } from '../../../src/tooling/database/client.js';
import { CampaignClient } from '../../../src/tooling/reviews/campaign-client.js';
import { writeReviewMarkdown } from '../../../src/tooling/reviews/markdown-writer.js';
import { ReviewDataSchema } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Define the review data from Generated Persona 583138's perspective
// This is a Socializer/Newbie with Visual learning style who is Wary of Abstraction
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As someone brand new to tabletop roleplaying games, I picked up this rulebook excited to learn how to play with my friends. I love the idea of collaborative storytelling, and the 'fiction first' approach sounds exactly like what I want - focusing on the story rather than crunching numbers.

The book has some really beautiful parts. The welcome chapter made me feel invited, and I appreciated that it told me I don't need to memorize everything before playing. The examples throughout are helpful - seeing Rella the telegraph engineer come to life step by step in character creation gave me a concrete reference point.

However, I found myself struggling with some sections. As a visual learner, I was hoping for more diagrams, flowcharts, or visual aids. When the book explains the check system with 4d6 and margin calculations, I had to re-read it several times. A simple visual showing 'roll dice -> add attribute -> compare to DC -> determine outcome tier' would have helped enormously.

The 'fiction first' principle is repeated often, but as a newbie, I'm not always sure when I should reach for the rules versus just narrate. The book says 'when the outcome is uncertain and meaningful' but I'd love more concrete examples of situations that DON'T need a roll, to help me calibrate.

For my socializer playstyle, I was pleased to see relationship mechanics and the emphasis on collaboration. The section about player agency and clear choices resonated with me. But I wish there were more guidance on how to facilitate good social scenes between player characters, not just with NPCs.

The terminology can be overwhelming. Tags, Conditions, Clocks, Skills, Proficiencies, Attributes - that's a lot to keep straight! The glossary is helpful but I had to flip back and forth constantly. A quick reference card or summary sheet built into the book would be invaluable for someone at my level.`,

  issue_annotations: [
    {
      section: 'Core Resolution System (Chapter 7-8)',
      issue: 'The 4d6 + Attribute + modifiers against DC system is explained primarily through text without visual aids',
      impact: 'Visual learners like myself need to mentally construct the flow without any diagrams - this significantly slows comprehension and requires multiple re-reads',
      location: 'Attribute Ratings and What They Mean section and throughout Checks explanation'
    },
    {
      section: 'Character Creation (Chapter 6)',
      issue: 'The nine-step creation process is comprehensive but lacks a visual flowchart or checklist format',
      impact: 'New players may lose track of where they are in the process or miss steps without a clear visual guide to follow',
      location: 'Character Creation Flow section - presented as numbered list but could benefit from visual treatment'
    },
    {
      section: 'Tags, Conditions, and Clocks (Chapters 9, 18)',
      issue: 'Three distinct tracking mechanisms introduced close together without clear visual differentiation',
      impact: 'Newbies struggle to internalize when to use each mechanism - the conceptual overlap (all track fictional state) makes them blur together without visual anchors',
      location: 'Core Concepts and dedicated chapters'
    },
    {
      section: 'Fiction First Guidance (Chapters 3-4)',
      issue: 'The principle is well-articulated but lacks sufficient negative examples showing when NOT to roll',
      impact: 'Socializers focused on story flow need clearer boundaries to avoid interrupting narrative momentum with unnecessary mechanics',
      location: 'Fiction First Structure and related sections'
    },
    {
      section: 'Social Play Guidance',
      issue: 'The book emphasizes collaboration but provides limited guidance on running scenes focused on player-to-player character interaction',
      impact: 'Socializer archetypes who prioritize inter-party dynamics have less structured support compared to combat or exploration',
      location: 'Chapters 11 and throughout GM sections'
    }
  ],

  overall_assessment: `The Razorweave Core Rulebook is an ambitious and thoughtfully designed system that genuinely tries to make fiction-first play accessible. For a complete newbie like me, it succeeds in many ways - the welcoming tone, clear principles, and worked examples give me confidence that I could eventually run this game.

However, the book assumes a baseline familiarity with TTRPG conventions that I don't have. Terms and concepts accumulate faster than I can internalize them. The lack of visual learning aids is my biggest frustration - flowcharts, summary boxes, and quick-reference materials would transform this from 'readable with effort' to 'easy to learn.'

For my socializer interests, the foundation is solid. The emphasis on player agency, meaningful choices, and collaborative storytelling aligns perfectly with what I want from a game. But I'd need more support for facilitating rich character-to-character scenes.

My recommendation: Read with a patient friend who can answer questions, create your own visual notes as you go, and don't try to absorb everything at once. The system underneath is elegant once it clicks.`
};

// Validate against schema
ReviewDataSchema.parse(reviewData);

// Create the review in database
const rowId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096228-9d4rpjum3',
  reviewData: reviewData,
  agentExecutionTime: Date.now() - startTime
});

console.log('Review created with row ID:', rowId);

// Write markdown file
const outputPath = 'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096228-9d4rpjum3.md';

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 583138',
    personaArchetype: 'Socializer',
    personaExperience: 'Newbie (0-1 years)',
    personaTraits: ['Curious', 'Visual'],
    contentTitle: 'Book Review',
    reviewData: reviewData
  },
  outputPath
);

console.log('Markdown written to:', outputPath);

// Summary of ratings
console.log('\n=== REVIEW RATINGS SUMMARY ===');
console.log('Clarity & Readability:', reviewData.ratings.clarity_readability, '/10');
console.log('Rules Accuracy:', reviewData.ratings.rules_accuracy, '/10');
console.log('Persona Fit:', reviewData.ratings.persona_fit, '/10');
console.log('Practical Usability:', reviewData.ratings.practical_usability, '/10');
console.log('Issue Annotations:', reviewData.issue_annotations.length);
console.log('Execution Time:', Date.now() - startTime, 'ms');

db.close();
