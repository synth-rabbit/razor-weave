#!/usr/bin/env npx tsx
/**
 * Executes the reviewer prompt for persona gen-1763913096262-v9topcggq
 * Campaign: campaign-20251123-192801-j6p4e486
 *
 * Persona Profile:
 * - Name: Generated Persona 710590
 * - Archetype: Storyteller
 * - Experience: Veteran (10-20 years)
 * - Fiction-First: Native (fiction-first is natural)
 * - Narrative/Mechanics: Needs Concrete Numbers (wants clear mechanical anchors)
 * - GM Philosophy: Collaborative Storyteller
 * - Cognitive Style: Analytical (primary), Intuitive (secondary)
 */

import { getDatabase } from '../../../src/tooling/database/index.js';
import { CampaignClient, writeReviewMarkdown, ReviewDataSchema } from '../../../src/tooling/reviews/index.js';
import type { ReviewData } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

// Initialize database and client
const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Review data based on the persona profile:
// - Storyteller archetype (values narrative flow, character development, dramatic moments)
// - Veteran (10-20 years) experience level
// - Fiction-First: Native (instinctively plays fiction-first, doesn't need convincing)
// - Narrative/Mechanics: Needs Concrete Numbers (wants clear mechanical reference points)
// - GM Philosophy: Collaborative Storyteller (builds narrative with players, not at them)
// - Cognitive Style: Analytical (examines systems deeply, looks for patterns)

