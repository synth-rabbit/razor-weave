// Execute reviewer prompt: gen-1763913096238-5o0cw8g8m
// Persona: Generated Persona 183611 (Killer / Veteran)

import { getDatabase } from '../../../src/tooling/database/client.js';
import { CampaignClient } from '../../../src/tooling/reviews/campaign-client.js';
import { writeReviewMarkdown } from '../../../src/tooling/reviews/markdown-writer.js';
import { ReviewDataSchema } from '../../../src/tooling/reviews/schemas.js';
import type { ReviewData } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

// Initialize database
const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Review data from persona perspective
// Killer archetype, Veteran experience, Fiction-First Native, Wary of Abstraction, Pattern-Driven
const reviewData: ReviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `Twenty years in this hobby. I've played everything from first edition AD&D through to the latest PbtA darlings. When I sit down at a table, I want to win. Not just "tell a good story" - I want tactical challenges where my decisions matter and my mastery of the system pays off. So when I cracked open Razorweave, I came in skeptical but curious.

The combat chapter surprised me. The Resolve Clock system is actually elegant - I can see the progress, I can calculate when threats will drop, and the tactical triad of Strike/Maneuver/Set Up gives me real decisions to make. The advice about Set Up creating Advantage before committing to repeated Strikes? That's the kind of tactical depth I want. The book even acknowledges that against higher-tier threats, you need to soften them up first. Good. That's pattern-based thinking I can work with.

But here's where my "wary of abstraction" kicks in: the DC system is fiction-dependent. The GM sets DCs based on "fictional positioning" rather than fixed encounter ratings. For a veteran Killer like me, this is frustrating. I've learned to read systems, to find the optimal plays. When the difficulty literally depends on a conversation with my GM about what makes sense in the fiction, I lose my ability to predict outcomes and plan accordingly.

The Advantage/Disadvantage system using 5d6 keep 4 (or 3d6 keep 4) is mathematically clean. I ran the numbers - the probability curves work out well, and there's real tactical value in stacking Advantage versus just charging in. The margin system (Critical +5, Full 0+, Partial -1 to -2, Failure -3 or worse) gives me concrete benchmarks I can plan around.

What I appreciate is the "What does taken out mean" discussion before fights. As a Killer, I care about the stakes. Kill, capture, rout, or delay - knowing this upfront lets me calibrate my tactics. Too many narrative games hand-wave this, and then you get table arguments when someone expects lethality and someone else expects cartoon violence.

The condition system is solid. Physical conditions like Bleeding and Exhausted have clear triggers and clear recovery paths. I can track these, plan around them, exploit them in opponents. The escalation from light to moderate to severe injuries gives me a damage model I can mentally simulate, even without hit point granularity.

Where the system loses me is the open-ended Skills and Proficiencies. "Work with your GM to define custom entries" is the opposite of pattern-driven optimization. I can't theorycraft builds. I can't compare notes with other players about what's effective. Every table will have different skill lists, making the entire optimization space undefined. For a Killer archetype who wants to master the system, this is a significant weakness.

The Turn structure is fine - move, main action, maybe a minor thing. Standard enough. But "conversational order" and "popcorn order" instead of initiative? I get why narrative games do this, but as someone who wants to plan three turns ahead, not knowing when I'll act makes tactical planning harder. The book offers "initiative (optional)" which I'd always take, but it's clearly presented as the non-default option.

I will say the combat actions are well-designed for creating tactical texture. Maneuver for position control, Set Up for creating advantage, Defend for recovery - there's enough here that combat isn't just "I hit it again." The fiction-first framing actually helps here: when I describe shoving someone off high ground, the mechanical effect (Prone condition, lost action to stand) follows naturally. That's good design that doesn't sacrifice tactical depth.

The writing is clear and the examples help. The book respects my intelligence as a veteran without drowning me in jargon. Rules references are easy to find, and the chapter organization makes sense.`,
  issue_annotations: [
    {
      section: "Setting DCs",
      issue: "DCs are set by GM based on fictional positioning rather than fixed encounter ratings",
      impact: "Pattern-driven players cannot predict challenge difficulty or plan optimal approaches without GM negotiation",
      location: "Chapter 8, Actions, Checks, and Outcomes"
    },
    {
      section: "Step Four: Choose Skills / Step Five: Choose Proficiencies",
      issue: "Open-ended skill/proficiency creation with no standard list",
      impact: "Impossible to theorycraft or compare builds; optimization space is undefined across tables",
      location: "Chapter 6, Character Creation"
    },
    {
      section: "Turns and Order",
      issue: "Default turn order methods (conversational, popcorn) are unpredictable",
      impact: "Multi-turn tactical planning is difficult when turn order is fluid; initiative is optional rather than default",
      location: "Chapter 10, Combat Basics"
    },
    {
      section: "Resolve Clock sizing",
      issue: "Clock segment counts vary by threat tier and GM discretion",
      impact: "Cannot calculate expected rounds to defeat enemies without GM revealing clock size mid-combat",
      location: "Chapter 10, Resolve Instead of Hit Points"
    },
    {
      section: "Attribute Advancement",
      issue: "Attribute cap and advancement frequency are left to table agreement",
      impact: "Character power trajectory is unpredictable; cannot plan long-term build progression",
      location: "Chapter 19, Advancement and Long Term Growth"
    }
  ],
  overall_assessment: `As a veteran Killer, Razorweave is a mixed bag. The tactical core is sound - the Strike/Maneuver/Set Up triad creates real decisions, the Advantage system rewards preparation, and the Condition tracking gives me levers to pull. I can work with Resolve Clocks instead of hit points; the visible progress actually helps me read the battlefield.

But the system's fiction-first DNA creates friction with my pattern-driven playstyle. When DCs, skill lists, and advancement rates all depend on table negotiation rather than fixed rules, I lose my ability to master the system independent of any specific GM. I can't read the optimization space. I can't come to the table with a plan that I know will work.

The Persona Fit score of 6 reflects this tension. I can play this game and enjoy the tactical elements. I'll probably push for initiative rolls and ask my GM to use consistent DC benchmarks. But this isn't a system designed for Killers - it's designed for collaborative storytellers who want some tactical texture, not for players who want to win through system mastery.

For veterans who share my playstyle, I'd recommend Razorweave for shorter campaigns or one-shots where the tactical depth provides novelty, but caution against long campaigns where the undefined optimization space will frustrate. If your table agrees on consistent house rules for DCs and skills, the core engine is solid enough to support serious tactical play.

Practical usability is good - the book is well-organized, rules are findable, and the writing doesn't waste my time. Rules accuracy is high; I didn't find internal contradictions. Clarity is strong for what's actually defined; the ambiguity is by design, not by accident.`
};

// Validate the review data
ReviewDataSchema.parse(reviewData);

// Create the persona review in the database
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096238-5o0cw8g8m',
  reviewData,
  agentExecutionTime: Date.now() - startTime
});

console.log(`Created persona review with ID: ${reviewId}`);

// Write the markdown file
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 183611',
    personaArchetype: 'Killer',
    personaExperience: 'Veteran (10-20 years)',
    personaTraits: ['Native', 'Pattern-Driven'],
    contentTitle: 'Book Review',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096238-5o0cw8g8m.md'
);

console.log('Wrote markdown file to: data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096238-5o0cw8g8m.md');

// Output summary
console.log('\n=== Review Summary ===');
console.log(`Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`Practical Usability: ${reviewData.ratings.practical_usability}/10`);
console.log(`\nIssue Annotations: ${reviewData.issue_annotations.length}`);
console.log(`Execution Time: ${Date.now() - startTime}ms`);

db.close();
