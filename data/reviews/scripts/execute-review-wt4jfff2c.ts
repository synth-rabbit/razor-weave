// Execute review for persona gen-1763913096227-wt4jfff2c
import { getDatabase } from '../../../src/tooling/database/client.js';
import { CampaignClient } from '../../../src/tooling/reviews/campaign-client.js';
import { writeReviewMarkdown } from '../../../src/tooling/reviews/markdown-writer.js';
import { ReviewDataSchema } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Review from the perspective of Generated Persona 139991:
// - Tactician archetype - values strategic options, tactical depth, meaningful decisions
// - Hybrid GM/Player - experienced on both sides of the screen
// - Evangelical about fiction-first approach - actively promotes this style
// - Comfortable with Abstraction - appreciates elegant mechanical abstractions
// - Collaborative Storyteller GM philosophy - wants shared narrative control
// - Neutral on genre flexibility - neither strongly positive nor negative
// - Complexity Tolerant with Experimental secondary - enjoys depth, willing to try new approaches

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 9,
    practical_usability: 7
  },
  narrative_feedback: `As someone who has spent years on both sides of the GM screen, I approach every rulebook with a tactician's eye: what decisions does this system create, and are they meaningful? Razorweave delivers remarkably well on this front.

The fiction-first philosophy isn't just window dressing here - it's architecturally embedded. The dual trigger for dice rolls (uncertain AND meaningful) immediately resonated with me. I've run too many sessions where players rolled for trivial actions because "that's what you do." This system explicitly rejects that, and I'm here to evangelize it.

The attribute system (MIGHT, FINESSE, MIND, PRESENCE) maps cleanly onto the tactical decision space. Each check naturally suggests a tactical approach rather than just a stat lookup. When my character faces a locked door, I'm not asking "what's my lockpicking modifier?" - I'm asking "do I force it (MIGHT), pick it (FINESSE), figure out the mechanism (MIND), or convince someone to open it (PRESENCE)?" That's the kind of meaningful choice architecture I live for.

Clocks are the tactical heartbeat of this system. As a GM, I immediately saw how they create pressure without arbitrary countdown mechanics. As a player, I appreciate that progress is visible and decisions about clock advancement are collaborative. The Resolve Clock replacing hit points is elegant - it abstracts the granular accounting that bogs down tactical play while preserving meaningful escalation.

The Conditions and Tags system offers tremendous combinatorial depth. Status isn't binary (hurt/not hurt) - it's nuanced (BLEEDING, SHAKEN, EXHAUSTED), and these interact with the fiction in ways that create emergent tactical situations. I found myself mentally running scenarios: "If I'm EXPOSED and STRAINED, what options does that open for the enemy? What options does it close for me?"

Where I struggled was in the reference density. Chapters 14-17 on Skills and Proficiencies are comprehensive but not optimized for mid-session lookup. In tactical play, you need quick answers to specific questions. I found myself wanting more tables, more visual hierarchy, more "if X then Y" decision trees. The information is there but not always where my tactical brain expects it.

The GM guidance in Part III shows sophistication about collaborative storytelling that aligns perfectly with my philosophy. The sections on NPCs, Factions, and Fronts give me tools for creating dynamic opposition that responds to player choices - not just static obstacles waiting to be overcome. This is collaborative storytelling with teeth.

One suggestion: the system would benefit from more explicit "tactical situation" examples. Show me a complex combat with multiple Clocks ticking, multiple Conditions in play, and meaningful decisions at every turn. The individual pieces are clear; seeing them work together in a pressure-cooked scenario would cement understanding.

Overall, this is a system that rewards the tactical mindset while never losing sight of the narrative. It's the balance I've been looking for.`,
  issue_annotations: [
    {
      section: "Part II: Skills, Proficiencies, and Mechanical Reference",
      issue: "Reference chapters optimized for reading, not for table lookup",
      impact: "During tactical play, I need quick answers to specific rules questions. The current organization requires scanning paragraphs rather than consulting structured tables or decision trees",
      location: "Chapters 14-17, particularly the Skills Reference"
    },
    {
      section: "Combat Basics",
      issue: "Limited examples of complex multi-Clock scenarios",
      impact: "The system's tactical depth comes from interacting Clocks and Conditions, but examples tend to show isolated mechanics rather than emergent complexity",
      location: "Chapter 10, combat examples"
    },
    {
      section: "Tags and Conditions Reference",
      issue: "Interactions between multiple concurrent Conditions not fully explored",
      impact: "As a tactician, I want to understand how EXPOSED + STRAINED + BLEEDING creates different tactical constraints than HIDDEN + FOCUSED + EMPOWERED, but the reference treats Conditions largely in isolation",
      location: "Chapter 18, Conditions section"
    },
    {
      section: "GM Tools: NPCs and Enemies",
      issue: "Enemy tactical profiles could be more explicit about decision-making",
      impact: "I know what enemies CAN do, but GM guidance on what they SHOULD do given specific tactical situations would help run dynamic opposition",
      location: "Chapter 24, enemy design guidance"
    },
    {
      section: "Downtime and Advancement",
      issue: "Strategic long-term planning mechanics feel underdeveloped compared to session-level tactics",
      impact: "The system excels at tactical moment-to-moment play but offers less structure for players who want to plan across sessions or arcs",
      location: "Chapters 12 and 19"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a sophisticated tactical system disguised as a narrative game - and I mean that as the highest compliment. It understands that meaningful choices are the core of both good tactics and good storytelling.

For a Hybrid GM/Player with Tactician tendencies, this system hits nearly every mark. The fiction-first philosophy I evangelize is structurally embedded, not bolted on. The Clock system creates visible, manipulable game state that rewards tactical thinking. The Attribute + Skill + Proficiency architecture offers enough combinatorial depth for meaningful build differentiation without drowning in modifiers.

The system particularly shines in its approach to conflict. Resolve Clocks, Conditions, and Tags create a rich tactical space where position, timing, and resource management matter - but always in service of the narrative. I never felt like I was optimizing spreadsheets; I felt like I was making interesting choices.

My primary criticism is organizational: the reference material is written for comprehension rather than rapid lookup. In tactical play, you need answers in seconds. The information exists but isn't always structured for the questions you ask mid-scene.

Secondary criticism: the system's tactical depth is demonstrated more than synthesized. Individual examples are clear, but a comprehensive "tactical scenario" showing multiple systems interacting under pressure would help tactician-minded readers understand the emergent possibilities.

Would I run this system? Absolutely. Would I play in it? With enthusiasm. The system respects both strategic planning and improvisational response, which is exactly what I want from a game. It trusts players to make meaningful choices and GMs to create meaningful stakes.

For fellow tacticians who are also fiction-first evangelists: this is your system. It proves that tactical depth and narrative focus aren't opposites - they're complements. Razorweave gets that, and it shows on every page.`
};

// Validate against schema
ReviewDataSchema.parse(reviewData);

// Create the review in database
const rowId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096227-wt4jfff2c',
  reviewData: reviewData,
  agentExecutionTime: Date.now() - startTime
});

console.log('Review created with row ID:', rowId);

// Write markdown file
const outputPath = 'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096227-wt4jfff2c.md';

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 139991',
    personaArchetype: 'Tactician',
    personaExperience: 'Hybrid GM/Player',
    personaTraits: ['Evangelical', 'Complexity Tolerant'],
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
