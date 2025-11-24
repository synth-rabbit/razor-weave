#!/usr/bin/env npx tsx
/**
 * Executes the reviewer prompt for persona gen-1763913096259-goooz9ykd
 * Campaign: campaign-20251123-192801-j6p4e486
 */

import { getDatabase } from '../../../src/tooling/database/index.js';
import { CampaignClient, writeReviewMarkdown, ReviewDataSchema } from '../../../src/tooling/reviews/index.js';
import type { ReviewData } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

// Initialize database and client
const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Review data based on the persona profile:
// - Method Actor archetype (values deep characterization, immersive roleplay, staying in character)
// - Experienced (3-10 years) experience level
// - Fiction-First: Evangelical (strongly believes story should lead mechanics)
// - Narrative/Mechanics: Comfortable with Abstraction (doesn't need precise numbers)
// - GM Philosophy: Railroad Conductor (prefers structured/directed gameplay)
// - Genre Flexibility: Enjoys Flexibility (appreciates genre-agnostic systems)
// - Cognitive Style: Concrete Thinker (primary), Systems Integrator (secondary)

const reviewData: ReviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 9,
    practical_usability: 7
  },
  narrative_feedback: `After spending years at tables where I live and breathe my characters, this rulebook feels like it was written for people like me. The fiction-first philosophy isn't just lip service here - it's woven into every chapter, every example, every piece of guidance. When I read "Player Intent Drives Action" and "The GM Describes Outcomes, Not Numbers," I actually got a little emotional. Someone finally understands.

The core identity elements section in character creation is exactly what I need. It asks the right questions: not "what's your class" but "who is this person, what shapes them, what mannerisms do they have." The example character Rella demonstrates this beautifully - she's not defined by her stats but by her quiet observation, her steady hands from years of repair work, her origin in a canyon settlement. That's the foundation I build characters from.

I particularly appreciate how the system handles failure. "Failure Creates Momentum" - yes! When my character fails, I don't want the scene to stop dead. I want the story to bend in a new direction. The canal-jumping example where failure attracts guards rather than simply stopping progress shows the designers understand that failure is a storytelling opportunity, not a punishment.

The open Skills and Proficiencies lists are both a blessing and a challenge for me. As someone who thinks in concrete terms, I appreciate having frameworks and examples to work from. The lists give me enough structure to understand what's expected while leaving room to craft Skills that reflect my character's specific history. "What have you practiced enough to apply under stress" - that's the right question.

However, I have some concerns from a Method Actor perspective. The combat chapter, while mechanically sound, could use more guidance on how to stay in character during structured turns. When I'm deep in roleplay and suddenly we shift to "Strike, Maneuver, Set Up, or Defend/Withdraw," I feel a gear change that pulls me out of immersion. More examples of how to describe these actions in character voice would help.

The social interaction rules are well-designed but feel less developed than combat. As a Method Actor, social scenes are often where I shine - where my character's voice, mannerisms, and relationships come alive. I want more tools for extended social encounters, relationship mapping, and tracking the evolution of connections between characters. The negotiation and leverage section is good but brief.

The GM guidance sections are solid, though as someone who prefers structured play with a clear direction (I know, ironic given my immersion focus), I'd appreciate more tools for GMs who want to maintain narrative momentum while honoring player agency. The "Railroad Conductor" approach isn't bad - it means the GM has prepared meaningful content and keeps the story moving. I just need assurance the system supports that style too.

The Resolve Clock system instead of hit points is brilliant. It keeps combat tied to narrative stakes rather than abstract number depletion. When my character is fighting, I'm not thinking "I have 12 HP left" - I'm thinking "the pressure is mounting, my character is getting desperate." That's the kind of mechanical-narrative alignment I crave.`,

  issue_annotations: [
    {
      section: "Chapter 10: Combat Basics",
      issue: "Limited roleplay integration guidance during structured turns",
      impact: "Method Actors may experience immersion breaks when transitioning from freeform roleplay to structured combat actions. The action categories (Strike, Maneuver, etc.) are mechanically clear but could use more examples of how to describe them in character voice.",
      location: "Your Turn: Structure and Options subsection, Core Combat Actions subsection"
    },
    {
      section: "Chapter 11: Exploration and Social Play",
      issue: "Social mechanics less developed than exploration or combat",
      impact: "For Method Actors who thrive in social scenes, the current social interaction rules feel abbreviated compared to the detailed combat chapter. Multi-round negotiations exist but relationship tracking and character dynamics need more support.",
      location: "Social Interaction subsection, Negotiation and Leverage subsection"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Relationship mechanics introduced but not fully developed",
      impact: "Step Seven mentions 'Establish Background and Relationships' but the guidance on mechanically tracking and evolving relationships is thin. For deep character work, I want clearer frameworks for how relationships change over time.",
      location: "Step Seven: Establish Background and Relationships"
    },
    {
      section: "Chapter 9: Tags, Conditions, Clocks",
      issue: "Personal/emotional Conditions underrepresented",
      impact: "The Conditions examples focus heavily on physical states (Bleeding, Exhausted, Stunned). Emotional and psychological Conditions (Shaken, Torn, Mistrustful) would better support Method Actors tracking character emotional arcs.",
      location: "Examples of Common Conditions subsection"
    },
    {
      section: "Chapter 4: Core Principles of Play",
      issue: "Excellent principles but GM style flexibility unclear",
      impact: "The principles strongly emphasize player-driven, emergent play. While I embrace fiction-first, I also value GMs who prepare structured narratives. Clarification that both approaches can honor these principles would be reassuring.",
      location: "The Table Is a Creative Team, The GM Presents the World Honestly subsections"
    }
  ],

  overall_assessment: `The Razorweave Core Rulebook is a triumph of fiction-first design that speaks directly to my Method Actor heart. The philosophical alignment between the stated principles and the actual mechanics is remarkable - this isn't a system that pays lip service to story while hiding a tactical wargame underneath. The core resolution (4d6, outcome tiers, Clocks) genuinely supports narrative play.

Strengths: Character creation asks the right questions about identity before mechanics. The intent-and-approach framework ensures every action is grounded in character motivation. Failure creates momentum rather than stopping play. The Resolve Clock system keeps combat narratively meaningful. The flexible Skills and Proficiencies allow characters to be mechanically unique while staying grounded in fiction.

Weaknesses: Social mechanics, while present, don't receive the same detailed treatment as combat - a disappointment for someone who sees social scenes as prime roleplay territory. Relationship tracking needs more support. Combat transition guidance could help Method Actors maintain immersion during structured turns. Emotional/psychological Conditions are underrepresented.

For my playstyle - deep immersion, character voice, emotional arcs, fiction-first always - this is an excellent foundation. With a thoughtful GM and engaged table, I could run a profoundly satisfying campaign with this rulebook. The areas where I'd want more support (social depth, relationship mechanics, emotional states) could likely be added through optional rules or GM interpretation.

Recommendation: Highly recommended for tables that prioritize character and story over tactical optimization. Method Actors, Socializers, and fiction-first evangelicals will find a system that finally speaks their language. The experienced player who has bounced off crunchier systems will feel at home here.

Average Rating: 7.75/10`
};

