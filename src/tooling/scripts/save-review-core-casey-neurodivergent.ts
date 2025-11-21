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

// Review Data from Casey the Neurodivergent Player's perspective
// Casey is a Pattern-Driven Puzzle Solver with Early Intermediate experience (1-3 years)
// They are Curious about fiction-first, Wary of Abstraction, prefer Focused Systems, and are Non-GM
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 6
  },
  narrative_feedback: `So I've been going through this rulebook looking for the patterns - how things connect, what triggers what, where the consistent rules live. And there ARE patterns here, which I appreciate. The 4d6 + Attribute + Skill against DC structure is clean and predictable. I can map that in my head. The outcome tiers (Critical Success down to Critical Failure based on margin) form a reliable ladder I can reference.

The DC table on page... somewhere... it's DC 12 Easy, 14 Routine, 16 Tough, 18 Hard, 20 Heroic, 22 Legendary. That's a pattern I can memorize. Good.

But here's where my brain starts getting frustrated: the fiction-first philosophy keeps saying "the GM decides" and "it depends on the situation." I understand WHY they're doing this - flexibility is good - but I need more anchor points. When does a Proficiency give Edge versus just lowering DC versus just letting you skip the roll entirely? The book says all three can happen but doesn't give me a clear decision tree. I've read Chapter 6 and Chapter 8 multiple times trying to find the pattern, and it keeps bouncing back to "GM judgment."

The Tags and Conditions system is actually really satisfying for my brain. Tags are environmental (Dim Light, Slick, Cramped). Conditions are on characters (Exhausted, Bleeding, Frightened). They affect Edge/Burden or DC or what's possible. That's a clean taxonomy I can work with. I like how they're categorized - Environmental Tags, Situational Tags, Atmospheric Tags. Conditions have clear triggers and clearing mechanisms. This is the kind of structure I crave.

Clocks are brilliant. Visual progress trackers with segments. Fill them to trigger outcomes. Racing Clocks create tension. This is concrete and predictable. I can SEE the game state.

The Character Creation flow is well-structured: nine steps in order. Step 1 Concept, Step 2 Identity, Step 3 Attributes (2/1/1/0 spread), then Skills, Proficiencies, Gear, Background, Goals, Final Review. Having a numbered sequence helps me know where I am in the process.

Combat structure is where I start struggling again. The book offers three different turn order methods (Conversational, Popcorn, Initiative) and says "pick what fits the scene." That's... fine, but which one is default? If I'm at a new table, which do I expect? The four combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) are well-defined, which is good, but when to use which feels like it requires social calibration I find exhausting.

The example character Rella helps a LOT. Concrete choices, specific skills, actual numbers. I wish there were more fully worked examples like this throughout the book. Every time the book shows me a complete picture instead of abstract principles, I understand better.

One thing that genuinely delights me: the Attribute + Skill flexibility. The same Skill can pair with different Attributes depending on approach. Stealth with AGI for quiet movement, Stealth with RSN for route planning. That's a pattern I can explore and optimize. Multiple paths to the same goal - puzzle-solving material.

My big concern as a non-GM player is that so much seems to hinge on having a really good GM who interprets things the same way I do. The system gives GMs enormous latitude. That's scary for me because I can't predict how things will resolve. The book tries to address this with "GM Guidance" boxes, but those are for GMs to read, not for players to use in negotiating.

I'd play this system. I'd want to make reference sheets first though - my own decision trees pulled from the text. The underlying patterns are solid even when the book presents them abstractly.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation / Proficiencies",
      issue: "Unclear decision logic for when Proficiencies provide Edge, lower DC, or skip rolls entirely",
      impact: "High for pattern-seeking players - creates anxiety about unpredictable outcomes and reliance on GM interpretation",
      location: "Chapter 6, Step Five: Choose Proficiencies and Chapter 8, Edge/Burden interaction"
    },
    {
      section: "Chapter 4 - Core Principles of Play",
      issue: "Duplicate '**Example**' labels appear in example boxes (shows 'Example Example' pattern)",
      impact: "Low - cosmetic but creates visual noise that pattern-focused readers notice and find distracting",
      location: "Chapter 4, example boxes at lines 22-23, 64-65, 94-95"
    },
    {
      section: "Chapter 1 - Welcome to the Game",
      issue: "Missing space before 'Game Master' creates malformed bold markdown: 'The**Game Master**'",
      impact: "Low - formatting artifact that disrupts reading flow",
      location: "Chapter 1, paragraph 3"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Typo: 'Manege position' should be 'Manage position'",
      impact: "Low - clear typo that causes momentary confusion",
      location: "Chapter 10, Positioning and Environment section, line 181"
    },
    {
      section: "Chapter 10 - Combat Basics / Turn Order",
      issue: "Three turn order methods offered (Conversational, Popcorn, Initiative) without a clear default recommendation",
      impact: "Medium - players who prefer predictability need to know what to expect at unfamiliar tables",
      location: "Chapter 10, Turns and Order section"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Skill bonus mechanics not fully specified - book mentions Skills add to checks but exact numerical bonus unclear",
      impact: "Medium - pattern-seeking players want concrete numbers to calculate expected outcomes",
      location: "Chapter 8, Rolling 4d6 and Calculating Margin - mentions 'bonuses from Skills' without specifying values"
    },
    {
      section: "Throughout - Reference Architecture",
      issue: "Key decision patterns are distributed across chapters rather than consolidated in reference tables",
      impact: "Medium - requires cross-referencing multiple chapters to understand complete resolution flow",
      location: "Resolution logic split between Chapters 6, 7, 8, 9, and 10"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook contains solid underlying patterns that reward careful study. The core resolution engine (4d6 + Attribute + Skill vs DC with Edge/Burden modifiers) is mathematically predictable and learnable. The Tags/Conditions/Clocks system provides excellent visual structure for tracking game state. Character creation follows a clear 9-step sequence.

However, the "fiction-first" philosophy creates friction for players who need predictability. Too much is left to "GM judgment" without explicit decision frameworks. Proficiencies in particular feel inconsistently defined - sometimes they grant Edge, sometimes lower DC, sometimes bypass rolls. A player cannot reliably predict which will happen.

For Casey's profile - Pattern-Driven, Wary of Abstraction, Early Intermediate experience - this book is a mixed experience:

STRENGTHS for this persona:
- Clear DC ladder (12/14/16/18/20/22)
- Consistent outcome tiers based on margin
- Well-categorized Tags and Conditions
- Clocks as visual progress trackers
- Numbered character creation steps
- Attribute + Skill flexibility creates optimization puzzles

CHALLENGES for this persona:
- Heavy reliance on GM interpretation
- Multiple equally-valid options without defaults (turn order methods, Proficiency effects)
- Abstract principles require translation into personal reference sheets
- Cross-chapter reading required to build complete mental model

The book would significantly benefit from consolidated reference tables, explicit decision flowcharts for common situations, and clearer defaults with "advanced options" presented separately. The content is all there - it just needs restructuring for pattern-focused accessibility.

Rating Summary:
- Clarity & Readability: 7/10 - Well-written prose but requires significant cross-referencing
- Rules Accuracy: 8/10 - Internally consistent with minor ambiguities around Proficiency effects
- Persona Fit: 7/10 - Contains good patterns but presentation assumes comfort with abstraction
- Practical Usability: 6/10 - Requires player-created reference materials for table use`
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
    JSON.stringify(['core-casey-neurodivergent']),
    'in_progress',
    null
  );
  console.log('Created campaign record');
}

// Create the persona review
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251121-202921-q96njych',
  personaId: 'core-casey-neurodivergent',
  reviewData,
  agentExecutionTime: Date.now()
});

console.log(`Created persona review with ID: ${reviewId}`);

// Write the markdown file
const markdownPath = join(projectRoot, 'data/reviews/raw/campaign-20251121-202921-q96njych/core-casey-neurodivergent.md');
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251121-202921-q96njych',
    personaName: 'Casey the Neurodivergent Player',
    personaArchetype: 'Puzzle Solver',
    personaExperience: 'Early Intermediate (1-3 years)',
    personaTraits: ['Curious', 'Pattern-Driven', 'Wary of Abstraction', 'Non-GM'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  markdownPath
);

console.log(`Wrote review markdown to: ${markdownPath}`);

// Close database
db.close();

console.log('Review saved successfully');
