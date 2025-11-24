import { getDatabase } from '../../../src/tooling/database/index.js';
import { CampaignClient, writeReviewMarkdown, ReviewDataSchema } from '../../../src/tooling/reviews/index.js';

const startTime = Date.now();

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Review from the perspective of Generated Persona 103702 (Killer/Veteran)
// Archetype: Killer - focused on tactical optimization, combat effectiveness, character builds
// Experience: Veteran (10-20 years) - knows systems well, can spot issues
// Fiction-First: Converting - transitioning to fiction-first style
// Narrative/Mechanics: Neutral - balanced view
// GM Philosophy: Prepared Sandbox - likes structured play with options
// Genre Flexibility: Enjoys Flexibility - appreciates multi-genre support
// Cognitive Style: Intuitive - prefers holistic understanding

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `After two decades of playing everything from old-school dungeon crawls to narrative indie games, I appreciate what Razorweave is trying to do. The combat chapter grabbed my attention immediately - the Resolve Clock system instead of hit points is elegant and keeps fights from becoming a war of attrition. I like that Strike, Maneuver, Set Up, and Defend/Withdraw give me real tactical choices rather than just 'I attack again.' The text explicitly tells me that Set Ups and Maneuvers should precede direct Strikes against tough opponents - that's the kind of tactical depth I'm looking for.

However, I'm finding myself wanting more crunch in certain areas. The damage system feels deliberately abstracted - 'tick the clock' is clean but I want to know what makes one attack tick 2 segments versus 1. Is it purely narrative positioning? What about weapon differences? The fiction-first approach sometimes feels like it leaves too much to GM fiat for someone who likes to optimize character builds.

The character creation is solid - I appreciate the clear attribute spread (one at 2, two at 1, one at 0) and the step-by-step process. But as a Killer archetype who enjoys tactical mastery, I notice the Skills and Proficiencies are referenced but I had to dig into later chapters to understand how they interact with combat. Cross-referencing slows down my ability to build effective characters.

The DC ladder is clean and predictable (12-14-16-18-20-22), which I appreciate. The Advantage/Disadvantage system capping at plus or minus 2 prevents runaway stacking, which is smart design. But I want more explicit guidance on what specific circumstances grant advantage in combat - the examples feel sparse for the tactical depth the system seems to promise.`,
  issue_annotations: [
    {
      section: "Combat Basics",
      issue: "Damage scaling unclear",
      impact: "Difficult to optimize character builds without knowing what factors increase clock ticks from Strikes",
      location: "Strike action description"
    },
    {
      section: "Combat Basics",
      issue: "Weapon differentiation not specified",
      impact: "Cannot evaluate weapon choices tactically - are all weapons mechanically equivalent?",
      location: "Strike and equipment sections"
    },
    {
      section: "Character Creation",
      issue: "Skills and Proficiencies deferred to later chapters",
      impact: "Cannot complete a combat-optimized character build without cross-referencing multiple chapters",
      location: "Steps Four and Five"
    },
    {
      section: "Actions, Checks, and Outcomes",
      issue: "Limited combat-specific Advantage examples",
      impact: "Tactical players need concrete examples of what grants combat advantage beyond general positioning",
      location: "Advantage and Disadvantage section"
    }
  ],
  overall_assessment: `Razorweave presents a promising tactical framework wrapped in fiction-first philosophy. As a veteran player who enjoys mastering combat systems, I find the core resolution elegant but occasionally frustrating in its deliberate abstraction. The Resolve Clock system is innovative and keeps fights dynamic. The four combat actions provide meaningful tactical choice. However, the system may require supplementary guidance for players who want to optimize builds - the emphasis on GM interpretation over explicit rules creates uncertainty for those of us who like to know exactly what our characters can achieve. Solid foundation, but I'd want to see expanded combat examples and clearer mechanical benchmarks before running a long campaign.`
};

// Validate review data
ReviewDataSchema.parse(reviewData);

const endTime = Date.now();
const executionTime = endTime - startTime;

// Write to database
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096254-tz2k00a9o',
  reviewData: reviewData,
  agentExecutionTime: executionTime
});

console.log('Review created with ID:', reviewId);

// Write markdown file
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 103702',
    personaArchetype: 'Killer',
    personaExperience: 'Veteran (10-20 years)',
    personaTraits: ['Converting', 'Intuitive'],
    contentTitle: 'Book Review',
    reviewData: reviewData
  },
  'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096254-tz2k00a9o.md'
);

console.log('Markdown written to: data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096254-tz2k00a9o.md');

// Output summary
console.log('\n=== REVIEW SUMMARY ===');
console.log('Persona: Generated Persona 103702 (Killer/Veteran)');
console.log('Ratings:');
console.log('  - Clarity & Readability:', reviewData.ratings.clarity_readability, '/10');
console.log('  - Rules Accuracy:', reviewData.ratings.rules_accuracy, '/10');
console.log('  - Persona Fit:', reviewData.ratings.persona_fit, '/10');
console.log('  - Practical Usability:', reviewData.ratings.practical_usability, '/10');
console.log('Issues identified:', reviewData.issue_annotations.length);
console.log('Execution time:', executionTime, 'ms');

db.close();