// Validate review data against schema
ReviewDataSchema.parse(reviewData);

// Calculate execution time
const agentExecutionTime = Date.now() - startTime;

// Write review to database
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096259-goooz9ykd',
  reviewData: reviewData,
  agentExecutionTime: agentExecutionTime
});

console.log(`Review saved to database with ID: ${reviewId}`);

// Write markdown file
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 713764',
    personaArchetype: 'Method Actor',
    personaExperience: 'Experienced (3-10 years)',
    personaTraits: ['Evangelical', 'Concrete Thinker'],
    contentTitle: 'Book Review',
    reviewData: reviewData
  },
  'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096259-goooz9ykd.md'
);

console.log('Markdown review written to: data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096259-goooz9ykd.md');

// Print summary
console.log('\n=== REVIEW SUMMARY ===');
console.log(`Persona: Generated Persona 713764 (Method Actor/Experienced)`);
console.log(`Campaign: campaign-20251123-192801-j6p4e486`);
console.log('\nRatings:');
console.log(`  - Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`  - Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`  - Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`  - Practical Usability: ${reviewData.ratings.practical_usability}/10`);
console.log(`\nIssue Annotations: ${reviewData.issue_annotations.length} issues identified`);
console.log(`Execution Time: ${agentExecutionTime}ms`);
