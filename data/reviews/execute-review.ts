#!/usr/bin/env npx tsx
/**
 * Executes the reviewer prompt for persona gen-1763913096247-y7df2vwog
 * Campaign: campaign-20251123-192801-j6p4e486
 */

import { getDatabase } from '../../src/tooling/database/index.js';
import { CampaignClient, writeReviewMarkdown, ReviewDataSchema } from '../../src/tooling/reviews/index.js';
import type { ReviewData } from '../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

// Initialize database and client
const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Review data based on the persona profile:
// - Socializer archetype (values character interaction, roleplay, collaborative storytelling)
// - Early Intermediate (1-3 years) experience level
// - Fiction-First: Evangelical (strongly believes story should lead mechanics)
// - Narrative/Mechanics: Needs Concrete Numbers (wants clear numeric guidelines)
// - GM Philosophy: Prepared Sandbox (expects GM to have world ready but allow exploration)
// - Genre Flexibility: Enjoys Flexibility (appreciates genre-agnostic systems)
// - Cognitive Style: Intuitive (grasps concepts quickly, may skip details)

const reviewData: ReviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 8,
    practical_usability: 7
  },
  narrative_feedback: `As someone who's been playing tabletop games for about two years now, I found this rulebook really spoke to how I like to play. The "fiction first" philosophy that runs through every chapter? That's exactly what I've been looking for. When I'm at the table, I want to build stories with my friends, not argue about modifiers.

The writing style is conversational and approachable. I didn't feel like I was reading a textbook - more like someone experienced was explaining the game to me over coffee. The examples scattered throughout really helped me visualize how play actually flows at the table. The canal-jumping example where failure leads to attracting guards? Perfect illustration of how failure keeps the story moving rather than stopping it.

I especially appreciated the emphasis on "the table is a creative team" - that's the energy I want in my games. The chapter on Core Principles of Play captured everything I believe about what makes TTRPGs special. Trust, collaboration, shared storytelling - it's all there.

However, and this is important for me, I sometimes found myself wanting more concrete numbers. The DC ladder is clear (12-22, love it), but when it came to things like "when does a Clock tick?" or "how many Conditions can stack?", I had to piece things together from multiple chapters. For someone like me who grasps concepts intuitively but needs solid numbers to feel confident, a few more explicit "this is the number" statements would help.

The four Attributes system (MIG, AGI, PRE, RSN) is elegant and easy to remember. The open Skills and Proficiencies lists worried me at first - I like having clear options - but the examples and the explanation of how GMs approve custom entries helped ease that concern.

The glossary at the end is a lifesaver. I found myself flipping to it constantly, and it's well-organized. The printable sheets are exactly what I need to run sessions without constantly referencing the book.

Overall, this is a rulebook I'd happily bring to my group. It matches how I want to play and gives me enough structure to feel confident while leaving room for the collaborative storytelling I love.`,

  issue_annotations: [
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "Clock advancement rules spread across multiple sections",
      impact: "Had to read several chapters to understand when and how many segments to tick - confusing for a player who wants clear procedures",
      location: "Checks and Clocks subsection, also referenced in Chapter 9"
    },
    {
      section: "Chapter 14-17: Skills and Proficiencies Reference",
      issue: "Open-ended lists may overwhelm new-intermediate players",
      impact: "While flexibility is appreciated, the lack of a 'starter set' of recommended Skills for beginners makes character creation feel daunting",
      location: "Introduction to Skills chapter, Before You Choose section"
    },
    {
      section: "Chapter 9: Tags, Conditions, Clocks",
      issue: "Condition stacking rules not immediately clear",
      impact: "As someone who needs concrete numbers, I couldn't quickly find whether multiple instances of the same Condition stack or not",
      location: "Tags vs. Conditions subsection"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Social combat integration mentioned but not detailed",
      impact: "For a Socializer archetype, I wanted more mechanical support for social encounters that feel as structured as physical combat",
      location: "Combat chapter, relationship to social scenes unclear"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Starting gear guidelines vague",
      impact: "Step Six mentions 'Determine Starting Gear' but the actual guidance on what constitutes reasonable starting equipment is thin",
      location: "Step Six: Determine Starting Gear"
    }
  ],

  overall_assessment: `The Razorweave Core Rulebook is a well-written, philosophically coherent system that aligns beautifully with fiction-first, collaborative play styles. For an early intermediate player like myself who values social play and storytelling over tactical complexity, this book delivers on its promises.

Strengths: The core resolution system (4d6, DC ladder, outcome tiers) is elegant and learnable. The writing is warm and accessible. The emphasis on "failure creates momentum" and "partial success is a core story beat" matches how I want games to feel. The printable sheets and glossary make actual play preparation smooth.

Weaknesses: The book occasionally sacrifices precision for flexibility. While I appreciate the fiction-first ethos, my need for concrete numbers means I spent extra time hunting for specific mechanical answers. The open Skills/Proficiencies system, while narratively freeing, could benefit from a curated "quick start" list for players who want guidance.

Recommendation: This is a strong rulebook for tables that prioritize collaborative storytelling and are comfortable with GM adjudication. Players who need exhaustive mechanical detail may find gaps, but for my playstyle - social, intuitive, story-focused - this is exactly the kind of system I've been looking for.

Average Rating: 7.5/10`
};

// Validate review data against schema
ReviewDataSchema.parse(reviewData);

// Calculate execution time
const agentExecutionTime = Date.now() - startTime;

// Write review to database
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096247-y7df2vwog',
  reviewData: reviewData,
  agentExecutionTime: agentExecutionTime
});

console.log(`Review saved to database with ID: ${reviewId}`);

// Write markdown file
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 578134',
    personaArchetype: 'Socializer',
    personaExperience: 'Early Intermediate (1-3 years)',
    personaTraits: ['Evangelical', 'Intuitive'],
    contentTitle: 'Book Review',
    reviewData: reviewData
  },
  'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096247-y7df2vwog.md'
);

console.log('Markdown review written to: data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096247-y7df2vwog.md');

// Print summary
console.log('\n=== REVIEW SUMMARY ===');
console.log(`Persona: Generated Persona 578134 (Socializer/Early Intermediate)`);
console.log(`Campaign: campaign-20251123-192801-j6p4e486`);
console.log('\nRatings:');
console.log(`  - Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`  - Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`  - Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`  - Practical Usability: ${reviewData.ratings.practical_usability}/10`);
console.log(`\nIssue Annotations: ${reviewData.issue_annotations.length} issues identified`);
console.log(`Execution Time: ${agentExecutionTime}ms`);
