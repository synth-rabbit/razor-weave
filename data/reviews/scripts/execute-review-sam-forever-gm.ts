#!/usr/bin/env npx tsx
/**
 * Review Script: Sam the Forever GM
 * Campaign: campaign-20251124-010827-3hy9kg3y
 * Persona: core-sam-forever-gm (Explorer/Forever GM)
 */

import { getDatabase } from '../../../src/tooling/database/index.js';
import { CampaignClient, writeReviewMarkdown, ReviewDataSchema } from '../../../src/tooling/reviews/index.js';
import type { ReviewData } from '../../../src/tooling/reviews/schemas.js';

const startTime = Date.now();

// Initialize database and client
const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

// Define review data as Sam the Forever GM
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 9,
    persona_fit: 9,
    practical_usability: 8
  },
  narrative_feedback: `As someone who's been running games for years across countless systems and genres, this rulebook immediately speaks my language. The fiction-first approach isn't just marketing—it's woven into every mechanical explanation. I appreciate how the book consistently frames rules as tools rather than mandates.

The GM section (Part III) is particularly strong. Chapter 21's guidance on session pacing, the "Three Questions" framework for when you're stuck, and the explicit discussion of safety tools mid-session shows mature design thinking. The emphasis on "consequences, not punishments" resonates deeply with my collaborative storytelling approach.

The Resolve Clock system instead of hit points is elegant and supports exactly the kind of flexible, narrative-driven conflicts I enjoy running. Being able to size clocks for different threat levels and define what "taken out" means per-scene is brilliant for genre-fluid play.

One area where I'd love more depth: the GMless cooperative play section feels underdeveloped compared to the robust GM-facing tools. Given the book's emphasis on shared authority and collaboration, expanding those procedures would strengthen the whole package.

The open Skills and Proficiencies system with GM collaboration is exactly right for my games—I can adapt this to weird west, cosmic horror, or cyberpunk without fighting the system. The book trusts experienced tables to make good choices rather than constraining everything into rigid lists.`,
  issue_annotations: [
    {
      section: "Chapter 5: Ways to Play",
      issue: "GMless Cooperative Play section is thin on actual procedures",
      impact: "GMs interested in shared authority modes lack concrete tools compared to traditional GM sections",
      location: "Section 'ways-to-play-gmless-cooperative'"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "The 'Before Skills and Proficiencies' section could be expanded with more examples of custom entries",
      impact: "New players to collaborative character creation might want more scaffolding",
      location: "Section 'before-skills-proficiencies'"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Initiative options could include more concrete examples of when to use each approach",
      impact: "Minor - GMs might need a session or two to find their preferred ordering method",
      location: "Section 'turns-and-order'"
    },
    {
      section: "Part III: GM Section",
      issue: "Solo play tools mentioned but not deeply integrated with the GM guidance",
      impact: "Forever GMs who occasionally run solo sessions would benefit from unified guidance",
      location: "Cross-reference between chapters 5 and 21-26"
    }
  ],
  overall_assessment: `This is an excellent rulebook that delivers on its fiction-first promise. The internal consistency is remarkable—every mechanic connects to the core 4d6 resolution and the Attribute/Skill/Proficiency framework in predictable ways. As a systems integrator who runs games across many genres, I can immediately see how to apply this to different settings.

The GM tools are outstanding: Clocks and Tags provide visual, shareable state that keeps everyone aligned. The guidance on session pacing, scene framing, and outcome interpretation shows practical wisdom. The emphasis on "speak your mechanics" and making Tags/Conditions visible in play aligns with modern best practices.

For Forever GMs like myself, this book respects our experience while providing clear frameworks. It doesn't over-explain or patronize, but it also doesn't assume tribal knowledge. The writing is clear, the examples are useful, and the organization makes mid-session reference practical.

Minor concerns: GMless procedures need expansion, and some edge cases around multi-phase conflicts could use more worked examples. But these are enhancement opportunities, not fundamental issues.

**Verdict: Highly recommended for experienced GMs seeking a flexible, genre-agnostic system with strong fiction-first principles. This is a book I'll actually use at the table.**`
};

// Validate and type the review data
const typedReviewData: ReviewData = ReviewDataSchema.parse(reviewData);

// Campaign and persona info
const campaignId = 'campaign-20251124-010827-3hy9kg3y';
const personaId = 'core-sam-forever-gm';

// Calculate execution time
const agentExecutionTime = Date.now() - startTime;

// Write review to database using CampaignClient
const reviewId = campaignClient.createPersonaReview({
  campaignId: campaignId,
  personaId: personaId,
  reviewData: typedReviewData,
  agentExecutionTime: agentExecutionTime
});

console.log(`Review saved to database with ID: ${reviewId}`);

// Write markdown file using the built-in writer
writeReviewMarkdown(
  {
    campaignId: campaignId,
    personaName: 'Sam the Forever GM',
    personaArchetype: 'Explorer',
    personaExperience: 'Forever GM',
    personaTraits: ['Native', 'Systems Integrator'],
    contentTitle: 'Book Review',
    reviewData: typedReviewData
  },
  'data/reviews/raw/campaign-20251124-010827-3hy9kg3y/core-sam-forever-gm.md'
);

console.log('Markdown review written to: data/reviews/raw/campaign-20251124-010827-3hy9kg3y/core-sam-forever-gm.md');

// Print summary
console.log('\n=== REVIEW SUMMARY ===');
console.log(`Persona: Sam the Forever GM (Explorer/Forever GM)`);
console.log(`Campaign: ${campaignId}`);
console.log('\nRatings:');
console.log(`  - Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`  - Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`  - Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`  - Practical Usability: ${reviewData.ratings.practical_usability}/10`);
console.log(`\nIssue Annotations: ${reviewData.issue_annotations.length} issues identified`);
console.log(`Execution Time: ${agentExecutionTime}ms`);
