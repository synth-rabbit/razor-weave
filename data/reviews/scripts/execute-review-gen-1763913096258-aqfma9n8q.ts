// Execute reviewer prompt for gen-1763913096258-aqfma9n8q
import { getDatabase, closeDatabase } from '../../../src/tooling/database/client.js';
import { CampaignClient } from '../../../src/tooling/reviews/campaign-client.js';
import { writeReviewMarkdown } from '../../../src/tooling/reviews/markdown-writer.js';
import { ReviewDataSchema } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

// Connect to database
const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Review data based on Generated Persona 130551's perspective:
// - Method Actor (deeply immersed in character, values emotional truth)
// - Forever GM (experienced, knows what works at the table)
// - Skeptical of fiction-first (prefers clear mechanical guardrails)
// - Wary of Abstraction (wants concrete examples, not vague principles)
// - Prepared Sandbox GM (likes prep tools, structured flexibility)
// - Genre-Specific Purist (may find the generic nature limiting)
// - Simplicity Seeker (values easy-to-use systems over complexity)

const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 7,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `Look, I've been running games for over a decade, and I've seen my share of "narrative-first" systems come and go. This rulebook has some solid bones - the 4d6 keep-highest-two system is elegant enough, and I appreciate that they've laid out clear DC tiers and outcome bands. That's the kind of structure I can work with.

But here's where I get frustrated: this system keeps telling me to "follow the fiction" and "let Tags guide your rulings" without giving me enough concrete examples of what that actually looks like at the table. When I'm prepping a session, I need to know exactly how things interact. If a character has the "Connected to the Docks" Tag and tries to intimidate a harbor official who has the "Overworked" Tag, what's the DC? The book tells me to "improvise" - but I've seen too many games fall apart when improvisation replaces reliable structure.

The character creation section is serviceable, but it leans heavily on collaborative worldbuilding that I find dilutes the GM's vision. As someone who runs prepared sandboxes with detailed faction maps and NPC networks, I want my players focused on inhabiting their characters deeply, not on meta-level design discussions. The Method Actor in me appreciates the emphasis on motivations and relationships, but the practical GM in me wants tighter mechanical integration.

The faction and front systems show promise - I can see using those Clocks to track complex political situations. But the examples given are too generic. "The River Trade War" could fit any setting. What about genre-specific guidance? I run noir mysteries and cosmic horror, not "generic fantasy with Tags." Give me examples that show the system singing in specific contexts.

On a positive note: the reference sheets section is well-organized, and the GM prep worksheets seem genuinely useful. The DC ladder is clean and memorable. I just wish the whole book had that same level of concrete utility instead of philosophical hand-waving about "fiction-first play."`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks & Outcomes",
      issue: "Insufficient guidance on DC assignment for Tag interactions",
      impact: "GMs must constantly improvise DCs without clear anchors, leading to inconsistent rulings and player frustration",
      location: "DC determination section - lacks worked examples showing Tag-to-DC translation"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Over-reliance on collaborative worldbuilding during character creation",
      impact: "Dilutes GM authority and prepared content; may conflict with sandbox prep styles",
      location: "Character concept and background development sections"
    },
    {
      section: "Chapter 9 - Tags, Conditions & Clocks",
      issue: "Tag definitions are too abstract without mechanical weight",
      impact: "Players and GMs unclear when Tags should affect rolls vs. narrative positioning only",
      location: "Throughout the chapter - needs explicit mechanical triggers"
    },
    {
      section: "Chapter 25 - Factions, Fronts & World Pressure",
      issue: "Examples are genre-agnostic to the point of being unhelpful",
      impact: "GMs running specific genres (noir, horror, political intrigue) get no tailored guidance",
      location: "Front examples and faction templates"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Combat resolution feels underdeveloped compared to social/exploration",
      impact: "Method Actor-style players who want tense, meaningful combat may find it too abstract",
      location: "Action resolution in combat - needs more tactical texture"
    }
  ],
  overall_assessment: `This rulebook demonstrates competent organization and some genuinely useful tools, particularly in the reference section and the Clock/Front systems. The 4d6 core mechanic is solid and the outcome tier system provides needed structure. However, for a Forever GM who values prepared content and clear mechanical guidance, the heavy reliance on "fiction-first" improvisation and generic examples makes this feel incomplete. The system would benefit enormously from genre-specific supplements and more explicit rules for how Tags translate to mechanical effects. As a Simplicity Seeker, I appreciate the streamlined approach, but simplicity shouldn't mean vagueness. I could run this system, but I'd need to do significant house-ruling to make it feel like more than a framework for improvisation. Score: 6.25/10 average across dimensions, with strongest marks for organization and weakest for genre support and mechanical precision.`
};

// Validate the review data
ReviewDataSchema.parse(reviewData);

// Create the persona review in the database
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096258-aqfma9n8q',
  reviewData: reviewData,
  agentExecutionTime: Date.now() - startTime
});

console.log(`Created persona review with ID: ${reviewId}`);

// Write the markdown file
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 130551',
    personaArchetype: 'Method Actor',
    personaExperience: 'Forever GM',
    personaTraits: ['Skeptical', 'Simplicity Seeker'],
    contentTitle: 'Book Review',
    reviewData: reviewData
  },
  'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096258-aqfma9n8q.md'
);

console.log('Wrote markdown review file');

// Output summary
console.log('\n=== Review Summary ===');
console.log(`Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`Practical Usability: ${reviewData.ratings.practical_usability}/10`);
console.log(`Issue Annotations: ${reviewData.issue_annotations.length}`);
console.log(`Execution Time: ${Date.now() - startTime}ms`);

closeDatabase();
