// Execute review for persona gen-1763913096215-xn2ludze8
import { getDatabase } from '../../../src/tooling/database/client.js';
import { CampaignClient } from '../../../src/tooling/reviews/campaign-client.js';
import { writeReviewMarkdown } from '../../../src/tooling/reviews/markdown-writer.js';
import { ReviewDataSchema } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Review from the perspective of Generated Persona 117214:
// - Storyteller archetype - values narrative, character development
// - Newbie (0-1 years) - new to TTRPGs, needs clear guidance
// - Curious about fiction-first approach
// - Comfortable with abstraction in mechanics
// - World Simulator GM philosophy - wants rich world tools
// - Genre-Agnostic Enthusiast - appreciates flexibility
// - Systems Integrator - wants to see how pieces connect

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 8,
    practical_usability: 6
  },
  narrative_feedback: `As someone brand new to tabletop roleplaying games, I found Razorweave's approach genuinely exciting. The book opens with reassurance that I don't need to memorize everything - just know where to look. That alone made me exhale.

The "fiction first" philosophy speaks directly to why I was drawn to TTRPGs in the first place: I want to tell stories, not do accounting. The book repeatedly emphasizes that mechanics only enter when outcomes are uncertain AND meaningful. This dual condition makes so much sense - why roll dice for something boring?

Character creation feels like guided worldbuilding rather than math homework. Starting with a concept like "retired scout with a guilty conscience" before touching any numbers? That's exactly how my brain works. The step-by-step flow from concept to identity elements to attributes felt natural.

The combat chapter surprised me. I expected hit points and damage tables, but instead found Resolve Clocks and Conditions. At first this felt abstract, but then I realized - it means fights end when the story demands it, not when a number hits zero. My villain can flee when cornered, surrender when desperate, or fight to the death. The narrative possibilities feel endless.

However, I did struggle in places. There's a lot to absorb, and sometimes I lost track of which chapter explains what. The Skills and Proficiencies chapters, in particular, felt dense. I found myself wishing for more concrete examples of play - actual dialogue at a table, dice being rolled, consequences being narrated.

The Systems Integrator in me appreciates how Tags, Conditions, Clocks, and Attributes interlock. But as a newcomer, I sometimes felt I was building a mental map without enough landmarks. More sidebars showing "this is what this looks like in action" would help enormously.

Overall though? I'm genuinely excited to play. The book treats me like a creative collaborator, not a rules lawyer. That matters.`,
  issue_annotations: [
    {
      section: "Part II: Skills, Proficiencies, and Mechanical Reference",
      issue: "Reference chapters lack sufficient play examples",
      impact: "New players may understand WHAT skills do but struggle to see WHEN to use them or HOW they interact with other systems in actual play",
      location: "Chapters 14-17"
    },
    {
      section: "Core Concepts at a Glance",
      issue: "Quick reference glossary appears before detailed explanations, creating forward-reference confusion",
      impact: "Newbies may feel overwhelmed by terminology introduced without context before they've read explanatory chapters",
      location: "Chapter 2 and Chapter 28 Glossary structure"
    },
    {
      section: "Combat Basics",
      issue: "Resolve Clock segment counts mentioned but sizing guidance is scattered",
      impact: "As a new GM, I would struggle to know how many segments to give different enemies without more guidance in one place",
      location: "Chapter 10, section on Resolve instead of Hit Points"
    },
    {
      section: "Character Creation",
      issue: "Step Seven through Nine feel compressed compared to earlier steps",
      impact: "New players get detailed guidance on concept and attributes but less help establishing relationships, goals, and campaign fit - areas where we need the most support",
      location: "Chapter 6, Steps 7-9"
    },
    {
      section: "Table of Contents Navigation",
      issue: "Part structure visible but chapter numbers don't clearly indicate page length or complexity",
      impact: "Difficult to estimate reading time or know which sections are essential vs. reference material",
      location: "Table of Contents"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a thoughtfully written guide that prioritizes storytelling over simulation. For a complete newcomer to TTRPGs with a storytelling bent and comfort with abstraction, this book feels welcoming rather than gatekeeping.

The strengths are substantial: fiction-first philosophy is well-articulated, character creation flows naturally from concept to mechanics, and the Resolve Clock system elegantly sidesteps hit-point attrition in favor of narrative pacing. The genre-agnostic approach means I can imagine running mysteries, heists, or adventures without feeling constrained.

The weaknesses primarily affect practical usability for new players. The reference sections are comprehensive but example-light. The book tells me what tools exist but sometimes struggles to show me wielding them. As someone who learns best by seeing systems interact, I wanted more actual-play moments embedded in the text.

My recommendation: this is an excellent "second read" book - the kind where the first pass introduces concepts and the second pass clicks everything into place. New players should expect to revisit chapters as questions arise in play. The book itself acknowledges this, which helps set expectations.

Would I recommend this to a fellow newbie storyteller? Yes, with the caveat that we'd want to watch some actual-play content or have an experienced GM guide our first sessions. The tools are here; the training wheels could be sturdier.`
};

// Validate against schema
ReviewDataSchema.parse(reviewData);

// Create the review in database
const rowId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096215-xn2ludze8',
  reviewData: reviewData,
  agentExecutionTime: Date.now() - startTime
});

console.log('Review created with row ID:', rowId);

// Write markdown file
const outputPath = 'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096215-xn2ludze8.md';

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 117214',
    personaArchetype: 'Storyteller',
    personaExperience: 'Newbie (0-1 years)',
    personaTraits: ['Curious', 'Systems Integrator'],
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