const reviewData: ReviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 9,
    practical_usability: 7
  },
  narrative_feedback: `After two decades at the table, I've seen a lot of systems come and go. Razorweave lands in a space I've been looking for: it speaks my language of fiction-first play while still giving me the mechanical scaffolding I need to keep things grounded.

The writing is confident and clear. Part I establishes the philosophy without being preachy, and the Core Principles chapter articulates exactly what I've learned through hard experience: the table is a creative team, failure creates momentum, and trust is everything. Reading this felt like a conversation with a fellow veteran who's internalized the same lessons.

The 4d6 resolution system is elegant. Rolling four dice and taking the sum gives a satisfying curve, and the DC ladder from 12-22 is immediately usable. I particularly appreciate that the outcome tiers (Critical Success, Full Success, Partial Success, Failure, Critical Failure) are defined by margin rather than arbitrary thresholds. This is how I've always wanted resolution to work - the numbers mean something narratively.

Where the book excels is in its treatment of intent and approach. Chapter 8's explanation of how players should declare what they're trying to achieve and how they're going about it mirrors my own best practices. The canal-jumping example that demonstrates how even failure advances the story rather than stopping it? That's exactly the kind of teaching example I'd use with new players.

However - and this is where my need for concrete numbers shows up - I found myself hunting for specific mechanical details in several places. The Clock system is well-conceived, but the rules for when and how many segments to tick are scattered across multiple chapters. I wanted a single, definitive reference. Similarly, Condition stacking rules required me to piece together information from different sections. For someone who's analytical about systems, these gaps create friction.

The Skills and Proficiencies chapters (14-17) represent a philosophical choice I respect but have mixed feelings about. The open-ended lists align with fiction-first principles, but my analytical side wanted at least a recommended starter set for each attribute. The examples provided are helpful, but I know some players at my table would be paralyzed by the apparent open-endedness.

The GM section (Part III) is where the book really shines for my playstyle. The chapters on running sessions and campaigns read like wisdom hard-won from actual play. The Fronts system for tracking world pressure is exactly the kind of tool I've cobbled together from other systems over the years. Having it integrated here, with clear procedures, is valuable.

One area that needs attention for Storyteller archetypes: the Combat chapter treats combat as "just another scene," which I philosophically agree with, but the mechanical support for social encounters and dramatic confrontations that aren't physical combat feels thin. I run a lot of scenes where the tension is interpersonal rather than violent, and I wanted more structured guidance there.

The glossary and index are comprehensive and well-organized. This is a book I can reference quickly at the table, which matters enormously after all these years.`,

  issue_annotations: [
    {
      section: "Chapter 9: Tags, Conditions, Clocks",
      issue: "Clock advancement procedures distributed across multiple sections",
      impact: "Analytical readers must cross-reference multiple chapters to understand the complete Clock subsystem, creating unnecessary cognitive load during play",
      location: "Section 'Advancing Clocks' and references in Chapter 8 'Checks and Clocks'"
    },
    {
      section: "Chapter 9: Tags, Conditions, Clocks",
      issue: "Condition stacking rules not explicitly stated",
      impact: "Veterans who need concrete numbers cannot quickly determine whether multiple instances of the same Condition compound or overlap",
      location: "Section 'Tags vs. Conditions' - missing explicit stacking rules"
    },
    {
      section: "Chapter 14-17: Skills and Proficiencies",
      issue: "No recommended starter set despite open-ended design",
      impact: "While flexibility serves fiction-first play, the lack of a curated 'quick start' list may paralyze players who want guidance before customizing",
      location: "Introduction to Skills chapter, before the open lists begin"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Social and dramatic conflicts lack equivalent mechanical depth",
      impact: "Storyteller archetypes who run interpersonal drama as frequently as physical combat have less mechanical support for non-violent tension",
      location: "Combat chapter - no parallel 'Social Conflict' or 'Dramatic Confrontation' procedures"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Starting gear guidelines remain vague",
      impact: "Step Six mentions determining starting gear but provides minimal concrete guidance, leaving GMs to improvise standards",
      location: "Step Six: Determine Starting Gear - lacks example loadouts or default guidelines"
    },
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "Margin calculation examples could be more varied",
      impact: "While the basic procedure is clear, edge cases (very high or very low margins) aren't illustrated, requiring GM interpretation",
      location: "Section 'Rolling 4d6 and Calculating Margin' - limited example range"
    }
  ],

  overall_assessment: `The Razorweave Core Rulebook is a mature, well-written system that will feel immediately comfortable to veteran players who've developed fiction-first instincts over years of play. The 4d6 resolution system, DC ladder, and outcome tiers form a cohesive mechanical backbone that supports rather than constrains narrative play.

Strengths: The philosophical coherence is remarkable - every chapter reinforces the core principles without becoming repetitive. The writing respects experienced readers while remaining accessible. The GM section provides practical tools (Fronts, scenario design, NPC/VPC guidance) that demonstrate real play experience. The outcome tier system elegantly connects mechanical results to narrative consequences.

Weaknesses: The book occasionally sacrifices precision for flexibility in ways that frustrate analytical readers who need concrete numbers. Clock advancement, Condition stacking, and starting equipment could all benefit from more explicit rules or at least recommended defaults. Social and dramatic conflict procedures feel underdeveloped compared to physical combat, which seems inconsistent with the fiction-first ethos.

Recommendation: This is an excellent system for experienced tables that want a fiction-first foundation with mechanical depth. Veterans who've developed collaborative storytelling instincts will find their practices validated and systematized. However, readers who need explicit mechanical answers to every edge case may find some gaps. The book assumes a level of GM confidence that comes with experience.

For a Storyteller archetype with 15+ years at the table, this is exactly the kind of system I've been looking for - one that trusts me to adjudicate while giving me tools that actually help. The issues I've noted are refinements rather than fundamental flaws.

Average Rating: 7.75/10`
};

// Validate review data against schema
ReviewDataSchema.parse(reviewData);

// Calculate execution time
const agentExecutionTime = Date.now() - startTime;

// Write review to database
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-192801-j6p4e486',
  personaId: 'gen-1763913096262-v9topcggq',
  reviewData: reviewData,
  agentExecutionTime: agentExecutionTime
});

console.log(`Review saved to database with ID: ${reviewId}`);

// Write markdown file
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-192801-j6p4e486',
    personaName: 'Generated Persona 710590',
    personaArchetype: 'Storyteller',
    personaExperience: 'Veteran (10-20 years)',
    personaTraits: ['Native', 'Analytical'],
    contentTitle: 'Book Review',
    reviewData: reviewData
  },
  'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096262-v9topcggq.md'
);

console.log('Markdown review written to: data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096262-v9topcggq.md');

// Print summary
console.log('\n=== REVIEW SUMMARY ===');
console.log(`Persona: Generated Persona 710590 (Storyteller/Veteran (10-20 years))`);
console.log(`Campaign: campaign-20251123-192801-j6p4e486`);
console.log('\nRatings:');
console.log(`  - Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`  - Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`  - Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`  - Practical Usability: ${reviewData.ratings.practical_usability}/10`);
console.log(`\nIssue Annotations: ${reviewData.issue_annotations.length} issues identified`);
console.log(`Execution Time: ${agentExecutionTime}ms`);
