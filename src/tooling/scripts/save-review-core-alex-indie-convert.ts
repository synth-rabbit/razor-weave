import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CampaignClient } from '../reviews/campaign-client.js';
import { writeReviewMarkdown } from '../reviews/markdown-writer.js';
import { ReviewDataSchema } from '../reviews/schemas.js';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

// Review Data from Alex the Indie Convert's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 10,
    practical_usability: 8
  },
  narrative_feedback: `Oh wow, where do I even start? This is exactly the kind of rulebook I wish I had discovered when I was first making the jump from traditional games to more narrative-focused play. The "fiction first" philosophy isn't just lip service here - it's baked into every chapter, every example, every piece of guidance.

What really gets me excited is how the system handles the conversation between mechanics and narrative. The 4d6 resolution with Edge/Burden feels elegant without being fiddly. I've played systems that claim to be fiction-first but then bury you in modifier math - this one actually delivers. The DC ladder is intuitive (I could teach this to my Wednesday night group in about five minutes), and the way Tags and Conditions flow naturally from the fiction rather than feeling like status effects bolted on from a video game? Chef's kiss.

The Character Creation chapter speaks my language. Starting with concept before numbers, building identity elements, letting Skills and Proficiencies emerge from who the character IS rather than what they can mechanically DO - this is the kind of thoughtful design that respects both story and structure. I love that the example character Rella has genuine personality, not just a stat block.

The GM guidance throughout is superb. Chapter 21 on Running Sessions reads like a conversation with a wise friend who actually runs games, not a corporate manual. The "Three Questions" approach (What do NPCs want? What do players care about? What happens if no one acts?) - I'm absolutely stealing that for my own sessions.

Combat using Resolve Clocks instead of hit points is inspired. It keeps fights dramatic and paced like actual stories, not attrition wars. The core combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) map beautifully to how I already think about action scenes.

If I'm being picky - and I always am with systems I care about - I'd love to see more examples of how different genres (the book mentions cozy, horror, sci-fi) actually play differently at the table. The framework is clearly flexible, but a few more worked examples of tone calibration would help newer GMs.

This is a system I'd actually run, not just read and admire. That's the highest compliment I can give.`,
  issue_annotations: [
    {
      section: "Chapter 1 - Welcome to the Game",
      issue: "Minor formatting inconsistency with '**Game Master**' - the asterisks are missing a space before 'Game Master'",
      impact: "Very low - cosmetic issue that doesn't affect comprehension",
      location: "Chapter 1, paragraph 3"
    },
    {
      section: "Chapter 4 - Core Principles of Play",
      issue: "Duplicate '**Example**' labels in example boxes (shows 'Example Example' pattern)",
      impact: "Low - creates visual noise but content is clear",
      location: "Multiple example boxes in Chapter 4 (lines 22-23, 64-65, 94-95)"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "Limited guidance on GMless and Solo play compared to traditional GM'd play",
      impact: "Medium - these play modes are mentioned but lack the detailed procedural support found in other chapters",
      location: "Chapter 5, GMless Cooperative Play and Solo Play sections"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The relationship between Proficiencies and Checks could be clearer - it says they 'often do not require a roll' but the mechanics of when they apply vs modify is ambiguous",
      impact: "Medium - experienced players will intuit this, but explicit guidance would help",
      location: "Chapter 6 (Proficiencies) and Chapter 8 (Checks) interaction"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Typo: 'Manege position' should be 'Manage position'",
      impact: "Low - clear typo but doesn't impede understanding",
      location: "Chapter 10, Positioning and Environment section, line 181"
    },
    {
      section: "Cross-Genre Examples",
      issue: "While the book mentions genre flexibility throughout, concrete examples of how the same mechanics feel different across cozy/horror/sci-fi genres are sparse",
      impact: "Medium - would significantly help GMs calibrate tone for their specific campaigns",
      location: "Throughout - particularly Chapters 4, 8, 10, and 21"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is an impressive achievement in fiction-first game design. It successfully bridges the gap between narrative-focused indie games and more structured traditional systems without sacrificing the strengths of either approach.

For players like me - evangelists for the narrative gaming revolution who still appreciate well-designed mechanical scaffolding - this book delivers exactly what it promises. The resolution system is elegant, the character creation is story-driven, and the GM guidance is genuinely useful rather than generic advice.

The system's greatest strength is its consistency of vision. From the opening chapter to the detailed GM tools, everything reinforces the core principle that story comes first and mechanics serve the fiction. The Tags, Conditions, and Clocks framework is particularly well-designed, providing narrative weight without mechanical bloat.

Areas for improvement are minor: better genre differentiation examples, clearer Proficiency/Check interaction, and more developed alternative play mode support. None of these prevent the book from being immediately usable.

I would confidently recommend this to any player or GM looking for a system that takes narrative gaming seriously while providing enough mechanical structure to feel satisfying. This is the kind of rulebook that could convert skeptics and delight enthusiasts alike.

Rating Summary:
- Clarity & Readability: 9/10 - Exceptionally well-written with clear organization
- Rules Accuracy: 8/10 - Consistent internal logic with minor ambiguities
- Persona Fit: 10/10 - Perfect match for narrative-focused experienced players
- Practical Usability: 8/10 - Ready to play with excellent table reference potential`
};

// Validate the review data
ReviewDataSchema.parse(reviewData);
console.log('Review data validated successfully');

// Connect to the razorweave database
const dbPath = join(projectRoot, 'data', 'razorweave.db');
const db = new Database(dbPath);

// Create campaign client and save review
const campaignClient = new CampaignClient(db);

// First, ensure the campaign exists (create if needed for this review)
const existingCampaign = campaignClient.getCampaign('campaign-20251121-202921-q96njych');
if (!existingCampaign) {
  // Create the campaign record
  const createStmt = db.prepare(`
    INSERT INTO review_campaigns (
      id, campaign_name, content_type, content_id,
      persona_selection_strategy, persona_ids, status, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  createStmt.run(
    'campaign-20251121-202921-q96njych',
    'Core Rulebook Review Campaign',
    'book',
    'book-49b2d22f75f2',
    'all_core',
    JSON.stringify(['core-alex-indie-convert']),
    'in_progress',
    null
  );
  console.log('Created campaign record');
}

// Create the persona review
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251121-202921-q96njych',
  personaId: 'core-alex-indie-convert',
  reviewData,
  agentExecutionTime: Date.now()
});

console.log(`Created persona review with ID: ${reviewId}`);

// Write the markdown file
const markdownPath = join(projectRoot, 'data/reviews/raw/campaign-20251121-202921-q96njych/core-alex-indie-convert.md');
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251121-202921-q96njych',
    personaName: 'Alex the Indie Convert',
    personaArchetype: 'Storyteller',
    personaExperience: 'Experienced (3-10 years)',
    personaTraits: ['Evangelical', 'Intuitive', 'Fiction-First', 'Collaborative Storyteller'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  markdownPath
);

console.log(`Wrote review markdown to: ${markdownPath}`);

// Close database
db.close();

console.log('Review saved successfully');
